import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useToast } from '../../context/ToastContext';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useDeviceClass } from '../../util/deviceClassConfig';
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
} from '../../components/Exp/PremiumContent';

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

// ─── Discovery Grid (no query state) ──────────────────────────────────────────

function DiscoveryItem({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false} style={{ flex: 1, minWidth: 140 }}>
      <View
        style={{
          borderRadius: 16, overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAlt,
          aspectRatio: 16 / 9,
        }}
      >
        <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 }}>
          <View style={{ borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.62)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3 }}>
            <CustomText style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }} numberOfLines={1}>
              {item.title}
            </CustomText>
          </View>
        </View>
        {item.isLive ? (
          <View style={{ position: 'absolute', top: 8, left: 8, borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.88)', paddingHorizontal: 7, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF' }} />
            <CustomText style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>LIVE</CustomText>
          </View>
        ) : null}
      </View>
    </TVTouchable>
  );
}

function DiscoveryGrid({ items, onPress }: { items: FeedCardItem[]; onPress: (_item: FeedCardItem) => void }) {
  const device = useDeviceClass();
  const numCols = device.isTV ? 4 : device.isDesktop ? 3 : 2;

  if (!items.length) return null;

  const rows: FeedCardItem[][] = [];
  for (let i = 0; i < Math.min(items.length, numCols * 2); i += numCols) {
    rows.push(items.slice(i, i + numCols));
  }

  return (
    <View style={{ gap: 10 }}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', gap: 10 }}>
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
  const theme = useAppTheme();
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
  const { feed, loading, refresh } = useContentFeed();

  const configuredCategories = config?.discovery?.categories;
  const configuredShortcuts = config?.discovery?.shortcuts;

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
      const results = await fetchSearchResults(normalized, type);
      setRemoteResults(results);
      if (!results.length) showToast({ title: 'No matches', message: 'Try another word or category.', tone: 'info' });
    } catch (error) {
      showToast({ title: 'Search failed', message: error instanceof Error ? error.message : 'Unable to complete search.', tone: 'warning' });
    } finally {
      setIsSearching(false);
    }
  }, [activeCategory, query, showToast]);

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
    borderColor: focusProgress.interpolate({ inputRange: [0, 1], outputRange: [theme.colors.border, theme.scheme === 'dark' ? 'rgba(183,148,246,0.38)' : 'rgba(124,58,237,0.34)'] }),
    backgroundColor: focusProgress.interpolate({ inputRange: [0, 1], outputRange: [theme.scheme === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(17,10,31,0.04)', theme.scheme === 'dark' ? 'rgba(255,255,255,0.082)' : 'rgba(17,10,31,0.065)'] }),
  };

  return (
    <PremiumPage title="Search" eyebrow="Discover" noBack refreshing={loading || isSearching} onRefresh={refresh}>
      {/* ── Search bar ── */}
      <SurfaceCard tone="strong" style={{ padding: theme.spacing.md }}>
        <Animated.View
          style={[{
            minHeight: device.isTV ? 64 : 52,
            borderRadius: 999,
            borderWidth: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 16,
            paddingRight: 8,
            gap: 10,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: searchFocused ? 0.14 : 0,
            shadowRadius: 18,
            elevation: searchFocused ? 8 : 0,
          }, animatedSearchStyle]}
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
            style={{ flex: 1, minHeight: device.isTV ? 60 : 48, color: theme.colors.text, fontSize: device.isTV ? 16 : 13 }}
          />
          {query.trim() ? (
            <TVTouchable onPress={() => { setQuery(''); setRemoteResults(null); }} showFocusBorder={false} style={{ padding: 6 }}>
              <MaterialIcons name="close" size={18} color={theme.colors.textSecondary} />
            </TVTouchable>
          ) : null}
          <TVTouchable
            onPress={() => void runSearch()}
            showFocusBorder={false}
            style={{
              width: device.isTV ? 48 : 38, height: device.isTV ? 48 : 38,
              borderRadius: device.isTV ? 24 : 19, alignItems: 'center', justifyContent: 'center',
              backgroundColor: theme.colors.primary, opacity: isSearching ? 0.72 : 1,
            }}
          >
            <MaterialIcons name={isSearching ? 'hourglass-top' : 'arrow-forward'} size={device.isTV ? 22 : 18} color={theme.colors.textInverse} />
          </TVTouchable>
        </Animated.View>

        {/* Category filter pills */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {categories.map((category) => {
            const active = category === activeCategory;
            const color = getCategoryColor(category, theme);
            const icon = CATEGORY_ICONS[category] ?? 'label';
            return (
              <TVTouchable
                key={category}
                onPress={() => { setActiveCategory(category); setRemoteResults(null); }}
                showFocusBorder={false}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  minHeight: device.isTV ? 38 : 31, paddingHorizontal: 12,
                  borderRadius: theme.radius.pill,
                  backgroundColor: active
                    ? `${color}22`
                    : theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderWidth: 1,
                  borderColor: active ? color : theme.colors.border,
                }}
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

      {/* ── Quick discovery shortcuts ── */}
      {!hasQuery && shortcuts.length > 0 ? (
        <View style={{ gap: 12 }}>
          <SectionLabel title="Quick discovery" accent="Explore" subtitle="Jump straight to a listening moment" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {shortcuts.map((shortcut) => (
              <TVTouchable
                key={shortcut.id}
                onPress={() => applyShortcut(shortcut)}
                showFocusBorder={false}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 7,
                  borderRadius: theme.radius.pill, borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.04)',
                  paddingHorizontal: 14, paddingVertical: 8,
                }}
              >
                <MaterialIcons name={shortcut.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={14} color={theme.colors.primary} />
                <CustomText style={{ color: theme.colors.textSecondary, fontSize: 12.5, fontWeight: '500' }}>
                  {shortcut.label}
                </CustomText>
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
          <View style={{ gap: 12 }}>
            <SectionLabel title="Discover now" accent="Featured" subtitle="Explore what is available right now" />
            <DiscoveryGrid items={dedupeFeedItems([...feed.live, ...feed.videos, ...feed.music]).slice(0, 8)} onPress={(item) => void openResult(item)} />
          </View>

          <View style={{ gap: 12 }}>
            <SectionLabel title="Popular music" accent="Trending" actionLabel="See all" onAction={() => router.push('/player')} />
            <ContentRail
              title=""
              items={feed.music.slice(0, device.isTV ? 12 : 10)}
              compact
              loading={loading}
              onPressItem={(item) => void openResult(item)}
            />
          </View>

          <View style={{ gap: 12 }}>
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