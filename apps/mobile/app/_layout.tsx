import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useContext, useEffect, useState, type ReactNode } from 'react';
import { StatusBar, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../lib/queryClient';
import { ThemeProvider } from '../context/ThemeProvider';
import { useThemeContext, useAppTheme } from '../util/colorScheme';
import { makeStyles } from '../styles/makeStyles';
import { FontProvider, FontContext } from '../context/FontContext';
import { AppProvider } from '../context/AppContext';
import { UserAccountProvider } from '../context/UserAccountContext';
import { AccountSheetProvider } from '../context/AccountSheetContext';
import { AccountSheet } from '../components/auth/AccountSheet';
import { PlayerProvider, usePlayer } from '../context/PlayerContext';
import { PlayerProgressProvider } from '../context/PlayerProgressContext';
import { ToastProvider } from '../context/ToastContext';
import { AppModalProvider } from '../context/AppModalContext';
import { ToastViewport } from '../components/ui/ToastViewport';
import { MinimizedFloatingPlayer } from '../components/player/MinimizedFloatingPlayer';
import { WordOfDayModal, shouldShowWordModal, markWordModalShown } from '../components/modals/WordOfDayModal';
import { WordOfDayProvider } from '../context/WordOfDayContext';
import { APP_ROUTES } from '../util/appRoutes';
import { AppLoadingScreen } from '../components/Exp/AppLoading';
import { useWordOfDay } from '../hooks/useWordOfDay';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Global unhandled JS error handler — active in production builds only.
if (!__DEV__) {
  const ErrorUtils = (globalThis as unknown as { ErrorUtils?: { setGlobalHandler: (_handler: (_error: Error, _isFatal?: boolean) => void) => void } }).ErrorUtils;
  ErrorUtils?.setGlobalHandler((error, isFatal) => {
    console.error(`[GlobalError] ${isFatal ? 'fatal' : 'non-fatal'}:`, error?.message ?? error);
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
  const router = useRouter();
  const segments = useSegments();

  const [bootDelayDone, setBootDelayDone] = useState(false);
  const [wordModalVisible, setWordModalVisible] = useState(false);
  const { bibleVerse, adminWord } = useWordOfDay();

  const firstSegment = segments[0];
  const isOnTabs = firstSegment === '(tabs)';

  useEffect(() => {
    const timer = setTimeout(() => setBootDelayDone(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Show the Word for Today modal once per day, 2 s after landing on the main tabs.
  useEffect(() => {
    if (!bootDelayDone || !bibleVerse || !isOnTabs) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const shouldShow = await shouldShowWordModal();
      if (!cancelled && shouldShow) {
        setWordModalVisible(true);
        await markWordModalShown();
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bootDelayDone, bibleVerse, isOnTabs]);

  // After boot, always navigate to home tab — there is no auth gate.
  useEffect(() => {
    if (!fontsLoaded || !bootDelayDone) return;
    if (!firstSegment || firstSegment === 'index') {
      router.replace(APP_ROUTES.tabs.home);
    }
  }, [bootDelayDone, firstSegment, fontsLoaded, router]);

  usePlayer(); // Subscribes so this layout re-renders on player identity changes (not progress ticks).

  if (!fontsLoaded || !bootDelayDone) {
    return <AppLoadingScreen />;
  }

  return (
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
          name="live"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>

      <MinimizedFloatingPlayer />

      <WordOfDayModal
        visible={wordModalVisible}
        bibleVerse={bibleVerse}
        adminWord={adminWord}
        onClose={() => setWordModalVisible(false)}
        onReadMore={() => {
          setWordModalVisible(false);
          router.push(APP_ROUTES.settingsPages.word);
        }}
      />
    </ThemedLayout>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FontProvider>
          <SafeAreaProvider>
            <ErrorBoundary context="the app">
              <ToastProvider>
                <AppProvider>
                  <UserAccountProvider>
                    <AccountSheetProvider>
                      <PlayerProgressProvider>
                        <PlayerProvider>
                          <WordOfDayProvider>
                            <AppModalProvider>
                              <RootLayoutInner />
                              <AccountSheet />
                            </AppModalProvider>
                          </WordOfDayProvider>
                        </PlayerProvider>
                      </PlayerProgressProvider>
                    </AccountSheetProvider>
                  </UserAccountProvider>
                </AppProvider>
              </ToastProvider>
            </ErrorBoundary>
          </SafeAreaProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
