import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useToast } from '../../context/ToastContext';
import { useContentFeed } from '../../hooks/useContentFeed';
import { fetchSearchResults } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { FeedCardItem } from '../../services/contentService';
import { ContentList, ContentRail, EmptyState, PremiumPage, QuickActionGrid, dedupeFeedItems } from '../../components/Exp/PremiumContent';

const CATEGORIES = ['All', 'audio', 'video', 'live', 'playlist'] as const;

export default function Search() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [remoteResults, setRemoteResults] = useState<FeedCardItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { feed, loading, refresh } = useContentFeed();

  const allItems = useMemo(() => dedupeFeedItems([...feed.music, ...feed.videos, ...feed.playlists, ...feed.live, ...feed.announcements, ...feed.mostPlayed, ...feed.recent]), [feed]);
  const filtered = useMemo(() => {
    if (remoteResults) return remoteResults;
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesText = !q || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || item.type === activeCategory;
      return matchesText && matchesCategory;
    });
  }, [activeCategory, allItems, query, remoteResults]);

  const runSearch = async () => {
    const normalized = query.trim();
    if (!normalized) { setRemoteResults(null); showToast({ title: 'Search is empty', message: 'Enter a title, artist, or topic.', tone: 'warning' }); return; }
    setIsSearching(true);
    try {
      const results = await fetchSearchResults(normalized, activeCategory === 'All' ? undefined : activeCategory);
      setRemoteResults(results);
      if (!results.length) showToast({ title: 'No matches', message: 'Try another word or category.', tone: 'info' });
    } finally { setIsSearching(false); }
  };

  const openResult = async (item: FeedCardItem) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source: 'search' });
    router.push(buildPlayerRoute(item));
  };

  return (
    <PremiumPage title="Search" subtitle="Find music, videos, playlists, live sessions, and messages quickly." eyebrow="Discover" refreshing={loading || isSearching} onRefresh={refresh} rightAction={<AppButton title="Home" variant="secondary" size="sm" onPress={() => router.push(APP_ROUTES.tabs.home)} leftIcon={<MaterialIcons name="home-filled" size={16} color={theme.colors.text} />} />}>
      <SurfaceCard tone="strong" style={{ padding: theme.spacing.md }}>
        <View style={{ minHeight: 52, borderRadius: theme.radius.pill, backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(17,10,31,0.05)', borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
          <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput value={query} onChangeText={(value) => { setQuery(value); setRemoteResults(null); }} placeholder="Search songs, videos, live sessions" placeholderTextColor={theme.colors.textSecondary} autoCapitalize="none" returnKeyType="search" onSubmitEditing={() => void runSearch()} style={{ flex: 1, minHeight: 48, color: theme.colors.text, fontSize: 14, outlineStyle: 'none' as never }} />
          {query.trim() ? <TVTouchable onPress={() => { setQuery(''); setRemoteResults(null); }} showFocusBorder={false}><MaterialIcons name="close" size={20} color={theme.colors.textSecondary} /></TVTouchable> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {CATEGORIES.map((category) => {
            const active = category === activeCategory;
            return <TVTouchable key={category} onPress={() => { setActiveCategory(category); setRemoteResults(null); }} showFocusBorder={false} style={{ minHeight: 34, borderRadius: theme.radius.pill, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt, borderWidth: 1, borderColor: active ? theme.colors.primary : theme.colors.border }}><CustomText variant="caption" style={{ color: active ? theme.colors.textInverse : theme.colors.textSecondary }}>{category === 'audio' ? 'Music' : category}</CustomText></TVTouchable>;
          })}
        </View>
        <AppButton title="Search" onPress={() => void runSearch()} loading={isSearching} loadingLabel="Searching" style={{ marginTop: 14 }} leftIcon={<MaterialIcons name="search" size={17} color={theme.colors.textInverse} />} />
      </SurfaceCard>

      {!query.trim() ? <QuickActionGrid actions={[{ label: 'Music', hint: 'Songs and messages', icon: 'graphic-eq', onPress: () => router.push(APP_ROUTES.tabs.player) }, { label: 'Videos', hint: 'Visual sessions', icon: 'smart-display', onPress: () => router.push(APP_ROUTES.tabs.videos) }, { label: 'Live', hint: 'Now and upcoming', icon: 'live-tv', onPress: () => router.push(APP_ROUTES.tabs.live) }, { label: 'Library', hint: 'Saved favorites', icon: 'library-music', onPress: () => router.push(APP_ROUTES.tabs.library) }]} /> : null}
      <ContentList title={query.trim() ? 'Results' : 'Explore'} items={filtered} onPressItem={(item) => void openResult(item)} />
      <ContentRail title="Popular music" items={feed.music} compact onPressItem={(item) => void openResult(item)} />
      <ContentRail title="Latest videos" items={feed.videos} compact onPressItem={(item) => void openResult(item)} />
      {!loading && query.trim() && !filtered.length ? <EmptyState title="No results found" message="Try another title, artist, topic, or category." actionLabel="Clear search" onAction={() => { setQuery(''); setRemoteResults(null); }} icon="search-off" /> : null}
    </PremiumPage>
  );
}
