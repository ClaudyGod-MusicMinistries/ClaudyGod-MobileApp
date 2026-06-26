import React, { useMemo } from 'react';
import { Image, ScrollView, View } from 'react-native';
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
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import {
  EmptyState,
  FeaturedSectionCard,
  GreetingBanner,
  LiveNowBanner,
  PremiumHero,
  PremiumPage,
  TrendingList,
  WordOfDayCard,
} from '../../components/Exp/PremiumContent';

function dedupe(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const out: FeedCardItem[] = [];
  for (const item of items) {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (!seen.has(key)) { seen.add(key); out.push(item); }
  }
  return out;
}

// ─── Continue Row ─────────────────────────────────────────────────────────────

function ContinueRow({ items, onPress }: { items: FeedCardItem[]; onPress: (_item: FeedCardItem) => void }) {
  const theme = useAppTheme();
  if (!items.length) return null;

  return (
    <View style={{ gap: 14 }}>
      <CustomText style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 }}>
        Continue listening
      </CustomText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingVertical: 2, paddingRight: 8 }}
      >
        {items.slice(0, 8).map((item) => (
          <TVTouchable key={item.id} onPress={() => onPress(item)} showFocusBorder={false}>
            <View style={{ alignItems: 'center', gap: 9, width: 80 }}>
              <View style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt }}>
                <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={{ width: 72, height: 72 }} />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="play-arrow" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </View>
              <CustomText style={{ color: theme.colors.textSecondary, fontSize: 11, textAlign: 'center', fontWeight: '500', lineHeight: 15 }} numberOfLines={2}>
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

  // One featured item per section — pick the first tagged or first by type
  const musicFeatured = useMemo(() => {
    return feed.music.find((i) => i.appSections?.includes('music')) ?? feed.music[0] ?? null;
  }, [feed.music]);

  const nuggetsFeatured = useMemo(() => {
    const pool = [...feed.videos, ...feed.music];
    return pool.find((i) => i.appSections?.includes('nuggets-of-truth')) ?? feed.videos[0] ?? null;
  }, [feed.videos, feed.music]);

  const teensFeatured = useMemo(() => {
    const pool = [...feed.videos, ...feed.music];
    return pool.find((i) => i.appSections?.includes('teens')) ?? feed.videos[1] ?? null;
  }, [feed.videos, feed.music]);

  const audioFeatured = useMemo(() => {
    const pool = [...feed.music];
    return pool.find((i) => i.appSections?.includes('audio') && i !== musicFeatured) ?? feed.music[1] ?? null;
  }, [feed.music, musicFeatured]);

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  const hasContent = allContent.length > 0;

  return (
    <PremiumPage title="Home" eyebrow="Home" noBack refreshing={loading} onRefresh={() => void refresh()}>

      {/* Greeting */}
      <GreetingBanner />

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

      {/* Live banner */}
      {liveSessions[0] ? (
        <LiveNowBanner item={liveSessions[0]} onPress={() => void openItem(liveSessions[0]!, 'home_live_banner')} />
      ) : null}

      {/* Continue listening */}
      {feed.recent.length > 0 ? (
        <ContinueRow items={continueItems} onPress={(item) => void openItem(item, 'home_continue')} />
      ) : null}

      {/* ── 4 Editorial section cards ─────────────────────────────────────── */}

      <FeaturedSectionCard
        sectionTitle="ClaudyGod Music"
        item={musicFeatured}
        onPress={() => musicFeatured ? void openItem(musicFeatured, 'home_music_featured') : router.push(APP_ROUTES.tabs.player)}
        onSeeAll={() => router.push(APP_ROUTES.tabs.player)}
        loading={loading && !musicFeatured}
      />

      <FeaturedSectionCard
        sectionTitle="Nuggets of Truth"
        item={nuggetsFeatured}
        onPress={() => nuggetsFeatured ? void openItem(nuggetsFeatured, 'home_nuggets_featured') : router.push(APP_ROUTES.tabs.videos)}
        onSeeAll={() => router.push(APP_ROUTES.tabs.videos)}
        loading={loading && !nuggetsFeatured}
      />

      <FeaturedSectionCard
        sectionTitle="ClaudyGod Teens"
        item={teensFeatured}
        onPress={() => teensFeatured ? void openItem(teensFeatured, 'home_teens_featured') : router.push(APP_ROUTES.tabs.videos)}
        onSeeAll={() => router.push(APP_ROUTES.tabs.videos)}
        loading={loading && !teensFeatured}
      />

      <FeaturedSectionCard
        sectionTitle="Latest Audio"
        item={audioFeatured ?? musicFeatured}
        onPress={() => {
          const item = audioFeatured ?? musicFeatured;
          if (item) void openItem(item, 'home_audio_featured');
          else router.push(APP_ROUTES.tabs.player);
        }}
        onSeeAll={() => router.push(APP_ROUTES.tabs.player)}
        loading={loading && !audioFeatured && !musicFeatured}
      />

      {/* Most played — compact top 5 */}
      {feed.mostPlayed.length > 0 ? (
        <TrendingList
          title="Most played"
          items={feed.mostPlayed.slice(0, 5)}
          onPressItem={(item) => void openItem(item, 'home_trending')}
          actionLabel="See all"
          onAction={() => router.push(APP_ROUTES.tabs.player)}
        />
      ) : null}

      {/* Daily scripture */}
      {bibleVerse ? (
        <WordOfDayCard word={bibleVerse} onPress={() => router.push(APP_ROUTES.settingsPages.word)} />
      ) : null}

      {/* Admin word — shown only when different from bible verse */}
      {adminWord && adminWord.id !== bibleVerse?.id ? (
        <WordOfDayCard word={adminWord} onPress={() => router.push(APP_ROUTES.settingsPages.word)} />
      ) : null}

      {/* Support */}
      <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />

      {/* Empty state */}
      {!loading && !hasContent ? (
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
