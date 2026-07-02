import React, { ReactNode } from 'react';
import { View, Animated, Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles } from '../../styles/makeStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'filled' | 'outlined';
  padding?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  containerBase:    { overflow: 'hidden' },
  variantElevated:  { backgroundColor: theme.colors.card },
  variantFilled:    { backgroundColor: theme.colors.surfaceAlt },
  variantOutlined:  { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  padding = 14,
  borderRadius = 14,
  style,
  disabled = false,
}) => {
  const styles    = useStyles();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: USE_NATIVE_DRIVER }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER }).start();
    }
  };

  const variantStyle =
    variant === 'filled'   ? styles.variantFilled :
    variant === 'outlined' ? styles.variantOutlined :
    styles.variantElevated;

  const containerContent = (
    <View style={[styles.containerBase, { borderRadius, padding }, variantStyle, style]}>
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

