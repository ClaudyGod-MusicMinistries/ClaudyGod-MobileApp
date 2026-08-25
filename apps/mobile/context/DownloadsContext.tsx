import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
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
  subtitle?: string;
  description?: string;
  duration?: string;
  savedAt?: string;
}

interface DownloadsContextValue {
  downloads: Record<string, DownloadState>;
  syncError: string | null;
  refreshDownloads: () => Promise<void>;
  downloadContent: (_item: FeedCardItem) => Promise<boolean>;
  deleteDownload: (_contentId: string) => Promise<void>;
  getDownloadStatus: (_contentId: string) => DownloadStatus;
  getDownloadedUri: (_contentId: string) => string | null;
}

const DownloadsContext = createContext<DownloadsContextValue | null>(null);

const DOWNLOAD_DIR = new Directory(Paths.document, 'claudygod-downloads');

async function ensureDir() {
  if (!DOWNLOAD_DIR.exists) {
    DOWNLOAD_DIR.create({ intermediates: true, idempotent: true });
  }
}

// Promoted from a plain hook to a context: keeping this as a bare hook meant every
// ContentCard instance had its own AsyncStorage read and its own copy of `downloads`
// state, so a download started from one card never showed up on another card for the
// same content, and Library's Downloads tab couldn't see it either. One shared
// provider fixes that.
export function DownloadsProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});
  const [syncError, setSyncError] = useState<string | null>(null);
  const inFlight = useRef(new Set<string>());
  const loadGeneration = useRef(0);

  const refreshDownloads = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setSyncError(null);
    try {
      const saved = await getDownloads();
      // The sandboxed document directory can change (reinstall, iOS app
      // update) or a file can otherwise go missing — without this check, a
      // stale record would still show as "downloaded" and only fail when the
      // user actually taps to play it. Verify each file still exists on disk
      // before trusting the saved metadata, and quietly clean up any that don't.
      const checked = await Promise.all(saved.map(async (d) => {
        const file = new File(d.localUri);
        return { d, exists: file.exists };
      }));
      if (generation !== loadGeneration.current) return;

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
          subtitle: d.subtitle,
          description: d.description,
          duration: d.duration,
          savedAt: d.savedAt,
        };
      });
      setDownloads(initial);
      await Promise.all(stale.map((contentId) => removeDownload(contentId)));
    } catch (error) {
      if (generation === loadGeneration.current) {
        setSyncError(error instanceof Error ? error.message : 'Download synchronization failed.');
      }
    }
  }, []);

  useEffect(() => {
    void refreshDownloads();
    return () => { loadGeneration.current += 1; };
  }, [refreshDownloads]);

  const getDownloadStatus = useCallback(
    (contentId: string): DownloadStatus => downloads[contentId]?.status ?? 'idle',
    [downloads],
  );

  const getDownloadedUri = useCallback(
    (contentId: string): string | null => downloads[contentId]?.localUri ?? null,
    [downloads],
  );

  const downloadContent = useCallback(async (item: FeedCardItem): Promise<boolean> => {
    if (!item.mediaUrl) return false;
    if (inFlight.current.has(item.id) || downloads[item.id]?.status === 'downloading') return false;
    if (downloads[item.id]?.status === 'done') return true;
    inFlight.current.add(item.id);

    setDownloads((prev) => ({
      ...prev,
      [item.id]: {
        status: 'downloading', progress: 0, localUri: null,
        title: item.title, imageUrl: item.imageUrl, contentType: item.type,
        subtitle: item.subtitle, description: item.description, duration: item.duration,
      },
    }));

    let partialFile: File | null = null;
    try {
      await ensureDir();
      const rawExt = item.mediaUrl.split('?')[0]?.split('.').pop()?.toLowerCase() ?? 'mp3';
      const ext = /^[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : 'mp3';
      const safeId = item.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const destination = new File(DOWNLOAD_DIR, `${safeId}.${ext}`);
      partialFile = destination;
      const response = await expoFetch(item.mediaUrl);
      if (!response.ok || !response.body) {
        throw new Error(`Download failed with HTTP ${response.status}.`);
      }

      const expectedBytes = Number(response.headers.get('content-length')) || 0;
      destination.create({ overwrite: true, intermediates: true });
      const handle = destination.open();
      const reader = response.body.getReader();
      let writtenBytes = 0;
      let lastReportedProgress = -1;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value?.byteLength) continue;

          handle.writeBytes(value);
          writtenBytes += value.byteLength;
          const pct = expectedBytes > 0
            ? Math.min(99, Math.round((writtenBytes / expectedBytes) * 100))
            : 0;
          if (pct === lastReportedProgress) continue;
          lastReportedProgress = pct;
          setDownloads((prev) => ({
            ...prev,
            [item.id]: { ...prev[item.id], status: 'downloading', progress: pct, localUri: null },
          }));
        }
      } finally {
        handle.close();
      }

      if (writtenBytes === 0 || (expectedBytes > 0 && writtenBytes !== expectedBytes)) {
        if (destination.exists) destination.delete();
        throw new Error('The downloaded file was incomplete.');
      }

      const savedAt = new Date().toISOString();
      await saveDownload({
        contentId: item.id,
        title: item.title,
        localUri: destination.uri,
        contentType: item.type,
        imageUrl: item.imageUrl ?? undefined,
        subtitle: item.subtitle,
        description: item.description,
        duration: item.duration,
        savedAt,
      });

      setDownloads((prev) => ({
        ...prev,
        [item.id]: {
          status: 'done', progress: 100, localUri: destination.uri,
          title: item.title, imageUrl: item.imageUrl, contentType: item.type,
          subtitle: item.subtitle, description: item.description, duration: item.duration,
          savedAt,
        },
      }));
      partialFile = null;
      return true;
    } catch {
      if (partialFile?.exists) {
        try { partialFile.delete(); } catch { /* ignore cleanup errors */ }
      }
      setDownloads((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], status: 'error', progress: 0, localUri: null },
      }));
      return false;
    } finally {
      inFlight.current.delete(item.id);
    }
  }, [downloads]);

  const deleteDownload = useCallback(async (contentId: string): Promise<void> => {
    const localUri = downloads[contentId]?.localUri;
    if (localUri) {
      try {
        const file = new File(localUri);
        if (file.exists) file.delete();
      } catch { /* ignore */ }
    }
    await removeDownload(contentId);
    setDownloads((prev) => {
      const next = { ...prev };
      delete next[contentId];
      return next;
    });
  }, [downloads]);

  return (
    <DownloadsContext.Provider value={{ downloads, syncError, refreshDownloads, downloadContent, deleteDownload, getDownloadStatus, getDownloadedUri }}>
      {children}
    </DownloadsContext.Provider>
  );
}

export function useDownloads(): DownloadsContextValue {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error('useDownloads must be used within a DownloadsProvider');
  return ctx;
}
