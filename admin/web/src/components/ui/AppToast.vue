<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-1 scale-95"
        move-class="transition-all duration-200"
      >
        <div
          v-for="toast in ui.toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-panel backdrop-blur-sm',
            toneClass(toast.tone),
          ]"
        >
          <div :class="['w-5 h-5 flex-shrink-0 mt-0.5', iconColor(toast.tone)]">
            <svg v-if="toast.tone === 'success'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
            <svg v-else-if="toast.tone === 'error'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            <svg v-else-if="toast.tone === 'warning'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            <svg v-else fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ink">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-xs text-ink-soft mt-0.5">{{ toast.message }}</p>
          </div>
          <button type="button" class="p-1 rounded-lg hover:bg-white/10 transition-colors text-ink-muted" @click="ui.removeToast(toast.id)">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui.store';
import type { ToastTone } from '@/stores/ui.store';

const ui = useUiStore();

function toneClass(tone: ToastTone): string {
  return {
    success: 'bg-bg-2 border-success/25',
    error: 'bg-bg-2 border-danger/25',
    warning: 'bg-bg-2 border-amber/25',
    info: 'bg-bg-2 border-primary/25',
  }[tone];
}

function iconColor(tone: ToastTone): string {
  return {
    success: 'text-success',
    error: 'text-danger',
    warning: 'text-amber',
    info: 'text-primary',
  }[tone];
}
</script>
