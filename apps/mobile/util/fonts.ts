// util/fonts.ts
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
} from '@expo-google-fonts/sora';
import {
  Syne_500Medium,
  Syne_600SemiBold,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  display: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  heading: {
    fontFamily: 'Syne_500Medium',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
  title: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    lineHeight: 14,
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
    // Keep Clash keys for compatibility, but map to a more premium heading family.
    ClashDisplay_600SemiBold: Syne_600SemiBold,
    ClashDisplay_700Bold: Syne_700Bold,
    ClashDisplay_800ExtraBold: Syne_700Bold,

    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,

    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,

    Syne_500Medium,
    Syne_600SemiBold,
    Syne_700Bold,
  });
};

export const fontWeights = {
  light: 'Sora_400Regular',
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semiBold: 'Syne_600SemiBold',
  bold: 'Syne_700Bold',
};
