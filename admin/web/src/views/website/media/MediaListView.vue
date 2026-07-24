<template>
  <div class="space-y-5">
    <WebPageHeader :icon="Film" title="Videos" subtitle="External links (YouTube, etc.) shown on the Videos page">
      <AppButton size="sm" @click="openCreate">
        <template #icon><Plus class="w-4 h-4" /></template>
        New video link
      </AppButton>
    </WebPageHeader>

    <AppCard class="p-4">
      <AppSelect
        v-model="typeFilterValue"
        :options="typeFilterOptions"
        placeholder="All types"
        class="w-48"
        @update:model-value="onTypeFilterChange"
      />
    </AppCard>

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-title="{ row }">
          <div class="flex items-center gap-3">
            <img
              v-if="row.thumbnailPath"
              :src="row.thumbnailPath as string"
              alt=""
              class="w-14 h-9 rounded-lg object-cover flex-shrink-0 bg-white/5"
            />
            <div v-else class="w-14 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <Film class="w-4 h-4 text-ink-muted" />
            </div>
            <p class="text-sm font-medium text-ink max-w-xs truncate">{{ row.title }}</p>
          </div>
        </template>
        <template #cell-type="{ value }">
          <AppBadge tone="neutral">{{ value }}</AppBadge>
        </template>
        <template #cell-isPublished="{ value }">
          <AppBadge :tone="value ? 'success' : 'neutral'">{{ value ? 'Published' : 'Unpublished' }}</AppBadge>
        </template>
        <template #cell-viewCount="{ value }">
          <span class="text-xs text-ink-muted tabular-nums">{{ value }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton variant="secondary" size="xs" @click="openEdit(row as unknown as MediaItem)">Edit</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmDelete(row as unknown as MediaItem)">Delete</AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />

    <AppModal v-model="modalOpen" :title="editingId ? 'Edit video link' : 'New video link'" size="lg">
      <div class="grid grid-cols-1 gap-4">
        <AppInput v-model="form.title" label="Title" required />
        <AppSelect v-model="form.type" label="Type" :options="mediaTypeOptions" required />
        <AppInput v-model="form.externalUrl" label="External URL (YouTube, etc.)" required placeholder="https://youtu.be/…" />
        <AppInput v-model="form.thumbnailUrl" label="Thumbnail URL" hint="Optional — defaults to the platform's own thumbnail" />
        <AppTextarea v-model="form.description" label="Description" :rows="3" />
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="modalOpen = false">Cancel</AppButton>
          <AppButton size="sm" :loading="saving" @click="save">
            {{ editingId ? 'Save changes' : 'Create link' }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { Film, Plus } from 'lucide-vue-next';
import { useMediaStore } from '@/stores/website/media.store';
import { useUiStore } from '@/stores/ui.store';
import type { MediaItem, MediaLinkInput, MediaType } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useMediaStore();
const ui = useUiStore();

onMounted(() => { void store.fetchMedia(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'title', label: 'Video' },
  { key: 'type', label: 'Type' },
  { key: 'isPublished', label: 'Status' },
  { key: 'viewCount', label: 'Views', align: 'right' as const },
];

const mediaTypeOptions: Array<{ value: MediaType; label: string }> = [
  { value: 'Video', label: 'Video' },
  { value: 'Music', label: 'Music' },
  { value: 'SermonAudio', label: 'Sermon (audio)' },
  { value: 'SermonVideo', label: 'Sermon (video)' },
  { value: 'Photo', label: 'Photo' },
  { value: 'Other', label: 'Other' },
];

const typeFilterOptions = [{ value: '', label: 'All types' }, ...mediaTypeOptions];
const typeFilterValue = ref('');

function onTypeFilterChange(value: string | number): void {
  store.setTypeFilter(value ? String(value) : undefined);
}

const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);

interface MediaFormState {
  title: string;
  type: MediaType;
  externalUrl: string;
  thumbnailUrl: string;
  description: string;
}

const emptyForm = (): MediaFormState => ({
  title: '',
  type: 'Video',
  externalUrl: '',
  thumbnailUrl: '',
  description: '',
});

const form = reactive<MediaFormState>(emptyForm());

function openCreate(): void {
  editingId.value = null;
  Object.assign(form, emptyForm());
  modalOpen.value = true;
}

function openEdit(item: MediaItem): void {
  editingId.value = item.id;
  Object.assign(form, {
    title: item.title,
    type: item.type as MediaType,
    externalUrl: item.publicUrl,
    thumbnailUrl: item.thumbnailPath ?? '',
    description: item.description ?? '',
  });
  modalOpen.value = true;
}

async function save(): Promise<void> {
  if (!form.title.trim() || !form.externalUrl.trim()) {
    ui.addToast({ tone: 'danger', title: 'Title and external URL are required' });
    return;
  }
  saving.value = true;
  try {
    const payload: MediaLinkInput = {
      title: form.title,
      type: form.type,
      externalUrl: form.externalUrl,
      thumbnailUrl: form.thumbnailUrl || null,
      description: form.description || null,
    };
    await store.saveMediaLink(payload, editingId.value ?? undefined);
    ui.addToast({ tone: 'success', title: editingId.value ? 'Video link updated' : 'Video link created' });
    modalOpen.value = false;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Save failed', message: e instanceof Error ? e.message : 'Please try again' });
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(item: MediaItem): Promise<void> {
  const ok = await ui.confirm({
    title: 'Delete video link',
    message: `Delete "${item.title}"? This can't be undone.`,
    confirmLabel: 'Delete',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeMedia(item.id);
    ui.addToast({ tone: 'success', title: 'Video link deleted' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Delete failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}
</script>
