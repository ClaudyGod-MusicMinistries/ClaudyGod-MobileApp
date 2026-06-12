<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-bold text-ink">Mobile app config</h2>
      <AppButton :loading="store.isSaving" @click="onSave">Save changes</AppButton>
    </div>

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
      <div v-if="activeTab === 'layout'" class="space-y-3">
        <p class="text-xs text-ink-muted">Drag to reorder. Toggle visibility to show/hide sections in the app.</p>
        <div class="space-y-2">
          <AppCard
            v-for="(section, idx) in config.layout.sections"
            :key="section.id"
            class="p-4 flex items-center gap-4"
          >
            <div class="text-ink-muted cursor-move">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink">{{ section.label }}</p>
              <p class="text-xs text-ink-muted">{{ section.type }}</p>
            </div>
            <AppToggle v-model="config.layout.sections[idx].visible" />
          </AppCard>
        </div>
        <AppButton variant="secondary" size="sm" @click="addSection">+ Add section</AppButton>
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
            <div v-for="(sc, i) in config.discovery.shortcuts" :key="sc.id" class="grid grid-cols-3 gap-2 items-end">
              <AppInput v-model="config.discovery.shortcuts[i].label" label="Label" placeholder="Worship" />
              <AppInput v-model="config.discovery.shortcuts[i].query" label="Query" placeholder="worship" />
              <AppButton variant="ghost" size="sm" class="text-danger mb-0" @click="removeShortcut(i)">Remove</AppButton>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Settings Hub placeholder -->
      <div v-if="activeTab === 'settings'" class="space-y-3">
        <AppCard class="p-5">
          <p class="text-sm text-ink-soft">Settings hub configuration: {{ config.settingsHub.sections.length }} sections</p>
          <p class="text-xs text-ink-muted mt-1">Full editor coming in next build iteration.</p>
        </AppCard>
      </div>

      <!-- Ad placements -->
      <div v-if="activeTab === 'ads'" class="space-y-3">
        <div v-for="(placement, i) in config.adPlacements" :key="placement.id">
          <AppCard class="p-4 flex items-center gap-4">
            <div class="flex-1">
              <p class="text-sm font-medium text-ink">{{ placement.position }}</p>
              <p class="text-xs text-ink-muted">{{ placement.type }}</p>
            </div>
            <AppToggle v-model="config.adPlacements[i].enabled" />
          </AppCard>
        </div>
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
import type { AppConfig } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';

const store = useConfigStore();
const ui = useUiStore();
const activeTab = ref('layout');

const tabs = [
  { id: 'layout', label: 'Layout sections' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'settings', label: 'Settings hub' },
  { id: 'ads', label: 'Ad placements' },
];

// Editable deep clone of the config
const config = ref<AppConfig | null>(null);

const categoriesText = computed({
  get: () => config.value?.discovery.categories.join(', ') ?? '',
  set: (v: string) => {
    if (config.value) config.value.discovery.categories = v.split(',').map((c) => c.trim()).filter(Boolean);
  },
});

onMounted(async () => {
  await store.fetchAppConfig();
  if (store.appConfig) config.value = JSON.parse(JSON.stringify(store.appConfig)) as AppConfig;
});

async function onSave(): Promise<void> {
  if (!config.value) return;
  await store.saveAppConfig(config.value);
  ui.addToast({ tone: 'success', title: 'Mobile config saved' });
}

function addSection(): void {
  config.value?.layout.sections.push({
    id: `section_${Date.now()}`, type: 'content_rail', label: 'New section', visible: true,
  });
}

function addShortcut(): void {
  config.value?.discovery.shortcuts.push({
    id: `sc_${Date.now()}`, label: '', query: '',
  });
}

function removeShortcut(i: number): void {
  config.value?.discovery.shortcuts.splice(i, 1);
}
</script>
