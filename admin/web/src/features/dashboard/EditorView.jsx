import './EditorView.css';

const CONTENT_LABELS = {
  audio: 'Audio',
  video: 'Video',
  playlist: 'Playlist',
  announcement: 'Announcement',
  live: 'Live',
  ad: 'Sponsored',
};

const STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  submitted: 'Submitted',
  in_review: 'In review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  fulfilled: 'Draft created',
  rejected: 'Rejected',
};

function titleCaseToken(value) {
  const token = String(value || '').replace(/_/g, ' ').trim();
  if (!token) return 'Unknown';
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function readableContentType(type) {
  return CONTENT_LABELS[type] || titleCaseToken(type);
}

function readableStatus(status, fallback) {
  return STATUS_LABELS[status] || fallback || titleCaseToken(status);
}

function countReadyAssets(createForm) {
  let count = 0;
  if (createForm.mediaUploadSessionId || createForm.url) count += 1;
  if (createForm.thumbnailUploadSessionId || createForm.thumbnailUrl) count += 1;
  if (createForm.title && createForm.description) count += 1;
  if (createForm.appSectionsCsv) count += 1;
  return count;
}

function needsPlayableAsset(type) {
  return type === 'audio' || type === 'video';
}

function policyText(policy, formatBytes) {
  if (!policy) return 'Rules load automatically from the platform.';
  const extensions = Array.isArray(policy.allowedExtensions) ? policy.allowedExtensions.join(', ') : 'approved formats';
  return `Allowed: ${extensions} • Max ${formatBytes(policy.maxBytes)}`;
}

function firstNonEmpty(...values) {
  return values.find((value) => String(value || '').trim().length > 0) || '';
}

function requestStatusClass(status) {
  if (status === 'fulfilled' || status === 'approved') return 'is-ready';
  if (status === 'changes_requested' || status === 'rejected') return 'is-warning';
  if (status === 'in_review' || status === 'submitted') return 'is-active';
  return '';
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

  const mediaKind = onResolveMediaAssetKind();
  const mediaPolicy = mediaKind ? onGetUploadPolicy(mediaKind) : null;
  const thumbnailPolicy = onGetUploadPolicy('thumbnail');
  const hasPlayableAsset = Boolean(createForm.url || createForm.mediaUploadSessionId);
  const hasThumbnail = Boolean(createForm.thumbnailUrl || createForm.thumbnailUploadSessionId);
  const readyScore = countReadyAssets(createForm);
  const canUploadMedia = needsPlayableAsset(createForm.type);
  const currentTypeLabel = readableContentType(createForm.type);
  const destinationCopy = directPublishMode
    ? 'Publish directly to the mobile app or save as a draft for final review.'
    : 'Create a clear request for the admin review queue before it becomes a mobile item.';

  return (
    <main class="studio-workspace">
      <section class="studio-hero glass-panel reveal-up">
        <div class="studio-hero-copy">
          <span class="studio-kicker">{directPublishMode ? 'Admin publishing workspace' : 'Creator request workspace'}</span>
          <h2>Upload once. Review clearly. Release confidently.</h2>
          <p>
            This workspace guides your client through content details, media upload, thumbnail, mobile placement,
            and final release status without jumping between confusing screens.
          </p>
        </div>

        <div class="studio-score-card">
          <span>Content readiness</span>
          <strong>{readyScore}/4</strong>
          <p>{destinationCopy}</p>
          <div class="studio-progress-track" aria-hidden="true">
            <span style={{ width: `${Math.min(100, readyScore * 25)}%` }} />
          </div>
        </div>
      </section>

      <section class="studio-flow-grid">
        <article class="studio-card glass-panel reveal-up studio-publish-card" style={{ animationDelay: '80ms' }}>
          <div class="studio-section-head">
            <div>
              <span class="studio-kicker">Step 1</span>
              <h3>{directPublishMode ? 'Create mobile content' : 'Submit content request'}</h3>
              <p>
                Add the core details first. The title, description, type, and release status control how the item is
                reviewed and shown in the mobile app.
              </p>
            </div>
            <span class={['studio-status-pill', directPublishMode ? 'is-ready' : 'is-active']}>
              {directPublishMode ? 'Direct publish' : 'Review queue'}
            </span>
          </div>

          <form class="studio-form" onSubmit={(event) => void onCreateContent(event)}>
            <div class="studio-field">
              <label>Title</label>
              <input
                value={createForm.title}
                onInput={(event) => { createForm.title = onReadValue(event); }}
                placeholder="Enter a clear title for the mobile app"
              />
              <small>Use the exact name your audience should see.</small>
            </div>

            <div class="studio-field">
              <label>Description</label>
              <textarea
                value={createForm.description}
                onInput={(event) => { createForm.description = onReadValue(event); }}
                rows={5}
                placeholder="Describe the worship song, video, live replay, or announcement."
              />
              <small>Keep it understandable for the mobile audience and the review team.</small>
            </div>

            <div class="studio-grid-2">
              <div class="studio-field">
                <label>Content type</label>
                <select value={createForm.type} onChange={(event) => { createForm.type = onReadValue(event); }}>
                  {contentTypes.map((type) => (
                    <option value={type} key={`create-content-type-${type}`}>{readableContentType(type)}</option>
                  ))}
                </select>
              </div>

              <div class="studio-field">
                <label>{directPublishMode ? 'Release status' : 'Requested release'}</label>
                <select value={createForm.visibility} onChange={(event) => { createForm.visibility = onReadValue(event); }}>
                  {visibilityOptions.map((visibility) => (
                    <option value={visibility} key={`create-visibility-${visibility}`}>{readableStatus(visibility)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div class="studio-divider" />

            <div class="studio-section-minihead">
              <span class="studio-kicker">Step 2</span>
              <h4>Media and artwork</h4>
              <p>Upload files from this screen or paste an approved media link when the file already exists.</p>
            </div>

            <div class="studio-field">
              <label>Media link</label>
              <input
                value={createForm.url}
                onInput={(event) => { createForm.url = onReadValue(event); }}
                placeholder="Paste storage, CDN, YouTube, audio, or video link"
              />
              <small>
                {hasPlayableAsset
                  ? 'A playable media source is attached.'
                  : canUploadMedia
                    ? 'Upload the media file below or paste a media link.'
                    : 'This content type may not need a playable media file.'}
              </small>
            </div>

            <div class="studio-upload-grid">
              <label class={['studio-upload-box', createForm.mediaUploadSessionId ? 'is-complete' : '']}>
                <span class="studio-upload-icon">{createForm.mediaUploadSessionId ? '✓' : '01'}</span>
                <strong>Upload {canUploadMedia ? currentTypeLabel.toLowerCase() : 'media'}</strong>
                <small>
                  {mediaKind
                    ? policyText(mediaPolicy, onFormatBytes)
                    : uploadPoliciesLoading
                      ? 'Loading upload rules...'
                      : 'Select Audio or Video before uploading media.'}
                </small>
                <input
                  type="file"
                  accept={props.onAcceptFromPolicy(mediaPolicy) || 'audio/*,video/*'}
                  onChange={(event) => void onHandleAssetUpload(event, 'media')}
                  disabled={uploadingAsset || !canUploadMedia}
                />
              </label>

              <label class={['studio-upload-box', createForm.thumbnailUploadSessionId ? 'is-complete' : '']}>
                <span class="studio-upload-icon">{createForm.thumbnailUploadSessionId ? '✓' : '02'}</span>
                <strong>Upload thumbnail</strong>
                <small>
                  {thumbnailPolicy
                    ? policyText(thumbnailPolicy, onFormatBytes)
                    : uploadPoliciesLoading
                      ? 'Loading thumbnail rules...'
                      : 'Use a clear image for mobile cards and player artwork.'}
                </small>
                <input
                  type="file"
                  accept={props.onAcceptFromPolicy(thumbnailPolicy) || 'image/jpeg,image/png,image/webp'}
                  onChange={(event) => void onHandleAssetUpload(event, 'thumbnail')}
                  disabled={uploadingAsset}
                />
              </label>
            </div>

            {uploadingAsset ? <div class="studio-inline-alert">Uploading asset to storage...</div> : null}

            <div class="studio-grid-2">
              <div class="studio-field">
                <label>Thumbnail URL</label>
                <input
                  value={createForm.thumbnailUrl}
                  onInput={(event) => { createForm.thumbnailUrl = onReadValue(event); }}
                  placeholder="Optional image URL override"
                />
                <small>{hasThumbnail ? 'Artwork source is ready.' : 'Use this only when the image is already hosted.'}</small>
              </div>

              <div class="studio-field">
                <label>Artist / Channel</label>
                <input
                  value={createForm.channelName}
                  onInput={(event) => { createForm.channelName = onReadValue(event); }}
                  placeholder="ClaudyGod Music Ministries"
                />
              </div>
            </div>

            <div class="studio-grid-2">
              <div class="studio-field">
                <label>Duration label</label>
                <input
                  value={createForm.duration}
                  onInput={(event) => { createForm.duration = onReadValue(event); }}
                  placeholder="Example: 45:12"
                />
              </div>

              <div class="studio-field">
                <label>Tags</label>
                <input
                  value={createForm.tagsCsv}
                  onInput={(event) => { createForm.tagsCsv = onReadValue(event); }}
                  placeholder="worship, praise, live session"
                />
              </div>
            </div>

            <div class="studio-divider" />

            <div class="studio-section-minihead">
              <span class="studio-kicker">Step 3</span>
              <h4>Mobile app placement</h4>
              <p>Select where this content appears in the mobile app. This replaces confusing manual guessing.</p>
            </div>

            <div class="studio-field">
              <label>Selected mobile sections</label>
              <input
                value={createForm.appSectionsCsv}
                onInput={(event) => { createForm.appSectionsCsv = onReadValue(event); }}
                placeholder="Choose sections below or enter section ids"
              />
              <small>Examples can include home rails, music sections, video rails, live sections, or library collections.</small>
            </div>

            <div class="studio-placement-box">
              {onRenderSectionSelector(createForm.appSectionsCsv, (nextValue) => { createForm.appSectionsCsv = nextValue; })}
            </div>

            <div class="studio-submit-row">
              <div>
                <strong>{directPublishMode ? 'Ready to save?' : 'Ready to submit?'}</strong>
                <p>
                  {directPublishMode
                    ? 'Draft keeps it private. Published sends it to the mobile feed.'
                    : 'The request enters the queue for review, approval, and draft creation.'}
                </p>
              </div>
              <button type="submit" class="studio-primary-btn" disabled={savingContent}>
                {savingContent
                  ? directPublishMode
                    ? createForm.visibility === 'published'
                      ? 'Publishing...'
                      : 'Creating draft...'
                    : 'Submitting...'
                  : directPublishMode
                    ? createForm.visibility === 'published'
                      ? 'Publish to mobile'
                      : 'Save as draft'
                    : 'Submit request'}
              </button>
            </div>
          </form>
        </article>

        <aside class="studio-side-stack">
          <article class="studio-card glass-panel reveal-up" style={{ animationDelay: '120ms' }}>
            <div class="studio-section-head compact">
              <div>
                <span class="studio-kicker">Workflow</span>
                <h3>Client-safe checklist</h3>
              </div>
            </div>

            <div class="studio-checklist">
              <div class={['studio-check-item', createForm.title && createForm.description ? 'is-done' : '']}>
                <span>{createForm.title && createForm.description ? '✓' : '1'}</span>
                <div>
                  <strong>Details added</strong>
                  <p>Title and description are clear.</p>
                </div>
              </div>
              <div class={['studio-check-item', hasPlayableAsset || !canUploadMedia ? 'is-done' : '']}>
                <span>{hasPlayableAsset || !canUploadMedia ? '✓' : '2'}</span>
                <div>
                  <strong>Media source ready</strong>
                  <p>{canUploadMedia ? 'Upload or link audio/video.' : 'No playable file required for this type.'}</p>
                </div>
              </div>
              <div class={['studio-check-item', hasThumbnail ? 'is-done' : '']}>
                <span>{hasThumbnail ? '✓' : '3'}</span>
                <div>
                  <strong>Artwork attached</strong>
                  <p>Thumbnail improves mobile presentation.</p>
                </div>
              </div>
              <div class={['studio-check-item', createForm.appSectionsCsv ? 'is-done' : '']}>
                <span>{createForm.appSectionsCsv ? '✓' : '4'}</span>
                <div>
                  <strong>Placement selected</strong>
                  <p>Choose mobile sections before publishing.</p>
                </div>
              </div>
            </div>
          </article>

          <article class="studio-card glass-panel reveal-up" style={{ animationDelay: '160ms' }}>
            <div class="studio-section-head compact">
              <div>
                <span class="studio-kicker">Review queue</span>
                <h3>{requestSummary.active} active request{requestSummary.active === 1 ? '' : 's'}</h3>
                <p>Track submissions and turn approved requests into drafts.</p>
              </div>
            </div>

            <div class="studio-mini-stats">
              {requestStatusBoard.map((card) => (
                <div class={['studio-mini-stat', `accent-${card.accent}`]} key={`request-status-${card.label}`}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section class="studio-card glass-panel reveal-up" style={{ animationDelay: '180ms' }}>
        <div class="studio-section-head">
          <div>
            <span class="studio-kicker">Requests</span>
            <h3>Submission review queue</h3>
            <p>Every request stays visible with status, creator notes, draft status, and next action.</p>
          </div>
          <span class="studio-status-pill is-active">{contentRequests.length} total</span>
        </div>

        {contentRequestLoading ? <div class="studio-empty">Loading submission requests...</div> : null}

        {!contentRequestLoading && contentRequests.length === 0 ? (
          <div class="studio-empty">
            No content requests yet. When your client submits content for review, it will appear here.
          </div>
        ) : null}

        {!contentRequestLoading && contentRequests.length > 0 ? (
          <div class="studio-request-grid">
            {contentRequests.map((request) => (
              <article class="studio-request-card" key={`request-${request.id}`}>
                <div class="studio-card-topline">
                  <div class="studio-pill-row">
                    <span class="studio-type-pill">{readableContentType(request.type)}</span>
                    <span class={['studio-status-pill', requestStatusClass(request.status)]}>
                      {readableStatus(request.status, props.humanizeToken(request.status))}
                    </span>
                  </div>
                  <span class="studio-muted-chip">{formatDateTime(request.createdAt)}</span>
                </div>

                <h4>{request.title}</h4>
                <p>{truncate(request.description, 180)}</p>

                <div class="studio-meta-grid">
                  <div>
                    <span>Requested by</span>
                    <strong>{request.requester?.displayName || request.requester?.email || 'Unknown requester'}</strong>
                  </div>
                  <div>
                    <span>Release target</span>
                    <strong>{readableStatus(request.requestedVisibility)}</strong>
                  </div>
                  <div>
                    <span>Draft</span>
                    <strong>{request.createdContentTitle || 'Not created yet'}</strong>
                  </div>
                </div>

                {request.requestNotes ? (
                  <div class="studio-note">
                    <strong>Notes</strong>
                    <p>{truncate(request.requestNotes, 180)}</p>
                  </div>
                ) : null}

                {isAdmin ? (
                  <div class="studio-request-actions">
                    <label>
                      Status
                      <select
                        value={request.status}
                        disabled={contentRequestStatusUpdatingId === request.id}
                        onChange={(event) => void onUpdateSubmissionRequestStatus(request.id, event.target.value)}
                      >
                        {contentRequestStatusOptions.map((status) => (
                          <option value={status} key={`status-${request.id}-${status}`}>
                            {readableStatus(status, props.humanizeToken(status))}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      class="studio-secondary-btn"
                      disabled={Boolean(request.createdContentId) || creatingDraftFromRequestId === request.id || request.status === 'rejected'}
                      onClick={() => void onCreateDraftFromRequest(request)}
                    >
                      {request.createdContentId
                        ? 'Draft created'
                        : creatingDraftFromRequestId === request.id
                          ? 'Creating...'
                          : 'Create draft'}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section class="studio-card glass-panel reveal-up" style={{ animationDelay: '220ms' }}>
        <div class="studio-section-head">
          <div>
            <span class="studio-kicker">Library</span>
            <h3>Published and draft content</h3>
            <p>Search, correct, publish, move to draft, adjust mobile placement, or delete content from one table-free view.</p>
          </div>
          <span class="studio-status-pill">{paginationTotal} items</span>
        </div>

        <div class="studio-filter-bar">
          <input
            value={filterState.search}
            onInput={(event) => { filterState.search = onReadValue(event); }}
            placeholder="Search title, description, creator, or media link"
          />
          <select value={filterState.type} onChange={(event) => { filterState.type = onReadValue(event); }}>
            <option value="all">All types</option>
            {contentTypes.map((type) => (
              <option value={type} key={`filter-type-${type}`}>{readableContentType(type)}</option>
            ))}
          </select>
          <select value={filterState.visibility} onChange={(event) => { filterState.visibility = onReadValue(event); }}>
            <option value="all">All status</option>
            {visibilityOptions.map((visibility) => (
              <option value={visibility} key={`filter-visibility-${visibility}`}>{readableStatus(visibility)}</option>
            ))}
          </select>
        </div>

        {contentLoading ? <div class="studio-empty">Loading content library...</div> : null}

        {!contentLoading && filteredItems.length === 0 ? (
          <div class="studio-empty">No content found. Clear the filters or create a new content item above.</div>
        ) : null}

        {!contentLoading && filteredItems.length > 0 ? (
          <div class="studio-library-list">
            {filteredItems.map((item) => (
              <article class="studio-library-card" key={item.id}>
                <div class="studio-library-main">
                  <div class="studio-card-topline">
                    <div class="studio-pill-row">
                      <span class="studio-type-pill">{readableContentType(item.type)}</span>
                      <span class={['studio-status-pill', item.visibility === 'published' ? 'is-ready' : '']}>
                        {readableStatus(item.visibility)}
                      </span>
                      {item.sourceKind ? <span class="studio-muted-chip">{item.sourceKind}</span> : null}
                    </div>
                    <span class="studio-muted-chip">Updated {formatDateTime(item.updatedAt)}</span>
                  </div>

                  <h4>{item.title}</h4>
                  <p>{truncate(item.description, 190)}</p>

                  <div class="studio-card-link-row">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer noopener">Open media</a>
                    ) : (
                      <span class="studio-muted-chip">No media link</span>
                    )}

                    {Array.isArray(item.appSections) && item.appSections.length ? (
                      <span class="studio-muted-chip">Sections: {item.appSections.join(', ')}</span>
                    ) : (
                      <span class="studio-muted-chip">No mobile placement</span>
                    )}
                  </div>

                  {activeSectionEditorItemId === item.id ? (
                    <div class="studio-placement-editor">
                      <div class="studio-section-head compact">
                        <div>
                          <h4>Mobile placement</h4>
                          <p>Choose where this item appears in the app.</p>
                        </div>
                        <button type="button" class="studio-tertiary-btn" onClick={onCloseContentSectionEditor}>
                          Close
                        </button>
                      </div>

                      {onRenderSectionSelector(sectionEditorValue, onUpdateSectionEditorValue)}

                      <div class="studio-submit-row compact">
                        <span class="studio-muted-chip">
                          {sectionEditorValue ? `Selected: ${sectionEditorValue}` : 'No section selected'}
                        </span>
                        <button
                          type="button"
                          class="studio-primary-btn compact"
                          disabled={sectionEditorSaving}
                          onClick={() => void onSaveContentSections(item)}
                        >
                          {sectionEditorSaving ? 'Saving...' : 'Save placement'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div class="studio-library-actions">
                  <button
                    type="button"
                    class="studio-secondary-btn"
                    onClick={() => void onToggleVisibility(item)}
                    disabled={togglingId === item.id}
                  >
                    {togglingId === item.id
                      ? 'Updating...'
                      : item.visibility === 'published'
                        ? 'Move to draft'
                        : 'Publish'}
                  </button>
                  <button
                    type="button"
                    class="studio-tertiary-btn"
                    onClick={() => onOpenEditContentModal(item)}
                    disabled={deletingContentId === item.id}
                  >
                    Correct
                  </button>
                  <button
                    type="button"
                    class="studio-tertiary-btn"
                    onClick={() => onToggleContentSectionEditor(item)}
                  >
                    {activeSectionEditorItemId === item.id ? 'Close placement' : 'Placement'}
                  </button>
                  <button
                    type="button"
                    class="studio-danger-btn"
                    onClick={() => void onDeleteContentItem(item)}
                    disabled={deletingContentId === item.id}
                  >
                    {deletingContentId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
