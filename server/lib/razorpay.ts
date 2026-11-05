import crypto from 'crypto';
import { razorpayConfig } from './config.js';

/** Razorpay signs `${order_id}|${payment_id}` with the key secret (HMAC-SHA256, hex). */
export function computeSignature(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

/** Constant-time check of a Razorpay signature. Anything malformed is rejected. */
export function verifySignature(orderId: string, paymentId: string, signature: unknown, secret: string): boolean {
  if (typeof signature !== 'string' || !/^[0-9a-f]{64}$/i.test(signature) || !secret) return false;
  const expected = Buffer.from(computeSignature(orderId, paymentId, secret), 'hex');
  const given = Buffer.from(signature, 'hex');
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** The simulated checkout used in development sends `sig_test_<something>`. Never valid outside sandbox mode. */
export function isSandboxSignature(signature: unknown): boolean {
  return typeof signature === 'string' && /^sig_test_[A-Za-z0-9_-]{8,}$/.test(signature);
}

/** Creates a real order through the Razorpay Orders API (live mode only). */
export async function createRazorpayOrder(params: { amountInr: number; receipt: string }): Promise<{ id: string }> {
  const auth = Buffer.from(`${razorpayConfig.keyId}:${razorpayConfig.keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(params.amountInr * 100), // paise
      currency: 'INR',
      receipt: params.receipt.slice(0, 40)
    })
  });

  if (!response.ok) {
    throw new Error(`Razorpay order creation failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) throw new Error('Razorpay order response did not include an id');
  return { id: data.id };
}
