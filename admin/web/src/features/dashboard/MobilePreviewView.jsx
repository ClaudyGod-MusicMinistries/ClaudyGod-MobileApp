export default function MobilePreviewView(props) {
  const {
    mobilePreviewUrl,
    mobilePreviewFrameKey,
    onReloadMobilePreview,
    onResetMobilePreviewUrl,
    mobileSectionCatalog,
    endpointChecks,
    endpointChecksAt,
    endpointChecksLoading,
    onRunEndpointChecks,
    formatDateTime,
  } = props;

  return (
    <section class="mobile-preview-grid">
      <article class="panel glass-panel reveal-up" style={{ animationDelay: '220ms' }}>
        <div class="section-head split">
          <div>
            <h2>Mobile App Live Preview</h2>
            <p>Preview the live mobile experience while updating content and backend-managed app config.</p>
          </div>
          <button type="button" class="ghost-btn compact" onClick={onReloadMobilePreview}>
            Reload Preview
          </button>
        </div>

        <div class="mobile-preview-controls">
          <label>
            Live mobile app URL
            <input
              value={mobilePreviewUrl}
              readonly
              placeholder="https://app.your-domain.com"
            />
          </label>
          <div class="button-row mobile-preview-actions">
            <button type="button" class="ghost-btn compact" onClick={onResetMobilePreviewUrl}>
              Reset to live app
            </button>
            {mobilePreviewUrl ? (
              <a href={mobilePreviewUrl} target="_blank" rel="noreferrer noopener" class="ghost-btn compact mobile-preview-link">
                Open in New Tab
              </a>
            ) : (
              <span class="ghost-btn compact mobile-preview-link is-disabled">
                No preview URL
              </span>
            )}
          </div>
        </div>

        <div class="mobile-preview-frame-wrap">
          {mobilePreviewUrl ? (
            <iframe
              key={`mobile-preview-${mobilePreviewFrameKey}`}
              src={mobilePreviewUrl}
              title="Mobile app preview"
              class="mobile-preview-frame"
              loading="lazy"
            />
          ) : (
            <div class="empty-state" style={{ minHeight: '560px', display: 'grid', placeItems: 'center', padding: '1.4rem' }}>
              Configure a public app URL in <code>VITE_MOBILE_PREVIEW_URL</code> to load the live mobile preview here.
            </div>
          )}
        </div>

        <div class="helper-card" style={{ marginTop: '0.9rem' }}>
          <strong>Live flow</strong>
          <p>
            Publish content, assign sections, or update mobile app config in this dashboard, then click <em>Reload Preview</em> to verify the live app UI. Private or localhost preview URLs are ignored automatically.
          </p>
        </div>
        {mobileSectionCatalog.length ? (
          <div class="section-catalog">
            {mobileSectionCatalog.map((section) => (
              <article class="section-catalog-card" key={`preview-section-${section.id}`}>
                <strong>{section.title}</strong>
                <span>{section.id}</span>
                <p>{section.subtitle || 'No subtitle configured yet.'}</p>
                <small>{section.screens.join(' • ')}</small>
              </article>
            ))}
          </div>
        ) : null}
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '260ms' }}>
        <div class="section-head split">
          <div>
            <h2>Endpoint Diagnostics</h2>
            <p>Validate backend endpoints used by admin and mobile clients.</p>
          </div>
          <button
            type="button"
            class="ghost-btn compact"
            onClick={() => void onRunEndpointChecks()}
            disabled={endpointChecksLoading}
          >
            {endpointChecksLoading ? 'Checking...' : 'Run Checks'}
          </button>
        </div>

        {endpointChecksAt ? (
          <div class="muted-chip">Last check: {formatDateTime(endpointChecksAt)}</div>
        ) : null}

        <div class="helper-card" style={{ marginTop: '0.8rem' }}>
          <strong>YouTube requirement</strong>
          <p>
            Set <code>YOUTUBE_API_KEY</code> and <code>YOUTUBE_CHANNEL_ID</code> in the root <code>.env.development</code> or <code>.env.production</code> file, then restart the API to enable YouTube feed and sync.
          </p>
        </div>

        <div class="endpoint-check-list">
          {endpointChecks.length === 0 ? (
            <div class="empty-state">No checks run yet. Click <strong>Run Checks</strong>.</div>
          ) : endpointChecks.map((check) => (
            <article class={['endpoint-check-card', check.status === 'ok' ? 'is-ok' : 'is-error']} key={`${check.label}-${check.path}`}>
              <div class="endpoint-check-head">
                <strong>{check.label}</strong>
                <span class={['pill', check.status === 'ok' ? 'pill-live' : 'pill-draft']}>
                  {check.statusCode || 'ERR'}
                </span>
              </div>
              <code>{check.path}</code>
              <p>{check.detail}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
