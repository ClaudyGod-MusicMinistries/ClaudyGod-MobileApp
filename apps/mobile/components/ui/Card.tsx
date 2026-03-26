// components/ui/Card.tsx
/**
 * Modern Card Component
 * Versatile card with gradient, shadow, and hover effects
 */

import React, { ReactNode } from 'react';
import { View, Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../util/colorScheme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'filled' | 'outlined' | 'gradient';
  padding?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  gradient?: [string, string];
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  padding = 16,
  borderRadius = 16,
  style,
  gradient,
  disabled = false,
}) => {
  const theme = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const baseStyle = {
    borderRadius,
    overflow: 'hidden' as const,
    padding,
  };

  const variantStyles = {
    elevated: {
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    filled: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    gradient: {
      backgroundColor: 'transparent',
    },
  };

  const containerContent = (
    <View style={[baseStyle, variantStyles[variant], style]}>
      {children}
    </View>
  );

  if (variant === 'gradient' && gradient) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[baseStyle, style]}
          >
            {children}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={({ pressed }) => ({
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {containerContent}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {containerContent}
    </Animated.View>
  );
};
