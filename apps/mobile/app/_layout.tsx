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
  const pulse = useRef(new Animated.Value(0.95)).current;
  const halo = useRef(new Animated.Value(0.88)).current;
  const dots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.01, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.95, duration: 900, useNativeDriver: true }),
      ]),
    );
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0.88, duration: 1800, useNativeDriver: true }),
      ]),
    );
    const dotsLoop = Animated.loop(
      Animated.timing(dots, { toValue: 3, duration: 1200, useNativeDriver: false }),
    );

    const dotsReset = dots.addListener(({ value }) => {
      if (value >= 3) {
        dots.setValue(0);
      }
    });

    pulseLoop.start();
    haloLoop.start();
    dotsLoop.start();
    return () => {
      pulseLoop.stop();
      haloLoop.stop();
      dotsLoop.stop();
      dots.removeListener(dotsReset);
    };
  }, [dots, halo, pulse]);

  const dot1 = dots.interpolate({
    inputRange: [0, 0.7, 1, 3],
    outputRange: [0.25, 0.25, 1, 1],
  });
  const dot2 = dots.interpolate({
    inputRange: [0, 1.1, 1.8, 3],
    outputRange: [0.25, 0.25, 1, 1],
  });
  const dot3 = dots.interpolate({
    inputRange: [0, 2.0, 2.7, 3],
    outputRange: [0.25, 0.25, 1, 1],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#05040D' }}>
      <StatusBar translucent={false} backgroundColor="#05040D" barStyle="light-content" />
      <LinearGradient
        colors={['#05040D', '#10081E', '#06040D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#05040D' }}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            backgroundColor: '#05040D',
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 230,
              height: 230,
              borderRadius: 230,
              backgroundColor: 'rgba(154,107,255,0.16)',
              transform: [{ scale: halo }],
            }}
          />
          <Animated.View
            style={{
              width: 108,
              height: 108,
              borderRadius: 54,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pulse }],
            }}
          >
            <Image
              source={require('../assets/images/ClaudyGoLogo.webp')}
              style={{ width: 62, height: 62, borderRadius: 31 }}
            />
          </Animated.View>

          <Text
            style={{
              marginTop: 16,
              color: '#F8F7FC',
              fontSize: 14,
              fontWeight: '600',
              letterSpacing: 0.4,
            }}
          >
            ClaudyGod
          </Text>

          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Animated.View style={[loaderDotStyle, { opacity: dot1 }]} />
            <Animated.View style={[loaderDotStyle, { opacity: dot2 }]} />
            <Animated.View style={[loaderDotStyle, { opacity: dot3 }]} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const loaderDotStyle = {
  width: 6,
  height: 6,
  borderRadius: 3,
  marginHorizontal: 4,
  backgroundColor: '#BFA0FF',
} as const;

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
