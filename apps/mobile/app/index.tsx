import React, { useMemo } from 'react';
import { Image, ImageBackground, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Screen } from '../components/layout/Screen';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { TVTouchable } from '../components/ui/TVTouchable';
import { FadeIn } from '../components/ui/FadeIn';
import { useGuestMode } from '../context/GuestModeContext';
import { useContentFeed } from '../hooks/useContentFeed';
import { useAppTheme } from '../util/colorScheme';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET, DEFAULT_CONTENT_IMAGE_URI } from '../util/brandAssets';

const ENTRY_LINKS = [
  { label: 'Music', icon: 'graphic-eq' as const, route: APP_ROUTES.tabs.player },
  { label: 'Videos', icon: 'smart-display' as const, route: APP_ROUTES.tabs.videos },
  { label: 'Live', icon: 'live-tv' as const, route: APP_ROUTES.tabs.live },
  { label: 'Search', icon: 'search' as const, route: APP_ROUTES.tabs.search },
];

export default function LandingScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { enterGuestMode } = useGuestMode();
  const { feed } = useContentFeed();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1080;
  const isCompact = width < 390;

  const featured = useMemo(
    () => feed.featured ?? feed.live[0] ?? feed.music[0] ?? feed.videos[0] ?? feed.recent[0] ?? null,
    [feed.featured, feed.live, feed.music, feed.recent, feed.videos],
  );

  const startAsGuest = () => {
    enterGuestMode();
    router.replace('/guest-welcome');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#07040D' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#07040D" />
      <ImageBackground source={LANDING_BG_ASSET} style={{ flex: 1 }} resizeMode="cover">
        <LinearGradient
          colors={['rgba(7,4,13,0.96)', 'rgba(16,10,30,0.90)', 'rgba(7,4,13,1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <Screen contentStyle={{ flexGrow: 1 }}>
                <View style={{ flex: 1, paddingTop: isTablet ? 22 : 12, gap: isTablet ? 28 : 20 }}>
                  <FadeIn>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.10)',
                        backgroundColor: 'rgba(255,255,255,0.055)',
                        paddingHorizontal: isCompact ? 12 : 16,
                        paddingVertical: 12,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(183,148,246,0.16)',
                            borderWidth: 1,
                            borderColor: 'rgba(183,148,246,0.28)',
                          }}
                        >
                          <Image source={BRAND_LOGO_ASSET} style={{ width: 28, height: 28, borderRadius: 9 }} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <CustomText variant="label" style={{ color: '#FFFFFF' }} numberOfLines={1}>
                            ClaudyGod Ministries
                          </CustomText>
                          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.62)', marginTop: 2 }} numberOfLines={1}>
                            Worship, videos, and live ministry
                          </CustomText>
                        </View>
                      </View>

                      <TVTouchable onPress={() => router.push(APP_ROUTES.auth.signIn)} showFocusBorder={false}>
                        <View
                          style={{
                            minHeight: 38,
                            borderRadius: 19,
                            paddingHorizontal: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.12)',
                          }}
                        >
                          <CustomText variant="label" style={{ color: '#FFFFFF' }}>
                            Sign in
                          </CustomText>
                        </View>
                      </TVTouchable>
                    </View>
                  </FadeIn>

                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isTablet ? 22 : 16, alignItems: 'stretch' }}>
                    <FadeIn delay={70}>
                      <View style={{ flex: isDesktop ? 1 : undefined, gap: 20 }}>
                        <View style={{ gap: 12, paddingTop: isDesktop ? 44 : 8 }}>
                          <View
                            style={{
                              alignSelf: 'flex-start',
                              borderRadius: 999,
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              backgroundColor: 'rgba(183,148,246,0.14)',
                              borderWidth: 1,
                              borderColor: 'rgba(183,148,246,0.26)',
                            }}
                          >
                            <CustomText variant="caption" style={{ color: '#D8C7FF', textTransform: 'uppercase', letterSpacing: 0.85 }}>
                              Premium worship experience
                            </CustomText>
                          </View>

                          <CustomText
                            variant="hero"
                            style={{
                              color: '#FFFFFF',
                              fontSize: isDesktop ? 46 : isTablet ? 38 : isCompact ? 30 : 34,
                              lineHeight: isDesktop ? 54 : isTablet ? 46 : isCompact ? 37 : 41,
                              maxWidth: 680,
                            }}
                          >
                            Stream worship, messages, and live moments in one beautiful app.
                          </CustomText>

                          <CustomText
                            variant="body"
                            style={{
                              color: 'rgba(255,255,255,0.72)',
                              maxWidth: 620,
                              fontSize: isTablet ? 16 : 14,
                              lineHeight: isTablet ? 24 : 21,
                            }}
                          >
                            A calm home for ClaudyGod music, videos, live broadcasts, saved favourites, and spiritual inspiration across every screen.
                          </CustomText>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                          <AppButton
                            title="Create account"
                            size={isCompact ? 'md' : 'lg'}
                            onPress={() => router.push(APP_ROUTES.auth.signUp)}
                            leftIcon={<MaterialIcons name="person-add" size={18} color={theme.colors.textInverse} />}
                          />
                          <AppButton
                            title="Browse as guest"
                            variant="secondary"
                            size={isCompact ? 'md' : 'lg'}
                            onPress={startAsGuest}
                            leftIcon={<MaterialIcons name="explore" size={18} color={theme.colors.text} />}
                          />
                        </View>
                      </View>
                    </FadeIn>

                    <FadeIn delay={120}>
                      <SurfaceCard
                        tone="strong"
                        style={{
                          flex: isDesktop ? 0.82 : undefined,
                          padding: 12,
                          backgroundColor: 'rgba(18,12,32,0.72)',
                          borderColor: 'rgba(255,255,255,0.12)',
                        }}
                      >
                        <Image
                          source={{ uri: featured?.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
                          style={{ width: '100%', height: isTablet ? 380 : 280, borderRadius: 26 }}
                          resizeMode="cover"
                        />
                        <View style={{ padding: 12, gap: 8 }}>
                          <CustomText variant="caption" style={{ color: '#CDB9FF', textTransform: 'uppercase', letterSpacing: 0.9 }}>
                            {featured?.isLive ? 'Live now' : featured ? 'Featured now' : 'Start exploring'}
                          </CustomText>
                          <CustomText variant="heading" style={{ color: '#FFFFFF' }} numberOfLines={2}>
                            {featured?.title ?? 'ClaudyGod Ministries'}
                          </CustomText>
                          <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.68)' }} numberOfLines={2}>
                            {featured?.description || 'Music, videos, and live ministry ready when you are.'}
                          </CustomText>
                        </View>
                      </SurfaceCard>
                    </FadeIn>
                  </View>

                  <FadeIn delay={170}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {ENTRY_LINKS.map((link) => (
                        <TVTouchable
                          key={link.label}
                          onPress={() => router.push(link.route)}
                          style={{
                            width: isCompact ? '47%' : isTablet ? '23.5%' : '47%',
                            minHeight: 88,
                            borderRadius: 22,
                            backgroundColor: 'rgba(255,255,255,0.055)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.10)',
                            padding: 14,
                            justifyContent: 'space-between',
                          }}
                          showFocusBorder={false}
                        >
                          <MaterialIcons name={link.icon} size={23} color="#CDB9FF" />
                          <CustomText variant="label" style={{ color: '#FFFFFF' }}>
                            {link.label}
                          </CustomText>
                        </TVTouchable>
                      ))}
                    </View>
                  </FadeIn>
                </View>
              </Screen>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
