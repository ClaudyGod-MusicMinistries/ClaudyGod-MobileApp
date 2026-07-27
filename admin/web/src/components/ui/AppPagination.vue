<template>
  <div v-if="totalPages > 1" class="flex items-center justify-between gap-4 px-1">
    <p class="text-xs text-ink-muted">
      {{ start }}–{{ end }} of {{ total }}
    </p>
    <div class="flex items-center gap-1">
      <button
        type="button"
        :disabled="page <= 1"
        class="h-8 px-2.5 rounded-md text-xs font-medium text-ink-soft hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="$emit('change', page - 1)"
      >
        ← Prev
      </button>
      <button
        v-for="p in pageRange"
        :key="p"
        type="button"
        :class="[
          'w-8 h-8 rounded-md text-xs font-semibold transition-colors',
          p === page ? 'bg-primary text-white' : 'text-ink-soft hover:bg-surface-hover',
        ]"
        @click="p !== '…' && $emit('change', p as number)"
      >
        {{ p }}
      </button>
      <button
        type="button"
        :disabled="page >= totalPages"
        class="h-8 px-2.5 rounded-md text-xs font-medium text-ink-soft hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="$emit('change', page + 1)"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  page: number;
  pageSize: number;
  total: number;
}>();

defineEmits<{ (e: 'change', page: number): void }>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
const start = computed(() => Math.min((props.page - 1) * props.pageSize + 1, props.total));
const end = computed(() => Math.min(props.page * props.pageSize, props.total));

const pageRange = computed((): (number | '…')[] => {
  const tp = totalPages.value;
  const p = props.page;
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
  if (p <= 4) return [1, 2, 3, 4, 5, '…', tp];
  if (p >= tp - 3) return [1, '…', tp - 4, tp - 3, tp - 2, tp - 1, tp];
  return [1, '…', p - 1, p, p + 1, '…', tp];
});
</script>
