import { useCallback, useEffect, useState } from 'react';
import type { FeedCardItem } from '../services/contentService';
import {
  addGuestFavorite,
  addGuestHistory,
  getGuestFavorites,
  getGuestHistory,
  isGuestFavorited,
  removeGuestFavorite,
} from '../lib/guestStorage';

interface GuestSessionState {
  favorites: FeedCardItem[];
  history: FeedCardItem[];
  loaded: boolean;
}

export function useGuestSession() {
  const [state, setState] = useState<GuestSessionState>({
    favorites: [],
    history: [],
    loaded: false,
  });

  useEffect(() => {
    let active = true;
    void Promise.all([getGuestFavorites(), getGuestHistory()]).then(([favorites, history]) => {
      if (active) setState({ favorites, history, loaded: true });
    });
    return () => { active = false; };
  }, []);

  const addFavorite = useCallback(async (item: FeedCardItem) => {
    await addGuestFavorite(item);
    setState((prev) => {
      if (prev.favorites.some((f) => f.id === item.id)) return prev;
      return { ...prev, favorites: [item, ...prev.favorites].slice(0, 200) };
    });
  }, []);

  const removeFavorite = useCallback(async (contentId: string) => {
    await removeGuestFavorite(contentId);
    setState((prev) => ({
      ...prev,
      favorites: prev.favorites.filter((f) => f.id !== contentId),
    }));
  }, []);

  const toggleFavorite = useCallback(
    async (item: FeedCardItem) => {
      const alreadySaved = await isGuestFavorited(item.id);
      if (alreadySaved) {
        await removeFavorite(item.id);
      } else {
        await addFavorite(item);
      }
    },
    [addFavorite, removeFavorite],
  );

  const recordHistory = useCallback(async (item: FeedCardItem) => {
    await addGuestHistory(item);
    setState((prev) => ({
      ...prev,
      history: [item, ...prev.history.filter((h) => h.id !== item.id)].slice(0, 100),
    }));
  }, []);

  const isFavorited = useCallback(
    (contentId: string) => state.favorites.some((f) => f.id === contentId),
    [state.favorites],
  );

  return {
    guestFavorites: state.favorites,
    guestHistory: state.history,
    loaded: state.loaded,
    isFavorited,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    recordHistory,
  };
}
