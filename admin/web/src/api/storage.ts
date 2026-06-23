import axios from 'axios';
import client from './client';

export interface StorageUploadSession {
  id: string;
  key: string;
  status: 'issued' | 'uploaded' | 'expired' | 'failed';
  createdAt: string;
}

export interface RequestUploadResponse {
  upload: {
    presignedUrl: string;
    key: string;
  };
  session: StorageUploadSession;
}

export interface ConfirmUploadResponse {
  asset: {
    publicUrl: string;
    key: string;
    mimeType: string;
    fileSizeBytes: number;
  };
  session: StorageUploadSession;
}

export type AssetKind = 'audio' | 'video' | 'image' | 'document';

export async function requestUpload(params: {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  assetKind: AssetKind;
}): Promise<RequestUploadResponse> {
  const { data } = await client.post<RequestUploadResponse>('/v1/admin/storage/request-upload', params);
  return data;
}

export async function uploadToStorage(
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

export async function confirmUpload(sessionId: string): Promise<ConfirmUploadResponse> {
  const { data } = await client.post<ConfirmUploadResponse>('/v1/admin/storage/confirm', { sessionId });
  return data;
}

export async function deleteUploadSession(sessionId: string): Promise<void> {
  await client.delete(`/v1/admin/storage/sessions/${sessionId}`);
}

export async function getDownloadUrl(sessionId: string): Promise<{ url: string }> {
  const { data } = await client.get<{ url: string }>(`/v1/admin/storage/sessions/${sessionId}/download-url`);
  return data;
}

export function mimeToAssetKind(mimeType: string): AssetKind {
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  return 'document';
}

export async function uploadMediaFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ publicUrl: string; sessionId: string; key: string }> {
  const assetKind = mimeToAssetKind(file.type);
  const session = await requestUpload({
    fileName: file.name,
    mimeType: file.type,
    fileSizeBytes: file.size,
    assetKind,
  });
  await uploadToStorage(session.upload.presignedUrl, file, onProgress);
  const confirmed = await confirmUpload(session.session.id);
  return {
    publicUrl: confirmed.asset.publicUrl,
    sessionId: session.session.id,
    key: confirmed.asset.key,
  };
}
