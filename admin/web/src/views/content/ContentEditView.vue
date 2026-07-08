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
          <FileDropzone label="Upload media file" accept="audio/*,video/*" @uploaded="form.mediaUrl = $event" />
        </AppCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Publishing</h3>
          <AppSelect v-model="form.status" label="Status" :options="statusOptions" />
          <AppInput v-model="form.publishedAt" label="Publish date" type="datetime-local" />

          <!-- App sections multi-select -->
          <div class="space-y-2">
            <p class="text-xs font-medium text-ink-muted">App sections</p>
            <p class="text-[11px] text-ink-muted">Controls which section of the app this content appears in.</p>
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

const form = ref({
  title: '',
  description: '',
  type: 'audio',
  visibility: 'published',
  status: 'draft',
  artworkUrl: '',
  mediaUrl: '',
  tags: '',
  appSections: [] as string[],
  publishedAt: '',
});

function toggleSection(value: string): void {
  const idx = form.value.appSections.indexOf(value);
  if (idx === -1) {
    form.value.appSections.push(value);
  } else {
    form.value.appSections.splice(idx, 1);
  }
}

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
        appSections: (c as unknown as { appSections?: string[] }).appSections ?? [],
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
  if (!form.value.title?.trim()) {
    ui.addToast({ tone: 'error', title: 'Title is required' });
    return;
  }
  if (!form.value.type) {
    ui.addToast({ tone: 'error', title: 'Content type is required' });
    return;
  }

  const tags = form.value.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const status = (overrideStatus ?? form.value.status) as 'draft' | 'published';
  const base = {
    title: form.value.title.trim(),
    description: form.value.description,
    type: form.value.type as ContentCreateInput['type'],
    visibility: form.value.visibility,
    artworkUrl: form.value.artworkUrl,
    mediaUrl: form.value.mediaUrl,
    appSections: form.value.appSections,
    publishedAt: form.value.publishedAt || undefined,
    tags,
    status,
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
