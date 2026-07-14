import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, useWindowDimensions, View } from 'react-native';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomText } from '../../components/CustomText';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { getVideoLayoutSections, deriveLayoutSectionItems, deriveLayoutSectionOverflow } from '../../util/mobileLayout';
import { InlineErrorBanner } from '../../components/ui/InlineErrorBanner';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { isDirectPlayableVideoUrl, isHostedVideoUrl, routeParamToString, shouldOpenVideoScreen } from '../../util/playerRoute';
import {
  CompactContentRow,
  ContentList,
  ContentRail,
  EmptyState,
  LiveNowBanner,
  PremiumHero,
  PremiumPage,
  SectionLabel,
  dedupeFeedItems,
} from '../../components/feed';

const useStyles = makeStyles((theme) => ({
  filterScrollContent: { gap: 8, paddingVertical: 2 },
  chipBase:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  chipActive:   { backgroundColor: theme.colors.info, borderColor: 'transparent' as const },
  chipDefault:  { backgroundColor: theme.colors.subtleFill, borderColor: theme.colors.border },
  chipLabelActive:  { color: '#FFFFFF', fontSize: 13, fontWeight: '700' as const },
  chipLabelDefault: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' as const },
  gap12:        { gap: 12 },
}));

type VideoFilter = 'all' | 'sessions' | 'live' | 'shorts';

function parseRouteItem(params: {
  itemId?: string | string[];
  title?: string | string[];
  subtitle?: string | string[];
  imageUrl?: string | string[];
  duration?: string | string[];
  mediaUrl?: string | string[];
}): FeedCardItem | null {
  const itemId = routeParamToString(params.itemId);
  if (!itemId) return null;
  return {
    id: itemId, type: 'video',
    title: routeParamToString(params.title) ?? 'Untitled',
    subtitle: routeParamToString(params.subtitle) ?? 'ClaudyGod',
    description: '', duration: routeParamToString(params.duration) ?? '--:--',
    imageUrl: routeParamToString(params.imageUrl) ?? DEFAULT_CONTENT_IMAGE_URI,
    mediaUrl: routeParamToString(params.mediaUrl),
  };
}

const FILTERS: { id: VideoFilter; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
  { id: 'all',      label: 'All',      icon: 'apps' },
  { id: 'sessions', label: 'Sessions', icon: 'church' },
  { id: 'live',     label: 'Live',     icon: 'live-tv' },
  { id: 'shorts',   label: 'Shorts',   icon: 'video-library' },
];

function FilterChips({ active, onChange }: { active: VideoFilter; onChange: (_f: VideoFilter) => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
      {FILTERS.map((f) => {
        const isActive = f.id === active;
        return (
          <TVTouchable
            key={f.id}
            onPress={() => onChange(f.id)}
            showFocusBorder={false}
            style={[styles.chipBase, isActive ? styles.chipActive : styles.chipDefault]}
          >
            <MaterialIcons name={f.icon} size={14} color={isActive ? '#FFFFFF' : theme.colors.textSecondary} />
            <CustomText style={isActive ? styles.chipLabelActive : styles.chipLabelDefault}>
              {f.label}
            </CustomText>
          </TVTouchable>
        );
      })}
    </ScrollView>
  );
}

export default function VideosScreen() {
  const styles = useStyles();
  const router = useRouter();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    itemId?: string | string[];
    title?: string | string[];
    subtitle?: string | string[];
    imageUrl?: string | string[];
    duration?: string | string[];
    mediaUrl?: string | string[];
  }>();
  const { feed, loading, error, refresh } = useContentFeed();
  const { config: appConfig } = useMobileAppConfig();
  const [filter, setFilter] = useState<VideoFilter>('all');

  const videoSections = useMemo(() => getVideoLayoutSections(appConfig), [appConfig]);
  const sectionItems = useMemo(
    () => videoSections.map((section) => ({
      section,
      items: deriveLayoutSectionItems(feed, section),
      overflow: deriveLayoutSectionOverflow(feed, section),
    })),
    [videoSections, feed],
  );

  const routeItem = useMemo(() => parseRouteItem(params), [params]);
  const allQueue = useMemo(
    () => dedupeFeedItems([...(routeItem ? [routeItem] : []), ...feed.videos, ...feed.live, ...feed.recent])
      .filter((item) => shouldOpenVideoScreen(item)),
    [feed, routeItem],
  );

  const filteredItems = useMemo(() => {
    if (filter === 'all')      return allQueue;
    if (filter === 'sessions') return allQueue.filter((item) => !item.isLive);
    if (filter === 'live')     return allQueue.filter((item) => item.isLive);
    if (filter === 'shorts')   return allQueue.filter((item) => {
      const mins = parseInt(item.duration?.split(':')[0] ?? '99', 10);
      return mins < 5;
    });
    return allQueue;
  }, [allQueue, filter]);

  const [activeId, setActiveId] = useState(routeItem?.id ?? allQueue[0]?.id ?? '');
  const active = allQueue.find((item) => item.id === activeId) ?? routeItem ?? allQueue[0] ?? null;
  const canInlinePlay = Boolean(active?.mediaUrl && (isDirectPlayableVideoUrl(active.mediaUrl) || isHostedVideoUrl(active.mediaUrl)));
  const playerHeight = width >= 768 ? 430 : width < 380 ? 220 : 260;

  const liveSessions = useMemo(() => feed.live.filter((item) => item.isLive), [feed.live]);

  const upNext = allQueue.filter((item) => item.id !== active?.id && Boolean(item.mediaUrl)).slice(0, 5);

  const openItem = async (item: FeedCardItem, source: string) => {
    if (!item.mediaUrl) {
      showToast({ title: 'Video unavailable', message: 'This video is not ready to play yet.', tone: 'warning' });
      return;
    }
    setActiveId(item.id);
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
  };

  return (
    <PremiumPage title="Videos" eyebrow="Watch" noBack refreshing={loading} onRefresh={refresh}>
      {/* Player or Hero */}
      {active && canInlinePlay && active.mediaUrl ? (
        <VideoPlayer title={active.title} sourceUri={active.mediaUrl} height={playerHeight} />
      ) : (
        <PremiumHero
          item={active}
          title={active?.title ?? 'Choose a video'}
          subtitle={active?.description || 'Select a video, live replay, or featured session to watch.'}
          emptyIcon="smart-display"
          primaryLabel={active?.mediaUrl ? 'Open video' : 'Browse videos'}
          primaryIcon={active?.mediaUrl ? 'open-in-new' : 'smart-display'}
          onPrimary={() => (active?.mediaUrl ? void Linking.openURL(active.mediaUrl) : undefined)}
        />
      )}

      {error ? <InlineErrorBanner message={error} onRetry={() => void refresh()} /> : null}

      {/* Filter chips */}
      <FilterChips active={filter} onChange={setFilter} />

      {/* Live banner */}
      {liveSessions[0] ? (
        <LiveNowBanner item={liveSessions[0]} onPress={() => void openItem(liveSessions[0]!, 'videos_live_banner')} />
      ) : null}

      {/* Up next */}
      {upNext.length > 0 ? (
        <View style={styles.gap12}>
          <SectionLabel title="Up next" />
          <View>
            {upNext.map((item) => (
              <CompactContentRow key={item.id} item={item} onPress={() => void openItem(item, 'videos_queue')} />
            ))}
          </View>
        </View>
      ) : null}

      {/* Videos rail */}
      <View style={styles.gap12}>
        <SectionLabel
          title="Latest videos"
          accent="Watch"
          subtitle="Messages, sessions, clips, and replays"
        />
        <ContentRail
          title=""
          items={filteredItems.slice(0, 14)}
          loading={loading}
          onPressItem={(item) => void openItem(item, 'videos_rail')}
          emptyTitle="No videos match this filter"
          emptyMessage="Try a different filter or pull down to refresh."
        />
      </View>

      {/* Live & replays */}
      {feed.live.length > 0 ? (
        <View style={styles.gap12}>
          <SectionLabel title="Live & replays" accent="Ministry" />
          <ContentRail
            title=""
            items={feed.live.slice(0, 10)}
            compact
            loading={loading}
            onPressItem={(item) => void openItem(item, 'videos_live')}
          />
          {feed.live.length > 10 ? (
            <ContentList
              title="More live & replays"
              items={feed.live.slice(10)}
              onPressItem={(item) => void openItem(item, 'videos_live_more')}
            />
          ) : null}
        </View>
      ) : null}

      {/* Configured video sections */}
      {sectionItems.map(({ section, items, overflow }) => (
        items.length > 0 ? (
          <View key={section.id} style={styles.gap12}>
            <SectionLabel title={section.title} subtitle={section.subtitle} />
            <ContentRail
              title=""
              items={items}
              loading={loading}
              onPressItem={(item) => void openItem(item, `videos_${section.id}`)}
            />
            {overflow.length > 0 ? (
              <ContentList
                title={`More ${section.title.toLowerCase()}`}
                items={overflow}
                onPressItem={(item) => void openItem(item, `videos_${section.id}_more`)}
              />
            ) : null}
          </View>
        ) : null
      ))}

      {/* More to watch — overflow beyond the rail's 14-item limit */}
      {filteredItems.length > 14 ? (
        <ContentList
          title="More to watch"
          items={filteredItems.slice(14)}
          onPressItem={(item) => void openItem(item, 'videos_more')}
        />
      ) : null}

      {!loading && !allQueue.length ? (
        <EmptyState
          title="No videos right now"
          message="Try Music, Live, or Search for more content."
          actionLabel="Search"
          onAction={() => router.push(APP_ROUTES.tabs.search)}
          icon="smart-display"
        />
      ) : null}
    </PremiumPage>
  );
}