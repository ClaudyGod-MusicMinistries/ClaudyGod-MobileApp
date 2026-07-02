import React from 'react';
import { ImageBackground, type ImageSourcePropType, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  rootBg:        { flex: 1, backgroundColor: theme.colors.background },
  heroImg:       { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  gradientFill:  { flex: 1 },
  safeArea:      { flex: 1 },
  scrollGrow:    { flexGrow: 1 },
  headerMargin:  { marginBottom: theme.spacing.lg },
  headerTitle:   { color: theme.colors.text, marginBottom: theme.spacing.xs },
  headerSubtitle:{ color: theme.colors.textSecondary },
}));

// ─── Component ────────────────────────────────────────────────────────────────

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
  const styles = useStyles();
  const theme  = useAppTheme();
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
        <View style={styles.headerMargin}>
          {headerTitle ? (
            <CustomText variant="heading" style={styles.headerTitle}>
              {headerTitle}
            </CustomText>
          ) : null}
          {headerSubtitle ? (
            <CustomText variant="body" style={styles.headerSubtitle}>
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
      contentContainerStyle={styles.scrollGrow}
    >
      {content}
    </ScrollView>
  ) : content;

  return (
    <View style={styles.rootBg}>
      <StatusBar
        translucent={false}
        barStyle={theme.scheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.background}
      />
      {backgroundImage ? (
        <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.heroImg}>
          {showGradientOverlay ? (
            <LinearGradient
              colors={gradientColors ?? defaultGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            />
          ) : null}
        </ImageBackground>
      ) : null}
      <SafeAreaView style={styles.safeArea}>{scrollContent}</SafeAreaView>
    </View>
  );
}
