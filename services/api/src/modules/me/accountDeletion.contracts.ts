import { env } from '../../config/env';

/**
 * Account deletion (App Store 5.1.1(v) / Google Play).
 *
 * A user can delete their account from inside the app. The request is not
 * instant: it is scheduled `ACCOUNT_DELETION_GRACE_DAYS` in the future, the user
 * is emailed, and they may cancel within the window. After the window a worker
 * job permanently purges the account (`app_users` row + every `ON DELETE CASCADE`
 * dependent; `ON DELETE SET NULL` rows are de-associated).
 */

export const ACCOUNT_DELETION_GRACE_DAYS = env.ACCOUNT_DELETION_GRACE_DAYS;

export type AccountDeletionStatus = 'scheduled' | 'processing' | 'completed' | 'cancelled';

export interface PendingAccountDeletion {
  requestId: string;
  status: AccountDeletionStatus;
  requestedAt: string;
  scheduledFor: string;
  /** Whole days remaining until purge; 0 once the window has elapsed. */
  daysRemaining: number;
  graceDays: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** When a deletion requested `now` should actually run. Pure for testability. */
export function resolveDeletionSchedule(now: Date, graceDays: number = ACCOUNT_DELETION_GRACE_DAYS): Date {
  const days = Number.isFinite(graceDays) && graceDays >= 0 ? Math.floor(graceDays) : 30;
  return new Date(now.getTime() + days * DAY_MS);
}

/** Whole days from `now` until `scheduledFor`, clamped at 0. */
export function daysUntil(scheduledFor: Date, now: Date): number {
  return Math.max(0, Math.ceil((scheduledFor.getTime() - now.getTime()) / DAY_MS));
}

/** A scheduled deletion can be cancelled by the user only before it runs. */
export function canCancelDeletion(status: string, scheduledFor: Date, now: Date): boolean {
  return status === 'scheduled' && scheduledFor.getTime() > now.getTime();
}
