import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { fetchMeRecentlyPlayed, type FeedCardItem } from '../services/contentService';
import { addFavorite, addHistory, getFavorites, getHistory, removeFavorite } from '../lib/localUserStorage';
import { getStoredMobileSession, subscribeToMobileAuthStateChange } from '../services/authService';
import { fetchMeLibrary, removeMeLibraryItem, saveMeLibraryItem, type MeLibraryItem } from '../services/userFlowService';

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

function toFeedItem(item: MeLibraryItem): FeedCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    type: item.type,
    imageUrl: item.imageUrl ?? '',
    mediaUrl: item.mediaUrl,
    duration: item.duration ?? '',
  };
}

export function LocalContentProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FeedCardItem[]>([]);
  const [history, setHistory] = useState<FeedCardItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const loadGeneration = useRef(0);

  const refreshLibrary = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setSyncError(null);
    try {
      const [session, localFavorites, localHistory] = await Promise.all([
        getStoredMobileSession(),
        getFavorites(),
        getHistory(),
      ]);
      let serverFavorites: FeedCardItem[] | null = null;
      let serverHistory: FeedCardItem[] | null = null;
      let serverSyncError: string | null = null;
      if (session.user) {
        try {
          const [accountLibrary, accountHistory] = await Promise.all([
            fetchMeLibrary(),
            fetchMeRecentlyPlayed(100),
          ]);
          const accountFavorites = accountLibrary.liked.map(toFeedItem);
          const guestOnlyFavorites = localFavorites.filter(
            (local) => !accountFavorites.some((server) => server.id === local.id),
          );
          // Signing in must not silently discard items saved as a guest. Migrate
          // them once, then treat the server as the cross-device source of truth.
          await Promise.all(guestOnlyFavorites.map((item) => saveMeLibraryItem({
            bucket: 'liked', contentId: item.id, contentType: item.type,
            title: item.title, subtitle: item.subtitle, description: item.description,
            imageUrl: item.imageUrl, mediaUrl: item.mediaUrl, duration: item.duration,
          })));
          serverFavorites = [...guestOnlyFavorites, ...accountFavorites];
          serverHistory = [
            ...accountHistory,
            ...localHistory.filter((local) => !accountHistory.some((server) => server.id === local.id)),
          ].slice(0, 100);
        } catch (error) {
          serverSyncError = error instanceof Error ? error.message : 'Account library synchronization failed.';
        }
      }
      if (generation !== loadGeneration.current) return;
      const resolvedFavorites = serverFavorites ?? localFavorites;
      setFavorites(resolvedFavorites);
      setHistory(serverHistory ?? localHistory);
      setSyncError(serverSyncError);
      if (serverFavorites) {
        await Promise.all(serverFavorites.map(addFavorite));
      }
      if (serverHistory) {
        // Cache the authoritative account history for offline playback. Reverse
        // because addHistory prepends each item.
        await Promise.all([...serverHistory].reverse().map(addHistory));
      }
    } catch (error) {
      if (generation !== loadGeneration.current) return;
      setSyncError(error instanceof Error ? error.message : 'The device library could not be loaded.');
    } finally {
      if (generation === loadGeneration.current) setLoaded(true);
    }
  }, []);

  useEffect(() => {
    setLoaded(false);
    void refreshLibrary();
    const unsubscribe = subscribeToMobileAuthStateChange(() => {
      setLoaded(false);
      void refreshLibrary();
    });
    return () => {
      loadGeneration.current += 1;
      unsubscribe();
    };
  }, [refreshLibrary]);

  const addToFavorites = useCallback(async (item: FeedCardItem) => {
    const { user } = await getStoredMobileSession();
    if (user) {
      await saveMeLibraryItem({
        bucket: 'liked', contentId: item.id, contentType: item.type,
        title: item.title, subtitle: item.subtitle, description: item.description,
        imageUrl: item.imageUrl, mediaUrl: item.mediaUrl, duration: item.duration,
      });
    }
    await addFavorite(item);
    setFavorites((current) => current.some((entry) => entry.id === item.id)
      ? current
      : [item, ...current].slice(0, 200));
  }, []);

  const removeFromFavorites = useCallback(async (contentId: string) => {
    const { user } = await getStoredMobileSession();
    if (user) await removeMeLibraryItem({ bucket: 'liked', contentId });
    await removeFavorite(contentId);
    setFavorites((current) => current.filter((entry) => entry.id !== contentId));
  }, []);

  const toggleFavorite = useCallback(async (item: FeedCardItem) => {
    if (favorites.some((entry) => entry.id === item.id)) await removeFromFavorites(item.id);
    else await addToFavorites(item);
  }, [addToFavorites, favorites, removeFromFavorites]);

  const recordHistory = useCallback(async (item: FeedCardItem) => {
    await addHistory(item);
    setHistory((current) => [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 100));
  }, []);

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
