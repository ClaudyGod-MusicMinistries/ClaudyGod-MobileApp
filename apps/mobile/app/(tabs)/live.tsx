import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../../components/ui/AppButton';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchLiveSessions, type LiveSessionSummary } from '../../services/liveService';
import type { FeedCardItem } from '../../services/contentService';
import { useToast } from '../../context/ToastContext';
import { subscribeToLiveAlertsBackend } from '../../services/userFlowService';
import { ContentList, ContentRail, EmptyState, PremiumHero, PremiumPage, dedupeFeedItems } from '../../components/Exp/PremiumContent';

function toFeedCard(session: LiveSessionSummary): FeedCardItem {
  return {
    id: session.id,
    title: session.title,
    subtitle: session.status === 'live' ? `${session.viewerCount || 0} watching now` : session.status === 'scheduled' && session.scheduledFor ? `Starts ${new Date(session.scheduledFor).toLocaleString()}` : 'Replay available',
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

export default function LiveScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
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

  useEffect(() => { void refresh(); }, []);

  const liveCards = useMemo(() => sessions.filter((s) => s.status === 'live').map(toFeedCard), [sessions]);
  const upcomingCards = useMemo(() => sessions.filter((s) => s.status === 'scheduled').map(toFeedCard), [sessions]);
  const replayCards = useMemo(() => dedupeFeedItems([...sessions.filter((s) => s.status === 'ended').map(toFeedCard), ...feed.live.filter((item) => !item.isLive), ...feed.videos.slice(0, 10)]).slice(0, 12), [sessions, feed.live, feed.videos]);
  const featuredCard = liveCards[0] ?? upcomingCards[0] ?? replayCards[0] ?? null;

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
    <PremiumPage title="Live" eyebrow="Now" refreshing={loading} onRefresh={() => void refresh()} rightAction={<AppButton title="" variant="secondary" size="sm" onPress={() => router.push(APP_ROUTES.tabs.videos)} leftIcon={<MaterialIcons name="smart-display" size={16} color={theme.colors.text} />} style={{ minWidth: 40, paddingHorizontal: 10 }} />}>
      <PremiumHero item={featuredCard} title={featuredCard?.title ?? 'Live sessions'} subtitle={featuredCard?.description || 'Follow upcoming services and rewatch recent ministry moments.'} eyebrow={featuredCard?.isLive ? 'Live now' : featuredCard?.subtitle ?? 'Upcoming'} primaryLabel={featuredCard?.isLive ? 'Watch live' : featuredCard?.mediaUrl ? 'Watch replay' : 'Notify me'} primaryIcon={featuredCard?.isLive || featuredCard?.mediaUrl ? 'live-tv' : 'notifications-active'} onPrimary={() => (featuredCard ? (featuredCard.mediaUrl ? void openSession(featuredCard, 'live_hero') : void followLive(featuredCard)) : undefined)} />
      <ContentRail title="Live now" items={liveCards} loading={loading} hideWhenEmpty onPressItem={(item) => void openSession(item, 'live_now')} />
      <ContentRail title="Upcoming" items={upcomingCards} compact loading={loading} hideWhenEmpty onPressItem={(item) => void followLive(item)} />
      <ContentRail title="Replays" items={replayCards} loading={loading} hideWhenEmpty onPressItem={(item) => void openSession(item, 'live_replays')} />
      <ContentList title="Watch again" items={replayCards} onPressItem={(item) => void openSession(item, 'live_watch_again')} />
      {!loading && !liveCards.length && !upcomingCards.length && !replayCards.length ? <EmptyState title="No live sessions right now" message="Explore videos or music while the live schedule is quiet." actionLabel="Videos" onAction={() => router.push(APP_ROUTES.tabs.videos)} icon="live-tv" /> : null}
    </PremiumPage>
  );
}
