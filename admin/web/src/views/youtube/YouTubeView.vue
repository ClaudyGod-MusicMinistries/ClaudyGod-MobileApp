<template>
  <div class="space-y-6">
    <PageHeader icon="youtube" tone="youtube" title="YouTube">
      <!-- Tab bar -->
      <div class="flex gap-1 bg-white/4 rounded-xl p-1">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            activeTab === tab.id ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink',
          ]"
          @click="activeTab = tab.id"
        >{{ tab.label }}</button>
      </div>
    </PageHeader>

    <!-- ── TAB: Browse & Import ─────────────────────────────────────────────── -->
    <template v-if="activeTab === 'browse'">
      <!-- Channel status -->
      <AppCard class="p-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/25 to-red-500/5 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400 font-bold text-sm">
              {{ (syncStatus?.channelTitle || '?').charAt(0) }}
            </div>
            <div class="min-w-0">
              <p class="text-[10px] font-semibold text-ink-muted uppercase tracking-wide">Channel</p>
              <p class="text-sm font-bold text-ink truncate">{{ syncStatus?.channelTitle || 'Not configured' }}</p>
              <p v-if="syncStatus?.channelId" class="text-[11px] text-ink-muted truncate">{{ syncStatus.channelId }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <SearchInput :model-value="searchQuery" placeholder="Filter videos…" class="w-44" @update:model-value="searchQuery = $event" />
            <AppButton size="sm" :loading="loadingVideos" @click="loadVideos">
              <template #icon-left>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </template>
              Load videos
            </AppButton>
          </div>
        </div>
      </AppCard>

      <!-- Not configured notice -->
      <AppCard v-if="!syncStatus?.channelId" class="p-6 text-center space-y-2">
        <p class="text-sm font-semibold text-ink">YouTube not configured</p>
        <p class="text-xs text-ink-muted">Add <code class="bg-white/8 px-1.5 py-0.5 rounded text-primary-soft">YOUTUBE_API_KEY</code> and <code class="bg-white/8 px-1.5 py-0.5 rounded text-primary-soft">YOUTUBE_CHANNEL_ID</code> to your server environment, then redeploy.</p>
      </AppCard>

      <!-- Video grid -->
      <div v-else-if="filteredVideos.length" class="space-y-4">
        <!-- Selected banner -->
        <div v-if="selected.size" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
          <div class="flex flex-wrap items-center gap-3">
            <p class="text-sm font-semibold text-primary-soft">{{ selected.size }} video{{ selected.size > 1 ? 's' : '' }} selected</p>
            <!-- Global visibility for batch -->
            <div class="flex items-center gap-1.5 bg-white/6 border border-border rounded-lg px-2 py-1">
              <span class="text-[10px] text-ink-muted font-medium">Visibility:</span>
              <select
                v-model="globalVisibility"
                class="text-[10px] font-semibold bg-transparent text-ink focus:outline-none cursor-pointer"
                @click.stop
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <AppButton size="sm" :loading="importing" @click="importSelected">
            Import {{ selected.size }} video{{ selected.size > 1 ? 's' : '' }}
          </AppButton>
        </div>

        <!-- Select all / deselect -->
        <div class="flex items-center justify-between">
          <button
            type="button"
            class="text-[11px] text-primary-soft hover:text-primary font-medium transition-colors"
            @click="toggleSelectAll"
          >
            {{ selected.size === filteredVideos.length ? 'Deselect all' : 'Select all' }}
          </button>
          <p class="text-[11px] text-ink-muted">{{ filteredVideos.length }} video{{ filteredVideos.length !== 1 ? 's' : '' }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <div
            v-for="video in filteredVideos"
            :key="video.youtubeVideoId"
            :class="[
              'group relative rounded-2xl border bg-surface overflow-hidden shadow-panel transition-all duration-200',
              video.contentId ? '' : 'cursor-pointer',
              selected.has(video.youtubeVideoId)
                ? 'border-primary/50 ring-2 ring-primary/25'
                : 'border-border hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg',
            ]"
            @click="onCardClick(video)"
          >
            <!-- Thumbnail -->
            <div class="relative aspect-video bg-surface-strong overflow-hidden">
              <img
                v-if="video.thumbnailUrl"
                :src="video.thumbnailUrl"
                :alt="video.title"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-black/0 pointer-events-none" />

              <!-- Multi-select checkbox (only for not-yet-imported videos) -->
              <button
                v-if="!video.contentId"
                type="button"
                :class="[
                  'absolute top-2.5 left-2.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                  selected.has(video.youtubeVideoId)
                    ? 'bg-primary border-primary'
                    : 'bg-black/50 border-white/40 hover:border-white/70',
                ]"
                title="Select for bulk import"
                @click.stop="toggleSelect(video.youtubeVideoId)"
              >
                <svg v-if="selected.has(video.youtubeVideoId)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              </button>

              <!-- Top-right badges -->
              <div class="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                <span v-if="video.isLive" class="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
                  <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
                </span>
                <span
                  v-if="video.contentId"
                  :class="[
                    'inline-flex items-center gap-1 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow backdrop-blur-sm',
                    video.contentVisibility === 'published' ? 'bg-emerald-500/90' : 'bg-amber-500/90',
                  ]"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  {{ video.contentVisibility === 'published' ? 'Published' : 'Draft' }}
                </span>
              </div>

              <!-- Duration -->
              <div class="absolute bottom-2.5 right-2.5 bg-black/75 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                {{ video.duration }}
              </div>
            </div>

            <!-- Info -->
            <div class="p-3.5 space-y-2.5">
              <p class="text-xs font-semibold text-ink line-clamp-2 leading-snug">{{ video.title }}</p>
              <p class="text-[10px] text-ink-muted flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {{ formatDate(video.publishedAt) }}
              </p>

              <!-- Edit in Content (already imported) -->
              <RouterLink
                v-if="video.contentId"
                :to="`/content/${video.contentId}`"
                class="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-semibold bg-primary/12 border border-primary/30 text-primary-soft hover:bg-primary/20 transition-colors"
                @click.stop
              >
                Edit in Content
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </RouterLink>

              <!-- Send to Content prompt -->
              <button
                v-else
                type="button"
                class="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-semibold bg-white/6 border border-border text-ink hover:border-primary/40 hover:text-primary-soft transition-colors"
                @click.stop="openSendModal(video)"
              >
                Send to Content
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </button>

              <!-- Suggested sections preview (not yet imported) -->
              <div v-if="!video.contentId && video.suggestedAppSections.length" class="flex flex-wrap gap-1">
                <span
                  v-for="s in video.suggestedAppSections.slice(0, 3)"
                  :key="s"
                  class="px-1.5 py-0.5 bg-white/6 rounded text-[10px] text-ink-muted"
                >{{ s }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Load more -->
        <div v-if="nextPageToken && !searchQuery" class="flex justify-center pt-2">
          <AppButton variant="secondary" size="sm" :loading="loadingMore" @click="loadMoreVideos">
            Load more
          </AppButton>
        </div>
      </div>

      <AppCard v-else-if="!loadingVideos && syncStatus?.channelId && !searchQuery" class="p-6 text-center">
        <p class="text-sm text-ink-muted">Click "Load videos" to fetch your channel's latest videos.</p>
      </AppCard>

      <AppCard v-else-if="!loadingVideos && searchQuery && !filteredVideos.length" class="p-6 text-center">
        <p class="text-sm text-ink-muted">No videos match "{{ searchQuery }}".</p>
      </AppCard>

      <div v-if="loadingVideos" class="flex justify-center py-12">
        <AppSpinner />
      </div>
    </template>

    <!-- ── TAB: Sync & Queue ────────────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'sync'">
      <AppCard class="p-5">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div class="flex items-start gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/25 to-red-500/5 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400 font-bold text-sm">
              {{ (syncStatus?.channelTitle || '?').charAt(0) }}
            </div>
            <div class="min-w-0 space-y-1">
              <p class="text-[10px] font-semibold text-ink-muted uppercase tracking-wide">Channel</p>
              <p class="text-base font-bold text-ink truncate">{{ syncStatus?.channelTitle || 'Not configured' }}</p>
              <p v-if="syncStatus?.channelId" class="text-xs text-ink-muted truncate">{{ syncStatus.channelId }}</p>
              <p class="text-xs text-ink-muted mt-2">Last synced: {{ syncStatus?.lastSyncedAt ? formatDate(syncStatus.lastSyncedAt) : 'Never' }}</p>
              <p class="text-xs text-ink-muted">{{ syncStatus?.videoCount ?? 0 }} videos tracked</p>
            </div>
          </div>
          <div class="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
            <StatusBadge :status="syncStatus?.status ?? 'idle'" />
            <AppButton size="sm" :loading="syncing" :disabled="syncStatus?.status === 'syncing'" @click="triggerSyncAll">
              <template #icon-left>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </template>
              Sync all
            </AppButton>
          </div>
        </div>
      </AppCard>

      <div class="space-y-3">
        <SectionHeading icon="sections" label="Import queue" />
        <AppCard>
          <AppResponsiveTable :columns="columns" :rows="importQueue as Record<string, unknown>[]" :loading="isLoading">
            <template #cell-title="{ row, value }">
              <RouterLink :to="`/content/${row.id}`" class="text-sm font-medium text-ink hover:text-primary transition-colors line-clamp-1">
                {{ value }}
              </RouterLink>
            </template>
            <template #cell-visibility="{ value }">
              <StatusBadge :status="String(value)" />
            </template>
            <template #cell-importedAt="{ value }">
              <span class="text-xs text-ink-muted">{{ value ? formatDate(String(value)) : '—' }}</span>
            </template>
            <template #actions="{ row }">
              <div class="flex items-center justify-end">
                <AppButton size="xs" variant="ghost" class="text-danger" title="Delete" :loading="deletingId === row.id" @click="deleteQueueItem(row)">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </AppButton>
              </div>
            </template>
          </AppResponsiveTable>
        </AppCard>
      </div>
    </template>

    <!-- Send to Content modal -->
    <AppModal v-model="sendModalOpen" title="Send to Content" size="sm">
      <div v-if="sendModalVideo" class="space-y-4">
        <div class="flex gap-3">
          <div class="w-20 aspect-video rounded-lg overflow-hidden bg-surface-strong shrink-0">
            <img v-if="sendModalVideo.thumbnailUrl" :src="sendModalVideo.thumbnailUrl" :alt="sendModalVideo.title" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-ink line-clamp-2 leading-snug">{{ sendModalVideo.title }}</p>
            <p class="text-[11px] text-ink-muted mt-1">{{ sendModalVideo.channelTitle }} · {{ sendModalVideo.duration }}</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">App sections</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="s in SECTION_OPTIONS"
              :key="s.value"
              type="button"
              :class="[
                'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                sendModalSections.includes(s.value)
                  ? 'bg-primary/20 border-primary/40 text-primary-soft'
                  : 'bg-white/4 border-border text-ink-muted hover:border-primary/30',
              ]"
              @click="toggleSendModalSection(s.value)"
            >{{ s.label }}<span v-if="s.screens.length" class="opacity-60"> · {{ s.screens.join(', ') }}</span></button>
          </div>
        </div>

        <AppSelect v-model="sendModalVisibility" label="Visibility" :options="[{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]" />
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="closeSendModal">Cancel</AppButton>
          <AppButton size="sm" :loading="sendModalSaving" @click="confirmSendToContent">Send to Content</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getSyncStatus, triggerSync, listImportQueue, fetchChannelVideos, importVideos } from '@/api/youtube';
import { deleteContent } from '@/api/content';
import { useUiStore } from '@/stores/ui.store';
import { useConfigStore } from '@/stores/config.store';
import type { YouTubeSyncStatus, YouTubeImportItem, YouTubeVideoItem } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import SearchInput from '@/components/shared/SearchInput.vue';
import SectionHeading from '@/components/shared/SectionHeading.vue';
import PageHeader from '@/components/shared/PageHeader.vue';

const ui = useUiStore();
const configStore = useConfigStore();

const TABS = [
  { id: 'browse', label: 'Browse & Import' },
  { id: 'sync',   label: 'Sync queue' },
] as const;
type Tab = typeof TABS[number]['id'];
const activeTab = ref<Tab>('browse');

// The only real source of truth for "what sections exist" is the mobile
// config's own Layout sections (config store) — see ContentEditView.vue for
// the same fix; a hardcoded list here previously let this picker drift out of
// sync with whatever sections MobileConfigView actually defines.
const LAYOUT_GROUPS: { key: 'homeSections' | 'videoSections' | 'playerSections' | 'librarySections'; label: string }[] = [
  { key: 'homeSections', label: 'Home' },
  { key: 'videoSections', label: 'Videos' },
  { key: 'playerSections', label: 'Player' },
  { key: 'librarySections', label: 'Library' },
];

const SECTION_OPTIONS = computed(() => {
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

const syncStatus    = ref<YouTubeSyncStatus | null>(null);
const importQueue   = ref<YouTubeImportItem[]>([]);
const videos        = ref<YouTubeVideoItem[]>([]);
const selected      = ref(new Set<string>());
const searchQuery   = ref('');
const globalVisibility = ref<'published' | 'draft'>('published');
const nextPageToken = ref<string | null>(null);

// Send-to-Content modal (single-video, deliberate review before it lands in Content)
const sendModalOpen = ref(false);
const sendModalVideo = ref<YouTubeVideoItem | null>(null);
const sendModalSections = ref<string[]>([]);
const sendModalVisibility = ref<'draft' | 'published'>('published');
const sendModalSaving = ref(false);

const isLoading     = ref(false);
const loadingVideos = ref(false);
const loadingMore   = ref(false);
const syncing       = ref(false);
const importing     = ref(false);
const deletingId    = ref<string | null>(null);

const PAGE_SIZE = 20;

const filteredVideos = computed(() =>
  searchQuery.value.trim()
    ? videos.value.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )
    : videos.value,
);

const columns = [
  { key: 'title',      label: 'Video title' },
  { key: 'videoId',    label: 'Video ID' },
  { key: 'visibility', label: 'Status' },
  { key: 'importedAt', label: 'Imported', align: 'right' as const },
];

onMounted(async () => {
  if (!configStore.appConfig) {
    void configStore.fetchAppConfig();
  }

  isLoading.value = true;
  try {
    [syncStatus.value, importQueue.value] = await Promise.all([getSyncStatus(), listImportQueue()]);
  } finally {
    isLoading.value = false;
  }
});

async function loadVideos(): Promise<void> {
  loadingVideos.value = true;
  try {
    const result = await fetchChannelVideos({ maxResults: PAGE_SIZE });
    videos.value = result.items ?? [];
    nextPageToken.value = result.nextPageToken;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to load videos', message: e instanceof Error ? e.message : undefined });
  } finally {
    loadingVideos.value = false;
  }
}

async function loadMoreVideos(): Promise<void> {
  if (!nextPageToken.value) return;
  loadingMore.value = true;
  try {
    const result = await fetchChannelVideos({ maxResults: PAGE_SIZE, pageToken: nextPageToken.value });
    videos.value = [...videos.value, ...(result.items ?? [])];
    nextPageToken.value = result.nextPageToken;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to load more videos', message: e instanceof Error ? e.message : undefined });
  } finally {
    loadingMore.value = false;
  }
}

function toggleSelect(videoId: string): void {
  if (selected.value.has(videoId)) {
    selected.value.delete(videoId);
  } else {
    selected.value.add(videoId);
  }
  selected.value = new Set(selected.value);
}

function toggleSelectAll(): void {
  if (selected.value.size === filteredVideos.value.length) {
    selected.value = new Set();
  } else {
    selected.value = new Set(filteredVideos.value.map((v) => v.youtubeVideoId));
  }
}

async function importSelected(): Promise<void> {
  if (!selected.value.size) return;
  importing.value = true;
  try {
    const selections = Array.from(selected.value)
      .map((id) => videos.value.find((v) => v.youtubeVideoId === id))
      .filter((v): v is YouTubeVideoItem => Boolean(v))
      .map((v) => ({
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        description: v.description,
        channelTitle: v.channelTitle,
        publishedAt: v.publishedAt,
        thumbnailUrl: v.thumbnailUrl,
        url: v.url,
        duration: v.duration,
        isLive: v.isLive,
        appSections: v.suggestedAppSections,
        tags: v.suggestedTags,
        visibility: globalVisibility.value,
      }));
    const { imported } = await importVideos(selections);
    ui.addToast({
      tone: 'success',
      title: `${imported} video${imported !== 1 ? 's' : ''} imported to content`,
      message: 'Drafts are ready to edit and assign sections.',
      action: { label: 'View in Content', to: '/content' },
      duration: 8000,
    });
    const importedIds = new Set(selections.map((s) => s.youtubeVideoId));
    selected.value = new Set();
    try {
      importQueue.value = await listImportQueue();
      const byVideoId = new Map(importQueue.value.map((item) => [item.videoId, item]));
      videos.value = videos.value.map((v) => {
        if (!importedIds.has(v.youtubeVideoId)) return v;
        const created = byVideoId.get(v.youtubeVideoId);
        return created ? { ...v, contentId: created.id, contentVisibility: created.visibility } : v;
      });
    } catch {
      // Queue refresh is non-fatal
    }
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Import failed', message: e instanceof Error ? e.message : undefined });
  } finally {
    importing.value = false;
  }
}

function onCardClick(video: YouTubeVideoItem): void {
  if (video.contentId) return; // already in Content — use the explicit "Edit in Content" link instead
  openSendModal(video);
}

function openSendModal(video: YouTubeVideoItem): void {
  sendModalVideo.value = video;
  sendModalSections.value = [...video.suggestedAppSections];
  sendModalVisibility.value = 'published';
  sendModalOpen.value = true;
}

function closeSendModal(): void {
  sendModalOpen.value = false;
  sendModalVideo.value = null;
}

function toggleSendModalSection(value: string): void {
  const idx = sendModalSections.value.indexOf(value);
  if (idx === -1) {
    sendModalSections.value.push(value);
  } else {
    sendModalSections.value.splice(idx, 1);
  }
}

async function confirmSendToContent(): Promise<void> {
  const video = sendModalVideo.value;
  if (!video) return;
  sendModalSaving.value = true;
  try {
    await importVideos([{
      youtubeVideoId: video.youtubeVideoId,
      title: video.title,
      description: video.description,
      channelTitle: video.channelTitle,
      publishedAt: video.publishedAt,
      thumbnailUrl: video.thumbnailUrl,
      url: video.url,
      duration: video.duration,
      isLive: video.isLive,
      appSections: sendModalSections.value,
      tags: video.suggestedTags,
      visibility: sendModalVisibility.value,
    }]);
    ui.addToast({
      tone: 'success',
      title: 'Sent to Content',
      action: { label: 'View in Content', to: '/content' },
    });
    try {
      importQueue.value = await listImportQueue();
      const created = importQueue.value.find((item) => item.videoId === video.youtubeVideoId);
      const idx = videos.value.findIndex((v) => v.youtubeVideoId === video.youtubeVideoId);
      if (created && idx !== -1) {
        videos.value[idx] = { ...videos.value[idx]!, contentId: created.id, contentVisibility: created.visibility };
      }
    } catch {
      // Non-fatal — the badge will just catch up on the next full reload.
    }
    closeSendModal();
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to send to Content', message: e instanceof Error ? e.message : undefined });
  } finally {
    sendModalSaving.value = false;
  }
}

async function deleteQueueItem(row: Record<string, unknown>): Promise<void> {
  const ok = await ui.confirm({
    title: 'Delete imported video',
    message: `Delete "${row.title}"? It will be moved to Trash and can be restored later.`,
    tone: 'danger',
    confirmLabel: 'Delete',
  });
  if (!ok) return;
  deletingId.value = row.id as string;
  try {
    await deleteContent(row.id as string);
    importQueue.value = importQueue.value.filter((item) => item.id !== row.id);
    videos.value = videos.value.map((v) => (v.contentId === row.id ? { ...v, contentId: null, contentVisibility: null } : v));
    ui.addToast({ tone: 'success', title: 'Moved to Trash' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Delete failed', message: e instanceof Error ? e.message : undefined });
  } finally {
    deletingId.value = null;
  }
}

async function triggerSyncAll(): Promise<void> {
  syncing.value = true;
  try {
    const { queued } = await triggerSync();
    ui.addToast({ tone: 'success', title: `Synced ${queued} video${queued !== 1 ? 's' : ''} to Content` });
    syncStatus.value = await getSyncStatus();
    try {
      importQueue.value = await listImportQueue();
    } catch {
      // Queue refresh is non-fatal
    }
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Sync failed', message: e instanceof Error ? e.message : undefined });
  } finally {
    syncing.value = false;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
