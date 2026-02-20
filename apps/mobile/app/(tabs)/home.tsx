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
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { AudioPlayer, type AudioTrack } from '../../components/media/AudioPlayer';

const popularTracks = [
  {
    id: 't1',
    title: 'Worthy Is The Lamb',
    artist: 'ClaudyGod Live',
    duration: '4:18',
    imageUrl:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 't2',
    title: 'Morning Mercy',
    artist: 'Worship Team',
    duration: '3:52',
    imageUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 't3',
    title: 'Revival Fire',
    artist: 'Prayer Circle',
    duration: '5:01',
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 't4',
    title: 'Grace Upon Grace',
    artist: 'Nuggets Session',
    duration: '3:41',
    imageUrl:
      'https://images.unsplash.com/photo-1461783436728-0a9217714694?auto=format&fit=crop&w=900&q=80',
  },
];

const albums = [
  {
    id: 'al1',
    title: 'Night Worship',
    subtitle: 'Live recordings',
    imageUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'al2',
    title: 'Daily Bread',
    subtitle: 'Word + worship',
    imageUrl:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'al3',
    title: 'Prayer Room',
    subtitle: 'Deep prayer flow',
    imageUrl:
      'https://images.unsplash.com/photo-1509869175650-a1d97972541a?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'al4',
    title: 'Victory Hymns',
    subtitle: 'Classic collection',
    imageUrl:
      'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=900&q=80',
  },
];

const recentlyPlayed = [
  {
    id: 'r1',
    title: 'The Name Above All Names',
    artist: 'ClaudyGod Messages',
    imageUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'r2',
    title: 'Faith Builder Daily',
    artist: 'Nuggets of Truth',
    imageUrl:
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'r3',
    title: 'Teens Worship Room',
    artist: 'Youth Channel',
    imageUrl:
      'https://images.unsplash.com/photo-1458560871784-56d23406c091?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'r4',
    title: 'Victory Hour',
    artist: 'Worship Hour',
    imageUrl:
      'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=900&q=80',
  },
];

const ministrySections = [
  'ClaudyGod Music',
  'ClaudyGod Nuggets of Truth',
  'ClaudyGod Worship Hour',
  'ClaudyGod Teens Youth Channel',
  'ClaudyGod Messages',
  'ClaudyGod Music (Audio)',
  'ClaudyGod Worship Hour (Audio)',
];

const previewTrack: AudioTrack = {
  id: 'preview-a1',
  title: 'Worship Hour (Audio) - Prayer Stream',
  artist: 'ClaudyGod Worship Hour',
  uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  duration: '4:32',
};

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
        translateY: interpolate(scrollY.value, [0, 280], [0, -66], Extrapolate.CLAMP),
      },
      {
        scale: interpolate(scrollY.value, [-110, 0], [1.16, 1], Extrapolate.CLAMP),
      },
    ],
  }));

  const miniPlayerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 230], [0, -14], Extrapolate.CLAMP),
      },
    ],
    opacity: interpolate(scrollY.value, [0, 40, 230], [1, 1, 0.92], Extrapolate.CLAMP),
  }));

  const albumTileWidth = Math.min(230, (width - 52) / 2);

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

              <View style={{ position: 'absolute', top: 16, left: 16 }}>
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

          <FadeIn delay={70}>
            <View style={{ marginTop: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                  Popular Tracks
                </CustomText>
                <TVTouchable onPress={() => router.push('/(tabs)/search')} showFocusBorder={false}>
                  <CustomText variant="label" style={{ color: theme.colors.primary }}>
                    See all
                  </CustomText>
                </TVTouchable>
              </View>

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
                        {track.artist}
                      </CustomText>
                    </TVTouchable>
                  );
                })}
              </ScrollView>
            </View>
          </FadeIn>

          <FadeIn delay={100}>
            <View style={{ marginTop: 16 }}>
              <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginBottom: 12 }}>
                Albums
              </CustomText>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  rowGap: 12,
                }}
              >
                {albums.map((album) => (
                  <TVTouchable
                    key={album.id}
                    onPress={() => router.push('/(tabs)/PlaySection')}
                    style={{
                      width: albumTileWidth,
                      borderRadius: 20,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      overflow: 'hidden',
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: album.imageUrl }} style={{ width: '100%', height: 116 }} />
                    <View style={{ padding: 12 }}>
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                        {album.title}
                      </CustomText>
                      <CustomText
                        variant="caption"
                        style={{ color: theme.colors.text.secondary, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        {album.subtitle}
                      </CustomText>
                    </View>
                  </TVTouchable>
                ))}
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={130}>
            <View style={{ marginTop: 18 }}>
              <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginBottom: 10 }}>
                Recently Played
              </CustomText>

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
                        {item.artist}
                      </CustomText>
                    </View>
                    <MaterialIcons name="play-circle-outline" size={22} color={theme.colors.primary} />
                  </TVTouchable>
                ))}
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={150}>
            <View
              style={{
                marginTop: 18,
                borderRadius: 20,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: 14,
              }}
            >
              <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                Featured Channels
              </CustomText>
              <View style={{ marginTop: 10, gap: 8 }}>
                {ministrySections.map((title, index) => (
                  <TVTouchable
                    key={title}
                    onPress={() => router.push('/(tabs)/PlaySection')}
                    style={{
                      borderRadius: 14,
                      backgroundColor: theme.colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    showFocusBorder={false}
                  >
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(154,107,255,0.16)',
                        marginRight: 10,
                      }}
                    >
                      <MaterialIcons
                        name={index >= 5 ? 'graphic-eq' : 'ondemand-video'}
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <CustomText variant="body" style={{ color: theme.colors.text.primary, flex: 1 }}>
                      {title}
                    </CustomText>
                    <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.secondary} />
                  </TVTouchable>
                ))}
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={180}>
            <View style={{ marginTop: 18 }}>
              <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginBottom: 10 }}>
                ClaudyGod Worship Hour (Video)
              </CustomText>
              <VideoPlayer
                title="Watch live worship replay"
                sourceUri="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
                height={220}
              />
            </View>
          </FadeIn>

          <FadeIn delay={210}>
            <View style={{ marginTop: 18 }}>
              <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginBottom: 10 }}>
                ClaudyGod Music (Audio)
              </CustomText>
              <AudioPlayer track={previewTrack} autoPlay={false} />
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
            backgroundColor:
              theme.scheme === 'dark' ? 'rgba(17,13,29,0.84)' : 'rgba(255,255,255,0.9)',
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
            <CustomText
              variant="caption"
              style={{ color: theme.colors.text.secondary, marginTop: 2 }}
              numberOfLines={1}
            >
              {activeTrack.artist}
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
