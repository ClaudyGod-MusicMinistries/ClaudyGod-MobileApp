const toneClassMap = {
  success: 'is-success',
  warning: 'is-warning',
  info: 'is-info',
};

export default function OverviewView(props) {
  const {
    adminOpsLoading,
    summary,
    authFunnel,
    smartInsights,
    recentAuthActivity,
    requestStatusBoard,
    contentRequestLoading,
    requestQueuePreview,
    managedItemsCount,
    recentItems,
    onSetDashboardView,
    formatDateTime,
    truncate,
  } = props;

  const accessCards = [
    {
      label: 'Pending verification',
      value: authFunnel.pendingSignups ?? 0,
      hint: 'Accounts waiting on email verification',
    },
    {
      label: 'Active sessions',
      value: authFunnel.activeSessions ?? 0,
      hint: 'Signed-in devices with a valid session',
    },
    {
      label: 'Sign-ins · 7 days',
      value: authFunnel.loginSuccessLast7Days ?? 0,
      hint: 'Successful access in the last week',
    },
    {
      label: 'Failed sign-ins · 7 days',
      value: authFunnel.loginFailuresLast7Days ?? 0,
      hint: 'Users who hit sign-in friction recently',
    },
  ];

  const portalCards = [
    {
      label: 'Managed content',
      value: managedItemsCount,
      hint: 'Published and draft media tracked here',
    },
    {
      label: 'Verified users',
      value: summary.verifiedUsers ?? 0,
      hint: 'Accounts cleared for full access',
    },
    {
      label: 'New accounts · 7 days',
      value: summary.newUsersLast7Days ?? 0,
      hint: 'Recent growth across the product',
    },
    {
      label: 'Password resets · 30 days',
      value: authFunnel.passwordResetsLast30Days ?? 0,
      hint: 'Security recovery flow usage',
    },
  ];

  return (
    <section class="overview-grid portal-overview-grid">
      <article class="panel glass-panel portal-hero-panel reveal-up" style={{ animationDelay: '140ms' }}>
        <div class="portal-hero-head">
          <div>
            <p class="eyebrow">Portal overview</p>
            <h2>Content, access, and mobile delivery in one view.</h2>
            <p class="portal-hero-copy">
              Use this page to watch account health, upload momentum, and the signals that matter before you publish.
            </p>
          </div>
          <div class="portal-hero-actions">
            <button type="button" class="primary-btn" onClick={() => onSetDashboardView('editor')}>
              Open content
            </button>
            <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView('mobile-preview')}>
              Preview app
            </button>
          </div>
        </div>

        <section class="metric-grid">
          {portalCards.map((card) => (
            <article class="metric-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.hint}</p>
            </article>
          ))}
        </section>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '170ms' }}>
        <div class="section-head compact">
          <div>
            <h3>Access Health</h3>
            <p>Keep sign-in, verification, and recovery friction visible.</p>
          </div>
          <span class="section-badge">{adminOpsLoading ? 'Refreshing' : 'Live'}</span>
        </div>

        <section class="metric-grid compact-metric-grid">
          {accessCards.map((card) => (
            <article class="metric-card metric-card-quiet" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.hint}</p>
            </article>
          ))}
        </section>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '190ms' }}>
        <div class="section-head compact">
          <div>
            <h3>Signals</h3>
            <p>Only the alerts worth acting on right now.</p>
          </div>
        </div>

        <div class="signal-stack">
          {smartInsights.length === 0 ? (
            <div class="empty-state">No urgent signals right now.</div>
          ) : smartInsights.slice(0, 4).map((signal) => (
            <article class={['signal-card', toneClassMap[signal.tone] || 'is-info']} key={signal.id}>
              <strong>{signal.title}</strong>
              <p>{signal.detail}</p>
            </article>
          ))}
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '210ms' }}>
        <div class="section-head compact">
          <div>
            <h3>Recent Access Activity</h3>
            <p>The latest account events moving through the system.</p>
          </div>
        </div>

        <div class="activity-feed">
          {recentAuthActivity.length === 0 ? (
            <div class="empty-state">No account activity recorded yet.</div>
          ) : recentAuthActivity.slice(0, 6).map((item) => (
            <article class="activity-item" key={item.id}>
              <div class="activity-item-head">
                <strong>{item.user?.displayName || item.email || 'Unknown account'}</strong>
                <span class={['activity-status', item.status === 'failure' ? 'is-failure' : item.status === 'success' ? 'is-success' : 'is-info']}>
                  {item.label}
                </span>
              </div>
              <p>{item.email || item.user?.email || 'No email attached'}</p>
              <span class="muted-chip">{formatDateTime(item.createdAt)}</span>
            </article>
          ))}
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '230ms' }}>
        <div class="section-head compact">
          <div>
            <h3>Request Queue</h3>
            <p>The upload work that still needs attention.</p>
          </div>
          <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView('editor')}>
            Open queue
          </button>
        </div>

        <section class="metric-grid slim-metric-grid">
          {requestStatusBoard.map((item) => (
            <article class="metric-card metric-card-quiet" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <div class="activity-feed">
          {contentRequestLoading ? (
            <div class="empty-state">Loading upload requests...</div>
          ) : null}
          {!contentRequestLoading && requestQueuePreview.length === 0 ? (
            <div class="empty-state">No upload requests waiting right now.</div>
          ) : null}
          {!contentRequestLoading && requestQueuePreview.map((request) => (
            <article class="activity-item" key={`overview-request-${request.id}`}>
              <div class="activity-item-head">
                <strong>{request.title}</strong>
                <span class="activity-status is-info">{request.status.replace(/_/g, ' ')}</span>
              </div>
              <p>{truncate(request.description, 110)}</p>
              <span class="muted-chip">{formatDateTime(request.createdAt)}</span>
            </article>
          ))}
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '250ms' }}>
        <div class="section-head compact">
          <div>
            <h3>Latest Content</h3>
            <p>Most recent items already attached to the mobile experience.</p>
          </div>
          <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView('editor')}>
            Open library
          </button>
        </div>

        <div class="activity-feed">
          {recentItems.length === 0 ? (
            <div class="empty-state">No content has been uploaded yet.</div>
          ) : recentItems.map((item) => (
            <article class="activity-item" key={`overview-item-${item.id}`}>
              <div class="activity-item-head">
                <strong>{item.title}</strong>
                <span class={['activity-status', item.visibility === 'published' ? 'is-success' : 'is-info']}>
                  {item.visibility}
                </span>
              </div>
              <p>{truncate(item.description, 110)}</p>
              <span class="muted-chip">{formatDateTime(item.updatedAt)}</span>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
