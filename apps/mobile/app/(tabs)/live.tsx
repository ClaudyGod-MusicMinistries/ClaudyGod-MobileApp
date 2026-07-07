import React, { useMemo } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { AppButton } from '../../components/ui/AppButton';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { useContentFeed } from '../../hooks/useContentFeed';
import { makeStyles } from '../../styles/makeStyles';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchLiveSessions, type LiveSessionSummary } from '../../services/liveService';
import type { FeedCardItem } from '../../services/contentService';
import { useToast } from '../../context/ToastContext';
import { subscribeToLiveAlertsBackend } from '../../services/userFlowService';
import {
  ContentList,
  ContentRail,
  EmptyState,
  PremiumHero,
  PremiumPage,
  SectionLabel,
  dedupeFeedItems,
} from '../../components/Exp/PremiumContent';

// Stable reference so `sessions` doesn't change identity on every render while loading.
const EMPTY_SESSIONS: LiveSessionSummary[] = [];

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // LivePulse
  pulseRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  liveDot:           { width: 7, height: 7, borderRadius: 3.5, backgroundColor: theme.colors.danger },
  liveLabel:         { color: theme.colors.danger, fontWeight: '700', letterSpacing: 0.6 },
  viewerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: `${theme.colors.primary}12`, borderRadius: 999,
    borderWidth: 1, borderColor: `${theme.colors.primary}28`,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  viewerText:        { color: theme.colors.primary, fontWeight: '600' },

  // ScheduleCard
  scheduleCard:      { padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 14 },
  scheduleIconBox: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${theme.colors.primary}12`,
    borderWidth: 1, borderColor: `${theme.colors.primary}28`,
  },
  scheduleFill:      { flex: 1, minWidth: 0 },
  scheduleTitle:     { color: theme.colors.text },
  scheduleSubtitle:  { color: theme.colors.textSecondary, marginTop: 3 },
  notifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${theme.colors.primary}12`, borderRadius: 999,
    borderWidth: 1, borderColor: `${theme.colors.primary}28`,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  notifyText:        { color: theme.colors.primary, fontWeight: '600' },

  // LiveScreen
  videoNavBtn:       { minWidth: 40, paddingHorizontal: 10 },
  statusCard:        { padding: theme.spacing.md },
  statusRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
  },
  sessionCount:      { color: theme.colors.textSecondary },
  sectionGap:        { gap: 12 },
  upcomingList:      { gap: 8 },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── LivePulse ────────────────────────────────────────────────────────────────

function LivePulse({ viewerCount }: { viewerCount: number }) {
  const styles = useStyles();
  return (
    <View style={styles.pulseRow}>
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <CustomText variant="caption" style={styles.liveLabel}>LIVE NOW</CustomText>
      </View>
      {viewerCount > 0 ? (
        <View style={styles.viewerPill}>
          <MaterialIcons name="people" size={13} />
          <CustomText variant="caption" style={styles.viewerText}>
            {viewerCount >= 1000 ? `${(viewerCount / 1000).toFixed(1)}K` : viewerCount} watching
          </CustomText>
        </View>
      ) : null}
    </View>
  );
}

// ─── ScheduleCard ─────────────────────────────────────────────────────────────

function ScheduleCard({ item, onNotify }: { item: FeedCardItem; onNotify: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <SurfaceCard tone="subtle" style={styles.scheduleCard}>
      <View style={styles.scheduleIconBox}>
        <MaterialIcons name="event" size={22} color={theme.colors.primary} />
      </View>
      <View style={styles.scheduleFill}>
        <CustomText variant="label" style={styles.scheduleTitle} numberOfLines={1}>{item.title}</CustomText>
        <CustomText variant="caption" style={styles.scheduleSubtitle} numberOfLines={1}>{item.subtitle}</CustomText>
      </View>
      <TVTouchable onPress={onNotify} showFocusBorder={false} style={styles.notifyBtn}>
        <MaterialIcons name="notifications-active" size={14} color={theme.colors.primary} />
        <CustomText variant="caption" style={styles.notifyText}>Notify me</CustomText>
      </TVTouchable>
    </SurfaceCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LiveScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const { feed } = useContentFeed();
  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['liveSessions', 'all'],
    queryFn: async () => (await fetchLiveSessions('all')).items,
  });
  const sessions = data ?? EMPTY_SESSIONS;
  const refresh = () => refetch();

  const liveCards     = useMemo(() => sessions.filter((s) => s.status === 'live').map(toFeedCard), [sessions]);
  const upcomingCards = useMemo(() => sessions.filter((s) => s.status === 'scheduled').map(toFeedCard), [sessions]);
  const replayCards   = useMemo(
    () => dedupeFeedItems([
      ...sessions.filter((s) => s.status === 'ended').map(toFeedCard),
      ...feed.live.filter((item) => !item.isLive),
      ...feed.videos.slice(0, 10),
    ]).slice(0, 12),
    [sessions, feed.live, feed.videos],
  );

  const featuredCard  = liveCards[0] ?? upcomingCards[0] ?? replayCards[0] ?? null;
  const totalViewers  = liveCards.reduce((sum, c) => sum + (c.liveViewerCount ?? 0), 0);
  const upcomingLimit = device.isTV ? 6 : device.isDesktop ? 5 : 3;

  const openSession = async (item: FeedCardItem, source: string) => {
    if (!item.mediaUrl && !item.isLive) {
      showToast({ title: 'Session unavailable', message: 'This session is not ready to watch yet.', tone: 'warning' });
      return;
    }
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  const followLive = async (item: FeedCardItem) => {
    try {
      await subscribeToLiveAlertsBackend(item.notificationChannelId || item.id, item.title);
      showToast({ title: 'Live alerts enabled', message: 'You will be notified before the session starts.', tone: 'success' });
    } catch {
      showToast({ title: 'Sign in to receive alerts', message: 'Create an account or sign in to follow live sessions.', tone: 'warning' });
    }
  };

  return (
    <PremiumPage
      title="Live"
      eyebrow="Now"
      noBack
      refreshing={loading}
      onRefresh={() => void refresh()}
      rightAction={
        <AppButton
          title=""
          variant="secondary"
          size="sm"
          onPress={() => router.push(APP_ROUTES.tabs.videos)}
          leftIcon={<MaterialIcons name="smart-display" size={16} color={theme.colors.text} />}
          style={styles.videoNavBtn}
        />
      }
    >
      {/* Status bar: live now */}
      {liveCards.length > 0 ? (
        <FadeIn>
          <SurfaceCard tone="strong" style={styles.statusCard}>
            <View style={styles.statusRow}>
              <LivePulse viewerCount={totalViewers} />
              <CustomText variant="caption" style={styles.sessionCount}>
                {liveCards.length} session{liveCards.length !== 1 ? 's' : ''} live
              </CustomText>
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      {/* Featured hero */}
      <PremiumHero
        item={featuredCard}
        title={featuredCard?.title ?? 'Live sessions'}
        subtitle={featuredCard?.description || 'Follow upcoming services and rewatch recent ministry moments.'}
        eyebrow={featuredCard?.isLive ? 'Live now' : featuredCard ? 'Upcoming' : 'Ministry'}
        primaryLabel={featuredCard?.isLive ? 'Watch live' : featuredCard?.mediaUrl ? 'Watch replay' : 'Notify me'}
        primaryIcon={featuredCard?.isLive || featuredCard?.mediaUrl ? 'live-tv' : 'notifications-active'}
        onPrimary={() => (featuredCard ? (featuredCard.mediaUrl ? void openSession(featuredCard, 'live_hero') : void followLive(featuredCard)) : undefined)}
      />

      {/* Live now */}
      {liveCards.length > 0 ? (
        <FadeIn delay={80}>
          <View style={styles.sectionGap}>
            <SectionLabel title="Live now" accent={`${liveCards.length} active`} subtitle="Happening right now across the ministry" />
            <ContentRail title="" items={liveCards} loading={loading} onPressItem={(item) => void openSession(item, 'live_now')} />
          </View>
        </FadeIn>
      ) : null}

      {/* Upcoming schedule */}
      {upcomingCards.length > 0 ? (
        <FadeIn delay={130}>
          <View style={styles.sectionGap}>
            <SectionLabel title="Coming up" accent={`${upcomingCards.length} scheduled`} subtitle="Get notified before these sessions start" />
            <View style={styles.upcomingList}>
              {upcomingCards.slice(0, upcomingLimit).map((item) => (
                <ScheduleCard key={item.id} item={item} onNotify={() => void followLive(item)} />
              ))}
            </View>
          </View>
        </FadeIn>
      ) : null}

      {/* Replay rail */}
      {replayCards.length > 0 ? (
        <FadeIn delay={180}>
          <View style={styles.sectionGap}>
            <SectionLabel
              title="Replays" accent="Watch again" subtitle="Past sessions and ministry moments"
              actionLabel="See all" onAction={() => router.push(APP_ROUTES.tabs.videos)}
            />
            <ContentRail title="" items={replayCards} loading={loading} onPressItem={(item) => void openSession(item, 'live_replays')} />
          </View>
        </FadeIn>
      ) : null}

      {/* Extended list */}
      {replayCards.length > 4 ? (
        <ContentList title="Watch again" items={replayCards} onPressItem={(item) => void openSession(item, 'live_watch_again')} />
      ) : null}

      {/* Empty state */}
      {!loading && !liveCards.length && !upcomingCards.length && !replayCards.length ? (
        <EmptyState
          title="No live sessions right now"
          message="Explore videos or music while the live schedule is quiet."
          actionLabel="Browse videos"
          onAction={() => router.push(APP_ROUTES.tabs.videos)}
          icon="live-tv"
        />
      ) : null}
    </PremiumPage>
  );
}
