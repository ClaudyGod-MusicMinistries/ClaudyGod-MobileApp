<template>
  <!-- Desktop / tablet: the real table, completely unchanged. All slots are
       forwarded through dynamically so call sites don't need to know this
       wrapper exists. -->
  <AppTable
    v-if="isDesktop"
    :columns="columns"
    :rows="rows"
    :loading="loading"
    :skeleton-rows="skeletonRows"
    :selectable="selectable"
    :sort-key="sortKey"
    :sort-dir="sortDir"
    @sort="(key, dir) => emit('sort', key, dir)"
    @select="(ids) => emit('select', ids)"
  >
    <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </AppTable>

  <!-- Mobile / narrow tablet: card list, same data and slots, no horizontal scroll. -->
  <div v-else class="space-y-3">
    <!-- Sort control — table headers aren't available to click in card mode. -->
    <div v-if="sortableColumns.length" class="flex items-center gap-2">
      <label class="text-xs font-semibold text-ink-muted uppercase tracking-wide">Sort by</label>
      <select
        class="flex-1 h-9 px-2.5 text-xs rounded-lg bg-bg-1 border border-border text-ink focus:outline-none focus:border-primary/50"
        :value="sortKey ?? ''"
        @change="onSortSelect(($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Choose a field…</option>
        <option v-for="col in sortableColumns" :key="col.key" :value="col.key">{{ col.label }}</option>
      </select>
      <button
        v-if="sortKey"
        type="button"
        class="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
        :aria-label="sortDir === 'asc' ? 'Sorted ascending' : 'Sorted descending'"
        @click="emit('sort', sortKey!, sortDir === 'asc' ? 'desc' : 'asc')"
      >
        <svg v-if="sortDir === 'asc'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg>
        <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
    </div>

    <!-- Select-all, only when there's something to select -->
    <label v-if="selectable && rows.length" class="flex items-center gap-2 text-xs text-ink-muted px-1">
      <input type="checkbox" class="rounded border-border accent-primary" :checked="allSelected" @change="toggleAll" />
      {{ allSelected ? 'Deselect all' : 'Select all' }}
    </label>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div v-for="i in skeletonRows" :key="i" class="rounded-2xl border border-border p-4 space-y-2">
        <div class="h-4 rounded bg-white/8 animate-pulse" style="width: 60%" />
        <div class="h-3 rounded bg-white/8 animate-pulse" style="width: 35%" />
      </div>
    </template>

    <!-- Empty -->
    <template v-else-if="rows.length === 0">
      <slot name="empty">
        <AppEmptyState title="No items found" message="Try adjusting your filters." />
      </slot>
    </template>

    <!-- Cards -->
    <template v-else>
      <div
        v-for="(row, idx) in rows"
        :key="rowKey(row, idx)"
        :class="[
          'rounded-2xl border p-4 space-y-3 transition-colors',
          selected.has(rowKey(row, idx)) ? 'bg-primary-muted/20 border-primary/30' : 'border-border',
        ]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <input
              v-if="selectable"
              type="checkbox"
              class="mt-1 rounded border-border accent-primary shrink-0"
              :checked="selected.has(rowKey(row, idx))"
              @change="toggleRow(rowKey(row, idx))"
            />
            <div class="min-w-0 flex-1 text-sm font-medium text-ink">
              <slot :name="`cell-${primaryColumn.key}`" :row="row" :value="row[primaryColumn.key]">
                {{ row[primaryColumn.key] ?? '—' }}
              </slot>
            </div>
          </div>
          <div v-if="$slots.actions" class="shrink-0 -mr-1.5">
            <slot name="actions" :row="row" />
          </div>
        </div>

        <div v-if="secondaryColumns.length" class="grid grid-cols-2 gap-x-3 gap-y-2">
          <div v-for="col in secondaryColumns" :key="col.key" class="min-w-0">
            <p class="text-[10px] font-semibold text-ink-muted uppercase tracking-wide">{{ col.label }}</p>
            <div class="text-xs text-ink-soft truncate">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] ?? '—' }}
              </slot>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppTable, { type TableColumn } from './AppTable.vue';
import AppEmptyState from './AppEmptyState.vue';
import { useAdminBreakpoints } from '@/composables/useAdminBreakpoints';

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

const { isDesktop } = useAdminBreakpoints();

const primaryColumn = computed(() => props.columns[0]!);
const secondaryColumns = computed(() => props.columns.slice(1));
const sortableColumns = computed(() => props.columns.filter((c) => c.sortable));

function onSortSelect(key: string): void {
  if (!key) return;
  emit('sort', key, 'asc');
}

// Card mode keeps its own selection state rather than sharing AppTable's internal
// one (AppTable doesn't expose it externally) — selection resets if you resize
// across the breakpoint mid-selection, an acceptable tradeoff for leaving AppTable
// itself untouched.
const selected = ref(new Set<string | number>());

function rowKey(row: Record<string, unknown>, idx: number): string | number {
  const id = row.id;
  if (typeof id === 'string' || typeof id === 'number') return id;
  return idx;
}

const allSelected = computed(() => props.rows.length > 0 && props.rows.every((r, i) => selected.value.has(rowKey(r, i))));

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
</script>
