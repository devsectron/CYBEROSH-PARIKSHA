import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import {
  computeScore,
  computePercentile,
  computeRank,
  nextStreak,
  ScoringQuestion,
  ScoringAnswer
} from '../lib/scoring.js';
import { hasActiveEntitlement, isAdminRole } from '../lib/entitlements.js';
import { newId } from '../lib/util.js';
import { parseOrReject } from '../lib/validate.js';

/**
 * Two routers on purpose. They used to be one router mounted at both /api/v1/tests and /api/v1,
 * and its GET /:id catch-all then answered every single-segment /api/v1/* request (/plans,
 * /materials, /daily-quiz ...) with "Test not found" before those routers were reached.
 *
 *   testsRouter    -> /api/v1/tests      catalogue + test detail
 *   attemptsRouter -> /api/v1/attempts   start / autosave / submit / result / history
 *                     (also mounted at /api/v1/tests/attempts for backwards compatibility)
 */
export const testsRouter = Router();
export const attemptsRouter = Router();

const START_GRACE_MS = 15_000; // network grace added on top of the test duration
const SAVE_GRACE_MS = 10_000; // extra leeway for an in-flight autosave at the deadline

const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(',');

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

// GET /api/v1/tests - List published mock tests
testsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { exam_id, category_id, free_only, search } = req.query;

    let query = `
      SELECT t.*, e.name as exam_name, e.slug as exam_slug, c.name as category_name,
             (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id AND a.status = 'submitted') as total_attempts
      FROM mock_tests t
      JOIN examinations e ON t.exam_id = e.id
      JOIN exam_categories c ON e.category_id = c.id
      WHERE t.is_published = 1
    `;
    const params: any[] = [];

    if (typeof exam_id === 'string' && exam_id) {
      query += ` AND t.exam_id = ?`;
      params.push(exam_id);
    }
    if (typeof category_id === 'string' && category_id) {
      query += ` AND e.category_id = ?`;
      params.push(category_id);
    }
    if (free_only === '1' || free_only === 'true') {
      query += ` AND t.is_free = 1`;
    }
    if (search && typeof search === 'string') {
      query += ` AND (t.title LIKE ? OR e.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ` ORDER BY t.is_free DESC, t.created_at DESC`;

    res.json({ success: true, tests: db.prepare(query).all(...params) });
  } catch (err) {
    console.error('Error listing tests:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch mock tests.' });
  }
});

// GET /api/v1/tests/:id - Test detail & instructions
testsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const test = db
      .prepare(
        `SELECT t.*, e.name as exam_name, e.slug as exam_slug, e.conducting_body
           FROM mock_tests t
           JOIN examinations e ON t.exam_id = e.id
          WHERE t.id = ? AND t.is_published = 1`
      )
      .get(req.params.id) as any;

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found or unavailable.' });
      return;
    }

    const sections = db
      .prepare(
        `SELECT id, name, section_order, duration_minutes, total_questions, max_marks
           FROM test_sections WHERE test_id = ? ORDER BY section_order ASC`
      )
      .all(test.id);

    res.json({ success: true, test, sections });
  } catch (err) {
    console.error('Error fetching test detail:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch test details.' });
  }
});

// ---------------------------------------------------------------------------
// Attempt helpers
// ---------------------------------------------------------------------------

function toResult(attempt: any) {
  return {
    attempt_id: attempt.id,
    total_score: attempt.total_score,
    max_marks: attempt.max_marks,
    accuracy: attempt.accuracy,
    correct_count: attempt.correct_count,
    incorrect_count: attempt.incorrect_count,
    unattempted_count: attempt.unattempted_count,
    percentile: attempt.percentile,
    rank: attempt.rank,
    time_taken_seconds: attempt.time_taken_seconds
  };
}

function getOwnedAttempt(attemptId: string, userId: string): any | undefined {
  const attempt = db.prepare('SELECT * FROM test_attempts WHERE id = ?').get(attemptId) as any;
  return attempt && attempt.user_id === userId ? attempt : undefined;
}

/**
 * Grades an in-progress attempt on the server and stores the result. Used both for a manual
 * submit and for an automatic submit when the server deadline has passed. The final UPDATE is
 * guarded on status so concurrent calls cannot double-count (the first one wins).
 */
function finalizeAttempt(attempt: any, endedAtMs: number): boolean {
  const questions = db
    .prepare(
      `SELECT tq.question_id, tq.marks, tq.negative_marks, q.correct_answer, q.question_type
         FROM test_questions tq
         JOIN questions q ON tq.question_id = q.id
        WHERE tq.test_id = ?`
    )
    .all(attempt.test_id) as ScoringQuestion[];

  const answers = db
    .prepare('SELECT id, question_id, selected_option, numerical_answer FROM student_answers WHERE attempt_id = ?')
    .all(attempt.id) as (ScoringAnswer & { id: string })[];

  const summary = computeScore(questions, answers);

  const peerScores = (
    db
      .prepare("SELECT total_score FROM test_attempts WHERE test_id = ? AND status = 'submitted' AND id != ?")
      .all(attempt.test_id, attempt.id) as { total_score: number }[]
  ).map(p => p.total_score);

  const percentile = computePercentile(summary.total_score, peerScores);
  const rank = computeRank(summary.total_score, peerScores);

  // Server-measured duration (the per-question timers are client-reported and only informational).
  const startedMs = new Date(attempt.started_at).getTime();
  const timeTakenSeconds = Math.max(0, Math.round((endedAtMs - startedMs) / 1000));
  const endedIso = new Date(endedAtMs).toISOString();

  const answerIdByQuestion = new Map(answers.map(a => [a.question_id, a.id]));

  return db.transaction((): boolean => {
    const claimed = db
      .prepare(
        `UPDATE test_attempts
            SET submitted_at = ?, time_taken_seconds = ?, status = 'submitted',
                total_score = ?, max_marks = ?, accuracy = ?,
                correct_count = ?, incorrect_count = ?, unattempted_count = ?,
                percentile = ?, rank = ?
          WHERE id = ? AND status IN ('in_progress', 'expired')`
      )
      .run(
        endedIso,
        timeTakenSeconds,
        summary.total_score,
        summary.max_marks,
        summary.accuracy,
        summary.correct_count,
        summary.incorrect_count,
        summary.unattempted_count,
        percentile,
        rank,
        attempt.id
      );
    if (claimed.changes === 0) return false;

    const markAnswer = db.prepare('UPDATE student_answers SET is_correct = ?, marks_awarded = ? WHERE id = ?');
    for (const outcome of summary.outcomes) {
      const answerId = answerIdByQuestion.get(outcome.question_id);
      if (answerId) markAnswer.run(outcome.verdict === 'correct' ? 1 : 0, outcome.marks_awarded, answerId);
    }

    const profile = db
      .prepare('SELECT streak_days, last_active_date FROM student_profiles WHERE user_id = ?')
      .get(attempt.user_id) as { streak_days: number; last_active_date: string | null } | undefined;
    if (profile) {
      db.prepare('UPDATE student_profiles SET streak_days = ?, last_active_date = ? WHERE user_id = ?').run(
        nextStreak(profile.streak_days, profile.last_active_date, endedAtMs),
        endedIso,
        attempt.user_id
      );
    }
    return true;
  })();
}

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

const startSchema = z.object({
  test_id: z.string({ error: 'test_id is required.' }).trim().min(1, 'test_id is required.').max(200)
});

const answerSchema = z.object({
  question_id: z.string({ error: 'question_id is required.' }).trim().min(1, 'question_id is required.').max(200),
  selected_option: z.string().trim().max(40, 'Invalid option.').optional().nullable(),
  numerical_answer: z.union([z.string().trim().max(40), z.number()]).optional().nullable(),
  status: z.enum(['not_visited', 'not_answered', 'answered', 'marked_for_review', 'answered_and_marked']).optional(),
  time_spent_seconds: z.coerce.number().int().min(0).max(86_400).optional().nullable()
});

// GET /api/v1/attempts/my-history - Student past test attempts
attemptsRouter.get('/my-history', authenticate, (req: Request, res: Response) => {
  try {
    const history = db
      .prepare(
        `SELECT a.id, a.test_id, a.started_at, a.submitted_at, a.time_taken_seconds, a.status,
                a.total_score, a.max_marks, a.accuracy, a.percentile, a.rank,
                t.title as test_title, t.total_questions, e.name as exam_name
           FROM test_attempts a
           JOIN mock_tests t ON a.test_id = t.id
           JOIN examinations e ON t.exam_id = e.id
          WHERE a.user_id = ?
          ORDER BY a.started_at DESC`
      )
      .all(req.user!.id);

    res.json({ success: true, history });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch test attempt history.' });
  }
});

// POST /api/v1/attempts/start - Start or resume a test (server authoritative)
attemptsRouter.post('/start', authenticate, (req: Request, res: Response) => {
  try {
    const body = parseOrReject(startSchema, req.body, res);
    if (!body) return;
    const userId = req.user!.id;

    const test = db.prepare('SELECT * FROM mock_tests WHERE id = ? AND is_published = 1').get(body.test_id) as any;
    if (!test) {
      res.status(404).json({ success: false, message: 'Mock test not found.' });
      return;
    }

    // Premium gate
    if (!test.is_free && !isAdminRole(req.user!.role) && !hasActiveEntitlement(userId, test.exam_id)) {
      res.status(403).json({
        success: false,
        entitlement_required: true,
        message: 'This is a premium mock test. Please upgrade to a preparation pass to attempt.'
      });
      return;
    }

    const nowMs = Date.now();

    let attempt = db
      .prepare(
        `SELECT * FROM test_attempts
          WHERE user_id = ? AND test_id = ? AND status = 'in_progress'
          ORDER BY started_at DESC LIMIT 1`
      )
      .get(userId, test.id) as any;

    // An in-progress attempt whose deadline has passed is graded and closed automatically,
    // so a student who walks away still gets a result instead of a dangling attempt.
    if (attempt) {
      const deadlineMs = new Date(attempt.server_deadline).getTime();
      if (nowMs >= deadlineMs) {
        finalizeAttempt(attempt, deadlineMs);
        attempt = undefined;
      }
    }

    if (!attempt) {
      // Optional availability window for scheduled tests (applies to new attempts only, never to a resume).
      if (test.start_date && nowMs < new Date(test.start_date).getTime()) {
        res.status(403).json({ success: false, message: 'This test has not opened yet.' });
        return;
      }
      if (test.end_date && nowMs > new Date(test.end_date).getTime()) {
        res.status(403).json({ success: false, message: 'This test is closed.' });
        return;
      }

      const attemptId = newId('att');
      const startedAt = new Date(nowMs).toISOString();
      const deadline = new Date(nowMs + test.duration_minutes * 60 * 1000 + START_GRACE_MS).toISOString();
      const rulesSnapshot = JSON.stringify({
        duration_minutes: test.duration_minutes,
        total_marks: test.total_marks,
        negative_marking: test.negative_marking,
        title: test.title
      });

      db.prepare(
        `INSERT INTO test_attempts (id, user_id, test_id, started_at, server_deadline, status, rules_snapshot_json)
         VALUES (?, ?, ?, ?, ?, 'in_progress', ?)`
      ).run(attemptId, userId, test.id, startedAt, deadline, rulesSnapshot);

      attempt = db.prepare('SELECT * FROM test_attempts WHERE id = ?').get(attemptId);
    }

    const sections = db
      .prepare(
        `SELECT id, name, section_order, duration_minutes, total_questions, max_marks
           FROM test_sections WHERE test_id = ? ORDER BY section_order ASC`
      )
      .all(test.id);

    // Questions WITHOUT correct answers or solutions
    const questionsRaw = db
      .prepare(
        `SELECT tq.question_order, tq.marks, tq.negative_marks, tq.section_id,
                q.id, q.question_type, q.difficulty, q.question_en, q.question_hi, q.image_url,
                s.name as subject_name
           FROM test_questions tq
           JOIN questions q ON tq.question_id = q.id
           LEFT JOIN subjects s ON q.subject_id = s.id
          WHERE tq.test_id = ?
          ORDER BY tq.question_order ASC`
      )
      .all(test.id) as any[];

    const optionsRaw = questionsRaw.length
      ? (db
          .prepare(
            `SELECT qo.id, qo.question_id, qo.option_key, qo.option_en, qo.option_hi
               FROM question_options qo
              WHERE qo.question_id IN (${placeholders(questionsRaw.length)})
              ORDER BY qo.option_key ASC`
          )
          .all(...questionsRaw.map(q => q.id)) as any[])
      : [];

    const optionsByQuestion: Record<string, any[]> = {};
    for (const opt of optionsRaw) {
      (optionsByQuestion[opt.question_id] ||= []).push(opt);
    }

    const questions = questionsRaw.map(q => ({ ...q, options: optionsByQuestion[q.id] || [] }));

    // Previously saved answers (refresh / reconnect recovery)
    const savedAnswers = db
      .prepare(
        `SELECT question_id, selected_option, numerical_answer, status, time_spent_seconds
           FROM student_answers WHERE attempt_id = ?`
      )
      .all(attempt.id);

    res.json({
      success: true,
      attempt_id: attempt.id,
      started_at: attempt.started_at,
      server_deadline: attempt.server_deadline,
      remaining_seconds: Math.max(0, Math.floor((new Date(attempt.server_deadline).getTime() - Date.now()) / 1000)),
      test: {
        id: test.id,
        title: test.title,
        duration_minutes: test.duration_minutes,
        total_questions: test.total_questions,
        total_marks: test.total_marks,
        negative_marking: test.negative_marking
      },
      sections,
      questions,
      saved_answers: savedAnswers
    });
  } catch (err) {
    console.error('Error starting test attempt:', err);
    res.status(500).json({ success: false, message: 'Server error starting mock examination.' });
  }
});

// POST /api/v1/attempts/:id/answers - Autosave an answer or review status
attemptsRouter.post('/:id/answers', authenticate, (req: Request, res: Response) => {
  try {
    const body = parseOrReject(answerSchema, req.body, res);
    if (!body) return;

    const attempt = getOwnedAttempt(req.params.id, req.user!.id);
    if (!attempt) {
      res.status(403).json({ success: false, message: 'Attempt not found or access denied.' });
      return;
    }

    if (attempt.status !== 'in_progress') {
      res.status(400).json({ success: false, message: 'This attempt has already been submitted or expired.' });
      return;
    }

    // Past the deadline (plus a small grace for in-flight saves): close the attempt and grade what was saved.
    const deadlineMs = new Date(attempt.server_deadline).getTime();
    if (Date.now() > deadlineMs + SAVE_GRACE_MS) {
      finalizeAttempt(attempt, deadlineMs);
      res.status(400).json({
        success: false,
        time_expired: true,
        message: 'Time limit exceeded. Your attempt was submitted automatically.'
      });
      return;
    }

    // The question must belong to this attempt's test.
    const inTest = db
      .prepare('SELECT 1 FROM test_questions WHERE test_id = ? AND question_id = ?')
      .get(attempt.test_id, body.question_id);
    if (!inTest) {
      res.status(400).json({ success: false, message: 'This question does not belong to the attempt.' });
      return;
    }

    const selected = body.selected_option ? body.selected_option : null;
    const numerical =
      body.numerical_answer === null || body.numerical_answer === undefined || body.numerical_answer === ''
        ? null
        : String(body.numerical_answer);
    const status = body.status || (selected || numerical ? 'answered' : 'not_answered');
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO student_answers (id, attempt_id, question_id, selected_option, numerical_answer, status, time_spent_seconds, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         selected_option = excluded.selected_option,
         numerical_answer = excluded.numerical_answer,
         status = excluded.status,
         time_spent_seconds = excluded.time_spent_seconds,
         saved_at = excluded.saved_at`
    ).run(`ans_${attempt.id}_${body.question_id}`, attempt.id, body.question_id, selected, numerical, status, body.time_spent_seconds ?? 0, now);

    res.json({ success: true, saved_at: now });
  } catch (err) {
    console.error('Error saving answer:', err);
    res.status(500).json({ success: false, message: 'Failed to persist student response.' });
  }
});

// POST /api/v1/attempts/:id/submit - Evaluate on the server and store the result
attemptsRouter.post('/:id/submit', authenticate, (req: Request, res: Response) => {
  try {
    const attempt = getOwnedAttempt(req.params.id, req.user!.id);
    if (!attempt) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Idempotent: submitting twice returns the stored result.
    if (attempt.status === 'submitted') {
      res.json({ success: true, message: 'Test already submitted.', result: toResult(attempt) });
      return;
    }

    // A late submit is graded as of the deadline.
    const endedAtMs = Math.min(Date.now(), new Date(attempt.server_deadline).getTime());
    finalizeAttempt(attempt, endedAtMs);

    const fresh = db.prepare('SELECT * FROM test_attempts WHERE id = ?').get(attempt.id);
    res.json({
      success: true,
      message: 'Examination submitted and evaluated successfully!',
      result: toResult(fresh)
    });
  } catch (err) {
    console.error('Error submitting test:', err);
    res.status(500).json({ success: false, message: 'Server error evaluating examination.' });
  }
});

// GET /api/v1/attempts/:id/result - Detailed solution & answer review
attemptsRouter.get('/:id/result', authenticate, (req: Request, res: Response) => {
  try {
    const attempt = db
      .prepare(
        `SELECT a.*, t.title as test_title, t.duration_minutes, t.total_questions, t.review_available, e.name as exam_name
           FROM test_attempts a
           JOIN mock_tests t ON a.test_id = t.id
           JOIN examinations e ON t.exam_id = e.id
          WHERE a.id = ?`
      )
      .get(req.params.id) as any;

    if (!attempt || attempt.user_id !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    if (attempt.status !== 'submitted') {
      res.status(400).json({ success: false, message: 'Test has not been submitted yet.' });
      return;
    }

    const reviewQuestions = db
      .prepare(
        `SELECT tq.question_order, tq.marks, tq.negative_marks,
                q.id, q.question_type, q.difficulty, q.question_en, q.question_hi, q.image_url,
                q.correct_answer, q.solution_en, q.solution_hi,
                s.name as subject_name,
                sa.selected_option, sa.numerical_answer, sa.status as answer_status, sa.time_spent_seconds, sa.is_correct, sa.marks_awarded
           FROM test_questions tq
           JOIN questions q ON tq.question_id = q.id
           LEFT JOIN subjects s ON q.subject_id = s.id
           LEFT JOIN student_answers sa ON sa.attempt_id = ? AND sa.question_id = q.id
          WHERE tq.test_id = ?
          ORDER BY tq.question_order ASC`
      )
      .all(attempt.id, attempt.test_id) as any[];

    // Subject-wise breakdown (always provided)
    const subjectMap: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; marks: number }> = {};
    for (const q of reviewQuestions) {
      const subject = q.subject_name || 'General';
      const stats = (subjectMap[subject] ||= { total: 0, correct: 0, incorrect: 0, unattempted: 0, marks: 0 });
      stats.total++;
      const answered = Boolean(q.selected_option) || (q.numerical_answer !== null && q.numerical_answer !== undefined && q.numerical_answer !== '');
      if (q.is_correct === 1) {
        stats.correct++;
        stats.marks += q.marks;
      } else if (answered) {
        stats.incorrect++;
        stats.marks -= q.negative_marks;
      } else {
        stats.unattempted++;
      }
    }

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      total_questions: stats.total,
      correct: stats.correct,
      incorrect: stats.incorrect,
      unattempted: stats.unattempted,
      score: Number(stats.marks.toFixed(1)),
      accuracy:
        stats.correct + stats.incorrect > 0
          ? Number(((stats.correct / (stats.correct + stats.incorrect)) * 100).toFixed(1))
          : 0
    }));

    // Tests configured without answer review expose scores only, never keys or solutions.
    if (attempt.review_available === 0) {
      res.json({ success: true, attempt, subject_breakdown: subjectBreakdown, questions: [], review_available: false });
      return;
    }

    const optionsRaw = reviewQuestions.length
      ? (db
          .prepare(
            `SELECT qo.id, qo.question_id, qo.option_key, qo.option_en, qo.option_hi, qo.is_correct
               FROM question_options qo
              WHERE qo.question_id IN (${placeholders(reviewQuestions.length)})
              ORDER BY qo.option_key ASC`
          )
          .all(...reviewQuestions.map(q => q.id)) as any[])
      : [];

    const optionsByQuestion: Record<string, any[]> = {};
    for (const opt of optionsRaw) {
      (optionsByQuestion[opt.question_id] ||= []).push(opt);
    }

    const questions = reviewQuestions.map(q => ({ ...q, options: optionsByQuestion[q.id] || [] }));

    res.json({ success: true, attempt, subject_breakdown: subjectBreakdown, questions, review_available: true });
  } catch (err) {
    console.error('Error fetching test result:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve test result.' });
  }
});
