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
  WorkSans_100Thin_Italic,
  WorkSans_200ExtraLight_Italic,
  WorkSans_300Light_Italic,
  WorkSans_400Regular_Italic,
  WorkSans_500Medium_Italic,
  WorkSans_600SemiBold_Italic,
  WorkSans_700Bold_Italic,
  WorkSans_800ExtraBold_Italic,
  WorkSans_900Black_Italic,
} from '@expo-google-fonts/work-sans';

import { 
  Briscologue_400Regular,
} from '@expo-google-fonts/briscologue';

// Define your font configuration
export const fontConfig = {
  display: {
    fontFamily: 'Briscologue_400Regular',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
  },
  heading: {
    fontFamily: 'WorkSans_700Bold',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  title: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: 'WorkSans_300Light',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300' as const,
  },
};

// Font loading function
export const loadFonts = async () => {
  await Font.loadAsync({
    Briscologue_400Regular,
    WorkSans_100Thin,
    WorkSans_200ExtraLight,
    WorkSans_300Light,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
    WorkSans_800ExtraBold,
    WorkSans_900Black,
    WorkSans_100Thin_Italic,
    WorkSans_200ExtraLight_Italic,
    WorkSans_300Light_Italic,
    WorkSans_400Regular_Italic,
    WorkSans_500Medium_Italic,
    WorkSans_600SemiBold_Italic,
    WorkSans_700Bold_Italic,
    WorkSans_800ExtraBold_Italic,
    WorkSans_900Black_Italic,
  });
};

// Font weight mapping for dynamic usage
export const fontWeights = {
  thin: 'WorkSans_100Thin',
  extraLight: 'WorkSans_200ExtraLight',
  light: 'WorkSans_300Light',
  regular: 'WorkSans_400Regular',
  medium: 'WorkSans_500Medium',
  semiBold: 'WorkSans_600SemiBold',
  bold: 'WorkSans_700Bold',
  extraBold: 'WorkSans_800ExtraBold',
  black: 'WorkSans_900Black',
};