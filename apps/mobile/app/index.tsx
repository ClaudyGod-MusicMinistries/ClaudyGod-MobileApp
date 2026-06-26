import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../components/CustomText';
import { TVTouchable } from '../components/ui/TVTouchable';
import { useAppTheme } from '../util/colorScheme';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_WORSHIP_ASSET } from '../util/brandAssets';
import { useDeviceClass } from '../util/deviceClassConfig';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const FEATURES = [
  { icon: 'music-note' as const,            label: 'Music'  },
  { icon: 'play-circle-outline' as const,   label: 'Videos' },
  { icon: 'live-tv' as const,               label: 'Live'   },
  { icon: 'menu-book' as const,             label: 'Word'   },
] as const;

function FeatureChip({ icon, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 11,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
      }}
    >
      <MaterialIcons name={icon} size={13} color="rgba(255,255,255,0.80)" />
      <CustomText style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, fontWeight: '600' }}>
        {label}
      </CustomText>
    </View>
  );
}

function LandingPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { width, height } = useWindowDimensions();
  const isPhone = !device.isDesktop && !device.isTV;
  const compact = height < 680;

  const titleSize = isPhone ? (compact ? 30 : 36) : device.isTV ? 52 : 44;
  const gutter = isPhone ? 28 : device.isTV ? 80 : 64;
  const maxWidth = isPhone ? Math.min(width - gutter * 2, 400) : Math.min(520, width - gutter * 2);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 120, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: 120, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={{ width, height, backgroundColor: '#0a0a0f' }}>
      {/* Hero image */}
      <Image
        source={BRAND_WORSHIP_ASSET}
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        resizeMode="cover"
      />

      {/* Gradient scrim — text readability only, bottom-heavy */}
      <LinearGradient
        colors={['rgba(5,4,12,0.0)', 'rgba(5,4,12,0.55)', 'rgba(5,4,12,0.92)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, paddingHorizontal: gutter }}>
          {/* Spacer — push content to bottom */}
          <View style={{ flex: 1 }} />

          <Animated.View
            style={{
              width: '100%',
              maxWidth,
              alignSelf: isPhone ? 'center' : 'flex-start',
              paddingBottom: compact ? 24 : 44,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Brand label */}
            <CustomText
              style={{
                color: 'rgba(255,255,255,0.50)',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                textAlign: isPhone ? 'center' : 'left',
                marginBottom: 10,
              }}
            >
              ClaudyGod
            </CustomText>

            {/* Headline */}
            <CustomText
              variant="display"
              numberOfLines={3}
              style={{
                color: '#FFFFFF',
                fontSize: titleSize,
                lineHeight: Math.round(titleSize * 1.12),
                fontWeight: '700',
                letterSpacing: -0.8,
                textAlign: isPhone ? 'center' : 'left',
                marginBottom: 12,
              }}
            >
              {'Worship\nwithout limits.'}
            </CustomText>

            {/* Subtitle */}
            <CustomText
              variant="body"
              style={{
                color: 'rgba(255,255,255,0.48)',
                fontSize: isPhone ? 14 : 15,
                lineHeight: isPhone ? 21 : 24,
                textAlign: isPhone ? 'center' : 'left',
                marginBottom: compact ? 20 : 26,
              }}
            >
              {'Music, videos & live sessions — completely free.'}
            </CustomText>

            {/* Feature chips */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: isPhone ? 'center' : 'flex-start',
                marginBottom: compact ? 22 : 30,
              }}
            >
              {FEATURES.map((f) => (
                <FeatureChip key={f.label} icon={f.icon} label={f.label} />
              ))}
            </View>

            {/* Primary CTA */}
            <TVTouchable
              onPress={() => router.replace(APP_ROUTES.tabs.home)}
              showFocusBorder={false}
              style={{
                width: '100%',
                height: 54,
                borderRadius: 14,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
              }}
            >
              <MaterialIcons name="explore" size={20} color={theme.colors.onPrimary ?? '#fff'} />
              <CustomText style={{ color: theme.colors.onPrimary ?? '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 }}>
                Explore now
              </CustomText>
            </TVTouchable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function Index() {
  if (Platform.OS !== 'web') {
    return <Redirect href="/(tabs)/home" />;
  }
  return <LandingPage />;
}
