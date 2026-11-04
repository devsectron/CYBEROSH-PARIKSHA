export type UserRole = 'super_admin' | 'admin' | 'content_manager' | 'question_creator' | 'reviewer' | 'student';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  avatar_url?: string;
  target_exam_id?: string;
  category?: string;
  state?: string;
  city?: string;
  preparation_year?: number;
  streak_days?: number;
}

export interface Entitlement {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_code: string;
  exam_id?: string;
  start_date: string;
  end_date: string;
  is_active: number;
}

export interface ExamCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  exam_count?: number;
}

export interface Examination {
  id: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  name: string;
  slug: string;
  full_name: string;
  eligibility?: string;
  frequency?: string;
  conducting_body?: string;
  official_website?: string;
  description: string;
  syllabus_json?: string;
  pattern_json?: string;
  syllabus?: any;
  pattern?: any;
  is_featured: number;
  is_active: number;
  display_order: number;
  test_count?: number;
  material_count?: number;
  paper_count?: number;
}

export interface Subject {
  id: string;
  exam_id: string;
  name: string;
  code?: string;
  description?: string;
  display_order: number;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  chapter_no: number;
  description?: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_key: string;
  option_en: string;
  option_hi?: string;
  is_correct?: number;
}

export interface Question {
  id: string;
  category_id?: string;
  exam_id?: string;
  exam_name?: string;
  subject_id?: string;
  subject_name?: string;
  chapter_id?: string;
  topic_id?: string;
  question_type: 'single_mcq' | 'multi_mcq' | 'numerical' | 'assertion_reason' | 'match_following';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negative_marks: number;
  question_en: string;
  question_hi?: string;
  image_url?: string;
  correct_answer?: string;
  solution_en?: string;
  solution_hi?: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  options?: QuestionOption[];
  question_order?: number;
  section_id?: string;
  test_id?: string;
}

export interface TestSection {
  id: string;
  test_id: string;
  name: string;
  section_order: number;
  duration_minutes?: number;
  total_questions: number;
  max_marks: number;
}

export interface MockTest {
  id: string;
  exam_id: string;
  exam_name?: string;
  exam_slug?: string;
  category_name?: string;
  title: string;
  slug: string;
  description: string;
  test_type: 'full_mock' | 'sectional' | 'pyq' | 'daily_quiz';
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  passing_marks: number;
  negative_marking: number;
  is_free: number;
  is_published: number;
  review_available: number;
  total_attempts?: number;
  created_at: string;
}

export interface SavedAnswer {
  question_id: string;
  selected_option?: string;
  numerical_answer?: string;
  status: 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_and_marked';
  time_spent_seconds: number;
}

export interface TestAttempt {
  id: string;
  user_id: string;
  test_id: string;
  test_title?: string;
  exam_name?: string;
  started_at: string;
  server_deadline: string;
  submitted_at?: string;
  time_taken_seconds: number;
  status: 'in_progress' | 'submitted' | 'abandoned' | 'expired';
  total_score: number;
  max_marks: number;
  accuracy: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  percentile: number;
  rank: number;
  rules_snapshot_json?: string;
}

export interface SubjectBreakdown {
  subject: string;
  total_questions: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  accuracy: number;
}

export interface StudyMaterial {
  id: string;
  exam_id?: string;
  exam_name?: string;
  subject_id?: string;
  subject_name?: string;
  title: string;
  description: string;
  file_url: string;
  file_size_mb: number;
  file_type: string;
  access_level: 'free' | 'premium';
  language: string;
  author: string;
  downloads_count: number;
  created_at: string;
}

export interface ModelPaper {
  id: string;
  exam_id: string;
  exam_name?: string;
  exam_slug?: string;
  year: number;
  paper_name: string;
  duration_minutes: number;
  max_marks: number;
  total_questions: number;
  negative_marking_ratio: number;
  paper_type: 'pyq' | 'model';
  pdf_url?: string;
  answer_key_url?: string;
  subject_code?: string;
  description?: string;
  set_number?: number;
  has_full_solutions?: boolean;
  cbt_test_id?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string;
  price_inr: number;
  duration_days: number;
  exam_access_type: 'all' | 'category' | 'single_exam';
  features: string[];
  is_popular: number;
  is_active: number;
}

export interface CurrentAffairsItem {
  id: string;
  date: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  source?: string;
  tags?: string;
  language?: string;
}

export interface DailyQuizQuestion extends Question {
  options: QuestionOption[];
}
