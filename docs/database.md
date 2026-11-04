# CYBEROSH PARIKSHA – Database Schema & Architecture

The platform supports both a high-performance normalized relational architecture and a provisioned **Google Cloud Firebase Firestore** cloud backend with **Firebase Authentication**, enabling real-time test autosave, secure role-based rules, and cloud persistence.

## Firebase Firestore Architecture (Cloud Backend)
Provisioned Project: `dependable-tempest-zpthm`  
Firestore Database: `ai-studio-cyberoshpariksha-029369ac-0170-49af-8821-58bd1fd5af3c`

### Primary Firestore Collections:
1. **`users/{userId}`**: User profile, role (`student`, `admin`, `super_admin`), entitlements, phone, created timestamp.
2. **`exam_categories/{categoryId}`**: Competitive exam groupings (Engineering, Medical, Bihar Govt, Teaching, SSC, Banking, Railways).
3. **`examinations/{examId}`**: Specific exams (Bihar STET, BPSC TRE, NEET UG, JEE Main, SSC CGL, IBPS PO, RRB NTPC) with eligibility, pattern, and syllabus.
4. **`questions/{questionId}`**: Bilingual questions (Hindi & English), markdown/LaTeX equations, options array, difficulty, detailed explanations.
5. **`mock_tests/{testId}`**: Full-length tests, sectional tests, and PYQs with section definitions, negative marking rules, passing marks, and duration.
6. **`test_attempts/{attemptId}`**: Active test sessions with server deadline, client responses, autosave checkpoints, final scores, accuracy, and percentile.
7. **`study_materials/{materialId}`**: Formula sheets, high-yield notes, and revision capsules with PDF attachments.
8. **`model_papers/{paperId}`**: Solved previous year papers and predicted question papers.
9. **`subscription_plans/{planId}`**: Pricing packages (Free Starter, Bihar Special Pass, All India Pro, Lifetime).
10. **`entitlements/{entitlementId}`**: Access rights mapped to user IDs with expiration dates.
11. **`current_affairs/{itemId}`**: Daily GK updates, Bihar special digests, and one-liner summaries.
- **`student_profiles`**:
  - `user_id` (TEXT PRIMARY KEY REFERENCES users(id))
  - `target_exam_id` (TEXT)
  - `category` (TEXT) - General, OBC, EBC, SC, ST, EWS
  - `state` (TEXT DEFAULT 'Bihar')
  - `city` (TEXT)
  - `preparation_year` (INTEGER)
  - `streak_days` (INTEGER DEFAULT 0)
  - `last_active_date` (TEXT)

### EXAMINATION HIERARCHY
- **`exam_categories`**:
  - `id` (TEXT PRIMARY KEY), `name` (TEXT), `slug` (TEXT UNIQUE), `description` (TEXT), `icon` (TEXT), `display_order` (INTEGER), `is_active` (INTEGER)
- **`examinations`**:
  - `id` (TEXT PRIMARY KEY), `category_id` (TEXT REFERENCES exam_categories(id)), `name` (TEXT), `slug` (TEXT UNIQUE), `full_name` (TEXT), `eligibility` (TEXT), `frequency` (TEXT), `conducting_body` (TEXT), `official_website` (TEXT), `description` (TEXT), `syllabus_json` (TEXT), `pattern_json` (TEXT), `is_featured` (INTEGER), `is_active` (INTEGER), `display_order` (INTEGER)
- **`subjects`**:
  - `id` (TEXT PRIMARY KEY), `exam_id` (TEXT REFERENCES examinations(id)), `name` (TEXT), `code` (TEXT), `description` (TEXT), `display_order` (INTEGER)
- **`chapters`**:
  - `id` (TEXT PRIMARY KEY), `subject_id` (TEXT REFERENCES subjects(id)), `name` (TEXT), `chapter_no` (INTEGER)
- **`topics`**:
  - `id` (TEXT PRIMARY KEY), `chapter_id` (TEXT REFERENCES chapters(id)), `name` (TEXT)

### QUESTION BANK
- **`questions`**:
  - `id` (TEXT PRIMARY KEY)
  - `category_id` (TEXT), `exam_id` (TEXT), `subject_id` (TEXT), `chapter_id` (TEXT), `topic_id` (TEXT)
  - `question_type` (TEXT) - `single_mcq`, `multi_mcq`, `numerical`, `assertion_reason`, `match_following`
  - `difficulty` (TEXT) - `easy`, `medium`, `hard`
  - `marks` (REAL DEFAULT 1.0), `negative_marks` (REAL DEFAULT 0.0)
  - `question_en` (TEXT NOT NULL), `question_hi` (TEXT)
  - `image_url` (TEXT)
  - `correct_answer` (TEXT NOT NULL)
  - `solution_en` (TEXT), `solution_hi` (TEXT)
  - `status` (TEXT DEFAULT 'published') - `draft`, `review`, `approved`, `published`, `archived`
  - `created_by` (TEXT), `reviewer_id` (TEXT), `created_at` (TEXT)
- **`question_options`**:
  - `id` (TEXT PRIMARY KEY), `question_id` (TEXT REFERENCES questions(id)), `option_key` (TEXT) - A, B, C, D, `option_en` (TEXT), `option_hi` (TEXT), `is_correct` (INTEGER)

### EXAMINATION ENGINE & ATTEMPTS
- **`mock_tests`**:
  - `id` (TEXT PRIMARY KEY), `exam_id` (TEXT REFERENCES examinations(id)), `title` (TEXT), `slug` (TEXT UNIQUE), `description` (TEXT), `test_type` (TEXT) - `full_mock`, `sectional`, `pyq`, `daily_quiz`, `duration_minutes` (INTEGER), `total_questions` (INTEGER), `total_marks` (REAL), `passing_marks` (REAL), `negative_marking` (REAL), `is_free` (INTEGER), `is_published` (INTEGER), `review_available` (INTEGER), `start_date` (TEXT), `end_date` (TEXT), `created_at` (TEXT)
- **`test_sections`**:
  - `id` (TEXT PRIMARY KEY), `test_id` (TEXT REFERENCES mock_tests(id)), `name` (TEXT), `section_order` (INTEGER), `duration_minutes` (INTEGER), `total_questions` (INTEGER), `max_marks` (REAL)
- **`test_questions`**:
  - `id` (TEXT PRIMARY KEY), `test_id` (TEXT REFERENCES mock_tests(id)), `section_id` (TEXT REFERENCES test_sections(id)), `question_id` (TEXT REFERENCES questions(id)), `question_order` (INTEGER), `marks` (REAL), `negative_marks` (REAL)
- **`test_attempts`**:
  - `id` (TEXT PRIMARY KEY), `user_id` (TEXT REFERENCES users(id)), `test_id` (TEXT REFERENCES mock_tests(id)), `started_at` (TEXT), `server_deadline` (TEXT), `submitted_at` (TEXT), `time_taken_seconds` (INTEGER), `status` (TEXT) - `in_progress`, `submitted`, `abandoned`, `expired`, `total_score` (REAL), `max_marks` (REAL), `accuracy` (REAL), `correct_count` (INTEGER), `incorrect_count` (INTEGER), `unattempted_count` (INTEGER), `percentile` (REAL), `rank` (INTEGER), `rules_snapshot_json` (TEXT)
- **`student_answers`**:
  - `id` (TEXT PRIMARY KEY), `attempt_id` (TEXT REFERENCES test_attempts(id)), `question_id` (TEXT REFERENCES questions(id)), `selected_option` (TEXT), `numerical_answer` (TEXT), `status` (TEXT) - `answered`, `marked_for_review`, `answered_and_marked`, `not_answered`, `time_spent_seconds` (INTEGER), `is_correct` (INTEGER), `marks_awarded` (REAL), `saved_at` (TEXT)

### CONTENT & DIGITAL LIBRARY
- **`study_materials`**:
  - `id` (TEXT PRIMARY KEY), `exam_id` (TEXT), `subject_id` (TEXT), `chapter_id` (TEXT), `topic_id` (TEXT), `title` (TEXT), `description` (TEXT), `file_url` (TEXT), `file_size_mb` (REAL), `file_type` (TEXT), `access_level` (TEXT) - `free`, `premium`, `language` (TEXT), `author` (TEXT), `downloads_count` (INTEGER), `created_at` (TEXT)
- **`model_papers`**:
  - `id` (TEXT PRIMARY KEY), `exam_id` (TEXT), `year` (INTEGER), `paper_name` (TEXT), `duration_minutes` (INTEGER), `max_marks` (REAL), `total_questions` (INTEGER), `negative_marking_ratio` (REAL), `paper_type` (TEXT) - `pyq`, `model`, `pdf_url` (TEXT), `answer_key_url` (TEXT), `solutions_json` (TEXT), `is_active` (INTEGER)

### MONETIZATION & ENTITLEMENTS
- **`subscription_plans`**:
  - `id` (TEXT PRIMARY KEY), `name` (TEXT), `code` (TEXT UNIQUE), `description` (TEXT), `price_inr` (REAL), `duration_days` (INTEGER), `exam_access_type` (TEXT) - `all`, `category`, `single_exam`, `target_exam_ids_json` (TEXT), `features_json` (TEXT), `is_popular` (INTEGER), `is_active` (INTEGER)
- **`payments`**:
  - `id` (TEXT PRIMARY KEY), `user_id` (TEXT), `plan_id` (TEXT), `order_id` (TEXT UNIQUE), `payment_id` (TEXT), `signature` (TEXT), `amount_inr` (REAL), `status` (TEXT) - `created`, `success`, `failed`, `refunded`, `method` (TEXT), `created_at` (TEXT)
- **`entitlements`**:
  - `id` (TEXT PRIMARY KEY), `user_id` (TEXT), `plan_id` (TEXT), `exam_id` (TEXT), `start_date` (TEXT), `end_date` (TEXT), `is_active` (INTEGER)
- **`coupons`**:
  - `id` (TEXT PRIMARY KEY), `code` (TEXT UNIQUE), `discount_percent` (REAL), `max_discount_inr` (REAL), `valid_until` (TEXT), `is_active` (INTEGER)

### AUXILIARY & OPERATIONS
- **`bookmarks`**: `id`, `user_id`, `item_type`, `item_id`, `created_at`
- **`daily_quizzes`**: `id`, `date`, `title`, `category`, `total_questions`, `duration_minutes`, `questions_json`
- **`current_affairs`**: `id`, `date`, `title`, `category`, `summary`, `content`, `source`, `tags`, `language`, `created_at`
- **`audit_logs`**: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `details_json`, `created_at`
- **`notifications`**: `id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`
