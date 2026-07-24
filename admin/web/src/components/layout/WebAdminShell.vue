<template>
  <div class="flex h-screen overflow-hidden">
    <WebSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <WebTopBar />
      <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import WebSidebar from './WebSidebar.vue';
import WebTopBar from './WebTopBar.vue';
</script>
