<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <RouterLink to="/content" class="p-2 rounded-xl hover:bg-surface-hover text-ink-muted transition-base">
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
                  <img :src="resolveThumbnail(form.thumbnailUrl)" alt="Artwork" loading="lazy" referrerpolicy="no-referrer" class="w-full h-full object-cover" />
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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-border/60 mt-1">
            <AppInput v-model="form.channelName" label="Channel / artist" placeholder="ClaudyGod Music" hint="Shown on the mobile content card" class="mt-3" />
            <AppInput v-model="form.duration" label="Duration" placeholder="4:32" hint="Manually-uploaded content doesn't auto-detect this" class="mt-3" />
          </div>
        </AppCard>

        <!-- Release & Premiere Schedule (Spotify / Apple Music style) -->
        <AppCard class="p-5 space-y-4">
          <SectionHeading icon="media" label="Release & Premiere Schedule" />
          <p class="text-xs text-ink-muted">
            Configure release timing for music, messages, or videos. Upcoming releases showcase as premiere cards on mobile with countdowns and trailer video previews.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-medium text-ink-muted mb-1.5">Release Status</p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  :class="[
                    'flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center',
                    !isUpcomingRelease
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-sm'
                      : 'bg-surface border-border text-ink-muted hover:border-border-hover'
                  ]"
                  @click="isUpcomingRelease = false"
                >
                  ● Out Now
                </button>
                <button
                  type="button"
                  :class="[
                    'flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center',
                    isUpcomingRelease
                      ? 'bg-primary/20 border-primary text-primary-soft shadow-sm'
                      : 'bg-surface border-border text-ink-muted hover:border-border-hover'
                  ]"
                  @click="isUpcomingRelease = true"
                >
                  ★ Scheduled Premiere
                </button>
              </div>
            </div>

            <AppInput
              v-model="releaseDateInput"
              type="date"
              label="Release date"
              hint="Date of official premiere or release"
            />
          </div>

          <div class="space-y-1.5 pt-2 border-t border-border/60">
            <AppInput
              v-model="trailerUrlInput"
              label="Trailer / Teaser Video URL"
              placeholder="https://www.youtube.com/watch?v=... or direct video link"
              hint="Short video teaser shown to listeners before release or on the Latest Release spotlight card"
            />
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-border/60">
            <div>
              <p class="text-xs font-medium text-ink-muted">Spotlight in Latest Releases</p>
              <p class="text-[11px] text-ink-muted leading-snug mt-0.5">
                Automatically feature this item in the mobile app's dedicated Latest Release shelf.
              </p>
            </div>
            <AppToggle v-model="featureInLatestReleases" />
          </div>
        </AppCard>

        <!-- Advanced -->
        <AppCard class="p-5 space-y-3">
          <SectionHeading icon="info" label="Advanced" />
          <AppTextarea
            v-model="form.metadata"
            label="Custom metadata (JSON)"
            placeholder="{}"
            :rows="4"
            hint="Optional structured data for custom mobile/admin logic. Leave blank if not needed."
          />
          <p v-if="metadataError" class="text-[11px] text-danger">{{ metadataError }}</p>
        </AppCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <AppCard class="p-5 space-y-4">
          <SectionHeading icon="publish" label="Publishing" />
          <AppSelect v-model="form.visibility" label="Visibility" :options="visibilityOptions" />

          <div class="flex items-center justify-between pt-1 border-t border-border/60 mt-1">
            <div class="pt-3">
              <p class="text-xs font-medium text-ink-muted">Feature on Home screen</p>
              <p class="text-[11px] text-ink-muted leading-snug mt-0.5">
                Shown as the main hero on the mobile Home tab. If more than one item is
                featured, the most recently updated one wins.
              </p>
            </div>
            <AppToggle v-model="form.isFeatured" class="mt-3" />
          </div>

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
                v-for="s in compatibleSectionOptions"
                :key="s.value"
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1',
                  form.appSections.includes(s.value)
                    ? 'bg-primary/20 border-primary/40 text-primary-soft'
                    : 'bg-surface-hover border-border text-ink-muted hover:border-primary/30 hover:text-ink',
                ]"
                @click="toggleSection(s.value)"
              >
                {{ s.label }}
                <span v-if="s.screens.length" class="opacity-60">· {{ s.screens.join(', ') }}</span>
                <span v-if="form.appSections.includes(s.value)" class="text-primary-soft/70">×</span>
              </button>
            </div>

            <!-- Incompatible / Invalid assignments (always visible with one-click removal) -->
            <div v-if="invalidSections.length" class="p-3 rounded-xl border border-danger/30 bg-danger/10 space-y-2 mt-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-danger">Incompatible section assignments:</span>
                <button
                  type="button"
                  class="text-[11px] font-medium text-danger hover:underline cursor-pointer"
                  @click="clearInvalidSections"
                >
                  Remove all invalid
                </button>
              </div>
              <p class="text-[11px] text-danger/80 leading-snug">
                These sections are not in your mobile layout or do not accept {{ form.type }} content. Click to remove them:
              </p>
              <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  v-for="invalidId in invalidSections"
                  :key="invalidId"
                  type="button"
                  class="px-2.5 py-1 rounded-full text-xs font-medium border bg-danger/20 border-danger/40 text-danger hover:bg-danger/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Click to remove this section"
                  @click="removeSection(invalidId)"
                >
                  {{ invalidId }}
                  <span class="font-bold text-sm leading-none">&times;</span>
                </button>
              </div>
            </div>

            <p v-if="compatibleSectionOptions.length === 0 && configStore.appConfig" class="text-[11px] text-danger">
              No configured section accepts {{ form.type }} content. Create or update a compatible layout section before publishing.
            </p>
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
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContentStore } from '@/stores/content.store';
import { useConfigStore } from '@/stores/config.store';
import { useUiStore } from '@/stores/ui.store';
import { API_URL } from '@/api/client';
import type { ContentCreateInput, ContentUpdateInput } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
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

function resolveThumbnail(url: string | null | undefined): string {
  if (!url) return '';
  const match = url.match(/(?:vi\/|vi%2F|v=|\/v\/)([a-zA-Z0-9_-]{11})/);
  if (match?.[1] && (url.includes('i.ytimg.com') || url.includes('youtube.com'))) {
    return `${API_URL}/v1/youtube/thumbnail/${match[1]}?src=${encodeURIComponent(url)}`;
  }
  return url;
}

const DEFAULT_SYSTEM_SECTIONS: Array<{ value: string; label: string; screens: string[]; contentTypes: string[] }> = [
  { value: 'home-featured', label: 'Featured / For You', screens: ['Home'], contentTypes: ['audio', 'video', 'live', 'playlist', 'announcement'] },
  { value: 'latest-releases', label: 'Latest Releases & Premieres', screens: ['Home', 'Music'], contentTypes: ['audio', 'video', 'playlist'] },
  { value: 'music-featured', label: 'Featured Worship & Praise', screens: ['Player', 'Home'], contentTypes: ['audio', 'video', 'playlist'] },
  { value: 'video-featured', label: 'Featured Videos & Messages', screens: ['Videos'], contentTypes: ['video', 'live'] },
  { value: 'library-saved', label: 'Library Saved', screens: ['Library'], contentTypes: ['audio', 'video', 'playlist', 'live'] },
];

const configuredSectionOptions = computed(() => {
  const byId = new Map<string, { value: string; label: string; screens: string[]; contentTypes: string[] }>();
  for (const sys of DEFAULT_SYSTEM_SECTIONS) {
    byId.set(sys.value, { ...sys, screens: [...sys.screens], contentTypes: [...sys.contentTypes] });
  }

  const layout = configStore.appConfig?.layout;
  if (layout) {
    for (const group of LAYOUT_GROUPS) {
      for (const section of layout[group.key] ?? []) {
        const existing = byId.get(section.id);
        if (existing) {
          if (!existing.screens.includes(group.label)) {
            existing.screens.push(group.label);
          }
          existing.contentTypes = [...new Set([...existing.contentTypes, ...section.contentTypes])];
          if (section.title) existing.label = section.title;
        } else {
          byId.set(section.id, { value: section.id, label: section.title, screens: [group.label], contentTypes: [...section.contentTypes] });
        }
      }
    }
  }

  // Ensure music-featured always accepts video (worship ministrations & gospel music videos)
  const music = byId.get('music-featured');
  if (music && !music.contentTypes.includes('video')) {
    music.contentTypes.push('video');
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
  channelName: string;
  duration: string;
  tags: string;
  appSections: string[];
  visibility: 'draft' | 'published';
  isFeatured: boolean;
  metadata: string;
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
  channelName: '',
  duration: '',
  tags: '',
  appSections: [],
  visibility: 'draft',
  isFeatured: false,
  metadata: '',
});

const LEGACY_SECTION_ALIASES: Record<string, string> = {
  'claudygod-music': 'music-featured',
  'claudygod-messages': 'video-featured',
  'claudygod-nuggets-of-truth': 'video-featured',
  music: 'music-featured',
  videos: 'video-featured',
  home: 'home-featured',
};

const form = ref<FormState>(emptyForm());
const metadataError = ref('');

const isUpcomingRelease = ref(false);
const releaseDateInput = ref('');
const trailerUrlInput = ref('');
const featureInLatestReleases = ref(false);

const compatibleSectionOptions = computed(() =>
  configuredSectionOptions.value.filter((section) => section.contentTypes.includes(form.value.type)),
);

const invalidSections = computed(() => {
  if (configStore.isLoading && !configStore.appConfig) {
    return []; // Avoid false alarm flashes while layout config is actively loading
  }
  const compatibleIds = new Set(compatibleSectionOptions.value.map((section) => section.value));
  return form.value.appSections.filter((sectionId) => {
    const canonical = LEGACY_SECTION_ALIASES[sectionId] ?? sectionId;
    return !compatibleIds.has(canonical);
  });
});

const assignmentError = computed(() => {
  return invalidSections.value.length
    ? `Remove invalid or incompatible section assignments: ${invalidSections.value.join(', ')}`
    : '';
});

function toggleSection(value: string): void {
  const canonical = LEGACY_SECTION_ALIASES[value] ?? value;
  const idx = form.value.appSections.findIndex((s) => (LEGACY_SECTION_ALIASES[s] ?? s) === canonical);
  if (idx === -1) {
    form.value.appSections.push(canonical);
  } else {
    form.value.appSections.splice(idx, 1);
  }
}

function removeSection(value: string): void {
  const canonical = LEGACY_SECTION_ALIASES[value] ?? value;
  const idx = form.value.appSections.findIndex((s) => (LEGACY_SECTION_ALIASES[s] ?? s) === canonical);
  if (idx !== -1) {
    form.value.appSections.splice(idx, 1);
  }
}

function clearInvalidSections(): void {
  const compatibleIds = new Set(compatibleSectionOptions.value.map((section) => section.value));
  form.value.appSections = form.value.appSections
    .map((s) => LEGACY_SECTION_ALIASES[s] ?? s)
    .filter((sectionId) => compatibleIds.has(sectionId));
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
      const rawSections = c.appSections ?? [];
      const migratedSections = rawSections.map((s) => LEGACY_SECTION_ALIASES[s] || s);
      form.value = {
        title: c.title,
        description: c.description ?? '',
        type: c.type as FormState['type'],
        url: c.url ?? '',
        thumbnailUrl: c.thumbnailUrl ?? '',
        mediaUploadSessionId: undefined,
        thumbnailUploadSessionId: undefined,
        sourceKind: c.sourceKind === 'upload' ? 'upload' : 'external',
        channelName: c.channelName ?? '',
        duration: c.duration ?? '',
        tags: c.tags.join(', '),
        appSections: [...new Set(migratedSections)],
        visibility: c.visibility,
        isFeatured: c.isFeatured ?? false,
        metadata: c.metadata && Object.keys(c.metadata).length ? JSON.stringify(c.metadata, null, 2) : '',
      };
      if (c.metadata && typeof c.metadata === 'object') {
        const meta = c.metadata as Record<string, unknown>;
        if (typeof meta.isUpcoming === 'boolean') isUpcomingRelease.value = meta.isUpcoming;
        if (typeof meta.releaseDate === 'string') releaseDateInput.value = meta.releaseDate;
        if (typeof meta.trailerUrl === 'string') trailerUrlInput.value = meta.trailerUrl;
      }
      featureInLatestReleases.value = form.value.appSections.includes('latest-releases');
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
  if (assignmentError.value) {
    const compatibleIds = new Set(compatibleSectionOptions.value.map((section) => section.value));
    const validSections = form.value.appSections.filter((sectionId) => compatibleIds.has(sectionId));
    if (validSections.length > 0 || (overrideVisibility ?? form.value.visibility) === 'draft') {
      const removed = invalidSections.value.join(', ');
      form.value.appSections = validSections;
      ui.addToast({
        tone: 'info',
        title: 'Removed incompatible section assignments',
        message: `Removed: ${removed}`,
      });
    } else {
      ui.addToast({ tone: 'danger', title: 'Fix app section assignments', message: assignmentError.value });
      return;
    }
  }
  if ((overrideVisibility ?? form.value.visibility) === 'published' && form.value.appSections.length === 0) {
    ui.addToast({ tone: 'danger', title: 'Choose at least one compatible app section before publishing' });
    return;
  }
  if (requiresUrl && !form.value.url?.trim()) {
    ui.addToast({ tone: 'danger', title: 'A media URL or uploaded file is required for audio/video' });
    return;
  }
  if (requiresUrl && form.value.sourceKind === 'upload' && !form.value.thumbnailUrl?.trim()) {
    ui.addToast({ tone: 'danger', title: 'A thumbnail is required for uploaded audio/video' });
    return;
  }

  metadataError.value = '';
  let metadata: Record<string, unknown> | undefined;
  if (form.value.metadata.trim()) {
    try {
      const parsed = JSON.parse(form.value.metadata);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Metadata must be a JSON object, e.g. {"key": "value"}');
      }
      metadata = parsed as Record<string, unknown>;
    } catch (e) {
      metadataError.value = e instanceof Error ? e.message : 'Invalid JSON';
      ui.addToast({ tone: 'danger', title: 'Custom metadata is not valid JSON' });
      return;
    }
  }

  if (isUpcomingRelease.value || releaseDateInput.value.trim() || trailerUrlInput.value.trim()) {
    if (!metadata) metadata = {};
    if (isUpcomingRelease.value) {
      metadata.isUpcoming = true;
    } else {
      delete metadata.isUpcoming;
    }
    if (releaseDateInput.value.trim()) {
      metadata.releaseDate = releaseDateInput.value.trim();
    } else {
      delete metadata.releaseDate;
    }
    if (trailerUrlInput.value.trim()) {
      metadata.trailerUrl = trailerUrlInput.value.trim();
    } else {
      delete metadata.trailerUrl;
    }
    if (Object.keys(metadata).length === 0) {
      metadata = undefined;
    }
  }

  if (featureInLatestReleases.value && !form.value.appSections.includes('latest-releases')) {
    form.value.appSections.push('latest-releases');
  } else if (!featureInLatestReleases.value && form.value.appSections.includes('latest-releases')) {
    form.value.appSections = form.value.appSections.filter((s) => s !== 'latest-releases');
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
    channelName: form.value.channelName.trim() || undefined,
    duration: form.value.duration.trim() || undefined,
    appSections: form.value.appSections,
    tags,
    visibility,
    isFeatured: form.value.isFeatured,
    metadata,
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
