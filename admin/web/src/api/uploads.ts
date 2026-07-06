import { uploadMediaFile } from './storage';

// All uploads (images, audio, video) go through the single S3-presigned-URL pipeline.
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ key: string; publicUrl: string }> {
  const result = await uploadMediaFile(file, onProgress);
  return { key: result.key, publicUrl: result.publicUrl };
}
