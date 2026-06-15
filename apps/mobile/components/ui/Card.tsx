import React, { ReactNode } from 'react';
import { View, Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'filled' | 'outlined';
  padding?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  padding = 14,
  borderRadius = 14,
  style,
  disabled = false,
}) => {
  const theme = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  };

  const variantStyles: Record<string, object> = {
    elevated: {
      backgroundColor: theme.colors.card,
    },
    filled: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  };

  const containerContent = (
    <View
      style={[
        { borderRadius, overflow: 'hidden', padding },
        variantStyles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
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
