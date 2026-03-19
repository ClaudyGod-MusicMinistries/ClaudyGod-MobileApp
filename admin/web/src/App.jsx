import axios from 'axios';
import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import './App.css';

function isPrivateOrLocalHostname(hostname) {
  const value = String(hostname || '').trim().toLowerCase();
  if (!value) return true;

  if (
    value === 'localhost' ||
    value === '127.0.0.1' ||
    value === '::1' ||
    value === '0.0.0.0' ||
    value === 'host.docker.internal' ||
    value === '10.0.2.2'
  ) {
    return true;
  }

  if (value.endsWith('.local')) {
    return true;
  }

  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(value)) {
    return true;
  }

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
    return true;
  }

  const private172 = value.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (private172) {
    const secondOctet = Number(private172[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

function deriveSiblingOrigin(targetSubdomain) {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const current = new URL(window.location.href);
    if (isPrivateOrLocalHostname(current.hostname)) {
      return '';
    }

    const parts = current.hostname.split('.');
    if (parts.length < 3) {
      return '';
    }

    return `${current.protocol}//${targetSubdomain}.${parts.slice(1).join('.')}`;
  } catch (error) {
    return '';
  }
}

function resolveApiUrl() {
  const explicit = String(import.meta.env.VITE_API_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  return deriveSiblingOrigin('api');
}

const API_URL = resolveApiUrl();
const GOOGLE_LOGIN_URL = import.meta.env.VITE_GOOGLE_LOGIN_URL || '';
const ACCESS_TOKEN_KEY = 'claudy_admin_access_token';
const MOBILE_PREVIEW_URL_KEY = 'claudy_admin_mobile_preview_url';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const BRAND_LOGO_URL = '/brand/claudy-logo.webp';
const CONTENT_TYPES = ['audio', 'video', 'playlist', 'announcement'];
const VISIBILITY_OPTIONS = ['draft', 'published'];
const YOUTUBE_SYNC_DEFAULT_LIMIT = 8;
const DEFAULT_MOBILE_PREVIEW_URL =
  import.meta.env.VITE_MOBILE_PREVIEW_URL || deriveSiblingOrigin('app') || '';
const WORKFLOW_STEPS = [
  {
    title: 'Create',
    detail: 'Add media details, upload files, and set app sections.',
  },
  {
    title: 'Review',
    detail: 'Keep entries in draft until your team validates quality and metadata.',
  },
  {
    title: 'Publish',
    detail: 'Release to the mobile experience and monitor endpoint health.',
  },
];
const API_HOST_LABEL = (() => {
  if (!API_URL) {
    return 'configured API endpoint';
  }
  try {
    return new URL(API_URL).host;
  } catch (error) {
    return String(API_URL || '').replace(/^https?:\/\//i, '');
  }
})();

const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

function readStoredToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  } catch (error) {
    return '';
  }
}

function normalizePreviewUrl(value) {
  const next = String(value || '').trim();
  if (!next) return DEFAULT_MOBILE_PREVIEW_URL;
  if (/^https?:\/\//i.test(next)) return next;
  return `https://${next}`;
}

function readStoredMobilePreviewUrl() {
  try {
    const stored = localStorage.getItem(MOBILE_PREVIEW_URL_KEY) || '';
    if (stored.trim()) {
      return normalizePreviewUrl(stored);
    }
  } catch (error) {
    // Keep default URL when storage is unavailable.
  }
  return normalizePreviewUrl(DEFAULT_MOBILE_PREVIEW_URL);
}

function storeToken(token) {
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    // Storage can be blocked in strict privacy modes; keep runtime functional.
  }
}

function applyToken(token) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete http.defaults.headers.common.Authorization;
}

function readValue(event) {
  return event && event.target ? event.target.value : '';
}

function readChecked(event) {
  return Boolean(event && event.target ? event.target.checked : false);
}

function toErrorMessage(error, fallback) {
  if (axios.isAxiosError(error)) {
    const errorCode = String(error.code || '').toUpperCase();
    const errorMessage = String(error.message || '').toLowerCase();

    if (errorCode === 'ECONNABORTED' || errorMessage.includes('timeout')) {
      return `The API at ${API_HOST_LABEL} did not respond in time. Confirm the backend is running and that PostgreSQL is reachable from the API.`;
    }
    if (error.response?.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission for this action.';
    }
    if (!error.response) {
      return `Unable to reach the API at ${API_HOST_LABEL}. Confirm the API domain, reverse proxy, and CORS configuration.`;
    }
    const data = error.response && error.response.data ? error.response.data : {};
    return data.message || data.error || error.message || fallback;
  }
  if (error && error.message) return error.message;
  return fallback;
}

function formatDateTime(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString();
}

function truncate(value, size = 180) {
  if (!value) return '';
  if (value.length <= size) return value;
  return `${value.slice(0, size - 1)}...`;
}

function humanizeToken(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function greetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function parseCsvList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function describeHealthCheckDetail(payload) {
  const services = payload && payload.services ? payload.services : null;
  const capabilities = payload && payload.capabilities ? payload.capabilities : null;
  if (!services) return 'Core API responding';

  const details = [];
  if (services.postgres) {
    details.push(`PostgreSQL: ${services.postgres}`);
  }
  if (services.redis) {
    details.push(`Redis: ${services.redis}`);
  }
  if (capabilities && capabilities.youtube === false) {
    details.push('YouTube is disabled in API environment');
  }

  return details.length > 0 ? details.join(' • ') : 'Core API responding';
}

function acceptFromPolicy(policy) {
  if (!policy || !Array.isArray(policy.allowedExtensions) || policy.allowedExtensions.length === 0) return undefined;
  return policy.allowedExtensions.join(',');
}

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default defineComponent({
  name: 'ClaudyContentStudio',
  setup() {
    const accessToken = ref(readStoredToken());
    const currentUser = ref(null);
    const authLoading = ref(false);
    const authMode = ref('login');
    const appLoading = ref(false);
    const contentLoading = ref(false);
    const savingContent = ref(false);
    const togglingId = ref(null);
    const youtubePreviewLoading = ref(false);
    const youtubeSyncLoading = ref(false);
    const youtubeImporting = ref(false);
    const appConfigLoading = ref(false);
    const appConfigSaving = ref(false);
    const wordOfDayLoading = ref(false);
    const wordOfDaySaving = ref(false);
    const adminOpsLoading = ref(false);
    const deletingContentId = ref(null);
    const editingContentId = ref(null);
    const editContentOpen = ref(false);
    const editContentSaving = ref(false);
    const supportStatusUpdatingId = ref(null);
    const headerMenuOpen = ref(false);
    const dashboardView = ref('overview');
    const inactivityTimerId = ref(null);
    const authResponseInterceptorId = ref(null);
    const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1366);
    const uploadingAsset = ref(false);
    const uploadPoliciesLoading = ref(false);
    const uploadPolicies = ref([]);
    const endpointChecksLoading = ref(false);
    const endpointChecks = ref([]);
    const endpointChecksAt = ref('');
    const publicHealthLoading = ref(false);
    const publicHealth = ref(null);
    const mobilePreviewUrl = ref(readStoredMobilePreviewUrl());
    const mobilePreviewDraft = ref(mobilePreviewUrl.value);
    const mobilePreviewFrameKey = ref(0);
    const notice = ref('');
    const noticeKind = ref('success');

    const authForm = reactive({
      email: '',
      password: '',
      username: '',
      confirmPassword: '',
    });

    const createForm = reactive({
      title: '',
      description: '',
      type: 'audio',
      url: '',
      thumbnailUrl: '',
      mediaUploadSessionId: '',
      thumbnailUploadSessionId: '',
      channelName: '',
      duration: '',
      tagsCsv: '',
      appSectionsCsv: '',
      visibility: 'published',
    });

    const filterState = reactive({
      search: '',
      type: 'all',
      visibility: 'all',
    });

    const pagination = reactive({
      page: 1,
      limit: 50,
      total: 0,
    });

    const youtubeSyncState = reactive({
      channelId: '',
      maxResults: YOUTUBE_SYNC_DEFAULT_LIMIT,
      visibility: 'draft',
      appSectionsCsv: '',
    });

    const managedItems = ref([]);
    const youtubePreviewItems = ref([]);
    const youtubeDraftItems = ref([]);
    const mobileAppConfigEditor = ref('');
    const mobileAppConfigMeta = ref(null);
    const wordOfDayHistory = ref([]);
    const wordOfDayCurrent = ref(null);
    const adminOps = ref({
      summary: {
        totalUsers: 0,
        newUsersLast7Days: 0,
        verifiedUsers: 0,
        adminUsers: 0,
        clientUsers: 0,
        publishedContent: 0,
        draftContent: 0,
        openSupportRequests: 0,
        activePrivacyRequests: 0,
        totalFeedback: 0,
        averageRating: null,
      },
      recentUsers: [],
      feedback: [],
      supportInbox: [],
      signupTrend: [],
      smartInsights: [],
      recentAutomation: [],
      generatedAt: '',
    });
    const wordOfDayForm = reactive({
      title: 'Word for Today',
      passage: '',
      verse: '',
      reflection: '',
      messageDate: todayDateInputValue(),
      status: 'published',
      notifySubscribers: true,
    });
    const editForm = reactive({
      title: '',
      description: '',
      type: 'audio',
      url: '',
      thumbnailUrl: '',
      visibility: 'draft',
      channelName: '',
      duration: '',
      tagsCsv: '',
      appSectionsCsv: '',
    });
    const currentYear = new Date().getFullYear();

    const greeting = computed(() => greetingByTime());
    const displayName = computed(() => (currentUser.value && currentUser.value.displayName ? currentUser.value.displayName : 'Publishing User'));
    const accountEmail = computed(() => (currentUser.value && currentUser.value.email ? currentUser.value.email : ''));
    const isRegisterMode = computed(() => authMode.value === 'register');
    const isAdmin = computed(() => Boolean(currentUser.value && currentUser.value.role === 'ADMIN'));
    const portalRoleLabel = computed(() => (isAdmin.value ? 'Admin' : 'Publisher'));
    const isCompactHeader = computed(() => viewportWidth.value <= 1024);
    const googleLoginEnabled = computed(() => Boolean(GOOGLE_LOGIN_URL));
    const publicHealthTone = computed(() => {
      if (!publicHealth.value) return 'subtle';
      if (publicHealth.value.status === 'ok') return 'success';
      return 'warning';
    });
    const publicHealthSummary = computed(() => {
      if (publicHealthLoading.value) return 'Checking backend';
      if (!publicHealth.value) return 'Awaiting backend check';
      if (publicHealth.value.status === 'ok') return 'Backend ready';
      if (publicHealth.value.services?.postgres === 'down') return 'Database unavailable';
      if (publicHealth.value.status === 'offline') return 'API unavailable';
      return 'Backend needs attention';
    });
    const databaseTargetLabel = computed(() => {
      const target = publicHealth.value?.capabilities?.databaseTarget;
      if (target === 'supabase-postgres') return 'Supabase PostgreSQL';
      if (target === 'external-postgres') return 'External PostgreSQL';
      return 'Database target pending';
    });
    const apiHealthCheck = computed(() =>
      (endpointChecks.value || []).find((check) => check && check.label === 'API Health') || null,
    );

    const stats = computed(() => {
      const total = managedItems.value.length;
      const published = managedItems.value.filter((item) => item.visibility === 'published').length;
      const drafts = managedItems.value.filter((item) => item.visibility === 'draft').length;
      const videoItems = managedItems.value.filter((item) => item.type === 'video').length;
      const summary = adminOps.value.summary || {};

      if (isAdmin.value) {
        return [
          { label: 'Published Content', value: summary.publishedContent || published, accent: 'mint' },
          { label: 'Draft Content', value: summary.draftContent || drafts, accent: 'blue' },
          { label: 'Registered Users', value: summary.totalUsers || 0, accent: 'amber' },
          { label: 'Open Complaints', value: summary.openSupportRequests || 0, accent: 'rose' },
        ];
      }

      return [
        { label: 'All Content', value: total, accent: 'mint' },
        { label: 'Published', value: published, accent: 'blue' },
        { label: 'Drafts', value: drafts, accent: 'amber' },
        { label: 'Video Items', value: videoItems, accent: 'rose' },
      ];
    });

    const audienceStats = computed(() => {
      const summary = adminOps.value.summary || {};
      return [
        { label: 'Registered Users', value: summary.totalUsers || 0, accent: 'mint' },
        { label: 'New This Week', value: summary.newUsersLast7Days || 0, accent: 'blue' },
        { label: 'Open Complaints', value: summary.openSupportRequests || 0, accent: 'amber' },
        { label: 'Avg. Rating', value: summary.averageRating != null ? summary.averageRating : '--', accent: 'rose' },
      ];
    });

    const filteredItems = computed(() => {
      const query = (filterState.search || '').trim().toLowerCase();
      return managedItems.value.filter((item) => {
        if (filterState.type !== 'all' && item.type !== filterState.type) return false;
        if (filterState.visibility !== 'all' && item.visibility !== filterState.visibility) return false;
        if (!query) return true;
        const haystack = [item.title, item.description, item.author && item.author.displayName ? item.author.displayName : '', item.url || '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    });

    const recentItems = computed(() => managedItems.value.slice(0, 4));
    const selectedYouTubeDraftCount = computed(() =>
      youtubeDraftItems.value.filter((item) => item.selected).length,
    );

    function getUploadPolicy(kind) {
      return (uploadPolicies.value || []).find((item) => item && item.kind === kind) || null;
    }

    function resolveMediaAssetKind() {
      if (createForm.type === 'audio') return 'audio';
      if (createForm.type === 'video') return 'video';
      return null;
    }

    function setNotice(message, kind = 'success') {
      notice.value = message;
      noticeKind.value = kind;
    }

    function clearNotice() {
      notice.value = '';
    }

    function persistToken(token) {
      if (token) {
        storeToken(token);
        accessToken.value = token;
        applyToken(token);
        syncSessionTracking();
        return;
      }
      storeToken(null);
      accessToken.value = '';
      applyToken(null);
      syncSessionTracking();
    }

    function syncViewport() {
      if (typeof window === 'undefined') return;
      viewportWidth.value = window.innerWidth;
      if (viewportWidth.value > 1120 && headerMenuOpen.value) {
        headerMenuOpen.value = false;
      }
    }

    function toggleHeaderMenu() {
      headerMenuOpen.value = !headerMenuOpen.value;
    }

    function closeHeaderMenu() {
      headerMenuOpen.value = false;
    }

    function setDashboardView(view) {
      dashboardView.value = view;
      closeHeaderMenu();
    }

    function applyMobilePreviewUrl() {
      const next = normalizePreviewUrl(mobilePreviewDraft.value);
      mobilePreviewDraft.value = next;
      mobilePreviewUrl.value = next;
      mobilePreviewFrameKey.value += 1;
      try {
        localStorage.setItem(MOBILE_PREVIEW_URL_KEY, next);
      } catch (error) {
        // Keep runtime value if storage is unavailable.
      }
    }

    function reloadMobilePreview() {
      mobilePreviewFrameKey.value += 1;
    }

    function mapProbeError(error, fallback) {
      if (axios.isAxiosError(error)) {
        return {
          statusCode: error.response?.status ?? 0,
          detail: toErrorMessage(error, fallback),
        };
      }
      return {
        statusCode: 0,
        detail: error && error.message ? error.message : fallback,
      };
    }

    async function runEndpointChecks() {
      endpointChecksLoading.value = true;

      const probes = [
        {
          label: 'API Health',
          path: '/health',
          request: () => http.get('/health'),
        },
        {
          label: 'Public Content Feed',
          path: '/v1/content?page=1&limit=6',
          request: () => http.get('/v1/content', { params: { page: 1, limit: 6 } }),
        },
        {
          label: 'Mobile Content Feed',
          path: '/v1/mobile/content?page=1&limit=6',
          request: () => http.get('/v1/mobile/content', { params: { page: 1, limit: 6 } }),
        },
        {
          label: 'Mobile App Config',
          path: '/v1/mobile/app/config',
          request: () => http.get('/v1/mobile/app/config'),
        },
        {
          label: 'Mobile YouTube Feed',
          path: '/v1/mobile/youtube/videos?maxResults=3',
          request: () => http.get('/v1/mobile/youtube/videos', { params: { maxResults: 3 } }),
        },
      ];

      if (accessToken.value) {
        probes.push({
          label: 'Creator Content Management',
          path: '/v1/content/manage?page=1&limit=1',
          request: () => http.get('/v1/content/manage', { params: { page: 1, limit: 1 } }),
        });
      }

      if (isAdmin.value) {
        probes.push({
          label: 'Admin Operations Dashboard',
          path: '/v1/admin/dashboard',
          request: () => http.get('/v1/admin/dashboard'),
        });
        probes.push({
          label: 'Admin YouTube Feed',
          path: '/v1/youtube/videos?maxResults=3',
          request: () => http.get('/v1/youtube/videos', { params: { maxResults: 3 } }),
        });
      }

      try {
        const checks = await Promise.all(
          probes.map(async (probe) => {
            try {
              const response = await probe.request();
              const youtubeDisabled =
                probe.label === 'API Health' &&
                response.data &&
                response.data.capabilities &&
                response.data.capabilities.youtube === false;
              return {
                label: probe.label,
                path: probe.path,
                status: 'ok',
                statusCode: response.status,
                capabilities: probe.label === 'API Health' ? response.data?.capabilities || null : null,
                services: probe.label === 'API Health' ? response.data?.services || null : null,
                detail: probe.label === 'API Health'
                  ? describeHealthCheckDetail(response.data)
                  : 'Connected',
              };
            } catch (error) {
              const mapped = mapProbeError(error, `${probe.label} request failed`);
              return {
                label: probe.label,
                path: probe.path,
                status: 'error',
                statusCode: mapped.statusCode,
                capabilities: probe.label === 'API Health' ? error.response?.data?.capabilities || null : null,
                services: probe.label === 'API Health' ? error.response?.data?.services || null : null,
                detail: probe.label === 'API Health' && axios.isAxiosError(error)
                  ? describeHealthCheckDetail(error.response?.data)
                  : mapped.detail,
              };
            }
          }),
        );

        endpointChecks.value = checks;
        endpointChecksAt.value = new Date().toISOString();

        const youtubeIssue = checks.find(
          (check) =>
            (check.label === 'Mobile YouTube Feed' || check.label === 'Admin YouTube Feed') &&
            check.status === 'error',
        );
        if (youtubeIssue) {
          const apiHealth = checks.find((check) => check.label === 'API Health');
          const prefix =
            apiHealth && apiHealth.detail.includes('YouTube is disabled')
              ? 'YouTube is disabled in the API environment. Add YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in the root .env.development or .env.production file.'
              : 'YouTube feed check failed';
          setNotice(`${prefix}: ${youtubeIssue.detail}`, 'error');
        }
      } finally {
        endpointChecksLoading.value = false;
      }
    }

    function startGoogleLogin() {
      clearNotice();
      if (!GOOGLE_LOGIN_URL) {
        setNotice('Google sign-in is currently unavailable.', 'error');
        return;
      }

      if (typeof window !== 'undefined') {
        window.location.assign(GOOGLE_LOGIN_URL);
      }
    }

    async function fetchCurrentUser() {
      const response = await http.get('/v1/auth/me');
      currentUser.value = response.data.user;
    }

    function clearSessionData() {
      currentUser.value = null;
      managedItems.value = [];
      youtubePreviewItems.value = [];
      youtubeDraftItems.value = [];
      uploadPolicies.value = [];
      editContentOpen.value = false;
      editingContentId.value = null;
      mobileAppConfigEditor.value = '';
      mobileAppConfigMeta.value = null;
      wordOfDayHistory.value = [];
      wordOfDayCurrent.value = null;
      adminOps.value = {
        summary: {
          totalUsers: 0,
          newUsersLast7Days: 0,
          verifiedUsers: 0,
          adminUsers: 0,
          clientUsers: 0,
          publishedContent: 0,
          draftContent: 0,
          openSupportRequests: 0,
          activePrivacyRequests: 0,
          totalFeedback: 0,
          averageRating: null,
        },
        recentUsers: [],
        feedback: [],
        supportInbox: [],
        signupTrend: [],
        smartInsights: [],
        recentAutomation: [],
        generatedAt: '',
      };
      endpointChecks.value = [];
      endpointChecksAt.value = '';
      dashboardView.value = 'overview';
      closeHeaderMenu();
    }

    function clearInactivityTimer() {
      if (typeof window === 'undefined') return;
      if (inactivityTimerId.value != null) {
        window.clearTimeout(inactivityTimerId.value);
        inactivityTimerId.value = null;
      }
    }

    function handleInactivityTimeout() {
      if (!accessToken.value) return;
      persistToken(null);
      clearSessionData();
      setNotice('You were signed out after 30 minutes of inactivity.', 'error');
    }

    function scheduleInactivityTimeout() {
      if (typeof window === 'undefined' || !accessToken.value) return;
      clearInactivityTimer();
      inactivityTimerId.value = window.setTimeout(handleInactivityTimeout, INACTIVITY_TIMEOUT_MS);
    }

    function onUserActivity() {
      if (!accessToken.value) return;
      scheduleInactivityTimeout();
    }

    function bindActivityListeners() {
      if (typeof window === 'undefined') return;
      window.addEventListener('pointerdown', onUserActivity);
      window.addEventListener('keydown', onUserActivity);
      window.addEventListener('touchstart', onUserActivity);
      window.addEventListener('scroll', onUserActivity);
    }

    function unbindActivityListeners() {
      if (typeof window === 'undefined') return;
      window.removeEventListener('pointerdown', onUserActivity);
      window.removeEventListener('keydown', onUserActivity);
      window.removeEventListener('touchstart', onUserActivity);
      window.removeEventListener('scroll', onUserActivity);
    }

    function syncSessionTracking() {
      if (!accessToken.value) {
        clearInactivityTimer();
        unbindActivityListeners();
        return;
      }
      bindActivityListeners();
      scheduleInactivityTimeout();
    }

    function setupAuthInterceptor() {
      if (authResponseInterceptorId.value != null) return;

      authResponseInterceptorId.value = http.interceptors.response.use(
        (response) => response,
        (error) => {
          if (axios.isAxiosError(error) && error.response?.status === 401 && accessToken.value) {
            const requestUrl = String(error.config?.url || '');
            const isAuthEndpoint = requestUrl.includes('/v1/auth/login') || requestUrl.includes('/v1/auth/register');
            const failedHeaderValue =
              error.config?.headers && typeof error.config.headers === 'object'
                ? String(error.config.headers.Authorization || error.config.headers.authorization || '')
                : '';
            const activeHeaderValue = accessToken.value ? `Bearer ${accessToken.value}` : '';
            const hadBearerHeader = failedHeaderValue.startsWith('Bearer ');
            const staleRequest =
              Boolean(activeHeaderValue) &&
              (!hadBearerHeader || failedHeaderValue !== activeHeaderValue);

            if (!isAuthEndpoint && !staleRequest) {
              persistToken(null);
              clearSessionData();
              setNotice('Your session has expired. Please sign in again.', 'error');
            }
          }
          return Promise.reject(error);
        },
      );
    }

    function teardownAuthInterceptor() {
      if (authResponseInterceptorId.value == null) return;
      http.interceptors.response.eject(authResponseInterceptorId.value);
      authResponseInterceptorId.value = null;
    }

    async function fetchManagedContent(tokenOverride) {
      contentLoading.value = true;
      try {
        const response = await http.get('/v1/content/manage', {
          params: { page: pagination.page, limit: pagination.limit },
          headers: tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : undefined,
        });
        managedItems.value = response.data.items || [];
        pagination.total = response.data.total || 0;
      } finally {
        contentLoading.value = false;
      }
    }

    async function fetchUploadPolicies(tokenOverride) {
      uploadPoliciesLoading.value = true;
      try {
        const response = await http.get('/v1/uploads/policies', {
          headers: tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : undefined,
        });
        uploadPolicies.value = Array.isArray(response.data && response.data.assets) ? response.data.assets : [];
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to load upload policies.'), 'error');
      } finally {
        uploadPoliciesLoading.value = false;
      }
    }

    async function fetchMobileAppConfig() {
      if (!isAdmin.value) return;
      appConfigLoading.value = true;
      try {
        const response = await http.get('/v1/admin/app-config');
        mobileAppConfigEditor.value = JSON.stringify(response.data.config || {}, null, 2);
        mobileAppConfigMeta.value = response.data.meta || null;
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to load mobile app config.'), 'error');
      } finally {
        appConfigLoading.value = false;
      }
    }

    async function saveMobileAppConfig() {
      if (!isAdmin.value) {
        setNotice('Only admin accounts can update mobile app configuration.', 'error');
        return;
      }

      let parsedConfig;
      try {
        parsedConfig = JSON.parse(mobileAppConfigEditor.value || '{}');
      } catch (error) {
        setNotice(`Invalid JSON: ${error && error.message ? error.message : 'Parse failed'}`, 'error');
        return;
      }

      appConfigSaving.value = true;
      clearNotice();
      try {
        const response = await http.put('/v1/admin/app-config', { config: parsedConfig });
        mobileAppConfigEditor.value = JSON.stringify(response.data.config || {}, null, 2);
        mobileAppConfigMeta.value = response.data.meta || null;
        setNotice('Mobile app config saved successfully.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to save mobile app config.'), 'error');
      } finally {
        appConfigSaving.value = false;
      }
    }

    async function fetchWordOfDayDashboard() {
      if (!isAdmin.value) return;
      wordOfDayLoading.value = true;
      try {
        const response = await http.get('/v1/admin/word-of-day', { params: { limit: 12 } });
        wordOfDayHistory.value = response.data.items || [];
        wordOfDayCurrent.value = response.data.current || null;

        const current = response.data.current;
        if (current) {
          wordOfDayForm.title = current.title || 'Word for Today';
          wordOfDayForm.passage = current.passage || '';
          wordOfDayForm.verse = current.verse || '';
          wordOfDayForm.reflection = current.reflection || '';
          wordOfDayForm.messageDate = current.messageDate || todayDateInputValue();
          wordOfDayForm.status = current.status || 'published';
        }
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to load Word for Today dashboard.'), 'error');
      } finally {
        wordOfDayLoading.value = false;
      }
    }

    async function fetchAdminOperationsDashboard() {
      if (!isAdmin.value) return;
      adminOpsLoading.value = true;
      try {
        const response = await http.get('/v1/admin/dashboard');
        adminOps.value = response.data || adminOps.value;
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to load audience and feedback dashboard.'), 'error');
      } finally {
        adminOpsLoading.value = false;
      }
    }

    async function updateSupportRequestStatus(requestId, status) {
      supportStatusUpdatingId.value = requestId;
      clearNotice();
      try {
        await http.patch(`/v1/admin/support-requests/${requestId}/status`, { status });
        await fetchAdminOperationsDashboard();
        setNotice(`Complaint status moved to ${status.replace('_', ' ')}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to update complaint status.'), 'error');
      } finally {
        supportStatusUpdatingId.value = null;
      }
    }

    async function saveWordOfDay() {
      if (!isAdmin.value) {
        setNotice('Only admin accounts can publish Word for Today.', 'error');
        return;
      }
      if (!wordOfDayForm.passage.trim() || !wordOfDayForm.verse.trim() || !wordOfDayForm.reflection.trim()) {
        setNotice('Please complete passage, verse, and reflection before publishing Word for Today.', 'error');
        return;
      }

      wordOfDaySaving.value = true;
      clearNotice();
      try {
        const response = await http.put('/v1/admin/word-of-day/current', {
          title: wordOfDayForm.title.trim() || 'Word for Today',
          passage: wordOfDayForm.passage.trim(),
          verse: wordOfDayForm.verse.trim(),
          reflection: wordOfDayForm.reflection.trim(),
          messageDate: wordOfDayForm.messageDate || undefined,
          status: wordOfDayForm.status,
          notifySubscribers: Boolean(wordOfDayForm.notifySubscribers),
        });

        const notifications = response.data && response.data.notifications ? response.data.notifications : { recipientCount: 0, jobsQueued: 0 };
        await fetchWordOfDayDashboard();
        setNotice(
          notifications.jobsQueued > 0
            ? `Word for Today saved and email notifications queued for ${notifications.recipientCount} user(s).`
            : 'Word for Today saved successfully.',
          'success',
        );
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to save Word for Today.'), 'error');
      } finally {
        wordOfDaySaving.value = false;
      }
    }

    async function updateContentItem(itemId, patch) {
      const response = await http.patch(`/v1/content/${itemId}`, patch);
      managedItems.value = managedItems.value.map((entry) => (entry.id === itemId ? response.data : entry));
      return response.data;
    }

    function openEditContentModal(item) {
      editingContentId.value = item.id;
      editForm.title = item.title || '';
      editForm.description = item.description || '';
      editForm.type = item.type || 'audio';
      editForm.url = item.url || '';
      editForm.thumbnailUrl = item.thumbnailUrl || '';
      editForm.visibility = item.visibility || 'draft';
      editForm.channelName = item.channelName || '';
      editForm.duration = item.duration || '';
      editForm.tagsCsv = Array.isArray(item.tags) ? item.tags.join(', ') : '';
      editForm.appSectionsCsv = Array.isArray(item.appSections) ? item.appSections.join(', ') : '';
      editContentOpen.value = true;
    }

    function closeEditContentModal() {
      editContentOpen.value = false;
      editContentSaving.value = false;
      editingContentId.value = null;
    }

    async function saveEditedContent(event) {
      event.preventDefault();
      if (!editingContentId.value) {
        setNotice('Select a content item to edit first.', 'error');
        return;
      }

      const title = editForm.title.trim();
      const description = editForm.description.trim();
      const url = editForm.url.trim();
      const thumbnailUrl = editForm.thumbnailUrl.trim();
      const channelName = editForm.channelName.trim();
      const duration = editForm.duration.trim();
      const tags = Array.from(new Set(parseCsvList(editForm.tagsCsv)));
      const appSections = Array.from(new Set(parseCsvList(editForm.appSectionsCsv)));
      const needsUrl = editForm.type === 'audio' || editForm.type === 'video';

      if (title.length < 2) {
        setNotice('Title must be at least 2 characters.', 'error');
        return;
      }
      if (description.length < 2) {
        setNotice('Description must be at least 2 characters.', 'error');
        return;
      }
      if (needsUrl && !url) {
        setNotice(`A media URL is required for ${editForm.type} content.`, 'error');
        return;
      }
      if (needsUrl && !thumbnailUrl) {
        setNotice('A thumbnail URL is required for audio/video content.', 'error');
        return;
      }
      if (url && !/^https?:\/\//i.test(url)) {
        setNotice('Media URL must start with http:// or https://', 'error');
        return;
      }
      if (thumbnailUrl && !/^https?:\/\//i.test(thumbnailUrl)) {
        setNotice('Thumbnail URL must start with http:// or https://', 'error');
        return;
      }
      if (tags.length > 20) {
        setNotice('You can assign up to 20 tags per content item.', 'error');
        return;
      }
      if (appSections.length > 12) {
        setNotice('You can assign up to 12 app sections per content item.', 'error');
        return;
      }

      editContentSaving.value = true;
      clearNotice();
      try {
        await updateContentItem(editingContentId.value, {
          title,
          description,
          type: editForm.type,
          url: url || undefined,
          thumbnailUrl: thumbnailUrl || undefined,
          visibility: editForm.visibility,
          channelName: channelName || undefined,
          duration: duration || undefined,
          tags,
          appSections,
        });
        closeEditContentModal();
        setNotice('Content updated successfully.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to update this content item right now.'), 'error');
      } finally {
        editContentSaving.value = false;
      }
    }

    async function assignContentSections(item) {
      const current = Array.isArray(item.appSections) ? item.appSections.join(', ') : '';
      const nextValue = window.prompt(
        'Assign app sections (comma-separated). Example: ClaudyGod Music, ClaudyGod Nuggets of Truth',
        current,
      );
      if (nextValue === null) return;

      clearNotice();
      try {
        await updateContentItem(item.id, { appSections: parseCsvList(nextValue) });
        setNotice('Content sections updated for mobile app placement.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to update content sections.'), 'error');
      }
    }

    async function deleteContentItem(item) {
      if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;

      deletingContentId.value = item.id;
      clearNotice();
      try {
        await http.delete(`/v1/content/${item.id}`);
        managedItems.value = managedItems.value.filter((entry) => entry.id !== item.id);
        pagination.total = Math.max(0, Number(pagination.total || 0) - 1);
        setNotice('Content deleted successfully.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to delete this content item.'), 'error');
      } finally {
        deletingContentId.value = null;
      }
    }

    async function fetchPublicHealth() {
      publicHealthLoading.value = true;

      try {
        const response = await http.get('/health', {
          timeout: 4000,
        });
        publicHealth.value = response.data || null;
        return publicHealth.value;
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.data &&
          typeof error.response.data === 'object'
        ) {
          publicHealth.value = error.response.data;
          return publicHealth.value;
        }

        publicHealth.value = {
          status: 'offline',
          error: toErrorMessage(error, 'Unable to reach backend health endpoint.'),
          checkedAt: new Date().toISOString(),
        };
        return publicHealth.value;
      } finally {
        publicHealthLoading.value = false;
      }
    }

    async function ensureAuthInfrastructureReady() {
      const health = await fetchPublicHealth();

      if (!health || health.status === 'offline') {
        setNotice(
          `The API at ${API_HOST_LABEL} is not reachable. Start the backend and confirm the admin is pointing at the correct host.`,
          'error',
        );
        return false;
      }

      if (health.services?.postgres === 'down') {
        const databaseTarget =
          health.capabilities?.databaseTarget === 'supabase-postgres'
            ? 'Supabase PostgreSQL'
            : 'the configured PostgreSQL database';

        setNotice(
          `The backend is online, but ${databaseTarget} is unavailable. Update DATABASE_URL, start the database, and restart the API before creating accounts.`,
          'error',
        );
        return false;
      }

      return true;
    }

    async function bootstrapSession() {
      if (!accessToken.value) return;
      appLoading.value = true;
      clearNotice();
      try {
        applyToken(accessToken.value);
        await fetchCurrentUser();
        await Promise.all([
          fetchManagedContent(),
          fetchUploadPolicies(),
          isAdmin.value ? fetchAdminOperationsDashboard() : Promise.resolve(),
          isAdmin.value ? fetchMobileAppConfig() : Promise.resolve(),
          isAdmin.value ? fetchWordOfDayDashboard() : Promise.resolve(),
          runEndpointChecks(),
        ]);
      } catch (error) {
        persistToken(null);
        currentUser.value = null;
        setNotice(toErrorMessage(error, 'Your session expired. Please sign in again.'), 'error');
      } finally {
        appLoading.value = false;
      }
    }

    async function handleAuthSubmit(event) {
      event.preventDefault();
      clearNotice();

      if (!authForm.email.trim() || !authForm.password.trim()) {
        setNotice(isRegisterMode.value ? 'Please complete the required account fields.' : 'Please enter your email and password.', 'error');
        return;
      }

      if (isRegisterMode.value) {
        if (!authForm.username.trim()) {
          setNotice('Please enter your username.', 'error');
          return;
        }
        if (authForm.password !== authForm.confirmPassword) {
          setNotice('Passwords do not match.', 'error');
          return;
        }
      }

      if (!(await ensureAuthInfrastructureReady())) {
        return;
      }

      authLoading.value = true;
      try {
        const endpoint = isRegisterMode.value ? '/v1/auth/register' : '/v1/auth/login';
        const payload = isRegisterMode.value
          ? {
              email: authForm.email.trim(),
              password: authForm.password,
              username: authForm.username.trim(),
            }
          : {
              email: authForm.email.trim(),
              password: authForm.password,
            };

        const authResponse = await http.post(endpoint, payload);
        const freshToken = String(authResponse.data?.accessToken || '');
        if (!freshToken) {
          throw new Error('Authentication succeeded but no session token was returned.');
        }

        persistToken(freshToken);
        currentUser.value = authResponse.data.user;
        authForm.password = '';
        authForm.confirmPassword = '';
        await Promise.all([
          fetchManagedContent(freshToken),
          fetchUploadPolicies(freshToken),
          authResponse.data.user && authResponse.data.user.role === 'ADMIN' ? fetchAdminOperationsDashboard() : Promise.resolve(),
          authResponse.data.user && authResponse.data.user.role === 'ADMIN' ? fetchMobileAppConfig() : Promise.resolve(),
          authResponse.data.user && authResponse.data.user.role === 'ADMIN' ? fetchWordOfDayDashboard() : Promise.resolve(),
          runEndpointChecks(),
        ]);
        setNotice(
          isRegisterMode.value
            ? `Account created. Welcome, ${authResponse.data.user.displayName}.`
            : `Welcome back, ${authResponse.data.user.displayName}.`,
          'success',
        );
      } catch (error) {
        setNotice(
          toErrorMessage(
            error,
            isRegisterMode.value
              ? 'Account creation failed. Please check your details and try again.'
              : 'Sign in failed. Please check your details and try again.',
          ),
          'error',
        );
      } finally {
        authLoading.value = false;
      }
    }

    function switchAuthMode(mode) {
      authMode.value = mode;
      closeHeaderMenu();
      clearNotice();
      authForm.password = '';
      authForm.confirmPassword = '';
    }

    function logout() {
      persistToken(null);
      clearSessionData();
      setNotice('You have signed out.', 'success');
    }

    async function createContent(event) {
      event.preventDefault();
      clearNotice();

      if (!currentUser.value) {
        setNotice('Please sign in to continue.', 'error');
        return;
      }
      if (createForm.title.trim().length < 2) {
        setNotice('Please enter a content title.', 'error');
        return;
      }
      if (createForm.description.trim().length < 2) {
        setNotice('Please add a short description.', 'error');
        return;
      }

      const needsUrl = createForm.type === 'audio' || createForm.type === 'video';
      if (needsUrl && !createForm.url.trim()) {
        setNotice('Please add the media link for audio or video content.', 'error');
        return;
      }
      if (needsUrl && !createForm.thumbnailUrl.trim()) {
        setNotice('Please upload or add a thumbnail image (max 5MB) for audio/video content.', 'error');
        return;
      }

      savingContent.value = true;
      try {
        await http.post('/v1/content', {
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          type: createForm.type,
          url: createForm.url.trim() || undefined,
          thumbnailUrl: createForm.thumbnailUrl.trim() || undefined,
          mediaUploadSessionId: createForm.mediaUploadSessionId || undefined,
          thumbnailUploadSessionId: createForm.thumbnailUploadSessionId || undefined,
          sourceKind: createForm.mediaUploadSessionId ? 'upload' : needsUrl ? 'external' : undefined,
          channelName: createForm.channelName.trim() || undefined,
          duration: createForm.duration.trim() || undefined,
          tags: parseCsvList(createForm.tagsCsv),
          appSections: parseCsvList(createForm.appSectionsCsv),
          visibility: createForm.visibility,
        });

        createForm.title = '';
        createForm.description = '';
        createForm.url = '';
        createForm.thumbnailUrl = '';
        createForm.mediaUploadSessionId = '';
        createForm.thumbnailUploadSessionId = '';
        createForm.channelName = '';
        createForm.duration = '';
        createForm.tagsCsv = '';
        createForm.appSectionsCsv = '';
        await fetchManagedContent();
        setNotice(createForm.visibility === 'published' ? 'Content published successfully.' : 'Draft saved successfully.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to save this content right now.'), 'error');
      } finally {
        savingContent.value = false;
      }
    }

    async function handleAssetUpload(event, target = 'media') {
      const input = event && event.target ? event.target : null;
      const file = input && input.files && input.files[0] ? input.files[0] : null;
      if (!file) return;
      if (!currentUser.value) {
        setNotice('Please sign in to upload files.', 'error');
        if (input) input.value = '';
        return;
      }

      const assetKind = target === 'thumbnail' ? 'thumbnail' : resolveMediaAssetKind();
      if (!assetKind) {
        setNotice('Set content type to audio or video before uploading a media file.', 'error');
        if (input) input.value = '';
        return;
      }

      let policy = getUploadPolicy(assetKind);
      if (!policy) {
        await fetchUploadPolicies();
        policy = getUploadPolicy(assetKind);
      }

      if (policy) {
        const normalizedMime = String(file.type || '').toLowerCase();
        if (normalizedMime && Array.isArray(policy.allowedMimeTypes) && !policy.allowedMimeTypes.includes(normalizedMime)) {
          setNotice(`${policy.label} format not allowed. Accepted: ${policy.allowedExtensions.join(', ')}`, 'error');
          if (input) input.value = '';
          return;
        }
        if (Number(file.size || 0) > Number(policy.maxBytes || 0)) {
          setNotice(`${policy.label} exceeds the maximum size (${formatBytes(policy.maxBytes)}).`, 'error');
          if (input) input.value = '';
          return;
        }
      }

      uploadingAsset.value = true;
      clearNotice();
      try {
        const signed = await http.post('/v1/uploads/signed-url', {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSizeBytes: file.size,
          assetKind,
          folder: policy && policy.recommendedFolder ? policy.recommendedFolder : undefined,
          clientReference: 'admin-dashboard',
        });

        const upload = signed.data && signed.data.upload ? signed.data.upload : null;
        const session = signed.data && signed.data.session ? signed.data.session : null;
        if (!upload || !upload.signedUrl) {
          throw new Error('Invalid signed upload response');
        }

        const putResponse = await fetch(upload.signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        if (!putResponse.ok) {
          throw new Error(`Upload failed (${putResponse.status})`);
        }

        if (assetKind === 'thumbnail') {
          createForm.thumbnailUrl = upload.publicUrl || createForm.thumbnailUrl;
          createForm.thumbnailUploadSessionId = session && session.id ? session.id : createForm.thumbnailUploadSessionId;
        } else {
          createForm.url = upload.publicUrl || createForm.url;
          createForm.mediaUploadSessionId = session && session.id ? session.id : createForm.mediaUploadSessionId;
        }

        setNotice(`Uploaded ${file.name}. ${assetKind === 'thumbnail' ? 'Thumbnail' : 'Media asset'} is now linked to the content draft.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'File upload failed. Check storage configuration and try again.'), 'error');
      } finally {
        uploadingAsset.value = false;
        if (input) input.value = '';
      }
    }

    async function toggleVisibility(item) {
      if (!currentUser.value) return;

      const nextVisibility = item.visibility === 'published' ? 'draft' : 'published';
      togglingId.value = item.id;
      clearNotice();
      try {
        const response = await http.patch(`/v1/content/${item.id}/visibility`, {
          visibility: nextVisibility,
        });
        managedItems.value = managedItems.value.map((entry) => (entry.id === item.id ? response.data : entry));
        setNotice(nextVisibility === 'published' ? 'Content is now published.' : 'Content moved to drafts.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to update this item right now.'), 'error');
      } finally {
        togglingId.value = null;
      }
    }

    async function refreshDashboard() {
      if (!currentUser.value) return;
      clearNotice();
      try {
        await fetchCurrentUser();
        await Promise.all([
          fetchManagedContent(),
          fetchUploadPolicies(),
          isAdmin.value ? fetchAdminOperationsDashboard() : Promise.resolve(),
          isAdmin.value ? fetchMobileAppConfig() : Promise.resolve(),
          isAdmin.value ? fetchWordOfDayDashboard() : Promise.resolve(),
          runEndpointChecks(),
        ]);
        closeHeaderMenu();
        setNotice('Dashboard refreshed.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Refresh failed. Please try again.'), 'error');
      }
    }

    function buildYouTubeDrafts(items) {
      const sharedSections = parseCsvList(youtubeSyncState.appSectionsCsv);
      const existingById = new Map(
        youtubeDraftItems.value.map((item) => [item.youtubeVideoId, item]),
      );

      youtubeDraftItems.value = items.map((video) => {
        const existing = existingById.get(video.youtubeVideoId);
        const suggestedSections = Array.isArray(video.suggestedAppSections) ? video.suggestedAppSections : [];
        const suggestedTags = Array.isArray(video.suggestedTags) ? video.suggestedTags : [];
        const mergedSections = Array.from(new Set([...(existing?.appSections || []), ...sharedSections, ...suggestedSections]));

        return {
          ...video,
          selected: existing ? existing.selected : true,
          visibility: existing?.visibility || youtubeSyncState.visibility || 'draft',
          appSections: existing?.appSections || mergedSections,
          appSectionsCsv: existing?.appSectionsCsv || mergedSections.join(', '),
          tags: existing?.tags || suggestedTags,
          tagsCsv: existing?.tagsCsv || suggestedTags.join(', '),
        };
      });
    }

    function updateYouTubeDraftItem(videoId, patch) {
      youtubeDraftItems.value = youtubeDraftItems.value.map((item) => {
        if (item.youtubeVideoId !== videoId) return item;
        return { ...item, ...patch };
      });
    }

    function applySmartYouTubeAssignments() {
      youtubeDraftItems.value = youtubeDraftItems.value.map((item) => {
        const mergedSections = Array.from(
          new Set([...(Array.isArray(item.suggestedAppSections) ? item.suggestedAppSections : []), ...parseCsvList(youtubeSyncState.appSectionsCsv)]),
        );
        const nextTags = Array.isArray(item.suggestedTags) ? item.suggestedTags : [];
        return {
          ...item,
          appSections: mergedSections,
          appSectionsCsv: mergedSections.join(', '),
          tags: nextTags,
          tagsCsv: nextTags.join(', '),
        };
      });
      setNotice('Smart assignments applied to fetched YouTube videos.', 'success');
    }

    async function importSelectedYouTubeVideos() {
      if (!currentUser.value) return;

      const selectedItems = youtubeDraftItems.value.filter((item) => item.selected);
      if (selectedItems.length === 0) {
        setNotice('Select at least one fetched YouTube video to import.', 'error');
        return;
      }

      youtubeImporting.value = true;
      clearNotice();
      try {
        const response = await http.post('/v1/youtube/import', {
          selections: selectedItems.map((item) => ({
            youtubeVideoId: item.youtubeVideoId,
            title: item.title,
            description: item.description || '',
            channelTitle: item.channelTitle,
            publishedAt: item.publishedAt,
            thumbnailUrl: item.thumbnailUrl,
            url: item.url,
            duration: item.duration || '--:--',
            isLive: Boolean(item.isLive),
            liveViewerCount: item.liveViewerCount,
            visibility: item.visibility || youtubeSyncState.visibility,
            appSections: parseCsvList(item.appSectionsCsv),
            tags: parseCsvList(item.tagsCsv),
          })),
        });

        const summary = response.data && response.data.summary ? response.data.summary : { created: 0, updated: 0, skipped: 0 };
        await Promise.all([
          fetchManagedContent(),
          isAdmin.value ? fetchAdminOperationsDashboard() : Promise.resolve(),
        ]);
        setNotice(`Curated YouTube import complete. Created ${summary.created}, updated ${summary.updated}, skipped ${summary.skipped}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to import the selected YouTube videos.'), 'error');
      } finally {
        youtubeImporting.value = false;
      }
    }

    async function fetchYouTubePreview() {
      if (!currentUser.value) return;

      youtubePreviewLoading.value = true;
      clearNotice();
      try {
        const response = await http.get('/v1/youtube/videos', {
          params: {
            channelId: youtubeSyncState.channelId.trim() || undefined,
            maxResults: Number(youtubeSyncState.maxResults) || YOUTUBE_SYNC_DEFAULT_LIMIT,
          },
        });

        youtubePreviewItems.value = response.data.items || [];
        buildYouTubeDrafts(youtubePreviewItems.value);
        setNotice(`Fetched ${youtubePreviewItems.value.length} YouTube video${youtubePreviewItems.value.length === 1 ? '' : 's'} for preview.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to fetch YouTube videos. Check your backend YouTube configuration.'), 'error');
      } finally {
        youtubePreviewLoading.value = false;
      }
    }

    async function syncYouTubeVideos() {
      if (!currentUser.value) return;

      youtubeSyncLoading.value = true;
      clearNotice();
      try {
        const response = await http.post('/v1/youtube/sync', {
          channelId: youtubeSyncState.channelId.trim() || undefined,
          maxResults: Number(youtubeSyncState.maxResults) || YOUTUBE_SYNC_DEFAULT_LIMIT,
          visibility: youtubeSyncState.visibility,
          appSections: parseCsvList(youtubeSyncState.appSectionsCsv),
          tags: [],
        });

        const summary = response.data && response.data.summary ? response.data.summary : { created: 0, updated: 0, skipped: 0 };
        youtubePreviewItems.value = response.data.items || youtubePreviewItems.value;
        buildYouTubeDrafts(youtubePreviewItems.value);
        await Promise.all([
          fetchManagedContent(),
          isAdmin.value ? fetchAdminOperationsDashboard() : Promise.resolve(),
        ]);
        setNotice(`YouTube sync complete. Created ${summary.created}, updated ${summary.updated}, skipped ${summary.skipped}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'YouTube sync failed. Please verify API key, channel ID, and backend settings.'), 'error');
      } finally {
        youtubeSyncLoading.value = false;
      }
    }

    onMounted(() => {
      syncViewport();
      setupAuthInterceptor();
      syncSessionTracking();
      void fetchPublicHealth();
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', syncViewport);
      }
      void bootstrapSession();
    });

    onBeforeUnmount(() => {
      clearInactivityTimer();
      unbindActivityListeners();
      teardownAuthInterceptor();
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', syncViewport);
      }
    });

    return () => {
      const loginScreen = (
        <section class="auth-layout reveal-up">
          <div class="auth-hero glass-panel">
            <div class="brand-stack">
              <div class="logo-wrap logo-wrap-large">
                <div class="logo-glow" />
                <img src={BRAND_LOGO_URL} alt="ClaudyGod" class="brand-logo" />
              </div>
              <div>
                <p class="eyebrow">ClaudyGod Ministries</p>
                <h1>Content Studio</h1>
                <p class="subtitle">
                  Secure publisher access for uploading, reviewing, and releasing ministry content.
                </p>
              </div>
            </div>

            <div class="auth-status-grid">
              <article class="auth-status-card">
                <span class="auth-status-label">API Host</span>
                <strong>{API_HOST_LABEL}</strong>
                <p>{publicHealthSummary.value}</p>
              </article>
              <article class="auth-status-card">
                <span class="auth-status-label">Database</span>
                <strong>{databaseTargetLabel.value}</strong>
                <p>
                  {publicHealth.value?.services?.postgres === 'up'
                    ? 'Connection ready'
                    : publicHealth.value?.services?.postgres === 'down'
                      ? 'Connection unavailable'
                      : 'Waiting for backend check'}
                </p>
              </article>
              <article class="auth-status-card">
                <span class="auth-status-label">Account Flow</span>
                <strong>Username only</strong>
                <p>No duplicate identity fields in the current register form.</p>
              </article>
            </div>
          </div>

          <div class="auth-form-card glass-panel reveal-up" style={{ animationDelay: '120ms' }}>
            <div class="form-header-row">
              <div class="logo-wrap">
                <img src={BRAND_LOGO_URL} alt="ClaudyGod" class="brand-logo" />
              </div>
              <div>
                <h2>{isRegisterMode.value ? 'Create Account' : 'Sign In'}</h2>
                <p class="subtle-text">
                  {isRegisterMode.value
                    ? 'Create your account to manage and publish content.'
                    : 'Enter your account details to continue.'}
                </p>
              </div>
            </div>

            <div class="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                class={['auth-mode-btn', !isRegisterMode.value ? 'is-active' : '']}
                onClick={() => switchAuthMode('login')}
                disabled={authLoading.value}
              >
                Sign In
              </button>
              <button
                type="button"
                class={['auth-mode-btn', isRegisterMode.value ? 'is-active' : '']}
                onClick={() => switchAuthMode('register')}
                disabled={authLoading.value}
              >
                Create Account
              </button>
            </div>

            {notice.value ? <div class={['notice', noticeKind.value === 'error' ? 'notice-error' : 'notice-success']}>{notice.value}</div> : null}

            <div class={['auth-runtime-pill', publicHealthTone.value]}>
              <span class="auth-runtime-dot" />
              <span>{publicHealthSummary.value}</span>
            </div>

            {googleLoginEnabled.value ? (
              <div class="social-auth-block">
                <button
                  type="button"
                  class="google-btn"
                  onClick={startGoogleLogin}
                  disabled={authLoading.value}
                >
                  Continue with Google
                </button>
              </div>
            ) : null}

            <form class="stack-form" onSubmit={(event) => void handleAuthSubmit(event)}>
              {isRegisterMode.value ? (
                <label class="auth-field">
                  <span class="field-label-row">
                    <span>Username</span>
                    <span
                      class="field-tooltip"
                      data-tooltip="Your public publishing identity for uploads, content credits, and dashboard activity."
                      tabIndex={0}
                      role="note"
                      aria-label="Username help"
                    >
                      i
                    </span>
                  </span>
                  <input
                    class="auth-input"
                    value={authForm.username}
                    onInput={(event) => { authForm.username = readValue(event); }}
                    placeholder="claudy_member"
                    autoComplete="nickname"
                  />
                  <small class="field-note">This is the only public identity field in the admin account flow.</small>
                </label>
              ) : null}

              <label class="auth-field">
                <span class="field-label-row">
                  <span>Email address</span>
                  <span
                    class="field-tooltip"
                    data-tooltip="This email is used for sign-in, verification, password recovery, and account security notices."
                    tabIndex={0}
                    role="note"
                    aria-label="Email help"
                  >
                    i
                  </span>
                </span>
                <input
                  class="auth-input"
                  type="email"
                  value={authForm.email}
                  onInput={(event) => { authForm.email = readValue(event); }}
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </label>

              <label class="auth-field">
                <span class="field-label-row">
                  <span>Password</span>
                  <span
                    class="field-tooltip"
                    data-tooltip="Use at least 8 characters with uppercase, lowercase, and a number."
                    tabIndex={0}
                    role="note"
                    aria-label="Password help"
                  >
                    i
                  </span>
                </span>
                <input
                  class="auth-input"
                  type="password"
                  value={authForm.password}
                  onInput={(event) => { authForm.password = readValue(event); }}
                  placeholder={isRegisterMode.value ? 'Create a strong password' : 'Enter your password'}
                  autoComplete={isRegisterMode.value ? 'new-password' : 'current-password'}
                />
              </label>

              {isRegisterMode.value ? (
                <label class="auth-field">
                  <span class="field-label-row">
                    <span>Confirm password</span>
                    <span
                      class="field-tooltip"
                      data-tooltip="Repeat the password exactly to complete account creation."
                      tabIndex={0}
                      role="note"
                      aria-label="Confirm password help"
                    >
                      i
                    </span>
                  </span>
                  <input
                    class="auth-input"
                    type="password"
                    value={authForm.confirmPassword}
                    onInput={(event) => { authForm.confirmPassword = readValue(event); }}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </label>
              ) : null}

              <button type="submit" class="primary-btn primary-btn-large" disabled={authLoading.value}>
                {authLoading.value
                  ? (isRegisterMode.value ? 'Creating account...' : 'Signing in...')
                  : (isRegisterMode.value ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <p class="footnote-text">
              {isRegisterMode.value
                ? 'Use one username, one email address, and one password to create your publisher account.'
                : 'Sign in with your existing publisher account.'}
            </p>
          </div>
        </section>
      );

      const workspaceActions = [
        {
          title: 'Publish new content',
          detail: 'Open the content workspace to upload audio, video, playlists, and announcements.',
          actionLabel: 'Open content workspace',
          onClick: () => setDashboardView('editor'),
          emphasis: 'primary',
        },
        {
          title: 'Preview the app',
          detail: 'See the live mobile experience after content or config changes before you leave the studio.',
          actionLabel: 'Open app preview',
          onClick: () => setDashboardView('mobile-preview'),
          emphasis: 'secondary',
        },
        {
          title: 'Refresh studio data',
          detail: 'Pull fresh audience, publishing, and health information without leaving the overview.',
          actionLabel: contentLoading.value ? 'Refreshing...' : 'Refresh now',
          onClick: () => void refreshDashboard(),
          disabled: contentLoading.value,
          emphasis: 'secondary',
        },
      ];

      const dashboardScreen = (
        <section class="dashboard-stage">
          <section class="hero-banner glass-panel reveal-up">
            <div class="hero-content">
              <div class="hero-brand">
                <div class="logo-wrap logo-wrap-large hero-logo">
                  <div class="logo-glow" />
                  <img src={BRAND_LOGO_URL} alt="ClaudyGod" class="brand-logo" />
                </div>
                <div>
                  <p class="eyebrow">Publishing Center</p>
                  <h1>{greeting.value}, {displayName.value}</h1>
                  <p class="subtitle">
                    Start from Overview, move into Manage Content when you are ready to publish, and use Preview App to confirm the mobile experience before sharing it with your audience.
                  </p>
                </div>
              </div>

              <div class="hero-actions">
                <button type="button" class="ghost-btn" onClick={() => void refreshDashboard()} disabled={contentLoading.value}>
                  {contentLoading.value ? 'Refreshing...' : 'Refresh data'}
                </button>
                <button type="button" class="ghost-btn" onClick={() => void fetchYouTubePreview()} disabled={youtubePreviewLoading.value}>
                  {youtubePreviewLoading.value ? 'Loading YouTube...' : 'Check YouTube feed'}
                </button>
                <button type="button" class="danger-btn" onClick={logout}>Sign Out</button>
              </div>
            </div>

            <div class="hero-chips">
              <span class="hero-chip">Simple publishing workflow</span>
              <span class="hero-chip">Live mobile preview</span>
              <span class="hero-chip">Clear audience health</span>
            </div>
            <div class="hero-shine" />
          </section>

          <section class="stats-grid">
            {stats.value.map((card, index) => (
              <article class={['stat-card', 'glass-panel', `accent-${card.accent}`, 'reveal-up']} style={{ animationDelay: `${60 + index * 70}ms` }} key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </section>

          {notice.value ? (
            <section class={['notice', noticeKind.value === 'error' ? 'notice-error' : 'notice-success', 'reveal-up']} style={{ animationDelay: '180ms' }}>
              {notice.value}
            </section>
          ) : null}

          <section class="dashboard-view-tabs reveal-up" style={{ animationDelay: '200ms' }}>
            <button
              type="button"
              class={['ghost-btn compact', dashboardView.value === 'overview' ? 'is-active' : '']}
              onClick={() => setDashboardView('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              class={['ghost-btn compact', dashboardView.value === 'editor' ? 'is-active' : '']}
              onClick={() => setDashboardView('editor')}
            >
              Manage Content
            </button>
            <button
              type="button"
              class={['ghost-btn compact', dashboardView.value === 'mobile-preview' ? 'is-active' : '']}
              onClick={() => setDashboardView('mobile-preview')}
            >
              Preview App
            </button>
          </section>

          <section class="quick-actions-grid reveal-up" style={{ animationDelay: '210ms' }}>
            {workspaceActions.map((action, index) => (
              <article
                key={`workspace-action-${action.title}`}
                class={['task-card', 'glass-panel', action.emphasis === 'primary' ? 'task-card-primary' : null]}
                style={{ animationDelay: `${220 + index * 40}ms` }}
              >
                <div>
                  <p class="eyebrow">Quick action</p>
                  <h3>{action.title}</h3>
                  <p>{action.detail}</p>
                </div>
                <button
                  type="button"
                  class={action.emphasis === 'primary' ? 'primary-btn' : 'ghost-btn compact'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.actionLabel}
                </button>
              </article>
            ))}
          </section>

          {dashboardView.value === 'overview' ? (
            <section class="overview-grid">
              <article class="panel glass-panel reveal-up" style={{ animationDelay: '220ms' }}>
                <div class="section-head split">
                  <div>
                    <h2>Start here</h2>
                    <p>Use this simple sequence whenever you are publishing something new to the app.</p>
                  </div>
                  <button type="button" class="primary-btn" onClick={() => setDashboardView('editor')}>
                    Go to content workspace
                  </button>
                </div>

                <div class="simple-intro-panel">
                  <div class="simple-intro-item">
                    <strong>1. Add or sync content</strong>
                    <p>Upload directly or pull the latest YouTube items into the catalog.</p>
                  </div>
                  <div class="simple-intro-item">
                    <strong>2. Review before publishing</strong>
                    <p>Check the metadata, app section placement, and media quality before going live.</p>
                  </div>
                  <div class="simple-intro-item">
                    <strong>3. Preview the result</strong>
                    <p>Open Preview App to confirm the end-user experience before you finish.</p>
                  </div>
                </div>

                <div class="workflow-grid">
                  {WORKFLOW_STEPS.map((step, index) => (
                    <article class="workflow-step" key={`workflow-step-${step.title}`}>
                      <div class="workflow-step-number">{index + 1}</div>
                      <div>
                        <h3>{step.title}</h3>
                        <p>{step.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              {isAdmin.value ? (
              <article class="panel glass-panel reveal-up" style={{ animationDelay: '240ms' }}>
                <div class="section-head split">
                  <div>
                    <h2>Audience &amp; Health</h2>
                    <p>Track registered users, onboarding momentum, and deployment readiness from one place.</p>
                  </div>
                  <button
                    type="button"
                    class="ghost-btn compact"
                    onClick={() => void fetchAdminOperationsDashboard()}
                    disabled={adminOpsLoading.value}
                  >
                    {adminOpsLoading.value ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                <section class="stats-grid">
                  {audienceStats.value.map((card, index) => (
                    <article
                      class={['stat-card', 'glass-panel', `accent-${card.accent}`]}
                      style={{ animationDelay: `${index * 60}ms` }}
                      key={`audience-stat-${card.label}`}
                    >
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                    </article>
                  ))}
                </section>

                <div class="grid-2" style={{ marginTop: '0.8rem' }}>
                  <div class="helper-card">
                    <strong>Signup momentum</strong>
                    <p>
                      {(adminOps.value.signupTrend || []).reduce((sum, point) => sum + Number(point.signups || 0), 0)} new
                      account{(adminOps.value.signupTrend || []).reduce((sum, point) => sum + Number(point.signups || 0), 0) === 1 ? '' : 's'} in the
                      last 14 days.
                    </p>
                  </div>
                  <div class="helper-card">
                    <strong>Infrastructure readiness</strong>
                    <p>
                      {apiHealthCheck.value
                        ? apiHealthCheck.value.detail
                        : 'Run endpoint diagnostics to verify API, Redis, PostgreSQL, YouTube, and SMTP readiness.'}
                    </p>
                  </div>
                </div>

                {apiHealthCheck.value && apiHealthCheck.value.capabilities ? (
                  <div class="pill-row" style={{ marginTop: '0.8rem' }}>
                    <span class={['pill', apiHealthCheck.value.capabilities.youtube ? 'pill-live' : 'pill-draft']}>
                      YouTube {apiHealthCheck.value.capabilities.youtube ? 'ready' : 'disabled'}
                    </span>
                    <span class={['pill', apiHealthCheck.value.capabilities.smtp ? 'pill-live' : 'pill-draft']}>
                      Email {apiHealthCheck.value.capabilities.smtp ? 'ready' : 'not configured'}
                    </span>
                    <span class={['pill', apiHealthCheck.value.capabilities.supabase ? 'pill-live' : 'pill-draft']}>
                      Supabase {apiHealthCheck.value.capabilities.supabase ? 'connected' : 'not linked'}
                    </span>
                  </div>
                ) : null}

                <div class="section-head compact" style={{ marginTop: '1rem' }}>
                  <div>
                    <h3>Recent registrations</h3>
                    <p>Latest accounts entering the platform.</p>
                  </div>
                  {adminOps.value.generatedAt ? (
                    <span class="section-badge">Synced {formatDateTime(adminOps.value.generatedAt)}</span>
                  ) : null}
                </div>

                <div class="list-wrap">
                  {adminOps.value.recentUsers.length === 0 ? (
                    <div class="empty-state">No registered users have been recorded yet.</div>
                  ) : adminOps.value.recentUsers.map((user) => (
                    <article class="content-card" key={`recent-user-${user.id}`}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class={['pill', user.role === 'ADMIN' ? 'pill-live' : 'pill-audio']}>{user.role.toLowerCase()}</span>
                          <span class="muted-chip">{humanizeToken(user.authProvider)}</span>
                          <span class={['pill', user.emailVerifiedAt ? 'pill-live' : 'pill-draft']}>
                            {user.emailVerifiedAt ? 'verified' : 'pending'}
                          </span>
                        </div>
                        <span class="muted-chip">{formatDateTime(user.createdAt)}</span>
                      </div>
                      <div class="card-body">
                        <h3>{user.displayName || 'Unnamed user'}</h3>
                        <p>{user.email}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
              ) : null}

              {isAdmin.value ? (
              <article class="panel glass-panel reveal-up" style={{ animationDelay: '260ms' }}>
                <div class="section-head split">
                  <div>
                    <h2>Feedback &amp; Complaints</h2>
                    <p>Monitor ratings, user notes, and support tickets from the mobile app.</p>
                  </div>
                  <span class="section-badge">
                    {(adminOps.value.summary && adminOps.value.summary.totalFeedback) || 0} feedback item{((adminOps.value.summary && adminOps.value.summary.totalFeedback) || 0) === 1 ? '' : 's'}
                  </span>
                </div>

                <div class="grid-2" style={{ marginBottom: '0.9rem' }}>
                  <div class="helper-card">
                    <strong>Support workload</strong>
                    <p>
                      {(adminOps.value.summary && adminOps.value.summary.openSupportRequests) || 0} complaint ticket(s) are currently
                      open or in progress.
                    </p>
                  </div>
                  <div class="helper-card">
                    <strong>Privacy queue</strong>
                    <p>
                      {(adminOps.value.summary && adminOps.value.summary.activePrivacyRequests) || 0} privacy request(s) are awaiting
                      completion.
                    </p>
                  </div>
                </div>

                <div class="section-head compact">
                  <div>
                    <h3>Latest ratings</h3>
                    <p>Signals captured from the mobile experience.</p>
                  </div>
                </div>

                <div class="list-wrap">
                  {adminOps.value.feedback.length === 0 ? (
                    <div class="empty-state">No feedback has been submitted from mobile users yet.</div>
                  ) : adminOps.value.feedback.map((entry) => (
                    <article class="content-card" key={`feedback-${entry.id}`}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class="pill pill-video">{entry.rating}/5</span>
                          <span class="muted-chip">{humanizeToken(entry.channel)}</span>
                        </div>
                        <span class="muted-chip">{formatDateTime(entry.createdAt)}</span>
                      </div>
                      <div class="card-body">
                        <h3>{entry.user && entry.user.displayName ? entry.user.displayName : 'Anonymous rating'}</h3>
                        <p>{entry.comment ? truncate(entry.comment, 140) : 'Rating submitted without a written note.'}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div class="section-head compact" style={{ marginTop: '1rem' }}>
                  <div>
                    <h3>Support inbox</h3>
                    <p>Complaints and issue reports from the mobile support form.</p>
                  </div>
                </div>

                <div class="list-wrap">
                  {adminOps.value.supportInbox.length === 0 ? (
                    <div class="empty-state">No complaints or support tickets have been submitted yet.</div>
                  ) : adminOps.value.supportInbox.map((ticket) => (
                    <article class="content-card" key={`support-ticket-${ticket.id}`}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class={['pill', ticket.status === 'resolved' || ticket.status === 'closed' ? 'pill-live' : 'pill-draft']}>
                            {humanizeToken(ticket.status)}
                          </span>
                          <span class="muted-chip">{humanizeToken(ticket.priority)}</span>
                          <span class="muted-chip">{humanizeToken(ticket.category)}</span>
                        </div>
                        <span class="muted-chip">{formatDateTime(ticket.createdAt)}</span>
                      </div>
                      <div class="card-body">
                        <h3>{ticket.subject}</h3>
                        <p>{truncate(ticket.message, 180)}</p>
                      </div>
                      <div class="meta-grid">
                        <div>
                          <span class="meta-label">Reporter</span>
                          <strong>{ticket.user && ticket.user.displayName ? ticket.user.displayName : 'Unknown user'}</strong>
                        </div>
                        <div>
                          <span class="meta-label">Email</span>
                          <strong>{ticket.user && ticket.user.email ? ticket.user.email : 'No email attached'}</strong>
                        </div>
                      </div>
                      <label style={{ marginTop: '0.2rem' }}>
                        Ticket status
                        <select
                          value={ticket.status}
                          disabled={supportStatusUpdatingId.value === ticket.id}
                          onChange={(event) => void updateSupportRequestStatus(ticket.id, readValue(event))}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </label>
                    </article>
                  ))}
                </div>
              </article>
              ) : null}

              {isAdmin.value ? (
              <article class="panel glass-panel reveal-up" style={{ animationDelay: '280ms' }}>
                <div class="section-head split">
                  <div>
                    <h2>Smart Ops</h2>
                    <p>Automated recommendations and recent backend automation runs.</p>
                  </div>
                  <span class="section-badge">
                    {(adminOps.value.recentAutomation || []).length} recent run{((adminOps.value.recentAutomation || []).length) === 1 ? '' : 's'}
                  </span>
                </div>

                <div class="list-wrap">
                  {(adminOps.value.smartInsights || []).length === 0 ? (
                    <div class="empty-state">No automation insights are available yet.</div>
                  ) : adminOps.value.smartInsights.map((insight) => (
                    <article class="content-card" key={`insight-${insight.id}`}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class={['pill', insight.tone === 'success' ? 'pill-live' : insight.tone === 'warning' ? 'pill-draft' : 'pill-video']}>
                            {humanizeToken(insight.tone)}
                          </span>
                          <span class="muted-chip">Automation Insight</span>
                        </div>
                      </div>
                      <div class="card-body">
                        <h3>{insight.title}</h3>
                        <p>{insight.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div class="section-head compact" style={{ marginTop: '1rem' }}>
                  <div>
                    <h3>Recent automation</h3>
                    <p>Import, sync, and scheduled operational events tracked by the backend.</p>
                  </div>
                </div>

                <div class="list-wrap">
                  {(adminOps.value.recentAutomation || []).length === 0 ? (
                    <div class="empty-state">No automation runs have been recorded yet.</div>
                  ) : adminOps.value.recentAutomation.map((run) => (
                    <article class="content-card" key={`automation-run-${run.id}`}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class={['pill', run.status === 'completed' ? 'pill-live' : run.status === 'failed' ? 'pill-draft' : 'pill-video']}>
                            {humanizeToken(run.status)}
                          </span>
                          <span class="muted-chip">{run.label}</span>
                        </div>
                        <span class="muted-chip">{formatDateTime(run.createdAt)}</span>
                      </div>
                      <div class="card-body">
                        <h3>{run.label}</h3>
                        <p>{run.notes || 'Automation run recorded without operator notes.'}</p>
                      </div>
                      <div class="meta-grid">
                        <div>
                          <span class="meta-label">Actor</span>
                          <strong>{run.actor && run.actor.displayName ? run.actor.displayName : 'System'}</strong>
                        </div>
                        <div>
                          <span class="meta-label">Scope</span>
                          <strong>{humanizeToken(run.scope)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
              ) : null}

              <article class="panel glass-panel reveal-up" style={{ animationDelay: '260ms' }}>
                <div class="section-head split">
                  <div>
                    <h2>Latest Content</h2>
                    <p>Your most recent uploads and updates.</p>
                  </div>
                  <button type="button" class="ghost-btn compact" onClick={() => setDashboardView('editor')}>
                    Manage Library
                  </button>
                </div>
                <div class="list-wrap">
                  {recentItems.value.length === 0 ? (
                    <div class="empty-state">No content yet. Click <strong>Open Editor</strong> to publish your first item.</div>
                  ) : recentItems.value.map((item) => (
                    <article class="content-card" key={`overview-item-${item.id}`}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class={['pill', `pill-${item.type}`]}>{item.type}</span>
                          <span class={['pill', item.visibility === 'published' ? 'pill-live' : 'pill-draft']}>{item.visibility}</span>
                        </div>
                        <span class="muted-chip">{formatDateTime(item.updatedAt)}</span>
                      </div>
                      <div class="card-body">
                        <h3>{item.title}</h3>
                        <p>{truncate(item.description, 120)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article class="panel glass-panel reveal-up" style={{ animationDelay: '300ms' }}>
                <div class="section-head split">
                  <div>
                    <h2>YouTube Feed</h2>
                    <p>Preview latest channel videos and sync directly into your library.</p>
                  </div>
                  <div class="button-row">
                    <button type="button" class="ghost-btn compact" onClick={() => void fetchYouTubePreview()} disabled={youtubePreviewLoading.value}>
                      {youtubePreviewLoading.value ? 'Loading...' : 'Fetch Videos'}
                    </button>
                    <button type="button" class="ghost-btn compact" onClick={() => setDashboardView('editor')}>
                      Open Sync
                    </button>
                  </div>
                </div>
                <div class="list-wrap">
                  {youtubePreviewItems.value.length === 0 ? (
                    <div class="empty-state">No videos loaded yet. Click <strong>Fetch Videos</strong>.</div>
                  ) : youtubePreviewItems.value.slice(0, 4).map((video) => (
                    <article class="content-card" key={`overview-yt-${video.youtubeVideoId}`}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class="pill pill-video">video</span>
                          {video.isLive ? <span class="pill pill-live">live</span> : null}
                        </div>
                        <span class="muted-chip">{video.duration || '--:--'}</span>
                      </div>
                      <div class="card-body">
                        <h3>{video.title}</h3>
                        <p>{truncate(video.description, 120)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {dashboardView.value === 'mobile-preview' ? (
            <section class="mobile-preview-grid">
              <article class="panel glass-panel reveal-up" style={{ animationDelay: '220ms' }}>
                <div class="section-head split">
                  <div>
                    <h2>Mobile App Live Preview</h2>
                    <p>Preview the mobile interface while updating content and backend-managed app config.</p>
                  </div>
                  <button
                    type="button"
                    class="ghost-btn compact"
                    onClick={reloadMobilePreview}
                  >
                    Reload Preview
                  </button>
                </div>

                <div class="mobile-preview-controls">
                  <label>
                    Mobile preview URL
                    <input
                      value={mobilePreviewDraft.value}
                      onInput={(event) => { mobilePreviewDraft.value = readValue(event); }}
                      placeholder="https://app.your-domain.com"
                    />
                  </label>
                  <div class="button-row mobile-preview-actions">
                    <button type="button" class="primary-btn" onClick={applyMobilePreviewUrl}>
                      Apply URL
                    </button>
                    <a href={mobilePreviewUrl.value} target="_blank" rel="noreferrer noopener" class="ghost-btn compact mobile-preview-link">
                      Open in New Tab
                    </a>
                  </div>
                </div>

                <div class="mobile-preview-frame-wrap">
                  <iframe
                    key={`mobile-preview-${mobilePreviewFrameKey.value}`}
                    src={mobilePreviewUrl.value}
                    title="Mobile app preview"
                    class="mobile-preview-frame"
                    loading="lazy"
                  />
                </div>

                <div class="helper-card" style={{ marginTop: '0.9rem' }}>
                  <strong>Live flow</strong>
                  <p>
                    Publish content, assign sections, or update mobile app config in this dashboard, then click <em>Reload Preview</em> to verify changes reflected in the app UI.
                  </p>
                </div>
              </article>

              <article class="panel glass-panel reveal-up" style={{ animationDelay: '260ms' }}>
                <div class="section-head split">
                  <div>
                    <h2>Endpoint Diagnostics</h2>
                    <p>Validate backend endpoints used by admin and mobile clients.</p>
                  </div>
                  <button
                    type="button"
                    class="ghost-btn compact"
                    onClick={() => void runEndpointChecks()}
                    disabled={endpointChecksLoading.value}
                  >
                    {endpointChecksLoading.value ? 'Checking...' : 'Run Checks'}
                  </button>
                </div>

                {endpointChecksAt.value ? (
                  <div class="muted-chip">Last check: {formatDateTime(endpointChecksAt.value)}</div>
                ) : null}

                <div class="helper-card" style={{ marginTop: '0.8rem' }}>
                  <strong>YouTube requirement</strong>
                  <p>
                    Set <code>YOUTUBE_API_KEY</code> and <code>YOUTUBE_CHANNEL_ID</code> in the root <code>.env.development</code> or <code>.env.production</code> file, then restart the API to enable YouTube feed and sync.
                  </p>
                </div>

                <div class="endpoint-check-list">
                  {endpointChecks.value.length === 0 ? (
                    <div class="empty-state">No checks run yet. Click <strong>Run Checks</strong>.</div>
                  ) : endpointChecks.value.map((check) => (
                    <article class={['endpoint-check-card', check.status === 'ok' ? 'is-ok' : 'is-error']} key={`${check.label}-${check.path}`}>
                      <div class="endpoint-check-head">
                        <strong>{check.label}</strong>
                        <span class={['pill', check.status === 'ok' ? 'pill-live' : 'pill-draft']}>
                          {check.statusCode || 'ERR'}
                        </span>
                      </div>
                      <code>{check.path}</code>
                      <p>{check.detail}</p>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {dashboardView.value === 'editor' ? (
            <main class="main-grid">
            <section class="panel glass-panel reveal-up" style={{ animationDelay: '140ms' }}>
              <div class="section-head">
                <div>
                  <h2>New Content</h2>
                  <p>Add music, video, playlists, or announcements for your audience.</p>
                </div>
                <span class="section-badge">Publish Center</span>
              </div>

              <form class="stack-form" onSubmit={(event) => void createContent(event)}>
                <div class="field-cluster">
                  <label>
                    Title
                    <input
                      value={createForm.title}
                      onInput={(event) => { createForm.title = readValue(event); }}
                      placeholder="Example: Friday Worship Session"
                    />
                  </label>
                </div>

                <div class="field-cluster">
                  <label>
                    Description
                    <textarea
                      value={createForm.description}
                      onInput={(event) => { createForm.description = readValue(event); }}
                      rows={5}
                      placeholder="Add a short summary so users understand what this content is about."
                    />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Content type
                    <select value={createForm.type} onChange={(event) => { createForm.type = readValue(event); }}>
                      {CONTENT_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}
                    </select>
                  </label>

                  <label>
                    Status
                    <select value={createForm.visibility} onChange={(event) => { createForm.visibility = readValue(event); }}>
                      {VISIBILITY_OPTIONS.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}
                    </select>
                  </label>
                </div>

                <label>
                  Media link
                  <input
                    value={createForm.url}
                    onInput={(event) => { createForm.url = readValue(event); }}
                    placeholder="Paste the audio/video link from your storage or CDN"
                  />
                </label>

                <div class="grid-2">
                  <label>
                    Upload media ({createForm.type === 'video' ? 'video' : createForm.type === 'audio' ? 'audio' : 'select audio/video first'})
                    <input
                      type="file"
                      accept={acceptFromPolicy(getUploadPolicy(resolveMediaAssetKind())) || 'audio/*,video/*'}
                      onChange={(event) => void handleAssetUpload(event, 'media')}
                      disabled={uploadingAsset.value || (createForm.type !== 'audio' && createForm.type !== 'video')}
                    />
                    <small class="subtle-text">
                      {(() => {
                        const kind = resolveMediaAssetKind();
                        const policy = kind ? getUploadPolicy(kind) : null;
                        if (!kind) return 'Select content type Audio or Video to upload a media file.';
                        if (!policy) return uploadPoliciesLoading.value ? 'Loading upload rules...' : 'Allowed formats and size limits are applied automatically.';
                        return `Allowed: ${policy.allowedExtensions.join(', ')} • Max ${formatBytes(policy.maxBytes)}`;
                      })()}
                    </small>
                  </label>

                  <label>
                    Upload thumbnail (required for audio/video)
                    <input
                      type="file"
                      accept={acceptFromPolicy(getUploadPolicy('thumbnail')) || 'image/jpeg,image/png,image/webp'}
                      onChange={(event) => void handleAssetUpload(event, 'thumbnail')}
                      disabled={uploadingAsset.value}
                    />
                    <small class="subtle-text">
                      {(() => {
                        const policy = getUploadPolicy('thumbnail');
                        if (!policy) return uploadPoliciesLoading.value ? 'Loading thumbnail rules...' : 'Allowed formats and size limits are applied automatically.';
                        return `Allowed: ${policy.allowedExtensions.join(', ')} • Max ${formatBytes(policy.maxBytes)}`;
                      })()}
                    </small>
                  </label>
                </div>
                {uploadingAsset.value ? <div class="muted-chip">Uploading to storage...</div> : null}

                <div class="grid-2">
                  <label>
                    Thumbnail URL (optional)
                    <input
                      value={createForm.thumbnailUrl}
                      onInput={(event) => { createForm.thumbnailUrl = readValue(event); }}
                      placeholder="Paste image URL for posters/cards"
                    />
                  </label>

                  <label>
                    Channel / Artist
                    <input
                      value={createForm.channelName}
                      onInput={(event) => { createForm.channelName = readValue(event); }}
                      placeholder="ClaudyGod Music Ministries"
                    />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Duration label
                    <input
                      value={createForm.duration}
                      onInput={(event) => { createForm.duration = readValue(event); }}
                      placeholder="45:12"
                    />
                  </label>

                  <label>
                    Tags (comma-separated)
                    <input
                      value={createForm.tagsCsv}
                      onInput={(event) => { createForm.tagsCsv = readValue(event); }}
                      placeholder="worship, live session, choir"
                    />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    App sections (comma-separated)
                    <input
                      value={createForm.appSectionsCsv}
                      onInput={(event) => { createForm.appSectionsCsv = readValue(event); }}
                      placeholder="ClaudyGod Music, ClaudyGod Nuggets of Truth"
                    />
                  </label>

                  <div class="helper-card">
                    <strong>Asset status</strong>
                    <p>
                      {createForm.mediaUploadSessionId || createForm.thumbnailUploadSessionId
                        ? 'Uploaded files are linked to this content draft and will be tracked in the backend database.'
                        : 'Upload media or a thumbnail to create a traceable storage-to-content record.'}
                    </p>
                  </div>
                </div>

                <div class="helper-card">
                  <strong>Tip</strong>
                  <p>
                    Use <em>Draft</em> while reviewing new content, then switch to <em>Published</em> when it is ready for users. App sections control where cards appear on the mobile home page.
                  </p>
                </div>

                <section class="youtube-sync-block">
                  <div class="section-head compact">
                    <div>
                      <h3>YouTube Sync</h3>
                      <p>Fetch channel videos from the backend and import them into your content library.</p>
                    </div>
                    <span class="section-badge">YouTube</span>
                  </div>

                  <label>
                    YouTube Channel ID (optional override)
                    <input
                      value={youtubeSyncState.channelId}
                      onInput={(event) => { youtubeSyncState.channelId = readValue(event); }}
                      placeholder="Use backend default if left empty"
                    />
                  </label>

                  <div class="grid-2">
                    <label>
                      Max results
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={String(youtubeSyncState.maxResults)}
                        onInput={(event) => { youtubeSyncState.maxResults = Number(readValue(event)) || YOUTUBE_SYNC_DEFAULT_LIMIT; }}
                      />
                    </label>

                    <label>
                      Import as
                      <select value={youtubeSyncState.visibility} onChange={(event) => { youtubeSyncState.visibility = readValue(event); }}>
                        {VISIBILITY_OPTIONS.map((visibility) => <option value={visibility} key={`yt-${visibility}`}>{visibility}</option>)}
                      </select>
                    </label>
                  </div>

                  <label>
                    Default app sections for fetched videos (comma-separated)
                    <input
                      value={youtubeSyncState.appSectionsCsv}
                      onInput={(event) => { youtubeSyncState.appSectionsCsv = readValue(event); }}
                      placeholder="ClaudyGod Music, ClaudyGod Messages"
                    />
                  </label>

                  <div class="button-row">
                    <button type="button" class="ghost-btn compact" onClick={() => void fetchYouTubePreview()} disabled={youtubePreviewLoading.value || youtubeSyncLoading.value}>
                      {youtubePreviewLoading.value ? 'Fetching...' : 'Fetch Preview'}
                    </button>
                    <button type="button" class="ghost-btn compact" onClick={applySmartYouTubeAssignments} disabled={youtubeDraftItems.value.length === 0 || youtubeImporting.value}>
                      Apply Smart Suggestions
                    </button>
                  </div>

                  <div class="button-row">
                    <button type="button" class="primary-btn" onClick={() => void importSelectedYouTubeVideos()} disabled={youtubeImporting.value || youtubePreviewLoading.value || youtubeDraftItems.value.length === 0}>
                      {youtubeImporting.value ? 'Importing Selected...' : `Import Selected (${selectedYouTubeDraftCount.value})`}
                    </button>
                    <button type="button" class="ghost-btn compact" onClick={() => void syncYouTubeVideos()} disabled={youtubeSyncLoading.value || youtubePreviewLoading.value}>
                      {youtubeSyncLoading.value ? 'Syncing YouTube...' : 'Quick Sync All'}
                    </button>
                  </div>

                  <div class="helper-card">
                    <strong>Curated import flow</strong>
                    <p>
                      Fetch videos, review each one, adjust sections and tags, then import only the selected items. Quick Sync All is available when you want a one-click batch import.
                    </p>
                  </div>

                  <div class="youtube-preview-list">
                    {youtubeDraftItems.value.length === 0 ? (
                      <div class="empty-state">
                        No YouTube videos loaded yet. Click <strong>Fetch Preview</strong> to load the latest channel videos.
                      </div>
                    ) : youtubeDraftItems.value.map((video) => (
                      <article class="content-card" key={video.youtubeVideoId}>
                        <div class="card-top">
                          <div class="pill-row">
                            <span class="pill pill-video">video</span>
                            {video.isLive ? <span class="pill pill-live">live</span> : null}
                            <span class={['pill', video.selected ? 'pill-live' : 'pill-draft']}>{video.selected ? 'selected' : 'skipped'}</span>
                          </div>
                          <span class="muted-chip">{video.duration || '--:--'}</span>
                        </div>
                        <label class="checkbox-row">
                          <input
                            type="checkbox"
                            class="inline-checkbox"
                            checked={Boolean(video.selected)}
                            onChange={(event) => updateYouTubeDraftItem(video.youtubeVideoId, { selected: readChecked(event) })}
                          />
                          <span>
                            Include this video
                            <small>Selected videos will be imported into the content library.</small>
                          </span>
                        </label>
                        <div class="card-link-row">
                          <img src={video.thumbnailUrl} alt={video.title} style={{ width: '120px', height: '72px', borderRadius: '12px', objectFit: 'cover' }} />
                          <div style={{ display: 'grid', gap: '0.35rem', flex: 1 }}>
                            <a href={video.url} target="_blank" rel="noreferrer noopener" class="media-link">Open YouTube</a>
                            <span class="muted-chip">{formatDateTime(video.publishedAt)}</span>
                          </div>
                        </div>
                        <div class="card-body">
                          <h3>{video.title}</h3>
                          <p>{truncate(video.description || '', 140)}</p>
                        </div>
                        <div class="pill-row">
                          {(video.suggestedAppSections || []).map((section) => (
                            <span class="muted-chip" key={`${video.youtubeVideoId}-section-${section}`}>Suggested: {section}</span>
                          ))}
                          {(video.suggestedTags || []).map((tag) => (
                            <span class="muted-chip" key={`${video.youtubeVideoId}-tag-${tag}`}>#{tag}</span>
                          ))}
                        </div>
                        <div class="grid-2">
                          <label>
                            App sections
                            <input
                              value={video.appSectionsCsv}
                              onInput={(event) => updateYouTubeDraftItem(video.youtubeVideoId, {
                                appSectionsCsv: readValue(event),
                                appSections: parseCsvList(readValue(event)),
                              })}
                              placeholder="ClaudyGod Music, ClaudyGod Messages"
                            />
                          </label>
                          <label>
                            Tags
                            <input
                              value={video.tagsCsv}
                              onInput={(event) => updateYouTubeDraftItem(video.youtubeVideoId, {
                                tagsCsv: readValue(event),
                                tags: parseCsvList(readValue(event)),
                              })}
                              placeholder="worship, live, message"
                            />
                          </label>
                        </div>
                        <label>
                          Import visibility
                          <select
                            value={video.visibility}
                            onChange={(event) => updateYouTubeDraftItem(video.youtubeVideoId, { visibility: readValue(event) })}
                          >
                            {VISIBILITY_OPTIONS.map((visibility) => <option value={visibility} key={`yt-visibility-${video.youtubeVideoId}-${visibility}`}>{visibility}</option>)}
                          </select>
                        </label>
                      </article>
                    ))}
                  </div>
                </section>

                <button type="submit" class="primary-btn primary-btn-large" disabled={savingContent.value}>
                  {savingContent.value ? 'Saving...' : createForm.visibility === 'published' ? 'Publish Content' : 'Save Draft'}
                </button>
              </form>
            </section>

            <section class="panel glass-panel reveal-up" style={{ animationDelay: '220ms' }}>
              <div class="section-head split">
                <div>
                  <h2>Content Library</h2>
                  <p>Browse, search, and update your uploaded content.</p>
                </div>
                <div class="library-total">{pagination.total} total items</div>
              </div>

              <div class="filter-grid">
                <input
                  value={filterState.search}
                  onInput={(event) => { filterState.search = readValue(event); }}
                  placeholder="Search by title, description, creator, or link"
                />
                <select value={filterState.type} onChange={(event) => { filterState.type = readValue(event); }}>
                  <option value="all">All types</option>
                  {CONTENT_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}
                </select>
                <select value={filterState.visibility} onChange={(event) => { filterState.visibility = readValue(event); }}>
                  <option value="all">All status</option>
                  {VISIBILITY_OPTIONS.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}
                </select>
              </div>

              <div class="list-wrap">
                {contentLoading.value ? <div class="empty-state">Loading your content library...</div> : null}
                {!contentLoading.value && filteredItems.value.length === 0 ? (
                  <div class="empty-state">
                    No content found. Try adjusting your search or create a new item.
                  </div>
                ) : null}

                {!contentLoading.value ? filteredItems.value.map((item, index) => (
                  <article class="content-card" key={item.id} style={{ animationDelay: `${index * 60}ms` }}>
                    <div class="card-top">
                      <div class="pill-row">
                        <span class={['pill', `pill-${item.type}`]}>{item.type}</span>
                        <span class={['pill', item.visibility === 'published' ? 'pill-live' : 'pill-draft']}>{item.visibility}</span>
                        {item.sourceKind ? <span class="pill">{item.sourceKind}</span> : null}
                      </div>
                      <div class="button-row">
                        <button
                          type="button"
                          class="ghost-btn compact"
                          onClick={() => void toggleVisibility(item)}
                          disabled={togglingId.value === item.id}
                        >
                          {togglingId.value === item.id ? 'Updating...' : item.visibility === 'published' ? 'Move to Draft' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          class="ghost-btn compact"
                          onClick={() => openEditContentModal(item)}
                          disabled={deletingContentId.value === item.id}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="ghost-btn compact"
                          onClick={() => void assignContentSections(item)}
                        >
                          Assign Sections
                        </button>
                        <button
                          type="button"
                          class="danger-btn"
                          onClick={() => void deleteContentItem(item)}
                          disabled={deletingContentId.value === item.id}
                        >
                          {deletingContentId.value === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    <div class="card-body">
                      <h3>{item.title}</h3>
                      <p>{truncate(item.description, 190)}</p>
                    </div>

                    <div class="card-link-row">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer noopener" class="media-link">
                          Open media link
                        </a>
                      ) : (
                        <span class="muted-chip">No media link added</span>
                      )}
                      {Array.isArray(item.appSections) && item.appSections.length ? (
                        <span class="muted-chip">Sections: {item.appSections.join(', ')}</span>
                      ) : null}
                    </div>

                    <div class="meta-grid">
                      <div>
                        <span class="meta-label">Created by</span>
                        <strong>{item.author && item.author.displayName ? item.author.displayName : 'Unknown'}</strong>
                      </div>
                      <div>
                        <span class="meta-label">Updated</span>
                        <strong>{formatDateTime(item.updatedAt)}</strong>
                      </div>
                    </div>
                  </article>
                )) : null}
              </div>
            </section>

            {isAdmin.value ? (
              <>
                <section class="panel glass-panel reveal-up" style={{ animationDelay: '260ms' }}>
                  <div class="section-head split">
                    <div>
                      <h2>Mobile App Config</h2>
                      <p>Edit backend-managed content for mobile Help, About, Privacy, Donate, and Rate screens.</p>
                    </div>
                    <div class="button-row">
                      <button
                        type="button"
                        class="ghost-btn compact"
                        onClick={() => void fetchMobileAppConfig()}
                        disabled={appConfigLoading.value || appConfigSaving.value}
                      >
                        {appConfigLoading.value ? 'Loading...' : 'Reload'}
                      </button>
                      <button
                        type="button"
                        class="primary-btn"
                        onClick={() => void saveMobileAppConfig()}
                        disabled={appConfigLoading.value || appConfigSaving.value || !mobileAppConfigEditor.value.trim()}
                      >
                        {appConfigSaving.value ? 'Saving config...' : 'Save Config'}
                      </button>
                    </div>
                  </div>

                  <div class="helper-card">
                    <strong>Backend validation enabled</strong>
                    <p>
                      This JSON is validated by the API before save. Invalid fields, URLs, or missing sections will be rejected with field-level errors.
                    </p>
                  </div>

                  {mobileAppConfigMeta.value ? (
                    <div class="meta-grid" style={{ marginTop: '0.85rem', marginBottom: '0.85rem' }}>
                      <div>
                        <span class="meta-label">Config Key</span>
                        <strong>{mobileAppConfigMeta.value.key}</strong>
                      </div>
                      <div>
                        <span class="meta-label">Updated</span>
                        <strong>{formatDateTime(mobileAppConfigMeta.value.updatedAt)}</strong>
                      </div>
                    </div>
                  ) : null}

                  <label>
                    Mobile app experience config (JSON)
                    <textarea
                      rows={18}
                      value={mobileAppConfigEditor.value}
                      onInput={(event) => { mobileAppConfigEditor.value = readValue(event); }}
                      placeholder='{"version":1,"privacy":{...},"help":{...}}'
                      spellcheck={false}
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                    />
                  </label>
                </section>

                <section class="panel glass-panel reveal-up" style={{ animationDelay: '300ms' }}>
                  <div class="section-head split">
                    <div>
                      <h2>Word for Today</h2>
                      <p>Publish daily Bible messages to the mobile home screen and notify users by email.</p>
                    </div>
                    <div class="button-row">
                      <button
                        type="button"
                        class="ghost-btn compact"
                        onClick={() => void fetchWordOfDayDashboard()}
                        disabled={wordOfDayLoading.value || wordOfDaySaving.value}
                      >
                        {wordOfDayLoading.value ? 'Loading...' : 'Reload'}
                      </button>
                      <button
                        type="button"
                        class="primary-btn"
                        onClick={() => void saveWordOfDay()}
                        disabled={wordOfDayLoading.value || wordOfDaySaving.value}
                      >
                        {wordOfDaySaving.value ? 'Publishing...' : 'Save / Publish Word'}
                      </button>
                    </div>
                  </div>

                  <div class="grid-2">
                    <label>
                      Title
                      <input
                        value={wordOfDayForm.title}
                        onInput={(event) => { wordOfDayForm.title = readValue(event); }}
                        placeholder="Word for Today"
                      />
                    </label>
                    <label>
                      Message date
                      <input
                        type="date"
                        value={wordOfDayForm.messageDate}
                        onInput={(event) => { wordOfDayForm.messageDate = readValue(event); }}
                      />
                    </label>
                  </div>

                  <div class="grid-2">
                    <label>
                      Passage
                      <input
                        value={wordOfDayForm.passage}
                        onInput={(event) => { wordOfDayForm.passage = readValue(event); }}
                        placeholder="Psalm 119:105"
                      />
                    </label>
                    <label>
                      Status
                      <select value={wordOfDayForm.status} onChange={(event) => { wordOfDayForm.status = readValue(event); }}>
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                        <option value="archived">archived</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Verse
                    <textarea
                      rows={4}
                      value={wordOfDayForm.verse}
                      onInput={(event) => { wordOfDayForm.verse = readValue(event); }}
                      placeholder="Your word is a lamp to my feet and a light to my path."
                    />
                  </label>

                  <label>
                    Reflection / Message
                    <textarea
                      rows={5}
                      value={wordOfDayForm.reflection}
                      onInput={(event) => { wordOfDayForm.reflection = readValue(event); }}
                      placeholder="Short daily reflection for users."
                    />
                  </label>

                  <label class="checkbox-row" style={{ marginTop: '0.5rem' }}>
                    <input
                      type="checkbox"
                      class="inline-checkbox"
                      checked={wordOfDayForm.notifySubscribers}
                      onChange={(event) => { wordOfDayForm.notifySubscribers = readChecked(event); }}
                    />
                    <span>
                      Email all active client users
                      <small>Queues email notifications for users with notifications enabled.</small>
                    </span>
                  </label>

                  {wordOfDayCurrent.value ? (
                    <div class="helper-card" style={{ marginTop: '0.9rem' }}>
                      <strong>Current published word</strong>
                      <p>
                        {wordOfDayCurrent.value.messageDate} • {wordOfDayCurrent.value.passage}
                        {wordOfDayCurrent.value.notifiedAt ? ` • Emails queued ${formatDateTime(wordOfDayCurrent.value.notifiedAt)}` : ''}
                      </p>
                    </div>
                  ) : null}

                  <div class="list-wrap" style={{ marginTop: '0.8rem' }}>
                    {wordOfDayHistory.value.length === 0 ? (
                      <div class="empty-state">No Word for Today entries yet.</div>
                    ) : wordOfDayHistory.value.map((entry) => (
                      <article class="content-card" key={entry.id}>
                        <div class="card-top">
                          <div class="pill-row">
                            <span class="pill">word</span>
                            <span class={['pill', entry.status === 'published' ? 'pill-live' : 'pill-draft']}>{entry.status}</span>
                          </div>
                          <span class="muted-chip">{entry.messageDate}</span>
                        </div>
                        <div class="card-body">
                          <h3>{entry.passage}</h3>
                          <p>{truncate(entry.verse, 160)}</p>
                        </div>
                        <div class="card-link-row">
                          <span class="muted-chip">{entry.notifiedAt ? `Emails queued: ${formatDateTime(entry.notifiedAt)}` : 'No email queue yet'}</span>
                          <button
                            type="button"
                            class="ghost-btn compact"
                            onClick={() => {
                              wordOfDayForm.title = entry.title || 'Word for Today';
                              wordOfDayForm.passage = entry.passage || '';
                              wordOfDayForm.verse = entry.verse || '';
                              wordOfDayForm.reflection = entry.reflection || '';
                              wordOfDayForm.messageDate = entry.messageDate || todayDateInputValue();
                              wordOfDayForm.status = entry.status || 'published';
                            }}
                          >
                            Load
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
            </main>
          ) : null}

          {editContentOpen.value ? (
            <div
              class="modal-backdrop"
              onClick={(event) => {
                if (event.target === event.currentTarget && !editContentSaving.value) {
                  closeEditContentModal();
                }
              }}
            >
              <section class="modal-card glass-panel" role="dialog" aria-modal="true" aria-labelledby="edit-content-title">
                <div class="section-head split">
                  <div>
                    <h2 id="edit-content-title">Edit Content</h2>
                    <p>Update title, description, media links, tags, and mobile app placement for this item.</p>
                  </div>
                  <div class="button-row">
                    <button
                      type="button"
                      class="ghost-btn compact"
                      onClick={closeEditContentModal}
                      disabled={editContentSaving.value}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <form class="stack-form" onSubmit={(event) => void saveEditedContent(event)}>
                  <div class="field-cluster">
                    <label>
                      Title
                      <input
                        value={editForm.title}
                        onInput={(event) => { editForm.title = readValue(event); }}
                        placeholder="Content title"
                      />
                    </label>
                  </div>

                  <label>
                    Description
                    <textarea
                      rows={5}
                      value={editForm.description}
                      onInput={(event) => { editForm.description = readValue(event); }}
                      placeholder="Short description shown to users."
                    />
                  </label>

                  <div class="grid-2">
                    <label>
                      Content type
                      <select value={editForm.type} onChange={(event) => { editForm.type = readValue(event); }}>
                        {CONTENT_TYPES.map((type) => <option value={type} key={`edit-${type}`}>{type}</option>)}
                      </select>
                    </label>
                    <label>
                      Status
                      <select value={editForm.visibility} onChange={(event) => { editForm.visibility = readValue(event); }}>
                        {VISIBILITY_OPTIONS.map((visibility) => <option value={visibility} key={`edit-v-${visibility}`}>{visibility}</option>)}
                      </select>
                    </label>
                  </div>

                  <div class="grid-2">
                    <label>
                      Media URL
                      <input
                        value={editForm.url}
                        onInput={(event) => { editForm.url = readValue(event); }}
                        placeholder="https://..."
                      />
                    </label>
                    <label>
                      Thumbnail URL
                      <input
                        value={editForm.thumbnailUrl}
                        onInput={(event) => { editForm.thumbnailUrl = readValue(event); }}
                        placeholder="https://... (required for audio/video)"
                      />
                    </label>
                  </div>

                  <div class="grid-2">
                    <label>
                      Channel / Artist Name (optional)
                      <input
                        value={editForm.channelName}
                        onInput={(event) => { editForm.channelName = readValue(event); }}
                        placeholder="ClaudyGod Ministries"
                      />
                    </label>
                    <label>
                      Duration label (optional)
                      <input
                        value={editForm.duration}
                        onInput={(event) => { editForm.duration = readValue(event); }}
                        placeholder="12:34"
                      />
                    </label>
                  </div>

                  <div class="grid-2">
                    <label>
                      Tags (comma-separated)
                      <input
                        value={editForm.tagsCsv}
                        onInput={(event) => { editForm.tagsCsv = readValue(event); }}
                        placeholder="worship, sermon, youth"
                      />
                    </label>
                    <label>
                      App sections (comma-separated)
                      <input
                        value={editForm.appSectionsCsv}
                        onInput={(event) => { editForm.appSectionsCsv = readValue(event); }}
                        placeholder="ClaudyGod Music, ClaudyGod Nuggets of Truth"
                      />
                    </label>
                  </div>

                  <div class="helper-card">
                    <strong>Validation rules</strong>
                    <p>
                      Audio and video items require both a media URL and a thumbnail URL. URLs must start with `http://` or `https://`. Tags and sections are deduplicated before save.
                    </p>
                  </div>

                  <div class="button-row modal-actions">
                    <button
                      type="button"
                      class="ghost-btn compact"
                      onClick={closeEditContentModal}
                      disabled={editContentSaving.value}
                    >
                      Cancel
                    </button>
                    <button type="submit" class="primary-btn" disabled={editContentSaving.value}>
                      {editContentSaving.value ? 'Saving changes...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          ) : null}

        </section>
      );

      const shellContent = appLoading.value
        ? (
          <div class="boot-state">
            <div class="boot-card glass-panel reveal-up">
              <div class="logo-wrap logo-wrap-large">
                <div class="logo-glow" />
                <img src={BRAND_LOGO_URL} alt="ClaudyGod" class="brand-logo" />
              </div>
              <div class="boot-loader" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>Preparing your portal...</p>
              <p>Loading your dashboard...</p>
            </div>
          </div>
        )
        : (currentUser.value ? dashboardScreen : loginScreen);

      return (
        <div class="app-root">
          <div class="bg-orb orb-a" />
          <div class="bg-orb orb-b" />
          <div class="bg-orb orb-c" />

          <header class="global-header">
            <div class="global-header-inner">
              <div class="brand-inline">
                <div class="logo-wrap">
                  <img src={BRAND_LOGO_URL} alt="ClaudyGod" class="brand-logo" />
                </div>
                <div>
                  <p class="eyebrow">ClaudyGod Ministries</p>
                  <div class="brand-title-line">Content Studio Admin</div>
                </div>
              </div>

              <div class="header-controls">
                {currentUser.value ? (
                  <button
                    type="button"
                    class={['header-toggle-btn', 'header-nav-toggle', headerMenuOpen.value ? 'is-open' : '']}
                    onClick={toggleHeaderMenu}
                    aria-expanded={headerMenuOpen.value ? 'true' : 'false'}
                    aria-label={headerMenuOpen.value ? 'Close navigation drawer' : 'Open navigation drawer'}
                  >
                    <span class="header-toggle-icon" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    <span>{headerMenuOpen.value ? 'Close Nav' : 'Navigation'}</span>
                  </button>
                ) : null}

                {!isCompactHeader.value ? (
                  <div class="header-command-bar">
                    {currentUser.value ? (
                      <>
                        <div class="user-pill">
                          <span class="user-pill-dot" />
                          <span>{displayName.value}</span>
                          <span class="user-pill-role">{portalRoleLabel.value}</span>
                        </div>
                        {accountEmail.value ? <span class="muted-chip">{accountEmail.value}</span> : null}
                        <div class="header-inline-actions">
                          <button type="button" class="ghost-btn compact" onClick={() => void refreshDashboard()}>
                            Refresh
                          </button>
                          <button type="button" class="danger-btn compact" onClick={logout}>
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {currentUser.value ? (
              <div class={['header-drawer', headerMenuOpen.value ? 'is-open' : '']}>
                <div class="header-drawer-inner">
                  <div class="header-drawer-nav">
                    <button
                      type="button"
                      class={['drawer-nav-link', dashboardView.value === 'overview' ? 'is-active' : '']}
                      onClick={() => setDashboardView('overview')}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      class={['drawer-nav-link', dashboardView.value === 'editor' ? 'is-active' : '']}
                      onClick={() => setDashboardView('editor')}
                    >
                      Manage Content
                    </button>
                    <button
                      type="button"
                      class={['drawer-nav-link', dashboardView.value === 'mobile-preview' ? 'is-active' : '']}
                      onClick={() => setDashboardView('mobile-preview')}
                    >
                      Preview App
                    </button>
                  </div>

                  <div class="user-pill">
                    <span class="user-pill-dot" />
                    <span>{displayName.value}</span>
                    <span class="user-pill-role">{portalRoleLabel.value}</span>
                  </div>
                  {accountEmail.value ? <span class="muted-chip">{accountEmail.value}</span> : null}

                  <div class="header-drawer-actions">
                    <button type="button" class="ghost-btn compact" onClick={() => void refreshDashboard()}>
                      Refresh
                    </button>
                    <button type="button" class="ghost-btn compact" onClick={() => void fetchYouTubePreview()}>
                      YouTube Preview
                    </button>
                    <button type="button" class="ghost-btn compact" onClick={() => void runEndpointChecks()}>
                      Run Checks
                    </button>
                    <button type="button" class="danger-btn compact" onClick={logout}>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </header>

          <main
            class={[
              'page-shell',
              appLoading.value ? 'page-shell-boot' : currentUser.value ? 'page-shell-dashboard' : 'page-shell-auth',
            ]}
          >
            {shellContent}
          </main>

          <footer class="global-footer">
            <div class="global-footer-inner global-footer-minimal">
              <span>© {currentYear} ClaudyGod Ministries</span>
              <span>{API_HOST_LABEL}</span>
            </div>
          </footer>
        </div>
      );
    };
  },
});
