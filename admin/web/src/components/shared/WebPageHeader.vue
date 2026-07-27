<template>
  <div class="flex flex-wrap items-end justify-between gap-4 pb-1">
    <div class="flex items-center gap-3 min-w-0">
      <div :class="['w-9 h-9 rounded-md border flex items-center justify-center shrink-0', badgeClass]">
        <component :is="icon" class="w-[18px] h-[18px]" :stroke-width="1.8" />
      </div>
      <div class="min-w-0">
        <h2 class="text-lg font-semibold text-ink truncate">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-ink-muted mt-1 truncate">{{ subtitle }}</p>
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
  primary: 'bg-primary/10 text-primary border-primary/15',
  danger: 'bg-danger/10 text-danger border-danger/15',
}[props.tone]));
</script>
