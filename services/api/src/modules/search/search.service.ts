import { pool } from '../../db/pool';
import type { CursorPage } from '../../lib/pagination';
import { isDatabaseConnectivityError, isMissingDatabaseStructureError } from '../../lib/postgres';
import type { SearchQuery } from './search.schema';
import { decodeSearchCursor, encodeSearchCursor, normalizeSearchText } from './search.contracts';

export interface TrendingSearchTerm {
  query: string;
  count: number;
}

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

export async function searchContent(
  query: SearchQuery,
  userId?: string,
): Promise<CursorPage<SearchResultItem> & { searchEventId?: string }> {
  const { q, type, tags, cursor, limit } = query;
  const normalized = normalizeSearchText(q);

  if (!normalized) {
    return { items: [], nextCursor: null, prevCursor: null, hasMore: false };
  }

  const normalizedTags = [...(tags ?? [])].sort();
  let page: CursorPage<SearchResultItem>;
  {
    const params: unknown[] = [normalized, limit + 1];
    const conditions: string[] = ["ci.visibility = 'published'", "ci.search_vector @@ websearch_to_tsquery('english', $1)"];
    const liveConditions: string[] = ["ls.status <> 'cancelled'", "ls.search_vector @@ websearch_to_tsquery('english', $1)"];
    let paramIdx = 3;

    if (type) {
      conditions.push(`ci.content_type = $${paramIdx++}`);
      params.push(type);
    }

    if (normalizedTags.length > 0) {
      conditions.push(`ci.tags && $${paramIdx}::text[]`);
      liveConditions.push(`ls.tags && $${paramIdx}::text[]`);
      paramIdx++;
      params.push(normalizedTags);
    }

    const whereClause = conditions.map((condition, index) => `${index === 0 ? 'WHERE' : '  AND'} ${condition}`).join('\n');
    const liveWhereClause = liveConditions.map((condition, index) => `${index === 0 ? 'WHERE' : '  AND'} ${condition}`).join('\n');
    const liveUnion = !type || type === 'live'
      ? `UNION ALL
       SELECT
         ls.id,
         ls.title,
         ls.description,
         'live'::text AS content_type,
         COALESCE(ls.playback_url, ls.stream_url) AS media_url,
         ls.cover_image_url AS thumbnail_url,
         ls.channel_id AS channel_name,
         NULL::text AS duration_label,
         ls.tags,
         ls.created_at,
         ts_headline(
           'english', ls.title || ' ' || ls.description,
           websearch_to_tsquery('english', $1),
           'MaxWords=10, MinWords=5, ShortWord=3, HighlightAll=false'
         ) AS highlight,
         ts_rank_cd(ls.search_vector, websearch_to_tsquery('english', $1)) AS rank
       FROM live_sessions ls
       ${liveWhereClause}`
      : '';
    let cursorClause = '';
    if (cursor) {
      const decoded = decodeSearchCursor(cursor);
      cursorClause = `WHERE (rank, created_at, id) < ($${paramIdx}::real, $${paramIdx + 1}::timestamptz, $${paramIdx + 2}::uuid)`;
      params.push(decoded.rank, decoded.createdAt, decoded.id);
    }

    const result = await pool.query<SearchRow>(
      `WITH ranked AS (
       SELECT
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
         websearch_to_tsquery('english', $1),
         'MaxWords=10, MinWords=5, ShortWord=3, HighlightAll=false'
       ) AS highlight,
       ts_rank_cd(ci.search_vector, websearch_to_tsquery('english', $1)) AS rank
     FROM content_items ci
     ${whereClause}
     ${liveUnion}
     )
     SELECT * FROM ranked
     ${cursorClause}
     ORDER BY rank DESC, created_at DESC, id DESC
     LIMIT $2`,
      params,
    );

    const hasMore = result.rows.length > limit;
    const pageRows = result.rows.slice(0, limit);
    const items = pageRows.map((row) => ({
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
      rank: Number(row.rank),
      createdAt: new Date(row.created_at).toISOString(),
    }));
    const last = items.at(-1);
    page = {
      items,
      nextCursor: hasMore && last
        ? encodeSearchCursor({ rank: last.rank, createdAt: last.createdAt, id: last.id })
        : null,
      prevCursor: null,
      hasMore,
    };
  }

  const eventResult = await pool.query<SearchEventRow>(
      `INSERT INTO user_search_events (user_id, query, results_count, searched_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [userId ?? null, normalized, page.items.length],
  );

  return { ...page, searchEventId: eventResult.rows[0]?.id };
}

export async function recordSearchClick(
  searchEventId: string,
  contentId: string,
  userId: string,
): Promise<void> {
  await pool.query(
    `UPDATE user_search_events
     SET clicked_id = $2
     WHERE id = $1
       AND user_id = $3`,
    [searchEventId, contentId, userId],
  );
}

// Real usage, not a static guess: aggregates the same user_search_events log
// every search already writes to, over a recent window, excluding queries that
// returned nothing (not worth surfacing as a "trending" suggestion).
const TRENDING_WINDOW_DAYS = 7;
const SEARCH_EVENT_RETENTION_DAYS = 90;

export async function pruneExpiredSearchEvents(): Promise<number> {
  const result = await pool.query(
    `DELETE FROM user_search_events
     WHERE searched_at < NOW() - ($1::text || ' days')::interval`,
    [SEARCH_EVENT_RETENTION_DAYS],
  );
  return result.rowCount ?? 0;
}

export async function getTrendingSearches(limit: number): Promise<{ items: TrendingSearchTerm[] }> {
  let result;
  try {
    result = await pool.query<{ query: string; count: string }>(
      `SELECT LOWER(query) AS query, COUNT(*)::text AS count
       FROM user_search_events
       WHERE searched_at >= NOW() - ($2::text || ' days')::interval
         AND results_count > 0
       GROUP BY LOWER(query)
       ORDER BY COUNT(*) DESC, MAX(searched_at) DESC
       LIMIT $1`,
      [limit, TRENDING_WINDOW_DAYS],
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error) || isDatabaseConnectivityError(error)) {
      return { items: [] };
    }
    throw error;
  }

  return { items: result.rows.map((row) => ({ query: row.query, count: Number(row.count) })) };
}
