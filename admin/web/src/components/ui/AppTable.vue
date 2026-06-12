<template>
  <div class="overflow-hidden rounded-2xl border border-border">
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-border bg-white/3">
            <th v-if="selectable" class="w-10 px-4 py-3">
              <input
                type="checkbox"
                class="rounded border-border accent-primary"
                :checked="allSelected"
                :indeterminate="someSelected && !allSelected"
                @change="toggleAll"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3 text-left text-xs font-semibold text-ink-soft uppercase tracking-wide whitespace-nowrap',
                col.sortable ? 'cursor-pointer select-none hover:text-ink transition-colors' : '',
                col.align === 'right' ? 'text-right' : '',
                col.class ?? '',
              ]"
              @click="col.sortable && onSort(col.key)"
            >
              <span class="flex items-center gap-1" :class="col.align === 'right' ? 'justify-end' : ''">
                {{ col.label }}
                <template v-if="col.sortable">
                  <svg v-if="sortKey === col.key && sortDir === 'asc'" class="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg v-else-if="sortKey === col.key && sortDir === 'desc'" class="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <svg v-else class="w-3 h-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                  </svg>
                </template>
              </span>
            </th>
            <th v-if="$slots.actions" class="w-16 px-4 py-3 text-right text-xs font-semibold text-ink-soft uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in skeletonRows" :key="i" class="border-b border-border/50">
              <td v-if="selectable" class="px-4 py-3"><div class="w-4 h-4 rounded bg-white/8 animate-pulse" /></td>
              <td v-for="col in columns" :key="col.key" :class="['px-4 py-3', col.align === 'right' ? 'text-right' : '']">
                <div class="h-4 rounded bg-white/8 animate-pulse" :style="{ width: `${Math.random() * 40 + 40}%` }" />
              </td>
              <td v-if="$slots.actions" class="px-4 py-3" />
            </tr>
          </template>
          <template v-else-if="rows.length === 0">
            <tr>
              <td :colspan="totalCols" class="py-0">
                <slot name="empty">
                  <AppEmptyState title="No items found" message="Try adjusting your filters." />
                </slot>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="(row, idx) in rows"
              :key="rowKey(row, idx)"
              :class="[
                'border-b border-border/50 transition-colors duration-100',
                'hover:bg-primary-muted/20',
                selected.has(rowKey(row, idx)) ? 'bg-primary-muted/30' : '',
              ]"
            >
              <td v-if="selectable" class="px-4 py-3">
                <input
                  type="checkbox"
                  class="rounded border-border accent-primary"
                  :checked="selected.has(rowKey(row, idx))"
                  @change="toggleRow(rowKey(row, idx))"
                />
              </td>
              <td
                v-for="col in columns"
                :key="col.key"
                :class="['px-4 py-3 text-ink-soft', col.align === 'right' ? 'text-right' : '', col.class ?? '']"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  <span class="text-sm">{{ row[col.key] ?? '—' }}</span>
                </slot>
              </td>
              <td v-if="$slots.actions" class="px-4 py-3 text-right">
                <slot name="actions" :row="row" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppEmptyState from './AppEmptyState.vue';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right';
  class?: string;
}

const props = withDefaults(defineProps<{
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  loading?: boolean;
  skeletonRows?: number;
  selectable?: boolean;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}>(), { skeletonRows: 5 });

const emit = defineEmits<{
  (e: 'sort', key: string, dir: 'asc' | 'desc'): void;
  (e: 'select', ids: (string | number)[]): void;
}>();

const selected = ref(new Set<string | number>());

const totalCols = computed(() => props.columns.length + (props.selectable ? 1 : 0) + 1);

function rowKey(row: Record<string, unknown>, idx: number): string | number {
  const id = row.id;
  if (typeof id === 'string' || typeof id === 'number') return id;
  return idx;
}

const allSelected = computed(() => props.rows.length > 0 && props.rows.every((r, i) => selected.value.has(rowKey(r, i))));
const someSelected = computed(() => props.rows.some((r, i) => selected.value.has(rowKey(r, i))));

function toggleRow(id: string | number): void {
  if (selected.value.has(id)) selected.value.delete(id);
  else selected.value.add(id);
  emit('select', [...selected.value]);
}

function toggleAll(): void {
  if (allSelected.value) {
    selected.value.clear();
  } else {
    props.rows.forEach((r, i) => selected.value.add(rowKey(r, i)));
  }
  emit('select', [...selected.value]);
}

function onSort(key: string): void {
  const newDir = props.sortKey === key && props.sortDir === 'asc' ? 'desc' : 'asc';
  emit('sort', key, newDir);
}
</script>
