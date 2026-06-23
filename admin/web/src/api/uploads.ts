import client from './client';
import { uploadMediaFile } from './storage';
import type { SignedUrlResponse } from './types';

export async function getSignedUrl(params: {
  filename: string;
  contentType: string;
  folder?: string;
}): Promise<SignedUrlResponse> {
  const { data } = await client.post<SignedUrlResponse>('/v1/uploads/signed-url', params);
  return data;
}

// Route audio/video through the new S3 storage pipeline; images use the legacy path.
export async function uploadFile(
  file: File,
  folder = 'content',
  onProgress?: (pct: number) => void,
): Promise<{ key: string; publicUrl: string }> {
  const isMedia = file.type.startsWith('audio/') || file.type.startsWith('video/');

  if (isMedia) {
    const result = await uploadMediaFile(file, onProgress);
    return { key: result.key, publicUrl: result.publicUrl };
  }

  // Legacy path for images and other small files
  const signed = await getSignedUrl({ filename: file.name, contentType: file.type, folder });
  const { default: axios } = await import('axios');
  await axios.put(signed.uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
  return { key: signed.key, publicUrl: signed.publicUrl };
}
