<template>
  <header class="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-border bg-surface/80 backdrop-blur-sm flex-shrink-0 min-h-[64px]">
    <!-- Hamburger (mobile/tablet only) + Breadcrumb + title -->
    <div class="flex items-center gap-3 min-w-0">
      <button
        type="button"
        class="lg:hidden -ml-1 p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors flex-shrink-0"
        aria-label="Open navigation menu"
        @click="ui.toggleMobileDrawer()"
      >
        <Menu class="w-5 h-5" />
      </button>

      <div class="min-w-0">
        <div class="flex items-center gap-1.5 text-xs text-ink-muted mb-0.5">
          <span>Web Studio</span>
          <span>›</span>
          <span class="text-ink-soft font-medium">{{ pageTitle }}</span>
        </div>
        <h1 class="text-base font-bold text-ink truncate">{{ pageTitle }}</h1>
      </div>
    </div>

    <!-- Right actions -->
    <div class="flex items-center gap-2.5 flex-shrink-0">
      <!-- Replay onboarding tour for this page -->
      <button
        v-if="tour.hasCurrentTour()"
        type="button"
        class="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
        aria-label="Show a guided tour of this page"
        title="Show a guided tour of this page"
        @click="tour.replayCurrentTour()"
      >
        <HelpCircle class="w-4 h-4" />
      </button>

      <!-- Theme toggle -->
      <button
        type="button"
        class="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
        :aria-label="preferences.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        :title="preferences.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="preferences.toggleTheme()"
      >
        <Sun v-if="preferences.theme === 'dark'" class="w-4 h-4" />
        <Moon v-else class="w-4 h-4" />
      </button>

      <!-- User menu -->
      <div class="relative" ref="menuRef">
        <button
          type="button"
          class="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-hover transition-colors"
          @click="menuOpen = !menuOpen"
        >
          <UserAvatar :name="auth.user?.displayName ?? undefined" :email="auth.user?.email ?? undefined" size="sm" />
          <ChevronDown class="w-3 h-3 text-ink-muted" />
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
              <LogOut class="w-4 h-4" />
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
import { Menu, HelpCircle, Sun, Moon, ChevronDown, LogOut } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useOnboardingTour } from '@/composables/useOnboardingTour';
import UserAvatar from '@/components/shared/UserAvatar.vue';

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();
const preferences = usePreferencesStore();
const tour = useOnboardingTour();

const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
onClickOutside(menuRef, () => { menuOpen.value = false; });

const pageTitle = computed(() => String(route.meta.title ?? 'Web Studio'));
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px) scale(0.97); }
</style>
