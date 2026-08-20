<template>
  <AppCard class="p-4 min-h-[124px] flex flex-col justify-between gap-4" interactive>
    <div class="flex items-center justify-between gap-3">
      <div :class="['w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center flex-shrink-0', iconBg]">
        <slot name="icon" />
      </div>
      <span v-if="trend !== undefined" :class="['text-xs font-medium flex items-center gap-0.5', trend >= 0 ? 'text-success' : 'text-danger']">
        <svg v-if="trend >= 0" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        <svg v-else class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        {{ Math.abs(trend) }}%
      </span>
    </div>
    <div>
      <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{{ label }}</p>
      <p class="text-2xl font-semibold text-ink tabular-nums mt-1">{{ formattedValue }}</p>
    </div>
    <p v-if="caption" class="text-xs text-ink-muted border-t border-border pt-2">{{ caption }}</p>
  </AppCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppCard from './AppCard.vue';

const props = withDefaults(defineProps<{
  label: string;
  value: number | string;
  trend?: number;
  caption?: string;
  iconBg?: string;
}>(), { iconBg: 'bg-primary/15' });

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value >= 1_000_000
      ? `${(props.value / 1_000_000).toFixed(1)}M`
      : props.value >= 1_000
      ? `${(props.value / 1_000).toFixed(1)}K`
      : props.value.toString();
  }
  return props.value;
});
</script>
