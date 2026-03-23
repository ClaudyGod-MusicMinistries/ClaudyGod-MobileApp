import { pool } from '../../db/pool';
import { isMissingDatabaseStructureError } from '../../lib/postgres';
import { listMostPlayedContent } from '../analytics/analytics.service';
import type { ContentSourceKind, ContentType } from '../content/content.types';
import type { LiveSessionStatus } from '../live/live.types';
import { fetchYouTubeVideos, type YouTubeVideoItem } from '../youtube/youtube.service';
import type { MobileFeedItem, MobileFeedRail, MobileFeedResponse } from './mobile.types';

interface PublishedContentRow {
  id: string;
  title: string;
  description: string;
  content_type: ContentType;
  media_url: string | null;
  thumbnail_url: string | null;
  source_kind: ContentSourceKind;
  channel_name: string | null;
  duration_label: string | null;
  app_sections: string[] | null;
  tags: string[] | null;
  created_at: string | Date;
  updated_at: string | Date;
  author_display_name: string | null;
}

interface LiveSessionFeedRow {
  id: string;
  title: string;
  description: string;
  status: LiveSessionStatus;
  channel_id: string;
  cover_image_url: string | null;
  stream_url: string | null;
  playback_url: string | null;
  viewer_count: number | string;
  app_sections: string[] | null;
  tags: string[] | null;
  scheduled_for: string | Date | null;
  started_at: string | Date | null;
  ended_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  host_display_name: string | null;
}

const FALLBACK_IMAGE = '';

const toIso = (value: string | Date): string => new Date(value).toISOString();

const normalizeTextList = (items?: string[] | null): string[] =>
  [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))];

const dedupeItems = (items: MobileFeedItem[]): MobileFeedItem[] => {
  const seen = new Set<string>();
  const result: MobileFeedItem[] = [];

  for (const item of items) {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
};

const textForSignals = (item: MobileFeedItem): string =>
  `${item.title} ${item.description} ${item.subtitle} ${item.appSections.join(' ')} ${item.tags.join(' ')}`.toLowerCase();

const classifyRail = (item: MobileFeedItem): 'music' | 'video' | 'playlist' | 'announcement' | 'live' => {
  if (item.isLive || item.type === 'live') {
    return 'live';
  }
  if (item.type === 'playlist') {
    return 'playlist';
  }
  if (item.type === 'announcement') {
    return 'announcement';
  }
  if (item.type === 'audio') {
    return 'music';
  }
  if (item.type === 'video') {
    const signals = textForSignals(item);
    if (/(worship|praise|song|music|choir|hymn|album|track|ministration)/.test(signals)) {
      return 'music';
    }
    if (/(announcement|update|event|conference|schedule|service time|notice)/.test(signals)) {
      return 'announcement';
    }
  }

  return 'video';
};

const buildRankScore = (item: MobileFeedItem, playCount: number): number => {
  const updatedAt = Date.parse(item.updatedAt || item.createdAt || '');
  const ageInDays = Number.isFinite(updatedAt)
    ? Math.max(0, (Date.now() - updatedAt) / (1000 * 60 * 60 * 24))
    : 365;
  const recencyScore = Math.max(0, 40 - ageInDays);
  const sectionBoost = item.appSections.some((section) => /feature|hero|home|spotlight/i.test(section)) ? 20 : 0;
  const liveBoost = item.isLive ? 30 : 0;
  const engagementBoost = Math.min(playCount * 4, 36);
  const sourceBoost = item.sourceKind === 'youtube' ? 8 : 0;

  return recencyScore + sectionBoost + liveBoost + engagementBoost + sourceBoost;
};

const toMobileFeedItem = (row: PublishedContentRow): MobileFeedItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  subtitle: row.channel_name || row.author_display_name || 'ClaudyGod',
  type: row.content_type,
  imageUrl: row.thumbnail_url || FALLBACK_IMAGE,
  mediaUrl: row.media_url ?? undefined,
  duration: row.duration_label ?? undefined,
  channelName: row.channel_name ?? undefined,
  sourceKind: row.source_kind,
  appSections: normalizeTextList(row.app_sections),
  tags: normalizeTextList(row.tags),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
});

const toYouTubeFeedItem = (item: YouTubeVideoItem): MobileFeedItem => ({
  id: `yt:${item.youtubeVideoId}`,
  title: item.title,
  description: item.description || 'Latest release from the ministry YouTube feed.',
  subtitle: item.channelTitle || 'ClaudyGod',
  type: item.isLive ? 'live' : 'video',
  imageUrl: item.thumbnailUrl || FALLBACK_IMAGE,
  mediaUrl: item.url,
  duration: item.duration || undefined,
  channelName: item.channelTitle || undefined,
  sourceKind: 'youtube',
  appSections: normalizeTextList(item.suggestedAppSections),
  tags: normalizeTextList(item.suggestedTags),
  createdAt: item.publishedAt,
  updatedAt: item.publishedAt,
  isLive: item.isLive,
  liveViewerCount: item.liveViewerCount,
  notificationChannelId: item.isLive ? 'claudygod-live' : undefined,
});

const toLiveFeedItem = (row: LiveSessionFeedRow): MobileFeedItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  subtitle: row.host_display_name || 'ClaudyGod Live',
  type: 'live',
  imageUrl: row.cover_image_url || FALLBACK_IMAGE,
  mediaUrl: row.playback_url || row.stream_url || undefined,
  duration: row.status === 'live' ? 'LIVE' : row.status === 'scheduled' ? 'Upcoming' : 'Replay',
  channelName: row.channel_id || 'claudygod-live',
  sourceKind: 'external',
  appSections: normalizeTextList(row.app_sections?.length ? row.app_sections : ['live-now']),
  tags: normalizeTextList([...(row.tags ?? []), row.status]),
  createdAt: toIso(row.started_at || row.scheduled_for || row.created_at),
  updatedAt: toIso(row.updated_at),
  isLive: row.status === 'live',
  liveViewerCount: Number(row.viewer_count ?? 0),
  notificationChannelId: row.channel_id || 'claudygod-live',
});

const loadPublishedContent = async (limit = 120): Promise<MobileFeedItem[]> => {
  let result;
  try {
    result = await pool.query<PublishedContentRow>(
      `SELECT
         c.id,
         c.title,
         c.description,
         c.content_type,
         c.media_url,
         c.thumbnail_url,
         c.source_kind,
         c.channel_name,
         c.duration_label,
         c.app_sections,
         c.tags,
         c.created_at,
         c.updated_at,
         u.display_name AS author_display_name
       FROM content_items c
       INNER JOIN app_users u ON u.id = c.author_id
       WHERE c.visibility = 'published'
       ORDER BY c.updated_at DESC, c.created_at DESC
       LIMIT $1`,
      [limit],
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return [];
    }
    throw error;
  }

  return result.rows.map(toMobileFeedItem);
};

const loadLiveSessions = async (limit = 24): Promise<MobileFeedItem[]> => {
  let result;
  try {
    result = await pool.query<LiveSessionFeedRow>(
      `SELECT
         ls.id,
         ls.title,
         ls.description,
         ls.status,
         ls.channel_id,
         ls.cover_image_url,
         ls.stream_url,
         ls.playback_url,
         ls.viewer_count,
         ls.app_sections,
         ls.tags,
         ls.scheduled_for,
         ls.started_at,
         ls.ended_at,
         ls.created_at,
         ls.updated_at,
         host.display_name AS host_display_name
       FROM live_sessions ls
       LEFT JOIN app_users host ON host.id = ls.created_by
       WHERE ls.status IN ('live', 'scheduled', 'ended')
         AND (ls.status != 'ended' OR COALESCE(ls.ended_at, ls.updated_at) >= NOW() - INTERVAL '45 days')
       ORDER BY
         CASE ls.status
           WHEN 'live' THEN 0
           WHEN 'scheduled' THEN 1
           ELSE 2
         END,
         COALESCE(ls.started_at, ls.scheduled_for, ls.updated_at) DESC
       LIMIT $1`,
      [limit],
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return [];
    }
    throw error;
  }

  return result.rows.map(toLiveFeedItem);
};

const buildRail = (id: string, title: string, algorithm: string, items: MobileFeedItem[], limit: number): MobileFeedRail => ({
  id,
  title,
  algorithm,
  items: dedupeItems(items).slice(0, limit),
});

export const buildMobileFeed = async (): Promise<MobileFeedResponse> => {
  const [publishedContent, liveSessions, mostPlayedResult, youtubeResult] = await Promise.all([
    loadPublishedContent(),
    loadLiveSessions(),
    listMostPlayedContent({ limit: 12, windowDays: 90 }),
    fetchYouTubeVideos({ maxResults: 20 }).catch(() => ({
      channelId: '',
      fetchedAt: new Date().toISOString(),
      items: [] as YouTubeVideoItem[],
    })),
  ]);

  const youtubeItems = youtubeResult.items.map(toYouTubeFeedItem);
  const publishedById = new Map(publishedContent.map((item) => [item.id, item]));
  const playCountById = new Map<string, number>();

  const trending = mostPlayedResult.items.map((item) => {
    playCountById.set(item.id, item.playCount);
    const existing = publishedById.get(item.id);
    if (existing) {
      return existing;
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      subtitle: 'ClaudyGod',
      type: item.type,
      imageUrl: FALLBACK_IMAGE,
      mediaUrl: item.url,
      appSections: [],
      tags: [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    } satisfies MobileFeedItem;
  });

  const unifiedPool = dedupeItems([...liveSessions, ...publishedContent, ...youtubeItems, ...trending]);

  const ranked = [...unifiedPool].sort((left, right) => {
    const scoreDiff =
      buildRankScore(right, playCountById.get(right.id) ?? 0) -
      buildRankScore(left, playCountById.get(left.id) ?? 0);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return Date.parse(right.updatedAt || right.createdAt) - Date.parse(left.updatedAt || left.createdAt);
  });

  const live = unifiedPool.filter((item) => classifyRail(item) === 'live');
  const music = unifiedPool.filter((item) => classifyRail(item) === 'music');
  const videos = unifiedPool.filter((item) => classifyRail(item) === 'video');
  const playlists = unifiedPool.filter((item) => classifyRail(item) === 'playlist');
  const announcements = unifiedPool.filter((item) => classifyRail(item) === 'announcement');
  const recent = [...unifiedPool].sort(
    (left, right) => Date.parse(right.updatedAt || right.createdAt) - Date.parse(left.updatedAt || left.createdAt),
  );

  const rails = [
    buildRail('top-picks', 'Top Picks', 'editorial_blend_v1', ranked, 12),
    buildRail('trending-now', 'Trending Now', 'engagement_90d_v1', trending, 12),
    buildRail('worship-music', 'Worship Music', 'music_relevance_v1', music, 14),
    buildRail('video-spotlight', 'Video Spotlight', 'video_relevance_v1', videos, 14),
    buildRail('live-now', 'Live Now', 'live_priority_v1', live, 10),
    buildRail('playlists', 'Playlists', 'collection_curated_v1', playlists, 12),
    buildRail('ministry-updates', 'Ministry Updates', 'announcement_editorial_v1', announcements, 8),
    buildRail('latest-releases', 'Latest Releases', 'recency_v1', recent, 12),
  ].filter((rail) => rail.items.length > 0);

  return {
    generatedAt: new Date().toISOString(),
    featured: ranked[0] ?? null,
    rails,
    topCategories: rails.map((rail) => rail.title).slice(0, 5),
  };
};
