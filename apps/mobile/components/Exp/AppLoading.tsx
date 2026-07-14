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
  glow:     { position: 'absolute', borderRadius: 999 },
  dotsRow:  { flexDirection: 'row', gap: 8, position: 'absolute', bottom: 56, alignSelf: 'center' },
  dot:      { width: 6, height: 6, borderRadius: 3 },
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
  glowPrimary: { backgroundColor: theme.colors.primary },
  dotFill:     { backgroundColor: theme.colors.primary },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function AppLoadingScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width, height } = useWindowDimensions();

  const glowPulse       = useRef(new Animated.Value(0.5)).current;
  const haloBreath      = useRef(new Animated.Value(0.85)).current;
  const logoOpacity     = useRef(new Animated.Value(0)).current;
  const logoScale       = useRef(new Animated.Value(0.82)).current;
  const nameOpacity     = useRef(new Animated.Value(0)).current;
  const nameSlide       = useRef(new Animated.Value(14)).current;
  const taglineOpacity  = useRef(new Animated.Value(0)).current;
  const taglineSlide    = useRef(new Animated.Value(10)).current;
  const shimmer         = useRef(new Animated.Value(0.28)).current;
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    // Ambient glow breathes continuously from the very first frame — the screen
    // feels alive before the logo has even appeared, not just a static background.
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1,    duration: 2600, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(glowPulse, { toValue: 0.5,  duration: 2600, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    glowLoop.start();

    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloBreath, { toValue: 1.08, duration: 1900, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(haloBreath, { toValue: 0.85, duration: 1900, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    haloLoop.start();

    // Staggered entrance: logo, then name, then tagline — a choreographed reveal
    // rather than everything appearing in one flat fade, so the brand moment has
    // a shape the eye can follow and remember.
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 550, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(logoScale,   { toValue: 1, tension: 46, friction: 8, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 1, duration: 480, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(nameSlide,   { toValue: 0, tension: 60, friction: 10, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 420, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(taglineSlide,   { toValue: 0, tension: 60, friction: 10, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1,    duration: 1500, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(shimmer, { toValue: 0.28, duration: 1500, useNativeDriver: USE_NATIVE_DRIVER }),
        ]),
      ).start();
    });

    // Sequential loading dots — start once the brand moment has had time to
    // register, so the very first thing on screen is the brand, not a spinner.
    const dotTiming = (value: Animated.Value) => Animated.sequence([
      Animated.timing(value, { toValue: 1,    duration: 420, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(value, { toValue: 0.25, duration: 420, useNativeDriver: USE_NATIVE_DRIVER }),
    ]);
    const dotsTimer = setTimeout(() => {
      Animated.loop(
        Animated.stagger(180, [dotTiming(dot1), dotTiming(dot2), dotTiming(dot3)]),
      ).start();
    }, 900);

    return () => {
      clearTimeout(dotsTimer);
      glowLoop.stop();
      haloLoop.stop();
      glowPulse.stopAnimation();
      haloBreath.stopAnimation();
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      nameOpacity.stopAnimation();
      nameSlide.stopAnimation();
      taglineOpacity.stopAnimation();
      taglineSlide.stopAnimation();
      shimmer.stopAnimation();
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [glowPulse, haloBreath, logoOpacity, logoScale, nameOpacity, nameSlide, taglineOpacity, taglineSlide, shimmer, dot1, dot2, dot3]);

  const isCompact  = width < 390;
  const logoSize   = isCompact ? 112 : 128;
  const logoRadius = 28;
  const haloSize   = logoSize + 40;

  return (
    <View style={[styles.rootBg, { width, height }]}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Ambient background glow — off-canvas, breathing continuously */}
      <Animated.View
        style={[
          ss.glow, styles.glowPrimary,
          {
            width: width * 0.9, height: width * 0.9,
            top: -width * 0.45, right: -width * 0.35,
            opacity: glowPulse.interpolate({ inputRange: [0.5, 1], outputRange: [0.05, 0.11] }),
          },
        ]}
      />
      <Animated.View
        style={[
          ss.glow, styles.glowPrimary,
          {
            width: width * 0.75, height: width * 0.75,
            bottom: -width * 0.4, left: -width * 0.3,
            opacity: glowPulse.interpolate({ inputRange: [0.5, 1], outputRange: [0.04, 0.08] }),
          },
        ]}
      />

      <SafeAreaView style={ss.safeArea} edges={['top', 'bottom']}>
        <View style={ss.center}>
          <View style={{ width: haloSize, height: haloSize, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={[
                ss.glow, styles.glowPrimary,
                {
                  width: haloSize, height: haloSize,
                  opacity: 0.16,
                  transform: [{ scale: haloBreath }],
                },
              ]}
            />
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
          </View>

          <Animated.View
            style={{
              alignItems: 'center', marginTop: 24,
              opacity: nameOpacity,
              transform: [{ translateY: nameSlide }],
            }}
          >
            <Animated.Text style={[styles.brandName, { fontSize: isCompact ? 26 : 30 }]}>
              ClaudyGod
            </Animated.Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: taglineOpacity,
              transform: [{ translateY: taglineSlide }],
            }}
          >
            <Animated.Text style={[styles.taglineBase, { opacity: shimmer }]}>
              Worship · Music · Ministry
            </Animated.Text>
          </Animated.View>
        </View>

        <View style={ss.dotsRow}>
          <Animated.View style={[ss.dot, styles.dotFill, { opacity: dot1 }]} />
          <Animated.View style={[ss.dot, styles.dotFill, { opacity: dot2 }]} />
          <Animated.View style={[ss.dot, styles.dotFill, { opacity: dot3 }]} />
        </View>
      </SafeAreaView>
    </View>
  );
}
