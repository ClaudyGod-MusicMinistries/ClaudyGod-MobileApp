import { useQuery } from '@tanstack/react-query';
import { emptyFeedBundle, fetchFeedBundle, type FeedBundle } from '../services/contentService';
import { getHistory } from '../lib/localUserStorage';

async function loadFeed(): Promise<FeedBundle> {
  const nextFeed = await fetchFeedBundle();

  // Inject local playback history into feed.recent so "Continue listening"
  // always works, even when the server returns an empty history.
  if (nextFeed.recent.length === 0) {
    const localHistory = await getHistory();
    if (localHistory.length > 0) {
      nextFeed.recent = localHistory;
    }
  }

  return nextFeed;
}

export function useContentFeed() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: loadFeed,
  });

  return {
    feed: data ?? emptyFeedBundle(),
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? 'Unable to load feed' : null,
    refresh: refetch,
  };
}
