import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useIdle } from '@vueuse/core';
import { login as apiLogin, loginWithMfa, logout as apiLogout, getMe } from '@/api/auth';
import {
  setAccessToken,
  clearAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
} from '@/api/client';
import { Role, INACTIVITY_TIMEOUT_MS } from '@/utils/constants';
import type { AdminUser, LoginResponse } from '@/api/types';

function _extractMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AdminUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value));
  const role = computed<Role>(() => (user.value?.role as Role) ?? Role.CLIENT);

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
      if (!res.requiresMfa) {
        _applySession(res);
      }
      return res;
    } catch (e) {
      error.value = _extractMessage(e);
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
      error.value = _extractMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function _applySession(res: LoginResponse): void {
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
      // Try to get current user — the client interceptor will refresh the token if needed.
      const me = await getMe();
      user.value = me;
      startIdleWatcher();
    } catch {
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
    // Redirect is handled by the router guard watching isAuthenticated.
    void import('@/router').then(({ router }) => { void router.push('/login'); });
  }

  function applyExternalSession(res: LoginResponse): void {
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
