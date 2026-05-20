import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../../components/ui/AppButton';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchMeLibrary, type MeLibrary, type MeLibraryItem } from '../../services/userFlowService';
import { useAuth } from '../../context/AuthContext';
import { ContentList, ContentRail, EmptyState, PremiumHero, PremiumPage, dedupeFeedItems } from '../../components/Exp/PremiumContent';

function toFeedCardItem(item: MeLibraryItem): FeedCardItem {
  return { id: item.id, title: item.title, subtitle: item.subtitle, description: item.description, duration: item.duration || '--:--', imageUrl: item.imageUrl || '', mediaUrl: item.mediaUrl, type: item.type, createdAt: item.createdAt };
}

function buildPlaylistCards(playlists: MeLibrary['playlists']): FeedCardItem[] {
  return playlists.map((playlist, index) => {
    const seed = playlist.items[0];
    return { id: `playlist:${playlist.name}:${index}`, title: playlist.name, subtitle: `${playlist.items.length} saved item${playlist.items.length === 1 ? '' : 's'}`, description: seed?.description || 'A saved collection in your library.', duration: seed?.duration || '--:--', imageUrl: seed?.imageUrl || '', mediaUrl: seed?.mediaUrl, type: 'playlist', createdAt: seed?.createdAt };
  });
}

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { feed, loading, refresh } = useContentFeed();
  const [library, setLibrary] = useState<MeLibrary | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const loadLibrary = useCallback(async () => {
    if (!isAuthenticated) {
      setLibrary(null);
      return;
    }

    setLibraryLoading(true);
    try {
      setLibrary(await fetchMeLibrary());
    } catch {
      setLibrary(null);
    } finally {
      setLibraryLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const liked = useMemo(() => (library?.liked.length ? library.liked.map(toFeedCardItem) : []), [library?.liked]);
  const downloaded = useMemo(() => (library?.downloaded.length ? library.downloaded.map(toFeedCardItem) : []), [library?.downloaded]);
  const playlists = useMemo(() => (library?.playlists.length ? buildPlaylistCards(library.playlists) : []), [library?.playlists]);
  const fallbackPool = useMemo(() => dedupeFeedItems([...liked, ...downloaded, ...playlists, ...feed.recent, ...feed.music, ...feed.playlists]), [downloaded, feed.music, feed.playlists, feed.recent, liked, playlists]);
  const pickedItem = liked[0] ?? downloaded[0] ?? playlists[0] ?? fallbackPool[0] ?? null;

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  return (
    <PremiumPage title="Library" eyebrow="Saved" noBack refreshing={loading || libraryLoading} onRefresh={() => { refresh(); void loadLibrary(); }} rightAction={<AppButton title="" variant="secondary" size="sm" onPress={() => router.push(isAuthenticated ? APP_ROUTES.profile : APP_ROUTES.auth.signIn)} leftIcon={<MaterialIcons name={isAuthenticated ? 'person-outline' : 'login'} size={16} color={theme.colors.text} />} style={{ minWidth: 40, paddingHorizontal: 10 }} />}>
      <PremiumHero item={pickedItem} title={pickedItem?.title ?? (isAuthenticated ? 'Build your library' : 'Your library is waiting')} subtitle={pickedItem?.description || (isAuthenticated ? 'Save songs, videos, and live sessions so they are easy to find again.' : 'Sign in to save favorites and continue across devices.')} eyebrow={pickedItem?.subtitle ?? 'Library'} primaryLabel={pickedItem ? 'Open' : isAuthenticated ? 'Explore music' : 'Sign in'} primaryIcon={pickedItem ? 'play-arrow' : isAuthenticated ? 'graphic-eq' : 'login'} onPrimary={() => (pickedItem ? void openItem(pickedItem, 'library_hero') : router.push(isAuthenticated ? APP_ROUTES.tabs.player : APP_ROUTES.auth.signIn))} />
      <ContentRail title="Saved" items={liked} loading={libraryLoading} onPressItem={(item) => void openItem(item, 'library_saved')} emptyTitle="Save your first favorite" emptyMessage="Start from Music, Videos, or Search and keep the moments you want nearby." />
      <ContentRail title="Downloads" items={downloaded} compact loading={libraryLoading} onPressItem={(item) => void openItem(item, 'library_downloads')} emptyTitle="No downloads yet" emptyMessage="Downloaded items will stay here for quick access." />
      <ContentRail title="Playlists" items={playlists} compact loading={libraryLoading} onPressItem={(item) => void openItem(item, 'library_playlists')} emptyTitle="No playlists yet" emptyMessage="Build collections from the moments you return to often." />
      <ContentList title="Recommended for your library" items={fallbackPool} onPressItem={(item) => void openItem(item, 'library_recommended')} />
      {!isAuthenticated ? <EmptyState title="Sign in to keep your favorites" message="Create an account or sign in to save songs, videos, and live sessions." actionLabel="Sign in" onAction={() => router.push(APP_ROUTES.auth.signIn)} icon="library-music" /> : null}
      {isAuthenticated && !libraryLoading && !fallbackPool.length ? <EmptyState title="Your library is open" message="Explore music and videos, then save the moments you love." actionLabel="Explore music" onAction={() => router.push(APP_ROUTES.tabs.player)} icon="bookmark-border" /> : null}
    </PremiumPage>
  );
}
