import axios from 'axios';
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const ACCESS_TOKEN_KEY = 'claudy_admin_access_token';
const CONTENT_TYPES = ['audio', 'video', 'playlist', 'announcement'];
const VISIBILITY_OPTIONS = ['draft', 'published'];

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

function toErrorMessage(error, fallback) {
  if (axios.isAxiosError(error)) {
    const data = error.response && error.response.data ? error.response.data : {};
    return data.message || data.error || error.message || fallback;
  }
  if (error && error.message) {
    return error.message;
  }
  return fallback;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}

function truncate(value, size = 160) {
  if (!value) return '';
  if (value.length <= size) return value;
  return `${value.slice(0, size - 1)}...`;
}

export default defineComponent({
  name: 'AdminContentHub',
  setup() {
    const accessToken = ref(localStorage.getItem(ACCESS_TOKEN_KEY) || '');
    const currentUser = ref(null);
    const authMode = ref('login');
    const authLoading = ref(false);
    const appLoading = ref(false);
    const contentLoading = ref(false);
    const savingContent = ref(false);
    const togglingId = ref(null);
    const notice = ref('');
    const noticeKind = ref('success');
    const copied = ref('idle');

    const authForm = reactive({
      email: '',
      password: '',
      displayName: '',
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

    const managedItems = ref([]);

    const publicFeedUrl = computed(() => `${API_URL}/v1/content?page=1&limit=20`);
    const currentYear = new Date().getFullYear();

    const connectionMap = computed(() => [
      { title: 'Admin Console', value: 'Create, review, and publish client content records.' },
      { title: 'Content API', value: 'Validates, stores, and distributes content metadata.' },
      { title: 'Mobile App', value: 'Loads the published feed and updates the user catalog.' },
    ]);

    const filteredItems = computed(() => {
      const query = (filterState.search || '').trim().toLowerCase();
      return managedItems.value.filter((item) => {
        if (filterState.type !== 'all' && item.type !== filterState.type) return false;
        if (filterState.visibility !== 'all' && item.visibility !== filterState.visibility) return false;
        if (!query) return true;
        const haystack = [item.title, item.description, item.author?.displayName, item.url || '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    });

    const stats = computed(() => {
      const total = managedItems.value.length;
      const published = managedItems.value.filter((item) => item.visibility === 'published').length;
      const drafts = total - published;
      const videos = managedItems.value.filter((item) => item.type === 'video').length;
      return { total, published, drafts, videos };
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

    async function bootstrapSession() {
      if (!accessToken.value) return;
      appLoading.value = true;
      clearNotice();
      try {
        applyToken(accessToken.value);
        await Promise.all([fetchCurrentUser(), fetchManagedContent()]);
      } catch (error) {
        persistToken(null);
        currentUser.value = null;
        setNotice(toErrorMessage(error, 'Session expired. Please sign in again.'), 'error');
      } finally {
        appLoading.value = false;
      }
    }

    async function handleAuthSubmit(event) {
      event.preventDefault();
      clearNotice();

      if (!authForm.email.trim() || !authForm.password.trim()) {
        setNotice('Email and password are required.', 'error');
        return;
      }

      if (authMode.value === 'register' && authForm.displayName.trim().length < 2) {
        setNotice('Display name must be at least 2 characters.', 'error');
        return;
      }

      authLoading.value = true;
      try {
        if (authMode.value === 'register') {
          await http.post('/v1/auth/register', {
            email: authForm.email.trim(),
            password: authForm.password,
            displayName: authForm.displayName.trim(),
          });
        }

        const loginResponse = await http.post('/v1/auth/login', {
          email: authForm.email.trim(),
          password: authForm.password,
        });

        persistToken(loginResponse.data.accessToken);
        currentUser.value = loginResponse.data.user;
        authForm.password = '';
        await fetchManagedContent();
        setNotice(`Welcome ${loginResponse.data.user.displayName}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Authentication failed.'), 'error');
      } finally {
        authLoading.value = false;
      }
    }

    function logout() {
      persistToken(null);
      currentUser.value = null;
      managedItems.value = [];
      setNotice('Signed out.', 'success');
    }

    async function createContent(event) {
      event.preventDefault();
      clearNotice();

      if (!currentUser.value) {
        setNotice('Login required.', 'error');
        return;
      }
      if (createForm.title.trim().length < 2) {
        setNotice('Title must be at least 2 characters.', 'error');
        return;
      }
      if (createForm.description.trim().length < 2) {
        setNotice('Description must be at least 2 characters.', 'error');
        return;
      }

      const needsUrl = createForm.type === 'audio' || createForm.type === 'video';
      if (needsUrl && !createForm.url.trim()) {
        setNotice('Audio and video content requires a media URL (CDN/storage link).', 'error');
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
        setNotice('Content created and synced with backend queue.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Failed to create content item.'), 'error');
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
        setNotice(`Content moved to ${nextVisibility}.`, 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Failed to update visibility.'), 'error');
      } finally {
        togglingId.value = null;
      }
    }

    async function refreshDashboard() {
      if (!currentUser.value) return;
      clearNotice();
      try {
        await Promise.all([fetchCurrentUser(), fetchManagedContent()]);
        setNotice('Dashboard refreshed.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Refresh failed.'), 'error');
      }
    }

    async function copyPublicFeed() {
      try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(publicFeedUrl.value);
        copied.value = 'done';
      } catch {
        copied.value = 'failed';
      } finally {
        window.setTimeout(() => {
          copied.value = 'idle';
        }, 1500);
      }
    }

    onMounted(() => {
      void bootstrapSession();
    });

    return () => {
      const authScreen = (
        <div class="auth-shell">
          <div class="auth-card glass-panel">
            <div>
              <p class="eyebrow">Claudy Content Admin</p>
              <h1>Enterprise Publishing Console</h1>
              <p class="subtitle">Securely organize, publish, and control client content delivery through one backend-connected console.</p>
            </div>

            <div class="mode-toggle">
              <button type="button" class={['segmented-btn', authMode.value === 'login' && 'is-active']} onClick={() => { authMode.value = 'login'; clearNotice(); }}>
                Login
              </button>
              <button type="button" class={['segmented-btn', authMode.value === 'register' && 'is-active']} onClick={() => { authMode.value = 'register'; clearNotice(); }}>
                Register
              </button>
            </div>

            {notice.value ? <div class={['notice', noticeKind.value === 'error' ? 'notice-error' : 'notice-success']}>{notice.value}</div> : null}

            <form class="stack-form" onSubmit={(event) => void handleAuthSubmit(event)}>
              {authMode.value === 'register' ? (
                <label>
                  Display Name
                  <input value={authForm.displayName} onInput={(event) => { authForm.displayName = readValue(event); }} placeholder="Client Name or Admin Name" />
                </label>
              ) : null}

              <label>
                Email
                <input type="email" value={authForm.email} onInput={(event) => { authForm.email = readValue(event); }} placeholder="admin@yourdomain.com" />
              </label>

              <label>
                Password
                <input type="password" value={authForm.password} onInput={(event) => { authForm.password = readValue(event); }} placeholder="Password" />
              </label>

              <button type="submit" class="primary-btn" disabled={authLoading.value}>
                {authLoading.value ? 'Processing...' : authMode.value === 'login' ? 'Sign In' : 'Create Account & Sign In'}
              </button>
            </form>

            <div class="connection-grid">
              {connectionMap.value.map((entry) => (
                <div class="mini-card" key={entry.title}>
                  <h3>{entry.title}</h3>
                  <p>{entry.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      const dashboard = (
        <div class="dashboard-shell">
          <div class="bg-orb orb-left" />
          <div class="bg-orb orb-right" />

          <header class="dashboard-header">
            <div>
              <p class="eyebrow">Content Operations</p>
              <h1>Client Content Publishing</h1>
              <p class="subtitle">Create, review, and publish content records that power the client mobile experience.</p>
            </div>
            <div class="header-actions">
              <button type="button" class="ghost-btn" onClick={() => void refreshDashboard()} disabled={contentLoading.value}>
                {contentLoading.value ? 'Refreshing...' : 'Refresh'}
              </button>
              <button type="button" class="ghost-btn" onClick={() => void copyPublicFeed()}>
                {copied.value === 'done' ? 'Feed URL Copied' : copied.value === 'failed' ? 'Copy Failed' : 'Copy Feed Endpoint'}
              </button>
              <button type="button" class="danger-btn" onClick={logout}>Sign Out</button>
            </div>
          </header>

          <section class="stats-grid">
            <div class="stat-card glass-panel"><span>Total Records</span><strong>{stats.value.total}</strong></div>
            <div class="stat-card glass-panel"><span>Published</span><strong>{stats.value.published}</strong></div>
            <div class="stat-card glass-panel"><span>Drafts</span><strong>{stats.value.drafts}</strong></div>
            <div class="stat-card glass-panel"><span>Videos</span><strong>{stats.value.videos}</strong></div>
          </section>

          {notice.value ? <section class={['notice', noticeKind.value === 'error' ? 'notice-error' : 'notice-success']}>{notice.value}</section> : null}

          <main class="main-grid">
            <section class="panel glass-panel">
              <div class="section-head">
                <div>
                  <h2>Create Content</h2>
                  <p>Use your CDN or storage link and publish content metadata to the delivery service.</p>
                </div>
              </div>

              <form class="stack-form" onSubmit={(event) => void createContent(event)}>
                <label>
                  Title
                  <input value={createForm.title} onInput={(event) => { createForm.title = readValue(event); }} placeholder="Friday Night Worship Session" />
                </label>

                <label>
                  Description
                  <textarea value={createForm.description} onInput={(event) => { createForm.description = readValue(event); }} rows={5} placeholder="Add summary or ministry notes for mobile users." />
                </label>

                <div class="grid-2">
                  <label>
                    Content Type
                    <select value={createForm.type} onChange={(event) => { createForm.type = readValue(event); }}>
                      {CONTENT_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}
                    </select>
                  </label>

                  <label>
                    Visibility
                    <select value={createForm.visibility} onChange={(event) => { createForm.visibility = readValue(event); }}>
                      {VISIBILITY_OPTIONS.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}
                    </select>
                  </label>
                </div>

                <label>
                  Media URL (CDN / Cloud Storage)
                  <input value={createForm.url} onInput={(event) => { createForm.url = readValue(event); }} placeholder="https://cdn.yourdomain.com/media/worship-night.mp4" />
                </label>

                <div class="info-box">
                  <strong>Publishing workflow</strong>
                  <p>
                    Admin publishes content here -> API stores metadata and queues updates -> Client mobile app reads the published feed from{' '}
                    <code>{publicFeedUrl.value}</code>
                  </p>
                </div>

                <button type="submit" class="primary-btn" disabled={savingContent.value}>{savingContent.value ? 'Saving...' : 'Create & Sync'}</button>
              </form>
            </section>

            <section class="panel glass-panel">
              <div class="section-head split">
                <div>
                  <h2>Content Library</h2>
                  <p>Logged in as <strong>{currentUser.value ? currentUser.value.displayName : ''}</strong> ({currentUser.value ? currentUser.value.role : ''})</p>
                </div>
                <div class="feed-hint">Backend total: {pagination.total}</div>
              </div>

              <div class="filter-grid">
                <input value={filterState.search} onInput={(event) => { filterState.search = readValue(event); }} placeholder="Search title, description, author, or URL" />
                <select value={filterState.type} onChange={(event) => { filterState.type = readValue(event); }}>
                  <option value="all">All types</option>
                  {CONTENT_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}
                </select>
                <select value={filterState.visibility} onChange={(event) => { filterState.visibility = readValue(event); }}>
                  <option value="all">All visibility</option>
                  {VISIBILITY_OPTIONS.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}
                </select>
              </div>

              <div class="list-wrap">
                {contentLoading.value ? <div class="empty-state">Loading content...</div> : null}
                {!contentLoading.value && filteredItems.value.length === 0 ? <div class="empty-state">No content matches the current filters.</div> : null}

                {!contentLoading.value ? filteredItems.value.map((item, index) => (
                  <article class="content-card" key={item.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <div class="card-top">
                      <div class="pill-row">
                        <span class={['pill', `pill-${item.type}`]}>{item.type}</span>
                        <span class={['pill', item.visibility === 'published' ? 'pill-ok' : 'pill-warn']}>{item.visibility}</span>
                      </div>
                      <button type="button" class="ghost-btn compact" onClick={() => void toggleVisibility(item)} disabled={togglingId.value === item.id}>
                        {togglingId.value === item.id ? 'Updating...' : item.visibility === 'published' ? 'Move to Draft' : 'Publish'}
                      </button>
                    </div>

                    <h3>{item.title}</h3>
                    <p>{truncate(item.description, 190)}</p>

                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer noopener" class="media-link">{truncate(item.url, 90)}</a>
                    ) : (
                      <div class="muted-chip">No media URL attached</div>
                    )}

                    <div class="meta-grid">
                      <div>
                        <span class="meta-label">Author</span>
                        <strong>{item.author ? item.author.displayName : 'Unknown'}</strong>
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
          </main>
        </div>
      );

      const shellContent = appLoading.value ? <div class="boot-state">Restoring session...</div> : currentUser.value ? dashboard : authScreen;

      return (
        <div class="app-root">
          <header class="site-header">
            <div class="site-header-inner">
              <div>
                <p class="eyebrow">Claudy Content Platform</p>
                <h2 class="site-title">Admin Operations Console</h2>
              </div>
              <div class="site-header-meta">
                <span class="header-chip">Connected API</span>
                <code>{API_URL}</code>
              </div>
            </div>
          </header>

          <div class="site-content">{shellContent}</div>

          <footer class="site-footer">
            <div class="site-footer-inner">
              <div>
                <strong>Claudy Admin</strong>
                <p class="footer-text">Centralized content publishing and delivery management for client applications.</p>
              </div>
              <div class="footer-meta">
                <span>Public feed: <code>/v1/content</code></span>
                <span>{currentYear} Claudy Platform</span>
              </div>
            </div>
          </footer>
        </div>
      );
    };
  },
});
