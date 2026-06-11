import { pool } from '../../db/pool';
import { CacheService, CacheTTL } from '../../lib/cache';
import type { CursorPage } from '../../lib/pagination';
import type { SearchQuery } from './search.schema';

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  contentType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  channelName: string | null;
  durationLabel: string | null;
  tags: string[];
  highlight: string | null;
  rank: number;
  createdAt: string;
}

interface SearchRow {
  id: string;
  title: string;
  description: string;
  content_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  channel_name: string | null;
  duration_label: string | null;
  tags: string[];
  highlight: string | null;
  rank: string;
  created_at: Date;
}

interface SearchEventRow {
  id: string;
}

const tsQuery = (q: string): string =>
  q.trim().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean).join(' & ');

export async function searchContent(
  query: SearchQuery,
  userId?: string,
): Promise<CursorPage<SearchResultItem> & { searchEventId?: string }> {
  const { q, type, tags, after, before, limit } = query;
  const sanitized = tsQuery(q);

  if (!sanitized) {
    return { items: [], nextCursor: null, prevCursor: null, hasMore: false };
  }

  const cacheKey = `${sanitized}:${type ?? ''}:${(tags ?? []).join(',')}:${after ?? ''}:${before ?? ''}:${limit}`;
  const cached = await CacheService.get<CursorPage<SearchResultItem>>('search', cacheKey);

  const params: unknown[] = [sanitized, limit + 1];
  const conditions: string[] = ["ci.visibility = 'published'", 'ci.search_vector @@ to_tsquery($1)'];
  let paramIdx = 3;

  if (type) {
    conditions.push(`ci.content_type = $${paramIdx}`);
    params.push(type);
    paramIdx++;
  }

  if (tags && tags.length > 0) {
    conditions.push(`ci.tags && $${paramIdx}::text[]`);
    params.push(tags);
    paramIdx++;
  }

  if (after) {
    conditions.push(`ci.created_at > $${paramIdx}`);
    params.push(after);
    paramIdx++;
  }

  if (before) {
    conditions.push(`ci.created_at < $${paramIdx}`);
    params.push(before);
  }

  const whereClause = conditions.map((c, i) => (i === 0 ? `WHERE ${c}` : `  AND ${c}`)).join('\n');

  const result = await pool.query<SearchRow>(
    `SELECT
       ci.id,
       ci.title,
       ci.description,
       ci.content_type,
       ci.media_url,
       ci.thumbnail_url,
       ci.channel_name,
       ci.duration_label,
       ci.tags,
       ci.created_at,
       ts_headline(
         'english',
         ci.title || ' ' || ci.description,
         to_tsquery($1),
         'MaxWords=10, MinWords=5, ShortWord=3, HighlightAll=false'
       ) AS highlight,
       ts_rank_cd(ci.search_vector, to_tsquery($1)) AS rank
     FROM content_items ci
     ${whereClause}
     ORDER BY rank DESC, ci.created_at DESC
     LIMIT $2`,
    params,
  );

  const rows = result.rows;
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    contentType: row.content_type,
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url,
    channelName: row.channel_name,
    durationLabel: row.duration_label,
    tags: row.tags,
    highlight: row.highlight,
    rank: parseFloat(row.rank),
    createdAt: new Date(row.created_at).toISOString(),
  }));

  const page: CursorPage<SearchResultItem> = {
    items,
    nextCursor: null,
    prevCursor: null,
    hasMore,
  };

  if (!cached) {
    await CacheService.set('search', cacheKey, page, CacheTTL.SEARCH_RESULTS);
  }

  let searchEventId: string | undefined;

  if (userId) {
    const eventResult = await pool.query<SearchEventRow>(
      `INSERT INTO user_search_events (user_id, query, results_count, searched_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [userId, q, items.length],
    );
    searchEventId = eventResult.rows[0]?.id;
  }

  return { ...page, searchEventId };
}

export async function recordSearchClick(
  searchEventId: string,
  contentId: string,
): Promise<void> {
  await pool.query(
    `UPDATE user_search_events
     SET clicked_id = $2
     WHERE id = $1`,
    [searchEventId, contentId],
  );
}
