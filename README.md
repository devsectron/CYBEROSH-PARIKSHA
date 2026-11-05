# CYBEROSH PARIKSHA
> **"Prepare Smart. Practice More. Succeed."**  
> Complete Production-Ready Online Examination Preparation & EdTech Ecosystem

CYBEROSH PARIKSHA is a comprehensive EdTech platform designed for competitive examinations across India, with specialized focus on Bihar (Bihar STET, BPSC TRE, BPSC CCE, Bihar Police) alongside national exams (JEE Main, NEET UG, CTET, IBPS, SBI, RRB NTPC/Group D, SSC CGL/CHSL, NDA, CUET).

## Core Features

1. **PARIKSHA TEST – Online CBT Engine**:
   - Server-authoritative timer, deadline protection, and state recovery.
   - Autosave of answers and review statuses.
   - 5 color-coded question palette states (Answered, Not Answered, Not Visited, Marked for Review, Answered & Marked).
   - Real-time English & Hindi bilingual toggling per question.
   - Comprehensive result analytics with subject-wise breakdown, negative mark deductions, percentiles, and solutions review.

2. **PARIKSHA LIBRARY & PAPERS**:
   - Digital repository of notes, formula sheets, syllabus guides, and chapter notes.
   - Year-wise previous year question papers (PYQs) and model papers with answer keys.

3. **PARIKSHA QUIZ & CURRENT AFFAIRS**:
   - Daily quizzes for GK, Reasoning, Math, English, and Bihar GK.
   - Current affairs digest and daily preparation streak tracking.

4. **ADMINISTRATION & QUESTION BANK**:
   - Centralized question bank with publishing workflow (Draft -> Review -> Approved -> Published).
   - Bulk question import (JSON / CSV).
   - Dynamic examination and subject management.
   - Test scheduler and section configurator.
   - Audit trail of administrative actions.

5. **MONETIZATION & RAZORPAY INTEGRATION**:
   - Flexible freemium plans (Monthly, Quarterly, Annual, Exam Pass).
   - Coupon discount engine (`BIHAR50`, `WELCOME20`), priced and validated on the server.
   - Strict HMAC-SHA256 signature verification, idempotent verification and replay protection.

## Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- **Backend**: Node.js, Express REST API (`/api/v1/...`), Zod validation, JWT authentication.
- **Database**: Relational SQLite (`better-sqlite3` with WAL mode & strict constraints).
- **Payment Gateway**: Razorpay (Sandbox & Production ready).

## Quick Start
```bash
# Install dependencies
npm install

# Start development full-stack server
npm run dev

# Open in browser at port 3000
http://localhost:3000
```

## Seed Credentials (development only)
- **Admin**: `admin@cyberoshpariksha.in` / `Admin@123`
- **Student**: `student@cyberoshpariksha.in` / `Student@123`

In production (`NODE_ENV=production`) these defaults are **not** used: set `SEED_ADMIN_PASSWORD` / `SEED_STUDENT_PASSWORD`,
or a random password is generated and printed once in the server log on first start.

## Production checklist
1. `JWT_SECRET` set to a random string of 32+ characters (the server refuses to start otherwise).
2. Real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` set, or payments stay disabled. The simulated checkout is development-only.
3. `TRUST_PROXY` set to the number of reverse proxies in front of the app.
4. Deploy `firestore.rules` (`firebase deploy --only firestore:rules`).
5. `npm run build`, then `NODE_ENV=production npm start`.

## Testing
`npm run lint` type-checks the project; `npm test` runs the unit checks and the API integration suite (real routes, in-memory database).
