import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { FeedCardItem } from '../services/contentService';
import { addFavorite, addHistory, getFavorites, getHistory, removeFavorite } from '../lib/localUserStorage';

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

  const refreshLibrary = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setSyncError(null);
    try {
      const [localFavorites, localHistory] = await Promise.all([getFavorites(), getHistory()]);
      if (generation !== loadGeneration.current) return;
      setFavorites(localFavorites);
      setHistory(localHistory);
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
    return () => { loadGeneration.current += 1; };
  }, [refreshLibrary]);

  const addToFavorites = useCallback(async (item: FeedCardItem) => {
    await addFavorite(item);
    setFavorites((current) => current.some((entry) => entry.id === item.id)
      ? current
      : [item, ...current].slice(0, 200));
  }, []);

  const removeFromFavorites = useCallback(async (contentId: string) => {
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
