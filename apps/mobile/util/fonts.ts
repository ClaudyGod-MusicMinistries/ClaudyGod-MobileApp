import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import { Sora_400Regular, Sora_500Medium, Sora_600SemiBold } from '@expo-google-fonts/sora';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: -0.45,
  },
  display: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.26,
  },
  heading: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  title: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  subtitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.08,
  },
};

export type FontVariantKey = keyof typeof fontConfig;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getResponsiveFontStyle(variant: FontVariantKey, width: number, isTV = false) {
  const base = fontConfig[variant];

  // Slightly tighten on compact phones and relax on larger viewports without making text oversized.
  const widthScale = isTV
    ? 1.12
    : width >= 1024
      ? 1.08
      : width >= 768
        ? 1.04
        : width <= 360
          ? 0.94
          : width <= 390
            ? 0.97
            : 1;

  const fontSize = clamp(Math.round(base.fontSize * widthScale), 10, 32);
  const lineHeight = clamp(Math.round(base.lineHeight * widthScale), fontSize + 3, 40);

  return {
    ...base,
    fontSize,
    lineHeight,
  };
}

export const loadFonts = async () => {
  await Font.loadAsync({
    // Preserve legacy keys while remapping them to calmer, more readable weights.
    ClashDisplay_600SemiBold: Sora_600SemiBold,
    ClashDisplay_700Bold: Sora_600SemiBold,

    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,

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
  bold: 'SpaceGrotesk_600SemiBold',
};
