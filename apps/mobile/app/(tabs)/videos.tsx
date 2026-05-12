import React, { useMemo, useState } from 'react';
import { Linking, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { AppButton } from '../../components/ui/AppButton';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { isDirectPlayableVideoUrl, isHostedVideoUrl, routeParamToString, shouldOpenVideoScreen } from '../../util/playerRoute';
import { ContentList, ContentRail, EmptyState, PremiumHero, PremiumPage, dedupeFeedItems } from '../../components/Exp/PremiumContent';

function parseRouteItem(params: { itemId?: string | string[]; title?: string | string[]; subtitle?: string | string[]; imageUrl?: string | string[]; duration?: string | string[]; mediaUrl?: string | string[] }): FeedCardItem | null {
  const itemId = routeParamToString(params.itemId);
  if (!itemId) return null;
  return { id: itemId, type: 'video', title: routeParamToString(params.title) ?? 'Untitled', subtitle: routeParamToString(params.subtitle) ?? 'ClaudyGod', description: '', duration: routeParamToString(params.duration) ?? '--:--', imageUrl: routeParamToString(params.imageUrl) ?? DEFAULT_CONTENT_IMAGE_URI, mediaUrl: routeParamToString(params.mediaUrl) };
}

export default function VideosScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ itemId?: string | string[]; title?: string | string[]; subtitle?: string | string[]; imageUrl?: string | string[]; duration?: string | string[]; mediaUrl?: string | string[] }>();
  const { feed, loading, refresh } = useContentFeed();
  const routeItem = useMemo(() => parseRouteItem(params), [params]);
  const queue = useMemo(() => dedupeFeedItems([...(routeItem ? [routeItem] : []), ...feed.videos, ...feed.live, ...feed.recent]).filter((item) => shouldOpenVideoScreen(item)), [feed, routeItem]);
  const [activeId, setActiveId] = useState(routeItem?.id ?? queue[0]?.id ?? '');
  const active = queue.find((item) => item.id === activeId) ?? routeItem ?? queue[0] ?? null;
  const canInlinePlay = Boolean(active?.mediaUrl && (isDirectPlayableVideoUrl(active.mediaUrl) || isHostedVideoUrl(active.mediaUrl)));
  const playerHeight = width >= 768 ? 430 : width < 380 ? 230 : 260;

  const openItem = async (item: FeedCardItem, source: string) => {
    if (!item.mediaUrl) {
      showToast({ title: 'Video unavailable', message: 'This video is not ready to play yet.', tone: 'warning' });
      return;
    }
    setActiveId(item.id);
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
  };

  return (
    <PremiumPage title="Videos" eyebrow="Watch" refreshing={loading} onRefresh={refresh} rightAction={<AppButton title="" variant="secondary" size="sm" onPress={() => router.push(APP_ROUTES.tabs.search)} leftIcon={<MaterialIcons name="search" size={16} color={theme.colors.text} />} style={{ minWidth: 40, paddingHorizontal: 10 }} />}>
      {active && canInlinePlay && active.mediaUrl ? <VideoPlayer title={active.title} sourceUri={active.mediaUrl} height={playerHeight} /> : <PremiumHero item={active} title={active?.title ?? 'Choose a video'} subtitle={active?.description || 'Select a video, live replay, or featured session to watch.'} primaryLabel={active?.mediaUrl ? 'Open video' : 'Browse videos'} primaryIcon={active?.mediaUrl ? 'open-in-new' : 'smart-display'} onPrimary={() => (active?.mediaUrl ? void Linking.openURL(active.mediaUrl) : undefined)} />}
      <ContentRail title="Up next" items={queue} compact loading={loading} onPressItem={(item) => void openItem(item, 'videos_queue')} />
      <ContentRail title="Latest videos" items={feed.videos} loading={loading} onPressItem={(item) => void openItem(item, 'videos_latest')} />
      <ContentRail title="Live & replays" items={feed.live} compact loading={loading} onPressItem={(item) => void openItem(item, 'videos_live')} />
      <ContentList title="More to watch" items={dedupeFeedItems([...feed.recent, ...feed.videos])} onPressItem={(item) => void openItem(item, 'videos_more')} />
      {!loading && !queue.length ? <EmptyState title="No videos in this section right now" message="Try Music, Live, or Search for more to watch." actionLabel="Search" onAction={() => router.push(APP_ROUTES.tabs.search)} icon="smart-display" /> : null}
    </PremiumPage>
  );
}
