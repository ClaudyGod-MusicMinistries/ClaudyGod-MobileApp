import type { Router } from 'vue-router';
import { Role } from '@/utils/constants';

const AUTH_ROUTE_NAMES = new Set(['landing', 'login', 'register', 'request-access']);

export function setupGuards(router: Router): void {
  router.beforeEach(async (to, _from) => {
    const { useAuthStore } = await import('@/stores/auth.store');
    const auth = useAuthStore();

    // Public routes — allow access.
    if (to.meta.public) {
      // Already authenticated users should skip auth pages and go straight to dashboard.
      if (auth.isAuthenticated && AUTH_ROUTE_NAMES.has(to.name as string)) {
        return { name: 'dashboard' };
      }
      return true;
    }

    // Not authenticated → send to landing.
    if (!auth.isAuthenticated) {
      return { name: 'landing', query: { redirect: to.fullPath } };
    }

    // Role check.
    const minRole = to.meta.minRole ?? Role.CLIENT;
    if (auth.role < minRole) {
      return { name: 'dashboard' };
    }

    return true;
  });

  router.afterEach((to) => {
    const title = to.meta.title ? `${to.meta.title} — ClaudyGod Admin` : 'ClaudyGod Admin';
    document.title = title;
  });
}
