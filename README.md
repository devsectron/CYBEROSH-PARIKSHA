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
   - Coupon discount engine (`BIHAR50`, `WELCOME20`).
   - Secure server-side signature verification.

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

## Seed Credentials
- **Admin**: `admin@cyberoshpariksha.in` / `Admin@123`
- **Student**: `student@cyberoshpariksha.in` / `Student@123`
