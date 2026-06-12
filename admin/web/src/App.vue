<template>
  <RouterView />
  <AppToast />
  <AppConfirmDialog />
</template>

<script setup lang="ts">
import AppToast from '@/components/ui/AppToast.vue';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue';
</script>
