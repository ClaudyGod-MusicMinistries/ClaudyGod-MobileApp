import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Image, RefreshControl, ScrollView, TextInput, View, type AppStateStatus, type ImageStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { BrandLoader } from '../../components/branding/BrandLoader';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { useAppModal } from '../../context/AppModalContext';
import { ENV } from '../../services/config';
import { getStoredMobileSession } from '../../services/authService';
import {
  fetchLiveSessionDetail,
  postLiveSessionMessage,
  type LiveSessionDetail,
  type LiveMessageKind,
} from '../../services/liveService';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // StatusBadge
  statusBase:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  statusDot:     { width: 7, height: 7, borderRadius: 3.5 },
  statusText:    { fontWeight: '700', letterSpacing: 0.5 },

  // MessageBubble
  bubbleCard:    { borderRadius: 18, padding: 14, gap: 6, backgroundColor: theme.colors.subtleFill, borderWidth: 1, borderColor: theme.colors.border },
  bubbleTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  bubbleAuthor:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubbleAvatar:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubbleInitial: { fontWeight: '800', fontSize: 11 },
  bubbleKindBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  bubbleKindText:  { fontSize: 10, fontWeight: '700' },
  bubbleBody:    { color: theme.colors.textSecondary, lineHeight: 20 },
  bubbleName:    { color: theme.colors.text },
  bubbleTime:    { color: theme.colors.textMuted, fontSize: 11 },

  // Header row
  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerTextWrap: { flex: 1, minWidth: 0 },
  headerTitle:    { color: theme.colors.text },
  headerMeta:     { color: theme.colors.textSecondary, marginTop: 2 },

  // Loading
  loadingWrap:    { alignItems: 'center', paddingVertical: 60 },

  // Error
  errorPad:       { padding: theme.spacing.lg, gap: 10 },
  errorTitle:     { color: theme.colors.text },
  errorBody:      { color: theme.colors.textSecondary },

  // Chat panel
  chatPanelWrap:  { gap: 14 },
  chatPad:        { padding: theme.spacing.lg, gap: 14 },
  chatHeading:    { color: theme.colors.text },
  chatSub:        { color: theme.colors.textSecondary, marginTop: 4 },
  kindRow:        { flexDirection: 'row', gap: 8 },
  kindBase:       { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1 },
  kindActive:     { backgroundColor: theme.colors.primary, borderColor: 'transparent' },
  kindInactive:   { backgroundColor: theme.colors.subtleFill, borderColor: theme.colors.border },
  kindTxtActive:  { color: '#FFFFFF', fontWeight: '700' },
  kindTxtInactive: { color: theme.colors.textSecondary, fontWeight: '500' },
  chatInput: {
    minHeight: 88, borderRadius: 18, borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: 14, textAlignVertical: 'top', fontSize: 14,
  },

  // Audience
  audiencePad:    { padding: theme.spacing.md },
  audienceTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  audienceHeading: { color: theme.colors.text },
  audienceSub:    { color: theme.colors.textSecondary },
  audienceEmpty:  { padding: theme.spacing.lg, alignItems: 'center', gap: 10 },
  emptyText:      { color: theme.colors.textSecondary, textAlign: 'center' },
  msgFeed:        { gap: 8 },

  // Media panel
  mediaCard:     { overflow: 'hidden', padding: 0 },
  mediaPad:      { padding: theme.spacing.md, gap: 8 },
  mediaDesc:     { color: theme.colors.textSecondary },
  coverImg:      { width: '100%', height: '100%' },
  gradientBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagPill: {
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  tagText:       { color: theme.colors.textSecondary },

  // Wide layout
  wideRow:       { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  wideMedia:     { flex: 1.5, gap: 14 },
  wideChat:      { flex: 1, gap: 14 },

  // Scroll + outer
  scrollFill:    { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: theme.layout.tabBarContentPadding },
  outerPad:      { gap: theme.spacing.lg, paddingTop: theme.layout.sectionGap },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSessionMeta(session: LiveSessionDetail): string {
  if (session.status === 'live') return `${session.viewerCount || 0} watching now`;
  if (session.status === 'scheduled' && session.scheduledFor) return `Starts ${new Date(session.scheduledFor).toLocaleString()}`;
  if (session.endedAt) return `Replay saved ${new Date(session.endedAt).toLocaleString()}`;
  return 'Live session';
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles   = useStyles();
  const theme    = useAppTheme();
  const isLive   = status === 'live';
  const isUpcoming = status === 'scheduled';
  const color    = isLive ? theme.colors.danger : isUpcoming ? theme.colors.warning : theme.colors.primary;
  const label    = isLive ? 'Live now' : isUpcoming ? 'Upcoming' : 'Replay';
  return (
    <View style={[styles.statusBase, { backgroundColor: `${color}14`, borderColor: `${color}30` }]}>
      {isLive ? <View style={[styles.statusDot, { backgroundColor: color }]} /> : null}
      <CustomText variant="caption" style={[styles.statusText, { color }]}>{label}</CustomText>
    </View>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: LiveSessionDetail['messages'][0] }) {
  const styles      = useStyles();
  const theme       = useAppTheme();
  const isSuggestion = message.kind === 'suggestion';
  const accentColor  = isSuggestion ? theme.colors.warning : theme.colors.primary;
  return (
    <View style={styles.bubbleCard}>
      <View style={styles.bubbleTop}>
        <View style={styles.bubbleAuthor}>
          <View style={[styles.bubbleAvatar, { backgroundColor: `${accentColor}18` }]}>
            <CustomText variant="caption" style={[styles.bubbleInitial, { color: accentColor }]}>
              {message.author.displayName.charAt(0).toUpperCase()}
            </CustomText>
          </View>
          <CustomText variant="label" style={styles.bubbleName}>{message.author.displayName}</CustomText>
        </View>
        {isSuggestion ? (
          <View style={[styles.bubbleKindBadge, { backgroundColor: `${accentColor}14` }]}>
            <CustomText style={[styles.bubbleKindText, { color: accentColor }]}>IDEA</CustomText>
          </View>
        ) : null}
      </View>
      <CustomText variant="body" style={styles.bubbleBody}>{message.message}</CustomText>
      <CustomText variant="caption" style={styles.bubbleTime}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </CustomText>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LiveSessionScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const { showModal } = useAppModal();
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const [session,      setSession]      = useState<LiveSessionDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [messageKind,  setMessageKind]  = useState<LiveMessageKind>('comment');
  const [draftMessage, setDraftMessage] = useState('');
  const [error,        setError]        = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sessionId) { setError('Live session not found.'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const next = await fetchLiveSessionDetail(sessionId);
      setSession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load live session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Real-time chat: the backend already broadcasts new messages to channel
  // `live:${sessionId}` over its WebSocket server whenever one is posted — this
  // was previously never consumed, so chat only ever updated on manual
  // pull-to-refresh. Reconnects (and backfills via `refresh()`) on foreground,
  // since RN suspends sockets while backgrounded. Dedupes by message id since
  // the sender's own optimistic prepend in `submitMessage` below will also
  // arrive back over this same socket.
  useEffect(() => {
    if (!sessionId) return;
    let ws: WebSocket | null = null;
    let cancelled = false;

    const connect = async () => {
      const { accessToken } = await getStoredMobileSession();
      if (cancelled) return;
      const wsBase = ENV.apiUrl.replace(/^http/, 'ws');
      const url = `${wsBase}/ws${accessToken ? `?token=${encodeURIComponent(accessToken)}` : ''}`;
      ws = new WebSocket(url);
      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: 'subscribe', channel: `live:${sessionId}` }));
      };
      ws.onmessage = (event) => {
        try {
          const frame = JSON.parse(String(event.data)) as { type?: string; channel?: string; payload?: unknown };
          if (frame.type === 'message' && frame.channel === `live:${sessionId}`) {
            const incoming = frame.payload as LiveSessionDetail['messages'][0];
            setSession((current) => {
              if (!current || current.messages.some((m) => m.id === incoming.id)) return current;
              return { ...current, messageCount: current.messageCount + 1, messages: [incoming, ...current.messages] };
            });
          }
        } catch {
          // Malformed frame — ignore silently.
        }
      };
    };

    void connect();

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active') return;
      if (ws?.readyState !== WebSocket.OPEN) void connect();
      void refresh();
    });

    return () => {
      cancelled = true;
      subscription.remove();
      ws?.close();
    };
  }, [sessionId, refresh]);

  const activeMediaUrl = useMemo(() => session?.streamUrl || session?.playbackUrl, [session]);
  const coverImageUrl  = session?.coverImageUrl || DEFAULT_CONTENT_IMAGE_URI;
  const isWideLayout   = device.isDesktop || device.isTV;
  const videoHeight    = device.isTV ? 480 : device.isLargeDesktop ? 400 : device.isDesktop ? 340 : 220;

  const submitMessage = async () => {
    if (!sessionId) return;
    if (!draftMessage.trim()) {
      showModal({ title: 'Add a message', message: 'Enter a comment or suggestion before sending.', tone: 'warning', primaryAction: { label: 'Continue' } });
      return;
    }
    setSaving(true);
    try {
      const created = await postLiveSessionMessage(sessionId, { kind: messageKind, message: draftMessage.trim() });
      setSession((current) => current ? { ...current, messageCount: current.messageCount + 1, messages: [created, ...current.messages] } : current);
      setDraftMessage('');
      showModal({ title: 'Message sent', message: messageKind === 'comment' ? 'Your comment has been added.' : 'Your suggestion has been sent.', tone: 'success', primaryAction: { label: 'Done' } });
    } catch (err) {
      showModal({ title: 'Unable to send', message: err instanceof Error ? err.message : 'Sign in to join the live conversation.', tone: 'error', primaryAction: { label: 'Try again' } });
    } finally {
      setSaving(false);
    }
  };

  const chatPanel = session ? (
    <View style={styles.chatPanelWrap}>
      <SurfaceCard tone="subtle" style={styles.chatPad}>
        <View>
          <CustomText variant="heading" style={styles.chatHeading}>Join the conversation</CustomText>
          <CustomText variant="caption" style={styles.chatSub}>
            {session.status === 'live' ? 'Send a comment or idea to the live host.' : 'Leave a note on this replay.'}
          </CustomText>
        </View>
        <View style={styles.kindRow}>
          {(['comment', 'suggestion'] as LiveMessageKind[]).map((kind) => {
            const active = messageKind === kind;
            return (
              <TVTouchable
                key={kind}
                onPress={() => setMessageKind(kind)}
                showFocusBorder={false}
                style={[styles.kindBase, active ? styles.kindActive : styles.kindInactive]}
              >
                <CustomText variant="caption" style={active ? styles.kindTxtActive : styles.kindTxtInactive}>
                  {kind === 'comment' ? 'Comment' : 'Suggestion'}
                </CustomText>
              </TVTouchable>
            );
          })}
        </View>
        <TextInput
          value={draftMessage}
          onChangeText={setDraftMessage}
          placeholder={messageKind === 'comment' ? 'Share your comment...' : 'Share your suggestion...'}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          style={styles.chatInput}
        />
        <AppButton
          title={saving ? 'Sending...' : 'Send to live host'}
          fullWidth
          loading={saving}
          onPress={() => void submitMessage()}
          leftIcon={<MaterialIcons name="send" size={16} color={theme.colors.textInverse} />}
        />
      </SurfaceCard>

      <SurfaceCard tone="subtle" style={styles.audiencePad}>
        <View style={styles.audienceTop}>
          <CustomText variant="heading" style={styles.audienceHeading}>Audience feed</CustomText>
          <CustomText variant="caption" style={styles.audienceSub}>
            {session.messageCount} message{session.messageCount === 1 ? '' : 's'}
          </CustomText>
        </View>
        {session.messages.length > 0 ? (
          <View style={styles.msgFeed}>
            {session.messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
          </View>
        ) : (
          <View style={styles.audienceEmpty}>
            <MaterialIcons name="chat-bubble-outline" size={32} color={theme.colors.textMuted} />
            <CustomText variant="caption" style={styles.emptyText}>
              No messages yet. Be the first to comment.
            </CustomText>
          </View>
        )}
      </SurfaceCard>
    </View>
  ) : null;

  const mediaPanel = session ? (
    <SurfaceCard tone="subtle" style={styles.mediaCard}>
      {activeMediaUrl ? (
        <VideoPlayer title={session.title} sourceUri={activeMediaUrl} height={videoHeight} />
      ) : (
        <View style={{ height: videoHeight }}>
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImg as ImageStyle}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(7,5,12,0.6)']}
            style={styles.gradientBar}
          />
        </View>
      )}
      <View style={styles.mediaPad}>
        <CustomText variant="body" style={styles.mediaDesc}>{session.description}</CustomText>
        {session.tags?.length ? (
          <View style={styles.tagsRow}>
            {session.tags.slice(0, isWideLayout ? 8 : 5).map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <CustomText variant="caption" style={styles.tagText}>{tag}</CustomText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </SurfaceCard>
  ) : null;

  return (
    <TabScreenWrapper>
      <ScrollView
        style={styles.scrollFill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <View style={styles.outerPad}>
            <FadeIn>
              <View style={styles.headerRow}>
                <TVTouchable onPress={() => router.back()} showFocusBorder={false} style={styles.backBtn}>
                  <MaterialIcons name="arrow-back" size={20} color={theme.colors.text} />
                </TVTouchable>
                <View style={styles.headerTextWrap}>
                  <CustomText variant="label" style={styles.headerTitle} numberOfLines={1}>
                    {session?.title || 'Live Session'}
                  </CustomText>
                  <CustomText variant="caption" style={styles.headerMeta} numberOfLines={1}>
                    {session ? formatSessionMeta(session) : 'Loading...'}
                  </CustomText>
                </View>
                {session ? <StatusBadge status={session.status} /> : null}
              </View>
            </FadeIn>

            {loading && !session ? (
              <View style={styles.loadingWrap}>
                <BrandLoader label="Opening live session" size="md" textColor={theme.colors.text} />
              </View>
            ) : null}

            {error ? (
              <SurfaceCard tone="subtle" style={styles.errorPad}>
                <MaterialIcons name="error-outline" size={24} color={theme.colors.danger} />
                <CustomText variant="subtitle" style={styles.errorTitle}>Unable to open this session</CustomText>
                <CustomText variant="caption" style={styles.errorBody}>{error}</CustomText>
                <AppButton title="Try again" variant="secondary" onPress={() => void refresh()} />
              </SurfaceCard>
            ) : null}

            {session ? (
              isWideLayout ? (
                <FadeIn delay={60}>
                  <View style={styles.wideRow}>
                    <View style={styles.wideMedia}>{mediaPanel}</View>
                    <View style={styles.wideChat}>{chatPanel}</View>
                  </View>
                </FadeIn>
              ) : (
                <>
                  <FadeIn delay={60}>{mediaPanel}</FadeIn>
                  <FadeIn delay={90}>{chatPanel}</FadeIn>
                </>
              )
            ) : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
