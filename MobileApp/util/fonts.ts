import { Inter_900Black, Inter_700Bold, Inter_600SemiBold, Inter_400Regular, Inter_300Light } from '@expo-google-fonts/inter';

export const customFonts = {
  'Inter-Black': Inter_900Black,
  'Inter-Bold': Inter_700Bold,
  'Inter-SemiBold': Inter_600SemiBold,
  'Inter-Regular': Inter_400Regular,
  'Inter-Light': Inter_300Light,
};

export const fontConfig: Record<
  'display' | 'heading' | 'title' | 'body' | 'caption',
  { fontFamily: string; fontSize: number; lineHeight: number }
> = {
  display: {
    fontFamily: 'Inter-Black',
    fontSize: 36,
    lineHeight: 44,
  },
  heading: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'Inter-Light',
    fontSize: 14,
    lineHeight: 20,
  },
};
