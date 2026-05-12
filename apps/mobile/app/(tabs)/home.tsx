import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
import { CustomText } from '../../components/CustomText';
import { useAuth } from '../../context/AuthContext';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useWordOfDay } from '../../hooks/useWordOfDay';
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
  const { isAuthenticated } = useAuth();
  const { feed, loading, refresh } = useContentFeed();
  const { config } = useMobileAppConfig();
  const { word } = useWordOfDay();

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
    .slice(0, 2);

  return (
    <PremiumPage
      title="ClaudyGod"
      eyebrow="Home"
      refreshing={loading}
      onRefresh={() => void refresh()}
    >
      <PremiumHero
        item={featured}
        title={featured ? undefined : 'Start your worship stream'}
        subtitle={featured ? undefined : 'Music, videos, and live moments in one focused space.'}
        eyebrow={featured ? undefined : 'Start here'}
        primaryLabel={
          featured?.isLive ? 'Watch live' : featured?.type === 'video' ? 'Watch now' : featured ? 'Play now' : 'Open music'
        }
        primaryIcon={
          featured?.isLive ? 'live-tv' : featured?.type === 'video' ? 'smart-display' : featured ? 'play-arrow' : 'graphic-eq'
        }
        secondaryLabel="Browse all"
        secondaryIcon="search"
        onPrimary={featured ? () => void openItem(featured, 'home_hero') : () => router.push(APP_ROUTES.tabs.player)}
        onSecondary={() => router.push(APP_ROUTES.tabs.search)}
      />

      <QuickActionGrid actions={homeActions} />

      {!isAuthenticated ? (
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)',
              }}
            >
              <MaterialIcons name="lock-open" size={19} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <CustomText variant="label" style={{ color: theme.colors.text }}>
                Browsing as guest
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3, lineHeight: 17 }}>
                Stream public music and videos now. Sign in for saved library, history, alerts, and playlists.
              </CustomText>
            </View>
            <TVTouchable onPress={() => router.push(APP_ROUTES.auth.signIn)} showFocusBorder={false}>
              <MaterialIcons name="login" size={22} color={theme.colors.primary} />
            </TVTouchable>
          </View>
        </SurfaceCard>
      ) : null}

      {word ? (
        <TVTouchable onPress={() => router.push(APP_ROUTES.settingsPages.word)} showFocusBorder={false}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(17,10,31,0.05)',
                }}
              >
                <MaterialIcons name="auto-stories" size={19} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 }}>
                  Word for today
                </CustomText>
                <CustomText variant="title" style={{ color: theme.colors.text, marginTop: 3 }} numberOfLines={1}>
                  {word.title || word.passage}
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 5, lineHeight: 17 }} numberOfLines={2}>
                  {word.verse || word.reflection}
                </CustomText>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </View>
          </SurfaceCard>
        </TVTouchable>
      ) : null}

      <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />

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
            loading={loading}
          />
        </View>
      ))}

      <ContentRail
        title="For your moment"
        subtitle="Songs, worship audio, and messages."
        items={feed.music.slice(0, 12)}
        onPressItem={(item) => void openItem(item, 'home_music')}
        actionLabel="Music"
        onAction={() => router.push(APP_ROUTES.tabs.player)}
        loading={loading}
        emptyTitle="Music is being refreshed"
        emptyMessage="Browse videos, live moments, or search while this row updates."
      />

      <ContentRail
        title="Watch next"
        subtitle="Messages, sessions, clips, and replays."
        items={feed.videos.slice(0, 12)}
        onPressItem={(item) => void openItem(item, 'home_videos')}
        actionLabel="Videos"
        onAction={() => router.push(APP_ROUTES.tabs.videos)}
        loading={loading}
        emptyTitle="Videos are being refreshed"
        emptyMessage="Explore music or live moments while this row updates."
      />

      <ContentRail
        title="Live ministry"
        subtitle="Current sessions, upcoming moments, and replays."
        items={feed.live.slice(0, 12)}
        onPressItem={(item) => void openItem(item, 'home_live')}
        actionLabel="Live"
        onAction={() => router.push(APP_ROUTES.tabs.live)}
        loading={loading}
        emptyTitle="No live sessions right now"
        emptyMessage="Replays and new sessions will appear here when they are ready."
      />

      {!loading && !allContent.length ? (
        <EmptyState
          title="Your experience is ready"
          message="Use Search, Music, Videos, or Live to start exploring."
          icon="auto-awesome"
          actionLabel="Search"
          onAction={() => router.push(APP_ROUTES.tabs.search)}
        />
      ) : null}
    </PremiumPage>
  );
}
