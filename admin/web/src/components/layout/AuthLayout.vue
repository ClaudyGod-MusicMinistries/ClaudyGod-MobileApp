<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
    <!-- Glow orbs -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary-soft/6 blur-3xl" />
    </div>

    <!-- Brand header -->
    <div class="relative flex flex-col items-center gap-3 mb-8">
      <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-14 h-14 rounded-2xl object-contain" />
      <div class="text-center">
        <p class="text-xs font-semibold text-ink-muted uppercase tracking-widest">ClaudyGod</p>
        <h1 class="text-xl font-bold text-ink">Admin Studio</h1>
      </div>
    </div>

    <!-- Card -->
    <div class="relative w-full max-w-md bg-surface-strong border border-border rounded-3xl shadow-panel p-8">
      <slot />
    </div>

    <!-- Footer -->
    <p class="relative mt-8 text-xs text-ink-muted text-center">
      Secure publishing, review, and mobile delivery.
    </p>
  </div>
</template>

<script setup lang="ts">
import { BRAND_LOGO_URL } from '@/utils/constants';
</script>
