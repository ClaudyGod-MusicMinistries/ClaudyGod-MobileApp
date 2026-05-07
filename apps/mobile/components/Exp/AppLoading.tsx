import React, { useEffect, useRef } from 'react';
import { Animated, Image, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';

export function AppLoadingScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1800, useNativeDriver: true }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.94, duration: 900, useNativeDriver: true }),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [pulse, spin]);

  const size = compact ? 78 : 92;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: '#08050F' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#08050F" />
      <LinearGradient
        colors={['#191028', '#0D0818', '#08050F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              alignItems: 'center',
              borderRadius: 32,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
              backgroundColor: 'rgba(18,12,32,0.72)',
              paddingHorizontal: 24,
              paddingVertical: 30,
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
                  borderColor: 'rgba(183,148,246,0.16)',
                  borderTopColor: '#B794F6',
                  transform: [{ rotate }],
                }}
              />
              <Animated.View
                style={{
                  width: size - 22,
                  height: size - 22,
                  borderRadius: (size - 22) / 2,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pulse }],
                }}
              >
                <Image source={BRAND_LOGO_ASSET} style={{ width: compact ? 30 : 34, height: compact ? 30 : 34, borderRadius: 10 }} />
              </Animated.View>
            </View>
            <Text style={{ marginTop: 18, color: '#FFFFFF', fontSize: compact ? 18 : 20, fontWeight: '700', textAlign: 'center' }}>
              ClaudyGod
            </Text>
            <Text style={{ marginTop: 8, color: 'rgba(255,255,255,0.64)', fontSize: 12, textAlign: 'center', lineHeight: 17 }}>
              Preparing your worship experience
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
