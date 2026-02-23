// app/_layout.tsx
import { Stack } from 'expo-router';
import '../global.css';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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

// Loading component that also respects theme
function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.94)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0.9)).current;

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
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0.9, duration: 1800, useNativeDriver: true }),
      ]),
    );

    pulseLoop.start();
    shimmerLoop.start();
    haloLoop.start();
    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
      haloLoop.stop();
    };
  }, [halo, pulse, shimmer]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#06040D' }}>
      <StatusBar translucent={false} backgroundColor="#06040D" barStyle="light-content" />
      <LinearGradient
        colors={['#06040D', '#150A2D', '#090512']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#06040D' }} edges={['top', 'bottom']}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              width: 250,
              height: 250,
              borderRadius: 250,
              backgroundColor: 'rgba(154,107,255,0.2)',
              transform: [{ scale: halo }],
            }}
          />
          <Animated.View
            style={{
              width: 112,
              height: 112,
              borderRadius: 30,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pulse }],
            }}
          >
            <Image
              source={require('../assets/images/ClaudyGoLogo.webp')}
              style={{ width: 62, height: 62, borderRadius: 18 }}
            />
          </Animated.View>

          <View
            style={{
              width: 138,
              height: 6,
              borderRadius: 999,
              marginTop: 18,
              backgroundColor: 'rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                width: 72,
                height: 6,
                borderRadius: 999,
                backgroundColor: '#9A6BFF',
                transform: [{ translateX: shimmerTranslate }],
              }}
            />
          </View>

          <Text
            style={{
              marginTop: 12,
              color: '#F8F7FC',
              fontSize: 13,
              fontFamily: 'SpaceGrotesk_600SemiBold',
              letterSpacing: 0.2,
            }}
          >
            Preparing ClaudyGod
          </Text>
          <Text
            style={{
              marginTop: 4,
              color: 'rgba(196,186,225,0.9)',
              fontSize: 11,
              fontFamily: 'Sora_400Regular',
            }}
          >
            Loading music, videos and live channels...
          </Text>
        </View>
      </SafeAreaView>
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
          contentStyle: { backgroundColor: '#06040D' },
        }}
      >
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="sign-in" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="sign-up" options={{ animation: 'slide_from_right' }} />
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
