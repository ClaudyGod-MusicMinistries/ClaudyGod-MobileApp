// components/ui/AppButton.tsx
import React, { ReactNode } from 'react';
import { ActivityIndicator, TextStyle, TouchableOpacityProps, View } from 'react-native';
import { BrandLoader } from '../branding/BrandLoader';
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
  loadingLabel?: string;
  loadingVariant?: 'spinner' | 'brand';
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
  loadingLabel,
  loadingVariant = 'spinner',
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
    (isPrimary
      ? theme.colors.text.inverse
      : isSecondary
        ? theme.colors.text.primary
        : theme.colors.text.primary);

  const sizeStyle =
    size === 'sm'
      ? { minHeight: 36, paddingHorizontal: 14, paddingVertical: 8, fontSize: 12 }
      : size === 'lg'
      ? { minHeight: 52, paddingHorizontal: 24, paddingVertical: 14, fontSize: 14 }
      : { minHeight: 44, paddingHorizontal: 18, paddingVertical: 10, fontSize: 13 };

  const shadowStyle = isPrimary ? {
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  } : {};

  return (
    <TVTouchable
      {...props}
      disabled={loading || props.disabled}
      activeOpacity={0.85}
      style={[
        {
          ...sizeStyle,
          ...shadowStyle,
          borderRadius: theme.radius.lg,
          backgroundColor: isPrimary
            ? theme.colors.primary
            : isSecondary
              ? theme.colors.surface
              : isGhost
                ? 'transparent'
                : isOutline
                  ? 'transparent'
                  : theme.colors.surface,
          borderWidth: isOutline || isSecondary ? 1 : 0,
          borderColor: isOutline
            ? theme.colors.border
            : isSecondary
              ? theme.colors.border
              : 'transparent',
          opacity: props.disabled ? 0.5 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          gap: 8,
        },
        style,
      ]}
    >
      {loading ? (
        loadingVariant === 'brand' ? (
          <BrandLoader label={loadingLabel ?? title} size="sm" textColor={resolvedTextColor} />
        ) : (
          <ActivityIndicator
            size="small"
            color={resolvedTextColor}
          />
        )
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: '100%', gap: 8 }}>
          {leftIcon ? (
            <View style={{ width: 18, alignItems: 'center', justifyContent: 'center' }}>
              {leftIcon}
            </View>
          ) : null}
          <CustomText
            variant="label"
            style={{
              color: resolvedTextColor,
              textAlign: 'center',
              flexShrink: 1,
              fontFamily: 'SpaceGrotesk_600SemiBold',
              fontSize: sizeStyle.fontSize,
              lineHeight: (sizeStyle.fontSize as number) * 1.4,
              letterSpacing: 0.3,
              fontWeight: '600',
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
