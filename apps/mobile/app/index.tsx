import React from 'react';
import { Image, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
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
  label: string;
  route: string;
};

function LandingChip({
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
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(187,144,63,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(187,144,63,0.20)',
        }}
      >
        <MaterialIcons name={icon} size={16} color="#F0C87A" />
      </View>

      <CustomText variant="label" style={{ color: '#FFF9F0', fontSize: 11, lineHeight: 14 }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();

  const isTablet = width >= 860;
  const isDesktop = width >= 1120;

  const destinations: LandingDestination[] = [
    { key: 'music', icon: 'graphic-eq', label: 'Music', route: APP_ROUTES.tabs.player },
    { key: 'videos', icon: 'smart-display', label: 'Videos', route: APP_ROUTES.tabs.videos },
    { key: 'library', icon: 'library-music', label: 'Library', route: APP_ROUTES.tabs.library },
  ];

  const openDestination = (route: string) => {
    router.push(isAuthenticated ? route : APP_ROUTES.auth.signIn);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#060709' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#060709" />

      <LinearGradient
        colors={['#111317', '#090A0D', '#060709']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={['rgba(188,145,62,0.18)', 'rgba(188,145,62,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          left: -100,
          top: -120,
          width: 320,
          height: 320,
          borderRadius: 320,
        }}
      />
      <LinearGradient
        colors={['rgba(80,104,128,0.16)', 'rgba(80,104,128,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          right: -120,
          bottom: -110,
          width: 340,
          height: 340,
          borderRadius: 340,
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 26 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
            <View style={{ paddingTop: 12, gap: 18 }}>
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
                    <Image source={BRAND_LOGO_ASSET} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    <View style={{ marginLeft: 10 }}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: 'rgba(224,214,197,0.72)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.72,
                        }}
                      >
                        ClaudyGod
                      </CustomText>
                      <CustomText variant="label" style={{ color: '#FFF9F0', marginTop: 2 }}>
                        Ministries
                      </CustomText>
                    </View>
                  </View>

                  <TVTouchable
                    onPress={() => router.push(APP_ROUTES.auth.signIn)}
                    style={{
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.10)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="label" style={{ color: '#FFF4DE' }}>
                      Sign In
                    </CustomText>
                  </TVTouchable>
                </View>
              </FadeIn>

              <FadeIn delay={70}>
                <View
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(12,13,16,0.82)',
                    overflow: 'hidden',
                  }}
                >
                  <View>
                    <Image
                      source={BRAND_HERO_ASSET}
                      resizeMode="cover"
                      style={{ width: '100%', height: isTablet ? 320 : 220 }}
                    />

                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        maxWidth: isDesktop ? 600 : undefined,
                      }}
                    >
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.10)',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                        }}
                      >
                        <CustomText
                          variant="caption"
                          style={{
                            color: 'rgba(240,228,208,0.82)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.68,
                          }}
                        >
                          ClaudyGod app
                        </CustomText>
                      </View>

                      <CustomText
                        variant="hero"
                        style={{
                          color: '#FFF9F0',
                          marginTop: 10,
                          fontSize: isTablet ? 28 : 22,
                          lineHeight: isTablet ? 34 : 27,
                          maxWidth: 360,
                        }}
                      >
                        Worship, messages, and live moments in one place.
                      </CustomText>

                      <CustomText
                        variant="body"
                        style={{
                          color: 'rgba(236,228,218,0.74)',
                          marginTop: 8,
                          maxWidth: 280,
                        }}
                      >
                        Simple to enter. Easy to keep listening.
                      </CustomText>

                      <View
                        style={{
                          flexDirection: isTablet ? 'row' : 'column',
                          gap: 8,
                          marginTop: 14,
                        }}
                      >
                        <AppButton
                          title="Create Account"
                          size="lg"
                          onPress={() => router.push(APP_ROUTES.auth.signUp)}
                          style={{
                            borderRadius: 10,
                            backgroundColor: '#E1B662',
                            minWidth: isTablet ? 168 : undefined,
                          }}
                          textColor="#1C160C"
                          textStyle={{ fontSize: 12, lineHeight: 15 }}
                        />

                        <AppButton
                          title="Sign In"
                          size="lg"
                          variant="outline"
                          onPress={() => router.push(APP_ROUTES.auth.signIn)}
                          style={{
                            borderRadius: 10,
                            borderColor: 'rgba(255,255,255,0.14)',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            minWidth: isTablet ? 140 : undefined,
                          }}
                          textColor="#FFF9F0"
                          textStyle={{ fontSize: 12, lineHeight: 15 }}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </FadeIn>

              <FadeIn delay={120}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {destinations.map((item) => (
                    <LandingChip
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      onPress={() => openDestination(item.route)}
                    />
                  ))}
                </View>
              </FadeIn>

              <FadeIn delay={160}>
                <View
                  style={{
                    flexDirection: isTablet ? 'row' : 'column',
                    alignItems: isTablet ? 'center' : 'flex-start',
                    justifyContent: 'space-between',
                    gap: 10,
                    paddingHorizontal: 2,
                  }}
                >
                  <CustomText variant="caption" style={{ color: 'rgba(224,214,197,0.56)' }}>
                    ClaudyGod Ministries
                  </CustomText>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <TVTouchable
                      onPress={() => router.push(APP_ROUTES.auth.signUp)}
                      showFocusBorder={false}
                    >
                      <CustomText variant="caption" style={{ color: 'rgba(255,249,240,0.82)' }}>
                        Create Account
                      </CustomText>
                    </TVTouchable>
                    <TVTouchable
                      onPress={() => openDestination(APP_ROUTES.tabs.player)}
                      showFocusBorder={false}
                    >
                      <CustomText variant="caption" style={{ color: 'rgba(255,249,240,0.82)' }}>
                        Listen
                      </CustomText>
                    </TVTouchable>
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
