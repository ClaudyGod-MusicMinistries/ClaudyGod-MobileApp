import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { logger } from '../lib/logger';

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: env.SUPABASE_S3_REGION,
      endpoint: env.SUPABASE_S3_ENDPOINT,
      credentials: {
        accessKeyId: env.SUPABASE_S3_ACCESS_KEY_ID,
        secretAccessKey: env.SUPABASE_S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
    logger.info('[s3] client initialized', {
      region: env.SUPABASE_S3_REGION,
      endpoint: env.SUPABASE_S3_ENDPOINT,
    });
  }
  return _client;
}

export const S3_PUT_EXPIRY_SECONDS = 15 * 60;  // 15 min upload window
export const S3_GET_EXPIRY_SECONDS  = 60 * 60; // 1 hr download window

export async function generatePresignedPutUrl(params: {
  bucket: string;
  key: string;
  contentType: string;
  contentLength?: number;
  expiresIn?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    ContentType: params.contentType,
    ...(params.contentLength !== undefined && { ContentLength: params.contentLength }),
  });
  const url = await getSignedUrl(getClient(), command, {
    expiresIn: params.expiresIn ?? S3_PUT_EXPIRY_SECONDS,
  });
  logger.debug('[s3] presigned PUT issued', { bucket: params.bucket, key: params.key });
  return url;
}

export async function generatePresignedGetUrl(params: {
  bucket: string;
  key: string;
  expiresIn?: number;
}): Promise<string> {
  const command = new GetObjectCommand({ Bucket: params.bucket, Key: params.key });
  return getSignedUrl(getClient(), command, {
    expiresIn: params.expiresIn ?? S3_GET_EXPIRY_SECONDS,
  });
}

export interface S3ObjectMeta {
  contentLength: number;
  contentType: string | undefined;
  lastModified: Date | undefined;
}

export async function headObject(params: {
  bucket: string;
  key: string;
}): Promise<S3ObjectMeta | null> {
  try {
    const res = await getClient().send(
      new HeadObjectCommand({ Bucket: params.bucket, Key: params.key }),
    );
    return {
      contentLength: res.ContentLength ?? 0,
      contentType: res.ContentType,
      lastModified: res.LastModified,
    };
  } catch (err: unknown) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

export async function deleteObject(params: { bucket: string; key: string }): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: params.bucket, Key: params.key }));
  logger.info('[s3] object deleted', { bucket: params.bucket, key: params.key });
}

export function buildPublicObjectUrl(key: string): string {
  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  return `${base}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${key}`;
}
