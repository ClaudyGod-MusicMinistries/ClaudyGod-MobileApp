// context/FontContext.tsx
import React, { createContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { injectWebFonts, loadFonts } from '../util/fonts';

interface FontContextType {
  fontsLoaded: boolean;
}

export const FontContext = createContext<FontContextType>({
  fontsLoaded: false,
});

interface FontProviderProps {
  children: ReactNode;
}

export const FontProvider: React.FC<FontProviderProps> = ({ children }) => {
  // On web the @font-face rules are injected straight into <head> (font-display:
  // swap, so the UI never blocks on them) — Font.loadAsync on web triggers a
  // 6000ms internal timeout and font-loading warnings, so it isn't used there.
  const [fontsLoaded, setFontsLoaded] = useState(Platform.OS === 'web');

  // Layout effect so the rules are in the document before the first paint.
  useLayoutEffect(() => {
    if (Platform.OS === 'web') injectWebFonts();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function loadAppFonts() {
      try {
        await loadFonts();
      } catch {
        // Fall back to system fonts when custom font assets are delayed or unavailable.
      } finally {
        setFontsLoaded(true);
      }
    }

    void loadAppFonts();
  }, []);

  return (
    <FontContext.Provider value={{ fontsLoaded }}>
      {children}
    </FontContext.Provider>
  );
};
