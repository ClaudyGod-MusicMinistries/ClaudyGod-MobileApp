import React, { useMemo } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { favouritePlaylists, favouriteSongs, recentlyAdded } from '../../data/data';

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  const liked = useMemo(() => favouriteSongs.slice(0, 8), []);
  const downloaded = useMemo(() => recentlyAdded.slice(0, 5), []);
  const playlists = useMemo(() => favouritePlaylists.slice(0, 6), []);

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 150 }}
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
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                    Your Library
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                    Spotify/Audiomack-style structure for easy content mapping.
                  </CustomText>
                </View>

                <TVTouchable
                  onPress={() => router.push('/(tabs)/search')}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="search" size={19} color={theme.colors.text.primary} />
                </TVTouchable>
              </View>

              <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
                <StatCard label="Liked" value={liked.length} />
                <StatCard label="Downloaded" value={downloaded.length} />
                <StatCard label="Playlists" value={playlists.length} />
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={90}>
            <SectionHeader title="Liked Songs" actionLabel="Play all" onPress={() => router.push('/(tabs)/PlaySection')} />
            <View style={{ gap: 8 }}>
              {liked.map((song) => (
                <ListRow
                  key={song.id}
                  title={song.title}
                  subtitle={song.artist}
                  meta={song.duration}
                  imageUrl={song.imageUrl}
                  onPress={() => router.push('/(tabs)/PlaySection')}
                />
              ))}
            </View>
          </FadeIn>

          <FadeIn delay={120}>
            <SectionHeader title="Downloaded" actionLabel="Manage" onPress={() => console.log('manage downloads')} />
            <View style={{ gap: 8 }}>
              {downloaded.map((song) => (
                <ListRow
                  key={song.id}
                  title={song.title}
                  subtitle={song.artist}
                  meta={song.duration}
                  imageUrl={song.imageUrl}
                  onPress={() => router.push('/(tabs)/PlaySection')}
                />
              ))}
            </View>
          </FadeIn>

          <FadeIn delay={150}>
            <SectionHeader title="Playlists" actionLabel="Create" onPress={() => console.log('create playlist')} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
              {playlists.map((playlist) => (
                <TVTouchable
                  key={playlist.id}
                  onPress={() => router.push('/(tabs)/PlaySection')}
                  style={{
                    width: '48.5%',
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                  showFocusBorder={false}
                >
                  <Image source={{ uri: playlist.imageUrl }} style={{ width: '100%', height: 106 }} />
                  <View style={{ padding: 10 }}>
                    <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                      {playlist.title}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                      {playlist.songCount} songs
                    </CustomText>
                  </View>
                </TVTouchable>
              ))}
            </View>
          </FadeIn>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function SectionHeader({
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
        marginTop: 18,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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

function StatCard({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        paddingHorizontal: 8,
        paddingVertical: 8,
      }}
    >
      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
        {value}
      </CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
        {label}
      </CustomText>
    </View>
  );
}

function ListRow({
  title,
  subtitle,
  meta,
  imageUrl,
  onPress,
}: {
  title: string;
  subtitle: string;
  meta: string;
  imageUrl: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        minHeight: 68,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: imageUrl }} style={{ width: 50, height: 50, borderRadius: 12 }} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <CustomText variant="body" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
          {title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
          {subtitle}
        </CustomText>
      </View>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
        {meta}
      </CustomText>
    </TVTouchable>
  );
}
