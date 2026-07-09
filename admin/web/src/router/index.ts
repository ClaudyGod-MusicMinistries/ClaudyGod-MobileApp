import { createRouter, createWebHistory } from 'vue-router';
import { Role } from '@/utils/constants';
import { setupGuards } from './guards';
import AdminShell from '@/components/layout/AdminShell.vue';

// Auth views are eagerly imported so they appear instantly without a lazy-load
// flash on page refresh (the main cause of "scaffolding" visible during route init).
import LandingView from '@/views/auth/LandingView.vue';
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';
import RequestAccessView from '@/views/auth/RequestAccessView.vue';

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

    // ─── Catch-all ───────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
});

setupGuards(router);

export { router };
export default router;
