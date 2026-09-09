import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { FullPlayer } from '../../components/player/FullPlayer';
import { activeOrder } from '../../playback/queue';
import {
  playFrom,
  setAutoplayEnabled,
  usePlayback,
  type PlaybackItem,
} from '../../playback';
import { feedItemToPlaybackItem } from '../../playback/metadata';
import { CustomText } from '../../components/CustomText';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useLocalContent } from '../../hooks/useLocalContent';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { getPlayerLayoutSections, deriveLayoutSectionItems, deriveLayoutSectionOverflowCount } from '../../util/mobileLayout';
import { ErrorState } from '../../components/ui/ErrorState';
import { makeStyles } from '../../styles/makeStyles';
import type { FeedCardItem } from '../../services/contentService';
import { trackContentPlay } from '../../services/supabaseAnalytics';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { buildPlayerRoute, isDirectPlayableAudioUrl, routeParamToString, shouldOpenVideoScreen } from '../../util/playerRoute';
import { openExternalUrl } from '../../util/externalLinks';
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
} from '../../components/feed';
import { WorshipTogetherBar } from '../../components/worship/WorshipTogetherBar';
import { getPreference } from '../../lib/localUserStorage';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // Library button in header
  playerLibBtn:       { minWidth: 40, paddingHorizontal: 10 },

  // Now-playing card
  nowPlayingCard: {
    borderRadius: theme.radius.xl, borderWidth: 1,
    borderColor: theme.colors.primaryBorder, backgroundColor: theme.colors.elevated,
    padding: theme.spacing.lg, overflow: 'hidden', ...theme.shadows.lg,
  },
  stageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  stageHeading: { flex: 1 },
  stageEyebrow: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  stageTitle: { color: theme.colors.text, marginTop: 2 },
  stageStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.colors.successSurface, borderWidth: 1, borderColor: theme.colors.successBorder },
  stageStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success },
  stageStatusText: { color: theme.colors.success, fontWeight: '700' },

  // FilterChip
  filterChipBase:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  filterChipActive:     { backgroundColor: theme.colors.controlSelectedSurface, borderColor: theme.colors.controlSelectedBorder },
  filterChipInactive:   { backgroundColor: theme.colors.subtleFill, borderColor: theme.colors.border },
  filterChipTxtActive:  { color: theme.colors.controlSelectedText, fontSize: 13, fontWeight: '700' },
  filterChipTxtInactive:{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' },

  // Queue
  queueWrap:        { gap: 2 },
  queueHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  queueHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  queueAccent:      { width: 3, height: 14, borderRadius: 1.5, backgroundColor: theme.colors.primary },
  queueTitle:       { color: theme.colors.text, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  queueCountPill:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: theme.colors.primarySurface },
  queueCountText:   { color: theme.colors.primary, fontSize: 10, fontWeight: '700' },
  queueClearText:   { color: theme.colors.primary, fontWeight: '600' },
  queueItemCard: {
    borderRadius: theme.radius.md, backgroundColor: theme.colors.subtleFill,
    borderWidth: 0.5, borderColor: theme.colors.border, marginBottom: 2,
  },
  queueItemRow:     { flexDirection: 'row', alignItems: 'center' },
  queueItemNum: {
    width: 32, textAlign: 'center',
    color: theme.colors.text_accent, opacity: 0.7, fontSize: 11, fontWeight: '700',
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
  const theme = useAppTheme();
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
            <MaterialIcons name={f.icon} size={14} color={isActive ? theme.colors.controlSelectedText : theme.colors.textSecondary} style={isActive ? undefined : { opacity: 0.6 }} />
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
  const { feed, loading, error, refresh } = useContentFeed();
  const { config: appConfig } = useMobileAppConfig();
  const [filter, setFilter] = useState<AudioFilter>('all');
  const { checkIsFavorited, toggleFavorite, recordHistory } = useLocalContent();
  const { nowPlaying, queue: playbackQueue } = usePlayback();

  useFocusEffect(useCallback(() => {
    let active = true;
    void getPreference('autoplayEnabled', true).then((value) => {
      if (active) setAutoplayEnabled(value);
    });
    return () => { active = false; };
  }, []));

  const playerSections = useMemo(() => getPlayerLayoutSections(appConfig), [appConfig]);
  const sectionItems = useMemo(
    () => playerSections.map((section) => ({
      section,
      items: deriveLayoutSectionItems(feed, section, 'player'),
      overflowCount: deriveLayoutSectionOverflowCount(feed, section, 'player'),
    })),
    [playerSections, feed],
  );
  const hasSectionItems = sectionItems.some(({ items }) => items.length > 0);

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

  // Map every playable feed card to a PlaybackItem once; the playback store owns
  // order, shuffle, repeat and now-playing from here.
  const playbackByFeedId = useMemo(() => {
    const map = new Map<string, PlaybackItem>();
    for (const card of allQueue) {
      const item = feedItemToPlaybackItem(card);
      if (item && item.source.kind !== 'youtube') map.set(card.id, item);
    }
    return map;
  }, [allQueue]);
  const feedById = useMemo(() => new Map(allQueue.map((card) => [card.id, card])), [allQueue]);
  const firstPlayable = useMemo(
    () => filteredQueue.find((card) => playbackByFeedId.has(card.id)) ?? null,
    [filteredQueue, playbackByFeedId],
  );

  const playItem = useCallback(async (item: FeedCardItem, source: string) => {
    if (!item.mediaUrl) {
      showToast({ title: 'Playback unavailable', message: 'This item is not ready to play yet.', tone: 'warning' });
      return;
    }
    if (shouldOpenVideoScreen(item)) { router.push(buildPlayerRoute(item)); return; }
    if (!isDirectPlayableAudioUrl(item.mediaUrl)) { await openExternalUrl(item.mediaUrl); return; }

    const startItem = playbackByFeedId.get(item.id) ?? feedItemToPlaybackItem(item);
    if (!startItem || startItem.source.kind === 'youtube') return;

    const items = filteredQueue
      .map((card) => playbackByFeedId.get(card.id))
      .filter((entry): entry is PlaybackItem => Boolean(entry));
    if (!items.some((entry) => entry.id === startItem.id)) items.unshift(startItem);

    playFrom({ origin: { kind: 'feed-rail', id: filter, label: 'Music' }, items, startId: startItem.id });
    await recordHistory(item);
    await trackContentPlay(item, source);
  }, [filter, filteredQueue, playbackByFeedId, recordHistory, router, showToast]);

  const openItem = playItem;

  // Deep link into a specific track: start it once, only if nothing is playing.
  const handledRouteId = useRef<string | null>(null);
  useEffect(() => {
    const id = routeItem?.id;
    if (!id || handledRouteId.current === id || !routeItem?.mediaUrl) return;
    if (nowPlaying && nowPlaying.id !== id) return;
    handledRouteId.current = id;
    void playItem(routeItem, 'music_deeplink');
  }, [routeItem, nowPlaying, playItem]);

  const favoriteActive = nowPlaying ? checkIsFavorited(nowPlaying.id) : false;
  const handleFavoriteToggle = async () => {
    const card = nowPlaying ? feedById.get(nowPlaying.id) : null;
    if (!card) return;
    try {
      await toggleFavorite(card);
      showToast({
        title: favoriteActive ? 'Removed from saved' : 'Saved to Library',
        message: card.title,
        tone: 'info',
      });
    } catch {
      showToast({ title: 'Library update failed', message: 'Please try again.', tone: 'warning' });
    }
  };

  const upNext = useMemo<FeedCardItem[]>(() => {
    if (!nowPlaying) {
      return filteredQueue.filter((card) => playbackByFeedId.has(card.id) && card.id !== firstPlayable?.id).slice(0, 8);
    }
    const order = activeOrder(playbackQueue);
    const upcoming = order.slice(playbackQueue.contextCursor + 1).map((idx) => playbackQueue.contextItems[idx]);
    const ids = [...playbackQueue.userQueue, ...upcoming].map((entry) => entry.id);
    return ids
      .map((id) => feedById.get(id))
      .filter((card): card is FeedCardItem => Boolean(card))
      .slice(0, 12);
  }, [nowPlaying, filteredQueue, playbackByFeedId, firstPlayable, playbackQueue, feedById]);

  if (error && !allQueue.length) {
    return (
      <PremiumPage title="Music" eyebrow="Listen" noBack refreshing={loading} onRefresh={refresh}>
        <ErrorState variant="page" title="Music could not be loaded" message={error} supportingText="Your saved content remains available in Library while we reconnect." onRetry={() => void refresh()} />
      </PremiumPage>
    );
  }

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
      {nowPlaying ? (
        <View style={styles.nowPlayingCard}>
          <View style={styles.stageHeader}><View style={styles.stageHeading}><CustomText variant="caption" style={styles.stageEyebrow}>Now playing</CustomText><CustomText variant="heading" style={styles.stageTitle}>Your worship player</CustomText></View><View style={styles.stageStatus}><View style={styles.stageStatusDot} /><CustomText variant="caption" style={styles.stageStatusText}>Ready</CustomText></View></View>
          <FullPlayer
            favorite={
              feedById.has(nowPlaying.id)
                ? { active: favoriteActive, onToggle: () => { void handleFavoriteToggle(); } }
                : undefined
            }
          />
        </View>
      ) : (
        <PremiumHero
          item={firstPlayable}
          title={firstPlayable?.title ?? 'Choose something to play'}
          subtitle={firstPlayable?.description || 'Select a song, message, or playlist to begin listening.'}
          emptyIcon="library-music"
          primaryLabel={firstPlayable ? 'Play' : 'Browse music'}
          primaryIcon={firstPlayable ? 'play-arrow' : 'queue-music'}
          onPrimary={() => (firstPlayable ? void playItem(firstPlayable, 'music_hero') : undefined)}
        />
      )}

      {error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}

      {/* ── Worship Together live count ───────────────────────────────────── */}
      {nowPlaying ? <WorshipTogetherBar contentId={nowPlaying.id} /> : null}

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
              <CustomText variant="label" style={styles.queueClearText}>
                {filter === 'all' ? 'Filter' : 'Clear filter'}
              </CustomText>
            </TVTouchable>
          </View>

          {upNext.map((item, index) => (
            <View key={item.id} style={styles.queueItemCard}>
              <View style={styles.queueItemRow}>
                <CustomText style={styles.queueItemNum}>
                  {index + 1}
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
      {hasSectionItems ? (
        <View style={styles.browseRow}>
          <View style={styles.browseLine} />
          <CustomText style={styles.browseLabel}>BROWSE</CustomText>
          <View style={styles.browseLine} />
        </View>
      ) : null}

      {/* ── Configured content sections ──────────────────────────────────── */}
      {hasSectionItems ? (
        <View style={styles.sectionsGap}>
          {sectionItems.map(({ section, items, overflowCount }, index) => (
            items.length > 0 ? (
              <View key={section.id} style={styles.sectionRow}>
                <SectionLabel
                  title={section.title}
                  actionLabel={overflowCount > 0 ? (section.actionLabel || 'See all') : undefined}
                  onAction={overflowCount > 0 ? () => router.push({
                    pathname: APP_ROUTES.section.detail,
                    params: { sectionId: section.id, screen: 'player', title: section.title },
                  } as never) : undefined}
                />
                <ContentRail
                  title=""
                  items={items}
                  loading={loading}
                  onPressItem={(item) => void openItem(item, `player_${section.id}`)}
                  cardVariant={index % 2 === 0 ? 'portrait' : 'landscape'}
                />
              </View>
            ) : null
          ))}
        </View>
      ) : null}

      {/* ── Most played trending ─────────────────────────────────────────── */}
      {feed.mostPlayed.length > 0 ? (
        <>
          <TrendingList
            title="Most played"
            items={feed.mostPlayed.slice(0, 8)}
            onPressItem={(item) => void openItem(item, 'music_trending')}
          />
          {feed.mostPlayed.length > 8 ? (
            <ContentList
              title="More frequently played"
              items={feed.mostPlayed.slice(8)}
              onPressItem={(item) => void openItem(item, 'music_trending_more')}
            />
          ) : null}
        </>
      ) : null}

      {!loading && !allQueue.length && !hasSectionItems ? (
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
