<template>
  <span class="inline-flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1 text-xs text-ink-soft">
    <span class="font-semibold text-ink-muted">{{ label }}</span>
    <span>{{ value }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
}>();
</script>
