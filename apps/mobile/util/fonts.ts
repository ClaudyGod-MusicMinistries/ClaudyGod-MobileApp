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
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  display: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  heading: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '600' as const,
  },
  title: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  subtitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'Sora_400Regular',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
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
      ? 1.1
      : width >= 768
        ? 1.06
        : width <= 360
          ? 0.95
          : width <= 390
            ? 0.98
            : 1;

  const fontSize = clamp(Math.round(base.fontSize * widthScale), 12, 34);
  const lineHeight = clamp(Math.round(base.lineHeight * widthScale), fontSize + 4, 42);

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
  bold: 'Sora_600SemiBold',
};
