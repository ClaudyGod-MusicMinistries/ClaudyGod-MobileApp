import { useState, useCallback, useRef } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import * as Haptics from 'expo-haptics';

type DownloadState = 'idle' | 'downloading' | 'done' | 'error';

interface DownloadProgress {
  fraction: number;
}

interface UseContentDownloadReturn {
  state: DownloadState;
  progress: DownloadProgress | null;
  localUri: string | null;
  download: (remoteUrl: string, filename: string, persist?: boolean) => Promise<string | null>;
  cancel: () => void;
  remove: (filename: string) => Promise<void>;
  isDownloaded: (filename: string) => boolean;
}

function getDir(persist: boolean): Directory {
  const base = persist ? Paths.document : Paths.cache;
  const dir = new Directory(base, 'claudygod');
  if (!dir.exists) dir.create();
  return dir;
}

export function useContentDownload(): UseContentDownloadReturn {
  const [state, setState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isDownloaded = useCallback((filename: string): boolean => {
    const dir = getDir(true);
    const file = new File(dir, filename);
    return file.exists;
  }, []);

  const download = useCallback(async (
    remoteUrl: string,
    filename: string,
    persist = false,
  ): Promise<string | null> => {
    try {
      setState('downloading');
      setProgress(null);

      const dir = getDir(persist);
      const file = new File(dir, filename);

      if (file.exists) {
        setState('done');
        setLocalUri(file.uri);
        return file.uri;
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const response = await fetch(remoteUrl, { signal: ctrl.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentLength = Number(response.headers.get('content-length') ?? 0);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No body reader');

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (contentLength > 0) {
          setProgress({ fraction: received / contentLength });
        }
      }

      const buffer = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }

      await file.write(buffer as unknown as string);

      setState('done');
      setLocalUri(file.uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return file.uri;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState('idle');
      } else {
        setState('error');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return null;
    } finally {
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState('idle');
    setProgress(null);
  }, []);

  const remove = useCallback(async (filename: string): Promise<void> => {
    for (const persist of [true, false]) {
      const dir = getDir(persist);
      const file = new File(dir, filename);
      if (file.exists) file.delete();
    }
    setState('idle');
    setLocalUri(null);
  }, []);

  return { state, progress, localUri, download, cancel, remove, isDownloaded };
}
