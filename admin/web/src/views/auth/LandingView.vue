<template>
  <div class="min-h-screen bg-[#07050C] flex flex-col items-center justify-center relative overflow-hidden">

    <!-- Background glow orbs -->
    <div class="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/6 blur-3xl" />
    <div class="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-500/4 blur-3xl" />
    <div class="pointer-events-none absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-indigo-600/4 blur-3xl" />

    <div class="relative z-10 w-full max-w-lg px-6 py-12 flex flex-col items-center text-center">

      <!-- Brand mark -->
      <div class="flex items-center gap-3 mb-10">
        <div class="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-8 h-8 rounded-xl object-contain" />
        </div>
        <div class="text-left">
          <p class="text-white text-base font-black leading-none tracking-tight">ClaudyGod</p>
          <p class="text-white/40 text-xs mt-0.5 font-medium">Admin Studio</p>
        </div>
      </div>

      <!-- Headline -->
      <h1 class="text-white text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
        Ministry<br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">command centre.</span>
      </h1>
      <p class="text-white/45 text-sm sm:text-base leading-relaxed mb-10 max-w-sm">
        Publish music, sermons, and videos. Manage your audience and configure the ClaudyGod mobile experience — all in one secure place.
      </p>

      <!-- Feature pills -->
      <div class="flex flex-wrap gap-2 justify-center mb-12">
        <span v-for="f in FEATURES" :key="f"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/4 border border-white/8 text-white/50 text-xs font-medium">
          {{ f }}
        </span>
      </div>

      <!-- CTAs -->
      <div class="w-full space-y-3">
        <RouterLink
          to="/login"
          class="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-150 hover:opacity-90 shadow-lg shadow-violet-500/20"
          style="background: linear-gradient(135deg, #7c3aed, #6d28d9)"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
          </svg>
          Sign in to Dashboard
        </RouterLink>

        <RouterLink
          to="/request-access"
          class="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold text-white/70 transition-all duration-150 bg-white/4 border border-white/10 hover:bg-white/8 hover:text-white hover:border-white/20"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          Request admin access
        </RouterLink>
      </div>

      <!-- Footer note -->
      <p class="mt-10 text-white/20 text-xs leading-relaxed">
        Already have an invite link? Open it directly<br />
        or paste your token on the
        <RouterLink to="/register" class="text-violet-400/70 hover:text-violet-400 transition-colors underline underline-offset-2">registration page</RouterLink>.
      </p>

    </div>

    <!-- Bottom brand bar -->
    <p class="absolute bottom-5 text-white/15 text-xs">
      © {{ year }} ClaudyGod Music Ministries — Restricted access
    </p>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { BRAND_LOGO_URL } from '@/utils/constants';

const year = new Date().getFullYear();

const FEATURES = [
  'Content publishing',
  'Live sessions',
  'Audience analytics',
  'Word of the day',
  'Ad campaigns',
  'YouTube import',
  'Mobile config',
  'Role-based access',
];
</script>
