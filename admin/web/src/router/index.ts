import { createRouter, createWebHistory } from 'vue-router';
import { Role } from '@/utils/constants';
import { setupGuards } from './guards';
import AdminShell from '@/components/layout/AdminShell.vue';
import WebAdminShell from '@/components/layout/WebAdminShell.vue';

// Auth views are eagerly imported so they appear instantly without a lazy-load
// flash on page refresh (the main cause of "scaffolding" visible during route init).
import LandingView from '@/views/auth/LandingView.vue';
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';
import RequestAccessView from '@/views/auth/RequestAccessView.vue';
import ChooseWorkspaceView from '@/views/auth/ChooseWorkspaceView.vue';

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean;
    minRole?: Role;
    title?: string;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ─── Public gateway ─────────────────────────────────────────────────────────
    {
      path: '/',
      name: 'landing',
      component: LandingView,
      meta: { public: true, title: 'Welcome' },
    },

    // ─── Auth (no shell) ────────────────────────────────────────────────────────
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true, title: 'Sign in' },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { public: true, title: 'Create account' },
    },
    {
      path: '/request-access',
      name: 'request-access',
      component: RequestAccessView,
      meta: { public: true, title: 'Request access' },
    },

    // ─── Post-login workspace chooser (no shell — Mobile/Web are two
    // completely separate shells/nav sets, chosen before either loads) ───────
    {
      path: '/choose-workspace',
      name: 'choose-workspace',
      component: ChooseWorkspaceView,
      meta: { title: 'Choose workspace' },
    },

    // ─── Authenticated routes (wrapped in a single shared AdminShell) ────────
    {
      path: '/',
      component: AdminShell,
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/OverviewView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Overview' },
        },
        // Content
        {
          path: 'content',
          name: 'content',
          component: () => import('@/views/content/ContentListView.vue'),
          meta: { minRole: Role.MODERATOR, title: 'Content' },
        },
        {
          path: 'content/new',
          name: 'content-new',
          component: () => import('@/views/content/ContentEditView.vue'),
          meta: { minRole: Role.CREATOR, title: 'New content' },
        },
        {
          path: 'content/:id',
          name: 'content-edit',
          component: () => import('@/views/content/ContentEditView.vue'),
          meta: { minRole: Role.CREATOR, title: 'Edit content' },
        },
        {
          path: 'content/trash',
          name: 'content-trash',
          component: () => import('@/views/content/ContentTrashView.vue'),
          meta: { minRole: Role.MODERATOR, title: 'Trash' },
        },
        {
          path: 'requests',
          name: 'requests',
          component: () => import('@/views/content/ContentRequestsView.vue'),
          meta: { minRole: Role.MODERATOR, title: 'Content requests' },
        },
        // Live
        {
          path: 'live',
          name: 'live',
          component: () => import('@/views/live/LiveView.vue'),
          meta: { minRole: Role.MODERATOR, title: 'Live sessions' },
        },
        // Config
        {
          path: 'config',
          name: 'config',
          component: () => import('@/views/config/MobileConfigView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Mobile config' },
        },
        {
          path: 'word-of-day',
          name: 'word-of-day',
          component: () => import('@/views/config/WordOfDayView.vue'),
          meta: { minRole: Role.MODERATOR, title: 'Word of the day' },
        },
        {
          path: 'preview',
          name: 'mobile-preview',
          component: () => import('@/views/preview/PreviewView.vue'),
          meta: { minRole: Role.MODERATOR, title: 'Mobile preview' },
        },
        // Ads
        {
          path: 'ads',
          name: 'ads',
          component: () => import('@/views/ads/AdsView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Ad campaigns' },
        },
        // Users
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/UsersView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Users' },
        },
        {
          path: 'access-requests',
          name: 'access-requests',
          component: () => import('@/views/users/AccessRequestsView.vue'),
          meta: { minRole: Role.SUPER_ADMIN, title: 'Access requests' },
        },
        // Analytics
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('@/views/analytics/AnalyticsView.vue'),
          meta: { minRole: Role.MODERATOR, title: 'Analytics' },
        },
        // YouTube
        {
          path: 'youtube',
          name: 'youtube',
          component: () => import('@/views/youtube/YouTubeView.vue'),
          meta: { minRole: Role.ADMIN, title: 'YouTube' },
        },
        // System
        {
          path: 'system',
          name: 'system',
          component: () => import('@/views/system/SystemView.vue'),
          meta: { minRole: Role.SUPER_ADMIN, title: 'System' },
        },
      ],
    },

    // ─── Web Studio — claudygod.org content/inbox, entirely separate shell
    // and nav set from the mobile workspace above. Every action here proxies
    // through services/api's /v1/website/* module to CGM-Backend. ───────────
    {
      path: '/web',
      component: WebAdminShell,
      children: [
        {
          path: 'dashboard',
          name: 'web-dashboard',
          component: () => import('@/views/website/WebOverviewView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Overview' },
        },
        {
          path: 'albums',
          name: 'web-albums',
          component: () => import('@/views/website/albums/AlbumsListView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Albums' },
        },
        {
          path: 'products',
          name: 'web-products',
          component: () => import('@/views/website/products/ProductsListView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Store products' },
        },
        {
          path: 'media',
          name: 'web-media',
          component: () => import('@/views/website/media/MediaListView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Videos' },
        },
        {
          path: 'faqs',
          name: 'web-faqs',
          component: () => import('@/views/website/faqs/FaqsListView.vue'),
          meta: { minRole: Role.ADMIN, title: 'FAQs' },
        },
        {
          path: 'events',
          name: 'web-events',
          component: () => import('@/views/website/events/EventsListView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Events' },
        },
        {
          path: 'blog',
          name: 'web-blog',
          component: () => import('@/views/website/WebComingSoonView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Journal' },
        },
        {
          path: 'bookings',
          name: 'web-bookings',
          component: () => import('@/views/website/WebComingSoonView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Bookings' },
        },
        {
          path: 'contacts',
          name: 'web-contacts',
          component: () => import('@/views/website/WebComingSoonView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Contact messages' },
        },
        {
          path: 'volunteers',
          name: 'web-volunteers',
          component: () => import('@/views/website/WebComingSoonView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Volunteers' },
        },
        {
          path: 'prayer-requests',
          name: 'web-prayer-requests',
          component: () => import('@/views/website/WebComingSoonView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Prayer requests' },
        },
        {
          path: 'tickets',
          name: 'web-tickets',
          component: () => import('@/views/website/WebComingSoonView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Tickets' },
        },
        {
          path: 'subscribers',
          name: 'web-subscribers',
          component: () => import('@/views/website/WebComingSoonView.vue'),
          meta: { minRole: Role.ADMIN, title: 'Subscribers' },
        },
      ],
    },

    // ─── Catch-all ───────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/choose-workspace',
    },
  ],
});

setupGuards(router);

export { router };
export default router;
