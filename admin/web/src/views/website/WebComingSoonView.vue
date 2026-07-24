<template>
  <AppCard class="p-16 flex flex-col items-center justify-center text-center gap-4">
    <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
      <Construction class="w-7 h-7 text-primary-soft" />
    </div>
    <div>
      <p class="text-sm font-semibold text-ink">{{ pageTitle }} is on its way</p>
      <p class="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
        This section is being built out next — check back shortly.
      </p>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Construction } from 'lucide-vue-next';
import AppCard from '@/components/ui/AppCard.vue';

const route = useRoute();
const pageTitle = computed(() => String(route.meta.title ?? 'This section'));
</script>
