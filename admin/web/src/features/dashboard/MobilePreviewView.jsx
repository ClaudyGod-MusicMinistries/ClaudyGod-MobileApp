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
            <p>Preview the live mobile experience while you update content and confirm what your audience will see.</p>
          </div>
          <button type="button" class="ghost-btn compact" onClick={onReloadMobilePreview}>
            Reload Preview
          </button>
        </div>

        <div class="button-row mobile-preview-actions" style={{ marginBottom: '0.8rem' }}>
          <button type="button" class="ghost-btn compact" onClick={onResetMobilePreviewUrl}>
            Reset preview
          </button>
          {mobilePreviewUrl ? (
            <a href={mobilePreviewUrl} target="_blank" rel="noreferrer noopener" class="ghost-btn compact mobile-preview-link">
              Open full screen
            </a>
          ) : null}
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
              The live app preview will appear here once it is available.
            </div>
          )}
        </div>

        <div class="helper-card" style={{ marginTop: '0.9rem' }}>
          <strong>Live flow</strong>
          <p>
            Publish content, assign sections, then click <em>Reload Preview</em> to confirm the live app experience before you move on.
          </p>
        </div>
        {mobileSectionCatalog.length ? (
          <div class="section-catalog">
            {mobileSectionCatalog.map((section) => (
              <article class="section-catalog-card" key={`preview-section-${section.id}`}>
                <strong>{section.title}</strong>
                <p>{section.subtitle || 'This section is ready for content.'}</p>
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
          <span class="section-badge">Mobile guide</span>
        </div>

          <div class="simple-intro-panel">
            <div class="simple-intro-item">
              <strong>1. Upload or update content</strong>
            <p>Create a request or publish directly from the content page.</p>
            </div>
          <div class="simple-intro-item">
            <strong>2. Assign the right section</strong>
            <p>Choose the home, video, music, or library sections that match the content type.</p>
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
                <p>{section.subtitle || 'Choose this area when the content belongs in this part of the app.'}</p>
              </article>
            ))}
          </div>
        ) : (
          <div class="empty-state">Mobile sections will appear here as soon as they are ready for use.</div>
        )}
      </article>
    </section>
  );
}
