import React from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';
import { useDeviceClass } from '../util/deviceClassConfig';

// ─── Brand mark ────────────────────────────────────────────────────────────────

function BrandMark({ size = 56 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        overflow: 'hidden',
        shadowColor: '#B794F6',
        shadowOpacity: 0.24,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
      }}
    >
      <Image source={BRAND_LOGO_ASSET} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
  );
}

// ─── Action buttons ─────────────────────────────────────────────────────────────

function LandingActions({ compact }: { compact: boolean }) {
  const router = useRouter();

  return (
    <View style={{ gap: compact ? 10 : 12 }}>
      <AppButton
        title="Start Listening"
        size="lg"
        fullWidth
        onPress={() => router.replace(APP_ROUTES.tabs.home)}
        leftIcon={<MaterialIcons name="headphones" size={19} color="#120A20" />}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        <Text style={{ color: 'rgba(255,255,255,0.36)', fontSize: 11, letterSpacing: 0.3 }}>
          or
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <AppButton
          title="Sign In"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push(APP_ROUTES.auth.signIn)}
          textColor="#FFFFFF"
          style={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(255,255,255,0.20)',
          }}
        />
        <AppButton
          title="Create Account"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push(APP_ROUTES.auth.signUp)}
          textColor="#FFFFFF"
          style={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(255,255,255,0.20)',
          }}
        />
      </View>

      <Text
        style={{
          color: 'rgba(255,255,255,0.32)',
          textAlign: 'center',
          fontSize: 10.5,
          lineHeight: 16,
        }}
      >
        Free to explore. Sign in to unlock your full experience.
      </Text>
    </View>
  );
}

// ─── Phone layout ───────────────────────────────────────────────────────────────
// Uses fixed flex layout — no scrollable content, fits the viewport exactly.

function PhoneLanding() {
  const device = useDeviceClass();
  const { height } = useWindowDimensions();
  const compact = device.isCompactPhone || height < 680;
  const gutter = compact ? 20 : 24;
  const headlineSize = compact ? 34 : 40;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <ImageBackground
        source={LANDING_BG_ASSET}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />

      {/* Multi-stop gradient — image shows at top, blacks out below 60% */}
      <LinearGradient
        colors={[
          'rgba(7,5,12,0.06)',
          'rgba(7,5,12,0.36)',
          'rgba(7,5,12,0.82)',
          'rgba(7,5,12,0.98)',
        ]}
        locations={[0, 0.32, 0.64, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: gutter,
            paddingTop: compact ? 16 : 22,
            paddingBottom: compact ? 16 : 22,
            justifyContent: 'space-between',
          }}
        >
          {/* ── Logo row ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <BrandMark size={compact ? 42 : 48} />
            <View>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.48)',
                  fontSize: 9,
                  letterSpacing: 2.4,
                  textTransform: 'uppercase',
                }}
              >
                ClaudyGod
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: compact ? 12.5 : 13.5,
                  fontWeight: '600',
                  marginTop: 2,
                  letterSpacing: -0.1,
                }}
              >
                Music · Ministry · Worship
              </Text>
            </View>
          </View>

          {/* ── Headline + CTA ── */}
          <View style={{ gap: compact ? 18 : 24 }}>
            <View style={{ gap: compact ? 10 : 12 }}>
              {/* Accent badge */}
              <View
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  backgroundColor: 'rgba(183,148,246,0.14)',
                  borderWidth: 1,
                  borderColor: 'rgba(183,148,246,0.28)',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                }}
              >
                <Text
                  style={{
                    color: 'rgba(183,148,246,0.9)',
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Now streaming
                </Text>
              </View>

              <CustomText
                variant="display"
                style={{
                  color: '#FFFFFF',
                  fontSize: headlineSize,
                  lineHeight: headlineSize * 1.08,
                  letterSpacing: -1.2,
                  fontWeight: '800',
                }}
              >
                Worship{'\n'}without limits.
              </CustomText>

              <CustomText
                variant="body"
                style={{
                  color: 'rgba(255,255,255,0.64)',
                  fontSize: compact ? 13.5 : 15,
                  lineHeight: compact ? 20 : 22,
                  maxWidth: 360,
                }}
              >
                Music, videos & live sessions from ClaudyGod — whenever, wherever.
              </CustomText>
            </View>

            <LandingActions compact={compact} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Wide layout (tablet / desktop / TV) ─────────────────────────────────────────

function WideLanding() {
  const device = useDeviceClass();
  const { width: viewportWidth } = useWindowDimensions();

  const titleSize =
    device.isTV ? 68 :
    device.isLargeDesktop ? 58 :
    device.isDesktop ? 52 : 44;
  const gutter = device.contentGutter ?? 48;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <ImageBackground
        source={LANDING_BG_ASSET}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={[
          'rgba(7,5,12,0.08)',
          'rgba(7,5,12,0.52)',
          'rgba(7,5,12,0.90)',
          'rgba(7,5,12,0.98)',
        ]}
        locations={[0, 0.28, 0.68, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: gutter,
            paddingVertical: device.isTV ? 64 : 48,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: Math.min(device.maxContentWidth ?? 1140, viewportWidth - gutter * 2),
              alignSelf: 'center',
            }}
          >
            {/* Brand row */}
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 }}
            >
              <BrandMark size={device.isTV ? 70 : device.isDesktop ? 60 : 52} />
              <View>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.44)',
                    fontSize: device.isTV ? 11 : 10,
                    letterSpacing: 2.4,
                    textTransform: 'uppercase',
                  }}
                >
                  ClaudyGod
                </Text>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: device.isTV ? 20 : 16,
                    fontWeight: '600',
                    marginTop: 4,
                    letterSpacing: -0.2,
                  }}
                >
                  Music · Ministry · Worship
                </Text>
              </View>
            </View>

            {/* Headline + actions — max width to avoid overly wide text */}
            <View
              style={{
                maxWidth: device.isTV ? 760 : device.isDesktop ? 680 : 580,
                gap: device.isTV ? 32 : 26,
              }}
            >
              {/* Accent badge */}
              <View
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  backgroundColor: 'rgba(183,148,246,0.14)',
                  borderWidth: 1,
                  borderColor: 'rgba(183,148,246,0.28)',
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: 'rgba(183,148,246,0.9)',
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Now streaming
                </Text>
              </View>

              <CustomText
                variant="display"
                style={{
                  color: '#FFFFFF',
                  fontSize: titleSize,
                  lineHeight: titleSize * 1.06,
                  letterSpacing: device.isTV ? -2.2 : -1.4,
                  fontWeight: '800',
                }}
              >
                Worship{'\n'}without limits.
              </CustomText>

              <CustomText
                variant="body"
                style={{
                  color: 'rgba(255,255,255,0.64)',
                  fontSize: device.isTV ? 20 : device.isDesktop ? 17 : 15.5,
                  lineHeight: device.isTV ? 32 : 26,
                  maxWidth: 520,
                }}
              >
                Music, videos & live sessions from ClaudyGod — whenever, wherever.
              </CustomText>

              <LandingActions compact={false} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────────

export default function LandingScreen() {
  const device = useDeviceClass();

  if (device.isPhone && !Platform.isTV) {
    return <PhoneLanding />;
  }

  return <WideLanding />;
}
