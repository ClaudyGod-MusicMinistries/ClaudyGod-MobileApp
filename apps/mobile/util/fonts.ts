import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  display: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
  subheading: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  body: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  meta: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },
  caption: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 15,
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

  const fontSize = clamp(Number((base.fontSize * widthScale).toFixed(1)), 9.5, isTV ? 28 : 20);
  const lineHeight = clamp(Math.round(base.lineHeight * widthScale), Math.ceil(fontSize + 3), isTV ? 36 : 28);

  return {
    ...base,
    fontSize,
    lineHeight,
  };
}

export const loadFonts = async () => {
  await Font.loadAsync({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
};

const WEB_FONT_STYLE_ID = 'claudygod-web-fonts';

export function injectWebFonts(): void {
  if (typeof document === 'undefined' || document.getElementById(WEB_FONT_STYLE_ID)) return;

  const face = (family: string, weight: number, moduleId: number) =>
    `@font-face{font-family:'${family}';src:url('${Asset.fromModule(moduleId).uri}') format('truetype');` +
    `font-weight:${weight};font-style:normal;font-display:swap;}`;

  const style = document.createElement('style');
  style.id = WEB_FONT_STYLE_ID;
  style.textContent = [
    face('Poppins_400Regular', 400, Poppins_400Regular),
    face('Poppins_500Medium', 500, Poppins_500Medium),
    face('Poppins_600SemiBold', 600, Poppins_600SemiBold),
    face('Poppins_700Bold', 700, Poppins_700Bold),
    face('Montserrat_400Regular', 400, Montserrat_400Regular),
    face('Montserrat_500Medium', 500, Montserrat_500Medium),
    face('Montserrat_600SemiBold', 600, Montserrat_600SemiBold),
    face('Montserrat_700Bold', 700, Montserrat_700Bold),
    face('PlusJakartaSans_400Regular', 400, PlusJakartaSans_400Regular),
    face('PlusJakartaSans_600SemiBold', 600, PlusJakartaSans_600SemiBold),
    face('PlusJakartaSans_700Bold', 700, PlusJakartaSans_700Bold),
  ].join('\n');
  document.head.appendChild(style);
}

export const fontWeights = {
  light: 'Poppins_400Regular',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_700Bold',
  brandDisplay: 'Poppins_700Bold',
  brandLabel: 'Montserrat_700Bold',
};
