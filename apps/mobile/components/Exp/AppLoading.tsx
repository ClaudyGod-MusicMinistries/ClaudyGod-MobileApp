import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ─── Static styles (no theme) ─────────────────────────────────────────────────

const ss = StyleSheet.create({
  safeArea: { flex: 1 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

// ─── Theme styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  rootBg:    { backgroundColor: theme.colors.background },
  brandName: {
    color: theme.colors.text, fontWeight: '700', letterSpacing: -0.6,
    fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center',
  },
  taglineBase: {
    color: theme.colors.primary, fontSize: 10, letterSpacing: 3.4,
    textTransform: 'uppercase', fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center', marginTop: 10,
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function AppLoadingScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width, height } = useWindowDimensions();

  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.88)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const shimmer        = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(logoScale,   { toValue: 1, tension: 50, friction: 9, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.timing(contentOpacity, { toValue: 1, duration: 340, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1,    duration: 1400, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(shimmer, { toValue: 0.28, duration: 1400, useNativeDriver: USE_NATIVE_DRIVER }),
        ])
      ).start();
    });

    return () => {
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      contentOpacity.stopAnimation();
      shimmer.stopAnimation();
    };
  }, [logoOpacity, logoScale, contentOpacity, shimmer]);

  const isCompact  = width < 390;
  const logoSize   = isCompact ? 112 : 128;
  const logoRadius = 28;

  return (
    <View style={[styles.rootBg, { width, height }]}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <SafeAreaView style={ss.safeArea} edges={['top', 'bottom']}>
        <View style={ss.center}>
          <Animated.View
            style={{
              width: logoSize, height: logoSize, borderRadius: logoRadius,
              overflow: 'hidden', opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 },
              shadowRadius: 16, shadowOpacity: 0.14, elevation: 6,
            }}
          >
            <Image source={BRAND_LOGO_ASSET} style={{ width: logoSize, height: logoSize }} resizeMode="cover" />
          </Animated.View>

          <Animated.View style={{ alignItems: 'center', marginTop: 24, opacity: contentOpacity }}>
            <Animated.Text style={[styles.brandName, { fontSize: isCompact ? 26 : 30 }]}>
              ClaudyGod
            </Animated.Text>
            <Animated.Text style={[styles.taglineBase, { opacity: shimmer }]}>
              Worship · Music · Ministry
            </Animated.Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
