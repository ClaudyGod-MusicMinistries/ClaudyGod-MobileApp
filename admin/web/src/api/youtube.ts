import client from './client';
import type { YouTubeSyncStatus, YouTubeImportItem } from './types';

export async function getSyncStatus(): Promise<YouTubeSyncStatus> {
  const { data } = await client.get<YouTubeSyncStatus>('/v1/youtube/status');
  return data;
}

export async function triggerSync(limit?: number): Promise<{ queued: number }> {
  const { data } = await client.post<{ queued: number }>('/v1/youtube/sync', { limit });
  return data;
}

export async function listImportQueue(): Promise<YouTubeImportItem[]> {
  const { data } = await client.get<YouTubeImportItem[]>('/v1/youtube/imports');
  return data;
}
