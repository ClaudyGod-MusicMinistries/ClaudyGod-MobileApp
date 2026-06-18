import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { TVTouchable } from '../components/ui/TVTouchable';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_WORSHIP_ASSET } from '../util/brandAssets';
import { useDeviceClass } from '../util/deviceClassConfig';

export default function LandingScreen() {
  const router = useRouter();
  const device = useDeviceClass();
  const { width, height } = useWindowDimensions();
  const isPhone = device.isPhone && !Platform.isTV;
  const compact = height < 680;

  const titleSize = isPhone ? (compact ? 30 : 36) : device.isTV ? 52 : 42;
  const gutter = isPhone ? 24 : device.isTV ? 64 : 52;
  const maxWidth = isPhone
    ? Math.min(width - gutter * 2, 390)
    : Math.min(500, width - gutter * 2);

  return (
    // Explicit w/h (not flex:1) guarantees correct full-viewport sizing on web
    <View style={{ width, height, backgroundColor: '#07050C' }}>

      {/* Full-bleed background — explicit pixel dimensions fix web image fill */}
      <Image
        source={BRAND_WORSHIP_ASSET}
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        resizeMode="cover"
      />

      {/* Scrim: image visible at top, fades to solid brand-dark at bottom */}
      <LinearGradient
        colors={[
          'rgba(7,5,12,0.08)',
          'rgba(7,5,12,0.40)',
          'rgba(7,5,12,0.82)',
          'rgba(7,5,12,0.97)',
        ]}
        locations={[0, 0.38, 0.68, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, paddingHorizontal: gutter }}>

          <View style={{ flex: 1 }} />

          {/* ── Bottom content block ─────────────────────────────────────── */}
          <View
            style={{
              width: '100%',
              maxWidth,
              alignSelf: isPhone ? 'center' : 'flex-start',
              paddingBottom: compact ? 20 : 36,
            }}
          >
            {/* Headline */}
            <CustomText
              variant="display"
              numberOfLines={3}
              style={{
                color: '#FFFFFF',
                fontSize: titleSize,
                lineHeight: Math.round(titleSize * 1.14),
                fontWeight: '700',
                letterSpacing: -0.6,
                textAlign: isPhone ? 'center' : 'left',
                marginBottom: isPhone ? 10 : 14,
              }}
            >
              {'Worship\nwithout limits.'}
            </CustomText>

            {/* Subtitle */}
            <CustomText
              variant="body"
              numberOfLines={2}
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: isPhone ? 13 : 15,
                lineHeight: isPhone ? 20 : 24,
                fontWeight: '400',
                textAlign: isPhone ? 'center' : 'left',
                marginBottom: compact ? 28 : 36,
              }}
            >
              {'Music, videos & live sessions from ClaudyGod\n— whenever, wherever.'}
            </CustomText>

            {/* CTA buttons */}
            <AppButton
              title="Create account"
              size="lg"
              fullWidth
              onPress={() => router.push(APP_ROUTES.auth.signUp)}
              leftIcon={<MaterialIcons name="person-add" size={18} color="#FFFFFF" />}
              style={{ marginBottom: 10 }}
            />
            <AppButton
              title="Sign in"
              variant="outline"
              size="lg"
              fullWidth
              onPress={() => router.push(APP_ROUTES.auth.signIn)}
              leftIcon={<MaterialIcons name="login" size={18} color="#8B5CF6" />}
            />

            {/* Ghost continue link */}
            <TVTouchable
              onPress={() => router.replace(APP_ROUTES.tabs.home)}
              style={{ alignItems: 'center', paddingVertical: 16 }}
              showFocusBorder={false}
            >
              <CustomText
                variant="caption"
                numberOfLines={1}
                style={{
                  color: 'rgba(255,255,255,0.32)',
                  fontSize: 12,
                  fontWeight: '400',
                  letterSpacing: 0.3,
                }}
              >
                Continue without account
              </CustomText>
            </TVTouchable>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}
