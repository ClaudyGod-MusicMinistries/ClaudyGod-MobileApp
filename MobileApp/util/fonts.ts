// util/fonts.ts
import { 
  WorkSans_100Thin,
  WorkSans_200ExtraLight,
  WorkSans_300Light,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
  WorkSans_800ExtraBold,
  WorkSans_900Black,
} from '@expo-google-fonts/work-sans';
import {
  Roboto_100Thin,
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';
import {
  Poppins_100Thin,
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import * as Font from 'expo-font';

export const fontConfig = {
  hero: {
    fontFamily: 'Poppins_900Black',
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '900' as const,
  },
  display: {
    fontFamily: 'Poppins_900Black', // Using Poppins for maximum impact
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '900' as const,
  },
  heading: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800' as const,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500' as const,
  },
  body: {
    fontFamily: 'WorkSans_400Regular', // Keeping Work Sans for body text
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
  },
  caption: {
    fontFamily: 'WorkSans_300Light',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300' as const,
  },
};

export const loadFonts = async () => {
  await Font.loadAsync({
    // Work Sans
    WorkSans_100Thin,
    WorkSans_200ExtraLight,
    WorkSans_300Light,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
    WorkSans_800ExtraBold,
    WorkSans_900Black,
    
    // Roboto
    Roboto_100Thin,
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
    
    // Poppins
    Poppins_100Thin,
    Poppins_200ExtraLight,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });
};

// Optional: Font weight mapping for dynamic usage
export const fontWeights = {
  thin: 'Poppins_100Thin',
  extraLight: 'Poppins_200ExtraLight',
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
  black: 'Poppins_900Black',
};
