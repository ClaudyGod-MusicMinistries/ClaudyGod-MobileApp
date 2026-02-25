import React from 'react';
import { Image, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useContentFeed } from '../../hooks/useContentFeed';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import type { FeedCardItem } from '../../services/contentService';

export default function VideosScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const featureHeight = isTV ? 300 : isTablet ? 260 : 220;
  const quickCardWidth = isTV ? 320 : isTablet ? 250 : 196;

  const { feed } = useContentFeed();

  const featured = feed.videos[0] ?? feed.live[0] ?? feed.featured;
  const quickVideos = feed.videos.slice(1, 10);
  const liveQueue = feed.live.slice(0, 8);

  const openPlayer = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    router.push('/(tabs)/PlaySection');
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 150 }}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                  Video Hub
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                  YouTube-style live + replay architecture.
                </CustomText>
              </View>

              <TVTouchable
                onPress={() => router.push('/(tabs)/search')}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                showFocusBorder={false}
              >
                <MaterialIcons name="search" size={20} color={theme.colors.text.primary} />
              </TVTouchable>
            </View>
          </FadeIn>

          {featured ? (
            <FadeIn delay={70}>
              <TVTouchable
                onPress={() => openPlayer(featured, 'videos_featured')}
                style={{
                  marginTop: 14,
                  borderRadius: 22,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                }}
                showFocusBorder={false}
              >
                <Image source={{ uri: featured.imageUrl }} style={{ width: '100%', height: featureHeight }} />
                <LinearGradient
                  colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.62)']}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 72, height: 96 }}
                />
                <View
                  style={{
                    position: 'absolute',
                    right: 14,
                    bottom: 86,
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(154,107,255,0.92)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="play-arrow" size={30} color="#FFFFFF" />
                </View>

                <View style={{ padding: 12 }}>
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                    {featured.title}
                  </CustomText>
                  <View
                    style={{
                      marginTop: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                      {featured.subtitle}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                      {featured.duration}
                    </CustomText>
                  </View>
                </View>
              </TVTouchable>
            </FadeIn>
          ) : null}

          <FadeIn delay={110}>
            <View style={{ marginTop: 16 }}>
              <SectionHeader title="Quick Videos" actionLabel={`${quickVideos.length} items`} />
              {quickVideos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never">
                  {quickVideos.map((item) => (
                    <TVTouchable
                      key={item.id}
                      onPress={() => openPlayer(item, 'videos_quick')}
                      style={{
                        width: quickCardWidth,
                        marginRight: 10,
                        borderRadius: 16,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      }}
                      showFocusBorder={false}
                    >
                      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 116 }} />
                      <View style={{ padding: 10 }}>
                        <CustomText variant="body" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                          {item.title}
                        </CustomText>
                        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                          {item.subtitle}
                        </CustomText>
                      </View>
                    </TVTouchable>
                  ))}
                </ScrollView>
              ) : (
                <EmptyHint text="No quick videos uploaded yet." />
              )}
            </View>
          </FadeIn>

          <FadeIn delay={140}>
            <View style={{ marginTop: 18 }}>
              <SectionHeader title="Live Queue" actionLabel={`${liveQueue.length} live`} />
              {liveQueue.length > 0 ? (
                <View style={{ gap: 9 }}>
                  {liveQueue.map((item) => (
                    <TVTouchable
                      key={item.id}
                      onPress={() => openPlayer(item, 'videos_live_queue')}
                      style={{
                        minHeight: 70,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(248,113,113,0.45)',
                        backgroundColor: theme.colors.surface,
                        padding: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                      showFocusBorder={false}
                    >
                      <Image source={{ uri: item.imageUrl }} style={{ width: 56, height: 56, borderRadius: 12 }} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                          {item.title}
                        </CustomText>
                        <CustomText variant="caption" style={{ color: '#ef9a9a', marginTop: 2 }}>
                          LIVE • {item.liveViewerCount ?? 0} watching
                        </CustomText>
                      </View>
                      <MaterialIcons name="chevron-right" size={22} color={theme.colors.text.secondary} />
                    </TVTouchable>
                  ))}
                </View>
              ) : (
                <EmptyHint text="No live sessions active now." />
              )}
            </View>
          </FadeIn>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function SectionHeader({ title, actionLabel }: { title: string; actionLabel: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
        {title}
      </CustomText>
      <CustomText variant="label" style={{ color: theme.colors.primary }}>
        {actionLabel}
      </CustomText>
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.surface,
      }}
    >
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
        {text}
      </CustomText>
    </View>
  );
}
