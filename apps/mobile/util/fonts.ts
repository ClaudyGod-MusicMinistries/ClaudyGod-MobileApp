import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Sora_400Regular, Sora_500Medium, Sora_600SemiBold } from '@expo-google-fonts/sora';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'ClashDisplay_700Bold',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  display: {
    fontFamily: 'ClashDisplay_700Bold',
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700' as const,
  },
  heading: {
    fontFamily: 'ClashDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  title: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400' as const,
  },
};

export type FontVariantKey = keyof typeof fontConfig;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getResponsiveFontStyle(variant: FontVariantKey, width: number, isTV = false) {
  const base = fontConfig[variant];

  // Keep text compact on small phones, slightly relaxed on tablets/TV for readability.
  const widthScale = isTV
    ? 1.16
    : width >= 1024
      ? 1.12
      : width >= 768
        ? 1.08
        : width <= 360
          ? 0.94
          : width <= 390
            ? 0.97
            : 1;

  const fontSize = clamp(Math.round(base.fontSize * widthScale), 10, 28);
  const lineHeight = clamp(Math.round(base.lineHeight * widthScale), fontSize + 2, 36);

  return {
    ...base,
    fontSize,
    lineHeight,
  };
}

export const loadFonts = async () => {
  await Font.loadAsync({
    // Keep existing "ClashDisplay" keys for compatibility, but remap to readable families.
    ClashDisplay_600SemiBold: SpaceGrotesk_600SemiBold,
    ClashDisplay_700Bold: SpaceGrotesk_700Bold,

    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,

    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
  });
};

export const fontWeights = {
  light: 'Sora_400Regular',
  regular: 'Sora_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semiBold: 'SpaceGrotesk_600SemiBold',
  bold: 'ClashDisplay_700Bold',
};
