import { Stack } from 'expo-router';
import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { View, StatusBar, Animated, Image, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeProvider } from '../context/ThemeProvider';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { FontProvider, FontContext } from '../context/FontContext';

function ThemedLayout({ children }: { children: ReactNode }) {
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

function LoadingScreen() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];

  const pulse = useRef(new Animated.Value(0.92)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.92, duration: 850, useNativeDriver: true }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, useNativeDriver: true }),
    );

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1700, useNativeDriver: true }),
    );

    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    );

    pulseLoop.start();
    spinLoop.start();
    shimmerLoop.start();
    breathLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
      shimmerLoop.stop();
      breathLoop.stop();
    };
  }, [breath, pulse, shimmer, spin]);

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

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: currentColors.background,
      }}
    >
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['#05030C', '#1A0C35', '#090512']
            : ['#F8F4FF', '#EFE6FF', '#FFFFFF']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: 280,
          backgroundColor: colorScheme === 'dark' ? 'rgba(154,107,255,0.24)' : 'rgba(124,58,237,0.16)',
          transform: [{ scale: breathScale }],
          opacity: 0.9,
        }}
      />

      <Animated.View
        style={{
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? 'rgba(234,223,255,0.35)' : 'rgba(124,58,237,0.36)',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: rotation }],
        }}
      >
        <View
          style={{
            width: 110,
            height: 110,
            borderRadius: 34,
            borderWidth: 1,
            borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(124,58,237,0.32)',
            backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#9A6BFF',
            shadowOpacity: 0.46,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 12,
            transform: [{ scale: pulse }],
          }}
        >
          <Image
            source={require('../assets/images/ClaudyGoLogo.webp')}
            style={{ width: 64, height: 64, borderRadius: 18 }}
          />
        </View>
      </Animated.View>

      <View
        style={{
          width: 140,
          height: 5,
          borderRadius: 999,
          marginTop: 26,
          backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(124,58,237,0.2)',
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            width: 72,
            height: 5,
            borderRadius: 999,
            backgroundColor: currentColors.primary,
            transform: [{ translateX: shimmerTranslate }],
          }}
        />
      </View>

      <Text
        style={{
          marginTop: 13,
          color: currentColors.text.primary,
          fontSize: 13,
          letterSpacing: 0.25,
          fontFamily: 'SpaceGrotesk_500Medium',
        }}
      >
        Preparing ClaudyGod
      </Text>
      <Text
        style={{
          marginTop: 4,
          color: currentColors.text.secondary,
          fontSize: 11,
          fontFamily: 'Sora_400Regular',
        }}
      >
        Syncing your stream and transitions...
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
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="sign-in" options={{ animation: 'slide_from_right' }} />
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
