import type { Pool, PoolClient } from 'pg';
import type { JwtClaims } from '../../utils/jwt';
import { pool } from '../../db/pool';
import { HttpError } from '../../lib/httpError';
import { isMissingDatabaseStructureError } from '../../lib/postgres';
import { contentQueue, type ContentEventType } from '../../queues/contentQueue';
import { env } from '../../config/env';
import { queueEmailJob } from '../../infra/transactionalEmails';
import type { UserRole } from '../auth/auth.types';
import type {
  ContentItem,
  ContentListQuery,
  ContentRequestStatus,
  ContentListResponse,
  ContentSourceKind,
  ContentSubmissionRequest,
  ContentVisibility,
  CreateContentInput,
  CreateContentRequestInput,
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
  media_upload_session_id: string | null;
  thumbnail_upload_session_id: string | null;
  visibility: ContentVisibility;
  created_at: string | Date;
  updated_at: string | Date;
  author_display_name: string;
  author_email: string;
  author_role: UserRole;
}

interface UploadSessionLinkRow {
  id: string;
  channel: 'admin' | 'mobile';
  requested_by: string | null;
  mime_type: string;
  storage_bucket: string;
  storage_path: string;
  status: string;
}

interface ContentSubmissionRequestRow {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  content_type: ContentType;
  media_url: string | null;
  thumbnail_url: string | null;
  source_kind: ContentSourceKind;
  external_source_id: string | null;
  channel_name: string | null;
  duration_label: string | null;
  app_sections: string[] | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  request_notes: string | null;
  requested_visibility: ContentVisibility;
  request_status: ContentRequestStatus;
  media_upload_session_id: string | null;
  thumbnail_upload_session_id: string | null;
  created_content_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  requester_display_name: string;
  requester_email: string;
  requester_role: UserRole;
  created_content_title: string | null;
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

const toContentSubmissionRequest = (row: ContentSubmissionRequestRow): ContentSubmissionRequest => ({
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
  requestNotes: row.request_notes ?? undefined,
  requestedVisibility: row.requested_visibility,
  status: row.request_status,
  createdContentId: row.created_content_id ?? undefined,
  createdContentTitle: row.created_content_title ?? undefined,
  createdAt: toIsoDate(row.created_at),
  updatedAt: toIsoDate(row.updated_at),
  requester: {
    id: row.requester_id,
    displayName: row.requester_display_name,
    email: row.requester_email,
    role: row.requester_role,
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

  await queueEmailJob({
    recipients: env.ADMIN_ALERT_EMAILS_LIST,
    subject: `Content published: ${item.title}`,
    textBody: [
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
    htmlBody: `<p>A content item was published in <strong>Claudy Content Studio</strong>.</p><ul><li><strong>Title:</strong> ${escapeHtml(
      item.title,
    )}</li><li><strong>Type:</strong> ${escapeHtml(item.type)}</li><li><strong>Visibility:</strong> ${escapeHtml(
      item.visibility,
    )}</li><li><strong>Published by:</strong> ${escapeHtml(actor.displayName)} &lt;${escapeHtml(
      actor.email,
    )}&gt;</li>${item.url ? `<li><strong>URL:</strong> ${escapeHtml(item.url)}</li>` : ''}</ul>`,
    jobType: 'content_published',
    templateKey: 'content.published',
    payload: { contentId: item.id, actorId: actor.sub },
  });
};

const buildListResponse = (rows: ContentRow[], total: number, query: ContentListQuery): ContentListResponse => ({
  page: query.page,
  limit: query.limit,
  total,
  items: rows.map(toContentItem),
});

const normalizeTextList = (items?: string[]): string[] =>
  [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))];

const buildStoragePublicUrl = (bucket: string, objectPath: string): string =>
  `${env.SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`;

const normalizeComparableUrl = (value?: string | null): string => String(value || '').trim();

const loadValidatedUploadSession = async ({
  client,
  sessionId,
  requester,
  expectedMimePrefix,
  providedUrl,
}: {
  client: PoolClient;
  sessionId?: string;
  requester: JwtClaims;
  expectedMimePrefix?: 'audio' | 'video' | 'image';
  providedUrl?: string;
}): Promise<{ sessionId: string; publicUrl: string } | null> => {
  if (!sessionId) {
    return null;
  }

  const result = await client.query<UploadSessionLinkRow>(
    `SELECT id, channel, requested_by, mime_type, storage_bucket, storage_path, status
     FROM upload_sessions
     WHERE id = $1
     LIMIT 1`,
    [sessionId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(400, 'Referenced upload session was not found');
  }

  const session = result.rows[0]!;
  if (session.channel !== 'admin') {
    throw new HttpError(400, 'Referenced upload session is not valid for admin content');
  }
  if (requester.role !== 'ADMIN' && session.requested_by !== requester.sub) {
    throw new HttpError(403, 'You can only attach files uploaded from your own session');
  }
  if (session.status === 'failed') {
    throw new HttpError(400, 'Referenced upload session failed and cannot be attached');
  }
  if (expectedMimePrefix && !session.mime_type.toLowerCase().startsWith(`${expectedMimePrefix}/`)) {
    throw new HttpError(400, `Referenced upload session is not a valid ${expectedMimePrefix} asset`);
  }

  const publicUrl = buildStoragePublicUrl(session.storage_bucket, session.storage_path);
  const normalizedProvidedUrl = normalizeComparableUrl(providedUrl);
  if (normalizedProvidedUrl && normalizedProvidedUrl !== publicUrl) {
    throw new HttpError(400, 'Provided media URL does not match the uploaded asset session');
  }

  return {
    sessionId: session.id,
    publicUrl,
  };
};

const markUploadSessionAttached = async ({
  client,
  sessionId,
}: {
  client: PoolClient;
  sessionId?: string | null;
}): Promise<void> => {
  if (!sessionId) {
    return;
  }

  await client.query(
    `UPDATE upload_sessions
     SET status = 'uploaded',
         completed_at = COALESCE(completed_at, NOW()),
         updated_at = NOW()
     WHERE id = $1`,
    [sessionId],
  );
};

const loadContentRowById = async (
  db: Pool | PoolClient,
  contentId: string,
): Promise<ContentRow | null> => {
  const result = await db.query<ContentRow>(selectContentByIdSql, [contentId]);
  return result.rows[0] ?? null;
};

const loadContentRequestRowById = async (
  db: Pool | PoolClient,
  requestId: string,
): Promise<ContentSubmissionRequestRow | null> => {
  const result = await db.query<ContentSubmissionRequestRow>(selectContentRequestByIdSql, [requestId]);
  return result.rows[0] ?? null;
};

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
  c.media_upload_session_id,
  c.thumbnail_upload_session_id,
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

const selectContentRequestByIdSql = `SELECT
  r.id,
  r.requester_id,
  r.title,
  r.description,
  r.content_type,
  r.media_url,
  r.thumbnail_url,
  r.source_kind,
  r.external_source_id,
  r.channel_name,
  r.duration_label,
  r.app_sections,
  r.tags,
  r.metadata,
  r.request_notes,
  r.requested_visibility,
  r.request_status,
  r.media_upload_session_id,
  r.thumbnail_upload_session_id,
  r.created_content_id,
  r.created_at,
  r.updated_at,
  u.display_name AS requester_display_name,
  u.email AS requester_email,
  u.role AS requester_role,
  c.title AS created_content_title
 FROM content_submission_requests r
 INNER JOIN app_users u ON u.id = r.requester_id
 LEFT JOIN content_items c ON c.id = r.created_content_id
 WHERE r.id = $1
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

  let dataResult;
  let countResult;
  try {
    [dataResult, countResult] = await Promise.all([
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
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return {
        page: query.page,
        limit: query.limit,
        total: 0,
        items: [],
      };
    }
    throw error;
  }

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

  let dataResult;
  let countResult;
  try {
    [dataResult, countResult] = await Promise.all([
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
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return {
        page: query.page,
        limit: query.limit,
        total: 0,
        items: [],
      };
    }
    throw error;
  }

  return buildListResponse(dataResult.rows, Number(countResult.rows[0]!.count), query);
};

export const listContentRequests = async (requester: JwtClaims): Promise<ContentSubmissionRequest[]> => {
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (requester.role !== 'ADMIN') {
    values.push(requester.sub);
    conditions.push(`r.requester_id = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  let result;
  try {
    result = await pool.query<ContentSubmissionRequestRow>(
      `SELECT
         r.id,
         r.requester_id,
         r.title,
         r.description,
         r.content_type,
         r.media_url,
         r.thumbnail_url,
         r.source_kind,
         r.external_source_id,
         r.channel_name,
         r.duration_label,
         r.app_sections,
         r.tags,
         r.metadata,
         r.request_notes,
         r.requested_visibility,
         r.request_status,
         r.media_upload_session_id,
         r.thumbnail_upload_session_id,
         r.created_content_id,
         r.created_at,
         r.updated_at,
         u.display_name AS requester_display_name,
         u.email AS requester_email,
         u.role AS requester_role,
         c.title AS created_content_title
       FROM content_submission_requests r
       INNER JOIN app_users u ON u.id = r.requester_id
       LEFT JOIN content_items c ON c.id = r.created_content_id
       ${whereClause}
       ORDER BY
         CASE r.request_status
           WHEN 'submitted' THEN 0
           WHEN 'in_review' THEN 1
           WHEN 'changes_requested' THEN 2
           WHEN 'approved' THEN 3
           WHEN 'fulfilled' THEN 4
           ELSE 5
         END,
         r.created_at DESC
       LIMIT 60`,
      values,
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return [];
    }
    throw error;
  }

  return result.rows.map(toContentSubmissionRequest);
};

export const createContentRequest = async (
  requester: JwtClaims,
  input: CreateContentRequestInput,
): Promise<ContentSubmissionRequest> => {
  const client = await pool.connect();
  let request: ContentSubmissionRequest;

  try {
    await client.query('BEGIN');

    const mediaUpload = await loadValidatedUploadSession({
      client,
      sessionId: input.mediaUploadSessionId,
      requester,
      expectedMimePrefix: input.type === 'audio' ? 'audio' : input.type === 'video' ? 'video' : undefined,
      providedUrl: input.url,
    });
    const thumbnailUpload = await loadValidatedUploadSession({
      client,
      sessionId: input.thumbnailUploadSessionId,
      requester,
      expectedMimePrefix: 'image',
      providedUrl: input.thumbnailUrl,
    });

    const resolvedUrl = mediaUpload?.publicUrl ?? input.url ?? null;
    const resolvedThumbnailUrl = thumbnailUpload?.publicUrl ?? input.thumbnailUrl ?? null;
    const resolvedSourceKind =
      input.sourceKind ?? (mediaUpload || thumbnailUpload ? 'upload' : resolvedUrl ? 'external' : 'upload');

    if ((input.type === 'audio' || input.type === 'video') && !resolvedUrl) {
      throw new HttpError(400, `A media URL is required for ${input.type} requests`);
    }
    if ((input.type === 'audio' || input.type === 'video') && !resolvedThumbnailUrl) {
      throw new HttpError(400, 'A thumbnail is required for audio and video requests');
    }

    const insertResult = await client.query<{ id: string }>(
      `INSERT INTO content_submission_requests (
         requester_id,
         title,
         description,
         content_type,
         media_url,
         thumbnail_url,
         source_kind,
         external_source_id,
         channel_name,
         duration_label,
         app_sections,
         tags,
         metadata,
         request_notes,
         requested_visibility,
         media_upload_session_id,
         thumbnail_upload_session_id
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], $12::text[], $13::jsonb, $14, $15, $16, $17
       )
       RETURNING id`,
      [
        requester.sub,
        input.title,
        input.description,
        input.type,
        resolvedUrl,
        resolvedThumbnailUrl,
        resolvedSourceKind,
        input.externalSourceId ?? null,
        input.channelName ?? null,
        input.duration ?? null,
        normalizeTextList(input.appSections),
        normalizeTextList(input.tags),
        JSON.stringify(input.metadata ?? {}),
        input.requestNotes ?? null,
        input.requestedVisibility,
        mediaUpload?.sessionId ?? null,
        thumbnailUpload?.sessionId ?? null,
      ],
    );

    await markUploadSessionAttached({ client, sessionId: mediaUpload?.sessionId ?? null });
    await markUploadSessionAttached({ client, sessionId: thumbnailUpload?.sessionId ?? null });

    const createdRow = await loadContentRequestRowById(client, insertResult.rows[0]!.id);
    if (!createdRow) {
      throw new HttpError(500, 'Content request was created but could not be loaded');
    }

    request = toContentSubmissionRequest(createdRow);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return request;
};

export const updateContentRequestStatus = async ({
  requestId,
  status,
  requester,
}: {
  requestId: string;
  status: ContentRequestStatus;
  requester: JwtClaims;
}): Promise<ContentSubmissionRequest> => {
  if (requester.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin access required to update content requests');
  }

  const existing = await loadContentRequestRowById(pool, requestId);
  if (!existing) {
    throw new HttpError(404, 'Content request not found');
  }
  if (existing.created_content_id && status !== 'fulfilled') {
    throw new HttpError(400, 'This request already created a content draft and must remain fulfilled');
  }

  await pool.query(
    `UPDATE content_submission_requests
     SET request_status = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [requestId, status],
  );

  const updated = await loadContentRequestRowById(pool, requestId);
  if (!updated) {
    throw new HttpError(404, 'Content request not found');
  }

  return toContentSubmissionRequest(updated);
};

export const createDraftFromContentRequest = async ({
  requestId,
  requester,
}: {
  requestId: string;
  requester: JwtClaims;
}): Promise<{ request: ContentSubmissionRequest; content: ContentItem }> => {
  if (requester.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin access required to create content drafts from requests');
  }

  const client = await pool.connect();
  let item: ContentItem;
  let request: ContentSubmissionRequest;

  try {
    await client.query('BEGIN');

    const existing = await loadContentRequestRowById(client, requestId);
    if (!existing) {
      throw new HttpError(404, 'Content request not found');
    }
    if (existing.created_content_id) {
      throw new HttpError(400, 'A draft has already been created from this request');
    }
    if (existing.request_status === 'rejected') {
      throw new HttpError(400, 'Rejected requests cannot create a draft');
    }

    const insertResult = await client.query<{ id: string }>(
      `INSERT INTO content_items (
         author_id,
         title,
         description,
         content_type,
         media_url,
         thumbnail_url,
         source_kind,
         external_source_id,
         channel_name,
         duration_label,
         app_sections,
         tags,
         metadata,
         visibility,
         media_upload_session_id,
         thumbnail_upload_session_id
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], $12::text[], $13::jsonb, 'draft', $14, $15
       )
       RETURNING id`,
      [
        existing.requester_id,
        existing.title,
        existing.description,
        existing.content_type,
        existing.media_url,
        existing.thumbnail_url,
        existing.source_kind,
        existing.external_source_id,
        existing.channel_name,
        existing.duration_label,
        existing.app_sections ?? [],
        existing.tags ?? [],
        JSON.stringify(existing.metadata ?? {}),
        existing.media_upload_session_id,
        existing.thumbnail_upload_session_id,
      ],
    );

    await client.query(
      `UPDATE content_submission_requests
       SET request_status = 'fulfilled',
           created_content_id = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [requestId, insertResult.rows[0]!.id],
    );

    const createdContentRow = await loadContentRowById(client, insertResult.rows[0]!.id);
    const updatedRequestRow = await loadContentRequestRowById(client, requestId);
    if (!createdContentRow || !updatedRequestRow) {
      throw new HttpError(500, 'The draft was created but the final records could not be loaded');
    }

    item = toContentItem(createdContentRow);
    request = toContentSubmissionRequest(updatedRequestRow);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  await enqueueContentEvent({
    contentId: item.id,
    authorId: requester.sub,
    eventType: 'content.created',
    payload: {
      contentId: item.id,
      requestId,
      createdBy: requester.sub,
      type: item.type,
      visibility: item.visibility,
    },
  });

  return { request, content: item };
};

export const createContent = async (requester: JwtClaims, input: CreateContentInput): Promise<ContentItem> => {
  const client = await pool.connect();
  let item: ContentItem;
  let mediaUploadSessionId: string | null = null;
  let thumbnailUploadSessionId: string | null = null;

  try {
    await client.query('BEGIN');

    const mediaUpload = await loadValidatedUploadSession({
      client,
      sessionId: input.mediaUploadSessionId,
      requester,
      expectedMimePrefix: input.type === 'audio' ? 'audio' : input.type === 'video' ? 'video' : undefined,
      providedUrl: input.url,
    });
    const thumbnailUpload = await loadValidatedUploadSession({
      client,
      sessionId: input.thumbnailUploadSessionId,
      requester,
      expectedMimePrefix: 'image',
      providedUrl: input.thumbnailUrl,
    });

    const resolvedUrl = mediaUpload?.publicUrl ?? input.url ?? null;
    const resolvedThumbnailUrl = thumbnailUpload?.publicUrl ?? input.thumbnailUrl ?? null;
    const resolvedSourceKind =
      input.sourceKind ?? (mediaUpload || thumbnailUpload ? 'upload' : resolvedUrl ? 'external' : 'upload');

    if ((input.type === 'audio' || input.type === 'video') && !resolvedUrl) {
      throw new HttpError(400, `A media URL is required for ${input.type} content`);
    }

    const insertResult = await client.query<{ id: string }>(
      `INSERT INTO content_items (
         author_id, title, description, content_type, media_url, thumbnail_url, source_kind,
         external_source_id, channel_name, duration_label, app_sections, tags, metadata, visibility,
         media_upload_session_id, thumbnail_upload_session_id
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11::text[], $12::text[], $13::jsonb, $14, $15, $16
       )
       RETURNING id`,
      [
        requester.sub,
        input.title,
        input.description,
        input.type,
        resolvedUrl,
        resolvedThumbnailUrl,
        resolvedSourceKind,
        input.externalSourceId ?? null,
        input.channelName ?? null,
        input.duration ?? null,
        normalizeTextList(input.appSections),
        normalizeTextList(input.tags),
        JSON.stringify(input.metadata ?? {}),
        input.visibility,
        mediaUpload?.sessionId ?? null,
        thumbnailUpload?.sessionId ?? null,
      ],
    );

    mediaUploadSessionId = mediaUpload?.sessionId ?? null;
    thumbnailUploadSessionId = thumbnailUpload?.sessionId ?? null;

    await markUploadSessionAttached({ client, sessionId: mediaUploadSessionId });
    await markUploadSessionAttached({ client, sessionId: thumbnailUploadSessionId });

    const createdRow = await loadContentRowById(client, insertResult.rows[0]!.id);
    if (!createdRow) {
      throw new HttpError(500, 'Content was created but could not be loaded');
    }

    item = toContentItem(createdRow);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

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
  const existing = await loadContentRowById(pool, contentId);
  if (!existing) {
    throw new HttpError(404, 'Content not found');
  }

  if (requester.role !== 'ADMIN' && existing.author_id !== requester.sub) {
    throw new HttpError(403, 'You can only update your own content');
  }
  const client = await pool.connect();
  let item: ContentItem;

  try {
    await client.query('BEGIN');

    const nextType = input.type ?? existing.content_type;
    const mediaUpload = await loadValidatedUploadSession({
      client,
      sessionId: input.mediaUploadSessionId,
      requester,
      expectedMimePrefix: nextType === 'audio' ? 'audio' : nextType === 'video' ? 'video' : undefined,
      providedUrl: input.url,
    });
    const thumbnailUpload = await loadValidatedUploadSession({
      client,
      sessionId: input.thumbnailUploadSessionId,
      requester,
      expectedMimePrefix: 'image',
      providedUrl: input.thumbnailUrl,
    });

    const nextUrl = mediaUpload
      ? mediaUpload.publicUrl
      : Object.prototype.hasOwnProperty.call(input, 'url')
      ? (input.url ?? null)
      : existing.media_url;
    const nextThumbnailUrl = thumbnailUpload
      ? thumbnailUpload.publicUrl
      : Object.prototype.hasOwnProperty.call(input, 'thumbnailUrl')
      ? (input.thumbnailUrl ?? null)
      : existing.thumbnail_url;

    if ((nextType === 'audio' || nextType === 'video') && !nextUrl) {
      throw new HttpError(400, `A media URL is required for ${nextType} content`);
    }

    const nextSourceKind =
      input.sourceKind ??
      (mediaUpload || thumbnailUpload ? 'upload' : existing.source_kind ?? (nextUrl ? 'external' : 'upload'));

    await client.query(
      `UPDATE content_items
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
         media_upload_session_id = COALESCE($15, media_upload_session_id),
         thumbnail_upload_session_id = COALESCE($16, thumbnail_upload_session_id),
         updated_at = NOW()
       WHERE id = $1`,
      [
        contentId,
        input.title ?? null,
        input.description ?? null,
        input.type ?? null,
        nextUrl,
        nextThumbnailUrl,
        nextSourceKind,
        Object.prototype.hasOwnProperty.call(input, 'externalSourceId') ? (input.externalSourceId ?? null) : null,
        Object.prototype.hasOwnProperty.call(input, 'channelName') ? (input.channelName ?? null) : null,
        Object.prototype.hasOwnProperty.call(input, 'duration') ? (input.duration ?? null) : null,
        Object.prototype.hasOwnProperty.call(input, 'appSections') ? normalizeTextList(input.appSections) : null,
        Object.prototype.hasOwnProperty.call(input, 'tags') ? normalizeTextList(input.tags) : null,
        Object.prototype.hasOwnProperty.call(input, 'metadata') ? JSON.stringify(input.metadata ?? {}) : null,
        input.visibility ?? null,
        mediaUpload?.sessionId ?? null,
        thumbnailUpload?.sessionId ?? null,
      ],
    );

    await markUploadSessionAttached({ client, sessionId: mediaUpload?.sessionId ?? null });
    await markUploadSessionAttached({ client, sessionId: thumbnailUpload?.sessionId ?? null });

    const updatedRow = await loadContentRowById(client, contentId);
    if (!updatedRow) {
      throw new HttpError(404, 'Content not found');
    }

    item = toContentItem(updatedRow);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

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
    const ownerResult = await pool.query<{ author_id: string }>(
      `SELECT author_id FROM content_items WHERE id = $1 LIMIT 1`,
      [contentId],
    );
    if (ownerResult.rowCount === 0) {
      throw new HttpError(404, 'Content not found');
    }
    if (ownerResult.rows[0]!.author_id !== requester.sub) {
      throw new HttpError(403, 'You can only update visibility for your own content');
    }
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
  const existing = await pool.query<ContentRow>(selectContentByIdSql, [contentId]);
  if (existing.rowCount === 0) {
    throw new HttpError(404, 'Content not found');
  }

  const existingRow = existing.rows[0]!;
  if (requester.role !== 'ADMIN' && existingRow.author_id !== requester.sub) {
    throw new HttpError(403, 'You can only delete your own content');
  }

  await pool.query(`DELETE FROM content_items WHERE id = $1`, [contentId]);

  await enqueueContentEvent({
    contentId,
    authorId: requester.sub,
    eventType: 'content.deleted',
    payload: {
      contentId,
      deletedBy: requester.sub,
      title: existingRow.title,
      type: existingRow.content_type,
    },
  });

  return { deleted: true, id: contentId };
};
