<template>
  <div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
    <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
      <slot name="icon">
        <svg class="w-7 h-7 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </slot>
    </div>
    <div>
      <p class="text-sm font-semibold text-ink">{{ title }}</p>
      <p v-if="message" class="text-xs text-ink-muted mt-1 max-w-xs mx-auto">{{ message }}</p>
    </div>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; message?: string }>();
</script>
