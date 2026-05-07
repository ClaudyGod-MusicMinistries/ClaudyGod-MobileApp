import React, { useMemo } from 'react';
import { Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../../components/ui/AppButton';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import type { FeedCardItem } from '../../services/contentService';
import { ContentList, ContentRail, EmptyState, PremiumHero, PremiumPage, QuickActionGrid, dedupeFeedItems, getFeaturedItem } from '../../components/Exp/PremiumContent';

const FALLBACK_WORD = { title: 'Word for Today', passage: 'Psalm 119:105', verse: 'Your word is a lamp to my feet and a light to my path.', reflection: 'Let the word guide your steps today.' };

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { feed, loading, refresh } = useContentFeed();
  const { word } = useWordOfDay();

  const featured = useMemo(() => feed.featured ?? getFeaturedItem(feed.live, feed.music, feed.videos, feed.recent, feed.mostPlayed), [feed]);
  const continueItems = useMemo(() => dedupeFeedItems([...feed.recent, ...feed.recommendations, ...feed.mostPlayed]).slice(0, 12), [feed]);
  const discoverItems = useMemo(() => dedupeFeedItems([...feed.music, ...feed.videos, ...feed.live, ...feed.playlists]).slice(0, 8), [feed]);
  const wordForToday = word ? { title: word.title || 'Word for Today', passage: word.passage, verse: word.verse, reflection: word.reflection } : FALLBACK_WORD;

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  return (
    <PremiumPage
      title="Home"
      subtitle="Your music, worship videos, live sessions, and saved moments in one calm space."
      eyebrow="Welcome"
      refreshing={loading}
      onRefresh={refresh}
      rightAction={<AppButton title="Search" variant="secondary" size="sm" onPress={() => router.push(APP_ROUTES.tabs.search)} leftIcon={<MaterialIcons name="search" size={16} color={theme.colors.text} />} />}
    >
      <PremiumHero
        item={featured}
        title={featured?.title ?? 'Start listening'}
        subtitle={featured?.description ?? 'Discover worship, music, videos, and live ministry moments curated for you.'}
        eyebrow={featured?.subtitle ?? 'Featured'}
        primaryLabel={featured?.type === 'video' || featured?.type === 'live' ? 'Watch now' : 'Play now'}
        primaryIcon={featured?.type === 'video' || featured?.type === 'live' ? 'smart-display' : 'play-arrow'}
        onPrimary={() => (featured ? void openItem(featured, 'home_hero') : router.push(APP_ROUTES.tabs.player))}
        secondaryLabel="Library"
        secondaryIcon="library-music"
        onSecondary={() => router.push(APP_ROUTES.tabs.library)}
      />

      <QuickActionGrid actions={[
        { label: 'Music', hint: 'Songs and messages', icon: 'graphic-eq', onPress: () => router.push(APP_ROUTES.tabs.player) },
        { label: 'Videos', hint: 'Watch latest releases', icon: 'smart-display', onPress: () => router.push(APP_ROUTES.tabs.videos) },
        { label: 'Live', hint: 'Join sessions', icon: 'live-tv', onPress: () => router.push(APP_ROUTES.tabs.live) },
        { label: 'Library', hint: 'Your saved moments', icon: 'library-music', onPress: () => router.push(APP_ROUTES.tabs.library) },
      ]} />

      <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
        <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.85 }}>{wordForToday.title}</CustomText>
        <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 8 }}>{wordForToday.passage}</CustomText>
        <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>{wordForToday.verse}</CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.textMuted, marginTop: 8 }}>{wordForToday.reflection}</CustomText>
        <AppButton title="Share word" variant="outline" size="sm" onPress={() => void Share.share({ message: `${wordForToday.passage}\n\n${wordForToday.verse}\n\n${wordForToday.reflection}` })} style={{ marginTop: 14 }} />
      </SurfaceCard>

      <ContentRail title="Continue listening" items={continueItems} compact onPressItem={(item) => void openItem(item, 'home_continue')} />
      <ContentRail title="Music" items={feed.music} onPressItem={(item) => void openItem(item, 'home_music')} actionLabel="More" onAction={() => router.push(APP_ROUTES.tabs.player)} />
      <ContentRail title="Videos" items={feed.videos} onPressItem={(item) => void openItem(item, 'home_videos')} actionLabel="More" onAction={() => router.push(APP_ROUTES.tabs.videos)} />
      <ContentRail title="Live & replays" items={feed.live} compact onPressItem={(item) => void openItem(item, 'home_live')} actionLabel="Open" onAction={() => router.push(APP_ROUTES.tabs.live)} />
      <ContentList title="Top picks" items={discoverItems} onPressItem={(item) => void openItem(item, 'home_top_picks')} />

      {!loading && !discoverItems.length ? <EmptyState title="Fresh content will appear here" message="When new music, videos, or live sessions are available, they will show up on this screen." actionLabel="Refresh" onAction={refresh} /> : null}
    </PremiumPage>
  );
}
