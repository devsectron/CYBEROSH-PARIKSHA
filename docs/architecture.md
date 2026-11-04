# CYBEROSH PARIKSHA – System Architecture

## 1. Architectural Overview

CYBEROSH PARIKSHA is an enterprise-grade, high-concurrency online examination preparation and EdTech ecosystem engineered specifically for Indian competitive examinations (with deep specialization in Bihar exams like Bihar STET, BPSC TRE, BPSC CCE, Bihar Police, along with All-India exams: JEE Main, NEET UG, CTET, Banking IBPS/SBI, Railway RRB, and SSC).

The system is constructed as a modular monolithic architecture with clean boundary separation:
- **Presentation Layer**: React 19, TypeScript, Tailwind CSS v4, Lucide icons, responsive CBT interfaces designed according to NTA/TCS iON CBT examination standards.
- **Application & API Layer**: Express REST APIs (`/api/v1/...`), Zod schema validation, JWT-based role authentication, server-authoritative test session manager, automated evaluation and negative marking engine.
- **Persistence Layer**: Relational Database (`better-sqlite3` in development/embedded, with full schema parity for PostgreSQL/Cloud SQL in high-scale cloud deployments), WAL mode, strict foreign key constraints, historical question versioning, and immutable test attempt snapshots.
- **Monetization Engine**: Razorpay payment order and webhook signature verification pipeline, coupon rules engine, granular exam entitlements.

```
                    +------------------------------------------+
                    |           Client Browser (Web/PWA)       |
                    |   (Hindi & English Multilingual Support) |
                    +--------------------+---------------------+
                                         |
                                  HTTPS / REST API
                                         |
                    +--------------------+---------------------+
                    |       Full-Stack Express API Server      |
                    |            (Port 3000 /api/v1)           |
                    +--------------------+---------------------+
                    |  - Auth & RBAC (JWT & Session Tokens)    |
                    |  - Server-Authoritative CBT Exam Engine  |
                    |  - Exam & Question Bank Management       |
                    |  - Digital Library & Study Materials     |
                    |  - Razorpay Payment Verification         |
                    |  - Student Performance Analytics Engine  |
                    |  - Audit Logging & Publishing Workflow   |
                    +--------------------+---------------------+
                                         |
                         +---------------+---------------+
                         |                               |
          +--------------+---------------+  +------------+------------+
          | Relational Database Engine   |  | Private Storage Layer   |
          | (ACID SQLite / PostgreSQL)   |  | (Local / S3 Bucket)     |
          | - WAL Mode, Foreign Keys     |  | - PDF Notes, PYQs       |
          | - Immutable Attempt Records  |  | - Question Diagrams     |
          +------------------------------+  +-------------------------+
```

## 2. Server-Authoritative CBT Test Engine

A core engineering priority is the protection against client-side tampering, network drops, and timer manipulation:

1. **Server Start & Strict Deadlines**: When a student clicks "Start Test", the backend assigns `started_at` and `server_deadline = started_at + duration_minutes + grace_period`. The client timer is synced to this server timestamp.
2. **Answer Persistence (Autosave)**: Every answer selection, mark for review, or clearance emits an asynchronous request to `/api/v1/attempts/:id/answers`. The server validates that `now() <= server_deadline` before persisting.
3. **Recovery After Refresh**: If a student accidentally reloads the browser, closes the tab, or loses internet connection temporarily, reconnecting restores the exact saved answers and the remaining server time.
4. **Authoritative Evaluation**: Question answer keys and explanations are NEVER delivered to the client during an active test. Scoring occurs exclusively on the server upon submission using the examination's specific marking rules (e.g. +4 / -1 for JEE, +1 / 0 for STET, +1 / -0.25 for SSC/Banking).

## 3. Multilingual Infrastructure

All examinations, questions, options, instructions, and study materials support dual-language representation (English and Hindi). Students can toggle language in real time on any question or page without losing progress.

## 4. Role-Based Access Control (RBAC)

Supported Roles:
- `super_admin`: Full system control, financial logs, system settings.
- `admin`: Examination configurations, mock tests, student management.
- `content_manager`: Study materials, model papers, syllabus management.
- `question_creator`: Drafts questions and sets options.
- `reviewer`: Reviews drafted questions, approves or rejects with comments.
- `student`: Accesses study materials, attempts tests, reviews results, purchases plans.
