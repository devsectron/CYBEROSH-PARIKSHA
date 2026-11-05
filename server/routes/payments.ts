import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { paymentMode, razorpayConfig } from '../lib/config.js';
import { applyCoupon, isCouponUsable, CouponRow } from '../lib/pricing.js';
import { createRazorpayOrder, isSandboxSignature, verifySignature } from '../lib/razorpay.js';
import { entitlementExamIdForPlan } from '../lib/entitlements.js';
import { newId } from '../lib/util.js';
import { parseOrReject } from '../lib/validate.js';

export const paymentsRouter = Router();

const DAY_MS = 24 * 60 * 60 * 1000;

const couponValidateSchema = z.object({
  code: z.string({ error: 'Coupon code is required.' }).trim().min(1, 'Coupon code is required.').max(40),
  amount: z.coerce.number().min(0).max(1_000_000).optional(),
  plan_id: z.string().trim().max(100).optional()
});

const createOrderSchema = z.object({
  plan_id: z.string({ error: 'plan_id is required.' }).trim().min(1, 'plan_id is required.').max(100),
  coupon_code: z.string().trim().max(40).optional().nullable()
});

const verifySchema = z.object({
  order_id: z.string({ error: 'order_id and payment_id are required.' }).trim().min(1, 'order_id and payment_id are required.').max(100),
  payment_id: z.string({ error: 'order_id and payment_id are required.' }).trim().min(1, 'order_id and payment_id are required.').max(100),
  signature: z.string().trim().max(256).optional().nullable()
});

function findCoupon(code: string): CouponRow | undefined {
  return db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)').get(code.trim()) as CouponRow | undefined;
}

function writeAudit(userId: string, action: string, entityId: string, details: unknown) {
  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, created_at)
     VALUES (?, ?, ?, 'PAYMENT', ?, ?, ?)`
  ).run(newId('log'), userId, action, entityId, JSON.stringify(details), new Date().toISOString());
}

// GET /api/v1/plans - List subscription plans
paymentsRouter.get('/plans', (_req: Request, res: Response) => {
  try {
    const plansRaw = db
      .prepare('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price_inr ASC')
      .all() as any[];

    const plans = plansRaw.map(p => {
      let features: unknown = [];
      try {
        features = p.features_json ? JSON.parse(p.features_json) : [];
      } catch {
        features = [];
      }
      return { ...p, features };
    });

    res.json({ success: true, plans, razorpay_key_id: razorpayConfig.keyId, payment_mode: paymentMode });
  } catch (err) {
    console.error('Error fetching plans:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription plans.' });
  }
});

// POST /api/v1/coupons/validate - price preview; the authoritative price is always recomputed in create-order
paymentsRouter.post('/coupons/validate', (req: Request, res: Response) => {
  try {
    const body = parseOrReject(couponValidateSchema, req.body, res);
    if (!body) return;

    const coupon = findCoupon(body.code);
    if (!coupon || !isCouponUsable(coupon)) {
      res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
      return;
    }

    // Prefer the real plan price when a plan is given, so the preview cannot disagree with checkout.
    let baseAmount = body.amount ?? 0;
    if (body.plan_id) {
      const plan = db.prepare('SELECT price_inr FROM subscription_plans WHERE id = ? AND is_active = 1').get(body.plan_id) as { price_inr: number } | undefined;
      if (plan) baseAmount = plan.price_inr;
    }

    const { discount, finalAmount } = applyCoupon(baseAmount, coupon);
    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        discount_amount: discount,
        final_amount: finalAmount
      }
    });
  } catch (err) {
    console.error('Error validating coupon:', err);
    res.status(500).json({ success: false, message: 'Failed to validate coupon code.' });
  }
});

// POST /api/v1/create-order
paymentsRouter.post('/create-order', authenticate, async (req: Request, res: Response) => {
  try {
    if (paymentMode === 'disabled') {
      res.status(503).json({ success: false, message: 'Online payments are not configured on this server yet.' });
      return;
    }

    const body = parseOrReject(createOrderSchema, req.body, res);
    if (!body) return;
    const userId = req.user!.id;

    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1').get(body.plan_id) as any;
    if (!plan) {
      res.status(404).json({ success: false, message: 'Selected plan not found.' });
      return;
    }

    // The price is always computed here from the database, never taken from the client.
    let coupon: CouponRow | null = null;
    if (body.coupon_code) {
      const found = findCoupon(body.coupon_code);
      if (!found || !isCouponUsable(found)) {
        res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
        return;
      }
      coupon = found;
    }
    const { discount, finalAmount } = applyCoupon(plan.price_inr, coupon);

    let orderId = newId('order');
    if (paymentMode === 'live') {
      if (finalAmount < 1) {
        res.status(400).json({ success: false, message: 'Order amount is below the minimum chargeable amount (₹1).' });
        return;
      }
      const rzpOrder = await createRazorpayOrder({ amountInr: finalAmount, receipt: orderId });
      orderId = rzpOrder.id;
    }

    db.prepare(
      `INSERT INTO payments (id, user_id, plan_id, order_id, amount_inr, status, method, created_at)
       VALUES (?, ?, ?, ?, ?, 'created', 'Razorpay Gateway', ?)`
    ).run(newId('pay'), userId, plan.id, orderId, finalAmount, new Date().toISOString());

    res.json({
      success: true,
      order: {
        order_id: orderId,
        amount_inr: finalAmount,
        amount_paise: Math.round(finalAmount * 100),
        discount_inr: discount,
        currency: 'INR',
        plan_name: plan.name,
        key_id: razorpayConfig.keyId,
        mode: paymentMode
      }
    });
  } catch (err) {
    console.error('Error creating payment order:', err);
    res.status(500).json({ success: false, message: 'Server error generating payment order.' });
  }
});

// POST /api/v1/verify
paymentsRouter.post('/verify', authenticate, (req: Request, res: Response) => {
  try {
    if (paymentMode === 'disabled') {
      res.status(503).json({ success: false, message: 'Online payments are not configured on this server yet.' });
      return;
    }

    const body = parseOrReject(verifySchema, req.body, res);
    if (!body) return;
    const userId = req.user!.id;

    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ? AND user_id = ?').get(body.order_id, userId) as any;
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    // Idempotent: re-verifying a settled order must never mint a second entitlement.
    if (payment.status === 'success') {
      res.json({ success: true, message: 'This payment was already verified and the pass is active.', already_verified: true });
      return;
    }
    if (payment.status !== 'created') {
      res.status(409).json({ success: false, message: `This order can no longer be paid (status: ${payment.status}).` });
      return;
    }

    // Signature check. Live: strict HMAC only. Sandbox (development only): HMAC or the simulated checkout token.
    const hmacValid = verifySignature(body.order_id, body.payment_id, body.signature, razorpayConfig.keySecret);
    const sandboxValid = paymentMode === 'sandbox' && isSandboxSignature(body.signature);
    if (!hmacValid && !sandboxValid) {
      writeAudit(userId, 'PAYMENT_SIGNATURE_REJECTED', payment.id, { order_id: body.order_id });
      res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
      return;
    }

    // A gateway payment id can settle exactly one order.
    const reused = db.prepare("SELECT 1 FROM payments WHERE payment_id = ? AND status = 'success'").get(body.payment_id);
    if (reused) {
      res.status(409).json({ success: false, message: 'This payment has already been used for another order.' });
      return;
    }

    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(payment.plan_id) as any;
    const durationMs = (plan?.duration_days || 30) * DAY_MS;
    const examId = entitlementExamIdForPlan(plan);
    const now = Date.now();

    const activation = db.transaction(() => {
      // Mark settled only if still 'created' (guards against two concurrent verify calls).
      const settled = db
        .prepare("UPDATE payments SET payment_id = ?, signature = ?, status = 'success' WHERE id = ? AND status = 'created'")
        .run(body.payment_id, body.signature || null, payment.id);
      if (settled.changes === 0) return null;

      // Renewing the same plan stacks on top of the remaining time instead of overlapping it.
      const existing = db
        .prepare(
          `SELECT id, end_date FROM entitlements
            WHERE user_id = ? AND plan_id = ? AND is_active = 1 AND COALESCE(exam_id, '') = COALESCE(?, '')
              AND datetime(end_date) > datetime('now')
            ORDER BY end_date DESC LIMIT 1`
        )
        .get(userId, payment.plan_id, examId) as { id: string; end_date: string } | undefined;

      const baseTime = existing ? Math.max(now, new Date(existing.end_date).getTime()) : now;
      const endDate = new Date(baseTime + durationMs).toISOString();

      if (existing) {
        db.prepare('UPDATE entitlements SET end_date = ? WHERE id = ?').run(endDate, existing.id);
      } else {
        db.prepare(
          `INSERT INTO entitlements (id, user_id, plan_id, exam_id, start_date, end_date, is_active)
           VALUES (?, ?, ?, ?, ?, ?, 1)`
        ).run(newId('ent'), userId, payment.plan_id, examId, new Date(now).toISOString(), endDate);
      }

      db.prepare(
        `INSERT INTO notifications (id, user_id, title, message, type, created_at)
         VALUES (?, ?, ?, ?, 'success', ?)`
      ).run(
        newId('notif'),
        userId,
        'Subscription Activated!',
        `Congratulations! Your "${plan?.name || 'Preparation Pass'}" is active until ${endDate.split('T')[0]}.`,
        new Date(now).toISOString()
      );

      writeAudit(userId, 'PAYMENT_VERIFIED', payment.id, { amount: payment.amount_inr, plan_id: payment.plan_id, mode: paymentMode });
      return endDate;
    })();

    if (!activation) {
      res.json({ success: true, message: 'This payment was already verified and the pass is active.', already_verified: true });
      return;
    }

    res.json({
      success: true,
      message: 'Payment verified and preparation pass activated successfully!',
      entitlement: { plan_name: plan?.name, valid_until: activation }
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ success: false, message: 'Server error verifying payment.' });
  }
});
