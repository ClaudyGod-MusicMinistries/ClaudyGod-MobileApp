import { pool } from '../../db/pool';
import { isDatabaseConnectivityError, isMissingDatabaseStructureError } from '../../lib/postgres';

const isSafeToFallback = (error: unknown): boolean =>
  isMissingDatabaseStructureError(error) || isDatabaseConnectivityError(error);

interface MostPlayedRow {
  content_id: string;
  content_title: string;
  content_type: string;
  play_count: string;
  last_played_at: string | Date;
  description: string | null;
  media_url: string | null;
  visibility: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
}

export const listMostPlayedContent = async (params: {
  limit: number;
  windowDays: number;
}): Promise<{
  items: Array<{
    id: string;
    title: string;
    description: string;
    type: 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad';
    visibility?: 'draft' | 'published';
    url?: string;
    createdAt: string;
    updatedAt: string;
    playCount: number;
  }>;
}> => {
  let result;
  try {
    result = await pool.query<MostPlayedRow>(
      `WITH agg AS (
         SELECT
           e.content_id,
           MAX(e.content_title) AS content_title,
           MAX(e.content_type) AS content_type,
           COUNT(*)::text AS play_count,
           MAX(e.played_at) AS last_played_at
         FROM user_play_events e
         WHERE e.played_at >= NOW() - ($2::text || ' days')::interval
         GROUP BY e.content_id
       )
       SELECT
         agg.content_id,
         agg.content_title,
         agg.content_type,
         agg.play_count,
         agg.last_played_at,
         c.description,
         c.media_url,
         c.visibility,
         c.created_at,
         c.updated_at
       FROM agg
       LEFT JOIN content_items c ON c.id::text = agg.content_id
       ORDER BY agg.play_count::int DESC, agg.last_played_at DESC
       LIMIT $1`,
      [params.limit, params.windowDays],
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error) || isDatabaseConnectivityError(error)) {
      return { items: [] };
    }
    throw error;
  }

  return {
    items: result.rows.map((row) => {
      const normalizedType = (
        row.content_type === 'audio' ||
        row.content_type === 'video' ||
        row.content_type === 'playlist' ||
        row.content_type === 'announcement' ||
        row.content_type === 'live' ||
        row.content_type === 'ad'
          ? row.content_type
          : 'audio'
      ) as 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad';

      const fallbackTime = new Date(row.last_played_at).toISOString();
      return {
        id: row.content_id,
        title: row.content_title,
        description: row.description ?? '',
        type: normalizedType,
        visibility: row.visibility === 'draft' || row.visibility === 'published' ? row.visibility : undefined,
        url: row.media_url ?? undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : fallbackTime,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : fallbackTime,
        playCount: Number(row.play_count),
      };
    }),
  };
};

export const getAdminEngagementOverview = async (): Promise<{
  totalPlays: number;
  uniqueListeners: number;
  avgCompletionPct: number;
  topContent: { id: string; title: string; plays: number } | null;
}> => {
  try {
    const [playsResult, completionResult, topResult] = await Promise.all([
      pool.query<{ total_plays: string; unique_listeners: string }>(
        `SELECT COUNT(*)::text AS total_plays, COUNT(DISTINCT user_id)::text AS unique_listeners
         FROM user_play_events`,
      ),
      pool.query<{ avg_completion: string | null }>(
        `SELECT AVG(LEAST(position_ms, duration_ms)::numeric / duration_ms * 100) AS avg_completion
         FROM user_playback_sessions
         WHERE duration_ms > 0`,
      ),
      pool.query<{ content_id: string; content_title: string; play_count: string }>(
        `SELECT content_id, MAX(content_title) AS content_title, COUNT(*)::text AS play_count
         FROM user_play_events
         GROUP BY content_id
         ORDER BY play_count::int DESC
         LIMIT 1`,
      ),
    ]);

    const plays = playsResult.rows[0];
    const top = topResult.rows[0];

    return {
      totalPlays: Number(plays?.total_plays ?? 0),
      uniqueListeners: Number(plays?.unique_listeners ?? 0),
      avgCompletionPct: Math.round(Number(completionResult.rows[0]?.avg_completion ?? 0)),
      topContent: top ? { id: top.content_id, title: top.content_title, plays: Number(top.play_count) } : null,
    };
  } catch (error) {
    if (isSafeToFallback(error)) {
      return { totalPlays: 0, uniqueListeners: 0, avgCompletionPct: 0, topContent: null };
    }
    throw error;
  }
};

interface AdminContentInsightRow {
  content_id: string;
  content_title: string;
  content_type: string;
  plays: string;
  unique_listeners: string;
  avg_completion: string | null;
}

export const getAdminContentInsights = async (limit: number): Promise<Array<{
  contentId: string;
  title: string;
  type: string;
  plays: number;
  uniqueListeners: number;
  avgCompletionPct: number;
}>> => {
  try {
    const result = await pool.query<AdminContentInsightRow>(
      `WITH plays AS (
         SELECT
           e.content_id,
           MAX(COALESCE(c.title, e.content_title)) AS content_title,
           MAX(COALESCE(c.content_type, e.content_type)) AS content_type,
           COUNT(*)::text AS plays,
           COUNT(DISTINCT e.user_id)::text AS unique_listeners
         FROM user_play_events e
         LEFT JOIN content_items c ON c.id::text = e.content_id
         GROUP BY e.content_id
       ),
       completion AS (
         SELECT
           content_id::text AS content_id,
           AVG(LEAST(position_ms, duration_ms)::numeric / duration_ms * 100) AS avg_completion
         FROM user_playback_sessions
         WHERE duration_ms > 0
         GROUP BY content_id
       )
       SELECT
         plays.content_id,
         plays.content_title,
         plays.content_type,
         plays.plays,
         plays.unique_listeners,
         completion.avg_completion
       FROM plays
       LEFT JOIN completion ON completion.content_id = plays.content_id
       ORDER BY plays.plays::int DESC
       LIMIT $1`,
      [limit],
    );

    return result.rows.map((row) => ({
      contentId: row.content_id,
      title: row.content_title,
      type: row.content_type,
      plays: Number(row.plays),
      uniqueListeners: Number(row.unique_listeners),
      avgCompletionPct: Math.round(Number(row.avg_completion ?? 0)),
    }));
  } catch (error) {
    if (isSafeToFallback(error)) {
      return [];
    }
    throw error;
  }
};

export const getAdminCommunityInsights = async (): Promise<Array<{
  type: string;
  message: string;
  value: number | null;
  trend: 'up' | 'down' | 'stable';
}>> => {
  try {
    const [signupsResult, playsResult, liveResult] = await Promise.all([
      pool.query<{ this_week: string; last_week: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS this_week,
           COUNT(*) FILTER (
             WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'
           )::text AS last_week
         FROM app_users`,
      ),
      pool.query<{ this_week: string; last_week: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE played_at >= NOW() - INTERVAL '7 days')::text AS this_week,
           COUNT(*) FILTER (
             WHERE played_at >= NOW() - INTERVAL '14 days' AND played_at < NOW() - INTERVAL '7 days'
           )::text AS last_week
         FROM user_play_events`,
      ),
      pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM live_sessions WHERE status = 'live'`),
    ]);

    const signups = signupsResult.rows[0]!;
    const plays = playsResult.rows[0]!;
    const liveCount = Number(liveResult.rows[0]?.count ?? 0);

    const trendOf = (current: number, previous: number): 'up' | 'down' | 'stable' => {
      if (current > previous) return 'up';
      if (current < previous) return 'down';
      return 'stable';
    };

    const signupsThisWeek = Number(signups.this_week);
    const signupsLastWeek = Number(signups.last_week);
    const playsThisWeek = Number(plays.this_week);
    const playsLastWeek = Number(plays.last_week);

    return [
      {
        type: 'signups',
        message: `${signupsThisWeek} new user${signupsThisWeek === 1 ? '' : 's'} signed up this week (${signupsLastWeek} the week before).`,
        value: signupsThisWeek,
        trend: trendOf(signupsThisWeek, signupsLastWeek),
      },
      {
        type: 'engagement',
        message: `${playsThisWeek} item${playsThisWeek === 1 ? '' : 's'} played this week (${playsLastWeek} the week before).`,
        value: playsThisWeek,
        trend: trendOf(playsThisWeek, playsLastWeek),
      },
      {
        type: 'live',
        message: liveCount > 0
          ? `${liveCount} live session${liveCount === 1 ? ' is' : 's are'} broadcasting right now.`
          : 'No live sessions are broadcasting right now.',
        value: liveCount,
        trend: liveCount > 0 ? 'up' : 'stable',
      },
    ];
  } catch (error) {
    if (isSafeToFallback(error)) {
      return [];
    }
    throw error;
  }
};
