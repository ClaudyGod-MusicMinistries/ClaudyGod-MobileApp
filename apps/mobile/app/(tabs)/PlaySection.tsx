import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AudioPlayer } from '../../components/media/AudioPlayer';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { useContentFeed } from '../../hooks/useContentFeed';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import type { FeedCardItem } from '../../services/contentService';
import {
  isDirectPlayableAudioUrl,
  isDirectPlayableVideoUrl,
  routeParamToString,
} from '../../util/playerRoute';

type PlayerRouteParams = {
  itemId?: string | string[];
  itemType?: string | string[];
  title?: string | string[];
  subtitle?: string | string[];
  imageUrl?: string | string[];
  duration?: string | string[];
  mediaUrl?: string | string[];
};

const toFeedType = (value?: string): FeedCardItem['type'] => {
  switch (value) {
    case 'audio':
    case 'video':
    case 'playlist':
    case 'announcement':
    case 'live':
    case 'ad':
      return value;
    default:
      return 'video';
  }
};

export default function PlaySection() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<PlayerRouteParams>();
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;

  const routeItemId = routeParamToString(params.itemId);
  const routeMediaUrl = routeParamToString(params.mediaUrl)?.trim();
  const routeTitle = routeParamToString(params.title)?.trim();
  const routeSubtitle = routeParamToString(params.subtitle)?.trim();
  const routeImageUrl = routeParamToString(params.imageUrl)?.trim();
  const routeDuration = routeParamToString(params.duration)?.trim();
  const routeType = toFeedType(routeParamToString(params.itemType));

  const routeItem = useMemo<FeedCardItem | null>(() => {
    if (!routeTitle && !routeMediaUrl) {
      return null;
    }

    const fallbackId = routeMediaUrl ? `route:${routeMediaUrl}` : `route:${routeTitle ?? 'item'}`;

    return {
      id: routeItemId ?? fallbackId,
      title: routeTitle ?? 'Selected media',
      subtitle: routeSubtitle ?? 'ClaudyGod',
      description: '',
      duration: routeDuration ?? '--:--',
      imageUrl: routeImageUrl ?? '',
      mediaUrl: routeMediaUrl,
      type: routeType,
      isLive: routeType === 'live',
      appSections: [],
    };
  }, [
    routeDuration,
    routeImageUrl,
    routeItemId,
    routeMediaUrl,
    routeSubtitle,
    routeTitle,
    routeType,
  ]);

  const { feed } = useContentFeed();
  const queue = useMemo(() => {
    const combined = [...feed.mostPlayed, ...feed.music, ...feed.videos, ...feed.live];
    const seen = new Set<string>();
    return combined.filter((item) => {
      const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [feed.live, feed.mostPlayed, feed.music, feed.videos]);

  const [activeId, setActiveId] = useState<string>(routeItem?.id ?? queue[0]?.id ?? '');

  useEffect(() => {
    if (routeItem?.id) {
      setActiveId(routeItem.id);
    }
  }, [routeItem?.id]);

  useEffect(() => {
    if (!activeId) {
      setActiveId(routeItem?.id ?? queue[0]?.id ?? '');
      return;
    }

    const existsInQueue = queue.some((item) => item.id === activeId);
    const matchesRouteItem = routeItem?.id === activeId;
    if (!existsInQueue && !matchesRouteItem) {
      setActiveId(routeItem?.id ?? queue[0]?.id ?? '');
    }
  }, [activeId, queue, routeItem?.id]);

  const active = queue.find((item) => item.id === activeId) ?? routeItem ?? null;
  const upNext = useMemo(
    () => queue.filter((item) => item.id !== active?.id).slice(0, 12),
    [active?.id, queue],
  );

  const openSource = async () => {
    const source = active?.mediaUrl?.trim();
    if (!source) {
      return;
    }

    const supported = await Linking.canOpenURL(source);
    if (supported) {
      await Linking.openURL(source);
    }
  };

  const onSelectTrack = async (item: FeedCardItem) => {
    setActiveId(item.id);
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source: 'player_queue',
    });
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
                borderRadius: 22,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TVTouchable
                  onPress={() => router.push('/(tabs)/home')}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
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
                <CustomText variant="label" style={{ color: theme.colors.text.secondary }}>
                  Media Player
                </CustomText>
                <TVTouchable
                  onPress={() => router.push('/(tabs)/library')}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="library-music" size={20} color={theme.colors.primary} />
                </TVTouchable>
              </View>

              {active ? (
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: isTablet ? 72 : 64,
                        height: isTablet ? 72 : 64,
                        borderRadius: 14,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {active.imageUrl ? (
                        <Image
                          source={{ uri: active.imageUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialIcons
                          name={active.type === 'audio' ? 'music-note' : 'play-circle-outline'}
                          size={28}
                          color={theme.colors.primary}
                        />
                      )}
                    </View>

                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={2}>
                        {active.title}
                      </CustomText>
                      <CustomText
                        variant="caption"
                        style={{ color: theme.colors.text.secondary, marginTop: 4 }}
                        numberOfLines={1}
                      >
                        {active.subtitle}
                      </CustomText>
                    </View>
                  </View>

                  <View style={{ marginTop: 14 }}>
                    <MediaPanel item={active} isTablet={isTablet} onOpenSource={openSource} />
                  </View>
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                    No media selected
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                    Publish content from admin and select an item to start playback.
                  </CustomText>
                </View>
              )}
            </View>
          </FadeIn>

          {upNext.length > 0 ? (
            <FadeIn delay={90}>
              <View
                style={{
                  marginTop: 14,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  padding: 12,
                }}
              >
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: 8 }}>
                  Up Next
                </CustomText>
                <View style={{ gap: 8 }}>
                  {upNext.map((item) => (
                    <TVTouchable
                      key={item.id}
                      onPress={() => void onSelectTrack(item)}
                      style={{
                        borderRadius: 14,
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                        backgroundColor: theme.colors.surfaceAlt,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                      showFocusBorder={false}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          overflow: 'hidden',
                          backgroundColor: theme.colors.surface,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          marginRight: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.imageUrl ? (
                          <Image source={{ uri: item.imageUrl }} style={{ width: 42, height: 42 }} />
                        ) : (
                          <MaterialIcons
                            name={item.type === 'audio' ? 'music-note' : 'play-circle-outline'}
                            size={18}
                            color={theme.colors.primary}
                          />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <CustomText variant="body" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                          {item.title}
                        </CustomText>
                        <CustomText
                          variant="caption"
                          style={{ color: theme.colors.text.secondary, marginTop: 2 }}
                          numberOfLines={1}
                        >
                          {item.subtitle}
                        </CustomText>
                      </View>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                        {item.duration}
                      </CustomText>
                    </TVTouchable>
                  ))}
                </View>
              </View>
            </FadeIn>
          ) : null}
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function MediaPanel({
  item,
  isTablet,
  onOpenSource,
}: {
  item: FeedCardItem;
  isTablet: boolean;
  onOpenSource: () => Promise<void>;
}) {
  const theme = useAppTheme();
  const mediaUrl = item.mediaUrl?.trim();

  if (!mediaUrl) {
    return (
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceAlt,
          padding: 12,
        }}
      >
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
          This content does not have a media source URL yet.
        </CustomText>
      </View>
    );
  }

  if (item.type === 'audio') {
    if (isDirectPlayableAudioUrl(mediaUrl)) {
      return (
        <AudioPlayer
          track={{
            id: item.id,
            title: item.title,
            artist: item.subtitle,
            uri: mediaUrl,
            duration: item.duration,
          }}
          autoPlay={false}
        />
      );
    }

    return <ExternalSourceCard onOpenSource={onOpenSource} />;
  }

  if (item.type === 'video' || item.type === 'live') {
    if (isDirectPlayableVideoUrl(mediaUrl)) {
      return <VideoPlayer title={item.title} sourceUri={mediaUrl} height={isTablet ? 300 : 230} />;
    }

    return <ExternalSourceCard onOpenSource={onOpenSource} />;
  }

  return <ExternalSourceCard onOpenSource={onOpenSource} />;
}

function ExternalSourceCard({ onOpenSource }: { onOpenSource: () => Promise<void> }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        padding: 12,
      }}
    >
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
        This source cannot be streamed directly in-app. Open source to continue playback.
      </CustomText>
      <TVTouchable
        onPress={() => void onOpenSource()}
        style={{
          marginTop: 10,
          alignSelf: 'flex-start',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
        showFocusBorder={false}
      >
        <MaterialIcons name="open-in-new" size={16} color={theme.colors.primary} />
        <CustomText variant="label" style={{ color: theme.colors.primary }}>
          Open Source
        </CustomText>
      </TVTouchable>
    </View>
  );
}
