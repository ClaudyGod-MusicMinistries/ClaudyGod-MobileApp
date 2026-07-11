<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-base font-bold text-ink">Content library</h2>
        <p class="text-xs text-ink-muted mt-0.5">{{ store.total }} items total</p>
      </div>
      <div class="flex gap-2">
        <AppButton variant="secondary" size="sm" @click="toggleReorderMode">
          {{ reorderMode ? 'Done reordering' : 'Reorder' }}
        </AppButton>
        <RouterLink to="/content/new">
          <AppButton size="sm">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            </template>
            New content
          </AppButton>
        </RouterLink>
      </div>
    </div>

    <!-- Reorder mode -->
    <template v-if="reorderMode">
      <AppCard class="p-4 space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <label class="text-xs font-semibold text-ink-muted uppercase tracking-wide">Reordering</label>
            <AppSelect
              v-model="reorderType"
              :options="typeOptions"
              class="w-40"
            />
          </div>
          <AppButton size="sm" :loading="reorderSaving" @click="saveReorder">Save order</AppButton>
        </div>
        <p class="text-xs text-ink-muted">
          Drag to set the order this content appears in on the mobile app. This order applies wherever this content shows up.
        </p>

        <div v-if="reorderLoading" class="py-10 text-center text-sm text-ink-muted">Loading…</div>
        <AppEmptyState v-else-if="!reorderItems.length" title="No content of this type" message="Try a different type." />
        <draggable
          v-else
          v-model="reorderItems"
          item-key="id"
          handle=".drag-handle"
          class="space-y-2"
        >
          <template #item="{ element }: { element: ContentItem }">
            <div class="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface">
              <span class="drag-handle cursor-grab text-ink-muted shrink-0" title="Drag to reorder">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16"/></svg>
              </span>
              <div class="w-9 h-9 rounded-lg bg-white/8 overflow-hidden flex-shrink-0">
                <img v-if="element.thumbnailUrl" :src="element.thumbnailUrl" alt="" class="w-full h-full object-cover" />
              </div>
              <p class="text-sm font-medium text-ink truncate flex-1 min-w-0">{{ element.title }}</p>
              <StatusBadge :status="element.visibility" />
            </div>
          </template>
        </draggable>
      </AppCard>
    </template>

    <template v-else>
    <!-- Filters -->
    <AppCard class="p-4">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-48">
          <SearchInput :model-value="store.filters.search ?? ''" placeholder="Search content…" @update:model-value="store.filters.search = $event || undefined" />
        </div>
        <AppSelect
          :model-value="store.filters.type ?? ''"
          :options="typeOptions"
          placeholder="All types"
          class="w-36"
          @update:model-value="store.filters.type = $event || undefined"
        />
        <AppSelect
          :model-value="store.filters.status ?? ''"
          :options="statusOptions"
          placeholder="All statuses"
          class="w-36"
          @update:model-value="store.filters.status = $event || undefined"
        />
        <AppButton variant="secondary" size="sm" @click="resetFilters">Reset</AppButton>
      </div>
    </AppCard>

    <!-- Bulk toolbar -->
    <Transition name="slide-down">
      <div v-if="selectedIds.length" class="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/25 rounded-2xl">
        <span class="text-sm font-semibold text-ink">{{ selectedIds.length }} selected</span>
        <div class="flex gap-2 ml-auto">
          <AppButton size="xs" variant="secondary" :loading="bulkLoading" @click="bulkAction('published')">Publish</AppButton>
          <AppButton size="xs" variant="secondary" :loading="bulkLoading" @click="bulkAction('draft')">Unpublish</AppButton>
          <AppButton size="xs" variant="danger" :loading="bulkLoading" @click="bulkDelete">Delete</AppButton>
        </div>
      </div>
    </Transition>

    <!-- Table -->
    <AppCard>
      <AppResponsiveTable
        :columns="columns"
        :rows="store.items as Record<string, unknown>[]"
        :loading="store.isLoading"
        :sort-key="store.filters.sort"
        :sort-dir="store.filters.sortDir"
        selectable
        @sort="onSort"
        @select="selectedIds = $event as string[]"
      >
        <template #cell-title="{ row }">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-white/8 overflow-hidden flex-shrink-0">
              <img v-if="row.thumbnailUrl" :src="row.thumbnailUrl as string" alt="" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
              </div>
            </div>
            <RouterLink :to="`/content/${row.id}`" class="text-sm font-medium text-ink hover:text-primary transition-colors line-clamp-1">
              {{ row.title }}
            </RouterLink>
          </div>
        </template>
        <template #cell-type="{ value }">
          <AppBadge tone="neutral">{{ value }}</AppBadge>
        </template>
        <template #cell-visibility="{ value }">
          <StatusBadge :status="String(value)" />
        </template>
        <template #cell-createdAt="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(String(value)) }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <RouterLink :to="`/content/${row.id}`">
              <AppButton size="xs" variant="ghost" title="Edit">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </AppButton>
            </RouterLink>
            <AppButton size="xs" variant="ghost" :title="row.visibility === 'published' ? 'Unpublish' : 'Publish'" @click="toggleVisibility(row)">
              <svg v-if="row.visibility === 'published'" class="w-3.5 h-3.5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
              <svg v-else class="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </AppButton>
            <AppButton size="xs" variant="ghost" class="text-danger" title="Delete" @click="confirmDelete(row)">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <!-- Pagination -->
    <AppPagination
      :page="store.filters.page ?? 1"
      :page-size="store.filters.pageSize ?? 20"
      :total="store.total"
      @change="onPageChange"
    />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import draggable from 'vuedraggable';
import { useContentStore } from '@/stores/content.store';
import { useUiStore } from '@/stores/ui.store';
import { listContent, reorderContent } from '@/api/content';
import type { ContentItem } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import SearchInput from '@/components/shared/SearchInput.vue';

const store = useContentStore();
const ui = useUiStore();
const selectedIds = ref<string[]>([]);
const bulkLoading = ref(false);

const reorderMode = ref(false);
const reorderType = ref('audio');
const reorderItems = ref<ContentItem[]>([]);
const reorderLoading = ref(false);
const reorderSaving = ref(false);

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'visibility', label: 'Status' },
  { key: 'createdAt', label: 'Created', sortable: true, align: 'right' as const },
];

const typeOptions = [
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'playlist', label: 'Playlist' },
  { value: 'announcement', label: 'Announcement' },
];

const statusOptions = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

onMounted(() => { void store.fetchContent(); });

watch(() => [store.filters.type, store.filters.status, store.filters.search], () => {
  store.filters.page = 1;
  void store.fetchContent();
}, { debounce: 300 } as never);

function onSort(key: string, dir: 'asc' | 'desc'): void {
  store.filters.sort = key;
  store.filters.sortDir = dir;
  void store.fetchContent();
}

function onPageChange(page: number): void {
  store.filters.page = page;
  void store.fetchContent();
}

function resetFilters(): void {
  store.filters.type = undefined;
  store.filters.status = undefined;
  store.filters.search = undefined;
  store.filters.page = 1;
  void store.fetchContent();
}

async function fetchReorderItems(): Promise<void> {
  reorderLoading.value = true;
  try {
    const res = await listContent({ type: reorderType.value, sort: 'sortOrder', sortDir: 'asc', pageSize: 100 });
    reorderItems.value = res.items;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to load items', message: e instanceof Error ? e.message : undefined });
  } finally {
    reorderLoading.value = false;
  }
}

function toggleReorderMode(): void {
  reorderMode.value = !reorderMode.value;
  if (reorderMode.value) void fetchReorderItems();
}

watch(reorderType, () => {
  if (reorderMode.value) void fetchReorderItems();
});

async function saveReorder(): Promise<void> {
  reorderSaving.value = true;
  try {
    const items = reorderItems.value.map((item, idx) => ({ id: item.id, sortOrder: idx }));
    await reorderContent(items);
    ui.addToast({ tone: 'success', title: 'Order saved' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to save order', message: e instanceof Error ? e.message : undefined });
  } finally {
    reorderSaving.value = false;
  }
}

async function toggleVisibility(row: Record<string, unknown>): Promise<void> {
  const newVisibility = row.visibility === 'published' ? 'draft' : 'published';
  await store.save({ id: row.id as string, visibility: newVisibility as 'draft' | 'published' });
  void store.fetchContent();
  ui.addToast({ tone: 'success', title: newVisibility === 'published' ? 'Published' : 'Unpublished' });
}

async function confirmDelete(row: Record<string, unknown>): Promise<void> {
  const ok = await ui.confirm({ title: 'Delete content', message: `Delete "${row.title}"? It will be moved to Trash and can be restored later.`, tone: 'danger', confirmLabel: 'Delete' });
  if (!ok) return;
  await store.remove(row.id as string);
  ui.addToast({ tone: 'success', title: 'Moved to Trash' });
}

async function bulkAction(visibility: string): Promise<void> {
  const count = selectedIds.value.length;
  bulkLoading.value = true;
  try {
    await store.bulkAction(selectedIds.value, { visibility: visibility as 'draft' | 'published' });
    selectedIds.value = [];
    ui.addToast({ tone: 'success', title: `${visibility === 'published' ? 'Published' : 'Unpublished'} ${count} item${count !== 1 ? 's' : ''}` });
  } catch (e) {
    ui.addToast({
      tone: 'danger',
      title: 'Bulk action failed',
      message: e instanceof Error ? e.message : 'Please try again',
    });
  } finally {
    bulkLoading.value = false;
  }
}

async function bulkDelete(): Promise<void> {
  const ok = await ui.confirm({ title: 'Delete selected', message: `Delete ${selectedIds.value.length} items? They will be moved to Trash and can be restored later.`, tone: 'danger', confirmLabel: 'Delete all' });
  if (!ok) return;
  bulkLoading.value = true;
  for (const id of selectedIds.value) { await store.remove(id); }
  selectedIds.value = [];
  bulkLoading.value = false;
  ui.addToast({ tone: 'success', title: 'Moved selected items to Trash' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
