import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
    port: parseInt(process.env.WEB_PORT || '5173', 10),
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
