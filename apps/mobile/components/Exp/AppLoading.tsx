import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageBackground, StatusBar, Text, View, useWindowDimensions } from 'react-native';
// Choose a modern background image from assets
import landingBg from '../../assets/images/landing4.jpg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';

export function AppLoadingScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2100, useNativeDriver: true }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.015, duration: 980, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.97, duration: 980, useNativeDriver: true }),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [pulse, spin]);

  const size = compact ? 62 : 72;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <ImageBackground
      source={landingBg}
      resizeMode="cover"
      style={{ flex: 1, width: '100%', height: '100%' }}
      imageStyle={{ opacity: 0.93 }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(2,1,6,0.55)' }}>
        <StatusBar translucent={false} barStyle="light-content" backgroundColor="#020106" />
        <LinearGradient
          colors={['#020106', '#06020B', '#020106']}
          start={{ x: 0.05, y: 0 }}
          end={{ x: 0.95, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={['rgba(124,58,237,0.12)', 'rgba(124,58,237,0)']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ position: 'absolute', top: -90, left: -80, width: 280, height: 280, borderRadius: 280 }}
        />

        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
            <View
              style={{
                width: '100%',
                maxWidth: 292,
                alignItems: 'center',
                borderRadius: 26,
                borderWidth: 1,
                borderColor: 'rgba(185,148,255,0.10)',
                backgroundColor: 'rgba(9,5,16,0.72)',
                paddingHorizontal: 22,
                paddingVertical: 24,
              }}
            >
              <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 1.7,
                    borderColor: 'rgba(185,148,255,0.11)',
                    borderTopColor: 'rgba(185,148,255,0.82)',
                    transform: [{ rotate }],
                  }}
                />
                <Animated.View
                  style={{
                    width: size - 20,
                    height: size - 20,
                    borderRadius: (size - 20) / 2,
                    backgroundColor: 'rgba(255,255,255,0.045)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: pulse }],
                  }}
                >
                  <Image source={BRAND_LOGO_ASSET} style={{ width: compact ? 27 : 30, height: compact ? 27 : 30, borderRadius: 10 }} />
                </Animated.View>
              </View>
              <Text style={{ marginTop: 15, color: '#F4EEFF', fontSize: compact ? 15 : 16, fontWeight: '700', textAlign: 'center' }}>
                ClaudyGod
              </Text>
              <Text style={{ marginTop: 6, color: 'rgba(184,175,203,0.72)', fontSize: 11.5, textAlign: 'center', lineHeight: 16 }}>
                Preparing your worship space
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}
