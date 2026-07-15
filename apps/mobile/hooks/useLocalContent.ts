import { useCallback, useEffect, useState } from 'react';
import type { FeedCardItem } from '../services/contentService';
import { fetchMeRecentlyPlayed } from '../services/contentService';
import { fetchMeLibrary, saveMeLibraryItem, removeMeLibraryItem, type MeLibraryItem } from '../services/userFlowService';
import {
  addFavorite,
  addHistory,
  getFavorites,
  getHistory,
  removeFavorite,
} from '../lib/localUserStorage';
import { useUserAccount } from '../context/UserAccountContext';

interface LocalContentState {
  favorites: FeedCardItem[];
  history: FeedCardItem[];
  loaded: boolean;
}

const HISTORY_FETCH_LIMIT = 50;

function toFeedCardItem(item: MeLibraryItem): FeedCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    duration: item.duration ?? '--:--',
    imageUrl: item.imageUrl ?? '',
    mediaUrl: item.mediaUrl,
    type: item.type,
    createdAt: item.createdAt,
  };
}

// Signed-in users get real, account-backed favorites (`user_saved_items` via
// getMeLibrary/saveMeLibraryItem/removeMeLibraryItem) and real play history
// (`user_play_events` via fetchMeRecentlyPlayed) instead of local-device-only
// storage — the same return shape either way, so callers don't need to care
// which source is active.
export function useLocalContent() {
  const { isSignedIn } = useUserAccount();
  const [state, setState] = useState<LocalContentState>({
    favorites: [],
    history: [],
    loaded: false,
  });

  const loadFavoritesAndHistory = useCallback(async (): Promise<{
    favorites: FeedCardItem[];
    history: FeedCardItem[];
  }> => {
    if (isSignedIn) {
      const [library, history] = await Promise.all([
        fetchMeLibrary().catch(() => ({ liked: [], downloaded: [], playlists: [] })),
        fetchMeRecentlyPlayed(HISTORY_FETCH_LIMIT),
      ]);
      return { favorites: library.liked.map(toFeedCardItem), history };
    }

    const [favorites, history] = await Promise.all([getFavorites(), getHistory()]);
    return { favorites, history };
  }, [isSignedIn]);

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
      if (isSignedIn) {
        await saveMeLibraryItem({
          bucket: 'liked',
          contentId: item.id,
          contentType: item.type,
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          imageUrl: item.imageUrl || undefined,
          mediaUrl: item.mediaUrl,
          duration: item.duration,
        });
      } else {
        await addFavorite(item);
      }
      setState((prev) => {
        if (prev.favorites.some((f) => f.id === item.id)) return prev;
        return { ...prev, favorites: [item, ...prev.favorites].slice(0, 200) };
      });
    },
    [isSignedIn],
  );

  const removeFromFavorites = useCallback(
    async (contentId: string) => {
      if (isSignedIn) {
        await removeMeLibraryItem({ bucket: 'liked', contentId });
      } else {
        await removeFavorite(contentId);
      }
      setState((prev) => ({
        ...prev,
        favorites: prev.favorites.filter((f) => f.id !== contentId),
      }));
    },
    [isSignedIn],
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

  // Signed-in play history is already recorded server-side by the existing
  // trackPlayEvent/trackMePlayEvent call every screen makes on open — writing
  // it again here would just duplicate that. Only guests need a local write;
  // signed-in users get an optimistic local update so the UI feels instant
  // without waiting for the next server refetch.
  const recordHistory = useCallback(
    async (item: FeedCardItem) => {
      if (!isSignedIn) {
        await addHistory(item);
      }
      setState((prev) => ({
        ...prev,
        history: [item, ...prev.history.filter((h) => h.id !== item.id)].slice(0, 100),
      }));
    },
    [isSignedIn],
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
