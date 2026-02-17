// util/fonts.ts
import {
  WorkSans_300Light,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from '@expo-google-fonts/work-sans';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'WorkSans_700Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
  },
  display: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '600' as const,
  },
  heading: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600' as const,
  },
  title: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
};

export const loadFonts = async () => {
  await Font.loadAsync({
    WorkSans_300Light,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });
};

// Optional: Font weight mapping for dynamic usage
export const fontWeights = {
  light: 'WorkSans_300Light',
  regular: 'WorkSans_400Regular',
  medium: 'WorkSans_500Medium',
  semiBold: 'WorkSans_600SemiBold',
  bold: 'WorkSans_700Bold',
};
