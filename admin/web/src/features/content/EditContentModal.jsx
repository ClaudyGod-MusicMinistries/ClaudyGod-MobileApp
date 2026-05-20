import '../../app/AdminShell.css';

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
      class="cg-admin-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !editContentSaving) {
          onClose();
        }
      }}
    >
      <section
        class="cg-edit-modal cg-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-content-title"
      >
        <div class="cg-section-head">
          <div>
            <p class="cg-kicker">Content editor</p>
            <h2 id="edit-content-title">Edit content</h2>
            <p class="cg-muted">Update title, description, media links, placement, and visibility.</p>
          </div>
          <button
            type="button"
            class="cg-secondary compact"
            onClick={onClose}
            disabled={editContentSaving}
          >
            Close
          </button>
        </div>

        <form class="cg-form" onSubmit={(event) => void onSubmit(event)}>
          <label>
            <span>Title</span>
            <input
              value={editForm.title}
              onInput={(event) => { editForm.title = onReadValue(event); }}
              placeholder="Content title"
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              rows={4}
              value={editForm.description}
              onInput={(event) => { editForm.description = onReadValue(event); }}
              placeholder="Short description shown to users."
            />
          </label>

          <div class="cg-grid-2">
            <label>
              <span>Content type</span>
              <select value={editForm.type} onChange={(event) => { editForm.type = onReadValue(event); }}>
                {contentTypes.map((type) => <option value={type} key={`edit-${type}`}>{type}</option>)}
              </select>
            </label>
            <label>
              <span>Visibility</span>
              <select value={editForm.visibility} onChange={(event) => { editForm.visibility = onReadValue(event); }}>
                {visibilityOptions.map((v) => <option value={v} key={`edit-v-${v}`}>{v}</option>)}
              </select>
            </label>
          </div>

          <div class="cg-grid-2">
            <label>
              <span>Media URL</span>
              <input
                value={editForm.url}
                onInput={(event) => { editForm.url = onReadValue(event); }}
                placeholder="https://..."
              />
            </label>
            <label>
              <span>Thumbnail URL</span>
              <input
                value={editForm.thumbnailUrl}
                onInput={(event) => { editForm.thumbnailUrl = onReadValue(event); }}
                placeholder="https://..."
              />
            </label>
          </div>

          <div class="cg-grid-2">
            <label>
              <span>Artist or channel</span>
              <input
                value={editForm.channelName}
                onInput={(event) => { editForm.channelName = onReadValue(event); }}
                placeholder="ClaudyGod Ministries"
              />
            </label>
            <label>
              <span>Duration</span>
              <input
                value={editForm.duration}
                onInput={(event) => { editForm.duration = onReadValue(event); }}
                placeholder="12:34"
              />
            </label>
          </div>

          <div class="cg-grid-2">
            <label>
              <span>Tags</span>
              <input
                value={editForm.tagsCsv}
                onInput={(event) => { editForm.tagsCsv = onReadValue(event); }}
                placeholder="worship, sermon, youth"
              />
            </label>
            <label>
              <span>App sections</span>
              <input
                value={editForm.appSectionsCsv}
                onInput={(event) => { editForm.appSectionsCsv = onReadValue(event); }}
                placeholder="Select sections below or enter IDs"
              />
            </label>
          </div>

          {renderSectionSelector(editForm.appSectionsCsv, (nextValue) => { editForm.appSectionsCsv = nextValue; })}

          <div class="cg-button-row" style={{ justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              class="cg-secondary compact"
              onClick={onClose}
              disabled={editContentSaving}
            >
              Cancel
            </button>
            <button type="submit" class="cg-primary compact" disabled={editContentSaving}>
              {editContentSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
