import React, { useEffect, useMemo, useState } from 'react';
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

type QueueTrack = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  elapsed: string;
  progress: number;
  artwork: string;
};

const queue: QueueTrack[] = [
  {
    id: 'q1',
    title: 'Worship Fire',
    artist: 'ClaudyGod Music',
    duration: '4:12',
    elapsed: '1:23',
    progress: 0.32,
    artwork:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q2',
    title: 'Nuggets of Truth - Day 28',
    artist: 'ClaudyGod Nuggets',
    duration: '5:07',
    elapsed: '0:54',
    progress: 0.17,
    artwork:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q3',
    title: 'Worship Hour Live',
    artist: 'ClaudyGod Worship Hour',
    duration: '6:22',
    elapsed: '2:18',
    progress: 0.36,
    artwork:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q4',
    title: 'Teens Youth Channel Special',
    artist: 'ClaudyGod Youth',
    duration: '3:47',
    elapsed: '0:42',
    progress: 0.12,
    artwork:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
  },
];

export default function PlaySection() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const artworkSize = isTV ? 360 : isTablet ? 320 : Math.min(272, width - 92);
  const titleSize = isTV ? 30 : isTablet ? 27 : 22;

  const [activeId, setActiveId] = useState(queue[0].id);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);

  const active = useMemo(() => queue.find((item) => item.id === activeId) ?? queue[0], [activeId]);

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.07, { duration: 760 }), withTiming(1, { duration: 760 })),
      -1,
      false,
    );
  }, [pulse]);

  const playPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isPlaying ? pulse.value : 1 }],
  }));

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 170 }}
        bounces={false}
        alwaysBounceVertical={false}
      >
        <Screen>
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
                  onPress={() => console.log('open queue menu')}
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
                  <MaterialIcons name="menu" size={20} color={theme.colors.text.primary} />
                </TVTouchable>
              </View>

              <View style={{ alignItems: 'center', marginTop: 14 }}>
                <Image
                  source={{ uri: active.artwork }}
                  style={{ width: artworkSize, height: artworkSize, borderRadius: 36 }}
                  resizeMode="cover"
                />
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
                  {active.artist}
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
                        width: `${Math.round(active.progress * 100)}%`,
                        height: 2,
                        borderRadius: 99,
                        backgroundColor: theme.colors.primary,
                      }}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                      {active.elapsed}
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
                  <ControlIcon icon="shuffle" onPress={() => console.log('shuffle')} color={theme.colors.text.secondary} />
                  <ControlIcon icon="skip-previous" onPress={() => console.log('prev')} color={theme.colors.text.primary} />

                  <Animated.View style={playPulseStyle}>
                    <TVTouchable
                      onPress={() => setIsPlaying((prev) => !prev)}
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

                  <ControlIcon icon="skip-next" onPress={() => console.log('next')} color={theme.colors.text.primary} />
                  <ControlIcon icon="repeat" onPress={() => console.log('repeat')} color={theme.colors.text.secondary} />
                </View>

                <TVTouchable
                  onPress={() => setShowLyrics((prev) => !prev)}
                  style={{
                    marginTop: 14,
                    alignSelf: 'center',
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceAlt,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons
                    name={showLyrics ? 'lyrics' : 'subtitles'}
                    size={16}
                    color={theme.colors.primary}
                  />
                  <CustomText variant="label" style={{ color: theme.colors.primary }}>
                    {showLyrics ? 'Hide lyrics' : 'Show lyrics'}
                  </CustomText>
                </TVTouchable>

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
                {queue.map((track) => {
                  const selected = track.id === activeId;
                  return (
                    <TVTouchable
                      key={track.id}
                      onPress={() => {
                        setActiveId(track.id);
                        setIsPlaying(true);
                      }}
                      style={{
                        borderRadius: 14,
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                        backgroundColor: selected
                          ? 'rgba(154,107,255,0.12)'
                          : theme.colors.surfaceAlt,
                        borderWidth: 1,
                        borderColor: selected ? 'rgba(154,107,255,0.36)' : theme.colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                      showFocusBorder={false}
                    >
                      <Image
                        source={{ uri: track.artwork }}
                        style={{ width: 42, height: 42, borderRadius: 12, marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <CustomText
                          variant="body"
                          style={{ color: theme.colors.text.primary }}
                          numberOfLines={1}
                        >
                          {track.title}
                        </CustomText>
                        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                          {track.artist}
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
