import { round2 } from './util.js';

export interface CouponRow {
  code: string;
  discount_percent: number;
  max_discount_inr: number | null;
  valid_until: string | null;
  is_active: number;
}

/** A coupon is usable if it is active and has not passed `valid_until` (date-only values last through that day, UTC). */
export function isCouponUsable(coupon: CouponRow, now: number = Date.now()): boolean {
  if (coupon.is_active !== 1) return false;
  if (!coupon.valid_until) return true;
  const raw = coupon.valid_until.length === 10 ? `${coupon.valid_until}T23:59:59.999Z` : coupon.valid_until;
  const expiry = new Date(raw).getTime();
  return Number.isFinite(expiry) && expiry >= now;
}

export function applyCoupon(baseAmount: number, coupon: Pick<CouponRow, 'discount_percent' | 'max_discount_inr'> | null) {
  const base = Math.max(0, Number(baseAmount) || 0);
  if (!coupon) return { discount: 0, finalAmount: round2(base) };

  const cap = coupon.max_discount_inr ?? Number.POSITIVE_INFINITY;
  const discount = round2(Math.min((base * coupon.discount_percent) / 100, cap, base));
  return { discount, finalAmount: round2(base - discount) };
}
