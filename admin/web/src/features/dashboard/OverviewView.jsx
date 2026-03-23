export default function OverviewView(props) {
  const {
    workflowSteps,
    apiHealthCheck,
    requestStatusBoard,
    contentRequestLoading,
    requestQueuePreview,
    isAdmin,
    contentRequestStatusUpdatingId,
    contentRequestStatusOptions,
    creatingDraftFromRequestId,
    adminOpsLoading,
    audienceStats,
    adminOps,
    managedItemsCount,
    supportStatusUpdatingId,
    userRoleUpdatingId,
    currentUserId,
    userRoleOptions,
    recentItems,
    onSetDashboardView,
    onUpdateSubmissionRequestStatus,
    onCreateDraftFromRequest,
    onFetchAdminOperationsDashboard,
    onUpdateSupportRequestStatus,
    onUpdateUserRole,
    formatDateTime,
    truncate,
    humanizeToken,
  } = props;

  return (
    <section class="overview-grid">
      <article class="panel glass-panel reveal-up" style={{ animationDelay: '220ms' }}>
        <div class="section-head split">
          <div>
            <h2>Start here</h2>
            <p>Use this request-first flow so uploads stay organized and easy for your team to review.</p>
          </div>
          <button type="button" class="primary-btn" onClick={() => onSetDashboardView('editor')}>
            Open request desk
          </button>
        </div>

        <div class="simple-intro-panel">
          <div class="simple-intro-item">
            <strong>1. Submit one clean request</strong>
            <p>Upload media, attach a thumbnail, and describe where it should appear in the app.</p>
          </div>
          <div class="simple-intro-item">
            <strong>2. Review the queue</strong>
            <p>Move tickets through review, request changes when needed, and keep all status changes visible.</p>
          </div>
          <div class="simple-intro-item">
            <strong>3. Create draft then publish</strong>
            <p>Convert approved tickets into draft content, confirm the app view, then publish with confidence.</p>
          </div>
        </div>

        <div class="workflow-grid">
          {workflowSteps.map((step, index) => (
            <article class="workflow-step" key={`workflow-step-${step.title}`}>
              <div class="workflow-step-number">{index + 1}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </div>
            </article>
          ))}
        </div>

        <div class="hero-chip-group" style={{ marginTop: '0.9rem' }}>
          <span class="hero-chip">Request-led publishing</span>
          <span class="hero-chip">Clear review status</span>
          <span class="hero-chip">Draft before release</span>
          {apiHealthCheck ? <span class="hero-chip">API: {apiHealthCheck.status === 'ok' ? 'ready' : 'needs attention'}</span> : null}
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '240ms' }}>
        <div class="section-head split">
          <div>
            <h2>Submission Pipeline</h2>
            <p>See every upload request in one place and turn approved tickets into draft content.</p>
          </div>
          <button
            type="button"
            class="primary-btn"
            onClick={() => onSetDashboardView('editor')}
          >
            Open queue
          </button>
        </div>

        <section class="ticket-summary-grid">
          {requestStatusBoard.map((card, index) => (
            <article
              class={['stat-card', 'glass-panel', `accent-${card.accent}`]}
              style={{ animationDelay: `${index * 60}ms` }}
              key={`request-stat-${card.label}`}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>

        <div class="list-wrap">
          {contentRequestLoading ? (
            <div class="empty-state">Loading submission tickets...</div>
          ) : null}
          {!contentRequestLoading && requestQueuePreview.length === 0 ? (
            <div class="empty-state">No submission tickets yet. Open the request desk to send the first upload request.</div>
          ) : null}
          {!contentRequestLoading && requestQueuePreview.map((request) => (
            <article class={['content-card', 'request-card']} key={`request-preview-${request.id}`}>
              <div class="card-top">
                <div class="pill-row">
                  <span class={['pill', `pill-${request.type}`]}>{request.type}</span>
                  <span class={['pill', request.status === 'fulfilled' ? 'pill-live' : request.status === 'changes_requested' || request.status === 'rejected' ? 'pill-draft' : 'pill-playlist']}>
                    {humanizeToken(request.status)}
                  </span>
                  <span class="muted-chip">Target: {request.requestedVisibility}</span>
                </div>
                <span class="muted-chip">{formatDateTime(request.createdAt)}</span>
              </div>
              <div class="card-body">
                <h3>{request.title}</h3>
                <p>{truncate(request.description, 160)}</p>
              </div>

              <div class="meta-grid">
                <div>
                  <span class="meta-label">Requested by</span>
                  <strong>{request.requester && request.requester.displayName ? request.requester.displayName : 'Unknown requester'}</strong>
                </div>
                <div>
                  <span class="meta-label">Created draft</span>
                  <strong>{request.createdContentTitle || 'Not yet converted'}</strong>
                </div>
              </div>

              {isAdmin ? (
                <div class="request-card-actions">
                  <label>
                    Review status
                    <select
                      value={request.status}
                      disabled={contentRequestStatusUpdatingId === request.id}
                      onChange={(event) => void onUpdateSubmissionRequestStatus(request.id, event.target.value)}
                    >
                      {contentRequestStatusOptions.map((status) => (
                        <option value={status} key={`request-status-${request.id}-${status}`}>{humanizeToken(status)}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    class="primary-btn"
                    disabled={Boolean(request.createdContentId) || creatingDraftFromRequestId === request.id || request.status === 'rejected'}
                    onClick={() => void onCreateDraftFromRequest(request)}
                  >
                    {request.createdContentId
                      ? 'Draft created'
                      : creatingDraftFromRequestId === request.id
                        ? 'Creating draft...'
                        : 'Create draft'}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '260ms' }}>
        <div class="section-head split">
          <div>
            <h2>{isAdmin ? 'Audience & Health' : 'Workspace Health'}</h2>
            <p>{isAdmin ? 'Keep the team focused on users, support load, and launch readiness.' : 'Check the state of your library and publishing stack at a glance.'}</p>
          </div>
          {isAdmin ? (
            <button
              type="button"
              class="ghost-btn compact"
              onClick={() => void onFetchAdminOperationsDashboard()}
              disabled={adminOpsLoading}
            >
              {adminOpsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          ) : (
            <span class="section-badge">Monitoring</span>
          )}
        </div>

        {isAdmin ? (
          <section class="stats-grid compact-stats-grid">
            {audienceStats.map((card, index) => (
              <article
                class={['stat-card', 'glass-panel', `accent-${card.accent}`]}
                style={{ animationDelay: `${index * 60}ms` }}
                key={`audience-stat-${card.label}`}
              >
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </section>
        ) : null}

        <div class="grid-2" style={{ marginTop: '0.8rem', marginBottom: '0.9rem' }}>
          <div class="helper-card">
            <strong>{isAdmin ? 'Signup momentum' : 'Library snapshot'}</strong>
            <p>
              {isAdmin
                ? `${(adminOps.signupTrend || []).reduce((sum, point) => sum + Number(point.signups || 0), 0)} new account${(adminOps.signupTrend || []).reduce((sum, point) => sum + Number(point.signups || 0), 0) === 1 ? '' : 's'} in the last 14 days.`
                : `${managedItemsCount} content item${managedItemsCount === 1 ? '' : 's'} currently managed from this workspace.`}
            </p>
          </div>
          <div class="helper-card">
            <strong>Infrastructure readiness</strong>
            <p>
              {apiHealthCheck
                ? apiHealthCheck.detail
                : 'Run endpoint diagnostics to verify API, Redis, PostgreSQL, YouTube, and SMTP readiness.'}
            </p>
          </div>
        </div>

        {apiHealthCheck && apiHealthCheck.capabilities ? (
          <div class="pill-row" style={{ marginTop: '0.4rem' }}>
            <span class={['pill', apiHealthCheck.capabilities.youtube ? 'pill-live' : 'pill-draft']}>
              YouTube {apiHealthCheck.capabilities.youtube ? 'ready' : 'disabled'}
            </span>
            <span class={['pill', apiHealthCheck.capabilities.smtp ? 'pill-live' : 'pill-draft']}>
              Email {apiHealthCheck.capabilities.smtp ? 'ready' : 'not configured'}
            </span>
            <span class={['pill', apiHealthCheck.capabilities.supabase ? 'pill-live' : 'pill-draft']}>
              Supabase {apiHealthCheck.capabilities.supabase ? 'connected' : 'not linked'}
            </span>
          </div>
        ) : null}

        {isAdmin ? (
          <>
            <details class="dashboard-disclosure" style={{ marginTop: '0.9rem' }}>
              <summary>Open support and feedback details</summary>
              <div class="dashboard-disclosure-body">
                <div class="list-wrap disclosure-list">
                  {adminOps.supportInbox.length === 0 ? (
                    <div class="empty-state">No complaints or support tickets have been submitted yet.</div>
                  ) : adminOps.supportInbox.slice(0, 4).map((ticket) => (
                    <article class="content-card" key={`support-ticket-${ticket.id}`}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class={['pill', ticket.status === 'resolved' || ticket.status === 'closed' ? 'pill-live' : 'pill-draft']}>
                            {humanizeToken(ticket.status)}
                          </span>
                          <span class="muted-chip">{humanizeToken(ticket.priority)}</span>
                        </div>
                        <span class="muted-chip">{formatDateTime(ticket.createdAt)}</span>
                      </div>
                      <div class="card-body">
                        <h3>{ticket.subject}</h3>
                        <p>{truncate(ticket.message, 140)}</p>
                      </div>
                      <label>
                        Ticket status
                        <select
                          value={ticket.status}
                          disabled={supportStatusUpdatingId === ticket.id}
                          onChange={(event) => void onUpdateSupportRequestStatus(ticket.id, event.target.value)}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </label>
                    </article>
                  ))}
                </div>
              </div>
            </details>

            <details class="dashboard-disclosure" style={{ marginTop: '0.9rem' }}>
              <summary>Manage user access</summary>
              <div class="dashboard-disclosure-body">
                <div class="list-wrap disclosure-list">
                  {adminOps.recentUsers.length === 0 ? (
                    <div class="empty-state">No registered users yet.</div>
                  ) : adminOps.recentUsers.slice(0, 6).map((user) => (
                    <article class="content-card" key={`recent-user-${user.id}`}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class={['pill', user.role === 'ADMIN' ? 'pill-live' : 'pill-draft']}>
                            {humanizeToken(user.role)}
                          </span>
                          <span class="muted-chip">{humanizeToken(user.authProvider || 'local')}</span>
                        </div>
                        <span class="muted-chip">{formatDateTime(user.createdAt)}</span>
                      </div>
                      <div class="card-body">
                        <h3>{user.displayName || 'Unnamed user'}</h3>
                        <p>{user.email}</p>
                      </div>
                      <div class="meta-grid">
                        <div>
                          <span class="meta-label">Last login</span>
                          <strong>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Not yet recorded'}</strong>
                        </div>
                        <div>
                          <span class="meta-label">Email status</span>
                          <strong>{user.emailVerifiedAt ? 'Verified' : 'Pending verification'}</strong>
                        </div>
                      </div>
                      <label class="role-select-field">
                        Assign role
                        <select
                          value={user.role}
                          disabled={userRoleUpdatingId === user.id || user.id === currentUserId}
                          onChange={(event) => void onUpdateUserRole(user.id, event.target.value)}
                        >
                          {userRoleOptions.map((role) => (
                            <option value={role} key={`user-role-${user.id}-${role}`}>{humanizeToken(role)}</option>
                          ))}
                        </select>
                        <small class="subtle-text">
                          {user.id === currentUserId
                            ? 'You cannot change your own role from this dashboard.'
                            : 'Role changes apply immediately to protected admin actions.'}
                        </small>
                      </label>
                    </article>
                  ))}
                </div>
              </div>
            </details>
          </>
        ) : null}
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '280ms' }}>
        <div class="section-head split">
          <div>
            <h2>Latest Content</h2>
            <p>Your most recent drafts and published updates.</p>
          </div>
          <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView('editor')}>
            Open library
          </button>
        </div>

        <div class="list-wrap">
          {recentItems.length === 0 ? (
            <div class="empty-state">No content yet. Open the request desk to submit the first upload.</div>
          ) : recentItems.map((item) => (
            <article class="content-card" key={`overview-item-${item.id}`}>
              <div class="card-top">
                <div class="pill-row">
                  <span class={['pill', `pill-${item.type}`]}>{item.type}</span>
                  <span class={['pill', item.visibility === 'published' ? 'pill-live' : 'pill-draft']}>{item.visibility}</span>
                </div>
                <span class="muted-chip">{formatDateTime(item.updatedAt)}</span>
              </div>
              <div class="card-body">
                <h3>{item.title}</h3>
                <p>{truncate(item.description, 120)}</p>
              </div>
            </article>
          ))}
        </div>
      </article>

      {isAdmin ? (
        <article class="panel glass-panel reveal-up" style={{ animationDelay: '300ms' }}>
          <div class="section-head split">
            <div>
              <h2>Operations Desk</h2>
              <p>Keep advanced monitoring available without crowding the landing page.</p>
            </div>
            <span class="section-badge">Advanced</span>
          </div>
          <details class="dashboard-disclosure" open>
            <summary>Automation and editorial signals</summary>
            <div class="dashboard-disclosure-body">
              <div class="list-wrap disclosure-list">
                {(adminOps.smartInsights || []).length === 0 ? (
                  <div class="empty-state">No automation insights are available yet.</div>
                ) : adminOps.smartInsights.map((insight) => (
                  <article class="content-card" key={`insight-${insight.id}`}>
                    <div class="card-top">
                      <div class="pill-row">
                        <span class={['pill', insight.tone === 'success' ? 'pill-live' : insight.tone === 'warning' ? 'pill-draft' : 'pill-video']}>
                          {humanizeToken(insight.tone)}
                        </span>
                        <span class="muted-chip">Automation insight</span>
                      </div>
                    </div>
                    <div class="card-body">
                      <h3>{insight.title}</h3>
                      <p>{insight.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </details>
        </article>
      ) : null}
    </section>
  );
}
