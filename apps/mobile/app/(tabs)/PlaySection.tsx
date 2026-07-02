import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AudioPlayer } from '../../components/media/AudioPlayer';
import { YouTubeAudioPlayer } from '../../components/media/YouTubeAudioPlayer';
import { CustomText } from '../../components/CustomText';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { makeStyles } from '../../styles/makeStyles';
import type { ContentType, FeedBundle, FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { buildPlayerRoute, isDirectPlayableAudioUrl, isYouTubeAudioItem, routeParamToString, shouldOpenVideoScreen } from '../../util/playerRoute';
import {
  CompactContentRow,
  ContentRail,
  EmptyState,
  PremiumHero,
  PremiumPage,
  SectionLabel,
  TrendingList,
  dedupeFeedItems,
} from '../../components/Exp/PremiumContent';
import { WorshipTogetherBar } from '../../components/worship/WorshipTogetherBar';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // Library button in header
  playerLibBtn:       { minWidth: 40, paddingHorizontal: 10 },

  // Now-playing card
  nowPlayingCard: {
    borderRadius: 16, borderWidth: 1,
    borderColor: theme.colors.primaryBorder, backgroundColor: theme.colors.primarySurface,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, overflow: 'hidden',
  },

  // FilterChip
  filterChipBase:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  filterChipActive:     { backgroundColor: theme.colors.primary, borderColor: 'transparent' },
  filterChipInactive:   { backgroundColor: theme.colors.subtleFill, borderColor: theme.colors.border },
  filterChipTxtActive:  { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  filterChipTxtInactive:{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' },

  // Queue
  queueWrap:        { gap: 2 },
  queueHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  queueHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  queueAccent:      { width: 3, height: 14, borderRadius: 1.5, backgroundColor: theme.colors.primary },
  queueTitle:       { color: theme.colors.text, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  queueCountPill:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: theme.colors.primarySurface },
  queueCountText:   { color: theme.colors.primary, fontSize: 10, fontWeight: '700' },
  queueClearText:   { color: theme.colors.primary, fontSize: 12, fontWeight: '600' },
  queueItemCard: {
    borderRadius: theme.radius.md, backgroundColor: theme.colors.subtleFill,
    borderWidth: 0.5, borderColor: theme.colors.border, marginBottom: 2,
  },
  queueItemRow:     { flexDirection: 'row', alignItems: 'center' },
  queueItemNum: {
    width: 32, textAlign: 'center',
    color: 'rgba(139,92,246,0.50)', fontSize: 11, fontWeight: '700',
  },
  queueItemFill:    { flex: 1 },

  // Browse separator
  browseRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  browseLine:       { flex: 1, height: 1, backgroundColor: theme.colors.subtleFill },
  browseLabel:      { color: theme.colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1.2 },

  // Sections
  sectionsGap:      { gap: 28 },
  sectionRow:       { gap: 12 },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dedupeItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildMusicSections(feed: FeedBundle, limit = 12) {
  const pool = dedupeItems([...feed.music, ...feed.videos, ...feed.playlists, ...feed.live]);
  const used = new Set<string>();

  function take(sectionId: string, fallbackTypes: ContentType[]): FeedCardItem[] {
    const available = pool.filter((item) => !used.has(item.id));
    const tagged = available.filter((item) => item.appSections?.includes(sectionId));
    const candidates = tagged.length >= 2 ? tagged : available.filter((item) => (fallbackTypes as string[]).includes(item.type));
    const sliced = candidates.slice(0, limit);
    sliced.forEach((item) => used.add(item.id));
    return sliced;
  }

  return {
    music:   take('music', ['audio']),
    audio:   take('audio', ['audio', 'playlist']),
    nuggets: take('nuggets-of-truth', ['video']),
    teens:   take('teens', ['video', 'playlist']),
  };
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

// ─── FilterChips ──────────────────────────────────────────────────────────────

function FilterChips({ active, onChange }: { active: AudioFilter; onChange: (_f: AudioFilter) => void }) {
  const styles = useStyles();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {FILTERS.map((f) => {
        const isActive = f.id === active;
        return (
          <TVTouchable
            key={f.id}
            onPress={() => onChange(f.id)}
            showFocusBorder={false}
            style={[styles.filterChipBase, isActive ? styles.filterChipActive : styles.filterChipInactive]}
          >
            <MaterialIcons name={f.icon} size={14} color={isActive ? '#FFFFFF' : undefined} style={isActive ? undefined : { opacity: 0.6 }} />
            <CustomText style={isActive ? styles.filterChipTxtActive : styles.filterChipTxtInactive}>
              {f.label}
            </CustomText>
          </TVTouchable>
        );
      })}
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlaySection() {
  const styles = useStyles();
  const theme  = useAppTheme();
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
  const [isFavorite, setIsFavorite] = useState(false);

  const { music: musicItems, audio: audioItems, nuggets: nuggetsItems, teens: teensItems } =
    useMemo(() => buildMusicSections(feed), [feed]);

  const routeItem = useMemo(() => parseRouteItem(params), [params]);
  const allQueue = useMemo(
    () => dedupeFeedItems([...(routeItem ? [routeItem] : []), ...feed.music, ...feed.mostPlayed, ...feed.recommendations, ...feed.playlists, ...feed.recent])
      .filter((item) => isYouTubeAudioItem(item) || !shouldOpenVideoScreen(item)),
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
  const hasInlineAudio = Boolean(active && (
    (active.mediaUrl && isDirectPlayableAudioUrl(active.mediaUrl)) ||
    isYouTubeAudioItem(active)
  ));

  const openItem = async (item: FeedCardItem, source: string) => {
    if (isYouTubeAudioItem(item)) {
      setActiveId(item.id);
      setIsFavorite(false);
      await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
      return;
    }
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
    setIsFavorite(false);
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
  };

  const goPrevious = () => { const prev = canGoPrevious ? allQueue[activeIndex - 1] : null; if (prev) void openItem(prev, 'music_prev'); };
  const goNext    = () => { const next = canGoNext ? allQueue[activeIndex + 1] : null; if (next) void openItem(next, 'music_next'); };

  const upNext = filteredQueue.filter((item) => item.id !== active?.id).slice(0, 8);

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
          style={styles.playerLibBtn}
        />
      }
    >
      {/* ── Now Playing card ─────────────────────────────────────────────── */}
      <View style={styles.nowPlayingCard}>
        {active && hasInlineAudio && isYouTubeAudioItem(active) && active.youtubeVideoId ? (
          <YouTubeAudioPlayer
            track={{ id: active.id, title: active.title, artist: active.subtitle, youtubeVideoId: active.youtubeVideoId, duration: active.duration, imageUrl: active.imageUrl }}
            onPrevious={goPrevious}
            onNext={goNext}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            isFavorite={isFavorite}
            onFavoriteToggle={() => setIsFavorite((f) => !f)}
            currentTrackNumber={activeIndex >= 0 ? activeIndex + 1 : undefined}
            totalTracks={allQueue.length}
          />
        ) : active && hasInlineAudio && active.mediaUrl ? (
          <AudioPlayer
            track={{ id: active.id, title: active.title, artist: active.subtitle, uri: active.mediaUrl, duration: active.duration, imageUrl: active.imageUrl }}
            onPrevious={goPrevious}
            onNext={goNext}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            isFavorite={isFavorite}
            onFavoriteToggle={() => setIsFavorite((f) => !f)}
            currentTrackNumber={activeIndex >= 0 ? activeIndex + 1 : undefined}
            totalTracks={allQueue.length}
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
      </View>

      {/* ── Worship Together live count ───────────────────────────────────── */}
      {active ? <WorshipTogetherBar contentId={active.id} /> : null}

      {/* ── Filter chips ─────────────────────────────────────────────────── */}
      <FilterChips active={filter} onChange={setFilter} />

      {/* ── Up next queue ────────────────────────────────────────────────── */}
      {upNext.length > 0 ? (
        <View style={styles.queueWrap}>
          <View style={styles.queueHeader}>
            <View style={styles.queueHeaderLeft}>
              <View style={styles.queueAccent} />
              <CustomText style={styles.queueTitle}>Up next</CustomText>
              <View style={styles.queueCountPill}>
                <CustomText style={styles.queueCountText}>{upNext.length}</CustomText>
              </View>
            </View>
            <TVTouchable onPress={() => setFilter(filter === 'all' ? 'songs' : 'all')} showFocusBorder={false}>
              <CustomText style={styles.queueClearText}>
                {filter === 'all' ? 'Filter' : 'Clear filter'}
              </CustomText>
            </TVTouchable>
          </View>

          {upNext.map((item, index) => (
            <View key={item.id} style={styles.queueItemCard}>
              <View style={styles.queueItemRow}>
                <CustomText style={styles.queueItemNum}>
                  {(activeIndex >= 0 ? activeIndex + 1 : 0) + index + 1}
                </CustomText>
                <View style={styles.queueItemFill}>
                  <CompactContentRow item={item} onPress={() => void openItem(item, 'music_queue')} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Section separator ────────────────────────────────────────────── */}
      {(musicItems.length > 0 || audioItems.length > 0 || nuggetsItems.length > 0 || teensItems.length > 0) ? (
        <View style={styles.browseRow}>
          <View style={styles.browseLine} />
          <CustomText style={styles.browseLabel}>BROWSE</CustomText>
          <View style={styles.browseLine} />
        </View>
      ) : null}

      {/* ── 4 branded content sections ───────────────────────────────────── */}
      {(musicItems.length > 0 || audioItems.length > 0 || nuggetsItems.length > 0 || teensItems.length > 0) ? (
        <View style={styles.sectionsGap}>
          {musicItems.length > 0 ? (
            <View style={styles.sectionRow}>
              <SectionLabel title="ClaudyGod Music" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.player)} />
              <ContentRail title="" items={musicItems} loading={loading} onPressItem={(item) => void openItem(item, 'player_music')} cardVariant="portrait" />
            </View>
          ) : null}

          {audioItems.length > 0 ? (
            <View style={styles.sectionRow}>
              <SectionLabel title="ClaudyGod Audio" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.player)} />
              <ContentRail title="" items={audioItems} loading={loading} onPressItem={(item) => void openItem(item, 'player_audio')} cardVariant="portrait" />
            </View>
          ) : null}

          {nuggetsItems.length > 0 ? (
            <View style={styles.sectionRow}>
              <SectionLabel title="Nuggets of Truth" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.videos)} />
              <ContentRail title="" items={nuggetsItems} loading={loading} onPressItem={(item) => void openItem(item, 'player_nuggets')} cardVariant="landscape" />
            </View>
          ) : null}

          {teensItems.length > 0 ? (
            <View style={styles.sectionRow}>
              <SectionLabel title="ClaudyGod Teens" actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.videos)} />
              <ContentRail title="" items={teensItems} loading={loading} onPressItem={(item) => void openItem(item, 'player_teens')} cardVariant="landscape" />
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Most played trending ─────────────────────────────────────────── */}
      {feed.mostPlayed.length > 0 ? (
        <TrendingList
          title="Most played"
          items={feed.mostPlayed.slice(0, 8)}
          onPressItem={(item) => void openItem(item, 'music_trending')}
          actionLabel="See all"
          onAction={() => {}}
        />
      ) : null}

      {!loading && !allQueue.length && !musicItems.length && !audioItems.length && !nuggetsItems.length && !teensItems.length ? (
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
