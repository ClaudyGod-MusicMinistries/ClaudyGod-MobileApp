<template>
  <div class="auth-canvas min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 py-14">
    <!-- Background layers — same treatment as LandingView for a coherent handoff -->
    <div class="absolute pointer-events-none inset-0 overflow-hidden">
      <div class="auth-glow-primary absolute top-0 left-1/4 -translate-x-1/2 w-[900px] h-[700px] rounded-full blur-[130px] opacity-20" />
      <div class="auth-glow-info absolute bottom-0 right-1/4 w-[700px] h-[500px] rounded-full blur-[120px] opacity-20" />
    </div>

    <div class="relative z-10 w-full max-w-3xl">
      <!-- Brand + greeting -->
      <div class="flex flex-col items-center text-center mb-12">
        <div class="auth-logo w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
          <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-7 h-7 rounded-xl object-contain" />
        </div>
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-ink-muted mb-2">
          Welcome back{{ auth.user?.displayName ? `, ${auth.user.displayName}` : '' }}
        </p>
        <h1 class="text-2xl xl:text-3xl font-black text-ink leading-tight tracking-tight">
          Which workspace do you need?
        </h1>
      </div>

      <!-- Two choice cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <button
          type="button"
          class="auth-card group text-left p-7 rounded-[var(--radius-panel)] transition-base hover:-translate-y-0.5 hover:border-primary/35"
          @click="enterMobile"
        >
          <div class="auth-logo w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-base">
            <Smartphone class="w-6 h-6 text-primary-soft" />
          </div>
          <h2 class="text-lg font-black text-ink mb-1.5">Mobile Studio</h2>
          <p class="text-sm text-ink-soft leading-relaxed mb-5">
            Content, live sessions, users, ads, analytics, and the mobile app's own configuration.
          </p>
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-soft">
            Enter Mobile Studio
            <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>

        <button
          type="button"
          class="auth-card group text-left p-7 rounded-[var(--radius-panel)] transition-base hover:-translate-y-0.5 hover:border-primary/35"
          @click="enterWeb"
        >
          <div class="auth-logo w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-base">
            <Globe class="w-6 h-6 text-primary-soft" />
          </div>
          <h2 class="text-lg font-black text-ink mb-1.5">Web Studio</h2>
          <p class="text-sm text-ink-soft leading-relaxed mb-5">
            claudygod.org's albums, store, videos, events, journal, and every inbox request.
          </p>
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-soft">
            Enter Web Studio
            <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>

      <button
        type="button"
        class="mt-10 mx-auto flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-ink-soft transition-colors"
        @click="auth.logout()"
      >
        Sign out
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Smartphone, Globe, ArrowRight } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { BRAND_LOGO_URL } from '@/utils/constants';

const router = useRouter();
const auth = useAuthStore();

function enterMobile(): void {
  void router.push('/dashboard');
}

function enterWeb(): void {
  void router.push('/web/dashboard');
}
</script>
