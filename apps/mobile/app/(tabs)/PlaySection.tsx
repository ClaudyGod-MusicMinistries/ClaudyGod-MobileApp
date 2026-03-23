import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, Share, View, useWindowDimensions } from 'react-native';
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
import { AudioPlayer } from '../../components/media/AudioPlayer';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchMeLibrary, removeMeLibraryItem, saveMeLibraryItem } from '../../services/userFlowService';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
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
  const hasInlineAudio = Boolean(active?.mediaUrl && isDirectPlayableAudioUrl(active.mediaUrl));
  const activeIndex = active ? queue.findIndex((item) => item.id === active.id) : -1;
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < queue.length - 1;
  const isSaved = active ? savedIds.has(active.id) : false;

  const openItem = async (item: FeedCardItem, source: string) => {
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
                    <View style={{ gap: 6 }}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: theme.colors.text.secondary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.9,
                        }}
                      >
                        Now playing
                      </CustomText>
                      <CustomText variant="hero" style={{ color: theme.colors.text.primary }}>
                        {active.title}
                      </CustomText>
                      <CustomText variant="body" style={{ color: theme.colors.text.secondary }}>
                        {active.subtitle}
                      </CustomText>
                    </View>

                    <AudioPlayer
                      track={{
                        id: active.id,
                        title: active.title,
                        artist: active.subtitle,
                        uri: active.mediaUrl,
                        duration: active.duration,
                      }}
                      onPrevious={goPrevious}
                      onNext={goNext}
                      canGoPrevious={canGoPrevious}
                      canGoNext={canGoNext}
                    />

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      <AppButton
                        title={isSaved ? 'Saved' : 'Save'}
                        variant="secondary"
                        size="sm"
                        onPress={() => void toggleSave()}
                        leftIcon={<MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={theme.colors.text.primary} />}
                      />
                      <AppButton
                        title="Share"
                        variant="outline"
                        size="sm"
                        onPress={() => void shareActive()}
                        leftIcon={<MaterialIcons name="ios-share" size={16} color={theme.colors.text.primary} />}
                      />
                      <AppButton
                        title="Open in browser"
                        variant="outline"
                        size="sm"
                        onPress={() => void openExternal()}
                        leftIcon={<MaterialIcons name="open-in-new" size={16} color={theme.colors.text.primary} />}
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
                      label: isSaved ? 'Saved' : 'Save',
                      onPress: () => void toggleSave(),
                      variant: 'secondary',
                      icon: isSaved ? 'bookmark' : 'bookmark-border',
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
                        subtitle={item.subtitle}
                        size={posterSize}
                        onPress={() => void openItem(item, 'player_queue')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {feed.playlists.length ? (
              <FadeIn delay={170}>
                <View>
                  <SectionHeader
                    title="Playlists"
                    actionLabel="Search"
                    onAction={() => router.push(APP_ROUTES.tabs.search)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {feed.playlists.map((item) => (
                      <PosterCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        subtitle={item.subtitle}
                        size={posterSize}
                        onPress={() => void openItem(item, 'player_playlists')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
