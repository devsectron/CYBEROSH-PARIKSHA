import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const examsRouter = Router();

// GET /api/v1/exams/categories
examsRouter.get('/categories', (_req: Request, res: Response) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(e.id) as exam_count
      FROM exam_categories c
      LEFT JOIN examinations e ON c.id = e.category_id AND e.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `).all();

    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load exam categories.' });
  }
});

// GET /api/v1/exams
examsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { category_id, category_slug, featured, search } = req.query;

    let query = `
      SELECT e.*, c.name as category_name, c.slug as category_slug,
             (SELECT COUNT(*) FROM mock_tests t WHERE t.exam_id = e.id AND t.is_published = 1) as test_count,
             (SELECT COUNT(*) FROM study_materials m WHERE m.exam_id = e.id) as material_count,
             (SELECT COUNT(*) FROM model_papers p WHERE p.exam_id = e.id AND p.is_active = 1) as paper_count
      FROM examinations e
      JOIN exam_categories c ON e.category_id = c.id
      WHERE e.is_active = 1
    `;
    const params: any[] = [];

    if (category_id) {
      query += ` AND e.category_id = ?`;
      params.push(category_id);
    }

    if (category_slug) {
      query += ` AND c.slug = ?`;
      params.push(category_slug);
    }

    if (featured === '1' || featured === 'true') {
      query += ` AND e.is_featured = 1`;
    }

    if (search && typeof search === 'string') {
      query += ` AND (e.name LIKE ? OR e.full_name LIKE ? OR e.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY e.is_featured DESC, e.display_order ASC`;

    const exams = db.prepare(query).all(...params);

    res.json({ success: true, exams });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch examinations.' });
  }
});

// GET /api/v1/exams/:slug
examsRouter.get('/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const exam = db.prepare(`
      SELECT e.*, c.name as category_name, c.slug as category_slug
      FROM examinations e
      JOIN exam_categories c ON e.category_id = c.id
      WHERE e.slug = ? AND e.is_active = 1
    `).get(slug) as any;

    if (!exam) {
      res.status(404).json({ success: false, message: 'Examination not found.' });
      return;
    }

    // Parse JSON fields
    try {
      exam.pattern = exam.pattern_json ? JSON.parse(exam.pattern_json) : {};
    } catch {
      exam.pattern = {};
    }

    try {
      exam.syllabus = exam.syllabus_json ? JSON.parse(exam.syllabus_json) : {};
    } catch {
      exam.syllabus = {};
    }

    // Get subjects & chapters
    const subjects = db.prepare(`
      SELECT s.*, 
        (SELECT json_group_array(json_object('id', ch.id, 'name', ch.name, 'chapter_no', ch.chapter_no))
         FROM chapters ch WHERE ch.subject_id = s.id) as chapters_json
      FROM subjects s
      WHERE s.exam_id = ?
      ORDER BY s.display_order ASC
    `).all(exam.id) as any[];

    const parsedSubjects = subjects.map(s => ({
      ...s,
      chapters: s.chapters_json ? JSON.parse(s.chapters_json) : []
    }));

    // Get mock tests for this exam
    const mockTests = db.prepare(`
      SELECT id, title, slug, description, test_type, duration_minutes, total_questions, total_marks, negative_marking, is_free
      FROM mock_tests
      WHERE exam_id = ? AND is_published = 1
      ORDER BY is_free DESC, created_at DESC
    `).all(exam.id);

    // Get study materials for this exam
    const materials = db.prepare(`
      SELECT id, title, description, file_url, file_size_mb, access_level, language, author, downloads_count
      FROM study_materials
      WHERE exam_id = ?
      ORDER BY access_level ASC, created_at DESC
      LIMIT 10
    `).all(exam.id);

    // Get model papers & pyqs
    const papers = db.prepare(`
      SELECT id, year, paper_name, duration_minutes, max_marks, total_questions, paper_type, pdf_url, answer_key_url
      FROM model_papers
      WHERE exam_id = ? AND is_active = 1
      ORDER BY year DESC
    `).all(exam.id);

    res.json({
      success: true,
      exam,
      subjects: parsedSubjects,
      mockTests,
      materials,
      papers
    });
  } catch (err) {
    console.error('Error fetching exam by slug:', err);
    res.status(500).json({ success: false, message: 'Server error loading exam details.' });
  }
});
