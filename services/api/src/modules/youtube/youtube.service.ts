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
  suggestedAppSections: string[];
  suggestedTags: string[];
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

const normalizeTextList = (items?: string[]): string[] =>
  [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))];

const sectionRules = [
  { section: 'claudygod-music', pattern: /(worship|praise|song|music|choir|hymn|album|track|ministration)/i },
  { section: 'claudygod-nuggets-of-truth', pattern: /(nugget|truth|daily word|devotion|scripture|verse|reflection)/i },
  { section: 'claudygod-messages', pattern: /(message|sermon|teaching|conference|service|prayer|word)/i },
] as const;

const tagRules = [
  { tag: 'worship', pattern: /(worship|praise|hymn)/i },
  { tag: 'music', pattern: /(song|music|album|track|choir)/i },
  { tag: 'message', pattern: /(message|sermon|teaching|word)/i },
  { tag: 'devotional', pattern: /(devotion|reflection|daily word|scripture|verse|truth)/i },
  { tag: 'live', pattern: /\blive\b/i },
  { tag: 'prayer', pattern: /prayer/i },
] as const;

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

function buildVideoSignals(video: {
  title: string;
  description: string;
  channelTitle: string;
  isLive: boolean;
}): string {
  return `${video.title} ${video.description} ${video.channelTitle} ${video.isLive ? 'live' : ''}`.toLowerCase();
}

function deriveSuggestedAppSections(video: {
  title: string;
  description: string;
  channelTitle: string;
  isLive: boolean;
}): string[] {
  const signals = buildVideoSignals(video);
  const sections = sectionRules
    .filter((rule) => rule.pattern.test(signals))
    .map((rule) => rule.section);

  if (video.isLive && !sections.includes('claudygod-music')) {
    sections.push('claudygod-music');
  }

  if (sections.length === 0) {
    sections.push('claudygod-messages');
  }

  return normalizeTextList(sections);
}

function deriveSuggestedTags(video: {
  title: string;
  description: string;
  channelTitle: string;
  isLive: boolean;
}): string[] {
  const signals = buildVideoSignals(video);
  const tags: string[] = tagRules
    .filter((rule) => rule.pattern.test(signals))
    .map((rule) => rule.tag);

  const channelToken = video.channelTitle.trim().toLowerCase();
  if (channelToken.includes('claudygod')) {
    tags.push('claudygod');
  }

  return normalizeTextList(tags);
}

async function recordAutomationRun(input: {
  actorUserId: string;
  runType: string;
  status: 'completed' | 'failed';
  summary: Record<string, unknown>;
  notes?: string;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO automation_runs (run_type, scope, actor_user_id, status, summary, notes)
       VALUES ($1, 'admin', $2, $3, $4::jsonb, $5)`,
      [input.runType, input.actorUserId, input.status, JSON.stringify(input.summary), input.notes ?? null],
    );
  } catch (error) {
    console.warn('automation run logging skipped:', error);
  }
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
      suggestedAppSections: deriveSuggestedAppSections({
        title: snippet.title || 'Untitled YouTube Video',
        description: snippet.description || '',
        channelTitle: snippet.channelTitle || 'YouTube Channel',
        isLive,
      }),
      suggestedTags: deriveSuggestedTags({
        title: snippet.title || 'Untitled YouTube Video',
        description: snippet.description || '',
        channelTitle: snippet.channelTitle || 'YouTube Channel',
        isLive,
      }),
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
  appSections?: string[];
  tags?: string[];
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
  const appSections = Array.isArray(params.appSections) ? normalizeTextList(params.appSections) : undefined;
  const sharedTags = Array.isArray(params.tags) ? normalizeTextList(params.tags) : [];

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
    const resolvedSections = normalizeTextList([...(appSections ?? []), ...video.suggestedAppSections]);
    const resolvedTags = normalizeTextList([...sharedTags, ...video.suggestedTags]);

    if (existing.rowCount && existing.rowCount > 0) {
      await pool.query(
        `UPDATE content_items
         SET title = $2,
             description = $3,
             visibility = $4,
             thumbnail_url = $5,
             source_kind = 'youtube',
             external_source_id = $6,
             channel_name = $7,
             duration_label = $8,
             app_sections = COALESCE($9::text[], app_sections),
             tags = COALESCE($10::text[], tags),
             updated_at = NOW()
         WHERE id = $1`,
        [
          existing.rows[0]!.id,
          title.slice(0, 180),
          description,
          params.visibility,
          video.thumbnailUrl,
          video.youtubeVideoId,
          video.channelTitle,
          video.duration,
          resolvedSections.length > 0 ? resolvedSections : null,
          resolvedTags.length > 0 ? resolvedTags : null,
        ],
      );
      updated += 1;
      continue;
    }

    await pool.query(
      `INSERT INTO content_items (
         author_id, title, description, content_type, media_url, thumbnail_url, visibility,
         source_kind, external_source_id, channel_name, duration_label, app_sections, tags
       )
       VALUES ($1, $2, $3, 'video', $4, $5, $6, 'youtube', $7, $8, $9, $10::text[], $11::text[])`,
      [
        params.actorUserId,
        title.slice(0, 180),
        description || 'Imported from YouTube channel feed.',
        video.url,
        video.thumbnailUrl,
        params.visibility,
        video.youtubeVideoId,
        video.channelTitle,
        video.duration,
        resolvedSections,
        resolvedTags,
      ],
    );
    created += 1;
  }

  if (payload.items.length === 0) {
    skipped = 1;
  }

  await recordAutomationRun({
    actorUserId: params.actorUserId,
    runType: 'youtube_sync',
    status: 'completed',
    summary: {
      channelId: payload.channelId,
      created,
      updated,
      skipped,
      fetched: payload.items.length,
    },
    notes: 'Bulk YouTube sync completed from admin dashboard.',
  });

  return {
    summary: { created, updated, skipped },
    channelId: payload.channelId,
    items: payload.items,
  };
}

export async function importYouTubeSelectionsToContent(params: {
  actorUserId: string;
  selections: Array<{
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
    visibility: ContentVisibility;
    appSections?: string[];
    tags?: string[];
  }>;
}): Promise<{
  summary: { created: number; updated: number; skipped: number };
  items: YouTubeVideoItem[];
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const selection of params.selections) {
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM content_items
       WHERE external_source_id = $1 OR media_url = $2
       LIMIT 1`,
      [selection.youtubeVideoId, selection.url],
    );

    const resolvedSections = normalizeTextList(selection.appSections);
    const resolvedTags = normalizeTextList(selection.tags);
    const description = [selection.description, `YouTube Channel: ${selection.channelTitle}`]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 5000);

    if (existing.rowCount && existing.rowCount > 0) {
      await pool.query(
        `UPDATE content_items
         SET title = $2,
             description = $3,
             visibility = $4,
             media_url = $5,
             thumbnail_url = $6,
             source_kind = 'youtube',
             external_source_id = $7,
             channel_name = $8,
             duration_label = $9,
             app_sections = $10::text[],
             tags = $11::text[],
             updated_at = NOW()
         WHERE id = $1`,
        [
          existing.rows[0]!.id,
          selection.title.trim().slice(0, 180),
          description,
          selection.visibility,
          selection.url,
          selection.thumbnailUrl,
          selection.youtubeVideoId,
          selection.channelTitle,
          selection.duration,
          resolvedSections,
          resolvedTags,
        ],
      );
      updated += 1;
      continue;
    }

    await pool.query(
      `INSERT INTO content_items (
         author_id, title, description, content_type, media_url, thumbnail_url, visibility,
         source_kind, external_source_id, channel_name, duration_label, app_sections, tags
       )
       VALUES ($1, $2, $3, 'video', $4, $5, $6, 'youtube', $7, $8, $9, $10::text[], $11::text[])`,
      [
        params.actorUserId,
        selection.title.trim().slice(0, 180),
        description || 'Imported from YouTube channel feed.',
        selection.url,
        selection.thumbnailUrl,
        selection.visibility,
        selection.youtubeVideoId,
        selection.channelTitle,
        selection.duration,
        resolvedSections,
        resolvedTags,
      ],
    );
    created += 1;
  }

  if (params.selections.length === 0) {
    skipped = 1;
  }

  await recordAutomationRun({
    actorUserId: params.actorUserId,
    runType: 'youtube_curated_import',
    status: 'completed',
    summary: {
      created,
      updated,
      skipped,
      selected: params.selections.length,
    },
    notes: 'Curated YouTube import completed from admin dashboard.',
  });

  return {
    summary: { created, updated, skipped },
    items: params.selections.map((selection) => ({
      youtubeVideoId: selection.youtubeVideoId,
      title: selection.title,
      description: selection.description,
      channelTitle: selection.channelTitle,
      publishedAt: selection.publishedAt,
      thumbnailUrl: selection.thumbnailUrl,
      url: selection.url,
      duration: selection.duration,
      isLive: selection.isLive,
      liveViewerCount: selection.liveViewerCount,
      suggestedAppSections: deriveSuggestedAppSections(selection),
      suggestedTags: deriveSuggestedTags(selection),
    })),
  };
}
