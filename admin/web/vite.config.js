import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  // Fallback for .jsx sources if they are handled by esbuild before Vue JSX.
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'vue'`,
  },
  server: {
    port: parseInt(process.env.WEB_PORT || '5173', 10),
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
