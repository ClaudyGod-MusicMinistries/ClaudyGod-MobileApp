import type { JwtClaims } from '../../utils/jwt';
import { pool } from '../../db/pool';
import { HttpError } from '../../lib/httpError';
import { contentQueue, type ContentEventType } from '../../queues/contentQueue';
import type { UserRole } from '../auth/auth.types';
import type {
  ContentItem,
  ContentListQuery,
  ContentListResponse,
  ContentVisibility,
  CreateContentInput,
} from './content.types';

interface ContentRow {
  id: string;
  author_id: string;
  title: string;
  description: string;
  content_type: ContentItem['type'];
  media_url: string | null;
  visibility: ContentVisibility;
  created_at: string | Date;
  updated_at: string | Date;
  author_display_name: string;
  author_email: string;
  author_role: UserRole;
}

const toIsoDate = (value: string | Date): string => new Date(value).toISOString();

const toContentItem = (row: ContentRow): ContentItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  type: row.content_type,
  url: row.media_url ?? undefined,
  visibility: row.visibility,
  createdAt: toIsoDate(row.created_at),
  updatedAt: toIsoDate(row.updated_at),
  author: {
    id: row.author_id,
    displayName: row.author_display_name,
    email: row.author_email,
    role: row.author_role,
  },
});

const enqueueContentEvent = async ({
  contentId,
  authorId,
  eventType,
  payload,
}: {
  contentId: string;
  authorId: string;
  eventType: ContentEventType;
  payload: Record<string, unknown>;
}): Promise<void> => {
  const insertedJob = await pool.query<{ id: number }>(
    `INSERT INTO content_jobs (content_id, event_type, status, payload)
     VALUES ($1, $2, 'pending', $3::jsonb)
     RETURNING id`,
    [contentId, eventType, JSON.stringify(payload)],
  );

  const jobRecordId = insertedJob.rows[0].id;
  const queueJob = await contentQueue.add(eventType, {
    jobRecordId,
    contentId,
    authorId,
    eventType,
  });

  await pool.query(
    `UPDATE content_jobs
     SET queue_job_id = $2
     WHERE id = $1`,
    [jobRecordId, String(queueJob.id)],
  );
};

const buildListResponse = async (
  rows: ContentRow[],
  total: number,
  query: ContentListQuery,
): Promise<ContentListResponse> => ({
  page: query.page,
  limit: query.limit,
  total,
  items: rows.map(toContentItem),
});

export const listPublicContent = async (query: ContentListQuery): Promise<ContentListResponse> => {
  const offset = (query.page - 1) * query.limit;

  const [dataResult, countResult] = await Promise.all([
    pool.query<ContentRow>(
      `SELECT
        c.id,
        c.author_id,
        c.title,
        c.description,
        c.content_type,
        c.media_url,
        c.visibility,
        c.created_at,
        c.updated_at,
        u.display_name AS author_display_name,
        u.email AS author_email,
        u.role AS author_role
       FROM content_items c
       INNER JOIN app_users u ON u.id = c.author_id
       WHERE c.visibility = 'published'
       ORDER BY c.created_at DESC
       LIMIT $1
       OFFSET $2`,
      [query.limit, offset],
    ),
    pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM content_items WHERE visibility = 'published'`),
  ]);

  return buildListResponse(dataResult.rows, Number(countResult.rows[0].count), query);
};

export const listManagedContent = async (
  requester: JwtClaims,
  query: ContentListQuery,
): Promise<ContentListResponse> => {
  const offset = (query.page - 1) * query.limit;
  const isAdmin = requester.role === 'ADMIN';

  const dataResult = isAdmin
    ? await pool.query<ContentRow>(
        `SELECT
          c.id,
          c.author_id,
          c.title,
          c.description,
          c.content_type,
          c.media_url,
          c.visibility,
          c.created_at,
          c.updated_at,
          u.display_name AS author_display_name,
          u.email AS author_email,
          u.role AS author_role
         FROM content_items c
         INNER JOIN app_users u ON u.id = c.author_id
         ORDER BY c.created_at DESC
         LIMIT $1
         OFFSET $2`,
        [query.limit, offset],
      )
    : await pool.query<ContentRow>(
        `SELECT
          c.id,
          c.author_id,
          c.title,
          c.description,
          c.content_type,
          c.media_url,
          c.visibility,
          c.created_at,
          c.updated_at,
          u.display_name AS author_display_name,
          u.email AS author_email,
          u.role AS author_role
         FROM content_items c
         INNER JOIN app_users u ON u.id = c.author_id
         WHERE c.author_id = $1
         ORDER BY c.created_at DESC
         LIMIT $2
         OFFSET $3`,
        [requester.sub, query.limit, offset],
      );

  const countResult = isAdmin
    ? await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM content_items`)
    : await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM content_items WHERE author_id = $1`,
        [requester.sub],
      );

  return buildListResponse(dataResult.rows, Number(countResult.rows[0].count), query);
};

export const createContent = async (
  requester: JwtClaims,
  input: CreateContentInput,
): Promise<ContentItem> => {
  const result = await pool.query<ContentRow>(
    `WITH inserted AS (
      INSERT INTO content_items (author_id, title, description, content_type, media_url, visibility)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    )
    SELECT
      inserted.id,
      inserted.author_id,
      inserted.title,
      inserted.description,
      inserted.content_type,
      inserted.media_url,
      inserted.visibility,
      inserted.created_at,
      inserted.updated_at,
      u.display_name AS author_display_name,
      u.email AS author_email,
      u.role AS author_role
    FROM inserted
    INNER JOIN app_users u ON u.id = inserted.author_id`,
    [requester.sub, input.title, input.description, input.type, input.url ?? null, input.visibility],
  );

  const item = toContentItem(result.rows[0]);
  const eventType: ContentEventType =
    input.visibility === 'published' ? 'content.published' : 'content.created';

  await enqueueContentEvent({
    contentId: item.id,
    authorId: requester.sub,
    eventType,
    payload: {
      contentId: item.id,
      authorId: requester.sub,
      type: item.type,
      visibility: item.visibility,
    },
  });

  return item;
};

export const updateContentVisibility = async ({
  contentId,
  visibility,
  requester,
}: {
  contentId: string;
  visibility: ContentVisibility;
  requester: JwtClaims;
}): Promise<ContentItem> => {
  const accessCheck = await pool.query<{ author_id: string }>(
    `SELECT author_id
     FROM content_items
     WHERE id = $1
     LIMIT 1`,
    [contentId],
  );

  if (accessCheck.rowCount === 0) {
    throw new HttpError(404, 'Content not found');
  }

  const authorId = accessCheck.rows[0].author_id;
  const isOwner = authorId === requester.sub;
  const isAdmin = requester.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new HttpError(403, 'Forbidden');
  }

  const updated = await pool.query<ContentRow>(
    `WITH updated AS (
      UPDATE content_items
      SET visibility = $2
      WHERE id = $1
      RETURNING *
    )
    SELECT
      updated.id,
      updated.author_id,
      updated.title,
      updated.description,
      updated.content_type,
      updated.media_url,
      updated.visibility,
      updated.created_at,
      updated.updated_at,
      u.display_name AS author_display_name,
      u.email AS author_email,
      u.role AS author_role
    FROM updated
    INNER JOIN app_users u ON u.id = updated.author_id`,
    [contentId, visibility],
  );

  const item = toContentItem(updated.rows[0]);
  const eventType: ContentEventType = visibility === 'published' ? 'content.published' : 'content.created';

  await enqueueContentEvent({
    contentId: item.id,
    authorId: item.author.id,
    eventType,
    payload: {
      contentId: item.id,
      authorId: item.author.id,
      visibility: item.visibility,
      type: item.type,
    },
  });

  return item;
};
