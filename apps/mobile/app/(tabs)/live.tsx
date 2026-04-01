import React, { useEffect, useMemo, useState } from 'react';
import type { DimensionValue } from 'react-native';
import { Image, RefreshControl, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PosterCard } from '../../components/ui/PosterCard';
import { ActionSheet, type ActionSheetAction } from '../../components/ui/ActionSheet';
import { AppButton } from '../../components/ui/AppButton';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { Chip } from '../../components/ui/Chip';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { BRAND_HERO_ASSET } from '../../util/brandAssets';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchLiveSessions, type LiveSessionSummary } from '../../services/liveService';
import type { FeedCardItem } from '../../services/contentService';
import { useToast } from '../../context/ToastContext';
import { saveMeLibraryItem, subscribeToLiveAlertsBackend } from '../../services/userFlowService';
import { useAuth } from '../../context/AuthContext';

const LIVE_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'replays', label: 'Replays' },
] as const;

function PickedForYouCard({
  item,
  onPress,
  onMorePress,
}: {
  item: FeedCardItem;
  onPress: () => void;
  onMorePress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Image source={{ uri: item.imageUrl }} style={{ width: 96, height: 96, borderRadius: theme.radius.md }} />
        <View style={{ flex: 1, gap: 4 }}>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
            {item.duration ?? item.subtitle ?? 'ClaudyGod'}
          </CustomText>
          <CustomText variant="label" style={{ color: theme.colors.text }}>
            {item.title}
          </CustomText>
          {item.description ? (
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary }} numberOfLines={2}>
              {item.description}
            </CustomText>
          ) : null}
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <TVTouchable onPress={onMorePress} showFocusBorder={false}>
            <MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} />
          </TVTouchable>
          <TVTouchable
            onPress={onPress}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            showFocusBorder={false}
          >
            <MaterialIcons name="play-arrow" size={20} color={theme.colors.textInverse} />
          </TVTouchable>
        </View>
      </View>
    </SurfaceCard>
  );
}

function RotationRow({
  item,
  onPress,
  onMorePress,
}: {
  item: FeedCardItem;
  onPress: () => void;
  onMorePress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: 44, height: 44, borderRadius: theme.radius.md }} />
      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.textSecondary }} numberOfLines={1}>
          {item.subtitle ?? 'ClaudyGod'}
        </CustomText>
      </View>
      <TVTouchable onPress={onMorePress} showFocusBorder={false}>
        <MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} />
      </TVTouchable>
    </TVTouchable>
  );
}

function QuickPickCard({
  item,
  onPress,
  width,
}: {
  item: FeedCardItem;
  onPress: () => void;
  width: DimensionValue;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: 44, height: 44, borderRadius: theme.radius.md }} />
      <CustomText variant="caption" style={{ color: theme.colors.text }} numberOfLines={2}>
        {item.title}
      </CustomText>
    </TVTouchable>
  );
}
function toFeedCard(session: LiveSessionSummary): FeedCardItem {
  return {
    id: session.id,
    title: session.title,
    subtitle:
      session.status === 'live'
        ? `${session.viewerCount || 0} watching now`
        : session.status === 'scheduled' && session.scheduledFor
          ? `Starts ${new Date(session.scheduledFor).toLocaleString()}`
          : 'Replay available',
    description: session.description,
    duration: session.status === 'live' ? 'LIVE' : '--:--',
    imageUrl: session.coverImageUrl || '',
    mediaUrl: session.streamUrl || session.playbackUrl,
    type: 'live',
    liveViewerCount: session.viewerCount,
    isLive: session.status === 'live',
    createdAt: session.createdAt,
    appSections: session.appSections,
    notificationChannelId: session.channelId,
  };
}

function dedupeFeedItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export default function LiveScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const posterSize = isTablet ? 'md' : 'sm';
  const [activeChip, setActiveChip] = useState<(typeof LIVE_CHIPS)[number]['key']>(LIVE_CHIPS[0].key);
  const { feed } = useContentFeed();

  const [sessions, setSessions] = useState<LiveSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeActionItem, setActiveActionItem] = useState<FeedCardItem | null>(null);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetchLiveSessions('all');
      setSessions(response.items);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const liveNow = useMemo(() => sessions.filter((session) => session.status === 'live'), [sessions]);
  const upcoming = useMemo(() => sessions.filter((session) => session.status === 'scheduled'), [sessions]);
  const archive = useMemo(() => sessions.filter((session) => session.status === 'ended'), [sessions]);
  const featuredSession = liveNow[0] ?? upcoming[0] ?? archive[0] ?? null;
  const featuredCard = featuredSession ? toFeedCard(featuredSession) : null;
  const replayCards = useMemo(
    () =>
      dedupeFeedItems([
        ...archive.map(toFeedCard),
        ...feed.live.filter((item) => !item.isLive),
        ...feed.videos.slice(0, 10),
      ]).slice(0, 12),
    [archive, feed.live, feed.videos],
  );
  const quickPicks = useMemo(
    () => dedupeFeedItems([...liveNow.map(toFeedCard), ...upcoming.map(toFeedCard), ...replayCards]).slice(0, 4),
    [liveNow, upcoming, replayCards],
  );
  const filteredByChip = useMemo(() => {
    if (activeChip === 'live') return liveNow.map(toFeedCard);
    if (activeChip === 'upcoming') return upcoming.map(toFeedCard);
    if (activeChip === 'replays') return replayCards;
    return dedupeFeedItems([...liveNow.map(toFeedCard), ...upcoming.map(toFeedCard), ...replayCards]);
  }, [activeChip, liveNow, replayCards, upcoming]);
  const rotationItems = useMemo(() => replayCards.slice(0, 3), [replayCards]);
  const formatMeta = (item: FeedCardItem) =>
    [item.subtitle, item.duration].filter((value) => Boolean(value)).join(' · ');

  const openSession = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    router.push(buildPlayerRoute(item));
  };

  const followLiveSession = async (session: LiveSessionSummary) => {
    try {
      await subscribeToLiveAlertsBackend(session.channelId || session.id, session.title);
      showToast({
        title: 'Live alerts enabled',
        message: `You will be notified when ${session.title} starts.`,
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Sign in required',
        message: 'Create an account or sign in to receive live alerts.',
        tone: 'warning',
      });
    }
  };

  const shareLiveSession = async (session: LiveSessionSummary) => {
    const targetUrl = session.streamUrl || session.playbackUrl;
    try {
      await Share.share({
        message: `${session.title}\n${session.description}${targetUrl ? `\n${targetUrl}` : ''}`,
      });
    } catch {
      showToast({
        title: 'Share unavailable',
        message: 'Try again in a moment.',
        tone: 'warning',
      });
    }
  };

  const openMoreForItem = (item: FeedCardItem) => {
    setActiveActionItem(item);
    setIsActionSheetVisible(true);
  };

  const shareActive = async () => {
    if (!activeActionItem) return;
    try {
      await Share.share({
        message: `${activeActionItem.title}\n${activeActionItem.subtitle}${activeActionItem.mediaUrl ? `\n${activeActionItem.mediaUrl}` : ''}`,
      });
    } catch {
      showToast({
        title: 'Share unavailable',
        message: 'Try again in a moment.',
        tone: 'warning',
      });
    }
  };

  const saveToLibrary = async () => {
    if (!activeActionItem) return;
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in to save',
        message: 'Create an account to save items to your library.',
        tone: 'warning',
      });
      return;
    }
    try {
      await saveMeLibraryItem({
        bucket: 'liked',
        contentId: activeActionItem.id,
        contentType: activeActionItem.type,
        title: activeActionItem.title,
        subtitle: activeActionItem.subtitle,
        description: activeActionItem.description,
        imageUrl: activeActionItem.imageUrl,
        mediaUrl: activeActionItem.mediaUrl,
        duration: activeActionItem.duration,
        metadata: { source: 'live_action_sheet' },
      });
      showToast({
        title: 'Saved to Library',
        message: 'We saved this for you.',
        tone: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Save unavailable',
        message: error instanceof Error ? error.message : 'Please try again.',
        tone: 'warning',
      });
    }
  };

  const listenLater = async () => {
    if (!activeActionItem) return;
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in to save',
        message: 'Create an account to use Listen Later.',
        tone: 'warning',
      });
      return;
    }
    try {
      await saveMeLibraryItem({
        bucket: 'playlist',
        playlistName: 'Listen Later',
        contentId: activeActionItem.id,
        contentType: activeActionItem.type,
        title: activeActionItem.title,
        subtitle: activeActionItem.subtitle,
        description: activeActionItem.description,
        imageUrl: activeActionItem.imageUrl,
        mediaUrl: activeActionItem.mediaUrl,
        duration: activeActionItem.duration,
        metadata: { source: 'live_action_sheet' },
      });
      showToast({
        title: 'Added to Listen Later',
        message: 'We saved this for you.',
        tone: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Listen later unavailable',
        message: error instanceof Error ? error.message : 'Please try again.',
        tone: 'warning',
      });
    }
  };

  const followActiveLive = async () => {
    if (!activeActionItem) return;
    try {
      await subscribeToLiveAlertsBackend(activeActionItem.notificationChannelId || activeActionItem.id, activeActionItem.title);
      showToast({
        title: 'Live alerts enabled',
        message: `You will be notified when ${activeActionItem.title} goes live.`,
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Live alerts unavailable',
        message: 'Sign in to follow live sessions.',
        tone: 'warning',
      });
    }
  };

  const openReviews = () => {
    router.push(APP_ROUTES.settingsPages.rate);
  };

  const actionSheetActions: ActionSheetAction[] = !activeActionItem
    ? []
    : [
        {
          key: 'save',
          label: 'Save to Library',
          detail: 'Keep this in your library.',
          icon: 'bookmark-border',
          onPress: () => void saveToLibrary(),
        },
        {
          key: 'share',
          label: 'Share',
          detail: 'Send this session to someone else.',
          icon: 'ios-share',
          onPress: () => void shareActive(),
        },
        {
          key: 'listen-later',
          label: 'Listen Later',
          detail: 'Save this for later.',
          icon: 'schedule',
          onPress: () => void listenLater(),
        },
        {
          key: 'reviews',
          label: 'Reviews & Ratings',
          detail: 'See what others are saying.',
          icon: 'reviews',
          onPress: openReviews,
        },
        ...(activeActionItem.type === 'live'
          ? [
              {
                key: 'follow-live',
                label: 'Follow Live Alerts',
                detail: 'Get notified before the stream starts.',
                icon: 'notifications-active',
                onPress: () => void followActiveLive(),
              } as ActionSheetAction,
            ]
          : []),
        {
          key: 'open-detail',
          label: 'Open Player',
          detail: 'Open the full player screen.',
          icon: 'open-in-full',
          tone: 'accent' as const,
          onPress: () => {
            router.push(buildPlayerRoute(activeActionItem));
          },
        },
      ];

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void refresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge }}>
            <FadeIn>
              <BrandedHeaderCard
                title="Live"
                subtitle="Current broadcasts, upcoming ministry sessions, and saved replays."
                actions={[
                  { icon: 'search', onPress: () => router.push(APP_ROUTES.tabs.search), accessibilityLabel: 'Search' },
                  { icon: 'person-outline', onPress: () => router.push(APP_ROUTES.profile), accessibilityLabel: 'Profile' },
                ]}
              />
            </FadeIn>

            <FadeIn delay={70}>
              {isTablet ? (
                <CinematicHeroCard
                  imageSource={!featuredCard ? BRAND_HERO_ASSET : undefined}
                  imageUrl={featuredCard?.imageUrl}
                  badge={
                    featuredSession?.status === 'live'
                      ? 'Live now'
                      : featuredSession?.status === 'scheduled'
                        ? 'Upcoming'
                        : 'Replay'
                  }
                  eyebrow={featuredSession?.status === 'live' ? 'Join the stream' : 'ClaudyGod Live'}
                  title={featuredCard?.title ?? 'Stay ready for live worship, ministry updates, and saved replays.'}
                  subtitle={
                    featuredSession?.status === 'live'
                      ? `${featuredSession.viewerCount || 0} watching now`
                      : featuredSession?.status === 'scheduled' && featuredSession.scheduledFor
                        ? `Starts ${new Date(featuredSession.scheduledFor).toLocaleString()}`
                        : 'Live feed'
                  }
                  description={
                    featuredCard?.description ||
                    'Keep up with the live ministry schedule and move into the stream or replay without leaving the app.'
                  }
                  height={420}
                  actions={[
                    {
                      label: featuredSession?.status === 'scheduled' ? 'Open session' : 'Watch now',
                      onPress: () =>
                        featuredCard
                          ? void openSession(featuredCard, 'live_featured')
                          : router.push(APP_ROUTES.tabs.videos),
                      icon: 'play-arrow',
                    },
                    {
                      label: featuredSession?.status === 'ended' ? 'Share' : 'Get alerts',
                      onPress: () => {
                        if (!featuredSession) {
                          router.push(APP_ROUTES.auth.signIn);
                          return;
                        }
                        if (featuredSession.status === 'ended') {
                          void shareLiveSession(featuredSession);
                          return;
                        }
                        void followLiveSession(featuredSession);
                      },
                      variant: 'secondary',
                      icon: featuredSession?.status === 'ended' ? 'ios-share' : 'notifications-active',
                    },
                  ]}
                />
              ) : featuredCard ? (
                <PickedForYouCard
                  item={featuredCard}
                  onPress={() => void openSession(featuredCard, 'live_featured')}
                  onMorePress={() => openMoreForItem(featuredCard)}
                />
              ) : null}
            </FadeIn>

            <FadeIn delay={90}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                bounces={false}
                overScrollMode="never"
              >
                {LIVE_CHIPS.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    active={activeChip === chip.key}
                    onPress={() => setActiveChip(chip.key)}
                  />
                ))}
              </ScrollView>
            </FadeIn>

            {quickPicks.length ? (
              <FadeIn delay={110}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {quickPicks.map((item) => (
                    <QuickPickCard
                      key={`quick-${item.id}`}
                      item={item}
                      width={isTablet ? '31.8%' : '48%'}
                      onPress={() => void openSession(item, 'live_quick_pick')}
                    />
                  ))}
                </View>
              </FadeIn>
            ) : null}

            {featuredCard ? (
              <FadeIn delay={120}>
                <View style={{ gap: 10 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text }}>
                    Picked for you
                  </CustomText>
                  <PickedForYouCard
                    item={featuredCard}
                    onPress={() => void openSession(featuredCard, 'live_picked')}
                    onMorePress={() => openMoreForItem(featuredCard)}
                  />
                </View>
              </FadeIn>
            ) : null}

            {rotationItems.length ? (
              <FadeIn delay={140}>
                <View style={{ gap: 10 }}>
                  <SectionHeader
                    title="Your recent rotation"
                    actionLabel="Videos"
                    onAction={() => router.push(APP_ROUTES.tabs.videos)}
                  />
                  <View style={{ gap: 2 }}>
                    {rotationItems.map((item) => (
                      <RotationRow
                        key={`rotation-${item.id}`}
                        item={item}
                        onPress={() => void openSession(item, 'live_rotation')}
                        onMorePress={() => openMoreForItem(item)}
                      />
                    ))}
                  </View>
                </View>
              </FadeIn>
            ) : null}

            <FadeIn delay={160}>
              <View>
                <SectionHeader
                  title="Recents"
                  actionLabel="Show all"
                  onAction={() => router.push(APP_ROUTES.tabs.videos)}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                  {filteredByChip.slice(0, 12).map((item) => (
                    <PosterCard
                      key={`recent-${item.id}`}
                      imageUrl={item.imageUrl}
                      title={item.title}
                      meta={formatMeta(item)}
                      size={posterSize}
                      onPress={() => void openSession(item, 'live_recents')}
                      showMore
                      onMorePress={() => openMoreForItem(item)}
                    />
                  ))}
                </ScrollView>
              </View>
            </FadeIn>

            <FadeIn delay={190}>
              <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <LiveStatCard label="Live now" value={liveNow.length} />
                  <LiveStatCard label="Upcoming" value={upcoming.length} />
                  <LiveStatCard label="Replays" value={archive.length} />
                </View>
              </SurfaceCard>
            </FadeIn>

            {liveNow.length ? (
              <FadeIn delay={150}>
                <View>
                  <SectionHeader
                    title="Live now"
                    actionLabel="Open"
                    onAction={() => void openSession(toFeedCard(liveNow[0]!), 'live_now')}
                  />
                  {isTablet ? (
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                      Join the current broadcast or follow the stream so you do not miss the next session.
                    </CustomText>
                  ) : null}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {liveNow.map((session) => {
                      const item = toFeedCard(session);
                      return (
                        <PosterCard
                          key={`live-now-${session.id}`}
                          imageUrl={item.imageUrl}
                          title={item.title}
                          meta={formatMeta({
                            ...item,
                            subtitle: `${session.viewerCount || 0} watching`,
                          })}
                          size={posterSize}
                          onPress={() => void openSession(item, 'live_now_rail')}
                          showMore
                          onMorePress={() => openMoreForItem(item)}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {upcoming.length ? (
              <FadeIn delay={190}>
                <View>
                  <SectionHeader
                    title="Upcoming"
                    actionLabel="Alerts"
                    onAction={() => void followLiveSession(upcoming[0]!)}
                  />
                  {isTablet ? (
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                      Get notified when the next session starts.
                    </CustomText>
                  ) : null}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {upcoming.map((session) => {
                      const item = toFeedCard(session);
                      return (
                        <PosterCard
                          key={`live-upcoming-${session.id}`}
                          imageUrl={item.imageUrl}
                          title={item.title}
                          meta={formatMeta(item)}
                          size={posterSize}
                          onPress={() => void openSession(item, 'live_upcoming')}
                          showMore
                          onMorePress={() => openMoreForItem(item)}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {replayCards.length ? (
              <FadeIn delay={230}>
                <View>
                  <SectionHeader
                    title="Replays"
                    actionLabel="Videos"
                    onAction={() => router.push(APP_ROUTES.tabs.videos)}
                  />
                  {isTablet ? (
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                      Watch saved live sessions and recent ministry replays.
                    </CustomText>
                  ) : null}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {replayCards.map((item) => (
                      <PosterCard
                        key={`live-replay-${item.id}`}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        meta={formatMeta(item)}
                        size={posterSize}
                        onPress={() => void openSession(item, 'live_replays')}
                        showMore
                        onMorePress={() => openMoreForItem(item)}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {!liveNow.length && !upcoming.length && !replayCards.length ? (
              <FadeIn delay={270}>
                <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
                  <View style={{ gap: 10 }}>
                    <CustomText variant="heading" style={{ color: theme.colors.text }}>
                      No live sessions yet
                    </CustomText>
                    <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>
                      When a live session is scheduled or started from the admin portal, it will appear here automatically.
                    </CustomText>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <AppButton title="Browse Music" size="sm" onPress={() => router.push(APP_ROUTES.tabs.player)} />
                      <AppButton
                        title="Watch Videos"
                        size="sm"
                        variant="secondary"
                        onPress={() => router.push(APP_ROUTES.tabs.videos)}
                      />
                    </View>
                  </View>
                </SurfaceCard>
              </FadeIn>
            ) : null}
          </View>
        </Screen>
      </ScrollView>
      <ActionSheet
        visible={isActionSheetVisible}
        title={activeActionItem?.title ?? 'Live options'}
        description={activeActionItem?.subtitle}
        actions={actionSheetActions}
        onClose={() => setIsActionSheetVisible(false)}
      />
    </TabScreenWrapper>
  );
}

function LiveStatCard({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        paddingHorizontal: 12,
        paddingVertical: 14,
      }}
    >
      <CustomText
        variant="caption"
        style={{
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </CustomText>
      <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 6 }}>
        {value}
      </CustomText>
    </View>
  );
}
