import { apiFetchWithMobileSession } from './authService';

export interface PlaybackSessionStarted {
  sessionId: string;
}

export async function startPlaybackSession(input: {
  contentId: string;
  deviceId?: string;
  source?: 'feed' | 'search' | 'recommendation' | 'direct' | 'playlist' | 'autoplay';
  durationMs?: number;
}): Promise<PlaybackSessionStarted> {
  return apiFetchWithMobileSession<PlaybackSessionStarted>('/v1/me/playback/start', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function heartbeatPlaybackSession(
  sessionId: string,
  positionMs: number,
): Promise<void> {
  await apiFetchWithMobileSession<void>(`/v1/me/playback/${sessionId}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({ positionMs }),
  });
}

export async function endPlaybackSession(
  sessionId: string,
  positionMs: number,
  completed: boolean,
): Promise<void> {
  await apiFetchWithMobileSession<void>(`/v1/me/playback/${sessionId}/end`, {
    method: 'POST',
    body: JSON.stringify({ positionMs, completed }),
  });
}
