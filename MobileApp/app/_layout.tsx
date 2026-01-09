// app/_layout.tsx
import { Stack } from 'expo-router';
import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { loadFonts } from '../util/fonts';
import { ThemeProvider } from '../context/ThemeProvider';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';

// Component to handle status bar and background color based on theme
function ThemedLayout({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
      />
      {children}
    </View>
  );
}

// Loading component that also respects theme
function LoadingScreen() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: currentColors.background, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Text style={{ color: currentColors.text.primary }}>Loading...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await loadFonts();
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
      }
    }

    prepare();
  }, []);

  if (!fontsLoaded) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <LoadingScreen />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ThemedLayout>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="Welcome" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ThemedLayout>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}