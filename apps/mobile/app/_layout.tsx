import { isSentryEnabled, reportException, Sentry } from '../lib/sentry';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useContext, type ReactNode } from 'react';
import { StatusBar, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../lib/queryClient';
import { ThemeProvider } from '../context/ThemeProvider';
import { useThemeContext, useAppTheme } from '../util/colorScheme';
import { makeStyles } from '../styles/makeStyles';
import { FontProvider, FontContext } from '../context/FontContext';
import { AppProvider } from '../context/AppContext';
import { DownloadsProvider } from '../context/DownloadsContext';
import { LocalContentProvider } from '../context/LocalContentContext';
import { PlayerProvider, usePlayer } from '../context/PlayerContext';
import { PlayerProgressProvider } from '../context/PlayerProgressContext';
import { ToastProvider } from '../context/ToastContext';
import { AppModalProvider } from '../context/AppModalContext';
import { ToastViewport } from '../components/ui/ToastViewport';
import { MinimizedFloatingPlayer } from '../components/player/MinimizedFloatingPlayer';
import { WordOfDayProvider } from '../context/WordOfDayContext';
import { AppLoadingScreen } from '../components/Exp/AppLoading';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { usePushNotifications } from '../hooks/usePushNotify';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Global unhandled JS error handler — active in production builds only.
if (!__DEV__) {
  const ErrorUtils = (globalThis as unknown as { ErrorUtils?: { setGlobalHandler: (_handler: (_error: Error, _isFatal?: boolean) => void) => void } }).ErrorUtils;
  ErrorUtils?.setGlobalHandler((error, isFatal) => {
    console.error(`[GlobalError] ${isFatal ? 'fatal' : 'non-fatal'}:`, error?.message ?? error);
    reportException(error, { tags: { fatal: String(Boolean(isFatal)) } });
  });
}

const useThemedStyles = makeStyles((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.background },
}));

function ThemedLayout({ children }: { children: ReactNode }) {
  const themedStyles = useThemedStyles();
  const theme        = useAppTheme();

  return (
    <View style={themedStyles.root}>
      <StatusBar
        translucent={false}
        backgroundColor={theme.colors.background}
        barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      {children}
    </View>
  );
}

function RootLayoutInner() {
  const { fontsLoaded } = useContext(FontContext);
  useThemeContext(); // Subscribes so this layout re-renders when the theme changes.
  const { isOffline, recheck } = useNetworkStatus();
  const reduceMotion = useReducedMotion();
  // Mounted here (not just in settings.tsx) so a returning user who already
  // granted permission gets their Expo push token re-validated/re-registered
  // on every launch — tokens can rotate (reinstall, eas update, expiry), and
  // without this the server keeps a stale token with nothing ever surfacing
  // the failure to the user.
  usePushNotifications();

  usePlayer(); // Subscribes so this layout re-renders on player identity changes (not progress ticks).

  if (!fontsLoaded) {
    return <AppLoadingScreen />;
  }

  return (
    <ThemedLayout>
      <ToastViewport />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: reduceMotion ? 'none' : 'fade_from_bottom',
          animationDuration: reduceMotion ? 0 : 200,
        }}
      >
        <Stack.Screen
          name="index"
          options={{ gestureEnabled: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="settingsPage"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="live/[sessionId]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="section/[sectionId]"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>

      <MinimizedFloatingPlayer />
      {isOffline ? <OfflineBanner onRetry={recheck} /> : null}
    </ThemedLayout>
  );
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <SafeAreaProvider>
              <ErrorBoundary context="the app">
                <ToastProvider>
                  <AppProvider>
                    <LocalContentProvider>
                      <DownloadsProvider>
                        <PlayerProgressProvider>
                        <PlayerProvider>
                          <WordOfDayProvider>
                            <AppModalProvider>
                              <RootLayoutInner />
                            </AppModalProvider>
                          </WordOfDayProvider>
                        </PlayerProvider>
                        </PlayerProgressProvider>
                      </DownloadsProvider>
                    </LocalContentProvider>
                  </AppProvider>
                </ToastProvider>
              </ErrorBoundary>
            </SafeAreaProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default isSentryEnabled() ? Sentry.wrap(RootLayout) : RootLayout;
