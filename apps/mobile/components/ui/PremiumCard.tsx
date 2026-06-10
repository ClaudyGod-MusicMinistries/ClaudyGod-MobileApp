import React, { useState } from 'react';
import {
  Animated,
  Pressable,
  ViewStyle,
} from 'react-native';
import { designSystem, type ThemeVariant } from '../../theme/designSystem';

interface PremiumCardProps {
  variant?: 'default' | 'elevated' | 'glass';
  theme?: ThemeVariant;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  animated?: boolean;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const paddingMap = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export function PremiumCard({
  variant = 'default',
  theme = 'dark',
  children,
  onPress,
  style,
  animated = true,
  padding = 'md',
}: PremiumCardProps) {
  const [scaleValue] = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (!animated || !onPress) return;
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 120,
        useNativeDriver: false,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!animated) return;
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const containerConfig = designSystem.containers[`card${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof designSystem.containers];
  const themeConfig = containerConfig[theme];

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
    opacity: opacityValue,
  };

  const baseStyle: ViewStyle = {
    borderRadius: designSystem.radius.lg,
    padding: paddingMap[padding],
    ...(variant === 'default' || variant === 'elevated'
      ? {
          backgroundColor: themeConfig.backgroundColor,
          borderColor: themeConfig.borderColor,
          borderWidth: themeConfig.borderWidth,
          shadowColor: (themeConfig as any).shadowColor,
          shadowOffset: (themeConfig as any).shadowOffset,
          shadowOpacity: (themeConfig as any).shadowOpacity,
          shadowRadius: (themeConfig as any).shadowRadius,
          elevation: (themeConfig as any).elevation,
        }
      : {
          backgroundColor: themeConfig.backgroundColor as unknown as string,
          borderColor: themeConfig.borderColor as unknown as string,
          borderWidth: themeConfig.borderWidth,
        }),
  };

  const content = (
    <Animated.View style={[baseStyle, animated ? animatedStyle : {}, style]}>
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: '100%' }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// Variant presets for quick usage
export function SimpleCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <PremiumCard variant="default" theme="dark" padding="md" style={style}>
      {children}
    </PremiumCard>
  );
}

export function ElevatedCard({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  return (
    <PremiumCard
      variant="elevated"
      theme="dark"
      padding="lg"
      onPress={onPress}
      style={style}
    >
      {children}
    </PremiumCard>
  );
}

export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <PremiumCard variant="glass" theme="dark" padding="md" style={style}>
      {children}
    </PremiumCard>
  );
}
