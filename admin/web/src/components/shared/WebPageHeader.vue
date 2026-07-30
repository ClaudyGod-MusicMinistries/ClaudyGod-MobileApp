<template>
  <PageHeader :icon="icon" :title="title" :subtitle="subtitle" :tone="tone">
    <slot />
  </PageHeader>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import PageHeader from './PageHeader.vue';

// Same visual shape as components/shared/PageHeader.vue, but takes a real
// lucide-vue-next component instead of a string key into a hand-authored SVG
// path map — every Web Studio view already imports its own icon component
// (for the sidebar/quick-actions), so this reuses that directly with zero
// risk of a hand-copied path drifting from the actual icon.
withDefaults(defineProps<{
  icon: Component;
  title: string;
  subtitle?: string;
  tone?: 'primary' | 'danger';
}>(), { tone: 'primary' });

</script>
