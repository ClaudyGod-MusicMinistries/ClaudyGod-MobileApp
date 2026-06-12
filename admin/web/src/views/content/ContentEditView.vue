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
  const status = (overrideStatus ?? form.value.status) as 'draft' | 'published';
  const base = { title: form.value.title, description: form.value.description, type: form.value.type as ContentCreateInput['type'], visibility: form.value.visibility, artworkUrl: form.value.artworkUrl, mediaUrl: form.value.mediaUrl, section: form.value.section, publishedAt: form.value.publishedAt || undefined, tags, status };
  if (id.value) {
    const input: ContentUpdateInput = { ...base, id: id.value };
    await store.save(input);
  } else {
    const input: ContentCreateInput = base;
    await store.save(input);
  }
  ui.addToast({ tone: 'success', title: isNew.value ? 'Content created' : 'Content saved' });
  void router.push('/content');
}
</script>
