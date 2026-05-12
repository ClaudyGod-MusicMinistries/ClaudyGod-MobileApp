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
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700' as const,
    letterSpacing: -0.58,
  },
  display: {
    fontFamily: 'Sora_700Bold',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700' as const,
    letterSpacing: -0.42,
  },
  heading: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600' as const,
    letterSpacing: -0.22,
  },
  title: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600' as const,
    letterSpacing: -0.08,
  },
  subtitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  body: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11.5,
    lineHeight: 15.5,
    fontWeight: '600' as const,
    letterSpacing: 0.08,
  },
  caption: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 10.5,
    lineHeight: 14.5,
    fontWeight: '500' as const,
    letterSpacing: 0.06,
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
