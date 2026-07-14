import React, { useEffect, useRef, useState } from 'react';
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
import { AppLoadingScreen } from '../components/Exp/AppLoading';
import { useAppTheme } from '../util/colorScheme';
import { makeStyles } from '../styles/makeStyles';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_WORSHIP_ASSET } from '../util/brandAssets';
import { useDeviceClass } from '../util/deviceClassConfig';
import { getPreference, setPreference } from '../lib/localUserStorage';

// Native-only — the web build already has its own marketing landing page (below)
// gated on nothing, but native first-launch users were dropped straight into the
// tabs with no introduction at all. One-time flag, same key convention as the
// rest of localUserStorage's getPreference/setPreference usage.
const ONBOARDING_SEEN_KEY = 'onboarding.hasSeenIntro';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const FEATURES = [
  { icon: 'music-note' as const,            label: 'Music'  },
  { icon: 'play-circle-outline' as const,   label: 'Videos' },
  { icon: 'live-tv' as const,               label: 'Live'   },
  { icon: 'menu-book' as const,             label: 'Word'   },
] as const;

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  safeArea:  { flex: 1 },
  flex1:     { flex: 1 },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 6, paddingHorizontal: 11, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  featureChipText: { color: 'rgba(255,255,255,0.80)', fontSize: 12, fontWeight: '600' },
  brandLabel: {
    color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '700',
    letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10,
  },
  headlineBase:  { color: '#FFFFFF', fontWeight: '700', letterSpacing: -0.8, marginBottom: 12 },
  chipsRowBase:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ctaBtn: {
    width: '100%', height: 54, borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
  },
  ctaText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
}));

// ─── Sub-component ────────────────────────────────────────────────────────────

function FeatureChip({ icon, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.featureChip}>
      <MaterialIcons name={icon} size={13} color="rgba(255,255,255,0.80)" />
      <CustomText style={styles.featureChipText}>{label}</CustomText>
    </View>
  );
}

// ─── Brand intro (shared by the web landing page and native first-launch onboarding) ──

function BrandIntroScreen({
  onContinue,
  ctaLabel = 'Explore now',
}: {
  onContinue: () => void;
  ctaLabel?: string;
}) {
  const styles = useStyles();
  const theme = useAppTheme();
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
      <Image
        source={BRAND_WORSHIP_ASSET}
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        resizeMode="cover"
      />

      <LinearGradient
        colors={['rgba(5,4,12,0.0)', 'rgba(5,4,12,0.55)', 'rgba(5,4,12,0.92)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.flex1, { paddingHorizontal: gutter }]}>
          <View style={styles.flex1} />

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
            <CustomText
              style={[styles.brandLabel, { textAlign: isPhone ? 'center' : 'left' }]}
            >
              ClaudyGod
            </CustomText>

            <CustomText
              variant="display"
              numberOfLines={3}
              style={[
                styles.headlineBase,
                {
                  fontSize: titleSize,
                  lineHeight: Math.round(titleSize * 1.12),
                  textAlign: isPhone ? 'center' : 'left',
                },
              ]}
            >
              {'Worship\nwithout limits.'}
            </CustomText>

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

            <View
              style={[
                styles.chipsRowBase,
                { justifyContent: isPhone ? 'center' : 'flex-start', marginBottom: compact ? 22 : 30 },
              ]}
            >
              {FEATURES.map((f) => (
                <FeatureChip key={f.label} icon={f.icon} label={f.label} />
              ))}
            </View>

            <TVTouchable
              onPress={onContinue}
              showFocusBorder={false}
              style={styles.ctaBtn}
            >
              <MaterialIcons name="explore" size={20} color={theme.colors.onPrimary ?? '#fff'} />
              <CustomText style={styles.ctaText}>{ctaLabel}</CustomText>
            </TVTouchable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Web landing page ─────────────────────────────────────────────────────────

function LandingPage() {
  const router = useRouter();
  return <BrandIntroScreen onContinue={() => router.replace(APP_ROUTES.tabs.home)} />;
}

// ─── Native first-launch onboarding ────────────────────────────────────────────

function NativeEntry() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'show' | 'done'>('checking');

  useEffect(() => {
    let cancelled = false;
    getPreference(ONBOARDING_SEEN_KEY, false).then((seen) => {
      if (!cancelled) setStatus(seen ? 'done' : 'show');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleContinue = () => {
    void setPreference(ONBOARDING_SEEN_KEY, true);
    router.replace(APP_ROUTES.tabs.home);
  };

  if (status === 'checking') return <AppLoadingScreen />;
  if (status === 'done') return <Redirect href="/(tabs)/home" />;
  return <BrandIntroScreen onContinue={handleContinue} ctaLabel="Get started" />;
}

export default function Index() {
  if (Platform.OS !== 'web') {
    return <NativeEntry />;
  }
  return <LandingPage />;
}
