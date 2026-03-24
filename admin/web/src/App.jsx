import axios from 'axios';
import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import AdminShell from './app/AdminShell';
import {
  ADMIN_NAV_ITEMS,
  BRAND_LOGO_URL,
  CONTENT_REQUEST_STATUS_OPTIONS,
  CONTENT_TYPES,
  GOOGLE_LOGIN_URL,
  INACTIVITY_TIMEOUT_MS,
  MOBILE_PREVIEW_URL_KEY,
  VISIBILITY_OPTIONS,
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
import LiveView from './features/live/LiveView';
import MobileConfigView from './features/mobile-config/MobileConfigView';
import AdsAiView from './features/ads/AdsAiView';
import {
  acceptFromPolicy,
  describeHealthCheckDetail,
  formatBytes,
  formatDateTime,
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
import {
  cloneMobileConfig,
  createAdPlacement,
  createDiscoveryShortcut,
  createLayoutSection,
  createSettingsHubItem,
  createSettingsHubSection,
} from './shared/utils/mobileConfig';
import './App.css';

function applyToken(token) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete http.defaults.headers.common.Authorization;
}

export default defineComponent({
  name: 'ClaudyContentPortal',
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
    const sectionEditorItemId = ref('');
    const sectionEditorValue = ref('');
    const sectionEditorSaving = ref(false);
    const liveLoading = ref(false);
    const liveDetailLoading = ref(false);
    const liveSaving = ref(false);
    const liveTransitioningId = ref(null);
    const adsLoading = ref(false);
    const adCampaignSaving = ref(false);
    const adSuggestionLoading = ref(false);
    const headerMenuOpen = ref(false);
    const dashboardView = ref('editor');
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

    const liveSessions = ref([]);
    const adCampaigns = ref([]);
    const selectedLiveSessionId = ref('');
    const selectedLiveSession = ref(null);
    const selectedAdCampaignId = ref('');
    const liveForm = reactive({
      title: '',
      description: '',
      channelId: 'claudygod-live',
      coverImageUrl: '',
      streamUrl: '',
      playbackUrl: '',
      scheduledFor: '',
      notifySubscribers: true,
      viewerCount: 0,
      tagsCsv: '',
      appSectionsCsv: 'live-now',
    });
    const adCampaignForm = reactive({
      name: '',
      placement: 'home',
      status: 'draft',
      sponsorName: '',
      headline: '',
      body: '',
      ctaLabel: 'Open now',
      ctaUrl: '',
      imageUrl: '',
      audienceTagsCsv: '',
      dailyBudgetCents: 0,
      weight: 100,
      startsAt: '',
      endsAt: '',
      notes: '',
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
    const displayName = computed(() => (currentUser.value && currentUser.value.displayName ? currentUser.value.displayName : 'Publishing User'));
    const accountEmail = computed(() => (currentUser.value && currentUser.value.email ? currentUser.value.email : ''));
    const isRegisterMode = computed(() => authMode.value === 'register');
    const isVerifyMode = computed(() => authMode.value === 'verify');
    const isAdmin = computed(() => Boolean(currentUser.value && currentUser.value.role === 'ADMIN'));
    const hasSession = computed(() => sessionTransport.value !== 'none');
    const portalRoleLabel = computed(() => (isAdmin.value ? 'Admin' : 'Publisher'));
    const isCompactHeader = computed(() => viewportWidth.value <= 1024);
    const googleLoginEnabled = computed(() => Boolean(GOOGLE_LOGIN_URL));
    const portalNavItems = computed(() =>
      isAdmin.value
        ? ADMIN_NAV_ITEMS
        : ADMIN_NAV_ITEMS.filter((item) => item.id === 'editor' || item.id === 'mobile-preview'),
    );
    const publicHealthSummary = computed(() => {
      if (publicHealthLoading.value) return 'Preparing your portal';
      if (!publicHealth.value) return 'Checking access';
      if (publicHealth.value.status === 'ok') return 'Portal ready';
      if (publicHealth.value.services?.postgres === 'down') return 'Portal temporarily unavailable';
      if (publicHealth.value.status === 'offline') return 'Portal temporarily unavailable';
      return 'Checking access';
    });
    const mobileSectionCatalog = computed(() => normalizeSectionCatalog(mobileAppConfigValue.value));

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
    const liveSummary = computed(() => ({
      total: liveSessions.value.length,
      live: liveSessions.value.filter((item) => item.status === 'live').length,
      upcoming: liveSessions.value.filter((item) => item.status === 'scheduled').length,
      archive: liveSessions.value.filter((item) => item.status === 'ended').length,
      totalMessages: liveSessions.value.reduce((sum, item) => sum + Number(item.messageCount || 0), 0),
    }));

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
      dashboardView.value = 'editor';

      await Promise.all([
        fetchManagedContent(freshToken || undefined),
        fetchContentRequests(freshToken || undefined),
        fetchUploadPolicies(freshToken || undefined),
        user.role === 'ADMIN' ? fetchLiveSessions(freshToken || undefined) : Promise.resolve(),
        user.role === 'ADMIN' ? fetchAdCampaigns() : Promise.resolve(),
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
      dashboardView.value = ['live', 'editor', 'mobile-preview', 'mobile-config', 'ads-ai'].includes(view) ? view : 'editor';
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

    function syncMobileAppConfigState(configValue) {
      const next = cloneMobileConfig(configValue || {});
      mobileAppConfigValue.value = next;
      mobileAppConfigEditor.value = JSON.stringify(next, null, 2);
    }

    function ensureMobileAppConfigStructure(configValue) {
      const next = configValue && typeof configValue === 'object' ? configValue : {};
      if (!next.layout || typeof next.layout !== 'object') {
        next.layout = {};
      }
      ['homeSections', 'videoSections', 'playerSections', 'librarySections'].forEach((key) => {
        if (!Array.isArray(next.layout[key])) {
          next.layout[key] = [];
        }
      });

      if (!next.discovery || typeof next.discovery !== 'object') {
        next.discovery = {};
      }
      if (!Array.isArray(next.discovery.categories)) {
        next.discovery.categories = ['All'];
      }
      if (!Array.isArray(next.discovery.shortcuts)) {
        next.discovery.shortcuts = [];
      }

      if (!next.settingsHub || typeof next.settingsHub !== 'object') {
        next.settingsHub = {};
      }
      if (!Array.isArray(next.settingsHub.sections)) {
        next.settingsHub.sections = [];
      }

      if (!next.monetization || typeof next.monetization !== 'object') {
        next.monetization = {};
      }
      if (typeof next.monetization.adsEnabled !== 'boolean') {
        next.monetization.adsEnabled = true;
      }
      if (typeof next.monetization.disclosureLabel !== 'string') {
        next.monetization.disclosureLabel = 'Sponsored';
      }
      if (!Array.isArray(next.monetization.placements)) {
        next.monetization.placements = [];
      }

      if (!next.intelligence || typeof next.intelligence !== 'object') {
        next.intelligence = {};
      }
      if (typeof next.intelligence.assistantEnabled !== 'boolean') {
        next.intelligence.assistantEnabled = true;
      }
      if (typeof next.intelligence.adCopySuggestionsEnabled !== 'boolean') {
        next.intelligence.adCopySuggestionsEnabled = true;
      }
      if (typeof next.intelligence.providerLabel !== 'string') {
        next.intelligence.providerLabel = 'Integrated AI';
      }
      if (typeof next.intelligence.defaultTone !== 'string') {
        next.intelligence.defaultTone = 'Confident, concise, ministry-safe';
      }

      return next;
    }

    function mutateMobileAppConfig(mutator) {
      const next = ensureMobileAppConfigStructure(cloneMobileConfig(mobileAppConfigValue.value || {}));
      mutator(next);
      syncMobileAppConfigState(next);
    }

    function addMobileLayoutSection(group) {
      mutateMobileAppConfig((next) => {
        next.layout[group].push(createLayoutSection(group));
      });
    }

    function updateMobileLayoutSection(group, index, patch) {
      mutateMobileAppConfig((next) => {
        const target = next.layout[group] && next.layout[group][index];
        if (!target) return;
        Object.assign(target, patch);
      });
    }

    function toggleMobileLayoutSectionContentType(group, index, type) {
      mutateMobileAppConfig((next) => {
        const target = next.layout[group] && next.layout[group][index];
        if (!target) return;
        const current = Array.isArray(target.contentTypes) ? target.contentTypes : [];
        const hasType = current.includes(type);
        if (hasType && current.length > 1) {
          target.contentTypes = current.filter((entry) => entry !== type);
          return;
        }
        if (!hasType) {
          target.contentTypes = [...current, type];
        }
      });
    }

    function removeMobileLayoutSection(group, index) {
      mutateMobileAppConfig((next) => {
        next.layout[group].splice(index, 1);
      });
    }

    function toggleDiscoveryCategory(category) {
      mutateMobileAppConfig((next) => {
        const categories = Array.isArray(next.discovery.categories) ? next.discovery.categories : [];
        const hasCategory = categories.includes(category);
        if (hasCategory && categories.length > 1) {
          next.discovery.categories = categories.filter((entry) => entry !== category);
          return;
        }
        if (!hasCategory) {
          next.discovery.categories = [...categories, category];
        }
      });
    }

    function addDiscoveryShortcutItem() {
      mutateMobileAppConfig((next) => {
        next.discovery.shortcuts.push(createDiscoveryShortcut());
      });
    }

    function updateDiscoveryShortcutItem(index, patch) {
      mutateMobileAppConfig((next) => {
        const target = next.discovery.shortcuts[index];
        if (!target) return;
        Object.assign(target, patch);
      });
    }

    function removeDiscoveryShortcutItem(index) {
      mutateMobileAppConfig((next) => {
        next.discovery.shortcuts.splice(index, 1);
      });
    }

    function addSettingsHubGroup() {
      mutateMobileAppConfig((next) => {
        next.settingsHub.sections.push(createSettingsHubSection());
      });
    }

    function updateSettingsHubGroup(index, patch) {
      mutateMobileAppConfig((next) => {
        const target = next.settingsHub.sections[index];
        if (!target) return;
        Object.assign(target, patch);
      });
    }

    function removeSettingsHubGroup(index) {
      mutateMobileAppConfig((next) => {
        next.settingsHub.sections.splice(index, 1);
      });
    }

    function addSettingsHubGroupItem(sectionIndex) {
      mutateMobileAppConfig((next) => {
        const section = next.settingsHub.sections[sectionIndex];
        if (!section) return;
        if (!Array.isArray(section.items)) {
          section.items = [];
        }
        section.items.push(createSettingsHubItem());
      });
    }

    function updateSettingsHubGroupItem(sectionIndex, itemIndex, patch) {
      mutateMobileAppConfig((next) => {
        const item = next.settingsHub.sections[sectionIndex]?.items?.[itemIndex];
        if (!item) return;
        Object.assign(item, patch);
      });
    }

    function removeSettingsHubGroupItem(sectionIndex, itemIndex) {
      mutateMobileAppConfig((next) => {
        const section = next.settingsHub.sections[sectionIndex];
        if (!section || !Array.isArray(section.items)) return;
        section.items.splice(itemIndex, 1);
      });
    }

    function addAdPlacement() {
      mutateMobileAppConfig((next) => {
        next.monetization.placements.push(createAdPlacement());
      });
    }

    function updateAdPlacement(index, patch) {
      mutateMobileAppConfig((next) => {
        const target = next.monetization.placements[index];
        if (!target) return;
        Object.assign(target, patch);
      });
    }

    function removeAdPlacement(index) {
      mutateMobileAppConfig((next) => {
        next.monetization.placements.splice(index, 1);
      });
    }

    function updateMonetizationConfig(patch) {
      mutateMobileAppConfig((next) => {
        Object.assign(next.monetization, patch);
      });
    }

    function updateIntelligenceConfig(patch) {
      mutateMobileAppConfig((next) => {
        Object.assign(next.intelligence, patch);
      });
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

    function resetLiveForm() {
      liveForm.title = '';
      liveForm.description = '';
      liveForm.channelId = 'claudygod-live';
      liveForm.coverImageUrl = '';
      liveForm.streamUrl = '';
      liveForm.playbackUrl = '';
      liveForm.scheduledFor = '';
      liveForm.notifySubscribers = true;
      liveForm.viewerCount = 0;
      liveForm.tagsCsv = '';
      liveForm.appSectionsCsv = 'live-now';
    }

    function resetAdCampaignForm() {
      selectedAdCampaignId.value = '';
      adCampaignForm.name = '';
      adCampaignForm.placement = 'home';
      adCampaignForm.status = 'draft';
      adCampaignForm.sponsorName = '';
      adCampaignForm.headline = '';
      adCampaignForm.body = '';
      adCampaignForm.ctaLabel = 'Open now';
      adCampaignForm.ctaUrl = '';
      adCampaignForm.imageUrl = '';
      adCampaignForm.audienceTagsCsv = '';
      adCampaignForm.dailyBudgetCents = 0;
      adCampaignForm.weight = 100;
      adCampaignForm.startsAt = '';
      adCampaignForm.endsAt = '';
      adCampaignForm.notes = '';
    }

    function loadAdCampaignForm(campaign) {
      selectedAdCampaignId.value = campaign?.id || '';
      adCampaignForm.name = campaign?.name || '';
      adCampaignForm.placement = campaign?.placement || 'home';
      adCampaignForm.status = campaign?.status || 'draft';
      adCampaignForm.sponsorName = campaign?.sponsorName || '';
      adCampaignForm.headline = campaign?.headline || '';
      adCampaignForm.body = campaign?.body || '';
      adCampaignForm.ctaLabel = campaign?.ctaLabel || 'Open now';
      adCampaignForm.ctaUrl = campaign?.ctaUrl || '';
      adCampaignForm.imageUrl = campaign?.imageUrl || '';
      adCampaignForm.audienceTagsCsv = Array.isArray(campaign?.audienceTags) ? campaign.audienceTags.join(', ') : '';
      adCampaignForm.dailyBudgetCents = Number(campaign?.dailyBudgetCents || 0);
      adCampaignForm.weight = Number(campaign?.weight || 100);
      adCampaignForm.startsAt = campaign?.startsAt ? new Date(campaign.startsAt).toISOString().slice(0, 16) : '';
      adCampaignForm.endsAt = campaign?.endsAt ? new Date(campaign.endsAt).toISOString().slice(0, 16) : '';
      adCampaignForm.notes = typeof campaign?.metadata?.notes === 'string' ? campaign.metadata.notes : '';
    }

    function loadLiveForm(session) {
      liveForm.title = session?.title || '';
      liveForm.description = session?.description || '';
      liveForm.channelId = session?.channelId || 'claudygod-live';
      liveForm.coverImageUrl = session?.coverImageUrl || '';
      liveForm.streamUrl = session?.streamUrl || '';
      liveForm.playbackUrl = session?.playbackUrl || '';
      liveForm.scheduledFor = session?.scheduledFor
        ? new Date(session.scheduledFor).toISOString().slice(0, 16)
        : '';
      liveForm.notifySubscribers = session?.notifySubscribers !== false;
      liveForm.viewerCount = Number(session?.viewerCount || 0);
      liveForm.tagsCsv = Array.isArray(session?.tags) ? session.tags.join(', ') : '';
      liveForm.appSectionsCsv = Array.isArray(session?.appSections) && session.appSections.length
        ? session.appSections.join(', ')
        : 'live-now';
    }

    function selectAdCampaign(campaign) {
      loadAdCampaignForm(campaign);
      setDashboardView('ads-ai');
    }

    function prepareNewLiveSession() {
      selectedLiveSessionId.value = '';
      selectedLiveSession.value = null;
      resetLiveForm();
      setDashboardView('live');
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
      const response = await http.get('/v1/auth/session');
      currentUser.value = response.data && response.data.authenticated ? response.data.user : null;
      return currentUser.value;
    }

    function clearSessionData() {
      currentUser.value = null;
      pendingVerificationEmail.value = '';
      managedItems.value = [];
      contentRequests.value = [];
      youtubePreviewItems.value = [];
      youtubeDraftItems.value = [];
      uploadPolicies.value = [];
      liveSessions.value = [];
      adCampaigns.value = [];
      selectedLiveSession.value = null;
      selectedLiveSessionId.value = '';
      selectedAdCampaignId.value = '';
      resetLiveForm();
      resetAdCampaignForm();
      editContentOpen.value = false;
      editingContentId.value = null;
      sectionEditorItemId.value = '';
      sectionEditorValue.value = '';
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
      dashboardView.value = 'editor';
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

    async function fetchLiveSessions(tokenOverride) {
      if (!isAdmin.value) return;

      liveLoading.value = true;
      try {
        const response = await http.get('/v1/live/manage', {
          headers: tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : undefined,
        });
        liveSessions.value = Array.isArray(response.data?.items) ? response.data.items : [];

        const selectedId = selectedLiveSessionId.value;
        const nextSelected =
          (selectedId && liveSessions.value.find((item) => item.id === selectedId)) ||
          liveSessions.value[0] ||
          null;

        if (nextSelected) {
          await fetchLiveSessionDetail(nextSelected.id, tokenOverride);
        } else {
          selectedLiveSession.value = null;
          selectedLiveSessionId.value = '';
          resetLiveForm();
        }
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to load live sessions.'), 'error');
      } finally {
        liveLoading.value = false;
      }
    }

    async function fetchLiveSessionDetail(sessionId, tokenOverride) {
      if (!sessionId || !isAdmin.value) return;

      liveDetailLoading.value = true;
      try {
        const response = await http.get(`/v1/live/manage/${sessionId}`, {
          headers: tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : undefined,
        });
        selectedLiveSession.value = response.data || null;
        selectedLiveSessionId.value = response.data?.id || '';
        if (response.data) {
          loadLiveForm(response.data);
        }
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to load this live session.'), 'error');
      } finally {
        liveDetailLoading.value = false;
      }
    }

    async function fetchMobileAppConfig() {
      if (!isAdmin.value) return;
      appConfigLoading.value = true;
      try {
        const response = await http.get('/v1/admin/app-config');
        mobileAppConfigMeta.value = response.data.meta || null;
        syncMobileAppConfigState(response.data.config || {});
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to load the mobile experience.'), 'error');
      } finally {
        appConfigLoading.value = false;
      }
    }

    async function fetchAdCampaigns() {
      if (!isAdmin.value) return;
      adsLoading.value = true;
      try {
        const response = await http.get('/v1/admin/ads');
        adCampaigns.value = Array.isArray(response.data?.items) ? response.data.items : [];
        if (selectedAdCampaignId.value) {
          const active = adCampaigns.value.find((item) => item.id === selectedAdCampaignId.value);
          if (active) {
            loadAdCampaignForm(active);
          } else {
            resetAdCampaignForm();
          }
        }
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to load ad campaigns.'), 'error');
      } finally {
        adsLoading.value = false;
      }
    }

    async function saveMobileAppConfig() {
      if (!isAdmin.value) {
        setNotice('This action is only available to administrators.', 'error');
        return;
      }

      let parsedConfig;
      try {
        parsedConfig = cloneMobileConfig(mobileAppConfigValue.value || (mobileAppConfigEditor.value ? JSON.parse(mobileAppConfigEditor.value) : {}));
      } catch (error) {
        setNotice(`Invalid JSON: ${error && error.message ? error.message : 'Parse failed'}`, 'error');
        return;
      }

      appConfigSaving.value = true;
      clearNotice();
      try {
        const response = await http.put('/v1/admin/app-config', { config: parsedConfig });
        mobileAppConfigMeta.value = response.data.meta || null;
        syncMobileAppConfigState(response.data.config || {});
        reloadMobilePreview();
        setNotice('Mobile experience updated successfully.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to save your changes.'), 'error');
      } finally {
        appConfigSaving.value = false;
      }
    }

    function buildAdCampaignPayload() {
      return {
        name: adCampaignForm.name.trim(),
        placement: adCampaignForm.placement,
        status: adCampaignForm.status,
        sponsorName: adCampaignForm.sponsorName.trim(),
        headline: adCampaignForm.headline.trim(),
        body: adCampaignForm.body.trim(),
        ctaLabel: adCampaignForm.ctaLabel.trim(),
        ctaUrl: adCampaignForm.ctaUrl.trim(),
        imageUrl: adCampaignForm.imageUrl.trim() || undefined,
        audienceTags: parseCsvList(adCampaignForm.audienceTagsCsv),
        dailyBudgetCents: Number(adCampaignForm.dailyBudgetCents || 0),
        weight: Number(adCampaignForm.weight || 100),
        startsAt: adCampaignForm.startsAt ? new Date(adCampaignForm.startsAt).toISOString() : undefined,
        endsAt: adCampaignForm.endsAt ? new Date(adCampaignForm.endsAt).toISOString() : undefined,
        metadata: adCampaignForm.notes.trim() ? { notes: adCampaignForm.notes.trim() } : {},
      };
    }

    async function saveAdCampaign() {
      if (!isAdmin.value) {
        setNotice('Only administrators can manage campaigns.', 'error');
        return;
      }

      const payload = buildAdCampaignPayload();
      if (!payload.name || !payload.sponsorName || !payload.headline || !payload.body || !payload.ctaLabel || !payload.ctaUrl) {
        setNotice('Complete campaign name, sponsor, copy, and call-to-action before saving.', 'error');
        return;
      }

      const isEditing = Boolean(selectedAdCampaignId.value);
      adCampaignSaving.value = true;
      clearNotice();
      try {
        const response = isEditing
          ? await http.patch(`/v1/admin/ads/${selectedAdCampaignId.value}`, payload)
          : await http.post('/v1/admin/ads', payload);

        await fetchAdCampaigns();
        loadAdCampaignForm(response.data);
        reloadMobilePreview();
        setNotice(isEditing ? 'Campaign updated.' : 'Campaign created.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to save this campaign.'), 'error');
      } finally {
        adCampaignSaving.value = false;
      }
    }

    async function generateAdSuggestion() {
      if (!isAdmin.value) {
        setNotice('Only administrators can generate suggestions.', 'error');
        return;
      }

      if (!adCampaignForm.sponsorName.trim()) {
        setNotice('Enter the sponsor name before requesting AI copy.', 'error');
        return;
      }

      adSuggestionLoading.value = true;
      clearNotice();
      try {
        const response = await http.post('/v1/admin/ai/ad-copy', {
          sponsorName: adCampaignForm.sponsorName.trim(),
          placement: adCampaignForm.placement,
          objective: adCampaignForm.body.trim() || adCampaignForm.name.trim() || 'Promote a featured campaign on ClaudyGod.',
          audience: adCampaignForm.audienceTagsCsv.trim() || undefined,
          landingUrl: adCampaignForm.ctaUrl.trim() || undefined,
          tone: mobileAppConfigValue.value?.intelligence?.defaultTone || undefined,
          notes: adCampaignForm.notes.trim() || undefined,
        });

        const suggestion = response.data?.suggestion;
        if (!suggestion) {
          throw new Error('No suggestion returned.');
        }

        adCampaignForm.headline = suggestion.headline || adCampaignForm.headline;
        adCampaignForm.body = suggestion.body || adCampaignForm.body;
        adCampaignForm.ctaLabel = suggestion.ctaLabel || adCampaignForm.ctaLabel;
        adCampaignForm.audienceTagsCsv = Array.isArray(suggestion.audienceTags)
          ? suggestion.audienceTags.join(', ')
          : adCampaignForm.audienceTagsCsv;
        setNotice(`Copy suggestion ready from ${response.data?.meta?.provider || 'AI assistant'}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to generate ad copy right now.'), 'error');
      } finally {
        adSuggestionLoading.value = false;
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

    async function selectLiveSession(session) {
      if (!session?.id) return;
      selectedLiveSessionId.value = session.id;
      await fetchLiveSessionDetail(session.id);
    }

    async function saveLiveSession(event) {
      event.preventDefault();
      if (!isAdmin.value) {
        setNotice('Only admin accounts can manage live sessions.', 'error');
        return;
      }
      if (liveForm.title.trim().length < 3) {
        setNotice('Live session title must be at least 3 characters.', 'error');
        return;
      }
      if (liveForm.description.trim().length < 3) {
        setNotice('Add a short live session description.', 'error');
        return;
      }

      liveSaving.value = true;
      clearNotice();
      try {
        const isEditing = Boolean(selectedLiveSessionId.value);
        const payload = {
          title: liveForm.title.trim(),
          description: liveForm.description.trim(),
          channelId: liveForm.channelId.trim() || 'claudygod-live',
          coverImageUrl: liveForm.coverImageUrl.trim() || undefined,
          streamUrl: liveForm.streamUrl.trim() || undefined,
          playbackUrl: liveForm.playbackUrl.trim() || undefined,
          scheduledFor: liveForm.scheduledFor ? new Date(liveForm.scheduledFor).toISOString() : undefined,
          notifySubscribers: Boolean(liveForm.notifySubscribers),
          viewerCount: Number(liveForm.viewerCount || 0),
          tags: parseCsvList(liveForm.tagsCsv),
          appSections: parseCsvList(liveForm.appSectionsCsv),
        };

        const response = isEditing
          ? await http.patch(`/v1/live/manage/${selectedLiveSessionId.value}`, payload)
          : await http.post('/v1/live/manage', payload);

        await fetchLiveSessions();
        await fetchLiveSessionDetail(response.data.id);
        setNotice(isEditing ? 'Live session updated.' : 'Live session created.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to save this live session.'), 'error');
      } finally {
        liveSaving.value = false;
      }
    }

    async function startSelectedLiveSession(session) {
      if (!session?.id) return;
      liveTransitioningId.value = session.id;
      clearNotice();
      try {
        const response = await http.post(`/v1/live/manage/${session.id}/start`);
        await fetchLiveSessions();
        await fetchLiveSessionDetail(session.id);
        const notified = Number(response.data?.notifiedSubscribers || 0);
        const notifiedDevices = Number(response.data?.notifiedDevices || 0);
        setNotice(
          notified > 0 || notifiedDevices > 0
            ? `Live session started. Alerts were queued for ${notified} subscriber${notified === 1 ? '' : 's'} and delivered to ${notifiedDevices} device${notifiedDevices === 1 ? '' : 's'}.`
            : 'Live session started.',
          'success',
        );
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to start this live session.'), 'error');
      } finally {
        liveTransitioningId.value = null;
      }
    }

    async function endSelectedLiveSession(session) {
      if (!session?.id) return;
      liveTransitioningId.value = session.id;
      clearNotice();
      try {
        await http.post(`/v1/live/manage/${session.id}/end`, {
          playbackUrl:
            selectedLiveSessionId.value === session.id
              ? liveForm.playbackUrl.trim() || undefined
              : undefined,
          viewerCount:
            selectedLiveSessionId.value === session.id
              ? Number(liveForm.viewerCount || 0)
              : undefined,
        });
        await fetchLiveSessions();
        await fetchLiveSessionDetail(session.id);
        setNotice('Live session ended. Replay is now available in the live feed when a recording URL is provided.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to end this live session.'), 'error');
      } finally {
        liveTransitioningId.value = null;
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
      if (sectionEditorItemId.value === itemId) {
        sectionEditorValue.value = Array.isArray(response.data?.appSections) ? response.data.appSections.join(', ') : '';
      }
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

    function toggleContentSectionEditor(item) {
      if (sectionEditorItemId.value === item.id) {
        sectionEditorItemId.value = '';
        sectionEditorValue.value = '';
        return;
      }

      sectionEditorItemId.value = item.id;
      sectionEditorValue.value = Array.isArray(item.appSections) ? item.appSections.join(', ') : '';
    }

    function closeContentSectionEditor() {
      sectionEditorItemId.value = '';
      sectionEditorValue.value = '';
    }

    async function saveContentSections(item) {
      sectionEditorSaving.value = true;
      clearNotice();
      try {
        await updateContentItem(item.id, { appSections: parseCsvList(sectionEditorValue.value) });
        closeContentSectionEditor();
        setNotice('Content placement updated.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to update content placement.'), 'error');
      } finally {
        sectionEditorSaving.value = false;
      }
    }

    async function deleteContentItem(item) {
      if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;

      deletingContentId.value = item.id;
      clearNotice();
      try {
        await http.delete(`/v1/content/${item.id}`);
        managedItems.value = managedItems.value.filter((entry) => entry.id !== item.id);
        if (sectionEditorItemId.value === item.id) {
          closeContentSectionEditor();
        }
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
          error: toErrorMessage(error, 'The portal is temporarily unavailable.'),
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
        setNotice('The portal is temporarily unavailable. Please try again shortly.', 'error');
        return false;
      }

      if (health.services?.postgres === 'down') {
        setNotice('The portal is not ready right now. Please try again shortly.', 'error');
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
        const user = await fetchCurrentUser();
        if (!user) {
          setSessionTransportState('none');
          clearSessionData();
          return;
        }
        if (!accessToken.value) {
          setSessionTransportState('cookie');
        } else {
          syncSessionTracking();
        }
        await Promise.all([
          fetchManagedContent(),
          fetchContentRequests(),
          fetchUploadPolicies(),
          isAdmin.value ? fetchLiveSessions() : Promise.resolve(),
          isAdmin.value ? fetchAdCampaigns() : Promise.resolve(),
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
        setNotice(toErrorMessage(error, 'File upload failed. Please try again.'), 'error');
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
        const user = await fetchCurrentUser();
        if (!user) {
          setSessionTransportState('none');
          clearSessionData();
          return;
        }
        await Promise.all([
          fetchManagedContent(),
          fetchContentRequests(),
          fetchUploadPolicies(),
          isAdmin.value ? fetchLiveSessions() : Promise.resolve(),
          isAdmin.value ? fetchAdCampaigns() : Promise.resolve(),
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
        setNotice(toErrorMessage(error, 'Unable to load videos right now.'), 'error');
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
        setNotice(toErrorMessage(error, 'Video import could not be completed right now.'), 'error');
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
          brandLogoUrl={BRAND_LOGO_URL}
          publicHealthSummary={publicHealthSummary.value}
          isVerifyMode={isVerifyMode.value}
          isRegisterMode={isRegisterMode.value}
          authMode={authMode.value}
          authLoading={authLoading.value}
          notice={notice.value}
          noticeKind={noticeKind.value}
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

      const dashboardScreen = (
        <section class="dashboard-stage">
          {notice.value ? (
            <section class={['notice', noticeKind.value === 'error' ? 'notice-error' : 'notice-success', 'reveal-up']} style={{ animationDelay: '140ms' }}>
              {notice.value}
            </section>
          ) : null}

          {dashboardView.value === 'live' ? (
            <LiveView
              liveLoading={liveLoading.value}
              liveDetailLoading={liveDetailLoading.value}
              liveSaving={liveSaving.value}
              liveTransitioningId={liveTransitioningId.value}
              liveSummary={liveSummary.value}
              sessions={liveSessions.value}
              selectedSession={selectedLiveSession.value}
              liveForm={liveForm}
              onReadValue={readValue}
              onReadChecked={readChecked}
              onSaveLiveSession={saveLiveSession}
              onCreateNewSession={prepareNewLiveSession}
              onSelectLiveSession={selectLiveSession}
              onStartLiveSession={startSelectedLiveSession}
              onEndLiveSession={endSelectedLiveSession}
              onRenderSectionSelector={renderSectionSelector}
              humanizeToken={humanizeToken}
              formatDateTime={formatDateTime}
              truncate={truncate}
            />
          ) : null}

          {dashboardView.value === 'mobile-config' ? (
            <MobileConfigView
              mobileAppConfigValue={mobileAppConfigValue.value}
              mobileAppConfigMeta={mobileAppConfigMeta.value}
              appConfigLoading={appConfigLoading.value}
              appConfigSaving={appConfigSaving.value}
              onRefreshMobileConfig={fetchMobileAppConfig}
              onSaveMobileAppConfig={saveMobileAppConfig}
              onReadValue={readValue}
              onAddLayoutSection={addMobileLayoutSection}
              onUpdateLayoutSection={updateMobileLayoutSection}
              onToggleLayoutSectionContentType={toggleMobileLayoutSectionContentType}
              onRemoveLayoutSection={removeMobileLayoutSection}
              onToggleDiscoveryCategory={toggleDiscoveryCategory}
              onAddDiscoveryShortcut={addDiscoveryShortcutItem}
              onUpdateDiscoveryShortcut={updateDiscoveryShortcutItem}
              onRemoveDiscoveryShortcut={removeDiscoveryShortcutItem}
              onAddSettingsHubSection={addSettingsHubGroup}
              onUpdateSettingsHubSection={updateSettingsHubGroup}
              onRemoveSettingsHubSection={removeSettingsHubGroup}
              onAddSettingsHubItem={addSettingsHubGroupItem}
              onUpdateSettingsHubItem={updateSettingsHubGroupItem}
              onRemoveSettingsHubItem={removeSettingsHubGroupItem}
              onAddAdPlacement={addAdPlacement}
              onUpdateAdPlacement={updateAdPlacement}
              onRemoveAdPlacement={removeAdPlacement}
              onUpdateMonetization={updateMonetizationConfig}
              onUpdateIntelligence={updateIntelligenceConfig}
            />
          ) : null}

          {dashboardView.value === 'ads-ai' ? (
            <AdsAiView
              campaigns={adCampaigns.value}
              adsLoading={adsLoading.value}
              adCampaignSaving={adCampaignSaving.value}
              adSuggestionLoading={adSuggestionLoading.value}
              selectedAdCampaignId={selectedAdCampaignId.value}
              adCampaignForm={adCampaignForm}
              mobileAppConfigValue={mobileAppConfigValue.value}
              onReadValue={readValue}
              onSelectAdCampaign={selectAdCampaign}
              onResetAdCampaignForm={resetAdCampaignForm}
              onSaveAdCampaign={saveAdCampaign}
              onGenerateAdSuggestion={generateAdSuggestion}
              formatDateTime={formatDateTime}
            />
          ) : null}

          {dashboardView.value === 'mobile-preview' ? (
            <MobilePreviewView
              mobilePreviewUrl={mobilePreviewUrl.value}
              mobilePreviewFrameKey={mobilePreviewFrameKey.value}
              onReloadMobilePreview={reloadMobilePreview}
              onResetMobilePreviewUrl={resetMobilePreviewUrl}
              mobileSectionCatalog={mobileSectionCatalog.value}
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
              filterState={filterState}
              contentRequestStatusUpdatingId={contentRequestStatusUpdatingId.value}
              creatingDraftFromRequestId={creatingDraftFromRequestId.value}
              isAdmin={isAdmin.value}
              togglingId={togglingId.value}
              deletingContentId={deletingContentId.value}
              activeSectionEditorItemId={sectionEditorItemId.value}
              sectionEditorValue={sectionEditorValue.value}
              sectionEditorSaving={sectionEditorSaving.value}
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
              onToggleContentSectionEditor={toggleContentSectionEditor}
              onUpdateSectionEditorValue={(nextValue) => { sectionEditorValue.value = nextValue; }}
              onSaveContentSections={saveContentSections}
              onCloseContentSectionEditor={closeContentSectionEditor}
              onDeleteContentItem={deleteContentItem}
              formatDateTime={formatDateTime}
              truncate={truncate}
              contentTypes={CONTENT_TYPES}
              visibilityOptions={VISIBILITY_OPTIONS}
              contentRequestStatusOptions={CONTENT_REQUEST_STATUS_OPTIONS}
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
          onLogout={logout}
          dashboardView={dashboardView.value}
          onSetDashboardView={setDashboardView}
          navItems={portalNavItems.value}
          appLoading={appLoading.value}
          content={shellContent}
        />
      );
    };
  },
});
