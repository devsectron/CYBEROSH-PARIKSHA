import './lib/config.js'; // loads .env before DATABASE_PATH is read below
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// DATABASE_PATH is documented in .env.example; ":memory:" gives tests a throwaway database.
const configuredPath = (process.env.DATABASE_PATH || '').trim();
const dbPath = configuredPath === ':memory:'
  ? ':memory:'
  : path.resolve(configuredPath || path.join('data', 'cyberosh_pariksha.db'));

if (dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

export function initDatabase() {
  db.exec(`
    -- USERS & IDENTITY
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('super_admin', 'admin', 'content_manager', 'question_creator', 'reviewer', 'student')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'pending')),
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      target_exam_id TEXT,
      category TEXT DEFAULT 'General',
      state TEXT DEFAULT 'Bihar',
      city TEXT DEFAULT 'Patna',
      preparation_year INTEGER DEFAULT 2026,
      streak_days INTEGER DEFAULT 1,
      last_active_date TEXT
    );

    -- EXAMINATION TAXONOMY
    CREATE TABLE IF NOT EXISTS exam_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'GraduationCap',
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS examinations (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES exam_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      eligibility TEXT,
      frequency TEXT,
      conducting_body TEXT,
      official_website TEXT,
      description TEXT,
      syllabus_json TEXT,
      pattern_json TEXT,
      is_featured INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      chapter_no INTEGER DEFAULT 1,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT
    );

    -- QUESTION BANK
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      exam_id TEXT,
      subject_id TEXT,
      chapter_id TEXT,
      topic_id TEXT,
      question_type TEXT DEFAULT 'single_mcq' CHECK(question_type IN ('single_mcq', 'multi_mcq', 'numerical', 'assertion_reason', 'match_following')),
      difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
      marks REAL DEFAULT 1.0,
      negative_marks REAL DEFAULT 0.0,
      question_en TEXT NOT NULL,
      question_hi TEXT,
      image_url TEXT,
      correct_answer TEXT NOT NULL,
      solution_en TEXT,
      solution_hi TEXT,
      status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'review', 'approved', 'published', 'archived')),
      created_by TEXT,
      reviewer_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS question_options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      option_key TEXT NOT NULL,
      option_en TEXT NOT NULL,
      option_hi TEXT,
      is_correct INTEGER DEFAULT 0
    );

    -- MOCK TEST ENGINE
    CREATE TABLE IF NOT EXISTS mock_tests (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      test_type TEXT DEFAULT 'full_mock' CHECK(test_type IN ('full_mock', 'sectional', 'pyq', 'daily_quiz')),
      duration_minutes INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      total_marks REAL NOT NULL,
      passing_marks REAL DEFAULT 0.0,
      negative_marking REAL DEFAULT 0.25,
      is_free INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      review_available INTEGER DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS test_sections (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      section_order INTEGER DEFAULT 1,
      duration_minutes INTEGER,
      total_questions INTEGER DEFAULT 0,
      max_marks REAL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS test_questions (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
      section_id TEXT REFERENCES test_sections(id) ON DELETE SET NULL,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      question_order INTEGER NOT NULL,
      marks REAL DEFAULT 1.0,
      negative_marks REAL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS test_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      test_id TEXT NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      server_deadline TEXT NOT NULL,
      submitted_at TEXT,
      time_taken_seconds INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'submitted', 'abandoned', 'expired')),
      total_score REAL DEFAULT 0.0,
      max_marks REAL DEFAULT 0.0,
      accuracy REAL DEFAULT 0.0,
      correct_count INTEGER DEFAULT 0,
      incorrect_count INTEGER DEFAULT 0,
      unattempted_count INTEGER DEFAULT 0,
      percentile REAL DEFAULT 0.0,
      rank INTEGER DEFAULT 1,
      rules_snapshot_json TEXT
    );

    CREATE TABLE IF NOT EXISTS student_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_option TEXT,
      numerical_answer TEXT,
      status TEXT DEFAULT 'not_visited' CHECK(status IN ('not_visited', 'not_answered', 'answered', 'marked_for_review', 'answered_and_marked')),
      time_spent_seconds INTEGER DEFAULT 0,
      is_correct INTEGER DEFAULT 0,
      marks_awarded REAL DEFAULT 0.0,
      saved_at TEXT NOT NULL
    );

    -- DIGITAL LIBRARY & MATERIALS
    CREATE TABLE IF NOT EXISTS study_materials (
      id TEXT PRIMARY KEY,
      exam_id TEXT REFERENCES examinations(id) ON DELETE SET NULL,
      subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
      chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
      topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      file_size_mb REAL DEFAULT 1.5,
      file_type TEXT DEFAULT 'pdf',
      access_level TEXT DEFAULT 'free' CHECK(access_level IN ('free', 'premium')),
      language TEXT DEFAULT 'both',
      author TEXT DEFAULT 'CYBEROSH Academic Cell',
      downloads_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS model_papers (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      paper_name TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 120,
      max_marks REAL DEFAULT 100,
      total_questions INTEGER DEFAULT 100,
      negative_marking_ratio REAL DEFAULT 0.25,
      paper_type TEXT DEFAULT 'pyq' CHECK(paper_type IN ('pyq', 'model')),
      pdf_url TEXT,
      answer_key_url TEXT,
      solutions_json TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- MONETIZATION & ENTITLEMENTS
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      price_inr REAL NOT NULL,
      duration_days INTEGER NOT NULL,
      exam_access_type TEXT DEFAULT 'all' CHECK(exam_access_type IN ('all', 'category', 'single_exam')),
      target_exam_ids_json TEXT,
      features_json TEXT,
      is_popular INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
      order_id TEXT UNIQUE NOT NULL,
      payment_id TEXT,
      signature TEXT,
      amount_inr REAL NOT NULL,
      status TEXT DEFAULT 'created' CHECK(status IN ('created', 'success', 'failed', 'refunded')),
      method TEXT DEFAULT 'UPI / Razorpay',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entitlements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
      exam_id TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_percent REAL NOT NULL,
      max_discount_inr REAL DEFAULT 500,
      valid_until TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- DAILY QUIZ & CURRENT AFFAIRS
    CREATE TABLE IF NOT EXISTS daily_quizzes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      total_questions INTEGER DEFAULT 10,
      duration_minutes INTEGER DEFAULT 15,
      questions_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS current_affairs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT,
      tags TEXT,
      language TEXT DEFAULT 'both',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL CHECK(item_type IN ('material', 'paper', 'question')),
      item_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL
    );

    -- INDEXES for fast retrieval
    CREATE INDEX IF NOT EXISTS idx_exams_slug ON examinations(slug);
    CREATE INDEX IF NOT EXISTS idx_exams_category ON examinations(category_id);
    CREATE INDEX IF NOT EXISTS idx_tests_exam ON mock_tests(exam_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON test_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_test ON test_attempts(test_id);
    CREATE INDEX IF NOT EXISTS idx_answers_attempt ON student_answers(attempt_id);
    CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
    CREATE INDEX IF NOT EXISTS idx_materials_exam ON study_materials(exam_id);
    CREATE INDEX IF NOT EXISTS idx_test_questions_test ON test_questions(test_id, question_order);
    CREATE INDEX IF NOT EXISTS idx_test_sections_test ON test_sections(test_id, section_order);
    CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_user_test_status ON test_attempts(user_id, test_id, status);
    CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id, item_type, item_id);
    CREATE INDEX IF NOT EXISTS idx_current_affairs_date ON current_affairs(date);
  `);
}
