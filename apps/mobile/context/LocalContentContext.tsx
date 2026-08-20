import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { fetchMeRecentlyPlayed, type FeedCardItem } from '../services/contentService';
import { fetchMeLibrary, removeMeLibraryItem, saveMeLibraryItem, trackMePlayEvent } from '../services/userFlowService';
import { addFavorite, addHistory, clearFavorites, clearHistory, getFavorites, getHistory, removeFavorite } from '../lib/localUserStorage';
import { useUserAccount } from './UserAccountContext';
import { useAppContext } from './AppContext';

interface LocalContentValue {
  favorites: FeedCardItem[];
  history: FeedCardItem[];
  loaded: boolean;
  syncError: string | null;
  refreshLibrary: () => Promise<void>;
  checkIsFavorited: (_contentId: string) => boolean;
  addToFavorites: (_item: FeedCardItem) => Promise<void>;
  removeFromFavorites: (_contentId: string) => Promise<void>;
  toggleFavorite: (_item: FeedCardItem) => Promise<void>;
  recordHistory: (_item: FeedCardItem) => Promise<void>;
}

const LocalContentContext = createContext<LocalContentValue | null>(null);

export function LocalContentProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FeedCardItem[]>([]);
  const [history, setHistory] = useState<FeedCardItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const loadGeneration = useRef(0);
  const { account } = useUserAccount();
  const { deviceId } = useAppContext();

  const refreshLibrary = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setSyncError(null);
    try {
      const [localFavorites, localHistory] = await Promise.all([getFavorites(), getHistory()]);
      if (!account) {
        if (generation !== loadGeneration.current) return;
        setFavorites(localFavorites);
        setHistory(localHistory);
        return;
      }

      // Guest favourites are transferred only after every idempotent server
      // upsert succeeds. Clearing them then prevents a later account removal
      // from being silently re-added during the next refresh.
      await Promise.all(localFavorites.map((item) => saveMeLibraryItem({
        bucket: 'liked',
        contentId: item.id,
        contentType: item.type,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        imageUrl: item.imageUrl || undefined,
        mediaUrl: item.mediaUrl,
        duration: item.duration,
      })));
      if (localFavorites.length > 0) await clearFavorites();

      await Promise.all(localHistory.map((item) => trackMePlayEvent({
        contentId: item.id,
        contentType: item.type,
        title: item.title,
        source: 'guest_migration',
        clientEventId: `guest:${deviceId}:${item.id}`.slice(0, 200),
      })));
      if (localHistory.length > 0) await clearHistory();

      const [serverLibrary, serverHistory] = await Promise.all([
        fetchMeLibrary(),
        fetchMeRecentlyPlayed(100),
      ]);
      if (generation !== loadGeneration.current) return;
      setFavorites(serverLibrary.liked as FeedCardItem[]);
      const serverIds = new Set(serverHistory.map((item) => item.id));
      setHistory([...serverHistory, ...localHistory.filter((item) => !serverIds.has(item.id))].slice(0, 100));
    } catch (error) {
      if (generation !== loadGeneration.current) return;
      setSyncError(error instanceof Error ? error.message : 'Library synchronization failed.');
    } finally {
      if (generation === loadGeneration.current) setLoaded(true);
    }
  }, [account, deviceId]);

  useEffect(() => {
    setLoaded(false);
    void refreshLibrary();
    return () => { loadGeneration.current += 1; };
  }, [refreshLibrary]);

  const addToFavorites = useCallback(async (item: FeedCardItem) => {
    if (account) {
      await saveMeLibraryItem({
        bucket: 'liked', contentId: item.id, contentType: item.type, title: item.title,
        subtitle: item.subtitle, description: item.description,
        imageUrl: item.imageUrl || undefined, mediaUrl: item.mediaUrl, duration: item.duration,
      });
    } else {
      await addFavorite(item);
    }
    setFavorites((current) => current.some((entry) => entry.id === item.id)
      ? current
      : [item, ...current].slice(0, 200));
  }, [account]);

  const removeFromFavorites = useCallback(async (contentId: string) => {
    if (account) await removeMeLibraryItem({ bucket: 'liked', contentId });
    else await removeFavorite(contentId);
    setFavorites((current) => current.filter((entry) => entry.id !== contentId));
  }, [account]);

  const toggleFavorite = useCallback(async (item: FeedCardItem) => {
    if (favorites.some((entry) => entry.id === item.id)) await removeFromFavorites(item.id);
    else await addToFavorites(item);
  }, [addToFavorites, favorites, removeFromFavorites]);

  const recordHistory = useCallback(async (item: FeedCardItem) => {
    if (!account) await addHistory(item);
    setHistory((current) => [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 100));
  }, [account]);

  const checkIsFavorited = useCallback(
    (contentId: string) => favorites.some((entry) => entry.id === contentId),
    [favorites],
  );

  return (
    <LocalContentContext.Provider value={{
      favorites,
      history,
      loaded,
      syncError,
      refreshLibrary,
      checkIsFavorited,
      addToFavorites,
      removeFromFavorites,
      toggleFavorite,
      recordHistory,
    }}>
      {children}
    </LocalContentContext.Provider>
  );
}

export function useLocalContentContext(): LocalContentValue {
  const context = useContext(LocalContentContext);
  if (!context) throw new Error('useLocalContent must be used within LocalContentProvider');
  return context;
}
