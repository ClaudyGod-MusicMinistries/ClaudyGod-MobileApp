import React from 'react';
import { Image, Platform, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { TVTouchable } from '../components/ui/TVTouchable';
import { Screen } from '../components/layout/Screen';
import { FadeIn } from '../components/ui/FadeIn';
import { useAuth } from '../context/AuthContext';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_HERO_ASSET, BRAND_LOGO_ASSET } from '../util/brandAssets';

type LandingDestination = {
  key: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  description: string;
  route: string;
  guestRoute?: string;
  actionLabel: string;
};

function LandingPill({ label }: { label: string }) {
  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(198,216,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <CustomText
        variant="caption"
        style={{ color: 'rgba(226,233,248,0.86)', fontSize: 10.5, lineHeight: 12 }}
      >
        {label}
      </CustomText>
    </View>
  );
}

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();

  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const isDesktop = width >= 1080 && !isTV;
  const compact = width < 390;
  const heroSplit = width >= 900 && !isTV;

  const navigateTo = (route: string, guestRoute?: string) => {
    router.push(isAuthenticated ? route : guestRoute ?? APP_ROUTES.auth.signUp);
  };

  const primaryTitle = 'Create Account';
  const primaryRoute = APP_ROUTES.auth.signUp;
  const secondaryTitle = 'Sign In';
  const secondaryRoute = APP_ROUTES.auth.signIn;

  const destinations: LandingDestination[] = [
    {
      key: 'music',
      icon: 'graphic-eq',
      title: 'Music',
      description: 'Play worship tracks and continue from the dedicated music player.',
      route: APP_ROUTES.tabs.player,
      actionLabel: 'Explore music',
    },
    {
      key: 'videos',
      icon: 'smart-display',
      title: 'Videos',
      description: 'Watch ministry videos and channel updates from the video screen.',
      route: APP_ROUTES.tabs.videos,
      actionLabel: 'Watch videos',
    },
    {
      key: 'library',
      icon: 'library-music',
      title: 'Library',
      description: 'Keep your saved content and personal collection in one place.',
      route: APP_ROUTES.tabs.library,
      actionLabel: 'View library',
    },
  ];

  const footerLinks = [
    { label: 'Create Account', route: APP_ROUTES.auth.signUp },
    { label: 'Sign In', route: APP_ROUTES.auth.signIn },
    { label: 'Start Here', route: APP_ROUTES.auth.signUp },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#050813' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#050813" />

      <LinearGradient
        colors={['#0C1730', '#0B1020', '#06070F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <View
        style={{
          position: 'absolute',
          top: -110,
          left: -80,
          width: 280,
          height: 280,
          borderRadius: 280,
          backgroundColor: 'rgba(67,183,255,0.14)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: -120,
          top: 140,
          width: 320,
          height: 320,
          borderRadius: 320,
          backgroundColor: 'rgba(129,96,255,0.16)',
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
            <View style={{ paddingTop: compact ? 10 : 14, gap: 18 }}>
              <FadeIn>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Image
                      source={BRAND_LOGO_ASSET}
                      style={{ width: 42, height: 42, borderRadius: 21 }}
                    />
                    <View style={{ marginLeft: 11, flex: 1 }}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: 'rgba(194,210,240,0.78)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                        }}
                      >
                        ClaudyGod
                      </CustomText>
                      <CustomText variant="label" style={{ color: '#F6F8FF', marginTop: 2 }}>
                        Music & Ministries
                      </CustomText>
                    </View>
                  </View>

                  <TVTouchable
                    onPress={() => router.push(APP_ROUTES.auth.signIn)}
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: 'rgba(199,215,249,0.22)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="label" style={{ color: '#E7F0FF' }}>
                      Sign In
                    </CustomText>
                  </TVTouchable>
                </View>
              </FadeIn>

              <FadeIn delay={70}>
                <View
                  style={{
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: 'rgba(194,215,255,0.16)',
                    backgroundColor: 'rgba(8,12,22,0.86)',
                    paddingHorizontal: isTablet ? 26 : 18,
                    paddingVertical: isTablet ? 24 : 18,
                    gap: 20,
                  }}
                >
                  <View
                    style={{
                      flexDirection: heroSplit ? 'row' : 'column',
                      gap: heroSplit ? 20 : 18,
                    }}
                  >
                    <View style={{ flex: heroSplit ? 1.02 : undefined }}>
                      <LandingPill label="Worship, music, videos, and daily encouragement" />

                      <CustomText
                        variant="hero"
                        style={{
                          color: '#F9FBFF',
                          marginTop: 14,
                          fontSize: isDesktop ? 36 : isTablet ? 31 : compact ? 24 : 27,
                          lineHeight: isDesktop ? 42 : isTablet ? 36 : compact ? 30 : 32,
                          fontFamily: 'ClashDisplay_700Bold',
                        }}
                      >
                        A calmer ClaudyGod experience built for listening, watching, and staying connected.
                      </CustomText>

                      <CustomText
                        variant="body"
                        style={{
                          color: 'rgba(218,227,242,0.84)',
                          marginTop: 12,
                          fontSize: isTablet ? 14.3 : 13.3,
                          lineHeight: isTablet ? 22 : 20,
                          maxWidth: heroSplit ? 490 : undefined,
                        }}
                      >
                        Move from worship music to ministry videos and your saved library without
                        friction. ClaudyGod keeps every important part of the experience in one place.
                      </CustomText>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                        <LandingPill label="Music player" />
                        <LandingPill label="Video screen" />
                        <LandingPill label="Saved library" />
                      </View>

                      <View
                        style={{
                          flexDirection: isTablet ? 'row' : 'column',
                          gap: 10,
                          marginTop: 18,
                        }}
                      >
                        <AppButton
                          title={primaryTitle}
                          size="lg"
                          fullWidth={!isTablet}
                          onPress={() => router.push(primaryRoute)}
                          rightIcon={
                            <MaterialIcons
                              name={isAuthenticated ? 'arrow-forward' : 'person-add'}
                              size={18}
                              color="#050813"
                            />
                          }
                          style={isTablet ? { flex: 1 } : undefined}
                        />
                        <AppButton
                          title={secondaryTitle}
                          variant="outline"
                          size="lg"
                          fullWidth={!isTablet}
                          onPress={() => router.push(secondaryRoute)}
                          leftIcon={<MaterialIcons name="play-circle-outline" size={18} color="#E8F1FF" />}
                          textColor="#E8F1FF"
                          style={
                            isTablet
                              ? {
                                  flex: 1,
                                  borderColor: 'rgba(194,215,255,0.28)',
                                  backgroundColor: 'rgba(255,255,255,0.03)',
                                }
                              : {
                                  borderColor: 'rgba(194,215,255,0.28)',
                                  backgroundColor: 'rgba(255,255,255,0.03)',
                                }
                          }
                        />
                      </View>
                    </View>

                    <View style={{ flex: heroSplit ? 0.92 : undefined }}>
                      <View
                        style={{
                          minHeight: isTablet ? 320 : 260,
                          borderRadius: 24,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: 'rgba(220,231,255,0.12)',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <Image
                          source={BRAND_HERO_ASSET}
                          resizeMode="cover"
                          style={{ width: '100%', height: '100%' }}
                        />
                        <LinearGradient
                          colors={['rgba(4,7,14,0.05)', 'rgba(4,7,14,0.72)', 'rgba(4,7,14,0.96)']}
                          start={{ x: 0.4, y: 0 }}
                          end={{ x: 0.6, y: 1 }}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />

                        <View style={{ position: 'absolute', top: 14, left: 14, right: 14 }}>
                          <LandingPill label="Live app preview" />
                        </View>

                        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, gap: 10 }}>
                          <View
                            style={{
                              borderRadius: 18,
                              backgroundColor: 'rgba(10,16,28,0.72)',
                              borderWidth: 1,
                              borderColor: 'rgba(216,229,255,0.14)',
                              paddingHorizontal: 14,
                              paddingVertical: 12,
                            }}
                          >
                            <CustomText variant="caption" style={{ color: 'rgba(202,218,244,0.78)' }}>
                              Now inside the app
                            </CustomText>
                            <CustomText
                              variant="label"
                              style={{ color: '#F9FBFF', marginTop: 4, fontSize: 13.2, lineHeight: 18 }}
                            >
                              Music, videos, and saved content now feel like one connected flow.
                            </CustomText>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View
                              style={{
                                flex: 1,
                                borderRadius: 16,
                                backgroundColor: 'rgba(10,16,28,0.72)',
                                borderWidth: 1,
                                borderColor: 'rgba(216,229,255,0.12)',
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                              }}
                            >
                              <CustomText variant="caption" style={{ color: 'rgba(190,209,240,0.74)' }}>
                                Watch
                              </CustomText>
                              <CustomText variant="label" style={{ color: '#F7FAFF', marginTop: 4 }}>
                                Video screen
                              </CustomText>
                            </View>
                            <View
                              style={{
                                flex: 1,
                                borderRadius: 16,
                                backgroundColor: 'rgba(10,16,28,0.72)',
                                borderWidth: 1,
                                borderColor: 'rgba(216,229,255,0.12)',
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                              }}
                            >
                              <CustomText variant="caption" style={{ color: 'rgba(190,209,240,0.74)' }}>
                                Listen
                              </CustomText>
                              <CustomText variant="label" style={{ color: '#F7FAFF', marginTop: 4 }}>
                                Music player
                              </CustomText>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </FadeIn>

              <FadeIn delay={130}>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <CustomText variant="heading" style={{ color: '#F7FAFF', fontSize: isTablet ? 21 : 18 }}>
                        Move through the app faster
                      </CustomText>
                      <CustomText
                        variant="body"
                        style={{ color: 'rgba(209,221,244,0.76)', marginTop: 6, fontSize: 13, lineHeight: 19 }}
                      >
                        Every destination below opens a real app screen, not a placeholder page.
                      </CustomText>
                    </View>
                  </View>

                  <View style={{ flexDirection: isTablet ? 'row' : 'column', gap: 12 }}>
                    {destinations.map((item) => (
                      <TVTouchable
                        key={item.key}
                        onPress={() => navigateTo(item.route, item.guestRoute)}
                        style={{
                          flex: 1,
                          borderRadius: 22,
                          borderWidth: 1,
                          borderColor: 'rgba(194,215,255,0.14)',
                          backgroundColor: 'rgba(8,12,22,0.78)',
                          paddingHorizontal: 16,
                          paddingVertical: 16,
                        }}
                        showFocusBorder={false}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(74,155,255,0.16)',
                            borderWidth: 1,
                            borderColor: 'rgba(149,194,255,0.18)',
                          }}
                        >
                          <MaterialIcons name={item.icon} size={22} color="#D9ECFF" />
                        </View>

                        <CustomText
                          variant="heading"
                          style={{ color: '#F8FBFF', marginTop: 14, fontSize: 16, lineHeight: 21 }}
                        >
                          {item.title}
                        </CustomText>
                        <CustomText
                          variant="body"
                          style={{ color: 'rgba(209,221,244,0.76)', marginTop: 7, fontSize: 12.8, lineHeight: 19 }}
                        >
                          {item.description}
                        </CustomText>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
                          <CustomText variant="label" style={{ color: '#CFE7FF' }}>
                            {item.actionLabel}
                          </CustomText>
                          <MaterialIcons
                            name="arrow-forward"
                            size={16}
                            color="#CFE7FF"
                            style={{ marginLeft: 6 }}
                          />
                        </View>
                      </TVTouchable>
                    ))}
                  </View>
                </View>
              </FadeIn>

              <FadeIn delay={190}>
                <View
                  style={{
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: 'rgba(194,215,255,0.12)',
                    backgroundColor: 'rgba(8,12,22,0.68)',
                    paddingHorizontal: 18,
                    paddingVertical: 18,
                    gap: 12,
                  }}
                >
                  <CustomText variant="heading" style={{ color: '#F6FAFF', fontSize: isTablet ? 20 : 17 }}>
                    Why the flow feels lighter now
                  </CustomText>
                  <View style={{ flexDirection: isTablet ? 'row' : 'column', gap: 10 }}>
                    {[
                      'Music opens in a dedicated player.',
                      'Videos stay on the video screen.',
                      'Your library keeps saved content close.',
                    ].map((item) => (
                      <View
                        key={item}
                        style={{
                          flex: 1,
                          borderRadius: 18,
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          borderWidth: 1,
                          borderColor: 'rgba(194,215,255,0.10)',
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                        }}
                      >
                        <CustomText variant="body" style={{ color: 'rgba(214,225,244,0.84)', fontSize: 12.6, lineHeight: 18 }}>
                          {item}
                        </CustomText>
                      </View>
                    ))}
                  </View>
                </View>
              </FadeIn>

              <FadeIn delay={240}>
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(194,215,255,0.10)',
                    paddingTop: 18,
                    paddingBottom: 8,
                    gap: 14,
                  }}
                >
                  <View
                    style={{
                      flexDirection: isTablet ? 'row' : 'column',
                      alignItems: isTablet ? 'center' : 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image
                        source={BRAND_LOGO_ASSET}
                        style={{ width: 34, height: 34, borderRadius: 17 }}
                      />
                      <View style={{ marginLeft: 10 }}>
                        <CustomText variant="label" style={{ color: '#F7FAFF' }}>
                          ClaudyGod
                        </CustomText>
                        <CustomText variant="caption" style={{ color: 'rgba(190,209,240,0.76)', marginTop: 2 }}>
                          Worship, messages, and daily encouragement
                        </CustomText>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                      {footerLinks.map((item) => (
                        <TVTouchable
                          key={item.label}
                          onPress={() => router.push(item.route)}
                          showFocusBorder={false}
                        >
                          <CustomText variant="label" style={{ color: '#D8EAFF' }}>
                            {item.label}
                          </CustomText>
                        </TVTouchable>
                      ))}
                    </View>
                  </View>

                  <CustomText
                    variant="caption"
                    style={{ color: 'rgba(175,193,223,0.62)', textAlign: isTablet ? 'left' : 'center' }}
                  >
                    © 2026 ClaudyGod Ministries
                  </CustomText>
                </View>
              </FadeIn>
            </View>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
