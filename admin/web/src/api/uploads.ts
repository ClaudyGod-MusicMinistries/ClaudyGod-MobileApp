import { uploadMediaFile } from './storage';
import { uploadWebsiteFile } from './websiteStorage';

export type UploadPipeline = 'mobile' | 'website';

// All uploads (images, audio, video) go through a presigned-S3 pipeline —
// which one depends on which workspace the uploading view belongs to (Mobile
// Studio vs Web Studio use entirely separate buckets/credentials/backends).
// sessionId must be sent back to the content create/update endpoints — the
// backend requires it to prove the upload was actually completed via this
// pipeline.
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
  pipeline: UploadPipeline = 'mobile',
  signal?: AbortSignal,
): Promise<{ key: string; publicUrl: string; sessionId: string }> {
  const result = pipeline === 'website'
    ? await uploadWebsiteFile(file, onProgress, signal)
    : await uploadMediaFile(file, onProgress, signal);
  return { key: result.key, publicUrl: result.publicUrl, sessionId: result.sessionId };
}
