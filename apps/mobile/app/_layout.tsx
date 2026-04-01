import { Stack, useRouter, useSegments } from 'expo-router';
import '../global.css';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { View, StatusBar, Animated, Image, Platform, Text, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeProvider } from '../context/ThemeProvider';
import { useColorScheme, useThemeContext } from '../util/colorScheme';
import { colors } from '../constants/color';
import { FontProvider, FontContext } from '../context/FontContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { GuestModeProvider } from '../context/GuestModeContext';
import { FloatingPlayerProvider } from '../context/FloatingPlayerContext';
import { ToastProvider } from '../context/ToastContext';
import { ToastViewport } from '../components/ui/ToastViewport';
import { MinimizedFloatingPlayer } from '../components/player/MinimizedFloatingPlayer';
import { FixedFooter } from '../components/layout/FixedFooter';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET } from '../util/brandAssets';
import { fetchMePreferences } from '../services/userFlowService';

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

function WelcomeSpinner({
  compact,
  useNativeAnimations,
}: {
  compact: boolean;
  useNativeAnimations: boolean;
}) {
  const size = compact ? 96 : 112;
  const logoSize = compact ? 40 : 46;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    spin.setValue(0);
    pulse.setValue(0.94);

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1700,
        useNativeDriver: useNativeAnimations,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.02,
          duration: 850,
          useNativeDriver: useNativeAnimations,
        }),
        Animated.timing(pulse, {
          toValue: 0.94,
          duration: 850,
          useNativeDriver: useNativeAnimations,
        }),
      ]),
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [pulse, spin, useNativeAnimations]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2.5,
          borderColor: 'rgba(167,139,250,0.12)',
          borderTopColor: '#A78BFA',
          borderRightColor: '#D8CAFF',
          transform: [{ rotate }],
        }}
      />
      <Animated.View
        style={{
          width: size - 24,
          height: size - 24,
          borderRadius: (size - 24) / 2,
          borderWidth: 1,
          borderColor: 'rgba(167,139,250,0.22)',
          backgroundColor: 'rgba(26,20,47,0.92)',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pulse }],
        }}
      >
        <Image source={BRAND_LOGO_ASSET} style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }} />
      </Animated.View>
    </View>
  );
}

function WebLoadingScreen({ compact }: { compact: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#06040C' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#06040C" />

      <LinearGradient
        colors={['#140F22', '#0B0714', '#06040C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#06040C' }} edges={['top', 'bottom']}>
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
              maxWidth: 360,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: 'rgba(167,139,250,0.14)',
              backgroundColor: 'rgba(18,12,28,0.92)',
              paddingHorizontal: compact ? 18 : 22,
              paddingVertical: compact ? 22 : 26,
              alignItems: 'center',
            }}
          >
            <WelcomeSpinner compact={compact} useNativeAnimations={false} />

            <Text
              style={{
                marginTop: 16,
                color: '#F5F3FF',
                fontSize: compact ? 19 : 20,
                lineHeight: compact ? 23 : 24,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              Welcome
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: 'rgba(184,180,212,0.70)',
                fontSize: compact ? 12 : 12.4,
                lineHeight: compact ? 16 : 17,
                textAlign: 'center',
              }}
            >
              Preparing your ClaudyGod experience
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function NativeLoadingScreen({ compact }: { compact: boolean }) {
  const useNativeAnimations = Platform.OS !== 'web';
  const cardShadowStyle =
    Platform.OS === 'web'
      ? { boxShadow: '0px 16px 36px rgba(0,0,0,0.30)' }
      : {
          shadowColor: '#000000',
          shadowOpacity: 0.3,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 14 },
          elevation: 12,
        };

  const pulse = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: useNativeAnimations }),
        Animated.timing(pulse, { toValue: 0.96, duration: 900, useNativeDriver: useNativeAnimations }),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulse, useNativeAnimations]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0612' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#0A0612" />

      <LinearGradient
        colors={['#1E1A35', '#0F0C1A', '#0A0612']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0612' }} edges={['top', 'bottom']}>
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
              width: compact ? 280 : 316,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: 'rgba(167,139,250,0.16)',
              backgroundColor: 'rgba(26,20,47,0.94)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: compact ? 20 : 24,
              paddingVertical: compact ? 22 : 26,
              transform: [{ scale: pulse }],
              ...cardShadowStyle,
            }}
          >
            <WelcomeSpinner compact={compact} useNativeAnimations={useNativeAnimations} />

            <Text
              style={{
                marginTop: 16,
                color: '#F5F3FF',
                fontSize: compact ? 18 : 19,
                lineHeight: compact ? 22 : 23,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              Welcome
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: 'rgba(184,180,212,0.70)',
                fontSize: compact ? 12 : 12.4,
                lineHeight: compact ? 16 : 17,
                textAlign: 'center',
              }}
            >
              Preparing your ClaudyGod experience
            </Text>
          </Animated.View>
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
  const { initializing, isAuthenticated, user } = useAuth();
  const { setThemePreference } = useThemeContext();
  const router = useRouter();
  const segments = useSegments();
  const [bootDelayDone, setBootDelayDone] = useState(false);
  const [themePreferenceHydratedForUserId, setThemePreferenceHydratedForUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setBootDelayDone(true), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!fontsLoaded || !bootDelayDone || initializing) {
      return;
    }

    const firstSegment = segments[0];
    const secondSegment = Array.from(segments)[1];
    const isProtectedRoute =
      firstSegment === 'profile' ||
      firstSegment === 'settingsPage' ||
      (firstSegment === '(tabs)' && secondSegment === 'settings');

    if (!isAuthenticated && isProtectedRoute) {
      router.replace(APP_ROUTES.auth.signIn);
      return;
    }
  }, [bootDelayDone, fontsLoaded, initializing, isAuthenticated, router, segments]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setThemePreferenceHydratedForUserId(null);
      return;
    }

    if (themePreferenceHydratedForUserId === user.id) {
      return;
    }

    let active = true;

    void fetchMePreferences()
      .then((response) => {
        if (!active) {
          return;
        }
        setThemePreference(response.preferences.themePreference ?? 'system');
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setThemePreferenceHydratedForUserId(user.id);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, setThemePreference, themePreferenceHydratedForUserId, user?.id]);

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
      <MinimizedFloatingPlayer />
      {Platform.OS === 'web' ? <FixedFooter /> : null}
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
              <GuestModeProvider>
                <FloatingPlayerProvider>
                  <RootLayoutInner />
                </FloatingPlayerProvider>
              </GuestModeProvider>
            </AuthProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
