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
    appLoading,
    content,
  } = props;

  return (
    <div class="app-root">
      <div class="bg-orb orb-a" />
      <div class="bg-orb orb-b" />
      <div class="bg-orb orb-c" />

      <header class="global-header">
        <div class="global-header-inner portal-header">
          <div class="brand-inline">
            <div class="logo-wrap">
              <img src={brandLogoUrl} alt="ClaudyGod" class="brand-logo" />
            </div>
            <div>
              <p class="eyebrow">ClaudyGod</p>
              <div class="brand-title-line">Content Portal</div>
            </div>
          </div>

          {currentUser ? (
            <div class="header-command-bar portal-header-bar">
              <nav class="portal-nav" aria-label="Portal navigation">
                <button
                  type="button"
                  class={['ghost-btn compact', dashboardView === 'editor' ? 'is-active' : '']}
                  onClick={() => onSetDashboardView('editor')}
                >
                  Content
                </button>
                <button
                  type="button"
                  class={['ghost-btn compact', dashboardView === 'mobile-preview' ? 'is-active' : '']}
                  onClick={() => onSetDashboardView('mobile-preview')}
                >
                  App Preview
                </button>
              </nav>

              <div class="user-pill">
                <span class="user-pill-dot" />
                <span>{displayName}</span>
                <span class="user-pill-role">{portalRoleLabel}</span>
              </div>

              <div class="header-inline-actions">
                <button type="button" class="ghost-btn compact" onClick={() => void onRefreshDashboard()}>
                  Refresh
                </button>
                <button type="button" class="danger-btn compact" onClick={() => void onLogout()}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main
        class={[
          'page-shell',
          appLoading ? 'page-shell-boot' : currentUser ? 'page-shell-dashboard' : 'page-shell-auth',
        ]}
      >
        {content}
      </main>
    </div>
  );
}
