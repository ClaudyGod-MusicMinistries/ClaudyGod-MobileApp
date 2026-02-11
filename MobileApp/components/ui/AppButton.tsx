// components/ui/AppButton.tsx
import React, { ReactNode, useState } from 'react';
import { ActivityIndicator, Platform, TextStyle, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { tv as tvTokens } from '../../styles/designTokens';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  textColor?: string;
  textStyle?: TextStyle;
}

export function AppButton({
  title,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth,
  loading,
  textColor,
  textStyle,
  style,
  ...props
}: AppButtonProps) {
  const theme = useAppTheme();
  const isTV = Platform.isTV;
  const [focused, setFocused] = useState(false);
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const resolvedTextColor =
    textColor ??
    (isPrimary || isSecondary ? theme.colors.text.inverse : theme.colors.primary);

  const sizeStyle =
    size === 'sm'
      ? { minHeight: 36, paddingHorizontal: theme.spacing.md, paddingVertical: 8 }
      : size === 'lg'
      ? { minHeight: 52, paddingHorizontal: theme.spacing.lg, paddingVertical: 14 }
      : { minHeight: 44, paddingHorizontal: theme.spacing.lg, paddingVertical: 10 };

  return (
    <TouchableOpacity
      {...props}
      disabled={loading || props.disabled}
      focusable
      hitSlop={tvTokens.hitSlop}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      style={[
        {
          ...sizeStyle,
          borderRadius: theme.radius.pill,
          backgroundColor: isPrimary
            ? theme.colors.primary
            : isSecondary
            ? theme.colors.secondary
            : isOutline || isGhost
            ? 'transparent'
            : theme.colors.surface,
          borderWidth: isOutline ? 1 : 0,
          borderColor: isOutline ? theme.colors.primary : 'transparent',
          opacity: props.disabled ? 0.6 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        isTV && focused
          ? {
              transform: [{ scale: theme.tv.focusScale }],
              borderWidth: 1,
              borderColor: theme.colors.primary,
              ...theme.tv.focusShadow,
            }
          : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={resolvedTextColor}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {leftIcon ? <View style={{ marginRight: 8 }}>{leftIcon}</View> : null}
          <CustomText
            variant={size === 'sm' ? 'label' : 'body'}
            style={{
              color: resolvedTextColor,
              fontWeight: '600',
              textAlign: 'center',
              ...(textStyle || {}),
            }}
          >
            {title}
          </CustomText>
          {rightIcon ? <View style={{ marginLeft: 8 }}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}
