import { defineConfig } from 'vitest/config';

/**
 * Unit tests for pure, framework-free modules only (currently `playback/`).
 * These run in a plain Node environment with no React Native or Expo shims —
 * anything that imports `react-native` belongs in a future RN Testing Library
 * setup, not here.
 */
export default defineConfig({
  test: {
    include: ['playback/**/*.test.ts', 'util/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
  },
});
