// Verification of Firebase Auth ID tokens (used by "Continue with Google" sign-ins).
//
// Google users have no password session on this server, only a Firebase one. Instead of trusting the
// browser, the server verifies the Firebase ID token itself: RS256 signature against Google's published
// certificates, plus audience (our project), issuer, expiry and a verified email. Roles are NEVER taken
// from the token; they always come from the server's own users table.
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const MIN_REFRESH_INTERVAL_MS = 60_000; // an unknown "kid" must not let a caller force a fetch per request

function readProjectId(): string | null {
  const fromEnv = (process.env.FIREBASE_PROJECT_ID || '').trim();
  if (fromEnv) return fromEnv;
  try {
    const raw = JSON.parse(fs.readFileSync(path.resolve('firebase-applet-config.json'), 'utf8'));
    const id = String(raw?.projectId || '').trim();
    // The repository ships a redacted placeholder (all "x"); that means "not configured".
    return id && !/^x+$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const firebaseProjectId: string | null = readProjectId();

let certs: Record<string, string> = {};
let certsExpireAt = 0;
let lastRefreshAt = 0;
let inflight: Promise<void> | null = null;

/** Test hook: inject certificates (kid -> PEM public key / certificate) instead of fetching Google's. */
export function setFirebaseCertsForTests(injected: Record<string, string>) {
  certs = injected;
  certsExpireAt = Date.now() + 60 * 60 * 1000;
  lastRefreshAt = Date.now();
}

async function refreshCerts(): Promise<void> {
  if (inflight) return inflight;
  if (Date.now() - lastRefreshAt < MIN_REFRESH_INTERVAL_MS) return;
  lastRefreshAt = Date.now();
  inflight = (async () => {
    try {
      const res = await fetch(CERT_URL, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;
      const maxAge = /max-age=(\d+)/.exec(res.headers.get('cache-control') || '');
      certs = (await res.json()) as Record<string, string>;
      certsExpireAt = Date.now() + (maxAge ? Number(maxAge[1]) : 3600) * 1000;
    } catch {
      /* offline or Google unreachable: keep whatever we had */
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

async function certFor(kid: string): Promise<string | null> {
  if (certs[kid] && Date.now() < certsExpireAt) return certs[kid];
  await refreshCerts();
  return certs[kid] ?? null;
}

export interface FirebaseIdentity {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

/** True when the token looks like a Firebase ID token (RS256) rather than one of this server's own (HS256) tokens. */
export function isFirebaseTokenShape(token: string): boolean {
  const decoded = jwt.decode(token, { complete: true }) as { header?: { alg?: string } } | null;
  return decoded?.header?.alg === 'RS256';
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdentity | null> {
  if (!firebaseProjectId) return null;

  const decoded = jwt.decode(token, { complete: true }) as { header?: { alg?: string; kid?: string } } | null;
  const kid = decoded?.header?.kid;
  if (!decoded || decoded.header?.alg !== 'RS256' || !kid) return null;

  const cert = await certFor(kid);
  if (!cert) return null;

  try {
    const payload = jwt.verify(token, cert, {
      algorithms: ['RS256'],
      audience: firebaseProjectId,
      issuer: `https://securetoken.google.com/${firebaseProjectId}`
    }) as Record<string, unknown>;

    const uid = payload.sub;
    if (typeof uid !== 'string' || !uid || uid.length > 128) return null;
    // Only a verified email may be linked to an account, otherwise anyone could claim someone else's address.
    if (typeof payload.email !== 'string' || payload.email_verified !== true) return null;

    return {
      uid,
      email: payload.email.toLowerCase(),
      name: typeof payload.name === 'string' ? payload.name : undefined,
      picture: typeof payload.picture === 'string' ? payload.picture : undefined
    };
  } catch {
    return null;
  }
}
