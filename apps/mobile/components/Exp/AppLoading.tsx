import React, { useEffect, useRef } from 'react';
import { Animated, Image, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';

export function AppLoadingScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1900, useNativeDriver: true }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.02, duration: 920, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.96, duration: 920, useNativeDriver: true }),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [pulse, spin]);

  const size = compact ? 70 : 82;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: '#07050C' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#07050C" />
      <LinearGradient
        colors={['#120B20', '#0B0714', '#07050C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={['rgba(183,148,246,0.16)', 'rgba(183,148,246,0)']}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ position: 'absolute', top: -70, left: -60, width: 260, height: 260, borderRadius: 260 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View
            style={{
              width: '100%',
              maxWidth: 330,
              alignItems: 'center',
              borderRadius: 28,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(18,12,30,0.66)',
              paddingHorizontal: 22,
              paddingVertical: 26,
            }}
          >
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: 2,
                  borderColor: 'rgba(183,148,246,0.13)',
                  borderTopColor: '#B794F6',
                  transform: [{ rotate }],
                }}
              />
              <Animated.View
                style={{
                  width: size - 22,
                  height: size - 22,
                  borderRadius: (size - 22) / 2,
                  backgroundColor: 'rgba(255,255,255,0.055)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pulse }],
                }}
              >
                <Image source={BRAND_LOGO_ASSET} style={{ width: compact ? 28 : 32, height: compact ? 28 : 32, borderRadius: 10 }} />
              </Animated.View>
            </View>
            <Text style={{ marginTop: 16, color: '#F7F2FF', fontSize: compact ? 16 : 18, fontWeight: '700', textAlign: 'center' }}>
              ClaudyGod
            </Text>
            <Text style={{ marginTop: 7, color: 'rgba(198,190,219,0.82)', fontSize: 12, textAlign: 'center', lineHeight: 17 }}>
              Preparing your worship experience
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
