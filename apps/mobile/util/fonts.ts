import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
  subheading: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  body: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  meta: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_400Regular',
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
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
};

// Web only. Expo's static-export HTML shell (app/+html.tsx) is NOT used by the
// single-page export the production Docker image builds, so declaring the
// @font-face rules there silently did nothing — every PlusJakartaSans_* family
// resolved to nothing and the whole web app rendered in the browser's default
// serif. Injecting the rules at runtime works in either export mode, and using
// the bundled TTFs (rather than a Google CDN) keeps them same-origin and cached
// with the app, with no third-party request per visitor.
const WEB_FONT_STYLE_ID = 'claudygod-web-fonts';

export function injectWebFonts(): void {
  if (typeof document === 'undefined' || document.getElementById(WEB_FONT_STYLE_ID)) return;

  const face = (family: string, weight: number, moduleId: number) =>
    `@font-face{font-family:'${family}';src:url('${Asset.fromModule(moduleId).uri}') format('truetype');` +
    `font-weight:${weight};font-style:normal;font-display:swap;}`;

  const style = document.createElement('style');
  style.id = WEB_FONT_STYLE_ID;
  style.textContent = [
    face('PlusJakartaSans_400Regular', 400, PlusJakartaSans_400Regular),
    face('PlusJakartaSans_600SemiBold', 600, PlusJakartaSans_600SemiBold),
    face('PlusJakartaSans_700Bold', 700, PlusJakartaSans_700Bold),
  ].join('\n');
  document.head.appendChild(style);
}

export const fontWeights = {
  light: 'PlusJakartaSans_400Regular',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_400Regular',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_700Bold',
};
