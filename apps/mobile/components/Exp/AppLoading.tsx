import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_LOGO_ASSET, BRAND_WORSHIP_ASSET } from '../../util/brandAssets';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export function AppLoadingScreen() {
  const { width } = useWindowDimensions();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 9, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.timing(contentOpacity, { toValue: 1, duration: 340, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 1400, useNativeDriver: USE_NATIVE_DRIVER }),
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
    // useRef values are stable — safe to omit from deps
  }, [logoOpacity, logoScale, contentOpacity, shimmer]);

  const isCompact = width < 390;
  const logoSize = isCompact ? 80 : 96;
  const logoRadius = Math.round(logoSize * 0.22);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Centered background image */}
      <Image
        source={BRAND_WORSHIP_ASSET}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Dark overlay for readability */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.70)' }} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: logoRadius,
              overflow: 'hidden',
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          >
            <Image source={BRAND_LOGO_ASSET} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </Animated.View>

          <Animated.View style={{ alignItems: 'center', marginTop: 22, opacity: contentOpacity }}>
            <Animated.Text
              style={{
                color: '#FFFFFF',
                fontSize: isCompact ? 24 : 28,
                fontWeight: '700',
                letterSpacing: -0.6,
                fontFamily: 'Manrope_700Bold',
                textAlign: 'center',
              }}
            >
              ClaudyGod
            </Animated.Text>
            <Animated.Text
              style={{
                color: '#B794F6',
                fontSize: 10,
                letterSpacing: 3.4,
                textTransform: 'uppercase',
                fontFamily: 'Manrope_400Regular',
                textAlign: 'center',
                marginTop: 10,
                opacity: shimmer,
              }}
            >
              Worship · Music · Ministry
            </Animated.Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
