import React, { useMemo, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
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
    title: 'DAMN',
    artist: 'Kendrick Lamar',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&q=80',
  },
];

const songs = [
  {
    id: 's1',
    title: 'Praise The Lord',
    artist: 'ASAP Rocky',
    duration: '3:25',
    imageUrl: 'https://images.unsplash.com/photo-1509869175650-a1d97972541a?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 's2',
    title: 'Circles',
    artist: 'Mac Miller',
    duration: '3:12',
    imageUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 's3',
    title: 'Humble.',
    artist: 'Kendrick Lamar',
    duration: '3:22',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 's4',
    title: 'The Dawn',
    artist: 'Oscar H.',
    duration: '3:02',
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=500&q=80',
  },
];

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const [activeSongId, setActiveSongId] = useState(songs[2].id);

  const activeSong = useMemo(
    () => songs.find((song) => song.id === activeSongId) ?? songs[0],
    [activeSongId],
  );

  const ui = {
    panel: theme.scheme === 'dark' ? '#161621' : '#EFEFF2',
    card: theme.scheme === 'dark' ? '#1E1E2C' : '#FFFFFF',
    text: theme.scheme === 'dark' ? '#F4F4F7' : '#15161A',
    subText: theme.scheme === 'dark' ? '#A6A6B2' : '#8A8B92',
    black: '#111217',
  };

  return (
    <TabScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 170 }}>
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 26,
                backgroundColor: ui.panel,
                padding: compact ? 14 : 16,
                borderWidth: 1,
                borderColor: theme.scheme === 'dark' ? '#28283A' : '#E3E3E8',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <CustomText variant="heading" style={{ color: ui.text }}>
                  Top Albums
                </CustomText>
                <TVTouchable
                  onPress={() => router.push('/(tabs)/search')}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: ui.card,
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="chevron-right" size={22} color={ui.text} />
                </TVTouchable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ marginTop: 14, paddingRight: 8 }}
              >
                {topAlbums.map((album, index) => (
                  <TVTouchable
                    key={album.id}
                    onPress={() => {
                      setActiveSongId('s3');
                      router.push('/(tabs)/PlaySection');
                    }}
                    hasTVPreferredFocus={index === 0}
                    style={{ width: compact ? 122 : 132, marginRight: 12 }}
                    showFocusBorder={false}
                  >
                    <Image
                      source={{ uri: album.imageUrl }}
                      style={{
                        width: '100%',
                        height: compact ? 136 : 146,
                        borderRadius: 16,
                      }}
                      resizeMode="cover"
                    />
                    <CustomText variant="subtitle" style={{ color: ui.text, marginTop: 8 }} numberOfLines={1}>
                      {album.title}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: ui.subText, marginTop: 1 }} numberOfLines={1}>
                      {album.artist}
                    </CustomText>
                  </TVTouchable>
                ))}
              </ScrollView>
            </View>
          </FadeIn>

          <FadeIn delay={90}>
            <View
              style={{
                borderRadius: 26,
                backgroundColor: ui.card,
                marginTop: 14,
                padding: compact ? 14 : 16,
                borderWidth: 1,
                borderColor: theme.scheme === 'dark' ? '#28283A' : '#E6E6EC',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <CustomText variant="heading" style={{ color: ui.text }}>
                  Popular
                </CustomText>
                <TVTouchable
                  onPress={() => router.push('/(tabs)/Favourites')}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.scheme === 'dark' ? '#242437' : '#F1F1F5',
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="chevron-right" size={22} color={ui.text} />
                </TVTouchable>
              </View>

              {songs.map((song) => {
                const active = song.id === activeSongId;
                return (
                  <TVTouchable
                    key={song.id}
                    onPress={() => setActiveSongId(song.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 16,
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      marginBottom: 4,
                      backgroundColor: active
                        ? theme.scheme === 'dark'
                          ? '#24243A'
                          : '#F4F4F7'
                        : 'transparent',
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: song.imageUrl }} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <CustomText variant="subtitle" style={{ color: ui.text }} numberOfLines={1}>
                        {song.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: ui.subText, marginTop: 2 }} numberOfLines={1}>
                        {song.artist}
                      </CustomText>
                    </View>
                    <CustomText variant="caption" style={{ color: ui.subText }}>
                      {song.duration}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </View>
          </FadeIn>
        </Screen>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 86,
        }}
      >
        <TVTouchable
          onPress={() => router.push('/(tabs)/PlaySection')}
          style={{
            borderRadius: 18,
            padding: 10,
            backgroundColor: ui.black,
            borderWidth: 1,
            borderColor: '#1F2127',
            flexDirection: 'row',
            alignItems: 'center',
          }}
          showFocusBorder={false}
        >
          <Image source={{ uri: activeSong.imageUrl }} style={{ width: 42, height: 42, borderRadius: 12, marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <CustomText variant="subtitle" style={{ color: '#FFFFFF' }} numberOfLines={1}>
              {activeSong.title}
            </CustomText>
            <CustomText variant="caption" style={{ color: '#C9CBD3', marginTop: 2 }} numberOfLines={1}>
              {activeSong.artist}
            </CustomText>
          </View>
          <MaterialIcons name="pause" size={26} color="#FFFFFF" />
        </TVTouchable>
      </View>
    </TabScreenWrapper>
  );
}
