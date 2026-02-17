import React, { useMemo, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { FadeIn } from '../../components/ui/FadeIn';
import { Screen } from '../../components/layout/Screen';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';

const topAlbums = [
  {
    id: 'a1',
    title: 'Die Lit',
    artist: 'Playboi Carti',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'a2',
    title: 'Joanne',
    artist: 'Lady Gaga',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'a3',
    title: 'Blue Neighbourhood',
    artist: 'Troye Sivan',
    imageUrl: 'https://images.unsplash.com/photo-1461783436728-0a9217714694?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'a4',
    title: 'The Dawn',
    artist: 'Oscar Hayes',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
  },
];

const popularTracks = [
  { id: 't1', title: 'Praise The Lord', artist: 'ASAP Rocky', duration: '3:25', imageUrl: 'https://images.unsplash.com/photo-1509869175650-a1d97972541a?auto=format&fit=crop&w=500&q=80' },
  { id: 't2', title: 'Circles', artist: 'Mac Miller', duration: '3:12', imageUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=500&q=80' },
  { id: 't3', title: 'Humble.', artist: 'Kendrick Lamar', duration: '3:22', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80' },
  { id: 't4', title: 'The Dawn', artist: 'Oscar Hayes', duration: '3:02', imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=500&q=80' },
];

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const [activeTrackId, setActiveTrackId] = useState(popularTracks[2].id);
  const activeTrack = useMemo(
    () => popularTracks.find((track) => track.id === activeTrackId) ?? popularTracks[0],
    [activeTrackId],
  );

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 220 }}
      >
        <Screen>
          <FadeIn>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: theme.spacing.md }}>
              <View>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                  Discover
                </CustomText>
                <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginTop: 2 }}>
                  Top Albums
                </CustomText>
              </View>
              <TVTouchable
                onPress={() => router.push('/(tabs)/search')}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surface,
                }}
                showFocusBorder={false}
              >
                <MaterialIcons name="search" size={20} color={theme.colors.text.primary} />
              </TVTouchable>
            </View>
          </FadeIn>

          <FadeIn delay={80}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: theme.spacing.sm }}>
              {topAlbums.map((album) => (
                <TVTouchable
                  key={album.id}
                  onPress={() => {
                    setActiveTrackId(popularTracks[2].id);
                    router.push('/(tabs)/PlaySection');
                  }}
                  style={{ width: compact ? 138 : 152, marginRight: theme.spacing.md }}
                  showFocusBorder={false}
                >
                  <Image
                    source={{ uri: album.imageUrl }}
                    style={{
                      width: '100%',
                      height: compact ? 148 : 164,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  />
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginTop: 8 }} numberOfLines={1}>
                    {album.title}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }} numberOfLines={1}>
                    {album.artist}
                  </CustomText>
                </TVTouchable>
              ))}
            </ScrollView>
          </FadeIn>

          <FadeIn delay={140}>
            <SurfaceCard style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                <CustomText variant="title" style={{ color: theme.colors.text.primary }}>
                  Popular
                </CustomText>
                <TVTouchable
                  onPress={() => router.push('/(tabs)/Favourites')}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${theme.colors.primary}16`,
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="chevron-right" size={18} color={theme.colors.primary} />
                </TVTouchable>
              </View>

              {popularTracks.map((track) => {
                const active = track.id === activeTrackId;
                return (
                  <TVTouchable
                    key={track.id}
                    onPress={() => setActiveTrackId(track.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 9,
                      paddingHorizontal: 8,
                      borderRadius: 14,
                      marginBottom: 6,
                      backgroundColor: active ? `${theme.colors.primary}18` : 'transparent',
                    }}
                    showFocusBorder={false}
                  >
                    <Image
                      source={{ uri: track.imageUrl }}
                      style={{ width: 44, height: 44, borderRadius: 12, marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                        {track.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
                        {track.artist}
                      </CustomText>
                    </View>
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginRight: 10 }}>
                      {track.duration}
                    </CustomText>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                      }}
                    >
                      <MaterialIcons
                        name={active ? 'pause' : 'play-arrow'}
                        size={17}
                        color={active ? theme.colors.text.inverse : theme.colors.text.primary}
                      />
                    </View>
                  </TVTouchable>
                );
              })}
            </SurfaceCard>
          </FadeIn>

          <FadeIn delay={220}>
            <View style={{ marginTop: theme.spacing.lg, flexDirection: 'row', gap: theme.spacing.sm }}>
              <AppButton
                title="Open Player"
                size="sm"
                variant="primary"
                onPress={() => router.push('/(tabs)/PlaySection')}
                leftIcon={<MaterialIcons name="music-note" size={16} color={theme.colors.text.inverse} />}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Your Profile"
                size="sm"
                variant="outline"
                onPress={() => router.push('/profile')}
                leftIcon={<MaterialIcons name="person" size={16} color={theme.colors.primary} />}
                style={{ flex: 1 }}
              />
            </View>
          </FadeIn>
        </Screen>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 82,
        }}
      >
        <TVTouchable
          onPress={() => router.push('/(tabs)/PlaySection')}
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: `${theme.colors.primary}55`,
            backgroundColor: theme.colors.surface,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            ...theme.shadows.card,
          }}
          showFocusBorder={false}
        >
          <Image source={{ uri: activeTrack.imageUrl }} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
              {activeTrack.title}
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
              {activeTrack.artist}
            </CustomText>
          </View>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primary,
            }}
          >
            <MaterialIcons name="pause" size={17} color={theme.colors.text.inverse} />
          </View>
        </TVTouchable>
      </View>
    </TabScreenWrapper>
  );
}
