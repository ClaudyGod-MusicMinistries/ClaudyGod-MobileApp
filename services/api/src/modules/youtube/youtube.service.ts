import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { BadRequestError, HttpError, NotFoundError } from '../../lib/errors';
import { createLogger } from '../../lib/logger';
import { buildPublicObjectUrl, putObjectBuffer } from '../../infra/s3';
import type { ContentType, ContentVisibility } from '../content/content.types';

const log = createLogger('youtube.service');

// Re-hosts a YouTube-CDN thumbnail to our own storage so imported content doesn't
// depend on i.ytimg.com — falls back to the source URL if the fetch/upload fails,
// since a broken re-host shouldn't block an otherwise-valid import.
async function rehostThumbnail(videoId: string, sourceUrl: string): Promise<string> {
  if (!env.S3_ENABLED || (!sourceUrl && !videoId)) {
    return sourceUrl || (videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : '');
  }
  const urlsToTry = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    sourceUrl,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  ].filter(Boolean);
  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      // Skip YouTube's ~1097 byte blank placeholder for missing maxres/sd
      if (arrayBuffer.byteLength < 1500 && (url.includes('maxresdefault') || url.includes('sddefault'))) {
        continue;
      }
      if (arrayBuffer.byteLength < 500) continue;
      const key = `content/youtube-thumbnails/${videoId}.jpg`;
      await putObjectBuffer({
        bucket: env.SUPABASE_STORAGE_BUCKET,
        key,
        contentType,
        body: Buffer.from(arrayBuffer),
      });
      return buildPublicObjectUrl(key);
    } catch {
      continue;
    }
  }
  log.warn('Failed to rehost YouTube thumbnail, falling back to source URL', { videoId, sourceUrl });
  return sourceUrl || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

// In-memory cache for hot thumbnails (max 300 entries, 1-hour TTL)
const thumbnailCache = new Map<string, { buffer: Buffer; contentType: string; expiresAt: number }>();

export async function getYouTubeThumbnailBuffer(
  videoId: string,
  preferredUrl?: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const cached = thumbnailCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return { buffer: cached.buffer, contentType: cached.contentType };
  }

  const urlsToTry = [
    preferredUrl,
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
  ].filter((u): u is string => Boolean(u && u.trim()));

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3500),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      // YouTube returns a ~1097 byte blank placeholder when maxres/sd is absent
      if (arrayBuffer.byteLength < 1500 && (url.includes('maxresdefault') || url.includes('sddefault'))) {
        continue;
      }
      if (arrayBuffer.byteLength > 200) {
        const buffer = Buffer.from(arrayBuffer);
        if (thumbnailCache.size > 300) {
          const firstKey = thumbnailCache.keys().next().value;
          if (firstKey) thumbnailCache.delete(firstKey);
        }
        thumbnailCache.set(videoId, { buffer, contentType, expiresAt: Date.now() + 3600_000 });

        if (env.S3_ENABLED) {
          void putObjectBuffer({
            bucket: env.SUPABASE_STORAGE_BUCKET,
            key: `content/youtube-thumbnails/${videoId}.jpg`,
            contentType,
            body: buffer,
          }).catch(() => undefined);
        }

        return { buffer, contentType };
      }
    } catch {
      continue;
    }
  }

  // Graceful dark 16:9 branded SVG placeholder if all YouTube endpoints fail or are blocked
  const fallbackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="100%" height="100%" fill="#0d0e15"/>
  <circle cx="640" cy="360" r="70" fill="#7c3aed" opacity="0.2"/>
  <polygon points="620,320 680,360 620,400" fill="#a78bfa"/>
  <text x="640" y="470" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#94a3b8" text-anchor="middle">ClaudyGod Ministry</text>
</svg>`.trim();

  return {
    buffer: Buffer.from(fallbackSvg, 'utf8'),
    contentType: 'image/svg+xml',
  };
}

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
  // Server-verified — populated by a live join against content_items, not a
  // capped/cached guess, so it's accurate regardless of channel size or how
  // far back an import happened.
  contentId: string | null;
  contentVisibility: 'draft' | 'published' | null;
}

// Joins a batch of freshly-fetched YouTube videos against content_items so the
// Browse & Import grid can show real, verified "already in Content" state
// instead of cross-referencing a separately-fetched, capped recent-imports list.
async function attachContentState(
  items: Array<Omit<YouTubeVideoItem, 'contentId' | 'contentVisibility'>>,
): Promise<YouTubeVideoItem[]> {
  if (items.length === 0) {
    return [];
  }

  const videoIds = items.map((item) => item.youtubeVideoId);
  const result = await pool.query<{ external_source_id: string; id: string; visibility: 'draft' | 'published' }>(
    `SELECT external_source_id, id, visibility
     FROM content_items
     WHERE external_source_id = ANY($1::text[]) AND deleted_at IS NULL`,
    [videoIds],
  );
  const byVideoId = new Map(result.rows.map((row) => [row.external_source_id, row]));

  return items.map((item) => {
    const match = byVideoId.get(item.youtubeVideoId);
    return {
      ...item,
      contentId: match?.id ?? null,
      contentVisibility: match?.visibility ?? null,
    };
  });
}

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      liveBroadcastContent?: string;
      thumbnails?: {
        maxres?: { url?: string };
        standard?: { url?: string };
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
  nextPageToken?: string;
  error?: { message?: string };
}

interface YouTubeVideosResponse {
  items?: Array<{
    id?: string;
    contentDetails?: { duration?: string };
    liveStreamingDetails?: { concurrentViewers?: string };
    snippet?: {
      liveBroadcastContent?: string;
      title?: string;
      description?: string;
      channelTitle?: string;
      thumbnails?: {
        maxres?: { url?: string };
        standard?: { url?: string };
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
  error?: { message?: string };
}

interface YouTubeChannelsResponse {
  items?: Array<{ id?: string }>;
  error?: { message?: string };
}

const normalizeTextList = (items?: string[]): string[] =>
  [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))];

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

export function decodeHtmlEntities(input?: string): string {
  if (!input) return '';
  let str = input;
  for (let i = 0; i < 3; i++) {
    const prev = str;
    str = str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        try {
          return String.fromCharCode(parseInt(hex, 16));
        } catch {
          return _;
        }
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        try {
          return String.fromCharCode(Number(dec));
        } catch {
          return _;
        }
      });
    if (str === prev) break;
  }
  return str;
}

export function inferContentType(video: {
  title: string;
  description?: string;
  duration?: string;
}): 'audio' | 'video' {
  const text = `${video.title} ${video.description ?? ''}`.toLowerCase();

  // Explicit audio signals
  const isAudioExplicit =
    /(official audio|audio release|audio track|studio audio|album track|official single|instrumental|acoustic version)/i.test(
      text,
    );
  if (isAudioExplicit) return 'audio';

  // Explicit video/teaching signals
  const isVideoExplicit =
    /(official video|music video|full message|sermon|teaching|conference|interview|podcast|broadcast|exhortation|bible study)/i.test(
      text,
    );
  if (isVideoExplicit) return 'video';

  // Music keywords: song, worship, praise, hymn, melody
  const isMusic = /(song|worship|praise|hymn|melody|psalm|track|choir|gospel song)/i.test(text);

  // Parse duration if available (e.g. "04:09", "28:32")
  const durationParts = (video.duration ?? '').split(':').map(Number);
  const totalSeconds =
    durationParts.length === 2
      ? (durationParts[0] ?? 0) * 60 + (durationParts[1] ?? 0)
      : durationParts.length === 3
        ? (durationParts[0] ?? 0) * 3600 + (durationParts[1] ?? 0) * 60 + (durationParts[2] ?? 0)
        : 0;

  // Typical music length (< 8 minutes) with music signals defaults to audio
  if (isMusic && (totalSeconds === 0 || totalSeconds < 480)) {
    return 'audio';
  }

  return 'video';
}

function pickThumbnail(
  thumbnails?: {
    maxres?: { url?: string };
    standard?: { url?: string };
    high?: { url?: string };
    medium?: { url?: string };
    default?: { url?: string };
  },
  videoId?: string,
): string {
  // Always prioritize highest resolution available in YouTube API metadata:
  if (thumbnails?.maxres?.url) return thumbnails.maxres.url;
  if (thumbnails?.standard?.url) return thumbnails.standard.url;
  if (thumbnails?.high?.url) return thumbnails.high.url;
  if (thumbnails?.medium?.url) return thumbnails.medium.url;
  if (thumbnails?.default?.url) return thumbnails.default.url;
  if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return 'https://i.ytimg.com/vi/default/hqdefault.jpg';
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
  publishedAt?: string;
}): string[] {
  const signals = buildVideoSignals(video);
  const sections: string[] = [];

  const isMusic = /(worship|praise|song|music|choir|hymn|album|track|ministration|melody|psalm)/i.test(signals);
  const isVideoOrMessage = /(message|sermon|teaching|conference|service|prayer|word|nugget|truth|daily word|devotion|scripture|verse|reflection|interview)/i.test(signals);

  // Check upload recency: if published within 30 days (or upcoming/future release date), suggest 'latest-releases'
  if (video.publishedAt) {
    const publishedTime = new Date(video.publishedAt).getTime();
    if (!isNaN(publishedTime)) {
      const now = Date.now();
      const ageDays = (now - publishedTime) / (1000 * 60 * 60 * 24);
      if (ageDays <= 30 || publishedTime > now) {
        sections.push('latest-releases');
      }
    }
  }

  if (isMusic) {
    sections.push('music-featured');
    if (!sections.includes('latest-releases')) {
      sections.push('home-featured');
    }
  }

  if (isVideoOrMessage || video.isLive) {
    sections.push('video-featured');
  }

  if (video.isLive && !sections.includes('home-featured')) {
    sections.push('home-featured');
  }

  if (sections.length === 0) {
    sections.push('video-featured');
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
    log.warn('automation run logging skipped', { error });
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
    throw new BadRequestError('Invalid YouTube channel identifier', 'YOUTUBE_INVALID_CHANNEL_ID');
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
    throw new NotFoundError(`Unable to resolve YouTube channel handle @${extracted.handle}`, 'YOUTUBE_CHANNEL_NOT_FOUND');
  }

  return id;
}

export async function fetchYouTubeVideos(input?: {
  channelId?: string;
  maxResults?: number;
  pageToken?: string;
}): Promise<{
  channelId: string;
  fetchedAt: string;
  items: YouTubeVideoItem[];
  nextPageToken: string | null;
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
  if (input?.pageToken) {
    searchParams.set('pageToken', input.pageToken);
  }

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
      nextPageToken: search.nextPageToken ?? null,
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

  const rawItems: Array<Omit<YouTubeVideoItem, 'contentId' | 'contentVisibility'>> = searchItems.map((item) => {
    const id = item.id!.videoId!;
    const searchSnippet = item.snippet!;
    const details = detailsById.get(id);
    const videoSnippet = details?.snippet || searchSnippet;
    const liveBroadcastContent = videoSnippet.liveBroadcastContent ?? details?.snippet?.liveBroadcastContent;
    const isLive = liveBroadcastContent === 'live';

    const title = decodeHtmlEntities(videoSnippet.title || searchSnippet.title || 'Untitled YouTube Video');
    const description = decodeHtmlEntities(videoSnippet.description || searchSnippet.description || '');
    const channelTitle = decodeHtmlEntities(videoSnippet.channelTitle || searchSnippet.channelTitle || 'YouTube Channel');
    const thumbnailUrl = pickThumbnail(videoSnippet.thumbnails || searchSnippet.thumbnails, id);

    return {
      youtubeVideoId: id,
      title,
      description,
      channelTitle,
      publishedAt: searchSnippet.publishedAt || new Date().toISOString(),
      thumbnailUrl,
      url: `https://www.youtube.com/watch?v=${id}`,
      duration: isLive ? 'LIVE' : formatIsoDuration(details?.contentDetails?.duration),
      isLive,
      liveViewerCount: details?.liveStreamingDetails?.concurrentViewers
        ? Number(details.liveStreamingDetails.concurrentViewers)
        : undefined,
      suggestedAppSections: deriveSuggestedAppSections({
        title,
        description,
        channelTitle,
        isLive,
        publishedAt: searchSnippet.publishedAt,
      }),
      suggestedTags: deriveSuggestedTags({
        title,
        description,
        channelTitle,
        isLive,
      }),
    };
  });

  return {
    channelId,
    fetchedAt: new Date().toISOString(),
    items: await attachContentState(rawItems),
    nextPageToken: search.nextPageToken ?? null,
  };
}

// Safety cap on how many videos a single "Sync all" run will walk through — high
// enough to cover any realistic channel size while bounding YouTube API quota
// usage and run time if something is misconfigured (e.g. a channel ID typo that
// somehow still resolves).
const SYNC_MAX_PAGES = 20;

// The single place that turns one YouTube video into a content_items row — used
// by both the full-channel sync and the explicit curated-selection import so
// there's exactly one INSERT/UPDATE to fix when the shape of that row changes.
// Sections/tags are preserved (not wiped) when the caller passes none, since a
// routine re-sync shouldn't silently clear an admin's manual section tagging.
async function upsertYouTubeVideoToContent(params: {
  actorUserId: string;
  youtubeVideoId: string;
  title: string;
  description: string;
  channelTitle: string;
  url: string;
  thumbnailUrl: string;
  duration: string;
  visibility: ContentVisibility;
  appSections: string[];
  tags: string[];
  // Admin-chosen at import time (bulk import / "Send to Content" only — the
  // unattended full-channel sync has no human present to ask, so it keeps
  // defaulting to 'video' and can be corrected afterward via Content edit).
  contentType?: Extract<ContentType, 'audio' | 'video'>;
}): Promise<{ created: boolean; contentId: string }> {
  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM content_items WHERE external_source_id = $1 OR media_url = $2 LIMIT 1`,
    [params.youtubeVideoId, params.url],
  );

  const title = decodeHtmlEntities(params.title).trim().slice(0, 180);
  const description = [decodeHtmlEntities(params.description), `YouTube Channel: ${params.channelTitle}`]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 5000);
  const resolvedSections = normalizeTextList(params.appSections);
  const resolvedTags = normalizeTextList(params.tags);
  const hostedThumbnailUrl = await rehostThumbnail(params.youtubeVideoId, params.thumbnailUrl);

  if (existing.rowCount && existing.rowCount > 0) {
    const contentId = existing.rows[0]!.id;
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
           app_sections = COALESCE($10::text[], app_sections),
           tags = COALESCE($11::text[], tags),
           updated_at = NOW()
       WHERE id = $1`,
      [
        contentId,
        title,
        description,
        params.visibility,
        params.url,
        hostedThumbnailUrl,
        params.youtubeVideoId,
        params.channelTitle,
        params.duration,
        resolvedSections.length > 0 ? resolvedSections : null,
        resolvedTags.length > 0 ? resolvedTags : null,
      ],
    );
    return { created: false, contentId };
  }

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO content_items (
       author_id, title, description, content_type, media_url, thumbnail_url, visibility,
       source_kind, external_source_id, channel_name, duration_label, app_sections, tags
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'youtube', $8, $9, $10, $11::text[], $12::text[])
     RETURNING id`,
    [
      params.actorUserId,
      title,
      description || 'Imported from YouTube channel feed.',
      params.contentType ?? inferContentType({ title, description, duration: params.duration }),
      params.url,
      hostedThumbnailUrl,
      params.visibility,
      params.youtubeVideoId,
      params.channelTitle,
      params.duration,
      resolvedSections,
      resolvedTags,
    ],
  );
  return { created: true, contentId: inserted.rows[0]!.id };
}

export async function syncYouTubeVideosToContent(params: {
  actorUserId: string;
  visibility: ContentVisibility;
  channelId?: string;
  maxResults?: number;
  appSections?: string[];
  tags?: string[];
}): Promise<{
  summary: { created: number; updated: number; skipped: number; fetched: number };
  channelId: string;
  queued: number;
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let fetched = 0;
  let channelId = '';
  const appSections = Array.isArray(params.appSections) ? normalizeTextList(params.appSections) : undefined;
  const sharedTags = Array.isArray(params.tags) ? normalizeTextList(params.tags) : [];

  let pageToken: string | undefined;
  let page = 0;

  do {
    const payload = await fetchYouTubeVideos({
      channelId: params.channelId,
      maxResults: params.maxResults ?? 50,
      pageToken,
    });
    channelId = payload.channelId;
    fetched += payload.items.length;

    for (const video of payload.items) {
      const resolvedSections = normalizeTextList([...(appSections ?? []), ...video.suggestedAppSections]);
      const resolvedTags = normalizeTextList([...sharedTags, ...video.suggestedTags]);
      const inferredContentType = inferContentType({
        title: video.title,
        description: video.description,
        duration: video.duration,
      });

      const result = await upsertYouTubeVideoToContent({
        actorUserId: params.actorUserId,
        youtubeVideoId: video.youtubeVideoId,
        title: video.title,
        description: video.description,
        channelTitle: video.channelTitle,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        visibility: params.visibility,
        appSections: resolvedSections,
        tags: resolvedTags,
        contentType: inferredContentType,
      });

      if (result.created) {
        created += 1;
      } else {
        updated += 1;
      }
    }

    pageToken = payload.nextPageToken ?? undefined;
    page += 1;
  } while (pageToken && page < SYNC_MAX_PAGES);

  if (fetched === 0) {
    skipped = 1;
  }

  await recordAutomationRun({
    actorUserId: params.actorUserId,
    runType: 'youtube_sync',
    status: 'completed',
    summary: { channelId, created, updated, skipped, fetched },
    notes: 'Bulk YouTube sync completed from admin dashboard.',
  });

  return {
    summary: { created, updated, skipped, fetched },
    channelId,
    queued: created + updated,
  };
}

export async function getYouTubeSyncStatus(): Promise<{
  channelId: string | null;
  channelTitle: string | null;
  lastSyncedAt: string | null;
  videoCount: number;
  status: 'idle' | 'syncing' | 'error';
}> {
  const [countResult, latestVideoResult, latestRunResult] = await Promise.all([
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM content_items WHERE source_kind = 'youtube' AND deleted_at IS NULL`,
    ),
    pool.query<{ channel_name: string | null }>(
      `SELECT channel_name FROM content_items
       WHERE source_kind = 'youtube' AND channel_name IS NOT NULL AND deleted_at IS NULL
       ORDER BY updated_at DESC LIMIT 1`,
    ),
    pool.query<{ status: 'pending' | 'processing' | 'completed' | 'failed'; created_at: string | Date }>(
      `SELECT status, created_at FROM automation_runs
       WHERE run_type IN ('youtube_sync', 'youtube_curated_import')
       ORDER BY created_at DESC LIMIT 1`,
    ).catch(() => ({ rows: [] as Array<{ status: 'pending' | 'processing' | 'completed' | 'failed'; created_at: string | Date }> })),
  ]);

  const latestRun = latestRunResult.rows[0] ?? null;

  return {
    channelId: env.YOUTUBE_CHANNEL_ID || null,
    channelTitle: latestVideoResult.rows[0]?.channel_name ?? null,
    lastSyncedAt: latestRun ? new Date(latestRun.created_at).toISOString() : null,
    videoCount: Number(countResult.rows[0]?.count ?? 0),
    status: latestRun?.status === 'failed' ? 'error' : 'idle',
  };
}

export async function listYouTubeImportQueue(): Promise<
  Array<{
    id: string;
    videoId: string;
    title: string;
    status: 'pending' | 'imported' | 'skipped' | 'error';
    visibility: 'draft' | 'published';
    importedAt: string | null;
  }>
> {
  const result = await pool.query<{
    id: string;
    external_source_id: string | null;
    title: string;
    visibility: 'draft' | 'published';
    created_at: string | Date;
  }>(
    `SELECT id, external_source_id, title, visibility, created_at
     FROM content_items
     WHERE source_kind = 'youtube' AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 200`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    videoId: row.external_source_id ?? '',
    title: row.title,
    status: 'imported' as const,
    visibility: row.visibility,
    importedAt: new Date(row.created_at).toISOString(),
  }));
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
    contentType?: Extract<ContentType, 'audio' | 'video'>;
  }>;
}): Promise<{
  summary: { created: number; updated: number; skipped: number };
  imported: number;
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const selection of params.selections) {
    const result = await upsertYouTubeVideoToContent({
      actorUserId: params.actorUserId,
      youtubeVideoId: selection.youtubeVideoId,
      title: selection.title,
      description: selection.description,
      channelTitle: selection.channelTitle,
      url: selection.url,
      thumbnailUrl: selection.thumbnailUrl,
      duration: selection.duration,
      visibility: selection.visibility,
      contentType: selection.contentType,
      appSections: normalizeTextList(selection.appSections),
      tags: normalizeTextList(selection.tags),
    });

    if (result.created) {
      created += 1;
    } else {
      updated += 1;
    }
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
    imported: created + updated,
  };
}
