import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { TVTouchable } from '../components/ui/TVTouchable';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET } from '../util/brandAssets';
import { useDeviceClass } from '../util/deviceClassConfig';

export default function LandingScreen() {
  const router = useRouter();
  const device = useDeviceClass();
  const { width, height } = useWindowDimensions();
  const isPhone = device.isPhone && !Platform.isTV;
  const compact = height < 680;

  const logoSize = isPhone ? (compact ? 56 : 68) : device.isTV ? 88 : 76;
  const titleSize = isPhone ? (compact ? 28 : 32) : device.isTV ? 44 : 38;
  const gutter = isPhone ? 28 : device.isTV ? 64 : 48;
  const maxWidth = isPhone ? Math.min(width - gutter * 2, 360) : Math.min(480, width - gutter * 2);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: gutter,
            paddingVertical: compact ? 28 : 44,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: '100%', maxWidth, gap: isPhone ? 32 : 40 }}>

            {/* Logo */}
            <View style={{ alignItems: isPhone ? 'center' : 'flex-start' }}>
              <View
                style={{
                  width: logoSize,
                  height: logoSize,
                  borderRadius: Math.round(logoSize * 0.24),
                  overflow: 'hidden',
                  backgroundColor: '#141414',
                }}
              >
                <Image source={BRAND_LOGO_ASSET} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            </View>

            {/* Headline + subtitle + features */}
            <View style={{ gap: isPhone ? 10 : 12 }}>
              <CustomText
                variant="display"
                numberOfLines={2}
                style={{
                  color: '#FFFFFF',
                  fontSize: titleSize,
                  lineHeight: Math.round(titleSize * 1.12),
                  fontWeight: '700',
                  letterSpacing: -0.8,
                  textAlign: isPhone ? 'center' : 'left',
                }}
              >
                Worship{'\n'}without limits.
              </CustomText>

              <CustomText
                variant="body"
                numberOfLines={2}
                style={{
                  color: '#7A7288',
                  fontSize: 14,
                  lineHeight: 21,
                  fontWeight: '400',
                  textAlign: isPhone ? 'center' : 'left',
                }}
              >
                Music, videos &amp; live sessions from ClaudyGod — whenever, wherever.
              </CustomText>

              {/* Features — clean dot-separated */}
              <CustomText
                variant="caption"
                numberOfLines={1}
                style={{
                  color: '#4A4558',
                  fontSize: 12,
                  fontWeight: '400',
                  letterSpacing: 0.3,
                  textAlign: isPhone ? 'center' : 'left',
                  marginTop: 2,
                }}
              >
                Music  ·  Videos  ·  Live  ·  Daily Word
              </CustomText>
            </View>

            {/* CTA buttons */}
            <View style={{ gap: 10 }}>
              <AppButton
                title="Create account"
                size="lg"
                fullWidth
                onPress={() => router.push(APP_ROUTES.auth.signUp)}
              />
              <AppButton
                title="Sign in"
                variant="outline"
                size="lg"
                fullWidth
                onPress={() => router.push(APP_ROUTES.auth.signIn)}
              />
              <TVTouchable
                onPress={() => router.replace(APP_ROUTES.tabs.home)}
                style={{ alignItems: 'center', paddingVertical: 12 }}
                showFocusBorder={false}
              >
                <CustomText
                  variant="label"
                  style={{ color: '#4A4558', fontSize: 13, fontWeight: '400' }}
                  numberOfLines={1}
                >
                  Continue without account
                </CustomText>
              </TVTouchable>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
