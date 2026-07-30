<template>
  <div class="flex items-center gap-2.5">
    <div class="w-7 h-7 rounded-lg bg-primary/12 flex items-center justify-center shrink-0 text-primary">
      <component :is="iconComponent" class="w-3.5 h-3.5" />
    </div>
    <h3 class="text-sm font-bold text-ink">{{ label }}</h3>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Image, Info, List, Send } from 'lucide-vue-next';

const props = defineProps<{
  icon: 'media' | 'publish' | 'info' | 'sections';
  label: string;
}>();

const ICONS = { media: Image, publish: Send, info: Info, sections: List };

const iconComponent = computed(() => ICONS[props.icon] ?? Info);
</script>
