import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  display: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  heading: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
  },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  subheading: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  body: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  meta: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
};

export type FontVariantKey = keyof typeof fontConfig;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getResponsiveFontStyle(variant: FontVariantKey, width: number, isTV = false) {
  const base = fontConfig[variant];

  const widthScale = isTV
    ? 1.12
    : width >= 1180
      ? 1.04
      : width >= 768
        ? 1.02
        : width <= 360
          ? 0.9
          : width <= 390
            ? 0.94
            : 1;

  const fontSize = clamp(Number((base.fontSize * widthScale).toFixed(1)), 9.8, isTV ? 32 : 22);
  const lineHeight = clamp(Math.round(base.lineHeight * widthScale), Math.ceil(fontSize + 3), isTV ? 40 : 30);

  return {
    ...base,
    fontSize,
    lineHeight,
  };
}

export const loadFonts = async () => {
  await Font.loadAsync({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
};

export const fontWeights = {
  light: 'Manrope_400Regular',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_400Regular',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_700Bold',
};
