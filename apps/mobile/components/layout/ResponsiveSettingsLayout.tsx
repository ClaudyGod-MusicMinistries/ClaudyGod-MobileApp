import React from 'react';
import {
  ImageBackground,
  type ImageSourcePropType,
  ScrollView,
  StatusBar,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/color';
import { spacing } from '../../styles/designTokens';
import { CustomText } from '../CustomText';

type GradientColorStops = readonly [string, string, ...string[]];

interface ResponsiveSettingsLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  backgroundImage?: ImageSourcePropType;
  showGradientOverlay?: boolean;
  gradientColors?: GradientColorStops;
  scrollEnabled?: boolean;
  contentPadding?: number;
}

export function ResponsiveSettingsLayout({
  children,
  headerTitle,
  headerSubtitle,
  backgroundImage,
  showGradientOverlay = true,
  gradientColors,
  scrollEnabled = true,
  contentPadding = spacing.md,
}: ResponsiveSettingsLayoutProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const palette = colors.light;
  const defaultGradientColors: GradientColorStops = [
    'rgba(167,139,250,0.32)',
    'rgba(139,92,246,0.16)',
    'rgba(249,247,254,0.96)',
  ];
  const contentWidth = isTablet ? Math.min(width - contentPadding * 2, 800) : '100%';

  const content = (
    <View
      style={{
        width: contentWidth,
        alignSelf: 'center',
        paddingHorizontal: contentPadding,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
      }}
    >
      {headerTitle || headerSubtitle ? (
        <View style={{ marginBottom: spacing.lg }}>
          {headerTitle ? (
            <CustomText variant="heading" style={{ color: palette.text, marginBottom: spacing.xs }}>
              {headerTitle}
            </CustomText>
          ) : null}
          {headerSubtitle ? (
            <CustomText variant="body" style={{ color: palette.textSecondary }}>
              {headerSubtitle}
            </CustomText>
          ) : null}
        </View>
      ) : null}

      {children}
    </View>
  );

  const scrollContent = scrollEnabled ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar translucent={false} barStyle="dark-content" backgroundColor={palette.background} />
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
        >
          {showGradientOverlay ? (
            <LinearGradient
              colors={gradientColors ?? defaultGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          ) : null}
        </ImageBackground>
      ) : null}
      <SafeAreaView style={{ flex: 1 }}>{scrollContent}</SafeAreaView>
    </View>
  );
}
