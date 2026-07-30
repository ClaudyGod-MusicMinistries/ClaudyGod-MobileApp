import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useIdle } from '@vueuse/core';
import { login as apiLogin, loginWithMfa, logout as apiLogout } from '@/api/auth';
import {
  setAccessToken,
  clearAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
  refreshSession,
} from '@/api/client';
import { onSessionExpired } from '@/api/session';
import { getErrorMessage } from '@/api/apiError';
import { router } from '@/router';
import { Role, INACTIVITY_TIMEOUT_MS, roleRank } from '@/utils/constants';
import type { AdminUser, LoginResponse, LoginSuccessResponse } from '@/api/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AdminUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value));
  const role = computed<Role>(() => roleRank(user.value?.role));

  function hasMinRole(minRole: Role): boolean {
    return role.value >= minRole;
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
    setAccessToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    user.value = res.user;
    startIdleWatcher();
  }

  // ─── Restore session on page load ───────────────────────────────────────────

  async function restoreSession(): Promise<void> {
    const rt = getRefreshToken();
    if (!rt) return;
    try {
      // Restore explicitly instead of intentionally generating a 401 first.
      // The refresh response rotates both tokens and contains the canonical user.
      const session = await refreshSession();
      user.value = session.user;
      startIdleWatcher();
    } catch {
      clearAccessToken();
      clearRefreshToken();
    }
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  function logout(): void {
    const rt = getRefreshToken();
    if (rt) { void apiLogout(rt).catch(() => { /* best-effort */ }); }
    clearAccessToken();
    clearRefreshToken();
    user.value = null;
    stopIdleWatcher();
    void router.push('/login');
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
    login,
    completeMfa,
    restoreSession,
    logout,
    applyExternalSession,
  };
});
