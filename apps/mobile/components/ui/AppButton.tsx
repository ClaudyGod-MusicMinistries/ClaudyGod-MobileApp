import React, { ReactNode, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
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
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
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
  accessibilityLabel,
  testID,
  disabled,
  ...props
}: AppButtonProps) {
  const theme = useAppTheme();
  const pressedRef = useRef(false);

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDisabled = loading || disabled;
  const hasTitle = title && title.trim().length > 0;

  const handlePressIn = useCallback(() => {
    pressedRef.current = true;
    void Haptics.impactAsync(
      isPrimary ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
  }, [isPrimary]);

  const handlePressOut = useCallback(() => {
    pressedRef.current = false;
  }, []);

  const heights = { sm: 36, md: 44, lg: 50 };
  const fontSizes = { sm: 12, md: 13, lg: 14 };
  const paddingH = { sm: 14, md: 18, lg: 22 };

  const resolvedTextColor =
    textColor ??
    (isPrimary
      ? '#FFFFFF'
      : isOutline
        ? theme.colors.primary
        : isGhost
          ? theme.colors.textSecondary
          : theme.colors.text);

  const content = (() => {
    if (loading) {
      return loadingVariant === 'brand' ? (
        <BrandLoader label={loadingLabel || title} size="sm" textColor={resolvedTextColor} />
      ) : (
        <ActivityIndicator size="small" color={resolvedTextColor} />
      );
    }

    const resolvedLeftIcon = leftIcon ?? icon;

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: hasTitle && (resolvedLeftIcon || rightIcon) ? 7 : 0,
        }}
      >
        {resolvedLeftIcon ? (
          <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
            {resolvedLeftIcon}
          </View>
        ) : null}

        {hasTitle ? (
          <CustomText
            variant="label"
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              color: resolvedTextColor,
              textAlign: 'center',
              flexShrink: 1,
              fontSize: fontSizes[size],
              lineHeight: fontSizes[size] * 1.4,
              letterSpacing: 0.2,
              fontWeight: '600',
              ...(textStyle || {}),
            }}
          >
            {title}
          </CustomText>
        ) : null}

        {rightIcon ? (
          <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
            {rightIcon}
          </View>
        ) : null}
      </View>
    );
  })();

  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: accessibilityLabel || title,
    accessibilityState: {
      disabled: isDisabled,
      busy: loading,
    },
    testID,
  };

  return (
    <TVTouchable
      {...props}
      {...accessibilityProps}
      disabled={isDisabled}
      activeOpacity={0.7}
      onPressIn={(e: any) => {
        if (!isDisabled) {
          handlePressIn();
          (props as any).onPressIn?.(e);
        }
      }}
      onPressOut={(e: any) => {
        if (!isDisabled) {
          handlePressOut();
          (props as any).onPressOut?.(e);
        }
      }}
      style={[
        {
          height: heights[size],
          paddingHorizontal: paddingH[size],
          borderRadius: 12,
          backgroundColor: isPrimary
            ? theme.colors.primary
            : isSecondary
              ? theme.colors.surface
              : 'transparent',
          borderWidth: isOutline || isSecondary ? 1 : 0,
          borderColor: isOutline
            ? theme.colors.primary
            : isSecondary
              ? theme.colors.border
              : 'transparent',
          opacity: isDisabled ? 0.5 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          overflow: 'hidden',
        },
        style as any,
      ]}
      showFocusBorder={false}
    >
      {content}
    </TVTouchable>
  );
}
