import '../../app/AdminShell.css';

export default function MobilePreviewView(props) {
  const {
    mobilePreviewUrl,
    mobilePreviewFrameKey,
    onReloadMobilePreview,
    onResetMobilePreviewUrl,
    mobileSectionCatalog,
  } = props;

  const sections = Array.isArray(mobileSectionCatalog) ? mobileSectionCatalog : [];

  return (
    <section class="cg-page">
      <article class="cg-panel cg-hero">
        <div class="cg-section-head">
          <div>
            <p class="cg-kicker">Mobile preview</p>
            <h2 class="cg-page-title">Review the app before users see changes.</h2>
            <p class="cg-hero-copy">
              Reload the preview after publishing or changing placement. Use the section guide to confirm where each upload should appear.
            </p>
          </div>
          <div class="cg-button-row">
            <button type="button" class="cg-primary" onClick={onReloadMobilePreview}>Reload preview</button>
            <button type="button" class="cg-secondary" onClick={onResetMobilePreviewUrl}>Reset</button>
            {mobilePreviewUrl ? <a href={mobilePreviewUrl} target="_blank" rel="noreferrer noopener" class="cg-secondary">Open full screen</a> : null}
          </div>
        </div>
      </article>

      <section class="cg-main-grid">
        <article class="cg-panel cg-card">
          <div class="cg-phone-frame">
            {mobilePreviewUrl ? (
              <iframe
                key={`mobile-preview-${mobilePreviewFrameKey}`}
                src={mobilePreviewUrl}
                title="Mobile app preview"
                class="cg-preview-frame"
                loading="lazy"
              />
            ) : (
              <div class="cg-empty" style={{ minHeight: '680px' }}>
                The live app preview will appear here after a preview URL is configured.
              </div>
            )}
          </div>
        </article>

        <aside class="cg-stack">
          <article class="cg-panel cg-card">
            <div class="cg-section-head">
              <div>
                <h2>Preview checklist</h2>
                <p class="cg-muted">Use this flow after every publishing change.</p>
              </div>
            </div>
            <div class="cg-checklist">
              <div class="cg-check-row"><span class="cg-check-dot">1</span><div><strong>Publish or save placement</strong><p class="cg-muted">Make the content update inside Publishing Studio.</p></div></div>
              <div class="cg-check-row"><span class="cg-check-dot">2</span><div><strong>Reload preview</strong><p class="cg-muted">Refresh the embedded app after saving your changes.</p></div></div>
              <div class="cg-check-row"><span class="cg-check-dot">3</span><div><strong>Confirm section</strong><p class="cg-muted">Check title, thumbnail, action, and content type.</p></div></div>
            </div>
          </article>

          <article class="cg-panel cg-card">
            <div class="cg-section-head">
              <div>
                <h2>Mobile section guide</h2>
                <p class="cg-muted">Section IDs from the active mobile app configuration.</p>
              </div>
              <span class="cg-chip">{sections.length} sections</span>
            </div>
            <div class="cg-list">
              {sections.map((section) => (
                <article class="cg-item" key={`preview-section-${section.id}`}>
                  <h3>{section.title}</h3>
                  <p>{section.subtitle || 'This section is ready for assigned content.'}</p>
                  <div class="cg-chip-row" style={{ marginTop: '10px' }}>
                    <span class="cg-chip">{section.id}</span>
                  </div>
                </article>
              ))}
              {!sections.length ? <div class="cg-empty">Mobile sections will appear here once configuration is loaded.</div> : null}
            </div>
          </article>
        </aside>
      </section>
    </section>
  );
}
