// util/colorScheme.ts
import { useTheme } from '../context/ThemeProvider';
import { ColorScheme } from '../constants/color';

export function useColorScheme(): ColorScheme {
  const { colorScheme } = useTheme();
  return colorScheme;
}

export function useColorSchemeToggle() {
  const { toggleColorScheme } = useTheme();
  return toggleColorScheme;
}

export function useThemeContext() {
  return useTheme();
}