import crypto from 'crypto';

/** Collision-resistant identifier, e.g. newId('att') -> att_3f9c1a... (replaces Date.now()-based ids). */
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const IST_OFFSET_MS = 330 * 60 * 1000; // Asia/Kolkata, UTC+05:30 (no DST)

/** Calendar date (YYYY-MM-DD) in Indian Standard Time, used for daily features such as streaks and the daily quiz. */
export function istDateKey(input: Date | string | number = Date.now()): string {
  const ms = input instanceof Date ? input.getTime() : new Date(input).getTime();
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Small deterministic PRNG (mulberry32) so "daily" content is stable for a given date. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function isUniqueConstraintError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT');
}
