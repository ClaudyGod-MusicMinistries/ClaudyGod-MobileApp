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

type Shortcut = {
  key: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  route: string;
};

function ShortcutTile({
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
        minHeight: 94,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(198,216,255,0.10)',
        backgroundColor: 'rgba(10,14,24,0.80)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 14,
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(98,210,255,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(167,221,255,0.14)',
        }}
      >
        <MaterialIcons name={icon} size={22} color="#DCF0FF" />
      </View>

      <CustomText
        variant="label"
        style={{ color: '#F7FAFF', marginTop: 10, fontSize: 13.2, lineHeight: 17 }}
      >
        {label}
      </CustomText>
    </TVTouchable>
  );
}

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();

  const isTablet = width >= 820;
  const compact = width < 390;

  const shortcuts: Shortcut[] = [
    { key: 'music', icon: 'graphic-eq', label: 'Music', route: APP_ROUTES.tabs.player },
    { key: 'videos', icon: 'smart-display', label: 'Videos', route: APP_ROUTES.tabs.videos },
    { key: 'library', icon: 'library-music', label: 'Library', route: APP_ROUTES.tabs.library },
  ];

  const openProtectedRoute = (route: string) => {
    router.push(isAuthenticated ? route : APP_ROUTES.auth.signIn);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050813' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#050813" />

      <LinearGradient
        colors={['#0C1630', '#0A1020', '#050813']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View
        style={{
          position: 'absolute',
          top: -120,
          left: -90,
          width: 270,
          height: 270,
          borderRadius: 270,
          backgroundColor: 'rgba(67,183,255,0.12)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: -110,
          top: 200,
          width: 280,
          height: 280,
          borderRadius: 280,
          backgroundColor: 'rgba(129,96,255,0.14)',
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
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: 'rgba(194,210,240,0.76)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.58,
                        }}
                      >
                        ClaudyGod
                      </CustomText>
                      <CustomText variant="label" style={{ color: '#F7FAFF', marginTop: 2 }}>
                        Music & Ministries
                      </CustomText>
                    </View>
                  </View>

                  <TVTouchable
                    onPress={() => router.push(APP_ROUTES.auth.signIn)}
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: 'rgba(198,216,255,0.18)',
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
                    borderColor: 'rgba(198,216,255,0.12)',
                    backgroundColor: 'rgba(10,14,24,0.78)',
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ minHeight: isTablet ? 470 : 360 }}>
                    <Image
                      source={BRAND_HERO_ASSET}
                      resizeMode="cover"
                      style={{ width: '100%', height: '100%' }}
                    />

                    <LinearGradient
                      colors={['rgba(5,8,19,0.10)', 'rgba(5,8,19,0.58)', 'rgba(5,8,19,0.94)']}
                      start={{ x: 0.45, y: 0 }}
                      end={{ x: 0.6, y: 1 }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(214,228,255,0.14)',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                        }}
                      >
                        <CustomText
                          variant="caption"
                          style={{ color: 'rgba(232,238,249,0.86)', fontSize: 10.4, lineHeight: 12 }}
                        >
                          ClaudyGod
                        </CustomText>
                      </View>

                      <CustomText
                        variant="hero"
                        style={{
                          color: '#F9FBFF',
                          marginTop: 14,
                          fontSize: isTablet ? 36 : compact ? 25 : 28,
                          lineHeight: isTablet ? 42 : compact ? 30 : 33,
                          fontFamily: 'ClashDisplay_700Bold',
                          maxWidth: 420,
                        }}
                      >
                        Hear it. Watch it.
                      </CustomText>

                      <CustomText
                        variant="body"
                        style={{
                          color: 'rgba(220,229,243,0.84)',
                          marginTop: 10,
                          fontSize: isTablet ? 14 : 13,
                          lineHeight: isTablet ? 20 : 19,
                          maxWidth: 320,
                        }}
                      >
                        Music, video, and your library in one place.
                      </CustomText>

                      <View
                        style={{
                          flexDirection: isTablet ? 'row' : 'column',
                          gap: 10,
                          marginTop: 18,
                        }}
                      >
                        <AppButton
                          title="Create Account"
                          size="lg"
                          fullWidth={!isTablet}
                          onPress={() => router.push(APP_ROUTES.auth.signUp)}
                          rightIcon={<MaterialIcons name="person-add" size={18} color="#050813" />}
                          style={isTablet ? { flex: 1 } : undefined}
                        />
                        <AppButton
                          title="Sign In"
                          variant="outline"
                          size="lg"
                          fullWidth={!isTablet}
                          onPress={() => router.push(APP_ROUTES.auth.signIn)}
                          leftIcon={<MaterialIcons name="login" size={18} color="#E8F1FF" />}
                          textColor="#E8F1FF"
                          style={
                            isTablet
                              ? {
                                  flex: 1,
                                  borderColor: 'rgba(198,216,255,0.22)',
                                  backgroundColor: 'rgba(255,255,255,0.03)',
                                }
                              : {
                                  borderColor: 'rgba(198,216,255,0.22)',
                                  backgroundColor: 'rgba(255,255,255,0.03)',
                                }
                          }
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </FadeIn>

              <FadeIn delay={130}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <CustomText
                    variant="label"
                    style={{
                      color: 'rgba(214,225,244,0.78)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                    }}
                  >
                    Browse
                  </CustomText>
                </View>
              </FadeIn>

              <FadeIn delay={170}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {shortcuts.map((item) => (
                    <ShortcutTile
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      onPress={() => openProtectedRoute(item.route)}
                    />
                  ))}
                </View>
              </FadeIn>

              <FadeIn delay={220}>
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(198,216,255,0.10)',
                    paddingTop: 18,
                    paddingBottom: 8,
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                      source={BRAND_LOGO_ASSET}
                      style={{ width: 30, height: 30, borderRadius: 15 }}
                    />
                    <CustomText variant="label" style={{ color: '#F7FAFF', marginLeft: 10 }}>
                      ClaudyGod
                    </CustomText>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <TVTouchable onPress={() => router.push(APP_ROUTES.auth.signUp)} showFocusBorder={false}>
                      <CustomText variant="label" style={{ color: '#D8EAFF' }}>
                        Create Account
                      </CustomText>
                    </TVTouchable>
                    <TVTouchable onPress={() => router.push(APP_ROUTES.auth.signIn)} showFocusBorder={false}>
                      <CustomText variant="label" style={{ color: '#D8EAFF' }}>
                        Sign In
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
