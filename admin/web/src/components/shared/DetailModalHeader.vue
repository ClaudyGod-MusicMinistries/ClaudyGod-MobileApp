<template>
  <div class="flex items-center gap-3">
    <UserAvatar :name="name" :email="subtitle" size="md" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-ink truncate">{{ name }}</p>
      <p v-if="subtitle" class="text-xs text-ink-muted truncate">{{ subtitle }}</p>
    </div>
    <span
      v-if="timestamp"
      class="shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-medium text-ink-muted whitespace-nowrap"
      :title="exactDateTime(timestamp)"
    >
      {{ relativeTime(timestamp) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { relativeTime, exactDateTime } from '@/utils/relativeTime';
import UserAvatar from '@/components/shared/UserAvatar.vue';

defineProps<{
  name: string;
  subtitle?: string;
  timestamp?: string;
}>();
</script>
