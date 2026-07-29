<template>
  <RouterView />
  <AppToast />
  <AppConfirmDialog />
  <TourOverlay />
</template>

<script setup lang="ts">
import AppToast from '@/components/ui/AppToast.vue';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue';
import TourOverlay from '@/components/tour/TourOverlay.vue';
</script>
