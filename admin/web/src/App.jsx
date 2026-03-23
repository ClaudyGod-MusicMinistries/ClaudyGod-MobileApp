import axios from 'axios';
import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import AdminShell from './app/AdminShell';
import {
  API_HOST_LABEL,
  BRAND_LOGO_URL,
  CONTENT_REQUEST_STATUS_OPTIONS,
  CONTENT_TYPES,
  GOOGLE_LOGIN_URL,
  INACTIVITY_TIMEOUT_MS,
  USER_ROLE_OPTIONS,
  VISIBILITY_OPTIONS,
  WORKFLOW_STEPS,
  YOUTUBE_SYNC_DEFAULT_LIMIT,
  normalizePreviewUrl,
  readStoredMobilePreviewUrl,
  readStoredToken,
  storeToken,
} from './app/config';
import { http } from './app/http';
import AuthScreen from './features/auth/AuthScreen';
import EditContentModal from './features/content/EditContentModal';
import BootScreen from './features/dashboard/BootScreen';
import EditorView from './features/dashboard/EditorView';
import MobilePreviewView from './features/dashboard/MobilePreviewView';
import OverviewView from './features/dashboard/OverviewView';
import {
  acceptFromPolicy,
  describeHealthCheckDetail,
  formatBytes,
  formatDateTime,
  greetingByTime,
  humanizeToken,
  parseCsvList,
  readChecked,
  readValue,
  todayDateInputValue,
  toErrorMessage,
  truncate,
} from './shared/utils/formatters';
import {
  normalizeSectionCatalog,
  sectionSelectionMatches,
  toggleSectionSelection,
} from './shared/utils/sections';
import './App.css';

function applyToken(token) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete http.defaults.headers.common.Authorization;
}

export default defineComponent({
  name: 'ClaudyContentStudio',
  setup() {
    const accessToken = ref(readStoredToken());
    const sessionTransport = ref(accessToken.value ? 'bearer' : 'none');
    const currentUser = ref(null);
    const authLoading = ref(false);
    const authMode = ref('login');
    const appLoading = ref(false);
    const contentLoading = ref(false);
    const contentRequestLoading = ref(false);
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
    const userRoleUpdatingId = ref(null);
    const contentRequestStatusUpdatingId = ref(null);
    const creatingDraftFromRequestId = ref(null);
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
      verificationCode: '',
    });
    const pendingVerificationEmail = ref('');

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
    const contentRequests = ref([]);
    const youtubePreviewItems = ref([]);
    const youtubeDraftItems = ref([]);
    const mobileAppConfigEditor = ref('');
    const mobileAppConfigMeta = ref(null);
    const mobileAppConfigValue = ref(null);
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
    const isVerifyMode = computed(() => authMode.value === 'verify');
    const isAdmin = computed(() => Boolean(currentUser.value && currentUser.value.role === 'ADMIN'));
    const hasSession = computed(() => sessionTransport.value !== 'none');
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
    const mobileSectionCatalog = computed(() => normalizeSectionCatalog(mobileAppConfigValue.value));

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
          { label: 'Open Requests', value: requestSummary.value.active, accent: 'amber' },
          { label: 'Registered Users', value: summary.totalUsers || 0, accent: 'rose' },
        ];
      }

      return [
        { label: 'All Content', value: total, accent: 'mint' },
        { label: 'Open Requests', value: requestSummary.value.active, accent: 'blue' },
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

    const requestSummary = computed(() => {
      const requests = contentRequests.value || [];
      return {
        total: requests.length,
        active: requests.filter((item) => ['submitted', 'in_review', 'changes_requested', 'approved'].includes(item.status)).length,
        fulfilled: requests.filter((item) => item.status === 'fulfilled').length,
        needsAttention: requests.filter((item) => item.status === 'changes_requested').length,
      };
    });

    const requestStatusBoard = computed(() => [
      {
        label: 'Open Requests',
        value: requestSummary.value.active,
        accent: 'mint',
      },
      {
        label: 'Needs Changes',
        value: requestSummary.value.needsAttention,
        accent: 'amber',
      },
      {
        label: 'Converted To Draft',
        value: requestSummary.value.fulfilled,
        accent: 'blue',
      },
    ]);

    const requestQueuePreview = computed(() => (contentRequests.value || []).slice(0, 5));
    const directPublishMode = computed(() => isAdmin.value);

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

    function setSessionTransportState(transport, token = '') {
      if (transport === 'bearer' && token) {
        storeToken(token);
        accessToken.value = token;
        applyToken(token);
      } else {
        storeToken(null);
        accessToken.value = '';
        applyToken(null);
      }
      sessionTransport.value = transport;
      syncSessionTracking();
    }

    function getPendingVerificationEmail() {
      return String(pendingVerificationEmail.value || authForm.email || '').trim().toLowerCase();
    }

    function resetAuthSecrets() {
      authForm.password = '';
      authForm.confirmPassword = '';
      authForm.verificationCode = '';
    }

    function moveToVerificationStep(message) {
      const pendingEmail = getPendingVerificationEmail();
      if (pendingEmail) {
        pendingVerificationEmail.value = pendingEmail;
        authForm.email = pendingEmail;
      }
      resetAuthSecrets();
      authMode.value = 'verify';
      setNotice(
        message || 'We sent a 6-digit verification code to your email. Enter it to finish creating your account.',
        'success',
      );
    }

    async function completeAuthenticatedSession(authPayload, message) {
      const user = authPayload && authPayload.user ? authPayload.user : null;
      if (!user) {
        throw new Error('Authentication succeeded but no user profile was returned.');
      }

      const freshToken = String(authPayload && authPayload.accessToken ? authPayload.accessToken : '').trim();
      if (freshToken) {
        setSessionTransportState('bearer', freshToken);
      } else {
        setSessionTransportState('cookie');
      }

      currentUser.value = user;
      pendingVerificationEmail.value = '';
      authMode.value = 'login';
      authForm.email = user.email || authForm.email.trim();
      resetAuthSecrets();

      await Promise.all([
        fetchManagedContent(freshToken || undefined),
        fetchContentRequests(freshToken || undefined),
        fetchUploadPolicies(freshToken || undefined),
        user.role === 'ADMIN' ? fetchAdminOperationsDashboard() : Promise.resolve(),
        user.role === 'ADMIN' ? fetchMobileAppConfig() : Promise.resolve(),
        user.role === 'ADMIN' ? fetchWordOfDayDashboard() : Promise.resolve(),
        runEndpointChecks(),
      ]);

      setNotice(message, 'success');
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

    function resetMobilePreviewUrl() {
      mobilePreviewDraft.value = '';
      applyMobilePreviewUrl();
    }

    function reloadMobilePreview() {
      mobilePreviewFrameKey.value += 1;
    }

    function setMobileAppConfigEditorValue(value) {
      mobileAppConfigEditor.value = value;
    }

    function loadWordOfDayEntry(entry) {
      wordOfDayForm.title = entry.title || 'Word for Today';
      wordOfDayForm.passage = entry.passage || '';
      wordOfDayForm.verse = entry.verse || '';
      wordOfDayForm.reflection = entry.reflection || '';
      wordOfDayForm.messageDate = entry.messageDate || todayDateInputValue();
      wordOfDayForm.status = entry.status || 'published';
    }

    function buildCreatePayload() {
      const needsUrl = createForm.type === 'audio' || createForm.type === 'video';
      return {
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
      };
    }

    function resetCreateForm() {
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
      createForm.visibility = 'published';
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
      pendingVerificationEmail.value = '';
      managedItems.value = [];
      contentRequests.value = [];
      youtubePreviewItems.value = [];
      youtubeDraftItems.value = [];
      uploadPolicies.value = [];
      editContentOpen.value = false;
      editingContentId.value = null;
      mobileAppConfigEditor.value = '';
      mobileAppConfigMeta.value = null;
      mobileAppConfigValue.value = null;
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
      if (!hasSession.value) return;
      setSessionTransportState('none');
      clearSessionData();
      setNotice('You were signed out after 30 minutes of inactivity.', 'error');
    }

    function scheduleInactivityTimeout() {
      if (typeof window === 'undefined' || !hasSession.value) return;
      clearInactivityTimer();
      inactivityTimerId.value = window.setTimeout(handleInactivityTimeout, INACTIVITY_TIMEOUT_MS);
    }

    function onUserActivity() {
      if (!hasSession.value) return;
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
      if (!hasSession.value) {
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
          if (axios.isAxiosError(error) && error.response?.status === 401 && hasSession.value) {
            const requestUrl = String(error.config?.url || '');
            const isAuthEndpoint =
              requestUrl.includes('/v1/auth/login') ||
              requestUrl.includes('/v1/auth/register') ||
              requestUrl.includes('/v1/auth/email/verify') ||
              requestUrl.includes('/v1/auth/email/verify/request');
            const failedHeaderValue =
              error.config?.headers && typeof error.config.headers === 'object'
                ? String(error.config.headers.Authorization || error.config.headers.authorization || '')
                : '';
            const activeHeaderValue =
              sessionTransport.value === 'bearer' && accessToken.value ? `Bearer ${accessToken.value}` : '';
            const hadBearerHeader = failedHeaderValue.startsWith('Bearer ');
            const staleRequest =
              sessionTransport.value === 'bearer' &&
              Boolean(activeHeaderValue) &&
              (!hadBearerHeader || failedHeaderValue !== activeHeaderValue);

            if (!isAuthEndpoint && !staleRequest) {
              setSessionTransportState('none');
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

    async function fetchContentRequests(tokenOverride) {
      contentRequestLoading.value = true;
      try {
        const response = await http.get('/v1/content/requests', {
          headers: tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : undefined,
        });
        contentRequests.value = Array.isArray(response.data && response.data.items) ? response.data.items : [];
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to load submission requests.'), 'error');
      } finally {
        contentRequestLoading.value = false;
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
        mobileAppConfigValue.value = response.data.config || null;
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
        mobileAppConfigValue.value = response.data.config || null;
        setNotice('Mobile app config saved successfully.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to save mobile app config.'), 'error');
      } finally {
        appConfigSaving.value = false;
      }
    }

    function renderSectionSelector(value, onChange) {
      if (!mobileSectionCatalog.value.length) {
        return null;
      }

      return (
        <div class="section-selector">
          {mobileSectionCatalog.value.map((section) => {
            const selected = sectionSelectionMatches(value, section);
            return (
              <button
                key={`section-pill-${section.id}`}
                type="button"
                class={['section-selector-pill', selected ? 'is-active' : '']}
                onClick={() => onChange(toggleSectionSelection(value, section))}
              >
                <span>{section.title}</span>
                <small>{section.screens.join(' • ')}</small>
              </button>
            );
          })}
        </div>
      );
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
      reloadMobilePreview();
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
      const availableSections = mobileSectionCatalog.value
        .map((section) => `${section.title} (${section.id})`)
        .join('\n');
      const nextValue = window.prompt(
        `Assign app sections (comma-separated).\n\nAvailable sections:\n${availableSections || 'No mobile section catalog loaded yet.'}`,
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
      appLoading.value = true;
      clearNotice();
      try {
        if (accessToken.value) {
          applyToken(accessToken.value);
          sessionTransport.value = 'bearer';
        }
        await fetchCurrentUser();
        if (!accessToken.value) {
          setSessionTransportState('cookie');
        } else {
          syncSessionTracking();
        }
        await Promise.all([
          fetchManagedContent(),
          fetchContentRequests(),
          fetchUploadPolicies(),
          isAdmin.value ? fetchAdminOperationsDashboard() : Promise.resolve(),
          isAdmin.value ? fetchMobileAppConfig() : Promise.resolve(),
          isAdmin.value ? fetchWordOfDayDashboard() : Promise.resolve(),
          runEndpointChecks(),
        ]);
      } catch (error) {
        setSessionTransportState('none');
        currentUser.value = null;
        if (!(axios.isAxiosError(error) && error.response?.status === 401)) {
          setNotice(toErrorMessage(error, 'Your session expired. Please sign in again.'), 'error');
        }
      } finally {
        appLoading.value = false;
      }
    }

    async function handleAuthSubmit(event) {
      event.preventDefault();
      clearNotice();

      if (isVerifyMode.value) {
        const email = getPendingVerificationEmail();
        if (!email) {
          setNotice('Enter the email address used for account creation.', 'error');
          return;
        }
        if (!authForm.verificationCode.trim()) {
          setNotice('Enter the 6-digit verification code sent to your email.', 'error');
          return;
        }
        if (!(await ensureAuthInfrastructureReady())) {
          return;
        }

        authLoading.value = true;
        try {
          const authResponse = await http.post('/v1/auth/email/verify', {
            email,
            token: authForm.verificationCode.trim(),
          });

          await completeAuthenticatedSession(
            authResponse.data,
            `Welcome, ${authResponse.data.user.displayName}. Your email is verified and your account is ready.`,
          );
        } catch (error) {
          setNotice(toErrorMessage(error, 'Unable to verify this code right now.'), 'error');
        } finally {
          authLoading.value = false;
        }
        return;
      }

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
        if (authResponse.data?.requiresEmailVerification) {
          pendingVerificationEmail.value = String(authResponse.data?.pendingEmail || authForm.email || '').trim().toLowerCase();
          moveToVerificationStep(authResponse.data?.message);
          return;
        }

        await completeAuthenticatedSession(
          authResponse.data,
          isRegisterMode.value
            ? `Account created. Welcome, ${authResponse.data.user.displayName}.`
            : `Welcome back, ${authResponse.data.user.displayName}.`,
        );
      } catch (error) {
        if (
          !isRegisterMode.value &&
          axios.isAxiosError(error) &&
          error.response?.status === 403 &&
          String(error.response?.data?.message || '').toLowerCase().includes('not verified')
        ) {
          pendingVerificationEmail.value = String(authForm.email || '').trim().toLowerCase();
          moveToVerificationStep(error.response?.data?.message);
          return;
        }

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
      if (mode !== 'verify') {
        pendingVerificationEmail.value = '';
      }
      resetAuthSecrets();
    }

    async function resendVerificationCode() {
      const email = getPendingVerificationEmail();
      if (!email) {
        setNotice('Enter the email address used for account creation first.', 'error');
        return;
      }

      clearNotice();
      authLoading.value = true;
      try {
        await http.post('/v1/auth/email/verify/request', { email });
        setNotice(`A fresh verification code was sent to ${email}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to resend the verification code.'), 'error');
      } finally {
        authLoading.value = false;
      }
    }

    async function logout() {
      clearNotice();
      try {
        await http.post('/v1/auth/logout');
      } catch (error) {
        // Clear the local session state even if the remote sign-out call fails.
      } finally {
        setSessionTransportState('none');
        clearSessionData();
        setNotice('You have signed out.', 'success');
      }
    }

    async function createContent(event) {
      event.preventDefault();
      clearNotice();

      if (!currentUser.value) {
        setNotice('Please sign in to continue.', 'error');
        return;
      }
      if (createForm.title.trim().length < 2) {
        setNotice('Please enter a request title.', 'error');
        return;
      }
      if (createForm.description.trim().length < 2) {
        setNotice('Please add a short brief for the review team.', 'error');
        return;
      }

      const needsUrl = createForm.type === 'audio' || createForm.type === 'video';
      if (needsUrl && !createForm.url.trim()) {
        setNotice('Please add the media link for audio or video requests.', 'error');
        return;
      }
      if (needsUrl && !createForm.thumbnailUrl.trim()) {
        setNotice('Please upload or add a thumbnail image (max 5MB) for audio and video requests.', 'error');
        return;
      }

      savingContent.value = true;
      try {
        const payload = buildCreatePayload();
        const selectedVisibility = createForm.visibility;

        if (directPublishMode.value) {
          await http.post('/v1/content', {
            ...payload,
            visibility: selectedVisibility,
          });

          resetCreateForm();
          await Promise.all([
            fetchManagedContent(),
            fetchContentRequests(),
            fetchAdminOperationsDashboard(),
          ]);
          if (selectedVisibility === 'published') {
            reloadMobilePreview();
          }
          setNotice(
            selectedVisibility === 'published'
              ? 'Content published. It will flow into the mobile app feed on the next refresh.'
              : 'Draft content created. Review it in the library before publishing.',
            'success',
          );
          return;
        }

        await http.post('/v1/content/requests', {
          ...payload,
          requestedVisibility: createForm.visibility,
        });

        resetCreateForm();
        await Promise.all([fetchContentRequests(), fetchManagedContent()]);
        setNotice('Submission ticket created. The request is now in the review queue.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to submit this request right now.'), 'error');
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

        setNotice(`Uploaded ${file.name}. ${assetKind === 'thumbnail' ? 'Thumbnail' : 'Media asset'} is now linked to this submission ticket.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'File upload failed. Check storage configuration and try again.'), 'error');
      } finally {
        uploadingAsset.value = false;
        if (input) input.value = '';
      }
    }

    async function updateSubmissionRequestStatus(requestId, status) {
      contentRequestStatusUpdatingId.value = requestId;
      clearNotice();
      try {
        await http.patch(`/v1/content/requests/${requestId}/status`, { status });
        await fetchContentRequests();
        setNotice(`Request moved to ${humanizeToken(status)}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to update this request right now.'), 'error');
      } finally {
        contentRequestStatusUpdatingId.value = null;
      }
    }

    async function updateUserRole(userId, role) {
      userRoleUpdatingId.value = userId;
      clearNotice();
      try {
        await http.patch(`/v1/admin/users/${userId}/role`, { role });
        await fetchAdminOperationsDashboard();
        setNotice(`Role updated to ${humanizeToken(role)}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to update this user role right now.'), 'error');
      } finally {
        userRoleUpdatingId.value = null;
      }
    }

    async function createDraftFromRequest(request) {
      creatingDraftFromRequestId.value = request.id;
      clearNotice();
      try {
        await http.post(`/v1/content/requests/${request.id}/create-draft`);
        await Promise.all([fetchContentRequests(), fetchManagedContent()]);
        setNotice(`Draft created from "${request.title}". Review it in the content library before publishing.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to create a draft from this request.'), 'error');
      } finally {
        creatingDraftFromRequestId.value = null;
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
        reloadMobilePreview();
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
          fetchContentRequests(),
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
        <AuthScreen
          apiHostLabel={API_HOST_LABEL}
          brandLogoUrl={BRAND_LOGO_URL}
          publicHealthSummary={publicHealthSummary.value}
          databaseTargetLabel={databaseTargetLabel.value}
          publicHealth={publicHealth.value}
          isVerifyMode={isVerifyMode.value}
          isRegisterMode={isRegisterMode.value}
          authMode={authMode.value}
          authLoading={authLoading.value}
          notice={notice.value}
          noticeKind={noticeKind.value}
          publicHealthTone={publicHealthTone.value}
          googleLoginEnabled={googleLoginEnabled.value}
          authForm={authForm}
          pendingVerificationEmail={pendingVerificationEmail.value}
          onSwitchMode={switchAuthMode}
          onGoogleLogin={startGoogleLogin}
          onSubmit={handleAuthSubmit}
          onReadValue={readValue}
          onResendVerificationCode={resendVerificationCode}
        />
      );

      const workspaceActions = [
        {
          title: 'Submit new content',
          detail: 'Open the request desk to upload files, add links, and send one clean ticket for review.',
          actionLabel: 'Open request desk',
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
                    Start with the request desk, review every upload in one queue, and only create drafts when the team is ready to move forward.
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
              <span class="hero-chip">Request-led workflow</span>
              <span class="hero-chip">Cleaner review queue</span>
              <span class="hero-chip">Live mobile preview</span>
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
              Requests & Library
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
            <OverviewView
              workflowSteps={WORKFLOW_STEPS}
              apiHealthCheck={apiHealthCheck.value}
              requestStatusBoard={requestStatusBoard.value}
              contentRequestLoading={contentRequestLoading.value}
              requestQueuePreview={requestQueuePreview.value}
              isAdmin={isAdmin.value}
              contentRequestStatusUpdatingId={contentRequestStatusUpdatingId.value}
              contentRequestStatusOptions={CONTENT_REQUEST_STATUS_OPTIONS}
              creatingDraftFromRequestId={creatingDraftFromRequestId.value}
              adminOpsLoading={adminOpsLoading.value}
              audienceStats={audienceStats.value}
              adminOps={adminOps.value}
              managedItemsCount={managedItems.value.length}
              supportStatusUpdatingId={supportStatusUpdatingId.value}
              userRoleUpdatingId={userRoleUpdatingId.value}
              currentUserId={currentUser.value?.id || null}
              userRoleOptions={USER_ROLE_OPTIONS}
              recentItems={recentItems.value}
              onSetDashboardView={setDashboardView}
              onUpdateSubmissionRequestStatus={updateSubmissionRequestStatus}
              onCreateDraftFromRequest={createDraftFromRequest}
              onFetchAdminOperationsDashboard={fetchAdminOperationsDashboard}
              onUpdateSupportRequestStatus={updateSupportRequestStatus}
              onUpdateUserRole={updateUserRole}
              formatDateTime={formatDateTime}
              truncate={truncate}
              humanizeToken={humanizeToken}
            />
          ) : null}

          {dashboardView.value === 'mobile-preview' ? (
            <MobilePreviewView
              mobilePreviewUrl={mobilePreviewUrl.value}
              mobilePreviewFrameKey={mobilePreviewFrameKey.value}
              onReloadMobilePreview={reloadMobilePreview}
              onResetMobilePreviewUrl={resetMobilePreviewUrl}
              mobileSectionCatalog={mobileSectionCatalog.value}
              endpointChecks={endpointChecks.value}
              endpointChecksAt={endpointChecksAt.value}
              endpointChecksLoading={endpointChecksLoading.value}
              onRunEndpointChecks={runEndpointChecks}
              formatDateTime={formatDateTime}
            />
          ) : null}

          {dashboardView.value === 'editor' ? (
            <EditorView
              directPublishMode={directPublishMode.value}
              createForm={createForm}
              savingContent={savingContent.value}
              uploadingAsset={uploadingAsset.value}
              uploadPoliciesLoading={uploadPoliciesLoading.value}
              contentRequestLoading={contentRequestLoading.value}
              contentRequests={contentRequests.value}
              requestSummary={requestSummary.value}
              requestStatusBoard={requestStatusBoard.value}
              contentLoading={contentLoading.value}
              filteredItems={filteredItems.value}
              paginationTotal={pagination.total}
              youtubePreviewLoading={youtubePreviewLoading.value}
              youtubeSyncLoading={youtubeSyncLoading.value}
              youtubeImporting={youtubeImporting.value}
              youtubeDraftItems={youtubeDraftItems.value}
              selectedYouTubeDraftCount={selectedYouTubeDraftCount.value}
              isAdmin={isAdmin.value}
              appConfigLoading={appConfigLoading.value}
              appConfigSaving={appConfigSaving.value}
              mobileAppConfigEditor={mobileAppConfigEditor.value}
              mobileAppConfigMeta={mobileAppConfigMeta.value}
              mobileSectionCatalog={mobileSectionCatalog.value}
              wordOfDayLoading={wordOfDayLoading.value}
              wordOfDaySaving={wordOfDaySaving.value}
              wordOfDayForm={wordOfDayForm}
              wordOfDayCurrent={wordOfDayCurrent.value}
              wordOfDayHistory={wordOfDayHistory.value}
              filterState={filterState}
              youtubeSyncState={youtubeSyncState}
              contentRequestStatusUpdatingId={contentRequestStatusUpdatingId.value}
              creatingDraftFromRequestId={creatingDraftFromRequestId.value}
              togglingId={togglingId.value}
              deletingContentId={deletingContentId.value}
              onCreateContent={createContent}
              onReadValue={readValue}
              onHandleAssetUpload={handleAssetUpload}
              onGetUploadPolicy={getUploadPolicy}
              onResolveMediaAssetKind={resolveMediaAssetKind}
              onFormatBytes={formatBytes}
              onAcceptFromPolicy={acceptFromPolicy}
              onRenderSectionSelector={renderSectionSelector}
              onUpdateSubmissionRequestStatus={updateSubmissionRequestStatus}
              onCreateDraftFromRequest={createDraftFromRequest}
              onToggleVisibility={toggleVisibility}
              onOpenEditContentModal={openEditContentModal}
              onAssignContentSections={assignContentSections}
              onDeleteContentItem={deleteContentItem}
              onFetchYouTubePreview={fetchYouTubePreview}
              onApplySmartYouTubeAssignments={applySmartYouTubeAssignments}
              onImportSelectedYouTubeVideos={importSelectedYouTubeVideos}
              onSyncYouTubeVideos={syncYouTubeVideos}
              onUpdateYouTubeDraftItem={updateYouTubeDraftItem}
              onFetchMobileAppConfig={fetchMobileAppConfig}
              onSaveMobileAppConfig={saveMobileAppConfig}
              onFetchWordOfDayDashboard={fetchWordOfDayDashboard}
              onSaveWordOfDay={saveWordOfDay}
              onSetMobileAppConfigEditor={setMobileAppConfigEditorValue}
              onLoadWordOfDayEntry={loadWordOfDayEntry}
              formatDateTime={formatDateTime}
              truncate={truncate}
              parseCsvList={parseCsvList}
              readChecked={readChecked}
              contentTypes={CONTENT_TYPES}
              visibilityOptions={VISIBILITY_OPTIONS}
              contentRequestStatusOptions={CONTENT_REQUEST_STATUS_OPTIONS}
              youtubeSyncDefaultLimit={YOUTUBE_SYNC_DEFAULT_LIMIT}
              humanizeToken={humanizeToken}
            />
          ) : null}

          {editContentOpen.value ? (
            <EditContentModal
              editContentSaving={editContentSaving.value}
              editForm={editForm}
              contentTypes={CONTENT_TYPES}
              visibilityOptions={VISIBILITY_OPTIONS}
              onClose={closeEditContentModal}
              onSubmit={saveEditedContent}
              onReadValue={readValue}
              renderSectionSelector={renderSectionSelector}
            />
          ) : null}

        </section>
      );

      const shellContent = appLoading.value
        ? <BootScreen brandLogoUrl={BRAND_LOGO_URL} />
        : (currentUser.value ? dashboardScreen : loginScreen);

      return (
        <AdminShell
          brandLogoUrl={BRAND_LOGO_URL}
          currentUser={currentUser.value}
          headerMenuOpen={headerMenuOpen.value}
          onToggleHeaderMenu={toggleHeaderMenu}
          isCompactHeader={isCompactHeader.value}
          displayName={displayName.value}
          portalRoleLabel={portalRoleLabel.value}
          accountEmail={accountEmail.value}
          onRefreshDashboard={refreshDashboard}
          onFetchYouTubePreview={fetchYouTubePreview}
          onRunEndpointChecks={runEndpointChecks}
          onLogout={logout}
          dashboardView={dashboardView.value}
          onSetDashboardView={setDashboardView}
          appLoading={appLoading.value}
          currentYear={currentYear}
          apiHostLabel={API_HOST_LABEL}
          content={shellContent}
        />
      );
    };
  },
});
