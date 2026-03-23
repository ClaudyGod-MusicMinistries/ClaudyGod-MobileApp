import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { useAppTheme } from '../../util/colorScheme';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import {
  fetchLiveSessionDetail,
  postLiveSessionMessage,
  type LiveSessionDetail,
  type LiveMessageKind,
} from '../../services/liveService';

function formatSessionMeta(session: LiveSessionDetail): string {
  if (session.status === 'live') {
    return `${session.viewerCount || 0} watching now`;
  }
  if (session.status === 'scheduled' && session.scheduledFor) {
    return `Starts ${new Date(session.scheduledFor).toLocaleString()}`;
  }
  if (session.endedAt) {
    return `Replay saved ${new Date(session.endedAt).toLocaleString()}`;
  }
  return 'Live session';
}

export default function LiveSessionScreen() {
  const theme = useAppTheme();
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
    if (!sessionId) {
      setError('Live session not found.');
      setLoading(false);
      return;
    }

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeMediaUrl = useMemo(() => session?.streamUrl || session?.playbackUrl, [session]);
  const coverImageUrl = session?.coverImageUrl || DEFAULT_CONTENT_IMAGE_URI;

  const submitMessage = async () => {
    if (!sessionId) {
      return;
    }
    if (!draftMessage.trim()) {
      Alert.alert('Add a message', 'Enter a comment or suggestion before sending.');
      return;
    }

    setSaving(true);
    try {
      const created = await postLiveSessionMessage(sessionId, {
        kind: messageKind,
        message: draftMessage.trim(),
      });
      setSession((current) =>
        current
          ? {
              ...current,
              messageCount: current.messageCount + 1,
              messages: [created, ...current.messages],
            }
          : current,
      );
      setDraftMessage('');
    } catch (err) {
      Alert.alert('Unable to send', err instanceof Error ? err.message : 'Sign in to join the live conversation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.sectionGap, gap: theme.spacing.lg }}>
            <FadeIn>
              <View
                style={{
                  borderRadius: 28,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <LinearGradient
                  colors={['rgba(17,24,39,0.08)', 'rgba(17,24,39,0.02)']}
                  style={{ padding: theme.spacing.lg }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TVTouchable
                      onPress={() => router.back()}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceAlt,
                      }}
                      showFocusBorder={false}
                    >
                      <MaterialIcons name="arrow-back" size={20} color={theme.colors.text.primary} />
                    </TVTouchable>

                    <View
                      style={{
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor:
                          session?.status === 'live' ? 'rgba(220,38,38,0.14)' : 'rgba(109,40,217,0.09)',
                        borderWidth: 1,
                        borderColor:
                          session?.status === 'live' ? 'rgba(220,38,38,0.24)' : 'rgba(109,40,217,0.16)',
                      }}
                    >
                      <CustomText variant="caption" style={{ color: theme.colors.text.primary }}>
                        {session?.status === 'live' ? 'Live Now' : session?.status === 'scheduled' ? 'Upcoming' : 'Replay'}
                      </CustomText>
                    </View>
                  </View>

                  <View style={{ marginTop: theme.spacing.lg }}>
                    <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                      {session?.title || 'Live Session'}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                      {session ? formatSessionMeta(session) : 'Preparing live session'}
                    </CustomText>
                  </View>
                </LinearGradient>
              </View>
            </FadeIn>

            {loading && !session ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : null}

            {error ? (
              <View
                style={{
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.lg,
                }}
              >
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Unable to open this live session
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 8 }}>
                  {error}
                </CustomText>
              </View>
            ) : null}

            {session ? (
              <>
                <FadeIn delay={60}>
                  <View
                    style={{
                      borderRadius: 28,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    }}
                  >
                    {activeMediaUrl ? (
                      <VideoPlayer title={session.title} sourceUri={activeMediaUrl} height={260} />
                    ) : (
                      <Image
                        source={{ uri: coverImageUrl }}
                        style={{ width: '100%', height: 260, backgroundColor: theme.colors.surfaceAlt }}
                        resizeMode="cover"
                      />
                    )}
                    <View style={{ padding: theme.spacing.lg, gap: 10 }}>
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                        {session.description}
                      </CustomText>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(session.tags || []).slice(0, 6).map((tag) => (
                          <View
                            key={`live-tag-${tag}`}
                            style={{
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              backgroundColor: theme.colors.surfaceAlt,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                            }}
                          >
                            <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                              {tag}
                            </CustomText>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </FadeIn>

                <FadeIn delay={90}>
                  <View
                    style={{
                      borderRadius: 28,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      padding: theme.spacing.lg,
                      gap: 14,
                    }}
                  >
                    <View>
                      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                        Join the live conversation
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                        Send a comment or suggestion while the live stream is active.
                      </CustomText>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {(['comment', 'suggestion'] as LiveMessageKind[]).map((kind) => {
                        const active = messageKind === kind;
                        return (
                          <TVTouchable
                            key={`live-kind-${kind}`}
                            onPress={() => setMessageKind(kind)}
                            style={{
                              borderRadius: 999,
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                              borderWidth: 1,
                              borderColor: active ? theme.colors.primary : theme.colors.border,
                            }}
                            showFocusBorder={false}
                          >
                            <CustomText
                              variant="caption"
                              style={{ color: active ? '#FFFFFF' : theme.colors.text.primary }}
                            >
                              {kind === 'comment' ? 'Comment' : 'Suggestion'}
                            </CustomText>
                          </TVTouchable>
                        );
                      })}
                    </View>

                    <TextInput
                      value={draftMessage}
                      onChangeText={setDraftMessage}
                      placeholder={messageKind === 'comment' ? 'Share your comment' : 'Share your suggestion'}
                      placeholderTextColor={theme.colors.text.secondary}
                      multiline
                      style={{
                        minHeight: 120,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceAlt,
                        color: theme.colors.text.primary,
                        padding: 16,
                        textAlignVertical: 'top',
                      }}
                    />

                    <TVTouchable
                      onPress={() => void submitMessage()}
                      style={{
                        borderRadius: 18,
                        paddingVertical: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.primary,
                        opacity: saving ? 0.72 : 1,
                      }}
                      disabled={saving}
                      showFocusBorder={false}
                    >
                      <CustomText variant="subtitle" style={{ color: '#FFFFFF' }}>
                        {saving ? 'Sending...' : 'Send to live host'}
                      </CustomText>
                    </TVTouchable>
                  </View>
                </FadeIn>

                <FadeIn delay={120}>
                  <View
                    style={{
                      borderRadius: 28,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      padding: theme.spacing.lg,
                      gap: 14,
                    }}
                  >
                    <View>
                      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                        Live audience feed
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                        {session.messageCount} viewer message{session.messageCount === 1 ? '' : 's'}
                      </CustomText>
                    </View>

                    {(session.messages || []).length ? (
                      session.messages.map((message) => (
                        <View
                          key={message.id}
                          style={{
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.surfaceAlt,
                            padding: 14,
                            gap: 8,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                              {message.author.displayName}
                            </CustomText>
                            <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                              {message.kind === 'comment' ? 'Comment' : 'Suggestion'}
                            </CustomText>
                          </View>
                          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                            {message.message}
                          </CustomText>
                          <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                            {new Date(message.createdAt).toLocaleString()}
                          </CustomText>
                        </View>
                      ))
                    ) : (
                      <View
                        style={{
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surfaceAlt,
                          padding: 18,
                        }}
                      >
                        <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                          No viewer messages yet. Comments and suggestions will appear here during the live session.
                        </CustomText>
                      </View>
                    )}
                  </View>
                </FadeIn>
              </>
            ) : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
