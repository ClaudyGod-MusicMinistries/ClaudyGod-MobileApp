import { z } from 'zod';

/**
 * Installation-scoped playback resume (Phase 1 / PB-5).
 *
 * The account-free mobile app already records listening history and milestone
 * events per installation; this adds the one missing piece — "put me back where
 * I left off" — without introducing a user account. Position is stored on the
 * existing `mobile_installation_history` row for the content.
 */

export const installationPlaybackPositionSchema = z
  .object({
    contentId: z.string().trim().min(1).max(200),
    positionMs: z.coerce.number().int().min(0).max(24 * 60 * 60 * 1000),
    durationMs: z.coerce.number().int().min(0).max(24 * 60 * 60 * 1000),
  })
  .strict();

export type InstallationPlaybackPositionInput = z.infer<typeof installationPlaybackPositionSchema>;

/** Ignore a position update that arrives before playback has really begun. */
export const RESUME_MIN_POSITION_MS = 5_000;
/** Treat a track as finished (clear its resume point) within this of the end. */
export const RESUME_END_GRACE_MS = 12_000;

/**
 * Given a heartbeat position, decide what to persist as the resume point:
 *   - `null`  → clear any stored position (too early, or effectively finished)
 *   - number  → the position to resume from next time
 *
 * Pure and DB-free so it can be unit-tested directly.
 */
export function resolveResumePoint(positionMs: number, durationMs: number): number | null {
  if (!Number.isFinite(positionMs) || positionMs < RESUME_MIN_POSITION_MS) return null;
  if (durationMs > 0 && positionMs >= durationMs - RESUME_END_GRACE_MS) return null;
  return Math.floor(positionMs);
}
