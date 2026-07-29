import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { emptyFeedBundle, fetchFeedBundle, type FeedBundle } from '../services/contentService';
import { useLocalContent } from './useLocalContent';

async function loadFeed(): Promise<FeedBundle> {
  return fetchFeedBundle();
}

export function useContentFeed() {
  const { history } = useLocalContent();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: loadFeed,
  });

  const feed = useMemo(() => {
    const base = data ?? emptyFeedBundle();
    if (history.length === 0) return base;

    const localIds = new Set(history.map((item) => item.id));
    return {
      ...base,
      recent: [...history, ...base.recent.filter((item) => !localIds.has(item.id))].slice(0, 100),
    };
  }, [data, history]);

  return {
    feed,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? 'Unable to load feed' : null,
    refresh: refetch,
  };
}
