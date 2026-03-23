import React, { useMemo } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Share,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { buildPlayerRoute } from '../../util/playerRoute';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import type { FeedBundle, FeedCardItem } from '../../services/contentService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';
import { APP_ROUTES } from '../../util/appRoutes';
import { deriveLayoutSectionItems, getHomeLayoutSections } from '../../util/mobileLayout';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';

const WORD_FOR_TODAY_FALLBACK = {
  title: 'Word for Today',
  passage: 'Psalm 119:105',
  verse: 'Your word is a lamp to my feet and a light to my path.',
  reflection: 'Keep this verse close and return tomorrow for the next reading.',
};

const QUICK_DESTINATIONS: {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  route: string;
}[] = [
  { key: 'music', label: 'Music', icon: 'graphic-eq', route: APP_ROUTES.tabs.player },
  { key: 'videos', label: 'Videos', icon: 'smart-display', route: APP_ROUTES.tabs.videos },
  { key: 'live', label: 'Live', icon: 'podcasts', route: APP_ROUTES.tabs.videos },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const railCardWidth = isTablet ? 212 : 162;

  const { feed, loading, error, refresh } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();
  const { word } = useWordOfDay();

  const featured = useMemo(() => feed.featured ?? getFirstAvailable(feed), [feed]);
  const liveItems = useMemo(() => feed.live.slice(0, isTablet ? 4 : 3), [feed.live, isTablet]);
  const listenNow = useMemo(
    () => (feed.music.length ? feed.music : feed.recent).slice(0, isTablet ? 8 : 6),
    [feed.music, feed.recent, isTablet],
  );
  const watchNow = useMemo(
    () => (feed.videos.length ? feed.videos : feed.playlists).slice(0, isTablet ? 8 : 6),
    [feed.playlists, feed.videos, isTablet],
  );
  const homeSections = useMemo(() => getHomeLayoutSections(mobileConfig), [mobileConfig]);
  const curatedRails = useMemo(
    () =>
      homeSections
        .map((section) => ({
          section,
          items: deriveLayoutSectionItems(feed, section),
        }))
        .filter((entry) => entry.items.length > 0)
        .slice(0, 2),
    [feed, homeSections],
  );
  const wordForToday = word
    ? {
        title: word.title || 'Word for Today',
        passage: word.passage,
        verse: word.verse,
        reflection: word.reflection,
      }
    : WORD_FOR_TODAY_FALLBACK;

  const handleOpenItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    router.push(buildPlayerRoute(item));
  };

  const handleShareWord = async () => {
    await Share.share({
      message: `${wordForToday.passage}\n\n${wordForToday.verse}\n\n${wordForToday.reflection}`,
    });
  };

  const handleSubscribeLive = async (item: FeedCardItem) => {
    await subscribeToLiveAlerts(item.notificationChannelId || item.id);
    Alert.alert('Live alerts enabled', 'You will be notified when ClaudyGod goes live.');
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
          <View style={{ paddingTop: theme.layout.sectionGap, gap: theme.layout.sectionGapLarge }}>
            <FadeIn>
              <HomeTopBar
                onOpenSearch={() => router.push(APP_ROUTES.tabs.search)}
                onOpenVideos={() => router.push(APP_ROUTES.tabs.videos)}
                onOpenProfile={() => router.push(APP_ROUTES.profile)}
              />
            </FadeIn>

            <FadeIn delay={60}>
              <FeaturedStage
                item={featured}
                onOpenPrimary={() =>
                  featured
                    ? handleOpenItem(featured, 'home_featured')
                    : router.push(APP_ROUTES.tabs.videos)
                }
                onOpenSecondary={() => router.push(APP_ROUTES.tabs.videos)}
              />
            </FadeIn>

            <FadeIn delay={95}>
              <QuickDestinationRow
                onOpenRoute={(route) => router.push(route)}
              />
            </FadeIn>

            {liveItems.length ? (
              <FadeIn delay={130}>
                <RailSection title="Live now" actionLabel="See all" onPressAction={() => router.push(APP_ROUTES.tabs.videos)}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    contentContainerStyle={{ paddingRight: 8 }}
                  >
                    {liveItems.map((item) => (
                      <LiveCard
                        key={item.id}
                        item={item}
                        width={Math.max(railCardWidth + 20, 220)}
                        onOpen={() => handleOpenItem(item, 'home_live')}
                        onNotify={() => handleSubscribeLive(item)}
                      />
                    ))}
                  </ScrollView>
                </RailSection>
              </FadeIn>
            ) : null}

            <FadeIn delay={165}>
              <RailSection title="Listen now" actionLabel="Music" onPressAction={() => router.push(APP_ROUTES.tabs.player)}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                  overScrollMode="never"
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  {(listenNow.length ? listenNow : []).map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      width={railCardWidth}
                      onPress={() => handleOpenItem(item, 'home_listen_now')}
                    />
                  ))}
                </ScrollView>
              </RailSection>
            </FadeIn>

            <FadeIn delay={200}>
              <RailSection title="Watch now" actionLabel="Videos" onPressAction={() => router.push(APP_ROUTES.tabs.videos)}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                  overScrollMode="never"
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  {(watchNow.length ? watchNow : []).map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      width={railCardWidth}
                      onPress={() => handleOpenItem(item, 'home_watch_now')}
                    />
                  ))}
                </ScrollView>
              </RailSection>
            </FadeIn>

            {curatedRails.map(({ section, items }, index) => (
              <FadeIn key={section.title} delay={235 + index * 35}>
                <RailSection title={section.title} actionLabel="Open" onPressAction={() => router.push(APP_ROUTES.tabs.library)}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    contentContainerStyle={{ paddingRight: 8 }}
                  >
                    {items.map((item) => (
                      <MediaCard
                        key={`${section.title}-${item.id}`}
                        item={item}
                        width={railCardWidth}
                        onPress={() => handleOpenItem(item, 'home_curated')}
                      />
                    ))}
                  </ScrollView>
                </RailSection>
              </FadeIn>
            ))}

            <FadeIn delay={300}>
              <WordCard
                title={wordForToday.title}
                passage={wordForToday.passage}
                verse={wordForToday.verse}
                reflection={wordForToday.reflection}
                onShare={handleShareWord}
              />
            </FadeIn>

            {error ? (
              <View style={{ marginTop: 8 }}>
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

function HomeTopBar({
  onOpenSearch,
  onOpenVideos,
  onOpenProfile,
}: {
  onOpenSearch: () => void;
  onOpenVideos: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Image source={BRAND_LOGO_ASSET} style={{ width: 42, height: 42, borderRadius: 21 }} />
        <View style={{ marginLeft: 12 }}>
          <CustomText
            variant="caption"
            style={{
              color: 'rgba(217,208,196,0.66)',
              textTransform: 'uppercase',
              letterSpacing: 0.74,
            }}
          >
            ClaudyGod
          </CustomText>
          <CustomText variant="display" style={{ color: '#FFF9F0', marginTop: 2 }}>
            Home
          </CustomText>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <IconActionButton icon="search" onPress={onOpenSearch} />
        <IconActionButton icon="smart-display" onPress={onOpenVideos} />
        <IconActionButton icon="person-outline" onPress={onOpenProfile} />
      </View>
    </View>
  );
}

function IconActionButton({
  icon,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={20} color="#FFF9F0" />
    </TVTouchable>
  );
}

function FeaturedStage({
  item,
  onOpenPrimary,
  onOpenSecondary,
}: {
  item: FeedCardItem | null;
  onOpenPrimary: () => void;
  onOpenSecondary: () => void;
}) {
  const title = item?.title ?? 'New worship drops will appear here.';
  const subtitle = item?.description ?? 'Music, messages, and live sessions update here as soon as they are published.';

  return (
    <TVTouchable
      onPress={onOpenPrimary}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(12,13,16,0.84)',
      }}
      showFocusBorder={false}
    >
      <View>
        {item?.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            resizeMode="cover"
            style={{ width: '100%', height: 210 }}
          />
        ) : null}

        <View style={{ padding: 16 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: item?.isLive ? 'rgba(239,68,68,0.24)' : 'rgba(255,255,255,0.10)',
              backgroundColor: item?.isLive ? 'rgba(153,27,27,0.38)' : 'rgba(255,255,255,0.05)',
              paddingHorizontal: 8,
              paddingVertical: 5,
            }}
          >
            <CustomText
              variant="caption"
              style={{
                color: item?.isLive ? '#FFE2E2' : 'rgba(240,228,208,0.82)',
                textTransform: 'uppercase',
                letterSpacing: 0.72,
              }}
            >
              {item?.isLive ? 'Live now' : item ? typeLabel(item.type) : 'Featured'}
            </CustomText>
          </View>

          <CustomText
            variant="hero"
            style={{ color: '#FFF9F0', marginTop: 10, maxWidth: 320, fontSize: 21, lineHeight: 26 }}
            numberOfLines={2}
          >
            {title}
          </CustomText>

          <CustomText
            variant="body"
            style={{ color: 'rgba(235,227,216,0.72)', marginTop: 6, maxWidth: 300, fontSize: 13, lineHeight: 18 }}
            numberOfLines={2}
          >
            {subtitle}
          </CustomText>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <StageButton icon="play-arrow" label="Play" onPress={onOpenPrimary} filled />
            <StageButton icon="grid-view" label="Browse" onPress={onOpenSecondary} />
          </View>
        </View>
      </View>
    </TVTouchable>
  );
}

function StageButton({
  icon,
  label,
  onPress,
  filled = false,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: filled ? '#E1B662' : 'rgba(255,255,255,0.12)',
        backgroundColor: filled ? '#E1B662' : 'rgba(255,255,255,0.04)',
        paddingHorizontal: 12,
        paddingVertical: 9,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={18} color={filled ? '#1C160C' : '#FFF9F0'} />
      <CustomText variant="label" style={{ color: filled ? '#1C160C' : '#FFF9F0' }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

function QuickDestinationRow({
  onOpenRoute,
}: {
  onOpenRoute: (_route: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {QUICK_DESTINATIONS.map((item) => (
        <TVTouchable
          key={item.key}
          onPress={() => onOpenRoute(item.route)}
          style={{
            flex: 1,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.03)',
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
          showFocusBorder={false}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(187,144,63,0.14)',
              borderWidth: 1,
              borderColor: 'rgba(187,144,63,0.20)',
            }}
          >
            <MaterialIcons name={item.icon} size={15} color="#F0C87A" />
          </View>
          <CustomText variant="label" style={{ color: '#FFF9F0', marginTop: 8, fontSize: 11, lineHeight: 14 }}>
            {item.label}
          </CustomText>
        </TVTouchable>
      ))}
    </View>
  );
}

function RailSection({
  title,
  actionLabel,
  onPressAction,
  children,
}: {
  title: string;
  actionLabel: string;
  onPressAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <CustomText variant="heading" style={{ color: '#FFF9F0' }}>
          {title}
        </CustomText>
        <TVTouchable onPress={onPressAction} showFocusBorder={false}>
          <CustomText variant="caption" style={{ color: 'rgba(240,228,208,0.72)' }}>
            {actionLabel}
          </CustomText>
        </TVTouchable>
      </View>
      {children}
    </View>
  );
}

function MediaCard({
  item,
  width,
  onPress,
}: {
  item: FeedCardItem;
  width: number;
  onPress: () => void;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{ width, marginRight: 12 }}
      showFocusBorder={false}
    >
      <View
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(12,13,16,0.84)',
        }}
      >
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 152 }} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(6,7,9,0)', 'rgba(6,7,9,0.82)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 58, height: 58 }}
        />
        <View style={{ padding: 12 }}>
          <CustomText variant="label" style={{ color: '#FFF9F0' }} numberOfLines={1}>
            {item.title}
          </CustomText>
          <CustomText variant="caption" style={{ color: 'rgba(229,220,210,0.66)', marginTop: 3 }} numberOfLines={1}>
            {item.subtitle || typeLabel(item.type)}
          </CustomText>
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
        width,
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.18)',
        backgroundColor: 'rgba(26,10,10,0.72)',
      }}
    >
      <TVTouchable onPress={onOpen} showFocusBorder={false}>
        <View style={{ height: 132 }}>
          <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(6,7,9,0.90)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              borderRadius: 8,
              backgroundColor: 'rgba(220,38,38,0.88)',
              paddingHorizontal: 8,
              paddingVertical: 5,
            }}
          >
            <CustomText variant="caption" style={{ color: '#FFFFFF' }}>
              LIVE
            </CustomText>
          </View>
        </View>
      </TVTouchable>

      <View style={{ padding: 12 }}>
        <CustomText variant="label" style={{ color: '#FFF9F0' }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: 'rgba(255,220,220,0.72)', marginTop: 4 }} numberOfLines={2}>
          {item.description}
        </CustomText>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <PillAction icon="play-arrow" label="Watch" onPress={onOpen} />
          <PillAction icon="notifications-active" label="Notify" onPress={onNotify} />
        </View>
      </View>
    </View>
  );
}

function PillAction({
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 10,
        paddingVertical: 9,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={16} color="#FFF9F0" />
      <CustomText variant="caption" style={{ color: '#FFF9F0' }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

function WordCard({
  title,
  passage,
  verse,
  reflection,
  onShare,
}: {
  title: string;
  passage: string;
  verse: string;
  reflection: string;
  onShare: () => void;
}) {
  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(12,13,16,0.84)',
        padding: 18,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View>
          <CustomText
            variant="caption"
            style={{
              color: 'rgba(217,208,196,0.66)',
              textTransform: 'uppercase',
              letterSpacing: 0.72,
            }}
          >
            {title}
          </CustomText>
          <CustomText variant="label" style={{ color: '#FFF9F0', marginTop: 4 }}>
            {passage}
          </CustomText>
        </View>

        <TVTouchable
          onPress={onShare}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          showFocusBorder={false}
        >
          <MaterialIcons name="ios-share" size={18} color="#FFF9F0" />
        </TVTouchable>
      </View>

      <CustomText variant="subtitle" style={{ color: '#FFF9F0', marginTop: 14 }}>
        {verse}
      </CustomText>
      <CustomText variant="body" style={{ color: 'rgba(229,220,210,0.72)', marginTop: 8 }}>
        {reflection}
      </CustomText>
    </View>
  );
}

function getFirstAvailable(feed: FeedBundle): FeedCardItem | null {
  return (
    feed.live[0] ??
    feed.videos[0] ??
    feed.music[0] ??
    feed.recent[0] ??
    feed.playlists[0] ??
    null
  );
}

function typeLabel(type: FeedCardItem['type']) {
  if (type === 'audio') return 'Music';
  if (type === 'video') return 'Video';
  if (type === 'live') return 'Live';
  return 'Content';
}
