import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { TVTouchable } from '../components/ui/TVTouchable';
import { Screen } from '../components/layout/Screen';

const topChips = ['Music', 'Videos', 'Live', 'Ads', 'Playlists', 'Messages', 'Worship'];

export default function LandingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const compact = height < 720 || width < 360;

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const glow = useRef(new Animated.Value(0.85)).current;
  const chipFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.85, duration: 1800, useNativeDriver: true }),
      ]),
    );

    const chipLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(chipFloat, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(chipFloat, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    );

    glowLoop.start();
    chipLoop.start();

    return () => {
      glowLoop.stop();
      chipLoop.stop();
    };
  }, [chipFloat, fade, glow, rise]);

  const chipTranslate = chipFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const orbTranslate = chipFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  const logoSize = isTV ? 108 : isTablet ? 92 : compact ? 68 : 76;
  const headlineSize = isTV ? 32 : isTablet ? 26 : compact ? 20 : 22;

  const featureCards = useMemo(
    () => [
      {
        id: 'live',
        icon: 'live-tv' as const,
        title: 'Live Hub',
        body: 'Notify followers when a stream starts and show viewer count in the Live section.',
        tint: 'rgba(239,68,68,0.15)',
        border: 'rgba(252,165,165,0.28)',
        iconColor: '#FCA5A5',
      },
      {
        id: 'ad',
        icon: 'campaign' as const,
        title: 'Ads Slot',
        body: 'Reserve premium sponsored placements at the top of Home and Videos feeds.',
        tint: 'rgba(154,107,255,0.16)',
        border: 'rgba(216,194,255,0.24)',
        iconColor: '#E8D7FF',
      },
    ],
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#05040D' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#05040D" />

      <LinearGradient
        colors={['#120A26', '#080512', '#05040D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          left: -40,
          width: 220,
          height: 220,
          borderRadius: 220,
          backgroundColor: 'rgba(154,107,255,0.14)',
          transform: [{ translateY: orbTranslate }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -90,
          bottom: 70,
          width: 260,
          height: 260,
          borderRadius: 260,
          backgroundColor: 'rgba(56,189,248,0.08)',
          transform: [{ translateY: orbTranslate }],
        }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 18 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, paddingTop: compact ? 8 : 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                  <Image
                    source={require('../assets/images/ClaudyGoLogo.webp')}
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <CustomText variant="caption" style={{ color: 'rgba(217,207,243,0.86)' }}>
                      ClaudyGod Ministries
                    </CustomText>
                    <CustomText variant="label" style={{ color: '#F7F5FD' }} numberOfLines={1}>
                      Streaming Platform
                    </CustomText>
                  </View>
                </View>

                <TVTouchable
                  onPress={() => router.replace('/(tabs)/home')}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(234,223,255,0.26)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                  }}
                  showFocusBorder={false}
                >
                  <CustomText variant="caption" style={{ color: '#EDE3FF' }}>
                    Demo
                  </CustomText>
                </TVTouchable>
              </View>

              <Animated.View style={{ marginTop: 10, transform: [{ translateY: chipTranslate }] }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  overScrollMode="never"
                  bounces={false}
                  contentContainerStyle={{ paddingRight: 10 }}
                >
                  {topChips.map((chip) => (
                    <View
                      key={chip}
                      style={{
                        marginRight: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(229,220,251,0.18)',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <CustomText variant="caption" style={{ color: '#DCD0F5' }}>
                        {chip}
                      </CustomText>
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>

              <Animated.View
                style={{
                  opacity: fade,
                  transform: [{ translateY: rise }],
                  marginTop: 12,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(10,8,17,0.9)',
                  padding: isTV ? 26 : isTablet ? 22 : compact ? 16 : 18,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Animated.View
                    style={{
                      width: logoSize + 22,
                      height: logoSize + 22,
                      borderRadius: (logoSize + 22) / 2,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.16)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [{ scale: glow }],
                    }}
                  >
                    <Image
                      source={require('../assets/images/ClaudyGoLogo.webp')}
                      style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
                    />
                  </Animated.View>

                  <CustomText
                    variant="hero"
                    style={{
                      marginTop: 14,
                      color: '#F8F7FC',
                      textAlign: 'center',
                      fontSize: headlineSize,
                      lineHeight: headlineSize + 6,
                    }}
                  >
                    Worship, Music & Live — built for mobile, tablet and TV.
                  </CustomText>
                  <CustomText
                    variant="body"
                    style={{
                      marginTop: 8,
                      textAlign: 'center',
                      color: 'rgba(208,200,230,0.9)',
                      maxWidth: 600,
                    }}
                  >
                    Structured like modern streaming apps: content rails, live notifications, ads slots, and user analytics ready for YouTube + Supabase integrations.
                  </CustomText>
                </View>

                <View style={{ marginTop: 16, gap: 10 }}>
                  {featureCards.map((card) => (
                    <View
                      key={card.id}
                      style={{
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: card.border,
                        backgroundColor: card.tint,
                        padding: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          marginRight: 10,
                        }}
                      >
                        <MaterialIcons name={card.icon} size={20} color={card.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomText variant="label" style={{ color: '#F6F2FF' }}>
                          {card.title}
                        </CustomText>
                        <CustomText variant="caption" style={{ color: 'rgba(225,217,244,0.92)', marginTop: 4 }}>
                          {card.body}
                        </CustomText>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={{ marginTop: 16 }}>
                  <AppButton title="Create Account" size="lg" fullWidth onPress={() => router.push('/sign-up')} />
                  <AppButton
                    title="Sign In"
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onPress={() => router.push('/sign-in')}
                    style={{
                      marginTop: 10,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(233,221,255,0.24)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                    textColor="#EDE3FF"
                    leftIcon={<MaterialIcons name="login" size={18} color="#EDE3FF" />}
                  />
                </View>
              </Animated.View>

              <View style={{ marginTop: 14, paddingHorizontal: 2 }}>
                <TVTouchable onPress={() => router.replace('/(tabs)/home')} showFocusBorder={false}>
                  <CustomText variant="caption" style={{ color: 'rgba(205,194,232,0.9)', textAlign: 'center' }}>
                    Continue to demo home without signing in
                  </CustomText>
                </TVTouchable>
              </View>

              <View style={{ flex: 1 }} />

              <View style={{ marginTop: 18, paddingBottom: 6 }}>
                <CustomText variant="caption" style={{ color: 'rgba(170,160,197,0.88)', textAlign: 'center' }}>
                  ClaudyGod • Mobile / Tablet / TV ready layout shell
                </CustomText>
              </View>
            </View>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
