<template>
  <div class="min-h-screen flex" style="font-family:'Inter',system-ui,sans-serif">

    <!-- ── Left: Visual brand panel ───────────────────────────────────────── -->
    <div class="hidden lg:flex w-[56%] xl:w-[58%] relative flex-col overflow-hidden flex-shrink-0">

      <!-- Photo-feel background layers -->
      <div class="absolute inset-0"
        style="background:linear-gradient(160deg,#0a0614 0%,#160c32 38%,#1e0e45 65%,#0c0718 100%)" />

      <!-- Grain/film texture overlay -->
      <svg class="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)"/>
      </svg>

      <!-- Radial light leaks -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[100px] opacity-30"
          style="background:radial-gradient(ellipse,#7c3aed 0%,transparent 70%)"/>
        <div class="absolute bottom-0 right-0 w-[600px] h-[500px] rounded-full blur-[120px] opacity-20"
          style="background:radial-gradient(ellipse,#4f46e5 0%,transparent 70%)"/>
        <div class="absolute top-1/3 -left-20 w-[400px] h-[400px] rounded-full blur-[80px] opacity-15"
          style="background:radial-gradient(ellipse,#9333ea 0%,transparent 70%)"/>
      </div>

      <!-- Right border separator -->
      <div class="absolute top-0 right-0 w-px h-full"
        style="background:linear-gradient(to bottom,transparent,rgba(141,99,255,0.3) 30%,rgba(141,99,255,0.3) 70%,transparent)"/>

      <!-- Content -->
      <div class="relative z-10 flex flex-col h-full px-12 xl:px-16 py-12">

        <!-- Brand -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center"
            style="background:rgba(141,99,255,0.2);border:1px solid rgba(141,99,255,0.35)">
            <img :src="BRAND_LOGO_URL" alt="" class="w-6 h-6 object-contain" />
          </div>
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.22em]" style="color:#c4b5fd">ClaudyGod</p>
            <p class="text-xs font-medium" style="color:#8b84a6">Ministry Studio</p>
          </div>
        </div>

        <!-- Hero -->
        <div class="flex-1 flex flex-col justify-center">
          <div class="max-w-[360px]">
            <p class="text-[11px] font-bold uppercase tracking-[0.2em] mb-5" style="color:#a78bfa">Admin workspace</p>
            <h1 class="font-black leading-[1.07] mb-6" style="font-size:clamp(2.2rem,3.5vw,3rem);color:#f5f3ff">
              Ministry management,<br/>
              <span style="background:linear-gradient(92deg,#c4b5fd 0%,#818cf8 55%,#8b5cf6 100%);-webkit-background-clip:text;background-clip:text;color:transparent">
                simplified.
              </span>
            </h1>
            <p class="text-sm leading-relaxed mb-10" style="color:#9ca3af">
              Publish content, run live sessions, and grow your community — all from one place.
            </p>

            <ul class="space-y-3.5">
              <li v-for="feat in features" :key="feat" class="flex items-start gap-3">
                <span class="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4)">
                  <svg class="w-2.5 h-2.5" style="color:#c4b5fd" fill="none" viewBox="0 0 12 12"
                    stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 6.5l2.8 2.8L10 3.5"/>
                  </svg>
                </span>
                <span class="text-sm" style="color:#9ca3af">{{ feat }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Stats -->
        <div class="flex items-center gap-10 pt-8" style="border-top:1px solid rgba(139,92,246,0.15)">
          <div v-for="s in stats" :key="s.label">
            <p class="text-lg font-black" style="color:#f5f3ff">{{ s.value }}</p>
            <p class="text-[11px] uppercase tracking-wider mt-0.5" style="color:#6b7280">{{ s.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right: White form panel ─────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col items-center justify-center px-5 py-10 overflow-auto bg-white">

      <!-- Mobile brand -->
      <div class="flex flex-col items-center gap-2 mb-8 lg:hidden">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center"
          style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25)">
          <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-8 h-8 object-contain" />
        </div>
        <p class="text-sm font-black text-gray-900 tracking-tight">ClaudyGod Admin</p>
      </div>

      <!-- Desktop eyebrow -->
      <div class="hidden lg:block w-full max-w-[440px] mb-6">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Secure access</p>
      </div>

      <!-- Form card -->
      <div class="w-full max-w-[440px] rounded-3xl border border-gray-100 shadow-lg bg-white p-8">
        <slot />
      </div>

      <p class="mt-6 text-[11px] text-gray-400 text-center tracking-wide">
        Secure access · Role-based permissions · End-to-end encrypted
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { BRAND_LOGO_URL } from '@/utils/constants';

const features = [
  'Content publishing, scheduling, and media delivery',
  'Live stream control, replays, and session management',
  'Real-time analytics and community engagement',
  'User roles, trust levels, and support triage',
  'AI-powered ad campaigns and monetisation tools',
];

const stats = [
  { value: '256-bit', label: 'Encryption' },
  { value: '2-Step', label: 'Verification' },
  { value: '24 / 7', label: 'Uptime target' },
];
</script>
