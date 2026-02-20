import { Stack } from 'expo-router';
import '../global.css';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { View, StatusBar, Animated, Image, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeProvider } from '../context/ThemeProvider';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { FontProvider, FontContext } from '../context/FontContext';

function ThemedLayout({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme] ?? colors.dark;

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar
        translucent={false}
        backgroundColor={currentColors.background}
        barStyle="light-content"
      />
      {children}
    </View>
  );
}

function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.92)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.92, duration: 850, useNativeDriver: true }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, useNativeDriver: true }),
    );

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1700, useNativeDriver: true }),
    );

    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    );

    pulseLoop.start();
    spinLoop.start();
    shimmerLoop.start();
    breathLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
      shimmerLoop.stop();
      breathLoop.stop();
    };
  }, [breath, pulse, shimmer, spin]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-130, 130],
  });

  const breathScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#06040D' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#06040D" />

      <LinearGradient
        colors={['#05030C', '#1A0C35', '#090512']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#06040D' }} edges={['top', 'bottom']}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingBottom: 24,
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              width: 280,
              height: 280,
              borderRadius: 280,
              backgroundColor: 'rgba(154,107,255,0.24)',
              transform: [{ scale: breathScale }],
              opacity: 0.9,
            }}
          />

          <Animated.View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              borderWidth: 1,
              borderColor: 'rgba(234,223,255,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: rotation }],
            }}
          >
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 34,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#9A6BFF',
                shadowOpacity: 0.46,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 12,
                transform: [{ scale: pulse }],
              }}
            >
              <Image
                source={require('../assets/images/ClaudyGoLogo.webp')}
                style={{ width: 64, height: 64, borderRadius: 18 }}
              />
            </View>
          </Animated.View>

          <View
            style={{
              width: 150,
              height: 5,
              borderRadius: 999,
              marginTop: 28,
              backgroundColor: 'rgba(255,255,255,0.14)',
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                width: 78,
                height: 5,
                borderRadius: 999,
                backgroundColor: '#9A6BFF',
                transform: [{ translateX: shimmerTranslate }],
              }}
            />
          </View>

          <Text
            style={{
              marginTop: 14,
              color: '#F7F1FF',
              fontSize: 14,
              letterSpacing: 0.2,
              fontFamily: 'SpaceGrotesk_600SemiBold',
            }}
          >
            Preparing ClaudyGod
          </Text>
          <Text
            style={{
              marginTop: 5,
              color: 'rgba(214,198,247,0.9)',
              fontSize: 12,
              fontFamily: 'Sora_400Regular',
              textAlign: 'center',
            }}
          >
            Loading your personalized audio and video channels...
          </Text>
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, paddingTop: 8 }}>
          <Text
            style={{
              color: 'rgba(223,212,249,0.9)',
              fontSize: 12,
              fontFamily: 'SpaceGrotesk_500Medium',
            }}
          >
            ClaudyGod Music Ministries
          </Text>
          <Text
            style={{
              marginTop: 2,
              color: 'rgba(205,190,238,0.78)',
              fontSize: 10,
              fontFamily: 'Sora_400Regular',
              textAlign: 'center',
            }}
          >
            Worship • Messages • Nuggets of Truth
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function RootLayoutInner() {
  const { fontsLoaded } = useContext(FontContext);
  const [bootDelayDone, setBootDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBootDelayDone(true), 1100);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded || !bootDelayDone) {
    return <LoadingScreen />;
  }

  return (
    <ThemedLayout>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="sign-in" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="sign-up" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      </Stack>
    </ThemedLayout>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <FontProvider>
        <SafeAreaProvider>
          <RootLayoutInner />
        </SafeAreaProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
