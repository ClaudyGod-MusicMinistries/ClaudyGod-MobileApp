import React from 'react';
import { Image, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
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
import type { FeedCardItem } from '../../services/contentService';
import { buildPlayerRoute } from '../../util/playerRoute';

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const isCompact = width < 360;

  const { feed } = useContentFeed();

  const liked = feed.mostPlayed;
  const downloaded = feed.music;
  const playlists = feed.playlists;

  const playlistWidth = isTV ? '23.5%' : isTablet ? '31.8%' : '48.5%';

  const openPlayer = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    router.push(buildPlayerRoute(item));
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 150 }}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
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
                    Saved tracks, downloads, and playlists.
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

              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <StatCard label="Liked" value={liked.length} style={{ flexBasis: isCompact ? '48%' : '31.8%' }} />
                <StatCard
                  label="Downloaded"
                  value={downloaded.length}
                  style={{ flexBasis: isCompact ? '48%' : '31.8%' }}
                />
                <StatCard
                  label="Playlists"
                  value={playlists.length}
                  style={{ flexBasis: isCompact ? '48%' : '31.8%' }}
                />
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={90}>
            <SectionHeader title="Liked Songs" actionLabel="Play all" onPress={() => router.push('/(tabs)/PlaySection')} />
            {liked.length > 0 ? (
              <View style={{ gap: 8 }}>
                {liked.slice(0, 8).map((song) => (
                  <ListRow
                    key={song.id}
                    title={song.title}
                    subtitle={song.subtitle}
                    meta={song.duration}
                    imageUrl={song.imageUrl}
                    onPress={() => openPlayer(song, 'library_liked')}
                  />
                ))}
              </View>
            ) : (
              <EmptyHint text="No liked songs yet." />
            )}
          </FadeIn>

          <FadeIn delay={120}>
            <SectionHeader title="Downloaded" actionLabel="Manage" onPress={() => router.push('/(tabs)/library')} />
            {downloaded.length > 0 ? (
              <View style={{ gap: 8 }}>
                {downloaded.slice(0, 8).map((song) => (
                  <ListRow
                    key={song.id}
                    title={song.title}
                    subtitle={song.subtitle}
                    meta={song.duration}
                    imageUrl={song.imageUrl}
                    onPress={() => openPlayer(song, 'library_downloaded')}
                  />
                ))}
              </View>
            ) : (
              <EmptyHint text="No downloaded songs yet." />
            )}
          </FadeIn>

          <FadeIn delay={150}>
            <SectionHeader title="Playlists" actionLabel="Create" onPress={() => router.push('/(tabs)/search')} />
            {playlists.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
                {playlists.map((playlist) => (
                  <TVTouchable
                    key={playlist.id}
                    onPress={() => openPlayer(playlist, 'library_playlist')}
                    style={{
                      width: playlistWidth,
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
                        {playlist.subtitle}
                      </CustomText>
                    </View>
                  </TVTouchable>
                ))}
              </View>
            ) : (
              <EmptyHint text="No playlists yet." />
            )}
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

function StatCard({ label, value, style }: { label: string; value: number; style?: object }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flexGrow: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        paddingHorizontal: 8,
        paddingVertical: 8,
        ...(style || {}),
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

function EmptyHint({ text }: { text: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.surface,
      }}
    >
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
        {text}
      </CustomText>
    </View>
  );
}
