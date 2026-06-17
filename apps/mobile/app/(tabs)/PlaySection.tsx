import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AudioPlayer } from '../../components/media/AudioPlayer';
import { AppButton } from '../../components/ui/AppButton';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { ContentType, FeedBundle, FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { buildPlayerRoute, isDirectPlayableAudioUrl, routeParamToString, shouldOpenVideoScreen } from '../../util/playerRoute';
import {
  CompactContentRow,
  ContentList,
  ContentRail,
  EmptyState,
  PremiumHero,
  PremiumPage,
  SectionLabel,
  TrendingList,
  dedupeFeedItems,
} from '../../components/Exp/PremiumContent';

function dedupeItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterBySection(feed: FeedBundle, sectionId: string, fallbackTypes: ContentType[], limit = 12): FeedCardItem[] {
  const pool = dedupeItems([...feed.music, ...feed.videos, ...feed.playlists, ...feed.live]);
  const tagged = pool.filter((item) => item.appSections?.includes(sectionId));
  const result = tagged.length >= 2 ? tagged : pool.filter((item) => (fallbackTypes as string[]).includes(item.type));
  return result.slice(0, limit);
}

type AudioFilter = 'all' | 'songs' | 'messages' | 'playlists';

function parseRouteItem(params: {
  itemId?: string | string[];
  itemType?: string | string[];
  title?: string | string[];
  subtitle?: string | string[];
  imageUrl?: string | string[];
  duration?: string | string[];
  mediaUrl?: string | string[];
}): FeedCardItem | null {
  const itemId = routeParamToString(params.itemId);
  if (!itemId) return null;
  return {
    id: itemId, type: 'audio',
    title: routeParamToString(params.title) ?? 'Untitled',
    subtitle: routeParamToString(params.subtitle) ?? 'ClaudyGod',
    description: '',
    duration: routeParamToString(params.duration) ?? '--:--',
    imageUrl: routeParamToString(params.imageUrl) ?? DEFAULT_CONTENT_IMAGE_URI,
    mediaUrl: routeParamToString(params.mediaUrl),
  };
}

const FILTERS: { id: AudioFilter; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
  { id: 'all',      label: 'All',       icon: 'apps' },
  { id: 'songs',    label: 'Songs',     icon: 'music-note' },
  { id: 'messages', label: 'Messages',  icon: 'mic' },
  { id: 'playlists',label: 'Playlists', icon: 'queue-music' },
];

function FilterChips({ active, onChange }: { active: AudioFilter; onChange: (_f: AudioFilter) => void }) {
  const theme = useAppTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {FILTERS.map((f) => {
        const isActive = f.id === active;
        return (
          <TouchableOpacity
            key={f.id}
            onPress={() => onChange(f.id)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
              backgroundColor: isActive ? theme.colors.primary : (theme.scheme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
              borderWidth: 1,
              borderColor: isActive ? 'transparent' : (theme.scheme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
            }}
          >
            <MaterialIcons name={f.icon} size={13} color={isActive ? '#FFFFFF' : theme.colors.textSecondary} />
            <Text style={{ color: isActive ? '#FFFFFF' : theme.colors.textSecondary, fontSize: 12.5, fontWeight: isActive ? '700' : '500' }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default function PlaySection() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    itemId?: string | string[];
    itemType?: string | string[];
    title?: string | string[];
    subtitle?: string | string[];
    imageUrl?: string | string[];
    duration?: string | string[];
    mediaUrl?: string | string[];
  }>();
  const { feed, loading, refresh } = useContentFeed();
  const [filter, setFilter] = useState<AudioFilter>('all');

  const musicItems = useMemo(() => filterBySection(feed, 'music', ['audio']), [feed]);
  const audioItems = useMemo(() => filterBySection(feed, 'audio', ['audio', 'playlist']), [feed]);
  const nuggetsItems = useMemo(() => filterBySection(feed, 'nuggets-of-truth', ['video']), [feed]);
  const teensItems = useMemo(() => filterBySection(feed, 'teens', ['video', 'playlist']), [feed]);

  const routeItem = useMemo(() => parseRouteItem(params), [params]);
  const allQueue = useMemo(
    () => dedupeFeedItems([...(routeItem ? [routeItem] : []), ...feed.music, ...feed.mostPlayed, ...feed.recommendations, ...feed.playlists, ...feed.recent])
      .filter((item) => !shouldOpenVideoScreen(item)),
    [feed, routeItem],
  );

  const filteredQueue = useMemo(() => {
    if (filter === 'all') return allQueue;
    if (filter === 'songs') return allQueue.filter((item) => item.type === 'audio');
    if (filter === 'messages') return allQueue.filter((item) => item.subtitle?.toLowerCase().includes('message') || item.description?.toLowerCase().includes('message'));
    if (filter === 'playlists') return allQueue.filter((item) => item.type === 'playlist');
    return allQueue;
  }, [allQueue, filter]);

  const [activeId, setActiveId] = useState(routeItem?.id ?? allQueue[0]?.id ?? '');
  const active = allQueue.find((item) => item.id === activeId) ?? routeItem ?? allQueue[0] ?? null;
  const activeIndex = active ? allQueue.findIndex((item) => item.id === active.id) : -1;
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < allQueue.length - 1;
  const hasInlineAudio = Boolean(active?.mediaUrl && isDirectPlayableAudioUrl(active.mediaUrl));

  const openItem = async (item: FeedCardItem, source: string) => {
    if (!item.mediaUrl) {
      showToast({ title: 'Playback unavailable', message: 'This item is not ready to play yet.', tone: 'warning' });
      return;
    }
    if (!isDirectPlayableAudioUrl(item.mediaUrl)) {
      if (shouldOpenVideoScreen(item)) router.push(buildPlayerRoute(item));
      else await Linking.openURL(item.mediaUrl);
      return;
    }
    setActiveId(item.id);
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
  };

  const goPrevious = () => { const prev = canGoPrevious ? allQueue[activeIndex - 1] : null; if (prev) void openItem(prev, 'music_prev'); };
  const goNext    = () => { const next = canGoNext ? allQueue[activeIndex + 1] : null; if (next) void openItem(next, 'music_next'); };

  const upNext = allQueue.filter((item) => item.id !== active?.id).slice(0, 6);

  return (
    <PremiumPage
      title="Music"
      eyebrow="Listen"
      noBack
      refreshing={loading}
      onRefresh={refresh}
      rightAction={
        <AppButton
          title=""
          variant="secondary"
          size="sm"
          onPress={() => router.push(APP_ROUTES.tabs.library)}
          leftIcon={<MaterialIcons name="library-music" size={16} color={theme.colors.text} />}
          style={{ minWidth: 40, paddingHorizontal: 10 }}
        />
      }
    >
      {/* Now Playing */}
      {active && hasInlineAudio && active.mediaUrl ? (
        <AudioPlayer
          track={{ id: active.id, title: active.title, artist: active.subtitle, uri: active.mediaUrl, duration: active.duration, imageUrl: active.imageUrl }}
          onPrevious={goPrevious}
          onNext={goNext}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
        />
      ) : (
        <PremiumHero
          item={active}
          title={active?.title ?? 'Choose something to play'}
          subtitle={active?.description || 'Select a song, message, or playlist to begin listening.'}
          primaryLabel={active?.mediaUrl ? 'Open' : 'Browse music'}
          primaryIcon={active?.mediaUrl ? 'open-in-new' : 'graphic-eq'}
          onPrimary={() => (active ? void openItem(active, 'music_hero') : undefined)}
        />
      )}

      {/* Filter chips */}
      <FilterChips active={filter} onChange={setFilter} />

      {/* Up next queue */}
      {upNext.length > 0 ? (
        <View style={{ gap: 10 }}>
          <SectionLabel title="Up next" accent={`${upNext.length} tracks`} />
          <View style={{ gap: 4 }}>
            {upNext.map((item) => (
              <CompactContentRow key={item.id} item={item} onPress={() => void openItem(item, 'music_queue')} />
            ))}
          </View>
        </View>
      ) : null}

      {/* 4 ClaudyGod-branded sections */}
      <View style={{ gap: 28 }}>

        <View style={{ gap: 10 }}>
          <SectionLabel title="ClaudyGod Music" actionLabel="See all" onAction={() => {}} />
          <ContentRail
            title=""
            items={musicItems.length ? musicItems : filteredQueue.filter(i => i.type === 'audio').slice(0, 12)}
            loading={loading}
            onPressItem={(item) => void openItem(item, 'player_music')}
            cardVariant="portrait"
            emptyTitle="Music coming soon"
            emptyMessage="Worship tracks from ClaudyGod will appear here."
          />
        </View>

        <View style={{ gap: 10 }}>
          <SectionLabel title="ClaudyGod Audio" actionLabel="See all" onAction={() => {}} />
          <ContentRail
            title=""
            items={audioItems.length ? audioItems : filteredQueue.filter(i => i.type === 'playlist').slice(0, 12)}
            loading={loading}
            onPressItem={(item) => void openItem(item, 'player_audio')}
            cardVariant="portrait"
            emptyTitle="Audio content coming soon"
            emptyMessage="Spoken word and audio teachings will appear here."
          />
        </View>

        <View style={{ gap: 10 }}>
          <SectionLabel title="Nuggets of Truth" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.videos)} />
          <ContentRail
            title=""
            items={nuggetsItems}
            loading={loading}
            onPressItem={(item) => void openItem(item, 'player_nuggets')}
            cardVariant="landscape"
            emptyTitle="Nuggets of Truth coming soon"
            emptyMessage="Short devotional moments will appear here."
          />
        </View>

        <View style={{ gap: 10 }}>
          <SectionLabel title="ClaudyGod Teens" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.videos)} />
          <ContentRail
            title=""
            items={teensItems}
            loading={loading}
            onPressItem={(item) => void openItem(item, 'player_teens')}
            cardVariant="landscape"
            emptyTitle="ClaudyGod Teens coming soon"
            emptyMessage="Youth-focused content from ClaudyGod will appear here."
          />
        </View>

      </View>

      {/* Most played chart */}
      {feed.mostPlayed.length > 0 ? (
        <TrendingList
          title="Most played"
          items={feed.mostPlayed.slice(0, 8)}
          onPressItem={(item) => void openItem(item, 'music_trending')}
          actionLabel="See all"
          onAction={() => {}}
        />
      ) : null}

      {!loading && !allQueue.length ? (
        <EmptyState
          title="No music right now"
          message="Try Videos, Live, or Search for something to play."
          actionLabel="Search"
          onAction={() => router.push(APP_ROUTES.tabs.search)}
          icon="graphic-eq"
        />
      ) : null}
    </PremiumPage>
  );
}