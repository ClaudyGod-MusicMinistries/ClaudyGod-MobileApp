<template>
  <component
    :is="tag"
    v-bind="tagProps"
    :class="[
      'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 disabled:opacity-50 disabled:cursor-not-allowed select-none',
      sizeClass,
      variantClass,
      { 'w-full': fullWidth },
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <AppSpinner v-if="loading" size="sm" />
    <slot name="icon-left" />
    <slot>{{ label }}</slot>
    <slot name="icon-right" />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppSpinner from './AppSpinner.vue';

const props = withDefaults(defineProps<{
  label?: string;
  variant?: 'primary' | 'gradient' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  href?: string;
  tag?: string;
}>(), { variant: 'primary', size: 'md' });

defineEmits<{ (e: 'click', evt: MouseEvent): void }>();

const tag = computed(() => props.href ? 'a' : (props.tag || 'button'));
const tagProps = computed(() => props.href ? { href: props.href } : { type: 'button' });

const sizeClass = computed(() => ({
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-base rounded-2xl',
}[props.size]));

const variantClass = computed(() => ({
  primary:  'bg-primary hover:bg-primary/85 text-white shadow-glow-sm',
  gradient: 'bg-gradient-to-br from-violet-600 to-violet-800 hover:from-violet-500 hover:to-violet-700 text-white shadow-glow-sm',
  secondary:'bg-surface hover:bg-surface-strong text-ink border border-border',
  danger:   'bg-danger/12 hover:bg-danger/20 text-danger border border-danger/25',
  ghost:    'hover:bg-surface-hover text-ink-soft',
  outline:  'border border-border hover:border-primary/40 hover:bg-primary/5 text-ink',
}[props.variant]));
</script>
