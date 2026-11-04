import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

export const contentRouter = Router();

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

    if (exam_id) {
      query += ` AND m.exam_id = ?`;
      params.push(exam_id);
    }
    if (subject_id) {
      query += ` AND m.subject_id = ?`;
      params.push(subject_id);
    }
    if (access_level) {
      query += ` AND m.access_level = ?`;
      params.push(access_level);
    }
    if (search && typeof search === 'string') {
      query += ` AND (m.title LIKE ? OR m.description LIKE ? OR m.author LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY m.created_at DESC`;

    const materials = db.prepare(query).all(...params);

    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch study materials.' });
  }
});

// GET /api/v1/materials/:id/download - Authorized material download validation
contentRouter.get('/materials/:id/download', optionalAuthenticate, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const material = db.prepare(`
      SELECT m.*, e.name as exam_name
      FROM study_materials m
      LEFT JOIN examinations e ON m.exam_id = e.id
      WHERE m.id = ?
    `).get(id) as any;

    if (!material) {
      res.status(404).json({ success: false, message: 'Study material not found.' });
      return;
    }

    // If premium, check entitlement
    if (material.access_level === 'premium') {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Sign in required to access premium study notes.' });
        return;
      }

      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        const entitlement = db.prepare(`
          SELECT id FROM entitlements
          WHERE user_id = ? AND is_active = 1 AND datetime(end_date) > datetime('now')
        `).get(req.user.id);

        if (!entitlement) {
          res.status(403).json({
            success: false,
            message: 'Premium membership required to download this comprehensive material.'
          });
          return;
        }
      }
    }

    // Increment download counter
    db.prepare('UPDATE study_materials SET downloads_count = downloads_count + 1 WHERE id = ?').run(id);

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

    if (exam_id) {
      query += ` AND p.exam_id = ?`;
      params.push(exam_id);
    }
    if (paper_type) {
      query += ` AND p.paper_type = ?`;
      params.push(paper_type);
    }
    if (year) {
      query += ` AND p.year = ?`;
      params.push(year);
    }

    query += ` ORDER BY p.year DESC, p.paper_name ASC`;

    const papers = db.prepare(query).all(...params);

    res.json({ success: true, papers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch model papers.' });
  }
});

// GET /api/v1/daily-quiz - Today's or recent daily practice quiz
contentRouter.get('/daily-quiz', (_req: Request, res: Response) => {
  try {
    // Return sample daily quiz with questions from questions table
    const questions = db.prepare(`
      SELECT q.id, q.question_type, q.difficulty, q.question_en, q.question_hi, q.correct_answer, q.solution_en, q.solution_hi,
             s.name as subject_name
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      ORDER BY RANDOM() LIMIT 5
    `).all() as any[];

    const questionIds = questions.map(q => `'${q.id}'`).join(',');
    const options = questionIds ? db.prepare(`
      SELECT id, question_id, option_key, option_en, option_hi
      FROM question_options
      WHERE question_id IN (${questionIds})
      ORDER BY option_key ASC
    `).all() as any[] : [];

    const optMap = options.reduce((acc, opt) => {
      acc[opt.question_id] = acc[opt.question_id] || [];
      acc[opt.question_id].push(opt);
      return acc;
    }, {} as Record<string, any[]>);

    const fullQuiz = questions.map(q => ({
      ...q,
      options: optMap[q.id] || []
    }));

    res.json({
      success: true,
      quiz: {
        id: 'quiz_today',
        date: new Date().toISOString().split('T')[0],
        title: 'Daily General Awareness & Aptitude Challenge',
        total_questions: fullQuiz.length,
        questions: fullQuiz
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch daily quiz.' });
  }
});

// GET /api/v1/current-affairs - Daily updates
contentRouter.get('/current-affairs', (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let query = `SELECT * FROM current_affairs WHERE 1=1`;
    const params: any[] = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (search && typeof search === 'string') {
      query += ` AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY date DESC, created_at DESC LIMIT 20`;

    const items = db.prepare(query).all(...params);

    res.json({ success: true, current_affairs: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load current affairs.' });
  }
});

// Bookmarks GET & POST
contentRouter.get('/bookmarks', authenticate, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const bookmarks = db.prepare(`
      SELECT b.*,
        CASE
          WHEN b.item_type = 'material' THEN (SELECT title FROM study_materials WHERE id = b.item_id)
          WHEN b.item_type = 'paper' THEN (SELECT paper_name FROM model_papers WHERE id = b.item_id)
          ELSE 'Question Bookmark'
        END as item_title
      FROM bookmarks b
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(userId);

    res.json({ success: true, bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
  }
});

contentRouter.post('/bookmarks/toggle', authenticate, (req: Request, res: Response) => {
  try {
    const { item_type, item_id } = req.body;
    const userId = req.user!.id;

    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?')
      .get(userId, item_type, item_id) as any;

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
      res.json({ success: true, bookmarked: false, message: 'Bookmark removed.' });
    } else {
      const bId = `bm_${Date.now()}`;
      db.prepare('INSERT INTO bookmarks (id, user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(bId, userId, item_type, item_id, new Date().toISOString());
      res.json({ success: true, bookmarked: true, message: 'Bookmarked successfully.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
});
