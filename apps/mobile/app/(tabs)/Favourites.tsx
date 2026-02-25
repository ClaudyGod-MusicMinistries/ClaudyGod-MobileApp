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

export default function Favourites() {
  const theme = useAppTheme();
  const router = useRouter();

  const liked = useMemo(() => favouriteSongs.slice(0, 5), []);
  const downloaded = useMemo(() => recentlyAdded.slice(0, 4), []);
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
                borderRadius: 22,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                padding: 14,
              }}
            >
              <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                Library
              </CustomText>
              <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                Liked Songs, Downloaded, and Playlists in one clean layout.
              </CustomText>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <StatChip label="Liked Songs" value={liked.length} />
                <StatChip label="Downloaded" value={downloaded.length} />
                <StatChip label="Playlists" value={playlists.length} />
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={80}>
            <SectionHeader title="Liked Songs" actionLabel="Open player" onPress={() => router.push('/(tabs)/PlaySection')} />
            <View style={{ gap: 8 }}>
              {liked.map((song) => (
                <LibraryRow
                  key={song.id}
                  title={song.title}
                  subtitle={song.artist}
                  trailing={song.duration}
                  imageUrl={song.imageUrl}
                  onPress={() => router.push('/(tabs)/PlaySection')}
                />
              ))}
            </View>
          </FadeIn>

          <FadeIn delay={110}>
            <SectionHeader title="Downloaded" actionLabel="Manage" onPress={() => console.log('manage downloads')} />
            <View style={{ gap: 8 }}>
              {downloaded.map((song) => (
                <LibraryRow
                  key={song.id}
                  title={song.title}
                  subtitle={song.artist}
                  trailing={song.duration}
                  imageUrl={song.imageUrl}
                  onPress={() => router.push('/(tabs)/PlaySection')}
                />
              ))}
            </View>
          </FadeIn>

          <FadeIn delay={140}>
            <SectionHeader title="Playlists" actionLabel="Create" onPress={() => console.log('create playlist')} />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
              {playlists.map((playlist) => (
                <TVTouchable
                  key={playlist.id}
                  onPress={() => router.push('/(tabs)/PlaySection')}
                  style={{
                    width: '48.4%',
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                  showFocusBorder={false}
                >
                  <Image source={{ uri: playlist.imageUrl }} style={{ width: '100%', height: 96 }} />
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

          <FadeIn delay={170}>
            <View
              style={{
                marginTop: 18,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: 'rgba(156,118,227,0.24)',
                backgroundColor: 'rgba(154,107,255,0.08)',
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                <MaterialIcons name="favorite" size={20} color={theme.colors.primary} />
                <CustomText variant="body" style={{ color: theme.colors.text.primary, marginLeft: 8 }}>
                  Softer card and divider treatment enabled.
                </CustomText>
              </View>
              <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
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

function StatChip({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        paddingVertical: 8,
        paddingHorizontal: 8,
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

function LibraryRow({
  title,
  subtitle,
  trailing,
  imageUrl,
  onPress,
}: {
  title: string;
  subtitle: string;
  trailing: string;
  imageUrl: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        minHeight: 64,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(136,120,168,0.22)',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: imageUrl }} style={{ width: 48, height: 48, borderRadius: 12 }} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <CustomText variant="body" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
          {title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
          {subtitle}
        </CustomText>
      </View>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
        {trailing}
      </CustomText>
    </TVTouchable>
  );
}
