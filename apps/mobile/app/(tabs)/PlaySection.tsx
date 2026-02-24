import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Linking, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { isDirectPlayableVideoUrl, routeParamToString } from '../../util/playerRoute';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';

export default function PlaySection() {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
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
  const compact = width < 390;
  const { feed } = useContentFeed();
  const ui = {
    playerCardBg: isDark ? 'rgba(12,9,20,0.88)' : theme.colors.surface,
    playerCardBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    muted: isDark ? 'rgba(194,185,220,0.9)' : theme.colors.text.secondary,
    subtle: isDark ? 'rgba(171,162,198,0.9)' : theme.colors.text.secondary,
    progressTrack: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,16,33,0.12)',
    playerBtnBorder: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(20,16,33,0.08)',
    lyricBtnBg: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceAlt,
    lyricBtnBorder: isDark ? 'rgba(255,255,255,0.12)' : theme.colors.border,
    lyricBtnText: isDark ? '#EFE7FF' : theme.colors.text.primary,
    panelBg: isDark ? 'rgba(12,9,20,0.86)' : theme.colors.surface,
    panelBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    lyricPanelBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    lyricPanelBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,16,33,0.06)',
    queueRowBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.06)',
    queueRowBg: isDark ? 'rgba(255,255,255,0.02)' : theme.colors.surface,
    queueRowSelectedBorder: isDark ? 'rgba(154,107,255,0.18)' : 'rgba(109,40,217,0.16)',
    queueRowSelectedBg: isDark ? 'rgba(154,107,255,0.09)' : 'rgba(109,40,217,0.06)',
  } as const;

  const queue = useMemo(() => {
    const items = [...feed.music, ...feed.videos, ...feed.playlists].slice(0, 12);
    return items;
  }, [feed.music, feed.playlists, feed.videos]);

  const routeSelectedItem = useMemo<FeedCardItem | null>(() => {
    const itemId = routeParamToString(params.itemId);
    if (!itemId) return null;

    const typeValue = routeParamToString(params.itemType);
    const validTypes: FeedCardItem['type'][] = ['audio', 'video', 'playlist', 'announcement', 'live', 'ad'];
    const itemType = validTypes.includes(typeValue as FeedCardItem['type']) ? (typeValue as FeedCardItem['type']) : 'audio';

    return {
      id: itemId,
      type: itemType,
      title: routeParamToString(params.title) || 'Selected media',
      subtitle: routeParamToString(params.subtitle) || 'ClaudyGod Channel',
      description: routeParamToString(params.subtitle) || 'Selected from your feed',
      imageUrl: routeParamToString(params.imageUrl) || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
      duration: routeParamToString(params.duration) || '--:--',
      mediaUrl: routeParamToString(params.mediaUrl),
    };
  }, [params.duration, params.imageUrl, params.itemId, params.itemType, params.mediaUrl, params.subtitle, params.title]);

  const [activeId, setActiveId] = useState<string | null>(queue[0]?.id ?? null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isPlaying) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isPlaying, pulse]);

  useEffect(() => {
    if (!queue.length) return;
    if (!activeId || !queue.some((item) => item.id === activeId)) {
      setActiveId(queue[0].id);
    }
  }, [activeId, queue]);

  useEffect(() => {
    const routeItemId = routeParamToString(params.itemId);
    if (routeItemId) {
      setActiveId(routeItemId);
    }
  }, [params.itemId]);

  const active = queue.find((item) => item.id === activeId) ?? routeSelectedItem ?? null;
  const progress = 0.42;
  const activeMediaUrl = active?.mediaUrl;
  const isVideoContent = active?.type === 'video' || active?.type === 'live';
  const canPlayInlineVideo = isVideoContent && isDirectPlayableVideoUrl(activeMediaUrl);
  const requiresHostedPlayer = isVideoContent && Boolean(activeMediaUrl) && !canPlayInlineVideo;

  const chooseTrack = async (item: FeedCardItem) => {
    setActiveId(item.id);
    setShowLyrics(false);
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source: 'player_queue' });
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 148 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <Screen>
          <FadeIn>
            <BrandedHeaderCard
              title="Player"
              subtitle="Now playing • Queue • Lyrics"
              leadingAction={{ icon: 'arrow-back', onPress: () => router.back(), accessibilityLabel: 'Go back' }}
              actions={[
                { icon: 'home', onPress: () => router.push('/(tabs)/home'), accessibilityLabel: 'Open home' },
                { icon: 'more-vert', onPress: () => router.push('/(tabs)/Settings'), accessibilityLabel: 'More options' },
              ]}
            />
          </FadeIn>

          <FadeIn>
            <View
              style={{
                marginTop: 12,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: ui.playerCardBorder,
                backgroundColor: ui.playerCardBg,
                padding: compact ? 14 : 16,
              }}
            >
              <View style={{ alignItems: 'center' }}>
                {canPlayInlineVideo && activeMediaUrl ? (
                  <View
                    style={{
                      width: compact ? 216 : 248,
                      height: compact ? 216 : 248,
                      borderRadius: 28,
                      overflow: 'hidden',
                      backgroundColor: '#000',
                    }}
                  >
                    <Video
                      source={{ uri: activeMediaUrl }}
                      style={{ width: '100%', height: '100%' }}
                      useNativeControls
                      shouldPlay={isPlaying}
                      resizeMode={ResizeMode.COVER}
                      isLooping={false}
                    />
                  </View>
                ) : (
                  <Animated.View style={{ transform: [{ scale: pulse }] }}>
                    <Image
                      source={{ uri: active?.imageUrl ?? 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80' }}
                      style={{ width: compact ? 216 : 248, height: compact ? 216 : 248, borderRadius: 28 }}
                      resizeMode="cover"
                    />
                  </Animated.View>
                )}

                <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginTop: 14 }} numberOfLines={1}>
                  {active?.title ?? 'No track loaded'}
                </CustomText>
                <CustomText variant="caption" style={{ color: ui.muted, marginTop: 3 }} numberOfLines={1}>
                  {active?.subtitle ?? 'Connect content feed to queue tracks'}
                </CustomText>

                {canPlayInlineVideo ? (
                  <View
                    style={{
                      marginTop: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(216,194,255,0.18)' : 'rgba(109,40,217,0.12)',
                      backgroundColor: isDark ? 'rgba(154,107,255,0.08)' : 'rgba(109,40,217,0.05)',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <MaterialIcons name="smart-display" size={15} color={theme.colors.primary} />
                    <CustomText variant="caption" style={{ color: theme.colors.text.primary, marginLeft: 6 }}>
                      In-app video playback
                    </CustomText>
                  </View>
                ) : null}

                {requiresHostedPlayer && activeMediaUrl ? (
                  <View
                    style={{
                      width: '100%',
                      marginTop: 10,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : theme.colors.surfaceAlt,
                      padding: 10,
                    }}
                  >
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                      This video source uses a hosted page link. Add a direct stream URL (MP4/HLS) for in-app playback.
                    </CustomText>
                    <TVTouchable
                      onPress={() => void Linking.openURL(activeMediaUrl)}
                      showFocusBorder={false}
                      style={{
                        marginTop: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surface,
                        minHeight: 38,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                      }}
                    >
                      <MaterialIcons name="open-in-new" size={16} color={theme.colors.primary} />
                      <CustomText variant="caption" style={{ color: theme.colors.text.primary, marginLeft: 6 }}>
                        Open Source Link
                      </CustomText>
                    </TVTouchable>
                  </View>
                ) : null}

                <View style={{ width: '100%', marginTop: 16 }}>
                  <View style={{ height: 2, borderRadius: 999, backgroundColor: ui.progressTrack }}>
                    <View style={{ width: `${Math.round(progress * 100)}%`, height: 2, borderRadius: 999, backgroundColor: theme.colors.primary }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <CustomText variant="caption" style={{ color: ui.subtle }}>
                      1:24
                    </CustomText>
                    <CustomText variant="caption" style={{ color: ui.subtle }}>
                      {active?.duration || '--:--'}
                    </CustomText>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: compact ? 10 : 14, marginTop: 14 }}>
                  <Control icon="shuffle" onPress={() => undefined} />
                  <Control icon="skip-previous" onPress={() => undefined} />
                  <TVTouchable
                    onPress={() => setIsPlaying((v) => !v)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.primary,
                      borderWidth: 1,
                      borderColor: ui.playerBtnBorder,
                    }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={30} color="#FFFFFF" />
                  </TVTouchable>
                  <Control icon="skip-next" onPress={() => undefined} />
                  <Control icon="repeat" onPress={() => undefined} />
                </View>

                <TVTouchable
                  onPress={() => setShowLyrics((v) => !v)}
                  style={{
                    marginTop: 14,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: ui.lyricBtnBorder,
                    backgroundColor: ui.lyricBtnBg,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name={showLyrics ? 'lyrics' : 'subtitles'} size={16} color={isDark ? '#EFE7FF' : theme.colors.primary} />
                  <CustomText variant="caption" style={{ color: ui.lyricBtnText, marginLeft: 6 }}>
                    {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
                  </CustomText>
                </TVTouchable>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={110}>
            <View
              style={{
                marginTop: 14,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: ui.panelBorder,
                backgroundColor: ui.panelBg,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <CustomText variant="caption" style={{ color: ui.muted }}>
                    {showLyrics ? 'LYRICS PANEL' : 'UP NEXT'}
                  </CustomText>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginTop: 3 }}>
                    {showLyrics ? 'Worship Lyrics Preview' : 'Queue'}
                  </CustomText>
                </View>
                <TVTouchable
                  onPress={() => setShowLyrics((v) => !v)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border,
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name={showLyrics ? 'queue-music' : 'article'} size={20} color={theme.colors.text.primary} />
                </TVTouchable>
              </View>

              {showLyrics ? (
                <View
                  style={{
                    marginTop: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: ui.lyricPanelBorder,
                    backgroundColor: ui.lyricPanelBg,
                    padding: 12,
                    gap: 8,
                  }}
                >
                  <CustomText variant="body" style={{ color: theme.colors.text.primary }}>
                    Placeholder lyrics panel for the active track.
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    Connect lyrics provider or CMS field in your content pipeline to render synchronized lyrics here.
                  </CustomText>
                </View>
              ) : (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {queue.length ? (
                    queue.map((item) => {
                      const selected = item.id === activeId;
                      return (
                        <TVTouchable
                          key={item.id}
                          onPress={() => chooseTrack(item)}
                          style={{
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: selected ? ui.queueRowSelectedBorder : ui.queueRowBorder,
                            backgroundColor: selected ? ui.queueRowSelectedBg : ui.queueRowBg,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          showFocusBorder={false}
                        >
                          <Image source={{ uri: item.imageUrl }} style={{ width: 42, height: 42, borderRadius: 12, marginRight: 10, backgroundColor: isDark ? '#140F20' : theme.colors.surfaceAlt }} resizeMode="cover" />
                          <View style={{ flex: 1 }}>
                            <CustomText variant="label" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                              {item.title}
                            </CustomText>
                            <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
                              {item.subtitle}
                            </CustomText>
                          </View>
                          <CustomText variant="caption" style={{ color: selected ? theme.colors.primary : theme.colors.text.secondary }}>
                            {item.duration || '--:--'}
                          </CustomText>
                        </TVTouchable>
                      );
                    })
                  ) : (
                    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: ui.lyricPanelBorder, backgroundColor: ui.lyricPanelBg, padding: 12 }}>
                      <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                        Queue empty
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                        Publish audio or video content and it will appear here as a queue.
                      </CustomText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </FadeIn>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function Control({ icon, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; onPress: () => void }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={19} color={theme.colors.text.primary} />
    </TVTouchable>
  );
}
