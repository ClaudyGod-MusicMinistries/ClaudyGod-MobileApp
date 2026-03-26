const toneClassMap = {
  success: 'is-success',
  warning: 'is-warning',
  info: 'is-info',
};

export default function OverviewView(props) {
  const {
    adminOpsLoading,
    overview,
    smartInsights,
    recentAuthActivity,
    onSetDashboardView,
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
  const primaryAction = hero?.primaryAction || null;
  const secondaryAction = hero?.secondaryAction || null;
  const accessSection = sections?.accessHealth || null;
  const signalsSection = sections?.signals || null;
  const recentAccessSection = sections?.recentAccessActivity || null;
  const requestQueueSection = sections?.requestQueue || null;
  const latestContentSection = sections?.latestContent || null;

  return (
    <section class="overview-grid portal-overview-grid">
      <article class="panel glass-panel portal-hero-panel reveal-up" style={{ animationDelay: '140ms' }}>
        <div class="portal-hero-head">
          <div>
            {hero?.eyebrow ? <p class="eyebrow">{hero.eyebrow}</p> : null}
            {hero?.title ? <h2>{hero.title}</h2> : null}
            {hero?.description ? <p class="portal-hero-copy">{hero.description}</p> : null}
          </div>
          <div class="portal-hero-actions">
            {primaryAction?.label && primaryAction?.view ? (
              <button type="button" class="primary-btn" onClick={() => onSetDashboardView(primaryAction.view)}>
                {primaryAction.label}
              </button>
            ) : null}
            {secondaryAction?.label && secondaryAction?.view ? (
              <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView(secondaryAction.view)}>
                {secondaryAction.label}
              </button>
            ) : null}
          </div>
        </div>

        <section class="metric-grid">
          {portalCards.map((card) => (
            <article class="metric-card" key={card.id || card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.hint}</p>
            </article>
          ))}
        </section>
      </article>

      {accessSection && (accessCards.length > 0 || adminOpsLoading) ? (
        <article class="panel glass-panel reveal-up" style={{ animationDelay: '170ms' }}>
          <div class="section-head compact">
            <div>
              <h3>{accessSection.title}</h3>
              <p>{accessSection.description}</p>
            </div>
            <span class="section-badge">
              {adminOpsLoading ? accessSection.badgeRefreshingLabel : accessSection.badgeLiveLabel}
            </span>
          </div>

          <section class="metric-grid compact-metric-grid">
            {accessCards.map((card) => (
              <article class="metric-card metric-card-quiet" key={card.id || card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.hint}</p>
              </article>
            ))}
          </section>
        </article>
      ) : null}

      {signalsSection ? (
        <article class="panel glass-panel reveal-up" style={{ animationDelay: '190ms' }}>
          <div class="section-head compact">
            <div>
              <h3>{signalsSection.title}</h3>
              <p>{signalsSection.description}</p>
            </div>
          </div>

          <div class="signal-stack">
            {smartInsights.length === 0 ? (
              <div class="empty-state">{signalsSection.emptyState}</div>
            ) : smartInsights.slice(0, 4).map((signal) => (
              <article class={['signal-card', toneClassMap[signal.tone] || 'is-info']} key={signal.id}>
                <strong>{signal.title}</strong>
                <p>{signal.detail}</p>
              </article>
            ))}
          </div>
        </article>
      ) : null}

      {recentAccessSection ? (
        <article class="panel glass-panel reveal-up" style={{ animationDelay: '210ms' }}>
          <div class="section-head compact">
            <div>
              <h3>{recentAccessSection.title}</h3>
              <p>{recentAccessSection.description}</p>
            </div>
          </div>

          <div class="activity-feed">
            {recentAuthActivity.length === 0 ? (
              <div class="empty-state">{recentAccessSection.emptyState}</div>
            ) : recentAuthActivity.slice(0, 6).map((item) => (
              <article class="activity-item" key={item.id}>
                <div class="activity-item-head">
                  <strong>{item.user?.displayName || item.email || recentAccessSection.unknownUserLabel}</strong>
                  <span class={['activity-status', item.status === 'failure' ? 'is-failure' : item.status === 'success' ? 'is-success' : 'is-info']}>
                    {item.label}
                  </span>
                </div>
                <p>{item.email || item.user?.email || recentAccessSection.emptyEmailLabel}</p>
                <span class="muted-chip">{formatDateTime(item.createdAt)}</span>
              </article>
            ))}
          </div>
        </article>
      ) : null}

      {requestQueueSection ? (
        <article class="panel glass-panel reveal-up" style={{ animationDelay: '230ms' }}>
          <div class="section-head compact">
            <div>
              <h3>{requestQueueSection.title}</h3>
              <p>{requestQueueSection.description}</p>
            </div>
            {requestQueueSection.actionLabel ? (
              <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView('editor')}>
                {requestQueueSection.actionLabel}
              </button>
            ) : null}
          </div>

          <section class="metric-grid slim-metric-grid">
            {requestStatusBoard.map((item) => (
              <article class="metric-card metric-card-quiet" key={item.id || item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </section>

          <div class="activity-feed">
            {adminOpsLoading ? <div class="empty-state">{requestQueueSection.loadingMessage}</div> : null}
            {!adminOpsLoading && requestQueuePreview.length === 0 ? (
              <div class="empty-state">{requestQueueSection.emptyState}</div>
            ) : null}
            {!adminOpsLoading && requestQueuePreview.map((request) => (
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
      ) : null}

      {latestContentSection ? (
        <article class="panel glass-panel reveal-up" style={{ animationDelay: '250ms' }}>
          <div class="section-head compact">
            <div>
              <h3>{latestContentSection.title}</h3>
              <p>{latestContentSection.description}</p>
            </div>
            {latestContentSection.actionLabel ? (
              <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView('editor')}>
                {latestContentSection.actionLabel}
              </button>
            ) : null}
          </div>

          <div class="activity-feed">
            {latestContent.length === 0 ? (
              <div class="empty-state">{latestContentSection.emptyState}</div>
            ) : latestContent.map((item) => (
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
      ) : null}
    </section>
  );
}
