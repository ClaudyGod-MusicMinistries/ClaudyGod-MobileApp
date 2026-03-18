import React from 'react';
import { Image, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { SectionHeader as AppSectionHeader } from '../../components/ui/SectionHeader';
import { useContentFeed } from '../../hooks/useContentFeed';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import type { FeedCardItem } from '../../services/contentService';
import { buildPlayerRoute } from '../../util/playerRoute';

export default function VideosScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const isDark = theme.scheme === 'dark';
  const featureHeight = isTV ? 300 : isTablet ? 260 : 220;
  const quickCardWidth = isTV ? 320 : isTablet ? 250 : 210;

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
    router.push(buildPlayerRoute(item));
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        stickyHeaderIndices={[0]}
      >
        <View
          style={{
            backgroundColor: isDark ? '#06040D' : theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
          }}
        >
          <LinearGradient
            colors={[isDark ? 'rgba(154,107,255,0.06)' : 'rgba(109,40,217,0.08)', 'rgba(0,0,0,0)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none' }}
          />
          <Screen>
            <FadeIn>
              <View
                style={{
                  paddingTop: theme.layout.headerVerticalPadding,
                  paddingBottom: theme.spacing.sm,
                }}
              >
                <BrandedHeaderCard
                  title="Videos"
                  subtitle="Featured streams, quick replays and live sessions."
                  actions={[
                    { icon: 'search', onPress: () => router.push('/(tabs)/search'), accessibilityLabel: 'Search' },
                    { icon: 'person-outline', onPress: () => router.push('/profile'), accessibilityLabel: 'Profile' },
                  ]}
                  chips={[
                    { label: 'Featured' },
                    { label: 'Quick Videos' },
                    { label: 'Live Queue' },
                  ]}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: theme.layout.sectionGap }}>
          {featured ? (
            <FadeIn delay={70}>
              <TVTouchable
                onPress={() => openPlayer(featured, 'videos_featured')}
                style={{
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
            <View style={{ marginTop: theme.layout.sectionGapLarge }}>
              <AppSectionHeader title="Quick Videos" actionLabel={`${quickVideos.length} items`} />
              {quickVideos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never">
                  {quickVideos.map((item) => (
                    <TVTouchable
                      key={item.id}
                      onPress={() => openPlayer(item, 'videos_quick')}
                      style={{
                        width: quickCardWidth,
                        marginRight: theme.spacing.md,
                        borderRadius: theme.radius.lg,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      }}
                      showFocusBorder={false}
                    >
                      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 124 }} />
                      <View style={{ padding: theme.spacing.md }}>
                        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                          {item.title}
                        </CustomText>
                        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
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
            <View style={{ marginTop: theme.layout.sectionGapLarge }}>
              <AppSectionHeader title="Live Queue" actionLabel={`${liveQueue.length} live`} />
              {liveQueue.length > 0 ? (
                <View style={{ gap: theme.spacing.sm }}>
                  {liveQueue.map((item) => (
                    <TVTouchable
                      key={item.id}
                      onPress={() => openPlayer(item, 'videos_live_queue')}
                      style={{
                        minHeight: 76,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: 'rgba(248,113,113,0.45)',
                        backgroundColor: theme.colors.surface,
                        padding: 10,
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
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function EmptyHint({ text }: { text: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
      }}
    >
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
        {text}
      </CustomText>
    </View>
  );
}
