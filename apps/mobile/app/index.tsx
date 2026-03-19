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
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();
  const { width, height } = useWindowDimensions();

  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const compact = height < 730;
  const useNativeAnimations = Platform.OS !== 'web';
  const heroBadgeShadow =
    Platform.OS === 'web'
      ? { boxShadow: '0px 10px 18px rgba(154,107,255,0.36)' }
      : {
          shadowColor: '#9A6BFF',
          shadowOpacity: 0.36,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 11,
        };

  const logoSize = isTV ? 134 : isTablet ? 116 : compact ? 92 : 102;
  const badgeSize = isTV ? 178 : isTablet ? 160 : compact ? 132 : 144;
  const headingSize = isTV ? 34 : isTablet ? 30 : compact ? 22 : 24;

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(24)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const orbDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [initializing, isAuthenticated, router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 520,
        delay: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
      Animated.timing(heroY, {
        toValue: 0,
        duration: 520,
        delay: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 520,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
    ]).start();

    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNativeAnimations,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNativeAnimations,
        }),
      ]),
    );

    const orbLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbDrift, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNativeAnimations,
        }),
        Animated.timing(orbDrift, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNativeAnimations,
        }),
      ]),
    );

    logoLoop.start();
    orbLoop.start();

    return () => {
      logoLoop.stop();
      orbLoop.stop();
    };
  }, [ctaOpacity, headerOpacity, heroOpacity, heroY, logoFloat, orbDrift, useNativeAnimations]);

  const orbTranslate = orbDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 14],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#05040D' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#05040D" />

      <LinearGradient
        colors={['#130A2A', '#090614', '#05040D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          top: -42,
          left: -38,
          width: 280,
          height: 280,
          borderRadius: 280,
          backgroundColor: 'rgba(164,125,255,0.20)',
          transform: [{ translateY: orbTranslate }],
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          right: -100,
          bottom: 44,
          width: 260,
          height: 260,
          borderRadius: 260,
          backgroundColor: 'rgba(110,72,190,0.17)',
          transform: [{ translateY: orbTranslate }],
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
          <View style={{ flex: 1, paddingTop: compact ? 8 : 12, paddingBottom: 16 }}>
            <Animated.View
              style={{
                opacity: headerOpacity,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('../assets/images/ClaudyGoLogo.webp')}
                  style={{ width: 34, height: 34, borderRadius: 17 }}
                />
                <View style={{ marginLeft: 10 }}>
                  <CustomText variant="caption" style={{ color: 'rgba(216,205,246,0.86)' }}>
                    ClaudyGod Ministry
                  </CustomText>
                  <CustomText variant="label" style={{ color: '#F9F7FF' }}>
                    Welcome
                  </CustomText>
                </View>
              </View>

              <TVTouchable
                onPress={() => router.push('/sign-in')}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(230,217,255,0.34)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}
                showFocusBorder={false}
              >
                <CustomText variant="caption" style={{ color: '#EADFFF' }}>
                  Sign In
                </CustomText>
                </TVTouchable>
              </Animated.View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Animated.View
                style={{
                  opacity: heroOpacity,
                  transform: [{ translateY: heroY }],
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(176,153,230,0.30)',
                  backgroundColor: 'rgba(14,10,24,0.86)',
                  paddingHorizontal: isTablet || isTV ? 28 : 18,
                  paddingVertical: compact ? 18 : 22,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Animated.View
                    style={{
                      width: badgeSize,
                      height: badgeSize,
                      borderRadius: badgeSize / 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.22)',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      ...heroBadgeShadow,
                      transform: [{ translateY: logoFloat }],
                    }}
                  >
                    <Image
                      source={require('../assets/images/ClaudyGoLogo.webp')}
                      style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
                    />
                  </Animated.View>

                  <CustomText
                    variant="hero"
                    style={{
                      marginTop: compact ? 16 : 20,
                      color: '#F8F6FF',
                      textAlign: 'center',
                      fontSize: headingSize,
                      lineHeight: headingSize + 6,
                      fontFamily: 'ClashDisplay_700Bold',
                    }}
                  >
                    Worship. Word. Growth.
                  </CustomText>

                  <CustomText
                    variant="body"
                    style={{
                      marginTop: 10,
                      color: 'rgba(214,205,236,0.92)',
                      textAlign: 'center',
                      maxWidth: 440,
                      fontFamily: 'Sora_400Regular',
                      fontSize: compact ? 13 : 14,
                      lineHeight: compact ? 20 : 21,
                    }}
                  >
                    Stream ministry music, watch channels, and follow daily message drops in one place.
                  </CustomText>

                  <View
                    style={{
                      width: '100%',
                      marginTop: compact ? 16 : 18,
                      flexDirection: isTablet ? 'row' : 'column',
                      gap: 12,
                      alignItems: 'stretch',
                    }}
                  >
                    <View
                      style={{
                        flex: 1.3,
                        minHeight: isTablet ? 150 : 170,
                        borderRadius: 22,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.14)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <Image
                        source={require('../assets/images/FB_IMG_1743103252303.jpg')}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['rgba(9,6,18,0.04)', 'rgba(8,6,15,0.82)']}
                        start={{ x: 0.2, y: 0 }}
                        end={{ x: 0.7, y: 1 }}
                        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                      />
                      <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
                        <CustomText variant="caption" style={{ color: 'rgba(236,228,255,0.84)' }}>
                          ClaudyGod experience
                        </CustomText>
                        <CustomText
                          variant="label"
                          style={{ color: '#FCF8FF', marginTop: 4, fontSize: compact ? 11.8 : 12.6, lineHeight: 16 }}
                        >
                          Worship visuals, daily encouragement, and a calmer digital ministry space.
                        </CustomText>
                      </View>
                    </View>

                    <View style={{ flex: 0.9, gap: 12 }}>
                      <View
                        style={{
                          flex: 1,
                          minHeight: 78,
                          borderRadius: 20,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.12)',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <Image
                          source={require('../assets/images/landing4.jpg')}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                      <View
                        style={{
                          flex: 1,
                          minHeight: 78,
                          borderRadius: 20,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.12)',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <Image
                          source={require('../assets/images/CoverArt.webp')}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <Animated.View style={{ opacity: ctaOpacity, marginTop: compact ? 16 : 20 }}>
                  <AppButton
                    title="Create Account"
                    size="lg"
                    fullWidth
                    onPress={() => router.push('/sign-up')}
                    rightIcon={<MaterialIcons name="person-add" size={18} color="#08060F" />}
                    style={{ borderRadius: 16 }}
                  />

                  <AppButton
                    title="Sign In"
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onPress={() => router.push('/sign-in')}
                    leftIcon={<MaterialIcons name="login" size={18} color="#E8DDFF" />}
                    textColor="#E8DDFF"
                    style={{
                      marginTop: 10,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(233,221,255,0.32)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                    }}
                  />
                </Animated.View>
              </Animated.View>
            </View>

            <View style={{ paddingTop: 8, alignItems: 'center' }}>
              <CustomText variant="caption" style={{ color: 'rgba(217,206,244,0.88)' }}>
                ClaudyGod Music Ministries
              </CustomText>
            </View>
          </View>
        </Screen>
      </SafeAreaView>
    </View>
  );
}
