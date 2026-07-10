<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-base font-bold text-ink">Mobile preview</h2>
        <p class="text-xs text-ink-muted mt-0.5">Live app — save changes elsewhere, then refresh here to check them.</p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" size="sm" @click="refresh">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </template>
          Refresh
        </AppButton>
        <a :href="PREVIEW_URL" target="_blank" rel="noopener">
          <AppButton variant="secondary" size="sm">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </template>
            Open in new tab
          </AppButton>
        </a>
      </div>
    </div>

    <div class="flex items-center justify-center py-6">
      <div class="relative w-[390px] max-w-full aspect-[390/844] rounded-[2.5rem] border-8 border-bg-2 shadow-panel overflow-hidden bg-black flex-shrink-0">
        <iframe
          :key="frameKey"
          :src="PREVIEW_URL"
          class="w-full h-full border-0 bg-white"
          title="Mobile app preview"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MOBILE_PREVIEW_DEFAULT_URL } from '@/utils/constants';
import AppButton from '@/components/ui/AppButton.vue';

const PREVIEW_URL = MOBILE_PREVIEW_DEFAULT_URL;

const frameKey = ref(0);
function refresh(): void {
  frameKey.value += 1;
}
</script>
