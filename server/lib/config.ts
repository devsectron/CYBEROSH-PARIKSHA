// Central, validated runtime configuration.
//
// IMPORTANT: this module must be imported before anything that reads process.env.
// `dotenv/config` is imported here (rather than calling dotenv.config() in server.ts)
// because ES module imports are hoisted: route modules would otherwise be evaluated
// before .env had been loaded, silently ignoring every value in it.
import 'dotenv/config';
import crypto from 'crypto';

export const isProd = process.env.NODE_ENV === 'production';

// Values that have shipped in the repository / .env.example and must never be trusted.
const PLACEHOLDER_JWT_SECRETS = new Set([
  'cyberosh_super_secret_jwt_key_pariksha_prod_2026',
  'change_me',
  'changeme',
  'secret'
]);

function resolveJwtSecret(): string {
  const configured = (process.env.JWT_SECRET || '').trim();
  const usable = configured.length >= 32 && !PLACEHOLDER_JWT_SECRETS.has(configured);
  if (usable) return configured;

  if (isProd) {
    throw new Error(
      'JWT_SECRET is missing, shorter than 32 characters, or a known placeholder. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }

  console.warn(
    '[CONFIG] JWT_SECRET is not set to a strong value. Using a random per-process secret ' +
      '(logins will reset whenever the server restarts). Set JWT_SECRET in .env to keep sessions.'
  );
  return crypto.randomBytes(48).toString('hex');
}

export const JWT_SECRET = resolveJwtSecret();

const sessionDays = Number(process.env.SESSION_EXPIRY_DAYS);
export const JWT_EXPIRY_SECONDS = (Number.isFinite(sessionDays) && sessionDays > 0 ? sessionDays : 7) * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
const rzpKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
const rzpKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
const usingDemoKeys = !rzpKeyId || !rzpKeySecret || /CyberoshDemo/i.test(rzpKeyId) || /cyberoshDemo/i.test(rzpKeySecret);

/**
 * live     - real Razorpay keys configured: orders are created via the Razorpay API and
 *            every payment must carry a valid HMAC-SHA256 signature.
 * sandbox  - development only, demo keys: the simulated checkout ("sig_test_*") is accepted.
 * disabled - production without real keys: payments are refused instead of being free.
 */
export type PaymentMode = 'live' | 'sandbox' | 'disabled';
export const paymentMode: PaymentMode = !usingDemoKeys ? 'live' : isProd ? 'disabled' : 'sandbox';

export const razorpayConfig = {
  keyId: rzpKeyId || 'rzp_test_CyberoshDemoKey2026',
  keySecret: rzpKeySecret
};

if (isProd && paymentMode === 'disabled') {
  console.warn('[CONFIG] Production without real RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET: payments are disabled.');
}

// Number of reverse proxies in front of the app (used for correct client IPs / rate limiting).
const trustProxy = Number(process.env.TRUST_PROXY);
export const TRUST_PROXY: number | false = Number.isInteger(trustProxy) && trustProxy > 0 ? trustProxy : false;
