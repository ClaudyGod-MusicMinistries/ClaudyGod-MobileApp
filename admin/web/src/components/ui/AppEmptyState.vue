<template>
  <div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
    <div class="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center">
      <slot name="icon">
        <Inbox class="w-7 h-7 text-ink-muted" stroke-width="1.5" />
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
import { Inbox } from 'lucide-vue-next';

defineProps<{ title: string; message?: string }>();
</script>
