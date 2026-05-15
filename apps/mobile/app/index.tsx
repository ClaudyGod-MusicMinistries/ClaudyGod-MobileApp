import React from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';
import { useAppTheme } from '../util/colorScheme';

export default function LandingScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();

  const isTV = Platform.isTV;
  const isDesktop = width >= 1024 && !isTV;
  const isTablet = width >= 768 && width < 1024 && !isTV;
  const compact = width < 390;
  const shortViewport = height < 760;
  const shellMaxWidth = isDesktop ? 1180 : isTablet ? 760 : 500;
  const copyMaxWidth = isDesktop ? 520 : 480;
  const visualHeight = isDesktop ? Math.min(Math.max(height - 112, 520), 720) : isTablet ? 360 : 280;

  return (
    <ImageBackground
      source={LANDING_BG_ASSET}
      resizeMode="cover"
      imageStyle={{ opacity: isDesktop ? 0.32 : 0.42 }}
      style={{ flex: 1, backgroundColor: '#08050F' }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          theme.scheme === 'dark'
            ? ['rgba(8,5,15,0.50)', 'rgba(8,5,15,0.86)', 'rgba(8,5,15,0.98)']
            : ['rgba(9,7,20,0.42)', 'rgba(9,7,20,0.80)', 'rgba(9,7,20,0.96)']
        }
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: compact ? 16 : isDesktop ? 48 : 24,
          paddingTop: isDesktop ? 48 : shortViewport ? 26 : 56,
          paddingBottom: isDesktop ? 48 : 28,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: shellMaxWidth,
            alignSelf: 'center',
            flexDirection: isDesktop ? 'row' : 'column',
            alignItems: 'stretch',
            gap: isDesktop ? 34 : 22,
          }}
        >
          <View
            style={{
              flex: isDesktop ? 0.94 : undefined,
              justifyContent: 'center',
              minWidth: 0,
            }}
          >
            <View style={{ gap: isDesktop ? 22 : 18, maxWidth: copyMaxWidth, alignSelf: isDesktop ? 'flex-start' : 'center', width: '100%' }}>
              <View
                style={{
                  width: isDesktop ? 70 : 58,
                  height: isDesktop ? 70 : 58,
                  borderRadius: isDesktop ? 24 : 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.22)',
                  alignSelf: isDesktop ? 'flex-start' : 'center',
                }}
              >
                <Image
                  source={BRAND_LOGO_ASSET}
                  resizeMode="cover"
                  style={{
                    width: isDesktop ? 46 : 38,
                    height: isDesktop ? 46 : 38,
                    borderRadius: isDesktop ? 16 : 13,
                  }}
                />
              </View>

              <View style={{ gap: 10 }}>
                <CustomText
                  variant="display"
                  style={{
                    color: '#FFFFFF',
                    fontSize: isDesktop ? 52 : isTablet ? 42 : 34,
                    lineHeight: isDesktop ? 58 : isTablet ? 48 : 40,
                    letterSpacing: isDesktop ? -1.6 : -0.8,
                    textAlign: isDesktop ? 'left' : 'center',
                  }}
                >
                  Music, videos, and live worship in one place.
                </CustomText>
                <CustomText
                  variant="body"
                  style={{
                    color: 'rgba(255,255,255,0.78)',
                    lineHeight: isDesktop ? 24 : 21,
                    fontSize: isDesktop ? 15 : undefined,
                    maxWidth: 520,
                    textAlign: isDesktop ? 'left' : 'center',
                    alignSelf: isDesktop ? 'flex-start' : 'center',
                  }}
                >
                  Browse public releases as a guest, or sign in to keep your library, history, alerts, and profile synced.
                </CustomText>
              </View>

              <SurfaceCard
                tone="strong"
                style={{
                  padding: isDesktop ? 18 : 14,
                  gap: 10,
                  backgroundColor: 'rgba(10,9,18,0.88)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  maxWidth: 520,
                  width: '100%',
                  alignSelf: isDesktop ? 'flex-start' : 'center',
                }}
              >
                <AppButton
                  title="Continue as guest"
                  size="lg"
                  fullWidth
                  onPress={() => router.replace(APP_ROUTES.tabs.home)}
                  leftIcon={<MaterialIcons name="person-outline" size={18} color={theme.colors.textInverse} />}
                />

                <View style={{ flexDirection: compact ? 'column' : 'row', gap: 10 }}>
                  <AppButton
                    title="Sign in"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={() => router.push(APP_ROUTES.auth.signIn)}
                    leftIcon={<MaterialIcons name="login" size={18} color="#FFFFFF" />}
                    textColor="#FFFFFF"
                    style={{ flex: compact ? undefined : 1, backgroundColor: 'rgba(255,255,255,0.10)' }}
                  />
                  <AppButton
                    title="Create account"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={() => router.push(APP_ROUTES.auth.signUp)}
                    leftIcon={<MaterialIcons name="person-add-alt" size={18} color="#FFFFFF" />}
                    textColor="#FFFFFF"
                    style={{ flex: compact ? undefined : 1, backgroundColor: 'rgba(255,255,255,0.10)' }}
                  />
                </View>

                <CustomText
                  variant="caption"
                  style={{
                    color: 'rgba(255,255,255,0.60)',
                    textAlign: 'center',
                    lineHeight: 17,
                  }}
                >
                  Guest mode is limited to public listening and viewing. Personal features require an account.
                </CustomText>
              </SurfaceCard>
            </View>
          </View>

          <SurfaceCard
            tone="strong"
            style={{
              flex: isDesktop ? 1.06 : undefined,
              minHeight: visualHeight,
              borderRadius: isDesktop ? 34 : 26,
              overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderColor: 'rgba(255,255,255,0.14)',
            }}
          >
            <LinearGradient
              colors={['rgba(183,148,246,0.16)', 'rgba(255,255,255,0.04)', 'rgba(8,5,15,0.58)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Image
              source={LANDING_BG_ASSET}
              resizeMode="contain"
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <LinearGradient
              colors={['rgba(8,5,15,0)', 'rgba(8,5,15,0.16)', 'rgba(8,5,15,0.72)']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: isDesktop ? 24 : 18 }}
            >
              <View
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,0,0,0.54)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.24)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <CustomText variant="caption" style={{ color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.72 }}>
                  ClaudyGod worship experience
                </CustomText>
              </View>
            </LinearGradient>
          </SurfaceCard>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
