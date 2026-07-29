<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <Transition
          enter-active-class="transition-transform duration-250 ease-out"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div
            v-if="modelValue"
            class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-bg-2 border-l border-border shadow-panel flex flex-col"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 class="text-sm font-bold text-ink">Mobile preview</h2>
                <p class="text-[11px] text-ink-muted">Live app — save your changes, then refresh</p>
              </div>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="p-1.5 rounded-lg hover:bg-white/8 text-ink-muted hover:text-ink transition-colors"
                  title="Refresh preview"
                  @click="refresh"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
                <a
                  :href="PREVIEW_URL"
                  target="_blank"
                  rel="noopener"
                  class="p-1.5 rounded-lg hover:bg-white/8 text-ink-muted hover:text-ink transition-colors"
                  title="Open in new tab"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
                <button
                  type="button"
                  class="p-1.5 rounded-lg hover:bg-white/8 text-ink-muted hover:text-ink transition-colors"
                  title="Close"
                  @click="$emit('update:modelValue', false)"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <!-- Phone frame -->
            <div class="flex-1 overflow-y-auto flex items-center justify-center p-6 bg-bg-1">
              <div class="relative w-[300px] max-w-full aspect-[390/844] rounded-[2.5rem] border-[6px] border-bg-2 shadow-panel overflow-hidden bg-black flex-shrink-0">
                <iframe
                  :key="frameKey"
                  :src="PREVIEW_URL"
                  class="w-full h-full border-0 bg-white"
                  title="Mobile app preview"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MOBILE_PREVIEW_DEFAULT_URL } from '@/utils/constants';

defineProps<{ modelValue: boolean }>();
defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const PREVIEW_URL = MOBILE_PREVIEW_DEFAULT_URL;

// The preview is a different origin, so we can't call iframe.contentWindow.reload()
// (blocked by the browser's same-origin policy) — remounting via :key is the
// standard, reliable way to force a cross-origin iframe to reload.
const frameKey = ref(0);
function refresh(): void {
  frameKey.value += 1;
}
</script>
