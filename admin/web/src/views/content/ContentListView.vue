<template>
  <div class="space-y-4">
    <!-- Header -->
    <PageHeader icon="content" title="Content library" :subtitle="`${store.total} item${store.total !== 1 ? 's' : ''} total`">
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
    </PageHeader>

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
            <div class="flex items-center gap-3 p-3 rounded-md border border-border bg-surface-strong">
              <span class="drag-handle cursor-grab text-ink-muted shrink-0" title="Drag to reorder">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16"/></svg>
              </span>
              <div class="w-9 h-9 rounded-lg bg-surface-hover overflow-hidden flex-shrink-0">
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
    <AppCard class="overflow-hidden">
      <div class="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-ink">Filter library</p>
          <p class="text-[11px] text-ink-muted mt-0.5">Search and narrow the publishing inventory</p>
        </div>
        <button v-if="hasActiveFilters" type="button" class="text-xs font-semibold text-primary hover:text-primary-soft" @click="resetFilters">
          Clear filters
        </button>
      </div>
      <div class="flex flex-wrap gap-3 items-end p-4">
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
      </div>
    </AppCard>

    <div v-if="store.error" class="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-danger/20 bg-danger/8">
      <div class="flex items-center gap-2 min-w-0">
        <AlertCircle class="w-4 h-4 text-danger shrink-0" />
        <p class="text-xs text-danger truncate">{{ store.error }}</p>
      </div>
      <AppButton variant="secondary" size="xs" @click="store.fetchContent()">Retry</AppButton>
    </div>

    <!-- Bulk toolbar -->
    <Transition name="slide-down">
      <div v-if="selectedIds.length" class="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
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
            <div class="w-12 h-12 rounded-md bg-bg-2 border border-border overflow-hidden flex-shrink-0">
              <img v-if="row.thumbnailUrl" :src="row.thumbnailUrl as string" alt="" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <component :is="contentIcon(String(row.type))" class="w-5 h-5 text-ink-muted" :stroke-width="1.7" />
              </div>
            </div>
            <div class="min-w-0">
              <RouterLink :to="`/content/${row.id}`" class="text-sm font-semibold text-ink hover:text-primary transition-colors line-clamp-1">
                {{ row.title }}
              </RouterLink>
              <p class="text-[11px] text-ink-muted mt-1 truncate max-w-md">
                {{ row.channelName || row.description || 'No supporting details' }}
              </p>
              <div class="flex items-center gap-2 mt-1.5 text-[10px] text-ink-muted">
                <span v-if="row.duration">{{ row.duration }}</span>
                <span v-if="row.isFeatured" class="text-primary font-semibold">Featured</span>
              </div>
            </div>
          </div>
        </template>
        <template #cell-type="{ value }">
          <AppBadge tone="neutral">{{ value }}</AppBadge>
        </template>
        <template #cell-sourceKind="{ value }">
          <span
            v-if="value === 'youtube'"
            class="inline-flex items-center gap-1 text-[11px] font-medium text-red-400"
            title="Imported from YouTube"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            YouTube
          </span>
          <span
            v-else-if="value === 'external'"
            class="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted"
            title="Linked to an external URL"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5"/></svg>
            Link
          </span>
          <span v-else class="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted" title="Uploaded directly">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Upload
          </span>
        </template>
        <template #cell-visibility="{ value }">
          <StatusBadge :status="String(value)" />
        </template>
        <template #cell-appSections="{ value }">
          <div class="flex flex-wrap gap-1 max-w-48">
            <AppBadge v-for="section in (value as string[]).slice(0, 2)" :key="section" tone="neutral">{{ section }}</AppBadge>
            <span
              v-if="(value as string[]).length > 2"
              class="text-[11px] font-medium text-ink-muted"
              :title="`${(value as string[]).slice(2).join(', ')}`"
            >
              +{{ (value as string[]).length - 2 }} more
            </span>
            <span v-if="!(value as string[]).length" class="text-xs text-ink-muted">Unassigned</span>
          </div>
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
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { AlertCircle, FileText, ListMusic, Music2, Video } from 'lucide-vue-next';
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
import PageHeader from '@/components/shared/PageHeader.vue';

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
  { key: 'sourceKind', label: 'Source' },
  { key: 'appSections', label: 'App sections' },
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
onBeforeUnmount(() => store.cancelContentFetch());

watchDebounced(() => [store.filters.type, store.filters.status, store.filters.search], () => {
  store.filters.page = 1;
  void store.fetchContent();
}, { debounce: 250, maxWait: 700 });

const hasActiveFilters = computed(() => Boolean(store.filters.type || store.filters.status || store.filters.search));

function contentIcon(type: string) {
  return { audio: Music2, video: Video, playlist: ListMusic, announcement: FileText }[type] ?? FileText;
}

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
  const ids = [...selectedIds.value];
  try {
    const results = await Promise.allSettled(ids.map((id) => store.remove(id)));
    const failed = results.filter((result) => result.status === 'rejected').length;
    selectedIds.value = failed ? ids.filter((_, index) => results[index]?.status === 'rejected') : [];

    if (failed) {
      ui.addToast({
        tone: 'danger',
        title: `${failed} item${failed === 1 ? '' : 's'} could not be deleted`,
        message: 'Failed items remain selected so you can retry.',
      });
    } else {
      ui.addToast({ tone: 'success', title: `Moved ${ids.length} item${ids.length === 1 ? '' : 's'} to Trash` });
    }
  } finally {
    bulkLoading.value = false;
  }
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
