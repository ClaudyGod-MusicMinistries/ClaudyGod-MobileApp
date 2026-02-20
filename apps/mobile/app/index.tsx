import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { TVTouchable } from '../components/ui/TVTouchable';

export default function Landing() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const headlineSize = width < 380 ? 23 : 25;

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-12)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(18)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsY = useRef(new Animated.Value(20)).current;

  const logoPulse = useRef(new Animated.Value(1)).current;
  const orbLeftY = useRef(new Animated.Value(0)).current;
  const orbRightY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 520,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroY, {
        toValue: 0,
        duration: 520,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(actionsOpacity, {
        toValue: 1,
        duration: 500,
        delay: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(actionsY, {
        toValue: 0,
        duration: 500,
        delay: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.045,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const orbLeftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbLeftY, {
          toValue: -16,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(orbLeftY, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const orbRightLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbRightY, {
          toValue: 14,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(orbRightY, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    logoLoop.start();
    orbLeftLoop.start();
    orbRightLoop.start();

    return () => {
      logoLoop.stop();
      orbLeftLoop.stop();
      orbRightLoop.stop();
    };
  }, [
    actionsOpacity,
    actionsY,
    headerOpacity,
    headerY,
    heroOpacity,
    heroY,
    logoPulse,
    orbLeftY,
    orbRightY,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: '#05040D' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#05040D" />

      <LinearGradient
        colors={['#130A2A', '#070511', '#05040D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          top: -26,
          left: -12,
          width: 280,
          height: 280,
          borderRadius: 280,
          backgroundColor: 'rgba(154,107,255,0.24)',
          transform: [{ translateY: orbLeftY }],
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          right: -90,
          bottom: 70,
          width: 250,
          height: 250,
          borderRadius: 250,
          backgroundColor: 'rgba(86,42,171,0.2)',
          transform: [{ translateY: orbRightY }],
        }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#05040D' }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18 }}>
          <Animated.View
            style={{
              opacity: headerOpacity,
              transform: [{ translateY: headerY }],
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
                <CustomText variant="caption" style={{ color: 'rgba(214,202,244,0.88)' }}>
                  ClaudyGod Ministry
                </CustomText>
                <CustomText variant="label" style={{ color: '#F7F4FF' }}>
                  Welcome
                </CustomText>
              </View>
            </View>

            <TVTouchable
              onPress={() => router.replace('/(tabs)/home')}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(230,217,255,0.36)',
                paddingHorizontal: 12,
                paddingVertical: 7,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
              showFocusBorder={false}
            >
              <CustomText variant="caption" style={{ color: '#EADFFF' }}>
                Skip
              </CustomText>
            </TVTouchable>
          </Animated.View>

          <Animated.View
            style={{
              marginTop: 86,
              alignItems: 'center',
              opacity: heroOpacity,
              transform: [{ translateY: heroY }],
            }}
          >
            <Animated.View
              style={{
                width: 136,
                height: 136,
                borderRadius: 68,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.22)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                shadowColor: '#9A6BFF',
                shadowOpacity: 0.34,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
                elevation: 10,
                transform: [{ scale: logoPulse }],
              }}
            >
              <Image
                source={require('../assets/images/ClaudyGoLogo.webp')}
                style={{ width: 94, height: 94, borderRadius: 47 }}
              />
            </Animated.View>

            <CustomText
              variant="hero"
              style={{
                marginTop: 28,
                color: '#F8F6FF',
                textAlign: 'center',
                fontSize: headlineSize,
                lineHeight: headlineSize + 6,
                fontFamily: 'ClashDisplay_700Bold',
              }}
            >
              Worship. Word. Growth.
            </CustomText>

            <CustomText
              variant="body"
              style={{
                marginTop: 10,
                color: 'rgba(209,200,232,0.92)',
                textAlign: 'center',
                maxWidth: 320,
              }}
            >
              Professional home for ministry music, video channels, and daily messages.
            </CustomText>
          </Animated.View>

          <Animated.View
            style={{
              marginTop: 'auto',
              opacity: actionsOpacity,
              transform: [{ translateY: actionsY }],
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(170,149,219,0.34)',
              backgroundColor: 'rgba(22,16,36,0.94)',
              padding: 14,
            }}
          >
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

            <CustomText
              variant="caption"
              style={{ marginTop: 10, textAlign: 'center', color: 'rgba(177,170,201,0.78)' }}
            >
              By continuing, you agree to terms and privacy policy.
            </CustomText>
          </Animated.View>

          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <CustomText variant="caption" style={{ color: 'rgba(217,206,244,0.88)' }}>
              ClaudyGod Music Ministries
            </CustomText>
            <CustomText
              variant="caption"
              style={{ marginTop: 2, color: 'rgba(177,170,201,0.74)', textAlign: 'center' }}
            >
              Worship • Messages • Nuggets of Truth
            </CustomText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
