<template>
  <AppPage
    title="Push Notification Studio"
    subtitle="Compose, preview, and broadcast real-time mobile push campaigns to ClaudyGod users"
  >
    <template #actions>
      <div class="flex items-center gap-2">
        <AppButton
          variant="secondary"
          size="sm"
          :loading="notifications.loading"
          @click="refreshData"
        >
          <RefreshCw class="w-4 h-4 mr-1.5" />
          Refresh Stats
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          @click="activeTab = 'compose'"
        >
          <Send class="w-4 h-4 mr-1.5" />
          New Campaign
        </AppButton>
      </div>
    </template>

    <!-- Top KPI Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <AppStatCard
        label="Total Push Tokens"
        :value="notifications.stats.activePushTokens"
        caption="All reachable mobile devices"
        icon-bg="bg-primary/15 text-primary"
      >
        <template #icon><Smartphone class="w-5 h-5" /></template>
      </AppStatCard>

      <AppStatCard
        label="Member Devices"
        :value="notifications.stats.registeredUserTokens"
        caption="Signed-in registered users"
        icon-bg="bg-success/15 text-success"
      >
        <template #icon><Users class="w-5 h-5" /></template>
      </AppStatCard>

      <AppStatCard
        label="Guest Devices"
        :value="notifications.stats.guestDeviceTokens"
        caption="Active mobile guest installs"
        icon-bg="bg-warning/15 text-warning"
      >
        <template #icon><Radio class="w-5 h-5" /></template>
      </AppStatCard>

      <AppStatCard
        label="Delivery Success"
        :value="`${notifications.stats.averageDeliveryRate}%`"
        caption="Expo push delivery acceptance"
        icon-bg="bg-indigo-500/15 text-indigo-400"
      >
        <template #icon><CheckCircle2 class="w-5 h-5" /></template>
      </AppStatCard>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-border mb-6">
      <nav class="flex gap-6">
        <button
          type="button"
          :class="[
            'pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2',
            activeTab === 'compose'
              ? 'text-primary'
              : 'text-ink-muted hover:text-ink',
          ]"
          @click="activeTab = 'compose'"
        >
          <Send class="w-4 h-4" />
          Broadcast Studio
          <span
            v-if="activeTab === 'compose'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
          />
        </button>

        <button
          type="button"
          :class="[
            'pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2',
            activeTab === 'history'
              ? 'text-primary'
              : 'text-ink-muted hover:text-ink',
          ]"
          @click="activeTab = 'history'"
        >
          <History class="w-4 h-4" />
          Campaign History & Delivery Logs
          <span
            v-if="activeTab === 'history'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
          />
        </button>
      </nav>
    </div>

    <!-- TAB 1: COMPOSE & BROADCAST -->
    <div v-if="activeTab === 'compose'" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Composer Form (7 cols) -->
      <div class="lg:col-span-7 space-y-6">
        <AppCard class="p-6 space-y-5">
          <div class="border-b border-border pb-4">
            <h2 class="text-base font-bold text-ink">Broadcast Composer</h2>
            <p class="text-xs text-ink-muted mt-0.5">
              Target your audience, select attached media, and broadcast live notifications across iOS and Android.
            </p>
          </div>

          <!-- Target Audience Pill Selector -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-ink uppercase tracking-wider">Target Audience</label>
            <div class="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                :class="[
                  'flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all',
                  form.targetAudience === 'all'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-border bg-surface-hover/40 text-ink-soft hover:bg-surface-hover',
                ]"
                @click="form.targetAudience = 'all'"
              >
                <Smartphone class="w-4 h-4 mb-1" />
                <span class="text-xs">All Devices</span>
                <span class="text-[10px] text-ink-muted font-normal mt-0.5">Guests + Members</span>
              </button>

              <button
                type="button"
                :class="[
                  'flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all',
                  form.targetAudience === 'registered'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-border bg-surface-hover/40 text-ink-soft hover:bg-surface-hover',
                ]"
                @click="form.targetAudience = 'registered'"
              >
                <Users class="w-4 h-4 mb-1" />
                <span class="text-xs">Members Only</span>
                <span class="text-[10px] text-ink-muted font-normal mt-0.5">Registered accounts</span>
              </button>

              <button
                type="button"
                :class="[
                  'flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all',
                  form.targetAudience === 'guests'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-border bg-surface-hover/40 text-ink-soft hover:bg-surface-hover',
                ]"
                @click="form.targetAudience = 'guests'"
              >
                <Radio class="w-4 h-4 mb-1" />
                <span class="text-xs">Guests Only</span>
                <span class="text-[10px] text-ink-muted font-normal mt-0.5">Installations</span>
              </button>
            </div>
          </div>

          <!-- Category Selector -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink uppercase tracking-wider">Campaign Category</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in CATEGORIES"
                :key="cat.value"
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  form.category === cat.value
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-ink-soft border-border hover:bg-surface-hover',
                ]"
                @click="form.category = cat.value"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <!-- Attach Content Card -->
          <div class="p-3.5 rounded-lg border border-border bg-surface/50 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Music class="w-4 h-4 text-primary" />
                Attach Content (Optional)
              </span>
              <button
                v-if="form.contentId"
                type="button"
                class="text-[11px] text-danger hover:underline"
                @click="clearAttachedContent"
              >
                Detach
              </button>
            </div>

            <div v-if="!form.contentId" class="flex gap-2">
              <select
                v-model="selectedContentId"
                class="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                @change="onContentSelected"
              >
                <option value="">-- Choose from published songs, videos, or messages --</option>
                <option
                  v-for="item in publishedContentOptions"
                  :key="item.id"
                  :value="item.id"
                >
                  [{{ item.type.toUpperCase() }}] {{ item.title }}
                </option>
              </select>
            </div>

            <div v-else class="flex items-center gap-3 p-2 rounded bg-surface border border-border">
              <img
                v-if="form.imageUrl"
                :src="form.imageUrl"
                alt="Artwork"
                class="w-10 h-10 rounded object-cover border border-border flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-ink truncate">{{ attachedContentTitle }}</p>
                <p class="text-[10px] text-ink-muted">Deep link: {{ form.deepLinkUrl }}</p>
              </div>
              <AppBadge tone="primary" size="sm">{{ form.contentType }}</AppBadge>
            </div>
          </div>

          <!-- Notification Title -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-semibold text-ink uppercase tracking-wider">Notification Title</label>
              <span class="text-[11px] text-ink-muted">{{ form.title.length }} / 120</span>
            </div>
            <AppInput
              v-model="form.title"
              placeholder="e.g. New Release: Wazobia Praise is Now Streaming!"
              maxlength="120"
            />
          </div>

          <!-- Notification Body -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-semibold text-ink uppercase tracking-wider">Notification Body</label>
              <span class="text-[11px] text-ink-muted">{{ form.body.length }} / 500</span>
            </div>
            <AppTextarea
              v-model="form.body"
              :rows="3"
              placeholder="e.g. Experience divine uplifting worship with ClaudyGod. Tap to play the full track in high fidelity."
              maxlength="500"
            />
          </div>

          <!-- Media Image URL -->
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-ink uppercase tracking-wider">Rich Image / Banner URL (Optional)</label>
            <AppInput
              v-model="form.imageUrl"
              placeholder="https://... image banner URL"
            />
          </div>

          <!-- Custom Deep Link URL -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink uppercase tracking-wider">Target Deep Link Route</label>
            <AppInput
              v-model="form.deepLinkUrl"
              placeholder="/player?id=... or /videos"
            />
            <div class="flex flex-wrap gap-1.5 pt-1">
              <button
                v-for="preset in ROUTE_PRESETS"
                :key="preset.route"
                type="button"
                class="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-hover border border-border text-ink-soft hover:text-ink"
                @click="form.deepLinkUrl = preset.route"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <!-- Broadcast CTA Button -->
          <div class="pt-4 border-t border-border flex items-center justify-end gap-3">
            <AppButton
              variant="secondary"
              @click="resetForm"
            >
              Reset
            </AppButton>
            <AppButton
              variant="primary"
              :loading="notifications.broadcasting"
              :disabled="!isFormValid"
              @click="handleBroadcast"
            >
              <Send class="w-4 h-4 mr-2" />
              Send Push Broadcast Now
            </AppButton>
          </div>
        </AppCard>
      </div>

      <!-- Live Realistic Smartphone Simulator (5 cols) -->
      <div class="lg:col-span-5 sticky top-6 space-y-4">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <Eye class="w-4 h-4 text-primary" />
            Live Device Preview
          </span>
          <div class="flex items-center gap-1 bg-surface-hover p-0.5 rounded-lg border border-border">
            <button
              type="button"
              :class="[
                'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
                previewPlatform === 'ios' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
              ]"
              @click="previewPlatform = 'ios'"
            >
              Apple iOS
            </button>
            <button
              type="button"
              :class="[
                'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
                previewPlatform === 'android' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
              ]"
              @click="previewPlatform = 'android'"
            >
              Android
            </button>
          </div>
        </div>

        <!-- Phone Mockup Container -->
        <div class="w-full max-w-[340px] mx-auto rounded-[38px] p-3.5 bg-neutral-900 border-[6px] border-neutral-700 shadow-2xl relative overflow-hidden text-white">
          <!-- Notch / Island -->
          <div class="w-24 h-4 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
            <div class="w-2.5 h-2.5 rounded-full bg-neutral-800 mr-2" />
            <div class="w-2 h-2 rounded-full bg-blue-900/60" />
          </div>

          <!-- Lockscreen Time / Date Header -->
          <div class="text-center mb-6">
            <p class="text-xs font-medium text-neutral-400">Tuesday, November 3</p>
            <p class="text-4xl font-light tracking-tight mt-0.5">09:41</p>
          </div>

          <!-- iOS NOTIFICATION CARD -->
          <div
            v-if="previewPlatform === 'ios'"
            class="rounded-2xl p-3.5 bg-white/15 backdrop-blur-xl border border-white/20 shadow-lg text-white space-y-2 animate-fade"
          >
            <!-- App header -->
            <div class="flex items-center justify-between text-[11px] text-white/80">
              <div class="flex items-center gap-1.5">
                <img :src="BRAND_LOGO_URL" alt="Logo" class="w-4 h-4 rounded-sm object-cover" />
                <span class="font-semibold tracking-wide uppercase text-[10px]">CLAUDYGOD</span>
              </div>
              <span class="text-[10px] text-white/60">now</span>
            </div>

            <!-- Content row -->
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold leading-snug line-clamp-2 text-white">
                  {{ form.title || 'Notification Title Preview' }}
                </p>
                <p class="text-[11px] text-white/80 leading-normal line-clamp-3 mt-0.5">
                  {{ form.body || 'Your notification message excerpt will appear here when delivered to user lockscreens.' }}
                </p>
              </div>
              <img
                v-if="form.imageUrl"
                :src="form.imageUrl"
                alt="Artwork"
                class="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/20 shadow-sm"
              />
            </div>
          </div>

          <!-- ANDROID NOTIFICATION CARD -->
          <div
            v-else
            class="rounded-xl p-3 bg-neutral-800/90 border border-neutral-700 shadow-md text-white space-y-2 animate-fade"
          >
            <div class="flex items-center justify-between text-[11px] text-neutral-400">
              <div class="flex items-center gap-1.5">
                <img :src="BRAND_LOGO_URL" alt="Logo" class="w-3.5 h-3.5 rounded-sm" />
                <span class="font-medium text-[10px]">ClaudyGod · now</span>
              </div>
              <ChevronDown class="w-3 h-3 text-neutral-400" />
            </div>

            <div class="flex items-start gap-2.5">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-neutral-100 line-clamp-1">
                  {{ form.title || 'Notification Title Preview' }}
                </p>
                <p class="text-[11px] text-neutral-300 leading-normal line-clamp-3 mt-0.5">
                  {{ form.body || 'Your notification message excerpt will appear here on Android status drawers.' }}
                </p>
              </div>
              <img
                v-if="form.imageUrl"
                :src="form.imageUrl"
                alt="Artwork"
                class="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-neutral-700"
              />
            </div>

            <div class="pt-2 border-t border-neutral-700/60 flex items-center justify-end gap-3 text-[11px]">
              <span class="text-primary font-medium">OPEN IN APP</span>
              <span class="text-neutral-400">DISMISS</span>
            </div>
          </div>

          <!-- Bottom Lockscreen Shortcuts -->
          <div class="mt-8 flex items-center justify-between px-3 pb-2 text-white/50">
            <div class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <Flashlight class="w-4 h-4" />
            </div>
            <div class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <Camera class="w-4 h-4" />
            </div>
          </div>

          <!-- Home indicator bar -->
          <div class="w-28 h-1 bg-white/40 rounded-full mx-auto mt-2" />
        </div>
      </div>
    </div>

    <!-- TAB 2: CAMPAIGN HISTORY & DELIVERY LOGS -->
    <div v-else class="space-y-4">
      <AppCard class="p-0 overflow-hidden">
        <div class="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-ink">Dispatched Push Campaigns</h3>
            <p class="text-xs text-ink-muted">Historical delivery metrics and engagement logs</p>
          </div>
          <AppBadge tone="primary">{{ notifications.total }} Total</AppBadge>
        </div>

        <div v-if="notifications.loading" class="p-8 text-center text-ink-muted text-xs">
          Loading campaign history...
        </div>

        <div v-else-if="notifications.campaigns.length === 0" class="p-12 text-center">
          <AppEmptyState
            title="No campaigns sent yet"
            description="Use the Broadcast Studio to dispatch your first push notification campaign."
          />
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-surface-hover/60 border-b border-border text-ink-muted font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3 px-4">Campaign Title & Content</th>
                <th class="py-3 px-3">Category</th>
                <th class="py-3 px-3">Target</th>
                <th class="py-3 px-3 text-right">Attempted</th>
                <th class="py-3 px-3 text-right">Accepted</th>
                <th class="py-3 px-3 text-right">Invalid Pruned</th>
                <th class="py-3 px-4">Dispatched At</th>
                <th class="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="c in notifications.campaigns"
                :key="c.id"
                class="hover:bg-surface-hover/30 transition-colors"
              >
                <td class="py-3 px-4 max-w-xs">
                  <p class="font-bold text-ink truncate">{{ c.title }}</p>
                  <p class="text-[11px] text-ink-muted truncate mt-0.5">{{ c.body }}</p>
                  <div v-if="c.contentTitle" class="flex items-center gap-1.5 mt-1 text-[10px] text-primary">
                    <Music class="w-3 h-3" />
                    <span class="truncate">{{ c.contentTitle }}</span>
                  </div>
                </td>
                <td class="py-3 px-3">
                  <AppBadge size="sm">{{ formatCategory(c.category) }}</AppBadge>
                </td>
                <td class="py-3 px-3">
                  <span class="capitalize text-ink-soft">{{ c.targetAudience }}</span>
                </td>
                <td class="py-3 px-3 text-right font-medium text-ink tabular-nums">
                  {{ c.recipientsAttempted }}
                </td>
                <td class="py-3 px-3 text-right font-medium text-success tabular-nums">
                  {{ c.recipientsAccepted }}
                </td>
                <td class="py-3 px-3 text-right text-ink-muted tabular-nums">
                  {{ c.invalidTokensPruned }}
                </td>
                <td class="py-3 px-4 text-ink-muted whitespace-nowrap">
                  {{ formatDateTime(c.createdAt) }}
                </td>
                <td class="py-3 px-3 text-center">
                  <AppBadge tone="success" size="sm">Delivered</AppBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="notifications.total > 20" class="p-3 border-t border-border flex justify-end">
          <AppPagination
            :total="notifications.total"
            :page="notifications.currentPage"
            :page-size="20"
            @update:page="(p: number) => notifications.fetchCampaigns(p)"
          />
        </div>
      </AppCard>
    </div>
  </AppPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Send, History, RefreshCw, Smartphone, Users, Radio, CheckCircle2,
  Music, Eye, Flashlight, Camera, ChevronDown,
} from 'lucide-vue-next';
import { useNotificationsStore, type BroadcastPayload } from '@/stores/notifications.store';
import { useContentStore } from '@/stores/content.store';
import { useUiStore } from '@/stores/ui.store';
import { BRAND_LOGO_URL } from '@/utils/constants';

import AppPage from '@/components/ui/AppPage.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppStatCard from '@/components/ui/AppStatCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';

const notifications = useNotificationsStore();
const contentStore = useContentStore();
const ui = useUiStore();

const activeTab = ref<'compose' | 'history'>('compose');
const previewPlatform = ref<'ios' | 'android'>('ios');
const selectedContentId = ref('');

const CATEGORIES = [
  { value: 'new_release', label: 'New Release' },
  { value: 'ministry_update', label: 'Ministry Update' },
  { value: 'live_service', label: 'Live Service' },
  { value: 'daily_devotional', label: 'Daily Scripture' },
  { value: 'announcement', label: 'Announcement' },
] as const;

const ROUTE_PRESETS = [
  { label: 'Player (/player)', route: '/player' },
  { label: 'Videos (/videos)', route: '/videos' },
  { label: 'Live Stream (/live)', route: '/live' },
  { label: 'Daily Word (/word)', route: '/word' },
  { label: 'Ministry Giving (/donate)', route: '/donate' },
];

const form = ref<BroadcastPayload>({
  title: '',
  body: '',
  category: 'new_release',
  contentId: null,
  contentType: null,
  targetAudience: 'all',
  imageUrl: '',
  deepLinkUrl: '/home',
});

const isFormValid = computed(() => {
  return form.value.title.trim().length >= 2 && form.value.body.trim().length >= 2;
});

const publishedContentOptions = computed(() => {
  return contentStore.items.filter((item) => item.visibility === 'published');
});

const attachedContentTitle = computed(() => {
  if (!form.value.contentId) return '';
  const item = contentStore.items.find((i) => i.id === form.value.contentId);
  return item?.title || 'Selected content';
});

function onContentSelected() {
  const item = contentStore.items.find((i) => i.id === selectedContentId.value);
  if (!item) return;

  form.value.contentId = item.id;
  form.value.contentType = item.type;
  form.value.title = `New Release: ${item.title}`;
  form.value.body = item.description ? item.description.slice(0, 140) : `Listen to ${item.title} now on ClaudyGod.`;
  form.value.imageUrl = item.thumbnailUrl ?? '';
  form.value.category = 'new_release';

  if (item.type === 'video') {
    form.value.deepLinkUrl = `/videos?itemId=${item.id}`;
  } else {
    form.value.deepLinkUrl = `/player?id=${item.id}`;
  }
}

function clearAttachedContent() {
  selectedContentId.value = '';
  form.value.contentId = null;
  form.value.contentType = null;
}

function resetForm() {
  clearAttachedContent();
  form.value = {
    title: '',
    body: '',
    category: 'new_release',
    contentId: null,
    contentType: null,
    targetAudience: 'all',
    imageUrl: '',
    deepLinkUrl: '/home',
  };
}

async function handleBroadcast() {
  if (!isFormValid.value) return;

  try {
    const result = await notifications.sendBroadcast(form.value);
    ui.addToast({
      tone: 'success',
      title: 'Broadcast dispatched',
      message: `Push notification sent to ${result.accepted} recipient(s)!`,
    });
    resetForm();
    activeTab.value = 'history';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Broadcast failed';
    ui.addToast({
      tone: 'danger',
      title: 'Broadcast failed',
      message: msg,
    });
  }
}

async function refreshData() {
  await Promise.all([
    notifications.fetchStats(),
    notifications.fetchCampaigns(1),
    contentStore.fetchContent(),
  ]);
}

function formatCategory(cat: string): string {
  const found = CATEGORIES.find((c) => c.value === cat);
  return found?.label || cat;
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

onMounted(() => {
  void notifications.fetchStats();
  void notifications.fetchCampaigns(1);
  void contentStore.fetchContent();
});
</script>
