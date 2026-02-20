import React, { useMemo, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';

type MediaItem = {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  imageUrl: string;
};

type ChannelSection = {
  id: string;
  title: string;
  description: string;
  music: MediaItem[];
  videos: MediaItem[];
};

const popularTracks: MediaItem[] = [
  {
    id: 'pt-1',
    title: 'Worthy Is The Lamb',
    subtitle: 'ClaudyGod Live',
    duration: '4:18',
    imageUrl:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'pt-2',
    title: 'Morning Mercy',
    subtitle: 'Worship Team',
    duration: '3:52',
    imageUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'pt-3',
    title: 'Revival Fire',
    subtitle: 'Prayer Circle',
    duration: '5:01',
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'pt-4',
    title: 'Grace Upon Grace',
    subtitle: 'Nuggets Session',
    duration: '3:41',
    imageUrl:
      'https://images.unsplash.com/photo-1461783436728-0a9217714694?auto=format&fit=crop&w=900&q=80',
  },
];

const recentlyPlayed: MediaItem[] = [
  {
    id: 'rp-1',
    title: 'The Name Above All Names',
    subtitle: 'ClaudyGod Messages',
    duration: '5:14',
    imageUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'rp-2',
    title: 'Faith Builder Daily',
    subtitle: 'Nuggets of Truth',
    duration: '4:09',
    imageUrl:
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'rp-3',
    title: 'Teens Worship Room',
    subtitle: 'Youth Channel',
    duration: '3:46',
    imageUrl:
      'https://images.unsplash.com/photo-1458560871784-56d23406c091?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'rp-4',
    title: 'Victory Hour',
    subtitle: 'Worship Hour',
    duration: '6:02',
    imageUrl:
      'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=900&q=80',
  },
];

const baseMusic: MediaItem[] = [
  {
    id: 'm-1',
    title: 'Healing Anthem',
    subtitle: 'Live Session',
    duration: '4:09',
    imageUrl:
      'https://images.unsplash.com/photo-1509869175650-a1d97972541a?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'm-2',
    title: 'Spirit Move',
    subtitle: 'Worship Flow',
    duration: '5:12',
    imageUrl:
      'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'm-3',
    title: 'Grace Notes',
    subtitle: 'Devotional Mix',
    duration: '3:37',
    imageUrl:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&q=80',
  },
];

const baseVideos: MediaItem[] = [
  {
    id: 'v-1',
    title: 'Worship Live Replay',
    subtitle: 'Video Session',
    duration: '22:41',
    imageUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'v-2',
    title: 'Word + Worship',
    subtitle: 'Ministry Broadcast',
    duration: '16:54',
    imageUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'v-3',
    title: 'Prayer Room Night',
    subtitle: 'Special Stream',
    duration: '19:08',
    imageUrl:
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80',
  },
];

const channelSections: ChannelSection[] = [
  {
    id: 'c1',
    title: 'ClaudyGod Music',
    description: 'Songs and ministry sounds for daily devotion.',
    music: baseMusic.map((item) => ({ ...item, id: `c1-${item.id}` })),
    videos: baseVideos.map((item) => ({ ...item, id: `c1-${item.id}` })),
  },
  {
    id: 'c2',
    title: 'ClaudyGod Nuggets of Truth',
    description: 'Short form truth capsules in audio and video.',
    music: baseMusic.map((item) => ({ ...item, id: `c2-${item.id}` })),
    videos: baseVideos.map((item) => ({ ...item, id: `c2-${item.id}` })),
  },
  {
    id: 'c3',
    title: 'ClaudyGod Worship Hour',
    description: 'Extended worship moments and live recordings.',
    music: baseMusic.map((item) => ({ ...item, id: `c3-${item.id}` })),
    videos: baseVideos.map((item) => ({ ...item, id: `c3-${item.id}` })),
  },
  {
    id: 'c4',
    title: 'ClaudyGod Teens Youth Channel',
    description: 'Youth-focused praise, word, and real-life guidance.',
    music: baseMusic.map((item) => ({ ...item, id: `c4-${item.id}` })),
    videos: baseVideos.map((item) => ({ ...item, id: `c4-${item.id}` })),
  },
  {
    id: 'c5',
    title: 'ClaudyGod Messages',
    description: 'Message streams and sermon highlights.',
    music: baseMusic.map((item) => ({ ...item, id: `c5-${item.id}` })),
    videos: baseVideos.map((item) => ({ ...item, id: `c5-${item.id}` })),
  },
  {
    id: 'c6',
    title: 'ClaudyGod Music (Audio)',
    description: 'Audio-first curation for uninterrupted listening.',
    music: baseMusic.map((item) => ({ ...item, id: `c6-${item.id}` })),
    videos: baseVideos.map((item) => ({ ...item, id: `c6-${item.id}` })),
  },
  {
    id: 'c7',
    title: 'ClaudyGod Worship Hour (Audio)',
    description: 'Long-form worship audio sessions.',
    music: baseMusic.map((item) => ({ ...item, id: `c7-${item.id}` })),
    videos: baseVideos.map((item) => ({ ...item, id: `c7-${item.id}` })),
  },
];

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [activeTrackId, setActiveTrackId] = useState(popularTracks[0].id);
  const activeTrack = useMemo(
    () => popularTracks.find((track) => track.id === activeTrackId) ?? popularTracks[0],
    [activeTrackId],
  );

  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroImageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 260], [0, -56], Extrapolate.CLAMP),
      },
      {
        scale: interpolate(scrollY.value, [-120, 0], [1.14, 1], Extrapolate.CLAMP),
      },
    ],
  }));

  const miniPlayerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, 230], [0, -12], Extrapolate.CLAMP) }],
    opacity: interpolate(scrollY.value, [0, 220], [1, 0.93], Extrapolate.CLAMP),
  }));

  const sectionCardWidth = Math.min(188, width * 0.58);

  return (
    <TabScreenWrapper>
      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 200 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                <Image
                  source={require('../../assets/images/ClaudyGoLogo.webp')}
                  style={{ width: 42, height: 42, borderRadius: 12 }}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    Good evening
                  </CustomText>
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                    ClaudyGod Ministry
                  </CustomText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <IconCircle icon="search" onPress={() => router.push('/(tabs)/search')} />
                <IconCircle icon="notifications-none" onPress={() => console.log('notifications')} />
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={50}>
            <View
              style={{
                marginTop: 14,
                height: 280,
                borderRadius: 28,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.scheme === 'dark' ? '#2A1F44' : '#D7CCF5',
                backgroundColor: '#0E081A',
              }}
            >
              <Animated.Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80',
                }}
                style={[{ width: '100%', height: 330 }, heroImageStyle]}
                resizeMode="cover"
              />

              <LinearGradient
                colors={['rgba(7,4,14,0.05)', 'rgba(7,4,14,0.62)', 'rgba(7,4,14,0.96)']}
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 }}
              />

              <View style={{ position: 'absolute', top: 16, left: 16, right: 16 }}>
                <CustomText variant="label" style={{ color: '#DAC9FF' }}>
                  Hero Drop
                </CustomText>
                <CustomText
                  variant="display"
                  style={{
                    marginTop: 4,
                    color: '#F8F7FC',
                    fontSize: 25,
                    lineHeight: 30,
                    fontFamily: 'ClashDisplay_700Bold',
                  }}
                >
                  ClaudyGod Live Session
                </CustomText>
                <CustomText variant="body" style={{ color: 'rgba(227,220,246,0.88)', marginTop: 6 }}>
                  Structured streams, curated tracks, and ministry videos in one flow.
                </CustomText>
              </View>

              <TVTouchable
                onPress={() => router.push('/(tabs)/PlaySection')}
                style={{
                  position: 'absolute',
                  right: 16,
                  bottom: 18,
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#9A6BFF',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.46)',
                  shadowColor: '#9A6BFF',
                  shadowOpacity: 0.58,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 12 },
                  elevation: 14,
                }}
                showFocusBorder={false}
              >
                <MaterialIcons name="play-arrow" size={30} color="#FFFFFF" />
              </TVTouchable>
            </View>
          </FadeIn>

          <FadeIn delay={80}>
            <View style={{ marginTop: 16 }}>
              <RowHeader title="Popular Tracks" actionLabel="See all" onPress={() => router.push('/(tabs)/search')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {popularTracks.map((track, index) => {
                  const active = track.id === activeTrackId;

                  return (
                    <TVTouchable
                      key={track.id}
                      onPress={() => setActiveTrackId(track.id)}
                      hasTVPreferredFocus={index === 0}
                      style={{
                        width: 160,
                        marginRight: 12,
                        borderRadius: 20,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: active ? 'rgba(154,107,255,0.54)' : theme.colors.border,
                        backgroundColor: active ? 'rgba(154,107,255,0.12)' : theme.colors.surface,
                      }}
                      showFocusBorder={false}
                    >
                      <Image
                        source={{ uri: track.imageUrl }}
                        style={{ width: '100%', height: 124, borderRadius: 16 }}
                        resizeMode="cover"
                      />
                      <CustomText
                        variant="subtitle"
                        style={{ color: theme.colors.text.primary, marginTop: 10 }}
                        numberOfLines={1}
                      >
                        {track.title}
                      </CustomText>
                      <CustomText
                        variant="caption"
                        style={{ color: theme.colors.text.secondary, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        {track.subtitle}
                      </CustomText>
                    </TVTouchable>
                  );
                })}
              </ScrollView>
            </View>
          </FadeIn>

          <FadeIn delay={110}>
            <View style={{ marginTop: 18 }}>
              <RowHeader title="Recently Played" actionLabel="Open player" onPress={() => router.push('/(tabs)/PlaySection')} />
              <View style={{ gap: 8 }}>
                {recentlyPlayed.map((item) => (
                  <TVTouchable
                    key={item.id}
                    onPress={() => router.push('/(tabs)/PlaySection')}
                    style={{
                      minHeight: 64,
                      borderRadius: 16,
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48, borderRadius: 12 }} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                        {item.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                        {item.subtitle}
                      </CustomText>
                    </View>
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginRight: 8 }}>
                      {item.duration}
                    </CustomText>
                    <MaterialIcons name="play-circle-outline" size={22} color={theme.colors.primary} />
                  </TVTouchable>
                ))}
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={140}>
            <View style={{ marginTop: 18, gap: 14 }}>
              {channelSections.map((channel) => (
                <ChannelSectionCard
                  key={channel.id}
                  channel={channel}
                  cardWidth={sectionCardWidth}
                  onPlay={() => router.push('/(tabs)/PlaySection')}
                />
              ))}
            </View>
          </FadeIn>
        </Screen>
      </AnimatedScrollView>

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 84,
          },
          miniPlayerStyle,
        ]}
      >
        <TVTouchable
          onPress={() => router.push('/(tabs)/PlaySection')}
          style={{
            borderRadius: 20,
            padding: 10,
            borderWidth: 1,
            borderColor: 'rgba(227,218,246,0.2)',
            backgroundColor: theme.scheme === 'dark' ? 'rgba(17,13,29,0.84)' : 'rgba(255,255,255,0.9)',
            flexDirection: 'row',
            alignItems: 'center',
          }}
          showFocusBorder={false}
        >
          <Image
            source={{ uri: activeTrack.imageUrl }}
            style={{ width: 46, height: 46, borderRadius: 13, marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
              {activeTrack.title}
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
              {activeTrack.subtitle}
            </CustomText>
          </View>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primary,
            }}
          >
            <MaterialIcons name="play-arrow" size={20} color={theme.colors.text.inverse} />
          </View>
        </TVTouchable>
      </Animated.View>
    </TabScreenWrapper>
  );
}

function RowHeader({
  title,
  actionLabel,
  onPress,
}: {
  title: string;
  actionLabel: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
        {title}
      </CustomText>
      <TVTouchable onPress={onPress} showFocusBorder={false}>
        <CustomText variant="label" style={{ color: theme.colors.primary }}>
          {actionLabel}
        </CustomText>
      </TVTouchable>
    </View>
  );
}

function IconCircle({
  icon,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={18} color={theme.colors.text.primary} />
    </TVTouchable>
  );
}

function ChannelSectionCard({
  channel,
  cardWidth,
  onPlay,
}: {
  channel: ChannelSection;
  cardWidth: number;
  onPlay: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        padding: 12,
      }}
    >
      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
        {channel.title}
      </CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
        {channel.description}
      </CustomText>

      <View style={{ marginTop: 10 }}>
        <CustomText variant="label" style={{ color: theme.colors.primary, marginBottom: 6 }}>
          Music
        </CustomText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {channel.music.map((item) => (
            <TVTouchable
              key={item.id}
              onPress={onPlay}
              style={{
                width: cardWidth,
                marginRight: 10,
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
              }}
              showFocusBorder={false}
            >
              <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 96 }} />
              <View style={{ padding: 8 }}>
                <CustomText variant="body" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                  {item.title}
                </CustomText>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }} numberOfLines={1}>
                    {item.subtitle}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    {item.duration}
                  </CustomText>
                </View>
              </View>
            </TVTouchable>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginTop: 10 }}>
        <CustomText variant="label" style={{ color: theme.colors.primary, marginBottom: 6 }}>
          Videos
        </CustomText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {channel.videos.map((item) => (
            <TVTouchable
              key={item.id}
              onPress={onPlay}
              style={{
                width: cardWidth,
                marginRight: 10,
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
              }}
              showFocusBorder={false}
            >
              <View>
                <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 96 }} />
                <LinearGradient
                  colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.55)']}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 52 }}
                />
                <View
                  style={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: 'rgba(154,107,255,0.92)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="play-arrow" size={18} color="#fff" />
                </View>
              </View>
              <View style={{ padding: 8 }}>
                <CustomText variant="body" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                  {item.title}
                </CustomText>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }} numberOfLines={1}>
                    {item.subtitle}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    {item.duration}
                  </CustomText>
                </View>
              </View>
            </TVTouchable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
