import type { Router } from 'vue-router';
import { Role } from '@/utils/constants';

const AUTH_ROUTE_NAMES = new Set(['landing', 'login', 'register', 'request-access']);

export function setupGuards(router: Router): void {
  router.beforeEach(async (to, _from) => {
    const { useAuthStore } = await import('@/stores/auth.store');
    const auth = useAuthStore();

    // Public routes — allow access.
    if (to.meta.public) {
      // Already authenticated users should skip auth pages and choose a workspace
      // (Mobile Studio or Web Studio — two separate shells, so there's no single
      // "the dashboard" to land on anymore).
      if (auth.isAuthenticated && AUTH_ROUTE_NAMES.has(to.name as string)) {
        return { name: 'choose-workspace' };
      }
      return true;
    }

    // Not authenticated → send to landing.
    if (!auth.isAuthenticated) {
      return { name: 'landing', query: { redirect: to.fullPath } };
    }

    // Role check. Falls back to the workspace chooser rather than a specific
    // dashboard — both Mobile's /dashboard and every /web/* route require at
    // least Role.ADMIN, so bouncing a sub-ADMIN user to either would just fail
    // the same check again; the chooser itself has no minRole.
    const minRole = to.meta.minRole ?? Role.CLIENT;
    if (auth.role < minRole) {
      return { name: 'choose-workspace' };
    }

    return true;
  });

  router.afterEach((to) => {
    const title = to.meta.title ? `${to.meta.title} — ClaudyGod Admin` : 'ClaudyGod Admin';
    document.title = title;
  });
}
