import React, { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  View,
  useWindowDimensions,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/layout/Screen';
import { CustomText } from '../components/CustomText';
import { FadeIn } from '../components/ui/FadeIn';
import { AppButton } from '../components/ui/AppButton';
import { useContentFeed } from '../hooks/useContentFeed';
import { useMobileAppConfig } from '../hooks/useMobileAppConfig';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';
import { colors } from '../constants/color';
import { spacing, typography } from '../styles/designTokens';

const colors_light = colors.light;

// Beautiful feature card with icon - uses design tokens for responsive sizing
function FeatureCard({
  icon,
  label,
  onPress,
  compact,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  compact?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          flex: 1,
          minHeight: compact ? 92 : 100,
          paddingVertical: compact ? spacing.xs : spacing.sm,
          paddingHorizontal: spacing.sm,
          borderRadius: 10,
          backgroundColor: pressed ? colors_light.surfaceAlt : colors_light.surface,
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? spacing.xs : spacing.sm,
          borderWidth: 1,
          borderColor: pressed ? colors_light.accent : colors_light.border,
        }}
      >
        <LinearGradient
          colors={[colors_light.accent, colors_light.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: compact ? 34 : 38,
            height: compact ? 34 : 38,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
        <MaterialIcons name={icon} size={compact ? 16 : 18} color={colors_light.text} />
        </LinearGradient>
        <CustomText
          variant="label"
          style={{
            color: colors_light.text,
            fontWeight: '500',
            textAlign: 'center',
          fontSize: compact ? 9 : 10,
          lineHeight: compact ? 12 : 14,
          }}
        >
          {label}
        </CustomText>
      </Pressable>
    </Animated.View>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { feed } = useContentFeed();
  const { config } = useMobileAppConfig();

  const isCompactPhone = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 600;

  const previewLinks = useMemo(() => {
    const configured = (config?.navigation?.tabs ?? [])
      .filter((tab) => tab.id === 'player' || tab.id === 'videos' || tab.id === 'live')
      .map((tab) => ({
        key: tab.id,
        icon: (tab.icon as React.ComponentProps<typeof MaterialIcons>['name']) || 'play-circle-filled',
        label: tab.label,
        route: TAB_ROUTE_BY_ID[tab.id],
      }));

    return configured;
  }, [config]);

  const spotlight =
    feed.featured ??
    feed.live[0] ??
    feed.music[0] ??
    feed.videos[0] ??
    feed.recent[0] ??
    null;

  const landingStory = useMemo(() => {
    if (!spotlight) return null;

    return {
      eyebrow: spotlight.subtitle || (spotlight.isLive ? 'Live now' : undefined),
      title: spotlight.title,
      description: spotlight.description,
    };
  }, [spotlight]);

  const featureCardWidth = isCompactPhone ? '48%' : isMediumScreen ? '31.5%' : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors_light.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={colors_light.background} />

      <ImageBackground
        source={LANDING_BG_ASSET}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <LinearGradient
          colors={['rgba(6,4,12,0.68)', 'rgba(6,4,12,0.86)', 'rgba(6,4,12,0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </ImageBackground>

      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors_light.background }}
        edges={['top', 'bottom']}
      >
        <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          >
            {/* Minimal Header */}
            <FadeIn delay={0}>
              <View
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: colors_light.surface,
                      borderWidth: 1,
                      borderColor: colors_light.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image source={BRAND_LOGO_ASSET} style={{ width: 22, height: 22, borderRadius: 6 }} />
                  </View>
                  <CustomText
                    variant="title"
                    style={{
                      color: colors_light.text,
                      fontWeight: '600',
                    }}
                  >
                    ClaudyGod
                  </CustomText>
                </View>

                <Pressable
                  onPress={() => router.push(APP_ROUTES.auth.signIn)}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: 10,
                    backgroundColor: pressed ? colors_light.accent : 'transparent',
                    borderWidth: 1.5,
                    borderColor: colors_light.accent,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <CustomText
                    variant="label"
                    style={{
                      color: colors_light.accent,
                      fontWeight: '600',
                    }}
                  >
                    Sign In
                  </CustomText>
                </Pressable>
              </View>
            </FadeIn>

            {/* Hero Section - Clean and Minimal with responsive sizing */}
            <View
              style={{
                flex: 1,
                paddingHorizontal: spacing.md,
                paddingTop: spacing.md,
                paddingBottom: spacing.xxl,
                justifyContent: 'center',
              }}
            >
              <FadeIn delay={80}>
                <View style={{ height: isCompactPhone ? 10 : 16 }} />
              </FadeIn>

              {/* Headline - responsive font sizing */}
              {landingStory ? (
                <FadeIn delay={120}>
                  <View style={{ marginBottom: spacing.lg }}>
                    {landingStory.eyebrow ? (
                      <CustomText
                        variant="label"
                        style={{
                          color: colors_light.accent,
                          fontSize: isCompactPhone ? 10 : 11,
                          fontWeight: '600',
                          letterSpacing: 0.7,
                          textTransform: 'uppercase',
                          marginBottom: spacing.xs,
                        }}
                      >
                        {landingStory.eyebrow}
                      </CustomText>
                    ) : null}
                    <CustomText
                      style={{
                        color: colors_light.text,
                        fontSize: isCompactPhone ? 22 : isMediumScreen ? 26 : 30,
                        fontWeight: '700',
                        lineHeight: isCompactPhone ? 29 : isMediumScreen ? 32 : 36,
                        marginBottom: landingStory.description ? spacing.sm : 0,
                      }}
                    >
                      {landingStory.title}
                    </CustomText>
                    {landingStory.description ? (
                      <CustomText
                        style={{
                          color: colors_light.textSecondary,
                          fontSize: isCompactPhone ? 12 : typography.body,
                          lineHeight: isCompactPhone ? 18 : 20,
                        }}
                      >
                        {landingStory.description}
                      </CustomText>
                    ) : null}
                  </View>
                </FadeIn>
              ) : null}

              {/* CTA Buttons - responsive spacing */}
              <FadeIn delay={160}>
                <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
                  <AppButton
                    title="Get Started"
                    size={isCompactPhone ? 'sm' : 'md'}
                    onPress={() => router.push(APP_ROUTES.auth.signUp)}
                    fullWidth
                    style={{ borderRadius: 10 }}
                  />
                  <AppButton
                    title="Browse as Guest"
                    variant="secondary"
                    size={isCompactPhone ? 'sm' : 'md'}
                    onPress={() => router.push(APP_ROUTES.tabs.player)}
                    fullWidth
                    style={{
                      borderColor: colors_light.border,
                      backgroundColor: colors_light.surface,
                      borderRadius: 10,
                      borderWidth: 1,
                    }}
                    textColor={colors_light.text}
                  />
                </View>
              </FadeIn>

              {/* Quick Access Features - responsive layout */}
              {previewLinks.length ? (
                <FadeIn delay={200}>
                  <View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                      {previewLinks.map((link) => (
                        <View key={link.key} style={featureCardWidth ? { width: featureCardWidth } : { flex: 1 }}>
                          <FeatureCard
                            compact={isCompactPhone}
                            icon={link.icon as React.ComponentProps<typeof MaterialIcons>['name']}
                            label={link.label}
                            onPress={() => router.push(link.route)}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                </FadeIn>
              ) : null}
            </View>
          </ScrollView>
        </Screen>
      </SafeAreaView>
    </View>
  );
}
