<template>
  <component
    :is="tag"
    v-bind="tagProps"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium transition-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none whitespace-nowrap',
      sizeClass,
      variantClass,
      { 'w-full': fullWidth },
    ]"
    :disabled="disabled || loading"
    :aria-label="ariaLabel || tooltip || undefined"
    :data-tooltip="tooltip || undefined"
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
  tooltip?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
}>(), { variant: 'primary', size: 'md' });

defineEmits<{ (e: 'click', evt: MouseEvent): void }>();

const tag = computed(() => props.href ? 'a' : (props.tag || 'button'));
const tagProps = computed(() => props.href ? { href: props.href } : { type: props.type ?? 'button' });

const sizeClass = computed(() => ({
  xs: 'h-8 px-2.5 text-xs rounded-[var(--radius-control)]',
  sm: 'h-9 px-3 text-[13px] rounded-[var(--radius-control)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-control)]',
  lg: 'h-11 px-5 text-sm rounded-[var(--radius-control)]',
}[props.size]));

const variantClass = computed(() => ({
  primary:  'bg-primary hover:bg-primary/90 text-white border border-primary shadow-sm hover:shadow-glow-sm',
  gradient: 'bg-gradient-to-br from-primary to-primary-soft hover:brightness-105 text-white border border-primary/70 shadow-sm hover:shadow-glow-sm',
  secondary:'bg-surface-strong hover:bg-surface-hover text-ink border border-border-strong',
  danger:   'bg-danger/12 hover:bg-danger/20 text-danger border border-danger/25',
  ghost:    'hover:bg-surface-hover text-ink-soft',
  outline:  'border border-border hover:border-primary/40 hover:bg-primary/5 text-ink',
}[props.variant]));
</script>
