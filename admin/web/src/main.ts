import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/styles/main.css';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// Attempt to restore session from saved refresh token before mounting.
import('./stores/auth.store').then(({ useAuthStore }) => {
  const auth = useAuthStore();
  auth.restoreSession().finally(() => {
    app.mount('#root');
  });
});
