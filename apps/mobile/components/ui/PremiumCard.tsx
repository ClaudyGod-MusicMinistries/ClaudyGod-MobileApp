import React, { useState } from 'react';
import { Animated, Pressable, ViewStyle } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

interface PremiumCardProps {
  variant?: 'default' | 'elevated' | 'glass';
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  animated?: boolean;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  cardBase:  { borderRadius: theme.radius.lg },
  fullWidth: { width: '100%' },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function PremiumCard({
  variant = 'default',
  children,
  onPress,
  style,
  animated = true,
  padding = 'md',
}: PremiumCardProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const [scaleValue]   = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(1));

  const paddingValue =
    padding === 'xs' ? theme.spacing.xs :
    padding === 'sm' ? theme.spacing.sm :
    padding === 'lg' ? theme.spacing.lg :
    padding === 'xl' ? theme.spacing.xl :
    theme.spacing.md;

  const backgroundColor =
    variant === 'elevated' ? theme.colors.elevated :
    variant === 'glass'    ? theme.colors.glass :
    theme.colors.surface;

  const handlePressIn = () => {
    if (!animated || !onPress) return;
    Animated.parallel([
      Animated.timing(scaleValue,   { toValue: theme.interaction.pressScale,   duration: theme.timing.fast, useNativeDriver: false }),
      Animated.timing(opacityValue, { toValue: theme.interaction.hoverOpacity, duration: theme.timing.fast, useNativeDriver: false }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!animated) return;
    Animated.parallel([
      Animated.timing(scaleValue,   { toValue: 1, duration: theme.timing.base, useNativeDriver: false }),
      Animated.timing(opacityValue, { toValue: 1, duration: theme.timing.base, useNativeDriver: false }),
    ]).start();
  };

  const content = (
    <Animated.View
      style={[
        styles.cardBase,
        { padding: paddingValue, backgroundColor },
        animated ? { transform: [{ scale: scaleValue }], opacity: opacityValue } : {},
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.fullWidth}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export function SimpleCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <PremiumCard variant="default" padding="md" style={style}>{children}</PremiumCard>;
}

export function ElevatedCard({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  return <PremiumCard variant="elevated" padding="lg" onPress={onPress} style={style}>{children}</PremiumCard>;
}

export function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <PremiumCard variant="glass" padding="md" style={style}>{children}</PremiumCard>;
}
