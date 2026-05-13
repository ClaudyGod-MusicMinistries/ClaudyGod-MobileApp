import './AdminShell.css';

function initialsFrom(name, email) {
  const source = String(name || email || 'CG').trim();
  const parts = source.split(/\s+|@/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CG';
}

export default function AdminShell(props) {
  const {
    brandLogoUrl,
    currentUser,
    displayName,
    portalRoleLabel,
    onRefreshDashboard,
    onLogout,
    dashboardView,
    onSetDashboardView,
    navItems,
    appLoading,
    content,
  } = props;

  const safeNavItems = Array.isArray(navItems) ? navItems : [];
  const activeNavItem = safeNavItems.find((item) => item.id === dashboardView) || null;
  const activeTitle = activeNavItem?.workspaceTitle || activeNavItem?.label || 'ClaudyGod workspace';
  const activeCaption = activeNavItem?.caption || 'Manage content, mobile publishing, live sessions, and client operations.';

  if (!currentUser) {
    return (
      <div class="cg-auth-shell">
        {content}
      </div>
    );
  }

  return (
    <div class="cg-app-root">
      <aside class="cg-panel cg-sidebar" aria-label="ClaudyGod admin navigation">
        <div class="cg-brand-block">
          <div class="cg-logo-box">
            <img src={brandLogoUrl} alt="ClaudyGod" />
          </div>
          <div>
            <p class="cg-kicker">ClaudyGod</p>
            <h2 class="cg-title">Admin Studio</h2>
            <p class="cg-muted">Publish, correct, preview, and manage mobile content.</p>
          </div>
        </div>

        <div class="cg-user-card">
          <div class="cg-user-row">
            <div class="cg-avatar">{initialsFrom(displayName, currentUser?.email)}</div>
            <div style={{ minWidth: 0 }}>
              <div class="cg-user-name">{displayName}</div>
              <p class="cg-user-email">{currentUser?.email}</p>
            </div>
          </div>
          <span class="cg-role-pill">{portalRoleLabel}</span>
        </div>

        <nav class="cg-nav">
          {safeNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              class={['cg-nav-btn', dashboardView === item.id ? 'is-active' : '']}
              onClick={() => onSetDashboardView(item.id)}
            >
              <span class="cg-nav-label">{item.label}</span>
              <span class="cg-nav-copy">{item.caption}</span>
            </button>
          ))}
        </nav>

        <div class="cg-sidebar-actions">
          <button type="button" class="cg-secondary" onClick={() => void onRefreshDashboard()}>
            Refresh studio
          </button>
          <button type="button" class="cg-danger" onClick={() => void onLogout()}>
            Sign out
          </button>
        </div>
      </aside>

      <section class="cg-workspace">
        <header class="cg-panel cg-topbar">
          <div>
            <p class="cg-kicker">Workspace</p>
            <h1>{activeTitle}</h1>
            <p class="cg-muted" style={{ marginTop: '6px' }}>{activeCaption}</p>
          </div>
          <div class="cg-topbar-actions">
            {appLoading ? <span class="cg-chip is-info">Syncing</span> : <span class="cg-chip is-success">Ready</span>}
            <button type="button" class="cg-secondary compact" onClick={() => void onRefreshDashboard()}>
              Refresh
            </button>
            <button type="button" class="cg-danger compact" onClick={() => void onLogout()}>
              Sign out
            </button>
          </div>
        </header>

        <main class="cg-content-shell">
          {content}
        </main>
      </section>
    </div>
  );
}
