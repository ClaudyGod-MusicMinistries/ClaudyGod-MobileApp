<template>
  <aside
    :class="[
      'flex flex-col h-full bg-surface-strong border-r border-border transition-all duration-200 flex-shrink-0',
      ui.sidebarOpen ? 'w-64' : 'w-16',
    ]"
  >
    <!-- Brand -->
    <div class="flex items-center gap-3 px-4 py-4 border-b border-border min-h-[64px]">
      <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-8 h-8 rounded-lg flex-shrink-0 object-contain" />
      <Transition name="fade">
        <div v-if="ui.sidebarOpen" class="overflow-hidden">
          <p class="text-[10px] font-semibold text-ink-muted uppercase tracking-widest">ClaudyGod</p>
          <p class="text-sm font-bold text-ink leading-tight">Admin Studio</p>
        </div>
      </Transition>
    </div>

    <!-- User card -->
    <div class="flex items-center gap-2.5 px-3 py-3 border-b border-border">
      <UserAvatar :name="auth.user?.displayName ?? undefined" :email="auth.user?.email ?? undefined" size="sm" />
      <Transition name="fade">
        <div v-if="ui.sidebarOpen" class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-ink truncate">{{ auth.user?.displayName || auth.user?.email }}</p>
          <RolePill :role="auth.role" />
        </div>
      </Transition>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-3 space-y-1 px-2">
      <template v-for="group in NAV_GROUPS" :key="group.label">
        <p v-if="ui.sidebarOpen" class="px-2 pt-3 pb-1 text-[9px] font-bold text-ink-muted uppercase tracking-widest first:pt-0">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items.filter(i => auth.hasMinRole(i.minRole))"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 group',
            route.path.startsWith(item.to)
              ? 'bg-primary/15 text-primary-soft border border-primary/20'
              : 'text-ink-soft hover:bg-white/6 hover:text-ink border border-transparent',
          ]"
          :title="!ui.sidebarOpen ? item.label : undefined"
        >
          <span class="w-5 h-5 flex-shrink-0 flex items-center justify-center" v-html="item.icon" />
          <Transition name="fade">
            <span v-if="ui.sidebarOpen" class="truncate">{{ item.label }}</span>
          </Transition>
        </RouterLink>
      </template>
    </nav>

    <!-- Footer actions -->
    <div class="border-t border-border px-2 py-3 space-y-1">
      <button
        type="button"
        :class="['flex items-center gap-3 px-2.5 py-2 w-full rounded-xl text-xs font-medium text-ink-soft hover:bg-white/6 hover:text-ink transition-colors', !ui.sidebarOpen && 'justify-center']"
        :title="!ui.sidebarOpen ? 'Toggle sidebar' : undefined"
        @click="ui.toggleSidebar()"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <Transition name="fade"><span v-if="ui.sidebarOpen">Collapse</span></Transition>
      </button>
      <button
        type="button"
        :class="['flex items-center gap-3 px-2.5 py-2 w-full rounded-xl text-xs font-medium text-danger hover:bg-danger/8 transition-colors', !ui.sidebarOpen && 'justify-center']"
        :title="!ui.sidebarOpen ? 'Sign out' : undefined"
        @click="auth.logout()"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <Transition name="fade"><span v-if="ui.sidebarOpen">Sign out</span></Transition>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { Role, BRAND_LOGO_URL } from '@/utils/constants';
import UserAvatar from '@/components/shared/UserAvatar.vue';
import RolePill from '@/components/shared/RolePill.vue';

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();

// SVG icon strings — always hardcoded literals, NEVER dynamic/API values.
// v-html is safe here because every value is a compile-time constant defined
// in this file. Do not change item.icon to accept runtime strings.
type NavIcon = string & { readonly __brand: 'NavIconSvg' };
function svgIcon(s: string): NavIcon { return s as NavIcon; }

const ic = {
  dashboard: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
  content: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'),
  requests: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>'),
  live: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M6.343 6.343a8 8 0 000 11.314M17.657 6.343a8 8 0 010 11.314M3.515 3.515a13 13 0 000 16.97M20.485 3.515a13 13 0 010 16.97"/></svg>'),
  config: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>'),
  word: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>'),
  ads: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>'),
  users: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'),
  analytics: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>'),
  youtube: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'),
  system: svgIcon('<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>'),
};

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Overview', icon: ic.dashboard, minRole: Role.ADMIN },
      { to: '/content', label: 'Content', icon: ic.content, minRole: Role.MODERATOR },
      { to: '/requests', label: 'Requests', icon: ic.requests, minRole: Role.MODERATOR },
      { to: '/live', label: 'Live', icon: ic.live, minRole: Role.MODERATOR },
    ],
  },
  {
    label: 'Publishing',
    items: [
      { to: '/config', label: 'Mobile config', icon: ic.config, minRole: Role.ADMIN },
      { to: '/word-of-day', label: 'Word of day', icon: ic.word, minRole: Role.MODERATOR },
      { to: '/ads', label: 'Ad campaigns', icon: ic.ads, minRole: Role.ADMIN },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/users', label: 'Users', icon: ic.users, minRole: Role.ADMIN },
      { to: '/analytics', label: 'Analytics', icon: ic.analytics, minRole: Role.MODERATOR },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/youtube', label: 'YouTube', icon: ic.youtube, minRole: Role.ADMIN },
      { to: '/system', label: 'System', icon: ic.system, minRole: Role.SUPER_ADMIN },
    ],
  },
];
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
