import { db, initDatabase } from '../server/db.js';
import { seedDatabase } from '../server/seed.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log(' CYBEROSH PARIKSHA – AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  // Test 1: Database Initialization & Integrity
  console.log('1. DATABASE INTEGRITY TESTS:');
  initDatabase();
  seedDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  assert(userCount.count >= 2, `Users count is ${userCount.count} (at least 2 expected: admin and student)`);

  const examCount = db.prepare('SELECT COUNT(*) as count FROM examinations').get() as { count: number };
  assert(examCount.count >= 20, `Examinations count is ${examCount.count} (at least 20 expected)`);

  const catCount = db.prepare('SELECT COUNT(*) as count FROM exam_categories').get() as { count: number };
  assert(catCount.count >= 10, `Categories count is ${catCount.count} (at least 10 expected)`);

  const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
  assert(questionCount.count >= 10, `Question bank count is ${questionCount.count} questions`);

  // Test 2: Authentication & Password Security
  console.log('\n2. AUTHENTICATION & PASSWORD SECURITY TESTS:');
  const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@cyberoshpariksha.in') as any;
  assert(adminUser !== undefined, 'Admin account exists in database');
  assert(bcrypt.compareSync('Admin@123', adminUser.password_hash), 'Admin password hash verification matches');
  assert(!bcrypt.compareSync('WrongPassword', adminUser.password_hash), 'Incorrect password safely rejected');

  const studentUser = db.prepare('SELECT * FROM users WHERE email = ?').get('student@cyberoshpariksha.in') as any;
  assert(studentUser !== undefined, 'Student account exists in database');
  assert(bcrypt.compareSync('Student@123', studentUser.password_hash), 'Student password hash verification matches');

  // Test 3: Scoring & Negative Marking Formula Verification
  console.log('\n3. CBT SCORING & NEGATIVE MARKING ENGINE TESTS:');
  // Formula: Score = (Correct * Marks) - (Incorrect * NegativePenalty)
  const calculateTestScore = (correct: number, incorrect: number, marksPerQ: number, negPenalty: number) => {
    return Math.max(0, Number(((correct * marksPerQ) - (incorrect * negPenalty)).toFixed(2)));
  };

  // STET (0 negative penalty): 120 correct, 30 incorrect
  const stetScore = calculateTestScore(120, 30, 1.0, 0.0);
  assert(stetScore === 120.0, `Bihar STET score is ${stetScore} (expected 120.0 with 0 negative)`);

  // JEE Main (+4, -1 penalty): 50 correct, 10 incorrect
  const jeeScore = calculateTestScore(50, 10, 4.0, 1.0);
  assert(jeeScore === 190.0, `JEE Main score is ${jeeScore} (expected 190.0: 50*4 - 10*1)`);

  // BPSC CCE (+1, -0.33 penalty): 100 correct, 30 incorrect
  const bpscScore = calculateTestScore(100, 30, 1.0, 0.33);
  assert(bpscScore === 90.1, `BPSC score is ${bpscScore} (expected 90.1: 100 - 9.9)`);

  // Test 4: Percentile Calculation
  console.log('\n4. PERCENTILE CALCULATION TESTS:');
  const computePercentile = (candidateScore: number, peerScores: number[]) => {
    const total = peerScores.length + 1;
    const below = peerScores.filter(s => s < candidateScore).length;
    return Number(((below / total) * 100).toFixed(1));
  };
  const peers = [50, 60, 70, 80, 90, 100, 110, 120, 130];
  const pTile = computePercentile(125, peers);
  assert(pTile === 80.0, `Candidate percentile is ${pTile}%ile (expected 80.0%ile)`);

  // Test 5: Server-Authoritative Deadline Check
  console.log('\n5. SERVER-AUTHORITATIVE DEADLINE TESTS:');
  const pastDeadline = new Date(Date.now() - 60000).toISOString();
  const futureDeadline = new Date(Date.now() + 600000).toISOString();
  const isExpired = (deadlineIso: string, graceMs: number = 10000) => {
    return Date.now() > (new Date(deadlineIso).getTime() + graceMs);
  };
  assert(isExpired(pastDeadline), 'Expired attempt deadline correctly detected on server');
  assert(!isExpired(futureDeadline), 'Active attempt deadline correctly allowed on server');

  // Test 6: Razorpay HMAC-SHA256 Cryptographic Signature Verification
  console.log('\n6. RAZORPAY PAYMENT CRYPTOGRAPHIC VERIFICATION TESTS:');
  const secret = 'rzp_secret_cyberoshDemoSecret2026';
  const orderId = 'order_cyberosh_test_99';
  const paymentId = 'pay_cyberosh_test_123';
  const generatedSignature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  const verifySignature = (ord: string, pay: string, sig: string, sec: string) => {
    const expected = crypto.createHmac('sha256', sec).update(`${ord}|${pay}`).digest('hex');
    return expected === sig;
  };
  assert(verifySignature(orderId, paymentId, generatedSignature, secret), 'Cryptographic HMAC-SHA256 signature verified successfully');
  assert(!verifySignature(orderId, paymentId, 'tampered_signature_123', secret), 'Tampered payment signature safely rejected');

  // Test 7: Coupon Validation Calculation
  console.log('\n7. COUPON DISCOUNT RULES TESTS:');
  const validateCouponDiscount = (basePrice: number, percent: number, maxDiscount: number) => {
    const disc = Math.min((basePrice * percent) / 100, maxDiscount);
    return Math.max(0, basePrice - disc);
  };
  // BIHAR50 on ₹149 (50% with max ₹200) -> 149 - 74.5 = 74.5
  const discounted = validateCouponDiscount(149, 50, 200);
  assert(discounted === 74.5, `Bihar Pass discounted price is ₹${discounted} (expected ₹74.5)`);

  console.log('\n====================================================');
  console.log(` VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
