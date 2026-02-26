import { pool } from '../../db/pool';

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
  const result = await pool.query<MostPlayedRow>(
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
