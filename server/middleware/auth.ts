import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, JWT_EXPIRY_SECONDS } from '../lib/config.js';

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

/** Resolves the token to an active user from the database (so role changes / suspensions apply immediately). */
function resolveUser(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { id?: string };
    if (!decoded || typeof decoded.id !== 'string') return null;
    const user = db
      .prepare('SELECT id, email, full_name, role, status FROM users WHERE id = ?')
      .get(decoded.id) as AuthenticatedUser | undefined;
    return user && user.status === 'active' ? user : null;
  } catch {
    return null;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }

  const user = resolveUser(token);
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid or expired session, or the account is suspended.' });
    return;
  }

  req.user = user;
  next();
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = bearerToken(req);
  if (token) {
    const user = resolveUser(token);
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
