import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { SectionHeader as AppSectionHeader } from '../../components/ui/SectionHeader';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import type { FeedCardItem } from '../../services/contentService';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { deriveLayoutSectionItems, getVideoLayoutSections } from '../../util/mobileLayout';
import {
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
  if (!itemId) {
    return null;
  }

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
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const isDark = theme.scheme === 'dark';
  const featureHeight = isTV ? 420 : isTablet ? 360 : 240;

  const { feed } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();
  const routeItem = useMemo(() => parseRouteItem(params), [params]);

  const videoQueue = useMemo(() => {
    const allMedia = dedupeItems([
      ...(routeItem ? [routeItem] : []),
      ...feed.videos,
      ...feed.live,
      ...feed.music,
      ...feed.recent,
    ]);

    return allMedia.filter((item) => shouldOpenVideoScreen(item));
  }, [feed.live, feed.music, feed.recent, feed.videos, routeItem]);

  const [activeId, setActiveId] = useState(routeItem?.id ?? videoQueue[0]?.id ?? '');

  useEffect(() => {
    if (routeItem?.id) {
      setActiveId(routeItem.id);
      return;
    }

    if (!activeId && videoQueue[0]?.id) {
      setActiveId(videoQueue[0].id);
    }
  }, [activeId, routeItem, videoQueue]);

  const active = videoQueue.find((item) => item.id === activeId) ?? routeItem ?? videoQueue[0] ?? null;
  const canRenderInlineVideo = Boolean(
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
        .filter((entry) => entry.items.length > 0),
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

  const openExternal = async () => {
    if (!active?.mediaUrl) {
      return;
    }

    await Linking.openURL(active.mediaUrl);
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        stickyHeaderIndices={[0]}
      >
        <View
          style={{
            backgroundColor: isDark ? '#06040D' : theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
          }}
        >
          <LinearGradient
            colors={[isDark ? 'rgba(154,107,255,0.06)' : 'rgba(109,40,217,0.08)', 'rgba(0,0,0,0)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none' }}
          />
          <Screen>
            <FadeIn>
              <View
                style={{
                  paddingTop: theme.layout.headerVerticalPadding,
                  paddingBottom: theme.spacing.sm,
                }}
              >
                <BrandedHeaderCard
                  title="Video Hub"
                  subtitle="Watch featured ministry videos, live sessions, and curated screen sections."
                  actions={[
                    { icon: 'search', onPress: () => router.push(APP_ROUTES.tabs.search), accessibilityLabel: 'Search' },
                    { icon: 'music-note', onPress: () => router.push(APP_ROUTES.tabs.player), accessibilityLabel: 'Music player' },
                  ]}
                  chips={[
                    { label: 'Featured Player' },
                    { label: 'Curated Sections' },
                    { label: 'Live Ready' },
                  ]}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: theme.layout.sectionGap }}>
            <FadeIn delay={70}>
              <View
                style={{
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.lg,
                }}
              >
                {active ? (
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 14,
                      }}
                    >
                      <View>
                        <CustomText variant="label" style={{ color: theme.colors.text.secondary }}>
                          Now Showing
                        </CustomText>
                        <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginTop: 4 }}>
                          {active.title}
                        </CustomText>
                      </View>
                      <TVTouchable
                        onPress={() => router.push(APP_ROUTES.tabs.player)}
                        style={{
                          borderRadius: 999,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          backgroundColor: theme.colors.surfaceAlt,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                        showFocusBorder={false}
                      >
                        <CustomText variant="caption" style={{ color: theme.colors.text.primary }}>
                          Music Player
                        </CustomText>
                      </TVTouchable>
                    </View>

                    {canRenderInlineVideo && active.mediaUrl ? (
                      <VideoPlayer
                        title={active.title}
                        sourceUri={active.mediaUrl}
                        height={featureHeight}
                      />
                    ) : (
                      <View
                        style={{
                          borderRadius: 22,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surfaceAlt,
                        }}
                      >
                        <Image
                          source={{ uri: active.imageUrl }}
                          style={{ width: '100%', height: featureHeight }}
                          resizeMode="cover"
                        />
                        <LinearGradient
                          colors={['rgba(9,6,18,0.06)', 'rgba(8,6,14,0.88)']}
                          start={{ x: 0.2, y: 0 }}
                          end={{ x: 0.7, y: 1 }}
                          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                        />
                        <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
                          <CustomText variant="subtitle" style={{ color: '#FFFFFF' }}>
                            This source opens outside the inline player on this device
                          </CustomText>
                          <CustomText
                            variant="caption"
                            style={{ color: 'rgba(255,255,255,0.82)', marginTop: 6 }}
                          >
                            Hosted video sources like social or platform pages can still be opened directly for viewing.
                          </CustomText>
                          <TVTouchable
                            onPress={() => void openExternal()}
                            style={{
                              marginTop: 14,
                              alignSelf: 'flex-start',
                              borderRadius: 999,
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              backgroundColor: 'rgba(255,255,255,0.18)',
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.28)',
                            }}
                            showFocusBorder={false}
                          >
                            <CustomText variant="caption" style={{ color: '#FFFFFF' }}>
                              Open Video Source
                            </CustomText>
                          </TVTouchable>
                        </View>
                      </View>
                    )}

                    <View style={{ marginTop: 14 }}>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                        {active.subtitle}
                      </CustomText>
                      <CustomText
                        variant="body"
                        style={{ color: theme.colors.text.primary, marginTop: 8, lineHeight: 21 }}
                      >
                        {active.description || 'Video description will appear here once the content record includes it.'}
                      </CustomText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                        <Pill label={active.type === 'live' || active.isLive ? 'Live / Video' : 'Video'} />
                        <Pill label={active.duration} subtle />
                      </View>
                    </View>
                  </>
                ) : (
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    No videos are ready yet. Publish or import video content from the admin dashboard to populate this
                    screen.
                  </CustomText>
                )}
              </View>
            </FadeIn>

            {curatedSections.map(({ section, items }, index) => (
              <FadeIn key={section.id} delay={120 + index * 30}>
                <View style={{ marginTop: theme.layout.sectionGapLarge }}>
                  <AppSectionHeader title={section.title} actionLabel={`${items.length} items`} />
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4, marginBottom: 10 }}>
                    {section.subtitle}
                  </CustomText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never">
                    {items.map((item) => {
                      const activeItem = item.id === active?.id;
                      return (
                        <TVTouchable
                          key={`${section.id}-${item.id}`}
                          onPress={() => void openVideo(item, `${section.id}_video_section`)}
                          style={{
                            width: isTV ? 320 : isTablet ? 260 : 216,
                            marginRight: theme.spacing.md,
                            borderRadius: 20,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: activeItem ? `${theme.colors.primary}60` : theme.colors.border,
                            backgroundColor: theme.colors.surface,
                          }}
                          showFocusBorder={false}
                        >
                          <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 132 }} />
                          <View style={{ padding: 12 }}>
                            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                              {item.title}
                            </CustomText>
                            <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }} numberOfLines={2}>
                              {item.subtitle}
                            </CustomText>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                              <Pill label={item.type === 'live' || item.isLive ? 'Live' : 'Video'} subtle />
                              <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                                {item.duration}
                              </CustomText>
                            </View>
                          </View>
                        </TVTouchable>
                      );
                    })}
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

function Pill({ label, subtle }: { label: string; subtle?: boolean }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: subtle ? theme.colors.surfaceAlt : `${theme.colors.primary}14`,
        borderWidth: 1,
        borderColor: subtle ? theme.colors.border : `${theme.colors.primary}22`,
      }}
    >
      <CustomText
        variant="caption"
        style={{ color: subtle ? theme.colors.text.secondary : theme.colors.primary }}
      >
        {label}
      </CustomText>
    </View>
  );
}
