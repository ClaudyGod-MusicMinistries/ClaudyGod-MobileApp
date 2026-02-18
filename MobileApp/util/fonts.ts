// util/fonts.ts
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  Roboto_400Regular,
  Roboto_500Medium,
} from '@expo-google-fonts/roboto';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
  },
  display: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '600' as const,
  },
  heading: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600' as const,
  },
  title: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '500' as const,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
  },
  caption: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
};

export const loadFonts = async () => {
  await Font.loadAsync({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Roboto_400Regular,
    Roboto_500Medium,
  });
};

export const fontWeights = {
  light: 'Inter_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};
