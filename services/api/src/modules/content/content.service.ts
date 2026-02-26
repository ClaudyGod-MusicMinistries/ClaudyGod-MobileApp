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
  ContentSourceKind,
  ContentVisibility,
  CreateContentInput,
  ContentType,
  UpdateContentInput,
} from './content.types';

interface ContentRow {
  id: string;
  author_id: string;
  title: string;
  description: string;
  content_type: ContentItem['type'];
  media_url: string | null;
  thumbnail_url: string | null;
  source_kind: ContentSourceKind;
  external_source_id: string | null;
  channel_name: string | null;
  duration_label: string | null;
  app_sections: string[] | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
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
  thumbnailUrl: row.thumbnail_url ?? undefined,
  sourceKind: row.source_kind ?? undefined,
  externalSourceId: row.external_source_id ?? undefined,
  channelName: row.channel_name ?? undefined,
  duration: row.duration_label ?? undefined,
  appSections: row.app_sections ?? [],
  tags: row.tags ?? [],
  metadata: row.metadata ?? {},
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

const requireAdmin = (requester: JwtClaims): void => {
  if (requester.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin role required');
  }
};

const normalizeTextList = (items?: string[]): string[] =>
  [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))];

const selectContentByIdSql = `SELECT
  c.id,
  c.author_id,
  c.title,
  c.description,
  c.content_type,
  c.media_url,
  c.thumbnail_url,
  c.source_kind,
  c.external_source_id,
  c.channel_name,
  c.duration_label,
  c.app_sections,
  c.tags,
  c.metadata,
  c.visibility,
  c.created_at,
  c.updated_at,
  u.display_name AS author_display_name,
  u.email AS author_email,
  u.role AS author_role
 FROM content_items c
 INNER JOIN app_users u ON u.id = c.author_id
 WHERE c.id = $1
 LIMIT 1`;

function normalizeListQuery(query: ContentListQuery): {
  page: number;
  limit: number;
  type?: ContentType;
  visibility?: ContentVisibility;
  search?: string;
  updatedAfter?: string;
  unsupportedTypeRequested: boolean;
} {
  const visibility = query.visibility ?? query.status;
  const requestedType = query.type;
  const search = query.search?.trim() ? query.search.trim() : undefined;
  const updatedAfter = query.updatedAfter;

  if (!requestedType) {
    return {
      page: query.page,
      limit: query.limit,
      visibility,
      search,
      updatedAfter,
      unsupportedTypeRequested: false,
    };
  }

  if (!SUPPORTED_DB_TYPES.has(requestedType as ContentType)) {
    return {
      page: query.page,
      limit: query.limit,
      visibility,
      search,
      updatedAfter,
      unsupportedTypeRequested: true,
    };
  }

  return {
    page: query.page,
    limit: query.limit,
    type: requestedType as ContentType,
    visibility,
    search,
    updatedAfter,
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

  if (normalized.search) {
    values.push(`%${normalized.search}%`);
    conditions.push(`(c.title ILIKE $${values.length} OR c.description ILIKE $${values.length})`);
  }

  if (normalized.updatedAfter) {
    values.push(normalized.updatedAfter);
    conditions.push(`c.updated_at >= $${values.length}::timestamptz`);
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
        c.thumbnail_url,
        c.source_kind,
        c.external_source_id,
        c.channel_name,
        c.duration_label,
        c.app_sections,
        c.tags,
        c.metadata,
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

  if (normalized.search) {
    values.push(`%${normalized.search}%`);
    conditions.push(`(c.title ILIKE $${values.length} OR c.description ILIKE $${values.length})`);
  }

  if (normalized.updatedAfter) {
    values.push(normalized.updatedAfter);
    conditions.push(`c.updated_at >= $${values.length}::timestamptz`);
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
          c.thumbnail_url,
          c.source_kind,
          c.external_source_id,
          c.channel_name,
          c.duration_label,
          c.app_sections,
          c.tags,
          c.metadata,
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
  requireAdmin(requester);

  const result = await pool.query<ContentRow>(
    `WITH inserted AS (
      INSERT INTO content_items (
        author_id, title, description, content_type, media_url, thumbnail_url, source_kind,
        external_source_id, channel_name, duration_label, app_sections, tags, metadata, visibility
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], $12::text[], $13::jsonb, $14)
      RETURNING *
    )
    SELECT
      inserted.id,
      inserted.author_id,
      inserted.title,
      inserted.description,
      inserted.content_type,
      inserted.media_url,
      inserted.thumbnail_url,
      inserted.source_kind,
      inserted.external_source_id,
      inserted.channel_name,
      inserted.duration_label,
      inserted.app_sections,
      inserted.tags,
      inserted.metadata,
      inserted.visibility,
      inserted.created_at,
      inserted.updated_at,
      u.display_name AS author_display_name,
      u.email AS author_email,
      u.role AS author_role
    FROM inserted
    INNER JOIN app_users u ON u.id = inserted.author_id`,
    [
      requester.sub,
      input.title,
      input.description,
      input.type,
      input.url ?? null,
      input.thumbnailUrl ?? null,
      input.sourceKind ?? 'upload',
      input.externalSourceId ?? null,
      input.channelName ?? null,
      input.duration ?? null,
      normalizeTextList(input.appSections),
      normalizeTextList(input.tags),
      JSON.stringify(input.metadata ?? {}),
      input.visibility,
    ],
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

export const updateContent = async ({
  contentId,
  input,
  requester,
}: {
  contentId: string;
  input: UpdateContentInput;
  requester: JwtClaims;
}): Promise<ContentItem> => {
  requireAdmin(requester);

  const existingResult = await pool.query<ContentRow>(selectContentByIdSql, [contentId]);
  if (existingResult.rowCount === 0) {
    throw new HttpError(404, 'Content not found');
  }

  const existing = existingResult.rows[0]!;
  const nextType = input.type ?? existing.content_type;
  const nextUrl = Object.prototype.hasOwnProperty.call(input, 'url')
    ? (input.url ?? null)
    : existing.media_url;

  if ((nextType === 'audio' || nextType === 'video') && !nextUrl) {
    throw new HttpError(400, `A media URL is required for ${nextType} content`);
  }

  const updated = await pool.query<ContentRow>(
    `WITH updated AS (
      UPDATE content_items
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        content_type = COALESCE($4, content_type),
        media_url = COALESCE($5, media_url),
        thumbnail_url = COALESCE($6, thumbnail_url),
        source_kind = COALESCE($7, source_kind),
        external_source_id = COALESCE($8, external_source_id),
        channel_name = COALESCE($9, channel_name),
        duration_label = COALESCE($10, duration_label),
        app_sections = COALESCE($11::text[], app_sections),
        tags = COALESCE($12::text[], tags),
        metadata = COALESCE($13::jsonb, metadata),
        visibility = COALESCE($14, visibility),
        updated_at = NOW()
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
      updated.thumbnail_url,
      updated.source_kind,
      updated.external_source_id,
      updated.channel_name,
      updated.duration_label,
      updated.app_sections,
      updated.tags,
      updated.metadata,
      updated.visibility,
      updated.created_at,
      updated.updated_at,
      u.display_name AS author_display_name,
      u.email AS author_email,
      u.role AS author_role
    FROM updated
    INNER JOIN app_users u ON u.id = updated.author_id`,
    [
      contentId,
      input.title ?? null,
      input.description ?? null,
      input.type ?? null,
      Object.prototype.hasOwnProperty.call(input, 'url') ? (input.url ?? null) : null,
      Object.prototype.hasOwnProperty.call(input, 'thumbnailUrl') ? (input.thumbnailUrl ?? null) : null,
      input.sourceKind ?? null,
      Object.prototype.hasOwnProperty.call(input, 'externalSourceId') ? (input.externalSourceId ?? null) : null,
      Object.prototype.hasOwnProperty.call(input, 'channelName') ? (input.channelName ?? null) : null,
      Object.prototype.hasOwnProperty.call(input, 'duration') ? (input.duration ?? null) : null,
      Object.prototype.hasOwnProperty.call(input, 'appSections') ? normalizeTextList(input.appSections) : null,
      Object.prototype.hasOwnProperty.call(input, 'tags') ? normalizeTextList(input.tags) : null,
      Object.prototype.hasOwnProperty.call(input, 'metadata') ? JSON.stringify(input.metadata ?? {}) : null,
      input.visibility ?? null,
    ],
  );

  if (updated.rowCount === 0) {
    throw new HttpError(404, 'Content not found');
  }

  const item = toContentItem(updated.rows[0]!);

  await enqueueContentEvent({
    contentId: item.id,
    authorId: requester.sub,
    eventType: 'content.updated',
    payload: {
      contentId: item.id,
      updatedBy: requester.sub,
      visibility: item.visibility,
      type: item.type,
      appSections: item.appSections ?? [],
    },
  });

  const becamePublished = existing.visibility !== 'published' && item.visibility === 'published';
  if (becamePublished) {
    await enqueuePublishEmail(item, requester);
  }

  return item;
};

export const updateContentSections = async ({
  contentId,
  appSections,
  requester,
}: {
  contentId: string;
  appSections: string[];
  requester: JwtClaims;
}): Promise<ContentItem> =>
  updateContent({
    contentId,
    requester,
    input: { appSections },
  });

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
      updated.thumbnail_url,
      updated.source_kind,
      updated.external_source_id,
      updated.channel_name,
      updated.duration_label,
      updated.app_sections,
      updated.tags,
      updated.metadata,
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

export const deleteContent = async ({
  contentId,
  requester,
}: {
  contentId: string;
  requester: JwtClaims;
}): Promise<{ deleted: true; id: string }> => {
  requireAdmin(requester);

  const existing = await pool.query<ContentRow>(selectContentByIdSql, [contentId]);
  if (existing.rowCount === 0) {
    throw new HttpError(404, 'Content not found');
  }

  await pool.query(`DELETE FROM content_items WHERE id = $1`, [contentId]);

  await enqueueContentEvent({
    contentId,
    authorId: requester.sub,
    eventType: 'content.deleted',
    payload: {
      contentId,
      deletedBy: requester.sub,
      title: existing.rows[0]!.title,
      type: existing.rows[0]!.content_type,
    },
  });

  return { deleted: true, id: contentId };
};
