import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Syne_600SemiBold, Syne_700Bold } from '@expo-google-fonts/syne';
import { Sora_400Regular, Sora_500Medium, Sora_600SemiBold } from '@expo-google-fonts/sora';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'ClashDisplay_700Bold',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700' as const,
  },
  display: {
    fontFamily: 'ClashDisplay_700Bold',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700' as const,
  },
  heading: {
    fontFamily: 'ClashDisplay_600SemiBold',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600' as const,
  },
  title: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'SpaceGrotesk_500Medium',
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

export const loadFonts = async () => {
  await Font.loadAsync({
    ClashDisplay_600SemiBold: Syne_600SemiBold,
    ClashDisplay_700Bold: Syne_700Bold,

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
