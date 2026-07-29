<template>
  <AppModal v-model="open" :title="user?.displayName || user?.email || 'Member detail'" size="lg">
    <div class="space-y-5">
      <div class="flex gap-2">
        <AppButton v-for="tab in tabs" :key="tab.id" :variant="activeTab === tab.id ? 'primary' : 'secondary'" size="xs" @click="activeTab = tab.id">
          {{ tab.label }}
        </AppButton>
      </div>

      <!-- Engagement -->
      <div v-if="activeTab === 'engagement'" class="space-y-4">
        <p v-if="loadingEngagement" class="text-sm text-ink-soft">Loading engagement…</p>
        <template v-else-if="engagement">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-bg-1 border border-border p-3">
              <p class="text-xs text-ink-muted uppercase tracking-wide">Total plays</p>
              <p class="text-lg font-bold text-ink">{{ engagement.metrics.totalPlays }}</p>
            </div>
            <div class="rounded-xl bg-bg-1 border border-border p-3">
              <p class="text-xs text-ink-muted uppercase tracking-wide">Live subscriptions</p>
              <p class="text-lg font-bold text-ink">{{ engagement.metrics.liveSubscriptions }}</p>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Recently played</h3>
            <ul v-if="engagement.recentlyPlayed.length" class="space-y-1.5">
              <li v-for="item in engagement.recentlyPlayed" :key="item.id" class="text-sm text-ink flex justify-between">
                <span class="truncate">{{ item.title }}</span>
                <span class="text-xs text-ink-muted shrink-0 ml-2">{{ formatDate(item.lastPlayedAt) }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-ink-soft">No plays recorded.</p>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Most played</h3>
            <ul v-if="engagement.mostPlayed.length" class="space-y-1.5">
              <li v-for="item in engagement.mostPlayed" :key="item.id" class="text-sm text-ink flex justify-between">
                <span class="truncate">{{ item.title }}</span>
                <span class="text-xs text-ink-muted shrink-0 ml-2">{{ item.playCount }}×</span>
              </li>
            </ul>
            <p v-else class="text-sm text-ink-soft">No plays recorded.</p>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Library</h3>
            <p class="text-sm text-ink-soft">
              {{ engagement.library.liked.length }} liked · {{ engagement.library.downloaded.length }} downloaded · {{ engagement.library.playlists.length }} playlists
            </p>
          </div>
        </template>
      </div>

      <!-- Search history -->
      <div v-if="activeTab === 'search'" class="space-y-2">
        <p v-if="loadingSearchHistory" class="text-sm text-ink-soft">Loading search history…</p>
        <p v-else-if="!searchHistory.length" class="text-sm text-ink-soft">No searches recorded.</p>
        <ul v-else class="space-y-1.5">
          <li v-for="(entry, idx) in searchHistory" :key="idx" class="text-sm text-ink flex justify-between gap-2">
            <span class="truncate">{{ entry.query }}</span>
            <span class="text-xs text-ink-muted shrink-0">{{ entry.resultsCount }} results · {{ formatDate(entry.searchedAt) }}</span>
          </li>
        </ul>
      </div>

      <!-- Devices -->
      <div v-if="activeTab === 'devices'" class="space-y-2">
        <p v-if="loadingDevices" class="text-sm text-ink-soft">Loading devices…</p>
        <p v-else-if="!devices.length" class="text-sm text-ink-soft">No registered devices.</p>
        <div v-else class="space-y-2">
          <div v-for="device in devices" :key="device.id" class="flex items-center justify-between rounded-xl bg-bg-1 border border-border p-3">
            <div>
              <p class="text-sm font-medium text-ink">{{ device.deviceName || device.platform || 'Unknown device' }}</p>
              <p class="text-xs text-ink-muted">Last seen {{ formatDate(device.lastSeenAt) }}</p>
            </div>
            <AppButton variant="danger" size="xs" :disabled="revokingDeviceId === device.id" @click="onRevokeDevice(device.id)">
              Revoke
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useUiStore } from '@/stores/ui.store';
import { getUserEngagement, getUserSearchHistory, getUserDevices, revokeUserDevice } from '@/api/users';
import type { UserRecord, UserEngagementDetail, UserSearchHistoryEntry, UserDevice } from '@/api/types';

const props = defineProps<{
  modelValue: boolean;
  user: UserRecord | null;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const ui = useUiStore();
const open = ref(props.modelValue);
const activeTab = ref('engagement');

const engagement = ref<UserEngagementDetail | null>(null);
const loadingEngagement = ref(false);
const searchHistory = ref<UserSearchHistoryEntry[]>([]);
const loadingSearchHistory = ref(false);
const devices = ref<UserDevice[]>([]);
const loadingDevices = ref(false);
const revokingDeviceId = ref<string | null>(null);

watch(() => props.modelValue, (value) => {
  open.value = value;
  if (value && props.user) {
    activeTab.value = 'engagement';
    void loadAll(props.user.id);
  }
});

watch(open, (value) => emit('update:modelValue', value));

async function loadAll(userId: string): Promise<void> {
  engagement.value = null;
  searchHistory.value = [];
  devices.value = [];

  loadingEngagement.value = true;
  loadingSearchHistory.value = true;
  loadingDevices.value = true;

  try {
    engagement.value = await getUserEngagement(userId);
  } catch {
    ui.addToast({ tone: 'danger', title: 'Failed to load engagement' });
  } finally {
    loadingEngagement.value = false;
  }

  try {
    searchHistory.value = await getUserSearchHistory(userId);
  } catch {
    ui.addToast({ tone: 'danger', title: 'Failed to load search history' });
  } finally {
    loadingSearchHistory.value = false;
  }

  try {
    devices.value = await getUserDevices(userId);
  } catch {
    ui.addToast({ tone: 'danger', title: 'Failed to load devices' });
  } finally {
    loadingDevices.value = false;
  }
}

async function onRevokeDevice(deviceId: string): Promise<void> {
  if (!props.user) return;
  const ok = await ui.confirm({
    title: 'Revoke device',
    message: 'This immediately signs the device out and invalidates its session.',
    confirmLabel: 'Revoke',
  });
  if (!ok) return;

  revokingDeviceId.value = deviceId;
  try {
    await revokeUserDevice(props.user.id, deviceId);
    devices.value = devices.value.filter((d) => d.id !== deviceId);
    ui.addToast({ tone: 'success', title: 'Device revoked' });
  } catch (e) {
    ui.addToast({
      tone: 'danger',
      title: 'Failed to revoke device',
      message: e instanceof Error ? e.message : 'Please try again',
    });
  } finally {
    revokingDeviceId.value = null;
  }
}

const tabs = [
  { id: 'engagement', label: 'Engagement' },
  { id: 'search', label: 'Search history' },
  { id: 'devices', label: 'Devices' },
];

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>
