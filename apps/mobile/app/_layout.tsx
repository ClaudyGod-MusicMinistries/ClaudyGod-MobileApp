import { Stack } from 'expo-router';
import '../global.css';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { View, StatusBar, Animated, Image, Text, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const ringSize = compact ? 126 : 144;
  const logoSize = compact ? 58 : 66;

  const pulse = useRef(new Animated.Value(0.94)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.94, duration: 800, useNativeDriver: true }),
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
        Animated.timing(breath, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );

    const barsLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(barAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(barAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );

    pulseLoop.start();
    spinLoop.start();
    shimmerLoop.start();
    breathLoop.start();
    barsLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
      shimmerLoop.stop();
      breathLoop.stop();
      barsLoop.stop();
    };
  }, [barAnim, breath, pulse, shimmer, spin]);

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

  const barScaleA = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });
  const barScaleB = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0.45],
  });
  const barScaleC = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.95],
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
            paddingBottom: 16,
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: 300,
              backgroundColor: 'rgba(154,107,255,0.24)',
              transform: [{ scale: breathScale }],
              opacity: 0.9,
            }}
          />

          <Animated.View
            style={{
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderWidth: 1,
              borderColor: 'rgba(234,223,255,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: rotation }],
            }}
          >
            <View
              style={{
                width: ringSize - 28,
                height: ringSize - 28,
                borderRadius: (ringSize - 28) / 2,
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
                style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
              />
            </View>
          </Animated.View>

          <View style={{ marginTop: 20, flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 22 }}>
            <Animated.View
              style={{
                width: 6,
                height: 22,
                borderRadius: 999,
                backgroundColor: 'rgba(154,107,255,0.96)',
                transform: [{ scaleY: barScaleA }],
              }}
            />
            <Animated.View
              style={{
                width: 6,
                height: 22,
                borderRadius: 999,
                backgroundColor: 'rgba(189,161,255,0.94)',
                transform: [{ scaleY: barScaleB }],
              }}
            />
            <Animated.View
              style={{
                width: 6,
                height: 22,
                borderRadius: 999,
                backgroundColor: 'rgba(154,107,255,0.96)',
                transform: [{ scaleY: barScaleC }],
              }}
            />
          </View>

          <View
            style={{
              width: compact ? 136 : 154,
              height: 5,
              borderRadius: 999,
              marginTop: 16,
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
              fontSize: compact ? 13 : 14,
              letterSpacing: 0.2,
              fontFamily: 'SpaceGrotesk_600SemiBold',
            }}
          >
            Loading ClaudyGod
          </Text>
          <Text
            style={{
              marginTop: 5,
              color: 'rgba(214,198,247,0.9)',
              fontSize: compact ? 11 : 12,
              fontFamily: 'Sora_400Regular',
              textAlign: 'center',
            }}
          >
            Setting up your secure workspace...
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
