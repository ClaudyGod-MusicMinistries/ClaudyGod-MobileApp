import axios from 'axios';
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const ACCESS_TOKEN_KEY = 'claudy_admin_access_token';
const BRAND_LOGO_URL = '/brand/claudy-logo.webp';
const CONTENT_TYPES = ['audio', 'video', 'playlist', 'announcement'];
const VISIBILITY_OPTIONS = ['draft', 'published'];
const YOUTUBE_SYNC_DEFAULT_LIMIT = 8;

const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

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

function greetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default defineComponent({
  name: 'ClaudyContentStudio',
  setup() {
    const accessToken = ref(localStorage.getItem(ACCESS_TOKEN_KEY) || '');
    const currentUser = ref(null);
    const authLoading = ref(false);
    const authMode = ref('login');
    const appLoading = ref(false);
    const contentLoading = ref(false);
    const savingContent = ref(false);
    const togglingId = ref(null);
    const youtubePreviewLoading = ref(false);
    const youtubeSyncLoading = ref(false);
    const appConfigLoading = ref(false);
    const appConfigSaving = ref(false);
    const notice = ref('');
    const noticeKind = ref('success');

    const authForm = reactive({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: '',
      registerAsAdmin: false,
      adminSignupCode: '',
    });

    const createForm = reactive({
      title: '',
      description: '',
      type: 'audio',
      url: '',
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
    });

    const managedItems = ref([]);
    const youtubePreviewItems = ref([]);
    const mobileAppConfigEditor = ref('');
    const mobileAppConfigMeta = ref(null);
    const currentYear = new Date().getFullYear();

    const greeting = computed(() => greetingByTime());
    const displayName = computed(() => (currentUser.value && currentUser.value.displayName ? currentUser.value.displayName : 'Client'));
    const isRegisterMode = computed(() => authMode.value === 'register');
    const isAdmin = computed(() => Boolean(currentUser.value && currentUser.value.role === 'ADMIN'));

    const stats = computed(() => {
      const total = managedItems.value.length;
      const published = managedItems.value.filter((item) => item.visibility === 'published').length;
      const drafts = managedItems.value.filter((item) => item.visibility === 'draft').length;
      const videoItems = managedItems.value.filter((item) => item.type === 'video').length;
      return [
        { label: 'All Content', value: total, accent: 'mint' },
        { label: 'Published', value: published, accent: 'blue' },
        { label: 'Drafts', value: drafts, accent: 'amber' },
        { label: 'Video Items', value: videoItems, accent: 'rose' },
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

    function setNotice(message, kind = 'success') {
      notice.value = message;
      noticeKind.value = kind;
    }

    function clearNotice() {
      notice.value = '';
    }

    function persistToken(token) {
      if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        accessToken.value = token;
        applyToken(token);
        return;
      }
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      accessToken.value = '';
      applyToken(null);
    }

    async function fetchCurrentUser() {
      const response = await http.get('/v1/auth/me');
      currentUser.value = response.data.user;
    }

    async function fetchManagedContent() {
      contentLoading.value = true;
      try {
        const response = await http.get('/v1/content/manage', {
          params: { page: pagination.page, limit: pagination.limit },
        });
        managedItems.value = response.data.items || [];
        pagination.total = response.data.total || 0;
      } finally {
        contentLoading.value = false;
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

    async function bootstrapSession() {
      if (!accessToken.value) return;
      appLoading.value = true;
      clearNotice();
      try {
        applyToken(accessToken.value);
        await fetchCurrentUser();
        await Promise.all([
          fetchManagedContent(),
          isAdmin.value ? fetchMobileAppConfig() : Promise.resolve(),
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
        if (!authForm.displayName.trim()) {
          setNotice('Please enter your display name.', 'error');
          return;
        }
        if (authForm.password !== authForm.confirmPassword) {
          setNotice('Passwords do not match.', 'error');
          return;
        }
      }

      authLoading.value = true;
      try {
        const endpoint = isRegisterMode.value ? '/v1/auth/register' : '/v1/auth/login';
        const payload = isRegisterMode.value
          ? {
              email: authForm.email.trim(),
              password: authForm.password,
              displayName: authForm.displayName.trim(),
              role: authForm.registerAsAdmin ? 'ADMIN' : 'CLIENT',
              adminSignupCode: authForm.adminSignupCode.trim() || undefined,
            }
          : {
              email: authForm.email.trim(),
              password: authForm.password,
            };

        const authResponse = await http.post(endpoint, payload);

        persistToken(authResponse.data.accessToken);
        currentUser.value = authResponse.data.user;
        authForm.password = '';
        authForm.confirmPassword = '';
        await Promise.all([
          fetchManagedContent(),
          authResponse.data.user && authResponse.data.user.role === 'ADMIN' ? fetchMobileAppConfig() : Promise.resolve(),
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
      clearNotice();
      authForm.password = '';
      authForm.confirmPassword = '';
      if (mode === 'login') {
        authForm.registerAsAdmin = false;
        authForm.adminSignupCode = '';
      }
    }

    function logout() {
      persistToken(null);
      currentUser.value = null;
      managedItems.value = [];
      youtubePreviewItems.value = [];
      mobileAppConfigEditor.value = '';
      mobileAppConfigMeta.value = null;
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

      savingContent.value = true;
      try {
        await http.post('/v1/content', {
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          type: createForm.type,
          url: createForm.url.trim() || undefined,
          visibility: createForm.visibility,
        });

        createForm.title = '';
        createForm.description = '';
        createForm.url = '';
        await fetchManagedContent();
        setNotice(createForm.visibility === 'published' ? 'Content published successfully.' : 'Draft saved successfully.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Unable to save this content right now.'), 'error');
      } finally {
        savingContent.value = false;
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
          isAdmin.value ? fetchMobileAppConfig() : Promise.resolve(),
        ]);
        setNotice('Dashboard refreshed.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Refresh failed. Please try again.'), 'error');
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
        });

        const summary = response.data && response.data.summary ? response.data.summary : { created: 0, updated: 0, skipped: 0 };
        youtubePreviewItems.value = response.data.items || youtubePreviewItems.value;
        await fetchManagedContent();
        setNotice(`YouTube sync complete. Created ${summary.created}, updated ${summary.updated}, skipped ${summary.skipped}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'YouTube sync failed. Please verify API key, channel ID, and backend settings.'), 'error');
      } finally {
        youtubeSyncLoading.value = false;
      }
    }

    onMounted(() => {
      void bootstrapSession();
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
                  A clean publishing workspace for your team to upload, organize, and publish new content.
                </p>
              </div>
            </div>

            <div class="feature-tiles">
              <article class="feature-tile" style={{ animationDelay: '40ms' }}>
                <span class="feature-dot" />
                <div>
                  <h3>Upload and Publish</h3>
                  <p>Create new content entries and control what goes live.</p>
                </div>
              </article>
              <article class="feature-tile" style={{ animationDelay: '120ms' }}>
                <span class="feature-dot" />
                <div>
                  <h3>Draft and Review</h3>
                  <p>Save work as drafts before publishing to your audience.</p>
                </div>
              </article>
              <article class="feature-tile" style={{ animationDelay: '200ms' }}>
                <span class="feature-dot" />
                <div>
                  <h3>Content Library</h3>
                  <p>Search and manage all uploaded music, videos, and announcements.</p>
                </div>
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
                    ? 'Create a client account for the publishing dashboard. Admin accounts require a signup code.'
                    : 'Enter your account details to access the publishing dashboard.'}
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

            <form class="stack-form" onSubmit={(event) => void handleAuthSubmit(event)}>
              {isRegisterMode.value ? (
                <label>
                  Display name
                  <input
                    value={authForm.displayName}
                    onInput={(event) => { authForm.displayName = readValue(event); }}
                    placeholder="ClaudyGod Team Member"
                    autoComplete="name"
                  />
                </label>
              ) : null}

              <label>
                Email address
                <input
                  type="email"
                  value={authForm.email}
                  onInput={(event) => { authForm.email = readValue(event); }}
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onInput={(event) => { authForm.password = readValue(event); }}
                  placeholder={isRegisterMode.value ? 'Create a strong password' : 'Enter your password'}
                  autoComplete={isRegisterMode.value ? 'new-password' : 'current-password'}
                />
              </label>

              {isRegisterMode.value ? (
                <label>
                  Confirm password
                  <input
                    type="password"
                    value={authForm.confirmPassword}
                    onInput={(event) => { authForm.confirmPassword = readValue(event); }}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </label>
              ) : null}

              {isRegisterMode.value ? (
                <div class="register-options">
                  <label class="checkbox-row">
                    <input
                      type="checkbox"
                      class="inline-checkbox"
                      checked={authForm.registerAsAdmin}
                      onChange={(event) => {
                        authForm.registerAsAdmin = readChecked(event);
                        if (!authForm.registerAsAdmin) authForm.adminSignupCode = '';
                      }}
                    />
                    <span>
                      Register as admin
                      <small>Requires the backend `ADMIN_SIGNUP_CODE`.</small>
                    </span>
                  </label>

                  {authForm.registerAsAdmin ? (
                    <label>
                      Admin signup code
                      <input
                        type="password"
                        value={authForm.adminSignupCode}
                        onInput={(event) => { authForm.adminSignupCode = readValue(event); }}
                        placeholder="Enter your admin signup code"
                        autoComplete="one-time-code"
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}

              <button type="submit" class="primary-btn primary-btn-large" disabled={authLoading.value}>
                {authLoading.value
                  ? (isRegisterMode.value ? 'Creating account...' : 'Signing in...')
                  : (isRegisterMode.value ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <p class="footnote-text">
              {isRegisterMode.value
                ? 'Create a client account directly here. To create an admin account, enable `ADMIN_SIGNUP_CODE` in the backend and enter the code above.'
                : 'Need access? You can sign up here for a client account or contact the platform administrator for admin access.'}
            </p>
          </div>
        </section>
      );

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
                  <p class="eyebrow">Publishing Workspace</p>
                  <h1>{greeting.value}, {displayName.value}</h1>
                  <p class="subtitle">
                    Manage your content library, save drafts, and publish new releases from one clean dashboard.
                  </p>
                </div>
              </div>

              <div class="hero-actions">
                <button type="button" class="ghost-btn" onClick={() => void refreshDashboard()} disabled={contentLoading.value}>
                  {contentLoading.value ? 'Refreshing...' : 'Refresh'}
                </button>
                <button type="button" class="ghost-btn" onClick={() => void fetchYouTubePreview()} disabled={youtubePreviewLoading.value}>
                  {youtubePreviewLoading.value ? 'Loading YouTube...' : 'Preview YouTube'}
                </button>
                <button type="button" class="danger-btn" onClick={logout}>Sign Out</button>
              </div>
            </div>

            <div class="hero-chips">
              <span class="hero-chip">Beautiful client-facing portal</span>
              <span class="hero-chip">Fast publishing workflow</span>
              <span class="hero-chip">Draft + publish controls</span>
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

                <div class="helper-card">
                  <strong>Tip</strong>
                  <p>
                    Use <em>Draft</em> while reviewing new content, then switch to <em>Published</em> when it is ready for users.
                  </p>
                </div>

                <section class="youtube-sync-block">
                  <div class="section-head compact">
                    <div>
                      <h3>YouTube Sync</h3>
                      <p>Fetch channel videos from the backend and import them into your content library.</p>
                    </div>
                    <span class="section-badge">Backend</span>
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

                  <div class="button-row">
                    <button type="button" class="ghost-btn compact" onClick={() => void fetchYouTubePreview()} disabled={youtubePreviewLoading.value || youtubeSyncLoading.value}>
                      {youtubePreviewLoading.value ? 'Fetching...' : 'Fetch Preview'}
                    </button>
                    <button type="button" class="primary-btn" onClick={() => void syncYouTubeVideos()} disabled={youtubeSyncLoading.value || youtubePreviewLoading.value}>
                      {youtubeSyncLoading.value ? 'Syncing YouTube...' : 'Sync to Library'}
                    </button>
                  </div>

                  <div class="youtube-preview-list">
                    {youtubePreviewItems.value.length === 0 ? (
                      <div class="empty-state">
                        No YouTube preview loaded yet. Use <strong>Fetch Preview</strong> after setting `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` in the backend `.env`.
                      </div>
                    ) : youtubePreviewItems.value.map((video) => (
                      <article class="content-card" key={video.youtubeVideoId}>
                        <div class="card-top">
                          <div class="pill-row">
                            <span class="pill pill-video">video</span>
                            {video.isLive ? <span class="pill pill-live">live</span> : null}
                          </div>
                          <span class="muted-chip">{video.duration || '--:--'}</span>
                        </div>
                        <div class="card-body">
                          <h3>{video.title}</h3>
                          <p>{truncate(video.description || '', 140)}</p>
                        </div>
                        <div class="card-link-row">
                          <a href={video.url} target="_blank" rel="noreferrer noopener" class="media-link">Open YouTube</a>
                          <span class="muted-chip">{formatDateTime(video.publishedAt)}</span>
                        </div>
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
                      </div>
                      <button
                        type="button"
                        class="ghost-btn compact"
                        onClick={() => void toggleVisibility(item)}
                        disabled={togglingId.value === item.id}
                      >
                        {togglingId.value === item.id ? 'Updating...' : item.visibility === 'published' ? 'Move to Draft' : 'Publish'}
                      </button>
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
            ) : null}
          </main>

          <section class="support-strip glass-panel reveal-up" style={{ animationDelay: '280ms' }}>
            <div>
              <h3>Need help?</h3>
              <p>For account access, branding updates, or storage setup changes, contact your platform administrator.</p>
            </div>
            <div class="support-mark">
              <div class="logo-wrap">
                <img src={BRAND_LOGO_URL} alt="ClaudyGod" class="brand-logo" />
              </div>
              <span>ClaudyGod Content Studio</span>
            </div>
          </section>
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
              <p>Preparing your workspace...</p>
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

              {currentUser.value ? (
                <div class="user-pill">
                  <span class="user-pill-dot" />
                  <span>{displayName.value}</span>
                </div>
              ) : (
                <div class="user-pill muted">
                  <span>Client Portal</span>
                </div>
              )}
            </div>
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
            <div class="global-footer-inner">
              <div>
                <strong>ClaudyGod Content Studio</strong>
                <p>Client content publishing portal</p>
              </div>
              <div class="footer-right">{currentYear} Claudy Platform</div>
            </div>
          </footer>
        </div>
      );
    };
  },
});
