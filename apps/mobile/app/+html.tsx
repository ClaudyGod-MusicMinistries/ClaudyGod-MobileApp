import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

/**
 * HTML shell for the Expo web build.
 *
 * Fonts are loaded from Google Fonts CDN (gstatic.com) — stable URLs that
 * don't go stale after package upgrades. The font-family names match what
 * Expo's useFonts / CustomText expects: PlusJakartaSans_400Regular etc.
 */

const FONT_FACE_CSS = `
@font-face {
  font-family: 'PlusJakartaSans_400Regular';
  src: url('https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU7NSg.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'PlusJakartaSans_600SemiBold';
  src: url('https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_d0nNSg.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'PlusJakartaSans_700Bold';
  src: url('https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_TknNSg.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'MaterialIcons';
  src: url('https://fonts.gstatic.com/s/materialicons/v145/flUhRq6tzZclQEJ-Vdg-IuiaDsNZ.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}
`;

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <style dangerouslySetInnerHTML={{ __html: FONT_FACE_CSS }} />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
