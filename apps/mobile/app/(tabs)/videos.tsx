import React, { useEffect, useMemo, useState } from 'react';
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
import { getVideoLayoutSections, deriveLayoutSectionItems, deriveLayoutSectionOverflowCount } from '../../util/mobileLayout';
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
  filterScrollContent: { gap: 22, paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  chipBase:     { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42, paddingHorizontal: 2, position: 'relative' as const },
  chipActiveLine: { position: 'absolute' as const, left: 0, right: 0, bottom: -1, height: 2, backgroundColor: theme.colors.primary, borderRadius: 1 },
  chipLabelActive:  { color: theme.colors.text, fontSize: 13, fontWeight: '700' as const },
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

type VideoFilterOption = { id: VideoFilter; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] };

function durationInSeconds(duration?: string): number {
  const parts = duration?.split(':').map(Number) ?? [];
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  return parts[0] ?? 0;
}

const FILTER_DEFINITIONS: Record<VideoFilter, VideoFilterOption> = {
  all: { id: 'all', label: 'All', icon: 'apps' },
  sessions: { id: 'sessions', label: 'Sessions', icon: 'church' },
  live: { id: 'live', label: 'Live', icon: 'live-tv' },
  shorts: { id: 'shorts', label: 'Shorts', icon: 'video-library' },
};

function FilterTabs({ options, active, onChange }: { options: VideoFilterOption[]; active: VideoFilter; onChange: (_f: VideoFilter) => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
      {options.map((f) => {
        const isActive = f.id === active;
        return (
          <TVTouchable
            key={f.id}
            onPress={() => onChange(f.id)}
            showFocusBorder={false}
            style={styles.chipBase}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <MaterialIcons name={f.icon} size={15} color={isActive ? theme.colors.primary : theme.colors.textSecondary} />
            <CustomText style={isActive ? styles.chipLabelActive : styles.chipLabelDefault}>
              {f.label}
            </CustomText>
            {isActive ? <View style={styles.chipActiveLine} /> : null}
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
      items: deriveLayoutSectionItems(feed, section, 'videos'),
      overflowCount: deriveLayoutSectionOverflowCount(feed, section, 'videos'),
    })),
    [videoSections, feed],
  );

  const routeItem = useMemo(() => parseRouteItem(params), [params]);
  const allQueue = useMemo(
    () => dedupeFeedItems([...(routeItem ? [routeItem] : []), ...feed.videos, ...feed.live, ...feed.recent])
      .filter((item) => shouldOpenVideoScreen(item)),
    [feed, routeItem],
  );

  const filterOptions = useMemo(() => {
    const options: VideoFilterOption[] = [FILTER_DEFINITIONS.all];
    if (allQueue.some((item) => !item.isLive)) options.push(FILTER_DEFINITIONS.sessions);
    if (allQueue.some((item) => item.isLive)) options.push(FILTER_DEFINITIONS.live);
    if (allQueue.some((item) => {
      const seconds = durationInSeconds(item.duration);
      return seconds > 0 && seconds < 300;
    })) options.push(FILTER_DEFINITIONS.shorts);
    return options;
  }, [allQueue]);

  useEffect(() => {
    if (!filterOptions.some((option) => option.id === filter)) setFilter('all');
  }, [filter, filterOptions]);

  const filteredItems = useMemo(() => {
    if (filter === 'all')      return allQueue;
    if (filter === 'sessions') return allQueue.filter((item) => !item.isLive);
    if (filter === 'live')     return allQueue.filter((item) => item.isLive);
    if (filter === 'shorts')   return allQueue.filter((item) => {
      const seconds = durationInSeconds(item.duration);
      return seconds > 0 && seconds < 300;
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
    <PremiumPage title="Videos" eyebrow="Watch" noBack refreshing={loading} onRefresh={refresh} scrollToTopKey={activeId}>
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
      {filterOptions.length > 1 ? <FilterTabs options={filterOptions} active={filter} onChange={setFilter} /> : null}

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
      {sectionItems.map(({ section, items, overflowCount }) => (
        items.length > 0 ? (
          <View key={section.id} style={styles.gap12}>
            <SectionLabel
              title={section.title}
              subtitle={section.subtitle}
              actionLabel={overflowCount > 0 ? 'See all' : undefined}
              onAction={overflowCount > 0 ? () => router.push({
                pathname: APP_ROUTES.section.detail,
                params: { sectionId: section.id, screen: 'videos', title: section.title },
              } as never) : undefined}
            />
            <ContentRail
              title=""
              items={items}
              loading={loading}
              onPressItem={(item) => void openItem(item, `videos_${section.id}`)}
            />
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
          message="New sessions will appear here when they are published. Explore music now or search the full library."
          actionLabel="Browse music"
          actionIcon="headphones"
          onAction={() => router.push(APP_ROUTES.tabs.player)}
          secondaryActionLabel="Search library"
          secondaryActionIcon="search"
          onSecondaryAction={() => router.push(APP_ROUTES.tabs.search)}
          icon="smart-display"
        />
      ) : null}
    </PremiumPage>
  );
}
