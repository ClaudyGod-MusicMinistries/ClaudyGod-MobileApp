import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { useAppTheme } from '../util/colorScheme';

const tips = [
  {
    icon: 'search',
    title: 'Search fast',
    desc: 'Find songs, sermons, or artists instantly.',
    action: 'Open Search',
    route: '/(tabs)/search',
  },
  {
    icon: 'play-circle',
    title: 'Play instantly',
    desc: 'Tap any card for audio or video.',
    action: 'Open Player',
    route: '/(tabs)/PlaySection',
  },
  {
    icon: 'library-music',
    title: 'Build library',
    desc: 'Save favorites and playlists.',
    action: 'Go to Library',
    route: '/(tabs)/Favourites',
  },
  {
    icon: 'cast',
    title: 'Cast to TV',
    desc: 'Enjoy a big‑screen worship experience.',
    action: 'Explore Home',
    route: '/home',
  },
];

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const TipCard = ({
  tip,
  index,
  isLast,
  cardWidth,
  cardSpacing,
  snapInterval,
  scrollX,
  onPress,
  theme,
}: {
  tip: (typeof tips)[number];
  index: number;
  isLast: boolean;
  cardWidth: number;
  cardSpacing: number;
  snapInterval: number;
  scrollX: any;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * snapInterval,
      index * snapInterval,
      (index + 1) * snapInterval,
    ];
    const scale = interpolate(scrollX.value, inputRange, [0.94, 1.04, 0.94], Extrapolate.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [10, 0, 10], Extrapolate.CLAMP);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: cardWidth,
          marginRight: isLast ? 0 : cardSpacing,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          alignItems: 'center',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${theme.colors.primary}22`,
            marginBottom: 12,
          }}
        >
          <MaterialIcons name={tip.icon as any} size={20} color={theme.colors.accent} />
        </View>
        <CustomText variant="subtitle" style={{ color: '#F8FAFC', textAlign: 'center' }}>
          {tip.title}
        </CustomText>
        <CustomText
          variant="caption"
          style={{ color: '#CBD5F5', textAlign: 'center', marginTop: 6 }}
        >
          {tip.desc}
        </CustomText>
        <View style={{ marginTop: 12, alignSelf: 'stretch' }}>
          <AppButton title={tip.action} size="sm" variant="outline" fullWidth />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const Landing = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const [activeTip, setActiveTip] = useState(0);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(320, width - 72);
  const cardSpacing = 16;
  const sidePadding = Math.max(16, (width - cardWidth) / 2);
  const snapInterval = cardWidth + cardSpacing;
  const scrollRef = useRef<React.ComponentRef<typeof AnimatedScrollView>>(null);
  const scrollX = useSharedValue(0);

  const fadeIn = useSharedValue(0);
  const logoBounce = useSharedValue(0);
  const glowPulse = useSharedValue(1);
  const titleFloat = useSharedValue(12);
  const subtitleFloat = useSharedValue(16);
  const ctaScale = useSharedValue(0.92);
  const ringRotate = useSharedValue(0);
  const orbDrift = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800 });
    logoBounce.value = withSequence(
      withSpring(-18, { damping: 10, stiffness: 140 }),
      withSpring(0, { damping: 8, stiffness: 120 })
    );
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      false
    );
    titleFloat.value = withTiming(0, { duration: 900 });
    subtitleFloat.value = withDelay(80, withTiming(0, { duration: 900 }));
    ctaScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 140 }));
    ringRotate.value = withRepeat(withTiming(360, { duration: 12000 }), -1, false);
    orbDrift.value = withRepeat(withSequence(withTiming(1, { duration: 2600 }), withTiming(0, { duration: 2600 })), -1, true);
  }, [ctaScale, fadeIn, glowPulse, logoBounce, orbDrift, ringRotate, subtitleFloat, titleFloat]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTip((prev) => {
        const next = (prev + 1) % tips.length;
        const scrollNode = scrollRef.current as unknown as ScrollView | null;
        scrollNode?.scrollTo({ x: next * snapInterval, animated: true });
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [snapInterval]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoBounce.value }, { scale: glowPulse.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleFloat.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: subtitleFloat.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${ringRotate.value}deg` }, { scale: glowPulse.value }],
  }));

  const orbTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(orbDrift.value, [0, 1], [0, -18]) }],
  }));

  const orbBottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(orbDrift.value, [0, 1], [0, 14]) }],
  }));

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <Image
        source={require('../assets/images/manBack.webp')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        }}
      />

      <LinearGradient
        colors={['rgba(3,6,12,0.75)', 'rgba(3,6,12,0.88)', 'rgba(3,6,12,0.98)']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          orbTopStyle,
          {
            position: 'absolute',
            top: 86,
            right: -62,
            width: 220,
            height: 220,
            borderRadius: 220,
            backgroundColor: 'rgba(192,132,252,0.15)',
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          orbBottomStyle,
          {
            position: 'absolute',
            bottom: 110,
            left: -70,
            width: 210,
            height: 210,
            borderRadius: 210,
            backgroundColor: 'rgba(124,58,237,0.14)',
          },
        ]}
      />

      <Animated.View
        style={[
          heroStyle,
          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
        ]}
      >
        <Animated.View
          style={[
            logoStyle,
            {
              width: 96,
              height: 96,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              marginBottom: 18,
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              ringStyle,
              {
                position: 'absolute',
                width: 128,
                height: 128,
                borderRadius: 64,
                borderWidth: 1,
                borderColor: 'rgba(192,132,252,0.25)',
              },
            ]}
          />
          <Image
            source={require('../assets/images/ClaudyGoLogo.webp')}
            style={{ width: 64, height: 64, borderRadius: 16 }}
          />
        </Animated.View>

        <Animated.View style={titleStyle}>
          <CustomText variant="display" style={{ color: '#F8FAFC', textAlign: 'center' }}>
            ClaudyGod Music
          </CustomText>
        </Animated.View>
        <Animated.View style={subtitleStyle}>
          <CustomText variant="body" style={{ color: '#CBD5F5', marginTop: 6, textAlign: 'center' }}>
            Premium worship streaming engineered for mobile, TV, and cast devices.
          </CustomText>
        </Animated.View>

        <Animated.View style={[ctaStyle, { marginTop: 18 }]}>
          <AppButton
            title="Get Started"
            size="sm"
            variant="primary"
            onPress={() => router.replace('/home')}
          />
        </Animated.View>

        <View style={{ marginTop: 26, width: '100%' }}>
          <CustomText variant="title" style={{ color: '#F8FAFC', textAlign: 'center' }}>
            Quick tour
          </CustomText>
          <CustomText variant="caption" style={{ color: '#CBD5F5', textAlign: 'center', marginTop: 6 }}>
            Swipe to explore key actions.
          </CustomText>

          <AnimatedScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={snapInterval}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: sidePadding,
              paddingVertical: 16,
            }}
            onMomentumScrollEnd={(event: any) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
              setActiveTip(index);
            }}
          >
            {tips.map((tip, index) => (
              <TipCard
                key={tip.title}
                tip={tip}
                index={index}
                isLast={index === tips.length - 1}
                cardWidth={cardWidth}
                cardSpacing={cardSpacing}
                snapInterval={snapInterval}
                scrollX={scrollX}
                onPress={() => router.push(tip.route)}
                theme={theme}
              />
            ))}
          </AnimatedScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4 }}>
            {tips.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={{
                  width: activeTip === index ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  marginHorizontal: 4,
                  backgroundColor: activeTip === index ? theme.colors.accent : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default Landing;
