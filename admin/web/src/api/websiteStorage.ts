import axios from 'axios';
import client from './client';

// The website's presigned-S3 pipeline — parallel to storage.ts (the mobile
// app's own pipeline), calling the /v1/website/storage/* proxy routes instead
// of /v1/admin/storage/*. Deliberately separate: different bucket, different
// credentials, different backend (CGM-Backend, not services/api's own S3).

export interface WebsiteUploadSession {
  sessionId: string;
  presignedUrl: string;
  key: string;
  bucket: string;
  expiresAt: string;
}

export interface WebsiteConfirmedUpload {
  sessionId: string;
  key: string;
  publicUrl: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

// Matches CGM-Backend's UploadAssetKind enum member names exactly (PascalCase) —
// the API serializes/binds enums by name, not a lowercased/kebab variant.
export type WebsiteAssetKind = 'Thumbnail' | 'Audio' | 'Video' | 'Document';

export async function requestWebsiteUpload(params: {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  kind: WebsiteAssetKind;
}): Promise<WebsiteUploadSession> {
  const { data } = await client.post<WebsiteUploadSession>('/v1/website/storage/request-upload', params);
  return data;
}

export async function uploadToWebsiteStorage(
  presignedUrl: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  await axios.put(presignedUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
}

export async function confirmWebsiteUpload(sessionId: string): Promise<WebsiteConfirmedUpload> {
  const { data } = await client.post<WebsiteConfirmedUpload>('/v1/website/storage/confirm', { sessionId });
  return data;
}

export function mimeToWebsiteAssetKind(mimeType: string): WebsiteAssetKind {
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType === 'application/pdf') return 'Document';
  return 'Thumbnail';
}

export async function uploadWebsiteFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ publicUrl: string; sessionId: string; key: string }> {
  const kind = mimeToWebsiteAssetKind(file.type);
  const session = await requestWebsiteUpload({
    fileName: file.name,
    mimeType: file.type,
    fileSizeBytes: file.size,
    kind,
  });
  await uploadToWebsiteStorage(session.presignedUrl, file, onProgress);
  const confirmed = await confirmWebsiteUpload(session.sessionId);
  return {
    publicUrl: confirmed.publicUrl,
    sessionId: session.sessionId,
    key: confirmed.key,
  };
}
