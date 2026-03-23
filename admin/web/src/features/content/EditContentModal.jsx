export default function EditContentModal(props) {
  const {
    editContentSaving,
    editForm,
    contentTypes,
    visibilityOptions,
    onClose,
    onSubmit,
    onReadValue,
    renderSectionSelector,
  } = props;

  return (
    <div
      class="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !editContentSaving) {
          onClose();
        }
      }}
    >
      <section class="modal-card glass-panel" role="dialog" aria-modal="true" aria-labelledby="edit-content-title">
        <div class="section-head split">
          <div>
            <h2 id="edit-content-title">Edit Content</h2>
            <p>Update title, description, media links, tags, and mobile app placement for this item.</p>
          </div>
          <div class="button-row">
            <button
              type="button"
              class="ghost-btn compact"
              onClick={onClose}
              disabled={editContentSaving}
            >
              Close
            </button>
          </div>
        </div>

        <form class="stack-form" onSubmit={(event) => void onSubmit(event)}>
          <div class="field-cluster">
            <label>
              Title
              <input
                value={editForm.title}
                onInput={(event) => { editForm.title = onReadValue(event); }}
                placeholder="Content title"
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              rows={5}
              value={editForm.description}
              onInput={(event) => { editForm.description = onReadValue(event); }}
              placeholder="Short description shown to users."
            />
          </label>

          <div class="grid-2">
            <label>
              Content type
              <select value={editForm.type} onChange={(event) => { editForm.type = onReadValue(event); }}>
                {contentTypes.map((type) => <option value={type} key={`edit-${type}`}>{type}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={editForm.visibility} onChange={(event) => { editForm.visibility = onReadValue(event); }}>
                {visibilityOptions.map((visibility) => <option value={visibility} key={`edit-v-${visibility}`}>{visibility}</option>)}
              </select>
            </label>
          </div>

          <div class="grid-2">
            <label>
              Media URL
              <input
                value={editForm.url}
                onInput={(event) => { editForm.url = onReadValue(event); }}
                placeholder="https://..."
              />
            </label>
            <label>
              Thumbnail URL
              <input
                value={editForm.thumbnailUrl}
                onInput={(event) => { editForm.thumbnailUrl = onReadValue(event); }}
                placeholder="https://... (required for audio/video)"
              />
            </label>
          </div>

          <div class="grid-2">
            <label>
              Channel / Artist Name (optional)
              <input
                value={editForm.channelName}
                onInput={(event) => { editForm.channelName = onReadValue(event); }}
                placeholder="ClaudyGod Ministries"
              />
            </label>
            <label>
              Duration label (optional)
              <input
                value={editForm.duration}
                onInput={(event) => { editForm.duration = onReadValue(event); }}
                placeholder="12:34"
              />
            </label>
          </div>

          <div class="grid-2">
            <label>
              Tags (comma-separated)
              <input
                value={editForm.tagsCsv}
                onInput={(event) => { editForm.tagsCsv = onReadValue(event); }}
                placeholder="worship, sermon, youth"
              />
            </label>
            <label>
              App sections (comma-separated)
              <input
                value={editForm.appSectionsCsv}
                onInput={(event) => { editForm.appSectionsCsv = onReadValue(event); }}
                placeholder="Choose placements below or enter section ids manually"
              />
            </label>
          </div>
          {renderSectionSelector(editForm.appSectionsCsv, (nextValue) => { editForm.appSectionsCsv = nextValue; })}

          <div class="helper-card">
            <strong>Validation rules</strong>
            <p>
              Audio and video items require both a media URL and a thumbnail URL. URLs must start with `http://` or `https://`. Tags and sections are deduplicated before save.
            </p>
          </div>

          <div class="button-row modal-actions">
            <button
              type="button"
              class="ghost-btn compact"
              onClick={onClose}
              disabled={editContentSaving}
            >
              Cancel
            </button>
            <button type="submit" class="primary-btn" disabled={editContentSaving}>
              {editContentSaving ? 'Saving changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
