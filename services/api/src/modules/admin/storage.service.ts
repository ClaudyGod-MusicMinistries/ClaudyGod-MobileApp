import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { BadRequestError, ForbiddenError, HttpError, NotFoundError } from '../../lib/errors';
import { uploadPolicies } from '../uploads/uploads.schema';
import {
  buildPublicObjectUrl,
  deleteObject,
  generatePresignedGetUrl,
  generatePresignedPutUrl,
  headObject,
  S3_GET_EXPIRY_SECONDS,
  S3_PUT_EXPIRY_SECONDS,
} from '../../infra/s3';
import { logger } from '../../lib/logger';

type AssetKind = keyof typeof uploadPolicies;

interface UploadSessionRow {
  id: string;
  channel: 'admin' | 'mobile';
  requested_by: string | null;
  client_reference: string | null;
  original_file_name: string;
  mime_type: string;
  storage_bucket: string;
  storage_path: string;
  status: 'issued' | 'uploaded' | 'expired' | 'failed';
  expires_at: string | Date;
  completed_at: string | Date | null;
  created_at: string | Date;
}

function assertS3Configured(): void {
  if (!env.S3_ENABLED) {
    throw new HttpError(503, 'S3 storage is not configured on this server', undefined, 'S3_NOT_CONFIGURED');
  }
}

const sanitizeSegment = (value: string): string => {
  const s = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');
  return s || 'file';
};

const buildKey = (assetKind: AssetKind, fileName: string): string => {
  const ext = path.extname(fileName).toLowerCase();
  const base = sanitizeSegment(path.basename(fileName, ext));
  const safeExt = /^[.a-z0-9]{1,12}$/.test(ext) ? ext : '';
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const folder = uploadPolicies[assetKind].recommendedFolder;
  return `admin/${folder}/${y}/${m}/${d}/${randomUUID()}-${base}${safeExt}`;
};

const validateUpload = (
  assetKind: AssetKind,
  mimeType: string,
  fileName: string,
  fileSizeBytes: number,
): void => {
  const policy = uploadPolicies[assetKind];
  const normalizedMime = mimeType.trim().toLowerCase();
  const ext = path.extname(fileName).toLowerCase();

  if (!policy.allowedMimeTypes.includes(normalizedMime)) {
    throw new HttpError(400, `Unsupported ${assetKind} MIME type`, {
      field: 'mimeType',
      assetKind,
      allowedMimeTypes: policy.allowedMimeTypes,
    });
  }
  if (!policy.allowedExtensions.includes(ext)) {
    throw new HttpError(400, `Unsupported ${assetKind} file extension`, {
      field: 'fileName',
      assetKind,
      allowedExtensions: policy.allowedExtensions,
    });
  }
  if (fileSizeBytes > policy.maxBytes) {
    throw new HttpError(400, `${policy.label} exceeds the ${policy.maxBytes / (1024 * 1024)} MB limit`, {
      field: 'fileSizeBytes',
      assetKind,
      maxBytes: policy.maxBytes,
      receivedBytes: fileSizeBytes,
    });
  }
};

// ─── Request ─────────────────────────────────────────────────────────────────

export const requestAdminS3Upload = async ({
  assetKind,
  fileName,
  mimeType,
  fileSizeBytes,
  clientReference,
  requestedByUserId,
}: {
  assetKind: AssetKind;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  clientReference?: string;
  requestedByUserId: string;
}): Promise<{
  upload: {
    method: 'PUT';
    presignedUrl: string;
    key: string;
    bucket: string;
    publicUrl: string;
    contentType: string;
    fileSizeBytes: number;
    expiresInSeconds: number;
    expiresAt: string;
  };
  session: {
    id: string;
    status: string;
    channel: 'admin';
    expiresAt: string;
  };
}> => {
  assertS3Configured();
  validateUpload(assetKind, mimeType, fileName, fileSizeBytes);

  const key = buildKey(assetKind, fileName);
  const bucket = env.SUPABASE_STORAGE_BUCKET;
  const expiresAt = new Date(Date.now() + S3_PUT_EXPIRY_SECONDS * 1000);

  const presignedUrl = await generatePresignedPutUrl({
    bucket,
    key,
    contentType: mimeType,
    contentLength: fileSizeBytes,
    expiresIn: S3_PUT_EXPIRY_SECONDS,
  });

  const sessionResult = await pool.query<UploadSessionRow>(
    `INSERT INTO upload_sessions (
      channel, requested_by, client_reference, original_file_name,
      mime_type, storage_bucket, storage_path, status, expires_at
    )
    VALUES ('admin', $1, $2, $3, $4, $5, $6, 'issued', $7)
    RETURNING id, channel, requested_by, client_reference, original_file_name,
              mime_type, storage_bucket, storage_path, status, expires_at, created_at`,
    [requestedByUserId, clientReference ?? null, fileName, mimeType, bucket, key, expiresAt.toISOString()],
  );

  const session = sessionResult.rows[0];
  if (!session) {
    throw new HttpError(500, 'Failed to create upload session');
  }

  logger.info('[storage] upload session issued', {
    sessionId: session.id,
    assetKind,
    key,
    requestedByUserId,
  });

  return {
    upload: {
      method: 'PUT',
      presignedUrl,
      key,
      bucket,
      publicUrl: buildPublicObjectUrl(key),
      contentType: mimeType,
      fileSizeBytes,
      expiresInSeconds: S3_PUT_EXPIRY_SECONDS,
      expiresAt: expiresAt.toISOString(),
    },
    session: {
      id: session.id,
      status: session.status,
      channel: 'admin',
      expiresAt: new Date(session.expires_at).toISOString(),
    },
  };
};

// ─── Confirm ─────────────────────────────────────────────────────────────────

export const confirmAdminS3Upload = async ({
  sessionId,
  requestedByUserId,
}: {
  sessionId: string;
  requestedByUserId: string;
}): Promise<{
  session: { id: string; status: string; confirmedAt: string };
  asset: {
    key: string;
    bucket: string;
    publicUrl: string;
    contentType: string | undefined;
    contentLength: number;
    uploadedAt: string;
  };
}> => {
  assertS3Configured();

  const sessionResult = await pool.query<UploadSessionRow>(
    `SELECT id, channel, requested_by, original_file_name, mime_type,
            storage_bucket, storage_path, status, expires_at, completed_at, created_at
     FROM upload_sessions
     WHERE id = $1`,
    [sessionId],
  );

  const session = sessionResult.rows[0];
  if (!session) {
    throw new NotFoundError('Upload session not found', 'SESSION_NOT_FOUND');
  }
  if (session.channel !== 'admin') {
    throw new ForbiddenError('Session channel mismatch', 'CHANNEL_MISMATCH');
  }
  if (session.requested_by !== requestedByUserId) {
    throw new ForbiddenError('You do not own this upload session', 'SESSION_FORBIDDEN');
  }

  // Idempotent — already confirmed
  if (session.status === 'uploaded') {
    const meta = await headObject({ bucket: session.storage_bucket, key: session.storage_path });
    return {
      session: {
        id: session.id,
        status: 'uploaded',
        confirmedAt: session.completed_at ? new Date(session.completed_at).toISOString() : new Date().toISOString(),
      },
      asset: {
        key: session.storage_path,
        bucket: session.storage_bucket,
        publicUrl: buildPublicObjectUrl(session.storage_path),
        contentType: meta?.contentType ?? session.mime_type,
        contentLength: meta?.contentLength ?? 0,
        uploadedAt: meta?.lastModified?.toISOString() ?? new Date().toISOString(),
      },
    };
  }

  if (session.status === 'expired' || new Date(session.expires_at) < new Date()) {
    await pool.query(
      `UPDATE upload_sessions SET status = 'expired', updated_at = NOW() WHERE id = $1 AND status = 'issued'`,
      [sessionId],
    );
    throw new BadRequestError('Upload session has expired — request a new one', 'SESSION_EXPIRED');
  }

  if (session.status === 'failed') {
    throw new BadRequestError('Upload session was cancelled', 'SESSION_CANCELLED');
  }

  const meta = await headObject({ bucket: session.storage_bucket, key: session.storage_path });
  if (!meta) {
    throw new BadRequestError(
      'File not found in storage — complete the PUT upload before confirming',
      'UPLOAD_NOT_FOUND',
    );
  }

  const now = new Date();
  await pool.query(
    `UPDATE upload_sessions
     SET status = 'uploaded', completed_at = $1, updated_at = $1
     WHERE id = $2`,
    [now.toISOString(), sessionId],
  );

  logger.info('[storage] upload confirmed', {
    sessionId,
    key: session.storage_path,
    contentLength: meta.contentLength,
  });

  return {
    session: {
      id: session.id,
      status: 'uploaded',
      confirmedAt: now.toISOString(),
    },
    asset: {
      key: session.storage_path,
      bucket: session.storage_bucket,
      publicUrl: buildPublicObjectUrl(session.storage_path),
      contentType: meta.contentType ?? session.mime_type,
      contentLength: meta.contentLength,
      uploadedAt: meta.lastModified?.toISOString() ?? now.toISOString(),
    },
  };
};

// ─── Delete ──────────────────────────────────────────────────────────────────

export const deleteAdminS3Upload = async ({
  sessionId,
  requestedByUserId,
}: {
  sessionId: string;
  requestedByUserId: string;
}): Promise<{ message: string; sessionId: string; key: string }> => {
  assertS3Configured();

  const sessionResult = await pool.query<UploadSessionRow>(
    `SELECT id, channel, requested_by, storage_bucket, storage_path, status
     FROM upload_sessions
     WHERE id = $1`,
    [sessionId],
  );

  const session = sessionResult.rows[0];
  if (!session) {
    throw new NotFoundError('Upload session not found', 'SESSION_NOT_FOUND');
  }
  if (session.channel !== 'admin') {
    throw new ForbiddenError('Session channel mismatch', 'CHANNEL_MISMATCH');
  }
  if (session.requested_by !== requestedByUserId) {
    throw new ForbiddenError('You do not own this upload session', 'SESSION_FORBIDDEN');
  }

  await deleteObject({ bucket: session.storage_bucket, key: session.storage_path }).catch((err) => {
    logger.warn('[storage] S3 delete failed (continuing session cleanup)', {
      sessionId,
      key: session.storage_path,
      error: String(err),
    });
  });

  await pool.query(
    `UPDATE upload_sessions SET status = 'failed', updated_at = NOW() WHERE id = $1`,
    [sessionId],
  );

  return {
    message: 'Upload deleted',
    sessionId: session.id,
    key: session.storage_path,
  };
};

// ─── List sessions ────────────────────────────────────────────────────────────

export const listAdminStorageSessions = async ({
  requestedByUserId,
  isAdmin,
  limit,
  offset,
  status,
}: {
  requestedByUserId: string;
  isAdmin: boolean;
  limit: number;
  offset: number;
  status?: 'issued' | 'uploaded' | 'expired' | 'failed';
}): Promise<{
  sessions: Array<{
    id: string;
    originalFileName: string;
    mimeType: string;
    storagePath: string;
    publicUrl: string;
    status: string;
    expiresAt: string;
    completedAt: string | null;
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}> => {
  const conditions: string[] = [`channel = 'admin'`];
  const params: unknown[] = [];

  // Non-admin users only see their own sessions
  if (!isAdmin) {
    conditions.push(`requested_by = $${params.length + 1}`);
    params.push(requestedByUserId);
  }

  if (status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM upload_sessions ${where}`,
    params,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const dataResult = await pool.query<UploadSessionRow & { created_at: string }>(
    `SELECT id, original_file_name, mime_type, storage_bucket, storage_path,
            status, expires_at, completed_at, created_at
     FROM upload_sessions
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  const sessions = dataResult.rows.map((row) => ({
    id: row.id,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    publicUrl: buildPublicObjectUrl(row.storage_path),
    status: row.status,
    expiresAt: new Date(row.expires_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  }));

  return { sessions, total, limit, offset };
};

// ─── Presigned download URL ───────────────────────────────────────────────────

export const getPresignedDownloadUrl = async ({
  sessionId,
  requestedByUserId,
  expiresInSeconds,
}: {
  sessionId: string;
  requestedByUserId: string;
  expiresInSeconds?: number;
}): Promise<{ presignedUrl: string; expiresInSeconds: number; expiresAt: string }> => {
  assertS3Configured();

  const sessionResult = await pool.query<UploadSessionRow>(
    `SELECT id, channel, requested_by, storage_bucket, storage_path, status
     FROM upload_sessions
     WHERE id = $1`,
    [sessionId],
  );

  const session = sessionResult.rows[0];
  if (!session) throw new NotFoundError('Upload session not found', 'SESSION_NOT_FOUND');
  if (session.channel !== 'admin') throw new ForbiddenError('Session channel mismatch', 'CHANNEL_MISMATCH');
  if (session.requested_by !== requestedByUserId) throw new ForbiddenError('Forbidden', 'SESSION_FORBIDDEN');
  if (session.status !== 'uploaded') {
    throw new BadRequestError('File has not been confirmed as uploaded yet', 'NOT_UPLOADED');
  }

  const ttl = expiresInSeconds ?? S3_GET_EXPIRY_SECONDS;
  const presignedUrl = await generatePresignedGetUrl({
    bucket: session.storage_bucket,
    key: session.storage_path,
    expiresIn: ttl,
  });

  return {
    presignedUrl,
    expiresInSeconds: ttl,
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
  };
};
