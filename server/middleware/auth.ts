import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db.js';
import { JWT_SECRET, JWT_EXPIRY_SECONDS } from '../lib/config.js';
import { FirebaseIdentity, isFirebaseTokenShape, verifyFirebaseIdToken } from '../lib/firebaseAuth.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function generateToken(user: { id: string; email: string; role: string; full_name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: JWT_EXPIRY_SECONDS }
  );
}

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

const USER_COLUMNS = 'SELECT id, email, full_name, role, status FROM users';

/**
 * Maps a verified Firebase (Google) identity to a server user. The account is matched by verified email,
 * so someone who registered with a password and later uses Google lands on the same account. A first-time
 * Google user gets a normal 'student' account with an unusable random password. Roles never come from the token.
 */
function userForFirebaseIdentity(identity: FirebaseIdentity): AuthenticatedUser | null {
  const find = () => db.prepare(`${USER_COLUMNS} WHERE email = ?`).get(identity.email) as AuthenticatedUser | undefined;

  let user = find();
  if (!user) {
    const now = new Date().toISOString();
    const unusablePassword = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);
    db.transaction(() => {
      db.prepare(
        `INSERT OR IGNORE INTO users (id, email, password_hash, full_name, phone, role, status, avatar_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, 'student', 'active', ?, ?, ?)`
      ).run(identity.uid, identity.email, unusablePassword, identity.name || 'Candidate', identity.picture || null, now, now);
      db.prepare(
        `INSERT OR IGNORE INTO student_profiles (user_id, target_exam_id, state, last_active_date)
         VALUES (?, 'exam_bihar_stet', 'Bihar', ?)`
      ).run(identity.uid, now);
    })();
    user = find(); // also covers two simultaneous first requests: the second INSERT is ignored
  }
  return user && user.status === 'active' ? user : null;
}

/** Resolves a bearer token to an active user from the database (so role changes / suspensions apply immediately). */
async function resolveUser(token: string): Promise<AuthenticatedUser | null> {
  try {
    if (isFirebaseTokenShape(token)) {
      const identity = await verifyFirebaseIdToken(token);
      return identity ? userForFirebaseIdentity(identity) : null;
    }

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { id?: string };
    if (!decoded || typeof decoded.id !== 'string') return null;
    const user = db.prepare(`${USER_COLUMNS} WHERE id = ?`).get(decoded.id) as AuthenticatedUser | undefined;
    return user && user.status === 'active' ? user : null;
  } catch {
    return null;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }

  const user = await resolveUser(token);
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid or expired session, or the account is suspended.' });
    return;
  }

  req.user = user;
  next();
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = bearerToken(req);
  if (token) {
    const user = await resolveUser(token);
    if (user) req.user = user;
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Sign in required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Access forbidden: Insufficient administrative privileges.' });
      return;
    }

    next();
  };
}
