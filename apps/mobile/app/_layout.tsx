import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useContext, useEffect, useState, type ReactNode } from 'react';
import { StatusBar, View } from 'react-native';

import { ThemeProvider } from '../context/ThemeProvider';
import { useColorScheme, useThemeContext, useAppTheme } from '../util/colorScheme';
import { makeStyles } from '../styles/makeStyles';
import { FontProvider, FontContext } from '../context/FontContext';
import { AppProvider } from '../context/AppContext';
import { UserAccountProvider } from '../context/UserAccountContext';
import { AccountSheet } from '../components/auth/AccountSheet';
import { FloatingPlayerProvider, useFloatingPlayer } from '../context/FloatingPlayerContext';
import { ToastProvider } from '../context/ToastContext';
import { AppModalProvider } from '../context/AppModalContext';
import { ToastViewport } from '../components/ui/ToastViewport';
import { MinimizedFloatingPlayer } from '../components/player/MinimizedFloatingPlayer';
import { WordOfDayModal, shouldShowWordModal, markWordModalShown } from '../components/modals/WordOfDayModal';
import { WordOfDayProvider } from '../context/WordOfDayContext';
import { APP_ROUTES } from '../util/appRoutes';
import { AppLoadingScreen } from '../components/Exp/AppLoading';
import { useWordOfDay } from '../hooks/useWordOfDay';

// Global unhandled JS error handler — active in production builds only.
if (!__DEV__) {
  const ErrorUtils = (globalThis as unknown as { ErrorUtils?: { setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void } }).ErrorUtils;
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
  const { themePreference: _themePreference } = useThemeContext();
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

  const { isPlaying: _isPlaying } = useFloatingPlayer().player;

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
    <ThemeProvider>
      <FontProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <AppProvider>
              <UserAccountProvider>
                <FloatingPlayerProvider>
                  <WordOfDayProvider>
                    <AppModalProvider>
                      <RootLayoutInner />
                      <AccountSheet />
                    </AppModalProvider>
                  </WordOfDayProvider>
                </FloatingPlayerProvider>
              </UserAccountProvider>
            </AppProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
