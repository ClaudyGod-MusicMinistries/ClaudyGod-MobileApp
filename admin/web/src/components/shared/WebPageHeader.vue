<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <div :class="['w-8 h-8 rounded-xl flex items-center justify-center shrink-0', badgeClass]">
        <component :is="icon" class="w-4 h-4" />
      </div>
      <div class="min-w-0">
        <h2 class="text-base font-bold text-ink truncate">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-ink-muted mt-0.5 truncate">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.default" class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';

// Same visual shape as components/shared/PageHeader.vue, but takes a real
// lucide-vue-next component instead of a string key into a hand-authored SVG
// path map — every Web Studio view already imports its own icon component
// (for the sidebar/quick-actions), so this reuses that directly with zero
// risk of a hand-copied path drifting from the actual icon.
const props = withDefaults(defineProps<{
  icon: Component;
  title: string;
  subtitle?: string;
  tone?: 'primary' | 'danger';
}>(), { tone: 'primary' });

const badgeClass = computed(() => ({
  primary: 'bg-primary/12 text-primary',
  danger: 'bg-danger/12 text-danger',
}[props.tone]));
</script>
