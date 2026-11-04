import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, authenticate } from '../middleware/auth.js';

export const authRouter = Router();

// POST /api/v1/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, full_name, phone, target_exam_id, state } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ success: false, message: 'Email, password, and full name are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, phone, role, status, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'student', 'active', ?, ?, ?)
    `).run(
      userId,
      email.toLowerCase().trim(),
      passwordHash,
      full_name.trim(),
      phone || null,
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`,
      now,
      now
    );

    db.prepare(`
      INSERT INTO student_profiles (user_id, target_exam_id, state, last_active_date)
      VALUES (?, ?, ?, ?)
    `).run(userId, target_exam_id || 'exam_bihar_stet', state || 'Bihar', now);

    const user = {
      id: userId,
      email: email.toLowerCase().trim(),
      full_name: full_name.trim(),
      role: 'student',
      status: 'active'
    };

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to CYBEROSH PARIKSHA.',
      token,
      user: {
        ...user,
        target_exam_id: target_exam_id || 'exam_bihar_stet',
        state: state || 'Bihar'
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = db.prepare(`
      SELECT u.id, u.email, u.password_hash, u.full_name, u.phone, u.role, u.status, u.avatar_url,
             sp.target_exam_id, sp.category, sp.state, sp.city, sp.streak_days
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.email = ?
    `).get(email.toLowerCase().trim()) as any;

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    // Fetch active entitlements
    const entitlements = db.prepare(`
      SELECT e.id, e.plan_id, e.exam_id, e.end_date, p.name as plan_name, p.code as plan_code
      FROM entitlements e
      JOIN subscription_plans p ON e.plan_id = p.id
      WHERE e.user_id = ? AND e.is_active = 1 AND datetime(e.end_date) > datetime('now')
    `).all(user.id);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
      entitlements
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/v1/auth/me
authRouter.get('/me', authenticate, (req: Request, res: Response) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.email, u.full_name, u.phone, u.role, u.status, u.avatar_url, u.created_at,
             sp.target_exam_id, sp.category, sp.state, sp.city, sp.preparation_year, sp.streak_days, sp.last_active_date
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = ?
    `).get(req.user!.id) as any;

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const entitlements = db.prepare(`
      SELECT e.id, e.plan_id, e.exam_id, e.start_date, e.end_date, p.name as plan_name, p.code as plan_code
      FROM entitlements e
      JOIN subscription_plans p ON e.plan_id = p.id
      WHERE e.user_id = ? AND e.is_active = 1 AND datetime(e.end_date) > datetime('now')
    `).all(user.id);

    res.json({
      success: true,
      user,
      entitlements
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch current user profile.' });
  }
});

// POST /api/v1/auth/update-profile
authRouter.post('/update-profile', authenticate, (req: Request, res: Response) => {
  try {
    const { full_name, phone, target_exam_id, category, state, city } = req.body;
    const userId = req.user!.id;
    const now = new Date().toISOString();

    if (full_name) {
      db.prepare('UPDATE users SET full_name = ?, phone = ?, updated_at = ? WHERE id = ?')
        .run(full_name, phone || null, now, userId);
    }

    db.prepare(`
      INSERT INTO student_profiles (user_id, target_exam_id, category, state, city, last_active_date)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        target_exam_id = excluded.target_exam_id,
        category = excluded.category,
        state = excluded.state,
        city = excluded.city,
        last_active_date = excluded.last_active_date
    `).run(userId, target_exam_id, category || 'General', state || 'Bihar', city || 'Patna', now);

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});
