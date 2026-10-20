import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';

export type BrandWordmarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BrandWordmarkTone = 'default' | 'light' | 'dark' | 'primary';

export interface BrandWordmarkProps {
  /** Size preset: xs (13pt), sm (16pt), md (22pt), lg (28pt), xl (34pt). Default 'md'. */
  size?: BrandWordmarkSize;
  /** Color tone. 'default' follows theme; 'light' is always white (for dark media canvases). */
  tone?: BrandWordmarkTone;
  /** Whether to show the signature electric purple dot. Default true. */
  showDot?: boolean;
  /** Whether to display the tracked "MUSIC & MINISTRIES" subtitle. Default false. */
  showSubtitle?: boolean;
  /** Optional custom subtitle text. Defaults to 'MUSIC & MINISTRIES'. */
  subtitleText?: string;
  /** Letter casing style: 'brand' ("claudyGod."), 'title' ("ClaudyGod."), or 'upper' ("CLAUDYGOD."). Default 'brand'. */
  casing?: 'brand' | 'title' | 'upper';
  /** Alignment of wordmark and subtitle. Default 'left'. */
  align?: 'left' | 'center' | 'right';
  /** Optional container style override. */
  style?: StyleProp<ViewStyle>;
  /** Optional wordmark text style override. */
  textStyle?: StyleProp<TextStyle>;
  /** Optional subtitle text style override. */
  subtitleStyle?: StyleProp<TextStyle>;
}

const SIZE_CONFIG = {
  xs: { fontSize: 13, lineHeight: 17, dotSize: 13, subSize: 8, subSpacing: 1.8, subMargin: 2 },
  sm: { fontSize: 16, lineHeight: 21, dotSize: 16, subSize: 9, subSpacing: 2.2, subMargin: 3 },
  md: { fontSize: 22, lineHeight: 28, dotSize: 22, subSize: 10, subSpacing: 2.6, subMargin: 4 },
  lg: { fontSize: 28, lineHeight: 34, dotSize: 28, subSize: 11, subSpacing: 3.0, subMargin: 5 },
  xl: { fontSize: 34, lineHeight: 42, dotSize: 34, subSize: 12, subSpacing: 3.4, subMargin: 6 },
} as const;

export function BrandWordmark({
  size = 'md',
  tone = 'default',
  showDot = true,
  showSubtitle = false,
  subtitleText = 'MUSIC & MINISTRIES',
  casing = 'brand',
  align = 'left',
  style,
  textStyle,
  subtitleStyle,
}: BrandWordmarkProps) {
  const theme = useAppTheme();
  const cfg = SIZE_CONFIG[size];

  // Resolve base text color
  let textColor = theme.colors.text;
  if (tone === 'light') {
    textColor = '#FFFFFF';
  } else if (tone === 'dark') {
    textColor = '#16131C';
  } else if (tone === 'primary') {
    textColor = theme.colors.primary;
  }

  // Signature dot color (royal / electric purple)
  const dotColor = theme.colors.primary ?? '#8F3EF2';

  // Subtitle color
  const subColor = tone === 'light' ? 'rgba(255, 255, 255, 0.72)' : theme.colors.textSecondary;

  // Casing selection
  let wordmarkBase = 'claudyGod';
  if (casing === 'title') {
    wordmarkBase = 'ClaudyGod';
  } else if (casing === 'upper') {
    wordmarkBase = 'CLAUDYGOD';
  }

  const containerAlign =
    align === 'center' ? 'items-center' : align === 'right' ? 'items-end' : 'items-start';

  return (
    <View
      style={[
        styles.container,
        align === 'center' && styles.alignCenter,
        align === 'right' && styles.alignRight,
        style,
      ]}
      accessibilityRole="header"
      accessibilityLabel={`claudyGod${showDot ? '.' : ''}${showSubtitle ? ` ${subtitleText}` : ''}`}
    >
      <Text
        style={[
          styles.wordmark,
          {
            color: textColor,
            fontSize: cfg.fontSize,
            lineHeight: cfg.lineHeight,
            textAlign: align,
          },
          textStyle,
        ]}
      >
        {wordmarkBase}
        {showDot ? (
          <Text
            style={[
              styles.signatureDot,
              {
                color: dotColor,
                fontSize: cfg.dotSize,
              },
            ]}
          >
            .
          </Text>
        ) : null}
      </Text>

      {showSubtitle && subtitleText ? (
        <Text
          style={[
            styles.subtitle,
            {
              color: subColor,
              fontSize: cfg.subSize,
              letterSpacing: cfg.subSpacing,
              marginTop: cfg.subMargin,
              textAlign: align,
            },
            subtitleStyle,
          ]}
        >
          {subtitleText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  wordmark: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  signatureDot: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '800',
  },
  subtitle: {
    fontFamily: 'Montserrat_700Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
