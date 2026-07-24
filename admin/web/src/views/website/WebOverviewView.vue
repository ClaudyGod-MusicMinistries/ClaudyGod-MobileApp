<template>
  <div class="space-y-6">
    <!-- Greeting -->
    <div>
      <h1 class="text-2xl font-black text-ink tracking-tight">{{ greeting }}, {{ auth.user?.displayName || 'there' }}.</h1>
      <p class="text-sm text-ink-muted mt-1">Here's what's happening on claudygod.org today.</p>
    </div>

    <!-- Pending-attention signals — only shown when something actually needs a look -->
    <div v-if="signals.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <div
        v-for="signal in signals"
        :key="signal.id"
        class="flex items-start gap-3 p-3.5 rounded-xl border bg-warning/10 border-warning/20 text-warning"
      >
        <AlertTriangle class="w-4 h-4 mt-0.5 shrink-0" />
        <div class="min-w-0">
          <p class="text-xs font-bold leading-tight">{{ signal.title }}</p>
          <p class="text-[11px] mt-0.5 text-ink-muted leading-snug">{{ signal.detail }}</p>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <RouterLink
        v-for="action in quickActions"
        :key="action.to"
        :to="action.to"
        class="flex flex-col items-start gap-2.5 p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors"
      >
        <div class="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <component :is="action.icon" class="w-5 h-5 text-primary" />
        </div>
        <p class="text-sm font-bold text-ink leading-tight">{{ action.label }}</p>
      </RouterLink>
    </div>

    <!-- Stat cards — real counts from CGM-Backend's admin dashboard endpoint -->
    <div v-if="dashboard.data" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <AppStatCard label="Albums &amp; media" :value="dashboard.data.totalMediaItems" icon-bg="bg-primary/15">
        <template #icon><Film class="w-5 h-5 text-primary" /></template>
      </AppStatCard>
      <AppStatCard label="Upcoming events" :value="dashboard.data.upcomingEvents" icon-bg="bg-info/15">
        <template #icon><CalendarDays class="w-5 h-5 text-info" /></template>
      </AppStatCard>
      <AppStatCard label="Published posts" :value="dashboard.data.publishedBlogPosts" icon-bg="bg-success/15">
        <template #icon><Newspaper class="w-5 h-5 text-success" /></template>
      </AppStatCard>
      <AppStatCard label="Active subscribers" :value="dashboard.data.activeSubscribers" icon-bg="bg-primary/15">
        <template #icon><Users2 class="w-5 h-5 text-primary-soft" /></template>
      </AppStatCard>
      <AppStatCard label="Tickets reserved" :value="dashboard.data.totalTickets" icon-bg="bg-warning/15">
        <template #icon><Ticket class="w-5 h-5 text-warning" /></template>
      </AppStatCard>
    </div>

    <!-- Inbox status board -->
    <div>
      <h2 class="text-sm font-bold text-ink mb-3">Inbox — needs a look</h2>
      <AppCard class="p-4 space-y-2">
        <div v-for="item in inboxBoard" :key="item.label" class="flex items-center justify-between py-1.5">
          <RouterLink :to="item.to" class="text-sm text-ink-soft hover:text-ink transition-colors">
            {{ item.label }}
          </RouterLink>
          <span :class="['text-sm font-bold tabular-nums', item.count > 0 ? 'text-warning' : 'text-ink-muted']">
            {{ item.count }}
          </span>
        </div>
        <AppEmptyState v-if="!dashboard.data && !dashboard.isLoading" title="Unable to load inbox counts" />
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  AlertTriangle, Disc3, ShoppingBag, Film, HelpCircle, CalendarDays, Newspaper,
  Users2, Ticket,
} from 'lucide-vue-next';
import { useWebDashboardStore } from '@/stores/website/webDashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppStatCard from '@/components/ui/AppStatCard.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';

const dashboard = useWebDashboardStore();
const auth = useAuthStore();

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
});

onMounted(() => { void dashboard.fetchDashboard(); });

const quickActions = [
  { to: '/web/albums', label: 'Albums', icon: Disc3 },
  { to: '/web/products', label: 'Store products', icon: ShoppingBag },
  { to: '/web/media', label: 'Videos', icon: Film },
  { to: '/web/faqs', label: 'FAQs', icon: HelpCircle },
  { to: '/web/events', label: 'Events', icon: CalendarDays },
  { to: '/web/blog', label: 'Journal', icon: Newspaper },
];

const signals = computed(() => {
  const d = dashboard.data;
  if (!d) return [];
  const list: Array<{ id: string; title: string; detail: string }> = [];
  if (d.pendingBookings > 0) {
    list.push({ id: 'bookings', title: `${d.pendingBookings} pending booking${d.pendingBookings === 1 ? '' : 's'}`, detail: 'Awaiting a response' });
  }
  if (d.unreadMessages > 0) {
    list.push({ id: 'contacts', title: `${d.unreadMessages} unread message${d.unreadMessages === 1 ? '' : 's'}`, detail: 'From the contact form' });
  }
  if (d.pendingVolunteers > 0) {
    list.push({ id: 'volunteers', title: `${d.pendingVolunteers} volunteer application${d.pendingVolunteers === 1 ? '' : 's'}`, detail: 'Awaiting approval' });
  }
  if (d.pendingPrayerRequests > 0) {
    list.push({ id: 'prayer', title: `${d.pendingPrayerRequests} prayer request${d.pendingPrayerRequests === 1 ? '' : 's'}`, detail: 'Not yet responded to' });
  }
  return list;
});

const inboxBoard = computed(() => {
  const d = dashboard.data;
  return [
    { label: 'Pending bookings', count: d?.pendingBookings ?? 0, to: '/web/bookings' },
    { label: 'Unread contact messages', count: d?.unreadMessages ?? 0, to: '/web/contacts' },
    { label: 'Volunteer applications awaiting approval', count: d?.pendingVolunteers ?? 0, to: '/web/volunteers' },
    { label: 'Prayer requests awaiting a response', count: d?.pendingPrayerRequests ?? 0, to: '/web/prayer-requests' },
  ];
});
</script>
