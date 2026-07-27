import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useContentFeed } from './useContentFeed';
import { fetchFeedBundle, emptyFeedBundle, type FeedBundle, type FeedCardItem } from '../services/contentService';
import { LocalContentProvider } from '../context/LocalContentContext';
import { getFavorites, getHistory } from '../lib/localUserStorage';

jest.mock('../services/contentService', () => {
  const actual = jest.requireActual('../services/contentService');
  return { ...actual, fetchFeedBundle: jest.fn() };
});
jest.mock('../lib/localUserStorage', () => ({
  ...jest.requireActual('../lib/localUserStorage'),
  getFavorites: jest.fn(),
  getHistory: jest.fn(),
}));

const mockedFetchFeedBundle = fetchFeedBundle as jest.MockedFunction<typeof fetchFeedBundle>;
const mockedGetHistory = getHistory as jest.MockedFunction<typeof getHistory>;
const mockedGetFavorites = getFavorites as jest.MockedFunction<typeof getFavorites>;

function makeHistoryItem(id: string): FeedCardItem {
  return {
    id, title: 'History item', subtitle: '', description: '',
    duration: '1:00', imageUrl: '', type: 'audio',
  };
}

function renderWithClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(LocalContentProvider, null, children),
  );
  return renderHook(() => useContentFeed(), { wrapper });
}

describe('useContentFeed', () => {
  beforeEach(() => {
    mockedFetchFeedBundle.mockReset();
    mockedGetHistory.mockReset();
    mockedGetFavorites.mockReset();
    mockedGetFavorites.mockResolvedValue([]);
    mockedGetHistory.mockResolvedValue([]);
  });

  it('starts in a loading state with an empty feed', async () => {
    mockedFetchFeedBundle.mockReturnValue(new Promise<FeedBundle>(() => {}));
    const { result } = await renderWithClient();
    expect(result.current.loading).toBe(true);
    expect(result.current.feed).toEqual(emptyFeedBundle());
    expect(result.current.error).toBeNull();
  });

  it('resolves with the fetched feed bundle', async () => {
    const bundle: FeedBundle = { ...emptyFeedBundle(), music: [makeHistoryItem('m1')] };
    mockedFetchFeedBundle.mockResolvedValue(bundle);
    mockedGetHistory.mockResolvedValue([]);

    const { result } = await renderWithClient();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.feed.music).toEqual([makeHistoryItem('m1')]);
    expect(result.current.error).toBeNull();
  });

  it('reactively composes device-local history into recent playback', async () => {
    mockedFetchFeedBundle.mockResolvedValue({ ...emptyFeedBundle(), recent: [] });
    mockedGetHistory.mockResolvedValue([makeHistoryItem('h1')]);

    const { result } = await renderWithClient();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.feed.recent).toEqual([makeHistoryItem('h1')]);
  });

  it('puts local history first and de-duplicates server history', async () => {
    const sharedItem = makeHistoryItem('shared');
    mockedFetchFeedBundle.mockResolvedValue({
      ...emptyFeedBundle(),
      recent: [makeHistoryItem('server-1'), sharedItem],
    });
    mockedGetHistory.mockResolvedValue([sharedItem, makeHistoryItem('local-1')]);

    const { result } = await renderWithClient();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.feed.recent.map((item) => item.id)).toEqual(['shared', 'local-1', 'server-1']);
    expect(mockedGetHistory).toHaveBeenCalledTimes(1);
  });

  it('surfaces a fetch failure as a readable error message and keeps refresh callable', async () => {
    mockedFetchFeedBundle.mockRejectedValue(new Error('Network unreachable'));

    const { result } = await renderWithClient();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network unreachable');
    expect(result.current.feed).toEqual(emptyFeedBundle());
    expect(typeof result.current.refresh).toBe('function');
  });
});
