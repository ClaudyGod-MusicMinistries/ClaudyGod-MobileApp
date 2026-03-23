export default function OverviewView(props) {
  const {
    requestStatusBoard,
    contentRequestLoading,
    requestQueuePreview,
    managedItemsCount,
    recentItems,
    onSetDashboardView,
    formatDateTime,
    truncate,
    humanizeToken,
  } = props;

  const openRequests = requestStatusBoard[0] ? requestStatusBoard[0].value : 0;
  const needsChanges = requestStatusBoard[1] ? requestStatusBoard[1].value : 0;
  const convertedDrafts = requestStatusBoard[2] ? requestStatusBoard[2].value : 0;

  return (
    <section class="overview-grid">
      <article class="panel glass-panel reveal-up" style={{ animationDelay: '180ms' }}>
        <div class="section-head split">
          <div>
            <h2>Content Portal</h2>
            <p>A simple workspace for uploading content, managing the library, and checking how updates look in the mobile app.</p>
          </div>
          <button type="button" class="primary-btn" onClick={() => onSetDashboardView('editor')}>
            Open content
          </button>
        </div>

        <div class="quick-actions-grid">
          <article class={['task-card', 'glass-panel', 'task-card-primary']}>
            <div>
              <p class="eyebrow">Upload</p>
              <h3>Add new content</h3>
              <p>Upload audio or video, attach a thumbnail, and set where it should appear in the app.</p>
            </div>
            <button type="button" class="primary-btn" onClick={() => onSetDashboardView('editor')}>
              Start upload
            </button>
          </article>

          <article class="task-card glass-panel">
            <div>
              <p class="eyebrow">Manage</p>
              <h3>Review your library</h3>
              <p>Publish drafts, move items back to draft, assign sections, and delete outdated content.</p>
            </div>
            <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView('editor')}>
              Open library
            </button>
          </article>

          <article class="task-card glass-panel">
            <div>
              <p class="eyebrow">Preview</p>
              <h3>Check the mobile app</h3>
              <p>Reload the live preview and confirm each item appears in the right place before you leave the portal.</p>
            </div>
            <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView('mobile-preview')}>
              Open preview
            </button>
          </article>
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '220ms' }}>
        <div class="section-head split">
          <div>
            <h2>Portal Summary</h2>
            <p>The key numbers your clients need without the extra operational noise.</p>
          </div>
          <span class="section-badge">Today</span>
        </div>

        <section class="stats-grid compact-stats-grid">
          <article class={['stat-card', 'glass-panel', 'accent-mint']}>
            <span>Managed content</span>
            <strong>{managedItemsCount}</strong>
          </article>
          <article class={['stat-card', 'glass-panel', 'accent-blue']}>
            <span>Open requests</span>
            <strong>{openRequests}</strong>
          </article>
          <article class={['stat-card', 'glass-panel', 'accent-amber']}>
            <span>Needs changes</span>
            <strong>{needsChanges}</strong>
          </article>
          <article class={['stat-card', 'glass-panel', 'accent-rose']}>
            <span>Drafts created</span>
            <strong>{convertedDrafts}</strong>
          </article>
        </section>

        <div class="grid-2" style={{ marginTop: '0.8rem' }}>
          <div class="helper-card">
            <strong>Best practice</strong>
            <p>Use the content page for every upload so the library stays clean and the preview stays accurate.</p>
          </div>
          <div class="helper-card">
            <strong>Mobile-first workflow</strong>
            <p>Every upload should end with a preview check to confirm it is showing in the right mobile section.</p>
          </div>
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '240ms' }}>
        <div class="section-head split">
          <div>
            <h2>Recent Requests</h2>
            <p>Latest upload requests waiting for review or release.</p>
          </div>
          <button type="button" class="ghost-btn compact" onClick={() => onSetDashboardView('editor')}>
            Open queue
          </button>
        </div>

        <div class="list-wrap">
          {contentRequestLoading ? (
            <div class="empty-state">Loading upload requests...</div>
          ) : null}
          {!contentRequestLoading && requestQueuePreview.length === 0 ? (
            <div class="empty-state">No upload requests yet. Open the content page to add the first item.</div>
          ) : null}
          {!contentRequestLoading && requestQueuePreview.map((request) => (
            <article class={['content-card', 'request-card']} key={`overview-request-${request.id}`}>
              <div class="card-top">
                <div class="pill-row">
                  <span class={['pill', `pill-${request.type}`]}>{request.type}</span>
                  <span class={['pill', request.status === 'fulfilled' ? 'pill-live' : request.status === 'changes_requested' || request.status === 'rejected' ? 'pill-draft' : 'pill-playlist']}>
                    {humanizeToken(request.status)}
                  </span>
                </div>
                <span class="muted-chip">{formatDateTime(request.createdAt)}</span>
              </div>
              <div class="card-body">
                <h3>{request.title}</h3>
                <p>{truncate(request.description, 130)}</p>
              </div>
            </article>
          ))}
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '260ms' }}>
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
            <div class="empty-state">No content yet. Open the content page to submit the first upload.</div>
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
    </section>
  );
}
