// context/FontContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
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
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadAppFonts() {
      try {
        await loadFonts();
      } catch (error) {
        console.warn('font bootstrap failed, falling back to system fonts:', error);
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
