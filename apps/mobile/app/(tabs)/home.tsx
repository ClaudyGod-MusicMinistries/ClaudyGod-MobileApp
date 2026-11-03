import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AppIcon } from '../../components/ui/AppIcon';
import { AppImage } from '../../components/ui/AppImage';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
import { ErrorState } from '../../components/ui/ErrorState';
import { FadeIn } from '../../components/ui/FadeIn';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useAuth } from '../../features/auth/AuthContext';
import { getHomeLayoutSections, deriveLayoutSectionItems, deriveLayoutSectionOverflowCount } from '../../util/mobileLayout';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { FeedCardItem } from '../../services/contentService';
import { trackContentPlay } from '../../services/supabaseAnalytics';
import {
  ContentRail,
  dedupeFeedItems,
  GreetingBanner,
  LiveNowBanner,
  LatestReleaseCard,
  PremiumHero,
  PremiumPage,
  SectionLabel,
  TrendingList,
  WordOfDayCard,
  type CardVariant,
} from '../../components/feed';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // HomeSearchBar — pill-shaped, lifted off the background instead of a flat bordered box.
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 15,
    borderRadius: theme.radius.pill, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow, shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchText:       { color: theme.colors.textMuted, fontSize: 15, flex: 1 },

  // ContinueRow
  continueGap:          { gap: 16 },
  continueScrollContent:{ gap: 12, paddingVertical: 2, paddingRight: 8 },
  // Shadow lives on the outer wrapper (no clipping) so it isn't cut off by
  // the inner view's overflow:hidden, which is what actually rounds the image.
  continueTileShadowWrap: {
    borderRadius: theme.radius.xxl,
    shadowColor: theme.colors.shadow, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  continueTileImg: {
    borderRadius: theme.radius.xxl, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt,
  },
  continuePlayBtn: {
    // No shadow here deliberately — combined with overflow:hidden (needed to
    // clip the gradient fill into a circle) it would silently disappear on
    // iOS, since shadow rendering is clipped by the same overflow that clips
    // the content. Not worth a second wrapper view for a 30px badge.
    position: 'absolute', right: 8, bottom: 8,
    width: 30, height: 30, borderRadius: 15, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  continueTileTitle: { color: theme.colors.text, fontWeight: '600', lineHeight: 16 },

  // NewContentBanner — bigger radius, real shadow, gradient badge/CTA instead
  // of flat tinted rectangles. Shadow on the outer wrapper, same reason as
  // continueTileShadowWrap above.
  bannerShadowWrap: {
    borderRadius: 22,
    shadowColor: theme.colors.shadow, shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  bannerCard: {
    borderRadius: 22, overflow: 'hidden', backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  bannerRow:        { flexDirection: 'row', alignItems: 'stretch' },
  bannerBadge:      { alignSelf: 'flex-start', borderRadius: theme.radius.pill, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4 },
  bannerBadgeText:  { color: theme.colors.onPrimary, fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
  bannerSub:        { color: theme.colors.textSecondary, fontSize: 12 },
  bannerPlayRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  // Same overflow:hidden-clips-shadow reason as continuePlayBtn above.
  bannerPlayBtn:    {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: theme.radius.pill, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 8,
  },
  bannerPlayText:   { color: theme.colors.onPrimary, fontSize: 12.5, fontWeight: '700' },
  bannerDuration:   { color: theme.colors.textMuted },
  bannerTitleBase:  { color: theme.colors.text, fontWeight: '800', letterSpacing: -0.3 },

  // Section containers
  sectionsGap:      { gap: 36 },
  sectionRow:       { gap: 14 },

  // Word-of-day + support cards — stacked full-width on phone, paired
  // side-by-side on desktop/TV so a wide viewport doesn't leave both cards
  // stranded at phone-width with acres of empty space to their right.
  bottomCardsColumn: { gap: 16 },
  bottomCardsRow:    { flexDirection: 'row', gap: 16, alignItems: 'stretch' },
  bottomCardHalf:    { flex: 1, minWidth: 0 },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────


// Base delay before the first data-dependent block animates in, and the step
// between each subsequent one — tuned so a 5-block screen cascades over
// ~300ms rather than everything blinking in within the same 100ms window.
const ENTRANCE_STEP_MS = 55;
const ENTRANCE_MAX_MS = 480;

function entranceDelay(index: number): number {
  return Math.min(index * ENTRANCE_STEP_MS, ENTRANCE_MAX_MS);
}

// Section rail shape should follow what's actually in it — video thumbnails
// read better wide (landscape), music/audio art reads better tall (portrait)
// — rather than alternating by the section's position in an admin-ordered
// list, which changes the card shape if someone just reorders sections.
function inferRailVariant(items: FeedCardItem[]): CardVariant {
  if (!items.length) return 'portrait';
  const videoShare = items.filter((item) => item.type === 'video').length / items.length;
  return videoShare >= 0.5 ? 'landscape' : 'portrait';
}

// ─── HomeSearchBar ────────────────────────────────────────────────────────────

function HomeSearchBar({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false} pressScale={0.98}>
      <View style={styles.searchBar}>
        <AppIcon name="search" size={19} color={theme.colors.textMuted} />
        <CustomText style={styles.searchText}>Search songs, videos, messages...</CustomText>
      </View>
    </TVTouchable>
  );
}

// ─── ContinueRow ─────────────────────────────────────────────────────────────

function ContinueRow({ items, onPress }: { items: FeedCardItem[]; onPress: (_item: FeedCardItem) => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const compact  = width < 430;
  const tileSize = compact ? 118 : 136;

  if (!items.length) return null;

  return (
    <View style={styles.continueGap}>
      <SectionLabel title="Continue listening" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.continueScrollContent}
      >
        {items.slice(0, 8).map((item) => (
          <TVTouchable key={item.id} onPress={() => onPress(item)} showFocusBorder={false} pressScale={0.97}>
            <View style={{ width: tileSize, gap: 8 }}>
              <View style={[styles.continueTileShadowWrap, { width: tileSize, height: tileSize }]}>
                <View style={[styles.continueTileImg, StyleSheet.absoluteFillObject]}>
                  <AppImage uri={item.imageUrl} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
                  <LinearGradient
                    colors={['transparent', theme.colors.mediaScrim]}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: tileSize * 0.5 }}
                  />
                  <View style={styles.continuePlayBtn}>
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <MaterialIcons name="play-arrow" size={17} color={theme.colors.onPrimary} />
                  </View>
                </View>
              </View>
              <CustomText variant="label" style={styles.continueTileTitle} numberOfLines={2}>
                {item.title}
              </CustomText>
            </View>
          </TVTouchable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const styles = useStyles();
  const router = useRouter();
  const { feed, loading, refreshing, error, refresh } = useContentFeed();
  const { bibleVerse, adminWord }  = useWordOfDay();
  const { config: appConfig } = useMobileAppConfig();
  const { user: account } = useAuth();

  const featured = feed.featured ?? feed.mostPlayed[0] ?? feed.recent[0] ?? null;

  // Excludes `featured` — otherwise a live featured item shows "LIVE NOW" in
  // the hero and the exact same session repeats immediately below it in
  // LiveNowBanner.
  const liveSessions = useMemo(
    () => feed.live.filter((item) => item.isLive && item.id !== featured?.id),
    [feed.live, featured],
  );

  const continueItems = useMemo(
    () => dedupeFeedItems(feed.continueListening).slice(0, 8),
    [feed.continueListening],
  );

  const homeSections = useMemo(() => getHomeLayoutSections(appConfig), [appConfig]);
  const sectionItems = useMemo(
    () => homeSections.map((section) => ({
      section,
      items: deriveLayoutSectionItems(feed, section, 'home'),
      overflowCount: deriveLayoutSectionOverflowCount(feed, section, 'home'),
    })),
    [homeSections, feed],
  );

  const newRelease = useMemo(() => {
    // Only spotlight content explicitly tagged as 'latest-releases' or marked as an upcoming premiere.
    // Never randomly pick from general uploads/history so the admin has full control.
    const pool = [...feed.recent, ...feed.music, ...feed.videos];
    return pool.find(
      (item) => item.id !== featured?.id && (item.appSections?.includes('latest-releases') || item.isUpcoming),
    ) ?? null;
  }, [feed.recent, feed.videos, feed.music, featured]);

  // Fire-and-forget: this is analytics, not a precondition for navigation.
  // Awaiting it (a SecureStore read + network POST) used to make every card
  // tap on Home wait on a round-trip before the player even opened.
  const openItem = (item: FeedCardItem, source: string) => {
    void trackContentPlay(item, source);
    router.push(buildPlayerRoute(item));
  };

  // Keys the entrance stagger to the transition from "loading" to "loaded" —
  // FadeIn fires on mount, and content-dependent blocks mount the instant
  // loading flips (or, for the dynamic sections below, are already mounted
  // showing a skeleton) — without this the entrance plays against empty
  // placeholders instead of the real content that replaces them.
  const contentReadyKey = loading ? 'loading' : 'ready';
  let entranceIndex = 0;
  const nextEntranceDelay = () => entranceDelay(entranceIndex++);

  return (
    <PremiumPage title="Home" noBack hideTitleRow refreshing={refreshing} onRefresh={() => void refresh()}>
      <GreetingBanner
        name={account?.displayName}
        onPreferencesPress={() => router.push(APP_ROUTES.tabs.settings)}
      />

      <FadeIn replayKey={contentReadyKey} delay={nextEntranceDelay()}>
        <HomeSearchBar onPress={() => router.push(APP_ROUTES.tabs.search)} />
      </FadeIn>

      {error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}

      <PremiumHero
        item={featured}
        loading={loading}
        title={featured ? undefined : (appConfig?.hero?.fallbackTitle ?? 'Start your worship stream')}
        subtitle={featured ? undefined : (appConfig?.hero?.fallbackSubtitle ?? 'Music, videos, and live moments.')}
        emptyIcon="graphic-eq"
        primaryLabel={
          featured?.isLive ? 'Watch live' :
          featured?.type === 'video' ? 'Watch now' :
          featured ? 'Play now' : 'Open music'
        }
        primaryIcon={
          featured?.isLive ? 'live-tv' :
          featured?.type === 'video' ? 'smart-display' :
          featured ? 'play-arrow' : 'play-circle-outline'
        }
        onPrimary={featured ? () => openItem(featured, 'home_hero') : () => router.push(APP_ROUTES.tabs.player)}
        secondaryLabel={featured ? undefined : 'Search library'}
        secondaryIcon="search"
        onSecondary={featured ? undefined : () => router.push(APP_ROUTES.tabs.search)}
      />

      {liveSessions[0] ? (
        <LiveNowBanner item={liveSessions[0]} onPress={() => openItem(liveSessions[0]!, 'home_live_banner')} />
      ) : null}

      {newRelease ? (
        <FadeIn replayKey={contentReadyKey} delay={nextEntranceDelay()}>
          <LatestReleaseCard
            item={newRelease}
            onPlay={(item) => openItem(item, 'home_latest_release')}
          />
        </FadeIn>
      ) : null}

      {feed.continueListening.length > 0 ? (
        <FadeIn replayKey={contentReadyKey} delay={nextEntranceDelay()}>
          <ContinueRow items={continueItems} onPress={(item) => openItem(item, 'home_continue')} />
        </FadeIn>
      ) : null}

      <View style={styles.sectionsGap}>
        {sectionItems.map(({ section, items, overflowCount }, index) => (
          (loading || items.length > 0) ? (
            <React.Fragment key={section.id}>
              <FadeIn replayKey={contentReadyKey} delay={nextEntranceDelay()}>
                <View style={styles.sectionRow}>
                  <SectionLabel
                    title={section.title}
                    actionLabel={overflowCount > 0 ? (section.actionLabel || 'See all') : undefined}
                    onAction={overflowCount > 0 ? () => router.push({
                      pathname: APP_ROUTES.section.detail,
                      params: { sectionId: section.id, screen: 'home', title: section.title },
                    } as never) : undefined}
                  />
                  <ContentRail
                    title=""
                    items={items}
                    onPressItem={(item) => openItem(item, `home_${section.id}`)}
                    loading={loading}
                    cardVariant={inferRailVariant(items)}
                    hideWhenEmpty
                  />
                </View>
              </FadeIn>

              {/* In-between Section 1: Daily Scripture Card */}
              {index === 0 && (adminWord ?? bibleVerse) ? (
                <FadeIn replayKey={contentReadyKey} delay={nextEntranceDelay()}>
                  <WordOfDayCard
                    word={(adminWord ?? bibleVerse)!}
                    label="Daily Scripture"
                    onPress={() => router.push(APP_ROUTES.settingsPages.word)}
                  />
                </FadeIn>
              ) : null}

              {/* In-between Section 2: Partner with Ministry Card */}
              {index === 1 ? (
                <FadeIn replayKey={contentReadyKey} delay={nextEntranceDelay()}>
                  <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />
                </FadeIn>
              ) : null}
            </React.Fragment>
          ) : null
        ))}
      </View>

      {/* Fallback if fewer than 2 sections were rendered in the stream */}
      {sectionItems.filter((s) => loading || s.items.length > 0).length === 0 && (adminWord ?? bibleVerse) ? (
        <FadeIn replayKey={contentReadyKey} delay={nextEntranceDelay()}>
          <WordOfDayCard
            word={(adminWord ?? bibleVerse)!}
            label="Daily Scripture"
            onPress={() => router.push(APP_ROUTES.settingsPages.word)}
          />
        </FadeIn>
      ) : null}

      {feed.recommendations.length > 0 ? (
        <FadeIn replayKey={contentReadyKey} delay={nextEntranceDelay()}>
          <View style={styles.sectionRow}>
            <SectionLabel title="For You" accent="Picked for you" />
            <ContentRail
              title=""
              items={feed.recommendations.slice(0, 12)}
              onPressItem={(item) => openItem(item, 'home_for_you')}
              cardVariant="portrait"
            />
          </View>
        </FadeIn>
      ) : null}

      {feed.mostPlayed.length > 0 ? (
        <TrendingList
          title="Most played"
          items={feed.mostPlayed.slice(0, 8)}
          onPressItem={(item) => openItem(item, 'home_trending')}
          actionLabel="See all"
          onAction={() => router.push(APP_ROUTES.tabs.player)}
        />
      ) : null}

      {/* Fallback if support card was not rendered between sections */}
      {sectionItems.filter((s) => loading || s.items.length > 0).length < 2 ? (
        <FadeIn replayKey={contentReadyKey} delay={nextEntranceDelay()}>
          <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />
        </FadeIn>
      ) : null}

    </PremiumPage>
  );
}
