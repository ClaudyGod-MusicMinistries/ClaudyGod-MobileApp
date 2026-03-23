import React from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { PosterCard } from '../../components/ui/PosterCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const posterSize = isTablet ? 'lg' : 'md';
  const { feed } = useContentFeed();

  const liked = feed.mostPlayed;
  const downloaded = feed.music;
  const playlists = feed.playlists;

  const openItem = async (item: FeedCardItem, source: string) => {
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
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge }}>
            <FadeIn>
              <BrandedHeaderCard
                title="Library"
                subtitle="Saved listening, playlists, and recent picks."
                actions={[
                  { icon: 'search', onPress: () => router.push(APP_ROUTES.tabs.search), accessibilityLabel: 'Search' },
                ]}
              />
            </FadeIn>

            <FadeIn delay={60}>
              <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <StatCard label="Most played" value={liked.length} />
                  <StatCard label="Saved audio" value={downloaded.length} />
                  <StatCard label="Playlists" value={playlists.length} />
                </View>
              </SurfaceCard>
            </FadeIn>

            <FadeIn delay={100}>
              <View>
                <SectionHeader
                  title="Most played"
                  actionLabel="Play"
                  onAction={() => {
                    const item = liked[0];
                    if (item) {
                      void openItem(item, 'library_most_played');
                    }
                  }}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                  {liked.map((item) => (
                    <PosterCard
                      key={item.id}
                      imageUrl={item.imageUrl}
                      title={item.title}
                      subtitle={item.subtitle}
                      size={posterSize}
                      onPress={() => void openItem(item, 'library_most_played')}
                    />
                  ))}
                </ScrollView>
              </View>
            </FadeIn>

            <FadeIn delay={140}>
              <View>
                <SectionHeader
                  title="Saved music"
                  actionLabel="Music"
                  onAction={() => router.push(APP_ROUTES.tabs.player)}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                  {downloaded.map((item) => (
                    <PosterCard
                      key={item.id}
                      imageUrl={item.imageUrl}
                      title={item.title}
                      subtitle={item.subtitle}
                      size={posterSize}
                      onPress={() => void openItem(item, 'library_saved')}
                    />
                  ))}
                </ScrollView>
              </View>
            </FadeIn>

            <FadeIn delay={180}>
              <View>
                <SectionHeader
                  title="Playlists"
                  actionLabel="Search"
                  onAction={() => router.push(APP_ROUTES.tabs.search)}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                  {playlists.map((item) => (
                    <PosterCard
                      key={item.id}
                      imageUrl={item.imageUrl}
                      title={item.title}
                      subtitle={item.subtitle}
                      size={posterSize}
                      onPress={() => void openItem(item, 'library_playlists')}
                    />
                  ))}
                </ScrollView>
              </View>
            </FadeIn>
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        paddingHorizontal: 12,
        paddingVertical: 14,
      }}
    >
      <CustomText
        variant="caption"
        style={{
          color: theme.colors.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </CustomText>
      <CustomText variant="display" style={{ color: theme.colors.text.primary, marginTop: 6 }}>
        {value}
      </CustomText>
    </View>
  );
}
