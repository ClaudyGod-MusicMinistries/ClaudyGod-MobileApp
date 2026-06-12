<template>
  <div
    :class="[
      'rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 font-bold text-primary-soft select-none',
      sizeClass,
    ]"
    :title="name"
  >
    {{ initials }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  name?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}>(), { size: 'md' });

const initials = computed(() => {
  const src = (props.name || props.email || 'CG').trim();
  const parts = src.split(/[\s@]+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'CG';
});

const sizeClass = computed(() => ({
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}[props.size]));
</script>
