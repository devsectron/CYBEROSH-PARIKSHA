# CYBEROSH PARIKSHA – Deployment & Operations Guide

## 1. Environment Configuration

Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Key environment settings:
- `PORT`: 3000
- `NODE_ENV`: production (or development)
- `JWT_SECRET`: 64-char random hex string
- `DATABASE_PATH`: `./data/cyberosh_pariksha.db`
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret

## 2. Build & Run

### Development Mode
```bash
npm run dev
# Starts Express API server with integrated Vite middleware on http://localhost:3000
```

### Production Build & Launch
```bash
npm run build
npm start
# Builds Vite client to dist/, and Express serves dist/ along with /api/v1 REST routes
```

## 3. Database Maintenance & Backups

SQLite with WAL mode provides fast read-write concurrency:
- **Backup Command**:
  ```bash
  sqlite3 data/cyberosh_pariksha.db ".backup data/cyberosh_backup_$(date +%Y%m%d_%H%M%S).db"
  ```
- **Automated Cron**: Schedule daily snapshot rotations to cloud object storage (e.g. S3 / GCS).
- **PostgreSQL Migration**: The SQL schemas and types map 1:1 to PostgreSQL or Supabase when migrating to a managed multi-node cluster.

## 4. Default Credentials (Seeded for Initial Setup)
- **Super Administrator**:
  - Email: `admin@cyberoshpariksha.in`
  - Password: `Admin@123`
- **Demo Student**:
  - Email: `student@cyberoshpariksha.in`
  - Password: `Student@123`
*(Note: Change passwords immediately in production via the profile settings).*
