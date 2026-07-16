import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import type { FeedCardItem } from '../services/contentService';
import { getDownloads, saveDownload, removeDownload } from '../lib/localUserStorage';

type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error';

interface DownloadState {
  status: DownloadStatus;
  progress: number; // 0-100
  localUri: string | null;
  title?: string;
  imageUrl?: string;
  contentType?: string;
}

interface DownloadsContextValue {
  downloads: Record<string, DownloadState>;
  downloadContent: (_item: FeedCardItem) => Promise<void>;
  deleteDownload: (_contentId: string) => Promise<void>;
  getDownloadStatus: (_contentId: string) => DownloadStatus;
  getDownloadedUri: (_contentId: string) => string | null;
}

const DownloadsContext = createContext<DownloadsContextValue | null>(null);

const DOWNLOAD_DIR = `${FileSystem.documentDirectory ?? ''}claudygod-downloads/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

// Promoted from a plain hook to a context: keeping this as a bare hook meant every
// ContentCard instance had its own AsyncStorage read and its own copy of `downloads`
// state, so a download started from one card never showed up on another card for the
// same content, and Library's Downloads tab couldn't see it either. One shared
// provider fixes that.
export function DownloadsProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  useEffect(() => {
    let active = true;
    void getDownloads().then(async (saved) => {
      // The sandboxed document directory can change (reinstall, iOS app
      // update) or a file can otherwise go missing — without this check, a
      // stale record would still show as "downloaded" and only fail when the
      // user actually taps to play it. Verify each file still exists on disk
      // before trusting the saved metadata, and quietly clean up any that don't.
      const checked = await Promise.all(saved.map(async (d) => {
        const info = await FileSystem.getInfoAsync(d.localUri);
        return { d, exists: info.exists };
      }));
      if (!active) return;

      const initial: Record<string, DownloadState> = {};
      const stale: string[] = [];
      checked.forEach(({ d, exists }) => {
        if (!exists) { stale.push(d.contentId); return; }
        initial[d.contentId] = {
          status: 'done',
          progress: 100,
          localUri: d.localUri,
          title: d.title,
          imageUrl: d.imageUrl,
          contentType: d.contentType,
        };
      });
      setDownloads(initial);
      await Promise.all(stale.map((contentId) => removeDownload(contentId)));
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
      [item.id]: {
        status: 'downloading', progress: 0, localUri: null,
        title: item.title, imageUrl: item.imageUrl, contentType: item.type,
      },
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
            [item.id]: { ...prev[item.id], status: 'downloading', progress: pct, localUri: null },
          }));
        },
      );

      await dl.downloadAsync();

      await saveDownload({
        contentId: item.id,
        title: item.title,
        localUri,
        contentType: item.type,
        imageUrl: item.imageUrl ?? undefined,
        savedAt: new Date().toISOString(),
      });

      setDownloads((prev) => ({
        ...prev,
        [item.id]: {
          status: 'done', progress: 100, localUri,
          title: item.title, imageUrl: item.imageUrl, contentType: item.type,
        },
      }));
    } catch {
      setDownloads((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], status: 'error', progress: 0, localUri: null },
      }));
    }
  }, [downloads]);

  const deleteDownload = useCallback(async (contentId: string): Promise<void> => {
    const localUri = downloads[contentId]?.localUri;
    if (localUri) {
      try { await FileSystem.deleteAsync(localUri, { idempotent: true }); } catch { /* ignore */ }
    }
    await removeDownload(contentId);
    setDownloads((prev) => {
      const next = { ...prev };
      delete next[contentId];
      return next;
    });
  }, [downloads]);

  return (
    <DownloadsContext.Provider value={{ downloads, downloadContent, deleteDownload, getDownloadStatus, getDownloadedUri }}>
      {children}
    </DownloadsContext.Provider>
  );
}

export function useDownloads(): DownloadsContextValue {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error('useDownloads must be used within a DownloadsProvider');
  return ctx;
}
