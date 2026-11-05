import type { Response } from 'express';
import type { z } from 'zod';

/**
 * Validates `data` against a zod schema. On failure it sends a 400 response and returns null,
 * so callers can simply do:  const body = parseOrReject(schema, req.body, res); if (!body) return;
 */
export function parseOrReject<T extends z.ZodType>(schema: T, data: unknown, res: Response): z.infer<T> | null {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data as z.infer<T>;

  const issue = result.error.issues[0];
  res.status(400).json({
    success: false,
    message: issue?.message || 'Invalid request.',
    field: issue ? issue.path.map(String).join('.') : undefined
  });
  return null;
}
