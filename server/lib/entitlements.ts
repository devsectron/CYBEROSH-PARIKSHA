import { db } from '../db.js';

export function isAdminRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * True when the user currently holds a paid entitlement. When `examId` is given the
 * entitlement must cover that exam (an unscoped entitlement or an "all exams" plan does).
 */
export function hasActiveEntitlement(userId: string, examId?: string | null): boolean {
  const exam = examId ?? null;
  const row = db
    .prepare(
      `SELECT e.id
         FROM entitlements e
        WHERE e.user_id = ?
          AND e.is_active = 1
          AND datetime(e.end_date) > datetime('now')
          AND (? IS NULL
               OR e.exam_id IS NULL
               OR e.exam_id = ?
               OR e.plan_id IN (SELECT id FROM subscription_plans WHERE exam_access_type = 'all'))
        LIMIT 1`
    )
    .get(userId, exam, exam);
  return Boolean(row);
}

/** For single-exam plans, the exam an entitlement is scoped to; otherwise null (covers everything the plan allows). */
export function entitlementExamIdForPlan(plan: { exam_access_type?: string; target_exam_ids_json?: string | null } | undefined): string | null {
  if (!plan || plan.exam_access_type !== 'single_exam' || !plan.target_exam_ids_json) return null;
  try {
    const ids = JSON.parse(plan.target_exam_ids_json);
    return Array.isArray(ids) && ids.length === 1 && typeof ids[0] === 'string' ? ids[0] : null;
  } catch {
    return null;
  }
}
