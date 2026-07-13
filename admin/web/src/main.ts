import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as Sentry from '@sentry/vue';
import App from './App.vue';
import router from './router';
import './assets/styles/main.css';

const pinia = createPinia();
const app = createApp(App);

// No-op when VITE_SENTRY_DSN isn't set (local dev, CI, anywhere without a DSN)
// rather than a hard requirement — matches the same optional pattern used for
// Sentry on the backend and mobile app.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    app,
    dsn: sentryDsn,
    integrations: [Sentry.browserTracingIntegration({ router })],
    tracesSampleRate: 0.2,
  });
}

app.use(pinia);
app.use(router);

// Attempt to restore session from saved refresh token before mounting.
import('./stores/auth.store').then(({ useAuthStore }) => {
  const auth = useAuthStore();
  auth.restoreSession().finally(() => {
    app.mount('#root');
  });
});
