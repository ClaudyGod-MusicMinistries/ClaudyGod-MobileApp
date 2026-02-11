// app/_layout.tsx
import { Stack } from 'expo-router';
import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useContext } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { ThemeProvider } from '../context/ThemeProvider';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { FontProvider, FontContext } from '../context/FontContext';

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

function RootLayoutInner() {
  const { fontsLoaded } = useContext(FontContext);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ThemedLayout>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="Welcome" />
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
