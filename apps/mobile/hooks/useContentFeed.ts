import { useCallback, useEffect, useState } from 'react';
import { emptyFeedBundle, fetchFeedBundle, type FeedBundle } from '../services/contentService';
import { getGuestHistory } from '../lib/guestStorage';
import { loadDevFeedItems } from '../lib/devSeed';
import { useAuth } from '../context/AuthContext';

export function useContentFeed() {
  const { isAuthenticated } = useAuth();
  const [feed, setFeed] = useState<FeedBundle>(emptyFeedBundle());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextFeed = await fetchFeedBundle();

      // For guests, inject local playback history into feed.recent so "Continue
      // listening" works without a server-side history record.
      if (!isAuthenticated && nextFeed.recent.length === 0) {
        const guestHistory = await getGuestHistory();
        if (guestHistory.length > 0) {
          nextFeed.recent = guestHistory;
        }
      }

      // DEV-ONLY: inject local test tracks when S3 is not yet configured.
      // Tracks have a [DEV] prefix to make them visually distinct from real content.
      // __DEV__ is always false in production release builds — this block is dead code there.
      if (__DEV__ && nextFeed.music.length === 0) {
        console.log('[DEV] No music from API — injecting local dev seed tracks for player testing');
        const devItems = await loadDevFeedItems();
        if (devItems.length > 0) {
          nextFeed.music = devItems;
          if (nextFeed.recent.length === 0) nextFeed.recent = devItems;
          if (nextFeed.mostPlayed.length === 0) nextFeed.mostPlayed = devItems;
        }
      }

      setFeed(nextFeed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load feed');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { feed, loading, error, refresh };
}
