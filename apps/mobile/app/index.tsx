import React, { useMemo, useState } from 'react';
import {
  Image,
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
import { BRAND_HERO_ASSET, BRAND_LOGO_ASSET } from '../util/brandAssets';
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
          minHeight: compact ? 108 : 118,
          paddingVertical: compact ? spacing.sm : spacing.md,
          paddingHorizontal: spacing.sm,
          borderRadius: 14,
          backgroundColor: pressed ? colors_light.surfaceAlt : colors_light.surface,
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? spacing.sm : spacing.md,
          borderWidth: 1,
          borderColor: pressed ? colors_light.accent : colors_light.border,
        }}
      >
        <LinearGradient
          colors={[colors_light.accent, colors_light.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: compact ? 42 : 46,
            height: compact ? 42 : 46,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name={icon} size={compact ? 20 : 21} color={colors_light.text} />
        </LinearGradient>
        <CustomText
          variant="label"
          style={{
            color: colors_light.text,
            fontWeight: '500',
            textAlign: 'center',
            fontSize: compact ? 10 : typography.label,
            lineHeight: compact ? 14 : 16,
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

    return configured.length
      ? configured
      : [
          { key: 'player', icon: 'graphic-eq' as const, label: 'Music', route: APP_ROUTES.tabs.player },
          { key: 'videos', icon: 'smart-display' as const, label: 'Videos', route: APP_ROUTES.tabs.videos },
          { key: 'live', icon: 'live-tv' as const, label: 'Live', route: APP_ROUTES.tabs.live },
        ];
  }, [config]);

  const landingStory = useMemo(() => {
    const topCategories = feed.topCategories.filter((item) => item && item.toLowerCase() !== 'all').slice(0, 3);
    const featuredTitle = feed.featured?.title?.trim();
    const featuredDescription = feed.featured?.description?.trim();
    const liveCount = feed.live.length;
    const musicCount = feed.music.length;
    const videoCount = feed.videos.length;

    return {
      eyebrow:
        liveCount > 0
          ? `${liveCount} live session${liveCount === 1 ? '' : 's'} ready now`
          : topCategories.length
            ? `${topCategories.join(' • ')} on deck`
            : 'ClaudyGod mobile experience',
      title:
        featuredTitle ||
        (topCategories.length
          ? `${topCategories.join(', ')} shaped for a calmer mobile flow`
          : 'Worship, messages, and live moments arranged for your phone'),
      description:
        featuredDescription ||
        `Browse ${musicCount} music items, ${videoCount} video moments, and ${
          liveCount || 'new'
        } live updates without the clutter.`,
    };
  }, [feed]);

  const featureCardWidth = isCompactPhone ? '48%' : isMediumScreen ? '31.5%' : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors_light.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={colors_light.background} />

      {/* Gradient overlay background */}
      <LinearGradient
        colors={[
          `rgba(${colors_light.accentRgba ?? '167,139,250'},0.20)`,
          `rgba(${colors_light.accentRgba ?? '167,139,250'},0.05)`,
          'rgba(10,6,18,0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 350,
          zIndex: 0,
        }}
      />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors_light.background }}
        edges={['top', 'bottom']}
      >
        <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.md }}
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
                {/* Hero Image with overlay */}
                <View
                  style={{
                    marginBottom: spacing.lg,
                    borderRadius: 18,
                    overflow: 'hidden',
                    height: isCompactPhone ? 220 : isMediumScreen ? 250 : 286,
                    shadowColor: '#000',
                    shadowOpacity: 0.22,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 6,
                  }}
                >
                  <Image
                    source={BRAND_HERO_ASSET}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', `rgba(${colors_light.backgroundRgba ?? '10,6,18'},0.8)`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 140,
                    }}
                  />
                </View>
              </FadeIn>

              {/* Headline - responsive font sizing */}
              <FadeIn delay={120}>
                <View style={{ marginBottom: spacing.lg }}>
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
                  <CustomText
                    style={{
                      color: colors_light.text,
                      fontSize: isCompactPhone ? 22 : isMediumScreen ? 26 : 30,
                      fontWeight: '700',
                      lineHeight: isCompactPhone ? 29 : isMediumScreen ? 32 : 36,
                      marginBottom: spacing.sm,
                    }}
                  >
                    {landingStory.title}
                  </CustomText>
                  <CustomText
                    style={{
                      color: colors_light.textSecondary,
                      fontSize: isCompactPhone ? 12 : typography.body,
                      lineHeight: isCompactPhone ? 18 : 20,
                    }}
                  >
                    {landingStory.description}
                  </CustomText>
                </View>
              </FadeIn>

              {/* CTA Buttons - responsive spacing */}
              <FadeIn delay={160}>
                <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
                  <AppButton
                    title="Get Started"
                    size={isCompactPhone ? 'md' : 'lg'}
                    onPress={() => router.push(APP_ROUTES.auth.signUp)}
                    fullWidth
                    style={{ borderRadius: 13 }}
                  />
                  <AppButton
                    title="Browse as Guest"
                    variant="secondary"
                    size={isCompactPhone ? 'md' : 'lg'}
                    onPress={() => router.push(APP_ROUTES.tabs.player)}
                    fullWidth
                    style={{
                      borderColor: colors_light.border,
                      backgroundColor: colors_light.surface,
                      borderRadius: 13,
                      borderWidth: 1,
                    }}
                    textColor={colors_light.text}
                  />
                </View>
              </FadeIn>

              {/* Quick Access Features - responsive layout */}
              <FadeIn delay={200}>
                <View>
                  <CustomText
                    variant="label"
                    style={{
                      color: colors_light.textSecondary,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: spacing.sm,
                    }}
                  >
                    Explore Categories
                  </CustomText>
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
            </View>
          </ScrollView>
        </Screen>
      </SafeAreaView>
    </View>
  );
}
