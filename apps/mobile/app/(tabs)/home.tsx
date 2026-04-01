import React, { useMemo } from 'react';
import { Linking, RefreshControl, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { DashboardFooter } from '../../components/layout/DashboardFooter';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { MinimalPosterCard } from '../../components/ui/MinimalPosterCard';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
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
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../../util/appRoutes';
import { BRAND_HERO_ASSET } from '../../util/brandAssets';
import { buildPlayerRoute } from '../../util/playerRoute';
import { deriveLayoutSectionItems, getHomeLayoutSections } from '../../util/mobileLayout';
import type { FeedCardItem } from '../../services/contentService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';
import { useToast } from '../../context/ToastContext';

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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const posterSize = isTablet ? 'md' : 'sm';

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
      await subscribeToLiveAlerts(item.notificationChannelId || item.id);
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
      await subscribeToLiveAlerts(liveAlertTarget?.notificationChannelId || liveAlertTarget?.id || 'claudygod-live');
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
                  {section.subtitle ? (
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
                        size={posterSize}
                        onPress={() => void openItem(item, 'home_curated')}
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
                  {section.subtitle ? (
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
                        size={posterSize}
                        onPress={() => void openItem(item, 'home_curated')}
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

            <FadeIn delay={400}>
              <DashboardFooter
                onSupportPress={() => router.push(APP_ROUTES.settingsPages.donate)}
                onLiveAlertsPress={() => void notifyLiveGeneral()}
                onFeedbackPress={() => router.push(APP_ROUTES.settingsPages.help)}
              />
            </FadeIn>
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
