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
          <AppButton size="sm" :loading="loadingVideos" @click="loadVideos">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </template>
            Load videos
          </AppButton>
        </div>
      </AppCard>

      <!-- Not configured notice -->
      <AppCard v-if="!syncStatus?.channelId" class="p-6 text-center space-y-2">
        <p class="text-sm font-semibold text-ink">YouTube not configured</p>
        <p class="text-xs text-ink-muted">Add <code class="bg-white/8 px-1.5 py-0.5 rounded text-primary-soft">YOUTUBE_API_KEY</code> and <code class="bg-white/8 px-1.5 py-0.5 rounded text-primary-soft">YOUTUBE_CHANNEL_ID</code> to your server environment, then redeploy.</p>
      </AppCard>

      <!-- Video grid -->
      <div v-else-if="videos.length" class="space-y-4">
        <!-- Selected banner -->
        <div v-if="selected.size" class="flex items-center justify-between gap-4 p-3 bg-primary/10 border border-primary/20 rounded-xl">
          <p class="text-sm font-semibold text-primary-soft">{{ selected.size }} video{{ selected.size > 1 ? 's' : '' }} selected</p>
          <AppButton size="sm" :loading="importing" @click="importSelected">
            Import to content
          </AppButton>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="video in videos"
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

              <!-- Section assignment (shown when selected) -->
              <div v-if="selected.has(video.youtubeVideoId)" class="space-y-1.5 pt-1" @click.stop>
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
      </div>

      <AppCard v-else-if="!loadingVideos && syncStatus?.channelId" class="p-6 text-center">
        <p class="text-sm text-ink-muted">Click "Load videos" to fetch your channel's latest videos.</p>
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
          <AppTable :columns="columns" :rows="importQueue as Record<string, unknown>[]" :loading="isLoading">
            <template #cell-status="{ value }">
              <StatusBadge :status="String(value)" />
            </template>
            <template #cell-importedAt="{ value }">
              <span class="text-xs text-ink-muted">{{ value ? formatDate(String(value)) : '—' }}</span>
            </template>
          </AppTable>
        </AppCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSyncStatus, triggerSync, listImportQueue, fetchChannelVideos, importVideos } from '@/api/youtube';
import { useUiStore } from '@/stores/ui.store';
import type { YouTubeSyncStatus, YouTubeImportItem, YouTubeVideoItem } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppTable from '@/components/ui/AppTable.vue';
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

const syncStatus   = ref<YouTubeSyncStatus | null>(null);
const importQueue  = ref<YouTubeImportItem[]>([]);
const videos       = ref<YouTubeVideoItem[]>([]);
const selected     = ref(new Set<string>());
const videoSections = ref<Record<string, string[]>>({});

const isLoading    = ref(false);
const loadingVideos = ref(false);
const syncing      = ref(false);
const importing    = ref(false);

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

async function loadVideos(): Promise<void> {
  loadingVideos.value = true;
  try {
    const result = await fetchChannelVideos({ maxResults: 24 });
    videos.value = result.items ?? [];
    // Pre-populate sections from suggestions
    for (const v of videos.value) {
      if (!videoSections.value[v.youtubeVideoId]) {
        videoSections.value[v.youtubeVideoId] = [...v.suggestedAppSections];
      }
    }
  } catch (e) {
    ui.addToast({ tone: 'error', title: 'Failed to load videos', message: e instanceof Error ? e.message : undefined });
  } finally {
    loadingVideos.value = false;
  }
}

function toggleSelect(videoId: string): void {
  if (selected.value.has(videoId)) {
    selected.value.delete(videoId);
  } else {
    selected.value.add(videoId);
  }
  // Trigger reactivity
  selected.value = new Set(selected.value);
}

function getSections(videoId: string): string[] {
  return videoSections.value[videoId] ?? [];
}

function toggleVideoSection(videoId: string, section: string): void {
  const current = videoSections.value[videoId] ?? [];
  const idx = current.indexOf(section);
  videoSections.value[videoId] = idx === -1 ? [...current, section] : current.filter((s) => s !== section);
}

async function importSelected(): Promise<void> {
  if (!selected.value.size) return;
  importing.value = true;
  try {
    const selections = Array.from(selected.value).map((id) => ({
      youtubeVideoId: id,
      appSections: videoSections.value[id] ?? [],
      visibility: 'published',
    }));
    const { imported } = await importVideos(selections);
    ui.addToast({ tone: 'success', title: `${imported} video${imported !== 1 ? 's' : ''} imported to content` });
    selected.value = new Set();
    try {
      importQueue.value = await listImportQueue();
    } catch {
      // Queue refresh is non-fatal — content was already imported successfully
    }
  } catch (e) {
    ui.addToast({ tone: 'error', title: 'Import failed', message: e instanceof Error ? e.message : undefined });
  } finally {
    importing.value = false;
  }
}

async function triggerSyncAll(): Promise<void> {
  syncing.value = true;
  try {
    const { queued } = await triggerSync();
    ui.addToast({ tone: 'success', title: `Sync started — ${queued} videos queued` });
    syncStatus.value = await getSyncStatus();
  } catch (e) {
    ui.addToast({ tone: 'error', title: 'Sync failed', message: e instanceof Error ? e.message : undefined });
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
