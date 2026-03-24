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
      ? { minHeight: 36, paddingHorizontal: 14, paddingVertical: 7 }
      : size === 'lg'
      ? { minHeight: 48, paddingHorizontal: 22, paddingVertical: 11 }
      : { minHeight: 42, paddingHorizontal: 18, paddingVertical: 9 };

  return (
    <TVTouchable
      {...props}
      disabled={loading || props.disabled}
      activeOpacity={0.9}
      style={[
        {
          ...sizeStyle,
          borderRadius: theme.radius.lg,
          backgroundColor: isPrimary
            ? theme.colors.primary
            : isSecondary
              ? theme.colors.surfaceAlt
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
          opacity: props.disabled ? 0.6 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          gap: 8,
          ...(isPrimary ? theme.shadows.soft : null),
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
              fontFamily: 'SpaceGrotesk_500Medium',
              fontSize: size === 'lg' ? 13 : 12,
              lineHeight: size === 'lg' ? 16 : 15,
              letterSpacing: 0.04,
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
