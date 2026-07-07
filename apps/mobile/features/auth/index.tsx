import React, { useEffect, useRef } from 'react';
import {
  Animated,
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

import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';
import { BRAND_WORSHIP_ASSET } from '../../util/brandAssets';
import { useDeviceClass } from '../../util/deviceClassConfig';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// Features available to every guest — no account needed
const FREE_FEATURES = [
  { icon: 'music-note' as const,       label: 'Music'  },
  { icon: 'play-circle-outline' as const, label: 'Videos' },
  { icon: 'live-tv' as const,          label: 'Live'   },
  { icon: 'menu-book' as const,        label: 'Word'   },
] as const;

// Features unlocked after account creation
const ACCOUNT_PERKS = [
  { icon: 'favorite-border' as const, label: 'Save favorites' },
  { icon: 'sync' as const,            label: 'Sync library'   },
  { icon: 'download' as const,        label: 'Downloads'      },
] as const;

function FreeChip({ icon, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        backgroundColor: theme.colors.primarySurface,
        borderWidth: 1,
        borderColor: theme.colors.primaryBorder,
      }}
    >
      <MaterialIcons name={icon} size={13} color={theme.colors.secondary} />
      <CustomText style={{ color: theme.colors.secondary, fontSize: 11.5, fontWeight: '600', letterSpacing: 0.2 }}>
        {label}
      </CustomText>
    </View>
  );
}

function PerkRow({ icon, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <MaterialIcons name={icon} size={12} color="rgba(255,255,255,0.40)" />
      <CustomText style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11.5, fontWeight: '500' }}>
        {label}
      </CustomText>
    </View>
  );
}

export default function LandingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { width, height } = useWindowDimensions();
  const isPhone = device.isPhone && !Platform.isTV;
  const compact = height < 680;

  const titleSize = isPhone ? (compact ? 28 : 34) : device.isTV ? 52 : 42;
  const gutter = isPhone ? 24 : device.isTV ? 64 : 52;
  const maxWidth = isPhone
    ? Math.min(width - gutter * 2, 390)
    : Math.min(500, width - gutter * 2);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: 200, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const bgRgba = theme.colors.backgroundRgba;

  return (
    <View style={{ width, height, backgroundColor: theme.colors.background }}>

      {/* Full-bleed background */}
      <Image
        source={BRAND_WORSHIP_ASSET}
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        resizeMode="cover"
      />

      {/* Scrim: darkens image for text readability */}
      <LinearGradient
        colors={[
          `rgba(${bgRgba},0.05)`,
          `rgba(${bgRgba},0.35)`,
          `rgba(${bgRgba},0.78)`,
          `rgba(${bgRgba},0.97)`,
        ]}
        locations={[0, 0.32, 0.60, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, paddingHorizontal: gutter }}>

          <View style={{ flex: 1 }} />

          {/* ── Bottom content block ── */}
          <Animated.View
            style={{
              width: '100%',
              maxWidth,
              alignSelf: isPhone ? 'center' : 'flex-start',
              paddingBottom: compact ? 20 : 36,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Headline — on-image text, always light */}
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
                marginBottom: 8,
              }}
            >
              {'Worship\nwithout limits.'}
            </CustomText>

            {/* Subtitle — on-image text */}
            <CustomText
              variant="body"
              numberOfLines={2}
              style={{
                color: 'rgba(255,255,255,0.50)',
                fontSize: isPhone ? 13 : 15,
                lineHeight: isPhone ? 20 : 24,
                fontWeight: '400',
                textAlign: isPhone ? 'center' : 'left',
                marginBottom: 18,
              }}
            >
              {'Music, videos & live sessions from ClaudyGod.'}
            </CustomText>

            {/* FREE features chips */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 7,
                justifyContent: isPhone ? 'center' : 'flex-start',
                marginBottom: compact ? 20 : 26,
              }}
            >
              {FREE_FEATURES.map((f) => (
                <FreeChip key={f.label} icon={f.icon} label={f.label} />
              ))}
              <View
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 10,
                  borderRadius: 20,
                  backgroundColor: `${theme.colors.success}18`,
                  borderWidth: 1,
                  borderColor: `${theme.colors.success}36`,
                }}
              >
                <CustomText style={{ color: theme.colors.success, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  All FREE
                </CustomText>
              </View>
            </View>

            {/* PRIMARY CTA — explore without account */}
            <TVTouchable
              onPress={() => router.replace(APP_ROUTES.tabs.home)}
              showFocusBorder={false}
              style={{
                width: '100%',
                height: 56,
                borderRadius: 16,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
                marginBottom: 10,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.38,
                shadowRadius: 14,
                elevation: 10,
              }}
            >
              <MaterialIcons name="explore" size={20} color={theme.colors.onPrimary} />
              <CustomText style={{ color: theme.colors.onPrimary, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 }}>
                Start exploring — it&apos;s free
              </CustomText>
            </TVTouchable>

            {/* Perks teaser */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: isPhone ? 'center' : 'flex-start',
                gap: 12,
                marginBottom: compact ? 16 : 22,
                paddingHorizontal: 4,
              }}
            >
              {ACCOUNT_PERKS.map((p, idx) => (
                <React.Fragment key={p.label}>
                  {idx > 0 && (
                    <View style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.14)' }} />
                  )}
                  <PerkRow icon={p.icon} label={p.label} />
                </React.Fragment>
              ))}
            </View>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: compact ? 12 : 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <CustomText style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10.5, letterSpacing: 0.5 }}>
                UNLOCK ALL FEATURES
              </CustomText>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            </View>

            {/* Auth buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AppButton
                title="Create account"
                size="md"
                leftIcon={<MaterialIcons name="person-add" size={16} color={theme.colors.onPrimary} />}
                onPress={() => router.push(APP_ROUTES.auth.signUp)}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Sign in"
                variant="outline"
                size="md"
                leftIcon={<MaterialIcons name="login" size={16} color={theme.colors.primary} />}
                onPress={() => router.push(APP_ROUTES.auth.signIn)}
                style={{ flex: 1 }}
              />
            </View>

          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}
