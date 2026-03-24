import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { PosterCard } from '../../components/ui/PosterCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import type { FeedCardItem } from '../../services/contentService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchMeLibrary, removeMeLibraryItem, saveMeLibraryItem } from '../../services/userFlowService';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { deriveLayoutSectionItems, getVideoLayoutSections } from '../../util/mobileLayout';
import {
  buildPlayerRoute,
  isDirectPlayableVideoUrl,
  isHostedVideoUrl,
  routeParamToString,
  shouldOpenVideoScreen,
} from '../../util/playerRoute';

function dedupeItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseRouteItem(params: {
  itemId?: string | string[];
  itemType?: string | string[];
  title?: string | string[];
  subtitle?: string | string[];
  imageUrl?: string | string[];
  duration?: string | string[];
  mediaUrl?: string | string[];
}): FeedCardItem | null {
  const itemId = routeParamToString(params.itemId);
  if (!itemId) return null;

  const itemType = routeParamToString(params.itemType);
  const normalizedType: FeedCardItem['type'] =
    itemType === 'audio' ||
    itemType === 'playlist' ||
    itemType === 'announcement' ||
    itemType === 'live' ||
    itemType === 'ad'
      ? itemType
      : 'video';

  return {
    id: itemId,
    type: normalizedType,
    title: routeParamToString(params.title) ?? 'Untitled',
    subtitle: routeParamToString(params.subtitle) ?? 'ClaudyGod',
    description: '',
    duration: routeParamToString(params.duration) ?? '--:--',
    imageUrl: routeParamToString(params.imageUrl) ?? DEFAULT_CONTENT_IMAGE_URI,
    mediaUrl: routeParamToString(params.mediaUrl),
  };
}

export default function VideosScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    itemId?: string | string[];
    itemType?: string | string[];
    title?: string | string[];
    subtitle?: string | string[];
    imageUrl?: string | string[];
    duration?: string | string[];
    mediaUrl?: string | string[];
  }>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const posterSize = isTablet ? 'lg' : 'md';

  const { feed } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();
  const routeItem = useMemo(() => parseRouteItem(params), [params]);

  const queue = useMemo(() => {
    const allMedia = dedupeItems([
      ...(routeItem ? [routeItem] : []),
      ...feed.videos,
      ...feed.live,
      ...feed.recent,
      ...feed.playlists,
    ]);
    return allMedia.filter((item) => shouldOpenVideoScreen(item));
  }, [feed.live, feed.playlists, feed.recent, feed.videos, routeItem]);

  const [activeId, setActiveId] = useState(routeItem?.id ?? queue[0]?.id ?? '');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (routeItem?.id) {
      setActiveId(routeItem.id);
      return;
    }

    if (!activeId && queue[0]?.id) {
      setActiveId(queue[0].id);
    }
  }, [activeId, routeItem, queue]);

  useEffect(() => {
    let mounted = true;

    const loadLibrary = async () => {
      try {
        const library = await fetchMeLibrary();
        if (!mounted) return;

        const ids = new Set<string>();
        library.liked.forEach((item) => ids.add(item.id));
        library.downloaded.forEach((item) => ids.add(item.id));
        library.playlists.forEach((playlist) => {
          playlist.items.forEach((item) => ids.add(item.id));
        });
        setSavedIds(ids);
      } catch {}
    };

    void loadLibrary();

    return () => {
      mounted = false;
    };
  }, []);

  const active = queue.find((item) => item.id === activeId) ?? routeItem ?? queue[0] ?? null;
  const activeIndex = active ? queue.findIndex((item) => item.id === active.id) : -1;
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < queue.length - 1;
  const isSaved = active ? savedIds.has(active.id) : false;
  const canInlinePlay = Boolean(
    active?.mediaUrl &&
      (Platform.OS === 'web'
        ? isDirectPlayableVideoUrl(active.mediaUrl) || isHostedVideoUrl(active.mediaUrl)
        : isDirectPlayableVideoUrl(active.mediaUrl)),
  );
  const curatedSections = useMemo(
    () =>
      getVideoLayoutSections(mobileConfig)
        .map((section) => ({
          section,
          items: deriveLayoutSectionItems(feed, section).filter((item) => shouldOpenVideoScreen(item)),
        }))
        .filter((entry) => entry.items.length > 0)
        .slice(0, 2),
    [feed, mobileConfig],
  );

  const openVideo = async (item: FeedCardItem, source: string) => {
    setActiveId(item.id);
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
  };

  const goPrevious = () => {
    if (!canGoPrevious) return;
    const previous = queue[activeIndex - 1];
    if (previous) {
      void openVideo(previous, 'videos_previous');
    }
  };

  const goNext = () => {
    if (!canGoNext) return;
    const next = queue[activeIndex + 1];
    if (next) {
      void openVideo(next, 'videos_next');
    }
  };

  const openExternal = async () => {
    if (!active?.mediaUrl) return;
    await Linking.openURL(active.mediaUrl);
  };

  const toggleSave = async () => {
    if (!active) return;

    try {
      if (savedIds.has(active.id)) {
        await removeMeLibraryItem({ bucket: 'liked', contentId: active.id });
        setSavedIds((current) => {
          const next = new Set(current);
          next.delete(active.id);
          return next;
        });
        showToast({
          title: 'Removed from Library',
          message: `${active.title} was removed from your saved list.`,
          tone: 'info',
        });
        return;
      }

      await saveMeLibraryItem({
        bucket: 'liked',
        contentId: active.id,
        contentType: active.type,
        title: active.title,
        subtitle: active.subtitle,
        description: active.description,
        imageUrl: active.imageUrl,
        mediaUrl: active.mediaUrl,
        duration: active.duration,
      });
      setSavedIds((current) => new Set(current).add(active.id));
      showToast({
        title: 'Saved to Library',
        message: `${active.title} is now in your library.`,
        tone: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Save unavailable',
        message: error instanceof Error ? error.message : 'Sign in to save content.',
        tone: 'warning',
      });
    }
  };

  const shareActive = async () => {
    if (!active) return;

    try {
      await Share.share({
        message: `${active.title}\n${active.subtitle}${active.mediaUrl ? `\n${active.mediaUrl}` : ''}`,
      });
    } catch {
      showToast({
        title: 'Share unavailable',
        message: 'Try again in a moment.',
        tone: 'warning',
      });
    }
  };

  const followLive = async () => {
    if (!active) return;
    try {
      await subscribeToLiveAlerts(active.notificationChannelId || active.id);
      showToast({
        title: 'Live alerts enabled',
        message: `You will be notified when ${active.title} goes live.`,
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Live alerts unavailable',
        message: 'Sign in to follow live sessions.',
        tone: 'warning',
      });
    }
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge }}>
            <FadeIn>
              <BrandedHeaderCard
                title="Videos"
                subtitle="Featured watchlists, live streams, and saved replays."
                actions={[
                  { icon: 'search', onPress: () => router.push(APP_ROUTES.tabs.search), accessibilityLabel: 'Search' },
                  { icon: 'music-note', onPress: () => router.push(APP_ROUTES.tabs.player), accessibilityLabel: 'Open music' },
                ]}
              />
            </FadeIn>

            <FadeIn delay={70}>
              {active && canInlinePlay && active.mediaUrl ? (
                <SurfaceCard tone="strong" style={{ padding: theme.spacing.md }}>
                    <View style={{ gap: 14 }}>
                      <View style={{ aspectRatio: 16 / 9, borderRadius: theme.radius.lg, overflow: 'hidden' }}>
                        <VideoPlayer sourceUri={active.mediaUrl} title={active.title} />
                      </View>
                    <View style={{ gap: 6 }}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: theme.colors.text.secondary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.9,
                        }}
                      >
                        {active.isLive ? 'Live now' : 'Now showing'}
                      </CustomText>
                      <CustomText variant="hero" style={{ color: theme.colors.text.primary }}>
                        {active.title}
                      </CustomText>
                      <CustomText variant="body" style={{ color: theme.colors.text.secondary }}>
                        {active.subtitle}
                      </CustomText>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {canGoPrevious ? (
                        <AppButton
                          title="Previous"
                          onPress={goPrevious}
                          variant="secondary"
                          leftIcon={<MaterialIcons name="skip-previous" size={16} color={theme.colors.text.primary} />}
                        />
                      ) : null}
                      <AppButton
                        title={canGoNext ? 'Next' : isSaved ? 'Saved' : 'Save'}
                        onPress={() => (canGoNext ? goNext() : void toggleSave())}
                        leftIcon={<MaterialIcons name={canGoNext ? 'skip-next' : isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={theme.colors.text.inverse} />}
                      />
                      <AppButton
                        title="Share"
                        variant="outline"
                        onPress={() => void shareActive()}
                        leftIcon={<MaterialIcons name="ios-share" size={16} color={theme.colors.text.primary} />}
                      />
                      <AppButton
                        title={active.isLive ? 'Follow live' : 'Open in browser'}
                        variant="outline"
                        onPress={() => (active.isLive ? void followLive() : void openExternal())}
                        leftIcon={<MaterialIcons name={active.isLive ? 'notifications-active' : 'open-in-new'} size={16} color={theme.colors.text.primary} />}
                      />
                      <AppButton
                        title="Open detail"
                        variant="ghost"
                        onPress={() => router.push(buildPlayerRoute(active))}
                        leftIcon={<MaterialIcons name="open-in-full" size={16} color={theme.colors.text.inverse} />}
                      />
                    </View>
                  </View>
                </SurfaceCard>
              ) : (
                <CinematicHeroCard
                  imageUrl={active?.imageUrl}
                  badge={active?.isLive ? 'Live now' : active?.type === 'live' ? 'Live replay' : 'Featured watch'}
                  eyebrow={active?.subtitle ?? 'ClaudyGod'}
                  title={active?.title ?? 'Watch ministry videos, live moments, and full replays.'}
                  subtitle={active?.duration ?? 'Video hub'}
                  description={active?.description ?? 'Move between live sessions, messages, and saved replays from one video screen.'}
                  height={isTablet ? 420 : 330}
                  actions={[
                    {
                      label: active?.isLive ? 'Watch live' : 'Watch now',
                      onPress: () =>
                        active
                          ? openVideo(active, 'videos_featured')
                          : router.push(APP_ROUTES.tabs.home),
                      icon: 'play-arrow',
                    },
                    {
                      label: active?.isLive ? 'Follow live' : isSaved ? 'Saved' : 'Save',
                      onPress: () => (active?.isLive ? void followLive() : void toggleSave()),
                      variant: 'secondary',
                      icon: active?.isLive ? 'notifications-active' : isSaved ? 'bookmark' : 'bookmark-border',
                    },
                  ]}
                />
              )}
            </FadeIn>

            {queue.length > 1 ? (
              <FadeIn delay={120}>
                <View>
                  <SectionHeader
                    title="Up next"
                    actionLabel="Queue"
                    onAction={() => router.push(APP_ROUTES.tabs.library)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {queue.filter((item) => item.id !== active?.id).map((item) => (
                      <PosterCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        subtitle={item.subtitle}
                        size={posterSize}
                        onPress={() => void openVideo(item, 'videos_queue')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {feed.live.length ? (
              <FadeIn delay={160}>
                <View>
                  <SectionHeader
                    title="Live and replay"
                    actionLabel="Home"
                    onAction={() => router.push(APP_ROUTES.tabs.home)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {feed.live.map((item) => (
                      <PosterCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        subtitle={item.liveViewerCount ? `${item.liveViewerCount} watching` : item.subtitle}
                        size={posterSize}
                        onPress={() => void openVideo(item, 'videos_live')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {curatedSections.map(({ section, items }, index) => (
              <FadeIn key={section.id || section.title} delay={200 + index * 35}>
                <View>
                  <SectionHeader
                    title={section.title}
                    actionLabel="View all"
                    onAction={() => router.push(APP_ROUTES.tabs.library)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {items.map((item) => (
                      <PosterCard
                        key={`${section.title}-${item.id}`}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        subtitle={item.subtitle}
                        size={posterSize}
                        onPress={() => void openVideo(item, 'videos_curated')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ))}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
