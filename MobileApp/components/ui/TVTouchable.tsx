import React, { useState } from 'react';
import { Platform, StyleProp, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';

interface TVTouchableProps extends TouchableOpacityProps {
  focusScale?: number;
  focusStyle?: StyleProp<ViewStyle>;
  showFocusBorder?: boolean;
  disableTVFocusStyle?: boolean;
}

export function TVTouchable({
  style,
  focusScale,
  focusStyle,
  showFocusBorder = true,
  disableTVFocusStyle = false,
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
  const [isFocused, setIsFocused] = useState(false);

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

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={activeOpacity}
      focusable={focusable ?? true}
      hitSlop={hitSlop ?? (isTV ? theme.tv.hitSlop : undefined)}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      style={[style, tvFocusStyle, isTV && isFocused ? focusStyle : null]}
    >
      {children}
    </TouchableOpacity>
  );
}
