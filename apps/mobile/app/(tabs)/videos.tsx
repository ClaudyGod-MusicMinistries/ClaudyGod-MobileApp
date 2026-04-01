import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { PosterCard } from '../../components/ui/PosterCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { ActionSheet, type ActionSheetAction } from '../../components/ui/ActionSheet';
import { CustomText } from '../../components/CustomText';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { useToast } from '../../context/ToastContext';
import { useGuestMode } from '../../context/GuestModeContext';
import { useFloatingPlayer } from '../../context/FloatingPlayerContext';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import type { FeedCardItem } from '../../services/contentService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchMeLibrary, removeMeLibraryItem, saveMeLibraryItem } from '../../services/userFlowService';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../../util/appRoutes';
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
  const { isGuestMode } = useGuestMode();
  const { startPlaying, minimize, maximize, updateProgress, pause, resume, setPlaybackControls } =
    useFloatingPlayer();
  const isFocused = useIsFocused();
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
  const posterSize = isTablet ? 'md' : 'sm';

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
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

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
        if (isGuestMode) {
          setSavedIds(new Set());
          return;
        }

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
  }, [isGuestMode]);

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
        .slice(0, 5),
    [feed, mobileConfig],
  );

  useEffect(() => {
    if (!active) return;
    startPlaying(active, 'video', queue);
  }, [active, queue, startPlaying]);

  useEffect(() => {
    if (!active) return;
    if (isFocused) {
      maximize();
    } else {
      minimize();
    }
  }, [active, isFocused, maximize, minimize]);

  const openVideo = async (item: FeedCardItem, source: string) => {
    setActiveId(item.id);
    startPlaying(item, 'video', queue);
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

    if (isGuestMode) {
      showToast({
        title: 'Sign in to save',
        message: 'Create an account to add items to your library.',
        tone: 'warning',
      });
      return;
    }

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

  const actionSheetActions: ActionSheetAction[] = !active
    ? []
    : [
        {
          key: 'save',
          label: isSaved ? 'Remove from Library' : 'Save to Library',
          detail: isSaved ? 'Remove this video from your saved list.' : 'Keep this video in your library.',
          icon: isSaved ? 'bookmark' : 'bookmark-border',
          onPress: () => {
            void toggleSave();
          },
        },
        {
          key: 'share',
          label: 'Share',
          detail: 'Send this video to someone else.',
          icon: 'ios-share',
          onPress: () => {
            void shareActive();
          },
        },
        {
          key: active.isLive ? 'follow-live' : 'open-browser',
          label: active.isLive ? 'Follow Live Alerts' : 'Open in Browser',
          detail: active.isLive ? 'Get notified when the next live session starts.' : 'Open the source link outside the app.',
          icon: active.isLive ? 'notifications-active' : 'open-in-new',
          onPress: () => {
            if (active.isLive) {
              void followLive();
              return;
            }
            void openExternal();
          },
        },
        {
          key: 'open-detail',
          label: 'Open Detail Screen',
          detail: 'Switch to the dedicated player route for this item.',
          icon: 'open-in-full',
          tone: 'accent' as const,
          onPress: () => {
            router.push(buildPlayerRoute(active));
          },
        },
      ];

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
                        <VideoPlayer
                          sourceUri={active.mediaUrl}
                          title={active.title}
                          onRegisterControls={(controls) => setPlaybackControls(controls)}
                          onPlayStateChange={(playing) => (playing ? resume() : pause())}
                          onProgress={(currentTime, duration) => updateProgress(currentTime, duration)}
                        />
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
                        title="More"
                        variant="outline"
                        onPress={() => setIsActionSheetVisible(true)}
                        leftIcon={<MaterialIcons name="more-horiz" size={16} color={theme.colors.text.primary} />}
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
                      label: 'More',
                      onPress: () => setIsActionSheetVisible(true),
                      variant: 'secondary',
                      icon: 'more-horiz',
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

            {curatedSections.map(({ section, items }, index) => (
              <FadeIn key={section.id || section.title} delay={160 + index * 35}>
                <View>
                  <SectionHeader
                    title={section.title}
                    actionLabel={section.actionLabel}
                    onAction={() => router.push(TAB_ROUTE_BY_ID[section.destinationTab])}
                  />
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginBottom: 10 }}>
                    {section.subtitle}
                  </CustomText>
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
      <ActionSheet
        visible={isActionSheetVisible}
        title={active?.title ?? 'Video actions'}
        description={active?.subtitle ?? 'Choose what to do with this video.'}
        actions={actionSheetActions}
        onClose={() => setIsActionSheetVisible(false)}
      />
    </TabScreenWrapper>
  );
}
