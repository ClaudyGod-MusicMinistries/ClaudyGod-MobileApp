import React, { ReactNode, useRef, useCallback, useEffect } from 'react';
import {
  Animated,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

function BubblePulse({ color, label }: { color: string; label?: string }) {
  const d0 = useRef(new Animated.Value(0)).current;
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 380, useNativeDriver: true }),
          Animated.delay(Math.max(0, 760 - delay)),
        ]),
      );
    const a0 = pulse(d0, 0);
    const a1 = pulse(d1, 180);
    const a2 = pulse(d2, 360);
    a0.start(); a1.start(); a2.start();
    return () => { a0.stop(); a1.stop(); a2.stop(); };
  }, [d0, d1, d2]);

  const dot = (d: Animated.Value) => ({
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: color,
    transform: [{ scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.25] }) }],
    opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
        <Animated.View style={dot(d0)} />
        <Animated.View style={dot(d1)} />
        <Animated.View style={dot(d2)} />
      </View>
      {label ? (
        <CustomText variant="label" numberOfLines={1} style={{ color, fontSize: 13, fontWeight: '600' }}>
          {label}
        </CustomText>
      ) : null}
    </View>
  );
}

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
      return <BubblePulse color={resolvedTextColor} label={loadingLabel || title} />;
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
