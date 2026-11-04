import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cyberosh_super_secret_jwt_key_pariksha_prod_2026';

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
    { expiresIn: '7d' }
  );
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    const user = db.prepare('SELECT id, email, full_name, role, status FROM users WHERE id = ?').get(decoded.id) as AuthenticatedUser | undefined;

    if (!user || user.status !== 'active') {
      res.status(401).json({ success: false, message: 'User account is invalid or suspended.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    const user = db.prepare('SELECT id, email, full_name, role, status FROM users WHERE id = ?').get(decoded.id) as AuthenticatedUser | undefined;
    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch (err) {
    // Continue anonymously
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
