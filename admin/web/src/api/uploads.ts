import axios from 'axios';
import client from './client';
import type { SignedUrlResponse } from './types';

export async function getSignedUrl(params: {
  filename: string;
  contentType: string;
  folder?: string;
}): Promise<SignedUrlResponse> {
  const { data } = await client.post<SignedUrlResponse>('/v1/uploads/signed-url', params);
  return data;
}

export async function uploadToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
}

export async function uploadFile(
  file: File,
  folder = 'content',
  onProgress?: (pct: number) => void,
): Promise<{ key: string; publicUrl: string }> {
  const signed = await getSignedUrl({ filename: file.name, contentType: file.type, folder });
  await uploadToS3(signed.uploadUrl, file, onProgress);
  return { key: signed.key, publicUrl: signed.publicUrl };
}
