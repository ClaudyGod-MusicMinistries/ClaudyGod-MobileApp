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
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  display: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  heading: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600' as const,
  },
  title: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400' as const,
  },
};

export const loadFonts = async () => {
  await Font.loadAsync({
    // Keep Clash keys for compatibility, but map to readable production-safe families.
    ClashDisplay_600SemiBold: SpaceGrotesk_600SemiBold,
    ClashDisplay_700Bold: SpaceGrotesk_700Bold,
    ClashDisplay_800ExtraBold: SpaceGrotesk_700Bold,

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
  bold: 'SpaceGrotesk_700Bold',
};
