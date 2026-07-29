<template>
  <span :class="['inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold border', toneClass]">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AppTone } from '@/utils/constants';

const props = withDefaults(defineProps<{
  tone?: AppTone;
}>(), { tone: 'neutral' });

const toneClass = computed(() => ({
  primary: 'bg-primary/10 text-primary-soft border-primary/15',
  success: 'bg-success/10 text-success border-success/15',
  danger: 'bg-danger/10 text-danger border-danger/15',
  warning: 'bg-amber/10 text-amber border-amber/15',
  info: 'bg-info/10 text-info border-info/15',
  neutral: 'bg-surface-hover text-ink-soft border-border',
}[props.tone]));
</script>
