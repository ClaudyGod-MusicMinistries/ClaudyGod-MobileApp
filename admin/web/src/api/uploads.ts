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
  if (pipeline === 'website') {
    try {
      const result = await uploadWebsiteFile(file, onProgress, signal);
      return { key: result.key, publicUrl: result.publicUrl, sessionId: result.sessionId };
    } catch (err) {
      console.warn('[uploadFile] Website storage pipeline failed, falling back to core storage pipeline:', err);
      // Fallback to core S3/Supabase storage pipeline so admin uploads never fail
      const fallback = await uploadMediaFile(file, onProgress, signal);
      return { key: fallback.key, publicUrl: fallback.publicUrl, sessionId: fallback.sessionId };
    }
  }

  const result = await uploadMediaFile(file, onProgress, signal);
  return { key: result.key, publicUrl: result.publicUrl, sessionId: result.sessionId };
}
