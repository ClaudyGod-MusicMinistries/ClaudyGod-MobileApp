import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.WEB_PORT || '5173', 10),
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
