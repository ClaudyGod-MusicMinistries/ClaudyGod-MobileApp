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

function WebLoadingScreen({ compact }: { compact: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#060709' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#060709" />

      <LinearGradient
        colors={['#101215', '#08090C', '#060709']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#060709' }} edges={['top', 'bottom']}>
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
              borderRadius: 32,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(12,13,16,0.88)',
              paddingHorizontal: compact ? 18 : 22,
              paddingVertical: compact ? 22 : 26,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image source={BRAND_LOGO_ASSET} style={{ width: 40, height: 40, borderRadius: 20 }} />
            </View>

            <Text
              style={{
                marginTop: 16,
                color: '#FFF9F0',
                fontSize: compact ? 19 : 20,
                lineHeight: compact ? 23 : 24,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              ClaudyGod
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: 'rgba(230,220,207,0.62)',
                fontSize: compact ? 12 : 12.4,
                lineHeight: compact ? 16 : 17,
                textAlign: 'center',
              }}
            >
              Opening your listening space
            </Text>

            <View
              style={{
                width: '100%',
                height: 5,
                borderRadius: 999,
                marginTop: 18,
                backgroundColor: 'rgba(255,255,255,0.10)',
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={['#E1B662', '#B88E46']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: '58%', height: '100%', borderRadius: 999 }}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function NativeLoadingScreen({ compact }: { compact: boolean }) {
  const ringSize = compact ? 124 : 140;
  const logoSize = compact ? 56 : 62;
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
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: useNativeAnimations }),
        Animated.timing(pulse, { toValue: 0.96, duration: 900, useNativeDriver: useNativeAnimations }),
      ]),
    );

    const barsLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(barAnim, { toValue: 1, duration: 900, useNativeDriver: useNativeAnimations }),
        Animated.timing(barAnim, { toValue: 0, duration: 900, useNativeDriver: useNativeAnimations }),
      ]),
    );

    pulseLoop.start();
    barsLoop.start();

    return () => {
      pulseLoop.stop();
      barsLoop.stop();
    };
  }, [barAnim, pulse, useNativeAnimations]);

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
    <View style={{ flex: 1, backgroundColor: '#060709' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#060709" />

      <LinearGradient
        colors={['#101215', '#08090C', '#060709']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#060709' }} edges={['top', 'bottom']}>
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
              borderRadius: 30,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(12,13,16,0.90)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: compact ? 20 : 24,
              paddingVertical: compact ? 22 : 26,
              transform: [{ scale: pulse }],
              ...cardShadowStyle,
            }}
          >
            <View
              style={{
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: ringSize - 18,
                  height: ringSize - 18,
                  borderRadius: (ringSize - 18) / 2,
                  borderWidth: 1,
                  borderColor: 'rgba(186,145,63,0.24)',
                  backgroundColor: 'rgba(186,145,63,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={BRAND_LOGO_ASSET}
                  style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
                />
              </View>
            </View>

            <View style={{ marginTop: 20, flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 22 }}>
              <Animated.View
                style={{
                  width: 6,
                  height: 22,
                  borderRadius: 999,
                  backgroundColor: '#E1B662',
                  transform: [{ scaleY: barScaleA }],
                }}
              />
              <Animated.View
                style={{
                  width: 6,
                  height: 22,
                  borderRadius: 999,
                  backgroundColor: '#CFA256',
                  transform: [{ scaleY: barScaleB }],
                }}
              />
              <Animated.View
                style={{
                  width: 6,
                  height: 22,
                  borderRadius: 999,
                  backgroundColor: '#A37A38',
                  transform: [{ scaleY: barScaleC }],
                }}
              />
            </View>

            <Text
              style={{
                marginTop: 16,
                color: '#FFF9F0',
                fontSize: compact ? 18 : 19,
                lineHeight: compact ? 22 : 23,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              ClaudyGod
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: 'rgba(230,220,207,0.62)',
                fontSize: compact ? 12 : 12.4,
                lineHeight: compact ? 16 : 17,
                textAlign: 'center',
              }}
            >
              Opening your listening space
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
  const { initializing, isAuthenticated } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [bootDelayDone, setBootDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBootDelayDone(true), 700);
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
