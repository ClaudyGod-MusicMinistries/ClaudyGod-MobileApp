import { QueryClient } from '@tanstack/react-query';

// Single shared cache for all data-fetching in the app — this is what lets 6 different
// screens call useContentFeed()/useQuery() independently while sharing one in-flight
// request and one cache entry per query key, instead of each screen re-fetching from
// scratch on every mount (the behavior before this was introduced).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
