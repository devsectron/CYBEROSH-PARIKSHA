import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { hasActiveEntitlement, isAdminRole } from '../lib/entitlements.js';
import { hashStringToSeed, istDateKey, newId, seededRandom } from '../lib/util.js';
import { parseOrReject } from '../lib/validate.js';

export const contentRouter = Router();

const DAILY_QUIZ_SIZE = 5;

/** Can this (optional) user open premium material for the given exam? */
export function canAccessPremium(user: Request['user'], examId?: string | null): boolean {
  if (!user) return false;
  return isAdminRole(user.role) || hasActiveEntitlement(user.id, examId ?? null);
}

/**
 * Premium file locations must not leak through list endpoints: anyone could otherwise read
 * `file_url` from the JSON and skip the entitlement check on the download route.
 */
export function redactLockedMaterials<T extends { access_level?: string; exam_id?: string | null; file_url?: string | null }>(
  materials: T[],
  user: Request['user']
): Array<T & { locked: boolean }> {
  // Entitlement is resolved once per distinct exam, not once per row.
  const cache = new Map<string, boolean>();
  return materials.map(m => {
    if (m.access_level !== 'premium') return { ...m, locked: false };
    const key = m.exam_id ?? '';
    if (!cache.has(key)) cache.set(key, canAccessPremium(user, m.exam_id));
    return cache.get(key) ? { ...m, locked: false } : { ...m, file_url: null, locked: true };
  });
}

// GET /api/v1/materials - List study materials
contentRouter.get('/materials', optionalAuthenticate, (req: Request, res: Response) => {
  try {
    const { exam_id, subject_id, access_level, search } = req.query;

    let query = `
      SELECT m.*, e.name as exam_name, s.name as subject_name
      FROM study_materials m
      LEFT JOIN examinations e ON m.exam_id = e.id
      LEFT JOIN subjects s ON m.subject_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (typeof exam_id === 'string' && exam_id) {
      query += ` AND m.exam_id = ?`;
      params.push(exam_id);
    }
    if (typeof subject_id === 'string' && subject_id) {
      query += ` AND m.subject_id = ?`;
      params.push(subject_id);
    }
    if (access_level === 'free' || access_level === 'premium') {
      query += ` AND m.access_level = ?`;
      params.push(access_level);
    }
    if (search && typeof search === 'string') {
      query += ` AND (m.title LIKE ? OR m.description LIKE ? OR m.author LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY m.created_at DESC`;

    const materials = db.prepare(query).all(...params) as any[];
    res.json({ success: true, materials: redactLockedMaterials(materials, req.user) });
  } catch (err) {
    console.error('Error fetching materials:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch study materials.' });
  }
});

// GET /api/v1/materials/:id/download - Authorized material download validation
contentRouter.get('/materials/:id/download', optionalAuthenticate, (req: Request, res: Response) => {
  try {
    const material = db
      .prepare(
        `SELECT m.*, e.name as exam_name
           FROM study_materials m
           LEFT JOIN examinations e ON m.exam_id = e.id
          WHERE m.id = ?`
      )
      .get(req.params.id) as any;

    if (!material) {
      res.status(404).json({ success: false, message: 'Study material not found.' });
      return;
    }

    if (material.access_level === 'premium') {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Sign in required to access premium study notes.' });
        return;
      }
      if (!canAccessPremium(req.user, material.exam_id)) {
        res.status(403).json({
          success: false,
          message: 'Premium membership required to download this comprehensive material.'
        });
        return;
      }
    }

    db.prepare('UPDATE study_materials SET downloads_count = downloads_count + 1 WHERE id = ?').run(material.id);

    res.json({
      success: true,
      download_url: material.file_url,
      material: {
        id: material.id,
        title: material.title,
        file_size_mb: material.file_size_mb,
        file_type: material.file_type
      }
    });
  } catch (err) {
    console.error('Error initiating download:', err);
    res.status(500).json({ success: false, message: 'Failed to initiate download.' });
  }
});

// GET /api/v1/papers - Model papers and PYQs
contentRouter.get('/papers', (req: Request, res: Response) => {
  try {
    const { exam_id, paper_type, year } = req.query;

    let query = `
      SELECT p.*, e.name as exam_name, e.slug as exam_slug
      FROM model_papers p
      JOIN examinations e ON p.exam_id = e.id
      WHERE p.is_active = 1
    `;
    const params: any[] = [];

    if (typeof exam_id === 'string' && exam_id) {
      query += ` AND p.exam_id = ?`;
      params.push(exam_id);
    }
    if (paper_type === 'pyq' || paper_type === 'model') {
      query += ` AND p.paper_type = ?`;
      params.push(paper_type);
    }
    if (typeof year === 'string' && /^\d{4}$/.test(year)) {
      query += ` AND p.year = ?`;
      params.push(Number(year));
    }

    query += ` ORDER BY p.year DESC, p.paper_name ASC`;

    res.json({ success: true, papers: db.prepare(query).all(...params) });
  } catch (err) {
    console.error('Error fetching papers:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch model papers.' });
  }
});

// GET /api/v1/daily-quiz - Today's practice quiz.
// The selection is derived from the IST calendar date, so it is the same for every student all day
// (it used to be re-randomised on every request, which made it neither "daily" nor shareable).
contentRouter.get('/daily-quiz', (_req: Request, res: Response) => {
  try {
    const today = istDateKey();

    const pool = (
      db
        .prepare(
          `SELECT q.id FROM questions q
            WHERE q.status = 'published'
              AND q.question_type IN ('single_mcq', 'assertion_reason', 'match_following')
              AND EXISTS (SELECT 1 FROM question_options o WHERE o.question_id = q.id)
            ORDER BY q.id`
        )
        .all() as { id: string }[]
    ).map(r => r.id);

    // Seeded Fisher-Yates shuffle
    const random = seededRandom(hashStringToSeed(`daily-quiz:${today}`));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const pickedIds = pool.slice(0, DAILY_QUIZ_SIZE);

    let questions: any[] = [];
    if (pickedIds.length) {
      const marks = pickedIds.map(() => '?').join(',');
      const rows = db
        .prepare(
          `SELECT q.id, q.question_type, q.difficulty, q.question_en, q.question_hi, q.correct_answer, q.solution_en, q.solution_hi,
                  s.name as subject_name
             FROM questions q
             LEFT JOIN subjects s ON q.subject_id = s.id
            WHERE q.id IN (${marks})`
        )
        .all(...pickedIds) as any[];

      const options = db
        .prepare(
          `SELECT id, question_id, option_key, option_en, option_hi
             FROM question_options
            WHERE question_id IN (${marks})
            ORDER BY option_key ASC`
        )
        .all(...pickedIds) as any[];

      const optionsByQuestion: Record<string, any[]> = {};
      for (const opt of options) (optionsByQuestion[opt.question_id] ||= []).push(opt);

      const byId = new Map(rows.map(r => [r.id, r]));
      questions = pickedIds
        .map(id => byId.get(id))
        .filter(Boolean)
        .map(q => ({ ...q, options: optionsByQuestion[q.id] || [] }));
    }

    res.json({
      success: true,
      quiz: {
        id: `quiz_${today}`,
        date: today,
        title: 'Daily General Awareness & Aptitude Challenge',
        total_questions: questions.length,
        questions
      }
    });
  } catch (err) {
    console.error('Error fetching daily quiz:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch daily quiz.' });
  }
});

// GET /api/v1/current-affairs - Daily updates
contentRouter.get('/current-affairs', (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let query = `SELECT * FROM current_affairs WHERE 1=1`;
    const params: any[] = [];

    if (typeof category === 'string' && category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (search && typeof search === 'string') {
      query += ` AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY date DESC, created_at DESC LIMIT 20`;

    res.json({ success: true, current_affairs: db.prepare(query).all(...params) });
  } catch (err) {
    console.error('Error fetching current affairs:', err);
    res.status(500).json({ success: false, message: 'Failed to load current affairs.' });
  }
});

// Bookmarks
const bookmarkSchema = z.object({
  item_type: z.enum(['material', 'paper', 'question'], { error: 'item_type must be material, paper or question.' }),
  item_id: z.string({ error: 'item_id is required.' }).trim().min(1, 'item_id is required.').max(200)
});

contentRouter.get('/bookmarks', authenticate, (req: Request, res: Response) => {
  try {
    const bookmarks = db
      .prepare(
        `SELECT b.*,
           CASE
             WHEN b.item_type = 'material' THEN (SELECT title FROM study_materials WHERE id = b.item_id)
             WHEN b.item_type = 'paper' THEN (SELECT paper_name FROM model_papers WHERE id = b.item_id)
             ELSE 'Question Bookmark'
           END as item_title
         FROM bookmarks b
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC`
      )
      .all(req.user!.id);

    res.json({ success: true, bookmarks });
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
  }
});

contentRouter.post('/bookmarks/toggle', authenticate, (req: Request, res: Response) => {
  try {
    const body = parseOrReject(bookmarkSchema, req.body, res);
    if (!body) return;
    const userId = req.user!.id;

    const existing = db
      .prepare('SELECT id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?')
      .get(userId, body.item_type, body.item_id) as { id: string } | undefined;

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
      res.json({ success: true, bookmarked: false, message: 'Bookmark removed.' });
      return;
    }

    db.prepare('INSERT INTO bookmarks (id, user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?, ?)').run(
      newId('bm'),
      userId,
      body.item_type,
      body.item_id,
      new Date().toISOString()
    );
    res.json({ success: true, bookmarked: true, message: 'Bookmarked successfully.' });
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
});
