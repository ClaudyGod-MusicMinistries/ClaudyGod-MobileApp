import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { FeedCardItem } from '../services/contentService';

type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error';

interface DownloadState {
  status: DownloadStatus;
  progress: number;
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

const WEB_DOWNLOAD_MESSAGE = 'Offline downloads are available in the iOS and Android apps.';
const DownloadsContext = createContext<DownloadsContextValue | null>(null);

/**
 * The native provider persists media in Expo's sandboxed document directory.
 * Browsers do not expose that filesystem contract, so importing expo-file-system
 * on web crashes during route discovery. Keep the same application contract while
 * representing the capability honestly instead of emulating unreliable blob URLs.
 */
export function DownloadsProvider({ children }: { children: ReactNode }) {
  const refreshDownloads = useCallback(async () => undefined, []);
  const downloadContent = useCallback(async (_item: FeedCardItem) => false, []);
  const deleteDownload = useCallback(async (_contentId: string) => undefined, []);
  const getDownloadStatus = useCallback((_contentId: string): DownloadStatus => 'idle', []);
  const getDownloadedUri = useCallback((_contentId: string): string | null => null, []);

  const value = useMemo<DownloadsContextValue>(() => ({
    downloads: {},
    syncError: WEB_DOWNLOAD_MESSAGE,
    refreshDownloads,
    downloadContent,
    deleteDownload,
    getDownloadStatus,
    getDownloadedUri,
  }), [deleteDownload, downloadContent, getDownloadedUri, getDownloadStatus, refreshDownloads]);

  return <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>;
}

export function useDownloads(): DownloadsContextValue {
  const context = useContext(DownloadsContext);
  if (!context) throw new Error('useDownloads must be used within a DownloadsProvider');
  return context;
}
