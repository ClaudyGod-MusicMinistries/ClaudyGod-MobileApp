// components/ui/AppButton.tsx
import React, { ReactNode } from 'react';
import { ActivityIndicator, TextStyle, TouchableOpacityProps, View } from 'react-native';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

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
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const resolvedTextColor =
    textColor ??
    (isPrimary || isSecondary ? theme.colors.text.inverse : theme.colors.primary);
  const useShadow = isPrimary || isSecondary;

  const sizeStyle =
    size === 'sm'
      ? { minHeight: 36, paddingHorizontal: theme.spacing.md, paddingVertical: 7 }
      : size === 'lg'
      ? { minHeight: 50, paddingHorizontal: theme.spacing.lg, paddingVertical: 12 }
      : { minHeight: 42, paddingHorizontal: theme.spacing.lg, paddingVertical: 9 };

  return (
    <TVTouchable
      {...props}
      disabled={loading || props.disabled}
      activeOpacity={0.9}
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
          gap: 8,
          ...(useShadow ? theme.shadows.soft : null),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={resolvedTextColor}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: '100%', gap: 8 }}>
          {leftIcon ? (
            <View style={{ width: 18, alignItems: 'center', justifyContent: 'center' }}>
              {leftIcon}
            </View>
          ) : null}
          <CustomText
            variant={size === 'sm' ? 'label' : 'body'}
            style={{
              color: resolvedTextColor,
              fontWeight: '600',
              textAlign: 'center',
              flexShrink: 1,
              ...(textStyle || {}),
            }}
            numberOfLines={1}
          >
            {title}
          </CustomText>
          {rightIcon ? (
            <View style={{ width: 18, alignItems: 'center', justifyContent: 'center' }}>
              {rightIcon}
            </View>
          ) : null}
        </View>
      )}
    </TVTouchable>
  );
}
