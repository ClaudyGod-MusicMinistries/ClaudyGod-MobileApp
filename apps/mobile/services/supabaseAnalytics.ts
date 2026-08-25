import {
  fetchMeMetrics,
  subscribeToLiveAlertsBackend,
  subscribeInstallationLiveAlerts,
  trackMePlayEvent,
} from './userFlowService';
import { getStoredMobileSession } from './authService';
import { reportException, reportBreadcrumb } from '../lib/sentry';
import { apiFetch } from './apiClient';
import { getPreference } from '../lib/localUserStorage';
import { queryClient } from '../lib/queryClient';
import type { FeedCardItem } from './contentService';

export interface PlayEventInput {
  contentId: string;
  contentType: string;
  title: string;
  source?: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  imageUrl?: string;
  mediaUrl?: string;
}

export async function trackPlayEvent(input: PlayEventInput): Promise<void> {
  // Guests have no session to attach this to — on web, apiFetchWithMobileSession
  // relies entirely on a session cookie and skips the "signed in?" check native
  // does, so without this guard every single guest play fired a doomed 401
  // request (silently caught here, but still a real network call and a visible
  // console error for every anonymous listener, the majority of traffic).
  const { user } = await getStoredMobileSession();
  if (!user) {
    try {
      const personalizationEnabled = await getPreference('personalizationEnabled', true);
      await apiFetch('/v1/mobile/installations/events', {
        method: 'POST',
        body: JSON.stringify({
          event: 'playback_milestone',
          idempotencyKey: personalizationEnabled ? `recommendation-play:${input.contentId}` : 'activation:first-play',
          contentId: input.contentId,
          contentType: normalizeContentType(input.contentType),
          title: input.title,
          subtitle: input.subtitle,
          description: input.description,
          duration: input.duration,
          imageUrl: input.imageUrl,
          mediaUrl: input.mediaUrl?.startsWith('http') ? input.mediaUrl : undefined,
          source: input.source ?? 'unknown',
        }),
      });
      if (personalizationEnabled) {
        await queryClient.invalidateQueries({ queryKey: ['feed'] });
      }
      reportBreadcrumb({ category: 'engagement', message: 'guest playback milestone recorded', level: 'info', data: { source: input.source } });
    } catch (error) {
      reportException(error, { tags: { flow: 'guest-playback-milestone' } });
    }
    return;
  }

  try {
    await trackMePlayEvent({
      contentId: input.contentId,
      contentType: normalizeContentType(input.contentType),
      title: input.title,
      source: input.source ?? 'unknown',
    });
    reportBreadcrumb({ category: 'engagement', message: 'play-event recorded', level: 'info', data: { source: input.source } });
  } catch (error) {
    // This used to fail completely silently — a genuinely broken recording
    // path (schema drift, expired session, validation mismatch) and a
    // healthy one both looked identical from here, which is exactly what
    // let recommendations/most-played/continue-listening silently degrade
    // to their cold-start fallbacks for real, active accounts with no way
    // to tell why. Reporting it is what makes that distinguishable.
    reportException(error, { tags: { flow: 'play-event' } });
  }
}

export function trackContentPlay(item: FeedCardItem, source: string): Promise<void> {
  return trackPlayEvent({
    contentId: item.id, contentType: item.type, title: item.title, source,
    subtitle: item.subtitle, description: item.description, duration: item.duration,
    imageUrl: item.imageUrl, mediaUrl: item.mediaUrl,
  });
}

export async function subscribeToLiveAlerts(channelId: string, label?: string): Promise<void> {
  const { user } = await getStoredMobileSession();
  if (!user) {
    await subscribeInstallationLiveAlerts(channelId, label);
    return;
  }

  try {
    await subscribeToLiveAlertsBackend(channelId, label);
  } catch (error) {
    reportException(error, { tags: { flow: 'live-subscription' } });
  }
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
