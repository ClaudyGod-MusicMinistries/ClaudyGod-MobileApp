// components/ui/Header.tsx
/**
 * Modern Header Component
 * Beautiful, flexible header with animated transitions
 */

import React from 'react';
import { View, StyleSheet, Animated, SafeAreaView, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';

type GradientColors = readonly [string, string, ...string[]];

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gradient?: GradientColors;
  animated?: boolean;
  onScroll?: (_offset: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
  gradient,
  animated = true,
  onScroll: _onScroll,
}) => {
  const theme = useAppTheme();
  const gradientColors: GradientColors = gradient ?? [theme.colors.primary, theme.colors.accent];
  const TitleContainer = animated ? Animated.View : View;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      <SafeAreaView>
        <View style={styles.header}>
          {/* Left Action */}
          <View style={styles.actionContainer}>
            {leftAction}
          </View>

          {/* Title Section */}
          <TitleContainer
            style={[
              styles.titleContainer,
              animated ? styles.animatedTitleContainer : null,
            ]}
          >
            <CustomText style={[styles.title, { color: theme.colors.text.inverse }]}>
              {title}
            </CustomText>
            {subtitle && (
              <CustomText style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                {subtitle}
              </CustomText>
            )}
          </TitleContainer>

          {/* Right Action */}
          <View style={styles.actionContainer}>
            {rightAction}
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Accent Line */}
      <View
        style={[
          styles.accentLine,
          { backgroundColor: 'rgba(255,255,255,0.2)' },
        ]}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionContainer: {
    flex: 0.5,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
  },
  animatedTitleContainer: {
    opacity: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  accentLine: {
    height: 1,
    marginTop: 8,
  },
});
