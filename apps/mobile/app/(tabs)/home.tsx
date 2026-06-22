import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
import { useAuth } from '../../context/AuthContext';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { ContentType, FeedBundle, FeedCardItem } from '../../services/contentService';
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

// Builds all 4 sections at once with a shared exclusion set so each item only appears once.
// Priority per section: appSections tag → type fallback.
function buildSections(feed: FeedBundle, limit = 12) {
  const pool = dedupe([...feed.music, ...feed.videos, ...feed.playlists, ...feed.live]);
  const used = new Set<string>();

  function take(sectionId: string, fallbackTypes: ContentType[]): FeedCardItem[] {
    const available = pool.filter((item) => !used.has(item.id));
    const tagged = available.filter((item) => item.appSections?.includes(sectionId));
    const result =
      tagged.length >= 2
        ? tagged
        : available.filter((item) => (fallbackTypes as string[]).includes(item.type));
    const sliced = result.slice(0, limit);
    sliced.forEach((item) => used.add(item.id));
    return sliced;
  }

  return {
    music:   take('music', ['audio']),
    nuggets: take('nuggets-of-truth', ['video']),
    teens:   take('teens', ['video', 'playlist']),
    audio:   take('audio', ['audio', 'playlist']),
  };
}

// ─── Continue Row ─────────────────────────────────────────────────────────────

function ContinueRow({ items, onPress }: { items: FeedCardItem[]; onPress: (_item: FeedCardItem) => void }) {
  const theme = useAppTheme();
  if (!items.length) return null;

  return (
    <View style={{ gap: 12 }}>
      <SectionLabel title="Pick up where you left off" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingLeft: 20, paddingRight: 20, paddingVertical: 2 }}
      >
        {items.slice(0, 8).map((item) => (
          <TVTouchable key={item.id} onPress={() => onPress(item)} showFocusBorder={false}>
            <View style={{ alignItems: 'center', gap: 7, width: 68 }}>
              <View
                style={{
                  width: 60, height: 60, borderRadius: 14, overflow: 'hidden',
                  backgroundColor: theme.colors.surfaceAlt,
                }}
              >
                <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={{ width: 60, height: 60 }} />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="play-arrow" size={14} color="#FFFFFF" />
                  </View>
                </View>
              </View>
              <CustomText style={{ color: theme.colors.textSecondary, fontSize: 10, textAlign: 'center', fontWeight: '500', lineHeight: 13 }} numberOfLines={2}>
                {item.title}
              </CustomText>
            </View>
          </TVTouchable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Guest Callout ────────────────────────────────────────────────────────────

function GuestCallout({ onSignIn }: { onSignIn: () => void }) {
  return (
    <TVTouchable onPress={onSignIn} showFocusBorder={false}>
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.24)',
          backgroundColor: 'rgba(139,92,246,0.07)',
          overflow: 'hidden',
          padding: 20,
          gap: 14,
        }}
      >
        {/* Icon + heading */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(139,92,246,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(139,92,246,0.32)',
            }}
          >
            <MaterialIcons name="person-outline" size={22} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <CustomText style={{ color: '#F7F2FF', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 }}>
              Sign in for full access
            </CustomText>
            <CustomText style={{ color: 'rgba(247,242,255,0.50)', fontSize: 12.5, marginTop: 3 }}>
              Save your favourites, history, and live alerts.
            </CustomText>
          </View>
        </View>

        {/* CTA row */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 11,
              borderRadius: 12,
              backgroundColor: '#8B5CF6',
            }}
          >
            <MaterialIcons name="login" size={16} color="#FFFFFF" />
            <CustomText style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Sign in</CustomText>
          </View>
        </View>
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
          borderRadius: 14,
          backgroundColor: theme.colors.surface,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt, flexShrink: 0 }}>
          <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText style={{ color: 'rgba(247,242,255,0.45)', fontSize: 9.5, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
            Announcement
          </CustomText>
          <CustomText style={{ color: '#F7F2FF', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
            {item.title}
          </CustomText>
          {item.subtitle ? (
            <CustomText style={{ color: 'rgba(247,242,255,0.45)', fontSize: 11.5, marginTop: 2 }} numberOfLines={1}>
              {item.subtitle}
            </CustomText>
          ) : null}
        </View>
        <MaterialIcons name="chevron-right" size={18} color="rgba(247,242,255,0.35)" />
      </View>
    </TVTouchable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isAuthenticated, user } = useAuth();
  const { feed, loading, refresh } = useContentFeed();
  const { config } = useMobileAppConfig();
  const { bibleVerse, adminWord } = useWordOfDay();
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

  // 4 ClaudyGod-branded sections — computed together so items don't repeat across rails
  const { music: musicItems, nuggets: nuggetsItems, teens: teensItems, audio: audioItems } =
    useMemo(() => buildSections(feed), [feed]);

  const configuredTabs = useMemo(() => config?.navigation?.tabs ?? [], [config?.navigation?.tabs]);
  const configuredSections = useMemo(() => config?.layout?.homeSections ?? [], [config?.layout?.homeSections]);

  const configuredRails = useMemo(() => configuredSections
    .map((section) => {
      const sectionItems = allContent
        .filter((item) => isSectionContentType(item.type) && section.contentTypes.indexOf(item.type) >= 0)
        .slice(0, section.maxItems || 10);
      return { section, items: sectionItems };
    })
    .filter((entry) => entry.items.length > 0)
    .slice(0, 2),
  [allContent, configuredSections]);

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

      {/* Quick nav shortcuts */}
      <ContentShortcuts shortcuts={shortcuts} />

      {/* Live banner */}
      {liveSessions[0] ? (
        <LiveNowBanner item={liveSessions[0]} onPress={() => void openItem(liveSessions[0]!, 'home_live_banner')} />
      ) : null}

      {/* Continue listening — only for authenticated users with real history */}
      {isAuthenticated && feed.recent.length > 0 ? (
        <ContinueRow items={continueItems} onPress={(item) => void openItem(item, 'home_continue')} />
      ) : null}

      {/* ── 4 ClaudyGod Content Sections ─────────────────────────────────── */}
      <View style={{ gap: 28 }}>

        {/* ClaudyGod Music */}
        {(loading || musicItems.length > 0) ? (
          <View style={{ gap: 14 }}>
            <SectionLabel
              title="ClaudyGod Music"
              actionLabel="See all"
              onAction={() => router.push(APP_ROUTES.tabs.player)}
            />
            <ContentRail
              title=""
              items={musicItems}
              onPressItem={(item) => void openItem(item, 'home_music')}
              loading={loading}
              cardVariant="portrait"
            />
          </View>
        ) : null}

        {/* ClaudyGod Nuggets of Truth */}
        {(loading || nuggetsItems.length > 0) ? (
          <View style={{ gap: 14 }}>
            <SectionLabel
              title="Nuggets of Truth"
              actionLabel="See all"
              onAction={() => router.push(APP_ROUTES.tabs.videos)}
            />
            <ContentRail
              title=""
              items={nuggetsItems}
              onPressItem={(item) => void openItem(item, 'home_nuggets')}
              loading={loading}
              cardVariant="landscape"
            />
          </View>
        ) : null}

        {/* ClaudyGod Teens */}
        {(loading || teensItems.length > 0) ? (
          <View style={{ gap: 14 }}>
            <SectionLabel
              title="ClaudyGod Teens"
              actionLabel="See all"
              onAction={() => router.push(APP_ROUTES.tabs.videos)}
            />
            <ContentRail
              title=""
              items={teensItems}
              onPressItem={(item) => void openItem(item, 'home_teens')}
              loading={loading}
              cardVariant="landscape"
            />
          </View>
        ) : null}

        {/* ClaudyGod Audio */}
        {(loading || audioItems.length > 0) ? (
          <View style={{ gap: 14 }}>
            <SectionLabel
              title="ClaudyGod Audio"
              actionLabel="See all"
              onAction={() => router.push(APP_ROUTES.tabs.player)}
            />
            <ContentRail
              title=""
              items={audioItems}
              onPressItem={(item) => void openItem(item, 'home_audio')}
              loading={loading}
              cardVariant="portrait"
            />
          </View>
        ) : null}

      </View>

      {/* Admin-configured rails (rendered after branded sections) */}
      {configuredRails.map(({ section, items }) => (
        <View key={section.id} style={{ gap: 14 }}>
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

      {/* Most played chart */}
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

      {/* ClaudyGod Live replays (when no active live) */}
      {!liveSessions.length && feed.live.length > 0 ? (
        <View style={{ gap: 14 }}>
          <SectionLabel
            title="ClaudyGod Live"
            actionLabel="See all"
            onAction={() => router.push(APP_ROUTES.tabs.live)}
          />
          <ContentRail
            title=""
            items={feed.live.slice(0, 10)}
            onPressItem={(item) => void openItem(item, 'home_live')}
            loading={loading}
            cardVariant="landscape"
            compact={compact}
          />
        </View>
      ) : null}

      {/* Daily scripture from Bible API */}
      {bibleVerse ? (
        <WordOfDayCard word={bibleVerse} onPress={() => router.push(APP_ROUTES.settingsPages.word)} />
      ) : null}

      {/* Admin-authored word — shown as a separate card when configured */}
      {adminWord ? (
        <WordOfDayCard word={adminWord} onPress={() => router.push(APP_ROUTES.settingsPages.word)} />
      ) : null}

      {/* Guest sign-in prompt */}
      {!isAuthenticated ? (
        <GuestCallout onSignIn={() => router.push(APP_ROUTES.auth.signIn)} />
      ) : null}

      {/* Support */}
      <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />

      {/* Full empty state */}
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
