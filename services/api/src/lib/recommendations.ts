import { pool } from '../db/pool';
import { CacheService, CacheTTL } from './cache';
import type { CursorPage } from './pagination';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  contentType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  channelName: string | null;
  durationLabel: string | null;
  tags: string[];
  appSections: string[];
  visibility: string;
  createdAt: string;
  updatedAt: string;
  trendingScore?: number;
}

interface ContentRow {
  id: string;
  title: string;
  description: string;
  content_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  channel_name: string | null;
  duration_label: string | null;
  tags: string[];
  app_sections: string[];
  visibility: string;
  created_at: Date;
  updated_at: Date;
  trending_score?: string;
}

const rowToItem = (row: ContentRow): ContentItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  contentType: row.content_type,
  mediaUrl: row.media_url,
  thumbnailUrl: row.thumbnail_url,
  channelName: row.channel_name,
  durationLabel: row.duration_label,
  tags: row.tags,
  appSections: row.app_sections,
  visibility: row.visibility,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
  trendingScore: row.trending_score ? parseFloat(row.trending_score) : undefined,
});

async function getTagAffinityContent(userId: string, limit: number): Promise<ContentItem[]> {
  const result = await pool.query<ContentRow>(
    `WITH user_top_tags AS (
       SELECT UNNEST(usi.tags::text[]) AS tag
       FROM user_saved_items usi
       WHERE usi.user_id = $1
         AND usi.bucket = 'liked'
         AND usi.created_at > NOW() - INTERVAL '30 days'
       UNION ALL
       SELECT UNNEST(ci.tags) AS tag
       FROM user_play_events upe
       INNER JOIN content_items ci ON ci.id = upe.content_id::uuid
       WHERE upe.user_id = $1
         AND upe.played_at > NOW() - INTERVAL '30 days'
         AND upe.content_id ~ '^[0-9a-f-]{36}$'
     ),
     tag_counts AS (
       SELECT tag, COUNT(*) AS freq
       FROM user_top_tags
       GROUP BY tag
       ORDER BY freq DESC
       LIMIT 10
     ),
     played_ids AS (
       SELECT content_id::uuid AS id
       FROM user_play_events
       WHERE user_id = $1
         AND played_at > NOW() - INTERVAL '7 days'
         AND content_id ~ '^[0-9a-f-]{36}$'
     )
     SELECT ci.*, COALESCE(cs.trending_score, 0) AS trending_score
     FROM content_items ci
     LEFT JOIN content_item_stats cs ON cs.content_id = ci.id
     WHERE ci.visibility = 'published'
       AND ci.id NOT IN (SELECT id FROM played_ids)
       AND ci.tags && (SELECT ARRAY_AGG(tag) FROM tag_counts)
     ORDER BY cs.trending_score DESC NULLS LAST, ci.created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return result.rows.map(rowToItem);
}

async function getCategoryRecencyContent(userId: string, limit: number): Promise<ContentItem[]> {
  const result = await pool.query<ContentRow>(
    `WITH user_recent_types AS (
       SELECT ci.content_type, COUNT(*) AS freq
       FROM user_play_events upe
       INNER JOIN content_items ci ON ci.id = upe.content_id::uuid
       WHERE upe.user_id = $1
         AND upe.played_at > NOW() - INTERVAL '7 days'
         AND upe.content_id ~ '^[0-9a-f-]{36}$'
       GROUP BY ci.content_type
       ORDER BY freq DESC
       LIMIT 3
     ),
     played_ids AS (
       SELECT content_id::uuid AS id
       FROM user_play_events
       WHERE user_id = $1
         AND played_at > NOW() - INTERVAL '7 days'
         AND content_id ~ '^[0-9a-f-]{36}$'
     )
     SELECT ci.*, COALESCE(cs.trending_score, 0) AS trending_score
     FROM content_items ci
     LEFT JOIN content_item_stats cs ON cs.content_id = ci.id
     WHERE ci.visibility = 'published'
       AND ci.id NOT IN (SELECT id FROM played_ids)
       AND ci.content_type IN (SELECT content_type FROM user_recent_types)
     ORDER BY cs.trending_score DESC NULLS LAST, ci.created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return result.rows.map(rowToItem);
}

async function getTrendingContent(userId: string, limit: number): Promise<ContentItem[]> {
  const result = await pool.query<ContentRow>(
    `WITH played_ids AS (
       SELECT content_id::uuid AS id
       FROM user_play_events
       WHERE user_id = $1
         AND played_at > NOW() - INTERVAL '7 days'
         AND content_id ~ '^[0-9a-f-]{36}$'
     ),
     latest_trending AS (
       SELECT DISTINCT ON (content_id)
         content_id, score
       FROM trending_snapshots
       WHERE period = 'daily'
       ORDER BY content_id, calculated_at DESC
     )
     SELECT ci.*, lt.score AS trending_score
     FROM content_items ci
     INNER JOIN latest_trending lt ON lt.content_id = ci.id
     WHERE ci.visibility = 'published'
       AND ci.id NOT IN (SELECT id FROM played_ids)
     ORDER BY lt.score DESC
     LIMIT $2`,
    [userId, limit],
  );
  return result.rows.map(rowToItem);
}

async function getCollaborativeContent(userId: string, limit: number): Promise<ContentItem[]> {
  const result = await pool.query<ContentRow>(
    `WITH my_played AS (
       SELECT content_id
       FROM user_play_events
       WHERE user_id = $1
         AND played_at > NOW() - INTERVAL '30 days'
         AND content_id ~ '^[0-9a-f-]{36}$'
     ),
     similar_users AS (
       SELECT upe.user_id, COUNT(*) AS overlap
       FROM user_play_events upe
       WHERE upe.content_id IN (SELECT content_id FROM my_played)
         AND upe.user_id != $1
       GROUP BY upe.user_id
       HAVING COUNT(*) >= 3
       ORDER BY overlap DESC
       LIMIT 50
     ),
     collaborative_content AS (
       SELECT upe.content_id::uuid AS content_id, COUNT(*) AS engagement
       FROM user_play_events upe
       INNER JOIN similar_users su ON su.user_id = upe.user_id
       WHERE upe.content_id NOT IN (SELECT content_id FROM my_played)
         AND upe.content_id ~ '^[0-9a-f-]{36}$'
       GROUP BY upe.content_id
       ORDER BY engagement DESC
       LIMIT $2
     )
     SELECT ci.*, COALESCE(cs.trending_score, 0) AS trending_score
     FROM content_items ci
     INNER JOIN collaborative_content cc ON cc.content_id = ci.id
     LEFT JOIN content_item_stats cs ON cs.content_id = ci.id
     WHERE ci.visibility = 'published'
     ORDER BY cc.engagement DESC`,
    [userId, limit],
  );
  return result.rows.map(rowToItem);
}

function deduplicateById(items: ContentItem[]): ContentItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function assemblePersonalizedFeed(
  userId: string,
  limit = 20,
): Promise<CursorPage<ContentItem>> {
  const cacheKey = `${userId}:${limit}`;
  const cached = await CacheService.get<CursorPage<ContentItem>>('rec', cacheKey);
  if (cached) return cached;

  const [tagItems, categoryItems, trendingItems, collabItems] = await Promise.all([
    getTagAffinityContent(userId, Math.ceil(limit * 0.4)),
    getCategoryRecencyContent(userId, Math.ceil(limit * 0.25)),
    getTrendingContent(userId, Math.ceil(limit * 0.2)),
    getCollaborativeContent(userId, Math.ceil(limit * 0.15)),
  ]);

  const blended = deduplicateById([
    ...tagItems,
    ...categoryItems,
    ...trendingItems,
    ...collabItems,
  ]).slice(0, limit);

  const page: CursorPage<ContentItem> = {
    items: blended,
    nextCursor: null,
    prevCursor: null,
    hasMore: false,
  };

  await CacheService.set('rec', cacheKey, page, CacheTTL.RECOMMENDATIONS);
  return page;
}
