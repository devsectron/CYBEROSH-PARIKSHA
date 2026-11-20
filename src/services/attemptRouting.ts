// Pure helpers that decide WHERE an exam call goes. Kept free of Firebase / DOM imports so they can be
// unit-tested in Node (tests/client-policy.test.ts).

/** Error from the REST API. `status` is 0 when the server could not be reached at all. */
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Attempts started in offline practice mode carry this prefix. Every later call for the attempt (autosave,
 * submit, result) is routed by it, so a single attempt can never be half on the server and half on the device.
 */
export const OFFLINE_ATTEMPT_PREFIX = 'offline_';

export function isOfflineAttempt(attemptId: string): boolean {
  return typeof attemptId === 'string' && attemptId.startsWith(OFFLINE_ATTEMPT_PREFIX);
}

/**
 * Only "the server is not there" may trigger the offline fallback: no connection (status 0) or a server /
 * gateway failure (5xx). Any 4xx is an answer from the server and must be respected: 401 (sign in),
 * 403 (premium test, not entitled), 404, 400 ... Falling back on those would bypass the server's checks.
 */
export function isServerUnreachable(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status;
  return typeof status === 'number' && (status === 0 || status >= 500);
}

/** Offline practice is limited to tests that are free; paid tests always need the server. */
export function canPracticeOffline(test: { is_free?: unknown } | null | undefined): boolean {
  return Boolean(test) && (test!.is_free === 1 || test!.is_free === true);
}
