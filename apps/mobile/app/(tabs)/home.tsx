import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/ui/AppButton';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { CustomText } from '../../components/CustomText';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { ContentType, FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import {
  ContentRail,
  EmptyState,
  PremiumHero,
  PremiumPage,
  QuickActionGrid,
} from '../../components/Exp/PremiumContent';

type SectionContentType = Exclude<ContentType, 'ad'>;

function isSectionContentType(type: ContentType): type is SectionContentType {
  return type !== 'ad';
}

function dedupe(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const result: FeedCardItem[] = [];

  for (const item of items) {
    const key =
      item.mediaUrl && item.mediaUrl.trim()
        ? `media:${item.mediaUrl.trim()}`
        : `id:${item.id}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

function CompactHomeRow({
  item,
  onPress,
}: {
  item: FeedCardItem;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
        }}
      >
        <Image
          source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
          resizeMode="cover"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: theme.colors.surfaceAlt,
          }}
        />

        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText
            variant="label"
            style={{ color: theme.colors.text }}
            numberOfLines={1}
          >
            {item.title}
          </CustomText>

          <CustomText
            variant="caption"
            style={{
              color: theme.colors.textSecondary,
              marginTop: 3,
            }}
            numberOfLines={1}
          >
            {[item.subtitle, item.duration].filter(Boolean).join(' · ')}
          </CustomText>
        </View>

        <MaterialIcons
          name="chevron-right"
          size={20}
          color={theme.colors.textMuted ?? theme.colors.textSecondary}
        />
      </View>
    </TVTouchable>
  );
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { feed, loading, refresh } = useContentFeed();
  const { config } = useMobileAppConfig();

  const featured = useMemo(
    () =>
      feed.featured ??
      feed.live[0] ??
      feed.music[0] ??
      feed.videos[0] ??
      feed.recommendations[0] ??
      null,
    [feed.featured, feed.live, feed.music, feed.recommendations, feed.videos],
  );

  const allContent = useMemo(
    () =>
      dedupe([
        ...feed.recommendations,
        ...feed.mostPlayed,
        ...feed.recent,
        ...feed.music,
        ...feed.videos,
        ...feed.live,
      ]),
    [
      feed.live,
      feed.mostPlayed,
      feed.music,
      feed.recent,
      feed.recommendations,
      feed.videos,
    ],
  );

  const continueItems = useMemo(
    () => dedupe([...feed.recent, ...feed.recommendations, ...feed.mostPlayed]).slice(0, 5),
    [feed.mostPlayed, feed.recent, feed.recommendations],
  );

  const configuredTabs = config?.navigation?.tabs ?? [];
  const configuredSections = config?.layout?.homeSections ?? [];

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });

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

  const configuredRails = configuredSections
    .map((section) => {
      const sectionItems = allContent
        .filter(
          (item) =>
            isSectionContentType(item.type) &&
            section.contentTypes.indexOf(item.type) >= 0,
        )
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
          leftIcon={
            <MaterialIcons name="search" size={16} color={theme.colors.text} />
          }
        />
      }
    >
      <PremiumHero
        item={featured}
        primaryLabel={
          featured?.isLive ? 'Watch live' : featured?.type === 'video' ? 'Watch now' : 'Play now'
        }
        primaryIcon={
          featured?.isLive ? 'live-tv' : featured?.type === 'video' ? 'smart-display' : 'play-arrow'
        }
        secondaryLabel="Browse all"
        secondaryIcon="search"
        onPrimary={featured ? () => void openItem(featured, 'home_hero') : undefined}
        onSecondary={() => router.push(APP_ROUTES.tabs.search)}
      />

      <QuickActionGrid actions={homeActions} />

      {continueItems.length ? (
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
          <View style={{ marginBottom: 10 }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Continue worshiping
            </CustomText>

            <CustomText
              variant="caption"
              style={{
                color: theme.colors.textSecondary,
                marginTop: 3,
              }}
            >
              Resume recent and recommended moments.
            </CustomText>
          </View>

          <View>
            {continueItems.slice(0, 3).map((item, index) => (
              <View
                key={`continue-${item.id}`}
                style={{
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.colors.border,
                }}
              >
                <CompactHomeRow
                  item={item}
                  onPress={() => void openItem(item, 'home_continue')}
                />
              </View>
            ))}
          </View>
        </SurfaceCard>
      ) : null}

      {configuredRails.map(({ section, items }) => (
        <View key={section.id}>
          <View style={{ marginBottom: 8 }}>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
              {section.subtitle}
            </CustomText>
          </View>

          <ContentRail
            title={section.title}
            items={items}
            onPressItem={(item) => void openItem(item, `home_${section.id}`)}
            actionLabel={section.actionLabel}
            onAction={() => router.push(TAB_ROUTE_BY_ID[section.destinationTab] as never)}
          />
        </View>
      ))}

      <View>
        <CustomText
          variant="caption"
          style={{
            color: theme.colors.textSecondary,
            marginBottom: 8,
          }}
        >
          Songs and worship audio ready to play.
        </CustomText>

        <ContentRail
          title="Music for now"
          items={feed.music.slice(0, 12)}
          onPressItem={(item) => void openItem(item, 'home_music')}
          actionLabel="Open music"
          onAction={() => router.push(APP_ROUTES.tabs.player)}
        />
      </View>

      <View>
        <CustomText
          variant="caption"
          style={{
            color: theme.colors.textSecondary,
            marginBottom: 8,
          }}
        >
          Messages, sessions, clips, and replays.
        </CustomText>

        <ContentRail
          title="Latest videos"
          items={feed.videos.slice(0, 12)}
          onPressItem={(item) => void openItem(item, 'home_videos')}
          actionLabel="Watch"
          onAction={() => router.push(APP_ROUTES.tabs.videos)}
        />
      </View>

      <View>
        <CustomText
          variant="caption"
          style={{
            color: theme.colors.textSecondary,
            marginBottom: 8,
          }}
        >
          Join live ministry or continue from the archive.
        </CustomText>

        <ContentRail
          title="Live and replays"
          items={feed.live.slice(0, 12)}
          onPressItem={(item) => void openItem(item, 'home_live')}
          actionLabel="Live hub"
          onAction={() => router.push(APP_ROUTES.tabs.live)}
        />
      </View>

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