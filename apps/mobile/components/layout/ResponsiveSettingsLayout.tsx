import React from 'react';
import { ImageBackground, type ImageSourcePropType, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

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
  contentPadding,
}: ResponsiveSettingsLayoutProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const padding = contentPadding ?? theme.spacing.md;
  const defaultGradientColors: GradientColorStops = [
    'rgba(167,139,250,0.32)',
    'rgba(139,92,246,0.16)',
    'rgba(249,247,254,0.96)',
  ];
  const contentWidth = isTablet ? Math.min(width - padding * 2, 800) : ('100%' as const);

  const content = (
    <View
      style={{
        width: contentWidth,
        alignSelf: 'center',
        paddingHorizontal: padding,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
      }}
    >
      {headerTitle || headerSubtitle ? (
        <View style={{ marginBottom: theme.spacing.lg }}>
          {headerTitle ? (
            <CustomText variant="heading" style={{ color: theme.colors.text, marginBottom: theme.spacing.xs }}>
              {headerTitle}
            </CustomText>
          ) : null}
          {headerSubtitle ? (
            <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>
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
  ) : content;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        translucent={false}
        barStyle={theme.scheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.background}
      />
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
