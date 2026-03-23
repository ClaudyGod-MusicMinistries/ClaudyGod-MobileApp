import { Stack, useRouter, useSegments } from 'expo-router';
import '../global.css';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { View, StatusBar, Animated, Image, Platform, Text, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeProvider } from '../context/ThemeProvider';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { FontProvider, FontContext } from '../context/FontContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ToastViewport } from '../components/ui/ToastViewport';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET } from '../util/brandAssets';

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

function LoadingPill({ label }: { label: string }) {
  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(214,228,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Text
        style={{
          color: 'rgba(230,237,249,0.84)',
          fontSize: 10.5,
          lineHeight: 12,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function WebLoadingScreen({ compact }: { compact: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#06040D' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#06040D" />

      <LinearGradient
        colors={['#0B1631', '#0A1020', '#06040D']}
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
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: 'rgba(214,228,255,0.14)',
              backgroundColor: 'rgba(9,13,23,0.82)',
              paddingHorizontal: compact ? 18 : 22,
              paddingVertical: compact ? 20 : 24,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={BRAND_LOGO_ASSET} style={{ width: 56, height: 56, borderRadius: 28 }} />
            </View>

            <Text
              style={{
                marginTop: 16,
                color: '#F7FBFF',
                fontSize: compact ? 18 : 20,
                lineHeight: compact ? 22 : 24,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              Preparing ClaudyGod
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: 'rgba(214,226,247,0.84)',
                fontSize: compact ? 12.5 : 13,
                lineHeight: compact ? 18 : 19,
                textAlign: 'center',
              }}
            >
              Loading your music, videos, and personal library so the app opens ready to use.
            </Text>

            <View
              style={{
                height: 6,
                borderRadius: 999,
                marginTop: 18,
                backgroundColor: 'rgba(255,255,255,0.10)',
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={['#62D2FF', '#8A70FF']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: '62%', height: '100%', borderRadius: 999 }}
              />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <LoadingPill label="Music" />
              <LoadingPill label="Videos" />
              <LoadingPill label="Daily Word" />
            </View>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: 18 }}>
          <Text
            style={{
              color: 'rgba(223,231,246,0.84)',
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            ClaudyGod Ministries
          </Text>
          <Text
            style={{
              marginTop: 4,
              color: 'rgba(192,207,235,0.66)',
              fontSize: 10.5,
              textAlign: 'center',
            }}
          >
            Worship • Messages • Daily encouragement
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function NativeLoadingScreen({ compact }: { compact: boolean }) {
  const ringSize = compact ? 126 : 144;
  const logoSize = compact ? 58 : 66;
  const useNativeAnimations = Platform.OS !== 'web';
  const ringShadowStyle =
    Platform.OS === 'web'
      ? { boxShadow: '0px 12px 24px rgba(154,107,255,0.46)' }
      : {
          shadowColor: '#9A6BFF',
          shadowOpacity: 0.46,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
        };

  const pulse = useRef(new Animated.Value(0.94)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 800, useNativeDriver: useNativeAnimations }),
        Animated.timing(pulse, { toValue: 0.94, duration: 800, useNativeDriver: useNativeAnimations }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, useNativeDriver: useNativeAnimations }),
    );

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1700, useNativeDriver: useNativeAnimations }),
    );

    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2400, useNativeDriver: useNativeAnimations }),
        Animated.timing(breath, { toValue: 0, duration: 2400, useNativeDriver: useNativeAnimations }),
      ]),
    );

    const barsLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(barAnim, { toValue: 1, duration: 900, useNativeDriver: useNativeAnimations }),
        Animated.timing(barAnim, { toValue: 0, duration: 900, useNativeDriver: useNativeAnimations }),
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
  }, [barAnim, breath, pulse, shimmer, spin, useNativeAnimations]);

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

          <View
            style={{
              width: compact ? 276 : 312,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: 'rgba(214,228,255,0.14)',
              backgroundColor: 'rgba(9,13,23,0.72)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: compact ? 20 : 24,
              paddingVertical: compact ? 22 : 26,
            }}
          >
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
              <Animated.View
                style={{
                  width: ringSize - 28,
                  height: ringSize - 28,
                  borderRadius: (ringSize - 28) / 2,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.25)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...ringShadowStyle,
                  transform: [{ scale: pulse }],
                }}
              >
                <Image
                  source={BRAND_LOGO_ASSET}
                  style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
                />
              </Animated.View>
            </Animated.View>

            <View style={{ marginTop: 18, flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 22 }}>
              <Animated.View
                style={{
                  width: 6,
                  height: 22,
                  borderRadius: 999,
                  backgroundColor: 'rgba(98,210,255,0.94)',
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
                  backgroundColor: 'rgba(98,210,255,0.94)',
                  transform: [{ scaleY: barScaleC }],
                }}
              />
            </View>

            <View
              style={{
                width: compact ? 154 : 172,
                height: 5,
                borderRadius: 999,
                marginTop: 16,
                backgroundColor: 'rgba(255,255,255,0.14)',
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  width: 88,
                  height: 5,
                  borderRadius: 999,
                  backgroundColor: '#8A70FF',
                  transform: [{ translateX: shimmerTranslate }],
                }}
              />
            </View>

            <Text
              style={{
                marginTop: 16,
                color: '#F7FBFF',
                fontSize: compact ? 18 : 19,
                lineHeight: compact ? 22 : 23,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              Preparing ClaudyGod
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: 'rgba(214,226,247,0.82)',
                fontSize: compact ? 12.2 : 12.8,
                lineHeight: compact ? 18 : 19,
                textAlign: 'center',
              }}
            >
              Loading your music, videos, and saved library so everything feels ready when the app opens.
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <LoadingPill label="Music" />
              <LoadingPill label="Videos" />
              <LoadingPill label="Library" />
            </View>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, paddingTop: 8 }}>
          <Text
            style={{
              color: 'rgba(223,231,246,0.86)',
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            ClaudyGod Ministries
          </Text>
          <Text
            style={{
              marginTop: 4,
              color: 'rgba(192,207,235,0.66)',
              fontSize: 10.5,
              textAlign: 'center',
            }}
          >
            Worship • Messages • Daily encouragement
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function LoadingScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const isWeb = typeof globalThis === 'object' && globalThis !== null && 'window' in globalThis;
  if (isWeb) {
    return <WebLoadingScreen compact={compact} />;
  }
  return <NativeLoadingScreen compact={compact} />;
}

function RootLayoutInner() {
  const { fontsLoaded } = useContext(FontContext);
  const { initializing, isAuthenticated } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [bootDelayDone, setBootDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBootDelayDone(true), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!fontsLoaded || !bootDelayDone || initializing) {
      return;
    }

    const firstSegment = segments[0];
    const isAuthRoute = firstSegment === 'sign-in' || firstSegment === 'sign-up';
    const isProtectedRoute =
      firstSegment === '(tabs)' || firstSegment === 'profile' || firstSegment === 'settingsPage';

    if (!isAuthenticated && isProtectedRoute) {
      router.replace(APP_ROUTES.auth.signIn);
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace(APP_ROUTES.tabs.home);
    }
  }, [bootDelayDone, fontsLoaded, initializing, isAuthenticated, router, segments]);

  if (!fontsLoaded || !bootDelayDone) {
    return <LoadingScreen />;
  }

  return (
    <ThemedLayout>
      <ToastViewport />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="sign-in" options={{ gestureEnabled: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="sign-up" options={{ gestureEnabled: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="forgot-password" options={{ gestureEnabled: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="reset-password" options={{ gestureEnabled: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="verify-email" options={{ gestureEnabled: false, animation: 'slide_from_right' }} />
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
          <ToastProvider>
            <AuthProvider>
              <RootLayoutInner />
            </AuthProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
