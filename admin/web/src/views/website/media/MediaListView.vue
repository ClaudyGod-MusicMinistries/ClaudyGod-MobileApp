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
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading" :error="store.error" @retry="store.fetchMedia">
        <template #cell-title="{ row }">
          <div class="flex items-center gap-3">
            <img
              v-if="getEffectiveThumbnail(row as unknown as MediaItem)"
              :src="getEffectiveThumbnail(row as unknown as MediaItem)!"
              alt=""
              class="w-14 h-9 rounded-lg object-cover flex-shrink-0 bg-surface-hover border border-border"
              loading="lazy"
            />
            <div v-else class="w-14 h-9 rounded-lg bg-surface-hover flex items-center justify-center flex-shrink-0 border border-border">
              <Film class="w-4 h-4 text-ink-muted" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-ink max-w-xs truncate">{{ row.title }}</p>
              <a
                v-if="row.publicUrl"
                :href="row.publicUrl as string"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-[11px] text-primary hover:underline truncate max-w-xs"
              >
                <ExternalLink class="w-3 h-3 shrink-0" />
                <span class="truncate">{{ row.publicUrl }}</span>
              </a>
            </div>
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
            <a
              v-if="row.publicUrl"
              :href="row.publicUrl as string"
              target="_blank"
              rel="noopener noreferrer"
              class="p-1.5 rounded-lg border border-border hover:bg-surface-hover text-ink-muted hover:text-ink transition-base inline-flex items-center justify-center"
              title="Watch video in new tab"
            >
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
            <AppButton variant="secondary" size="xs" @click="openEdit(row as unknown as MediaItem)">Edit</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmDelete(row as unknown as MediaItem)">Delete</AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />

    <AppModal v-model="modalOpen" :title="editingId ? 'Edit video link' : 'New video link'" size="lg">
      <div class="grid grid-cols-1 gap-4">
        <AppInput v-model="form.title" label="Title" required placeholder="e.g. King of Heaven Live Session" />
        <AppSelect v-model="form.type" label="Type" :options="mediaTypeOptions" required />
        
        <div>
          <AppInput
            v-model="form.externalUrl"
            label="External URL (YouTube, Vimeo, etc.)"
            required
            placeholder="https://youtu.be/… or https://www.youtube.com/watch?v=…"
            @input="onExternalUrlInput"
          />
          <div v-if="detectedYouTubeId" class="mt-2 flex items-center justify-between text-xs bg-primary/10 border border-primary/20 rounded-lg p-2.5 text-ink">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-success"></span>
              <span class="font-medium">YouTube video detected:</span>
              <code class="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[11px]">{{ detectedYouTubeId }}</code>
            </div>
            <a
              :href="`https://www.youtube.com/watch?v=${detectedYouTubeId}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-primary hover:underline text-[11px]"
            >
              <ExternalLink class="w-3 h-3" />
              Test link
            </a>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium text-ink-soft">
              Thumbnail Artwork
              <span class="text-ink-muted">(auto-extracted from YouTube or custom upload)</span>
            </p>
            <button
              v-if="detectedYouTubeId && form.thumbnailUrl !== detectedYouTubeThumb"
              type="button"
              class="text-[11px] text-primary hover:underline font-medium"
              @click="form.thumbnailUrl = detectedYouTubeThumb || ''"
            >
              Reset to YouTube thumbnail
            </button>
          </div>

          <div v-if="form.thumbnailUrl" class="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-hover/50">
            <img :src="form.thumbnailUrl" alt="Thumbnail preview" class="w-28 h-16 rounded-lg object-cover bg-surface border border-border shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-ink truncate">Active Thumbnail Preview</p>
              <p class="text-[11px] text-ink-muted truncate">{{ form.thumbnailUrl }}</p>
              <p v-if="form.thumbnailUrl === detectedYouTubeThumb" class="text-[10px] text-success font-medium mt-0.5">
                ✓ Auto-detected from YouTube
              </p>
            </div>
            <button
              type="button"
              class="text-xs text-danger hover:underline px-2 py-1"
              @click="form.thumbnailUrl = ''"
            >
              Clear
            </button>
          </div>

          <FileDropzone
            label="Upload custom thumbnail (overrides default)"
            accept="image/*"
            :max-mb="5"
            pipeline="mobile"
            @uploaded="onThumbnailUploaded"
          />
        </div>

        <AppTextarea v-model="form.description" label="Description" :rows="3" placeholder="Optional brief summary or Scripture notes" />
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
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { Film, Plus, ExternalLink } from 'lucide-vue-next';
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
import FileDropzone from '@/components/shared/FileDropzone.vue';

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

function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = url.trim();
  const match = clean.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getYouTubeThumbnail(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function getEffectiveThumbnail(item: MediaItem): string | null {
  if (item.thumbnailPath && item.thumbnailPath.trim()) {
    return item.thumbnailPath;
  }
  return getYouTubeThumbnail(item.publicUrl);
}

const detectedYouTubeId = computed(() => extractYouTubeId(form.externalUrl));
const detectedYouTubeThumb = computed(() => detectedYouTubeId.value ? `https://img.youtube.com/vi/${detectedYouTubeId.value}/hqdefault.jpg` : null);

function onExternalUrlInput(): void {
  const raw = form.externalUrl.trim();
  if (!raw) return;

  // Handle case where user pastes text with prefix like "NEW! https://youtu.be/..."
  const urlMatch = raw.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch && raw.startsWith('NEW!') && !form.title.trim()) {
    form.title = 'NEW! ' + (extractYouTubeId(urlMatch[1]) || '');
    form.externalUrl = urlMatch[1];
  }

  const ytId = extractYouTubeId(form.externalUrl);
  if (ytId) {
    // If no custom thumbnail was manually uploaded, auto-populate with YouTube's HQ thumbnail
    if (!form.thumbnailUrl) {
      form.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
  }
}

watch(() => form.externalUrl, () => {
  onExternalUrlInput();
});

function onThumbnailUploaded(payload: { url: string; sessionId: string }): void {
  form.thumbnailUrl = payload.url;
}

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
    thumbnailUrl: item.thumbnailPath || getYouTubeThumbnail(item.publicUrl) || '',
    description: item.description ?? '',
  });
  modalOpen.value = true;
}

async function save(): Promise<void> {
  let cleanUrl = form.externalUrl.trim();
  // Clean URL if it's a YouTube link containing tracking parameters like ?is=...
  const ytId = extractYouTubeId(cleanUrl);
  if (ytId && cleanUrl.includes('youtu.be')) {
    cleanUrl = `https://youtu.be/${ytId}`;
  } else if (ytId && cleanUrl.includes('youtube.com')) {
    cleanUrl = `https://www.youtube.com/watch?v=${ytId}`;
  }

  if (!form.title.trim() || !cleanUrl) {
    ui.addToast({ tone: 'danger', title: 'Title and external URL are required' });
    return;
  }
  saving.value = true;
  try {
    const payload: MediaLinkInput = {
      title: form.title.trim(),
      type: form.type,
      externalUrl: cleanUrl,
      thumbnailUrl: form.thumbnailUrl.trim() || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null),
      description: form.description.trim() || null,
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
