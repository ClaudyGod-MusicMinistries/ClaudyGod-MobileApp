import React from 'react';
import { Image, ImageBackground, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';
import { useAppTheme } from '../util/colorScheme';
import { useDeviceClass } from '../util/deviceClassConfig';

function LandingLogo({ large = false }: { large?: boolean }) {
  const size = large ? 76 : 58;
  const logoSize = large ? 48 : 38;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: large ? 26 : 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
      }}
    >
      <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: logoSize, height: logoSize, borderRadius: large ? 16 : 13 }} />
    </View>
  );
}

function LandingActions({ compact }: { compact: boolean }) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <SurfaceCard
      tone="strong"
      style={{
        padding: compact ? 12 : 15,
        gap: 10,
        backgroundColor: 'rgba(10,9,18,0.90)',
        borderColor: 'rgba(255,255,255,0.14)',
        width: '100%',
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
          style={{ flex: compact ? undefined : 1, backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.18)' }}
        />
        <AppButton
          title="Create account"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push(APP_ROUTES.auth.signUp)}
          leftIcon={<MaterialIcons name="person-add-alt" size={18} color="#FFFFFF" />}
          textColor="#FFFFFF"
          style={{ flex: compact ? undefined : 1, backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.18)' }}
        />
      </View>

      <CustomText
        variant="caption"
        style={{
          color: 'rgba(255,255,255,0.66)',
          textAlign: 'center',
          lineHeight: 17,
        }}
      >
        Guest mode gives public access. Sign in for saved library, history, alerts, and profile sync.
      </CustomText>
    </SurfaceCard>
  );
}

function LandingVisualPanel() {
  return (
    <SurfaceCard
      tone="strong"
      style={{
        flex: 1,
        minHeight: 520,
        borderRadius: 36,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.055)',
        borderColor: 'rgba(255,255,255,0.15)',
      }}
    >
      <LinearGradient
        colors={['rgba(183,148,246,0.18)', 'rgba(255,255,255,0.045)', 'rgba(8,5,15,0.72)']}
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
          opacity: 0.96,
        }}
      />

      <LinearGradient
        colors={['rgba(8,5,15,0)', 'rgba(8,5,15,0.18)', 'rgba(8,5,15,0.82)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: 26 }}
      >
        <View style={{ gap: 12, maxWidth: 460 }}>
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
          <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.76)', lineHeight: 22 }}>
            A focused worship app for music, videos, live ministry, personal library, and ministry updates across mobile, tablet, TV, and web.
          </CustomText>
        </View>
      </LinearGradient>
    </SurfaceCard>
  );
}

function PhoneLanding() {
  const device = useDeviceClass();
  const compact = device.isCompactPhone || device.isShortViewport;

  return (
    <ImageBackground source={LANDING_BG_ASSET} resizeMode="cover" imageStyle={{ opacity: 0.52 }} style={{ flex: 1, backgroundColor: '#08050F' }}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(8,5,15,0.30)', 'rgba(8,5,15,0.74)', 'rgba(8,5,15,0.98)']}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            flex: 1,
            justifyContent: 'space-between',
            paddingHorizontal: device.contentGutter,
            paddingTop: compact ? 14 : 22,
            paddingBottom: compact ? 10 : 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LandingLogo />
            <View style={{ flex: 1, minWidth: 0 }}>
              <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.66)', textTransform: 'uppercase', letterSpacing: 0.78 }}>
                ClaudyGod
              </CustomText>
              <CustomText variant="label" style={{ color: '#FFFFFF', marginTop: 3 }} numberOfLines={1}>
                Music, ministry, and worship
              </CustomText>
            </View>
          </View>

          <View style={{ gap: compact ? 14 : 18 }}>
            <View style={{ gap: 9 }}>
              <CustomText
                variant="display"
                style={{
                  color: '#FFFFFF',
                  fontSize: compact ? 30 : 34,
                  lineHeight: compact ? 35 : 40,
                  letterSpacing: -0.7,
                }}
              >
                Music, videos, and live worship in one place.
              </CustomText>
              <CustomText
                variant="body"
                style={{
                  color: 'rgba(255,255,255,0.78)',
                  lineHeight: compact ? 20 : 22,
                  maxWidth: 420,
                }}
              >
                Browse public releases as a guest, or sign in to keep your library, history, alerts, and profile synced.
              </CustomText>
            </View>

            <LandingActions compact={device.isCompactPhone} />
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

export default function LandingScreen() {
  const device = useDeviceClass();
  const theme = useAppTheme();

  if (device.isPhone && !Platform.isTV) {
    return <PhoneLanding />;
  }

  const showVisualPanel = device.prefersTwoPane;
  const titleSize = device.isTV ? 64 : device.isLargeDesktop ? 56 : device.isDesktop ? 52 : 42;
  const titleLineHeight = device.isTV ? 72 : device.isLargeDesktop ? 62 : device.isDesktop ? 58 : 48;

  return (
    <ImageBackground
      source={LANDING_BG_ASSET}
      resizeMode="cover"
      imageStyle={{ opacity: device.isTV ? 0.28 : device.isDesktop ? 0.30 : 0.38 }}
      style={{ flex: 1, backgroundColor: '#08050F' }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          theme.scheme === 'dark'
            ? ['rgba(8,5,15,0.48)', 'rgba(8,5,15,0.84)', 'rgba(8,5,15,0.98)']
            : ['rgba(9,7,20,0.42)', 'rgba(9,7,20,0.80)', 'rgba(9,7,20,0.96)']
        }
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: device.contentGutter,
            paddingVertical: device.isTV ? 54 : 40,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: device.maxContentWidth,
              alignSelf: 'center',
              flexDirection: showVisualPanel ? 'row' : 'column',
              alignItems: 'stretch',
              gap: device.isTV ? 46 : 34,
            }}
          >
            <View style={{ flex: showVisualPanel ? 0.9 : undefined, justifyContent: 'center', minWidth: 0 }}>
              <View style={{ gap: device.isTV ? 28 : 22, maxWidth: showVisualPanel ? 540 : 640, alignSelf: showVisualPanel ? 'flex-start' : 'center', width: '100%' }}>
                <LandingLogo large={device.isDesktop || device.isTV} />

                <View style={{ gap: 12 }}>
                  <CustomText
                    variant="display"
                    style={{
                      color: '#FFFFFF',
                      fontSize: titleSize,
                      lineHeight: titleLineHeight,
                      letterSpacing: device.isTV ? -1.4 : -1.6,
                      textAlign: showVisualPanel ? 'left' : 'center',
                    }}
                  >
                    Music, videos, and live worship in one place.
                  </CustomText>
                  <CustomText
                    variant="body"
                    style={{
                      color: 'rgba(255,255,255,0.80)',
                      lineHeight: device.isTV ? 30 : 24,
                      fontSize: device.isTV ? 19 : device.isDesktop ? 15 : 14,
                      maxWidth: 560,
                      textAlign: showVisualPanel ? 'left' : 'center',
                    }}
                  >
                    Browse public releases as a guest, or sign in to keep your library, history, alerts, and profile synced.
                  </CustomText>
                </View>

                <LandingActions compact={false} />
              </View>
            </View>

            {showVisualPanel ? <LandingVisualPanel /> : null}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
