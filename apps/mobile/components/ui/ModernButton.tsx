// components/ui/ModernButton.tsx
/**
 * Modern Button Component
 * Beautiful, versatile button with smooth animations
 */

import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Animated, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';

type GradientColors = readonly [string, string, ...string[]];

interface ModernButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  gradient?: GradientColors;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
  gradient,
}) => {
  const theme = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const sizeConfig = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 12 },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 14 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 16 },
  };

  const variantConfig: Record<
    NonNullable<ModernButtonProps['variant']>,
    { colors: GradientColors; textColor: string; borderColor: string }
  > = {
    primary: {
      colors: gradient ?? [theme.colors.primary, theme.colors.accent],
      textColor: theme.colors.textInverse,
      borderColor: 'transparent',
    },
    secondary: {
      colors: [theme.colors.secondary, theme.colors.accent],
      textColor: theme.colors.text,
      borderColor: 'transparent',
    },
    outline: {
      colors: [theme.colors.surface, theme.colors.surfaceAlt],
      textColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    ghost: {
      colors: ['transparent', 'transparent'],
      textColor: theme.colors.primary,
      borderColor: 'transparent',
    },
    danger: {
      colors: [theme.colors.danger, '#c21f1f'],
      textColor: theme.colors.textInverse,
      borderColor: 'transparent',
    },
  };

  const config = variantConfig[variant];
  const size_config = sizeConfig[size];

  const isGradient = variant !== 'ghost' && variant !== 'outline';
  const buttonStyleBase: ViewStyle = {
    borderRadius: 12,
    borderWidth: variant === 'outline' ? 1.5 : 0,
    borderColor: config.borderColor,
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth ? { width: '100%' as const } : {}),
  };

  const buttonContent = (
    <Animated.View
      style={[
        styles.container,
        {
          paddingVertical: size_config.paddingVertical,
          paddingHorizontal: size_config.paddingHorizontal,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {icon && <CustomText style={{ marginRight: 8 }}>{icon}</CustomText>}
      <CustomText
        style={[
          styles.label,
          {
            fontSize: size_config.fontSize,
            color: config.textColor,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </CustomText>
    </Animated.View>
  );

  if (isGradient) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[styles.button, buttonStyleBase, style]}
      >
        <LinearGradient
          colors={config.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {buttonContent}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        buttonStyleBase,
        { backgroundColor: variant === 'ghost' ? 'transparent' : theme.colors.surface },
        style,
      ]}
    >
      {buttonContent}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
