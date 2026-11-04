import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';

export const testsRouter = Router();

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

    if (exam_id) {
      query += ` AND t.exam_id = ?`;
      params.push(exam_id);
    }
    if (category_id) {
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

    const tests = db.prepare(query).all(...params);

    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch mock tests.' });
  }
});

// GET /api/v1/tests/:id - Test detail & instructions
testsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const test = db.prepare(`
      SELECT t.*, e.name as exam_name, e.slug as exam_slug, e.conducting_body
      FROM mock_tests t
      JOIN examinations e ON t.exam_id = e.id
      WHERE t.id = ? AND t.is_published = 1
    `).get(id) as any;

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found or unavailable.' });
      return;
    }

    const sections = db.prepare(`
      SELECT id, name, section_order, duration_minutes, total_questions, max_marks
      FROM test_sections
      WHERE test_id = ?
      ORDER BY section_order ASC
    `).all(test.id);

    res.json({ success: true, test, sections });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch test details.' });
  }
});

// POST /api/v1/attempts/start - Start or Resume a Test (Server Authoritative)
testsRouter.post('/attempts/start', authenticate, (req: Request, res: Response) => {
  try {
    const { test_id } = req.body;
    const userId = req.user!.id;

    if (!test_id) {
      res.status(400).json({ success: false, message: 'test_id is required.' });
      return;
    }

    const test = db.prepare('SELECT * FROM mock_tests WHERE id = ? AND is_published = 1').get(test_id) as any;
    if (!test) {
      res.status(404).json({ success: false, message: 'Mock test not found.' });
      return;
    }

    // Check entitlement if test is premium
    if (!test.is_free && req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
      const activeEntitlement = db.prepare(`
        SELECT id FROM entitlements
        WHERE user_id = ? AND is_active = 1 AND datetime(end_date) > datetime('now')
          AND (exam_id IS NULL OR exam_id = ? OR plan_id IN (SELECT id FROM subscription_plans WHERE exam_access_type = 'all'))
      `).get(userId, test.exam_id);

      if (!activeEntitlement) {
        res.status(403).json({
          success: false,
          entitlement_required: true,
          message: 'This is a premium mock test. Please upgrade to a preparation pass to attempt.'
        });
        return;
      }
    }

    // Check if an in-progress attempt exists for this user
    let attempt = db.prepare(`
      SELECT * FROM test_attempts
      WHERE user_id = ? AND test_id = ? AND status = 'in_progress'
      ORDER BY started_at DESC LIMIT 1
    `).get(userId, test.id) as any;

    const nowTime = new Date().getTime();

    // If an existing attempt is found and deadline has not passed, resume it!
    if (attempt) {
      const deadlineTime = new Date(attempt.server_deadline).getTime();
      if (nowTime >= deadlineTime) {
        // Auto-expire and submit
        attempt = null; // Will start a new attempt or lock
      }
    }

    if (!attempt) {
      const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const startedAt = new Date().toISOString();
      const deadline = new Date(nowTime + test.duration_minutes * 60 * 1000 + 15000).toISOString(); // 15s network grace

      const rulesSnapshot = JSON.stringify({
        duration_minutes: test.duration_minutes,
        total_marks: test.total_marks,
        negative_marking: test.negative_marking,
        title: test.title
      });

      db.prepare(`
        INSERT INTO test_attempts (id, user_id, test_id, started_at, server_deadline, status, rules_snapshot_json)
        VALUES (?, ?, ?, ?, ?, 'in_progress', ?)
      `).run(attemptId, userId, test.id, startedAt, deadline, rulesSnapshot);

      attempt = db.prepare('SELECT * FROM test_attempts WHERE id = ?').get(attemptId);
    }

    // Retrieve test sections
    const sections = db.prepare(`
      SELECT id, name, section_order, duration_minutes, total_questions, max_marks
      FROM test_sections
      WHERE test_id = ?
      ORDER BY section_order ASC
    `).all(test.id);

    // Retrieve questions WITHOUT correct answers or solutions!
    const questionsRaw = db.prepare(`
      SELECT tq.question_order, tq.marks, tq.negative_marks, tq.section_id,
             q.id, q.question_type, q.difficulty, q.question_en, q.question_hi, q.image_url,
             s.name as subject_name
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE tq.test_id = ?
      ORDER BY tq.question_order ASC
    `).all(test.id) as any[];

    // Fetch options for each question (excluding is_correct)
    const optionsRaw = db.prepare(`
      SELECT qo.id, qo.question_id, qo.option_key, qo.option_en, qo.option_hi
      FROM question_options qo
      WHERE qo.question_id IN (${questionsRaw.map(q => `'${q.id}'`).join(',') || "''"})
      ORDER BY qo.option_key ASC
    `).all() as any[];

    const optionsByQuestion = optionsRaw.reduce((acc, opt) => {
      acc[opt.question_id] = acc[opt.question_id] || [];
      acc[opt.question_id].push(opt);
      return acc;
    }, {} as Record<string, any[]>);

    const questions = questionsRaw.map(q => ({
      ...q,
      options: optionsByQuestion[q.id] || []
    }));

    // Fetch previously saved answers for this attempt (for refresh recovery)
    const savedAnswers = db.prepare(`
      SELECT question_id, selected_option, numerical_answer, status, time_spent_seconds
      FROM student_answers
      WHERE attempt_id = ?
    `).all(attempt.id);

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

// POST /api/v1/attempts/:id/answers - Autosave answer or review status
testsRouter.post('/attempts/:id/answers', authenticate, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question_id, selected_option, numerical_answer, status, time_spent_seconds } = req.body;
    const userId = req.user!.id;

    const attempt = db.prepare('SELECT * FROM test_attempts WHERE id = ?').get(id) as any;
    if (!attempt || attempt.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Attempt not found or access denied.' });
      return;
    }

    if (attempt.status !== 'in_progress') {
      res.status(400).json({ success: false, message: 'This attempt has already been submitted or expired.' });
      return;
    }

    // Check server deadline with 10s grace
    const nowTime = Date.now();
    const deadlineTime = new Date(attempt.server_deadline).getTime();
    if (nowTime > deadlineTime + 10000) {
      db.prepare("UPDATE test_attempts SET status = 'expired' WHERE id = ?").run(id);
      res.status(400).json({ success: false, message: 'Time limit exceeded. Test has expired.' });
      return;
    }

    const answerId = `ans_${id}_${question_id}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO student_answers (id, attempt_id, question_id, selected_option, numerical_answer, status, time_spent_seconds, saved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        selected_option = excluded.selected_option,
        numerical_answer = excluded.numerical_answer,
        status = excluded.status,
        time_spent_seconds = excluded.time_spent_seconds,
        saved_at = excluded.saved_at
    `).run(
      answerId,
      id,
      question_id,
      selected_option || null,
      numerical_answer || null,
      status || 'answered',
      time_spent_seconds || 0,
      now
    );

    res.json({ success: true, saved_at: now });
  } catch (err) {
    console.error('Error saving answer:', err);
    res.status(500).json({ success: false, message: 'Failed to persist student response.' });
  }
});

// POST /api/v1/attempts/:id/submit - Evaluate on server and generate result
testsRouter.post('/attempts/:id/submit', authenticate, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const attempt = db.prepare('SELECT * FROM test_attempts WHERE id = ?').get(id) as any;
    if (!attempt || attempt.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Idempotent: If already submitted, return current result
    if (attempt.status === 'submitted') {
      res.json({
        success: true,
        message: 'Test already submitted.',
        result: {
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
        }
      });
      return;
    }

    const test = db.prepare('SELECT * FROM mock_tests WHERE id = ?').get(attempt.test_id) as any;
    const testQuestions = db.prepare(`
      SELECT tq.question_id, tq.marks, tq.negative_marks, q.correct_answer, q.subject_id
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.id
      WHERE tq.test_id = ?
    `).all(test.id) as any[];

    const studentAnswers = db.prepare(`
      SELECT * FROM student_answers WHERE attempt_id = ?
    `).all(attempt.id) as any[];

    const answersMap = studentAnswers.reduce((acc, ans) => {
      acc[ans.question_id] = ans;
      return acc;
    }, {} as Record<string, any>);

    let totalScore = 0.0;
    let maxMarks = 0.0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let totalTimeSpent = 0;

    const updateAnswerEval = db.prepare(`
      UPDATE student_answers
      SET is_correct = ?, marks_awarded = ?
      WHERE id = ?
    `);

    testQuestions.forEach(tq => {
      maxMarks += tq.marks;
      const ans = answersMap[tq.question_id];

      if (!ans || !ans.selected_option) {
        unattemptedCount++;
      } else {
        totalTimeSpent += ans.time_spent_seconds || 0;
        const isCorrect = ans.selected_option.trim().toUpperCase() === tq.correct_answer.trim().toUpperCase();

        if (isCorrect) {
          correctCount++;
          totalScore += tq.marks;
          updateAnswerEval.run(1, tq.marks, ans.id);
        } else {
          incorrectCount++;
          totalScore -= tq.negative_marks;
          updateAnswerEval.run(0, -tq.negative_marks, ans.id);
        }
      }
    });

    const attemptedTotal = correctCount + incorrectCount;
    const accuracy = attemptedTotal > 0 ? Number(((correctCount / attemptedTotal) * 100).toFixed(1)) : 0;
    const finalScore = Number(Math.max(0, totalScore).toFixed(2));
    const now = new Date().toISOString();

    // Compute rank & percentile against peer attempts
    const peerAttempts = db.prepare(`
      SELECT total_score FROM test_attempts
      WHERE test_id = ? AND status = 'submitted'
    `).all(test.id) as { total_score: number }[];

    let rank = 1;
    let scoresBelow = 0;
    peerAttempts.forEach(p => {
      if (p.total_score > finalScore) rank++;
      if (p.total_score < finalScore) scoresBelow++;
    });

    const totalPeers = peerAttempts.length + 1;
    const percentile = Number(((scoresBelow / totalPeers) * 100).toFixed(1));

    // Update attempt
    db.prepare(`
      UPDATE test_attempts
      SET submitted_at = ?,
          time_taken_seconds = ?,
          status = 'submitted',
          total_score = ?,
          max_marks = ?,
          accuracy = ?,
          correct_count = ?,
          incorrect_count = ?,
          unattempted_count = ?,
          percentile = ?,
          rank = ?
      WHERE id = ?
    `).run(now, totalTimeSpent, finalScore, maxMarks, accuracy, correctCount, incorrectCount, unattemptedCount, percentile, rank, attempt.id);

    // Increment student daily streak
    db.prepare(`
      UPDATE student_profiles
      SET streak_days = streak_days + 1, last_active_date = ?
      WHERE user_id = ?
    `).run(now, userId);

    res.json({
      success: true,
      message: 'Examination submitted and evaluated successfully!',
      result: {
        attempt_id: attempt.id,
        total_score: finalScore,
        max_marks: maxMarks,
        accuracy,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unattempted_count: unattemptedCount,
        percentile,
        rank,
        time_taken_seconds: totalTimeSpent
      }
    });
  } catch (err) {
    console.error('Error submitting test:', err);
    res.status(500).json({ success: false, message: 'Server error evaluating examination.' });
  }
});

// GET /api/v1/attempts/:id/result - Detailed Solution & Answer Review
testsRouter.get('/attempts/:id/result', authenticate, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const attempt = db.prepare(`
      SELECT a.*, t.title as test_title, t.duration_minutes, t.total_questions, e.name as exam_name
      FROM test_attempts a
      JOIN mock_tests t ON a.test_id = t.id
      JOIN examinations e ON t.exam_id = e.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!attempt || attempt.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    if (attempt.status !== 'submitted') {
      res.status(400).json({ success: false, message: 'Test has not been submitted yet.' });
      return;
    }

    // Detailed question list with options, correct answer, student answer, and solutions
    const reviewQuestions = db.prepare(`
      SELECT tq.question_order, tq.marks, tq.negative_marks,
             q.id, q.question_type, q.difficulty, q.question_en, q.question_hi, q.image_url,
             q.correct_answer, q.solution_en, q.solution_hi,
             s.name as subject_name,
             sa.selected_option, sa.status as answer_status, sa.time_spent_seconds, sa.is_correct, sa.marks_awarded
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN student_answers sa ON sa.attempt_id = ? AND sa.question_id = q.id
      WHERE tq.test_id = ?
      ORDER BY tq.question_order ASC
    `).all(attempt.id, attempt.test_id) as any[];

    // Fetch options
    const questionIds = reviewQuestions.map(q => `'${q.id}'`).join(',');
    const optionsRaw = questionIds ? db.prepare(`
      SELECT qo.id, qo.question_id, qo.option_key, qo.option_en, qo.option_hi, qo.is_correct
      FROM question_options qo
      WHERE qo.question_id IN (${questionIds})
      ORDER BY qo.option_key ASC
    `).all() as any[] : [];

    const optionsByQ = optionsRaw.reduce((acc, opt) => {
      acc[opt.question_id] = acc[opt.question_id] || [];
      acc[opt.question_id].push(opt);
      return acc;
    }, {} as Record<string, any[]>);

    const questionsWithReview = reviewQuestions.map(q => ({
      ...q,
      options: optionsByQ[q.id] || []
    }));

    // Calculate subject-wise performance breakdown
    const subjectMap: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; marks: number }> = {};
    reviewQuestions.forEach(q => {
      const sub = q.subject_name || 'General';
      if (!subjectMap[sub]) {
        subjectMap[sub] = { total: 0, correct: 0, incorrect: 0, unattempted: 0, marks: 0 };
      }
      subjectMap[sub].total++;
      if (q.is_correct === 1) {
        subjectMap[sub].correct++;
        subjectMap[sub].marks += q.marks;
      } else if (q.selected_option) {
        subjectMap[sub].incorrect++;
        subjectMap[sub].marks -= q.negative_marks;
      } else {
        subjectMap[sub].unattempted++;
      }
    });

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      total_questions: stats.total,
      correct: stats.correct,
      incorrect: stats.incorrect,
      unattempted: stats.unattempted,
      score: Number(stats.marks.toFixed(1)),
      accuracy: (stats.correct + stats.incorrect) > 0 ? Number(((stats.correct / (stats.correct + stats.incorrect)) * 100).toFixed(1)) : 0
    }));

    res.json({
      success: true,
      attempt,
      subject_breakdown: subjectBreakdown,
      questions: questionsWithReview
    });
  } catch (err) {
    console.error('Error fetching test result:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve test result.' });
  }
});

// GET /api/v1/attempts/my-history - Student past test attempts
testsRouter.get('/my-history', authenticate, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const history = db.prepare(`
      SELECT a.id, a.test_id, a.started_at, a.submitted_at, a.time_taken_seconds, a.status,
             a.total_score, a.max_marks, a.accuracy, a.percentile, a.rank,
             t.title as test_title, t.total_questions, e.name as exam_name
      FROM test_attempts a
      JOIN mock_tests t ON a.test_id = t.id
      JOIN examinations e ON t.exam_id = e.id
      WHERE a.user_id = ?
      ORDER BY a.started_at DESC
    `).all(userId);

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch test attempt history.' });
  }
});
