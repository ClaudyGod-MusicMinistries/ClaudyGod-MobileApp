<template>
  <AppModal
    :model-value="Boolean(ui.confirmOptions)"
    :title="ui.confirmOptions?.title"
    size="sm"
    persistent
    @update:model-value="ui.resolveConfirm(false)"
  >
    <p class="text-sm text-ink-soft">{{ ui.confirmOptions?.message }}</p>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <AppButton variant="secondary" size="sm" @click="ui.resolveConfirm(false)">
          {{ ui.confirmOptions?.cancelLabel ?? 'Cancel' }}
        </AppButton>
        <AppButton
          :variant="ui.confirmOptions?.tone === 'danger' ? 'danger' : 'primary'"
          size="sm"
          @click="ui.resolveConfirm(true)"
        >
          {{ ui.confirmOptions?.confirmLabel ?? 'Confirm' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui.store';
import AppModal from './AppModal.vue';
import AppButton from './AppButton.vue';

const ui = useUiStore();
</script>
