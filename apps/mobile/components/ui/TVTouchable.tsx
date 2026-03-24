import React, { useState } from 'react';
import { Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';

interface TVTouchableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  focusScale?: number;
  focusStyle?: StyleProp<ViewStyle>;
  showFocusBorder?: boolean;
  disableTVFocusStyle?: boolean;
  disableHoverStyle?: boolean;
  activeOpacity?: number;
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
  focusable,
  hitSlop,
  activeOpacity = 0.88,
  children,
  ...props
}: TVTouchableProps) {
  const theme = useAppTheme();
  const isTV = Platform.isTV;
  const isWeb = Platform.OS === 'web';
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

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
          opacity: 0.98,
          transform: [{ translateY: -1 }],
          shadowColor: '#000000',
          shadowOpacity: 0.18,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
        }
      : null;

  const pressedStyle: ViewStyle | null =
    isPressed && !props.disabled ? { opacity: activeOpacity, transform: [{ scale: 0.985 }] } : null;

  const webCursorStyle = isWeb
    ? ({
        cursor: props.disabled ? 'default' : 'pointer',
        transitionDuration: '160ms',
        transitionProperty: 'transform, opacity, box-shadow, background-color, border-color',
        transitionTimingFunction: 'ease',
      } as ViewStyle)
    : null;

  return (
    <Pressable
      {...props}
      focusable={focusable ?? true}
      hitSlop={hitSlop ?? (isTV ? theme.tv.hitSlop : undefined)}
      onHoverIn={(event) => {
        setIsHovered(true);
        props.onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setIsHovered(false);
        props.onHoverOut?.(event);
      }}
      onPressIn={(event) => {
        setIsPressed(true);
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setIsPressed(false);
        props.onPressOut?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      style={[style, webCursorStyle, hoverStyle, pressedStyle, tvFocusStyle, isTV && isFocused ? focusStyle : null]}
    >
      {children}
    </Pressable>
  );
}
