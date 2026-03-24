// util/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { ColorScheme } from '../constants/color';
import { getTheme, AppTheme } from '../theme';

interface ThemeContextType {
  colorScheme: ColorScheme;
  themePreference: ColorScheme | 'system';
  toggleColorScheme: () => void;
  setColorScheme: (_scheme: ColorScheme) => void;
  setThemePreference: (_scheme: ColorScheme | 'system') => void;
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = 'claudygod.theme.preference';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const nativeColorScheme = useNativeColorScheme();
  const [themePreference, setThemePreference] = useState<ColorScheme | 'system'>('system');

  useEffect(() => {
    let active = true;

    const loadStoredTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!active || !stored) return;

        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemePreference(stored);
        }
      } catch {
        // Keep runtime theme selection functional when storage is unavailable.
      }
    };

    void loadStoredTheme();

    return () => {
      active = false;
    };
  }, []);

  const colorScheme: ColorScheme =
    themePreference === 'system'
      ? nativeColorScheme === 'light'
        ? 'light'
        : 'dark'
      : themePreference;

  const toggleColorScheme = () => {
    const next = colorScheme === 'light' ? 'dark' : 'light';
    setThemePreference(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setThemePreference(scheme);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, scheme).catch(() => undefined);
  };

  const applyThemePreference = (scheme: ColorScheme | 'system') => {
    setThemePreference(scheme);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, scheme).catch(() => undefined);
  };

  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);

  const value = {
    colorScheme,
    themePreference,
    toggleColorScheme,
    setColorScheme,
    setThemePreference: applyThemePreference,
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
