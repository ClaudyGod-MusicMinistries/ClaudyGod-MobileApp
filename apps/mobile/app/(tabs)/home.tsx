import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { ContentType, FeedBundle, FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import {
  ContentRail,
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

function buildSections(feed: FeedBundle, limit = 16) {
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

// ─── Search Bar ───────────────────────────────────────────────────────────────

function HomeSearchBar({ onPress }: { onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 10,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <MaterialIcons name="search" size={20} color={theme.colors.textMuted} />
        <CustomText style={{ color: theme.colors.textMuted, fontSize: 15, flex: 1 }}>
          Search songs, videos, messages...
        </CustomText>
        <MaterialIcons name="mic" size={18} color={theme.colors.textMuted} />
      </View>
    </TVTouchable>
  );
}

// ─── Continue Row ─────────────────────────────────────────────────────────────

function ContinueRow({ items, onPress }: { items: FeedCardItem[]; onPress: (_item: FeedCardItem) => void }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const tileSize = compact ? 118 : 136;

  if (!items.length) return null;

  return (
    <View style={{ gap: 16 }}>
      <SectionLabel title="Continue listening" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 2, paddingRight: 8 }}
      >
        {items.slice(0, 8).map((item) => (
          <TVTouchable key={item.id} onPress={() => onPress(item)} showFocusBorder={false}>
            <View style={{ width: tileSize, gap: 8 }}>
              {/* Square tile — bigger, bolder, minimal corner radius */}
              <View style={{ width: tileSize, height: tileSize, borderRadius: 8, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt }}>
                <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
                {/* Bottom gradient for title legibility */}
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.62)']}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: tileSize * 0.5 }}
                />
                {/* Play button — bottom right */}
                <View style={{ position: 'absolute', right: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="play-arrow" size={17} color="#fff" />
                </View>
              </View>
              {/* Title below tile */}
              <CustomText
                style={{ color: theme.colors.text, fontSize: 12, fontWeight: '600', lineHeight: 16 }}
                numberOfLines={2}
              >
                {item.title}
              </CustomText>
            </View>
          </TVTouchable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── New Content Banner (before rails) ───────────────────────────────────────

function NewContentBanner({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const artSize = compact ? 100 : 120;

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          {/* Text */}
          <View style={{ flex: 1, padding: compact ? 14 : 18, gap: 6, justifyContent: 'center' }}>
            <View style={{ alignSelf: 'flex-start', borderRadius: 4, backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder, paddingHorizontal: 8, paddingVertical: 3 }}>
              <CustomText style={{ color: theme.colors.primary, fontSize: 9.5, fontWeight: '700', letterSpacing: 1 }}>
                NEW
              </CustomText>
            </View>
            <CustomText style={{ color: theme.colors.text, fontSize: compact ? 15 : 17, fontWeight: '800', letterSpacing: -0.3, lineHeight: compact ? 21 : 24 }} numberOfLines={2}>
              {item.title}
            </CustomText>
            {item.subtitle ? (
              <CustomText style={{ color: theme.colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                {item.subtitle}
              </CustomText>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.colors.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 7 }}>
                <MaterialIcons name={item.type === 'video' ? 'play-arrow' : 'play-arrow'} size={14} color="#fff" />
                <CustomText style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                  {item.type === 'video' ? 'Watch' : 'Play'}
                </CustomText>
              </View>
              {item.duration ? (
                <CustomText style={{ color: theme.colors.textMuted, fontSize: 11 }}>{item.duration}</CustomText>
              ) : null}
            </View>
          </View>
          {/* Artwork */}
          <View style={{ width: artSize, flexShrink: 0 }}>
            <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={{ width: artSize, height: '100%' }} />
          </View>
        </View>
      </View>
    </TVTouchable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { feed, loading, refresh } = useContentFeed();
  const { bibleVerse, adminWord } = useWordOfDay();

  const featured = useMemo(
    () => feed.featured ?? feed.live[0] ?? feed.music[0] ?? feed.videos[0] ?? feed.recommendations[0] ?? null,
    [feed.featured, feed.live, feed.music, feed.recommendations, feed.videos],
  );

  const liveSessions = useMemo(() => feed.live.filter((item) => item.isLive), [feed.live]);

  const continueItems = useMemo(
    () => dedupe([...feed.recent, ...feed.recommendations]).slice(0, 8),
    [feed.recent, feed.recommendations],
  );

  const allContent = useMemo(
    () => dedupe([...feed.recommendations, ...feed.mostPlayed, ...feed.recent, ...feed.music, ...feed.videos, ...feed.live]),
    [feed.live, feed.mostPlayed, feed.music, feed.recent, feed.recommendations, feed.videos],
  );

  const { music: musicItems, nuggets: nuggetsItems, teens: teensItems, audio: audioItems } =
    useMemo(() => buildSections(feed), [feed]);

  // New release banner item — pick newest video or audio that isn't already the hero
  const newRelease = useMemo(() => {
    const candidates = [...feed.videos, ...feed.music];
    return candidates.find((item) => item.id !== featured?.id) ?? null;
  }, [feed.videos, feed.music, featured]);

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  return (
    <PremiumPage title="Home" eyebrow="Home" noBack refreshing={loading} onRefresh={() => void refresh()}>

      {/* Greeting */}
      <GreetingBanner />

      {/* Search */}
      <HomeSearchBar onPress={() => router.push(APP_ROUTES.tabs.search)} />

      {/* Featured Hero */}
      <PremiumHero
        item={featured}
        title={featured ? undefined : 'Start your worship stream'}
        subtitle={featured ? undefined : 'Music, videos, and live moments.'}
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
        secondaryLabel="Search"
        secondaryIcon="search"
        onPrimary={featured ? () => void openItem(featured, 'home_hero') : () => router.push(APP_ROUTES.tabs.player)}
        onSecondary={() => router.push(APP_ROUTES.tabs.search)}
      />

      {/* Live now */}
      {liveSessions[0] ? (
        <LiveNowBanner item={liveSessions[0]} onPress={() => void openItem(liveSessions[0]!, 'home_live_banner')} />
      ) : null}

      {/* Continue listening — bold tile row */}
      {feed.recent.length > 0 ? (
        <ContinueRow items={continueItems} onPress={(item) => void openItem(item, 'home_continue')} />
      ) : null}

      {/* New release promo — before content rails */}
      {newRelease ? (
        <NewContentBanner item={newRelease} onPress={() => void openItem(newRelease, 'home_new_release')} />
      ) : null}

      {/* ── 4 Content Sections ─────────────────────────────────────────────── */}
      <View style={{ gap: 36 }}>

        {(loading || musicItems.length > 0) ? (
          <View style={{ gap: 14 }}>
            <SectionLabel title="ClaudyGod Music" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.player)} />
            <ContentRail title="" items={musicItems} onPressItem={(item) => void openItem(item, 'home_music')} loading={loading} cardVariant="portrait" hideWhenEmpty />
          </View>
        ) : null}

        {(loading || nuggetsItems.length > 0) ? (
          <View style={{ gap: 14 }}>
            <SectionLabel title="Nuggets of Truth" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.videos)} />
            <ContentRail title="" items={nuggetsItems} onPressItem={(item) => void openItem(item, 'home_nuggets')} loading={loading} cardVariant="landscape" hideWhenEmpty />
          </View>
        ) : null}

        {(loading || teensItems.length > 0) ? (
          <View style={{ gap: 14 }}>
            <SectionLabel title="ClaudyGod Teens" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.videos)} />
            <ContentRail title="" items={teensItems} onPressItem={(item) => void openItem(item, 'home_teens')} loading={loading} cardVariant="landscape" hideWhenEmpty />
          </View>
        ) : null}

        {(loading || audioItems.length > 0) ? (
          <View style={{ gap: 14 }}>
            <SectionLabel title="Latest Audio" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.player)} />
            <ContentRail title="" items={audioItems} onPressItem={(item) => void openItem(item, 'home_audio')} loading={loading} cardVariant="portrait" hideWhenEmpty />
          </View>
        ) : null}

      </View>

      {/* Most played */}
      {feed.mostPlayed.length > 0 ? (
        <TrendingList
          title="Most played"
          items={feed.mostPlayed.slice(0, 8)}
          onPressItem={(item) => void openItem(item, 'home_trending')}
          actionLabel="See all"
          onAction={() => router.push(APP_ROUTES.tabs.player)}
        />
      ) : null}

      {/* Daily scripture */}
      {bibleVerse ? (
        <WordOfDayCard word={bibleVerse} onPress={() => router.push(APP_ROUTES.settingsPages.word)} />
      ) : null}

      {adminWord && adminWord.id !== bibleVerse?.id ? (
        <WordOfDayCard word={adminWord} onPress={() => router.push(APP_ROUTES.settingsPages.word)} />
      ) : null}

      {/* Support */}
      <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />

      {/* Empty state */}
      {!loading && !allContent.length ? (
        <EmptyState
          title="Your feed is loading"
          message="Check your connection or search for something to get started."
          icon="wifi-off"
          actionLabel="Search"
          onAction={() => router.push(APP_ROUTES.tabs.search)}
        />
      ) : null}

    </PremiumPage>
  );
}
