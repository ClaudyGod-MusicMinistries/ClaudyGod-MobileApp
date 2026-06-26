import { useCallback, useEffect, useState } from 'react';
import { emptyFeedBundle, fetchFeedBundle, type FeedBundle } from '../services/contentService';
import { getHistory } from '../lib/localUserStorage';

export function useContentFeed() {
  const [feed, setFeed] = useState<FeedBundle>(emptyFeedBundle());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextFeed = await fetchFeedBundle();

      // Inject local playback history into feed.recent so "Continue listening"
      // always works, even when the server returns an empty history.
      if (nextFeed.recent.length === 0) {
        const localHistory = await getHistory();
        if (localHistory.length > 0) {
          nextFeed.recent = localHistory;
        }
      }

      setFeed(nextFeed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { feed, loading, error, refresh };
}
