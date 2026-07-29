<template>
  <div class="flex h-screen overflow-hidden bg-bg-1">
    <AppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppTopBar />
      <main class="flex-1 overflow-y-auto">
        <div class="w-full max-w-[1600px] mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue';
import AppTopBar from './AppTopBar.vue';
</script>
