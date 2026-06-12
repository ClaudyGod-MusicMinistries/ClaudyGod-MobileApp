import type { Router } from 'vue-router';
import { Role } from '@/utils/constants';

export function setupGuards(router: Router): void {
  router.beforeEach(async (to, _from) => {
    // Lazy import to avoid circular dep at module init time.
    const { useAuthStore } = await import('@/stores/auth.store');
    const auth = useAuthStore();

    // Allow public routes (login page).
    if (to.meta.public) {
      // If already logged in, redirect to dashboard.
      if (auth.isAuthenticated && to.name === 'login') {
        return { name: 'dashboard' };
      }
      return true;
    }

    // Not authenticated → login.
    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    // Role check.
    const minRole = to.meta.minRole ?? Role.CLIENT;
    if (auth.role < minRole) {
      return { name: 'dashboard' };
    }

    return true;
  });

  // Update document title.
  router.afterEach((to) => {
    const title = to.meta.title ? `${to.meta.title} — ClaudyGod Admin` : 'ClaudyGod Admin';
    document.title = title;
  });
}
