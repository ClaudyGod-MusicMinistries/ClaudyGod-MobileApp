import React, { useMemo } from 'react';
import { Image, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { TVTouchable } from '../../components/ui/TVTouchable';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
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
  ContentShortcut,
  ContentShortcuts,
  EmptyState,
  GreetingBanner,
  LiveNowBanner,
  PremiumHero,
  PremiumPage,
  SectionLabel,
  StreamingBanner,
  TrendingList,
  WordOfDayCard,
} from '../../components/Exp/PremiumContent';

type SectionContentType = Exclude<ContentType, 'ad'>;

function isSectionContentType(type: ContentType): type is SectionContentType {
  return type !== 'ad';
}

function dedupe(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const out: FeedCardItem[] = [];
  for (const item of items) {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (!seen.has(key)) { seen.add(key); out.push(item); }
  }
  return out;
}

// ─── Continue Listening Row ───────────────────────────────────────────────────

function ContinueRow({ items, onPress }: { items: FeedCardItem[]; onPress: (item: FeedCardItem) => void }) {
  const theme = useAppTheme();
  if (!items.length) return null;

  return (
    <View style={{ gap: 12 }}>
      <SectionLabel title="Continue listening" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 2 }}
      >
        {items.slice(0, 8).map((item) => (
          <TVTouchable key={item.id} onPress={() => onPress(item)} showFocusBorder={false}>
            <View style={{ alignItems: 'center', gap: 8, width: 72 }}>
              <View
                style={{
                  width: 64, height: 64, borderRadius: 16, overflow: 'hidden',
                  backgroundColor: theme.colors.surfaceAlt,
                }}
              >
                <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                <View
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="play-arrow" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </View>
              <Text
                style={{ color: theme.colors.textSecondary, fontSize: 10.5, textAlign: 'center', fontWeight: '500', lineHeight: 14 }}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </View>
          </TVTouchable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Guest Callout ────────────────────────────────────────────────────────────

function GuestCallout({ onSignIn }: { onSignIn: () => void }) {
  const theme = useAppTheme();
  return (
    <TVTouchable onPress={onSignIn} showFocusBorder={false}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          padding: 14, borderRadius: 16, borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <View
          style={{
            width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme.colors.card,
          }}
        >
          <MaterialIcons name="person-outline" size={18} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>
            Sign in for the full experience
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 11.5, marginTop: 2 }}>
            Save favorites, sync history, and unlock personalized feeds.
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.primary} />
      </View>
    </TVTouchable>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
          borderRadius: 16, borderWidth: 1,
          borderColor: theme.scheme === 'dark' ? 'rgba(96,165,250,0.18)' : 'rgba(37,99,235,0.14)',
          backgroundColor: theme.scheme === 'dark' ? 'rgba(96,165,250,0.06)' : 'rgba(96,165,250,0.04)',
        }}
      >
        <View
          style={{
            width: 38, height: 38, borderRadius: 10, overflow: 'hidden',
            backgroundColor: theme.colors.surfaceAlt, flexShrink: 0,
          }}
        >
          <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: '#60A5FA', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
            Ministry update
          </Text>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 11.5, marginTop: 2 }} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
      </View>
    </TVTouchable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isAuthenticated, user } = useAuth();
  const { feed, loading, refresh } = useContentFeed();
  const { config } = useMobileAppConfig();
  const { word } = useWordOfDay();
  const compact = width < 430;

  const featured = useMemo(
    () => feed.featured ?? feed.live[0] ?? feed.music[0] ?? feed.videos[0] ?? feed.recommendations[0] ?? null,
    [feed.featured, feed.live, feed.music, feed.recommendations, feed.videos],
  );

  const liveSessions = useMemo(() => feed.live.filter((item) => item.isLive), [feed.live]);

  const continueItems = useMemo(
    () => dedupe([...feed.recent, ...feed.recommendations, ...feed.mostPlayed]).slice(0, 8),
    [feed.mostPlayed, feed.recent, feed.recommendations],
  );

  const allContent = useMemo(
    () => dedupe([...feed.recommendations, ...feed.mostPlayed, ...feed.recent, ...feed.music, ...feed.videos, ...feed.live]),
    [feed.live, feed.mostPlayed, feed.music, feed.recent, feed.recommendations, feed.videos],
  );

  const configuredTabs = config?.navigation?.tabs ?? [];
  const configuredSections = config?.layout?.homeSections ?? [];

  const configuredRails = configuredSections
    .map((section) => {
      const sectionItems = allContent
        .filter((item) => isSectionContentType(item.type) && section.contentTypes.indexOf(item.type) >= 0)
        .slice(0, section.maxItems || 10);
      return { section, items: sectionItems };
    })
    .filter((entry) => entry.items.length > 0)
    .slice(0, 2);

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  const shortcuts = useMemo<ContentShortcut[]>(() => [
    {
      id: 'music',
      label: configuredTabs.find((t) => t.id === 'player')?.label ?? 'Music',
      icon: 'graphic-eq',
      color: '#8B5CF6',
      onPress: () => router.push(APP_ROUTES.tabs.player),
    },
    {
      id: 'videos',
      label: configuredTabs.find((t) => t.id === 'videos')?.label ?? 'Videos',
      icon: 'smart-display',
      color: '#60A5FA',
      onPress: () => router.push(APP_ROUTES.tabs.videos),
    },
    {
      id: 'live',
      label: configuredTabs.find((t) => t.id === 'live')?.label ?? 'Live',
      icon: 'live-tv',
      color: '#F87171',
      onPress: () => router.push(APP_ROUTES.tabs.live),
    },
    {
      id: 'library',
      label: 'Library',
      icon: 'library-music',
      color: '#FBBF24',
      onPress: () => router.push(APP_ROUTES.tabs.library),
    },
    {
      id: 'search',
      label: 'Search',
      icon: 'search',
      color: '#34D399',
      onPress: () => router.push(APP_ROUTES.tabs.search),
    },
  ], [configuredTabs, router]);

  return (
    <PremiumPage title="Home" eyebrow="Home" noBack refreshing={loading} onRefresh={() => void refresh()}>
      {/* Greeting */}
      <GreetingBanner name={user?.displayName} />

      {/* Featured Hero */}
      <PremiumHero
        item={featured}
        title={featured ? undefined : 'Start your worship stream'}
        subtitle={featured ? undefined : 'Music, videos, and live moments in one focused space.'}
        eyebrow={featured ? undefined : 'Start here'}
        primaryLabel={
          featured?.isLive ? 'Watch live' :
          featured?.type === 'video' ? 'Watch now' :
          featured ? 'Play now' : 'Open music'
        }
        primaryIcon={
          featured?.isLive ? 'live-tv' :
          featured?.type === 'video' ? 'smart-display' :
          featured ? 'play-arrow' : 'graphic-eq'
        }
        secondaryLabel="Explore all"
        secondaryIcon="apps"
        onPrimary={featured ? () => void openItem(featured, 'home_hero') : () => router.push(APP_ROUTES.tabs.player)}
        onSecondary={() => router.push(APP_ROUTES.tabs.search)}
      />

      {/* Content shortcuts */}
      <ContentShortcuts shortcuts={shortcuts} />

      {/* Live session banner (if any live now) */}
      {liveSessions[0] ? (
        <LiveNowBanner item={liveSessions[0]} onPress={() => void openItem(liveSessions[0]!, 'home_live_banner')} />
      ) : null}

      {/* Continue listening */}
      {continueItems.length > 0 ? (
        <ContinueRow items={continueItems} onPress={(item) => void openItem(item, 'home_continue')} />
      ) : null}

      {/* Backend-configured rails */}
      {configuredRails.map(({ section, items }) => (
        <View key={section.id} style={{ gap: 12 }}>
          <SectionLabel
            title={section.title}
            subtitle={section.subtitle}
            actionLabel={section.actionLabel}
            onAction={() => router.push(TAB_ROUTE_BY_ID[section.destinationTab] as never)}
          />
          <ContentRail
            title=""
            items={items}
            onPressItem={(item) => void openItem(item, `home_${section.id}`)}
            loading={loading}
          />
        </View>
      ))}

      {/* Music */}
      <View style={{ gap: 12 }}>
        <SectionLabel
          title="For your moment"
          actionLabel="See all"
          onAction={() => router.push(APP_ROUTES.tabs.player)}
        />
        <ContentRail
          title=""
          items={feed.music.slice(0, 12)}
          onPressItem={(item) => void openItem(item, 'home_music')}
          loading={loading}
          emptyTitle="Music is being refreshed"
          emptyMessage="Browse videos, live moments, or search while this row updates."
        />
      </View>

      {/* Trending chart */}
      {feed.mostPlayed.length > 0 ? (
        <TrendingList
          title="Most played"
          items={feed.mostPlayed.slice(0, 10)}
          onPressItem={(item) => void openItem(item, 'home_trending')}
          actionLabel="See all"
          onAction={() => router.push(APP_ROUTES.tabs.player)}
        />
      ) : null}

      {/* Announcement */}
      {feed.announcements[0] ? (
        <AnnouncementCard
          item={feed.announcements[0]}
          onPress={() => void openItem(feed.announcements[0]!, 'home_announcement')}
        />
      ) : null}

      {/* Videos */}
      <View style={{ gap: 12 }}>
        <SectionLabel
          title="Watch next"
          actionLabel="See all"
          onAction={() => router.push(APP_ROUTES.tabs.videos)}
        />
        <ContentRail
          title=""
          items={feed.videos.slice(0, 12)}
          onPressItem={(item) => void openItem(item, 'home_videos')}
          loading={loading}
          emptyTitle="Videos are being refreshed"
          emptyMessage="Explore music or live moments while this row updates."
        />
      </View>

      {/* Live replays (if no live now) */}
      {!liveSessions.length && feed.live.length > 0 ? (
        <View style={{ gap: 12 }}>
          <SectionLabel
            title="Live & replays"
            accent="Ministry"
            subtitle="Sessions and replay moments"
            actionLabel="See all"
            onAction={() => router.push(APP_ROUTES.tabs.live)}
          />
          <ContentRail
            title=""
            items={feed.live.slice(0, 10)}
            onPressItem={(item) => void openItem(item, 'home_live')}
            loading={loading}
            compact={compact}
          />
        </View>
      ) : null}

      {/* Word of day */}
      {word ? (
        <WordOfDayCard word={word} onPress={() => router.push(APP_ROUTES.settingsPages.word)} />
      ) : null}

      {/* Guest callout */}
      {!isAuthenticated ? (
        <GuestCallout onSignIn={() => router.push(APP_ROUTES.auth.signIn)} />
      ) : null}

      {/* Support */}
      <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />

      {/* Empty state */}
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