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
import { BRAND_LOGO_ASSET, BRAND_WORSHIP_ASSET } from '../util/brandAssets';
import { useDeviceClass } from '../util/deviceClassConfig';

export default function LandingScreen() {
  const router = useRouter();
  const device = useDeviceClass();
  const { width, height } = useWindowDimensions();
  const isPhone = device.isPhone && !Platform.isTV;
  const compact = height < 680;

  const logoSize = isPhone ? (compact ? 52 : 64) : device.isTV ? 88 : 72;
  const titleSize = isPhone ? (compact ? 26 : 32) : device.isTV ? 44 : 38;
  const gutter = isPhone ? 28 : device.isTV ? 64 : 48;
  const maxWidth = isPhone ? Math.min(width - gutter * 2, 360) : Math.min(480, width - gutter * 2);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      {/* Full-screen worship background */}
      <Image
        source={BRAND_WORSHIP_ASSET}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      {/* Gradient scrim — transparent top → dark bottom for text readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.60)', 'rgba(10,10,10,0.96)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingHorizontal: gutter,
            paddingBottom: compact ? 24 : 40,
          }}
        >
          <View style={{ width: '100%', maxWidth, gap: isPhone ? 28 : 36 }}>

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
                <Image
                  source={BRAND_LOGO_ASSET}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Headline + subtitle */}
            <View style={{ gap: isPhone ? 8 : 10 }}>
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
                  color: 'rgba(245,245,245,0.72)',
                  fontSize: 14,
                  lineHeight: 21,
                  fontWeight: '400',
                  textAlign: isPhone ? 'center' : 'left',
                }}
              >
                Music, videos &amp; live sessions from ClaudyGod — whenever, wherever.
              </CustomText>
            </View>

            {/* CTA buttons */}
            <View style={{ gap: 10 }}>
              <AppButton
                title="Create account"
                size="lg"
                fullWidth
                onPress={() => router.push(APP_ROUTES.auth.signUp)}
                leftIcon={<MaterialIcons name="person-add" size={18} color="#FFFFFF" />}
              />
              <AppButton
                title="Sign in"
                variant="outline"
                size="lg"
                fullWidth
                onPress={() => router.push(APP_ROUTES.auth.signIn)}
                leftIcon={<MaterialIcons name="login" size={18} color="#8B5CF6" />}
              />
              <TVTouchable
                onPress={() => router.replace(APP_ROUTES.tabs.home)}
                style={{ alignItems: 'center', paddingVertical: 12 }}
                showFocusBorder={false}
              >
                <CustomText
                  variant="label"
                  style={{ color: 'rgba(245,245,245,0.40)', fontSize: 13, fontWeight: '400' }}
                  numberOfLines={1}
                >
                  Continue without account
                </CustomText>
              </TVTouchable>
            </View>

          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
