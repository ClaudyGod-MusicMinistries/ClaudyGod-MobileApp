import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { HttpError } from '../../lib/httpError';
import { supabaseAdmin } from '../../infra/supabase';

interface UploadSessionRow {
  id: string;
  status: string;
  channel: 'admin' | 'mobile';
  expires_at: string | Date;
}

const sanitizeSegment = (value: string): string => {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');

  return sanitized || 'file';
};

const buildStoragePath = ({
  channel,
  folder,
  fileName,
}: {
  channel: 'admin' | 'mobile';
  folder: string;
  fileName: string;
}): string => {
  const ext = path.extname(fileName).toLowerCase();
  const base = sanitizeSegment(path.basename(fileName, ext));
  const safeFolder = sanitizeSegment(folder);
  const safeExt = /^[.a-z0-9]{0,12}$/.test(ext) ? ext : '';
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');

  return `${channel}/${safeFolder}/${y}/${m}/${d}/${randomUUID()}-${base}${safeExt}`;
};

export const requestSignedUploadUrl = async ({
  channel,
  fileName,
  mimeType,
  folder,
  clientReference,
  requestedByUserId,
}: {
  channel: 'admin' | 'mobile';
  fileName: string;
  mimeType: string;
  folder: string;
  clientReference?: string;
  requestedByUserId?: string;
}): Promise<{
  upload: {
    bucket: string;
    path: string;
    signedUrl: string;
    token?: string;
    expiresInSeconds: number;
  };
  session: {
    id: string;
    status: string;
    channel: 'admin' | 'mobile';
    expiresAt: string;
  };
}> => {
  if (!env.SUPABASE_ENABLED || !supabaseAdmin) {
    throw new HttpError(503, 'Supabase storage is not configured');
  }

  if (!mimeType.includes('/')) {
    throw new HttpError(400, 'Invalid mimeType');
  }

  const storagePath = buildStoragePath({ channel, folder, fileName });
  const expiresInSeconds = 15 * 60;

  const { data, error } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data?.signedUrl) {
    throw new HttpError(503, error?.message ?? 'Unable to create signed upload URL');
  }

  const sessionInsert = await pool.query<UploadSessionRow>(
    `INSERT INTO upload_sessions (
      channel,
      requested_by,
      client_reference,
      original_file_name,
      mime_type,
      storage_bucket,
      storage_path,
      status,
      expires_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'issued', NOW() + INTERVAL '15 minutes')
    RETURNING id, status, channel, expires_at`,
    [
      channel,
      requestedByUserId ?? null,
      clientReference ?? null,
      fileName,
      mimeType,
      env.SUPABASE_STORAGE_BUCKET,
      storagePath,
    ],
  );

  const session = sessionInsert.rows[0];

  return {
    upload: {
      bucket: env.SUPABASE_STORAGE_BUCKET,
      path: storagePath,
      signedUrl: data.signedUrl,
      token: (data as { token?: string }).token,
      expiresInSeconds,
    },
    session: {
      id: session.id,
      status: session.status,
      channel: session.channel,
      expiresAt: new Date(session.expires_at).toISOString(),
    },
  };
};
