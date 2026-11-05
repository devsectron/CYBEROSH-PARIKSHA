import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { newId, isUniqueConstraintError } from '../lib/util.js';
import { parseOrReject } from '../lib/validate.js';

export const authRouter = Router();

const DEFAULT_EXAM_ID = 'exam_bihar_stet';
const BCRYPT_ROUNDS = 10;

// Compared against when an email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const emailSchema = z
  .string({ error: 'Email is required.' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .max(254, 'Email is too long.')
  .email('Please enter a valid email address.');

// bcrypt only uses the first 72 bytes, so longer passwords add nothing and are rejected.
const newPasswordSchema = z
  .string({ error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.');

const registerSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
  full_name: z.string({ error: 'Full name is required.' }).trim().min(2, 'Full name is required.').max(100, 'Full name is too long.'),
  phone: z.string().trim().max(20, 'Phone number is too long.').optional().nullable(),
  target_exam_id: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(60).optional().nullable()
});

const loginSchema = z.object({
  email: z.string({ error: 'Email and password are required.' }).trim().toLowerCase().min(1, 'Email and password are required.'),
  password: z.string({ error: 'Email and password are required.' }).min(1, 'Email and password are required.').max(200)
});

const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required.').max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  target_exam_id: z.string().trim().max(100).optional().nullable(),
  category: z.string().trim().max(40).optional().nullable(),
  state: z.string().trim().max(60).optional().nullable(),
  city: z.string().trim().max(60).optional().nullable()
});

const changePasswordSchema = z.object({
  current_password: z.string({ error: 'Current password is required.' }).min(1, 'Current password is required.').max(200),
  new_password: newPasswordSchema
});

function activeEntitlements(userId: string, includeStart = false) {
  return db
    .prepare(
      `SELECT e.id, e.plan_id, e.exam_id, ${includeStart ? 'e.start_date,' : ''} e.end_date,
              p.name as plan_name, p.code as plan_code
         FROM entitlements e
         JOIN subscription_plans p ON e.plan_id = p.id
        WHERE e.user_id = ? AND e.is_active = 1 AND datetime(e.end_date) > datetime('now')`
    )
    .all(userId);
}

function examExists(examId: string | null | undefined): examId is string {
  if (!examId) return false;
  return Boolean(db.prepare('SELECT 1 FROM examinations WHERE id = ?').get(examId));
}

// POST /api/v1/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const body = parseOrReject(registerSchema, req.body, res);
    if (!body) return;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(body.email);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const userId = newId('usr');
    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    const now = new Date().toISOString();
    const targetExamId = examExists(body.target_exam_id) ? body.target_exam_id : DEFAULT_EXAM_ID;
    const state = body.state || 'Bihar';

    db.transaction(() => {
      db.prepare(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role, status, avatar_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'student', 'active', ?, ?, ?)`
      ).run(
        userId,
        body.email,
        passwordHash,
        body.full_name,
        body.phone || null,
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.full_name)}`,
        now,
        now
      );

      db.prepare(
        `INSERT INTO student_profiles (user_id, target_exam_id, state, last_active_date)
         VALUES (?, ?, ?, ?)`
      ).run(userId, targetExamId, state, now);
    })();

    const user = {
      id: userId,
      email: body.email,
      full_name: body.full_name,
      role: 'student',
      status: 'active'
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to CYBEROSH PARIKSHA.',
      token: generateToken(user),
      user: { ...user, target_exam_id: targetExamId, state }
    });
  } catch (err) {
    // Two simultaneous sign-ups with the same email: the UNIQUE constraint is the real guard.
    if (isUniqueConstraintError(err)) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const body = parseOrReject(loginSchema, req.body, res);
    if (!body) return;

    const user = db
      .prepare(
        `SELECT u.id, u.email, u.password_hash, u.full_name, u.phone, u.role, u.status, u.avatar_url,
                sp.target_exam_id, sp.category, sp.state, sp.city, sp.streak_days
           FROM users u
           LEFT JOIN student_profiles sp ON u.id = sp.user_id
          WHERE u.email = ?`
      )
      .get(body.email) as any;

    const passwordOk = await bcrypt.compare(body.password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !passwordOk) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    // Only reveal account status once the caller has proven they know the password.
    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, full_name: user.full_name });
    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
      entitlements: activeEntitlements(user.id)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/v1/auth/me
authRouter.get('/me', authenticate, (req: Request, res: Response) => {
  try {
    const user = db
      .prepare(
        `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.status, u.avatar_url, u.created_at,
                sp.target_exam_id, sp.category, sp.state, sp.city, sp.preparation_year, sp.streak_days, sp.last_active_date
           FROM users u
           LEFT JOIN student_profiles sp ON u.id = sp.user_id
          WHERE u.id = ?`
      )
      .get(req.user!.id) as any;

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({ success: true, user, entitlements: activeEntitlements(user.id, true) });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch current user profile.' });
  }
});

// POST /api/v1/auth/update-profile  (partial update: omitted fields keep their current value)
authRouter.post('/update-profile', authenticate, (req: Request, res: Response) => {
  try {
    const body = parseOrReject(updateProfileSchema, req.body, res);
    if (!body) return;

    const userId = req.user!.id;
    const now = new Date().toISOString();

    const currentUser = db.prepare('SELECT full_name, phone FROM users WHERE id = ?').get(userId) as { full_name: string; phone: string | null };
    const currentProfile = db
      .prepare('SELECT target_exam_id, category, state, city FROM student_profiles WHERE user_id = ?')
      .get(userId) as { target_exam_id: string | null; category: string | null; state: string | null; city: string | null } | undefined;

    const targetExamId =
      body.target_exam_id === undefined
        ? currentProfile?.target_exam_id ?? DEFAULT_EXAM_ID
        : examExists(body.target_exam_id)
          ? body.target_exam_id
          : (currentProfile?.target_exam_id ?? DEFAULT_EXAM_ID);

    db.transaction(() => {
      db.prepare('UPDATE users SET full_name = ?, phone = ?, updated_at = ? WHERE id = ?').run(
        body.full_name ?? currentUser.full_name,
        body.phone === undefined ? currentUser.phone : body.phone || null,
        now,
        userId
      );

      // last_active_date is deliberately not touched here: it drives the study streak, and
      // editing a profile is not study activity.
      db.prepare(
        `INSERT INTO student_profiles (user_id, target_exam_id, category, state, city)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           target_exam_id = excluded.target_exam_id,
           category = excluded.category,
           state = excluded.state,
           city = excluded.city`
      ).run(
        userId,
        targetExamId,
        body.category === undefined ? currentProfile?.category ?? 'General' : body.category || 'General',
        body.state === undefined ? currentProfile?.state ?? 'Bihar' : body.state || 'Bihar',
        body.city === undefined ? currentProfile?.city ?? 'Patna' : body.city || 'Patna'
      );
    })();

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// POST /api/v1/auth/change-password
authRouter.post('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const body = parseOrReject(changePasswordSchema, req.body, res);
    if (!body) return;

    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as { password_hash: string } | undefined;
    if (!row || !(await bcrypt.compare(body.current_password, row.password_hash))) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    if (body.current_password === body.new_password) {
      res.status(400).json({ success: false, message: 'New password must be different from the current password.' });
      return;
    }

    const hash = await bcrypt.hash(body.new_password, BCRYPT_ROUNDS);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hash, new Date().toISOString(), req.user!.id);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});
