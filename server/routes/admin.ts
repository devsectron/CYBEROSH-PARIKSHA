import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

// Enforce admin or super_admin for all admin endpoints
adminRouter.use(authenticate, requireRole('admin', 'super_admin', 'content_manager', 'reviewer'));

// GET /api/v1/admin/analytics - Platform Overview KPIs
adminRouter.get('/analytics', (_req: Request, res: Response) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };
    const totalExams = db.prepare("SELECT COUNT(*) as count FROM examinations WHERE is_active = 1").get() as { count: number };
    const totalQuestions = db.prepare("SELECT COUNT(*) as count FROM questions").get() as { count: number };
    const totalAttempts = db.prepare("SELECT COUNT(*) as count FROM test_attempts WHERE status = 'submitted'").get() as { count: number };
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount_inr), 0) as total FROM payments WHERE status = 'success'").get() as { total: number };
    const recentAttempts = db.prepare(`
      SELECT a.id, a.started_at, a.total_score, a.max_marks, a.accuracy, u.full_name as student_name, t.title as test_title
      FROM test_attempts a
      JOIN users u ON a.user_id = u.id
      JOIN mock_tests t ON a.test_id = t.id
      ORDER BY a.started_at DESC LIMIT 6
    `).all();

    res.json({
      success: true,
      stats: {
        total_students: totalStudents.count,
        total_exams: totalExams.count,
        total_questions: totalQuestions.count,
        total_attempts: totalAttempts.count,
        total_revenue_inr: totalRevenue.total
      },
      recent_attempts: recentAttempts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin analytics.' });
  }
});

// POST /api/v1/admin/exams - Create or update an examination
adminRouter.post('/exams', (req: Request, res: Response) => {
  try {
    const { id, category_id, name, slug, full_name, eligibility, conducting_body, official_website, description, pattern_json, syllabus_json, is_featured } = req.body;

    if (!name || !slug || !category_id) {
      res.status(400).json({ success: false, message: 'Name, slug, and category_id are required.' });
      return;
    }

    const examId = id || `exam_${slug.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    db.prepare(`
      INSERT INTO examinations (id, category_id, name, slug, full_name, eligibility, conducting_body, official_website, description, pattern_json, syllabus_json, is_featured, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        category_id = excluded.category_id,
        name = excluded.name,
        slug = excluded.slug,
        full_name = excluded.full_name,
        eligibility = excluded.eligibility,
        conducting_body = excluded.conducting_body,
        official_website = excluded.official_website,
        description = excluded.description,
        pattern_json = excluded.pattern_json,
        syllabus_json = excluded.syllabus_json,
        is_featured = excluded.is_featured
    `).run(
      examId,
      category_id,
      name,
      slug,
      full_name || name,
      eligibility || null,
      conducting_body || null,
      official_website || null,
      description || null,
      typeof pattern_json === 'string' ? pattern_json : JSON.stringify(pattern_json || {}),
      typeof syllabus_json === 'string' ? syllabus_json : JSON.stringify(syllabus_json || {}),
      is_featured ? 1 : 0
    );

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, ?, 'UPSERT_EXAM', 'EXAMINATION', ?, ?, ?)
    `).run(`log_${Date.now()}`, req.user!.id, examId, JSON.stringify({ name, slug }), new Date().toISOString());

    res.json({ success: true, message: 'Examination configured successfully.', exam_id: examId });
  } catch (err: any) {
    console.error('Error saving exam:', err);
    res.status(500).json({ success: false, message: 'Failed to configure examination.' });
  }
});

// GET /api/v1/admin/questions - List question bank
adminRouter.get('/questions', (req: Request, res: Response) => {
  try {
    const { exam_id, status, search, limit = 50 } = req.query;

    let query = `
      SELECT q.*, e.name as exam_name, s.name as subject_name
      FROM questions q
      LEFT JOIN examinations e ON q.exam_id = e.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (exam_id) {
      query += ` AND q.exam_id = ?`;
      params.push(exam_id);
    }
    if (status) {
      query += ` AND q.status = ?`;
      params.push(status);
    }
    if (search && typeof search === 'string') {
      query += ` AND (q.question_en LIKE ? OR q.question_hi LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ` ORDER BY q.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const questions = db.prepare(query).all(...params);

    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load question bank.' });
  }
});

// POST /api/v1/admin/questions - Create a single question
adminRouter.post('/questions', (req: Request, res: Response) => {
  try {
    const { exam_id, subject_id, question_type, difficulty, marks, negative_marks, question_en, question_hi, correct_answer, solution_en, solution_hi, options } = req.body;

    if (!question_en || !correct_answer || !Array.isArray(options) || options.length < 2) {
      res.status(400).json({ success: false, message: 'Question text, correct answer, and at least 2 options are required.' });
      return;
    }

    const qId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO questions (id, exam_id, subject_id, question_type, difficulty, marks, negative_marks, question_en, question_hi, correct_answer, solution_en, solution_hi, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)
    `).run(
      qId,
      exam_id || 'exam_bihar_stet',
      subject_id || null,
      question_type || 'single_mcq',
      difficulty || 'medium',
      marks || 1.0,
      negative_marks || 0.0,
      question_en,
      question_hi || null,
      correct_answer.toUpperCase().trim(),
      solution_en || null,
      solution_hi || null,
      req.user!.id,
      now
    );

    const insertOpt = db.prepare(`
      INSERT INTO question_options (id, question_id, option_key, option_en, option_hi, is_correct)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    options.forEach((opt: any) => {
      insertOpt.run(
        `${qId}_${opt.option_key}`,
        qId,
        opt.option_key.toUpperCase().trim(),
        opt.option_en || '',
        opt.option_hi || null,
        opt.option_key.toUpperCase().trim() === correct_answer.toUpperCase().trim() ? 1 : 0
      );
    });

    res.status(201).json({ success: true, message: 'Question created successfully in Question Bank.', question_id: qId });
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ success: false, message: 'Failed to create question.' });
  }
});

// POST /api/v1/admin/questions/bulk-import - Batch validate & import questions
adminRouter.post('/questions/bulk-import', (req: Request, res: Response) => {
  try {
    const { exam_id, questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, message: 'Questions array is required.' });
      return;
    }

    let importedCount = 0;
    const errors: string[] = [];
    const now = new Date().toISOString();

    const insertQ = db.prepare(`
      INSERT INTO questions (id, exam_id, question_type, difficulty, marks, negative_marks, question_en, question_hi, correct_answer, solution_en, solution_hi, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)
    `);

    const insertOpt = db.prepare(`
      INSERT INTO question_options (id, question_id, option_key, option_en, option_hi, is_correct)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((items: any[]) => {
      items.forEach((item, index) => {
        if (!item.question_en || !item.correct_answer || !Array.isArray(item.options)) {
          errors.push(`Row ${index + 1}: Missing required question text or options.`);
          return;
        }

        const qId = `q_bulk_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 5)}`;
        insertQ.run(
          qId,
          exam_id || item.exam_id || 'exam_bihar_stet',
          item.question_type || 'single_mcq',
          item.difficulty || 'medium',
          item.marks || 1.0,
          item.negative_marks || 0.0,
          item.question_en,
          item.question_hi || null,
          item.correct_answer.toUpperCase().trim(),
          item.solution_en || null,
          item.solution_hi || null,
          req.user!.id,
          now
        );

        item.options.forEach((opt: any) => {
          insertOpt.run(
            `${qId}_${opt.option_key}`,
            qId,
            opt.option_key.toUpperCase().trim(),
            opt.option_en || '',
            opt.option_hi || null,
            opt.option_key.toUpperCase().trim() === item.correct_answer.toUpperCase().trim() ? 1 : 0
          );
        });

        importedCount++;
      });
    });

    transaction(questions);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, ?, 'BULK_IMPORT_QUESTIONS', 'QUESTION_BANK', ?, ?, ?)
    `).run(`log_${Date.now()}`, req.user!.id, exam_id || 'GENERAL', JSON.stringify({ imported: importedCount, total: questions.length }), now);

    res.json({
      success: true,
      message: `Successfully imported ${importedCount} questions into Question Bank.`,
      imported_count: importedCount,
      errors
    });
  } catch (err) {
    console.error('Error during bulk import:', err);
    res.status(500).json({ success: false, message: 'Server error during question bulk import.' });
  }
});

// POST /api/v1/admin/tests - Create a new CBT Mock Test
adminRouter.post('/tests', (req: Request, res: Response) => {
  try {
    const { exam_id, title, slug, description, test_type, duration_minutes, total_questions, total_marks, negative_marking, is_free, sections, question_ids } = req.body;

    if (!exam_id || !title || !slug || !duration_minutes) {
      res.status(400).json({ success: false, message: 'exam_id, title, slug, and duration_minutes are required.' });
      return;
    }

    const testId = `test_${slug.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO mock_tests (id, exam_id, title, slug, description, test_type, duration_minutes, total_questions, total_marks, negative_marking, is_free, is_published, review_available, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
    `).run(
      testId,
      exam_id,
      title,
      slug,
      description || null,
      test_type || 'full_mock',
      Number(duration_minutes),
      Number(total_questions) || (Array.isArray(question_ids) ? question_ids.length : 50),
      Number(total_marks) || 100,
      Number(negative_marking) || 0.25,
      is_free ? 1 : 0,
      now
    );

    // Create sections if provided
    if (Array.isArray(sections) && sections.length > 0) {
      const insertSec = db.prepare(`
        INSERT INTO test_sections (id, test_id, name, section_order, duration_minutes, total_questions, max_marks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      sections.forEach((sec: any, idx: number) => {
        insertSec.run(`sec_${testId}_${idx + 1}`, testId, sec.name, idx + 1, sec.duration_minutes || duration_minutes, sec.total_questions || 25, sec.max_marks || 25);
      });
    }

    // Attach questions if provided
    if (Array.isArray(question_ids) && question_ids.length > 0) {
      const insertTQ = db.prepare(`
        INSERT INTO test_questions (id, test_id, question_id, question_order, marks, negative_marks)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      question_ids.forEach((qId: string, idx: number) => {
        insertTQ.run(`tq_${testId}_${idx}`, testId, qId, idx + 1, 1.0, Number(negative_marking) || 0.25);
      });
    }

    res.status(201).json({ success: true, message: 'Mock examination created and published successfully.', test_id: testId });
  } catch (err: any) {
    console.error('Error creating test:', err);
    res.status(500).json({ success: false, message: 'Failed to create mock test.' });
  }
});

// GET /api/v1/admin/audit-logs
adminRouter.get('/audit-logs', (_req: Request, res: Response) => {
  try {
    const logs = db.prepare(`
      SELECT l.*, u.full_name as user_name, u.email as user_email
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC LIMIT 50
    `).all();

    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
});

// GET /api/v1/admin/payments
adminRouter.get('/payments', (_req: Request, res: Response) => {
  try {
    const payments = db.prepare(`
      SELECT p.*, u.full_name as student_name, u.email as student_email, pl.name as plan_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN subscription_plans pl ON p.plan_id = pl.id
      ORDER BY p.created_at DESC LIMIT 50
    `).all();

    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load payments history.' });
  }
});
