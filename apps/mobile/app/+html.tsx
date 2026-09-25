import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

/**
 * HTML shell for the Expo web build. Only used by static export; the production
 * image uses the single-page export, which ignores this file. Fonts are injected
 * at runtime by util/fonts.ts (injectWebFonts) so they work in both modes.
 */

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

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
