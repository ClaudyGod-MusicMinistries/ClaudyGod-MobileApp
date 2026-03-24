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

  const activeTitle =
    dashboardView === 'live'
      ? 'Live Broadcast Portal'
      : dashboardView === 'mobile-config'
        ? 'Mobile Experience Portal'
      : dashboardView === 'mobile-preview'
        ? 'Mobile Experience Preview'
        : 'Content Publishing Portal';

  return (
    <div class="app-root">
      <div class="bg-orb orb-a" />
      <div class="bg-orb orb-b" />
      <div class="bg-orb orb-c" />

      {currentUser ? (
        <div class="portal-frame">
          <aside class="portal-sidebar">
            <div class="portal-sidebar-brand">
              <div class="logo-wrap logo-wrap-large">
                <img src={brandLogoUrl} alt="ClaudyGod" class="brand-logo" />
              </div>
              <div>
                <p class="eyebrow">ClaudyGod</p>
                <div class="brand-title-line">Creator Portal</div>
                <p class="portal-sidebar-copy">Upload, arrange, and release every update from one clean workspace.</p>
              </div>
            </div>

            <div class="portal-user-card">
              <div class="user-pill">
                <span class="user-pill-dot" />
                <span>{displayName}</span>
                <span class="user-pill-role">{portalRoleLabel}</span>
              </div>
              <p class="portal-user-email">{currentUser?.email}</p>
            </div>

            <nav class="portal-side-nav" aria-label="Portal navigation">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  class={['portal-side-link', dashboardView === item.id ? 'is-active' : '']}
                  onClick={() => onSetDashboardView(item.id)}
                >
                  <span class="portal-side-link-label">{item.label}</span>
                  <span class="portal-side-link-copy">{item.caption}</span>
                </button>
              ))}
            </nav>

            <div class="portal-sidebar-footer">
              <button type="button" class="ghost-btn compact portal-side-action" onClick={() => void onRefreshDashboard()}>
                Refresh Workspace
              </button>
              <button type="button" class="danger-btn compact portal-side-action" onClick={() => void onLogout()}>
                Sign Out
              </button>
            </div>
          </aside>

          <div class="portal-workspace">
            <header class="portal-topbar">
              <div>
                <p class="eyebrow">ClaudyGod workspace</p>
                <h1 class="portal-topbar-title">{activeTitle}</h1>
              </div>
              <div class="portal-topbar-actions">
                <button type="button" class="ghost-btn compact" onClick={() => void onRefreshDashboard()}>
                  Refresh
                </button>
                <button type="button" class="danger-btn compact" onClick={() => void onLogout()}>
                  Sign Out
                </button>
              </div>
            </header>

            <main
              class={[
                'page-shell',
                'page-shell-portal',
                appLoading ? 'page-shell-boot' : 'page-shell-dashboard',
              ]}
            >
              {content}
            </main>
          </div>
        </div>
      ) : (
        <>
          <header class="global-header">
            <div class="global-header-inner portal-header">
              <div class="brand-inline">
                <div class="logo-wrap">
                  <img src={brandLogoUrl} alt="ClaudyGod" class="brand-logo" />
                </div>
                <div>
                  <p class="eyebrow">ClaudyGod</p>
                  <div class="brand-title-line">Creator Portal</div>
                </div>
              </div>
            </div>
          </header>

          <main
            class={[
              'page-shell',
              appLoading ? 'page-shell-boot' : 'page-shell-auth',
            ]}
          >
            {content}
          </main>
        </>
      )}
    </div>
  );
}
