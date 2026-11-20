// Integration tests: real Express app, real routes, throwaway in-memory SQLite database.
// Run with: npm test   (or: tsx tests/api.test.ts)

// Environment must be set BEFORE the app is imported (config/db read it at import time).
process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_that_is_definitely_long_enough_1234567890';
process.env.RAZORPAY_KEY_ID = 'rzp_test_CyberoshDemoKey2026'; // demo keys => sandbox payment mode
process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_cyberoshDemoSecret2026';
process.env.FIREBASE_PROJECT_ID = 'cyberosh-test-project';

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function main() {
  const { app } = await import('../server.js');
  const { db } = await import('../server/db.js');

  const server = app.listen(0);
  const port = (server.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}/api/v1`;

  async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {})
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* non-JSON body */
    }
    return { status: res.status, json };
  }

  console.log('====================================================');
  console.log(' CYBEROSH PARIKSHA – API INTEGRATION TESTS');
  console.log('====================================================\n');

  // -------------------------------------------------------------------------
  console.log('1. ROUTING (regression: /tests/:id used to shadow every /api/v1/* route)');
  const plans = await call('GET', '/plans');
  assert(plans.status === 200 && Array.isArray(plans.json?.plans) && plans.json.plans.length > 0, 'GET /plans returns plans');
  const materials = await call('GET', '/materials');
  assert(materials.status === 200 && Array.isArray(materials.json?.materials), 'GET /materials returns materials');
  const unknown = await call('GET', '/definitely-not-a-route/x/y');
  assert(unknown.status === 404 && unknown.json?.success === false, 'Unknown API route answers JSON 404');

  // -------------------------------------------------------------------------
  console.log('\n2. AUTHENTICATION');
  const stamp = Date.now();
  const email = `tester_${stamp}@example.com`;
  const weak = await call('POST', '/auth/register', { body: { email, password: 'short', full_name: 'Test User' } });
  assert(weak.status === 400, 'Registration rejects passwords shorter than 8 characters');
  const badEmail = await call('POST', '/auth/register', { body: { email: 'nope', password: 'LongEnough1', full_name: 'Test User' } });
  assert(badEmail.status === 400, 'Registration rejects an invalid email');

  const reg = await call('POST', '/auth/register', { body: { email, password: 'LongEnough1', full_name: 'Test User' } });
  assert(reg.status === 201 && typeof reg.json?.token === 'string', 'Registration succeeds and returns a token');
  const dup = await call('POST', '/auth/register', { body: { email: email.toUpperCase(), password: 'LongEnough1', full_name: 'Test User' } });
  assert(dup.status === 409, 'Duplicate email (case-insensitive) is rejected');

  const wrongPw = await call('POST', '/auth/login', { body: { email, password: 'WrongPassword1' } });
  assert(wrongPw.status === 401, 'Login with a wrong password is rejected');
  const noUser = await call('POST', '/auth/login', { body: { email: 'ghost@example.com', password: 'whatever12' } });
  assert(noUser.status === 401 && noUser.json?.message === wrongPw.json?.message, 'Unknown user and wrong password give the same message');

  const login = await call('POST', '/auth/login', { body: { email, password: 'LongEnough1' } });
  const token: string = login.json?.token;
  assert(login.status === 200 && Boolean(token), 'Login succeeds');
  assert(login.json?.user && !('password_hash' in login.json.user), 'Login response never includes the password hash');

  const me = await call('GET', '/auth/me', { token });
  assert(me.status === 200 && me.json?.user?.email === email, 'GET /auth/me returns the signed-in user');
  const anon = await call('GET', '/auth/me');
  assert(anon.status === 401, 'GET /auth/me without a token is 401');
  const forged = await call('GET', '/auth/me', { token: token.slice(0, -3) + 'abc' });
  assert(forged.status === 401, 'A token with a tampered signature is rejected');

  const changeWrong = await call('POST', '/auth/change-password', { token, body: { current_password: 'nope12345', new_password: 'NewPassw0rd!' } });
  assert(changeWrong.status === 400, 'Change password needs the correct current password');
  const changeOk = await call('POST', '/auth/change-password', { token, body: { current_password: 'LongEnough1', new_password: 'NewPassw0rd!' } });
  assert(changeOk.status === 200, 'Change password succeeds');
  const reLogin = await call('POST', '/auth/login', { body: { email, password: 'NewPassw0rd!' } });
  assert(reLogin.status === 200, 'Login works with the new password');

  // -------------------------------------------------------------------------
  console.log('\n3. AUTHORISATION');
  const studentAdmin = await call('GET', '/admin/analytics', { token });
  assert(studentAdmin.status === 403, 'A student cannot reach admin analytics');
  const anonAdmin = await call('GET', '/admin/payments');
  assert(anonAdmin.status === 401, 'Admin endpoints require a token');
  const adminLogin = await call('POST', '/auth/login', { body: { email: 'admin@cyberoshpariksha.in', password: 'Admin@123' } });
  const adminToken: string = adminLogin.json?.token;
  const adminOk = await call('GET', '/admin/analytics', { token: adminToken });
  assert(adminOk.status === 200 && adminOk.json?.stats, 'An admin can reach analytics');
  const adminPayments = await call('GET', '/admin/payments', { token: adminToken });
  assert(
    adminPayments.status === 200 && (adminPayments.json?.payments || []).every((p: any) => !('signature' in p)),
    'Admin payments list never exposes gateway signatures'
  );

  // -------------------------------------------------------------------------
  console.log('\n4. PAYMENTS');
  const plan = (plans.json.plans as any[]).find(p => p.price_inr > 0) || plans.json.plans[0];
  const coupon = await call('POST', '/coupons/validate', { body: { code: 'bihar50', plan_id: plan.id } });
  assert(coupon.status === 200 && coupon.json.coupon.final_amount < plan.price_inr, 'Coupon is case-insensitive and discounts the real plan price');
  const badCoupon = await call('POST', '/coupons/validate', { body: { code: 'NOPE', amount: 100 } });
  assert(badCoupon.status === 404, 'Unknown coupon is rejected');

  const unauthOrder = await call('POST', '/create-order', { body: { plan_id: plan.id } });
  assert(unauthOrder.status === 401, 'Creating an order requires sign-in');
  const badCouponOrder = await call('POST', '/create-order', { token, body: { plan_id: plan.id, coupon_code: 'NOPE' } });
  assert(badCouponOrder.status === 400, 'An order with an invalid coupon is rejected instead of silently ignoring it');

  const order = await call('POST', '/create-order', { token, body: { plan_id: plan.id } });
  assert(order.status === 200 && order.json?.order?.order_id, 'Order is created');
  const orderId: string = order.json.order.order_id;
  assert(order.json.order.amount_inr === plan.price_inr, 'Order amount comes from the database price');

  const noSig = await call('POST', '/verify', { token, body: { order_id: orderId, payment_id: 'pay_abc12345' } });
  assert(noSig.status === 400, 'Verification without a signature is rejected (used to grant a free pass)');
  const shortSig = await call('POST', '/verify', { token, body: { order_id: orderId, payment_id: 'pay_abc12345', signature: 'aaaaaaaaaaaa' } });
  assert(shortSig.status === 400, 'Any 10+ character signature is no longer accepted');

  const entCountBefore = (db.prepare('SELECT COUNT(*) as c FROM entitlements WHERE user_id = ?').get(me.json.user.id) as any).c;
  const goodSig = await call('POST', '/verify', {
    token,
    body: { order_id: orderId, payment_id: 'pay_abc12345', signature: `sig_test_${Date.now()}_verified` }
  });
  assert(goodSig.status === 200 && goodSig.json?.success, 'Sandbox checkout token activates the pass (development only)');
  const again = await call('POST', '/verify', {
    token,
    body: { order_id: orderId, payment_id: 'pay_abc12345', signature: `sig_test_${Date.now()}_verified` }
  });
  const entCountAfter = (db.prepare('SELECT COUNT(*) as c FROM entitlements WHERE user_id = ?').get(me.json.user.id) as any).c;
  assert(again.status === 200 && again.json?.already_verified === true, 'Re-verifying a settled order is idempotent');
  assert(entCountAfter === entCountBefore + 1, 'Re-verifying does not mint a second entitlement');

  // -------------------------------------------------------------------------
  console.log('\n5. PREMIUM CONTENT');
  const premium = db.prepare("SELECT id, exam_id, file_url FROM study_materials WHERE access_level = 'premium' LIMIT 1").get() as any;
  if (premium) {
    const listed = await call('GET', '/materials?access_level=premium');
    const row = (listed.json.materials as any[]).find(m => m.id === premium.id);
    assert(row && row.file_url === null && row.locked === true, 'Anonymous users do not receive premium file URLs');
    const dl = await call('GET', `/materials/${premium.id}/download`);
    assert(dl.status === 401, 'Anonymous premium download is refused');

    const fresh = await call('POST', '/auth/register', {
      body: { email: `free_${stamp}@example.com`, password: 'LongEnough1', full_name: 'Free User' }
    });
    const dl2 = await call('GET', `/materials/${premium.id}/download`, { token: fresh.json.token });
    assert(dl2.status === 403, 'A student without a plan cannot download premium material');
  } else {
    console.log('  (skipped: no premium material in seed data)');
  }

  // -------------------------------------------------------------------------
  console.log('\n6. DAILY QUIZ');
  const quizA = await call('GET', '/daily-quiz');
  const quizB = await call('GET', '/daily-quiz');
  const idsA = (quizA.json?.quiz?.questions || []).map((q: any) => q.id).join(',');
  const idsB = (quizB.json?.quiz?.questions || []).map((q: any) => q.id).join(',');
  assert(quizA.status === 200 && idsA.length > 0 && idsA === idsB, 'Daily quiz is identical across requests on the same day');

  // -------------------------------------------------------------------------
  console.log('\n7. CBT ATTEMPT LIFECYCLE');
  const freeTest = db
    .prepare(
      `SELECT t.id FROM mock_tests t
        WHERE t.is_free = 1 AND t.is_published = 1
          AND (SELECT COUNT(*) FROM test_questions tq WHERE tq.test_id = t.id) > 1
        LIMIT 1`
    )
    .get() as { id: string } | undefined;

  if (!freeTest) {
    console.log('  (skipped: no free test with questions in seed data)');
  } else {
    const detail = await call('GET', `/tests/${freeTest.id}`);
    assert(detail.status === 200 && detail.json?.test?.id === freeTest.id, 'GET /tests/:id still returns the test');

    const start = await call('POST', '/attempts/start', { token, body: { test_id: freeTest.id } });
    assert(start.status === 200 && start.json?.attempt_id, 'Attempt starts');
    const attemptId: string = start.json.attempt_id;
    const questions: any[] = start.json.questions;
    assert(questions.length > 1 && questions.every(q => !('correct_answer' in q) && !('solution_en' in q)), 'Questions are served without answers or solutions');
    assert(questions.every(q => (q.options || []).every((o: any) => !('is_correct' in o))), 'Options are served without the is_correct flag');

    const resume = await call('POST', '/attempts/start', { token, body: { test_id: freeTest.id } });
    assert(resume.json?.attempt_id === attemptId, 'Starting again resumes the in-progress attempt');

    const other = await call('POST', '/auth/login', { body: { email: `free_${stamp}@example.com`, password: 'LongEnough1' } });
    const intruder = await call('POST', `/attempts/${attemptId}/answers`, {
      token: other.json?.token,
      body: { question_id: questions[0].id, selected_option: 'A' }
    });
    assert(intruder.status === 403, "Another student cannot write into someone else's attempt");

    const foreign = await call('POST', `/attempts/${attemptId}/answers`, {
      token,
      body: { question_id: 'q_does_not_exist', selected_option: 'A' }
    });
    assert(foreign.status === 400, 'A question that is not part of the test is rejected');

    // Answer question 1 correctly, question 2 incorrectly; leave the rest blank.
    const correctOf = (qid: string) => (db.prepare('SELECT correct_answer FROM questions WHERE id = ?').get(qid) as any).correct_answer as string;
    const marksOf = (qid: string) => db.prepare('SELECT marks, negative_marks FROM test_questions WHERE test_id = ? AND question_id = ?').get(freeTest.id, qid) as any;
    const q1 = questions[0];
    const q2 = questions[1];
    const wrongKey = (q2.options as any[]).map(o => o.option_key).find((k: string) => k !== correctOf(q2.id).toUpperCase()) || 'Z';

    const s1 = await call('POST', `/attempts/${attemptId}/answers`, {
      token,
      body: { question_id: q1.id, selected_option: correctOf(q1.id).toLowerCase(), status: 'answered', time_spent_seconds: 12 }
    });
    const s2 = await call('POST', `/attempts/${attemptId}/answers`, {
      token,
      body: { question_id: q2.id, selected_option: wrongKey, status: 'answered', time_spent_seconds: 7 }
    });
    assert(s1.status === 200 && s2.status === 200, 'Answers autosave');

    const badStatus = await call('POST', `/attempts/${attemptId}/answers`, {
      token,
      body: { question_id: q1.id, selected_option: 'A', status: 'hacked' }
    });
    assert(badStatus.status === 400, 'An invalid answer status is rejected');

    const submit = await call('POST', `/attempts/${attemptId}/submit`, { token });
    const m1 = marksOf(q1.id);
    const m2 = marksOf(q2.id);
    const expectedScore = Math.max(0, m1.marks - m2.negative_marks);
    assert(submit.status === 200 && submit.json?.result, 'Attempt is submitted');
    assert(submit.json.result.correct_count === 1 && submit.json.result.incorrect_count === 1, 'Server grades 1 correct and 1 incorrect');
    assert(Math.abs(submit.json.result.total_score - expectedScore) < 1e-9, `Score applies marks and negative marking (${expectedScore})`);
    assert(submit.json.result.unattempted_count === questions.length - 2, 'Remaining questions are counted as unattempted');

    const submitAgain = await call('POST', `/attempts/${attemptId}/submit`, { token });
    assert(submitAgain.status === 200 && submitAgain.json.result.total_score === submit.json.result.total_score, 'Submitting twice returns the same stored result');

    const lateSave = await call('POST', `/attempts/${attemptId}/answers`, { token, body: { question_id: q1.id, selected_option: 'A' } });
    assert(lateSave.status === 400, 'Answers cannot be changed after submission');

    const result = await call('GET', `/attempts/${attemptId}/result`, { token });
    assert(result.status === 200 && result.json.questions.length === questions.length, 'Result review returns every question');
    const stranger = await call('GET', `/attempts/${attemptId}/result`, { token: other.json?.token });
    assert(stranger.status === 403, "Another student cannot read someone else's result");

    const history = await call('GET', '/attempts/my-history', { token });
    assert(history.status === 200 && history.json.history.some((h: any) => h.id === attemptId), 'my-history lists the attempt');
    const legacyHistory = await call('GET', '/tests/attempts/my-history', { token });
    assert(legacyHistory.status === 200, 'Legacy /tests/attempts/* path still works');

    // Deadline enforcement: an attempt past its deadline is graded automatically, not left hanging.
    const start2 = await call('POST', '/attempts/start', { token, body: { test_id: freeTest.id } });
    const expiredId: string = start2.json.attempt_id;
    db.prepare('UPDATE test_attempts SET server_deadline = ? WHERE id = ?').run(new Date(Date.now() - 60_000).toISOString(), expiredId);
    const lateAnswer = await call('POST', `/attempts/${expiredId}/answers`, { token, body: { question_id: q1.id, selected_option: 'A' } });
    assert(lateAnswer.status === 400 && lateAnswer.json?.time_expired === true, 'An answer after the deadline is refused');
    const closed = db.prepare('SELECT status FROM test_attempts WHERE id = ?').get(expiredId) as any;
    assert(closed.status === 'submitted', 'The expired attempt was auto-submitted');
  }

  // -------------------------------------------------------------------------
  console.log('\n8. BSEB TESTS LIVE ON THE SERVER (they used to exist only in the browser bundle)');
  const bsebTests = db.prepare("SELECT id FROM mock_tests WHERE id LIKE 'test_bseb_12_cs_set_%' ORDER BY id").all() as { id: string }[];
  assert(bsebTests.length === 10, 'All 10 BSEB practice tests are in the server database');
  const emptyBseb = bsebTests.filter(t => (db.prepare('SELECT COUNT(*) as c FROM test_questions WHERE test_id = ?').get(t.id) as any).c !== 5);
  assert(emptyBseb.length === 0, 'Every BSEB set (including Sets 6-10) has its 5 questions');
  const bsebDetail = await call('GET', '/tests/test_bseb_12_cs_set_10');
  assert(bsebDetail.status === 200, 'GET /tests/test_bseb_12_cs_set_10 is served by the server');
  const catalogue = await call('GET', '/tests?exam_id=exam_bseb_12_cs');
  assert(catalogue.status === 200 && catalogue.json.tests.length === 10, 'The server catalogue lists the BSEB tests');

  // -------------------------------------------------------------------------
  console.log('\n9. GOOGLE / FIREBASE SIGN-IN IS VERIFIED BY THE SERVER');
  const { setFirebaseCertsForTests } = await import('../server/lib/firebaseAuth.js');
  const goodKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const otherKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  setFirebaseCertsForTests({ goodkid: goodKeys.publicKey.export({ type: 'spki', format: 'pem' }).toString() });

  const projectId = 'cyberosh-test-project';
  const signFirebase = (
    claims: Record<string, unknown> = {},
    opts: { key?: crypto.KeyObject; kid?: string; audience?: string; expiresIn?: number; sub?: string } = {}
  ) =>
    jwt.sign(
      { email: `google_${stamp}@example.com`, email_verified: true, name: 'Google Student', ...claims },
      (opts.key || goodKeys.privateKey) as any,
      {
        algorithm: 'RS256',
        keyid: opts.kid || 'goodkid',
        subject: opts.sub || `fbuid_${stamp}`,
        audience: opts.audience || projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
        expiresIn: opts.expiresIn ?? 3600
      }
    );

  const fbToken = signFirebase();
  const fbMe = await call('GET', '/auth/me', { token: fbToken });
  assert(fbMe.status === 200 && fbMe.json?.user?.email === `google_${stamp}@example.com`, 'A valid Firebase ID token is accepted and creates a student account');
  assert(fbMe.json?.user?.role === 'student', 'The new account is a plain student');

  // A brand-new Google user whose token claims to be an admin: the claim is ignored, the account is a student.
  const claimedAdmin = signFirebase({ role: 'admin', admin: true, email: `google_admin_${stamp}@example.com` }, { sub: `fbuid_admin_${stamp}` });
  const adminTry = await call('GET', '/admin/analytics', { token: claimedAdmin });
  assert(adminTry.status === 403, 'A role claim inside the token is ignored: still no admin access');
  const claimedMe = await call('GET', '/auth/me', { token: claimedAdmin });
  assert(claimedMe.status === 200 && claimedMe.json?.user?.role === 'student', 'The account created for that token is a plain student');

  // The Firebase uid is the stable key: the same uid with a different email still resolves to the same account.
  const renamed = await call('GET', '/auth/me', { token: signFirebase({ email: `renamed_${stamp}@example.com` }, {}) });
  assert(renamed.status === 200 && renamed.json?.user?.id === fbMe.json?.user?.id, 'The same Firebase uid keeps its account even if the email changes');

  assert((await call('GET', '/auth/me', { token: signFirebase({}, { audience: 'some-other-project' }) })).status === 401, 'A token issued for another Firebase project is rejected');
  assert((await call('GET', '/auth/me', { token: signFirebase({}, { expiresIn: -60 }) })).status === 401, 'An expired token is rejected');
  assert((await call('GET', '/auth/me', { token: signFirebase({ email_verified: false }) })).status === 401, 'An unverified email is rejected');
  assert((await call('GET', '/auth/me', { token: signFirebase({}, { key: otherKeys.privateKey }) })).status === 401, 'A token signed with a different key is rejected');
  assert((await call('GET', '/auth/me', { token: signFirebase({}, { kid: 'unknownkid' }) })).status === 401, 'A token with an unknown key id is rejected');

  const linked = await call('GET', '/auth/me', { token: signFirebase({ email: email }, {}) });
  assert(linked.status === 200 && linked.json?.user?.id === me.json.user.id, 'A Google sign-in with the email of an existing account maps to that same account');

  // Same server-side rules apply to Google users: premium tests need an entitlement, free ones do not.
  const premiumTest = db
    .prepare(
      `SELECT t.id FROM mock_tests t
        WHERE t.is_free = 0 AND t.is_published = 1
          AND (SELECT COUNT(*) FROM test_questions tq WHERE tq.test_id = t.id) > 0 LIMIT 1`
    )
    .get() as { id: string } | undefined;
  if (premiumTest) {
    const blocked = await call('POST', '/attempts/start', { token: fbToken, body: { test_id: premiumTest.id } });
    assert(blocked.status === 403 && blocked.json?.entitlement_required === true, 'A Google user without a plan is blocked from a premium test by the server');
  } else {
    console.log('  (skipped: no premium test with questions in seed data)');
  }

  // Full graded BSEB attempt as a Google user, all answers correct.
  const bsebStart = await call('POST', '/attempts/start', { token: fbToken, body: { test_id: 'test_bseb_12_cs_set_10' } });
  assert(bsebStart.status === 200 && bsebStart.json.questions.length === 5, 'A Google user can start a BSEB test on the server');
  assert(bsebStart.json.questions.every((q: any) => !('correct_answer' in q)), 'BSEB questions are served without answers');
  for (const q of bsebStart.json.questions as any[]) {
    const correct = (db.prepare('SELECT correct_answer FROM questions WHERE id = ?').get(q.id) as any).correct_answer;
    await call('POST', `/attempts/${bsebStart.json.attempt_id}/answers`, { token: fbToken, body: { question_id: q.id, selected_option: correct, status: 'answered' } });
  }
  const bsebSubmit = await call('POST', `/attempts/${bsebStart.json.attempt_id}/submit`, { token: fbToken });
  assert(bsebSubmit.json?.result?.total_score === 5 && bsebSubmit.json.result.correct_count === 5, 'The server scores a perfect BSEB attempt 5 out of 5');
  const bsebResult = await call('GET', `/attempts/${bsebStart.json.attempt_id}/result`, { token: fbToken });
  assert(
    bsebResult.status === 200 && bsebResult.json.subject_breakdown.some((b: any) => b.subject !== 'General'),
    'BSEB results carry a real subject-wise breakdown'
  );

  server.close();
  console.log('\n====================================================');
  console.log(` API TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('API test run crashed:', err);
  process.exit(1);
});
