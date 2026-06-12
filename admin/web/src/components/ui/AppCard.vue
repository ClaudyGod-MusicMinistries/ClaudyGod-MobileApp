<template>
  <div :class="['border rounded-2xl backdrop-blur-xs transition-all duration-150', toneClass, props.class]">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  tone?: 'default' | 'strong' | 'subtle';
  class?: string;
}>(), { tone: 'default' });

const toneClass = computed(() => ({
  default: 'bg-surface border-border',
  strong: 'bg-surface-strong border-border-strong',
  subtle: 'bg-white/3 border-border',
}[props.tone]));
</script>
