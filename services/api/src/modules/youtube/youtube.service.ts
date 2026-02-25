import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { HttpError } from '../../lib/httpError';
import type { ContentVisibility } from '../content/content.types';

export interface YouTubeVideoItem {
  youtubeVideoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
  duration: string;
  isLive: boolean;
  liveViewerCount?: number;
}

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
  error?: { message?: string };
}

interface YouTubeVideosResponse {
  items?: Array<{
    id?: string;
    contentDetails?: { duration?: string };
    liveStreamingDetails?: { concurrentViewers?: string };
    snippet?: { liveBroadcastContent?: string };
  }>;
  error?: { message?: string };
}

interface YouTubeChannelsResponse {
  items?: Array<{ id?: string }>;
  error?: { message?: string };
}

function ensureYouTubeConfigured(channelIdentifierOverride?: string): void {
  if (!env.YOUTUBE_API_KEY) {
    throw new HttpError(503, 'YOUTUBE_API_KEY is not configured');
  }
  if (!(channelIdentifierOverride && channelIdentifierOverride.trim()) && !env.YOUTUBE_CHANNEL_ID) {
    throw new HttpError(503, 'YOUTUBE_CHANNEL_ID is not configured');
  }
}

function pickThumbnail(thumbnails?: {
  high?: { url?: string };
  medium?: { url?: string };
  default?: { url?: string };
}): string {
  return (
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    'https://i.ytimg.com/vi/default/hqdefault.jpg'
  );
}

function formatIsoDuration(duration: string | undefined): string {
  if (!duration) return '--:--';
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return '--:--';

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  if (hours > 0) {
    return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = (await response.json()) as T;

  if (!response.ok) {
    const message = (json as { error?: { message?: string } })?.error?.message || response.statusText;
    throw new HttpError(response.status, `YouTube API error: ${message}`);
  }

  return json;
}

function extractChannelIdOrHandle(input: string): { channelId?: string; handle?: string } {
  const value = input.trim();
  if (!value) {
    return {};
  }

  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(value)) {
    return { channelId: value };
  }

  if (value.startsWith('@')) {
    return { handle: value.slice(1) };
  }

  try {
    const url = new URL(value);
    const pathname = url.pathname.replace(/\/+$/, '');
    const channelMatch = pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]{20,})$/);
    if (channelMatch?.[1]) {
      return { channelId: channelMatch[1] };
    }
    const handleMatch = pathname.match(/\/@([^/]+)$/);
    if (handleMatch?.[1]) {
      return { handle: handleMatch[1] };
    }
  } catch {
    // Not a URL; continue below.
  }

  return { channelId: value };
}

async function resolveChannelId(channelIdentifier: string): Promise<string> {
  const extracted = extractChannelIdOrHandle(channelIdentifier);
  if (extracted.channelId) {
    return extracted.channelId;
  }

  if (!extracted.handle) {
    throw new HttpError(400, 'Invalid YouTube channel identifier');
  }

  const channelsParams = new URLSearchParams({
    key: env.YOUTUBE_API_KEY,
    part: 'id',
    forHandle: extracted.handle,
  });

  const channels = await fetchJson<YouTubeChannelsResponse>(
    `https://www.googleapis.com/youtube/v3/channels?${channelsParams.toString()}`,
  );

  const id = channels.items?.[0]?.id;
  if (!id) {
    throw new HttpError(404, `Unable to resolve YouTube channel handle @${extracted.handle}`);
  }

  return id;
}

export async function fetchYouTubeVideos(input?: {
  channelId?: string;
  maxResults?: number;
}): Promise<{
  channelId: string;
  fetchedAt: string;
  items: YouTubeVideoItem[];
}> {
  ensureYouTubeConfigured(input?.channelId);

  const channelIdentifier = input?.channelId?.trim() || env.YOUTUBE_CHANNEL_ID;
  const channelId = await resolveChannelId(channelIdentifier);
  const maxResults = Math.min(Math.max(input?.maxResults ?? env.YOUTUBE_MAX_RESULTS, 1), 50);

  const searchParams = new URLSearchParams({
    key: env.YOUTUBE_API_KEY,
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults: String(maxResults),
  });

  const search = await fetchJson<YouTubeSearchResponse>(
    `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`,
  );

  const searchItems = (search.items || []).filter((item) => item.id?.videoId && item.snippet);
  const videoIds = searchItems.map((item) => item.id!.videoId!).filter(Boolean);

  if (videoIds.length === 0) {
    return {
      channelId,
      fetchedAt: new Date().toISOString(),
      items: [],
    };
  }

  const videosParams = new URLSearchParams({
    key: env.YOUTUBE_API_KEY,
    part: 'contentDetails,liveStreamingDetails,snippet',
    id: videoIds.join(','),
  });

  const videos = await fetchJson<YouTubeVideosResponse>(
    `https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`,
  );

  const detailsById = new Map(
    (videos.items || []).map((item) => [item.id || '', item]),
  );

  const items: YouTubeVideoItem[] = searchItems.map((item) => {
    const id = item.id!.videoId!;
    const snippet = item.snippet!;
    const details = detailsById.get(id);
    const liveBroadcastContent = details?.snippet?.liveBroadcastContent;
    const isLive = liveBroadcastContent === 'live';

    return {
      youtubeVideoId: id,
      title: snippet.title || 'Untitled YouTube Video',
      description: snippet.description || '',
      channelTitle: snippet.channelTitle || 'YouTube Channel',
      publishedAt: snippet.publishedAt || new Date().toISOString(),
      thumbnailUrl: pickThumbnail(snippet.thumbnails),
      url: `https://www.youtube.com/watch?v=${id}`,
      duration: isLive ? 'LIVE' : formatIsoDuration(details?.contentDetails?.duration),
      isLive,
      liveViewerCount: details?.liveStreamingDetails?.concurrentViewers
        ? Number(details.liveStreamingDetails.concurrentViewers)
        : undefined,
    };
  });

  return {
    channelId,
    fetchedAt: new Date().toISOString(),
    items,
  };
}

export async function syncYouTubeVideosToContent(params: {
  actorUserId: string;
  visibility: ContentVisibility;
  channelId?: string;
  maxResults?: number;
}): Promise<{
  summary: { created: number; updated: number; skipped: number };
  channelId: string;
  items: YouTubeVideoItem[];
}> {
  const payload = await fetchYouTubeVideos({
    channelId: params.channelId,
    maxResults: params.maxResults,
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const video of payload.items) {
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM content_items WHERE media_url = $1 LIMIT 1`,
      [video.url],
    );

    const title = video.isLive ? `${video.title}` : video.title;
    const description = [video.description, `YouTube Channel: ${video.channelTitle}`]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 5000);

    if (existing.rowCount && existing.rowCount > 0) {
      await pool.query(
        `UPDATE content_items
         SET title = $2,
             description = $3,
             visibility = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [existing.rows[0]!.id, title.slice(0, 180), description, params.visibility],
      );
      updated += 1;
      continue;
    }

    await pool.query(
      `INSERT INTO content_items (author_id, title, description, content_type, media_url, visibility)
       VALUES ($1, $2, $3, 'video', $4, $5)`,
      [params.actorUserId, title.slice(0, 180), description || 'Imported from YouTube channel feed.', video.url, params.visibility],
    );
    created += 1;
  }

  if (payload.items.length === 0) {
    skipped = 1;
  }

  return {
    summary: { created, updated, skipped },
    channelId: payload.channelId,
    items: payload.items,
  };
}
