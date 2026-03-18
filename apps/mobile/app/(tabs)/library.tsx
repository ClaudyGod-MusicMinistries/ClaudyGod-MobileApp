import React from 'react';
import { Image, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { SectionHeader as AppSectionHeader } from '../../components/ui/SectionHeader';
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
  const isDark = theme.scheme === 'dark';

  const { feed } = useContentFeed();

  const liked = feed.mostPlayed;
  const downloaded = feed.music;
  const playlists = feed.playlists;

  const playlistWidth = isTV ? '23.5%' : isTablet ? '31.8%' : '100%';

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
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        stickyHeaderIndices={[0]}
      >
        <View
          style={{
            backgroundColor: isDark ? '#06040D' : theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
          }}
        >
          <LinearGradient
            colors={[isDark ? 'rgba(154,107,255,0.06)' : 'rgba(109,40,217,0.08)', 'rgba(0,0,0,0)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none' }}
          />
          <Screen>
            <FadeIn>
              <View
                style={{
                  paddingTop: theme.layout.headerVerticalPadding,
                  paddingBottom: theme.spacing.sm,
                }}
              >
                <BrandedHeaderCard
                  title="Library"
                  subtitle="Saved songs, downloads and playlists organized for playback."
                  actions={[
                    { icon: 'search', onPress: () => router.push('/(tabs)/search'), accessibilityLabel: 'Search' },
                    { icon: 'person-outline', onPress: () => router.push('/profile'), accessibilityLabel: 'Profile' },
                  ]}
                  chips={[
                    { label: 'Liked' },
                    { label: 'Downloads' },
                    { label: 'Playlists' },
                  ]}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: theme.layout.sectionGap }}>
          <FadeIn>
            <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl }}>
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

              <View
                style={{
                  marginTop: theme.spacing.md,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  rowGap: theme.spacing.sm,
                }}
              >
                <StatCard label="Liked" value={liked.length} style={{ flexBasis: isTablet ? '31%' : '48%' }} />
                <StatCard
                  label="Downloaded"
                  value={downloaded.length}
                  style={{ flexBasis: isTablet ? '31%' : '48%' }}
                />
                <StatCard
                  label="Playlists"
                  value={playlists.length}
                  style={{ flexBasis: isTablet ? '31%' : '48%' }}
                />
              </View>
            </SurfaceCard>
          </FadeIn>

          <FadeIn delay={90}>
            <View style={{ marginTop: theme.layout.sectionGapLarge }}>
            <AppSectionHeader
              title="Liked Songs"
              actionLabel="Play all"
              onAction={() => {
                const firstLiked = liked[0];
                if (firstLiked) {
                  void openPlayer(firstLiked, 'library_liked_play_all');
                }
              }}
            />
            {liked.length > 0 ? (
              <View style={{ gap: theme.spacing.sm }}>
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
            </View>
          </FadeIn>

          <FadeIn delay={120}>
            <View style={{ marginTop: theme.layout.sectionGapLarge }}>
            <AppSectionHeader title="Downloaded" actionLabel="Manage" onAction={() => router.push('/(tabs)/library')} />
            {downloaded.length > 0 ? (
              <View style={{ gap: theme.spacing.sm }}>
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
            </View>
          </FadeIn>

          <FadeIn delay={150}>
            <View style={{ marginTop: theme.layout.sectionGapLarge }}>
            <AppSectionHeader title="Playlists" actionLabel="Create" onAction={() => router.push('/(tabs)/search')} />
            {playlists.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: theme.spacing.md }}>
                {playlists.map((playlist) => (
                  <TVTouchable
                    key={playlist.id}
                    onPress={() => openPlayer(playlist, 'library_playlist')}
                    style={{
                      width: playlistWidth,
                      borderRadius: theme.radius.lg,
                      overflow: 'hidden',
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: playlist.imageUrl }} style={{ width: '100%', height: 150 }} />
                    <View style={{ padding: theme.spacing.md }}>
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
            </View>
          </FadeIn>
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function StatCard({ label, value, style }: { label: string; value: number; style?: object }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flexGrow: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        paddingHorizontal: 12,
        paddingVertical: 12,
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
        minHeight: 76,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: imageUrl }} style={{ width: 56, height: 56, borderRadius: 14 }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
          {title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
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
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
      }}
    >
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
        {text}
      </CustomText>
    </View>
  );
}
