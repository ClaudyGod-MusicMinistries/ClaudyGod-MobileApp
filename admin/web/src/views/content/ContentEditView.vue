<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <RouterLink to="/content" class="p-2 rounded-xl hover:bg-white/8 text-ink-muted transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </RouterLink>
        <h2 class="text-base font-bold text-ink">{{ isNew ? 'New content' : 'Edit content' }}</h2>
      </div>
      <div v-if="store.saveError" class="text-xs text-danger">{{ store.saveError }}</div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main form -->
      <div class="lg:col-span-2 space-y-5">
        <AppCard class="p-5 space-y-4">
          <AppInput v-model="form.title" label="Title" placeholder="Content title" required />
          <AppTextarea v-model="form.description" label="Description" placeholder="Describe this content…" :rows="3" />
          <div class="grid grid-cols-2 gap-4">
            <AppSelect v-model="form.type" label="Content type" :options="typeOptions" required />
            <AppSelect v-model="form.visibility" label="Visibility" :options="visibilityOptions" />
          </div>
          <AppInput v-model="form.tags" label="Tags" placeholder="worship, prayer (comma-separated)" hint="Separate tags with commas" />
        </AppCard>

        <!-- Artwork -->
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Artwork</h3>
          <div v-if="form.artworkUrl" class="relative">
            <img :src="form.artworkUrl" alt="Artwork" class="w-32 h-32 rounded-xl object-cover border border-border" />
            <AppButton variant="ghost" size="xs" class="mt-2 text-danger" @click="form.artworkUrl = ''">Remove</AppButton>
          </div>
          <FileDropzone label="Upload artwork" accept="image/*" @uploaded="form.artworkUrl = $event" />
        </AppCard>

        <!-- Media -->
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Media</h3>
          <AppInput v-model="form.mediaUrl" label="Media URL" placeholder="https://…" hint="Or upload a file below" />
          <FileDropzone label="Upload media file" accept="audio/*,video/*" folder="media" @uploaded="form.mediaUrl = $event" />
        </AppCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Publishing</h3>
          <AppSelect v-model="form.status" label="Status" :options="statusOptions" />
          <AppInput v-model="form.publishedAt" label="Publish date" type="datetime-local" />
          <AppInput v-model="form.section" label="Section" placeholder="e.g. worship" />
        </AppCard>

        <!-- Sticky save footer -->
        <div class="sticky bottom-6 space-y-2">
          <AppButton full-width :loading="store.isSaving" @click="onSave('published')">
            Publish
          </AppButton>
          <AppButton full-width variant="secondary" :loading="store.isSaving" @click="onSave('draft')">
            Save draft
          </AppButton>
          <RouterLink to="/content">
            <AppButton full-width variant="ghost" size="sm">Cancel</AppButton>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContentStore } from '@/stores/content.store';
import { useUiStore } from '@/stores/ui.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppButton from '@/components/ui/AppButton.vue';

const route = useRoute();
const router = useRouter();
const store = useContentStore();
const ui = useUiStore();

const isNew = computed(() => route.name === 'content-new');
const id = computed(() => isNew.value ? null : route.params.id as string);

// Inline FileDropzone (self-contained to avoid extra file)
const FileDropzone = defineComponent({
  props: {
    label: String,
    accept: String,
    folder: { type: String, default: 'content' },
  },
  emits: ['uploaded'],
  setup(props, { emit }) {
    const { uploadFile } = await import('@/api/uploads');
    const progress = ref(0);
    const error = ref('');
    const isUploading = ref(false);
    const isDragging = ref(false);

    async function handleFile(file: File): Promise<void> {
      isUploading.value = true;
      error.value = '';
      progress.value = 0;
      try {
        const { publicUrl } = await uploadFile(file, props.folder, (pct) => { progress.value = pct; });
        emit('uploaded', publicUrl);
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Upload failed';
      } finally {
        isUploading.value = false;
      }
    }

    return () => (
      <div
        class={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragging.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
        onDragover={(e: DragEvent) => { e.preventDefault(); isDragging.value = true; }}
        onDragleave={() => { isDragging.value = false; }}
        onDrop={(e: DragEvent) => {
          e.preventDefault(); isDragging.value = false;
          const f = e.dataTransfer?.files[0];
          if (f) void handleFile(f);
        }}
      >
        <input type="file" accept={props.accept} class="hidden" id={`drop-${props.label}`} onChange={(e: Event) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) void handleFile(f);
        }} />
        <label for={`drop-${props.label}`} class="cursor-pointer">
          {isUploading.value ? (
            <div>
              <p class="text-xs text-ink-muted">Uploading… {progress.value}%</p>
              <div class="mt-2 h-1 bg-white/10 rounded-full"><div class="h-1 bg-primary rounded-full transition-all" style={{ width: `${progress.value}%` }} /></div>
            </div>
          ) : (
            <div>
              <svg class="w-6 h-6 text-ink-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <p class="text-xs text-ink-muted">{props.label} — drop or click</p>
            </div>
          )}
          {error.value && <p class="text-xs text-danger mt-1">{error.value}</p>}
        </label>
      </div>
    );
  },
});

import { defineComponent } from 'vue';

const form = ref({
  title: '',
  description: '',
  type: 'audio',
  visibility: 'published',
  status: 'draft',
  artworkUrl: '',
  mediaUrl: '',
  tags: '',
  section: '',
  publishedAt: '',
});

onMounted(async () => {
  if (!isNew.value && id.value) {
    await store.fetchOne(id.value);
    const c = store.current;
    if (c) {
      form.value = {
        title: c.title,
        description: c.description ?? '',
        type: c.type,
        visibility: c.visibility,
        status: c.status,
        artworkUrl: c.artworkUrl ?? '',
        mediaUrl: c.mediaUrl ?? '',
        tags: c.tags.join(', '),
        section: c.section ?? '',
        publishedAt: c.publishedAt ?? '',
      };
    }
  }
});

const typeOptions = [
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'playlist', label: 'Playlist' },
  { value: 'announcement', label: 'Announcement' },
];
const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];
const visibilityOptions = [
  { value: 'published', label: 'Public' },
  { value: 'draft', label: 'Private' },
];

async function onSave(overrideStatus?: string): Promise<void> {
  const tags = form.value.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const input = {
    ...form.value,
    tags,
    status: (overrideStatus ?? form.value.status) as 'draft' | 'published',
    ...(id.value ? { id: id.value } : {}),
  };
  await store.save(input);
  ui.addToast({ tone: 'success', title: isNew.value ? 'Content created' : 'Content saved' });
  void router.push('/content');
}
</script>
