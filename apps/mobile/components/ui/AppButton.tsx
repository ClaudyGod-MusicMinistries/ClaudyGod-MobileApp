// components/ui/AppButton.tsx
import React, { ReactNode } from 'react';
import { ActivityIndicator, TextStyle, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLoader } from '../branding/BrandLoader';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
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
  icon,
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
  const resolvedLeftIcon = leftIcon ?? icon;
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const sizeStyle =
    size === 'sm'
      ? { minHeight: 38, paddingHorizontal: 15, paddingVertical: 8, fontSize: 12 }
      : size === 'lg'
        ? { minHeight: 56, paddingHorizontal: 24, paddingVertical: 15, fontSize: 14 }
        : { minHeight: 46, paddingHorizontal: 18, paddingVertical: 11, fontSize: 13 };

  const resolvedTextColor =
    textColor ??
    (isPrimary
      ? theme.colors.textInverse
      : isGhost || isOutline || isSecondary
        ? theme.colors.text
        : theme.colors.text);

  const content = loading ? (
    loadingVariant === 'brand' ? (
      <BrandLoader label={loadingLabel ?? title} size="sm" textColor={resolvedTextColor} />
    ) : (
      <ActivityIndicator size="small" color={resolvedTextColor} />
    )
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: '100%', gap: 8 }}>
      {resolvedLeftIcon ? (
        <View style={{ width: 18, alignItems: 'center', justifyContent: 'center' }}>{resolvedLeftIcon}</View>
      ) : null}
      <CustomText
        variant="label"
        style={{
          color: resolvedTextColor,
          textAlign: 'center',
          flexShrink: 1,
          fontSize: sizeStyle.fontSize,
          lineHeight: (sizeStyle.fontSize as number) * 1.35,
          letterSpacing: 0.18,
          ...(textStyle || {}),
        }}
        numberOfLines={1}
      >
        {title}
      </CustomText>
      {rightIcon ? <View style={{ width: 18, alignItems: 'center', justifyContent: 'center' }}>{rightIcon}</View> : null}
    </View>
  );

  return (
    <TVTouchable
      {...props}
      disabled={loading || props.disabled}
      activeOpacity={0.82}
      style={[
        {
          ...sizeStyle,
          borderRadius: theme.radius.pill,
          backgroundColor: isPrimary
            ? theme.colors.primary
            : isSecondary
              ? theme.scheme === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(18,10,32,0.06)'
              : isGhost
                ? 'transparent'
                : 'transparent',
          borderWidth: isOutline || isSecondary ? 1 : 0,
          borderColor: isOutline
            ? theme.colors.borderStrong ?? theme.colors.border
            : isSecondary
              ? theme.colors.border
              : 'transparent',
          opacity: props.disabled ? 0.45 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          gap: 8,
          overflow: 'hidden',
          ...(isPrimary ? theme.shadows.glow ?? theme.shadows.soft : {}),
        },
        style,
      ]}
      showFocusBorder={false}
    >
      {isPrimary ? (
        <LinearGradient
          pointerEvents="none"
          colors={theme.colors.gradient.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      {content}
    </TVTouchable>
  );
}
