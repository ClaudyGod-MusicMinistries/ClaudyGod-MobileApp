<template>
  <div class="max-w-4xl mx-auto space-y-6">
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
          <AppTextarea v-model="form.description" label="Description" placeholder="Describe this content…" :rows="3" required />
          <AppSelect v-model="form.type" label="Content type" :options="typeOptions" required />
          <AppInput v-model="form.tags" label="Tags" placeholder="worship, prayer (comma-separated)" hint="Separate tags with commas" />
        </AppCard>

        <!-- Artwork -->
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Artwork</h3>
          <div v-if="form.thumbnailUrl" class="relative">
            <img :src="form.thumbnailUrl" alt="Artwork" class="w-32 h-32 rounded-xl object-cover border border-border" />
            <AppButton variant="ghost" size="xs" class="mt-2 text-danger" @click="form.thumbnailUrl = ''; form.thumbnailUploadSessionId = undefined">Remove</AppButton>
          </div>
          <FileDropzone label="Upload artwork" accept="image/*" @uploaded="onThumbnailUploaded" />
        </AppCard>

        <!-- Media -->
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Media</h3>
          <AppInput v-model="form.url" label="Media URL" placeholder="https://…" hint="Or upload a file below" @update:model-value="onUrlTyped" />
          <FileDropzone label="Upload media file" accept="audio/*,video/*" @uploaded="onMediaUploaded" />
        </AppCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Publishing</h3>
          <AppSelect v-model="form.visibility" label="Visibility" :options="visibilityOptions" />

          <!-- App sections multi-select -->
          <div class="space-y-2">
            <p class="text-xs font-medium text-ink-muted">App sections</p>
            <p class="text-[11px] text-ink-muted">
              Controls which mobile section this content appears in — must match a section's name in
              Mobile config → Layout sections exactly (case-insensitive).
            </p>

            <!-- Currently applied tags, including free-typed ones not in the quick-pick list -->
            <div v-if="form.appSections.length" class="flex flex-wrap gap-2 pt-1">
              <span
                v-for="tag in form.appSections"
                :key="tag"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 border border-primary/40 text-primary-soft"
              >
                {{ tag }}
                <button type="button" class="hover:text-danger" @click="toggleSection(tag)">×</button>
              </span>
            </div>

            <!-- Quick picks -->
            <div class="flex flex-wrap gap-2 pt-1">
              <button
                v-for="s in SECTION_OPTIONS"
                :key="s.value"
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  form.appSections.includes(s.value)
                    ? 'bg-primary/20 border-primary/40 text-primary-soft'
                    : 'bg-white/4 border-border text-ink-muted hover:border-primary/30 hover:text-ink',
                ]"
                @click="toggleSection(s.value)"
              >
                {{ s.label }}
              </button>
            </div>

            <!-- Free-text add -->
            <div class="flex gap-2 pt-1">
              <AppInput
                v-model="newSectionTag"
                placeholder="Type a section name and press Enter"
                class="flex-1"
                @keydown.enter.prevent="addSectionTag"
              />
              <AppButton variant="secondary" size="sm" @click="addSectionTag">Add</AppButton>
            </div>
            <p v-if="sectionTagError" class="text-[11px] text-danger">{{ sectionTagError }}</p>
          </div>
        </AppCard>

        <div class="sticky bottom-6 space-y-2">
          <AppButton full-width :loading="store.isSaving" @click="onSave('published')">Publish</AppButton>
          <AppButton full-width variant="secondary" :loading="store.isSaving" @click="onSave('draft')">Save draft</AppButton>
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
import type { ContentCreateInput, ContentUpdateInput } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppButton from '@/components/ui/AppButton.vue';
import FileDropzone from '@/components/shared/FileDropzone.vue';

const route = useRoute();
const router = useRouter();
const store = useContentStore();
const ui = useUiStore();

const isNew = computed(() => route.name === 'content-new');
const id = computed(() => isNew.value ? null : route.params.id as string);

const SECTION_OPTIONS = [
  { value: 'video',            label: 'Videos' },
  { value: 'music',            label: 'Music' },
  { value: 'audio',            label: 'Audio' },
  { value: 'live',             label: 'Live' },
  { value: 'nuggets-of-truth', label: 'Nuggets of Truth' },
  { value: 'teachings',        label: 'Teachings' },
  { value: 'teens',            label: 'Teens' },
  { value: 'speaks',           label: 'Speaks' },
  { value: 'playlist',         label: 'Playlists' },
  { value: 'announcement',     label: 'Announcements' },
];

interface FormState {
  title: string;
  description: string;
  type: 'audio' | 'video' | 'playlist' | 'announcement';
  url: string;
  thumbnailUrl: string;
  mediaUploadSessionId: string | undefined;
  thumbnailUploadSessionId: string | undefined;
  sourceKind: 'upload' | 'external';
  tags: string;
  appSections: string[];
  visibility: 'draft' | 'published';
}

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  type: 'audio',
  url: '',
  thumbnailUrl: '',
  mediaUploadSessionId: undefined,
  thumbnailUploadSessionId: undefined,
  sourceKind: 'upload',
  tags: '',
  appSections: [],
  visibility: 'draft',
});

const form = ref<FormState>(emptyForm());

function toggleSection(value: string): void {
  const idx = form.value.appSections.indexOf(value);
  if (idx === -1) {
    form.value.appSections.push(value);
  } else {
    form.value.appSections.splice(idx, 1);
  }
}

const newSectionTag = ref('');
const sectionTagError = ref('');

function addSectionTag(): void {
  const value = newSectionTag.value.trim();
  sectionTagError.value = '';
  if (!value) return;
  if (value.length < 2 || value.length > 80) {
    sectionTagError.value = 'Section names must be 2-80 characters';
    return;
  }
  if (form.value.appSections.some((s) => s.toLowerCase() === value.toLowerCase())) {
    newSectionTag.value = '';
    return;
  }
  form.value.appSections.push(value);
  newSectionTag.value = '';
}

function onMediaUploaded(payload: { url: string; sessionId: string }): void {
  form.value.url = payload.url;
  form.value.mediaUploadSessionId = payload.sessionId;
  form.value.sourceKind = 'upload';
}

function onThumbnailUploaded(payload: { url: string; sessionId: string }): void {
  form.value.thumbnailUrl = payload.url;
  form.value.thumbnailUploadSessionId = payload.sessionId;
}

// A manually-typed URL isn't backed by an upload session — mark it external so the
// backend doesn't expect a session that was never created.
function onUrlTyped(): void {
  form.value.sourceKind = 'external';
  form.value.mediaUploadSessionId = undefined;
}

onMounted(async () => {
  if (!isNew.value && id.value) {
    await store.fetchOne(id.value);
    const c = store.current;
    if (c) {
      form.value = {
        title: c.title,
        description: c.description ?? '',
        type: c.type as FormState['type'],
        url: c.url ?? '',
        thumbnailUrl: c.thumbnailUrl ?? '',
        mediaUploadSessionId: undefined,
        thumbnailUploadSessionId: undefined,
        sourceKind: c.sourceKind === 'upload' ? 'upload' : 'external',
        tags: c.tags.join(', '),
        appSections: c.appSections ?? [],
        visibility: c.visibility,
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
const visibilityOptions = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

async function onSave(overrideVisibility?: 'draft' | 'published'): Promise<void> {
  if (!form.value.title?.trim()) {
    ui.addToast({ tone: 'error', title: 'Title is required' });
    return;
  }
  if (!form.value.description?.trim()) {
    ui.addToast({ tone: 'error', title: 'Description is required' });
    return;
  }
  const requiresUrl = form.value.type === 'audio' || form.value.type === 'video';
  if (requiresUrl && !form.value.url?.trim()) {
    ui.addToast({ tone: 'error', title: 'A media URL or uploaded file is required for audio/video' });
    return;
  }
  if (requiresUrl && form.value.sourceKind === 'upload' && !form.value.thumbnailUrl?.trim()) {
    ui.addToast({ tone: 'error', title: 'A thumbnail is required for uploaded audio/video' });
    return;
  }

  const tags = form.value.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const visibility = overrideVisibility ?? form.value.visibility;
  const base = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    type: form.value.type,
    url: form.value.url || undefined,
    thumbnailUrl: form.value.thumbnailUrl || undefined,
    mediaUploadSessionId: form.value.mediaUploadSessionId,
    thumbnailUploadSessionId: form.value.thumbnailUploadSessionId,
    sourceKind: form.value.sourceKind,
    appSections: form.value.appSections,
    tags,
    visibility,
  };

  try {
    if (id.value) {
      const input: ContentUpdateInput = { ...base, id: id.value };
      await store.save(input);
    } else {
      const input: ContentCreateInput = base;
      await store.save(input);
    }
    ui.addToast({ tone: 'success', title: isNew.value ? 'Content created' : 'Content saved' });
    void router.push('/content');
  } catch (e) {
    ui.addToast({
      tone: 'error',
      title: 'Save failed',
      message: e instanceof Error ? e.message : 'An unexpected error occurred',
    });
  }
}
</script>
