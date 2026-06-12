<template>
  <span :class="['inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', toneClass]">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  tone?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
}>(), { tone: 'neutral' });

const toneClass = computed(() => ({
  primary: 'bg-primary/15 text-primary-soft',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-amber/15 text-amber',
  info: 'bg-info/15 text-info',
  neutral: 'bg-white/8 text-ink-soft',
}[props.tone]));
</script>
