/* eslint-disable react-hooks/rules-of-hooks */
// context/ResponsiveContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import useResponsive from './useResponsive';

const ResponsiveContext = createContext(useResponsive());

export const useResponsiveContext = () => useContext(ResponsiveContext);

interface ResponsiveProviderProps {
  children: ReactNode;
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const responsive = useResponsive();

  return (
    <ResponsiveContext.Provider value={responsive}>
      {children}
    </ResponsiveContext.Provider>
  );
};