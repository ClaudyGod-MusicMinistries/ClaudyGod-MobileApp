import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useToast } from '../../context/ToastContext';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { fetchSearchResults, type ContentType, type FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { buildPlayerRoute } from '../../util/playerRoute';
import {
  ContentList,
  ContentRail,
  EmptyState,
  PremiumPage,
  dedupeFeedItems,
} from '../../components/Exp/PremiumContent';

type SearchCategory = 'All' | Exclude<ContentType, 'ad'>;

const fallbackCategories: SearchCategory[] = ['All', 'audio', 'video', 'live', 'playlist'];

function normalizeCategory(value: string): SearchCategory | null {
  if (value === 'All' || value === 'audio' || value === 'video' || value === 'live' || value === 'playlist' || value === 'announcement') {
    return value;
  }
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

export default function Search() {
  const theme = useAppTheme();
  const router = useRouter();
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
    const normalized = (configuredCategories ?? [])
      .map((category) => normalizeCategory(category))
      .filter((category): category is SearchCategory => Boolean(category));
    return normalized.length ? normalized : fallbackCategories;
  }, [configuredCategories]);

  const shortcuts = useMemo(
    () => (configuredShortcuts ?? []).filter((shortcut) => shortcut.label && shortcut.query).slice(0, 6),
    [configuredShortcuts],
  );

  const allItems = useMemo(
    () => dedupeFeedItems([
      ...feed.recommendations,
      ...feed.mostPlayed,
      ...feed.recent,
      ...feed.music,
      ...feed.videos,
      ...feed.playlists,
      ...feed.live,
      ...feed.announcements,
    ]),
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

  const runSearch = async () => {
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
      if (!results.length) {
        showToast({ title: 'No matches', message: 'Try another word or category.', tone: 'info' });
      }
    } catch (error) {
      showToast({ title: 'Search failed', message: error instanceof Error ? error.message : 'Unable to complete search.', tone: 'warning' });
    } finally {
      setIsSearching(false);
    }
  };

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
  const animatedSearchStyle = {
    transform: [
      {
        scale: focusProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.012],
        }),
      },
    ],
    borderColor: focusProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.border, theme.scheme === 'dark' ? 'rgba(183,148,246,0.38)' : 'rgba(124,58,237,0.34)'],
    }),
    backgroundColor: focusProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        theme.scheme === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(17,10,31,0.04)',
        theme.scheme === 'dark' ? 'rgba(255,255,255,0.082)' : 'rgba(17,10,31,0.065)',
      ],
    }),
  };

  useEffect(() => {
    Animated.timing(focusProgress, {
      toValue: searchFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focusProgress, searchFocused]);

  return (
    <PremiumPage
      title="Search"
      eyebrow="Discover"
      noBack
      refreshing={loading || isSearching}
      onRefresh={refresh}
    >
      <SurfaceCard tone="strong" style={{ padding: theme.spacing.md }}>
        <Animated.View
          style={[{
            minHeight: 52,
            borderRadius: 999,
            borderWidth: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 14,
            paddingRight: 7,
            gap: 9,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: searchFocused ? 0.14 : 0,
            shadowRadius: 18,
            elevation: searchFocused ? 8 : 0,
          }, animatedSearchStyle]}
        >
          <MaterialIcons name="search" size={18} color={theme.colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              setRemoteResults(null);
            }}
            placeholder="Search songs, videos, live sessions"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            returnKeyType="search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={() => void runSearch()}
            style={{
              flex: 1,
              minHeight: 48,
              color: theme.colors.text,
              fontSize: 13,
            }}
          />
          {query.trim() ? (
            <TVTouchable onPress={() => { setQuery(''); setRemoteResults(null); }} showFocusBorder={false}>
              <MaterialIcons name="close" size={18} color={theme.colors.textSecondary} />
            </TVTouchable>
          ) : null}
          <TVTouchable
            onPress={() => void runSearch()}
            showFocusBorder={false}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primary,
              opacity: isSearching ? 0.72 : 1,
            }}
          >
            <MaterialIcons name={isSearching ? 'hourglass-top' : 'arrow-forward'} size={18} color={theme.colors.textInverse} />
          </TVTouchable>
        </Animated.View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>
          {categories.map((category) => {
            const active = category === activeCategory;
            return (
              <TVTouchable
                key={category}
                onPress={() => {
                  setActiveCategory(category);
                  setRemoteResults(null);
                }}
                showFocusBorder={false}
                style={{
                  minHeight: 31,
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                }}
              >
                <CustomText variant="caption" style={{ color: active ? theme.colors.textInverse : theme.colors.textSecondary }}>
                  {labelForCategory(category)}
                </CustomText>
              </TVTouchable>
            );
          })}
        </View>
      </SurfaceCard>

      {!hasQuery && shortcuts.length ? (
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
          <CustomText variant="title" style={{ color: theme.colors.text }}>
            Suggested discovery
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
            Quick starts for common listening paths.
          </CustomText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {shortcuts.map((shortcut) => (
              <TVTouchable
                key={shortcut.id}
                onPress={() => applyShortcut(shortcut)}
                showFocusBorder={false}
                style={{
                  borderRadius: theme.radius.pill,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.04)',
                  paddingHorizontal: 11,
                  minHeight: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <MaterialIcons name={shortcut.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={14} color={theme.colors.primary} />
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
                  {shortcut.label}
                </CustomText>
              </TVTouchable>
            ))}
          </View>
        </SurfaceCard>
      ) : null}

      <ContentList title={hasQuery ? 'Results' : 'Explore'} items={filtered} onPressItem={(item) => void openResult(item)} />

      {!hasQuery ? (
        <>
          <ContentRail
            title="Popular music"
            items={feed.music.slice(0, 12)}
            compact
            loading={loading}
            onPressItem={(item) => void openResult(item)}
            emptyTitle="No music matches yet"
            emptyMessage="Try a different search or explore videos."
          />
          <ContentRail
            title="Latest videos"
            items={feed.videos.slice(0, 12)}
            compact
            loading={loading}
            onPressItem={(item) => void openResult(item)}
            emptyTitle="No videos match yet"
            emptyMessage="Try a different search or explore music."
          />
        </>
      ) : null}

      {!loading && hasQuery && !filtered.length ? (
        <EmptyState
          title="No results found"
          message="Try another title, artist, topic, or category."
          actionLabel="Clear search"
          onAction={() => { setQuery(''); setRemoteResults(null); }}
          icon="search-off"
        />
      ) : null}
    </PremiumPage>
  );
}
