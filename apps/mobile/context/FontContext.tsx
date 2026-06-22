// context/FontContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { loadFonts } from '../util/fonts';

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
  // On web, fonts are injected by +html.tsx via @font-face/font-display:swap — no JS loading needed.
  // Calling Font.loadAsync on web triggers a 6000ms internal timeout and font-loading warnings.
  const [fontsLoaded, setFontsLoaded] = useState(Platform.OS === 'web');

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
