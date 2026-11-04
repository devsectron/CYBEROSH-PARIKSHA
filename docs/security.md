# CYBEROSH PARIKSHA – Security Architecture & Implementation

Security-by-design is enforced across all layers of the application.

## 1. Authentication & Session Security
- **Password Protection**: Passwords hashed using standard `bcrypt` with work factor 10.
- **JWT Protection**: Signed using `HS256` with strong secret. Encodes user ID and role. Verified on every protected API call.
- **Role Verification**: Middleware validates that privileged routes (`/admin/*`) strictly reject non-admin roles (403 Forbidden).

## 2. CBT Examination Integrity Protection
- **No Client-Side Answer Leakage**: The `/api/v1/attempts/start` endpoint strictly removes `correct_answer`, `is_correct`, `solution_en`, and `solution_hi` fields from the delivered question payload.
- **Server Authoritative Timer**: Deadlines are computed and enforced on the server. If an answer autosave or submission arrives after `server_deadline + 15s grace`, the submission is rejected or locked.
- **Idempotent Submission**: Multiple rapid clicks on "Submit Test" are handled idempotently. Once an attempt status transitions to `submitted`, further modifications to answers are blocked.
- **Cross-User Isolation**: Every attempt action validates `attempt.user_id === current_user.id`. Students cannot read or manipulate another student's test session.

## 3. Financial & Payment Security
- **HMAC SHA-256 Signature Verification**: Payment confirmations are validated using Razorpay's cryptographic verification:
  ```ts
  crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(orderId + "|" + paymentId)
        .digest('hex') === signature
  ```
- **Server-Side Pricing**: Order amount is looked up from the database plan record, not taken from client parameters.
- **Granular Entitlements**: Plans define specific exam access permissions (`all`, `category`, or `single_exam`). Premium checks verify actual active entitlements before unlocking tests or notes.

## 4. Input Sanitization & Audit Trails
- **SQL Injection Prevention**: Parameterized queries via `better-sqlite3` prepared statements (`db.prepare(...)`).
- **Comprehensive Audit Trail**: Privileged actions (creating exams, publishing tests, altering user status) are logged to the `audit_logs` table with actor ID, timestamp, and metadata.
