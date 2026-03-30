import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { PosterCard } from '../../components/ui/PosterCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import type { FeedCardItem } from '../../services/contentService';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchMeLibrary, type MeLibrary, type MeLibraryItem } from '../../services/userFlowService';
import { getLibraryLayoutSections, type MobileLayoutSection } from '../../util/mobileLayout';
import { useAuth } from '../../context/AuthContext';

function toFeedCardItem(item: MeLibraryItem): FeedCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    duration: item.duration || '--:--',
    imageUrl: item.imageUrl || '',
    mediaUrl: item.mediaUrl,
    type: item.type,
    createdAt: item.createdAt,
  };
}

function buildPlaylistCards(playlists: MeLibrary['playlists']): FeedCardItem[] {
  return playlists.map((playlist, index) => {
    const seed = playlist.items[0];
    return {
      id: `playlist:${playlist.name}:${index}`,
      title: playlist.name,
      subtitle: `${playlist.items.length} saved item${playlist.items.length === 1 ? '' : 's'}`,
      description: seed?.description || 'Saved listening gathered inside your library.',
      duration: seed?.duration || '--:--',
      imageUrl: seed?.imageUrl || '',
      mediaUrl: seed?.mediaUrl,
      type: 'playlist',
      createdAt: seed?.createdAt,
    };
  });
}

function dedupeItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deriveLibraryItems(
  section: MobileLayoutSection,
  params: {
    liked: FeedCardItem[];
    downloaded: FeedCardItem[];
    playlists: FeedCardItem[];
    fallback: FeedCardItem[];
  },
): FeedCardItem[] {
  const token = `${section.id} ${section.title}`.toLowerCase();
  if (token.includes('most-played')) {
    return params.liked.slice(0, section.maxItems);
  }
  if (token.includes('saved') || token.includes('music')) {
    return params.downloaded.slice(0, section.maxItems);
  }
  if (token.includes('playlist')) {
    return params.playlists.slice(0, section.maxItems);
  }

  return params.fallback
    .filter(
      (item) =>
        item.type !== 'ad' &&
        section.contentTypes.includes(item.type),
    )
    .slice(0, section.maxItems);
}

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const posterSize = isTablet ? 'lg' : 'md';
  const { feed } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();
  const [library, setLibrary] = useState<MeLibrary | null>(null);

  useEffect(() => {
    let active = true;

    if (!isAuthenticated) {
      setLibrary(null);
      return () => {
        active = false;
      };
    }

    void fetchMeLibrary()
      .then((response) => {
        if (!active) return;
        setLibrary(response);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const liked = useMemo(
    () => (library?.liked.length ? library.liked.map(toFeedCardItem) : feed.mostPlayed),
    [library?.liked, feed.mostPlayed],
  );
  const downloaded = useMemo(
    () => (library?.downloaded.length ? library.downloaded.map(toFeedCardItem) : feed.music),
    [library?.downloaded, feed.music],
  );
  const playlists = useMemo(
    () => (library?.playlists.length ? buildPlaylistCards(library.playlists) : feed.playlists),
    [library?.playlists, feed.playlists],
  );
  const fallbackPool = useMemo(
    () => dedupeItems([...liked, ...downloaded, ...playlists, ...feed.recent, ...feed.playlists]),
    [downloaded, feed.playlists, feed.recent, liked, playlists],
  );
  const librarySections = useMemo(() => getLibraryLayoutSections(mobileConfig), [mobileConfig]);

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    router.push(buildPlayerRoute(item));
  };

  if (!isAuthenticated) {
    const guestPreview = dedupeItems([...feed.mostPlayed, ...feed.music, ...feed.videos, ...feed.recent]).slice(0, 10);

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
                  subtitle="Save worship tracks, replays, and playlists to your personal space."
                  actions={[
                    { icon: 'search', onPress: () => router.push(APP_ROUTES.tabs.search), accessibilityLabel: 'Search' },
                  ]}
                />
              </FadeIn>

              <FadeIn delay={60}>
                <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
                  <View style={{ gap: 12 }}>
                    <View style={{ gap: 6 }}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: theme.colors.textSecondary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                        }}
                      >
                        Personal library
                      </CustomText>
                      <CustomText variant="heading" style={{ color: theme.colors.text }}>
                        Sign in to save what matters
                      </CustomText>
                      <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>
                        Keep your music, video replays, playlists, and history in one place across devices.
                      </CustomText>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <AppButton
                        title="Create Account"
                        size="sm"
                        onPress={() => router.push(APP_ROUTES.auth.signUp)}
                      />
                      <AppButton
                        title="Sign In"
                        variant="secondary"
                        size="sm"
                        onPress={() => router.push(APP_ROUTES.auth.signIn)}
                      />
                    </View>
                  </View>
                </SurfaceCard>
              </FadeIn>

              {guestPreview.length ? (
                <FadeIn delay={100}>
                  <View>
                    <SectionHeader
                      title="Keep listening"
                      actionLabel="Home"
                      onAction={() => router.push(APP_ROUTES.tabs.home)}
                    />
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                      Browse the app freely, then sign in when you want to save your collection.
                    </CustomText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                      {guestPreview.map((item) => (
                        <PosterCard
                          key={`guest-library-${item.id}`}
                          imageUrl={item.imageUrl}
                          title={item.title}
                          subtitle={item.subtitle}
                          size={posterSize}
                          onPress={() => void openItem(item, 'library_guest_preview')}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </FadeIn>
              ) : null}
            </View>
          </Screen>
        </ScrollView>
      </TabScreenWrapper>
    );
  }

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

            {librarySections.map((section, index) => {
              const items = deriveLibraryItems(section, {
                liked,
                downloaded,
                playlists,
                fallback: fallbackPool,
              });

              if (!items.length) {
                return null;
              }

              return (
                <FadeIn key={section.id} delay={100 + index * 40}>
                  <View>
                    <SectionHeader
                      title={section.title}
                      actionLabel={section.actionLabel}
                      onAction={() => router.push(TAB_ROUTE_BY_ID[section.destinationTab])}
                    />
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                      {section.subtitle}
                    </CustomText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                      {items.map((item) => (
                        <PosterCard
                          key={`${section.id}-${item.id}`}
                          imageUrl={item.imageUrl}
                          title={item.title}
                          subtitle={item.subtitle}
                          size={posterSize}
                          onPress={() => void openItem(item, `library_${section.id}`)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </FadeIn>
              );
            })}
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
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </CustomText>
      <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 6 }}>
        {value}
      </CustomText>
    </View>
  );
}
