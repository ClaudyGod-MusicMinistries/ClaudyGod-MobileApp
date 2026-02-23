import { useCallback, useEffect, useState } from 'react';
import { emptyFeedBundle, fetchFeedBundle, type FeedBundle } from '../services/contentService';

export function useContentFeed() {
  const [feed, setFeed] = useState<FeedBundle>(emptyFeedBundle());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextFeed = await fetchFeedBundle();
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

  return {
    feed,
    loading,
    error,
    refresh,
  };
}
