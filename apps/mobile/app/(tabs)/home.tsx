import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { useWordOfDay } from '../../hooks/useWordOfDay';
import type { FeedCardItem, FeedBundle } from '../../services/contentService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';

const ministrySections: { title: string; kind: 'video' | 'audio' | 'message' | 'worship' | 'playlist' }[] = [
  { title: 'ClaudyGod Music', kind: 'video' },
  { title: 'ClaudyGod Nuggets of Truth', kind: 'message' },
  { title: 'ClaudyGod Worship Hour', kind: 'worship' },
  { title: 'ClaudyGod Messages', kind: 'message' },
  { title: 'ClaudyGod Music (Audio)', kind: 'audio' },
];

const topRailChips = ['For You', 'Music', 'Videos', 'Live', 'Word'];

const WORD_FOR_TODAY_FALLBACK = {
  title: 'Word for Today',
  passage: 'Psalm 119:105',
  verse:
    'Your word is a lamp to my feet and a light to my path.',
  reflection:
    'Start the day with direction and peace. Share this verse with your community and return tomorrow for a new passage.',
};

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    stickyBg: isDark ? '#06040D' : theme.colors.background,
    stickyBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
    stickyGlowStart: isDark ? 'rgba(154,107,255,0.06)' : 'rgba(109,40,217,0.08)',
    wordBg: isDark ? 'rgba(12,9,20,0.9)' : '#FFFFFF',
    wordBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    wordMuted: isDark ? 'rgba(194,185,220,0.9)' : 'rgba(96,87,124,0.9)',
    wordSubtle: isDark ? 'rgba(176,167,202,0.9)' : 'rgba(108,99,134,0.92)',
    wordAccentBg: isDark ? 'rgba(154,107,255,0.14)' : 'rgba(109,40,217,0.08)',
    wordAccentBorder: isDark ? 'rgba(216,194,255,0.22)' : 'rgba(109,40,217,0.14)',
    albumWrapBg: isDark ? 'rgba(12,9,20,0.72)' : theme.colors.surface,
    albumWrapBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
  } as const;
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const compact = width < 380;
  const railCardWidth = isTV ? 260 : isTablet ? 220 : compact ? 150 : 166;
  const albumDashboardViewportHeight = isTV ? 600 : isTablet ? 460 : 356;
  const [activeFilter, setActiveFilter] = useState('For You');

  const { feed, loading, error, refresh } = useContentFeed();
  const { word } = useWordOfDay();
  const wordForToday = word
    ? {
        title: word.title || 'Word for Today',
        passage: word.passage,
        verse: word.verse,
        reflection: word.reflection,
      }
    : WORD_FOR_TODAY_FALLBACK;

  const featured = useMemo(() => feed.featured ?? firstAvailable(feed), [feed]);
  const liveItems = useMemo(() => feed.live.slice(0, isTablet || isTV ? 6 : 4), [feed.live, isTablet, isTV]);
  const popularTracks = useMemo(() => (feed.music.length ? feed.music : []).slice(0, 10), [feed.music]);
  const albumGrid = useMemo(() => (feed.playlists.length ? feed.playlists : feed.videos).slice(0, 8), [feed.playlists, feed.videos]);
  const recentItems = useMemo(() => feed.recent.slice(0, 8), [feed.recent]);
  const ministryRails = useMemo(
    () =>
      ministrySections
        .map((section, index) => {
          const items = deriveMinistryItems(feed, section).slice(
            index % 2 === 0 ? 0 : 1,
            (index % 2 === 0 ? 0 : 1) + 8,
          );
          return { section, items };
        })
        .filter((entry) => entry.items.length > 0),
    [feed],
  );

  const onOpenItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    router.push(buildPlayerRoute(item));
  };

  const onSubscribeLive = async (item: FeedCardItem) => {
    await subscribeToLiveAlerts(item.id);
    Alert.alert('Live alerts enabled', `You will be notified when ${item.title} goes live.`);
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: 148 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
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
            colors={[ui.stickyGlowStart, 'rgba(0,0,0,0)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <Screen>
            <FadeIn>
              <View style={{ paddingTop: theme.spacing.lg, paddingBottom: 10 }}>
                <HomeHeader
                  activeFilter={activeFilter}
                  onChangeFilter={setActiveFilter}
                  onOpenVideos={() => router.push('/(tabs)/videos')}
                  onOpenProfile={() => router.push('/profile')}
                  onOpenMenu={() => router.push('/(tabs)/Settings')}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: 14 }}>

          <FadeIn delay={70}>
            <HeroDropCard
              item={featured}
              loading={loading}
              onPressPrimary={() => (featured ? onOpenItem(featured, 'home_hero') : router.push('/(tabs)/videos'))}
              onPressSecondary={() => router.push('/(tabs)/videos')}
              isTablet={isTablet || isTV}
            />
          </FadeIn>

          <FadeIn delay={95}>
            <SectionBlock title={wordForToday.title} subtitle="A daily scripture passage for prayer, direction and encouragement">
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: ui.wordBorder,
                  backgroundColor: ui.wordBg,
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: ui.wordAccentBg,
                        borderWidth: 1,
                        borderColor: ui.wordAccentBorder,
                        marginRight: 10,
                      }}
                    >
                      <MaterialIcons name="menu-book" size={18} color={theme.colors.primary} />
                    </View>
                    <View>
                        <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                        {wordForToday.passage}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: ui.wordMuted, marginTop: 2 }}>
                        Daily Bible passage
                      </CustomText>
                    </View>
                  </View>
                  <TVTouchable
                    onPress={() => undefined}
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: ui.wordAccentBorder,
                      backgroundColor: ui.wordAccentBg,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="caption" style={{ color: theme.colors.primary }}>
                      Share
                    </CustomText>
                  </TVTouchable>
                </View>

                <CustomText
                  variant="subtitle"
                  style={{ color: theme.colors.text.primary, marginTop: 12, lineHeight: 20 }}
                >
                  {wordForToday.verse}
                </CustomText>
                <CustomText variant="caption" style={{ color: ui.wordSubtle, marginTop: 8 }}>
                  {wordForToday.reflection}
                </CustomText>
              </View>
            </SectionBlock>
          </FadeIn>

          <FadeIn delay={120}>
            <SectionBlock title="Live Now" subtitle="Live sessions with viewer count and notify action">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                contentContainerStyle={{ paddingRight: 8 }}
              >
                {liveItems.length ? (
                  liveItems.map((item) => (
                    <LiveCard
                      key={item.id}
                      item={item}
                      width={railCardWidth}
                      onOpen={() => onOpenItem(item, 'home_live')}
                      onNotify={() => onSubscribeLive(item)}
                    />
                  ))
                ) : (
                  <EmptyRailCard
                    width={Math.max(railCardWidth, 220)}
                    title="No live stream active"
                    subtitle="Live sessions will appear here with viewer count and notify controls."
                    icon="live-tv"
                  />
                )}
              </ScrollView>
            </SectionBlock>
          </FadeIn>
          <FadeIn delay={160}>
            <SectionBlock title="Popular Tracks" subtitle="Latest worship audio and music uploads">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                contentContainerStyle={{ paddingRight: 8 }}
              >
                {popularTracks.length ? (
                  popularTracks.map((item) => (
                    <PosterTile
                      key={item.id}
                      item={item}
                      width={railCardWidth}
                      onPress={() => onOpenItem(item, 'home_popular_tracks')}
                    />
                  ))
                ) : (
                  <EmptyRailCard width={railCardWidth} title="No tracks yet" subtitle="New audio releases will appear here." icon="music-note" />
                )}
              </ScrollView>
            </SectionBlock>
          </FadeIn>

          <FadeIn delay={200}>
            <SectionBlock title="Albums & Playlists" subtitle="Curated collections and playlists">
              <CollectionsDashboard
                items={albumGrid}
                viewportHeight={albumDashboardViewportHeight}
                onOpenItem={(item) => onOpenItem(item, 'home_albums_dashboard')}
              />
            </SectionBlock>
          </FadeIn>

          <FadeIn delay={240}>
            <SectionBlock title="Recently Played" subtitle="Last plays and quick resume list">
              <View style={{ gap: 8 }}>
                {recentItems.length ? (
                  recentItems.map((item) => (
                    <RecentRow key={item.id} item={item} onPress={() => onOpenItem(item, 'home_recent')} />
                  ))
                ) : (
                  <EmptyListRow />
                )}
              </View>
            </SectionBlock>
          </FadeIn>

          {ministryRails.map(({ section, items }, index) => {
            return (
              <FadeIn key={section.title} delay={280 + index * 35}>
                <SectionBlock title={section.title} subtitle={sectionSubtitle(section.kind)}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    contentContainerStyle={{ paddingRight: 8 }}
                  >
                    {items.map((item) => (
                      <PosterTile
                        key={`${section.title}-${item.id}`}
                        item={item}
                        width={railCardWidth}
                        onPress={() => onOpenItem(item, 'home_ministry_section')}
                      />
                    ))}
                  </ScrollView>
                </SectionBlock>
              </FadeIn>
            );
          })}

          {error ? (
            <View style={{ marginTop: 12 }}>
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

function HomeHeader({
  activeFilter,
  onChangeFilter,
  onOpenVideos,
  onOpenProfile,
  onOpenMenu,
}: {
  activeFilter: string;
  onChangeFilter: (_value: string) => void;
  onOpenVideos: () => void;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
}) {
  return (
    <BrandedHeaderCard
      title="Home"
      actions={[
        { icon: 'ondemand-video', onPress: onOpenVideos, accessibilityLabel: 'Open videos' },
        { icon: 'person-outline', onPress: onOpenProfile, accessibilityLabel: 'Open profile' },
        { icon: 'more-vert', onPress: onOpenMenu, accessibilityLabel: 'More options' },
      ]}
      chips={topRailChips.map((chip) => ({
        label: chip,
        active: chip === activeFilter,
        onPress: () => onChangeFilter(chip),
      }))}
      showEyebrow={false}
    />
  );
}

function HeroDropCard({
  item,
  loading,
  onPressPrimary,
  onPressSecondary,
  isTablet,
}: {
  item: FeedCardItem | null;
  loading: boolean;
  onPressPrimary: () => void;
  onPressSecondary: () => void;
  isTablet: boolean;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    cardBorder: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border,
    cardBg: isDark ? 'rgba(12,9,20,0.88)' : theme.colors.surface,
    fallbackGradient: isDark
      ? (['#21113E', '#100B1E', '#0A0712'] as const)
      : (['#EDE5FF', '#DCCEFF', '#CBB8FF'] as const),
    imageOverlay: isDark
      ? (['rgba(6,4,13,0.15)', 'rgba(6,4,13,0.84)', '#06040D'] as const)
      : (['rgba(255,255,255,0.08)', 'rgba(244,241,250,0.46)', 'rgba(244,241,250,0.96)'] as const),
    badgeBg: item?.isLive ? (isDark ? 'rgba(239,68,68,0.18)' : 'rgba(220,38,38,0.09)') : isDark ? 'rgba(154,107,255,0.18)' : 'rgba(109,40,217,0.08)',
    badgeBorder: item?.isLive ? (isDark ? 'rgba(248,113,113,0.32)' : 'rgba(220,38,38,0.16)') : isDark ? 'rgba(216,194,255,0.28)' : 'rgba(109,40,217,0.14)',
    badgeText: item?.isLive ? (isDark ? '#FECACA' : '#991B1B') : isDark ? '#EDE3FF' : '#4C1D95',
    iconBtnBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)',
    iconBtnBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,16,33,0.08)',
    iconBtnIcon: isDark ? '#F5EEFF' : '#3F2A76',
    title: isDark ? '#F8F7FC' : theme.colors.text.primary,
    subtitle: isDark ? 'rgba(217,210,236,0.92)' : theme.colors.text.secondary,
    primaryBtnBg: isDark ? 'rgba(255,255,255,0.12)' : theme.colors.primary,
    primaryBtnBorder: isDark ? 'rgba(255,255,255,0.16)' : theme.colors.primary,
    primaryBtnText: isDark ? '#FFFFFF' : theme.colors.text.inverse,
    primaryBtnIconBg: isDark ? 'rgba(154,107,255,0.34)' : 'rgba(255,255,255,0.22)',
    secondaryBtnBg: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surface,
    secondaryBtnBorder: isDark ? 'rgba(255,255,255,0.12)' : theme.colors.border,
    secondaryBtnText: isDark ? '#E6DBFF' : theme.colors.text.primary,
  } as const;
  const title = item?.title ?? (loading ? 'Loading featured content...' : 'Featured channel will appear here');
  const subtitle =
    item?.description ??
    (loading
      ? 'Preparing your feed...'
      : 'Featured content will appear here as soon as new music, videos or live sessions are available.');

  return (
    <TVTouchable
      onPress={onPressPrimary}
      style={{
        marginTop: 0,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: ui.cardBorder,
        backgroundColor: ui.cardBg,
      }}
      showFocusBorder={false}
    >
      <View style={{ height: 280 }}>
        {item?.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={ui.fallbackGradient}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
        )}

        <LinearGradient
          colors={ui.imageOverlay}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />

        <View style={{ flex: 1, justifyContent: 'space-between', padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View
              style={{
                alignSelf: 'flex-start',
                borderRadius: 999,
                backgroundColor: ui.badgeBg,
                borderWidth: 1,
                borderColor: ui.badgeBorder,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <CustomText variant="caption" style={{ color: ui.badgeText }}>
                {item?.isLive ? 'LIVE FEATURED' : 'HERO DROP'}
              </CustomText>
            </View>
            <TVTouchable
              onPress={onPressSecondary}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: ui.iconBtnBg,
                borderWidth: 1,
                borderColor: ui.iconBtnBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              showFocusBorder={false}
            >
              <MaterialIcons name="queue-play-next" size={20} color={ui.iconBtnIcon} />
            </TVTouchable>
          </View>

          <View>
            <CustomText variant="display" style={{ color: ui.title, fontSize: isTablet ? 22 : 19, lineHeight: isTablet ? 28 : 24 }} numberOfLines={2}>
              {title}
            </CustomText>
            <CustomText variant="body" style={{ color: ui.subtitle, marginTop: 8 }} numberOfLines={3}>
              {subtitle}
            </CustomText>

            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TVTouchable
                onPress={onPressPrimary}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: ui.primaryBtnBg,
                  borderWidth: 1,
                  borderColor: ui.primaryBtnBorder,
                }}
                showFocusBorder={false}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: ui.primaryBtnIconBg,
                    marginRight: 8,
                  }}
                >
                  <MaterialIcons name="play-arrow" size={18} color={ui.primaryBtnText} />
                </View>
                <CustomText variant="label" style={{ color: ui.primaryBtnText }}>
                  Play
                </CustomText>
              </TVTouchable>
              <TVTouchable
                onPress={onPressSecondary}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: ui.secondaryBtnBg,
                  borderWidth: 1,
                  borderColor: ui.secondaryBtnBorder,
                }}
                showFocusBorder={false}
              >
                <CustomText variant="label" style={{ color: ui.secondaryBtnText }}>
                  View Videos
                </CustomText>
              </TVTouchable>
            </View>
          </View>
        </View>
      </View>
    </TVTouchable>
  );
}

function SectionBlock({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';

  return (
    <View style={{ marginTop: 18 }}>
      <View style={{ paddingHorizontal: 2, marginBottom: 10 }}>
        <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
          {title}
        </CustomText>
        <CustomText
          variant="caption"
          style={{ color: isDark ? 'rgba(190,182,213,0.88)' : 'rgba(108,99,134,0.9)', marginTop: 3 }}
        >
          {subtitle}
        </CustomText>
      </View>
      {children}
    </View>
  );
}

function PosterTile({ item, width, onPress }: { item: FeedCardItem; width: number; onPress: () => void }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    cardBg: isDark ? 'rgba(16,11,26,0.9)' : theme.colors.surface,
    fade: isDark
      ? (['rgba(10,8,17,0)', 'rgba(10,8,17,0.78)'] as const)
      : (['rgba(255,255,255,0)', 'rgba(255,255,255,0.78)'] as const),
    title: theme.colors.text.primary,
    subtitle: theme.colors.text.secondary,
    meta: isDark ? 'rgba(178,169,202,0.88)' : 'rgba(108,99,134,0.9)',
    liveMeta: isDark ? '#FCA5A5' : '#B91C1C',
  } as const;
  return (
    <TVTouchable
      onPress={onPress}
      style={{ width, marginRight: 12 }}
      showFocusBorder={false}
    >
      <View
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: ui.cardBorder,
          backgroundColor: ui.cardBg,
        }}
      >
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 118 }} resizeMode="cover" />
        <LinearGradient
          colors={ui.fade}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 48, height: 50 }}
          pointerEvents="none"
        />
        <View style={{ padding: 10 }}>
          <CustomText variant="label" style={{ color: ui.title }} numberOfLines={1}>
            {item.title}
          </CustomText>
          <CustomText variant="caption" style={{ color: ui.subtitle, marginTop: 3 }} numberOfLines={1}>
            {item.subtitle}
          </CustomText>
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CustomText variant="caption" style={{ color: ui.meta }}>
              {item.duration || '--:--'}
            </CustomText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.isLive ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 4 }} /> : null}
              <CustomText variant="caption" style={{ color: item.isLive ? ui.liveMeta : ui.meta }}>
                {item.isLive ? 'Live' : typeLabel(item.type)}
              </CustomText>
            </View>
          </View>
        </View>
      </View>
    </TVTouchable>
  );
}

function LiveCard({
  item,
  width,
  onOpen,
  onNotify,
}: {
  item: FeedCardItem;
  width: number;
  onOpen: () => void;
  onNotify: () => void;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    cardBorder: isDark ? 'rgba(248,113,113,0.18)' : 'rgba(220,38,38,0.14)',
    cardBg: isDark ? 'rgba(127,29,29,0.08)' : 'rgba(254,242,242,0.9)',
    overlay: isDark
      ? (['rgba(0,0,0,0)', 'rgba(6,4,13,0.92)'] as const)
      : (['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)'] as const),
    livePillBg: isDark ? 'rgba(127,29,29,0.74)' : 'rgba(220,38,38,0.88)',
    livePillText: isDark ? '#FEE2E2' : '#FFFFFF',
    viewersPillBg: isDark ? 'rgba(10,8,17,0.7)' : 'rgba(255,255,255,0.84)',
    viewersText: isDark ? '#FDE68A' : '#92400E',
    title: isDark ? '#FFF1F2' : '#3F0D14',
    subtitle: isDark ? 'rgba(254,226,226,0.82)' : '#7F1D1D',
  } as const;
  return (
    <View
      style={{
        width: Math.max(width, 220),
        marginRight: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: ui.cardBorder,
        backgroundColor: ui.cardBg,
        overflow: 'hidden',
      }}
    >
      <TVTouchable onPress={onOpen} showFocusBorder={false}>
        <View style={{ height: 122 }}>
          <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <LinearGradient colors={ui.overlay} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: ui.livePillBg }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 5 }} />
            <CustomText variant="caption" style={{ color: ui.livePillText }}>
              LIVE
            </CustomText>
          </View>
          <View style={{ position: 'absolute', right: 10, top: 10, borderRadius: 999, backgroundColor: ui.viewersPillBg, paddingHorizontal: 8, paddingVertical: 4 }}>
            <CustomText variant="caption" style={{ color: ui.viewersText }}>
              {formatViewers(item.liveViewerCount)}
            </CustomText>
          </View>
        </View>
      </TVTouchable>

      <View style={{ padding: 10 }}>
        <CustomText variant="label" style={{ color: ui.title }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: ui.subtitle, marginTop: 3 }} numberOfLines={2}>
          {item.description}
        </CustomText>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <MiniAction icon="play-arrow" label="Watch" onPress={onOpen} />
          <MiniAction icon="notifications-active" label="Notify" onPress={onNotify} />
        </View>
      </View>
    </View>
  );
}

function MiniAction({
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
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(220,38,38,0.14)',
    bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(220,38,38,0.05)',
    icon: isDark ? '#F8E8E8' : '#B91C1C',
    text: isDark ? '#FCE7F3' : '#991B1B',
  } as const;
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 34,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: ui.border,
        backgroundColor: ui.bg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 8,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={15} color={ui.icon} />
      <CustomText variant="caption" style={{ color: ui.text }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

function CollectionsDashboard({
  items,
  viewportHeight,
  onOpenItem,
}: {
  items: FeedCardItem[];
  viewportHeight: number;
  onOpenItem: (_item: FeedCardItem) => void;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const primary = items[0];
  const listItems = primary ? items.slice(1) : [];

  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
        backgroundColor: isDark ? 'rgba(12,9,20,0.72)' : theme.colors.surface,
        padding: 10,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
          paddingTop: 2,
          paddingBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.07)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="library-music" size={15} color={theme.colors.primary} />
          </View>
          <View>
            <CustomText variant="caption" style={{ color: theme.colors.text.primary }}>
              Collections
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
              {items.length} items
            </CustomText>
          </View>
        </View>
        <TVTouchable
          onPress={() => undefined}
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.07)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          showFocusBorder={false}
        >
          <MaterialIcons name="more-vert" size={18} color={theme.colors.text.secondary} />
        </TVTouchable>
      </View>

      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator
        bounces={false}
        overScrollMode="never"
        style={{ height: viewportHeight }}
        contentContainerStyle={{ paddingBottom: 2 }}
        indicatorStyle={isDark ? 'white' : 'black'}
      >
        {primary ? (
          <>
            <CollectionSpotlightCard item={primary} onPress={() => onOpenItem(primary)} />
            <View style={{ marginTop: 10, gap: 8 }}>
              {listItems.map((item, index) => (
                <CollectionDashboardRow
                  key={item.id}
                  item={item}
                  index={index + 2}
                  onPress={() => onOpenItem(item)}
                />
              ))}
            </View>
          </>
        ) : (
          <CollectionsDashboardPlaceholder />
        )}
      </ScrollView>
    </View>
  );
}

function CollectionSpotlightCard({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    bg: isDark ? 'rgba(10,8,17,0.92)' : '#FFFFFF',
    border: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    imageBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.08)',
    metaBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    metaBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.07)',
    muted: isDark ? 'rgba(194,185,220,0.88)' : theme.colors.text.secondary,
    subtle: isDark ? 'rgba(176,167,202,0.92)' : 'rgba(107,99,132,0.95)',
    playBg: isDark ? 'rgba(154,107,255,0.14)' : 'rgba(109,40,217,0.08)',
    playBorder: isDark ? 'rgba(216,194,255,0.2)' : 'rgba(109,40,217,0.14)',
  } as const;

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: ui.border,
        backgroundColor: ui.bg,
        padding: 10,
      }}
      showFocusBorder={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
        <View
          style={{
            width: 110,
            borderRadius: 14,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: ui.imageBorder,
            backgroundColor: isDark ? '#141021' : theme.colors.surfaceAlt,
          }}
        >
          <Image source={{ uri: item.imageUrl }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="cover" />
          <LinearGradient
            colors={isDark ? ['rgba(0,0,0,0)', 'rgba(3,2,8,0.55)'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 }}
            pointerEvents="none"
          />
        </View>

        <View style={{ flex: 1, justifyContent: 'space-between', minHeight: 110 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: ui.metaBorder,
                  backgroundColor: ui.metaBg,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  maxWidth: '75%',
                }}
              >
                <CustomText variant="caption" style={{ color: ui.muted }} numberOfLines={1}>
                  {typeLabel(item.type)}
                </CustomText>
              </View>
              <CustomText variant="caption" style={{ color: ui.subtle }}>
                {item.duration || '--:--'}
              </CustomText>
            </View>

            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginTop: 8 }} numberOfLines={2}>
              {item.title}
            </CustomText>
            <CustomText variant="caption" style={{ color: ui.subtle, marginTop: 4 }} numberOfLines={2}>
              {item.subtitle || 'Featured collection'}
            </CustomText>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <CustomText variant="caption" style={{ color: ui.muted }} numberOfLines={1}>
              {item.description || 'Curated collection'}
            </CustomText>
            <View
              style={{
                marginLeft: 8,
                width: 34,
                height: 34,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: ui.playBorder,
                backgroundColor: ui.playBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="play-arrow" size={20} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </View>
    </TVTouchable>
  );
}

function CollectionDashboardRow({
  item,
  index,
  onPress,
}: {
  item: FeedCardItem;
  index: number;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    bg: isDark ? 'rgba(14,11,24,0.9)' : '#FFFFFF',
    border: isDark ? 'rgba(255,255,255,0.07)' : theme.colors.border,
    imageBg: isDark ? '#171228' : theme.colors.surfaceAlt,
    imageBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.06)',
    badgeBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    badgeBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.07)',
    badgeText: isDark ? 'rgba(214,206,239,0.9)' : 'rgba(91,83,118,0.95)',
    muted: isDark ? 'rgba(194,185,220,0.88)' : theme.colors.text.secondary,
    indexText: isDark ? 'rgba(164,156,191,0.9)' : 'rgba(120,111,146,0.95)',
    actionBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    actionBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.07)',
  } as const;

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        minHeight: 78,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: ui.border,
        backgroundColor: ui.bg,
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      showFocusBorder={false}
    >
      <CustomText
        variant="caption"
        style={{ color: ui.indexText, width: 26, textAlign: 'center', marginRight: 4 }}
      >
        {String(index).padStart(2, '0')}
      </CustomText>

      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: ui.imageBorder,
          backgroundColor: ui.imageBg,
          marginRight: 10,
        }}
      >
        <Image source={{ uri: item.imageUrl }} style={{ width: 56, height: 56 }} resizeMode="cover" />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: ui.badgeBorder,
              backgroundColor: ui.badgeBg,
              paddingHorizontal: 6,
              paddingVertical: 3,
            }}
          >
            <CustomText variant="caption" style={{ color: ui.badgeText }}>
              {typeLabel(item.type)}
            </CustomText>
          </View>
          <CustomText variant="caption" style={{ color: ui.muted }} numberOfLines={1}>
            {item.duration || '--:--'}
          </CustomText>
        </View>

        <CustomText variant="label" style={{ color: theme.colors.text.primary, marginTop: 5 }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: ui.muted, marginTop: 2 }} numberOfLines={1}>
          {item.subtitle || 'Collection'}
        </CustomText>
      </View>

      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: ui.actionBorder,
          backgroundColor: ui.actionBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
        }}
      >
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
      </View>
    </TVTouchable>
  );
}

function CollectionsDashboardPlaceholder() {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const blocks = Array.from({ length: 4 }, (_, idx) => idx);

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : theme.colors.border,
          backgroundColor: isDark ? 'rgba(12,9,20,0.82)' : theme.colors.surface,
          padding: 10,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              width: 110,
              aspectRatio: 1,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceAlt,
            }}
          />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View
              style={{
                height: 10,
                borderRadius: 999,
                width: '48%',
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.07)',
              }}
            />
            <View
              style={{
                height: 12,
                borderRadius: 999,
                width: '86%',
                marginTop: 12,
                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,16,33,0.08)',
              }}
            />
            <View
              style={{
                height: 10,
                borderRadius: 999,
                width: '62%',
                marginTop: 10,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.06)',
              }}
            />
          </View>
        </View>
      </View>

      {blocks.map((idx) => (
        <View
          key={idx}
          style={{
            minHeight: 74,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : theme.colors.border,
            backgroundColor: isDark ? 'rgba(12,9,20,0.8)' : theme.colors.surface,
            paddingHorizontal: 10,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 20,
              height: 8,
              borderRadius: 999,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.06)',
              marginRight: 10,
            }}
          />
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceAlt,
              marginRight: 10,
            }}
          />
          <View style={{ flex: 1 }}>
            <View
              style={{
                height: 9,
                borderRadius: 999,
                width: '40%',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.06)',
              }}
            />
            <View
              style={{
                height: 10,
                borderRadius: 999,
                width: '72%',
                marginTop: 8,
                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,16,33,0.08)',
              }}
            />
            <View
              style={{
                height: 8,
                borderRadius: 999,
                width: '44%',
                marginTop: 7,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.06)',
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function RecentRow({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        minHeight: 64,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
        backgroundColor: isDark ? 'rgba(12,9,20,0.86)' : theme.colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48, borderRadius: 12, marginRight: 10, backgroundColor: isDark ? '#140F20' : theme.colors.surfaceAlt }} resizeMode="cover" />
      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
          {item.subtitle}
        </CustomText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
          {item.duration || '--:--'}
        </CustomText>
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
      </View>
    </TVTouchable>
  );
}

function EmptyRailCard({
  width,
  title,
  subtitle,
  icon,
}: {
  width: number;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  return (
    <View
      style={{
        width,
        marginRight: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : theme.colors.border,
        backgroundColor: isDark ? 'rgba(12,9,20,0.76)' : theme.colors.surface,
        padding: 12,
        minHeight: 150,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(154,107,255,0.16)' : 'rgba(109,40,217,0.08)',
          marginBottom: 10,
        }}
      >
        <MaterialIcons name={icon} size={20} color={theme.colors.primary} />
      </View>
      <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
        {title}
      </CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
        {subtitle}
      </CustomText>
    </View>
  );
}

function EmptyListRow() {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  return (
    <View
      style={{
        minHeight: 72,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : theme.colors.border,
        backgroundColor: isDark ? 'rgba(12,9,20,0.76)' : theme.colors.surface,
        padding: 12,
        justifyContent: 'center',
      }}
    >
      <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
        No recent plays yet
      </CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
        Playback history will populate here after users start streaming content.
      </CustomText>
    </View>
  );
}

function firstAvailable(feed: FeedBundle): FeedCardItem | null {
  return (
    feed.live[0] ??
    feed.videos[0] ??
    feed.music[0] ??
    feed.playlists[0] ??
    feed.announcements[0] ??
    feed.recent[0] ??
    null
  );
}

function deriveMinistryItems(
  feed: FeedBundle,
  section: { title: string; kind: 'video' | 'audio' | 'message' | 'worship' | 'playlist' },
) {
  const curatedPool = [
    ...feed.videos,
    ...feed.music,
    ...feed.playlists,
    ...feed.announcements,
    ...feed.live,
    ...feed.recent,
  ];
  const seen = new Set<string>();
  const curated = curatedPool.filter((item) => {
    const match = Array.isArray(item.appSections) && item.appSections.some((value) => value.trim().toLowerCase() === section.title.trim().toLowerCase());
    if (!match) return false;
    const key = item.mediaUrl || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (curated.length) {
    return curated;
  }

  const { kind } = section;
  switch (kind) {
    case 'audio':
      return feed.music;
    case 'message':
      return feed.announcements.length ? feed.announcements : [...feed.videos, ...feed.playlists];
    case 'worship':
      return feed.playlists.length ? feed.playlists : [...feed.videos, ...feed.music];
    case 'playlist':
      return feed.playlists;
    case 'video':
    default:
      return feed.videos.length ? feed.videos : [...feed.music, ...feed.playlists];
  }
}

function sectionSubtitle(kind: 'video' | 'audio' | 'message' | 'worship' | 'playlist') {
  switch (kind) {
    case 'audio':
      return 'Audio tracks, playlists and worship sessions';
    case 'message':
      return 'Messages, nuggets and announcements from channel uploads';
    case 'worship':
      return 'Worship videos, playlists and live worship sessions';
    case 'playlist':
      return 'Curated playlist architecture for long-form listening';
    case 'video':
    default:
      return 'Video drops, replays and featured uploads';
  }
}

function formatViewers(value?: number) {
  if (!value || value < 1) return '0 watching';
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k watching`;
  return `${value} watching`;
}

function typeLabel(type: FeedCardItem['type']) {
  switch (type) {
    case 'audio':
      return 'Audio';
    case 'video':
      return 'Video';
    case 'playlist':
      return 'Playlist';
    case 'announcement':
      return 'Message';
    case 'live':
      return 'Live';
    case 'ad':
      return 'Media';
    default:
      return 'Media';
  }
}
