import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Length of the counting window. */
  windowMs: number;
  /** Maximum requests per key within the window. */
  max: number;
  message?: string;
  /** Derives the bucket key; defaults to the client IP. */
  key?: (req: Request) => string;
}

/**
 * Minimal in-memory fixed-window rate limiter (no extra dependency). State is per process,
 * which is right for a single-instance deployment; use a shared store (e.g. Redis) if you scale out.
 */
export function rateLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, Math.max(options.windowMs, 60_000));
  sweeper.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = options.key ? options.key(req) : req.ip || 'unknown';

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count++;
    const remaining = Math.max(0, options.max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (bucket.count > options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests. Please slow down and try again shortly.'
      });
      return;
    }

    next();
  };
}
