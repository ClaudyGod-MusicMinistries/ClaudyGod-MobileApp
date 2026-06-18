import { useCallback, useRef, useState } from 'react';
import { apiFetchWithMobileSession } from '../services/authService';
import type { PickedMedia } from './useMediaPicker';

type UploadStatus = 'idle' | 'signing' | 'uploading' | 'done' | 'error';

interface UploadResult {
  mediaUrl: string;
}

interface UseContentUploadReturn {
  upload: (_media: PickedMedia) => Promise<UploadResult | null>;
  progress: number;
  status: UploadStatus;
  cancel: () => void;
}

interface SignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export function useContentUpload(): UseContentUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
    setProgress(0);
  }, []);

  const upload = useCallback(async (media: PickedMedia): Promise<UploadResult | null> => {
    setStatus('signing');
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // 1. Get signed upload URL
      const ext = media.uri.split('.').pop()?.toLowerCase() ?? 'mp3';
      const signed = await apiFetchWithMobileSession<SignedUrlResponse>(
        '/v1/mobile/uploads/signed-url',
        {
          method: 'POST',
          body: JSON.stringify({
            fileName: media.fileName,
            contentType: media.mimeType,
            folder: 'mobile-content',
            fileExtension: ext,
          }),
          signal: controller.signal,
        },
      );

      setStatus('uploading');
      setProgress(10);

      // 2. Read file as blob and PUT to S3
      const fileResponse = await fetch(media.uri, { signal: controller.signal });
      const blob = await fileResponse.blob();

      setProgress(30);

      await fetch(signed.uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': media.mimeType },
        signal: controller.signal,
      });

      setProgress(100);
      setStatus('done');
      return { mediaUrl: signed.publicUrl };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null;
      setStatus('error');
      return null;
    }
  }, []);

  return { upload, progress, status, cancel };
}
