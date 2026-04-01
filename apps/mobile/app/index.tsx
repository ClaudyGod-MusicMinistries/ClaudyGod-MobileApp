import React, { useMemo } from 'react';
import { Image, ImageBackground, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/layout/Screen';
import { useGuestMode } from '../context/GuestModeContext';
import { CustomText } from '../components/CustomText';
import { FadeIn } from '../components/ui/FadeIn';
import { TVTouchable } from '../components/ui/TVTouchable';
import { AppButton } from '../components/ui/AppButton';
import { CinematicHeroCard } from '../components/sections/CinematicHeroCard';
import { useContentFeed } from '../hooks/useContentFeed';
import { useMobileAppConfig } from '../hooks/useMobileAppConfig';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../util/appRoutes';
import { BRAND_HERO_ASSET, BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';
import type { FeedCardItem } from '../services/contentService';

const LANDING_COLORS = {
  background: '#0A0612',
  panel: 'rgba(26,20,47,0.80)',
  panelStrong: 'rgba(38,33,47,0.90)',
  border: 'rgba(167,139,250,0.15)',
  textPrimary: '#F5F3FF',
  textSecondary: 'rgba(184,180,212,0.75)',
  accent: '#A78BFA',
  accentSoft: 'rgba(167,139,250,0.12)',
};

const DEFAULT_PREVIEW_LINKS = [
  { key: 'player', icon: 'graphic-eq', label: 'Music', route: APP_ROUTES.tabs.player },
  { key: 'videos', icon: 'smart-display', label: 'Videos', route: APP_ROUTES.tabs.videos },
  { key: 'live', icon: 'live-tv', label: 'Live', route: APP_ROUTES.tabs.live },
] as const;

function DestinationCard({
  icon,
  label,
  onPress,
  compact = false,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: compact ? 12 : 14,
        borderWidth: 1,
        borderColor: LANDING_COLORS.border,
        backgroundColor: LANDING_COLORS.panel,
        paddingHorizontal: compact ? 12 : 14,
        paddingVertical: compact ? 12 : 14,
        gap: compact ? 8 : 10,
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: compact ? 30 : 34,
          height: compact ? 30 : 34,
          borderRadius: compact ? 9 : 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: LANDING_COLORS.accentSoft,
          borderWidth: 1,
          borderColor: 'rgba(141,99,255,0.22)',
        }}
      >
        <MaterialIcons name={icon} size={compact ? 16 : 18} color={LANDING_COLORS.accent} />
      </View>
      <CustomText
        variant="label"
        style={{ color: LANDING_COLORS.textPrimary, fontSize: compact ? 10.5 : undefined }}
      >
        {label}
      </CustomText>
    </TVTouchable>
  );
}

function FooterLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      showFocusBorder={false}
      style={{
        minHeight: 36,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: LANDING_COLORS.border,
        backgroundColor: LANDING_COLORS.panelStrong,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CustomText
        variant="label"
        style={{ color: LANDING_COLORS.textPrimary, fontSize: 10.5, fontWeight: '500' }}
      >
        {label}
      </CustomText>
    </TVTouchable>
  );
}

function getLandingBadge(item: FeedCardItem | null) {
  if (!item) return 'ClaudyGod';
  if (item.isLive || item.type === 'live') return 'Live now';
  if (item.type === 'video') return 'Featured video';
  if (item.type === 'playlist') return 'Featured playlist';
  return 'Featured music';
}

function getLandingPrimaryAction(item: FeedCardItem | null) {
  if (!item) {
    return {
      label: 'Browse music',
      route: APP_ROUTES.tabs.player,
      icon: 'graphic-eq' as const,
    };
  }

  if (item.isLive || item.type === 'live') {
    return {
      label: 'Watch live',
      route: APP_ROUTES.tabs.live,
      icon: 'live-tv' as const,
    };
  }

  if (item.type === 'video') {
    return {
      label: 'Watch now',
      route: APP_ROUTES.tabs.videos,
      icon: 'smart-display' as const,
    };
  }

  return {
    label: 'Play now',
    route: APP_ROUTES.tabs.player,
    icon: 'play-arrow' as const,
  };
}

export default function LandingScreen() {
  const router = useRouter();
  const { enterGuestMode } = useGuestMode();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const isPhone = width < 900;
  const isCompactPhone = width < 430;
  const { feed } = useContentFeed();
  const { config } = useMobileAppConfig();

  const featured = useMemo(
    () => feed.featured ?? feed.live[0] ?? feed.music[0] ?? feed.videos[0] ?? null,
    [feed.featured, feed.live, feed.music, feed.videos],
  );

  const previewLinks = useMemo(() => {
    const configured = (config?.navigation?.tabs ?? [])
      .filter((tab) => tab.id === 'player' || tab.id === 'videos' || tab.id === 'live')
      .map((tab) => ({
        key: tab.id,
        icon: tab.icon as React.ComponentProps<typeof MaterialIcons>['name'],
        label: tab.label,
        route: TAB_ROUTE_BY_ID[tab.id],
      }));

    return configured.length ? configured : DEFAULT_PREVIEW_LINKS;
  }, [config]);

  const heroAction = getLandingPrimaryAction(featured);
  const heroTitle = featured?.title ?? 'Worship, Music & Ministry\nUnified';
  const heroSubtitle = featured?.subtitle ?? 'ClaudyGod';
  const heroDescription =
    featured?.description?.trim() || 'Experience the ultimate platform for worship, music, and live ministry in one beautifully designed space. Stream, discover, and connect with your community.';
  const shellGap = isTablet ? 18 : 12;

  const headlineBlock = (
    <FadeIn delay={isPhone ? 80 : 50}>
      <View style={{ gap: isCompactPhone ? 8 : 12 }}>
        <CustomText 
          variant="hero" 
          style={{ 
            color: LANDING_COLORS.textPrimary,
            fontSize: isCompactPhone ? 24 : 30,
            fontWeight: '600',
            lineHeight: isCompactPhone ? 30 : 36,
          }}
        >
          Stream the ministry
        </CustomText>
        <CustomText
          variant="body"
          style={{
            color: LANDING_COLORS.textSecondary,
            maxWidth: isTablet ? 540 : '100%',
            fontSize: 12.5,
            lineHeight: 19,
          }}
          numberOfLines={isPhone ? 3 : 4}
        >
          Music, messages, and live worship in one calm experience.
        </CustomText>
      </View>
    </FadeIn>
  );

  const actionBlock = (
    <FadeIn delay={isPhone ? 110 : 90}>
      <View style={{ gap: 10 }}>
        <AppButton
          title="Get Started"
          size="md"
          onPress={() => router.push(APP_ROUTES.auth.signUp)}
          fullWidth
          style={{ borderRadius: 10 }}
        />
        <AppButton
          title="Browse as Guest"
          variant="secondary"
          size="md"
          onPress={() => {
            enterGuestMode();
            requestAnimationFrame(() => router.replace(APP_ROUTES.tabs.home));
          }}
          fullWidth
          style={{
            borderColor: LANDING_COLORS.border,
            backgroundColor: LANDING_COLORS.panel,
            borderRadius: 10,
          }}
          textColor={LANDING_COLORS.textPrimary}
        />
      </View>
    </FadeIn>
  );

  const quickAccessRail = (
    <FadeIn delay={isPhone ? 130 : 130}>
      <View style={{ gap: 12 }}>
        <CustomText
          variant="caption"
          style={{
            color: LANDING_COLORS.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: '600',
            fontSize: 11,
          }}
        >
          Explore
        </CustomText>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {previewLinks.map((destination) => (
            <DestinationCard
              key={destination.key}
              icon={destination.icon}
              label={destination.label}
              onPress={() => router.push(destination.route)}
              compact={isPhone}
            />
          ))}
        </View>
      </View>
    </FadeIn>
  );

  const heroCard = (
    <FadeIn delay={isPhone ? 40 : 80}>
      <View style={{ flex: isTablet ? 1.04 : undefined }}>
        <CinematicHeroCard
          imageSource={!featured ? BRAND_HERO_ASSET : undefined}
          imageUrl={featured?.imageUrl}
          height={isTablet ? 500 : isCompactPhone ? 330 : 352}
          badge={getLandingBadge(featured)}
          eyebrow={heroSubtitle}
          title={heroTitle}
          subtitle={featured?.duration ?? 'ClaudyGod Ministries'}
          description={heroDescription}
          actions={[
            {
              label: heroAction.label,
              onPress: () => router.push(heroAction.route),
              icon: heroAction.icon,
            },
            {
              label: 'Create Account',
              onPress: () => router.push(APP_ROUTES.auth.signUp),
              variant: 'secondary',
              icon: 'person-add',
            },
          ]}
        />
      </View>
    </FadeIn>
  );

  return (
    <View style={{ flex: 1, backgroundColor: LANDING_COLORS.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={LANDING_COLORS.background} />

      <ImageBackground source={LANDING_BG_ASSET} style={{ flex: 1 }} resizeMode="cover">
        <LinearGradient
          colors={['rgba(8,6,14,0.92)', 'rgba(8,6,14,0.75)', 'rgba(8,6,14,0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
            <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
              <View style={{ flex: 1, paddingTop: isTablet ? 18 : 8, gap: shellGap }}>
            <FadeIn>
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: LANDING_COLORS.border,
                  backgroundColor: LANDING_COLORS.panelStrong,
                  paddingHorizontal: isTablet ? 18 : 14,
                  paddingVertical: isTablet ? 14 : 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View
                    style={{
                      width: isTablet ? 44 : 38,
                      height: isTablet ? 44 : 38,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: LANDING_COLORS.border,
                      backgroundColor: LANDING_COLORS.panel,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image
                      source={BRAND_LOGO_ASSET}
                      style={{ width: isTablet ? 24 : 22, height: isTablet ? 24 : 22, borderRadius: 8 }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <CustomText
                      variant="label"
                      style={{ color: LANDING_COLORS.textPrimary }}
                      numberOfLines={1}
                    >
                      ClaudyGod Ministries
                    </CustomText>
                    <CustomText
                      variant="caption"
                      style={{
                        color: LANDING_COLORS.textSecondary,
                        marginTop: 2,
                        letterSpacing: 0.45,
                      }}
                      numberOfLines={1}
                    >
                      Worship, music, video, and live ministry
                    </CustomText>
                  </View>
                </View>

                <TVTouchable
                  onPress={() => router.push(APP_ROUTES.auth.signIn)}
                  showFocusBorder={false}
                  style={{
                    minHeight: 32,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: LANDING_COLORS.border,
                    backgroundColor: LANDING_COLORS.panel,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CustomText variant="label" style={{ color: LANDING_COLORS.textPrimary, fontSize: 10 }}>
                    Sign In
                  </CustomText>
                </TVTouchable>
              </View>
            </FadeIn>

            <ScrollView
              style={{ flex: 1, backgroundColor: LANDING_COLORS.background }}
              contentContainerStyle={{ paddingBottom: isTablet ? 14 : 10, gap: isTablet ? 18 : 14 }}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
            >
              <View style={{ flex: 1, justifyContent: 'center' }}>
                {isTablet ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'stretch',
                      gap: 24,
                    }}
                  >
                    <View
                      style={{
                        flex: 0.88,
                        justifyContent: 'center',
                        gap: 16,
                        paddingTop: 22,
                      }}
                    >
                      {headlineBlock}
                      {actionBlock}
                      {quickAccessRail}
                    </View>
                    {heroCard}
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {heroCard}
                    <View
                      style={{
                        gap: 12,
                        paddingHorizontal: 2,
                        alignItems: 'center',
                      }}
                    >
                      {headlineBlock}
                      <View
                        style={{
                          width: '100%',
                          borderWidth: 1,
                          borderColor: LANDING_COLORS.border,
                          backgroundColor: LANDING_COLORS.panelStrong,
                          borderRadius: 14,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                        }}
                      >
                        {actionBlock}
                      </View>
                      {quickAccessRail}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <FadeIn delay={170}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: LANDING_COLORS.border,
                  backgroundColor: LANDING_COLORS.panelStrong,
                  borderRadius: 16,
                  paddingHorizontal: isPhone ? 12 : 16,
                  paddingVertical: isPhone ? 10 : 14,
                  flexDirection: isTablet ? 'row' : 'column',
                  justifyContent: 'space-between',
                  alignItems: isTablet ? 'center' : 'flex-start',
                  gap: isPhone ? 8 : 12,
                }}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <CustomText
                    variant="caption"
                    style={{
                      color: LANDING_COLORS.accent,
                      textTransform: 'uppercase',
                      letterSpacing: 0.75,
                      fontSize: 10,
                    }}
                  >
                    Go straight to
                  </CustomText>
                  <CustomText
                    variant="body"
                    style={{ color: LANDING_COLORS.textSecondary, fontSize: 11 }}
                    numberOfLines={isPhone ? 1 : 2}
                  >
                    Music, videos, and live worship.
                  </CustomText>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {previewLinks.map((link) => (
                    <FooterLink key={`footer-${link.key}`} label={link.label} onPress={() => router.push(link.route)} />
                  ))}
                </View>
              </View>
            </FadeIn>
              </View>
            </Screen>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
