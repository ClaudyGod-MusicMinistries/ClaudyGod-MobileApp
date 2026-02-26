import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { HttpError } from '../../lib/httpError';
import { supabaseAdmin } from '../../infra/supabase';
import { uploadPolicies } from './uploads.schema';

interface UploadSessionRow {
  id: string;
  status: string;
  channel: 'admin' | 'mobile';
  expires_at: string | Date;
}

type UploadAssetKind = keyof typeof uploadPolicies;

const extensionFromFileName = (fileName: string): string => path.extname(fileName).toLowerCase();

const normalizeMimeType = (mimeType: string): string => mimeType.trim().toLowerCase();

const inferAssetKindFromMimeType = (mimeType: string): UploadAssetKind | null => {
  const normalized = normalizeMimeType(mimeType);
  if (normalized.startsWith('image/')) return 'thumbnail';
  if (normalized.startsWith('audio/')) return 'audio';
  if (normalized.startsWith('video/')) return 'video';
  return null;
};

const resolveFolder = ({
  channel,
  folder,
  assetKind,
}: {
  channel: 'admin' | 'mobile';
  folder?: string;
  assetKind?: UploadAssetKind;
}): string => {
  if (folder && folder.trim()) return folder.trim();
  if (!assetKind) return channel === 'admin' ? 'admin-content' : 'mobile-content';
  const base = uploadPolicies[assetKind].recommendedFolder;
  return channel === 'admin' ? base : `mobile-${assetKind}`;
};

const validateRequestedUpload = ({
  fileName,
  mimeType,
  fileSizeBytes,
  assetKind,
}: {
  fileName: string;
  mimeType: string;
  fileSizeBytes?: number;
  assetKind?: UploadAssetKind;
}): UploadAssetKind | undefined => {
  if (!assetKind) return inferAssetKindFromMimeType(mimeType) ?? undefined;

  const policy = uploadPolicies[assetKind];
  const normalizedMimeType = normalizeMimeType(mimeType);
  const ext = extensionFromFileName(fileName);

  if (!policy.allowedMimeTypes.includes(normalizedMimeType)) {
    throw new HttpError(400, `Unsupported ${assetKind} file type`, {
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

  if (typeof fileSizeBytes !== 'number' || !Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    throw new HttpError(400, 'fileSizeBytes is required for policy-validated uploads', {
      field: 'fileSizeBytes',
      assetKind,
      maxBytes: policy.maxBytes,
    });
  }

  if (fileSizeBytes > policy.maxBytes) {
    throw new HttpError(400, `${policy.label} exceeds maximum allowed file size`, {
      field: 'fileSizeBytes',
      assetKind,
      maxBytes: policy.maxBytes,
      receivedBytes: fileSizeBytes,
    });
  }

  return assetKind;
};

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

const buildSupabasePublicObjectUrl = (bucket: string, objectPath: string): string =>
  `${env.SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`;

export const requestSignedUploadUrl = async ({
  channel,
  fileName,
  mimeType,
  folder,
  fileSizeBytes,
  assetKind,
  clientReference,
  requestedByUserId,
}: {
  channel: 'admin' | 'mobile';
  fileName: string;
  mimeType: string;
  folder?: string;
  fileSizeBytes?: number;
  assetKind?: UploadAssetKind;
  clientReference?: string;
  requestedByUserId?: string;
}): Promise<{
  upload: {
    bucket: string;
    path: string;
    signedUrl: string;
    token?: string;
    publicUrl: string;
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

  const effectiveAssetKind = validateRequestedUpload({
    fileName,
    mimeType,
    fileSizeBytes,
    assetKind,
  });
  const resolvedFolder = resolveFolder({
    channel,
    folder,
    assetKind: effectiveAssetKind,
  });

  const storagePath = buildStoragePath({ channel, folder: resolvedFolder, fileName });
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
      publicUrl: buildSupabasePublicObjectUrl(env.SUPABASE_STORAGE_BUCKET, storagePath),
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
