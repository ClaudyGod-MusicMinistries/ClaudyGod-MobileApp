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
          <p class="text-sm font-bold text-ink leading-tight">Web Studio</p>
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

    <!-- Switch workspace -->
    <RouterLink
      to="/choose-workspace"
      :class="[
        'flex items-center gap-3 mx-2 mt-3 px-2.5 py-2 rounded-lg text-xs font-medium text-ink-soft hover:bg-white/6 hover:text-ink transition-colors border border-border',
        !showExpanded && 'justify-center',
      ]"
      :title="!showExpanded ? 'Switch workspace' : undefined"
    >
      <ArrowLeftRight class="w-4 h-4 flex-shrink-0" />
      <Transition name="fade"><span v-if="showExpanded">Switch workspace</span></Transition>
    </RouterLink>

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
              : 'text-ink-soft hover:bg-white/6 hover:text-ink',
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
        :class="['hidden lg:flex items-center gap-3 px-2.5 py-2 w-full rounded-xl text-xs font-medium text-ink-soft hover:bg-white/6 hover:text-ink transition-colors', !showExpanded && 'justify-center']"
        :title="!showExpanded ? 'Toggle sidebar' : undefined"
        @click="ui.toggleSidebar()"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <Transition name="fade"><span v-if="showExpanded">Collapse</span></Transition>
      </button>
      <button
        type="button"
        :class="['flex items-center gap-3 px-2.5 py-2 w-full rounded-xl text-xs font-medium text-danger hover:bg-danger/8 transition-colors', !showExpanded && 'justify-center']"
        :title="!showExpanded ? 'Sign out' : undefined"
        @click="auth.logout()"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <Transition name="fade"><span v-if="showExpanded">Sign out</span></Transition>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  LayoutDashboard, Disc3, ShoppingBag, Film, HelpCircle, CalendarDays, Newspaper,
  ClipboardList, Mail, HandHeart, HeartHandshake, Ticket, Users2, ArrowLeftRight,
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

const showExpanded = computed(() => !isDesktop.value || ui.sidebarOpen);

watch(isDesktop, (desktop) => {
  if (desktop) ui.closeMobileDrawer();
});

watch(() => route.path, () => {
  ui.closeMobileDrawer();
});

// claudygod.org content — proxied through services/api's /v1/website/* module
// to the real .NET website backend (CGM-Backend). Distinct resource set from
// the mobile NAV_GROUPS in AppSidebar.vue; kept as its own array here rather
// than a shared config since the two workspaces manage entirely different data.
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/web/dashboard', label: 'Overview', icon: LayoutDashboard, minRole: Role.ADMIN },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/web/albums', label: 'Albums', icon: Disc3, minRole: Role.ADMIN },
      { to: '/web/products', label: 'Store products', icon: ShoppingBag, minRole: Role.ADMIN },
      { to: '/web/media', label: 'Videos', icon: Film, minRole: Role.ADMIN },
      { to: '/web/faqs', label: 'FAQs', icon: HelpCircle, minRole: Role.ADMIN },
      { to: '/web/events', label: 'Events', icon: CalendarDays, minRole: Role.ADMIN },
      { to: '/web/blog', label: 'Journal', icon: Newspaper, minRole: Role.ADMIN },
    ],
  },
  {
    label: 'Inbox',
    items: [
      { to: '/web/bookings', label: 'Bookings', icon: ClipboardList, minRole: Role.ADMIN },
      { to: '/web/contacts', label: 'Contact messages', icon: Mail, minRole: Role.ADMIN },
      { to: '/web/volunteers', label: 'Volunteers', icon: HandHeart, minRole: Role.ADMIN },
      { to: '/web/prayer-requests', label: 'Prayer requests', icon: HeartHandshake, minRole: Role.ADMIN },
      { to: '/web/tickets', label: 'Tickets', icon: Ticket, minRole: Role.ADMIN },
      { to: '/web/subscribers', label: 'Subscribers', icon: Users2, minRole: Role.ADMIN },
    ],
  },
];
</script>
