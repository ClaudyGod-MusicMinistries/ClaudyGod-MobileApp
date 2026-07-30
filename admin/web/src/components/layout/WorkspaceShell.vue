<template>
  <div class="flex h-dvh overflow-hidden bg-bg-1">
    <component :is="sidebar" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <WorkspaceTopBar :workspace="workspace" />
      <main id="main-content" class="flex-1 overflow-y-auto scroll-smooth" tabindex="-1">
        <div class="app-content-boundary mx-auto w-full px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppSidebar from './AppSidebar.vue';
import WebSidebar from './WebSidebar.vue';
import WorkspaceTopBar from './WorkspaceTopBar.vue';

const props = defineProps<{ workspace: 'mobile' | 'web' }>();
const sidebar = computed(() => props.workspace === 'web' ? WebSidebar : AppSidebar);
</script>
