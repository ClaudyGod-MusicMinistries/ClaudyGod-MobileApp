import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useIdle } from '@vueuse/core';
import { login as apiLogin, loginWithMfa, logout as apiLogout } from '@/api/auth';
import {
  clearSession,
  restoreSession as restoreApiSession,
} from '@/api/client';
import { onSessionExpired } from '@/api/session';
import { getErrorMessage } from '@/api/apiError';
import { router } from '@/router';
import { Role, INACTIVITY_TIMEOUT_MS, roleRank } from '@/utils/constants';
import type { AdminUser, LoginResponse, LoginSuccessResponse } from '@/api/types';
import { hasCapability as roleHasCapability, type Capability } from '@/security/capabilities';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AdminUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value));
  const role = computed<Role>(() => roleRank(user.value?.role));

  function hasMinRole(minRole: Role): boolean {
    return role.value >= minRole;
  }

  function hasCapability(capability: Capability): boolean {
    return roleHasCapability(user.value?.role, capability);
  }

  // ─── Inactivity timer ───────────────────────────────────────────────────────
  const { idle } = useIdle(INACTIVITY_TIMEOUT_MS);
  let _idleWatcher: (() => void) | null = null;

  function startIdleWatcher(): void {
    if (_idleWatcher) return;
    // Use a polling interval to watch the idle state from vueuse
    const interval = setInterval(() => {
      if (idle.value && isAuthenticated.value) {
        void logout();
      }
    }, 10_000);
    _idleWatcher = () => clearInterval(interval);
  }

  function stopIdleWatcher(): void {
    _idleWatcher?.();
    _idleWatcher = null;
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

  async function login(email: string, password: string): Promise<LoginResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await apiLogin(email, password);
      if (!res.mfaRequired) {
        _applySession(res);
      }
      return res;
    } catch (e) {
      error.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function completeMfa(mfaToken: string, code: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await loginWithMfa(mfaToken, code);
      _applySession(res);
    } catch (e) {
      error.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function _applySession(res: LoginSuccessResponse): void {
    user.value = res.user;
    startIdleWatcher();
  }

  // ─── Restore session on page load ───────────────────────────────────────────

  async function restoreSession(): Promise<void> {
    try {
      const session = await restoreApiSession();
      user.value = session.authenticated ? session.user : null;
      if (user.value) startIdleWatcher();
    } catch {
      clearSession();
    }
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  async function logout(): Promise<void> {
    clearSession();
    user.value = null;
    stopIdleWatcher();
    try {
      // Wait for the API to revoke the refresh session and expire both HttpOnly
      // cookies before navigating, preventing a refresh from restoring logout.
      await apiLogout();
    } finally {
      await router.push('/login');
    }
  }

  // Transport reports expiration through this boundary; it never imports Pinia
  // or the router. This keeps the dependency direction UI -> API, not circular.
  onSessionExpired(() => {
    user.value = null;
    stopIdleWatcher();
    if (router.currentRoute.value.path !== '/login') void router.push('/login');
  });

  function applyExternalSession(res: LoginSuccessResponse): void {
    _applySession(res);
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    role,
    hasMinRole,
    hasCapability,
    login,
    completeMfa,
    restoreSession,
    logout,
    applyExternalSession,
  };
});
