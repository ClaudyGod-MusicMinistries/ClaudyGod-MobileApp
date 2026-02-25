// app/_layout.tsx
import { Stack } from 'expo-router';
import '../global.css';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useContext, useEffect, useRef, useState } from 'react';
import { View, StatusBar, Animated, Image, Text, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeProvider } from '../context/ThemeProvider';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { FontProvider, FontContext } from '../context/FontContext';

const LOADER_MOTION = {
  introEnter: 760,
  introTextFade: 540,
  introIconsFade: 560,
  introHoldBeforeExit: 2850,
  introExit: 560,
  loaderEnter: 620,
  loaderEnterDelay: 140,
  pulseCycle: 2200,
  haloCycle: 3000,
  dotsCycle: 1200,
  bgZoomHalfCycle: 4200,
  gradientBreathHalfCycle: 2200,
} as const;

const MIN_STARTUP_EXPERIENCE_MS = 3600;

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
  const [showIntro, setShowIntro] = useState(true);
  const pulse = useRef(new Animated.Value(0.95)).current;
  const halo = useRef(new Animated.Value(0.88)).current;
  const dots = useRef(new Animated.Value(0)).current;
  const introOpacity = useRef(new Animated.Value(1)).current;
  const introScale = useRef(new Animated.Value(0.96)).current;
  const introLift = useRef(new Animated.Value(14)).current;
  const introTextOpacity = useRef(new Animated.Value(0)).current;
  const introIconsOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const loaderScale = useRef(new Animated.Value(0.985)).current;
  const bgZoom = useRef(new Animated.Value(1.05)).current;
  const gradientBreath = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.012,
          duration: LOADER_MOTION.pulseCycle / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.95,
          duration: LOADER_MOTION.pulseCycle / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1.065,
          duration: LOADER_MOTION.haloCycle / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0.88,
          duration: LOADER_MOTION.haloCycle / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const dotsLoop = Animated.loop(
      Animated.timing(dots, { toValue: 3, duration: LOADER_MOTION.dotsCycle, useNativeDriver: false }),
    );
    const bgLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgZoom, {
          toValue: 1.1,
          duration: LOADER_MOTION.bgZoomHalfCycle,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgZoom, {
          toValue: 1.03,
          duration: LOADER_MOTION.bgZoomHalfCycle,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientBreath, {
          toValue: 1,
          duration: LOADER_MOTION.gradientBreathHalfCycle,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(gradientBreath, {
          toValue: 0.82,
          duration: LOADER_MOTION.gradientBreathHalfCycle,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const dotsReset = dots.addListener(({ value }) => {
      if (value >= 3) {
        dots.setValue(0);
      }
    });

    Animated.parallel([
      Animated.spring(introScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 160,
        mass: 0.8,
      }),
      Animated.timing(introLift, {
        toValue: 0,
        duration: LOADER_MOTION.introEnter,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(introTextOpacity, {
        toValue: 1,
        duration: LOADER_MOTION.introTextFade,
        delay: 160,
        useNativeDriver: true,
      }),
      Animated.timing(introIconsOpacity, {
        toValue: 1,
        duration: LOADER_MOTION.introIconsFade,
        delay: 340,
        useNativeDriver: true,
      }),
    ]).start();

    pulseLoop.start();
    haloLoop.start();
    dotsLoop.start();
    bgLoop.start();
    gradientLoop.start();

    const introTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(introOpacity, {
          toValue: 0,
          duration: LOADER_MOTION.introExit,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introLift, {
          toValue: -10,
          duration: LOADER_MOTION.introExit,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(loaderOpacity, {
          toValue: 1,
          duration: LOADER_MOTION.loaderEnter,
          delay: LOADER_MOTION.loaderEnterDelay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(loaderScale, {
          toValue: 1,
          damping: 15,
          stiffness: 170,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setShowIntro(false);
        }
      });
    }, LOADER_MOTION.introHoldBeforeExit);

    return () => {
      pulseLoop.stop();
      haloLoop.stop();
      dotsLoop.stop();
      bgLoop.stop();
      gradientLoop.stop();
      clearTimeout(introTimer);
      dots.removeListener(dotsReset);
    };
  }, [
    bgZoom,
    dots,
    gradientBreath,
    halo,
    introIconsOpacity,
    introLift,
    introOpacity,
    introScale,
    introTextOpacity,
    loaderOpacity,
    loaderScale,
    pulse,
  ]);

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
    <View style={loaderStyles.root}>
      <StatusBar translucent={false} backgroundColor="#05040D" barStyle="light-content" />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { transform: [{ scale: bgZoom }] }]}
      >
        <Image
          source={require('../assets/images/landing4.jpg')}
          style={loaderStyles.bgImage}
          resizeMode="cover"
        />
      </Animated.View>
      <LinearGradient
        colors={['rgba(5,4,13,0.72)', 'rgba(16,8,30,0.7)', 'rgba(6,4,13,0.9)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: gradientBreath }]}>
        <LinearGradient
          colors={['rgba(154,107,255,0.14)', 'rgba(0,0,0,0)', 'rgba(79,70,229,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <SafeAreaView
        style={loaderStyles.safeArea}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <View
          style={loaderStyles.content}
          pointerEvents="none"
        >
          {showIntro ? (
            <Animated.View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                opacity: introOpacity,
                transform: [{ scale: introScale }, { translateY: introLift }],
              }}
            >
              <Animated.View
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 66,
                  backgroundColor: 'rgba(5,4,13,0.34)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#9A6BFF',
                  shadowOpacity: 0.26,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 12 },
                }}
              >
                <Image
                  source={require('../assets/images/ClaudyGoLogo.webp')}
                  style={{ width: 84, height: 84, borderRadius: 42 }}
                />
              </Animated.View>

              <Animated.View style={{ marginTop: 18, alignItems: 'center', opacity: introTextOpacity }}>
                <Text style={loaderStyles.introEyebrow}>ClaudyGod Ministries</Text>
                <Text style={loaderStyles.introTitle}>Streaming Experience</Text>
                <Text style={loaderStyles.introSubtitle}>Music • Videos • Live • Worship</Text>
              </Animated.View>

              <Animated.View style={[loaderStyles.introIconRow, { opacity: introIconsOpacity }]}>
                <IntroBadge icon="music-note" label="Music" />
                <IntroBadge icon="ondemand-video" label="Video" />
                <IntroBadge icon="live-tv" label="Live" />
              </Animated.View>
            </Animated.View>
          ) : null}

          <Animated.View
            style={[
              loaderStyles.loaderStage,
              {
                opacity: loaderOpacity,
                transform: [
                  { scale: loaderScale },
                  {
                    translateY: loaderOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
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
              fontSize: 15,
              fontWeight: '600',
              letterSpacing: 0.25,
            }}
          >
            Preparing your experience
          </Text>

          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Animated.View style={[loaderDotStyle, { opacity: dot1 }]} />
            <Animated.View style={[loaderDotStyle, { opacity: dot2 }]} />
            <Animated.View style={[loaderDotStyle, { opacity: dot3 }]} />
          </View>
          </Animated.View>
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

const loaderStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05040D',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#05040D',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#05040D',
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  loaderStage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introEyebrow: {
    color: 'rgba(233,224,255,0.94)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  introTitle: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  introSubtitle: {
    marginTop: 6,
    color: 'rgba(224,214,247,0.96)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  introIconRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

function IntroBadge({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
}) {
  return (
    <View
      style={{
        marginHorizontal: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(5,4,13,0.34)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <MaterialIcons name={icon} size={14} color="#EAD9FF" />
      <Text style={{ color: '#F3E9FF', marginLeft: 5, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function RootLayoutInner() {
  const { fontsLoaded } = useContext(FontContext);
  const [startupDelayDone, setStartupDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStartupDelayDone(true), MIN_STARTUP_EXPERIENCE_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded || !startupDelayDone) {
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
