<template>
  <AppPage
    eyebrow="Website operations"
    :title="`${greeting}, ${firstName}`"
    description="Publish website content, monitor incoming requests, and handle everything requiring attention from one workspace."
  >
    <template #actions>
      <AppButton variant="secondary" size="sm" :loading="dashboard.isLoading" @click="dashboard.fetchDashboard()">
        <RefreshCw class="h-4 w-4" /> Refresh data
      </AppButton>
    </template>

    <AppCard v-if="dashboard.error" class="border-danger/30 bg-danger/10">
      <AppEmptyState title="Website data is unavailable" :message="dashboard.error">
        <template #action><AppButton size="sm" variant="secondary" @click="dashboard.fetchDashboard">Try again</AppButton></template>
      </AppEmptyState>
    </AppCard>

    <div v-if="signals.length" class="app-grid-auto" aria-label="Items requiring attention">
      <RouterLink v-for="signal in signals" :key="signal.id" :to="signal.to" class="flex items-start gap-3 rounded-[var(--radius-card)] border border-amber/20 bg-amber/10 p-4 text-amber transition-base hover:-translate-y-0.5 hover:border-amber/35">
        <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
        <div class="min-w-0"><p class="text-xs font-semibold leading-tight">{{ signal.title }}</p><p class="mt-1 text-xs leading-5 text-ink-muted">{{ signal.detail }}</p></div>
      </RouterLink>
    </div>

    <AppSection title="Quick actions" description="Jump directly to the most common publishing workflows.">
      <div class="app-grid-auto">
        <AppActionTile v-for="action in quickActions" :key="action.to" :to="action.to" :label="action.label" :description="action.description">
          <template #icon><component :is="action.icon" class="h-5 w-5" /></template>
        </AppActionTile>
      </div>
    </AppSection>

    <AppSection title="Website performance" description="Live operational totals from the website source of truth.">
      <div v-if="dashboard.data" class="app-grid-auto">
        <AppStatCard label="Albums & media" :value="dashboard.data.totalMediaItems" icon-bg="bg-primary/15"><template #icon><Film class="h-5 w-5 text-primary" /></template></AppStatCard>
        <AppStatCard label="Upcoming events" :value="dashboard.data.upcomingEvents" icon-bg="bg-info/15"><template #icon><CalendarDays class="h-5 w-5 text-info" /></template></AppStatCard>
        <AppStatCard label="Published posts" :value="dashboard.data.publishedBlogPosts" icon-bg="bg-success/15"><template #icon><Newspaper class="h-5 w-5 text-success" /></template></AppStatCard>
        <AppStatCard label="Active subscribers" :value="dashboard.data.activeSubscribers" icon-bg="bg-primary/15"><template #icon><Users2 class="h-5 w-5 text-primary-soft" /></template></AppStatCard>
        <AppStatCard label="Tickets reserved" :value="dashboard.data.totalTickets" icon-bg="bg-amber/15"><template #icon><Ticket class="h-5 w-5 text-amber" /></template></AppStatCard>
      </div>
      <div v-else-if="dashboard.isLoading" class="app-grid-auto" aria-label="Loading website statistics">
        <div v-for="n in 5" :key="n" class="h-32 animate-pulse rounded-[var(--radius-card)] border border-border bg-surface" />
      </div>
    </AppSection>

    <AppSection title="Inbox requiring attention" description="Prioritized requests submitted through the public website." padded>
      <div v-for="item in inboxBoard" :key="item.label" class="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-base hover:bg-surface-hover">
        <RouterLink :to="item.to" class="text-sm font-medium text-ink-soft hover:text-primary-soft">{{ item.label }}</RouterLink>
        <span :class="['min-w-8 rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums', item.count > 0 ? 'bg-amber/10 text-amber' : 'bg-surface-hover text-ink-muted']">{{ item.count }}</span>
      </div>
      <AppEmptyState v-if="!dashboard.data && !dashboard.isLoading && !dashboard.error" title="No dashboard data available" />
    </AppSection>
  </AppPage>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { AlertTriangle, CalendarDays, Disc3, Film, HelpCircle, Newspaper, RefreshCw, ShoppingBag, Ticket, Users2 } from 'lucide-vue-next';
import { useWebDashboardStore } from '@/stores/website/webDashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import AppActionTile from '@/components/ui/AppActionTile.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppPage from '@/components/ui/AppPage.vue';
import AppSection from '@/components/ui/AppSection.vue';
import AppStatCard from '@/components/ui/AppStatCard.vue';

const dashboard = useWebDashboardStore();
const auth = useAuthStore();
const firstName = computed(() => auth.user?.displayName?.trim().split(/\s+/)[0] || 'Administrator');
const greeting = computed(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; });
onMounted(() => { void dashboard.fetchDashboard(); });

const quickActions = [
  { to: '/web/albums', label: 'Albums', description: 'Manage music releases', icon: Disc3 },
  { to: '/web/products', label: 'Store products', description: 'Update the catalogue', icon: ShoppingBag },
  { to: '/web/media', label: 'Videos', description: 'Publish linked media', icon: Film },
  { to: '/web/faqs', label: 'FAQs', description: 'Maintain help content', icon: HelpCircle },
  { to: '/web/events', label: 'Events', description: 'Plan upcoming events', icon: CalendarDays },
  { to: '/web/blog', label: 'Journal', description: 'Write and publish posts', icon: Newspaper },
];

const signals = computed(() => {
  const d = dashboard.data;
  if (!d) return [];
  return [
    { id: 'bookings', count: d.pendingBookings, title: `${d.pendingBookings} pending booking${d.pendingBookings === 1 ? '' : 's'}`, detail: 'Awaiting a response', to: '/web/bookings' },
    { id: 'contacts', count: d.unreadMessages, title: `${d.unreadMessages} unread message${d.unreadMessages === 1 ? '' : 's'}`, detail: 'Submitted through the contact form', to: '/web/contacts' },
    { id: 'volunteers', count: d.pendingVolunteers, title: `${d.pendingVolunteers} volunteer application${d.pendingVolunteers === 1 ? '' : 's'}`, detail: 'Awaiting approval', to: '/web/volunteers' },
    { id: 'prayer', count: d.pendingPrayerRequests, title: `${d.pendingPrayerRequests} prayer request${d.pendingPrayerRequests === 1 ? '' : 's'}`, detail: 'Not yet responded to', to: '/web/prayer-requests' },
  ].filter((item) => item.count > 0);
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
