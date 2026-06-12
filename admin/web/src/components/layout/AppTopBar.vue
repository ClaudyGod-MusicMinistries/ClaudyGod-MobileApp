<template>
  <header class="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-border bg-surface/80 backdrop-blur-sm flex-shrink-0 min-h-[64px]">
    <!-- Breadcrumb + title -->
    <div class="min-w-0">
      <div class="flex items-center gap-1.5 text-xs text-ink-muted mb-0.5">
        <span>Admin Studio</span>
        <span>›</span>
        <span class="text-ink-soft font-medium">{{ pageTitle }}</span>
      </div>
      <h1 class="text-base font-bold text-ink truncate">{{ pageTitle }}</h1>
    </div>

    <!-- Right actions -->
    <div class="flex items-center gap-2.5 flex-shrink-0">
      <!-- Health chip -->
      <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', healthClass]">
        <span :class="['w-1.5 h-1.5 rounded-full', healthDot]" />
        {{ healthLabel }}
      </span>

      <!-- User menu -->
      <div class="relative" ref="menuRef">
        <button
          type="button"
          class="flex items-center gap-2 p-1 rounded-xl hover:bg-white/8 transition-colors"
          @click="menuOpen = !menuOpen"
        >
          <UserAvatar :name="auth.user?.displayName ?? undefined" :email="auth.user?.email ?? undefined" size="sm" />
          <svg class="w-3 h-3 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Transition name="dropdown">
          <div v-if="menuOpen" class="absolute right-0 mt-2 w-52 bg-bg-2 border border-border rounded-2xl shadow-panel z-50 overflow-hidden">
            <div class="px-4 py-3 border-b border-border">
              <p class="text-xs font-semibold text-ink truncate">{{ auth.user?.displayName || auth.user?.email }}</p>
              <p class="text-xs text-ink-muted truncate">{{ auth.user?.email }}</p>
            </div>
            <button
              type="button"
              class="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-danger hover:bg-danger/8 transition-colors"
              @click="() => { menuOpen = false; auth.logout(); }"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { onClickOutside } from '@vueuse/core';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import UserAvatar from '@/components/shared/UserAvatar.vue';

const route = useRoute();
const auth = useAuthStore();
const dashboard = useDashboardStore();

const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
onClickOutside(menuRef, () => { menuOpen.value = false; });

const pageTitle = computed(() => String(route.meta.title ?? 'Workspace'));

const healthStatus = computed(() => dashboard.data?.overview ? 'ok' : null);
const healthClass = computed(() => ({
  ok: 'bg-success/10 border-success/20 text-success',
  degraded: 'bg-amber/10 border-amber/20 text-amber',
  error: 'bg-danger/10 border-danger/20 text-danger',
}[healthStatus.value ?? 'ok'] ?? 'bg-white/6 border-border text-ink-muted'));
const healthDot = computed(() => ({
  ok: 'bg-success animate-pulse',
  degraded: 'bg-amber',
  error: 'bg-danger',
}[healthStatus.value ?? 'ok'] ?? 'bg-ink-muted'));
const healthLabel = computed(() => healthStatus.value === 'ok' ? 'Ready' : healthStatus.value === 'error' ? 'Error' : 'Syncing');
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px) scale(0.97); }
</style>
