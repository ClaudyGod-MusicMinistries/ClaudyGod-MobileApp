import { useCallback, useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import type { FeedCardItem } from '../services/contentService';
import { getGuestDownloads, saveGuestDownload, removeGuestDownload } from '../lib/guestStorage';

type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error';

interface DownloadState {
  status: DownloadStatus;
  progress: number; // 0-100
  localUri: string | null;
}

const DOWNLOAD_DIR = `${FileSystem.documentDirectory ?? ''}claudygod-downloads/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

export function useOfflineDownload() {
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  useEffect(() => {
    let active = true;
    void getGuestDownloads().then((saved) => {
      if (!active) return;
      const initial: Record<string, DownloadState> = {};
      saved.forEach((d) => {
        initial[d.contentId] = { status: 'done', progress: 100, localUri: d.localUri };
      });
      setDownloads(initial);
    });
    return () => { active = false; };
  }, []);

  const getDownloadStatus = useCallback(
    (contentId: string): DownloadStatus => downloads[contentId]?.status ?? 'idle',
    [downloads],
  );

  const getDownloadedUri = useCallback(
    (contentId: string): string | null => downloads[contentId]?.localUri ?? null,
    [downloads],
  );

  const downloadContent = useCallback(async (item: FeedCardItem): Promise<void> => {
    if (!item.mediaUrl) return;
    if (downloads[item.id]?.status === 'downloading' || downloads[item.id]?.status === 'done') return;

    setDownloads((prev) => ({
      ...prev,
      [item.id]: { status: 'downloading', progress: 0, localUri: null },
    }));

    try {
      await ensureDir();
      const ext = item.mediaUrl.split('?')[0]?.split('.').pop() ?? 'mp3';
      const localUri = `${DOWNLOAD_DIR}${item.id}.${ext}`;

      const dl = FileSystem.createDownloadResumable(
        item.mediaUrl,
        localUri,
        {},
        (progress) => {
          const pct = progress.totalBytesExpectedToWrite > 0
            ? Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100)
            : 0;
          setDownloads((prev) => ({
            ...prev,
            [item.id]: { status: 'downloading', progress: pct, localUri: null },
          }));
        },
      );

      await dl.downloadAsync();

      await saveGuestDownload({
        contentId: item.id,
        title: item.title,
        localUri,
        contentType: item.type,
        imageUrl: item.imageUrl ?? undefined,
        savedAt: new Date().toISOString(),
      });

      setDownloads((prev) => ({
        ...prev,
        [item.id]: { status: 'done', progress: 100, localUri },
      }));
    } catch {
      setDownloads((prev) => ({
        ...prev,
        [item.id]: { status: 'error', progress: 0, localUri: null },
      }));
    }
  }, [downloads]);

  const deleteDownload = useCallback(async (contentId: string): Promise<void> => {
    const localUri = downloads[contentId]?.localUri;
    if (localUri) {
      try { await FileSystem.deleteAsync(localUri, { idempotent: true }); } catch { /* ignore */ }
    }
    await removeGuestDownload(contentId);
    setDownloads((prev) => {
      const next = { ...prev };
      delete next[contentId];
      return next;
    });
  }, [downloads]);

  return { downloadContent, deleteDownload, getDownloadStatus, getDownloadedUri, downloads };
}
