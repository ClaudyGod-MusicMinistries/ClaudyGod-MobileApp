<template>
  <AppBadge :tone="tone">{{ label }}</AppBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import { Role, ROLE_LABELS } from '@/utils/constants';

const props = defineProps<{ role: number }>();

const label = computed(() => ROLE_LABELS[props.role as Role] ?? `Role ${props.role}`);

const tone = computed(() => {
  if (props.role >= Role.SUPER_ADMIN) return 'danger' as const;
  if (props.role >= Role.ADMIN) return 'primary' as const;
  if (props.role >= Role.MODERATOR) return 'info' as const;
  if (props.role >= Role.CREATOR) return 'success' as const;
  return 'neutral' as const;
});
</script>
