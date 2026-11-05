import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { newId } from '../lib/util.js';
import { parseOrReject } from '../lib/validate.js';

export const adminRouter = Router();

// Anyone with a back-office role may reach the admin API; each route below narrows it further.
// (super_admin always passes requireRole.)
adminRouter.use(authenticate, requireRole('admin', 'content_manager', 'question_creator', 'reviewer'));

const ADMIN_ONLY = requireRole('admin');
const CONTENT_EDITORS = requireRole('admin', 'content_manager');
const QUESTION_EDITORS = requireRole('admin', 'content_manager', 'question_creator', 'reviewer');

const DEFAULT_EXAM_ID = 'exam_bihar_stet';
const MAX_BULK_QUESTIONS = 1000;

function audit(userId: string, action: string, entityType: string, entityId: string | null, details: unknown) {
  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(newId('log'), userId, action, entityType, entityId, JSON.stringify(details), new Date().toISOString());
}

/** Form fields often arrive as '' or null when left blank; treat those as "not provided". */
const optionalNumber = (min: number, max: number) =>
  z.preprocess(v => (v === '' || v === null ? undefined : v), z.coerce.number().min(min).max(max).optional());

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

// GET /api/v1/admin/analytics - Platform overview KPIs
adminRouter.get('/analytics', ADMIN_ONLY, (_req: Request, res: Response) => {
  try {
    const count = (sql: string) => (db.prepare(sql).get() as { count: number }).count;

    const totalRevenue = db
      .prepare("SELECT COALESCE(SUM(amount_inr), 0) as total FROM payments WHERE status = 'success'")
      .get() as { total: number };

    const recentAttempts = db
      .prepare(
        `SELECT a.id, a.started_at, a.total_score, a.max_marks, a.accuracy, u.full_name as student_name, t.title as test_title
           FROM test_attempts a
           JOIN users u ON a.user_id = u.id
           JOIN mock_tests t ON a.test_id = t.id
          ORDER BY a.started_at DESC LIMIT 6`
      )
      .all();

    res.json({
      success: true,
      stats: {
        total_students: count("SELECT COUNT(*) as count FROM users WHERE role = 'student'"),
        total_exams: count('SELECT COUNT(*) as count FROM examinations WHERE is_active = 1'),
        total_questions: count('SELECT COUNT(*) as count FROM questions'),
        total_attempts: count("SELECT COUNT(*) as count FROM test_attempts WHERE status = 'submitted'"),
        total_revenue_inr: totalRevenue.total
      },
      recent_attempts: recentAttempts
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin analytics.' });
  }
});

// ---------------------------------------------------------------------------
// Examinations
// ---------------------------------------------------------------------------

const examSchema = z.object({
  id: z.string().trim().max(100).optional().nullable(),
  category_id: z.string({ error: 'Name, slug, and category_id are required.' }).trim().min(1, 'Name, slug, and category_id are required.'),
  name: z.string({ error: 'Name, slug, and category_id are required.' }).trim().min(1, 'Name, slug, and category_id are required.').max(200),
  slug: z
    .string({ error: 'Name, slug, and category_id are required.' })
    .trim()
    .toLowerCase()
    .min(1, 'Name, slug, and category_id are required.')
    .max(150)
    .regex(/^[a-z0-9][a-z0-9_-]*$/, 'Slug may contain lowercase letters, numbers, hyphens and underscores only.'),
  full_name: optionalText(300),
  eligibility: optionalText(2000),
  conducting_body: optionalText(300),
  official_website: optionalText(500),
  description: optionalText(5000),
  pattern_json: z.any().optional(),
  syllabus_json: z.any().optional(),
  is_featured: z.any().optional()
});

const asJsonText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value || {}));

// POST /api/v1/admin/exams - Create or update an examination
adminRouter.post('/exams', CONTENT_EDITORS, (req: Request, res: Response) => {
  try {
    const body = parseOrReject(examSchema, req.body, res);
    if (!body) return;

    const examId = body.id || `exam_${body.slug.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    db.prepare(
      `INSERT INTO examinations (id, category_id, name, slug, full_name, eligibility, conducting_body, official_website, description, pattern_json, syllabus_json, is_featured, is_active)
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
         is_featured = excluded.is_featured`
    ).run(
      examId,
      body.category_id,
      body.name,
      body.slug,
      body.full_name || body.name,
      body.eligibility || null,
      body.conducting_body || null,
      body.official_website || null,
      body.description || null,
      asJsonText(body.pattern_json),
      asJsonText(body.syllabus_json),
      body.is_featured ? 1 : 0
    );

    audit(req.user!.id, 'UPSERT_EXAM', 'EXAMINATION', examId, { name: body.name, slug: body.slug });
    res.json({ success: true, message: 'Examination configured successfully.', exam_id: examId });
  } catch (err: any) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ success: false, message: 'Another examination already uses this slug.' });
      return;
    }
    if (err?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      res.status(400).json({ success: false, message: 'Unknown category_id.' });
      return;
    }
    console.error('Error saving exam:', err);
    res.status(500).json({ success: false, message: 'Failed to configure examination.' });
  }
});

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------

const QUESTION_STATUSES = ['draft', 'review', 'approved', 'published', 'archived'];

// GET /api/v1/admin/questions - List question bank
adminRouter.get('/questions', QUESTION_EDITORS, (req: Request, res: Response) => {
  try {
    const { exam_id, status, search } = req.query;
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isInteger(requestedLimit) ? Math.min(200, Math.max(1, requestedLimit)) : 50;

    let query = `
      SELECT q.*, e.name as exam_name, s.name as subject_name
      FROM questions q
      LEFT JOIN examinations e ON q.exam_id = e.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (typeof exam_id === 'string' && exam_id) {
      query += ` AND q.exam_id = ?`;
      params.push(exam_id);
    }
    if (typeof status === 'string' && QUESTION_STATUSES.includes(status)) {
      query += ` AND q.status = ?`;
      params.push(status);
    }
    if (search && typeof search === 'string') {
      query += ` AND (q.question_en LIKE ? OR q.question_hi LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ` ORDER BY q.created_at DESC LIMIT ?`;
    params.push(limit);

    res.json({ success: true, questions: db.prepare(query).all(...params) });
  } catch (err) {
    console.error('Error loading question bank:', err);
    res.status(500).json({ success: false, message: 'Failed to load question bank.' });
  }
});

const questionSchema = z.object({
  exam_id: optionalText(100),
  subject_id: optionalText(100),
  question_type: z.enum(['single_mcq', 'multi_mcq', 'numerical', 'assertion_reason', 'match_following']).optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().nullable(),
  marks: optionalNumber(0.01, 100),
  negative_marks: optionalNumber(0, 100),
  question_en: z.string({ error: 'Question text is required.' }).trim().min(1, 'Question text is required.').max(10_000),
  question_hi: optionalText(10_000),
  correct_answer: z.string({ error: 'A correct answer is required.' }).trim().min(1, 'A correct answer is required.').max(40),
  solution_en: optionalText(10_000),
  solution_hi: optionalText(10_000),
  options: z
    .array(
      z.object({
        option_key: z.string().trim().min(1, 'Every option needs an option_key.').max(5),
        option_en: optionalText(2_000),
        option_hi: optionalText(2_000)
      })
    )
    .max(10, 'At most 10 options are allowed.')
    .optional()
});
type QuestionInput = z.infer<typeof questionSchema>;

/** Cross-field checks that a plain schema cannot express. Returns an error message or null. */
function checkQuestionConsistency(q: QuestionInput): string | null {
  const type = q.question_type || 'single_mcq';
  if (type === 'numerical') return null;

  const options = q.options || [];
  if (options.length < 2) return 'Question text, correct answer, and at least 2 options are required.';

  const keys = options.map(o => o.option_key.toUpperCase());
  if (new Set(keys).size !== keys.length) return 'Option keys must be unique.';

  const answers = q.correct_answer.toUpperCase().split(/[\s,;|]+/).filter(Boolean);
  if (type !== 'multi_mcq' && answers.length !== 1) return 'This question type needs exactly one correct answer.';
  if (!answers.every(a => keys.includes(a))) return 'The correct answer must match one of the option keys.';
  return null;
}

/** Inserts one question plus its options. Must run inside the caller's transaction when batching. */
function insertQuestion(q: QuestionInput, examId: string, userId: string, now: string): string {
  const qId = newId('q');
  const correct = q.correct_answer.toUpperCase().trim();
  const correctKeys = new Set(correct.split(/[\s,;|]+/).filter(Boolean));

  db.prepare(
    `INSERT INTO questions (id, exam_id, subject_id, question_type, difficulty, marks, negative_marks, question_en, question_hi, correct_answer, solution_en, solution_hi, status, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`
  ).run(
    qId,
    examId,
    q.subject_id || null,
    q.question_type || 'single_mcq',
    q.difficulty || 'medium',
    q.marks ?? 1.0,
    q.negative_marks ?? 0.0,
    q.question_en,
    q.question_hi || null,
    correct,
    q.solution_en || null,
    q.solution_hi || null,
    userId,
    now
  );

  const insertOption = db.prepare(
    `INSERT INTO question_options (id, question_id, option_key, option_en, option_hi, is_correct)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (const opt of q.options || []) {
    const key = opt.option_key.toUpperCase();
    insertOption.run(`${qId}_${key}`, qId, key, opt.option_en || '', opt.option_hi || null, correctKeys.has(key) ? 1 : 0);
  }
  return qId;
}

function subjectExists(subjectId: string | null | undefined): boolean {
  return !subjectId || Boolean(db.prepare('SELECT 1 FROM subjects WHERE id = ?').get(subjectId));
}

// POST /api/v1/admin/questions - Create a single question
adminRouter.post('/questions', QUESTION_EDITORS, (req: Request, res: Response) => {
  try {
    const body = parseOrReject(questionSchema, req.body, res);
    if (!body) return;

    const problem = checkQuestionConsistency(body);
    if (problem) {
      res.status(400).json({ success: false, message: problem });
      return;
    }
    if (!subjectExists(body.subject_id)) {
      res.status(400).json({ success: false, message: 'Unknown subject_id.' });
      return;
    }

    const qId = db.transaction(() => insertQuestion(body, body.exam_id || DEFAULT_EXAM_ID, req.user!.id, new Date().toISOString()))();
    audit(req.user!.id, 'CREATE_QUESTION', 'QUESTION', qId, { exam_id: body.exam_id || DEFAULT_EXAM_ID });

    res.status(201).json({ success: true, message: 'Question created successfully in Question Bank.', question_id: qId });
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ success: false, message: 'Failed to create question.' });
  }
});

// POST /api/v1/admin/questions/bulk-import - Batch validate & import questions
// Rows that fail validation are reported and skipped; valid rows are imported atomically.
adminRouter.post('/questions/bulk-import', QUESTION_EDITORS, (req: Request, res: Response) => {
  try {
    const examId = typeof req.body?.exam_id === 'string' ? req.body.exam_id.trim() : '';
    const rows = req.body?.questions;

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, message: 'Questions array is required.' });
      return;
    }
    if (rows.length > MAX_BULK_QUESTIONS) {
      res.status(400).json({ success: false, message: `At most ${MAX_BULK_QUESTIONS} questions can be imported at once.` });
      return;
    }

    const errors: string[] = [];
    const valid: Array<{ q: QuestionInput; examId: string }> = [];

    rows.forEach((row, index) => {
      const parsed = questionSchema.safeParse(row);
      if (!parsed.success) {
        errors.push(`Row ${index + 1}: ${parsed.error.issues[0]?.message || 'Invalid question.'}`);
        return;
      }
      const problem = checkQuestionConsistency(parsed.data);
      if (problem) {
        errors.push(`Row ${index + 1}: ${problem}`);
        return;
      }
      if (!subjectExists(parsed.data.subject_id)) {
        errors.push(`Row ${index + 1}: Unknown subject_id.`);
        return;
      }
      valid.push({ q: parsed.data, examId: examId || parsed.data.exam_id || DEFAULT_EXAM_ID });
    });

    const now = new Date().toISOString();
    const importedCount = db.transaction(() => {
      for (const item of valid) insertQuestion(item.q, item.examId, req.user!.id, now);
      return valid.length;
    })();

    audit(req.user!.id, 'BULK_IMPORT_QUESTIONS', 'QUESTION_BANK', examId || 'GENERAL', {
      imported: importedCount,
      total: rows.length
    });

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

// ---------------------------------------------------------------------------
// Mock tests
// ---------------------------------------------------------------------------

const testSchema = z.object({
  exam_id: z.string({ error: 'exam_id, title, slug, and duration_minutes are required.' }).trim().min(1, 'exam_id, title, slug, and duration_minutes are required.'),
  title: z.string({ error: 'exam_id, title, slug, and duration_minutes are required.' }).trim().min(1, 'exam_id, title, slug, and duration_minutes are required.').max(200),
  slug: z
    .string({ error: 'exam_id, title, slug, and duration_minutes are required.' })
    .trim()
    .toLowerCase()
    .min(1, 'exam_id, title, slug, and duration_minutes are required.')
    .max(150)
    .regex(/^[a-z0-9][a-z0-9_-]*$/, 'Slug may contain lowercase letters, numbers, hyphens and underscores only.'),
  description: optionalText(5000),
  test_type: z.enum(['full_mock', 'sectional', 'pyq', 'daily_quiz']).optional().nullable(),
  duration_minutes: z.coerce.number({ error: 'duration_minutes must be a number.' }).int('duration_minutes must be a whole number.').min(1).max(600),
  total_questions: optionalNumber(1, 1000),
  total_marks: optionalNumber(0.01, 100_000),
  // 0 is a legitimate value (no negative marking); only an omitted/blank field falls back to the default.
  negative_marking: optionalNumber(0, 100),
  is_free: z.any().optional(),
  sections: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Every section needs a name.').max(100),
        duration_minutes: optionalNumber(1, 600),
        total_questions: optionalNumber(0, 1000),
        max_marks: optionalNumber(0, 100_000)
      })
    )
    .max(20)
    .optional(),
  question_ids: z.array(z.string().trim().min(1)).max(500).optional()
});

// POST /api/v1/admin/tests - Create a new CBT mock test
adminRouter.post('/tests', CONTENT_EDITORS, (req: Request, res: Response) => {
  try {
    const body = parseOrReject(testSchema, req.body, res);
    if (!body) return;

    const exam = db.prepare('SELECT id FROM examinations WHERE id = ?').get(body.exam_id);
    if (!exam) {
      res.status(400).json({ success: false, message: 'Unknown exam_id.' });
      return;
    }

    const questionIds = Array.from(new Set(body.question_ids || []));
    let questionRows: Array<{ id: string; marks: number; negative_marks: number }> = [];
    if (questionIds.length) {
      questionRows = db
        .prepare(
          `SELECT id, marks, negative_marks FROM questions WHERE id IN (${questionIds.map(() => '?').join(',')})`
        )
        .all(...questionIds) as typeof questionRows;
      if (questionRows.length !== questionIds.length) {
        const found = new Set(questionRows.map(r => r.id));
        const missing = questionIds.filter(id => !found.has(id));
        res.status(400).json({ success: false, message: `Unknown question ids: ${missing.slice(0, 5).join(', ')}` });
        return;
      }
    }
    const rowById = new Map(questionRows.map(r => [r.id, r]));

    const testId = `test_${body.slug.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
    const now = new Date().toISOString();
    const negativeMarking = body.negative_marking ?? 0.25;

    // Each question keeps its own marks (previously every question was hard-coded to 1.0, so a test
    // advertised as 100 marks could never score more than its question count).
    const sumOfMarks = questionIds.reduce((acc, id) => acc + (rowById.get(id)?.marks ?? 1), 0);
    const totalMarks = body.total_marks ?? (questionIds.length ? sumOfMarks : 100);
    const totalQuestions = body.total_questions ?? (questionIds.length || 50);
    const isFree = [true, 1, '1', 'true'].includes(body.is_free) ? 1 : 0;

    db.transaction(() => {
      db.prepare(
        `INSERT INTO mock_tests (id, exam_id, title, slug, description, test_type, duration_minutes, total_questions, total_marks, negative_marking, is_free, is_published, review_available, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`
      ).run(
        testId,
        body.exam_id,
        body.title,
        body.slug,
        body.description || null,
        body.test_type || 'full_mock',
        body.duration_minutes,
        totalQuestions,
        totalMarks,
        negativeMarking,
        isFree,
        now
      );

      if (body.sections?.length) {
        const insertSection = db.prepare(
          `INSERT INTO test_sections (id, test_id, name, section_order, duration_minutes, total_questions, max_marks)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        body.sections.forEach((sec, idx) => {
          insertSection.run(
            `sec_${testId}_${idx + 1}`,
            testId,
            sec.name,
            idx + 1,
            sec.duration_minutes ?? body.duration_minutes,
            sec.total_questions ?? 25,
            sec.max_marks ?? 25
          );
        });
      }

      if (questionIds.length) {
        const insertTestQuestion = db.prepare(
          `INSERT INTO test_questions (id, test_id, question_id, question_order, marks, negative_marks)
           VALUES (?, ?, ?, ?, ?, ?)`
        );
        questionIds.forEach((qid, idx) => {
          const row = rowById.get(qid)!;
          // An explicit test-level penalty wins; otherwise the question's own penalty applies.
          const penalty = body.negative_marking !== undefined ? negativeMarking : row.negative_marks;
          insertTestQuestion.run(`tq_${testId}_${idx}`, testId, qid, idx + 1, row.marks, penalty);
        });
      }
    })();

    audit(req.user!.id, 'CREATE_TEST', 'MOCK_TEST', testId, { title: body.title, questions: questionIds.length });
    res.status(201).json({ success: true, message: 'Mock examination created and published successfully.', test_id: testId });
  } catch (err: any) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ success: false, message: 'A mock test with this slug already exists.' });
      return;
    }
    console.error('Error creating test:', err);
    res.status(500).json({ success: false, message: 'Failed to create mock test.' });
  }
});

// ---------------------------------------------------------------------------
// Oversight (administrators only)
// ---------------------------------------------------------------------------

// GET /api/v1/admin/audit-logs
adminRouter.get('/audit-logs', ADMIN_ONLY, (_req: Request, res: Response) => {
  try {
    const logs = db
      .prepare(
        `SELECT l.*, u.full_name as user_name, u.email as user_email
           FROM audit_logs l
           LEFT JOIN users u ON l.user_id = u.id
          ORDER BY l.created_at DESC LIMIT 50`
      )
      .all();

    res.json({ success: true, logs });
  } catch (err) {
    console.error('Error retrieving audit logs:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
});

// GET /api/v1/admin/payments  (gateway signatures are never returned)
adminRouter.get('/payments', ADMIN_ONLY, (_req: Request, res: Response) => {
  try {
    const payments = db
      .prepare(
        `SELECT p.id, p.user_id, p.plan_id, p.order_id, p.payment_id, p.amount_inr, p.status, p.method, p.created_at,
                u.full_name as student_name, u.email as student_email, pl.name as plan_name
           FROM payments p
           JOIN users u ON p.user_id = u.id
           JOIN subscription_plans pl ON p.plan_id = pl.id
          ORDER BY p.created_at DESC LIMIT 50`
      )
      .all();

    res.json({ success: true, payments });
  } catch (err) {
    console.error('Error loading payments:', err);
    res.status(500).json({ success: false, message: 'Failed to load payments history.' });
  }
});
