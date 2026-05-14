import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from '@expo-google-fonts/manrope';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 19.5,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  display: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  heading: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13.8,
    lineHeight: 19,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  subheading: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12.2,
    lineHeight: 17.5,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  body: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11.1,
    lineHeight: 15,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  meta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10.6,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 10.2,
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

  const fontSize = clamp(Number((base.fontSize * widthScale).toFixed(1)), 9.8, isTV ? 32 : 24);
  const lineHeight = clamp(Math.round(base.lineHeight * widthScale), Math.ceil(fontSize + 3), isTV ? 40 : 30);

  return {
    ...base,
    fontSize,
    lineHeight,
  };
}

export const loadFonts = async () => {
  await Font.loadAsync({
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });
};

export const fontWeights = {
  light: 'Manrope_300Light',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_600SemiBold',
};
