import React, { useMemo } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/ui/AppButton';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { CustomText } from '../../components/CustomText';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import {
  CompactContentRow,
  ContentRail,
  EmptyState,
  PremiumHero,
  PremiumPage,
  QuickActionGrid,
} from '../../components/Exp/PremiumContent';

function dedupe(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const result: FeedCardItem[] = [];

  for (const item of items) {
    const key = item.mediaUrl && item.mediaUrl.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { feed, loading, refresh } = useContentFeed();
  const { config } = useMobileAppConfig();

  const featured = useMemo(
    () => feed.featured ?? feed.live[0] ?? feed.music[0] ?? feed.videos[0] ?? feed.recommendations[0] ?? null,
    [feed.featured, feed.live, feed.music, feed.recommendations, feed.videos],
  );

  const allContent = useMemo(
    () => dedupe([...feed.recommendations, ...feed.mostPlayed, ...feed.recent, ...feed.music, ...feed.videos, ...feed.live]),
    [feed.live, feed.mostPlayed, feed.music, feed.recent, feed.recommendations, feed.videos],
  );

  const continueItems = useMemo(
    () => dedupe([...feed.recent, ...feed.recommendations, ...feed.mostPlayed]).slice(0, 5),
    [feed.mostPlayed, feed.recent, feed.recommendations],
  );

  const configuredTabs = config?.navigation?.tabs ?? [];

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  const homeActions = [
    {
      label: configuredTabs.find((tab) => tab.id === 'player')?.label ?? 'Music',
      hint: 'Songs and worship audio',
      icon: 'graphic-eq' as const,
      onPress: () => router.push(APP_ROUTES.tabs.player),
    },
    {
      label: configuredTabs.find((tab) => tab.id === 'videos')?.label ?? 'Videos',
      hint: 'Watch sessions and replays',
      icon: 'smart-display' as const,
      onPress: () => router.push(APP_ROUTES.tabs.videos),
    },
    {
      label: configuredTabs.find((tab) => tab.id === 'live')?.label ?? 'Live',
      hint: 'Join or replay live ministry',
      icon: 'live-tv' as const,
      onPress: () => router.push(APP_ROUTES.tabs.live),
    },
    {
      label: configuredTabs.find((tab) => tab.id === 'search')?.label ?? 'Search',
      hint: 'Find music and messages',
      icon: 'search' as const,
      onPress: () => router.push(APP_ROUTES.tabs.search),
    },
  ];

  const configuredSections = config?.layout?.homeSections ?? [];

  const configuredRails = configuredSections
    .map((section) => {
      const sectionItems = allContent
        .filter((item) => section.contentTypes.indexOf(item.type) >= 0)
        .slice(0, section.maxItems || 10);
      return { section, items: sectionItems };
    })
    .filter((entry) => entry.items.length > 0)
    .slice(0, 4);

  return (
    <PremiumPage
      title="ClaudyGod"
      subtitle="A focused space for worship, music, videos, live moments, and saved inspiration."
      eyebrow="Welcome"
      refreshing={loading}
      onRefresh={() => void refresh()}
      rightAction={
        <AppButton
          title="Search"
          variant="secondary"
          size="sm"
          onPress={() => router.push(APP_ROUTES.tabs.search)}
          leftIcon={<MaterialIcons name="search" size={16} color={theme.colors.text} />}
        />
      }
    >
      <PremiumHero
        item={featured}
        actionLabel={featured?.isLive ? 'Watch live' : featured?.type === 'video' ? 'Watch now' : 'Play now'}
        secondaryLabel="Browse all"
        onPrimaryPress={featured ? () => void openItem(featured, 'home_hero') : undefined}
        onSecondaryPress={() => router.push(APP_ROUTES.tabs.search)}
      />

      <QuickActionGrid actions={homeActions} />

      {continueItems.length ? (
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
          <View style={{ marginBottom: 12 }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Continue worshiping
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
              Resume recent and recommended moments.
            </CustomText>
          </View>
          <View style={{ gap: 10 }}>
            {continueItems.slice(0, 3).map((item) => (
              <CompactContentRow key={`continue-${item.id}`} item={item} onPress={() => void openItem(item, 'home_continue')} />
            ))}
          </View>
        </SurfaceCard>
      ) : null}

      {configuredRails.map(({ section, items }) => (
        <ContentRail
          key={section.id}
          title={section.title}
          subtitle={section.subtitle}
          items={items}
          onPressItem={(item) => void openItem(item, `home_${section.id}`)}
          actionLabel={section.actionLabel}
          onActionPress={() => router.push(TAB_ROUTE_BY_ID[section.destinationTab] as never)}
        />
      ))}

      <ContentRail
        title="Music for now"
        subtitle="Songs and worship audio ready to play."
        items={feed.music.slice(0, 12)}
        onPressItem={(item) => void openItem(item, 'home_music')}
        actionLabel="Open music"
        onActionPress={() => router.push(APP_ROUTES.tabs.player)}
      />

      <ContentRail
        title="Latest videos"
        subtitle="Messages, sessions, clips, and replays."
        items={feed.videos.slice(0, 12)}
        onPressItem={(item) => void openItem(item, 'home_videos')}
        actionLabel="Watch"
        onActionPress={() => router.push(APP_ROUTES.tabs.videos)}
      />

      <ContentRail
        title="Live and replays"
        subtitle="Join live ministry or continue from the archive."
        items={feed.live.slice(0, 12)}
        onPressItem={(item) => void openItem(item, 'home_live')}
        actionLabel="Live hub"
        onActionPress={() => router.push(APP_ROUTES.tabs.live)}
      />

      {!loading && !allContent.length ? (
        <EmptyState
          title="Fresh content is coming"
          message="Published music, videos, and live sessions will appear here as soon as they are available."
          icon="auto-awesome"
          actionLabel="Refresh"
          onAction={() => void refresh()}
        />
      ) : null}
    </PremiumPage>
  );
}
