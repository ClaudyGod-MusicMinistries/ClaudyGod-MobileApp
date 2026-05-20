import '../../app/AdminShell.css';

function toneClass(tone) {
  if (tone === 'success') return 'is-success';
  if (tone === 'warning') return 'is-warning';
  return 'is-info';
}

export default function OverviewView(props) {
  const {
    adminOpsLoading,
    overview,
    summary,
    emailDelivery,
    supportInbox,
    recentAutomation,
    smartInsights,
    recentAuthActivity,
    onSetDashboardView,
    humanizeToken,
    formatDateTime,
    truncate,
  } = props;

  const hero = overview?.hero || {};
  const sections = overview?.sections || {};
  const portalCards = Array.isArray(overview?.portalCards) ? overview.portalCards : [];
  const accessCards = Array.isArray(overview?.accessCards) ? overview.accessCards : [];
  const requestStatusBoard = Array.isArray(overview?.requestStatusBoard) ? overview.requestStatusBoard : [];
  const requestQueuePreview = Array.isArray(overview?.requestQueuePreview) ? overview.requestQueuePreview : [];
  const latestContent = Array.isArray(overview?.latestContent) ? overview.latestContent : [];
  const supportTickets = Array.isArray(supportInbox) ? supportInbox : [];
  const automationActivity = Array.isArray(recentAutomation) ? recentAutomation : [];
  const insights = Array.isArray(smartInsights) ? smartInsights : [];
  const authActivity = Array.isArray(recentAuthActivity) ? recentAuthActivity : [];
  const primaryAction = hero?.primaryAction || null;
  const secondaryAction = hero?.secondaryAction || null;
  const delivery = emailDelivery || {};
  const totals = summary || {};

  return (
    <section class="cg-page">
      <article class="cg-panel cg-hero cg-dashboard-hero">
        <div class="cg-section-head">
          <div>
            <p class="cg-kicker">{hero?.eyebrow || 'Dashboard'}</p>
            <h2 class="cg-page-title">{hero?.title || 'Admin command center'}</h2>
            <p class="cg-hero-copy">
              {hero?.description || 'Review the health of content, requests, access activity, and publishing readiness from one clear workspace.'}
            </p>
          </div>
          <div class="cg-button-row">
            {primaryAction?.label && primaryAction?.view ? (
              <button type="button" class="cg-primary" onClick={() => onSetDashboardView(primaryAction.view)}>
                {primaryAction.label}
              </button>
            ) : null}
            {secondaryAction?.label && secondaryAction?.view ? (
              <button type="button" class="cg-secondary" onClick={() => onSetDashboardView(secondaryAction.view)}>
                {secondaryAction.label}
              </button>
            ) : null}
          </div>
        </div>

        <div class="cg-grid-4" style={{ marginTop: '18px' }}>
          {portalCards.map((card) => (
            <article class="cg-stat-card" key={card.id || card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.hint}</p>
            </article>
          ))}
          {!portalCards.length && adminOpsLoading ? <div class="cg-empty cg-full">Preparing your dashboard...</div> : null}
        </div>
      </article>

      <section class="cg-ops-strip">
        <article class="cg-ops-card">
          <span>Email notifications</span>
          <strong>{delivery.failedLast24Hours ? 'Needs review' : 'Healthy'}</strong>
          <p>
            {delivery.pendingJobs || 0} pending, {delivery.completedLast24Hours || 0} delivered in 24h
          </p>
        </article>
        <article class="cg-ops-card">
          <span>Support tickets</span>
          <strong>{totals.openSupportRequests || 0}</strong>
          <p>{totals.activePrivacyRequests || 0} privacy request(s) active</p>
        </article>
        <article class="cg-ops-card">
          <span>Publishing records</span>
          <strong>{requestQueuePreview.length}</strong>
          <p>Submissions pending review and approval</p>
        </article>
        <article class="cg-ops-card">
          <span>Audit trail</span>
          <strong>{automationActivity.length || authActivity.length}</strong>
          <p>Recent automation and authenticated account events</p>
        </article>
      </section>

      <section class="cg-dashboard-board">
        <article class="cg-panel cg-card">
          <div class="cg-section-head">
            <div>
              <h2>{sections?.accessHealth?.title || 'Access health'}</h2>
              <p class="cg-muted">{sections?.accessHealth?.description || 'Monitor account access and admin activity.'}</p>
            </div>
            <span class="cg-chip is-success">
              {adminOpsLoading ? sections?.accessHealth?.badgeRefreshingLabel || 'Refreshing' : sections?.accessHealth?.badgeLiveLabel || 'Live'}
            </span>
          </div>

          <div class="cg-grid-2">
            {accessCards.map((card) => (
              <article class="cg-mini-card" key={card.id || card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.hint}</p>
              </article>
            ))}
          </div>
          {!accessCards.length ? <div class="cg-empty">No access metrics are available yet.</div> : null}
        </article>

        <article class="cg-panel cg-card">
          <div class="cg-section-head">
            <div>
              <h2>{sections?.signals?.title || 'Smart signals'}</h2>
              <p class="cg-muted">{sections?.signals?.description || 'Key notices that need attention.'}</p>
            </div>
          </div>

          <div class="cg-list">
            {insights.slice(0, 4).map((signal) => (
              <article class="cg-item" key={signal.id}>
                <div class="cg-item-head">
                  <h3>{signal.title}</h3>
                  <span class={['cg-status', toneClass(signal.tone)]}>{signal.tone || 'info'}</span>
                </div>
                <p>{signal.detail}</p>
              </article>
            ))}
            {!insights.length ? <div class="cg-empty">{sections?.signals?.emptyState || 'No critical signals right now.'}</div> : null}
          </div>
        </article>
      </section>

      <section class="cg-dashboard-board">
        <article class="cg-panel cg-card">
          <div class="cg-section-head">
            <div>
              <h2>{sections?.requestQueue?.title || 'Publishing requests'}</h2>
              <p class="cg-muted">{sections?.requestQueue?.description || 'Review submitted content requests before they become drafts.'}</p>
            </div>
            <button type="button" class="cg-secondary compact" onClick={() => onSetDashboardView('editor')}>
              {sections?.requestQueue?.actionLabel || 'Open publishing'}
            </button>
          </div>

          <div class="cg-grid-3" style={{ marginBottom: '14px' }}>
            {requestStatusBoard.map((item) => (
              <article class="cg-mini-card" key={item.id || item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <div class="cg-list">
            {adminOpsLoading ? <div class="cg-empty">{sections?.requestQueue?.loadingMessage || 'Loading requests...'}</div> : null}
            {!adminOpsLoading && requestQueuePreview.map((request) => (
              <article class="cg-item" key={`overview-request-${request.id}`}>
                <div class="cg-item-head">
                  <h3>{request.title}</h3>
                  <span class="cg-status is-info">{humanizeToken(request.status)}</span>
                </div>
                <p>{truncate(request.description, 120)}</p>
                <div class="cg-chip-row" style={{ marginTop: '10px' }}>
                  <span class="cg-chip">{formatDateTime(request.createdAt)}</span>
                </div>
              </article>
            ))}
            {!adminOpsLoading && !requestQueuePreview.length ? (
              <div class="cg-empty">{sections?.requestQueue?.emptyState || 'No pending requests.'}</div>
            ) : null}
          </div>
        </article>

        <article class="cg-panel cg-card">
          <div class="cg-section-head">
            <div>
              <h2>{sections?.latestContent?.title || 'Latest content'}</h2>
              <p class="cg-muted">{sections?.latestContent?.description || 'Recently updated content in the library.'}</p>
            </div>
            <button type="button" class="cg-secondary compact" onClick={() => onSetDashboardView('editor')}>
              {sections?.latestContent?.actionLabel || 'Open library'}
            </button>
          </div>

          <div class="cg-list">
            {latestContent.map((item) => (
              <article class="cg-item" key={`overview-item-${item.id}`}>
                <div class="cg-item-head">
                  <h3>{item.title}</h3>
                  <span class={['cg-status', item.visibility === 'published' ? 'is-success' : 'is-info']}>
                    {item.visibility}
                  </span>
                </div>
                <p>{truncate(item.description, 120)}</p>
                <div class="cg-chip-row" style={{ marginTop: '10px' }}>
                  <span class="cg-chip">{formatDateTime(item.updatedAt)}</span>
                </div>
              </article>
            ))}
            {!latestContent.length ? <div class="cg-empty">{sections?.latestContent?.emptyState || 'No content updates yet.'}</div> : null}
          </div>
        </article>
      </section>

      <section class="cg-dashboard-board">
        <article class="cg-panel cg-card">
          <div class="cg-section-head">
            <div>
              <h2>Notification Delivery</h2>
              <p class="cg-muted">Email jobs created by account, publishing, and operational workflows.</p>
            </div>
            <span class={['cg-chip', delivery.failedLast24Hours ? 'is-warning' : 'is-success']}>
              {delivery.providerLabel || delivery.provider || 'Email'}
            </span>
          </div>

          <div class="cg-grid-3" style={{ marginBottom: '14px' }}>
            <article class="cg-mini-card">
              <span>Pending</span>
              <strong>{delivery.pendingJobs || 0}</strong>
            </article>
            <article class="cg-mini-card">
              <span>Delivered 24h</span>
              <strong>{delivery.completedLast24Hours || 0}</strong>
            </article>
            <article class="cg-mini-card">
              <span>Failed 24h</span>
              <strong>{delivery.failedLast24Hours || 0}</strong>
            </article>
          </div>

          <div class="cg-list">
            {(delivery.recentJobs || []).slice(0, 4).map((job) => (
              <article class="cg-item" key={`email-job-${job.id}`}>
                <div class="cg-item-head">
                  <h3>{job.label || humanizeToken(job.templateKey || job.jobType || 'Email notification')}</h3>
                  <span class={['cg-status', job.status === 'failed' ? 'is-danger' : job.status === 'completed' ? 'is-success' : 'is-info']}>
                    {humanizeToken(job.status)}
                  </span>
                </div>
                <p>{(job.recipients || []).join(', ') || 'Private recipient'}</p>
                <div class="cg-chip-row" style={{ marginTop: '10px' }}>
                  <span class="cg-chip">{formatDateTime(job.createdAt)}</span>
                </div>
              </article>
            ))}
            {!(delivery.recentJobs || []).length ? <div class="cg-empty">No email jobs have been recorded yet.</div> : null}
          </div>
        </article>

        <article class="cg-panel cg-card">
          <div class="cg-section-head">
            <div>
              <h2>Support And Request Tickets</h2>
              <p class="cg-muted">User-facing tickets and publishing requests that require accountable follow-up.</p>
            </div>
          </div>

          <div class="cg-list">
            {supportTickets.slice(0, 5).map((ticket) => (
              <article class="cg-item" key={`support-ticket-${ticket.id}`}>
                <div class="cg-item-head">
                  <h3>{ticket.subject}</h3>
                  <span class={['cg-status', ticket.status === 'resolved' ? 'is-success' : ticket.priority === 'high' ? 'is-warning' : 'is-info']}>
                    {humanizeToken(ticket.status)}
                  </span>
                </div>
                <p>{truncate(ticket.message, 120)}</p>
                <div class="cg-chip-row" style={{ marginTop: '10px' }}>
                  <span class="cg-chip">{humanizeToken(ticket.category)}</span>
                  <span class="cg-chip">{ticket.user?.email || 'Anonymous'}</span>
                </div>
              </article>
            ))}
            {!supportTickets.length ? <div class="cg-empty">No support tickets are currently open.</div> : null}
          </div>
        </article>
      </section>

      <article class="cg-panel cg-card">
        <div class="cg-section-head">
          <div>
            <h2>{sections?.recentAccessActivity?.title || 'Recent access activity'}</h2>
            <p class="cg-muted">{sections?.recentAccessActivity?.description || 'Security and session activity for the portal.'}</p>
          </div>
        </div>

        <div class="cg-grid-3">
          {authActivity.slice(0, 6).map((item) => (
            <article class="cg-item" key={item.id}>
              <div class="cg-item-head">
                <h3>{item.user?.displayName || item.email || sections?.recentAccessActivity?.unknownUserLabel || 'Unknown user'}</h3>
                <span class={['cg-status', item.status === 'failure' ? 'is-danger' : item.status === 'success' ? 'is-success' : 'is-info']}>
                  {item.label}
                </span>
              </div>
              <p>{item.email || item.user?.email || sections?.recentAccessActivity?.emptyEmailLabel || 'No email recorded'}</p>
              <div class="cg-chip-row" style={{ marginTop: '10px' }}>
                <span class="cg-chip">{formatDateTime(item.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
        {!authActivity.length ? <div class="cg-empty">{sections?.recentAccessActivity?.emptyState || 'No recent access activity.'}</div> : null}
      </article>
    </section>
  );
}
