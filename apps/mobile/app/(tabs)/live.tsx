import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PosterCard } from '../../components/ui/PosterCard';
import { AppButton } from '../../components/ui/AppButton';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { BRAND_HERO_ASSET } from '../../util/brandAssets';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchLiveSessions, type LiveSessionSummary } from '../../services/liveService';
import type { FeedCardItem } from '../../services/contentService';
import { useToast } from '../../context/ToastContext';

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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const posterSize = isTablet ? 'lg' : 'md';
  const { feed } = useContentFeed();

  const [sessions, setSessions] = useState<LiveSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
      await subscribeToLiveAlerts(session.channelId || session.id);
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
                height={isTablet ? 420 : 340}
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
            </FadeIn>

            <FadeIn delay={110}>
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
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                    Join the current broadcast or follow the stream so you do not miss the next session.
                  </CustomText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {liveNow.map((session) => {
                      const item = toFeedCard(session);
                      return (
                        <PosterCard
                          key={`live-now-${session.id}`}
                          imageUrl={item.imageUrl}
                          title={item.title}
                          subtitle={`${session.viewerCount || 0} watching`}
                          size={posterSize}
                          onPress={() => void openSession(item, 'live_now_rail')}
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
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                    Get notified when the next session starts.
                  </CustomText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {upcoming.map((session) => {
                      const item = toFeedCard(session);
                      return (
                        <PosterCard
                          key={`live-upcoming-${session.id}`}
                          imageUrl={item.imageUrl}
                          title={item.title}
                          subtitle={item.subtitle}
                          size={posterSize}
                          onPress={() => void openSession(item, 'live_upcoming')}
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
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                    Watch saved live sessions and recent ministry replays.
                  </CustomText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {replayCards.map((item) => (
                      <PosterCard
                        key={`live-replay-${item.id}`}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        subtitle={item.subtitle}
                        size={posterSize}
                        onPress={() => void openSession(item, 'live_replays')}
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
