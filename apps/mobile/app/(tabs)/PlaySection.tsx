import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AudioPlayer } from '../../components/media/AudioPlayer';
import { useContentFeed } from '../../hooks/useContentFeed';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import type { FeedCardItem } from '../../services/contentService';
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
  if (!itemId) {
    return null;
  }

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
    imageUrl:
      routeParamToString(params.imageUrl) ??
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
    mediaUrl: routeParamToString(params.mediaUrl),
  };
}

export default function PlaySection() {
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

  useEffect(() => {
    if (routeItem?.id) {
      setActiveId(routeItem.id);
      return;
    }

    if (!activeId && queue[0]?.id) {
      setActiveId(queue[0].id);
    }
  }, [activeId, queue, routeItem]);

  const active = queue.find((item) => item.id === activeId) ?? routeItem ?? queue[0] ?? null;
  const activeHasInlineAudio = Boolean(active?.mediaUrl && isDirectPlayableAudioUrl(active.mediaUrl));

  const openItem = async (item: FeedCardItem, source: string) => {
    setActiveId(item.id);
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
  };

  const openVideoFallback = async () => {
    if (!active) return;

    if (shouldOpenVideoScreen(active)) {
      router.push(buildPlayerRoute(active));
      return;
    }

    if (active.mediaUrl) {
      await Linking.openURL(active.mediaUrl);
    }
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 170 }}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 24,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                padding: theme.spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <TVTouchable
                  onPress={() => router.push('/(tabs)/home')}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="arrow-back" size={20} color={theme.colors.text.primary} />
                </TVTouchable>

                <View style={{ alignItems: 'center' }}>
                  <CustomText variant="label" style={{ color: theme.colors.text.secondary }}>
                    Music Player
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                    Audio-first playback queue
                  </CustomText>
                </View>

                <TVTouchable
                  onPress={() => router.push('/(tabs)/videos')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                  showFocusBorder={false}
                >
                  <CustomText variant="caption" style={{ color: theme.colors.text.primary }}>
                    Video Hub
                  </CustomText>
                </TVTouchable>
              </View>

              {active ? (
                <>
                  <View
                    style={{
                      marginTop: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <Image
                      source={{ uri: active.imageUrl }}
                      style={{
                        width: 92,
                        height: 92,
                        borderRadius: 24,
                        backgroundColor: theme.colors.surfaceAlt,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                        {active.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                        {active.subtitle}
                      </CustomText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                        <Pill label={active.type === 'playlist' ? 'Playlist' : 'Audio'} />
                        <Pill label={active.duration} subtle />
                      </View>
                    </View>
                  </View>

                  <View style={{ marginTop: 18 }}>
                    {activeHasInlineAudio && active.mediaUrl ? (
                      <AudioPlayer
                        track={{
                          id: active.id,
                          title: active.title,
                          artist: active.subtitle,
                          uri: active.mediaUrl,
                          duration: active.duration,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surfaceAlt,
                          padding: theme.spacing.lg,
                        }}
                      >
                        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                          This item is not a direct audio stream
                        </CustomText>
                        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                          Uploaded audio will play here. If this item is actually a video or hosted stream, open it in
                          the video hub instead.
                        </CustomText>
                        <TVTouchable
                          onPress={() => void openVideoFallback()}
                          style={{
                            marginTop: 14,
                            alignSelf: 'flex-start',
                            borderRadius: 999,
                            backgroundColor: theme.colors.primary,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                          }}
                          showFocusBorder={false}
                        >
                          <CustomText variant="caption" style={{ color: theme.colors.text.inverse }}>
                            Open source
                          </CustomText>
                        </TVTouchable>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <View
                  style={{
                    marginTop: 18,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceAlt,
                    padding: theme.spacing.lg,
                  }}
                >
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                    No audio queued yet
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                    Publish audio content or assign audio placements from the admin dashboard, then tracks will appear
                    here.
                  </CustomText>
                </View>
              )}
            </View>
          </FadeIn>

          <FadeIn delay={90}>
            <View
              style={{
                marginTop: 16,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                padding: 14,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Up Next
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                  {queue.length} queued
                </CustomText>
              </View>

              <View style={{ gap: 8 }}>
                {queue.length > 0 ? (
                  queue.slice(0, 12).map((item) => {
                    const selected = item.id === active?.id;
                    return (
                      <TVTouchable
                        key={item.id}
                        onPress={() => void openItem(item, 'player_queue')}
                        style={{
                          borderRadius: 16,
                          padding: 10,
                          backgroundColor: selected ? 'rgba(154,107,255,0.12)' : theme.colors.surfaceAlt,
                          borderWidth: 1,
                          borderColor: selected ? 'rgba(154,107,255,0.34)' : theme.colors.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                        showFocusBorder={false}
                      >
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={{ width: 46, height: 46, borderRadius: 14, marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <CustomText variant="body" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                            {item.title}
                          </CustomText>
                          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                            {item.subtitle}
                          </CustomText>
                        </View>
                        <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                          {item.duration}
                        </CustomText>
                      </TVTouchable>
                    );
                  })
                ) : (
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    The queue will populate once audio content is published and assigned.
                  </CustomText>
                )}
              </View>
            </View>
          </FadeIn>
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
