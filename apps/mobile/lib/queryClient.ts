import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, onlineManager, focusManager } from '@tanstack/react-query';
import { ApiError } from '../services/apiClient';

// React Native has no `navigator.onLine`/`visibilitychange`, which is what React
// Query's browser defaults rely on — without this wiring, queries on native never
// know the device went offline (so they keep retrying and failing instead of
// pausing) and never know the app came back to the foreground (so stale screens
// don't refresh). This is TanStack Query's own documented React Native setup.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected === true && state.isInternetReachable !== false);
  });
});

AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});

const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) return true;
  if (error.isNetworkError || error.isTimeout) return true;
  // 408 (timeout) and 429 (rate limit) are worth a retry; other 4xx (401/403/404/etc)
  // won't succeed on retry and should surface to the user immediately.
  return error.status >= 500 || error.status === 408 || error.status === 429;
};

// Single shared cache for all data-fetching in the app — this is what lets 6 different
// screens call useContentFeed()/useQuery() independently while sharing one in-flight
// request and one cache entry per query key, instead of each screen re-fetching from
// scratch on every mount (the behavior before this was introduced).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => failureCount < 2 && isRetryableError(error),
      networkMode: 'online',
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'online',
      retry: (failureCount, error) => failureCount < 1 && isRetryableError(error),
    },
  },
});
