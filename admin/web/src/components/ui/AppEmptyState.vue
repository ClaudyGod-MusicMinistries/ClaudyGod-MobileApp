<template>
  <div class="flex flex-col items-center justify-center py-12 px-6 gap-3 text-center">
    <div class="w-10 h-10 rounded-md bg-surface-hover border border-border flex items-center justify-center">
      <slot name="icon">
        <Inbox class="w-5 h-5 text-ink-muted" stroke-width="1.7" />
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
