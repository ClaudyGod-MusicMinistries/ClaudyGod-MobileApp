import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { emptyFeedBundle, fetchFeedBundle, type FeedBundle } from '../services/contentService';
import { useLocalContent } from './useLocalContent';

async function loadFeed(): Promise<FeedBundle> {
  return fetchFeedBundle();
}

export function useContentFeed() {
  const { history } = useLocalContent();
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
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
    // Distinct from `loading` (first load, drives content skeletons) —
    // React Query's `isLoading` is false on every refetch after the first
    // success, so binding a RefreshControl's `refreshing` prop to it means
    // pull-to-refresh visibly does nothing: the control snaps back instantly
    // while the request is still in flight.
    refreshing: isRefetching,
    error: error instanceof Error ? error.message : error ? 'Unable to load feed' : null,
    refresh: refetch,
  };
}
