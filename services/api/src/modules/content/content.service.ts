import type { JwtClaims } from '../../utils/jwt';
import { pool } from '../../db/pool';
import { HttpError } from '../../lib/httpError';
import { contentQueue, type ContentEventType } from '../../queues/contentQueue';
import { emailQueue } from '../../queues/emailQueue';
import { env } from '../../config/env';
import type { UserRole } from '../auth/auth.types';
import type {
  ContentItem,
  ContentListQuery,
  ContentListResponse,
  ContentVisibility,
  CreateContentInput,
  ContentType,
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

const SUPPORTED_DB_TYPES = new Set<ContentType>(['audio', 'video', 'playlist', 'announcement']);

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

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

  const jobRecordId = insertedJob.rows[0]!.id;
  const queueJob = await contentQueue.add(eventType, {
    jobRecordId,
    contentId,
    authorId,
    eventType,
  });

  await pool.query(
    `UPDATE content_jobs
     SET queue_job_id = $2, updated_at = NOW()
     WHERE id = $1`,
    [jobRecordId, String(queueJob.id)],
  );
};

const enqueuePublishEmail = async (item: ContentItem, actor: JwtClaims): Promise<void> => {
  if (env.ADMIN_ALERT_EMAILS_LIST.length === 0) return;

  const emailInsert = await pool.query<{ id: number }>(
    `INSERT INTO email_jobs (job_type, recipients, subject, text_body, html_body, status, payload)
     VALUES ($1, $2::text[], $3, $4, $5, 'pending', $6::jsonb)
     RETURNING id`,
    [
      'content_published',
      env.ADMIN_ALERT_EMAILS_LIST,
      `Content published: ${item.title}`,
      [
        'A content item was published in Claudy Content Studio.',
        '',
        `Title: ${item.title}`,
        `Type: ${item.type}`,
        `Visibility: ${item.visibility}`,
        `Published by: ${actor.displayName} <${actor.email}>`,
        item.url ? `URL: ${item.url}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      `<p>A content item was published in <strong>Claudy Content Studio</strong>.</p><ul><li><strong>Title:</strong> ${escapeHtml(
        item.title,
      )}</li><li><strong>Type:</strong> ${escapeHtml(item.type)}</li><li><strong>Visibility:</strong> ${escapeHtml(
        item.visibility,
      )}</li><li><strong>Published by:</strong> ${escapeHtml(actor.displayName)} &lt;${escapeHtml(
        actor.email,
      )}&gt;</li>${item.url ? `<li><strong>URL:</strong> ${escapeHtml(item.url)}</li>` : ''}</ul>`,
      JSON.stringify({ contentId: item.id, actorId: actor.sub }),
    ],
  );

  const emailJobId = emailInsert.rows[0]!.id;
  const queueJob = await emailQueue.add('email.content_published', { emailJobId });

  await pool.query(
    `UPDATE email_jobs
     SET queue_job_id = $2, updated_at = NOW()
     WHERE id = $1`,
    [emailJobId, String(queueJob.id)],
  );
};

const buildListResponse = (rows: ContentRow[], total: number, query: ContentListQuery): ContentListResponse => ({
  page: query.page,
  limit: query.limit,
  total,
  items: rows.map(toContentItem),
});

function normalizeListQuery(query: ContentListQuery): {
  page: number;
  limit: number;
  type?: ContentType;
  visibility?: ContentVisibility;
  unsupportedTypeRequested: boolean;
} {
  const visibility = query.visibility ?? query.status;
  const requestedType = query.type;

  if (!requestedType) {
    return {
      page: query.page,
      limit: query.limit,
      visibility,
      unsupportedTypeRequested: false,
    };
  }

  if (!SUPPORTED_DB_TYPES.has(requestedType as ContentType)) {
    return {
      page: query.page,
      limit: query.limit,
      visibility,
      unsupportedTypeRequested: true,
    };
  }

  return {
    page: query.page,
    limit: query.limit,
    type: requestedType as ContentType,
    visibility,
    unsupportedTypeRequested: false,
  };
}

export const listPublicContent = async (query: ContentListQuery): Promise<ContentListResponse> => {
  const normalized = normalizeListQuery(query);

  if (normalized.unsupportedTypeRequested) {
    return {
      page: query.page,
      limit: query.limit,
      total: 0,
      items: [],
    };
  }

  const offset = (normalized.page - 1) * normalized.limit;
  const conditions = [`c.visibility = 'published'`];
  const values: unknown[] = [];

  if (normalized.type) {
    values.push(normalized.type);
    conditions.push(`c.content_type = $${values.length}`);
  }

  values.push(normalized.limit, offset);
  const limitParam = values.length - 1;
  const offsetParam = values.length;

  const whereClause = conditions.join(' AND ');

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
       WHERE ${whereClause}
       ORDER BY c.updated_at DESC, c.created_at DESC
       LIMIT $${limitParam}
       OFFSET $${offsetParam}`,
      values,
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM content_items c
       WHERE ${whereClause}`,
      values.slice(0, values.length - 2),
    ),
  ]);

  return buildListResponse(dataResult.rows, Number(countResult.rows[0]!.count), query);
};

export const listManagedContent = async (
  requester: JwtClaims,
  query: ContentListQuery,
): Promise<ContentListResponse> => {
  const normalized = normalizeListQuery(query);

  if (normalized.unsupportedTypeRequested) {
    return {
      page: query.page,
      limit: query.limit,
      total: 0,
      items: [],
    };
  }

  const offset = (normalized.page - 1) * normalized.limit;
  const isAdmin = requester.role === 'ADMIN';
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (!isAdmin) {
    values.push(requester.sub);
    conditions.push(`c.author_id = $${values.length}`);
  }

  if (normalized.type) {
    values.push(normalized.type);
    conditions.push(`c.content_type = $${values.length}`);
  }

  if (normalized.visibility) {
    values.push(normalized.visibility);
    conditions.push(`c.visibility = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  values.push(normalized.limit, offset);
  const limitParam = values.length - 1;
  const offsetParam = values.length;

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
       ${whereClause}
       ORDER BY c.updated_at DESC, c.created_at DESC
       LIMIT $${limitParam}
       OFFSET $${offsetParam}`,
      values,
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM content_items c
       ${whereClause}`,
      values.slice(0, values.length - 2),
    ),
  ]);

  return buildListResponse(dataResult.rows, Number(countResult.rows[0]!.count), query);
};

export const createContent = async (requester: JwtClaims, input: CreateContentInput): Promise<ContentItem> => {
  if (requester.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin role required');
  }

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

  const item = toContentItem(result.rows[0]!);
  const eventType: ContentEventType = input.visibility === 'published' ? 'content.published' : 'content.created';

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

  if (item.visibility === 'published') {
    await enqueuePublishEmail(item, requester);
  }

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
  if (requester.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin role required');
  }

  const updated = await pool.query<ContentRow>(
    `WITH updated AS (
      UPDATE content_items
      SET visibility = $2, updated_at = NOW()
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

  if (updated.rowCount === 0) {
    throw new HttpError(404, 'Content not found');
  }

  const item = toContentItem(updated.rows[0]!);

  await enqueueContentEvent({
    contentId: item.id,
    authorId: item.author.id,
    eventType: visibility === 'published' ? 'content.published' : 'content.visibility_changed',
    payload: {
      contentId: item.id,
      authorId: item.author.id,
      visibility: item.visibility,
      type: item.type,
    },
  });

  if (visibility === 'published') {
    await enqueuePublishEmail(item, requester);
  }

  return item;
};
