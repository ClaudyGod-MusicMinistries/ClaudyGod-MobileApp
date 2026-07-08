import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useToast } from '../../context/ToastContext';
import { useContentFeed } from '../../hooks/useContentFeed';
import { InlineErrorBanner } from '../../components/ui/InlineErrorBanner';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { makeStyles } from '../../styles/makeStyles';
import { fetchSearchResults, type ContentType, type FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { buildPlayerRoute } from '../../util/playerRoute';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import {
  ContentList,
  ContentRail,
  EmptyState,
  PremiumPage,
  SectionLabel,
  dedupeFeedItems,
} from '../../components/feed';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // Search bar card
  searchBarCard:       { padding: theme.spacing.md },

  // Search input row (static part)
  searchInputBase: {
    borderRadius: 999, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 16, paddingRight: 8, gap: 10,
  },

  // Clear button
  clearBtn:            { padding: 6 },

  // Submit button (static part)
  searchSubmitBtn:     { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },

  // Category pills row
  categoryPillRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },

  // Static part of each category pill
  categoryPillBase: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, borderRadius: theme.radius.pill, borderWidth: 1,
  },

  // Shortcut section
  shortcutGap:         { gap: 12 },
  shortcutRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shortcutChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: theme.radius.pill, borderWidth: 1,
    borderColor: theme.colors.border, backgroundColor: theme.colors.subtleFill,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  shortcutText:        { color: theme.colors.textSecondary, fontSize: 12.5, fontWeight: '500' },

  // Discovery grid
  discoveryGrid:       { gap: 12 },
  discoveryRow:        { flexDirection: 'row', gap: 12 },

  // DiscoveryItem
  discoveryItemTouch:  { flex: 1, minWidth: 140 },
  discoveryCard: {
    borderRadius: 10, overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
    aspectRatio: 16 / 9,
  },
  discoveryOverlay:    { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  discoveryTitlePill: {
    borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.62)',
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
  },
  discoveryTitleText:  { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  discoveryLiveBadge: {
    position: 'absolute', top: 8, left: 8, borderRadius: 999,
    backgroundColor: 'rgba(239,68,68,0.88)', paddingHorizontal: 7, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  discoveryLiveDot:    { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF' },
  discoveryLiveText:   { color: '#FFFFFF', fontSize: 9.5, fontWeight: '700' },

  // Section containers
  sectionGap:          { gap: 12 },

  // Search TextInput base
  searchInput:         { flex: 1 },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SearchCategory = 'All' | Exclude<ContentType, 'ad'>;

const fallbackCategories: SearchCategory[] = ['All', 'audio', 'video', 'live', 'playlist'];

function normalizeCategory(value: string): SearchCategory | null {
  if (value === 'All' || value === 'audio' || value === 'video' || value === 'live' || value === 'playlist' || value === 'announcement') return value;
  return null;
}

function labelForCategory(category: SearchCategory) {
  if (category === 'All') return 'All';
  if (category === 'audio') return 'Music';
  if (category === 'live') return 'Live';
  if (category === 'video') return 'Videos';
  if (category === 'playlist') return 'Playlists';
  return 'Updates';
}

const CATEGORY_ICONS: Partial<Record<SearchCategory, React.ComponentProps<typeof MaterialIcons>['name']>> = {
  All: 'apps',
  audio: 'graphic-eq',
  video: 'smart-display',
  live: 'live-tv',
  playlist: 'queue-music',
  announcement: 'campaign',
};

function getCategoryColor(category: SearchCategory, theme: ReturnType<typeof useAppTheme>): string {
  const map: Partial<Record<SearchCategory, string>> = {
    All:          theme.colors.primary,
    audio:        theme.colors.primary,
    video:        theme.colors.info,
    live:         theme.colors.danger,
    playlist:     theme.colors.warning,
    announcement: theme.colors.success,
  };
  return map[category] ?? theme.colors.primary;
}

// ─── DiscoveryItem ────────────────────────────────────────────────────────────

function DiscoveryItem({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const styles = useStyles();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false} style={styles.discoveryItemTouch}>
      <View style={styles.discoveryCard}>
        <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
        <View style={styles.discoveryOverlay}>
          <View style={styles.discoveryTitlePill}>
            <CustomText style={styles.discoveryTitleText} numberOfLines={1}>{item.title}</CustomText>
          </View>
        </View>
        {item.isLive ? (
          <View style={styles.discoveryLiveBadge}>
            <View style={styles.discoveryLiveDot} />
            <CustomText style={styles.discoveryLiveText}>LIVE</CustomText>
          </View>
        ) : null}
      </View>
    </TVTouchable>
  );
}

function DiscoveryGrid({ items, onPress }: { items: FeedCardItem[]; onPress: (_item: FeedCardItem) => void }) {
  const styles = useStyles();
  const device = useDeviceClass();
  const numCols = device.isTV ? 4 : device.isDesktop ? 3 : 2;

  if (!items.length) return null;

  const rows: FeedCardItem[][] = [];
  for (let i = 0; i < Math.min(items.length, numCols * 2); i += numCols) {
    rows.push(items.slice(i, i + numCols));
  }

  return (
    <View style={styles.discoveryGrid}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.discoveryRow}>
          {row.map((item) => (
            <DiscoveryItem key={item.id} item={item} onPress={() => onPress(item)} />
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Search() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const { config } = useMobileAppConfig();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('All');
  const [remoteResults, setRemoteResults] = useState<FeedCardItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const focusProgress = useRef(new Animated.Value(0)).current;
  const { feed, loading, error, refresh } = useContentFeed();
  const queryClient = useQueryClient();

  const configuredCategories = config?.discovery?.categories;
  const configuredShortcuts  = config?.discovery?.shortcuts;

  const categories = useMemo<SearchCategory[]>(() => {
    const normalized = (configuredCategories ?? []).map((c) => normalizeCategory(c)).filter((c): c is SearchCategory => Boolean(c));
    return normalized.length ? normalized : fallbackCategories;
  }, [configuredCategories]);

  const shortcuts = useMemo(
    () => (configuredShortcuts ?? []).filter((s) => s.label && s.query).slice(0, 8),
    [configuredShortcuts],
  );

  const allItems = useMemo(
    () => dedupeFeedItems([...feed.recommendations, ...feed.mostPlayed, ...feed.recent, ...feed.music, ...feed.videos, ...feed.playlists, ...feed.live, ...feed.announcements]),
    [feed],
  );

  const filtered = useMemo(() => {
    if (remoteResults) return remoteResults;
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesText = !q || [item.title, item.subtitle, item.description].join(' ').toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || item.type === activeCategory;
      return matchesText && matchesCategory;
    });
  }, [activeCategory, allItems, query, remoteResults]);

  const runSearch = useCallback(async () => {
    const normalized = query.trim();
    if (!normalized) {
      setRemoteResults(null);
      showToast({ title: 'Search is empty', message: 'Enter a title, artist, or topic.', tone: 'warning' });
      return;
    }
    setIsSearching(true);
    try {
      const type = activeCategory === 'All' ? undefined : activeCategory;
      const results = await queryClient.fetchQuery({
        queryKey: ['search', normalized, type ?? 'All'],
        queryFn: () => fetchSearchResults(normalized, type),
      });
      setRemoteResults(results);
      if (!results.length) showToast({ title: 'No matches', message: 'Try another word or category.', tone: 'info' });
    } catch (error) {
      showToast({ title: 'Search failed', message: error instanceof Error ? error.message : 'Unable to complete search.', tone: 'warning' });
    } finally {
      setIsSearching(false);
    }
  }, [activeCategory, query, showToast, queryClient]);

  const openResult = async (item: FeedCardItem) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source: 'search' });
    router.push(buildPlayerRoute(item));
  };

  const applyShortcut = (shortcut: NonNullable<typeof configuredShortcuts>[number]) => {
    const category = normalizeCategory(shortcut.category);
    setQuery(shortcut.query);
    if (category) setActiveCategory(category);
    setRemoteResults(null);
  };

  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    Animated.timing(focusProgress, {
      toValue: searchFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focusProgress, searchFocused]);

  const animatedSearchStyle = {
    transform: [{ scale: focusProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] }) }],
    borderColor: focusProgress.interpolate({ inputRange: [0, 1], outputRange: [theme.colors.border, theme.colors.primaryFocusBorder] }),
    backgroundColor: focusProgress.interpolate({ inputRange: [0, 1], outputRange: [theme.colors.subtleFill, theme.colors.subtleFillMed] }),
  };

  return (
    <PremiumPage title="Search" eyebrow="Discover" noBack refreshing={loading || isSearching} onRefresh={refresh}>
      {/* ── Search bar ── */}
      <SurfaceCard tone="strong" style={styles.searchBarCard}>
        <Animated.View
          style={[
            styles.searchInputBase,
            { minHeight: device.isTV ? 64 : 52 },
            animatedSearchStyle,
          ]}
        >
          <MaterialIcons name="search" size={device.isTV ? 22 : 18} color={theme.colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={(value) => { setQuery(value); setRemoteResults(null); }}
            placeholder="Search songs, videos, live sessions"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            returnKeyType="search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={() => void runSearch()}
            style={[styles.searchInput, { minHeight: device.isTV ? 60 : 48, color: theme.colors.text, fontSize: device.isTV ? 16 : 13 }]}
          />
          {query.trim() ? (
            <TVTouchable onPress={() => { setQuery(''); setRemoteResults(null); }} showFocusBorder={false} style={styles.clearBtn}>
              <MaterialIcons name="close" size={18} color={theme.colors.textSecondary} />
            </TVTouchable>
          ) : null}
          <TVTouchable
            onPress={() => void runSearch()}
            showFocusBorder={false}
            style={[
              styles.searchSubmitBtn,
              {
                width: device.isTV ? 48 : 38, height: device.isTV ? 48 : 38,
                borderRadius: device.isTV ? 24 : 19, opacity: isSearching ? 0.72 : 1,
              },
            ]}
          >
            <MaterialIcons name={isSearching ? 'hourglass-top' : 'arrow-forward'} size={device.isTV ? 22 : 18} color={theme.colors.textInverse} />
          </TVTouchable>
        </Animated.View>

        {/* Category filter pills */}
        <View style={styles.categoryPillRow}>
          {categories.map((category) => {
            const active = category === activeCategory;
            const color  = getCategoryColor(category, theme);
            const icon   = CATEGORY_ICONS[category] ?? 'label';
            return (
              <TVTouchable
                key={category}
                onPress={() => { setActiveCategory(category); setRemoteResults(null); }}
                showFocusBorder={false}
                style={[
                  styles.categoryPillBase,
                  {
                    minHeight: device.isTV ? 38 : 31,
                    backgroundColor: active ? `${color}22` : theme.colors.subtleFill,
                    borderColor: active ? color : theme.colors.border,
                  },
                ]}
              >
                <MaterialIcons name={icon} size={13} color={active ? color : theme.colors.textMuted} />
                <CustomText variant="caption" style={{ color: active ? color : theme.colors.textSecondary, fontWeight: active ? '700' : '500' }}>
                  {labelForCategory(category)}
                </CustomText>
              </TVTouchable>
            );
          })}
        </View>
      </SurfaceCard>

      {error && !hasQuery ? <InlineErrorBanner message={error} onRetry={() => void refresh()} /> : null}

      {/* ── Quick discovery shortcuts ── */}
      {!hasQuery && shortcuts.length > 0 ? (
        <View style={styles.shortcutGap}>
          <SectionLabel title="Quick discovery" accent="Explore" subtitle="Jump straight to a listening moment" />
          <View style={styles.shortcutRow}>
            {shortcuts.map((shortcut) => (
              <TVTouchable
                key={shortcut.id}
                onPress={() => applyShortcut(shortcut)}
                showFocusBorder={false}
                style={styles.shortcutChip}
              >
                <MaterialIcons name={shortcut.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={14} color={theme.colors.primary} />
                <CustomText style={styles.shortcutText}>{shortcut.label}</CustomText>
              </TVTouchable>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── Results (when query active) ── */}
      {hasQuery ? (
        <>
          <ContentList title={`Results for "${query.trim()}"`} items={filtered} onPressItem={(item) => void openResult(item)} />
          {!loading && !filtered.length ? (
            <EmptyState
              title="No results found"
              message="Try another title, artist, topic, or category."
              actionLabel="Clear search"
              onAction={() => { setQuery(''); setRemoteResults(null); }}
              icon="search-off"
            />
          ) : null}
        </>
      ) : null}

      {/* ── Discovery grid (no query) ── */}
      {!hasQuery ? (
        <>
          <View style={styles.sectionGap}>
            <SectionLabel title="Discover now" accent="Featured" subtitle="Explore what is available right now" />
            <DiscoveryGrid items={dedupeFeedItems([...feed.live, ...feed.videos, ...feed.music]).slice(0, 8)} onPress={(item) => void openResult(item)} />
          </View>

          <View style={styles.sectionGap}>
            <SectionLabel title="Popular music" accent="Trending" actionLabel="See all" onAction={() => router.push('/player')} />
            <ContentRail
              title=""
              items={feed.music.slice(0, device.isTV ? 12 : 10)}
              compact
              loading={loading}
              onPressItem={(item) => void openResult(item)}
            />
          </View>

          <View style={styles.sectionGap}>
            <SectionLabel title="Latest videos" accent="Watch" actionLabel="See all" onAction={() => router.push('/videos')} />
            <ContentRail
              title=""
              items={feed.videos.slice(0, device.isTV ? 12 : 10)}
              loading={loading}
              onPressItem={(item) => void openResult(item)}
            />
          </View>

          {feed.live.length > 0 ? (
            <ContentList
              title="Live & replays"
              items={feed.live.slice(0, 8)}
              onPressItem={(item) => void openResult(item)}
            />
          ) : null}
        </>
      ) : null}
    </PremiumPage>
  );
}
