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
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem, FeedBundle } from '../../services/contentService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';

const ministrySections: { title: string; kind: 'video' | 'audio' | 'message' | 'worship' | 'playlist' }[] = [
  { title: 'ClaudyGod Music', kind: 'video' },
  { title: 'ClaudyGod Nuggets of Truth', kind: 'message' },
  { title: 'ClaudyGod Worship Hour', kind: 'worship' },
  { title: 'ClaudyGod Teens Youth Channel', kind: 'video' },
  { title: 'ClaudyGod Messages', kind: 'message' },
  { title: 'ClaudyGod Music (Audio)', kind: 'audio' },
  { title: 'ClaudyGod Worship Hour (Audio)', kind: 'audio' },
];

const topRailChips = ['For You', 'Music', 'Videos', 'Live', 'Worship', 'Messages', 'Playlists', 'Ads'];

const WORD_FOR_TODAY = {
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
    infoIconBg: isDark ? 'rgba(154,107,255,0.16)' : 'rgba(109,40,217,0.12)',
    wordBg: isDark ? 'rgba(12,9,20,0.9)' : '#FFFFFF',
    wordBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    wordMuted: isDark ? 'rgba(194,185,220,0.9)' : 'rgba(96,87,124,0.9)',
    wordSubtle: isDark ? 'rgba(176,167,202,0.9)' : 'rgba(108,99,134,0.92)',
    wordAccentBg: isDark ? 'rgba(154,107,255,0.14)' : 'rgba(109,40,217,0.08)',
    wordAccentBorder: isDark ? 'rgba(216,194,255,0.22)' : 'rgba(109,40,217,0.14)',
    albumWrapBg: isDark ? 'rgba(12,9,20,0.72)' : theme.colors.surface,
    albumWrapBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    albumScrollTrack: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.06)',
  } as const;
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const compact = width < 380;
  const railCardWidth = isTV ? 260 : isTablet ? 220 : compact ? 150 : 166;
  const albumGridCols = isTV ? 4 : isTablet ? 3 : 2;
  const [activeFilter, setActiveFilter] = useState('For You');

  const { feed, loading, error, refresh } = useContentFeed();

  const featured = useMemo(() => feed.featured ?? firstAvailable(feed), [feed]);
  const liveItems = useMemo(() => feed.live.slice(0, isTablet || isTV ? 6 : 4), [feed.live, isTablet, isTV]);
  const adsItems = useMemo(() => feed.ads.slice(0, 4), [feed.ads]);
  const popularTracks = useMemo(() => (feed.music.length ? feed.music : []).slice(0, 10), [feed.music]);
  const albumGrid = useMemo(() => (feed.playlists.length ? feed.playlists : feed.videos).slice(0, 8), [feed.playlists, feed.videos]);
  const recentItems = useMemo(() => feed.recent.slice(0, 8), [feed.recent]);

  const onOpenItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    if (item.type === 'video') {
      router.push('/(tabs)/videos');
      return;
    }
    router.push('/(tabs)/PlaySection');
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
              <View style={{ paddingTop: theme.spacing.md, paddingBottom: 12 }}>
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
            <SectionBlock title={WORD_FOR_TODAY.title} subtitle="A daily scripture passage for prayer, direction and encouragement">
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
                        {WORD_FOR_TODAY.passage}
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
                  {WORD_FOR_TODAY.verse}
                </CustomText>
                <CustomText variant="caption" style={{ color: ui.wordSubtle, marginTop: 8 }}>
                  {WORD_FOR_TODAY.reflection}
                </CustomText>
              </View>
            </SectionBlock>
          </FadeIn>

          <FadeIn delay={120}>
            <SectionBlock title="Live Now" subtitle="YouTube-style live hub with viewers count and notify action">
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
            <SectionBlock title="Sponsored / Ads" subtitle="Reserved placement for campaigns, revivals and partner promos">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                contentContainerStyle={{ paddingRight: 8 }}
              >
                {adsItems.length ? (
                  adsItems.map((item) => (
                    <AdCard key={item.id} item={item} width={railCardWidth} onOpen={() => onOpenItem(item, 'home_ad')} />
                  ))
                ) : (
                  <EmptyRailCard
                    width={Math.max(railCardWidth, 220)}
                    title="Ads slot ready"
                    subtitle="Admin campaigns and sponsored cards will render here after backend sync."
                    icon="campaign"
                  />
                )}
              </ScrollView>
            </SectionBlock>
          </FadeIn>

          <FadeIn delay={200}>
            <SectionBlock title="Popular Tracks" subtitle="Audio-first rail for worship music and playlists">
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
                  <EmptyRailCard width={railCardWidth} title="No tracks yet" subtitle="Publish audio content in Admin to fill this rail." icon="music-note" />
                )}
              </ScrollView>
            </SectionBlock>
          </FadeIn>

          <FadeIn delay={240}>
            <SectionBlock title="Albums & Playlists" subtitle="Responsive grid for covers and themed collections">
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: ui.albumWrapBorder,
                  backgroundColor: ui.albumWrapBg,
                  padding: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 2, paddingBottom: 8 }}>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    Scroll inside this section
                  </CustomText>
                  <View
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: ui.albumWrapBorder,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <MaterialIcons name="more-horiz" size={16} color={theme.colors.text.secondary} />
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginLeft: 4 }}>
                      Browse
                    </CustomText>
                  </View>
                </View>
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  bounces={false}
                  overScrollMode="never"
                  style={{ maxHeight: isTV ? 620 : isTablet ? 540 : 390 }}
                  contentContainerStyle={{ paddingBottom: 2, paddingRight: 2 }}
                  indicatorStyle={isDark ? 'white' : 'black'}
                >
                  <ResponsiveGrid columns={albumGridCols}>
                    {albumGrid.length ? (
                      albumGrid.map((item) => (
                        <GridTile key={item.id} item={item} onPress={() => onOpenItem(item, 'home_albums_grid')} />
                      ))
                    ) : (
                      <GridPlaceholder columns={albumGridCols} />
                    )}
                  </ResponsiveGrid>
                </ScrollView>
              </View>
            </SectionBlock>
          </FadeIn>

          <FadeIn delay={280}>
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

          {ministrySections.map((section, index) => {
            const items = deriveMinistryItems(feed, section.kind).slice(index % 2 === 0 ? 0 : 1, (index % 2 === 0 ? 0 : 1) + 8);
            return (
              <FadeIn key={section.title} delay={320 + index * 35}>
                <SectionBlock title={section.title} subtitle={sectionSubtitle(section.kind)}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    contentContainerStyle={{ paddingRight: 8 }}
                  >
                    {items.length ? (
                      items.map((item) => (
                        <PosterTile key={`${section.title}-${item.id}`} item={item} width={railCardWidth} onPress={() => onOpenItem(item, 'home_ministry_section')} />
                      ))
                    ) : (
                      <EmptyRailCard
                        width={railCardWidth}
                        title={section.title}
                        subtitle="Section kept in place. Content will render from your YouTube sync / Admin publish pipeline."
                        icon={section.kind === 'audio' ? 'graphic-eq' : section.kind === 'message' ? 'menu-book' : 'play-circle-outline'}
                      />
                    )}
                  </ScrollView>
                </SectionBlock>
              </FadeIn>
            );
          })}

          <FadeIn delay={620}>
            <View
              style={{
                marginTop: theme.spacing.lg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ui.infoIconBg,
                  marginRight: 12,
                }}
              >
                <MaterialIcons name="equalizer" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                  Backend-ready architecture
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
                  This home screen reads from `contentService` and `supabaseAnalytics` so you can replace demo fallbacks with real YouTube and Supabase data.
                </CustomText>
              </View>
            </View>
          </FadeIn>

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
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    cardBg: isDark ? 'rgba(10,8,17,0.9)' : theme.colors.surface,
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    logoBg: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceAlt,
    logoBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,16,33,0.08)',
    muted: isDark ? 'rgba(194,185,220,0.9)' : 'rgba(96,87,124,0.92)',
    subtle: isDark ? 'rgba(176,167,202,0.9)' : 'rgba(108,99,134,0.9)',
    chipBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surface,
    chipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,33,0.08)',
    chipActiveBg: isDark ? 'rgba(154,107,255,0.16)' : 'rgba(109,40,217,0.08)',
    chipActiveBorder: isDark ? 'rgba(216,194,255,0.34)' : 'rgba(109,40,217,0.16)',
    chipText: isDark ? '#CEC4E7' : '#5C5478',
    chipActiveText: isDark ? '#EFE3FF' : '#4C1D95',
  } as const;

  return (
    <View>
      <View
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: ui.cardBorder,
          backgroundColor: ui.cardBg,
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: ui.logoBorder,
                backgroundColor: ui.logoBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Image
                source={require('../../assets/images/ClaudyGoLogo.webp')}
                style={{ width: 30, height: 30, borderRadius: 15 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText variant="caption" style={{ color: ui.muted }}>
                ClaudyGod Ministries
              </CustomText>
              <CustomText
                variant="display"
                style={{ color: theme.colors.text.primary, marginTop: 2, fontSize: 17, lineHeight: 22 }}
              >
                Streaming Home
              </CustomText>
              <CustomText variant="caption" style={{ color: ui.subtle, marginTop: 3 }} numberOfLines={1}>
                Music • Videos • Live
              </CustomText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconCircle icon="ondemand-video" onPress={onOpenVideos} />
            <IconCircle icon="person-outline" onPress={onOpenProfile} />
            <IconCircle icon="more-horiz" onPress={onOpenMenu} />
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 2, paddingRight: 8 }}
      >
        {topRailChips.map((chip) => {
          const active = chip === activeFilter;
          return (
            <TVTouchable
              key={chip}
              onPress={() => onChangeFilter(chip)}
              style={{
                marginRight: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? ui.chipActiveBorder : ui.chipBorder,
                backgroundColor: active ? ui.chipActiveBg : ui.chipBg,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              showFocusBorder={false}
            >
              <CustomText variant="caption" style={{ color: active ? ui.chipActiveText : ui.chipText }}>
                {chip}
              </CustomText>
            </TVTouchable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function IconCircle({ icon, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; onPress: () => void }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(20,16,33,0.08)',
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(109,40,217,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={20} color={isDark ? '#EFE7FF' : '#3F2A76'} />
    </TVTouchable>
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
      ? 'Preparing your feed from content service.'
      : 'Connect Admin + YouTube sync to populate the hero drop with latest video or worship stream.');

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

function AdCard({ item, width, onOpen }: { item: FeedCardItem; width: number; onOpen: () => void }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    cardBorder: isDark ? 'rgba(216,194,255,0.18)' : 'rgba(109,40,217,0.14)',
    cardBg: isDark ? 'rgba(154,107,255,0.07)' : 'rgba(237,233,254,0.72)',
    overlay: isDark
      ? (['rgba(0,0,0,0)', 'rgba(6,4,13,0.88)'] as const)
      : (['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)'] as const),
    pillBg: isDark ? 'rgba(88,28,135,0.7)' : 'rgba(109,40,217,0.88)',
    pillText: isDark ? '#EDE9FE' : '#FFFFFF',
    title: isDark ? '#F5EEFF' : theme.colors.text.primary,
    subtitle: isDark ? 'rgba(221,210,245,0.9)' : theme.colors.text.secondary,
  } as const;
  return (
    <TVTouchable
      onPress={onOpen}
      style={{
        width: Math.max(width, 220),
        marginRight: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: ui.cardBorder,
        backgroundColor: ui.cardBg,
        overflow: 'hidden',
      }}
      showFocusBorder={false}
    >
      <View style={{ height: 112 }}>
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <LinearGradient colors={ui.overlay} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ position: 'absolute', top: 10, left: 10, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: ui.pillBg }}>
          <CustomText variant="caption" style={{ color: ui.pillText }}>
            SPONSORED
          </CustomText>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <CustomText variant="label" style={{ color: ui.title }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: ui.subtitle, marginTop: 3 }} numberOfLines={2}>
          {item.description}
        </CustomText>
      </View>
    </TVTouchable>
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

function ResponsiveGrid({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: 2 }}>
      {React.Children.map(children, (child) => (
        <View style={{ width: `${100 / columns}%`, paddingHorizontal: 6, marginBottom: 14 }}>{child}</View>
      ))}
    </View>
  );
}

function GridTile({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    cardBg: isDark ? 'rgba(12,9,20,0.9)' : theme.colors.surface,
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    imageBg: isDark ? '#140F20' : theme.colors.surfaceAlt,
    imageBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.06)',
    imageOverlay: isDark
      ? (['rgba(0,0,0,0)', 'rgba(6,4,13,0.82)'] as const)
      : (['rgba(255,255,255,0)', 'rgba(255,255,255,0.84)'] as const),
    badgeBg: isDark ? 'rgba(12,9,20,0.72)' : 'rgba(255,255,255,0.88)',
    badgeBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,16,33,0.07)',
    badgeText: isDark ? '#EDE3FF' : '#4C1D95',
    metaText: isDark ? 'rgba(194,185,220,0.9)' : theme.colors.text.secondary,
    subtleText: isDark ? 'rgba(176,167,202,0.88)' : 'rgba(108,99,134,0.9)',
    playBtnBg: isDark ? 'rgba(154,107,255,0.26)' : 'rgba(109,40,217,0.12)',
    playBtnBorder: isDark ? 'rgba(216,194,255,0.22)' : 'rgba(109,40,217,0.16)',
    playBtnIcon: isDark ? '#F4ECFF' : theme.colors.primary,
    footerChipBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    footerChipBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,16,33,0.06)',
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
      <View style={{ padding: 8 }}>
        <View
          style={{
            borderRadius: 14,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: ui.imageBorder,
            backgroundColor: ui.imageBg,
          }}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', aspectRatio: 1.02, backgroundColor: ui.imageBg }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={ui.imageOverlay}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64 }}
            pointerEvents="none"
          />

          <View style={{ position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: ui.badgeBorder,
                backgroundColor: ui.badgeBg,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <CustomText variant="caption" style={{ color: ui.badgeText }}>
                {typeLabel(item.type).toUpperCase()}
              </CustomText>
            </View>
            {item.duration ? (
              <View
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: ui.badgeBorder,
                  backgroundColor: ui.badgeBg,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <CustomText variant="caption" style={{ color: ui.subtleText }}>
                  {item.duration}
                </CustomText>
              </View>
            ) : null}
          </View>

          <View style={{ position: 'absolute', right: 10, bottom: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                borderWidth: 1,
                borderColor: ui.playBtnBorder,
                backgroundColor: ui.playBtnBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="play-arrow" size={20} color={ui.playBtnIcon} />
            </View>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: 2 }}>
        <CustomText variant="label" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }} numberOfLines={1}>
          {item.subtitle}
        </CustomText>

        <View style={{ marginTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: ui.footerChipBorder,
              backgroundColor: ui.footerChipBg,
              paddingHorizontal: 8,
              paddingVertical: 5,
              maxWidth: '78%',
            }}
          >
            <MaterialIcons
              name={item.type === 'playlist' ? 'queue-music' : item.type === 'audio' ? 'graphic-eq' : 'library-music'}
              size={14}
              color={theme.colors.primary}
            />
            <CustomText variant="caption" style={{ color: ui.metaText, marginLeft: 5 }} numberOfLines={1}>
              {item.type === 'playlist' ? 'Collection' : item.type === 'audio' ? 'Audio Drop' : 'Now Streaming'}
            </CustomText>
          </View>

          <MaterialIcons name="chevron-right" size={18} color={ui.subtleText} />
        </View>
      </View>
    </TVTouchable>
  );
}

function GridPlaceholder({ columns }: { columns: number }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const blocks = Array.from({ length: Math.max(columns, 4) }, (_, idx) => idx);
  return (
    <>
      {blocks.map((idx) => (
        <View
          key={idx}
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : theme.colors.border,
            backgroundColor: isDark ? 'rgba(12,9,20,0.78)' : theme.colors.surface,
            padding: 8,
            minHeight: 210,
          }}
        >
          <View
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.05)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
              aspectRatio: 1.02,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="collections-bookmark" size={18} color={theme.colors.text.secondary} />
          </View>
          <View style={{ paddingHorizontal: 4, paddingTop: 10 }}>
            <View
              style={{
                height: 10,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.06)',
                width: '78%',
              }}
            />
            <View
              style={{
                height: 8,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.05)',
                width: '54%',
                marginTop: 8,
              }}
            />
          </View>
        </View>
      ))}
    </>
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
    feed.ads[0] ??
    feed.recent[0] ??
    null
  );
}

function deriveMinistryItems(feed: FeedBundle, kind: 'video' | 'audio' | 'message' | 'worship' | 'playlist') {
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
      return 'Audio rail (Supabase plays + download analytics ready)';
    case 'message':
      return 'Messages, nuggets and announcements from channel uploads';
    case 'worship':
      return 'Worship videos, playlists and live worship sessions';
    case 'playlist':
      return 'Curated playlist architecture for long-form listening';
    case 'video':
    default:
      return 'Video-first cards ready for YouTube channel sync';
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
      return 'Ad';
    default:
      return 'Media';
  }
}
