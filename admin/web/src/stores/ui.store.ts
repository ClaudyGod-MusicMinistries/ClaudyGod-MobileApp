import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AppTone } from '@/utils/constants';

// Toasts don't need the full AppTone vocabulary (no "primary"/"neutral" toast) but
// use the same words for the tones they share — "danger", never "error".
export type ToastTone = Exclude<AppTone, 'primary' | 'neutral'>;

export interface Toast {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([]);
  const sidebarOpen = ref(true);
  // Independent from sidebarOpen (desktop rail collapse) — this drives the off-canvas
  // drawer below the `lg` breakpoint so the two behaviors never fight each other.
  const mobileDrawerOpen = ref(false);
  const confirmOptions = ref<ConfirmOptions | null>(null);
  let _confirmResolve: ((ok: boolean) => void) | null = null;

  function addToast(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).slice(2);
    toasts.value.push({ ...toast, id });
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }

  function removeToast(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function toggleMobileDrawer(): void {
    mobileDrawerOpen.value = !mobileDrawerOpen.value;
  }

  function closeMobileDrawer(): void {
    mobileDrawerOpen.value = false;
  }

  function confirm(options: ConfirmOptions): Promise<boolean> {
    confirmOptions.value = options;
    return new Promise((resolve) => {
      _confirmResolve = resolve;
    });
  }

  function resolveConfirm(ok: boolean): void {
    confirmOptions.value = null;
    _confirmResolve?.(ok);
    _confirmResolve = null;
  }

  return {
    toasts,
    sidebarOpen,
    mobileDrawerOpen,
    confirmOptions,
    addToast,
    removeToast,
    toggleSidebar,
    toggleMobileDrawer,
    closeMobileDrawer,
    confirm,
    resolveConfirm,
  };
});
