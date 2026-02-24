import axios from 'axios';
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const ACCESS_TOKEN_KEY = 'claudy_admin_access_token';

type ContentType = 'audio' | 'video' | 'playlist' | 'announcement';
type ContentVisibility = 'draft' | 'published';
type AuthMode = 'login' | 'register';

interface SafeUser {
  id: string;
  email: string;
  displayName: string;
  role: 'CLIENT' | 'ADMIN';
  createdAt: string;
}

interface AuthResponse {
  accessToken: string;
  user: SafeUser;
}

interface ContentAuthor {
  id: string;
  displayName: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  url?: string;
  visibility: ContentVisibility;
  createdAt: string;
  updatedAt: string;
  author: ContentAuthor;
}

interface ContentListResponse {
  page: number;
  limit: number;
  total: number;
  items: ContentItem[];
}

const CONTENT_TYPES: ContentType[] = ['audio', 'video', 'playlist', 'announcement'];
const VISIBILITY_OPTIONS: ContentVisibility[] = ['draft', 'published'];

const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

function applyToken(token: string | null): void {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete http.defaults.headers.common.Authorization;
}

function readInputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: string; error?: string } | undefined;
    return payload?.message || payload?.error || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function truncate(value: string, size = 160): string {
  if (value.length <= size) {
    return value;
  }
  return `${value.slice(0, size - 1)}…`;
}

export default defineComponent({
  name: 'AdminContentHub',
  setup() {
    const accessToken = ref<string>(localStorage.getItem(ACCESS_TOKEN_KEY) || '');
    const currentUser = ref<SafeUser | null>(null);
    const authMode = ref<AuthMode>('login');
    const authLoading = ref(false);
    const appLoading = ref(false);
    const contentLoading = ref(false);
    const savingContent = ref(false);
    const togglingId = ref<string | null>(null);
    const notice = ref<string>('');
    const noticeKind = ref<'success' | 'error'>('success');
    const copied = ref<'idle' | 'done' | 'failed'>('idle');

    const authForm = reactive({
      email: '',
      password: '',
      displayName: '',
    });

    const createForm = reactive({
      title: '',
      description: '',
      type: 'audio' as ContentType,
      url: '',
      visibility: 'published' as ContentVisibility,
    });

    const filterState = reactive({
      search: '',
      type: 'all' as 'all' | ContentType,
      visibility: 'all' as 'all' | ContentVisibility,
    });

    const pagination = reactive({
      page: 1,
      limit: 50,
      total: 0,
    });

    const managedItems = ref<ContentItem[]>([]);

    const publicFeedUrl = computed(() => `${API_URL}/v1/content?page=1&limit=20`);
    const connectionMap = computed(() => [
      { title: 'Admin (Vue JSX)', value: 'Creates + manages content records' },
      { title: 'API (Express/Postgres/Redis)', value: 'Stores metadata + dispatches content events' },
      { title: 'Mobile (React Native)', value: 'Reads published feed from /v1/content' },
    ]);

    const filteredItems = computed(() => {
      const query = filterState.search.trim().toLowerCase();

      return managedItems.value.filter((item) => {
        if (filterState.type !== 'all' && item.type !== filterState.type) {
          return false;
        }

        if (filterState.visibility !== 'all' && item.visibility !== filterState.visibility) {
          return false;
        }

        if (!query) {
          return true;
        }

        const haystack = [item.title, item.description, item.author.displayName, item.url || '']
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

    function setNotice(message: string, kind: 'success' | 'error' = 'success'): void {
      notice.value = message;
      noticeKind.value = kind;
    }

    function clearNotice(): void {
      notice.value = '';
    }

    function persistToken(token: string | null): void {
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

    async function fetchCurrentUser(): Promise<void> {
      const response = await http.get<{ user: SafeUser }>('/v1/auth/me');
      currentUser.value = response.data.user;
    }

    async function fetchManagedContent(): Promise<void> {
      contentLoading.value = true;
      try {
        const response = await http.get<ContentListResponse>('/v1/content/manage', {
          params: { page: pagination.page, limit: pagination.limit },
        });
        managedItems.value = response.data.items;
        pagination.total = response.data.total;
      } finally {
        contentLoading.value = false;
      }
    }

    async function bootstrapSession(): Promise<void> {
      if (!accessToken.value) {
        return;
      }

      appLoading.value = true;
      clearNotice();
      try {
        applyToken(accessToken.value);
        await Promise.all([fetchCurrentUser(), fetchManagedContent()]);
      } catch (error) {
        persistToken(null);
        currentUser.value = null;
        setNotice(toErrorMessage(error, 'Session expired. Please login again.'), 'error');
      } finally {
        appLoading.value = false;
      }
    }

    async function handleAuthSubmit(event: Event): Promise<void> {
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
          setNotice('Account created. Logging in...', 'success');
        }

        const loginResponse = await http.post<AuthResponse>('/v1/auth/login', {
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

    function logout(): void {
      persistToken(null);
      currentUser.value = null;
      managedItems.value = [];
      setNotice('Signed out.', 'success');
    }

    async function createContent(event: Event): Promise<void> {
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
        setNotice('Audio and video items require a media URL (CDN/storage link).', 'error');
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
        setNotice('Content created and synchronized with the backend queue.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Failed to create content item.'), 'error');
      } finally {
        savingContent.value = false;
      }
    }

    async function toggleVisibility(item: ContentItem): Promise<void> {
      if (!currentUser.value) {
        return;
      }

      const nextVisibility: ContentVisibility = item.visibility === 'published' ? 'draft' : 'published';
      togglingId.value = item.id;
      clearNotice();
      try {
        const response = await http.patch<ContentItem>(`/v1/content/${item.id}/visibility`, {
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

    async function refreshDashboard(): Promise<void> {
      if (!currentUser.value) {
        return;
      }
      clearNotice();
      try {
        await Promise.all([fetchCurrentUser(), fetchManagedContent()]);
        setNotice('Dashboard refreshed.', 'success');
      } catch (error) {
        setNotice(toErrorMessage(error, 'Refresh failed.'), 'error');
      }
    }

    async function copyPublicFeed(): Promise<void> {
      try {
        if (!navigator.clipboard) {
          throw new Error('Clipboard API unavailable');
        }
        await navigator.clipboard.writeText(publicFeedUrl.value);
        copied.value = 'done';
      } catch {
        copied.value = 'failed';
      } finally {
        window.setTimeout(() => {
          copied.value = 'idle';
        }, 1400);
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
              <p class="subtitle">
                Manage what appears in the React Native mobile app through a secure backend workflow.
              </p>
            </div>

            <div class="mode-toggle">
              <button
                type="button"
                class={['segmented-btn', authMode.value === 'login' && 'is-active']}
                onClick={() => {
                  authMode.value = 'login';
                  clearNotice();
                }}
              >
                Login
              </button>
              <button
                type="button"
                class={['segmented-btn', authMode.value === 'register' && 'is-active']}
                onClick={() => {
                  authMode.value = 'register';
                  clearNotice();
                }}
              >
                Register
              </button>
            </div>

            {notice.value ? (
              <div class={['notice', noticeKind.value === 'error' ? 'notice-error' : 'notice-success']}>{notice.value}</div>
            ) : null}

            <form class="stack-form" onSubmit={(event) => void handleAuthSubmit(event)}>
              {authMode.value === 'register' ? (
                <label>
                  Display Name
                  <input
                    value={authForm.displayName}
                    onInput={(event) => {
                      authForm.displayName = readInputValue(event);
                    }}
                    placeholder="Client Name or Admin Name"
                  />
                </label>
              ) : null}

              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onInput={(event) => {
                    authForm.email = readInputValue(event);
                  }}
                  placeholder="admin@yourdomain.com"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onInput={(event) => {
                    authForm.password = readInputValue(event);
                  }}
                  placeholder="••••••••"
                />
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
              <p class="eyebrow">Content Delivery Control</p>
              <h1>Admin Publishing Hub</h1>
              <p class="subtitle">
                Publish metadata to the backend API. The mobile app reads published items from the public feed endpoint.
              </p>
            </div>
            <div class="header-actions">
              <button type="button" class="ghost-btn" onClick={() => void refreshDashboard()} disabled={contentLoading.value}>
                {contentLoading.value ? 'Refreshing...' : 'Refresh'}
              </button>
              <button type="button" class="ghost-btn" onClick={() => void copyPublicFeed()}>
                {copied.value === 'done' ? 'Feed URL Copied' : copied.value === 'failed' ? 'Copy Failed' : 'Copy Mobile Feed URL'}
              </button>
              <button type="button" class="danger-btn" onClick={logout}>
                Sign Out
              </button>
            </div>
          </header>

          <section class="stats-grid">
            <div class="stat-card glass-panel">
              <span>Total Records</span>
              <strong>{stats.value.total}</strong>
            </div>
            <div class="stat-card glass-panel">
              <span>Published</span>
              <strong>{stats.value.published}</strong>
            </div>
            <div class="stat-card glass-panel">
              <span>Drafts</span>
              <strong>{stats.value.drafts}</strong>
            </div>
            <div class="stat-card glass-panel">
              <span>Videos</span>
              <strong>{stats.value.videos}</strong>
            </div>
          </section>

          {notice.value ? (
            <section class={['notice', noticeKind.value === 'error' ? 'notice-error' : 'notice-success']}>{notice.value}</section>
          ) : null}

          <main class="main-grid">
            <section class="panel glass-panel">
              <div class="section-head">
                <div>
                  <h2>Create Content</h2>
                  <p>Use CDN/storage URLs for media. Publishing triggers backend queue events.</p>
                </div>
              </div>

              <form class="stack-form" onSubmit={(event) => void createContent(event)}>
                <label>
                  Title
                  <input
                    value={createForm.title}
                    onInput={(event) => {
                      createForm.title = readInputValue(event);
                    }}
                    placeholder="Friday Night Worship Session"
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={createForm.description}
                    onInput={(event) => {
                      createForm.description = readInputValue(event);
                    }}
                    rows={5}
                    placeholder="Add summary, context, schedule details, or ministry notes for mobile users."
                  />
                </label>

                <div class="grid-2">
                  <label>
                    Content Type
                    <select
                      value={createForm.type}
                      onChange={(event) => {
                        createForm.type = readInputValue(event) as ContentType;
                      }}
                    >
                      {CONTENT_TYPES.map((type) => (
                        <option value={type} key={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Visibility
                    <select
                      value={createForm.visibility}
                      onChange={(event) => {
                        createForm.visibility = readInputValue(event) as ContentVisibility;
                      }}
                    >
                      {VISIBILITY_OPTIONS.map((visibility) => (
                        <option value={visibility} key={visibility}>
                          {visibility}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  Media URL (CDN / Cloud Storage)
                  <input
                    value={createForm.url}
                    onInput={(event) => {
                      createForm.url = readInputValue(event);
                    }}
                    placeholder="https://cdn.yourdomain.com/media/worship-night.mp4"
                  />
                </label>

                <div class="info-box">
                  <strong>Mobile integration path</strong>
                  <p>
                    Admin creates/publishes content here -> API stores metadata + queues event -> React Native app reads published feed from
                    <code>{publicFeedUrl.value}</code>
                  </p>
                </div>

                <button type="submit" class="primary-btn" disabled={savingContent.value}>
                  {savingContent.value ? 'Saving...' : 'Create & Sync'}
                </button>
              </form>
            </section>

            <section class="panel glass-panel">
              <div class="section-head split">
                <div>
                  <h2>Managed Content</h2>
                  <p>
                    Logged in as <strong>{currentUser.value?.displayName}</strong> ({currentUser.value?.role})
                  </p>
                </div>
                <div class="feed-hint">Total in backend: {pagination.total}</div>
              </div>

              <div class="filter-grid">
                <input
                  value={filterState.search}
                  onInput={(event) => {
                    filterState.search = readInputValue(event);
                  }}
                  placeholder="Search title, description, author, or URL"
                />
                <select
                  value={filterState.type}
                  onChange={(event) => {
                    filterState.type = readInputValue(event) as 'all' | ContentType;
                  }}
                >
                  <option value="all">All types</option>
                  {CONTENT_TYPES.map((type) => (
                    <option value={type} key={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  value={filterState.visibility}
                  onChange={(event) => {
                    filterState.visibility = readInputValue(event) as 'all' | ContentVisibility;
                  }}
                >
                  <option value="all">All visibility</option>
                  {VISIBILITY_OPTIONS.map((visibility) => (
                    <option value={visibility} key={visibility}>
                      {visibility}
                    </option>
                  ))}
                </select>
              </div>

              <div class="list-wrap">
                {contentLoading.value ? <div class="empty-state">Loading content...</div> : null}

                {!contentLoading.value && filteredItems.value.length === 0 ? (
                  <div class="empty-state">No content matches the current filters.</div>
                ) : null}

                {!contentLoading.value
                  ? filteredItems.value.map((item, index) => (
                      <article class="content-card" key={item.id} style={{ animationDelay: `${index * 50}ms` }}>
                        <div class="card-top">
                          <div class="pill-row">
                            <span class={['pill', `pill-${item.type}`]}>{item.type}</span>
                            <span class={['pill', item.visibility === 'published' ? 'pill-ok' : 'pill-warn']}>
                              {item.visibility}
                            </span>
                          </div>
                          <button
                            type="button"
                            class="ghost-btn compact"
                            onClick={() => void toggleVisibility(item)}
                            disabled={togglingId.value === item.id}
                          >
                            {togglingId.value === item.id
                              ? 'Updating...'
                              : item.visibility === 'published'
                                ? 'Move to Draft'
                                : 'Publish'}
                          </button>
                        </div>

                        <h3>{item.title}</h3>
                        <p>{truncate(item.description, 190)}</p>

                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer noopener" class="media-link">
                            {truncate(item.url, 90)}
                          </a>
                        ) : (
                          <div class="muted-chip">No media URL attached</div>
                        )}

                        <div class="meta-grid">
                          <div>
                            <span class="meta-label">Author</span>
                            <strong>{item.author.displayName}</strong>
                          </div>
                          <div>
                            <span class="meta-label">Updated</span>
                            <strong>{formatDateTime(item.updatedAt)}</strong>
                          </div>
                        </div>
                      </article>
                    ))
                  : null}
              </div>
            </section>
          </main>
        </div>
      );

      return <div class="app-root">{appLoading.value ? <div class="boot-state">Restoring session...</div> : currentUser.value ? dashboard : authScreen}</div>;
    };
  },
});
