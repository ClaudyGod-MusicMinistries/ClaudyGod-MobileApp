import '../../app/AdminShell.css';

function hasText(value) {
  return String(value || '').trim().length > 0;
}

function readiness(createForm) {
  const mediaType = createForm.type === 'audio' || createForm.type === 'video';
  const mediaReady = !mediaType || hasText(createForm.url) || hasText(createForm.mediaUploadSessionId);
  const thumbReady = !mediaType || hasText(createForm.thumbnailUrl) || hasText(createForm.thumbnailUploadSessionId);
  return [
    { label: 'Title added', ok: hasText(createForm.title), note: 'Use a clear public title.' },
    { label: 'Description added', ok: hasText(createForm.description), note: 'Explain what users will hear or watch.' },
    { label: 'Media ready', ok: mediaReady, note: 'Upload media or paste the approved media URL.' },
    { label: 'Thumbnail ready', ok: thumbReady, note: 'Audio and video should have a poster image.' },
    { label: 'Mobile placement selected', ok: hasText(createForm.appSectionsCsv), note: 'Choose where this content appears in the app.' },
  ];
}

function itemStatusClass(status) {
  if (status === 'published' || status === 'fulfilled' || status === 'approved') return 'is-success';
  if (status === 'changes_requested' || status === 'draft' || status === 'in_review') return 'is-warning';
  if (status === 'rejected') return 'is-danger';
  return 'is-info';
}

export default function EditorView(props) {
  const {
    directPublishMode,
    createForm,
    savingContent,
    uploadingAsset,
    uploadPoliciesLoading,
    contentRequestLoading,
    contentRequests,
    requestSummary,
    requestStatusBoard,
    contentLoading,
    filteredItems,
    paginationTotal,
    filterState,
    isAdmin,
    contentRequestStatusUpdatingId,
    creatingDraftFromRequestId,
    togglingId,
    deletingContentId,
    activeSectionEditorItemId,
    sectionEditorValue,
    sectionEditorSaving,
    onCreateContent,
    onReadValue,
    onHandleAssetUpload,
    onGetUploadPolicy,
    onResolveMediaAssetKind,
    onFormatBytes,
    onRenderSectionSelector,
    onUpdateSubmissionRequestStatus,
    onCreateDraftFromRequest,
    onToggleVisibility,
    onOpenEditContentModal,
    onToggleContentSectionEditor,
    onUpdateSectionEditorValue,
    onSaveContentSections,
    onCloseContentSectionEditor,
    onDeleteContentItem,
    formatDateTime,
    truncate,
    contentTypes,
    visibilityOptions,
    contentRequestStatusOptions,
  } = props;

  const checks = readiness(createForm);
  const completeChecks = checks.filter((check) => check.ok).length;
  const requests = Array.isArray(contentRequests) ? contentRequests : [];
  const items = Array.isArray(filteredItems) ? filteredItems : [];

  return (
    <section class="cg-page">
      <article class="cg-panel cg-hero">
        <div class="cg-section-head">
          <div>
            <p class="cg-kicker">Publishing Studio</p>
            <h2 class="cg-page-title">Create, correct, and publish without confusion.</h2>
            <p class="cg-hero-copy">
              Use this guided workspace to upload content, attach thumbnails, choose mobile app placement, review requests, and correct existing items before they go live.
            </p>
          </div>
          <span class="cg-chip is-info">{directPublishMode ? 'Direct publishing enabled' : 'Request review mode'}</span>
        </div>

        <div class="cg-progress-steps" style={{ marginTop: '20px' }}>
          <div class="cg-step">
            <span class="cg-step-pill">1</span>
            <strong>Add details</strong>
            <p class="cg-muted">Title, description, type, artist/channel, and visibility.</p>
          </div>
          <div class="cg-step">
            <span class="cg-step-pill">2</span>
            <strong>Attach assets</strong>
            <p class="cg-muted">Upload or paste media and thumbnail links.</p>
          </div>
          <div class="cg-step">
            <span class="cg-step-pill">3</span>
            <strong>Choose placement</strong>
            <p class="cg-muted">Select the mobile sections where users should see it.</p>
          </div>
        </div>
      </article>

      <main class="cg-main-grid">
        <section class="cg-panel cg-form-card">
          <div class="cg-section-head">
            <div>
              <p class="cg-kicker">New content</p>
              <h2>{directPublishMode ? 'Upload to mobile app' : 'Submit for review'}</h2>
              <p class="cg-muted">
                {directPublishMode
                  ? 'Create a draft or publish directly after all required details are ready.'
                  : 'Fill in the details and submit for review before it goes to the app.'}
              </p>
            </div>
            <span class="cg-chip">{completeChecks}/{checks.length} ready</span>
          </div>

          <form class="cg-form" onSubmit={(event) => void onCreateContent(event)}>
            <label>
              <span>Content title</span>
              <input
                value={createForm.title}
                onInput={(event) => { createForm.title = onReadValue(event); }}
                placeholder="Friday Worship Session"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                value={createForm.description}
                onInput={(event) => { createForm.description = onReadValue(event); }}
                rows={5}
                placeholder="Tell users what this content contains and why it matters."
              />
            </label>

            <div class="cg-grid-2">
              <label>
                <span>Content type</span>
                <select value={createForm.type} onChange={(event) => { createForm.type = onReadValue(event); }}>
                  {contentTypes.map((type) => <option value={type} key={type}>{type}</option>)}
                </select>
              </label>

              <label>
                <span>{directPublishMode ? 'Visibility' : 'Requested release'}</span>
                <select value={createForm.visibility} onChange={(event) => { createForm.visibility = onReadValue(event); }}>
                  {visibilityOptions.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}
                </select>
              </label>
            </div>

            <label>
              <span>Media URL</span>
              <input
                value={createForm.url}
                onInput={(event) => { createForm.url = onReadValue(event); }}
                placeholder="Paste approved storage, CDN, YouTube, or stream URL"
              />
              <small>Use this when the media is already hosted outside the upload flow.</small>
            </label>

            <div class="cg-grid-2">
              <label>
                <span>Upload media</span>
                <input
                  type="file"
                  accept={props.onAcceptFromPolicy(onGetUploadPolicy(onResolveMediaAssetKind())) || 'audio/*,video/*'}
                  onChange={(event) => void onHandleAssetUpload(event, 'media')}
                  disabled={uploadingAsset || (createForm.type !== 'audio' && createForm.type !== 'video')}
                />
                <small>
                  {(() => {
                    const kind = onResolveMediaAssetKind();
                    const policy = kind ? onGetUploadPolicy(kind) : null;
                    if (!kind) return 'Choose Audio or Video before uploading a media file.';
                    if (!policy) return uploadPoliciesLoading ? 'Loading upload rules...' : 'Allowed formats and size limits are applied automatically.';
                    return `Allowed: ${policy.allowedExtensions.join(', ')} • Max ${onFormatBytes(policy.maxBytes)}`;
                  })()}
                </small>
              </label>

              <label>
                <span>Upload thumbnail</span>
                <input
                  type="file"
                  accept={props.onAcceptFromPolicy(onGetUploadPolicy('thumbnail')) || 'image/jpeg,image/png,image/webp'}
                  onChange={(event) => void onHandleAssetUpload(event, 'thumbnail')}
                  disabled={uploadingAsset}
                />
                <small>
                  {(() => {
                    const policy = onGetUploadPolicy('thumbnail');
                    if (!policy) return uploadPoliciesLoading ? 'Loading thumbnail rules...' : 'Allowed formats and size limits are applied automatically.';
                    return `Allowed: ${policy.allowedExtensions.join(', ')} • Max ${onFormatBytes(policy.maxBytes)}`;
                  })()}
                </small>
              </label>
            </div>

            {uploadingAsset ? <span class="cg-chip is-info">Uploading to storage...</span> : null}

            <div class="cg-grid-2">
              <label>
                <span>Thumbnail URL override</span>
                <input
                  value={createForm.thumbnailUrl}
                  onInput={(event) => { createForm.thumbnailUrl = onReadValue(event); }}
                  placeholder="Paste poster image URL when needed"
                />
              </label>

              <label>
                <span>Channel / artist</span>
                <input
                  value={createForm.channelName}
                  onInput={(event) => { createForm.channelName = onReadValue(event); }}
                  placeholder="ClaudyGod Music Ministries"
                />
              </label>
            </div>

            <div class="cg-grid-2">
              <label>
                <span>Duration label</span>
                <input
                  value={createForm.duration}
                  onInput={(event) => { createForm.duration = onReadValue(event); }}
                  placeholder="45:12"
                />
              </label>

              <label>
                <span>Tags</span>
                <input
                  value={createForm.tagsCsv}
                  onInput={(event) => { createForm.tagsCsv = onReadValue(event); }}
                  placeholder="worship, live session, choir"
                />
              </label>
            </div>

            <label>
              <span>Mobile placement</span>
              <input
                value={createForm.appSectionsCsv}
                onInput={(event) => { createForm.appSectionsCsv = onReadValue(event); }}
                placeholder="Choose placements below or enter section ids manually"
              />
              <small>These sections decide where the item appears in the mobile app.</small>
            </label>

            {onRenderSectionSelector(createForm.appSectionsCsv, (nextValue) => { createForm.appSectionsCsv = nextValue; })}

            <button type="submit" class="cg-primary" disabled={savingContent}>
              {savingContent
                ? directPublishMode
                  ? createForm.visibility === 'published'
                    ? 'Publishing...'
                    : 'Creating draft...'
                  : 'Submitting request...'
                : directPublishMode
                  ? createForm.visibility === 'published'
                    ? 'Publish to mobile app'
                    : 'Create draft'
                  : 'Send request to review'}
            </button>
          </form>
        </section>

        <aside class="cg-stack">
          <section class="cg-panel cg-card">
            <div class="cg-section-head">
              <div>
                <h2>Readiness checklist</h2>
                <p class="cg-muted">Your client can follow this before publishing.</p>
              </div>
            </div>
            <div class="cg-checklist">
              {checks.map((check) => (
                <div class="cg-check-row" key={check.label}>
                  <span class="cg-check-dot">{check.ok ? '✓' : '!'}</span>
                  <div>
                    <strong>{check.label}</strong>
                    <p class="cg-muted">{check.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section class="cg-panel cg-card">
            <div class="cg-section-head">
              <div>
                <h2>Request board</h2>
                <p class="cg-muted">Track client submissions and review status.</p>
              </div>
              <span class="cg-chip">{requestSummary.active} open</span>
            </div>

            <div class="cg-grid-3" style={{ marginBottom: '12px' }}>
              {requestStatusBoard.map((card) => (
                <article class="cg-mini-card" key={`request-stat-${card.label}`}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>

            <div class="cg-list">
              {contentRequestLoading ? <div class="cg-empty">Loading requests...</div> : null}
              {!contentRequestLoading && requests.length === 0 ? (
                <div class="cg-empty">No content requests yet.</div>
              ) : null}

              {!contentRequestLoading ? requests.slice(0, 8).map((request) => (
                <article class="cg-item" key={`request-${request.id}`}>
                  <div class="cg-item-head">
                    <div>
                      <h3>{request.title}</h3>
                      <p>{truncate(request.description, 120)}</p>
                    </div>
                    <span class={['cg-status', itemStatusClass(request.status)]}>{props.humanizeToken(request.status)}</span>
                  </div>
                  <div class="cg-chip-row">
                    <span class="cg-chip">{request.type}</span>
                    <span class="cg-chip">Target: {request.requestedVisibility}</span>
                    <span class="cg-chip">{formatDateTime(request.createdAt)}</span>
                  </div>
                  {isAdmin ? (
                    <div class="cg-grid-2" style={{ marginTop: '12px' }}>
                      <label class="cg-field">
                        <span>Review status</span>
                        <select
                          class="cg-select"
                          value={request.status}
                          disabled={contentRequestStatusUpdatingId === request.id}
                          onChange={(event) => void onUpdateSubmissionRequestStatus(request.id, event.target.value)}
                        >
                          {contentRequestStatusOptions.map((status) => (
                            <option value={status} key={`request-status-${request.id}-${status}`}>{props.humanizeToken(status)}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        class="cg-primary"
                        disabled={Boolean(request.createdContentId) || creatingDraftFromRequestId === request.id || request.status === 'rejected'}
                        onClick={() => void onCreateDraftFromRequest(request)}
                      >
                        {request.createdContentId ? 'Draft created' : creatingDraftFromRequestId === request.id ? 'Creating...' : 'Create draft'}
                      </button>
                    </div>
                  ) : null}
                </article>
              )) : null}
            </div>
          </section>
        </aside>
      </main>

      <section class="cg-panel cg-card">
        <div class="cg-section-head">
          <div>
            <p class="cg-kicker">Content library</p>
            <h2>Correct, place, publish, or remove existing content</h2>
            <p class="cg-muted">Published and draft items available for correction, placement, and visibility changes.</p>
          </div>
          <span class="cg-chip">{paginationTotal} total items</span>
        </div>

        <div class="cg-grid-3" style={{ marginBottom: '16px' }}>
          <input
            class="cg-input"
            value={filterState.search}
            onInput={(event) => { filterState.search = onReadValue(event); }}
            placeholder="Search title, description, creator, or link"
          />
          <select class="cg-select" value={filterState.type} onChange={(event) => { filterState.type = onReadValue(event); }}>
            <option value="all">All types</option>
            {contentTypes.map((type) => <option value={type} key={type}>{type}</option>)}
          </select>
          <select class="cg-select" value={filterState.visibility} onChange={(event) => { filterState.visibility = onReadValue(event); }}>
            <option value="all">All status</option>
            {visibilityOptions.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}
          </select>
        </div>

        <div class="cg-list">
          {contentLoading ? <div class="cg-empty">Loading content library...</div> : null}
          {!contentLoading && items.length === 0 ? <div class="cg-empty">No content found for the selected filters.</div> : null}

          {!contentLoading ? items.map((item) => (
            <article class="cg-item" key={item.id}>
              <div class="cg-item-head">
                <div>
                  <div class="cg-chip-row" style={{ marginBottom: '8px' }}>
                    <span class="cg-chip">{item.type}</span>
                    <span class={['cg-status', item.visibility === 'published' ? 'is-success' : 'is-warning']}>{item.visibility}</span>
                    {item.sourceKind ? <span class="cg-chip">{item.sourceKind}</span> : null}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{truncate(item.description, 190)}</p>
                </div>
                <div class="cg-button-row">
                  <button type="button" class="cg-secondary compact" onClick={() => onOpenEditContentModal(item)} disabled={deletingContentId === item.id}>
                    Correct
                  </button>
                  <button type="button" class="cg-secondary compact" onClick={() => onToggleContentSectionEditor(item)}>
                    {activeSectionEditorItemId === item.id ? 'Close placement' : 'Placement'}
                  </button>
                  <button type="button" class="cg-primary compact" onClick={() => void onToggleVisibility(item)} disabled={togglingId === item.id}>
                    {togglingId === item.id ? 'Updating...' : item.visibility === 'published' ? 'Move to draft' : 'Publish'}
                  </button>
                  <button type="button" class="cg-danger compact" onClick={() => void onDeleteContentItem(item)} disabled={deletingContentId === item.id}>
                    {deletingContentId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              <div class="cg-grid-3">
                <div>
                  <span class="cg-meta-label">Created by</span>
                  <p class="cg-copy">{item.author && item.author.displayName ? item.author.displayName : 'Unknown'}</p>
                </div>
                <div>
                  <span class="cg-meta-label">Updated</span>
                  <p class="cg-copy">{formatDateTime(item.updatedAt)}</p>
                </div>
                <div>
                  <span class="cg-meta-label">Sections</span>
                  <p class="cg-copy">{Array.isArray(item.appSections) && item.appSections.length ? item.appSections.join(', ') : 'Not placed yet'}</p>
                </div>
              </div>

              <div class="cg-chip-row" style={{ marginTop: '12px' }}>
                {item.url ? <a href={item.url} target="_blank" rel="noreferrer noopener" class="cg-secondary compact">Open media</a> : <span class="cg-chip is-warning">No media link</span>}
              </div>

              {activeSectionEditorItemId === item.id ? (
                <div class="cg-card" style={{ marginTop: '14px', padding: '14px' }}>
                  <div class="cg-section-head">
                    <div>
                      <h3>Mobile placement</h3>
                      <p class="cg-muted">Choose where this item should appear in the app.</p>
                    </div>
                    <button type="button" class="cg-secondary compact" onClick={onCloseContentSectionEditor}>Cancel</button>
                  </div>
                  {onRenderSectionSelector(sectionEditorValue, onUpdateSectionEditorValue)}
                  <div class="cg-button-row" style={{ marginTop: '12px' }}>
                    <span class="cg-chip">{sectionEditorValue ? `Selected: ${sectionEditorValue}` : 'No section selected yet'}</span>
                    <button type="button" class="cg-primary compact" disabled={sectionEditorSaving} onClick={() => void onSaveContentSections(item)}>
                      {sectionEditorSaving ? 'Saving...' : 'Save placement'}
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          )) : null}
        </div>
      </section>
    </section>
  );
}
