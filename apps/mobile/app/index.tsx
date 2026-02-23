import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StatusBar,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { TVTouchable } from '../components/ui/TVTouchable';
import { Screen } from '../components/layout/Screen';

export default function LandingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const compact = height < 700 || width < 360;

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;
  const logoPulse = useRef(new Animated.Value(0.96)).current;
  const orbDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 0.96, duration: 1500, useNativeDriver: true }),
      ]),
    );
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbDrift, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(orbDrift, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ]),
    );

    pulseLoop.start();
    driftLoop.start();

    return () => {
      pulseLoop.stop();
      driftLoop.stop();
    };
  }, [fade, logoPulse, orbDrift, rise]);

  const driftY = orbDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const logoSize = isTV ? 110 : isTablet ? 92 : compact ? 60 : 68;
  const titleSize = isTV ? 30 : isTablet ? 24 : compact ? 18 : 20;
  const cardWidth = isTV ? 620 : isTablet ? 540 : 440;

  return (
    <View style={{ flex: 1, backgroundColor: '#05040D' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#05040D" />

      <LinearGradient
        colors={['#090611', '#120A24', '#05040D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -60,
          left: -40,
          width: 220,
          height: 220,
          borderRadius: 220,
          backgroundColor: 'rgba(154,107,255,0.12)',
          transform: [{ translateY: driftY }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -90,
          bottom: 80,
          width: 260,
          height: 260,
          borderRadius: 260,
          backgroundColor: 'rgba(99,102,241,0.08)',
          transform: [{ translateY: driftY }],
        }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#05040D' }} edges={['top', 'bottom', 'left', 'right']}>
        <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: compact ? 4 : 10, paddingBottom: 10 }}>
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)',
                backgroundColor: 'rgba(10,8,17,0.84)',
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                  <Image source={require('../assets/images/ClaudyGoLogo.webp')} style={{ width: 30, height: 30, borderRadius: 15 }} />
                  <View style={{ marginLeft: 10 }}>
                    <CustomText variant="caption" style={{ color: 'rgba(212,203,236,0.86)' }}>
                      ClaudyGod Ministries
                    </CustomText>
                    <CustomText variant="label" style={{ color: '#F8F7FC' }}>
                      Streaming App
                    </CustomText>
                  </View>
                </View>

                <TVTouchable
                  onPress={() => router.replace('/(tabs)/home')}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(233,221,255,0.22)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                  }}
                  showFocusBorder={false}
                >
                  <CustomText variant="caption" style={{ color: '#EDE3FF' }}>
                    Demo
                  </CustomText>
                </TVTouchable>
              </View>
            </View>

            <Animated.View
              style={{
                opacity: fade,
                transform: [{ translateY: rise }],
                alignItems: 'center',
                marginVertical: compact ? 16 : 22,
              }}
            >
              <Animated.View
                style={{
                  width: logoSize + 26,
                  height: logoSize + 26,
                  borderRadius: (logoSize + 26) / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.14)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  transform: [{ scale: logoPulse }],
                }}
              >
                <Image
                  source={require('../assets/images/ClaudyGoLogo.webp')}
                  style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
                />
              </Animated.View>

              <View
                style={{
                  width: '100%',
                  maxWidth: cardWidth,
                  marginTop: 16,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(10,8,17,0.9)',
                  padding: compact ? 16 : 18,
                }}
              >
                <CustomText
                  variant="hero"
                  style={{
                    color: '#F8F7FC',
                    textAlign: 'center',
                    fontSize: titleSize,
                    lineHeight: titleSize + 6,
                  }}
                >
                  A refined worship streaming experience.
                </CustomText>

                <CustomText
                  variant="body"
                  style={{
                    marginTop: 8,
                    color: 'rgba(210,201,233,0.9)',
                    textAlign: 'center',
                  }}
                >
                  Music, videos, live broadcasts and ministry messages in one premium mobile experience.
                </CustomText>

                <View
                  style={{
                    marginTop: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.07)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(154,107,255,0.14)',
                      marginRight: 10,
                    }}
                  >
                    <MaterialIcons name="workspace-premium" size={18} color="#DFCFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText variant="label" style={{ color: '#F3EEFF' }}>
                      Elegant first impression
                    </CustomText>
                    <CustomText variant="caption" style={{ color: 'rgba(196,187,222,0.92)', marginTop: 3 }}>
                      Clean onboarding layout with better spacing and reduced text weight.
                    </CustomText>
                  </View>
                </View>

                <View style={{ marginTop: 14 }}>
                  <AppButton
                    title="Create Account"
                    size="lg"
                    fullWidth
                    onPress={() => router.push('/sign-up')}
                    style={{ borderRadius: 16 }}
                  />
                  <AppButton
                    title="Sign In"
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onPress={() => router.push('/sign-in')}
                    style={{
                      marginTop: 10,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(233,221,255,0.22)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                    textColor="#EDE3FF"
                    leftIcon={<MaterialIcons name="login" size={17} color="#EDE3FF" />}
                  />
                </View>
              </View>
            </Animated.View>

            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(10,8,17,0.7)',
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <TVTouchable onPress={() => router.replace('/(tabs)/home')} showFocusBorder={false} style={{ alignSelf: 'center' }}>
                <CustomText variant="caption" style={{ color: 'rgba(198,189,223,0.9)', textAlign: 'center' }}>
                  Continue to demo home without signing in
                </CustomText>
              </TVTouchable>
              <CustomText
                variant="caption"
                style={{ color: 'rgba(166,156,193,0.86)', textAlign: 'center', marginTop: 8 }}
              >
                Mobile • Tablet • TV responsive shell
              </CustomText>
            </View>
          </View>
        </Screen>
      </SafeAreaView>
    </View>
  );
}
