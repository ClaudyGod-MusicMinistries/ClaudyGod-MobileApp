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

  // Guests never get server-side recommendations (gated behind sign-in on the
  // backend) — offer a modest local-history-based "similar to what you've
  // played" rail instead of nothing, mirroring the backfill above rather than
  // building real similarity scoring.
  if (nextFeed.recommendations.length === 0 && nextFeed.recent.length > 0) {
    const recentTypes = new Set(nextFeed.recent.slice(0, 3).map((item) => item.type));
    const historyIds = new Set(nextFeed.recent.map((item) => item.id));
    const candidates = [...nextFeed.music, ...nextFeed.videos]
      .filter((item) => recentTypes.has(item.type) && !historyIds.has(item.id));
    if (candidates.length > 0) {
      nextFeed.recommendations = candidates.slice(0, 12);
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
