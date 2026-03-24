import React, { useMemo } from 'react';
import { Image, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/layout/Screen';
import { CustomText } from '../components/CustomText';
import { FadeIn } from '../components/ui/FadeIn';
import { TVTouchable } from '../components/ui/TVTouchable';
import { AppButton } from '../components/ui/AppButton';
import { CinematicHeroCard } from '../components/sections/CinematicHeroCard';
import { useContentFeed } from '../hooks/useContentFeed';
import { useMobileAppConfig } from '../hooks/useMobileAppConfig';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../util/appRoutes';
import { BRAND_HERO_ASSET, BRAND_LOGO_ASSET } from '../util/brandAssets';
import type { FeedCardItem } from '../services/contentService';

const LANDING_COLORS = {
  background: '#05040A',
  panel: 'rgba(11,10,18,0.94)',
  panelStrong: 'rgba(15,13,24,0.98)',
  border: 'rgba(255,255,255,0.08)',
  textPrimary: '#F7F4FF',
  textSecondary: 'rgba(208,200,232,0.72)',
  accent: '#8D63FF',
  accentSoft: 'rgba(141,99,255,0.14)',
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
        minWidth: 0,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: LANDING_COLORS.border,
        backgroundColor: LANDING_COLORS.panel,
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
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: LANDING_COLORS.accentSoft,
          borderWidth: 1,
          borderColor: 'rgba(141,99,255,0.22)',
        }}
      >
        <MaterialIcons name={icon} size={18} color={LANDING_COLORS.accent} />
      </View>
      <CustomText variant="label" style={{ color: LANDING_COLORS.textPrimary }}>
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
      <CustomText variant="label" style={{ color: LANDING_COLORS.textPrimary }}>
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
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
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
  const heroTitle = featured?.title ?? 'Music, messages, and live worship in one place.';
  const heroSubtitle = featured?.subtitle ?? 'ClaudyGod Ministries';
  const heroDescription =
    featured?.description?.trim() || 'Stream worship, ministry videos, and live moments from one connected experience.';

  return (
    <View style={{ flex: 1, backgroundColor: LANDING_COLORS.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={LANDING_COLORS.background} />

      <LinearGradient
        colors={['rgba(141,99,255,0.18)', 'rgba(141,99,255,0)', 'rgba(5,4,10,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: LANDING_COLORS.background }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: LANDING_COLORS.background }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: isTablet ? 30 : 22 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                paddingTop: isTablet ? 26 : 18,
                justifyContent: 'space-between',
                gap: isTablet ? 26 : 20,
              }}
            >
              <FadeIn>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: LANDING_COLORS.border,
                        backgroundColor: LANDING_COLORS.panel,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image source={BRAND_LOGO_ASSET} style={{ width: 24, height: 24, borderRadius: 8 }} />
                    </View>

                    <View>
                      <CustomText
                        variant="caption"
                        style={{
                          color: LANDING_COLORS.textSecondary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.75,
                        }}
                      >
                        ClaudyGod
                      </CustomText>
                      <CustomText variant="label" style={{ color: LANDING_COLORS.textPrimary, marginTop: 2 }}>
                        Ministries
                      </CustomText>
                    </View>
                  </View>

                  <AppButton
                    title="Sign In"
                    variant="secondary"
                    size="sm"
                    onPress={() => router.push(APP_ROUTES.auth.signIn)}
                    style={{
                      borderColor: LANDING_COLORS.border,
                      backgroundColor: LANDING_COLORS.panelStrong,
                    }}
                    textColor={LANDING_COLORS.textPrimary}
                  />
                </View>
              </FadeIn>

              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View
                  style={{
                    flexDirection: isTablet ? 'row' : 'column',
                    alignItems: 'stretch',
                    gap: isTablet ? 24 : 18,
                  }}
                >
                  <View
                    style={{
                      flex: isTablet ? 0.88 : undefined,
                      justifyContent: 'center',
                      gap: 16,
                      paddingTop: isTablet ? 22 : 6,
                    }}
                  >
                    <FadeIn delay={50}>
                      <View style={{ gap: 8 }}>
                        <CustomText
                          variant="caption"
                          style={{
                            color: LANDING_COLORS.accent,
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                          }}
                        >
                          ClaudyGod stream
                        </CustomText>
                        <CustomText variant="hero" style={{ color: LANDING_COLORS.textPrimary }}>
                          Worship, music, and live ministry without the clutter.
                        </CustomText>
                        <CustomText variant="body" style={{ color: LANDING_COLORS.textSecondary }}>
                          Start from the latest featured moment, then move through music, videos, and live worship in one flow.
                        </CustomText>
                      </View>
                    </FadeIn>

                    <FadeIn delay={90}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        <AppButton
                          title="Create Account"
                          size="md"
                          onPress={() => router.push(APP_ROUTES.auth.signUp)}
                        />
                        <AppButton
                          title="Sign In"
                          variant="secondary"
                          size="md"
                          onPress={() => router.push(APP_ROUTES.auth.signIn)}
                          style={{
                            borderColor: LANDING_COLORS.border,
                            backgroundColor: LANDING_COLORS.panel,
                          }}
                          textColor={LANDING_COLORS.textPrimary}
                        />
                      </View>
                    </FadeIn>

                    <FadeIn delay={130}>
                      <View style={{ gap: 12 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <CustomText variant="heading" style={{ color: LANDING_COLORS.textPrimary }}>
                            Preview the app
                          </CustomText>
                          <CustomText
                            variant="caption"
                            style={{
                              color: LANDING_COLORS.textSecondary,
                              textTransform: 'uppercase',
                              letterSpacing: 0.75,
                            }}
                          >
                            Live preview
                          </CustomText>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          {previewLinks.map((destination) => (
                            <DestinationCard
                              key={destination.key}
                              icon={destination.icon}
                              label={destination.label}
                              onPress={() => router.push(destination.route)}
                            />
                          ))}
                        </View>
                      </View>
                    </FadeIn>
                  </View>

                  <FadeIn delay={80}>
                    <View style={{ flex: isTablet ? 1.04 : undefined }}>
                      <CinematicHeroCard
                        imageSource={!featured ? BRAND_HERO_ASSET : undefined}
                        imageUrl={featured?.imageUrl}
                        height={isTablet ? 500 : 390}
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
                </View>
              </View>

              <FadeIn delay={170}>
                <View
                  style={{
                    marginTop: 'auto',
                    borderTopWidth: 1,
                    borderTopColor: LANDING_COLORS.border,
                    backgroundColor: LANDING_COLORS.panel,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: isTablet ? 'row' : 'column',
                    justifyContent: 'space-between',
                    alignItems: isTablet ? 'center' : 'flex-start',
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <CustomText
                      variant="caption"
                      style={{
                        color: LANDING_COLORS.accent,
                        textTransform: 'uppercase',
                        letterSpacing: 0.75,
                      }}
                    >
                      Now inside ClaudyGod
                    </CustomText>
                    <CustomText variant="body" style={{ color: LANDING_COLORS.textSecondary }}>
                      Music, videos, and live worship in one connected flow.
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
