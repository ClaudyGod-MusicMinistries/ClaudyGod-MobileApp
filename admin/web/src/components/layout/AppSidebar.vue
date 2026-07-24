<template>
  <!-- Scrim (mobile/tablet only, shown while the drawer is open) -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="ui.mobileDrawerOpen"
        class="fixed inset-0 z-30 bg-black/50 lg:hidden"
        @click="ui.closeMobileDrawer()"
      />
    </Transition>
  </Teleport>

  <aside
    :class="[
      'flex flex-col h-full bg-surface-strong border-r border-border transition-all duration-200',
      'fixed inset-y-0 left-0 z-40 w-64',
      'lg:relative lg:z-auto lg:flex-shrink-0',
      ui.sidebarOpen ? 'lg:w-64' : 'lg:w-16',
      ui.mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Brand -->
    <div class="flex items-center gap-3 px-4 py-4 border-b border-border min-h-[64px]">
      <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-8 h-8 rounded-lg flex-shrink-0 object-contain" />
      <Transition name="fade">
        <div v-if="showExpanded" class="overflow-hidden">
          <p class="text-[10px] font-semibold text-ink-muted uppercase tracking-widest">ClaudyGod</p>
          <p class="text-sm font-bold text-ink leading-tight">Admin Studio</p>
        </div>
      </Transition>
    </div>

    <!-- User card -->
    <div class="flex items-center gap-2.5 px-3 py-3 border-b border-border">
      <UserAvatar :name="auth.user?.displayName ?? undefined" :email="auth.user?.email ?? undefined" size="sm" />
      <Transition name="fade">
        <div v-if="showExpanded" class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-ink truncate">{{ auth.user?.displayName || auth.user?.email }}</p>
          <RolePill :role="auth.role" />
        </div>
      </Transition>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
      <template v-for="group in NAV_GROUPS" :key="group.label">
        <p v-if="showExpanded" class="px-2.5 pt-4 pb-1.5 text-[9.5px] font-bold text-ink-muted/80 uppercase tracking-[0.12em] first:pt-1">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items.filter(i => auth.hasMinRole(i.minRole))"
          :key="item.to"
          :to="item.to"
          :class="[
            'relative flex items-center gap-3 pl-3 pr-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
            route.path.startsWith(item.to)
              ? 'bg-primary/10 text-primary-soft'
              : 'text-ink-soft hover:bg-surface-hover hover:text-ink',
          ]"
          :title="!showExpanded ? item.label : undefined"
          @click="ui.closeMobileDrawer()"
        >
          <span
            v-if="route.path.startsWith(item.to)"
            class="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary"
          />
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <Transition name="fade">
            <span v-if="showExpanded" class="truncate">{{ item.label }}</span>
          </Transition>
        </RouterLink>
      </template>
    </nav>

    <!-- Footer actions -->
    <div class="border-t border-border px-2 py-3 space-y-1">
      <button
        type="button"
        :class="['hidden lg:flex items-center gap-3 px-2.5 py-2 w-full rounded-xl text-xs font-medium text-ink-soft hover:bg-surface-hover hover:text-ink transition-colors', !showExpanded && 'justify-center']"
        :title="!showExpanded ? 'Toggle sidebar' : undefined"
        @click="ui.toggleSidebar()"
      >
        <component :is="showExpanded ? PanelLeftClose : PanelLeft" class="w-4 h-4 flex-shrink-0" />
        <Transition name="fade"><span v-if="showExpanded">Collapse</span></Transition>
      </button>
      <button
        type="button"
        :class="['flex items-center gap-3 px-2.5 py-2 w-full rounded-xl text-xs font-medium text-danger hover:bg-danger/8 transition-colors', !showExpanded && 'justify-center']"
        :title="!showExpanded ? 'Sign out' : undefined"
        @click="auth.logout()"
      >
        <LogOut class="w-4 h-4 flex-shrink-0" />
        <Transition name="fade"><span v-if="showExpanded">Sign out</span></Transition>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  LayoutDashboard, FileText, Inbox, KeyRound, Radio, Settings, BookOpen,
  Smartphone, Trash2, Megaphone, Users, BarChart3, Youtube, Server,
  PanelLeftClose, PanelLeft, LogOut,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { useAdminBreakpoints } from '@/composables/useAdminBreakpoints';
import { Role, BRAND_LOGO_URL } from '@/utils/constants';
import UserAvatar from '@/components/shared/UserAvatar.vue';
import RolePill from '@/components/shared/RolePill.vue';

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();
const { isDesktop } = useAdminBreakpoints();

// The desktop collapse-to-rail preference only makes sense at lg+ — the mobile
// drawer is always shown fully expanded (there's no "collapsed drawer" state).
const showExpanded = computed(() => !isDesktop.value || ui.sidebarOpen);

// Crossing back to desktop width should never leave a stray open drawer behind.
watch(isDesktop, (desktop) => {
  if (desktop) ui.closeMobileDrawer();
});

// Navigating anywhere should close the mobile drawer (no-op on desktop).
watch(() => route.path, () => {
  ui.closeMobileDrawer();
});

const ic = {
  dashboard: LayoutDashboard,
  content: FileText,
  requests: Inbox,
  accessReqs: KeyRound,
  live: Radio,
  config: Settings,
  word: BookOpen,
  preview: Smartphone,
  trash: Trash2,
  ads: Megaphone,
  users: Users,
  analytics: BarChart3,
  youtube: Youtube,
  system: Server,
};

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Overview', icon: ic.dashboard, minRole: Role.ADMIN },
      { to: '/content', label: 'Content', icon: ic.content, minRole: Role.MODERATOR },
      { to: '/content/trash', label: 'Trash', icon: ic.trash, minRole: Role.MODERATOR },
      { to: '/requests', label: 'Requests', icon: ic.requests, minRole: Role.MODERATOR },
      { to: '/live', label: 'Live', icon: ic.live, minRole: Role.MODERATOR },
    ],
  },
  {
    label: 'Publishing',
    items: [
      { to: '/config', label: 'Mobile config', icon: ic.config, minRole: Role.ADMIN },
      { to: '/word-of-day', label: 'Word of day', icon: ic.word, minRole: Role.MODERATOR },
      { to: '/preview', label: 'Mobile preview', icon: ic.preview, minRole: Role.MODERATOR },
      { to: '/ads', label: 'Ad campaigns', icon: ic.ads, minRole: Role.ADMIN },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/users', label: 'Users', icon: ic.users, minRole: Role.ADMIN },
      { to: '/access-requests', label: 'Access requests', icon: ic.accessReqs, minRole: Role.SUPER_ADMIN },
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
