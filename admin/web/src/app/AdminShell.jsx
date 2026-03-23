export default function AdminShell(props) {
  const {
    brandLogoUrl,
    currentUser,
    headerMenuOpen,
    onToggleHeaderMenu,
    isCompactHeader,
    displayName,
    portalRoleLabel,
    accountEmail,
    onRefreshDashboard,
    onLogout,
    dashboardView,
    onSetDashboardView,
    appLoading,
    currentYear,
    content,
  } = props;

  return (
    <div class="app-root">
      <div class="bg-orb orb-a" />
      <div class="bg-orb orb-b" />
      <div class="bg-orb orb-c" />

      <header class="global-header">
        <div class="global-header-inner">
          <div class="brand-inline">
            <div class="logo-wrap">
              <img src={brandLogoUrl} alt="ClaudyGod" class="brand-logo" />
            </div>
            <div>
              <p class="eyebrow">ClaudyGod Ministries</p>
              <div class="brand-title-line">Client Content Studio</div>
            </div>
          </div>

          <div class="header-controls">
            {currentUser ? (
              <button
                type="button"
                class={['header-toggle-btn', 'header-nav-toggle', headerMenuOpen ? 'is-open' : '']}
                onClick={onToggleHeaderMenu}
                aria-expanded={headerMenuOpen ? 'true' : 'false'}
                aria-label={headerMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              >
                <span class="header-toggle-icon" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span>{headerMenuOpen ? 'Close Nav' : 'Navigation'}</span>
              </button>
            ) : null}

            {!isCompactHeader ? (
              <div class="header-command-bar">
                {currentUser ? (
                  <>
                    <div class="user-pill">
                      <span class="user-pill-dot" />
                      <span>{displayName}</span>
                      <span class="user-pill-role">{portalRoleLabel}</span>
                    </div>
                    {accountEmail ? <span class="muted-chip">{accountEmail}</span> : null}
                    <div class="header-inline-actions">
                      <button type="button" class="ghost-btn compact" onClick={() => void onRefreshDashboard()}>
                        Refresh
                      </button>
                      <button type="button" class="danger-btn compact" onClick={() => void onLogout()}>
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {currentUser ? (
          <div class={['header-drawer', headerMenuOpen ? 'is-open' : '']}>
            <div class="header-drawer-inner">
              <div class="header-drawer-nav">
                <button
                  type="button"
                  class={['drawer-nav-link', dashboardView === 'overview' ? 'is-active' : '']}
                  onClick={() => onSetDashboardView('overview')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  class={['drawer-nav-link', dashboardView === 'editor' ? 'is-active' : '']}
                  onClick={() => onSetDashboardView('editor')}
                >
                  Content Desk
                </button>
                <button
                  type="button"
                  class={['drawer-nav-link', dashboardView === 'mobile-preview' ? 'is-active' : '']}
                  onClick={() => onSetDashboardView('mobile-preview')}
                >
                  Preview App
                </button>
              </div>

              <div class="user-pill">
                <span class="user-pill-dot" />
                <span>{displayName}</span>
                <span class="user-pill-role">{portalRoleLabel}</span>
              </div>
              {accountEmail ? <span class="muted-chip">{accountEmail}</span> : null}

              <div class="header-drawer-actions">
                <button type="button" class="ghost-btn compact" onClick={() => void onRefreshDashboard()}>
                  Refresh
                </button>
                <button type="button" class="danger-btn compact" onClick={() => void onLogout()}>
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
          appLoading ? 'page-shell-boot' : currentUser ? 'page-shell-dashboard' : 'page-shell-auth',
        ]}
      >
        {content}
      </main>

      <footer class="global-footer">
        <div class="global-footer-inner global-footer-minimal">
          <span>© {currentYear} ClaudyGod Ministries</span>
          <span>Mobile publishing workspace</span>
        </div>
      </footer>
    </div>
  );
}
