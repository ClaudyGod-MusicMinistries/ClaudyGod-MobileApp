import React, { ReactNode, useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { TVTouchable } from './TVTouchable';

// ─── Static styles (no theme) ─────────────────────────────────────────────────

const ss = StyleSheet.create({
  iconWrap:   { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  contentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

// ─── Theme styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  btnBase: {
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Size variants
  btnSm:  { height: 36, paddingHorizontal: 14 },
  btnMd:  { height: 44, paddingHorizontal: 18 },
  btnLg:  { height: 50, paddingHorizontal: 22 },
  // Color variants
  btnPrimary:   { backgroundColor: theme.colors.primary },
  btnSecondary: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  btnOutline:   { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary },
  btnGhost:     { backgroundColor: 'transparent' },
  // Pill-shaped gradient CTA — used for the app's premium/hero calls to action
  // rather than the flatter default `primary`, which stays as the workhorse
  // button everywhere else so this doesn't ripple into every screen unasked.
  btnGradient: {
    borderRadius: 999,
  },
  // Shadow lives on a separate outer wrapper (see render below) — combined
  // with the button's own overflow:hidden (needed to clip the gradient fill
  // into a pill) it would silently disappear on iOS.
  btnGradientShadowWrap: {
    borderRadius: 999,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.34,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  // States
  btnDisabled:  { opacity: 0.5 },
  btnStretch:   { alignSelf: 'stretch' },
  btnFlex:      { alignSelf: 'flex-start' },
  // Text
  btnTextBase: {
    textAlign: 'center', flexShrink: 1,
    letterSpacing: 0.2, fontWeight: '600',
  },
  btnTextSm:  { fontSize: 12, lineHeight: 16.8 },
  btnTextMd:  { fontSize: 13, lineHeight: 18.2 },
  btnTextLg:  { fontSize: 14, lineHeight: 19.6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
}));

// ─── AppButton ────────────────────────────────────────────────────────────────

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
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
  loadingVariant: _loadingVariant = 'spinner',
  textColor,
  textStyle,
  style,
  accessibilityLabel,
  testID,
  disabled,
  ...props
}: AppButtonProps) {
  const styles   = useStyles();
  const theme    = useAppTheme();

  const isPrimary   = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline   = variant === 'outline';
  const isGhost     = variant === 'ghost';
  const isGradient  = variant === 'gradient';
  const isDisabled  = loading || disabled;
  const hasTitle    = title && title.trim().length > 0;

  const handlePressIn = useCallback(() => {
    void Haptics.impactAsync(
      isPrimary || isGradient ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
  }, [isPrimary, isGradient]);

  const resolvedTextColor =
    textColor ??
    (isPrimary || isGradient
      ? theme.colors.onPrimary
      : isOutline
        ? theme.colors.primary
        : isGhost
          ? theme.colors.textSecondary
          : theme.colors.text);

  const textSizeStyle = size === 'sm' ? styles.btnTextSm : size === 'lg' ? styles.btnTextLg : styles.btnTextMd;

  const content = (() => {
    if (loading) {
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={resolvedTextColor} />
          <CustomText variant="label" numberOfLines={1} style={[styles.btnTextBase, textSizeStyle, { color: resolvedTextColor }]}>
            {loadingLabel || title}
          </CustomText>
        </View>
      );
    }

    const resolvedLeftIcon = leftIcon ?? icon;

    return (
      <View style={[ss.contentRow, { gap: hasTitle && (resolvedLeftIcon || rightIcon) ? 7 : 0 }]}>
        {resolvedLeftIcon ? <View style={ss.iconWrap}>{resolvedLeftIcon}</View> : null}
        {hasTitle ? (
          <CustomText
            variant="label"
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.btnTextBase, textSizeStyle, { color: resolvedTextColor }, textStyle]}
          >
            {title}
          </CustomText>
        ) : null}
        {rightIcon ? <View style={ss.iconWrap}>{rightIcon}</View> : null}
      </View>
    );
  })();

  const sizeStyle     = size === 'sm' ? styles.btnSm : size === 'lg' ? styles.btnLg : styles.btnMd;
  const variantStyle  = isGradient  ? styles.btnGradient
                      : isPrimary   ? styles.btnPrimary
                      : isSecondary ? styles.btnSecondary
                      : isOutline   ? styles.btnOutline
                      :               styles.btnGhost;

  const button = (
    <TVTouchable
      {...props}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      disabled={isDisabled}
      activeOpacity={0.7}
      onPressIn={(e: any) => {
        if (!isDisabled) {
          handlePressIn();
          (props as any).onPressIn?.(e);
        }
      }}
      style={[
        styles.btnBase,
        sizeStyle,
        variantStyle,
        isDisabled ? styles.btnDisabled : null,
        !isGradient ? (fullWidth ? styles.btnStretch : styles.btnFlex) : null,
        style,
      ]}
      showFocusBorder={false}
    >
      {isGradient ? (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {content}
    </TVTouchable>
  );

  if (!isGradient) {
    return button;
  }

  return (
    <View style={[styles.btnGradientShadowWrap, fullWidth ? styles.btnStretch : styles.btnFlex]}>
      {button}
    </View>
  );
}
