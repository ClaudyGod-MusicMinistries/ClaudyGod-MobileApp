import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, TextInput, View } from 'react-native';
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
import { useDeviceClass } from '../../util/deviceClassConfig';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { useAppModal } from '../../context/AppModalContext';
import {
  fetchLiveSessionDetail,
  postLiveSessionMessage,
  type LiveSessionDetail,
  type LiveMessageKind,
} from '../../services/liveService';

function formatSessionMeta(session: LiveSessionDetail): string {
  if (session.status === 'live') return `${session.viewerCount || 0} watching now`;
  if (session.status === 'scheduled' && session.scheduledFor) return `Starts ${new Date(session.scheduledFor).toLocaleString()}`;
  if (session.endedAt) return `Replay saved ${new Date(session.endedAt).toLocaleString()}`;
  return 'Live session';
}

function StatusBadge({ status }: { status: string }) {
  const isLive = status === 'live';
  const isUpcoming = status === 'scheduled';
  const color = isLive ? '#EF4444' : isUpcoming ? '#F59E0B' : '#8B5CF6';
  const label = isLive ? 'Live now' : isUpcoming ? 'Upcoming' : 'Replay';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${color}14`, borderRadius: 999, borderWidth: 1, borderColor: `${color}30`, paddingHorizontal: 12, paddingVertical: 6 }}>
      {isLive ? <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} /> : null}
      <CustomText variant="caption" style={{ color, fontWeight: '700', letterSpacing: 0.5 }}>{label}</CustomText>
    </View>
  );
}

function MessageBubble({ message }: { message: LiveSessionDetail['messages'][0] }) {
  const theme = useAppTheme();
  const isSuggestion = message.kind === 'suggestion';
  const accentColor = isSuggestion ? '#F59E0B' : theme.colors.primary;
  return (
    <View style={{ borderRadius: 18, padding: 14, gap: 6, backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(17,10,31,0.03)', borderWidth: 1, borderColor: theme.colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: `${accentColor}18` }}>
            <CustomText variant="caption" style={{ color: accentColor, fontWeight: '800', fontSize: 11 }}>
              {message.author.displayName.charAt(0).toUpperCase()}
            </CustomText>
          </View>
          <CustomText variant="label" style={{ color: theme.colors.text }}>{message.author.displayName}</CustomText>
        </View>
        {isSuggestion ? (
          <View style={{ backgroundColor: `${accentColor}14`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <CustomText variant="caption" style={{ color: accentColor, fontSize: 10, fontWeight: '700' }}>IDEA</CustomText>
          </View>
        ) : null}
      </View>
      <CustomText variant="body" style={{ color: theme.colors.textSecondary, lineHeight: 20 }}>{message.message}</CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.textMuted, fontSize: 11 }}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </CustomText>
    </View>
  );
}

export default function LiveSessionScreen() {
  const theme = useAppTheme();
  const device = useDeviceClass();
  const { showModal } = useAppModal();
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const [session, setSession] = useState<LiveSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageKind, setMessageKind] = useState<LiveMessageKind>('comment');
  const [draftMessage, setDraftMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const activeMediaUrl = useMemo(() => session?.streamUrl || session?.playbackUrl, [session]);
  const coverImageUrl = session?.coverImageUrl || DEFAULT_CONTENT_IMAGE_URI;
  const isWideLayout = device.isDesktop || device.isTV;
  const videoHeight = device.isTV ? 480 : device.isLargeDesktop ? 400 : device.isDesktop ? 340 : 220;

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
    <View style={{ gap: 14 }}>
      <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg, gap: 14 }}>
        <View>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>Join the conversation</CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
            {session.status === 'live' ? 'Send a comment or idea to the live host.' : 'Leave a note on this replay.'}
          </CustomText>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['comment', 'suggestion'] as LiveMessageKind[]).map((kind) => {
            const active = messageKind === kind;
            return (
              <TVTouchable key={kind} onPress={() => setMessageKind(kind)} showFocusBorder={false} style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: active ? theme.colors.primary : (theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), borderWidth: 1, borderColor: active ? 'transparent' : theme.colors.border }}>
                <CustomText variant="caption" style={{ color: active ? '#FFFFFF' : theme.colors.textSecondary, fontWeight: active ? '700' : '500' }}>
                  {kind === 'comment' ? 'Comment' : 'Suggestion'}
                </CustomText>
              </TVTouchable>
            );
          })}
        </View>
        <TextInput value={draftMessage} onChangeText={setDraftMessage} placeholder={messageKind === 'comment' ? 'Share your comment...' : 'Share your suggestion...'} placeholderTextColor={theme.colors.textSecondary} multiline style={{ minHeight: 88, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, padding: 14, textAlignVertical: 'top', fontSize: 14 }} />
        <AppButton title={saving ? 'Sending...' : 'Send to live host'} fullWidth loading={saving} onPress={() => void submitMessage()} leftIcon={<MaterialIcons name="send" size={16} color={theme.colors.textInverse} />} />
      </SurfaceCard>

      <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>Audience feed</CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>{session.messageCount} message{session.messageCount === 1 ? '' : 's'}</CustomText>
        </View>
        {session.messages.length > 0 ? (
          <View style={{ gap: 8 }}>{session.messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}</View>
        ) : (
          <View style={{ padding: theme.spacing.lg, alignItems: 'center', gap: 10 }}>
            <MaterialIcons name="chat-bubble-outline" size={32} color={theme.colors.textMuted} />
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>No messages yet. Be the first to comment.</CustomText>
          </View>
        )}
      </SurfaceCard>
    </View>
  ) : null;

  const mediaPanel = session ? (
    <SurfaceCard tone="subtle" style={{ overflow: 'hidden', padding: 0 }}>
      {activeMediaUrl ? (
        <VideoPlayer title={session.title} sourceUri={activeMediaUrl} height={videoHeight} />
      ) : (
        <View style={{ height: videoHeight }}>
          <Image source={{ uri: coverImageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(7,5,12,0.6)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }} />
        </View>
      )}
      <View style={{ padding: theme.spacing.md, gap: 8 }}>
        <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>{session.description}</CustomText>
        {session.tags?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {session.tags.slice(0, isWideLayout ? 8 : 5).map((tag) => (
              <View key={tag} style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border }}>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>{tag}</CustomText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </SurfaceCard>
  ) : null;

  return (
    <TabScreenWrapper>
      <ScrollView style={{ flex: 1, backgroundColor: 'transparent' }} contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={theme.colors.primary} colors={[theme.colors.primary]} progressBackgroundColor={theme.colors.surface} />}>
        <Screen>
          <View style={{ paddingTop: theme.layout.sectionGap, gap: theme.spacing.lg }}>
            <FadeIn>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TVTouchable onPress={() => router.back()} showFocusBorder={false} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                  <MaterialIcons name="arrow-back" size={20} color={theme.colors.text} />
                </TVTouchable>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>{session?.title || 'Live Session'}</CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{session ? formatSessionMeta(session) : 'Loading...'}</CustomText>
                </View>
                {session ? <StatusBadge status={session.status} /> : null}
              </View>
            </FadeIn>

            {loading && !session ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <BrandLoader label="Opening live session" size="md" textColor={theme.colors.text} />
              </View>
            ) : null}

            {error ? (
              <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg, gap: 10 }}>
                <MaterialIcons name="error-outline" size={24} color={theme.colors.danger} />
                <CustomText variant="subtitle" style={{ color: theme.colors.text }}>Unable to open this session</CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>{error}</CustomText>
                <AppButton title="Try again" variant="secondary" onPress={() => void refresh()} />
              </SurfaceCard>
            ) : null}

            {session ? (
              isWideLayout ? (
                <FadeIn delay={60}>
                  <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
                    <View style={{ flex: 1.5, gap: 14 }}>{mediaPanel}</View>
                    <View style={{ flex: 1, gap: 14 }}>{chatPanel}</View>
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