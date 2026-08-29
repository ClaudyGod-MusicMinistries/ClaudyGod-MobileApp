/**
 * Thin API client for playback resume (Phase 1 / PB-5).
 *
 * The account-free app is installation-scoped: `apiFetch` attaches the
 * `X-Installation-Token` automatically, so these calls need no auth wiring. The
 * PlaybackService (rollout step 3) owns the throttling — it calls
 * `savePlaybackPosition` on a ~15s heartbeat and on pause/stop, and
 * `fetchResumeTarget` once on launch.
 *
 * Nothing imports this yet.
 */

import { apiFetch } from '../services/apiClient';
import { reportBreadcrumb } from '../lib/sentry';

export interface ResumeTarget {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  mediaUrl?: string;
  duration: string;
  resumePositionMs: number;
  resumeDurationMs: number | null;
  updatedAt: string;
}

export interface SavePlaybackPositionInput {
  contentId: string;
  positionMs: number;
  durationMs: number;
}

/** Persist the current position. Fire-and-forget: a failed heartbeat is not worth surfacing. */
export async function savePlaybackPosition(input: SavePlaybackPositionInput): Promise<void> {
  try {
    await apiFetch<{ recorded: boolean; resumePositionMs: number | null }>(
      '/v1/mobile/installations/playback-position',
      { method: 'PUT', body: JSON.stringify(input) },
    );
  } catch (error) {
    reportBreadcrumb({
      category: 'playback',
      message: 'savePlaybackPosition failed',
      level: 'warning',
      data: { status: (error as { status?: number })?.status ?? 0 },
    });
  }
}

/** The most recent item with somewhere to resume to, or `null`. */
export async function fetchResumeTarget(): Promise<ResumeTarget | null> {
  try {
    const { resume } = await apiFetch<{ resume: ResumeTarget | null }>(
      '/v1/mobile/installations/playback-position',
    );
    return resume;
  } catch {
    return null;
  }
}
