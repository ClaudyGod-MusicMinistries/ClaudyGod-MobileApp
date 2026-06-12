import React, { ReactNode, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  TextStyle,
  TouchableOpacityProps,
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Use useRef to persist Animated values (prevents recreation & memory leaks)
  const scaleValueRef = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const resolvedLeftIcon = leftIcon ?? icon;
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDisabled = loading || disabled;
  const hasTitle = title && title.trim().length > 0;

  // Memoized press handlers
  const handlePressIn = useCallback(() => {
    setIsPressed(true);
    void Haptics.impactAsync(
      isPrimary ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
    Animated.timing(scaleValueRef, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [isPrimary, scaleValueRef]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
    Animated.timing(scaleValueRef, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleValueRef]);

  // WCAG compliant sizing with 48px minimum touch targets
  const sizeStyle =
    size === 'sm'
      ? {
          minHeight: 36,
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
        }
      : size === 'lg'
        ? {
            minHeight: 52,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 14,
          }
        : {
            minHeight: 48,
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 13,
          };

  const resolvedTextColor =
    textColor ??
    (isPrimary
      ? theme.colors.textInverse || '#FFFFFF'
      : isGhost || isOutline || isSecondary
        ? theme.colors.text
        : theme.colors.text);

  // Render content with proper error handling
  const content = (() => {
    if (loading) {
      return loadingVariant === 'brand' ? (
        <BrandLoader label={loadingLabel || title} size="sm" textColor={resolvedTextColor} />
      ) : (
        <ActivityIndicator size="small" color={resolvedTextColor} />
      );
    }

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '100%',
          gap: hasTitle && (resolvedLeftIcon || rightIcon) ? 8 : 0,
        }}
      >
        {resolvedLeftIcon ? (
          <View
            style={{
              width: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {resolvedLeftIcon}
          </View>
        ) : null}

        {hasTitle ? (
          <CustomText
            variant="label"
            allowFontScaling={false}
            style={{
              color: resolvedTextColor,
              textAlign: 'center',
              flexShrink: 1,
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
        ) : null}

        {rightIcon ? (
          <View
            style={{
              width: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {rightIcon}
          </View>
        ) : null}
      </View>
    );
  })();

  const animatedStyle = {
    transform: [{ scale: scaleValueRef }],
  };

  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: accessibilityLabel || title,
    accessibilityState: {
      disabled: isDisabled,
      busy: loading,
    },
    testID: testID,
  };

  return (
    <Animated.View style={animatedStyle}>
      <TVTouchable
        {...props}
        {...accessibilityProps}
        disabled={isDisabled}
        activeOpacity={0.9}
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
            ...sizeStyle,
            minWidth: size === 'sm' ? 60 : size === 'lg' ? 80 : 70,
            borderRadius: theme.radius.pill,
            backgroundColor: isPrimary
              ? theme.colors.primary
              : isSecondary
                ? theme.scheme === 'dark'
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(124,58,237,0.12)'
                : 'transparent',
            borderWidth: (isPrimary || isOutline || isSecondary) ? 1 : 0,
            borderColor:
              isOutline
                ? theme.colors.borderStrong ?? theme.colors.border
                : isSecondary
                  ? theme.colors.borderStrong ?? theme.colors.border
                  : isPrimary
                    ? 'rgba(255,255,255,0.2)'
                    : 'transparent',
            opacity: isDisabled ? 0.5 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
            gap: 8,
            overflow: 'hidden',
            ...(isPrimary
              ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: isPressed ? 6 : 3 },
                  shadowOpacity: isPressed ? 0.3 : 0.15,
                  shadowRadius: isPressed ? 10 : 6,
                  elevation: isPressed ? 6 : 3,
                }
              : {}),
          },
          style as any,
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
    </Animated.View>
  );
}
