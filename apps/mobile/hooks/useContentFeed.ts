import { useCallback, useEffect, useState } from 'react';
import { emptyFeedBundle, fetchFeedBundle, type FeedBundle } from '../services/contentService';
import { getGuestHistory } from '../lib/guestStorage';
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
