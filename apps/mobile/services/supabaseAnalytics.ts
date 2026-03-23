import {
  fetchMeMetrics,
  subscribeToLiveAlertsBackend,
  trackMePlayEvent,
} from './userFlowService';
import { getStoredMobileSession } from './authService';

export interface PlayEventInput {
  contentId: string;
  contentType: string;
  title: string;
  source?: string;
}

export async function trackPlayEvent(input: PlayEventInput): Promise<void> {
  try {
    await trackMePlayEvent({
      contentId: input.contentId,
      contentType: normalizeContentType(input.contentType),
      title: input.title,
      source: input.source ?? 'unknown',
    });
  } catch {}
}

export async function subscribeToLiveAlerts(channelId: string): Promise<void> {
  try {
    await subscribeToLiveAlertsBackend(channelId);
  } catch {}
}

export async function fetchUserProfileMetrics() {
  try {
    return await fetchMeMetrics();
  } catch {
    const { user } = await getStoredMobileSession();
    return {
      email: user?.email ?? '',
      displayName: user?.displayName ?? 'ClaudyGod User',
      totalPlays: 0,
      liveSubscriptions: 0,
    };
  }
}

function normalizeContentType(contentType: string): 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad' {
  if (
    contentType === 'audio' ||
    contentType === 'video' ||
    contentType === 'playlist' ||
    contentType === 'announcement' ||
    contentType === 'live' ||
    contentType === 'ad'
  ) {
    return contentType;
  }
  return 'audio';
}
