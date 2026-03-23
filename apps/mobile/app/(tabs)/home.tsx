import React, { useMemo } from 'react';
import { Alert, RefreshControl, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { PosterCard } from '../../components/ui/PosterCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import { BRAND_HERO_ASSET } from '../../util/brandAssets';
import { buildPlayerRoute } from '../../util/playerRoute';
import { deriveLayoutSectionItems, getHomeLayoutSections } from '../../util/mobileLayout';
import type { FeedCardItem } from '../../services/contentService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';

const WORD_FOR_TODAY_FALLBACK = {
  title: 'Word for Today',
  passage: 'Psalm 119:105',
  verse: 'Your word is a lamp to my feet and a light to my path.',
  reflection: 'Return throughout the day and keep the word close.',
};

const QUICK_LINKS = [
  { key: 'music', icon: 'graphic-eq', label: 'Music', route: APP_ROUTES.tabs.player },
  { key: 'videos', icon: 'smart-display', label: 'Videos', route: APP_ROUTES.tabs.videos },
  { key: 'library', icon: 'library-music', label: 'Library', route: APP_ROUTES.tabs.library },
] as const;

function QuickLink({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 14,
        paddingVertical: 14,
        gap: 10,
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: theme.radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(139,92,246,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.24)',
        }}
      >
        <MaterialIcons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const posterSize = isTablet ? 'lg' : 'md';

  const { feed, loading, error, refresh } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();
  const { word } = useWordOfDay();

  const featured = useMemo(() => feed.featured ?? feed.recent[0] ?? feed.music[0] ?? feed.videos[0] ?? null, [feed]);
  const continueListening = useMemo(
    () => (feed.music.length ? feed.music : feed.recent).slice(0, 8),
    [feed.music, feed.recent],
  );
  const watchNow = useMemo(
    () => (feed.videos.length ? feed.videos : feed.live).slice(0, 8),
    [feed.live, feed.videos],
  );
  const liveNow = useMemo(() => feed.live.slice(0, 6), [feed.live]);
  const homeSections = useMemo(() => getHomeLayoutSections(mobileConfig), [mobileConfig]);
  const curatedRails = useMemo(
    () =>
      homeSections
        .map((section) => ({ section, items: deriveLayoutSectionItems(feed, section) }))
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

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    router.push(buildPlayerRoute(item));
  };

  const shareWord = async () => {
    await Share.share({
      message: `${wordForToday.passage}\n\n${wordForToday.verse}\n\n${wordForToday.reflection}`,
    });
  };

  const notifyLive = async (item: FeedCardItem) => {
    await subscribeToLiveAlerts(item.notificationChannelId || item.id);
    Alert.alert('Live alerts enabled', 'You will be notified when ClaudyGod goes live.');
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
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
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge }}>
            <FadeIn>
              <BrandedHeaderCard
                title="Home"
                subtitle="New releases, live worship, and your next listen."
                actions={[
                  { icon: 'search', onPress: () => router.push(APP_ROUTES.tabs.search), accessibilityLabel: 'Search' },
                  { icon: 'person-outline', onPress: () => router.push(APP_ROUTES.profile), accessibilityLabel: 'Profile' },
                ]}
              />
            </FadeIn>

            <FadeIn delay={60}>
              <CinematicHeroCard
                imageSource={!featured ? BRAND_HERO_ASSET : undefined}
                imageUrl={featured?.imageUrl}
                badge={featured?.isLive ? 'Live now' : featured?.type === 'audio' ? 'Featured listen' : 'Featured'}
                eyebrow={featured?.subtitle ?? 'ClaudyGod'}
                title={featured?.title ?? 'Stay close to worship, messages, and live ministry.'}
                subtitle={featured?.duration ?? 'ClaudyGod'}
                description={featured?.description ?? 'Start from one featured moment, then move through the rest of the app without losing the thread.'}
                height={isTablet ? 420 : 340}
                actions={[
                  {
                    label: featured?.type === 'video' || featured?.isLive ? 'Watch now' : 'Play now',
                    onPress: () => (featured ? openItem(featured, 'home_featured') : router.push(APP_ROUTES.tabs.player)),
                    icon: featured?.type === 'video' || featured?.isLive ? 'smart-display' : 'play-arrow',
                  },
                  {
                    label: featured?.isLive ? 'Notify me' : 'Read more',
                    onPress: () =>
                      featured?.isLive
                        ? notifyLive(featured)
                        : featured
                          ? openItem(featured, 'home_featured_details')
                          : router.push(APP_ROUTES.tabs.library),
                    variant: 'secondary',
                    icon: featured?.isLive ? 'notifications-active' : 'article',
                  },
                ]}
              />
            </FadeIn>

            <FadeIn delay={100}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {QUICK_LINKS.map((link) => (
                  <QuickLink
                    key={link.key}
                    icon={link.icon}
                    label={link.label}
                    onPress={() => router.push(link.route)}
                  />
                ))}
              </View>
            </FadeIn>

            {continueListening.length ? (
              <FadeIn delay={140}>
                <View>
                  <SectionHeader
                    title="Continue listening"
                    actionLabel="Music"
                    onAction={() => router.push(APP_ROUTES.tabs.player)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {continueListening.map((item) => (
                      <PosterCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        subtitle={item.subtitle}
                        size={posterSize}
                        onPress={() => void openItem(item, 'home_continue')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {liveNow.length ? (
              <FadeIn delay={180}>
                <View>
                  <SectionHeader
                    title="Live now"
                    actionLabel="View all"
                    onAction={() => router.push(APP_ROUTES.tabs.videos)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {liveNow.map((item) => (
                      <PosterCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        subtitle={item.liveViewerCount ? `${item.liveViewerCount} watching` : item.subtitle}
                        size={posterSize}
                        onPress={() => void openItem(item, 'home_live')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {watchNow.length ? (
              <FadeIn delay={220}>
                <View>
                  <SectionHeader
                    title="Watch next"
                    actionLabel="Videos"
                    onAction={() => router.push(APP_ROUTES.tabs.videos)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {watchNow.map((item) => (
                      <PosterCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        subtitle={item.subtitle}
                        size={posterSize}
                        onPress={() => void openItem(item, 'home_watch')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ) : null}

            {curatedRails.map(({ section, items }, index) => (
              <FadeIn key={section.id || section.title} delay={260 + index * 35}>
                <View>
                  <SectionHeader
                    title={section.title}
                    actionLabel="Library"
                    onAction={() => router.push(APP_ROUTES.tabs.library)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {items.map((item) => (
                      <PosterCard
                        key={`${section.title}-${item.id}`}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        subtitle={item.subtitle}
                        size={posterSize}
                        onPress={() => void openItem(item, 'home_curated')}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ))}

            <FadeIn delay={340}>
              <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <CustomText
                      variant="caption"
                      style={{
                        color: theme.colors.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: 0.9,
                      }}
                    >
                      {wordForToday.title}
                    </CustomText>
                    <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginTop: 6 }}>
                      {wordForToday.passage}
                    </CustomText>
                    <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 8 }}>
                      {wordForToday.verse}
                    </CustomText>
                    <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 8 }}>
                      {wordForToday.reflection}
                    </CustomText>
                  </View>

                  <View style={{ justifyContent: 'flex-start' }}>
                    <AppButton
                      title="Share"
                      variant="secondary"
                      size="sm"
                      onPress={() => void shareWord()}
                      leftIcon={<MaterialIcons name="ios-share" size={16} color={theme.colors.text.primary} />}
                    />
                  </View>
                </View>
              </SurfaceCard>
            </FadeIn>

            {error ? (
              <CustomText variant="caption" style={{ color: theme.colors.danger }}>
                Feed error: {error}
              </CustomText>
            ) : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
