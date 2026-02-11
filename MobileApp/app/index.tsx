/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StatusBar, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { Screen } from '../components/layout/Screen';
import { useAppTheme } from '../util/colorScheme';

const HOLD_MS = 5 * 60 * 1000; // 5 minutes

const tips = [
  { title: 'Search fast', desc: 'Use the top search icon to find songs, sermons, or artists in seconds.' },
  { title: 'Play instantly', desc: 'Tap any card to start audio or video with TV‑ready playback.' },
  { title: 'Build your library', desc: 'Save favorites and playlists to access them across devices.' },
  { title: 'Offline ready', desc: 'Download content to listen without a connection.' },
];

const Landing = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const [remainingMs, setRemainingMs] = useState(HOLD_MS);

  const fadeIn = useSharedValue(0);
  const logoPulse = useSharedValue(1);
  const floatIn = useSharedValue(16);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800 });
    floatIn.value = withTiming(0, { duration: 800 });
    logoPulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1400 }),
        withTiming(1, { duration: 1400 })
      ),
      -1,
      false
    );

    const timer = setTimeout(() => {
      router.replace('/home');
    }, HOLD_MS);

    const ticker = setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(ticker);
    };
  }, [fadeIn, floatIn, logoPulse, router]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: floatIn.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoPulse.value }],
  }));

  const timeLabel = useMemo(() => {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingMs]);

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
        colors={['rgba(7,12,20,0.25)', 'rgba(7,12,20,0.75)', 'rgba(7,12,20,0.95)']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 70, paddingBottom: 90 }}
      >
        <Screen>
          <Animated.View style={heroStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Animated.View style={logoStyle}>
                <Image
                  source={require('../assets/images/ClaudyGoLogo.webp')}
                  style={{ width: 52, height: 52, borderRadius: 12 }}
                />
              </Animated.View>
              <View style={{ marginLeft: 12 }}>
                <CustomText variant="subtitle" style={{ color: '#F8FAFC' }}>
                  ClaudyGod Music
                </CustomText>
                <CustomText variant="caption" style={{ color: '#CBD5F5', marginTop: 2 }}>
                  Stream • Watch • Download
                </CustomText>
              </View>
            </View>

            <CustomText variant="display" style={{ color: '#F8FAFC' }}>
              Modern worship, beautifully organized.
            </CustomText>
            <CustomText variant="body" style={{ color: '#CBD5F5', marginTop: 6 }}>
              A premium experience built for phones, tablets, and TVs — with fast search, offline playback, and rich media.
            </CustomText>

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <AppButton
                title="Get Started"
                size="sm"
                variant="primary"
                onPress={() => router.replace('/home')}
                style={{ marginRight: 10 }}
              />
              <AppButton
                title="Skip intro"
                size="sm"
                variant="outline"
                onPress={() => router.replace('/home')}
                textColor="#E2E8F0"
                style={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              />
            </View>

            <View
              style={{
                marginTop: 16,
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
              }}
            >
              <CustomText variant="caption" style={{ color: '#E2E8F0' }}>
                Auto‑starts in {timeLabel}
              </CustomText>
            </View>
          </Animated.View>

          <View style={{ marginTop: 26 }}>
            <CustomText variant="title" style={{ color: '#F8FAFC' }}>
              Quick tips
            </CustomText>
            <View style={{ marginTop: 12, gap: 12 }}>
              {tips.map((tip) => (
                <View
                  key={tip.title}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  <CustomText variant="subtitle" style={{ color: '#F8FAFC' }}>
                    {tip.title}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: '#CBD5F5', marginTop: 4 }}>
                    {tip.desc}
                  </CustomText>
                </View>
              ))}
            </View>
          </View>
        </Screen>
      </ScrollView>
    </View>
  );
};

export default Landing;
