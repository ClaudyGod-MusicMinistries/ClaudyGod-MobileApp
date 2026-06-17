import client from './client';
import type { YouTubeSyncStatus, YouTubeImportItem, YouTubeVideoItem, YouTubeVideosResponse } from './types';

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

export async function fetchChannelVideos(params?: { maxResults?: number; channelId?: string }): Promise<YouTubeVideosResponse> {
  const { data } = await client.get<YouTubeVideosResponse>('/v1/youtube/videos', { params });
  return data;
}

export async function importVideos(selections: Array<{ youtubeVideoId: string; appSections: string[]; visibility?: string }>): Promise<{ imported: number }> {
  const { data } = await client.post<{ imported: number }>('/v1/youtube/import', { selections });
  return data;
}
