import { createRouter, createWebHistory } from 'vue-router';
import { Role } from '@/utils/constants';
import { setupGuards } from './guards';
import AdminShell from '@/components/layout/AdminShell.vue';

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
    // ─── Auth (no shell) ────────────────────────────────────────────────────
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true, title: 'Sign in' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { public: true, title: 'Create account' },
    },

    // ─── Authenticated routes (wrapped in AdminShell) ────────────────────────
    {
      path: '/',
      component: AdminShell,
      redirect: '/dashboard',
      children: [
        // Dashboard
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
