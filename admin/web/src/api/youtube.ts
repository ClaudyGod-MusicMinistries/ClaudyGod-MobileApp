import client from './client';
import type { YouTubeSyncStatus, YouTubeImportItem, YouTubeVideosResponse } from './types';

export async function getSyncStatus(): Promise<YouTubeSyncStatus> {
  const { data } = await client.get<YouTubeSyncStatus>('/v1/youtube/status');
  return data;
}

export async function triggerSync(limit?: number): Promise<{ queued: number }> {
  // Sync now walks the entire channel (paginated) in one request, which can take
  // well past the client's default 20s timeout for larger channels.
  const { data } = await client.post<{ queued: number }>('/v1/youtube/sync', { limit }, { timeout: 120_000 });
  return data;
}

export async function listImportQueue(): Promise<YouTubeImportItem[]> {
  const { data } = await client.get<YouTubeImportItem[]>('/v1/youtube/imports');
  return data;
}

export async function fetchChannelVideos(params?: { maxResults?: number; channelId?: string; pageToken?: string }): Promise<YouTubeVideosResponse> {
  const { data } = await client.get<YouTubeVideosResponse>('/v1/youtube/videos', { params });
  return data;
}

export interface YouTubeImportSelection {
  youtubeVideoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
  duration: string;
  isLive: boolean;
  appSections: string[];
  tags: string[];
  visibility?: 'draft' | 'published';
}

export async function importVideos(selections: YouTubeImportSelection[]): Promise<{ imported: number }> {
  const { data } = await client.post<{ imported: number }>('/v1/youtube/import', { selections });
  return data;
}
