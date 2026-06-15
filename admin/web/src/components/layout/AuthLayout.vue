<template>
  <div class="min-h-screen flex bg-bg-1">

    <!-- ── Left brand panel (desktop only) ───────────────────────────────── -->
    <div class="hidden lg:flex w-[58%] xl:w-[60%] relative flex-col overflow-hidden flex-shrink-0">
      <!-- Layered background -->
      <div class="absolute inset-0" style="background: linear-gradient(145deg,#05040a 0%,#100b28 52%,#1b0d3d 100%)" />
      <!-- Subtle grid -->
      <div class="absolute inset-0 opacity-[0.06]"
        style="background-image:linear-gradient(rgba(141,99,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(141,99,255,1) 1px,transparent 1px);background-size:48px 48px" />
      <!-- Glow blobs -->
      <div class="absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none"
        style="background:radial-gradient(circle,rgba(141,99,255,0.22) 0%,transparent 70%)" />
      <div class="absolute -bottom-64 -left-32 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style="background:radial-gradient(circle,rgba(141,99,255,0.12) 0%,transparent 70%)" />
      <!-- Diagonal accent line -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col h-full px-12 xl:px-16 py-12">

        <!-- Brand lockup -->
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <img :src="BRAND_LOGO_URL" alt="" class="w-6 h-6 object-contain" />
          </div>
          <div>
            <p class="text-[11px] font-black text-primary-soft uppercase tracking-[0.22em]">ClaudyGod</p>
            <p class="text-xs text-ink-muted font-medium">Ministry Studio</p>
          </div>
        </div>

        <!-- Hero headline -->
        <div class="flex-1 flex flex-col justify-center">
          <div class="max-w-sm">
            <p class="text-[11px] font-bold text-primary-soft uppercase tracking-[0.2em] mb-4">Admin workspace</p>
            <h1 class="text-4xl xl:text-[2.75rem] font-black text-ink leading-[1.1] mb-5">
              Worship.<br/>
              <span style="color:transparent;background:linear-gradient(90deg,#c5b5ff,#8d63ff);-webkit-background-clip:text;background-clip:text">
                Without limits.
              </span>
            </h1>
            <p class="text-sm text-ink-soft leading-relaxed mb-10">
              The complete platform for ministry content, live operations, and community engagement — purpose-built for ClaudyGod.
            </p>

            <!-- Feature list -->
            <ul class="space-y-3.5">
              <li v-for="feat in features" :key="feat.label" class="flex items-start gap-3">
                <span
                  class="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/15 border border-primary/30">
                  <svg class="w-2.5 h-2.5 text-primary-soft" fill="none" viewBox="0 0 12 12" stroke="currentColor"
                    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 6.5l2.8 2.8L10 3.5" />
                  </svg>
                </span>
                <span class="text-sm text-ink-soft leading-snug">{{ feat.label }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom stat strip -->
        <div class="flex items-center gap-10 pt-8 border-t border-white/5">
          <div v-for="s in stats" :key="s.label">
            <p class="text-lg font-black text-ink">{{ s.value }}</p>
            <p class="text-[11px] text-ink-muted mt-0.5 uppercase tracking-wide">{{ s.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right: form panel ──────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-auto">
      <!-- Mobile glow (not shown on desktop — left panel handles it) -->
      <div class="pointer-events-none fixed inset-0 overflow-hidden lg:hidden">
        <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl"
          style="background:radial-gradient(circle,rgba(141,99,255,0.12) 0%,transparent 70%)" />
      </div>

      <!-- Mobile-only brand header -->
      <div class="relative flex flex-col items-center gap-2.5 mb-8 lg:hidden">
        <div class="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
          <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-8 h-8 object-contain" />
        </div>
        <div class="text-center">
          <p class="text-[10px] font-black text-primary-soft uppercase tracking-[0.22em]">ClaudyGod</p>
          <p class="text-base font-bold text-ink">Ministry Studio</p>
        </div>
      </div>

      <!-- Desktop eyebrow above card -->
      <div class="hidden lg:block w-full max-w-[420px] mb-5">
        <p class="text-xs text-ink-muted uppercase tracking-widest font-semibold">Secure access</p>
      </div>

      <!-- Form card -->
      <div class="relative w-full max-w-[420px] rounded-3xl border border-border shadow-2xl p-8"
        style="background:rgba(18,16,28,0.94);backdrop-filter:blur(20px)">
        <slot />
      </div>

      <p class="relative mt-7 text-[11px] text-ink-muted text-center">
        Encrypted · Role-gated · MFA-ready
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { BRAND_LOGO_URL } from '@/utils/constants';

const features = [
  { label: 'Content publishing, scheduling, and media delivery' },
  { label: 'Live stream control, replays, and session management' },
  { label: 'Real-time analytics and community engagement metrics' },
  { label: 'User roles, trust levels, and support request triage' },
  { label: 'AI-powered ad campaigns and monetisation tools' },
];

const stats = [
  { value: '256-bit', label: 'Encryption' },
  { value: 'MFA', label: 'Optional 2FA' },
  { value: '24 / 7', label: 'Uptime target' },
];
</script>
