import React, { useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AudioPlayer } from '../../components/media/AudioPlayer';
import { AppButton } from '../../components/ui/AppButton';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { buildPlayerRoute, isDirectPlayableAudioUrl, routeParamToString, shouldOpenVideoScreen } from '../../util/playerRoute';
import { ContentList, ContentRail, EmptyState, PremiumHero, PremiumPage, dedupeFeedItems } from '../../components/Exp/PremiumContent';

function parseRouteItem(params: { itemId?: string | string[]; itemType?: string | string[]; title?: string | string[]; subtitle?: string | string[]; imageUrl?: string | string[]; duration?: string | string[]; mediaUrl?: string | string[] }): FeedCardItem | null {
  const itemId = routeParamToString(params.itemId);
  if (!itemId) return null;
  return {
    id: itemId,
    type: 'audio',
    title: routeParamToString(params.title) ?? 'Untitled',
    subtitle: routeParamToString(params.subtitle) ?? 'ClaudyGod',
    description: '',
    duration: routeParamToString(params.duration) ?? '--:--',
    imageUrl: routeParamToString(params.imageUrl) ?? DEFAULT_CONTENT_IMAGE_URI,
    mediaUrl: routeParamToString(params.mediaUrl),
  };
}

export default function PlaySection() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ itemId?: string | string[]; itemType?: string | string[]; title?: string | string[]; subtitle?: string | string[]; imageUrl?: string | string[]; duration?: string | string[]; mediaUrl?: string | string[] }>();
  const { feed, loading, refresh } = useContentFeed();
  const routeItem = useMemo(() => parseRouteItem(params), [params]);
  const queue = useMemo(() => dedupeFeedItems([...(routeItem ? [routeItem] : []), ...feed.music, ...feed.mostPlayed, ...feed.recommendations, ...feed.playlists, ...feed.recent]).filter((item) => !shouldOpenVideoScreen(item)), [feed, routeItem]);
  const [activeId, setActiveId] = useState(routeItem?.id ?? queue[0]?.id ?? '');
  const active = queue.find((item) => item.id === activeId) ?? routeItem ?? queue[0] ?? null;
  const activeIndex = active ? queue.findIndex((item) => item.id === active.id) : -1;
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < queue.length - 1;
  const hasInlineAudio = Boolean(active?.mediaUrl && isDirectPlayableAudioUrl(active.mediaUrl));

  const openItem = async (item: FeedCardItem, source: string) => {
    if (!item.mediaUrl) {
      showToast({ title: 'Playback unavailable', message: 'This item is not ready to play yet.', tone: 'warning' });
      return;
    }
    if (!isDirectPlayableAudioUrl(item.mediaUrl)) {
      if (shouldOpenVideoScreen(item)) router.push(buildPlayerRoute(item));
      else await Linking.openURL(item.mediaUrl);
      return;
    }
    setActiveId(item.id);
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
  };

  const goPrevious = () => {
    const previous = canGoPrevious ? queue[activeIndex - 1] : null;
    if (previous) void openItem(previous, 'music_previous');
  };
  const goNext = () => {
    const next = canGoNext ? queue[activeIndex + 1] : null;
    if (next) void openItem(next, 'music_next');
  };

  return (
    <PremiumPage title="Music" eyebrow="Listen" refreshing={loading} onRefresh={refresh} rightAction={<AppButton title="" variant="secondary" size="sm" onPress={() => router.push(APP_ROUTES.tabs.library)} leftIcon={<MaterialIcons name="library-music" size={16} color={theme.colors.text} />} style={{ minWidth: 40, paddingHorizontal: 10 }} />}>
      {active && hasInlineAudio && active.mediaUrl ? (
        <AudioPlayer track={{ id: active.id, title: active.title, artist: active.subtitle, uri: active.mediaUrl, duration: active.duration, imageUrl: active.imageUrl }} onPrevious={goPrevious} onNext={goNext} canGoPrevious={canGoPrevious} canGoNext={canGoNext} />
      ) : (
        <PremiumHero item={active} title={active?.title ?? 'Choose something to play'} subtitle={active?.description || 'Select a song, message, or playlist to begin listening.'} primaryLabel={active?.mediaUrl ? 'Open' : 'Browse music'} primaryIcon={active?.mediaUrl ? 'open-in-new' : 'graphic-eq'} onPrimary={() => (active ? void openItem(active, 'music_hero') : undefined)} />
      )}
      <ContentRail title="Up next" items={queue} compact loading={loading} onPressItem={(item) => void openItem(item, 'music_queue')} />
      <ContentRail title="Latest music" items={feed.music} loading={loading} onPressItem={(item) => void openItem(item, 'music_latest')} />
      <ContentRail title="Most played" items={feed.mostPlayed} compact loading={loading} onPressItem={(item) => void openItem(item, 'music_most_played')} />
      <ContentList title="Suggested listening" items={feed.recommendations.length ? feed.recommendations : feed.recent} onPressItem={(item) => void openItem(item, 'music_suggested')} />
      {!loading && !queue.length ? <EmptyState title="No music in this section right now" message="Try Videos, Live, or Search for another moment." actionLabel="Search" onAction={() => router.push(APP_ROUTES.tabs.search)} icon="graphic-eq" /> : null}
    </PremiumPage>
  );
}
