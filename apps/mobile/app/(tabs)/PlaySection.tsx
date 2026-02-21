import React, { useMemo, useState } from 'react';
import { Image, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useContentFeed } from '../../hooks/useContentFeed';
import { trackPlayEvent } from '../../services/supabaseAnalytics';

export default function PlaySection() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;

  const { feed } = useContentFeed();
  const queue = useMemo(() => {
    const combined = [...feed.mostPlayed, ...feed.music, ...feed.videos, ...feed.live];
    const seen = new Set<string>();
    return combined.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, [feed.live, feed.mostPlayed, feed.music, feed.videos]);

  const firstTrack = queue[0] ?? null;
  const [activeId, setActiveId] = useState(firstTrack?.id ?? '');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);

  const active = queue.find((item) => item.id === activeId) ?? firstTrack;

  const pulse = useSharedValue(1);
  const playPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isPlaying ? pulse.value : 1 }],
  }));

  if (isPlaying) {
    pulse.value = withRepeat(withSequence(withTiming(1.07, { duration: 760 }), withTiming(1, { duration: 760 })), -1, false);
  }

  const artworkSize = isTV ? 360 : isTablet ? 320 : Math.min(272, width - 92);
  const titleSize = isTV ? 30 : isTablet ? 27 : 22;

  const onPlayPress = async () => {
    if (!active) {
      return;
    }

    const next = !isPlaying;
    setIsPlaying(next);

    if (next) {
      await trackPlayEvent({
        contentId: active.id,
        contentType: active.type,
        title: active.title,
        source: 'player_screen',
      });
    }
  };

  const onSelectTrack = async (id: string) => {
    setActiveId(id);
    setIsPlaying(true);

    const track = queue.find((item) => item.id === id);
    if (!track) {
      return;
    }

    await trackPlayEvent({
      contentId: track.id,
      contentType: track.type,
      title: track.title,
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
          {active ? (
            <>
              <FadeIn>
                <View
                  style={{
                    borderRadius: 26,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    padding: 16,
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
                      Now Playing
                    </CustomText>

                    <TVTouchable
                      onPress={() => setShowLyrics((prev) => !prev)}
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
                      <MaterialIcons name={showLyrics ? 'lyrics' : 'subtitles'} size={19} color={theme.colors.primary} />
                    </TVTouchable>
                  </View>

                  <View style={{ alignItems: 'center', marginTop: 14 }}>
                    <Image source={{ uri: active.imageUrl }} style={{ width: artworkSize, height: artworkSize, borderRadius: 36 }} resizeMode="cover" />
                  </View>

                  <View style={{ marginTop: 16 }}>
                    <CustomText
                      variant="display"
                      style={{
                        color: theme.colors.text.primary,
                        textAlign: 'center',
                        fontFamily: 'ClashDisplay_700Bold',
                        fontSize: titleSize,
                        lineHeight: titleSize + 6,
                      }}
                    >
                      {active.title}
                    </CustomText>
                    <CustomText
                      variant="subtitle"
                      style={{ color: theme.colors.text.secondary, textAlign: 'center', marginTop: 4 }}
                    >
                      {active.subtitle}
                    </CustomText>

                    <View style={{ marginTop: 16 }}>
                      <View
                        style={{
                          height: 2,
                          borderRadius: 99,
                          backgroundColor: theme.colors.muted,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: '42%',
                            height: 2,
                            borderRadius: 99,
                            backgroundColor: theme.colors.primary,
                          }}
                        />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                          1:28
                        </CustomText>
                        <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                          {active.duration}
                        </CustomText>
                      </View>
                    </View>

                    <View
                      style={{
                        marginTop: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <ControlIcon icon="shuffle" onPress={() => undefined} color={theme.colors.text.secondary} />
                      <ControlIcon icon="skip-previous" onPress={() => undefined} color={theme.colors.text.primary} />

                      <Animated.View style={playPulseStyle}>
                        <TVTouchable
                          onPress={onPlayPress}
                          style={{
                            width: 70,
                            height: 70,
                            borderRadius: 35,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.colors.primary,
                            shadowColor: '#9A6BFF',
                            shadowOpacity: 0.5,
                            shadowRadius: 22,
                            shadowOffset: { width: 0, height: 12 },
                            elevation: 10,
                          }}
                          showFocusBorder={false}
                        >
                          <MaterialIcons
                            name={isPlaying ? 'pause' : 'play-arrow'}
                            size={32}
                            color={theme.colors.text.inverse}
                          />
                        </TVTouchable>
                      </Animated.View>

                      <ControlIcon icon="skip-next" onPress={() => undefined} color={theme.colors.text.primary} />
                      <ControlIcon icon="repeat" onPress={() => undefined} color={theme.colors.text.secondary} />
                    </View>

                    {showLyrics ? (
                      <View
                        style={{
                          marginTop: 12,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surfaceAlt,
                          padding: 12,
                        }}
                      >
                        <CustomText variant="body" style={{ color: theme.colors.text.secondary, lineHeight: 22 }}>
                          Holy, holy, You are worthy of all praise.{"\n"}
                          Let our hearts keep singing, let our spirits rise.{"\n"}
                          Jesus reigns forever, light within the night.
                        </CustomText>
                      </View>
                    ) : null}
                  </View>
                </View>
              </FadeIn>

              <FadeIn delay={100}>
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
                    {queue.slice(0, 12).map((track) => {
                      const selected = track.id === active.id;
                      return (
                        <TVTouchable
                          key={track.id}
                          onPress={() => onSelectTrack(track.id)}
                          style={{
                            borderRadius: 14,
                            paddingHorizontal: 10,
                            paddingVertical: 10,
                            backgroundColor: selected ? 'rgba(154,107,255,0.12)' : theme.colors.surfaceAlt,
                            borderWidth: 1,
                            borderColor: selected ? 'rgba(154,107,255,0.36)' : theme.colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          showFocusBorder={false}
                        >
                          <Image source={{ uri: track.imageUrl }} style={{ width: 42, height: 42, borderRadius: 12, marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <CustomText variant="body" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                              {track.title}
                            </CustomText>
                            <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                              {track.subtitle}
                            </CustomText>
                          </View>
                          <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                            {track.duration}
                          </CustomText>
                        </TVTouchable>
                      );
                    })}
                  </View>
                </View>
              </FadeIn>
            </>
          ) : (
            <FadeIn>
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  padding: 18,
                }}
              >
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  No queued media yet
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                  Publish audio/video content in admin, then it will populate this player queue.
                </CustomText>
              </View>
            </FadeIn>
          )}
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function ControlIcon({
  icon,
  onPress,
  color,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  color: string;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={22} color={color} />
    </TVTouchable>
  );
}
