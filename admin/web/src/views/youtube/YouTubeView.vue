<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-base font-bold text-ink">YouTube</h2>
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
    </div>

    <!-- ── TAB: Browse & Import ─────────────────────────────────────────────── -->
    <template v-if="activeTab === 'browse'">
      <!-- Channel status -->
      <AppCard class="p-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-0.5">Channel</p>
            <p class="text-sm font-bold text-ink">{{ syncStatus?.channelTitle || 'Not configured' }}</p>
            <p v-if="syncStatus?.channelId" class="text-xs text-ink-muted">{{ syncStatus.channelId }}</p>
          </div>
          <div class="flex items-center gap-2">
            <!-- Search -->
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Filter videos…"
              class="h-8 px-3 text-xs rounded-lg bg-white/6 border border-border focus:outline-none focus:border-primary/40 text-ink placeholder:text-ink-muted w-36"
            />
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
        <div v-if="selected.size" class="flex items-center justify-between gap-4 p-3 bg-primary/10 border border-primary/20 rounded-xl">
          <div class="flex items-center gap-3">
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

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="video in filteredVideos"
            :key="video.youtubeVideoId"
            :class="[
              'rounded-xl border overflow-hidden transition-all cursor-pointer',
              selected.has(video.youtubeVideoId)
                ? 'border-primary/40 ring-1 ring-primary/30'
                : 'border-border hover:border-white/20',
            ]"
            @click="toggleSelect(video.youtubeVideoId)"
          >
            <!-- Thumbnail -->
            <div class="relative aspect-video bg-surface-strong">
              <img
                v-if="video.thumbnailUrl"
                :src="video.thumbnailUrl"
                :alt="video.title"
                class="w-full h-full object-cover"
              />
              <div class="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                {{ video.duration }}
              </div>
              <div v-if="video.isLive" class="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">LIVE</div>
              <!-- Selected overlay -->
              <div v-if="selected.has(video.youtubeVideoId)" class="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              </div>
            </div>

            <!-- Info -->
            <div class="p-3 space-y-2 bg-surface">
              <p class="text-xs font-semibold text-ink line-clamp-2 leading-snug">{{ video.title }}</p>
              <p class="text-[10px] text-ink-muted">{{ formatDate(video.publishedAt) }}</p>

              <!-- Assignment controls (shown when selected) -->
              <div v-if="selected.has(video.youtubeVideoId)" class="space-y-3 pt-1" @click.stop>
                <!-- Section assignment -->
                <div class="space-y-1.5">
                  <p class="text-[10px] font-semibold text-ink-muted uppercase tracking-wide">Assign sections</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="s in SECTION_OPTIONS"
                      :key="s.value"
                      type="button"
                      :class="[
                        'px-2 py-1 rounded-full text-[10px] font-medium border transition-colors',
                        getSections(video.youtubeVideoId).includes(s.value)
                          ? 'bg-primary/20 border-primary/40 text-primary-soft'
                          : 'bg-white/4 border-border text-ink-muted hover:border-primary/30',
                      ]"
                      @click="toggleVideoSection(video.youtubeVideoId, s.value)"
                    >{{ s.label }}</button>
                  </div>
                </div>

                <!-- Visibility -->
                <div class="flex items-center justify-end gap-2 pt-0.5">
                  <select
                    :value="getVisibility(video.youtubeVideoId)"
                    class="text-[10px] font-medium bg-white/6 border border-border rounded-lg px-2 py-1 text-ink focus:outline-none cursor-pointer"
                    @click.stop
                    @change="setVisibility(video.youtubeVideoId, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <!-- Suggested sections (when not selected) -->
              <div v-else-if="video.suggestedAppSections.length" class="flex flex-wrap gap-1">
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
        <div class="flex items-start justify-between gap-6">
          <div class="space-y-1">
            <p class="text-xs font-semibold text-ink-muted uppercase tracking-wide">Channel</p>
            <p class="text-base font-bold text-ink">{{ syncStatus?.channelTitle || 'Not configured' }}</p>
            <p v-if="syncStatus?.channelId" class="text-xs text-ink-muted">{{ syncStatus.channelId }}</p>
            <p class="text-xs text-ink-muted mt-2">Last synced: {{ syncStatus?.lastSyncedAt ? formatDate(syncStatus.lastSyncedAt) : 'Never' }}</p>
            <p class="text-xs text-ink-muted">{{ syncStatus?.videoCount ?? 0 }} videos tracked</p>
          </div>
          <div class="flex flex-col items-end gap-2">
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
        <h3 class="text-sm font-bold text-ink">Import queue</h3>
        <AppCard>
          <AppResponsiveTable :columns="columns" :rows="importQueue as Record<string, unknown>[]" :loading="isLoading">
            <template #cell-status="{ value }">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getSyncStatus, triggerSync, listImportQueue, fetchChannelVideos, importVideos } from '@/api/youtube';
import { deleteContent } from '@/api/content';
import { useUiStore } from '@/stores/ui.store';
import type { YouTubeSyncStatus, YouTubeImportItem, YouTubeVideoItem } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';

const ui = useUiStore();

const TABS = [
  { id: 'browse', label: 'Browse & Import' },
  { id: 'sync',   label: 'Sync queue' },
] as const;
type Tab = typeof TABS[number]['id'];
const activeTab = ref<Tab>('browse');

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

const syncStatus    = ref<YouTubeSyncStatus | null>(null);
const importQueue   = ref<YouTubeImportItem[]>([]);
const videos        = ref<YouTubeVideoItem[]>([]);
const selected      = ref(new Set<string>());
const searchQuery   = ref('');
const globalVisibility = ref<'published' | 'draft'>('published');
const nextPageToken = ref<string | null>(null);

// Per-video state maps
const videoSections   = ref<Record<string, string[]>>({});
const videoVisibility  = ref<Record<string, string>>({});

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
  { key: 'status',     label: 'Status' },
  { key: 'importedAt', label: 'Imported', align: 'right' as const },
];

onMounted(async () => {
  isLoading.value = true;
  try {
    [syncStatus.value, importQueue.value] = await Promise.all([getSyncStatus(), listImportQueue()]);
  } finally {
    isLoading.value = false;
  }
});

function trackVideoDefaults(items: YouTubeVideoItem[]): void {
  for (const v of items) {
    if (!videoSections.value[v.youtubeVideoId]) {
      videoSections.value[v.youtubeVideoId] = [...v.suggestedAppSections];
    }
    if (videoVisibility.value[v.youtubeVideoId] === undefined) {
      videoVisibility.value[v.youtubeVideoId] = 'published';
    }
  }
}

async function loadVideos(): Promise<void> {
  loadingVideos.value = true;
  try {
    const result = await fetchChannelVideos({ maxResults: PAGE_SIZE });
    videos.value = result.items ?? [];
    nextPageToken.value = result.nextPageToken;
    trackVideoDefaults(videos.value);
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
    trackVideoDefaults(result.items ?? []);
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

function getSections(videoId: string): string[] {
  return videoSections.value[videoId] ?? [];
}

function toggleVideoSection(videoId: string, section: string): void {
  const current = videoSections.value[videoId] ?? [];
  const idx = current.indexOf(section);
  videoSections.value[videoId] = idx === -1 ? [...current, section] : current.filter((s) => s !== section);
}

function getVisibility(videoId: string): string {
  return videoVisibility.value[videoId] ?? globalVisibility.value;
}

function setVisibility(videoId: string, value: string): void {
  videoVisibility.value[videoId] = value;
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
        appSections: videoSections.value[v.youtubeVideoId] ?? [],
        tags: v.suggestedTags,
        visibility: getVisibility(v.youtubeVideoId) as 'draft' | 'published',
      }));
    const { imported } = await importVideos(selections);
    ui.addToast({
      tone: 'success',
      title: `${imported} video${imported !== 1 ? 's' : ''} imported to content`,
      message: 'Drafts are ready to edit and assign sections.',
      action: { label: 'View in Content', to: '/content' },
      duration: 8000,
    });
    selected.value = new Set();
    try {
      importQueue.value = await listImportQueue();
    } catch {
      // Queue refresh is non-fatal
    }
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Import failed', message: e instanceof Error ? e.message : undefined });
  } finally {
    importing.value = false;
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
    ui.addToast({ tone: 'success', title: `Sync started — ${queued} videos queued` });
    syncStatus.value = await getSyncStatus();
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
