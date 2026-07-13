<template>
  <div class="flex items-center gap-2.5">
    <div class="w-7 h-7 rounded-lg bg-primary/12 flex items-center justify-center shrink-0 text-primary">
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" v-html="iconPath" />
    </div>
    <h3 class="text-sm font-bold text-ink">{{ label }}</h3>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  icon: 'media' | 'publish' | 'info' | 'sections';
  label: string;
}>();

const ICONS: Record<string, string> = {
  media: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>',
  publish: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>',
  info: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  sections: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>',
};

const iconPath = computed(() => ICONS[props.icon] ?? ICONS.info);
</script>
