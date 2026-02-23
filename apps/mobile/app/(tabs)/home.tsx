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

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
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
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 148 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
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
          <FadeIn>
            <HomeHeader
              activeFilter={activeFilter}
              onChangeFilter={setActiveFilter}
              onOpenVideos={() => router.push('/(tabs)/videos')}
              onOpenProfile={() => router.push('/profile')}
            />
          </FadeIn>

          <FadeIn delay={70}>
            <HeroDropCard
              item={featured}
              loading={loading}
              onPressPrimary={() => (featured ? onOpenItem(featured, 'home_hero') : router.push('/(tabs)/videos'))}
              onPressSecondary={() => router.push('/(tabs)/videos')}
              isTablet={isTablet || isTV}
            />
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
              <ResponsiveGrid columns={albumGridCols}>
                {albumGrid.length ? (
                  albumGrid.map((item) => (
                    <GridTile key={item.id} item={item} onPress={() => onOpenItem(item, 'home_albums_grid')} />
                  ))
                ) : (
                  <GridPlaceholder columns={albumGridCols} />
                )}
              </ResponsiveGrid>
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
                  backgroundColor: 'rgba(154,107,255,0.16)',
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
}: {
  activeFilter: string;
  onChangeFilter: (_value: string) => void;
  onOpenVideos: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)' }}>
            ClaudyGod Home
          </CustomText>
          <CustomText variant="display" style={{ color: '#F8F7FC', marginTop: 4, fontSize: 19, lineHeight: 24 }}>
            Music, Videos, Live & Worship
          </CustomText>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconCircle icon="ondemand-video" onPress={onOpenVideos} />
          <IconCircle icon="person-outline" onPress={onOpenProfile} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingTop: 12, paddingRight: 8 }}
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
                borderColor: active ? 'rgba(216,194,255,0.34)' : 'rgba(255,255,255,0.1)',
                backgroundColor: active ? 'rgba(154,107,255,0.16)' : 'rgba(255,255,255,0.03)',
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              showFocusBorder={false}
            >
              <CustomText variant="caption" style={{ color: active ? '#EFE3FF' : '#CEC4E7' }}>
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
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={20} color="#EFE7FF" />
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
        marginTop: 14,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(12,9,20,0.88)',
      }}
      showFocusBorder={false}
    >
      <View style={{ height: 280 }}>
        {item?.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['#21113E', '#100B1E', '#0A0712']}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
        )}

        <LinearGradient
          colors={['rgba(6,4,13,0.15)', 'rgba(6,4,13,0.84)', '#06040D']}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />

        <View style={{ flex: 1, justifyContent: 'space-between', padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View
              style={{
                alignSelf: 'flex-start',
                borderRadius: 999,
                backgroundColor: item?.isLive ? 'rgba(239,68,68,0.18)' : 'rgba(154,107,255,0.18)',
                borderWidth: 1,
                borderColor: item?.isLive ? 'rgba(248,113,113,0.32)' : 'rgba(216,194,255,0.28)',
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <CustomText variant="caption" style={{ color: item?.isLive ? '#FECACA' : '#EDE3FF' }}>
                {item?.isLive ? 'LIVE FEATURED' : 'HERO DROP'}
              </CustomText>
            </View>
            <TVTouchable
              onPress={onPressSecondary}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              showFocusBorder={false}
            >
              <MaterialIcons name="queue-play-next" size={20} color="#F5EEFF" />
            </TVTouchable>
          </View>

          <View>
            <CustomText variant="display" style={{ color: '#F8F7FC', fontSize: isTablet ? 22 : 19, lineHeight: isTablet ? 28 : 24 }} numberOfLines={2}>
              {title}
            </CustomText>
            <CustomText variant="body" style={{ color: 'rgba(217,210,236,0.92)', marginTop: 8 }} numberOfLines={3}>
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
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.16)',
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
                    backgroundColor: 'rgba(154,107,255,0.34)',
                    marginRight: 8,
                  }}
                >
                  <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
                </View>
                <CustomText variant="label" style={{ color: '#FFFFFF' }}>
                  Play
                </CustomText>
              </TVTouchable>
              <TVTouchable
                onPress={onPressSecondary}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
                showFocusBorder={false}
              >
                <CustomText variant="label" style={{ color: '#E6DBFF' }}>
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
  return (
    <View style={{ marginTop: 18 }}>
      <View style={{ paddingHorizontal: 2, marginBottom: 10 }}>
        <CustomText variant="heading" style={{ color: '#F8F7FC' }}>
          {title}
        </CustomText>
        <CustomText variant="caption" style={{ color: 'rgba(190,182,213,0.88)', marginTop: 3 }}>
          {subtitle}
        </CustomText>
      </View>
      {children}
    </View>
  );
}

function PosterTile({ item, width, onPress }: { item: FeedCardItem; width: number; onPress: () => void }) {
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
          borderColor: 'rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(16,11,26,0.9)',
        }}
      >
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 118 }} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(10,8,17,0)', 'rgba(10,8,17,0.78)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 48, height: 50 }}
          pointerEvents="none"
        />
        <View style={{ padding: 10 }}>
          <CustomText variant="label" style={{ color: '#F8F7FC' }} numberOfLines={1}>
            {item.title}
          </CustomText>
          <CustomText variant="caption" style={{ color: 'rgba(193,184,216,0.92)', marginTop: 3 }} numberOfLines={1}>
            {item.subtitle}
          </CustomText>
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CustomText variant="caption" style={{ color: 'rgba(178,169,202,0.88)' }}>
              {item.duration || '--:--'}
            </CustomText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.isLive ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 4 }} /> : null}
              <CustomText variant="caption" style={{ color: item.isLive ? '#FCA5A5' : 'rgba(178,169,202,0.88)' }}>
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
  return (
    <View
      style={{
        width: Math.max(width, 220),
        marginRight: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.18)',
        backgroundColor: 'rgba(127,29,29,0.08)',
        overflow: 'hidden',
      }}
    >
      <TVTouchable onPress={onOpen} showFocusBorder={false}>
        <View style={{ height: 122 }}>
          <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(6,4,13,0.92)']} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(127,29,29,0.74)' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 5 }} />
            <CustomText variant="caption" style={{ color: '#FEE2E2' }}>
              LIVE
            </CustomText>
          </View>
          <View style={{ position: 'absolute', right: 10, top: 10, borderRadius: 999, backgroundColor: 'rgba(10,8,17,0.7)', paddingHorizontal: 8, paddingVertical: 4 }}>
            <CustomText variant="caption" style={{ color: '#FDE68A' }}>
              {formatViewers(item.liveViewerCount)}
            </CustomText>
          </View>
        </View>
      </TVTouchable>

      <View style={{ padding: 10 }}>
        <CustomText variant="label" style={{ color: '#FFF1F2' }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: 'rgba(254,226,226,0.82)', marginTop: 3 }} numberOfLines={2}>
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
  return (
    <TVTouchable
      onPress={onOpen}
      style={{
        width: Math.max(width, 220),
        marginRight: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(216,194,255,0.18)',
        backgroundColor: 'rgba(154,107,255,0.07)',
        overflow: 'hidden',
      }}
      showFocusBorder={false}
    >
      <View style={{ height: 112 }}>
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(6,4,13,0.88)']} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ position: 'absolute', top: 10, left: 10, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(88,28,135,0.7)' }}>
          <CustomText variant="caption" style={{ color: '#EDE9FE' }}>
            SPONSORED
          </CustomText>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <CustomText variant="label" style={{ color: '#F5EEFF' }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: 'rgba(221,210,245,0.9)', marginTop: 3 }} numberOfLines={2}>
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
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 34,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 8,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={15} color="#F8E8E8" />
      <CustomText variant="caption" style={{ color: '#FCE7F3' }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

function ResponsiveGrid({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
      {React.Children.map(children, (child) => (
        <View style={{ width: `${100 / columns}%`, paddingHorizontal: 6, marginBottom: 12 }}>{child}</View>
      ))}
    </View>
  );
}

function GridTile({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(12,9,20,0.88)',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', aspectRatio: 1, backgroundColor: '#140F20' }} resizeMode="cover" />
      <View style={{ padding: 10 }}>
        <CustomText variant="label" style={{ color: '#F8F7FC' }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 3 }} numberOfLines={1}>
          {item.subtitle}
        </CustomText>
      </View>
    </TVTouchable>
  );
}

function GridPlaceholder({ columns }: { columns: number }) {
  const blocks = Array.from({ length: Math.max(columns, 4) }, (_, idx) => idx);
  return (
    <>
      {blocks.map((idx) => (
        <View
          key={idx}
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(12,9,20,0.7)',
            padding: 12,
            minHeight: 120,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialIcons name="collections-bookmark" size={18} color="rgba(194,185,220,0.8)" />
          <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.8)', marginTop: 8, textAlign: 'center' }}>
            Playlist grid placeholder
          </CustomText>
        </View>
      ))}
    </>
  );
}

function RecentRow({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        minHeight: 64,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(12,9,20,0.86)',
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48, borderRadius: 12, marginRight: 10 }} resizeMode="cover" />
      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: '#F8F7FC' }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 2 }} numberOfLines={1}>
          {item.subtitle}
        </CustomText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <CustomText variant="caption" style={{ color: 'rgba(171,162,198,0.9)' }}>
          {item.duration || '--:--'}
        </CustomText>
        <MaterialIcons name="chevron-right" size={18} color="rgba(171,162,198,0.9)" />
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
  return (
    <View
      style={{
        width,
        marginRight: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(12,9,20,0.76)',
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
          backgroundColor: 'rgba(154,107,255,0.16)',
          marginBottom: 10,
        }}
      >
        <MaterialIcons name={icon} size={20} color="#DCCBFF" />
      </View>
      <CustomText variant="label" style={{ color: '#F8F7FC' }}>
        {title}
      </CustomText>
      <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 4 }}>
        {subtitle}
      </CustomText>
    </View>
  );
}

function EmptyListRow() {
  return (
    <View
      style={{
        minHeight: 72,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(12,9,20,0.76)',
        padding: 12,
        justifyContent: 'center',
      }}
    >
      <CustomText variant="label" style={{ color: '#F8F7FC' }}>
        No recent plays yet
      </CustomText>
      <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 4 }}>
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
