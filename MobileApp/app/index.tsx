/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useEffect } from 'react';
import { View, StatusBar, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { useAppTheme } from '../util/colorScheme';

const WelcomePage = () => {
  const router = useRouter();
  const theme = useAppTheme();

  const fade = useSharedValue(0);
  const slide = useSharedValue(30);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 650 });
    slide.value = withTiming(0, { duration: 650 });
    const timer = setTimeout(() => {
      router.replace('/home');
    }, 2600);
    return () => clearTimeout(timer);
  }, [fade, slide, router]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: interpolate(fade.value, [0, 1], [10, 0]) }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

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
        colors={['rgba(11,15,26,0.2)', 'rgba(11,15,26,0.75)', 'rgba(11,15,26,0.95)']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 80 }}>
        <Animated.View style={heroStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Image
              source={require('../assets/images/ClaudyGoLogo.webp')}
              style={{ width: 44, height: 44, borderRadius: 8 }}
            />
            <View style={{ marginLeft: 12 }}>
              <CustomText style={{ color: '#F8FAFC', fontWeight: '800', fontSize: 16 }}>
                ClaudyGod Music
              </CustomText>
              <CustomText style={{ color: '#CBD5F5', fontSize: 11 }}>
                Stream • Watch • Download
              </CustomText>
            </View>
          </View>

          <CustomText
            variant="display"
            style={{ color: '#F8FAFC', fontSize: 20, lineHeight: 26 }}
          >
            Premium worship streaming.
          </CustomText>
          <CustomText
            variant="body"
            style={{ color: '#CBD5F5', marginTop: 6, lineHeight: 18, fontSize: 12 }}
          >
            Curated audio and live sessions with TV‑ready playback and offline support.
          </CustomText>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => router.replace('/home')}
              style={{
                backgroundColor: theme.colors.primary,
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 10,
              }}
            >
              <CustomText style={{ color: theme.colors.text.inverse, fontWeight: '700' }}>Get Started</CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/home')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.15)',
              }}
            >
              <CustomText style={{ color: '#E2E8F0', fontWeight: '600' }}>Explore</CustomText>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[badgeStyle, { marginTop: 18 }]}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <CustomText style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '700' }}>
              Live now
            </CustomText>
            <CustomText style={{ color: '#CBD5F5', fontSize: 11, marginTop: 4 }}>
              ClaudyGod • Evening worship session
            </CustomText>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {['Offline Ready', 'TV Optimized', 'High Quality'].map((tag) => (
              <View
                key={tag}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                <CustomText style={{ color: '#E2E8F0', fontSize: 11 }}>{tag}</CustomText>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

export default WelcomePage;
