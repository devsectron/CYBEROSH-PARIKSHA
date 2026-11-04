# CYBEROSH PARIKSHA – REST API Reference

All application endpoints are versioned under `/api/v1/`.

## 1. Authentication & User Profile
- `POST /api/v1/auth/register`: Create a new student account. Body: `{ email, password, full_name, phone, target_exam_id }`.
- `POST /api/v1/auth/login`: Authenticate user. Body: `{ email, password }`. Returns JWT token, user object & active entitlements.
- `GET /api/v1/auth/me`: Retrieve current authenticated profile with permissions and subscription entitlements.
- `POST /api/v1/auth/update-profile`: Update student target exam, state, category, or notification preferences.

## 2. Examinations & Taxonomy
- `GET /api/v1/exams/categories`: List all active examination categories with counts.
- `GET /api/v1/exams`: List all examinations (filters: `category_id`, `featured`, `search`).
- `GET /api/v1/exams/:slug`: Get complete examination details, syllabus breakdown, pattern, and available tests/materials.
- `GET /api/v1/exams/:id/subjects`: List subjects, chapters, and topics for an examination.

## 3. Mock Test Engine & CBT Attempts
- `GET /api/v1/tests`: List mock tests (filters: `exam_id`, `type`, `free_only`).
- `GET /api/v1/tests/:id`: Get test overview, rules, instructions, sections, and start requirements.
- `POST /api/v1/attempts/start`: Initiate a test attempt.
  - Server sets immutable `started_at` and `server_deadline`.
  - Freezes rules snapshot.
  - Returns test questions (WITHOUT answer keys).
- `POST /api/v1/attempts/:id/answers`: Autosave student answer.
  - Body: `{ question_id, selected_option, numerical_answer, status, time_spent_seconds }`.
  - Validates `server_deadline`. Rejects if time expired or already submitted.
- `POST /api/v1/attempts/:id/submit`: Evaluate test attempt on server.
  - Calculates correct, incorrect, unattempted, total marks with negative marking penalty.
  - Calculates percentile and rank against peers.
  - Returns instant score summary.
- `GET /api/v1/attempts/:id/result`: Retrieve comprehensive post-test review.
  - Returns question-by-question analysis, student answer vs correct answer, and Hindi/English detailed solution.
- `GET /api/v1/attempts/my-history`: Get student's past attempts with scores and accuracy.

## 4. Digital Library & Model Papers
- `GET /api/v1/materials`: Search and filter study notes/PDFs by exam, subject, language, access level.
- `GET /api/v1/materials/:id/download`: Authorized download link validation (enforces free vs premium access).
- `GET /api/v1/papers`: List model papers and previous year papers (PYQs).

## 5. Daily Quizzes & Current Affairs
- `GET /api/v1/daily-quiz`: Today's practice quiz by category.
- `POST /api/v1/daily-quiz/submit`: Submit quiz responses and receive instant explanation + streak updates.
- `GET /api/v1/current-affairs`: Daily and monthly current affairs updates with Bihar GK spotlight.

## 6. Monetization & Razorpay Integration
- `GET /api/v1/plans`: List subscription plans and pricing.
- `POST /api/v1/payments/create-order`: Create server-side Razorpay order. Body: `{ plan_id, coupon_code }`.
- `POST /api/v1/payments/verify`: Verify Razorpay signature (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`).
  - Activates student entitlement upon cryptographic HMAC SHA256 signature verification.
- `POST /api/v1/coupons/validate`: Check coupon discount validity.

## 7. Admin & Operations
- `GET /api/v1/admin/analytics`: Platform KPIs (total users, tests taken, active subscriptions, revenue).
- `POST /api/v1/admin/exams`: Create / update examination configuration.
- `POST /api/v1/admin/questions`: Add single question with bilingual content and options.
- `POST /api/v1/admin/questions/bulk-import`: Validate and batch insert questions from JSON/CSV payload.
- `POST /api/v1/admin/tests`: Create new mock test with sections and questions.
- `GET /api/v1/admin/audit-logs`: View system activity audit trail.
