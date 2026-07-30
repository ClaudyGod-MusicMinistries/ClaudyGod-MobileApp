<template>
  <header class="flex min-h-[var(--layout-topbar)] shrink-0 items-center justify-between gap-4 border-b border-border bg-surface-strong/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
    <div class="flex min-w-0 items-center gap-3">
      <button type="button" class="-ml-1 rounded-[var(--radius-control)] p-2 text-ink-muted transition-base hover:bg-surface-hover hover:text-ink lg:hidden" aria-label="Open navigation menu" @click="ui.toggleMobileDrawer()">
        <Menu class="h-5 w-5" />
      </button>
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">{{ workspaceLabel }}</p>
        <h1 class="mt-0.5 truncate text-[15px] font-semibold text-ink">{{ pageTitle }}</h1>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
      <span v-if="workspace === 'mobile'" :class="['hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex', healthClass]">
        <span :class="['h-1.5 w-1.5 rounded-full', healthDot]" />{{ healthLabel }}
      </span>

      <AppTooltip v-if="tour.hasCurrentTour()" text="Open the guided tour">
        <button type="button" class="rounded-[var(--radius-control)] p-2 text-ink-muted transition-base hover:bg-surface-hover hover:text-ink" aria-label="Open guided tour" @click="tour.replayCurrentTour()">
          <HelpCircle class="h-4 w-4" />
        </button>
      </AppTooltip>

      <AppTooltip :text="preferences.theme === 'dark' ? 'Use light appearance' : 'Use dark appearance'">
        <button type="button" class="rounded-[var(--radius-control)] p-2 text-ink-muted transition-base hover:bg-surface-hover hover:text-ink" :aria-label="preferences.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="preferences.toggleTheme()">
          <Sun v-if="preferences.theme === 'dark'" class="h-4 w-4" /><Moon v-else class="h-4 w-4" />
        </button>
      </AppTooltip>

      <div ref="menuRef" class="relative">
        <button type="button" class="flex items-center gap-2 rounded-[var(--radius-control)] p-1 transition-base hover:bg-surface-hover" :aria-expanded="menuOpen" aria-haspopup="menu" @click="menuOpen = !menuOpen">
          <UserAvatar :name="auth.user?.displayName ?? undefined" :email="auth.user?.email ?? undefined" size="sm" />
          <ChevronDown :class="['h-3 w-3 text-ink-muted transition-transform', menuOpen && 'rotate-180']" />
        </button>
        <Transition name="dropdown">
          <div v-if="menuOpen" role="menu" class="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-[var(--radius-card)] border border-border-strong bg-surface-strong shadow-panel">
            <div class="border-b border-border px-4 py-3">
              <p class="truncate text-xs font-semibold text-ink">{{ auth.user?.displayName || auth.user?.email }}</p>
              <p class="mt-0.5 truncate text-xs text-ink-muted">{{ auth.user?.email }}</p>
            </div>
            <button type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-3 text-sm text-danger transition-base hover:bg-danger/10" @click="signOut">
              <LogOut class="h-4 w-4" /> Sign out
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { onClickOutside } from '@vueuse/core';
import { ChevronDown, HelpCircle, LogOut, Menu, Moon, Sun } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useUiStore } from '@/stores/ui.store';
import { useOnboardingTour } from '@/composables/useOnboardingTour';
import AppTooltip from '@/components/ui/AppTooltip.vue';
import UserAvatar from '@/components/shared/UserAvatar.vue';

const props = defineProps<{ workspace: 'mobile' | 'web' }>();
const route = useRoute();
const auth = useAuthStore();
const dashboard = useDashboardStore();
const preferences = usePreferencesStore();
const ui = useUiStore();
const tour = useOnboardingTour();
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
onClickOutside(menuRef, () => { menuOpen.value = false; });

const workspaceLabel = computed(() => props.workspace === 'web' ? 'Web Studio' : 'Mobile Studio');
const pageTitle = computed(() => String(route.meta.title ?? workspaceLabel.value));
const healthStatus = computed(() => dashboard.error ? 'error' : dashboard.data?.overview ? 'ok' : 'syncing');
const healthLabel = computed(() => ({ ok: 'Operational', error: 'Needs attention', syncing: 'Syncing' }[healthStatus.value]));
const healthClass = computed(() => ({ ok: 'bg-success/10 border-success/20 text-success', error: 'bg-danger/10 border-danger/20 text-danger', syncing: 'bg-surface-hover border-border text-ink-muted' }[healthStatus.value]));
const healthDot = computed(() => ({ ok: 'bg-success', error: 'bg-danger', syncing: 'bg-ink-muted animate-pulse' }[healthStatus.value]));

function signOut(): void { menuOpen.value = false; auth.logout(); }
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: opacity var(--motion-base), transform var(--motion-base); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-5px) scale(.98); }
</style>
