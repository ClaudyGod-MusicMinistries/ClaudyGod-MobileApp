<template>
  <div class="min-h-screen bg-bg-1 relative overflow-hidden">

    <!-- ── Background layers ──────────────────────────────────────────────── -->
    <!-- Gradient mesh -->
    <div class="absolute inset-0 pointer-events-none"
      style="background: linear-gradient(155deg, #050309 0%, #0e0820 28%, #1a0d3a 52%, #110834 72%, #070512 100%)"/>
    <!-- Grain texture -->
    <svg class="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <filter id="landing-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#landing-grain)"/>
    </svg>
    <!-- Glow orbs -->
    <div class="absolute pointer-events-none inset-0 overflow-hidden">
      <div class="absolute top-0 left-1/4 -translate-x-1/2 w-[900px] h-[700px] rounded-full blur-[130px] opacity-25"
        style="background: radial-gradient(ellipse, rgba(124,58,237,0.7) 0%, transparent 65%)"/>
      <div class="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-14"
        style="background: radial-gradient(ellipse, rgba(99,102,241,0.55) 0%, transparent 65%)"/>
      <div class="absolute bottom-0 left-1/3 w-[700px] h-[500px] rounded-full blur-[110px] opacity-16"
        style="background: radial-gradient(ellipse, rgba(109,40,217,0.55) 0%, transparent 70%)"/>
    </div>

    <!-- ── Main layout ────────────────────────────────────────────────────── -->
    <div class="relative z-10 min-h-screen flex flex-col lg:flex-row">

      <!-- ── LEFT: Brand story panel ────────────────────────────────────────
           Hidden on mobile — becomes a full split panel on lg+
      ──────────────────────────────────────────────────────────────────────── -->
      <div class="hidden lg:flex flex-col justify-between w-[52%] xl:w-[55%] min-h-screen px-14 xl:px-20 py-14 flex-shrink-0 relative">

        <!-- Right divider -->
        <div class="absolute top-0 right-0 w-px h-full pointer-events-none"
          style="background: linear-gradient(to bottom, transparent, rgba(141,99,255,0.22) 20%, rgba(141,99,255,0.22) 80%, transparent)"/>

        <!-- Brand mark -->
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style="background: rgba(141,99,255,0.18); border: 1px solid rgba(141,99,255,0.36)">
            <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-7 h-7 rounded-xl object-contain" />
          </div>
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-primary-soft">ClaudyGod</p>
            <p class="text-xs font-medium text-ink-muted">Ministry Studio</p>
          </div>
        </div>

        <!-- Hero copy -->
        <div class="flex-1 flex flex-col justify-center py-16">
          <div class="max-w-[480px]">
            <!-- Eyebrow -->
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
              style="background: rgba(141,99,255,0.10); border: 1px solid rgba(141,99,255,0.22)">
              <span class="w-1.5 h-1.5 rounded-full bg-primary-soft animate-pulse flex-shrink-0"/>
              <span class="text-[11px] font-semibold tracking-wide text-primary-soft">Admin Command Centre</span>
            </div>

            <h1 class="font-black leading-[1.05] mb-6 text-ink" style="font-size: clamp(2.6rem, 4vw, 3.6rem)">
              One place for<br/>
              your entire<br/>
              <span style="background: linear-gradient(92deg, #c4b5fd 0%, #a78bfa 45%, #818cf8 100%); -webkit-background-clip: text; background-clip: text; color: transparent">
                ministry.
              </span>
            </h1>

            <p class="text-base leading-relaxed mb-12 text-ink-soft max-w-[400px]">
              Publish music, sermons, and videos. Manage live sessions, grow your audience, and configure the mobile app — all from one secure workspace.
            </p>

            <!-- Feature grid -->
            <div class="grid grid-cols-2 gap-3">
              <div v-for="feat in FEATURES" :key="feat.label"
                class="flex items-start gap-2.5 p-3.5 rounded-2xl"
                style="background: rgba(141,99,255,0.06); border: 1px solid rgba(141,99,255,0.12)">
                <span class="mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                  style="background: rgba(141,99,255,0.18); border: 1px solid rgba(141,99,255,0.32)">
                  <component :is="feat.icon" class="w-2.5 h-2.5 text-primary-soft" />
                </span>
                <div>
                  <p class="text-xs font-semibold text-ink leading-none">{{ feat.label }}</p>
                  <p class="text-[11px] text-ink-muted mt-0.5 leading-snug">{{ feat.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats footer -->
        <div class="flex items-center gap-10 pt-7" style="border-top: 1px solid rgba(141,99,255,0.14)">
          <div v-for="s in STATS" :key="s.label">
            <p class="text-lg font-black text-ink">{{ s.value }}</p>
            <p class="text-[10px] uppercase tracking-widest mt-0.5 text-ink-muted">{{ s.label }}</p>
          </div>
        </div>
      </div>

      <!-- ── RIGHT: Auth options panel ────────────────────────────────────── -->
      <div class="flex-1 flex flex-col items-center justify-center px-6 py-14 lg:py-20 min-h-screen">

        <!-- Mobile brand mark -->
        <div class="flex lg:hidden flex-col items-center gap-2 mb-10">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
            style="background: rgba(141,99,255,0.15); border: 1px solid rgba(141,99,255,0.30)">
            <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-9 h-9 rounded-xl object-contain" />
          </div>
          <p class="text-base font-black text-ink tracking-tight">ClaudyGod</p>
          <p class="text-xs text-ink-muted">Admin Studio</p>
        </div>

        <!-- Auth card -->
        <div class="w-full max-w-[400px]">

          <!-- Card heading -->
          <div class="mb-8 text-center lg:text-left">
            <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-ink-muted mb-2">Secure access</p>
            <h2 class="text-2xl xl:text-3xl font-black text-ink leading-tight tracking-tight">
              Ministry<br class="hidden lg:block"/>
              <span style="background: linear-gradient(92deg, #c4b5fd 0%, #818cf8 100%); -webkit-background-clip: text; background-clip: text; color: transparent">
                command centre.
              </span>
            </h2>
            <p class="mt-3 text-sm text-ink-soft leading-relaxed">
              Sign in to manage your content, audience,<br class="hidden lg:block"/> and mobile app configuration.
            </p>
          </div>

          <!-- Feature pills (mobile only) -->
          <div class="flex lg:hidden flex-wrap gap-2 justify-center mb-8">
            <span v-for="pill in PILLS" :key="pill"
              class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-ink-soft"
              style="background: rgba(141,99,255,0.08); border: 1px solid rgba(141,99,255,0.16)">
              {{ pill }}
            </span>
          </div>

          <!-- Primary CTA -->
          <RouterLink
            to="/login"
            class="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98] shadow-lg"
            style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); box-shadow: 0 8px 32px rgba(109,40,217,0.30)"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            Sign in to Dashboard
          </RouterLink>

          <!-- Secondary CTA -->
          <RouterLink
            to="/request-access"
            class="mt-3 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold text-ink-soft transition-all duration-150 hover:text-ink hover:border-border-strong"
            style="background: rgba(141,99,255,0.06); border: 1px solid rgba(141,99,255,0.18)"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
            Request admin access
          </RouterLink>

          <!-- Divider -->
          <div class="relative flex items-center gap-3 my-6">
            <div class="flex-1 h-px bg-border"/>
            <span class="text-[11px] text-ink-muted/70 whitespace-nowrap">already have an invite?</span>
            <div class="flex-1 h-px bg-border"/>
          </div>

          <!-- Invite link row -->
          <RouterLink
            to="/register"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-ink-muted hover:text-primary-soft transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Use your invitation link
          </RouterLink>
        </div>

        <!-- Bottom legal -->
        <p class="mt-10 text-[11px] text-ink-muted/40 text-center leading-relaxed">
          © {{ year }} ClaudyGod Music Ministries<br/>Restricted access — authorised personnel only.
        </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import {
  Music, Radio, BarChart2, Users, Megaphone, Video, Settings, Shield,
} from 'lucide-vue-next';
import { BRAND_LOGO_URL } from '@/utils/constants';

const year = new Date().getFullYear();

const FEATURES = [
  { label: 'Content publishing',   desc: 'Music, sermons & videos',    icon: Music      },
  { label: 'Live sessions',         desc: 'Stream & replay control',    icon: Radio      },
  { label: 'Audience analytics',    desc: 'Real-time engagement data',  icon: BarChart2  },
  { label: 'User management',       desc: 'Roles & trust levels',       icon: Users      },
  { label: 'Ad campaigns',          desc: 'AI-powered monetisation',    icon: Megaphone  },
  { label: 'YouTube import',        desc: 'Browse & import directly',   icon: Video      },
  { label: 'Mobile config',         desc: 'App appearance & settings',  icon: Settings   },
  { label: 'Role-based access',     desc: 'Granular permissions',       icon: Shield     },
];

const STATS = [
  { value: '256-bit', label: 'Encryption'    },
  { value: '2-Step',  label: 'Verification'  },
  { value: '24/7',    label: 'Uptime target' },
];

const PILLS = [
  'Content publishing', 'Live sessions', 'Analytics',
  'YouTube import', 'Mobile config', 'Role-based access',
];
</script>
