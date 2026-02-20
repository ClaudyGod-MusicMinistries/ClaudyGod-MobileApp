// util/ThemeContext.tsx
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { ColorScheme } from '../constants/color';
import { getTheme, AppTheme } from '../theme';

interface ThemeContextType {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
  setColorScheme: (_scheme: ColorScheme) => void;
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Keep a stable dark-first look so screens never flash to light backgrounds on devices in light mode.
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');

  const toggleColorScheme = () => {
    setColorScheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);

  const value = {
    colorScheme,
    toggleColorScheme,
    setColorScheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
