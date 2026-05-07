import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'Sora_700Bold',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.9,
  },
  display: {
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.72,
  },
  heading: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: -0.36,
  },
  title: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600' as const,
    letterSpacing: -0.18,
  },
  subtitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: -0.05,
  },
  body: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.12,
  },
  caption: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.08,
  },
};

export type FontVariantKey = keyof typeof fontConfig;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getResponsiveFontStyle(variant: FontVariantKey, width: number, isTV = false) {
  const base = fontConfig[variant];

  const widthScale = isTV
    ? 1.18
    : width >= 1024
      ? 1.1
      : width >= 768
        ? 1.05
        : width <= 360
          ? 0.92
          : width <= 390
            ? 0.96
            : 1;

  const fontSize = clamp(Math.round(base.fontSize * widthScale), 10, isTV ? 42 : 34);
  const lineHeight = clamp(Math.round(base.lineHeight * widthScale), fontSize + 3, isTV ? 50 : 42);

  return {
    ...base,
    fontSize,
    lineHeight,
  };
}

export const loadFonts = async () => {
  await Font.loadAsync({
    ClashDisplay_600SemiBold: Sora_600SemiBold,
    ClashDisplay_700Bold: Sora_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });
};

export const fontWeights = {
  light: 'Sora_400Regular',
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semiBold: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
};
