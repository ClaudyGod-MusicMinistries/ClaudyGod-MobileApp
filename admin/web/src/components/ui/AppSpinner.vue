<template>
  <svg
    :class="['animate-spin', sizeClass, colorClass]"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    :aria-label="label"
  >
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}>(), { size: 'md', label: 'Loading…' });

const sizeClass = computed(() => ({
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-9 h-9',
}[props.size]));

const colorClass = computed(() => props.color ? '' : 'text-primary');
</script>
