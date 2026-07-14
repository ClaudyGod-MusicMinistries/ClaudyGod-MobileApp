<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <RouterLink to="/content" class="p-2 rounded-xl hover:bg-white/8 text-ink-muted transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </RouterLink>
        <div class="flex items-center gap-2.5">
          <h2 class="text-base font-bold text-ink">{{ isNew ? 'New content' : 'Edit content' }}</h2>
          <span v-if="!isNew" :class="['px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide', form.visibility === 'published' ? 'bg-success/12 text-success' : 'bg-amber/12 text-amber']">
            {{ form.visibility }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="store.saveError" class="text-xs text-danger">{{ store.saveError }}</div>
        <AppButton variant="secondary" size="sm" @click="previewOpen = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </template>
          Preview
        </AppButton>
      </div>
    </div>

    <MobilePreviewPanel v-model="previewOpen" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main form -->
      <div class="lg:col-span-2 space-y-5">
        <AppCard class="p-5 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2">
              <AppInput v-model="form.title" label="Title" placeholder="Content title" required />
            </div>
            <AppSelect v-model="form.type" label="Content type" :options="typeOptions" required />
          </div>
          <AppTextarea v-model="form.description" label="Description" placeholder="Describe this content…" :rows="3" required />
          <AppInput v-model="form.tags" label="Tags" placeholder="worship, prayer (comma-separated)" hint="Separate tags with commas" />
        </AppCard>

        <!-- Media & artwork -->
        <AppCard class="p-5 space-y-4">
          <SectionHeading icon="media" label="Media & artwork" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Artwork -->
            <div class="space-y-2">
              <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Thumbnail</p>
              <div v-if="form.thumbnailUrl" class="relative group">
                <div class="aspect-square w-full max-w-[220px] rounded-2xl overflow-hidden border border-border bg-bg-1">
                  <img :src="form.thumbnailUrl" alt="Artwork" class="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  class="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove artwork"
                  @click="form.thumbnailUrl = ''; form.thumbnailUploadSessionId = undefined"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <FileDropzone v-else label="Upload artwork" accept="image/*" @uploaded="onThumbnailUploaded" />
            </div>

            <!-- Media -->
            <div class="space-y-3">
              <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Media file</p>
              <AppInput v-model="form.url" placeholder="https://…" hint="Or upload a file below" @update:model-value="onUrlTyped" />
              <FileDropzone label="Upload media file" accept="audio/*,video/*" @uploaded="onMediaUploaded" />
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <AppCard class="p-5 space-y-4">
          <SectionHeading icon="publish" label="Publishing" />
          <AppSelect v-model="form.visibility" label="Visibility" :options="visibilityOptions" />

          <!-- App sections -->
          <div class="space-y-2 pt-1 border-t border-border/60">
            <p class="text-xs font-medium text-ink-muted pt-3">App sections</p>
            <p class="text-[11px] text-ink-muted leading-snug">
              Controls which mobile section this content appears in. Pick from the sections
              actually configured under Mobile config → Layout sections — the app will show
              this content there automatically.
            </p>
            <p v-if="!configStore.appConfig" class="text-[11px] text-ink-muted italic">Loading configured sections…</p>

            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                v-for="s in sectionPills"
                :key="s.value"
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1',
                  form.appSections.includes(s.value)
                    ? 'bg-primary/20 border-primary/40 text-primary-soft'
                    : 'bg-white/4 border-border text-ink-muted hover:border-primary/30 hover:text-ink',
                ]"
                @click="toggleSection(s.value)"
              >
                {{ s.label }}
                <span v-if="s.screens.length" class="opacity-60">· {{ s.screens.join(', ') }}</span>
                <span v-if="form.appSections.includes(s.value)" class="text-primary-soft/70">×</span>
              </button>

              <!-- Inline custom-tag add -->
              <button
                v-if="!addingCustomTag"
                type="button"
                class="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-ink-muted hover:border-primary/40 hover:text-primary-soft transition-colors"
                @click="startAddingCustomTag"
              >
                + Custom
              </button>
              <input
                v-else
                ref="customTagInputRef"
                v-model="newSectionTag"
                type="text"
                placeholder="Section name…"
                class="px-3 py-1.5 rounded-full text-xs font-medium bg-white/4 border border-primary/40 text-ink placeholder:text-ink-muted focus:outline-none w-32"
                @keydown.enter.prevent="addSectionTag"
                @blur="addSectionTag"
              />
            </div>
            <p v-if="sectionTagError" class="text-[11px] text-danger">{{ sectionTagError }}</p>
          </div>
        </AppCard>

        <div class="sticky bottom-6 space-y-2 bg-bg-2/80 backdrop-blur-sm rounded-2xl p-1.5 -m-1.5">
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
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContentStore } from '@/stores/content.store';
import { useConfigStore } from '@/stores/config.store';
import { useUiStore } from '@/stores/ui.store';
import type { ContentCreateInput, ContentUpdateInput } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppButton from '@/components/ui/AppButton.vue';
import FileDropzone from '@/components/shared/FileDropzone.vue';
import MobilePreviewPanel from '@/components/shared/MobilePreviewPanel.vue';
import SectionHeading from '@/components/shared/SectionHeading.vue';

const route = useRoute();
const router = useRouter();
const store = useContentStore();
const configStore = useConfigStore();
const ui = useUiStore();

const isNew = computed(() => route.name === 'content-new');
const id = computed(() => isNew.value ? null : route.params.id as string);
const previewOpen = ref(false);

// The only real source of truth for "what sections exist" is the mobile
// config's own Layout sections (config store) — not a hand-maintained list
// here. A hardcoded list previously let this picker drift out of sync with
// whatever sections MobileConfigView actually defines, which was the root
// cause of content landing in the wrong (or no) section on mobile.
const LAYOUT_GROUPS: { key: 'homeSections' | 'videoSections' | 'playerSections' | 'librarySections'; label: string }[] = [
  { key: 'homeSections', label: 'Home' },
  { key: 'videoSections', label: 'Videos' },
  { key: 'playerSections', label: 'Player' },
  { key: 'librarySections', label: 'Library' },
];

const configuredSectionOptions = computed(() => {
  const byId = new Map<string, { value: string; label: string; screens: string[] }>();
  const layout = configStore.appConfig?.layout;
  if (layout) {
    for (const group of LAYOUT_GROUPS) {
      for (const section of layout[group.key] ?? []) {
        const existing = byId.get(section.id);
        if (existing) {
          existing.screens.push(group.label);
        } else {
          byId.set(section.id, { value: section.id, label: section.title, screens: [group.label] });
        }
      }
    }
  }
  return [...byId.values()];
});

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

// One flowing picker: the real configured sections plus any free-typed section
// names already on this item, all toggled the same way — no separate
// "applied tags" row duplicating what's already shown as a selected pill.
const sectionPills = computed(() => {
  const known = new Set(configuredSectionOptions.value.map((s) => s.value));
  const custom = form.value.appSections
    .filter((tag) => !known.has(tag))
    .map((tag) => ({ value: tag, label: tag, screens: [] as string[] }));
  return [...configuredSectionOptions.value, ...custom];
});

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
const addingCustomTag = ref(false);
const customTagInputRef = ref<HTMLInputElement | null>(null);

async function startAddingCustomTag(): Promise<void> {
  addingCustomTag.value = true;
  await nextTick();
  customTagInputRef.value?.focus();
}

function addSectionTag(): void {
  const value = newSectionTag.value.trim();
  sectionTagError.value = '';
  if (!value) {
    addingCustomTag.value = false;
    return;
  }
  if (value.length < 2 || value.length > 80) {
    sectionTagError.value = 'Section names must be 2-80 characters';
    return;
  }
  if (!form.value.appSections.some((s) => s.toLowerCase() === value.toLowerCase())) {
    form.value.appSections.push(value);
  }
  newSectionTag.value = '';
  addingCustomTag.value = false;
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
  if (!configStore.appConfig) {
    void configStore.fetchAppConfig();
  }

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
    ui.addToast({ tone: 'danger', title: 'Title is required' });
    return;
  }
  if (!form.value.description?.trim()) {
    ui.addToast({ tone: 'danger', title: 'Description is required' });
    return;
  }
  const requiresUrl = form.value.type === 'audio' || form.value.type === 'video';
  if (requiresUrl && !form.value.url?.trim()) {
    ui.addToast({ tone: 'danger', title: 'A media URL or uploaded file is required for audio/video' });
    return;
  }
  if (requiresUrl && form.value.sourceKind === 'upload' && !form.value.thumbnailUrl?.trim()) {
    ui.addToast({ tone: 'danger', title: 'A thumbnail is required for uploaded audio/video' });
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
      tone: 'danger',
      title: 'Save failed',
      message: e instanceof Error ? e.message : 'An unexpected error occurred',
    });
  }
}
</script>
