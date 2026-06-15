import React from 'react';
import {
  Image,
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
import { BRAND_LOGO_ASSET, BRAND_WORSHIP_ASSET, BRAND_MUSIC_ASSET } from '../util/brandAssets';
import { useDeviceClass } from '../util/deviceClassConfig';

const FEATURE_PILLS = [
  { label: 'Music', icon: 'graphic-eq' as const, color: '#B794F6', bg: 'rgba(183,148,246,0.15)' },
  { label: 'Videos', icon: 'smart-display' as const, color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  { label: 'Live', icon: 'live-tv' as const, color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  { label: 'Daily Word', icon: 'auto-stories' as const, color: '#FCD34D', bg: 'rgba(252,211,77,0.14)' },
] as const;

function BrandMark({ size = 56 }: { size?: number }) {
  const r = Math.round(size * 0.26);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(183,148,246,0.44)',
        backgroundColor: 'rgba(183,148,246,0.14)',
        shadowColor: '#B794F6',
        shadowOpacity: 0.36,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
      }}
    >
      <Image source={BRAND_LOGO_ASSET} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
  );
}

function FeatureHighlights() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
      {FEATURE_PILLS.map((pill) => (
        <View
          key={pill.label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 13,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: pill.bg,
            borderWidth: 1,
            borderColor: `${pill.color}44`,
          }}
        >
          <MaterialIcons name={pill.icon} size={14} color={pill.color} />
          <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12.5, fontWeight: '600' }}>
            {pill.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

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
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.14)' }} />
        <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11, letterSpacing: 0.4 }}>
          or continue with account
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.14)' }} />
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
            backgroundColor: 'rgba(255,255,255,0.09)',
            borderColor: 'rgba(255,255,255,0.22)',
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
            backgroundColor: 'rgba(183,148,246,0.15)',
            borderColor: 'rgba(183,148,246,0.36)',
          }}
        />
      </View>

      <Text
        style={{
          color: 'rgba(255,255,255,0.34)',
          textAlign: 'center',
          fontSize: 11,
          lineHeight: 16,
        }}
      >
        Free to explore · No account required to listen
      </Text>
    </View>
  );
}

function PhoneLanding() {
  const device = useDeviceClass();
  const { height } = useWindowDimensions();
  const compact = device.isCompactPhone || height < 680;
  const gutter = compact ? 20 : 24;
  const headlineSize = compact ? 36 : 42;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Cinematic worship background */}
      <Image
        source={BRAND_WORSHIP_ASSET}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />

      {/* Multi-stop gradient for readability */}
      <LinearGradient
        colors={[
          'rgba(6,3,13,0.08)',
          'rgba(6,3,13,0.30)',
          'rgba(6,3,13,0.78)',
          'rgba(6,3,13,0.97)',
        ]}
        locations={[0, 0.28, 0.60, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Purple accent tint from left */}
      <LinearGradient
        colors={['rgba(124,58,237,0.22)', 'rgba(124,58,237,0.00)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.6, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              flex: 1,
              minHeight: height,
              paddingHorizontal: gutter,
              paddingTop: compact ? 16 : 22,
              paddingBottom: compact ? 20 : 28,
              justifyContent: 'space-between',
            }}
          >
            {/* ── Brand row ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <BrandMark size={compact ? 44 : 50} />
              <View>
                <Text
                  style={{
                    color: 'rgba(199,168,255,0.72)',
                    fontSize: 9.5,
                    letterSpacing: 2.2,
                    textTransform: 'uppercase',
                    fontWeight: '600',
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

            {/* ── Hero content ── */}
            <View style={{ gap: compact ? 18 : 24 }}>
              <View style={{ gap: compact ? 12 : 14 }}>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    borderRadius: 999,
                    backgroundColor: 'rgba(183,148,246,0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(183,148,246,0.34)',
                    paddingHorizontal: 13,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      color: 'rgba(199,168,255,0.94)',
                      fontSize: 10.5,
                      fontWeight: '700',
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
                    lineHeight: headlineSize * 1.06,
                    letterSpacing: -1.4,
                    fontWeight: '800',
                  }}
                >
                  Worship{'\n'}without limits.
                </CustomText>

                <CustomText
                  variant="body"
                  style={{
                    color: 'rgba(220,208,248,0.72)',
                    fontSize: compact ? 14 : 15.5,
                    lineHeight: compact ? 21 : 23,
                    maxWidth: 360,
                  }}
                >
                  Music, videos & live sessions from ClaudyGod — whenever, wherever.
                </CustomText>

                <FeatureHighlights />
              </View>

              <LandingActions compact={compact} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

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
      {/* Full-bleed worship image */}
      <Image
        source={BRAND_WORSHIP_ASSET}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />

      {/* Right panel: album art tease */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: '15%',
          bottom: '5%',
          width: '38%',
          overflow: 'hidden',
        }}
      >
        <Image
          source={BRAND_MUSIC_ASSET}
          resizeMode="cover"
          style={{ width: '100%', height: '100%' }}
        />
        {/* Fade left edge */}
        <LinearGradient
          colors={['rgba(6,3,13,1)', 'rgba(6,3,13,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.5, y: 0.5 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </View>

      <LinearGradient
        colors={[
          'rgba(6,3,13,0.10)',
          'rgba(6,3,13,0.52)',
          'rgba(6,3,13,0.90)',
          'rgba(6,3,13,0.98)',
        ]}
        locations={[0, 0.28, 0.68, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Purple left-side glow */}
      <LinearGradient
        colors={['rgba(124,58,237,0.26)', 'rgba(124,58,237,0.00)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 36 }}>
                <BrandMark size={device.isTV ? 72 : device.isDesktop ? 62 : 54} />
                <View>
                  <Text
                    style={{
                      color: 'rgba(199,168,255,0.72)',
                      fontSize: device.isTV ? 11 : 10,
                      letterSpacing: 2.4,
                      textTransform: 'uppercase',
                      fontWeight: '600',
                    }}
                  >
                    ClaudyGod
                  </Text>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.90)',
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

              <View style={{ maxWidth: device.isTV ? 760 : device.isDesktop ? 680 : 580, gap: device.isTV ? 32 : 26 }}>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    borderRadius: 999,
                    backgroundColor: 'rgba(183,148,246,0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(183,148,246,0.34)',
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                  }}
                >
                  <Text
                    style={{
                      color: 'rgba(199,168,255,0.94)',
                      fontSize: 11,
                      fontWeight: '700',
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
                    letterSpacing: device.isTV ? -2.4 : -1.6,
                    fontWeight: '800',
                  }}
                >
                  Worship{'\n'}without limits.
                </CustomText>

                <CustomText
                  variant="body"
                  style={{
                    color: 'rgba(220,208,248,0.72)',
                    fontSize: device.isTV ? 20 : device.isDesktop ? 17 : 15.5,
                    lineHeight: device.isTV ? 32 : 26,
                    maxWidth: 520,
                  }}
                >
                  Music, videos & live sessions from ClaudyGod — whenever, wherever.
                </CustomText>

                <FeatureHighlights />
                <LandingActions compact={false} />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export default function LandingScreen() {
  const device = useDeviceClass();

  if (device.isPhone && !Platform.isTV) {
    return <PhoneLanding />;
  }

  return <WideLanding />;
}
