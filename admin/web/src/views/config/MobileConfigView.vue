<template>
  <div class="space-y-5">
    <PageHeader icon="config" title="Mobile app config">
      <AppButton variant="secondary" size="sm" @click="previewOpen = true">Preview</AppButton>
      <AppButton :loading="store.isSaving" @click="onSave">Save changes</AppButton>
    </PageHeader>

    <MobilePreviewPanel v-model="previewOpen" />

    <div v-if="store.isLoading" class="flex items-center justify-center py-20">
      <AppSpinner size="lg" />
    </div>

    <template v-else-if="config">
      <!-- Tabs -->
      <div class="flex gap-2 border-b border-border pb-0">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="[
            'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
            activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink',
          ]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Layout Sections -->
      <div v-if="activeTab === 'layout'" class="space-y-6">
        <!-- Header -->
        <AppCard class="p-4 space-y-3">
          <div>
            <h3 class="text-sm font-bold text-ink">Landing header</h3>
            <p class="text-xs text-ink-muted">Shown on the Home tab when there's no featured or live item to highlight.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppInput v-model="config.hero.fallbackTitle" label="Title" placeholder="Start your worship stream" />
            <AppInput v-model="config.hero.fallbackSubtitle" label="Subtitle" placeholder="Music, videos, and live moments." />
          </div>
        </AppCard>

        <p class="text-xs text-ink-muted">
          Sections control what shows up on each mobile tab. Content appears in a section once it's tagged
          with that section's name under Content → App sections.
        </p>

        <div v-for="group in MOBILE_LAYOUT_GROUPS" :key="group.key" class="space-y-3">
          <div>
            <h3 class="text-sm font-bold text-ink">{{ group.title }}</h3>
            <p class="text-xs text-ink-muted">{{ group.description }}</p>
          </div>

          <div class="space-y-3">
            <AppCard
              v-for="(section, idx) in config.layout[group.key]"
              :key="section.id"
              class="p-4 space-y-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AppInput v-model="section.title" label="Title" placeholder="e.g. Nuggets of Truth" />
                  <AppInput v-model="section.subtitle" label="Subtitle" placeholder="Short description shown under the title" />
                </div>
                <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeSection(group.key, idx)">Remove</AppButton>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  v-for="ct in MOBILE_CONTENT_TYPE_OPTIONS"
                  :key="ct"
                  type="button"
                  :class="[
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    section.contentTypes.includes(ct)
                      ? 'bg-primary/20 border-primary/40 text-primary-soft'
                      : 'bg-white/4 border-border text-ink-muted hover:border-primary/30 hover:text-ink',
                  ]"
                  @click="toggleContentType(section, ct)"
                >
                  {{ ct }}
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <AppInput v-model="section.actionLabel" label="Action label" placeholder="Open" />
                <AppSelect v-model="section.destinationTab" label="Destination tab" :options="MOBILE_TAB_DESTINATION_OPTIONS_ARR" />
                <AppInput v-model.number="section.maxItems" type="number" label="Max items" min="1" max="24" />
              </div>

              <p class="text-[11px] text-ink-muted">
                Tag content into this section with: <span class="font-mono text-ink">{{ section.title || section.id }}</span>
              </p>
            </AppCard>

            <AppButton variant="secondary" size="sm" @click="addSection(group.key)">+ Add section</AppButton>
          </div>
        </div>
      </div>

      <!-- Discovery Config -->
      <div v-if="activeTab === 'discovery'" class="space-y-4">
        <AppCard class="p-5 space-y-3">
          <h3 class="text-sm font-bold text-ink">Categories</h3>
          <p class="text-xs text-ink-muted">Comma-separated list of content types shown in search filters.</p>
          <AppInput v-model="categoriesText" label="Categories" placeholder="audio, video, live, playlist" />
        </AppCard>
        <AppCard class="p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-ink">Quick shortcuts</h3>
            <AppButton variant="secondary" size="xs" @click="addShortcut">+ Add</AppButton>
          </div>
          <div class="space-y-3">
            <div v-for="(sc, i) in config.discovery.shortcuts" :key="sc.id" class="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:items-end">
              <AppInput v-model="sc.icon" label="Icon" placeholder="travel-explore" />
              <AppInput v-model="sc.label" label="Label" placeholder="Worship" />
              <AppInput v-model="sc.query" label="Query" placeholder="worship" />
              <AppSelect v-model="sc.category" label="Category" :options="DISCOVERY_CATEGORY_OPTIONS_ARR" />
              <AppButton variant="ghost" size="sm" class="text-danger mb-0" @click="removeShortcut(i)">Remove</AppButton>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Settings Hub -->
      <div v-if="activeTab === 'settings'" class="space-y-4">
        <p class="text-xs text-ink-muted">
          Controls the "Quick access" link groups shown on the mobile Settings tab.
        </p>

        <div v-for="(section, sIdx) in config.settingsHub.sections" :key="section.id" class="space-y-3">
          <AppCard class="p-4 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <AppInput v-model="section.title" label="Section title" class="flex-1" placeholder="e.g. Quick access" />
              <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeSettingsHubSection(sIdx)">Remove section</AppButton>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, iIdx) in section.items"
                :key="item.id"
                class="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:items-end border-t border-border/60 pt-3 first:border-t-0 first:pt-0"
              >
                <AppInput v-model="item.icon" label="Icon" placeholder="library-music" />
                <AppInput v-model="item.label" label="Label" placeholder="Library" />
                <AppInput v-model="item.hint" label="Hint" placeholder="Saved content" />
                <AppSelect v-model="item.destination" label="Destination" :options="SETTINGS_DESTINATION_OPTIONS_ARR" />
                <AppButton variant="ghost" size="sm" class="text-danger mb-0" @click="removeSettingsHubItem(sIdx, iIdx)">Remove</AppButton>
              </div>
            </div>
            <AppButton variant="secondary" size="xs" @click="addSettingsHubItem(sIdx)">+ Add link</AppButton>
          </AppCard>
        </div>
        <AppButton variant="secondary" size="sm" @click="addSettingsHubSection">+ Add section</AppButton>
      </div>

      <!-- Referral program -->
      <div v-if="activeTab === 'referral'" class="space-y-6">
        <div class="space-y-3">
          <div>
            <h3 class="text-sm font-bold text-ink">How it works</h3>
            <p class="text-xs text-ink-muted">Steps shown on the mobile Invite Friends screen.</p>
          </div>
          <div class="space-y-3">
            <AppCard v-for="(step, idx) in config.referral.howItWorks" :key="idx" class="p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <AppInput v-model="step.icon" label="Icon" placeholder="share" />
                  <AppInput v-model="step.title" label="Title" class="sm:col-span-2" placeholder="Share your link" />
                </div>
                <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeReferralStep(idx)">Remove</AppButton>
              </div>
              <AppTextarea v-model="step.body" label="Description" :rows="2" placeholder="Send your unique referral link to friends and family." />
            </AppCard>
            <AppButton variant="secondary" size="sm" @click="addReferralStep">+ Add step</AppButton>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <h3 class="text-sm font-bold text-ink">Reward tiers</h3>
            <p class="text-xs text-ink-muted">Milestones shown as a user's referral count grows.</p>
          </div>
          <div class="space-y-3">
            <AppCard v-for="(tier, idx) in config.referral.rewardTiers" :key="idx" class="p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <AppInput v-model="tier.icon" label="Icon" placeholder="workspace-premium" />
                  <AppInput v-model.number="tier.threshold" type="number" label="Referrals needed" min="1" />
                  <AppInput v-model="tier.reward" label="Reward" placeholder="Premium member badge" />
                </div>
                <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeReferralTier(idx)">Remove</AppButton>
              </div>
            </AppCard>
            <AppButton variant="secondary" size="sm" @click="addReferralTier">+ Add tier</AppButton>
          </div>
        </div>
      </div>

      <!-- Giving quotes -->
      <div v-if="activeTab === 'giving'" class="space-y-4">
        <AppCard class="p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Giving page quotes</h3>
              <p class="text-xs text-ink-muted">Scripture quotes shown (one per day, rotating) on the mobile Donate screen.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addScripture">+ Add</AppButton>
          </div>
          <div class="space-y-2">
            <div v-for="(_, i) in config.donate.scriptures" :key="i" class="flex gap-2 items-start">
              <AppTextarea v-model="config.donate.scriptures[i]" :rows="2" class="flex-1" placeholder='"Give, and it will be given to you." — Luke 6:38' />
              <AppButton variant="ghost" size="sm" class="text-danger" @click="removeScripture(i)">Remove</AppButton>
            </div>
          </div>
          <p class="text-[11px] text-ink-muted">Other giving settings (methods, plans, currencies) aren't editable here yet.</p>
        </AppCard>
      </div>

      <!-- Ad placements -->
      <div v-if="activeTab === 'ads'" class="space-y-3">
        <div v-for="(placement, i) in config.monetization.placements" :key="placement.id">
          <AppCard class="p-4 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AppInput v-model="placement.title" label="Title" placeholder="Sponsored placement" />
                <AppSelect v-model="placement.screen" label="Screen" :options="AD_PLACEMENT_SCREEN_OPTIONS_ARR" />
              </div>
              <div class="flex items-center justify-between sm:justify-start gap-3 shrink-0">
                <AppToggle v-model="config.monetization.placements[i].enabled" />
                <AppButton variant="ghost" size="xs" class="text-danger" @click="removePlacement(i)">Remove</AppButton>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput v-model="placement.subtitle" label="Subtitle" placeholder="Promoted slot inside the mobile app experience." />
              <AppInput v-model.number="placement.maxItems" type="number" label="Max items" min="1" max="8" />
            </div>
          </AppCard>
        </div>
        <AppButton variant="secondary" size="sm" @click="addPlacement">+ Add placement</AppButton>
      </div>
    </template>

    <AppEmptyState v-else-if="store.error" :title="store.error" message="Check your connection and try again.">
      <template #action><AppButton size="sm" @click="store.fetchAppConfig()">Retry</AppButton></template>
    </AppEmptyState>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConfigStore } from '@/stores/config.store';
import { useUiStore } from '@/stores/ui.store';
import type { AppConfig, MobileContentType, MobileLayoutSection, SettingsHubItem, ReferralStep, ReferralRewardTier } from '@/api/types';
import {
  MOBILE_CONTENT_TYPE_OPTIONS,
  MOBILE_TAB_DESTINATION_OPTIONS,
  DISCOVERY_CATEGORY_OPTIONS,
  AD_PLACEMENT_SCREEN_OPTIONS,
  SETTINGS_DESTINATION_OPTIONS,
  MOBILE_LAYOUT_GROUPS,
  cloneMobileConfig,
  createLayoutSection,
  createDiscoveryShortcut,
  createAdPlacement,
  createSettingsHubSection,
  createSettingsHubItem,
  createReferralStep,
  createReferralTier,
} from '@/utils/mobileConfig';
import AppCard from '@/components/ui/AppCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import MobilePreviewPanel from '@/components/shared/MobilePreviewPanel.vue';
import PageHeader from '@/components/shared/PageHeader.vue';

const store = useConfigStore();
const ui = useUiStore();
const activeTab = ref('layout');
const previewOpen = ref(false);

const tabs = [
  { id: 'layout', label: 'Layout sections' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'settings', label: 'Settings hub' },
  { id: 'referral', label: 'Referral' },
  { id: 'giving', label: 'Giving quotes' },
  { id: 'ads', label: 'Ad placements' },
];

const MOBILE_TAB_DESTINATION_OPTIONS_ARR = MOBILE_TAB_DESTINATION_OPTIONS.map((o) => ({ ...o }));
const DISCOVERY_CATEGORY_OPTIONS_ARR = DISCOVERY_CATEGORY_OPTIONS.map((v) => ({ value: v, label: v }));
const AD_PLACEMENT_SCREEN_OPTIONS_ARR = AD_PLACEMENT_SCREEN_OPTIONS.map((o) => ({ ...o }));
const SETTINGS_DESTINATION_OPTIONS_ARR = SETTINGS_DESTINATION_OPTIONS.map((o) => ({ ...o }));

// Editable deep clone of the full config — round-tripped in full on save since the
// backend requires the entire object (privacy/help/about/donate-core/rate/navigation/
// intelligence aren't editable here yet, they're just held and sent back unchanged;
// donate.scriptures and referral are the exception — those have their own tabs below).
const config = ref<AppConfig | null>(null);

const categoriesText = computed({
  get: () => config.value?.discovery.categories.join(', ') ?? '',
  set: (v: string) => {
    if (config.value) {
      config.value.discovery.categories = v.split(',').map((c) => c.trim()).filter(Boolean) as AppConfig['discovery']['categories'];
    }
  },
});

onMounted(async () => {
  await store.fetchAppConfig();
  if (store.appConfig) config.value = cloneMobileConfig(store.appConfig);
});

async function onSave(): Promise<void> {
  if (!config.value) return;
  try {
    await store.saveAppConfig(config.value);
    ui.addToast({ tone: 'success', title: 'Mobile config saved' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: e instanceof Error ? e.message : 'Save failed' });
  }
}

function addSection(groupKey: keyof AppConfig['layout']): void {
  if (!config.value) return;
  config.value.layout[groupKey].push(createLayoutSection(groupKey) as unknown as MobileLayoutSection);
}

function removeSection(groupKey: keyof AppConfig['layout'], idx: number): void {
  config.value?.layout[groupKey].splice(idx, 1);
}

function toggleContentType(section: MobileLayoutSection, ct: MobileContentType): void {
  const idx = section.contentTypes.indexOf(ct);
  if (idx === -1) {
    section.contentTypes.push(ct);
  } else if (section.contentTypes.length > 1) {
    // Schema requires at least one content type — don't let the last one be removed.
    section.contentTypes.splice(idx, 1);
  }
}

function addShortcut(): void {
  config.value?.discovery.shortcuts.push(createDiscoveryShortcut() as unknown as AppConfig['discovery']['shortcuts'][number]);
}

function removeShortcut(i: number): void {
  config.value?.discovery.shortcuts.splice(i, 1);
}

function addPlacement(): void {
  config.value?.monetization.placements.push(createAdPlacement() as unknown as AppConfig['monetization']['placements'][number]);
}

function removePlacement(i: number): void {
  config.value?.monetization.placements.splice(i, 1);
}

function addSettingsHubSection(): void {
  config.value?.settingsHub.sections.push(createSettingsHubSection() as unknown as AppConfig['settingsHub']['sections'][number]);
}

function removeSettingsHubSection(idx: number): void {
  config.value?.settingsHub.sections.splice(idx, 1);
}

function addSettingsHubItem(sectionIdx: number): void {
  config.value?.settingsHub.sections[sectionIdx]?.items.push(createSettingsHubItem() as unknown as SettingsHubItem);
}

function removeSettingsHubItem(sectionIdx: number, itemIdx: number): void {
  config.value?.settingsHub.sections[sectionIdx]?.items.splice(itemIdx, 1);
}

function addReferralStep(): void {
  config.value?.referral.howItWorks.push(createReferralStep() as unknown as ReferralStep);
}

function removeReferralStep(idx: number): void {
  config.value?.referral.howItWorks.splice(idx, 1);
}

function addReferralTier(): void {
  config.value?.referral.rewardTiers.push(createReferralTier() as unknown as ReferralRewardTier);
}

function removeReferralTier(idx: number): void {
  config.value?.referral.rewardTiers.splice(idx, 1);
}

function addScripture(): void {
  config.value?.donate.scriptures.push('');
}

function removeScripture(idx: number): void {
  config.value?.donate.scriptures.splice(idx, 1);
}
</script>
