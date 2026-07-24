<template>
  <div class="space-y-5">
    <WebPageHeader :icon="Disc3" title="Albums" subtitle="Discography shown on the Music page">
      <AppButton size="sm" @click="openCreate">
        <template #icon><Plus class="w-4 h-4" /></template>
        New album
      </AppButton>
    </WebPageHeader>

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-title="{ row }">
          <div class="flex items-center gap-3">
            <img
              v-if="row.imageUrl"
              :src="row.imageUrl as string"
              alt=""
              class="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-white/5"
            />
            <div v-else class="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <Disc3 class="w-4 h-4 text-ink-muted" />
            </div>
            <p class="text-sm font-medium text-ink">{{ row.title }}</p>
          </div>
        </template>
        <template #cell-releasedAt="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(value as string | null) }}</span>
        </template>
        <template #cell-sortOrder="{ value }">
          <span class="text-xs text-ink-muted tabular-nums">{{ value }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton variant="secondary" size="xs" @click="openEdit(row as unknown as Album)">Edit</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmDelete(row as unknown as Album)">Delete</AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <!-- Create / Edit modal -->
    <AppModal v-model="modalOpen" :title="editingId ? 'Edit album' : 'New album'" size="lg">
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="save">
        <AppInput v-model="form.title" label="Title" required class="sm:col-span-2" />
        <AppInput v-model="form.imageUrl" label="Cover image URL" class="sm:col-span-2" />
        <AppInput v-model="form.spotifyUrl" label="Spotify URL" />
        <AppInput v-model="form.appleUrl" label="Apple Music URL" />
        <AppInput v-model="form.youtubeUrl" label="YouTube URL" />
        <AppInput v-model="form.deezerUrl" label="Deezer URL" />
        <AppInput v-model="form.amazonUrl" label="Amazon Music URL" />
        <AppInput v-model.number="form.sortOrder" type="number" label="Sort order" hint="Higher shows first" />
        <AppInput v-model="form.releasedAt" type="date" label="Release date" />
      </form>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="modalOpen = false">Cancel</AppButton>
          <AppButton size="sm" :loading="saving" @click="save">
            {{ editingId ? 'Save changes' : 'Create album' }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { Disc3, Plus } from 'lucide-vue-next';
import { useAlbumsStore } from '@/stores/website/albums.store';
import { useUiStore } from '@/stores/ui.store';
import type { Album, AlbumInput } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useAlbumsStore();
const ui = useUiStore();

onMounted(() => { void store.fetchAlbums(); });

const rows = computed(() => store.albums as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'title', label: 'Album' },
  { key: 'releasedAt', label: 'Released', align: 'right' as const },
  { key: 'sortOrder', label: 'Order', align: 'right' as const },
];

const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);

// A dedicated form-state shape (all string/number, never null) since AppInput's
// modelValue only accepts string | number — null-coercion happens once, in
// save(), when building the actual AlbumInput payload for the API.
interface AlbumFormState {
  title: string;
  imageUrl: string;
  spotifyUrl: string;
  appleUrl: string;
  youtubeUrl: string;
  deezerUrl: string;
  amazonUrl: string;
  sortOrder: number;
  releasedAt: string;
}

const emptyForm = (): AlbumFormState => ({
  title: '',
  imageUrl: '',
  spotifyUrl: '',
  appleUrl: '',
  youtubeUrl: '',
  deezerUrl: '',
  amazonUrl: '',
  sortOrder: 0,
  releasedAt: '',
});

const form = reactive<AlbumFormState>(emptyForm());

function openCreate(): void {
  editingId.value = null;
  Object.assign(form, emptyForm());
  modalOpen.value = true;
}

function openEdit(album: Album): void {
  editingId.value = album.id;
  Object.assign(form, {
    title: album.title,
    imageUrl: album.imageUrl ?? '',
    spotifyUrl: album.spotifyUrl ?? '',
    appleUrl: album.appleUrl ?? '',
    youtubeUrl: album.youtubeUrl ?? '',
    deezerUrl: album.deezerUrl ?? '',
    amazonUrl: album.amazonUrl ?? '',
    sortOrder: album.sortOrder,
    releasedAt: album.releasedAt ? album.releasedAt.slice(0, 10) : '',
  });
  modalOpen.value = true;
}

async function save(): Promise<void> {
  if (!form.title.trim()) {
    ui.addToast({ tone: 'danger', title: 'Title is required' });
    return;
  }
  saving.value = true;
  try {
    const payload: AlbumInput = {
      ...form,
      // AppInput doesn't implement modelModifiers, so v-model.number on it is a
      // no-op — sortOrder can arrive as a string from the input event. Coerce
      // explicitly rather than trust the modifier, since the .NET backend's
      // System.Text.Json deserializer won't auto-convert a JSON string to int.
      sortOrder: Number(form.sortOrder) || 0,
      imageUrl: form.imageUrl || null,
      spotifyUrl: form.spotifyUrl || null,
      appleUrl: form.appleUrl || null,
      youtubeUrl: form.youtubeUrl || null,
      deezerUrl: form.deezerUrl || null,
      amazonUrl: form.amazonUrl || null,
      releasedAt: form.releasedAt || null,
    };
    await store.saveAlbum(payload, editingId.value ?? undefined);
    ui.addToast({ tone: 'success', title: editingId.value ? 'Album updated' : 'Album created' });
    modalOpen.value = false;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Save failed', message: e instanceof Error ? e.message : 'Please try again' });
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(album: Album): Promise<void> {
  const ok = await ui.confirm({
    title: 'Delete album',
    message: `Delete "${album.title}"? This can't be undone.`,
    confirmLabel: 'Delete',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeAlbum(album.id);
    ui.addToast({ tone: 'success', title: 'Album deleted' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Delete failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>
