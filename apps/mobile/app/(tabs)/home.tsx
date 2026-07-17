import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions, type ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
import { InlineErrorBanner } from '../../components/ui/InlineErrorBanner';
import { SignInPromptBanner } from '../../components/ui/SignInPromptBanner';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useUserAccount } from '../../context/UserAccountContext';
import { getHomeLayoutSections, deriveLayoutSectionItems } from '../../util/mobileLayout';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import {
  ContentRail,
  EmptyState,
  GreetingBanner,
  isRedundantSubtitle,
  LiveNowBanner,
  PremiumHero,
  PremiumPage,
  SectionLabel,
  TrendingList,
  WordOfDayCard,
} from '../../components/feed';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // HomeSearchBar — pill-shaped, lifted off the background instead of a flat bordered box.
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 15,
    borderRadius: 999, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchText:       { color: theme.colors.textMuted, fontSize: 15, flex: 1 },

  // ContinueRow
  continueGap:          { gap: 16 },
  continueScrollContent:{ gap: 12, paddingVertical: 2, paddingRight: 8 },
  // Shadow lives on the outer wrapper (no clipping) so it isn't cut off by
  // the inner view's overflow:hidden, which is what actually rounds the image.
  continueTileShadowWrap: {
    borderRadius: 16,
    shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  continueTileImg: {
    borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt,
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
    shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  bannerCard: {
    borderRadius: 22, overflow: 'hidden', backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  bannerRow:        { flexDirection: 'row', alignItems: 'stretch' },
  bannerBadge:      { alignSelf: 'flex-start', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4 },
  bannerBadgeText:  { color: '#FFFFFF', fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
  bannerSub:        { color: theme.colors.textSecondary, fontSize: 12 },
  bannerPlayRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  // Same overflow:hidden-clips-shadow reason as continuePlayBtn above.
  bannerPlayBtn:    {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 8,
  },
  bannerPlayText:   { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  bannerDuration:   { color: theme.colors.textMuted },
  bannerTitleBase:  { color: theme.colors.text, fontWeight: '800', letterSpacing: -0.3 },

  // Section containers
  sectionsGap:      { gap: 36 },
  sectionRow:       { gap: 14 },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Without this, "NEW" would stick to whatever the single most-recent item
// happens to be forever, even if it was actually published months ago because
// nothing newer has been added since — a stale "NEW" badge is exactly the
// kind of thing that undermines an admin-curated, honest content surface.
const NEW_RELEASE_WINDOW_MS = 1000 * 60 * 60 * 24 * 21; // 21 days

function dedupe(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const out: FeedCardItem[] = [];
  for (const item of items) {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (!seen.has(key)) { seen.add(key); out.push(item); }
  }
  return out;
}

// ─── HomeSearchBar ────────────────────────────────────────────────────────────

function HomeSearchBar({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={theme.colors.textMuted} />
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
          <TVTouchable key={item.id} onPress={() => onPress(item)} showFocusBorder={false}>
            <View style={{ width: tileSize, gap: 8 }}>
              <View style={[styles.continueTileShadowWrap, { width: tileSize, height: tileSize }]}>
                <View style={[styles.continueTileImg, StyleSheet.absoluteFillObject]}>
                  <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.62)']}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: tileSize * 0.5 }}
                  />
                  <View style={styles.continuePlayBtn}>
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <MaterialIcons name="play-arrow" size={17} color="#fff" />
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

// ─── NewContentBanner ─────────────────────────────────────────────────────────

function NewContentBanner({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const artSize = compact ? 108 : 128;

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={styles.bannerShadowWrap}>
      <View style={styles.bannerCard}>
        <View style={styles.bannerRow}>
          <View style={{ flex: 1, padding: compact ? 16 : 20, gap: 7, justifyContent: 'center' }}>
            <View style={styles.bannerBadge}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <CustomText style={styles.bannerBadgeText}>NEW</CustomText>
            </View>
            <CustomText
              style={[styles.bannerTitleBase, { fontSize: compact ? 16 : 18, lineHeight: compact ? 22 : 25 }]}
              numberOfLines={2}
            >
              {item.title}
            </CustomText>
            {item.subtitle && !isRedundantSubtitle(item.title, item.subtitle) ? (
              <CustomText style={styles.bannerSub} numberOfLines={1}>{item.subtitle}</CustomText>
            ) : null}
            <View style={styles.bannerPlayRow}>
              <View style={styles.bannerPlayBtn}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <MaterialIcons name="play-arrow" size={15} color="#fff" />
                <CustomText style={styles.bannerPlayText}>
                  {item.type === 'video' ? 'Watch' : 'Play'}
                </CustomText>
              </View>
              {item.duration ? (
                <CustomText variant="caption" style={styles.bannerDuration}>{item.duration}</CustomText>
              ) : null}
            </View>
          </View>
          <View style={{ width: artSize, height: artSize, alignSelf: 'center', flexShrink: 0, borderRadius: 18, overflow: 'hidden', margin: 10 }}>
            <Image
              source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
              resizeMode="cover"
              style={{ width: artSize, height: artSize } as ImageStyle}
            />
          </View>
        </View>
      </View>
      </View>
    </TVTouchable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const styles = useStyles();
  const router = useRouter();
  const { feed, loading, error, refresh } = useContentFeed();
  const { bibleVerse, adminWord }  = useWordOfDay();
  const { config: appConfig } = useMobileAppConfig();
  const { account } = useUserAccount();

  const featured = feed.featured ?? null;

  const liveSessions = useMemo(() => feed.live.filter((item) => item.isLive), [feed.live]);

  const continueItems = useMemo(
    () => dedupe(feed.continueListening).slice(0, 8),
    [feed.continueListening],
  );

  const allContent = useMemo(
    () => dedupe([
      ...feed.recommendations, ...feed.mostPlayed, ...feed.recent,
      ...feed.music, ...feed.videos, ...feed.live,
      ...feed.playlists, ...feed.announcements,
    ]),
    [feed.live, feed.mostPlayed, feed.music, feed.recent, feed.recommendations, feed.videos, feed.playlists, feed.announcements],
  );

  const homeSections = useMemo(() => getHomeLayoutSections(appConfig), [appConfig]);
  const sectionItems = useMemo(
    () => homeSections.map((section) => ({ section, items: deriveLayoutSectionItems(feed, section, 'home') })),
    [homeSections, feed],
  );

  // The narrow `allContent` pool above misses admin-curated layout sections
  // entirely — without this, a home feed built only from those sections would
  // show real content up top and a contradictory "nothing to play" message
  // at the bottom simultaneously.
  const hasAnyContent = Boolean(featured) || allContent.length > 0
    || sectionItems.some(({ items }) => items.length > 0);

  const newRelease = useMemo(() => {
    const candidates = [...feed.videos, ...feed.music]
      .filter((item) => item.id !== featured?.id)
      .sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bTime - aTime;
      });
    const candidate = candidates[0] ?? null;
    if (!candidate?.createdAt) return null;
    const isActuallyRecent = Date.now() - Date.parse(candidate.createdAt) <= NEW_RELEASE_WINDOW_MS;
    return isActuallyRecent ? candidate : null;
  }, [feed.videos, feed.music, featured]);

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  return (
    <PremiumPage title="Home" eyebrow="Home" noBack refreshing={loading} onRefresh={() => void refresh()}>
      <GreetingBanner
        name={account?.displayName}
        onNotificationsPress={() => router.push(APP_ROUTES.tabs.settings)}
      />

      <HomeSearchBar onPress={() => router.push(APP_ROUTES.tabs.search)} />

      {error ? <InlineErrorBanner message={error} onRetry={() => void refresh()} /> : null}

      <PremiumHero
        item={featured}
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
        onPrimary={featured ? () => void openItem(featured, 'home_hero') : () => router.push(APP_ROUTES.tabs.player)}
      />

      {liveSessions[0] ? (
        <LiveNowBanner item={liveSessions[0]} onPress={() => void openItem(liveSessions[0]!, 'home_live_banner')} />
      ) : null}

      {feed.continueListening.length > 0 ? (
        <ContinueRow items={continueItems} onPress={(item) => void openItem(item, 'home_continue')} />
      ) : null}

      <SignInPromptBanner />

      {feed.recommendations.length > 0 ? (
        <View style={styles.sectionRow}>
          <SectionLabel title="For You" accent="Picked for you" />
          <ContentRail
            title=""
            items={feed.recommendations.slice(0, 12)}
            onPressItem={(item) => void openItem(item, 'home_for_you')}
            cardVariant="portrait"
          />
        </View>
      ) : null}

      {newRelease ? (
        <NewContentBanner item={newRelease} onPress={() => void openItem(newRelease, 'home_new_release')} />
      ) : null}

      <View style={styles.sectionsGap}>
        {sectionItems.map(({ section, items }, index) => (
          (loading || items.length > 0) ? (
            <View key={section.id} style={styles.sectionRow}>
              <SectionLabel
                title={section.title}
                actionLabel={section.actionLabel}
                onAction={() => router.push({
                  pathname: APP_ROUTES.section.detail,
                  params: { sectionId: section.id, screen: 'home', title: section.title },
                } as never)}
              />
              <ContentRail
                title=""
                items={items}
                onPressItem={(item) => void openItem(item, `home_${section.id}`)}
                loading={loading}
                cardVariant={index % 2 === 0 ? 'portrait' : 'landscape'}
                hideWhenEmpty
              />
            </View>
          ) : null
        ))}
      </View>

      {feed.mostPlayed.length > 0 ? (
        <TrendingList
          title="Most played"
          items={feed.mostPlayed.slice(0, 8)}
          onPressItem={(item) => void openItem(item, 'home_trending')}
          actionLabel="See all"
          onAction={() => router.push(APP_ROUTES.tabs.player)}
        />
      ) : null}

      {bibleVerse ? (
        <WordOfDayCard
          word={bibleVerse}
          label="Daily Scripture"
          onPress={() => router.push(APP_ROUTES.settingsPages.word)}
        />
      ) : null}

      {adminWord && adminWord.id !== bibleVerse?.id ? (
        <WordOfDayCard
          word={adminWord}
          label="ClaudyGod Message"
          onPress={() => router.push(APP_ROUTES.settingsPages.word)}
        />
      ) : null}

      <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />

      {!loading && !hasAnyContent ? (
        <EmptyState
          title="Nothing to play yet"
          message="We couldn't find any content. Check your connection or search for something specific."
          icon="wifi-off"
          actionLabel="Search"
          onAction={() => router.push(APP_ROUTES.tabs.search)}
        />
      ) : null}
    </PremiumPage>
  );
}
