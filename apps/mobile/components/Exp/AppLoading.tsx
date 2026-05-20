import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../../util/brandAssets';

// Stable constant — safe to omit from effect deps
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export function AppLoadingScreen() {
  const { width, height } = useWindowDimensions();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 540, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(logoScale, { toValue: 1, tension: 48, friction: 9, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.timing(contentOpacity, { toValue: 1, duration: 360, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();

    Animated.timing(progressAnim, { toValue: 0.82, duration: 2800, useNativeDriver: false }).start();

    return () => {
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      contentOpacity.stopAnimation();
      progressAnim.stopAnimation();
    };
    // useRef values are stable — safe to omit from deps
  }, [logoOpacity, logoScale, contentOpacity, progressAnim]);

  const isCompact = width < 390;
  const logoSize = isCompact ? 78 : 92;
  const logoRadius = Math.round(logoSize * 0.25);

  return (
    <View style={{ flex: 1, backgroundColor: '#03020A' }}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Background image — very subtle */}
      <Image
        source={LANDING_BG_ASSET}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.14 }}
      />

      {/* Dark gradient */}
      <LinearGradient
        colors={['#03020A', 'rgba(5,3,14,0.95)', '#07050C']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Purple ambient glow behind logo */}
      <View
        style={{
          position: 'absolute',
          top: height * 0.26 - 120,
          left: width * 0.5 - 120,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: 'rgba(183,148,246,0.07)',
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          {/* Logo mark */}
          <Animated.View
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: logoRadius,
              overflow: 'hidden',
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              shadowColor: '#B794F6',
              shadowOpacity: 0.28,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 10 },
              elevation: 14,
            }}
          >
            <Image
              source={BRAND_LOGO_ASSET}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Brand name + tagline */}
          <Animated.View
            style={{ alignItems: 'center', marginTop: 24, gap: 8, opacity: contentOpacity }}
          >
            <Text
              style={{
                color: '#F7F2FF',
                fontSize: isCompact ? 23 : 27,
                fontWeight: '700',
                letterSpacing: -0.6,
                textAlign: 'center',
              }}
            >
              ClaudyGod
            </Text>
            <Text
              style={{
                color: 'rgba(183,148,246,0.65)',
                fontSize: 10.5,
                letterSpacing: 2.6,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              Worship · Music · Ministry
            </Text>
          </Animated.View>
        </View>

        {/* Thin progress bar — bottom of screen */}
        <View style={{ paddingHorizontal: 52, paddingBottom: 46 }}>
          <View
            style={{
              height: 2,
              backgroundColor: 'rgba(255,255,255,0.07)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: '#B794F6',
                borderRadius: 999,
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
