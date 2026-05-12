import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from '@expo-google-fonts/manrope';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 21,
    lineHeight: 29,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  display: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 18.5,
    lineHeight: 25,
    fontWeight: '500' as const,
    letterSpacing: 0.06,
  },
  heading: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as const,
    letterSpacing: 0.04,
  },
  title: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  body: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11.5,
    lineHeight: 15.5,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 10.5,
    lineHeight: 14.5,
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

  const fontSize = clamp(Number((base.fontSize * widthScale).toFixed(1)), 10, isTV ? 36 : 28);
  const lineHeight = clamp(Math.round(base.lineHeight * widthScale), Math.ceil(fontSize + 3), isTV ? 44 : 36);

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
