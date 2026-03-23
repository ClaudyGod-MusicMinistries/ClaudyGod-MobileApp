export default function MobilePreviewView(props) {
  const {
    mobilePreviewUrl,
    mobilePreviewFrameKey,
    onReloadMobilePreview,
    onResetMobilePreviewUrl,
    mobileSectionCatalog,
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
            <h2>Mobile Placement Guide</h2>
            <p>Use these sections to decide where uploaded content should appear in the ClaudyGod mobile experience.</p>
          </div>
          <span class="section-badge">Client view</span>
        </div>

        <div class="simple-intro-panel">
          <div class="simple-intro-item">
            <strong>1. Upload or update content</strong>
            <p>Create a request or publish directly from the content desk.</p>
          </div>
          <div class="simple-intro-item">
            <strong>2. Assign the right section</strong>
            <p>Choose the home, video, or supporting sections that match the content type.</p>
          </div>
          <div class="simple-intro-item">
            <strong>3. Reload this preview</strong>
            <p>Confirm the live mobile placement before you move on to the next upload.</p>
          </div>
        </div>

        {mobileSectionCatalog.length ? (
          <div class="section-catalog">
            {mobileSectionCatalog.map((section) => (
              <article class="section-catalog-card" key={`mobile-placement-${section.id}`}>
                <strong>{section.title}</strong>
                <span>{section.id}</span>
                <p>{section.subtitle || 'No supporting copy configured yet.'}</p>
                <small>{section.screens.join(' • ')}</small>
              </article>
            ))}
          </div>
        ) : (
          <div class="empty-state">No mobile sections have been configured yet. Once sections are saved, they will appear here for quick client preview.</div>
        )}
      </article>
    </section>
  );
}
