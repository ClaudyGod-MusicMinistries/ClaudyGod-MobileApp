import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions, type ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
import { InlineErrorBanner } from '../../components/ui/InlineErrorBanner';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { getHomeLayoutSections, deriveLayoutSectionItems } from '../../util/mobileLayout';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { ContentType, FeedCardItem } from '../../services/contentService';
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
} from '../../components/feed';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // HomeSearchBar
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 10, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchText:       { color: theme.colors.textMuted, fontSize: 15, flex: 1 },

  // ContinueRow
  continueGap:          { gap: 16 },
  continueScrollContent:{ gap: 12, paddingVertical: 2, paddingRight: 8 },
  continueTileImg: {
    borderRadius: 8, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt,
  },
  continuePlayBtn: {
    position: 'absolute', right: 8, bottom: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  continueTileTitle: { color: theme.colors.text, fontWeight: '600', lineHeight: 16 },

  // NewContentBanner
  bannerCard:       { borderRadius: 10, overflow: 'hidden', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  bannerRow:        { flexDirection: 'row', alignItems: 'stretch' },
  bannerBadge:      { alignSelf: 'flex-start', borderRadius: 4, backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder, paddingHorizontal: 8, paddingVertical: 3 },
  bannerBadgeText:  { color: theme.colors.primary, fontSize: 9.5, fontWeight: '700', letterSpacing: 1 },
  bannerSub:        { color: theme.colors.textSecondary, fontSize: 12 },
  bannerPlayRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  bannerPlayBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.colors.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 7 },
  bannerPlayText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  bannerDuration:   { color: theme.colors.textMuted },
  bannerTitleBase:  { color: theme.colors.text, fontWeight: '800', letterSpacing: -0.3 },

  // Section containers
  sectionsGap:      { gap: 36 },
  sectionRow:       { gap: 14 },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SectionContentType = Exclude<ContentType, 'ad'>;

function isSectionContentType(type: ContentType): type is SectionContentType {
  return type !== 'ad';
}

void isSectionContentType;

function dedupe(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const out: FeedCardItem[] = [];
  for (const item of items) {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (!seen.has(key)) { seen.add(key); out.push(item); }
  }
  return out;
}

const DESTINATION_ROUTES: Record<string, string> = {
  home: APP_ROUTES.tabs.home,
  videos: APP_ROUTES.tabs.videos,
  player: APP_ROUTES.tabs.player,
  live: APP_ROUTES.tabs.live,
  library: APP_ROUTES.tabs.library,
  search: APP_ROUTES.tabs.search,
};

// ─── HomeSearchBar ────────────────────────────────────────────────────────────

function HomeSearchBar({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={theme.colors.textMuted} />
        <CustomText style={styles.searchText}>Search songs, videos, messages...</CustomText>
        <MaterialIcons name="mic" size={18} color={theme.colors.textMuted} />
      </View>
    </TVTouchable>
  );
}

// ─── ContinueRow ─────────────────────────────────────────────────────────────

function ContinueRow({ items, onPress }: { items: FeedCardItem[]; onPress: (_item: FeedCardItem) => void }) {
  const styles = useStyles();
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
              <View style={[styles.continueTileImg, { width: tileSize, height: tileSize }]}>
                <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.62)']}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: tileSize * 0.5 }}
                />
                <View style={styles.continuePlayBtn}>
                  <MaterialIcons name="play-arrow" size={17} color="#fff" />
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
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const artSize = compact ? 100 : 120;

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={styles.bannerCard}>
        <View style={styles.bannerRow}>
          <View style={{ flex: 1, padding: compact ? 14 : 18, gap: 6, justifyContent: 'center' }}>
            <View style={styles.bannerBadge}>
              <CustomText style={styles.bannerBadgeText}>NEW</CustomText>
            </View>
            <CustomText
              style={[styles.bannerTitleBase, { fontSize: compact ? 15 : 17, lineHeight: compact ? 21 : 24 }]}
              numberOfLines={2}
            >
              {item.title}
            </CustomText>
            {item.subtitle ? (
              <CustomText style={styles.bannerSub} numberOfLines={1}>{item.subtitle}</CustomText>
            ) : null}
            <View style={styles.bannerPlayRow}>
              <View style={styles.bannerPlayBtn}>
                <MaterialIcons name="play-arrow" size={14} color="#fff" />
                <CustomText style={styles.bannerPlayText}>
                  {item.type === 'video' ? 'Watch' : 'Play'}
                </CustomText>
              </View>
              {item.duration ? (
                <CustomText variant="caption" style={styles.bannerDuration}>{item.duration}</CustomText>
              ) : null}
            </View>
          </View>
          <View style={{ width: artSize, flexShrink: 0 }}>
            <Image
              source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
              resizeMode="cover"
              style={{ width: artSize, height: '100%' } as ImageStyle}
            />
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

  const homeSections = useMemo(() => getHomeLayoutSections(appConfig), [appConfig]);
  const sectionItems = useMemo(
    () => homeSections.map((section) => ({ section, items: deriveLayoutSectionItems(feed, section) })),
    [homeSections, feed],
  );

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
      <GreetingBanner />

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
        secondaryLabel="Search"
        secondaryIcon="search"
        onPrimary={featured ? () => void openItem(featured, 'home_hero') : () => router.push(APP_ROUTES.tabs.player)}
        onSecondary={() => router.push(APP_ROUTES.tabs.search)}
      />

      {liveSessions[0] ? (
        <LiveNowBanner item={liveSessions[0]} onPress={() => void openItem(liveSessions[0]!, 'home_live_banner')} />
      ) : null}

      {feed.recent.length > 0 ? (
        <ContinueRow items={continueItems} onPress={(item) => void openItem(item, 'home_continue')} />
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
                onAction={() => router.push((DESTINATION_ROUTES[section.destinationTab] ?? APP_ROUTES.tabs.home) as never)}
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
        <WordOfDayCard word={bibleVerse} onPress={() => router.push(APP_ROUTES.settingsPages.word)} />
      ) : null}

      {adminWord && adminWord.id !== bibleVerse?.id ? (
        <WordOfDayCard word={adminWord} onPress={() => router.push(APP_ROUTES.settingsPages.word)} />
      ) : null}

      <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />

      {!loading && !allContent.length ? (
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
