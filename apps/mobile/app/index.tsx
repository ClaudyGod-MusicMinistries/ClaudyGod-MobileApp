import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { TVTouchable } from '../components/ui/TVTouchable';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET } from '../util/brandAssets';
import { useDeviceClass } from '../util/deviceClassConfig';

const FEATURE_PILLS = [
  { label: 'Music', icon: 'graphic-eq' as const, color: '#B794F6' },
  { label: 'Videos', icon: 'smart-display' as const, color: '#60A5FA' },
  { label: 'Live', icon: 'live-tv' as const, color: '#F87171' },
  { label: 'Daily Word', icon: 'auto-stories' as const, color: '#FCD34D' },
] as const;

function FeaturePills() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {FEATURE_PILLS.map((pill) => (
        <View
          key={pill.label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: '#1A1A1A',
          }}
        >
          <MaterialIcons name={pill.icon} size={13} color={pill.color} />
          <CustomText
            variant="caption"
            style={{ color: '#C6BEDB', fontSize: 11, fontWeight: '600' }}
          >
            {pill.label}
          </CustomText>
        </View>
      ))}
    </View>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const device = useDeviceClass();
  const { width, height } = useWindowDimensions();
  const isPhone = device.isPhone && !Platform.isTV;
  const compact = height < 680;

  const logoSize = isPhone ? (compact ? 52 : 60) : device.isTV ? 80 : 68;
  const titleSize = isPhone ? (compact ? 26 : 30) : device.isTV ? 42 : 36;
  const gutter = isPhone ? 24 : device.isTV ? 64 : 48;
  const maxWidth = isPhone ? Math.min(width - gutter * 2, 380) : Math.min(500, width - gutter * 2);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: gutter,
            paddingVertical: compact ? 24 : 36,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: '100%', maxWidth, gap: isPhone ? 28 : 36 }}>

            {/* Logo + brand name */}
            <View style={{ alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: logoSize,
                  height: logoSize,
                  borderRadius: Math.round(logoSize * 0.26),
                  backgroundColor: '#1A1A1A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Image source={BRAND_LOGO_ASSET} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <CustomText
                variant="caption"
                style={{ color: '#9287AD', fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', fontWeight: '600' }}
              >
                ClaudyGod
              </CustomText>
            </View>

            {/* Tagline */}
            <View style={{ alignItems: isPhone ? 'center' : 'flex-start', gap: 8 }}>
              <CustomText
                variant="display"
                numberOfLines={2}
                style={{
                  color: '#F7F2FF',
                  fontSize: titleSize,
                  lineHeight: Math.round(titleSize * 1.14),
                  fontWeight: '700',
                  letterSpacing: -0.8,
                  textAlign: isPhone ? 'center' : 'left',
                }}
              >
                Worship{'\n'}without limits.
              </CustomText>
              <CustomText
                variant="body"
                style={{
                  color: '#9287AD',
                  fontSize: 13,
                  lineHeight: 19,
                  textAlign: isPhone ? 'center' : 'left',
                  maxWidth: 320,
                }}
              >
                Music, videos &amp; live sessions from ClaudyGod — whenever, wherever.
              </CustomText>
            </View>

            {/* Feature pills */}
            <View style={{ alignItems: isPhone ? 'center' : 'flex-start' }}>
              <FeaturePills />
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
                style={{ alignItems: 'center', paddingVertical: 10 }}
                showFocusBorder={false}
              >
                <CustomText
                  variant="label"
                  style={{ color: '#9287AD', fontSize: 12, textDecorationLine: 'none' }}
                  numberOfLines={1}
                >
                  Browse without account
                </CustomText>
              </TVTouchable>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
