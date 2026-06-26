<template>
  <div class="min-h-screen bg-bg-1 flex">

    <!-- ── Left brand panel (hidden on mobile) ──────────────────────────────── -->
    <div class="hidden lg:flex w-[54%] xl:w-[57%] relative flex-col overflow-hidden flex-shrink-0">

      <!-- Gradient layer -->
      <div class="absolute inset-0 pointer-events-none"
        style="background: linear-gradient(160deg, #0a0614 0%, #160c32 38%, #1e0e45 65%, #0c0718 100%)" />

      <!-- Grain texture overlay -->
      <svg class="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <filter id="auth-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#auth-grain)"/>
      </svg>

      <!-- Glow orbs -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[560px] rounded-full blur-[100px] opacity-30"
          style="background: radial-gradient(ellipse, rgba(124,58,237,0.5) 0%, transparent 70%)"/>
        <div class="absolute -bottom-20 -right-20 w-[500px] h-[440px] rounded-full blur-[110px] opacity-18"
          style="background: radial-gradient(ellipse, rgba(79,70,229,0.4) 0%, transparent 70%)"/>
        <div class="absolute top-1/3 -left-24 w-[380px] h-[380px] rounded-full blur-[90px] opacity-14"
          style="background: radial-gradient(ellipse, rgba(147,51,234,0.4) 0%, transparent 70%)"/>
      </div>

      <!-- Right border separator -->
      <div class="absolute top-0 right-0 w-px h-full pointer-events-none"
        style="background: linear-gradient(to bottom, transparent, rgba(141,99,255,0.28) 25%, rgba(141,99,255,0.28) 75%, transparent)"/>

      <!-- Panel content -->
      <div class="relative z-10 flex flex-col h-full px-12 xl:px-16 py-14">

        <!-- Brand mark -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style="background: rgba(141,99,255,0.18); border: 1px solid rgba(141,99,255,0.35)">
            <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-6 h-6 object-contain" />
          </div>
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.22em] text-primary-soft">ClaudyGod</p>
            <p class="text-xs font-medium text-ink-muted">Ministry Studio</p>
          </div>
        </div>

        <!-- Slotted panel content (headline, features, etc.) -->
        <div class="flex-1 flex flex-col justify-center">
          <slot name="panel">
            <!-- Default panel content -->
            <div class="max-w-[380px]">
              <p class="text-[11px] font-bold uppercase tracking-[0.2em] mb-5 text-primary-soft/80">Admin workspace</p>
              <h1
                class="font-black leading-[1.06] mb-6 text-ink"
                style="font-size: clamp(2.2rem, 3.2vw, 2.9rem)"
              >
                Ministry management,<br/>
                <span style="background: linear-gradient(92deg, #c4b5fd 0%, #818cf8 55%, #8b5cf6 100%); -webkit-background-clip: text; background-clip: text; color: transparent">
                  simplified.
                </span>
              </h1>
              <p class="text-sm leading-relaxed mb-10 text-ink-soft">
                Publish content, run live sessions, and grow your community — all from one powerful place.
              </p>

              <ul class="space-y-3.5">
                <li v-for="feat in defaultFeatures" :key="feat" class="flex items-start gap-3">
                  <span class="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style="background: rgba(141,99,255,0.18); border: 1px solid rgba(141,99,255,0.38)">
                    <svg class="w-2.5 h-2.5 text-primary-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </span>
                  <span class="text-sm text-ink-soft">{{ feat }}</span>
                </li>
              </ul>
            </div>
          </slot>
        </div>

        <!-- Stats bar -->
        <div class="flex items-center gap-10 pt-8 border-t border-border">
          <div v-for="s in stats" :key="s.label">
            <p class="text-base font-black text-ink">{{ s.value }}</p>
            <p class="text-[11px] uppercase tracking-wider mt-0.5 text-ink-muted">{{ s.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right form panel ──────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col items-center justify-center px-5 py-12 overflow-auto">

      <!-- Mobile brand mark -->
      <div class="flex lg:hidden flex-col items-center gap-2 mb-8">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center"
          style="background: rgba(141,99,255,0.14); border: 1px solid rgba(141,99,255,0.28)">
          <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-8 h-8 object-contain" />
        </div>
        <p class="text-sm font-black text-ink tracking-tight">ClaudyGod Admin</p>
      </div>

      <!-- Desktop eyebrow -->
      <div v-if="eyebrow" class="hidden lg:block w-full max-w-[440px] mb-5">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">{{ eyebrow }}</p>
      </div>

      <!-- Form card -->
      <div class="w-full max-w-[440px] rounded-3xl border border-border p-8"
        style="background: rgba(12,10,20,0.86); backdrop-filter: blur(16px)">
        <slot />
      </div>

      <!-- Footer trust line -->
      <p class="mt-6 text-[11px] text-ink-muted/60 text-center tracking-wide">
        Secure access · Role-based permissions · End-to-end encrypted
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { BRAND_LOGO_URL } from '@/utils/constants';

withDefaults(defineProps<{
  eyebrow?: string;
}>(), {});

const defaultFeatures = [
  'Content publishing, scheduling, and media delivery',
  'Live stream control, replays, and session management',
  'Real-time analytics and community engagement',
  'User roles, trust levels, and support triage',
  'AI-powered ad campaigns and monetisation tools',
];

const stats = [
  { value: '256-bit', label: 'Encryption' },
  { value: '2-Step',  label: 'Verification' },
  { value: '24 / 7',  label: 'Uptime target' },
];
</script>
