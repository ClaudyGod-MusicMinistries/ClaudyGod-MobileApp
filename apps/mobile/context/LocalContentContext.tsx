import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { FeedCardItem } from '../services/contentService';
import { addFavorite, addHistory, getFavorites, getHistory, removeFavorite } from '../lib/localUserStorage';

interface LocalContentValue {
  favorites: FeedCardItem[];
  history: FeedCardItem[];
  loaded: boolean;
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

  useEffect(() => {
    let active = true;
    void Promise.all([getFavorites(), getHistory()]).then(([saved, recent]) => {
      if (!active) return;
      setFavorites(saved);
      setHistory(recent);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

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
