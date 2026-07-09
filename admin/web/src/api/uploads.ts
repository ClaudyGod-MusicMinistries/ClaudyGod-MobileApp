import { uploadMediaFile } from './storage';

// All uploads (images, audio, video) go through the single S3-presigned-URL pipeline.
// sessionId must be sent back to the content create/update endpoints — the backend
// requires it to prove the upload was actually completed via this pipeline.
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ key: string; publicUrl: string; sessionId: string }> {
  const result = await uploadMediaFile(file, onProgress);
  return { key: result.key, publicUrl: result.publicUrl, sessionId: result.sessionId };
}
