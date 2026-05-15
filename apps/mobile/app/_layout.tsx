import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, StatusBar, View } from 'react-native';

import { ThemeProvider } from '../context/ThemeProvider';
import { useColorScheme, useThemeContext } from '../util/colorScheme';
import { colors } from '../constants/color';
import { FontProvider, FontContext } from '../context/FontContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FloatingPlayerProvider } from '../context/FloatingPlayerContext';
import { ToastProvider , useToast } from '../context/ToastContext';
import { AppModalProvider } from '../context/AppModalContext';
import { ToastViewport } from '../components/ui/ToastViewport';
import { MinimizedFloatingPlayer } from '../components/player/MinimizedFloatingPlayer';
import { APP_ROUTES } from '../util/appRoutes';
import { fetchMePreferences } from '../services/userFlowService';
import { AppLoadingScreen } from '../components/Exp/AppLoading';
import { clearMobileSession } from '../services/authService';

const MOBILE_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

function ThemedLayout({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme] ?? colors.dark;

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar
        translucent={false}
        backgroundColor={currentColors.background}
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      {children}
    </View>
  );
}

function RootLayoutInner() {
  const { fontsLoaded } = useContext(FontContext);
  const { initializing, isAuthenticated, user } = useAuth();
  const { setThemePreference } = useThemeContext();
  const { showToast } = useToast();
  const router = useRouter();
  const segments = useSegments();

  const [bootDelayDone, setBootDelayDone] = useState(false);
  const [lastActivityAt, setLastActivityAt] = useState(Date.now());
  const [themePreferenceHydratedForUserId, setThemePreferenceHydratedForUserId] =
    useState<string | null>(null);

  const firstSegment = segments[0];
  const secondSegment = useMemo(() => Array.from(segments)[1], [segments]);
  const segmentKey = useMemo(() => Array.from(segments).join('/'), [segments]);

  useEffect(() => {
    const timer = setTimeout(() => setBootDelayDone(true), 650);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setTimeout(() => {
      void clearMobileSession();
      showToast({
        title: 'Session closed',
        message: 'You were signed out after 5 minutes of inactivity.',
        tone: 'info',
      });
      router.replace(APP_ROUTES.auth.signIn);
    }, MOBILE_INACTIVITY_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated, lastActivityAt, router, showToast]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setLastActivityAt(Date.now());
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!fontsLoaded || !bootDelayDone || initializing) return;

    const isTabsRoute = firstSegment === '(tabs)';
    const isAuthEntryRoute =
      !firstSegment ||
      firstSegment === 'sign-in' ||
      firstSegment === 'sign-up' ||
      firstSegment === 'forgot-password' ||
      firstSegment === 'verify-email';
    const isSettingsPage = firstSegment === 'settingsPage';
    const isGuestAllowedSettingsPage =
      isSettingsPage &&
      (secondSegment === 'Donate' ||
        secondSegment === 'Support' ||
        secondSegment === 'Payment' ||
        secondSegment === 'help' ||
        secondSegment === 'Help' ||
        secondSegment === 'Rate' ||
        secondSegment === 'Word');

    const isProtectedRoute =
      firstSegment === 'profile' ||
      (isTabsRoute && (secondSegment === 'settings' || secondSegment === 'library')) ||
      (isSettingsPage && !isGuestAllowedSettingsPage);

    if (isAuthenticated && isAuthEntryRoute) {
      router.replace(APP_ROUTES.tabs.home);
      return;
    }

    if (!isAuthenticated && isProtectedRoute) {
      router.replace(APP_ROUTES.landing);
    }
  }, [
    bootDelayDone,
    firstSegment,
    fontsLoaded,
    initializing,
    isAuthenticated,
    router,
    secondSegment,
    segmentKey,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setThemePreferenceHydratedForUserId(null);
      return;
    }

    if (themePreferenceHydratedForUserId === user.id) return;

    let active = true;

    const hydrateThemePreference = async () => {
      try {
        const response = await fetchMePreferences();

        if (active) {
          setThemePreference(response.preferences.themePreference ?? 'system');
        }
      } catch {
        // Keep the local theme preference if remote preferences are unavailable.
      }

      if (active) {
        setThemePreferenceHydratedForUserId(user.id);
      }
    };

    void hydrateThemePreference();

    return () => {
      active = false;
    };
  }, [
    isAuthenticated,
    setThemePreference,
    themePreferenceHydratedForUserId,
    user?.id,
  ]);

  if (!fontsLoaded || !bootDelayDone) {
    return <AppLoadingScreen />;
  }

  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={() => {
        if (isAuthenticated) setLastActivityAt(Date.now());
      }}
    >
    <ThemedLayout>
      <ToastViewport />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 240,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="sign-in"
          options={{
            gestureEnabled: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            gestureEnabled: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            gestureEnabled: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="reset-password"
          options={{
            gestureEnabled: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="verify-email"
          options={{
            gestureEnabled: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="account-security"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: 'fade',
          }}
        />
      </Stack>

      <MinimizedFloatingPlayer />
    </ThemedLayout>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <FontProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <AuthProvider>
              <FloatingPlayerProvider>
                <AppModalProvider>
                  <RootLayoutInner />
                </AppModalProvider>
              </FloatingPlayerProvider>
            </AuthProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
