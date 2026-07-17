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
  // Guests have no session to attach this to — on web, apiFetchWithMobileSession
  // relies entirely on a session cookie and skips the "signed in?" check native
  // does, so without this guard every single guest play fired a doomed 401
  // request (silently caught here, but still a real network call and a visible
  // console error for every anonymous listener, the majority of traffic).
  const { user } = await getStoredMobileSession();
  if (!user) return;

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
  const { user } = await getStoredMobileSession();
  if (!user) return;

  try {
    await subscribeToLiveAlertsBackend(channelId);
  } catch {}
}

export async function fetchUserProfileMetrics() {
  try {
    return await fetchMeMetrics();
  } catch {
    const { user } = await getStoredMobileSession();
    const emailPrefix = user?.email ? user.email.split('@')[0] : '';
    return {
      email: user?.email ?? '',
      displayName: user?.displayName ?? emailPrefix,
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
