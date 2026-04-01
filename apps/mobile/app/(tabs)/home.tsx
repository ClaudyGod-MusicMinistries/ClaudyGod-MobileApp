import React, { useMemo, useState } from 'react';
import { Linking, RefreshControl, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { MinimalPosterCard } from '../../components/ui/MinimalPosterCard';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { ActionSheet, type ActionSheetAction } from '../../components/ui/ActionSheet';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../../util/appRoutes';
import { BRAND_HERO_ASSET } from '../../util/brandAssets';
import { buildPlayerRoute } from '../../util/playerRoute';
import { deriveLayoutSectionItems, getHomeLayoutSections } from '../../util/mobileLayout';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { saveMeLibraryItem, subscribeToLiveAlertsBackend } from '../../services/userFlowService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const WORD_FOR_TODAY_FALLBACK = {
  title: 'Word for Today',
  passage: 'Psalm 119:105',
  verse: 'Your word is a lamp to my feet and a light to my path.',
  reflection: 'Return throughout the day and keep the word close.',
};

const DEFAULT_QUICK_LINKS = [
  { key: 'music', icon: 'graphic-eq', label: 'Music', route: APP_ROUTES.tabs.player },
  { key: 'videos', icon: 'smart-display', label: 'Videos', route: APP_ROUTES.tabs.videos },
  { key: 'live', icon: 'live-tv', label: 'Live', route: APP_ROUTES.tabs.live },
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
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: theme.radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(139,92,246,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.24)',
        }}
      >
        <MaterialIcons name={icon} size={16} color={theme.colors.primary} />
      </View>
      <CustomText variant="label" style={{ color: theme.colors.text }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const posterSize = isTablet ? 'md' : 'sm';
  const [activeActionItem, setActiveActionItem] = useState<FeedCardItem | null>(null);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

  const { feed, loading, error, refresh } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();
  const { word } = useWordOfDay();

  const featured = useMemo(() => feed.featured ?? feed.recent[0] ?? feed.music[0] ?? feed.videos[0] ?? null, [feed]);
  const homeSections = useMemo(() => getHomeLayoutSections(mobileConfig), [mobileConfig]);
  const sponsoredItem = useMemo(() => feed.ads[0] ?? null, [feed]);
  const sponsoredLabel = mobileConfig?.monetization?.disclosureLabel || 'Sponsored';
  const liveAlertTarget = useMemo(
    () => feed.live[0] ?? (featured?.isLive ? featured : null) ?? feed.videos[0] ?? null,
    [feed.live, feed.videos, featured],
  );
  const curatedRails = useMemo(
    () =>
      homeSections
        .map((section) => ({ section, items: deriveLayoutSectionItems(feed, section) }))
        .filter((entry) => entry.items.length > 0)
        .slice(0, 5),
    [feed, homeSections],
  );
  const quickLinks = useMemo(() => {
    const tabs = mobileConfig?.navigation?.tabs ?? [];
    const configuredLinks = tabs
      .filter((tab) => tab.id === 'player' || tab.id === 'videos' || tab.id === 'live')
      .map((tab) => ({
        key: tab.id,
        icon: tab.icon as React.ComponentProps<typeof MaterialIcons>['name'],
        label: tab.label,
        route: TAB_ROUTE_BY_ID[tab.id],
      }));

    return configuredLinks.length ? configuredLinks : DEFAULT_QUICK_LINKS;
  }, [mobileConfig]);

  const formatMeta = (item: FeedCardItem) =>
    [item.subtitle, item.duration].filter((value) => Boolean(value)).join(' · ');

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
    try {
      await subscribeToLiveAlertsBackend(item.notificationChannelId || item.id, item.title);
      showToast({
        title: 'Live alerts enabled',
        message: 'You will be notified when ClaudyGod goes live.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Live alerts unavailable',
        message: 'Sign in to follow live sessions.',
        tone: 'warning',
      });
    }
  };

  const notifyLiveGeneral = async () => {
    try {
      await subscribeToLiveAlertsBackend(
        liveAlertTarget?.notificationChannelId || liveAlertTarget?.id || 'claudygod-live',
        liveAlertTarget?.title ?? 'ClaudyGod',
      );
      showToast({
        title: 'Live alerts enabled',
        message: 'You will be notified when ClaudyGod goes live.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Live alerts unavailable',
        message: 'Sign in to follow live sessions.',
        tone: 'warning',
      });
    }
  };

  const openMoreForItem = (item: FeedCardItem) => {
    setActiveActionItem(item);
    setIsActionSheetVisible(true);
  };

  const shareActive = async () => {
    if (!activeActionItem) return;
    try {
      await Share.share({
        message: `${activeActionItem.title}\n${activeActionItem.subtitle}${activeActionItem.mediaUrl ? `\n${activeActionItem.mediaUrl}` : ''}`,
      });
    } catch {
      showToast({
        title: 'Share unavailable',
        message: 'Try again in a moment.',
        tone: 'warning',
      });
    }
  };

  const saveToLibrary = async () => {
    if (!activeActionItem) return;
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in to save',
        message: 'Create an account to save items to your library.',
        tone: 'warning',
      });
      return;
    }
    try {
      await saveMeLibraryItem({
        bucket: 'liked',
        contentId: activeActionItem.id,
        contentType: activeActionItem.type,
        title: activeActionItem.title,
        subtitle: activeActionItem.subtitle,
        description: activeActionItem.description,
        imageUrl: activeActionItem.imageUrl,
        mediaUrl: activeActionItem.mediaUrl,
        duration: activeActionItem.duration,
        metadata: { source: 'home_action_sheet' },
      });
      showToast({
        title: 'Saved to Library',
        message: 'We saved this for you.',
        tone: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Save unavailable',
        message: error instanceof Error ? error.message : 'Please try again.',
        tone: 'warning',
      });
    }
  };

  const listenLater = async () => {
    if (!activeActionItem) return;
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in to save',
        message: 'Create an account to use Listen Later.',
        tone: 'warning',
      });
      return;
    }
    try {
      await saveMeLibraryItem({
        bucket: 'playlist',
        playlistName: 'Listen Later',
        contentId: activeActionItem.id,
        contentType: activeActionItem.type,
        title: activeActionItem.title,
        subtitle: activeActionItem.subtitle,
        description: activeActionItem.description,
        imageUrl: activeActionItem.imageUrl,
        mediaUrl: activeActionItem.mediaUrl,
        duration: activeActionItem.duration,
        metadata: { source: 'home_action_sheet' },
      });
      showToast({
        title: 'Added to Listen Later',
        message: 'We saved this for you.',
        tone: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Listen later unavailable',
        message: error instanceof Error ? error.message : 'Please try again.',
        tone: 'warning',
      });
    }
  };

  const followActiveLive = async () => {
    if (!activeActionItem) return;
    try {
      await subscribeToLiveAlertsBackend(activeActionItem.notificationChannelId || activeActionItem.id, activeActionItem.title);
      showToast({
        title: 'Live alerts enabled',
        message: `You will be notified when ${activeActionItem.title} goes live.`,
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Live alerts unavailable',
        message: 'Sign in to follow live sessions.',
        tone: 'warning',
      });
    }
  };

  const openReviews = () => {
    router.push(APP_ROUTES.settingsPages.rate);
  };

  const actionSheetActions: ActionSheetAction[] = !activeActionItem
    ? []
    : [
        {
          key: 'save',
          label: 'Save to Library',
          detail: 'Keep this item in your library.',
          icon: 'bookmark-border',
          onPress: () => void saveToLibrary(),
        },
        {
          key: 'share',
          label: 'Share',
          detail: 'Send this to someone else.',
          icon: 'ios-share',
          onPress: () => void shareActive(),
        },
        {
          key: 'listen-later',
          label: 'Listen Later',
          detail: 'Save this for later.',
          icon: 'schedule',
          onPress: () => void listenLater(),
        },
        {
          key: 'reviews',
          label: 'Reviews & Ratings',
          detail: 'See what others are saying.',
          icon: 'reviews',
          onPress: openReviews,
        },
        ...(activeActionItem.type === 'live'
          ? [
              {
                key: 'follow-live',
                label: 'Follow Live Alerts',
                detail: 'Get notified before the stream starts.',
                icon: 'notifications-active',
                onPress: () => void followActiveLive(),
              } as ActionSheetAction,
            ]
          : []),
        {
          key: 'open-detail',
          label: 'Open Player',
          detail: 'Open the full player screen.',
          icon: 'open-in-full',
          tone: 'accent' as const,
          onPress: () => {
            router.push(buildPlayerRoute(activeActionItem));
          },
        },
      ];

  const openSponsoredItem = async (item: FeedCardItem) => {
    const target = item.ctaUrl || item.mediaUrl;
    if (!target) {
      return;
    }

    await trackPlayEvent({
      contentId: item.campaignId || item.id,
      contentType: 'ad',
      title: item.title,
      source: 'home_sponsored',
    });

    await Linking.openURL(target);
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
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge + 4 }}>
            <FadeIn>
              <BrandedHeaderCard
                title="Home"
                subtitle={isTablet ? 'New releases, live worship, and your next listen.' : undefined}
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
                description={
                  isTablet
                    ? featured?.description ??
                      'Start from one featured moment, then move through the rest of the app without losing the thread.'
                    : undefined
                }
                height={isTablet ? 420 : 310}
                actions={
                  isTablet
                    ? [
                        {
                          label: featured?.type === 'video' || featured?.isLive ? 'Watch now' : 'Play now',
                          onPress: () =>
                            featured ? openItem(featured, 'home_featured') : router.push(APP_ROUTES.tabs.player),
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
                      ]
                    : [
                        {
                          label: featured?.type === 'video' || featured?.isLive ? 'Watch now' : 'Play now',
                          onPress: () =>
                            featured ? openItem(featured, 'home_featured') : router.push(APP_ROUTES.tabs.player),
                          icon: featured?.type === 'video' || featured?.isLive ? 'smart-display' : 'play-arrow',
                        },
                      ]
                }
              />
            </FadeIn>

            <FadeIn delay={100}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {quickLinks.map((link) => (
                  <QuickLink
                    key={link.key}
                    icon={link.icon}
                    label={link.label}
                    onPress={() => router.push(link.route)}
                  />
                ))}
              </View>
            </FadeIn>

            {curatedRails.slice(0, 2).map(({ section, items }, index) => (
              <FadeIn key={section.id || section.title} delay={110 + index * 35}>
                <View>
                  <SectionHeader
                    title={section.title}
                    actionLabel={section.actionLabel}
                    onAction={() => router.push(TAB_ROUTE_BY_ID[section.destinationTab])}
                  />
                  {section.subtitle && isTablet ? (
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                      {section.subtitle}
                    </CustomText>
                  ) : null}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {items.map((item) => (
                      <MinimalPosterCard
                        key={`${section.title}-${item.id}`}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        meta={formatMeta(item)}
                        size={posterSize}
                        onPress={() => void openItem(item, 'home_curated')}
                        showMore
                        onMorePress={() => openMoreForItem(item)}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ))}

            <FadeIn delay={190}>
              <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />
            </FadeIn>

            {sponsoredItem ? (
              <FadeIn delay={120}>
                <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
                  <View style={{ gap: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <CustomText
                          variant="caption"
                          style={{
                            color: theme.colors.primary,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                          }}
                        >
                          {sponsoredLabel}
                        </CustomText>
                        <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 6 }}>
                          {sponsoredItem.title}
                        </CustomText>
                        <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                          {sponsoredItem.sponsorName || sponsoredItem.subtitle}
                        </CustomText>
                        <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
                          {sponsoredItem.description}
                        </CustomText>
                      </View>

                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: theme.radius.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(139,92,246,0.16)',
                          borderWidth: 1,
                          borderColor: 'rgba(139,92,246,0.28)',
                        }}
                      >
                        <MaterialIcons name="campaign" size={20} color={theme.colors.primary} />
                      </View>
                    </View>

                    <AppButton
                      title={sponsoredItem.ctaLabel || 'Open'}
                      onPress={() => void openSponsoredItem(sponsoredItem)}
                      size="sm"
                      leftIcon={<MaterialIcons name="open-in-new" size={16} color={theme.colors.textInverse} />}
                    />
                  </View>
                </SurfaceCard>
              </FadeIn>
            ) : null}

            {curatedRails.slice(2, 5).map(({ section, items }, index) => (
              <FadeIn key={section.id || section.title} delay={220 + index * 35}>
                <View>
                  <SectionHeader
                    title={section.title}
                    actionLabel={section.actionLabel}
                    onAction={() => router.push(TAB_ROUTE_BY_ID[section.destinationTab])}
                  />
                  {section.subtitle && isTablet ? (
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                      {section.subtitle}
                    </CustomText>
                  ) : null}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {items.map((item) => (
                      <MinimalPosterCard
                        key={`${section.title}-${item.id}`}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        meta={formatMeta(item)}
                        size={posterSize}
                        onPress={() => void openItem(item, 'home_curated')}
                        showMore
                        onMorePress={() => openMoreForItem(item)}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeIn>
            ))}

            <FadeIn delay={320}>
              <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: theme.colors.textSecondary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.9,
                        }}
                      >
                        Live alerts
                      </CustomText>
                      <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 6 }}>
                        Get notified when we go live
                      </CustomText>
                      <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
                        Turn on alerts so you never miss a worship moment.
                      </CustomText>
                    </View>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: theme.radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(34,197,94,0.12)',
                        borderWidth: 1,
                        borderColor: 'rgba(34,197,94,0.2)',
                      }}
                    >
                      <MaterialIcons name="notifications-active" size={22} color={theme.colors.success} />
                    </View>
                  </View>
                  <AppButton
                    title="Notify me"
                    variant="secondary"
                    onPress={() => void notifyLiveGeneral()}
                    leftIcon={<MaterialIcons name="notifications" size={16} color={theme.colors.text} />}
                  />
                </View>
              </SurfaceCard>
            </FadeIn>

            <FadeIn delay={340}>
              <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <CustomText
                      variant="caption"
                      style={{
                        color: theme.colors.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: 0.9,
                      }}
                    >
                      {wordForToday.title}
                    </CustomText>
                    <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 6 }}>
                      {wordForToday.passage}
                    </CustomText>
                    <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }} numberOfLines={3}>
                      {wordForToday.verse}
                    </CustomText>
                  </View>

                  <View style={{ justifyContent: 'flex-start' }}>
                    <AppButton
                      title="Share"
                      variant="secondary"
                      size="sm"
                      onPress={() => void shareWord()}
                      leftIcon={<MaterialIcons name="ios-share" size={16} color={theme.colors.text} />}
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
      <ActionSheet
        visible={isActionSheetVisible}
        title={activeActionItem?.title ?? 'Content options'}
        description={activeActionItem?.subtitle}
        actions={actionSheetActions}
        onClose={() => setIsActionSheetVisible(false)}
      />
    </TabScreenWrapper>
  );
}
