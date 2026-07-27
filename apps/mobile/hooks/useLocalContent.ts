import { useCallback, useEffect, useState } from 'react';
import type { FeedCardItem } from '../services/contentService';
import {
  addFavorite,
  addHistory,
  getFavorites,
  getHistory,
  removeFavorite,
} from '../lib/localUserStorage';

interface LocalContentState {
  favorites: FeedCardItem[];
  history: FeedCardItem[];
  loaded: boolean;
}

export function useLocalContent() {
  const [state, setState] = useState<LocalContentState>({
    favorites: [],
    history: [],
    loaded: false,
  });

  const loadFavoritesAndHistory = useCallback(async (): Promise<{
    favorites: FeedCardItem[];
    history: FeedCardItem[];
  }> => {
    const [favorites, history] = await Promise.all([getFavorites(), getHistory()]);
    return { favorites, history };
  }, []);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loaded: false }));
    void loadFavoritesAndHistory().then(({ favorites, history }) => {
      if (active) setState({ favorites, history, loaded: true });
    });
    return () => {
      active = false;
    };
  }, [loadFavoritesAndHistory]);

  const addToFavorites = useCallback(
    async (item: FeedCardItem) => {
      await addFavorite(item);
      setState((prev) => {
        if (prev.favorites.some((f) => f.id === item.id)) return prev;
        return { ...prev, favorites: [item, ...prev.favorites].slice(0, 200) };
      });
    },
    [],
  );

  const removeFromFavorites = useCallback(
    async (contentId: string) => {
      await removeFavorite(contentId);
      setState((prev) => ({
        ...prev,
        favorites: prev.favorites.filter((f) => f.id !== contentId),
      }));
    },
    [],
  );

  const toggleFavorite = useCallback(
    async (item: FeedCardItem) => {
      const alreadySaved = state.favorites.some((f) => f.id === item.id);
      if (alreadySaved) {
        await removeFromFavorites(item.id);
      } else {
        await addToFavorites(item);
      }
    },
    [state.favorites, addToFavorites, removeFromFavorites],
  );

  // Playback history is device-local in the account-free mobile experience.
  const recordHistory = useCallback(
    async (item: FeedCardItem) => {
      await addHistory(item);
      setState((prev) => ({
        ...prev,
        history: [item, ...prev.history.filter((h) => h.id !== item.id)].slice(0, 100),
      }));
    },
    [],
  );

  const checkIsFavorited = useCallback(
    (contentId: string) => state.favorites.some((f) => f.id === contentId),
    [state.favorites],
  );

  return {
    favorites: state.favorites,
    history: state.history,
    loaded: state.loaded,
    checkIsFavorited,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    recordHistory,
  };
}
