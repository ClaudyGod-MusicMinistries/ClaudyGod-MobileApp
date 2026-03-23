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
    youtubePreviewLoading,
    youtubeSyncLoading,
    youtubeImporting,
    youtubeDraftItems,
    selectedYouTubeDraftCount,
    isAdmin,
    appConfigLoading,
    appConfigSaving,
    mobileAppConfigEditor,
    mobileAppConfigMeta,
    mobileSectionCatalog,
    wordOfDayLoading,
    wordOfDaySaving,
    wordOfDayForm,
    wordOfDayCurrent,
    wordOfDayHistory,
    filterState,
    youtubeSyncState,
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
    onFetchYouTubePreview,
    onApplySmartYouTubeAssignments,
    onImportSelectedYouTubeVideos,
    onSyncYouTubeVideos,
    onUpdateYouTubeDraftItem,
    onFetchMobileAppConfig,
    onSaveMobileAppConfig,
    onFetchWordOfDayDashboard,
    onSaveWordOfDay,
    formatDateTime,
    truncate,
    parseCsvList,
    readChecked,
    contentTypes,
    visibilityOptions,
    contentRequestStatusOptions,
    youtubeSyncDefaultLimit,
  } = props;

  return (
    <main class="main-grid">
      <section class="panel glass-panel reveal-up" style={{ animationDelay: '140ms' }}>
        <div class="section-head">
          <div>
            <h2>{directPublishMode ? 'Publish Content' : 'Submission Request'}</h2>
            <p>
              {directPublishMode
                ? 'Upload media, choose the mobile app section, and create content directly from this screen.'
                : 'Send one clean ticket to the backend review queue instead of publishing directly from this screen.'}
            </p>
          </div>
          <span class="section-badge">{directPublishMode ? 'Direct Publish' : 'Request Desk'}</span>
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
                    : 'Uploaded files are linked to this request and will be traceable in backend review.'
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
            <h2>Review Queue</h2>
            <p>Track every submission ticket and create draft content only when the request is ready.</p>
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

      <section class="panel glass-panel reveal-up" style={{ animationDelay: '240ms', gridColumn: '1 / -1' }}>
        <div class="section-head split">
          <div>
            <h2>YouTube Import Tools</h2>
            <p>Keep bulk YouTube sync available without mixing it into the main submission form.</p>
          </div>
          <div class="button-row">
            <button type="button" class="ghost-btn compact" onClick={() => void onFetchYouTubePreview()} disabled={youtubePreviewLoading || youtubeSyncLoading}>
              {youtubePreviewLoading ? 'Fetching...' : 'Fetch Preview'}
            </button>
            <button type="button" class="ghost-btn compact" onClick={onApplySmartYouTubeAssignments} disabled={youtubeDraftItems.length === 0 || youtubeImporting}>
              Apply Smart Suggestions
            </button>
          </div>
        </div>

        <details class="dashboard-disclosure">
          <summary>Open curated YouTube import workflow</summary>
          <div class="dashboard-disclosure-body stack-form">
            <label>
              YouTube Channel ID (optional override)
              <input
                value={youtubeSyncState.channelId}
                onInput={(event) => { youtubeSyncState.channelId = onReadValue(event); }}
                placeholder="Use backend default if left empty"
              />
            </label>

            <div class="grid-2">
              <label>
                Max results
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={String(youtubeSyncState.maxResults)}
                  onInput={(event) => { youtubeSyncState.maxResults = Number(onReadValue(event)) || youtubeSyncDefaultLimit; }}
                />
              </label>

              <label>
                Import as
                <select value={youtubeSyncState.visibility} onChange={(event) => { youtubeSyncState.visibility = onReadValue(event); }}>
                  {visibilityOptions.map((visibility) => <option value={visibility} key={`yt-${visibility}`}>{visibility}</option>)}
                </select>
              </label>
            </div>

            <label>
              Default app sections for fetched videos (comma-separated)
              <input
                value={youtubeSyncState.appSectionsCsv}
                onInput={(event) => { youtubeSyncState.appSectionsCsv = onReadValue(event); }}
                placeholder="Choose placements below or enter section ids manually"
              />
            </label>
            {onRenderSectionSelector(youtubeSyncState.appSectionsCsv, (nextValue) => { youtubeSyncState.appSectionsCsv = nextValue; })}

            <div class="button-row">
              <button type="button" class="primary-btn" onClick={() => void onImportSelectedYouTubeVideos()} disabled={youtubeImporting || youtubePreviewLoading || youtubeDraftItems.length === 0}>
                {youtubeImporting ? 'Importing Selected...' : `Import Selected (${selectedYouTubeDraftCount})`}
              </button>
              <button type="button" class="ghost-btn compact" onClick={() => void onSyncYouTubeVideos()} disabled={youtubeSyncLoading || youtubePreviewLoading}>
                {youtubeSyncLoading ? 'Syncing YouTube...' : 'Quick Sync All'}
              </button>
            </div>

            <div class="helper-card">
              <strong>Curated import flow</strong>
              <p>
                Fetch videos, review each one, adjust sections and tags, then import only the selected items. Quick Sync All is available when you want a one-click batch import.
              </p>
            </div>

            <div class="youtube-preview-list">
              {youtubeDraftItems.length === 0 ? (
                <div class="empty-state">
                  No YouTube videos loaded yet. Click <strong>Fetch Preview</strong> to load the latest channel videos.
                </div>
              ) : youtubeDraftItems.map((video) => (
                <article class="content-card" key={`editor-yt-${video.youtubeVideoId}`}>
                  <div class="card-top">
                    <div class="pill-row">
                      <span class="pill pill-video">video</span>
                      {video.isLive ? <span class="pill pill-live">live</span> : null}
                      <span class={['pill', video.selected ? 'pill-live' : 'pill-draft']}>{video.selected ? 'selected' : 'skipped'}</span>
                    </div>
                    <span class="muted-chip">{video.duration || '--:--'}</span>
                  </div>
                  <label class="checkbox-row">
                    <input
                      type="checkbox"
                      class="inline-checkbox"
                      checked={Boolean(video.selected)}
                      onChange={(event) => onUpdateYouTubeDraftItem(video.youtubeVideoId, { selected: readChecked(event) })}
                    />
                    <span>
                      Include this video
                      <small>Selected videos will be imported into the content library.</small>
                    </span>
                  </label>
                  <div class="card-link-row">
                    <img src={video.thumbnailUrl} alt={video.title} style={{ width: '120px', height: '72px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div style={{ display: 'grid', gap: '0.35rem', flex: 1 }}>
                      <a href={video.url} target="_blank" rel="noreferrer noopener" class="media-link">Open YouTube</a>
                      <span class="muted-chip">{formatDateTime(video.publishedAt)}</span>
                    </div>
                  </div>
                  <div class="card-body">
                    <h3>{video.title}</h3>
                    <p>{truncate(video.description || '', 140)}</p>
                  </div>
                  <div class="grid-2">
                    <label>
                      App sections
                      <input
                        value={video.appSectionsCsv}
                        onInput={(event) => onUpdateYouTubeDraftItem(video.youtubeVideoId, {
                          appSectionsCsv: onReadValue(event),
                          appSections: parseCsvList(onReadValue(event)),
                        })}
                        placeholder="Choose placements below or enter section ids manually"
                      />
                    </label>
                    <label>
                      Tags
                      <input
                        value={video.tagsCsv}
                        onInput={(event) => onUpdateYouTubeDraftItem(video.youtubeVideoId, {
                          tagsCsv: onReadValue(event),
                          tags: parseCsvList(onReadValue(event)),
                        })}
                        placeholder="worship, live, message"
                      />
                    </label>
                  </div>
                  {onRenderSectionSelector(video.appSectionsCsv, (nextValue) => onUpdateYouTubeDraftItem(video.youtubeVideoId, {
                    appSectionsCsv: nextValue,
                    appSections: parseCsvList(nextValue),
                  }))}
                  <label>
                    Import visibility
                    <select
                      value={video.visibility}
                      onChange={(event) => onUpdateYouTubeDraftItem(video.youtubeVideoId, { visibility: onReadValue(event) })}
                    >
                      {visibilityOptions.map((visibility) => <option value={visibility} key={`yt-visibility-${video.youtubeVideoId}-${visibility}`}>{visibility}</option>)}
                    </select>
                  </label>
                </article>
              ))}
            </div>
          </div>
        </details>
      </section>

      {isAdmin ? (
        <>
          <section class="panel glass-panel reveal-up" style={{ animationDelay: '260ms', gridColumn: '1 / -1' }}>
            <div class="section-head split">
              <div>
                <h2>Mobile App Config</h2>
                <p>Edit backend-managed content for mobile Help, About, Privacy, Donate, and Rate screens.</p>
              </div>
              <div class="button-row">
                <button
                  type="button"
                  class="ghost-btn compact"
                  onClick={() => void onFetchMobileAppConfig()}
                  disabled={appConfigLoading || appConfigSaving}
                >
                  {appConfigLoading ? 'Loading...' : 'Reload'}
                </button>
                <button
                  type="button"
                  class="primary-btn"
                  onClick={() => void onSaveMobileAppConfig()}
                  disabled={appConfigLoading || appConfigSaving || !mobileAppConfigEditor.trim()}
                >
                  {appConfigSaving ? 'Saving config...' : 'Save Config'}
                </button>
              </div>
            </div>

            <details class="dashboard-disclosure">
              <summary>Open mobile app config editor</summary>
              <div class="dashboard-disclosure-body stack-form">
                <div class="helper-card">
                  <strong>Backend validation enabled</strong>
                  <p>
                    This JSON is validated by the API before save. Invalid fields, URLs, or missing sections will be rejected with field-level errors.
                  </p>
                </div>
                {mobileSectionCatalog.length ? (
                  <div class="helper-card">
                    <strong>Current section catalog</strong>
                    <p>
                      These placements drive the mobile home and video layouts. Use the same section ids when assigning content and fetched YouTube videos.
                    </p>
                  </div>
                ) : null}

                {mobileAppConfigMeta ? (
                  <div class="meta-grid">
                    <div>
                      <span class="meta-label">Config Key</span>
                      <strong>{mobileAppConfigMeta.key}</strong>
                    </div>
                    <div>
                      <span class="meta-label">Updated</span>
                      <strong>{formatDateTime(mobileAppConfigMeta.updatedAt)}</strong>
                    </div>
                  </div>
                ) : null}

                <label>
                  Mobile app experience config (JSON)
                  <textarea
                    rows={18}
                    value={mobileAppConfigEditor}
                    onInput={(event) => { props.onSetMobileAppConfigEditor(onReadValue(event)); }}
                    placeholder='{"version":1,"privacy":{...},"help":{...}}'
                    spellcheck={false}
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                  />
                </label>
              </div>
            </details>
          </section>

          <section class="panel glass-panel reveal-up" style={{ animationDelay: '300ms', gridColumn: '1 / -1' }}>
            <div class="section-head split">
              <div>
                <h2>Word for Today</h2>
                <p>Publish daily Bible messages to the mobile home screen and notify users by email.</p>
              </div>
              <div class="button-row">
                <button
                  type="button"
                  class="ghost-btn compact"
                  onClick={() => void onFetchWordOfDayDashboard()}
                  disabled={wordOfDayLoading || wordOfDaySaving}
                >
                  {wordOfDayLoading ? 'Loading...' : 'Reload'}
                </button>
                <button
                  type="button"
                  class="primary-btn"
                  onClick={() => void onSaveWordOfDay()}
                  disabled={wordOfDayLoading || wordOfDaySaving}
                >
                  {wordOfDaySaving ? 'Publishing...' : 'Save / Publish Word'}
                </button>
              </div>
            </div>

            <details class="dashboard-disclosure">
              <summary>Open Word for Today editor</summary>
              <div class="dashboard-disclosure-body stack-form">
                <div class="grid-2">
                  <label>
                    Title
                    <input
                      value={wordOfDayForm.title}
                      onInput={(event) => { wordOfDayForm.title = onReadValue(event); }}
                      placeholder="Word for Today"
                    />
                  </label>
                  <label>
                    Message date
                    <input
                      type="date"
                      value={wordOfDayForm.messageDate}
                      onInput={(event) => { wordOfDayForm.messageDate = onReadValue(event); }}
                    />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Passage
                    <input
                      value={wordOfDayForm.passage}
                      onInput={(event) => { wordOfDayForm.passage = onReadValue(event); }}
                      placeholder="Psalm 119:105"
                    />
                  </label>
                  <label>
                    Status
                    <select value={wordOfDayForm.status} onChange={(event) => { wordOfDayForm.status = onReadValue(event); }}>
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>
                </div>

                <label>
                  Verse
                  <textarea
                    rows={4}
                    value={wordOfDayForm.verse}
                    onInput={(event) => { wordOfDayForm.verse = onReadValue(event); }}
                    placeholder="Your word is a lamp to my feet and a light to my path."
                  />
                </label>

                <label>
                  Reflection / Message
                  <textarea
                    rows={5}
                    value={wordOfDayForm.reflection}
                    onInput={(event) => { wordOfDayForm.reflection = onReadValue(event); }}
                    placeholder="Short daily reflection for users."
                  />
                </label>

                <label class="checkbox-row" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    class="inline-checkbox"
                    checked={wordOfDayForm.notifySubscribers}
                    onChange={(event) => { wordOfDayForm.notifySubscribers = readChecked(event); }}
                  />
                  <span>
                    Email all active client users
                    <small>Queues email notifications for users with notifications enabled.</small>
                  </span>
                </label>

                {wordOfDayCurrent ? (
                  <div class="helper-card">
                    <strong>Current published word</strong>
                    <p>
                      {wordOfDayCurrent.messageDate} • {wordOfDayCurrent.passage}
                      {wordOfDayCurrent.notifiedAt ? ` • Emails queued ${formatDateTime(wordOfDayCurrent.notifiedAt)}` : ''}
                    </p>
                  </div>
                ) : null}

                <div class="list-wrap">
                  {wordOfDayHistory.length === 0 ? (
                    <div class="empty-state">No Word for Today entries yet.</div>
                  ) : wordOfDayHistory.map((entry) => (
                    <article class="content-card" key={entry.id}>
                      <div class="card-top">
                        <div class="pill-row">
                          <span class="pill">word</span>
                          <span class={['pill', entry.status === 'published' ? 'pill-live' : 'pill-draft']}>{entry.status}</span>
                        </div>
                        <span class="muted-chip">{entry.messageDate}</span>
                      </div>
                      <div class="card-body">
                        <h3>{entry.passage}</h3>
                        <p>{truncate(entry.verse, 160)}</p>
                      </div>
                      <div class="card-link-row">
                        <span class="muted-chip">{entry.notifiedAt ? `Emails queued: ${formatDateTime(entry.notifiedAt)}` : 'No email queue yet'}</span>
                        <button
                          type="button"
                          class="ghost-btn compact"
                          onClick={() => props.onLoadWordOfDayEntry(entry)}
                        >
                          Load
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </details>
          </section>
        </>
      ) : null}
    </main>
  );
}
