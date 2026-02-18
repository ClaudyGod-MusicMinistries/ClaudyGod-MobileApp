// util/fonts.ts
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Syne_600SemiBold,
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
} from '@expo-google-fonts/sora';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'ClashDisplay_800ExtraBold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800' as const,
  },
  display: {
    fontFamily: 'ClashDisplay_700Bold',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700' as const,
  },
  heading: {
    fontFamily: 'ClashDisplay_700Bold',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700' as const,
  },
  title: {
    fontFamily: 'ClashDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
  },
  caption: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500' as const,
  },
};

export const loadFonts = async () => {
  await Font.loadAsync({
    // "Clash Display" channel uses a sharp geometric fallback while we wire real Clash files.
    ClashDisplay_600SemiBold: Syne_600SemiBold,
    ClashDisplay_700Bold: Syne_700Bold,
    ClashDisplay_800ExtraBold: Syne_800ExtraBold,

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
  light: 'SpaceGrotesk_400Regular',
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semiBold: 'ClashDisplay_600SemiBold',
  bold: 'ClashDisplay_700Bold',
};
