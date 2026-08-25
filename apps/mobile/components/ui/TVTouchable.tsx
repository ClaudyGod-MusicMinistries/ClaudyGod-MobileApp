import React, { useState } from 'react';
import { Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../util/colorScheme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TVTouchableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  focusScale?: number;
  focusStyle?: StyleProp<ViewStyle>;
  showFocusBorder?: boolean;
  disableTVFocusStyle?: boolean;
  disableHoverStyle?: boolean;
  activeOpacity?: number;
  /** Scale applied on press-in, eased back out on release. Defaults to the theme's standard press feedback. */
  pressScale?: number;
  /** Fires a light selection haptic on press-in. Off by default — several call sites (e.g. AppButton, TabBar) already fire their own tuned haptic and would double-buzz. */
  haptics?: boolean;
}

export function TVTouchable({
  style,
  focusScale,
  focusStyle,
  showFocusBorder = true,
  disableTVFocusStyle = false,
  disableHoverStyle = false,
  onFocus,
  onBlur,
  onPressIn,
  onPressOut,
  focusable,
  hitSlop,
  activeOpacity = 0.88,
  pressScale,
  haptics = false,
  children,
  ...props
}: TVTouchableProps) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const isTV = Platform.isTV;
  const isWeb = Platform.OS === 'web';
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const resolvedPressScale = pressScale ?? theme.interaction.pressScale;

  // Driven on the UI thread so the feedback stays smooth even while the JS
  // thread is busy (navigation, list scroll) — a state-driven style swap
  // snaps instantly instead of easing, which reads as cheap on anything
  // larger than a small icon button.
  const pressProgress = useSharedValue(0);

  const pressedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressProgress.value * (1 - resolvedPressScale) }],
    opacity: 1 - pressProgress.value * (1 - activeOpacity),
  }));

  const tvFocusStyle: ViewStyle | null =
    isTV && isFocused && !disableTVFocusStyle
      ? {
          transform: [{ scale: focusScale ?? theme.tv.focusScale }],
          ...(showFocusBorder
            ? {
                borderColor: theme.colors.primary,
                borderWidth: 1.5,
              }
            : null),
          ...theme.tv.focusShadow,
        }
      : null;

  const hoverStyle: ViewStyle | null =
    isWeb && isHovered && !disableHoverStyle && !props.disabled
      ? {
          transform: [{ translateY: -1 }],
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }
      : null;

  const webCursorStyle = isWeb
    ? ({
        cursor: props.disabled ? 'default' : 'pointer',
        transitionDuration: '160ms',
        transitionProperty: 'transform, opacity, box-shadow, background-color, border-color',
        transitionTimingFunction: 'ease',
      } as ViewStyle)
    : null;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...props}
      focusable={focusable ?? true}
      hitSlop={hitSlop ?? (isTV ? theme.tv.hitSlop : 8)}
      onHoverIn={(event) => {
        setIsHovered(true);
        props.onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setIsHovered(false);
        props.onHoverOut?.(event);
      }}
      onPressIn={(event) => {
        if (!props.disabled) {
          pressProgress.value = withTiming(1, { duration: reduceMotion ? 0 : theme.timing.instant, easing: Easing.out(Easing.cubic) });
          if (haptics) void Haptics.selectionAsync();
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressProgress.value = withTiming(0, { duration: reduceMotion ? 0 : theme.timing.fast, easing: Easing.out(Easing.cubic) });
        onPressOut?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      style={[style, webCursorStyle, hoverStyle, pressedAnimatedStyle, tvFocusStyle, isTV && isFocused ? focusStyle : null]}
    >
      {children}
    </AnimatedPressable>
  );
}
