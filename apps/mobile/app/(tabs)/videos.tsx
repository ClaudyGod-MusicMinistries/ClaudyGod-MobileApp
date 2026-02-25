import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { buildPlayerRoute } from '../../util/playerRoute';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';

const videoFilters = ['All', 'Live', 'Music', 'Word', 'Worship'];

export default function VideosScreen() {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    stickyBg: isDark ? '#06040D' : theme.colors.background,
    stickyBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
    stickyGlow: isDark ? 'rgba(154,107,255,0.06)' : 'rgba(109,40,217,0.08)',
    heroBorder: isDark ? 'rgba(255,255,255,0.09)' : theme.colors.border,
    heroBg: isDark ? 'rgba(12,9,20,0.88)' : theme.colors.surface,
    heroFallback: isDark
      ? (['#21113E', '#100B1E', '#0A0712'] as const)
      : (['#EEE6FF', '#DDD1FF', '#CDBBFF'] as const),
    heroOverlay: isDark
      ? (['rgba(0,0,0,0)', 'rgba(6,4,13,0.9)'] as const)
      : (['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)'] as const),
    liveLabel: isDark ? '#FCA5A5' : '#B91C1C',
    heroMuted: isDark ? 'rgba(224,214,247,0.9)' : theme.colors.text.secondary,
    bannerBorder: isDark ? 'rgba(216,194,255,0.12)' : 'rgba(109,40,217,0.12)',
    bannerBg: isDark ? 'rgba(154,107,255,0.06)' : 'rgba(109,40,217,0.04)',
    bannerIconBg: isDark ? 'rgba(154,107,255,0.16)' : 'rgba(109,40,217,0.1)',
  } as const;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const compact = width < 390;
  const columns = isTV ? 3 : isTablet ? 2 : 1;
  const [filter, setFilter] = useState('All');

  const { feed, loading, refresh, error } = useContentFeed();

  const videos = useMemo(() => {
    const base = [...feed.live, ...feed.videos];
    if (filter === 'Live') return feed.live;
    if (filter === 'Music') return base.filter((item) => /music|worship/i.test(`${item.title} ${item.subtitle}`));
    if (filter === 'Word') return base.filter((item) => /message|truth|word|sermon/i.test(`${item.title} ${item.description}`));
    if (filter === 'Worship') return base.filter((item) => /worship|praise/i.test(`${item.title} ${item.description}`));
    return base;
  }, [feed.live, feed.videos, filter]);

  const featuredVideo = videos[0] ?? feed.featured ?? null;

  const openVideo = async (item: FeedCardItem, source = 'videos_grid') => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 148 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        stickyHeaderIndices={[0]}
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
        <View
          style={{
            backgroundColor: ui.stickyBg,
            borderBottomWidth: 1,
            borderBottomColor: ui.stickyBorder,
          }}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[ui.stickyGlow, 'rgba(0,0,0,0)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <Screen>
            <FadeIn>
              <View style={{ paddingTop: theme.spacing.lg, paddingBottom: 10 }}>
                <VideosHeader
                  filter={filter}
                  onChangeFilter={setFilter}
                  onOpenHome={() => router.push('/(tabs)/home')}
                  onOpenProfile={() => router.push('/profile')}
                  onOpenMenu={() => router.push('/(tabs)/Settings')}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: 14 }}>

          <FadeIn delay={90}>
            <View
              style={{
                borderRadius: 22,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: ui.heroBorder,
                backgroundColor: ui.heroBg,
              }}
            >
              <View style={{ height: isTV ? 260 : isTablet ? 240 : compact ? 208 : 224 }}>
                {featuredVideo?.imageUrl ? (
                  <Image source={{ uri: featuredVideo.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={ui.heroFallback} style={{ width: '100%', height: '100%' }} />
                )}
                <LinearGradient colors={ui.heroOverlay} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              </View>
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 }} />
                    <CustomText variant="caption" style={{ color: ui.liveLabel }}>
                      LIVE / FEATURED
                    </CustomText>
                  </View>
                  <CustomText variant="caption" style={{ color: ui.heroMuted }}>
                    {feed.live.length} live room{feed.live.length === 1 ? '' : 's'}
                  </CustomText>
                </View>
                <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginTop: 6 }} numberOfLines={2}>
                  {featuredVideo?.title ?? 'Featured video slot'}
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }} numberOfLines={2}>
                  {featuredVideo?.description ?? 'Latest videos and live replays will display here after content sync.'}
                </CustomText>
                <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
                  <InlinePillButton icon="play-arrow" label="Watch" onPress={() => (featuredVideo ? openVideo(featuredVideo, 'videos_featured') : router.push('/(tabs)/PlaySection'))} />
                  <InlinePillButton
                    icon="notifications-active"
                    label="Notify"
                    onPress={async () => {
                      if (!featuredVideo) return;
                      await subscribeToLiveAlerts(featuredVideo.id);
                    }}
                  />
                </View>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={130}>
            <View
              style={{
                marginTop: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: ui.bannerBorder,
                backgroundColor: ui.bannerBg,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.bannerIconBg, marginRight: 10 }}>
                <MaterialIcons name="campaign" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                  Ad placement section
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
                  Sponsored video campaigns can render between rows without breaking the content layout.
                </CustomText>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={180}>
            <View style={{ marginTop: 18 }}>
              <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                Video Feed
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
                Larger cards for live streams, replays and channel drops.
              </CustomText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: 10 }}>
                {videos.length ? (
                  videos.map((item) => (
                    <View key={item.id} style={{ width: `${100 / columns}%`, paddingHorizontal: 6, marginBottom: 12 }}>
                      <VideoTile item={item} onPress={() => openVideo(item)} />
                    </View>
                  ))
                ) : (
                  <View style={{ width: '100%' }}>
                    <EmptyVideosState />
                  </View>
                )}
              </View>
            </View>
          </FadeIn>

          {error ? (
            <View style={{ marginTop: 6 }}>
              <CustomText variant="caption" style={{ color: theme.colors.danger }}>
                Feed error: {error}
              </CustomText>
            </View>
          ) : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function VideosHeader({
  filter,
  onChangeFilter,
  onOpenHome,
  onOpenProfile,
  onOpenMenu,
}: {
  filter: string;
  onChangeFilter: (_next: string) => void;
  onOpenHome: () => void;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
}) {
  return (
    <BrandedHeaderCard
      title="Videos"
      actions={[
        { icon: 'home', onPress: onOpenHome, accessibilityLabel: 'Open home' },
        { icon: 'person-outline', onPress: onOpenProfile, accessibilityLabel: 'Open profile' },
        { icon: 'more-vert', onPress: onOpenMenu, accessibilityLabel: 'More options' },
      ]}
      chips={videoFilters.map((label) => ({
        label,
        active: label === filter,
        onPress: () => onChangeFilter(label),
      }))}
      showEyebrow={false}
    />
  );
}

function VideoTile({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    cardBg: isDark ? 'rgba(12,9,20,0.86)' : theme.colors.surface,
    overlay: isDark
      ? (['rgba(0,0,0,0)', 'rgba(6,4,13,0.86)'] as const)
      : (['rgba(255,255,255,0)', 'rgba(255,255,255,0.86)'] as const),
    livePillBg: isDark ? 'rgba(127,29,29,0.78)' : 'rgba(220,38,38,0.9)',
    livePillText: isDark ? '#FEE2E2' : '#FFFFFF',
    durationBg: isDark ? 'rgba(10,8,17,0.76)' : 'rgba(255,255,255,0.9)',
    durationBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,33,0.08)',
    durationText: isDark ? '#F8F7FC' : theme.colors.text.primary,
    title: theme.colors.text.primary,
    subtitle: theme.colors.text.secondary,
    liveCount: isDark ? '#FCA5A5' : '#B91C1C',
  } as const;
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: ui.cardBorder,
        backgroundColor: ui.cardBg,
      }}
      showFocusBorder={false}
    >
      <View style={{ aspectRatio: 16 / 10 }}>
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <LinearGradient colors={ui.overlay} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {item.isLive ? (
          <View style={{ position: 'absolute', top: 8, left: 8, borderRadius: 999, backgroundColor: ui.livePillBg, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 5 }} />
            <CustomText variant="caption" style={{ color: ui.livePillText }}>
              LIVE
            </CustomText>
          </View>
        ) : null}
        <View style={{ position: 'absolute', bottom: 8, right: 8, borderRadius: 999, backgroundColor: ui.durationBg, borderWidth: 1, borderColor: ui.durationBorder, paddingHorizontal: 8, paddingVertical: 4 }}>
          <CustomText variant="caption" style={{ color: ui.durationText }}>
            {item.duration || '--:--'}
          </CustomText>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <CustomText variant="label" style={{ color: ui.title }} numberOfLines={2}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: ui.subtitle, marginTop: 3 }} numberOfLines={1}>
          {item.subtitle}
        </CustomText>
        {item.liveViewerCount ? (
          <CustomText variant="caption" style={{ color: ui.liveCount, marginTop: 4 }}>
            {item.liveViewerCount} watching
          </CustomText>
        ) : null}
      </View>
    </TVTouchable>
  );
}

function InlinePillButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    border: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(20,16,33,0.08)',
    bg: isDark ? 'rgba(255,255,255,0.05)' : theme.colors.surface,
    icon: isDark ? '#EFE7FF' : theme.colors.primary,
    text: isDark ? '#EFE7FF' : theme.colors.text.primary,
  } as const;
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: ui.border,
        backgroundColor: ui.bg,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={16} color={ui.icon} />
      <CustomText variant="caption" style={{ color: ui.text, marginLeft: 5 }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

function EmptyVideosState() {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : theme.colors.border,
        backgroundColor: isDark ? 'rgba(12,9,20,0.76)' : theme.colors.surface,
        padding: 14,
      }}
    >
      <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
        No video content synced yet
      </CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
        Once your YouTube sync or admin publishing flow runs, videos and live replays will render here automatically.
      </CustomText>
    </View>
  );
}
