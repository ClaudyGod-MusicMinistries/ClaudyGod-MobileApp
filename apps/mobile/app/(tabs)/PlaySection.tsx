import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, Share, View, useWindowDimensions } from 'react-native';
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
import { AudioPlayer } from '../../components/media/AudioPlayer';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { useToast } from '../../context/ToastContext';
import { useGuestMode } from '../../context/GuestModeContext';
import { useFloatingPlayer } from '../../context/FloatingPlayerContext';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchMeLibrary, removeMeLibraryItem, saveMeLibraryItem } from '../../services/userFlowService';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { deriveLayoutSectionItems, getPlayerLayoutSections } from '../../util/mobileLayout';
import {
  buildPlayerRoute,
  isDirectPlayableAudioUrl,
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
    itemType === 'video' ||
    itemType === 'playlist' ||
    itemType === 'announcement' ||
    itemType === 'live' ||
    itemType === 'ad'
      ? itemType
      : 'audio';

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

export default function PlaySection() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { isGuestMode } = useGuestMode();
  const { startPlaying, minimize, maximize, updateProgress, pause, resume, setPlaybackControls } = useFloatingPlayer();
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
    const combined = dedupeItems([
      ...(routeItem ? [routeItem] : []),
      ...feed.music,
      ...feed.mostPlayed,
      ...feed.playlists,
      ...feed.recent,
    ]);
    return combined.filter((item) => !shouldOpenVideoScreen(item));
  }, [feed.mostPlayed, feed.music, feed.playlists, feed.recent, routeItem]);

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
  }, [activeId, queue, routeItem]);

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
  const hasInlineAudio = Boolean(active?.mediaUrl && isDirectPlayableAudioUrl(active.mediaUrl));
  const activeIndex = active ? queue.findIndex((item) => item.id === active.id) : -1;
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < queue.length - 1;
  const isSaved = active ? savedIds.has(active.id) : false;
  const curatedSections = useMemo(
    () =>
      getPlayerLayoutSections(mobileConfig)
        .map((section) => ({
          section,
          items: deriveLayoutSectionItems(feed, section).filter((item) => !shouldOpenVideoScreen(item)),
        }))
        .filter((entry) => entry.items.length > 0)
        .slice(0, 5),
    [feed, mobileConfig],
  );

  useEffect(() => {
    if (!active) return;
    startPlaying(active, 'audio', queue);
  }, [active, queue, startPlaying]);

  useEffect(() => {
    if (!active) return;
    if (isFocused) {
      maximize();
    } else {
      minimize();
    }
  }, [active, isFocused, maximize, minimize]);

  const openItem = async (item: FeedCardItem, source: string) => {
    setActiveId(item.id);
    startPlaying(item, 'audio', queue);
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
  };

  const openMoreForItem = (item: FeedCardItem) => {
    setActiveId(item.id);
    setIsActionSheetVisible(true);
  };

  const formatMeta = (item: FeedCardItem) =>
    [item.subtitle, item.duration].filter((value) => Boolean(value)).join(' · ');

  const goPrevious = () => {
    if (!canGoPrevious) return;
    const previous = queue[activeIndex - 1];
    if (previous) {
      void openItem(previous, 'player_previous');
    }
  };

  const goNext = () => {
    if (!canGoNext) return;
    const next = queue[activeIndex + 1];
    if (next) {
      void openItem(next, 'player_next');
    }
  };

  const openExternal = async () => {
    if (!active) return;

    if (shouldOpenVideoScreen(active)) {
      router.push(buildPlayerRoute(active));
      return;
    }

    if (active.mediaUrl) {
      await Linking.openURL(active.mediaUrl);
    }
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

  const actionSheetActions: ActionSheetAction[] = !active
    ? []
    : [
        {
          key: 'save',
          label: isSaved ? 'Remove from Library' : 'Save to Library',
          detail: isSaved ? 'Remove this item from your saved library.' : 'Keep this item in your library.',
          icon: isSaved ? 'bookmark' : 'bookmark-border',
          onPress: () => {
            void toggleSave();
          },
        },
        {
          key: 'share',
          label: 'Share',
          detail: 'Send this listening item to someone else.',
          icon: 'ios-share',
          onPress: () => {
            void shareActive();
          },
        },
        {
          key: 'open-browser',
          label: 'Open in Browser',
          detail: 'Open the source link outside the app.',
          icon: 'open-in-new',
          onPress: () => {
            void openExternal();
          },
        },
        {
          key: 'open-detail',
          label: 'Open Related Screen',
          detail: 'Open the dedicated player route for this item.',
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
                title="Music"
                subtitle="Queue up worship tracks, messages, and saved listening."
                actions={[
                  { icon: 'queue-music', onPress: () => router.push(APP_ROUTES.tabs.library), accessibilityLabel: 'Library' },
                  { icon: 'smart-display', onPress: () => router.push(APP_ROUTES.tabs.videos), accessibilityLabel: 'Videos' },
                ]}
              />
            </FadeIn>

            <FadeIn delay={70}>
              {active && hasInlineAudio && active.mediaUrl ? (
                <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
                  <View style={{ gap: 16 }}>
                    <AudioPlayer
                      track={{
                        id: active.id,
                        title: active.title,
                        artist: active.subtitle,
                        uri: active.mediaUrl,
                        duration: active.duration,
                        imageUrl: active.imageUrl,
                      }}
                      onPrevious={goPrevious}
                      onNext={goNext}
                      canGoPrevious={canGoPrevious}
                      canGoNext={canGoNext}
                      onRegisterControls={(controls) => setPlaybackControls(controls)}
                      onPlayStateChange={(playing) => (playing ? resume() : pause())}
                      onProgress={(currentTime, duration) => updateProgress(currentTime, duration)}
                    />

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      <AppButton
                        title={isSaved ? 'Saved' : 'Save'}
                        variant="secondary"
                        size="sm"
                        onPress={() => void toggleSave()}
                        leftIcon={<MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={theme.colors.text} />}
                      />
                      <AppButton
                        title="More"
                        variant="outline"
                        size="sm"
                        onPress={() => setIsActionSheetVisible(true)}
                        leftIcon={<MaterialIcons name="more-horiz" size={16} color={theme.colors.text} />}
                      />
                    </View>
                  </View>
                </SurfaceCard>
              ) : (
                <CinematicHeroCard
                  imageUrl={active?.imageUrl}
                  badge={active?.type === 'playlist' ? 'Playlist' : 'Featured listen'}
                  eyebrow={active?.subtitle ?? 'ClaudyGod'}
                  title={active?.title ?? 'Return to worship tracks, full messages, and saved listening.'}
                  subtitle={active?.duration ?? 'Music player'}
                  description={active?.description ?? 'Your audio queue stays in one dedicated music player instead of being mixed into the video screen.'}
                  height={isTablet ? 420 : 330}
                  actions={[
                    {
                      label: 'Play now',
                      onPress: () => (active ? openItem(active, 'player_featured') : router.push(APP_ROUTES.tabs.home)),
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
              <FadeIn delay={130}>
                <View>
                  <SectionHeader
                    title="Queue"
                    actionLabel="Library"
                    onAction={() => router.push(APP_ROUTES.tabs.library)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {queue.filter((item) => item.id !== active?.id).map((item) => (
                      <PosterCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        meta={formatMeta(item)}
                        size={posterSize}
                        showMore
                        onMorePress={() => openMoreForItem(item)}
                        onPress={() => void openItem(item, 'player_queue')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {curatedSections.map(({ section, items }, index) => (
              <FadeIn key={section.id || section.title} delay={170 + index * 35}>
                <View>
                  <SectionHeader
                    title={section.title}
                    actionLabel={section.actionLabel}
                    onAction={() => router.push(TAB_ROUTE_BY_ID[section.destinationTab])}
                  />
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                    {section.subtitle}
                  </CustomText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {items.map((item) => (
                      <PosterCard
                        key={`${section.title}-${item.id}`}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        meta={formatMeta(item)}
                        size={posterSize}
                        showMore
                        onMorePress={() => openMoreForItem(item)}
                        onPress={() => void openItem(item, 'player_curated')}
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
        title={active?.title ?? 'Player actions'}
        description={active?.subtitle ?? 'Choose what to do with this listening item.'}
        actions={actionSheetActions}
        onClose={() => setIsActionSheetVisible(false)}
      />
    </TabScreenWrapper>
  );
}
