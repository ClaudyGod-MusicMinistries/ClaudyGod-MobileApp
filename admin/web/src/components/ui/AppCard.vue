<template>
  <component :is="as" :class="['app-card border rounded-[var(--radius-card)] transition-base', interactive && 'hover:-translate-y-0.5 hover:border-primary/25 hover:[box-shadow:var(--shadow-raised)]', toneClass, props.class]">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  tone?: 'default' | 'strong' | 'subtle';
  as?: string;
  interactive?: boolean;
  class?: string;
}>(), { tone: 'default', as: 'div' });

const toneClass = computed(() => ({
  default: 'bg-surface border-border',
  strong: 'bg-surface-strong border-border-strong',
  subtle: 'bg-surface-hover border-border',
}[props.tone]));
</script>
