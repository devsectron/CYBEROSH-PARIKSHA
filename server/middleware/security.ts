import { Request, Response, NextFunction } from 'express';
import { isProd } from '../lib/config.js';

/**
 * Baseline hardening headers. A Content-Security-Policy is intentionally not set here:
 * the app loads Firebase, Google Fonts and third-party avatar/image hosts, so a CSP needs
 * to be designed against the real asset list (see docs/security.md).
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProd && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
}
