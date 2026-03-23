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
    contentRequestStatusUpdatingId,
    creatingDraftFromRequestId,
    togglingId,
    deletingContentId,
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
    onAssignContentSections,
    onDeleteContentItem,
    formatDateTime,
    truncate,
    contentTypes,
    visibilityOptions,
    contentRequestStatusOptions,
  } = props;

  return (
    <main class="main-grid">
      <section class="panel glass-panel reveal-up" style={{ animationDelay: '140ms' }}>
        <div class="section-head">
          <div>
            <h2>{directPublishMode ? 'Upload Content' : 'Create Request'}</h2>
            <p>
              {directPublishMode
                ? 'Upload media, choose where it should appear in the mobile app, and publish from one clean workspace.'
                : 'Send one clear request so the review queue stays organized and easy to manage.'}
            </p>
          </div>
          <span class="section-badge">{directPublishMode ? 'Direct publish' : 'Request flow'}</span>
        </div>

        <form class="stack-form" onSubmit={(event) => void onCreateContent(event)}>
          <div class="field-cluster">
            <label>
              Title
              <input
                value={createForm.title}
                onInput={(event) => { createForm.title = onReadValue(event); }}
                placeholder="Example: Friday Worship Session"
              />
            </label>
          </div>

          <div class="field-cluster">
            <label>
              Description
              <textarea
                value={createForm.description}
                onInput={(event) => { createForm.description = onReadValue(event); }}
                rows={5}
                placeholder="Describe what was recorded, the audience it is for, and any editorial notes the review team should know."
              />
            </label>
          </div>

          <div class="grid-2">
            <label>
              Content type
              <select value={createForm.type} onChange={(event) => { createForm.type = onReadValue(event); }}>
                {contentTypes.map((type) => <option value={type} key={type}>{type}</option>)}
              </select>
            </label>

            <label>
              {directPublishMode ? 'Visibility' : 'Requested release'}
              <select value={createForm.visibility} onChange={(event) => { createForm.visibility = onReadValue(event); }}>
                {visibilityOptions.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}
              </select>
            </label>
          </div>

          <label>
            Media link
            <input
              value={createForm.url}
              onInput={(event) => { createForm.url = onReadValue(event); }}
              placeholder="Paste the audio or video link from storage, CDN, or external hosting"
            />
          </label>

          <div class="grid-2">
            <label>
              Upload media ({createForm.type === 'video' ? 'video' : createForm.type === 'audio' ? 'audio' : 'select audio/video first'})
              <input
                type="file"
                accept={props.onAcceptFromPolicy(onGetUploadPolicy(onResolveMediaAssetKind())) || 'audio/*,video/*'}
                onChange={(event) => void onHandleAssetUpload(event, 'media')}
                disabled={uploadingAsset || (createForm.type !== 'audio' && createForm.type !== 'video')}
              />
              <small class="subtle-text">
                {(() => {
                  const kind = onResolveMediaAssetKind();
                  const policy = kind ? onGetUploadPolicy(kind) : null;
                  if (!kind) return 'Select content type Audio or Video to upload a media file.';
                  if (!policy) return uploadPoliciesLoading ? 'Loading upload rules...' : 'Allowed formats and size limits are applied automatically.';
                  return `Allowed: ${policy.allowedExtensions.join(', ')} • Max ${onFormatBytes(policy.maxBytes)}`;
                })()}
              </small>
            </label>

            <label>
              Upload thumbnail (required for audio/video)
              <input
                type="file"
                accept={props.onAcceptFromPolicy(onGetUploadPolicy('thumbnail')) || 'image/jpeg,image/png,image/webp'}
                onChange={(event) => void onHandleAssetUpload(event, 'thumbnail')}
                disabled={uploadingAsset}
              />
              <small class="subtle-text">
                {(() => {
                  const policy = onGetUploadPolicy('thumbnail');
                  if (!policy) return uploadPoliciesLoading ? 'Loading thumbnail rules...' : 'Allowed formats and size limits are applied automatically.';
                  return `Allowed: ${policy.allowedExtensions.join(', ')} • Max ${onFormatBytes(policy.maxBytes)}`;
                })()}
              </small>
            </label>
          </div>
          {uploadingAsset ? <div class="muted-chip">Uploading to storage...</div> : null}

          <div class="grid-2">
            <div class="helper-card">
              <strong>Asset status</strong>
              <p>
                {createForm.mediaUploadSessionId || createForm.thumbnailUploadSessionId
                  ? directPublishMode
                    ? 'Uploaded files are linked to the content item and ready for the mobile feed.'
                    : 'Uploaded files are linked to this request and ready for the review queue.'
                  : directPublishMode
                  ? 'Upload media and a thumbnail to create a production-ready mobile content item.'
                    : 'Upload media and a thumbnail to keep the request complete and easy to review.'}
              </p>
            </div>

            <div class="helper-card">
              <strong>Release target</strong>
              <p>
                {directPublishMode
                  ? 'Choose draft when you still want to review in the library. Choose published when the item should flow into the mobile app immediately.'
                  : 'Choose draft when the team still needs editorial review. Choose published only when the item should go live quickly after approval.'}
              </p>
            </div>
          </div>

          <details class="dashboard-disclosure">
            <summary>Add optional metadata and placement</summary>
            <div class="dashboard-disclosure-body stack-form">
              <div class="grid-2">
                <label>
                  Thumbnail URL (optional override)
                  <input
                    value={createForm.thumbnailUrl}
                    onInput={(event) => { createForm.thumbnailUrl = onReadValue(event); }}
                    placeholder="Paste image URL for posters/cards"
                  />
                </label>

                <label>
                  Channel / Artist
                  <input
                    value={createForm.channelName}
                    onInput={(event) => { createForm.channelName = onReadValue(event); }}
                    placeholder="ClaudyGod Music Ministries"
                  />
                </label>
              </div>

              <div class="grid-2">
                <label>
                  Duration label
                  <input
                    value={createForm.duration}
                    onInput={(event) => { createForm.duration = onReadValue(event); }}
                    placeholder="45:12"
                  />
                </label>

                <label>
                  Tags (comma-separated)
                  <input
                    value={createForm.tagsCsv}
                    onInput={(event) => { createForm.tagsCsv = onReadValue(event); }}
                    placeholder="worship, live session, choir"
                  />
                </label>
              </div>

              <label>
                App sections (comma-separated)
                <input
                  value={createForm.appSectionsCsv}
                  onInput={(event) => { createForm.appSectionsCsv = onReadValue(event); }}
                  placeholder="Choose placements below or enter section ids manually"
                />
                <small class="subtle-text">
                  These placements map content to mobile home and video sections.
                </small>
              </label>
              {onRenderSectionSelector(createForm.appSectionsCsv, (nextValue) => { createForm.appSectionsCsv = nextValue; })}
            </div>
          </details>

          <div class="helper-card">
            <strong>What happens next</strong>
            <p>
              {directPublishMode
                ? 'Published items are available to the mobile app feed immediately. Draft items stay in the library until you publish them.'
                : 'After you submit, the ticket appears in the review queue. Admins can change status, request edits, and create a draft in the library when it is approved.'}
            </p>
          </div>

          <button type="submit" class="primary-btn primary-btn-large" disabled={savingContent}>
            {savingContent
              ? directPublishMode
                ? createForm.visibility === 'published'
                  ? 'Publishing...'
                  : 'Creating draft...'
                : 'Submitting ticket...'
              : directPublishMode
                ? createForm.visibility === 'published'
                  ? 'Publish to mobile app'
                  : 'Create draft content'
                : 'Send request to review queue'}
          </button>
        </form>
      </section>

      <section class="panel glass-panel reveal-up" style={{ animationDelay: '200ms' }}>
        <div class="section-head split">
          <div>
            <h2>Requests</h2>
            <p>Track incoming requests and create draft content only when each item is ready.</p>
          </div>
          <span class="section-badge">{requestSummary.active} open</span>
        </div>

        <section class="ticket-summary-grid">
          {requestStatusBoard.map((card, index) => (
            <article
              class={['stat-card', 'glass-panel', `accent-${card.accent}`]}
              style={{ animationDelay: `${index * 60}ms` }}
              key={`editor-request-stat-${card.label}`}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>

        <div class="list-wrap" style={{ marginTop: '0.9rem' }}>
          {contentRequestLoading ? <div class="empty-state">Loading submission requests...</div> : null}
          {!contentRequestLoading && contentRequests.length === 0 ? (
            <div class="empty-state">No requests yet. Submit a ticket from the left panel to start the workflow.</div>
          ) : null}

          {!contentRequestLoading ? contentRequests.map((request) => (
            <article class={['content-card', 'request-card']} key={`editor-request-${request.id}`}>
              <div class="card-top">
                <div class="pill-row">
                  <span class={['pill', `pill-${request.type}`]}>{request.type}</span>
                  <span class={['pill', request.status === 'fulfilled' ? 'pill-live' : request.status === 'changes_requested' || request.status === 'rejected' ? 'pill-draft' : 'pill-playlist']}>
                    {props.humanizeToken(request.status)}
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
                  <span class="meta-label">Draft status</span>
                  <strong>{request.createdContentTitle || 'Not created yet'}</strong>
                </div>
              </div>

              {request.requestNotes ? (
                <div class="helper-card request-note-card">
                  <strong>Review notes</strong>
                  <p>{truncate(request.requestNotes, 180)}</p>
                </div>
              ) : null}

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
                        <option value={status} key={`queue-request-status-${request.id}-${status}`}>{props.humanizeToken(status)}</option>
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
          )) : null}
        </div>
      </section>

      <section class="panel glass-panel reveal-up" style={{ animationDelay: '220ms', gridColumn: '1 / -1' }}>
        <div class="section-head split">
          <div>
            <h2>Content Library</h2>
            <p>Browse, search, and update your uploaded content.</p>
          </div>
          <div class="library-total">{paginationTotal} total items</div>
        </div>

        <div class="filter-grid">
          <input
            value={filterState.search}
            onInput={(event) => { filterState.search = onReadValue(event); }}
            placeholder="Search by title, description, creator, or link"
          />
          <select value={filterState.type} onChange={(event) => { filterState.type = onReadValue(event); }}>
            <option value="all">All types</option>
            {contentTypes.map((type) => <option value={type} key={type}>{type}</option>)}
          </select>
          <select value={filterState.visibility} onChange={(event) => { filterState.visibility = onReadValue(event); }}>
            <option value="all">All status</option>
            {visibilityOptions.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}
          </select>
        </div>

        <div class="list-wrap">
          {contentLoading ? <div class="empty-state">Loading your content library...</div> : null}
          {!contentLoading && filteredItems.length === 0 ? (
            <div class="empty-state">
              No content found. Try adjusting your search or create a new item.
            </div>
          ) : null}

          {!contentLoading ? filteredItems.map((item, index) => (
            <article class="content-card" key={item.id} style={{ animationDelay: `${index * 60}ms` }}>
              <div class="card-top">
                <div class="pill-row">
                  <span class={['pill', `pill-${item.type}`]}>{item.type}</span>
                  <span class={['pill', item.visibility === 'published' ? 'pill-live' : 'pill-draft']}>{item.visibility}</span>
                  {item.sourceKind ? <span class="pill">{item.sourceKind}</span> : null}
                </div>
                <div class="button-row">
                  <button
                    type="button"
                    class="ghost-btn compact"
                    onClick={() => void onToggleVisibility(item)}
                    disabled={togglingId === item.id}
                  >
                    {togglingId === item.id ? 'Updating...' : item.visibility === 'published' ? 'Move to Draft' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    class="ghost-btn compact"
                    onClick={() => onOpenEditContentModal(item)}
                    disabled={deletingContentId === item.id}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="ghost-btn compact"
                    onClick={() => void onAssignContentSections(item)}
                  >
                    Assign Sections
                  </button>
                  <button
                    type="button"
                    class="danger-btn"
                    onClick={() => void onDeleteContentItem(item)}
                    disabled={deletingContentId === item.id}
                  >
                    {deletingContentId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              <div class="card-body">
                <h3>{item.title}</h3>
                <p>{truncate(item.description, 190)}</p>
              </div>

              <div class="card-link-row">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer noopener" class="media-link">
                    Open media link
                  </a>
                ) : (
                  <span class="muted-chip">No media link added</span>
                )}
                {Array.isArray(item.appSections) && item.appSections.length ? (
                  <span class="muted-chip">Sections: {item.appSections.join(', ')}</span>
                ) : null}
              </div>

              <div class="meta-grid">
                <div>
                  <span class="meta-label">Created by</span>
                  <strong>{item.author && item.author.displayName ? item.author.displayName : 'Unknown'}</strong>
                </div>
                <div>
                  <span class="meta-label">Updated</span>
                  <strong>{formatDateTime(item.updatedAt)}</strong>
                </div>
              </div>
            </article>
          )) : null}
        </div>
      </section>

    </main>
  );
}
