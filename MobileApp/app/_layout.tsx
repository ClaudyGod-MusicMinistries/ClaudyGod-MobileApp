// app/_layout.tsx
import { Stack } from 'expo-router';
import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useContext, useEffect, useRef } from 'react';
import { View, StatusBar, Animated, Image, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const pulse = useRef(new Animated.Value(0.94)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.02, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.94, duration: 900, useNativeDriver: true }),
      ]),
    );
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1600, useNativeDriver: true }),
    );

    pulseLoop.start();
    shimmerLoop.start();
    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, [pulse, shimmer]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: currentColors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['rgba(76,29,149,0.24)', 'rgba(10,10,15,0)']
            : ['rgba(124,58,237,0.14)', 'rgba(255,255,255,0)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 340 }}
      />
      <Animated.View
        style={{
          width: 96,
          height: 96,
          borderRadius: 30,
          backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.12)',
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(124,58,237,0.28)',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pulse }],
        }}
      >
        <Image
          source={require('../assets/images/ClaudyGoLogo.webp')}
          style={{ width: 58, height: 58, borderRadius: 16 }}
        />
      </Animated.View>

      <View
        style={{
          width: 120,
          height: 6,
          borderRadius: 999,
          marginTop: 20,
          backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.14)',
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            width: 64,
            height: 6,
            borderRadius: 999,
            backgroundColor: currentColors.primary,
            transform: [{ translateX: shimmerTranslate }],
          }}
        />
      </View>
      <Text
        style={{
          marginTop: 12,
          color: currentColors.text.primary,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.2,
        }}
      >
        Preparing ClaudyGod
      </Text>
      <Text
        style={{
          marginTop: 4,
          color: currentColors.text.secondary,
          fontSize: 11,
        }}
      >
        Optimizing playback and interface...
      </Text>
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
