import '../../app/AdminShell.css';

function statusClass(status) {
  if (status === 'live') return 'is-success';
  if (status === 'scheduled') return 'is-warning';
  if (status === 'ended') return 'is-info';
  return 'is-info';
}

export default function LiveView(props) {
  const {
    liveLoading,
    liveDetailLoading,
    liveSaving,
    liveTransitioningId,
    liveSummary,
    sessions,
    selectedSession,
    liveForm,
    onReadValue,
    onReadChecked,
    onSaveLiveSession,
    onCreateNewSession,
    onSelectLiveSession,
    onStartLiveSession,
    onEndLiveSession,
    onRenderSectionSelector,
    humanizeToken,
    formatDateTime,
    truncate,
  } = props;

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const messages = Array.isArray(selectedSession?.messages) ? selectedSession.messages : [];

  return (
    <section class="cg-page">
      <article class="cg-panel cg-hero">
        <div class="cg-section-head">
          <div>
            <p class="cg-kicker">Live Studio</p>
            <h2 class="cg-page-title">Schedule, start, end, and archive live ministry.</h2>
            <p class="cg-hero-copy">
              Manage stream links, cover images, mobile placement, subscriber alerts, and audience messages from one professional live desk.
            </p>
          </div>
          <button type="button" class="cg-primary" onClick={() => onCreateNewSession()}>New live session</button>
        </div>

        <div class="cg-grid-4" style={{ marginTop: '20px' }}>
          <article class="cg-stat-card"><span>Live now</span><strong>{liveSummary.live}</strong><p>Currently active sessions.</p></article>
          <article class="cg-stat-card"><span>Scheduled</span><strong>{liveSummary.upcoming}</strong><p>Upcoming ministry sessions.</p></article>
          <article class="cg-stat-card"><span>Replays</span><strong>{liveSummary.archive}</strong><p>Ended sessions available for replay.</p></article>
          <article class="cg-stat-card"><span>Audience notes</span><strong>{liveSummary.totalMessages}</strong><p>Messages and suggestions.</p></article>
        </div>
      </article>

      <main class="cg-main-grid">
        <section class="cg-panel cg-form-card">
          <div class="cg-section-head">
            <div>
              <h2>{selectedSession ? 'Edit live session' : 'Create live session'}</h2>
              <p class="cg-muted">Fill the stream details and choose where the session appears in the mobile app.</p>
            </div>
            {selectedSession ? <span class={['cg-status', statusClass(selectedSession.status)]}>{humanizeToken(selectedSession.status)}</span> : null}
          </div>

          <form class="cg-form" onSubmit={(event) => void onSaveLiveSession(event)}>
            <div class="cg-grid-2">
              <label><span>Session title</span><input value={liveForm.title} onInput={(event) => { liveForm.title = onReadValue(event); }} placeholder="Friday Worship Live" /></label>
              <label><span>Notification channel</span><input value={liveForm.channelId} onInput={(event) => { liveForm.channelId = onReadValue(event); }} placeholder="claudygod-live" /></label>
            </div>

            <label><span>Description</span><textarea value={liveForm.description} onInput={(event) => { liveForm.description = onReadValue(event); }} rows={4} placeholder="Give viewers context for this live session." /></label>

            <div class="cg-grid-2">
              <label><span>Stream URL</span><input value={liveForm.streamUrl} onInput={(event) => { liveForm.streamUrl = onReadValue(event); }} placeholder="https://..." /></label>
              <label><span>Replay URL</span><input value={liveForm.playbackUrl} onInput={(event) => { liveForm.playbackUrl = onReadValue(event); }} placeholder="https://..." /></label>
            </div>

            <div class="cg-grid-2">
              <label><span>Cover image URL</span><input value={liveForm.coverImageUrl} onInput={(event) => { liveForm.coverImageUrl = onReadValue(event); }} placeholder="https://..." /></label>
              <label><span>Planned start time</span><input type="datetime-local" value={liveForm.scheduledFor} onInput={(event) => { liveForm.scheduledFor = onReadValue(event); }} /></label>
            </div>

            <div class="cg-grid-2">
              <label><span>Viewer count</span><input type="number" min="0" value={liveForm.viewerCount} onInput={(event) => { liveForm.viewerCount = onReadValue(event); }} placeholder="0" /></label>
              <label><span>Tags</span><input value={liveForm.tagsCsv} onInput={(event) => { liveForm.tagsCsv = onReadValue(event); }} placeholder="worship, prayer, live" /></label>
            </div>

            <label><span>Mobile sections</span><input value={liveForm.appSectionsCsv} onInput={(event) => { liveForm.appSectionsCsv = onReadValue(event); }} placeholder="live-now, claudygod-messages" /></label>
            {onRenderSectionSelector(liveForm.appSectionsCsv, (nextValue) => { liveForm.appSectionsCsv = nextValue; })}

            <label style={{ display: 'flex', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={Boolean(liveForm.notifySubscribers)} onChange={(event) => { liveForm.notifySubscribers = onReadChecked(event); }} />
              <span>Notify subscribers when this session starts</span>
            </label>

            <div class="cg-button-row">
              <button type="submit" class="cg-primary" disabled={liveSaving}>{liveSaving ? 'Saving...' : selectedSession ? 'Save session' : 'Create session'}</button>
              {selectedSession ? selectedSession.status === 'live' ? (
                <button type="button" class="cg-danger" disabled={liveTransitioningId === selectedSession.id} onClick={() => void onEndLiveSession(selectedSession)}>
                  {liveTransitioningId === selectedSession.id ? 'Ending...' : 'End live'}
                </button>
              ) : (
                <button type="button" class="cg-secondary" disabled={liveTransitioningId === selectedSession.id} onClick={() => void onStartLiveSession(selectedSession)}>
                  {liveTransitioningId === selectedSession.id ? 'Starting...' : 'Go live'}
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <aside class="cg-panel cg-card">
          <div class="cg-section-head">
            <div><h2>Live lineup</h2><p class="cg-muted">Open, start, end, or edit existing sessions.</p></div>
            <span class="cg-chip">{liveSummary.total} total</span>
          </div>

          <div class="cg-list">
            {liveLoading ? <div class="cg-empty">Loading live sessions...</div> : null}
            {!liveLoading && safeSessions.length === 0 ? <div class="cg-empty">Create your first live session to start the workflow.</div> : null}
            {!liveLoading ? safeSessions.map((session) => (
              <article class="cg-item" key={`live-${session.id}`}>
                <div class="cg-item-head">
                  <div><h3>{session.title}</h3><p>{truncate(session.description, 130)}</p></div>
                  <span class={['cg-status', statusClass(session.status)]}>{humanizeToken(session.status)}</span>
                </div>
                <div class="cg-chip-row">
                  <span class="cg-chip">{session.viewerCount} viewers</span>
                  <span class="cg-chip">{session.messageCount} notes</span>
                  <span class="cg-chip">{session.startedAt ? formatDateTime(session.startedAt) : session.scheduledFor ? formatDateTime(session.scheduledFor) : formatDateTime(session.createdAt)}</span>
                </div>
                <div class="cg-button-row" style={{ marginTop: '12px' }}>
                  <button type="button" class="cg-secondary compact" onClick={() => void onSelectLiveSession(session)}>Open</button>
                  {session.status === 'live' ? (
                    <button type="button" class="cg-danger compact" disabled={liveTransitioningId === session.id} onClick={() => void onEndLiveSession(session)}>{liveTransitioningId === session.id ? 'Ending...' : 'End live'}</button>
                  ) : (
                    <button type="button" class="cg-primary compact" disabled={liveTransitioningId === session.id} onClick={() => void onStartLiveSession(session)}>{liveTransitioningId === session.id ? 'Starting...' : 'Go live'}</button>
                  )}
                </div>
              </article>
            )) : null}
          </div>
        </aside>
      </main>

      <article class="cg-panel cg-card">
        <div class="cg-section-head">
          <div><h2>Audience activity</h2><p class="cg-muted">Viewer comments and suggestions for the selected live session.</p></div>
          {selectedSession ? <span class="cg-chip">{selectedSession.messageCount} notes</span> : null}
        </div>
        {liveDetailLoading ? <div class="cg-empty">Loading audience activity...</div> : null}
        {!liveDetailLoading && !selectedSession ? <div class="cg-empty">Select a live session to review audience activity.</div> : null}
        {!liveDetailLoading && selectedSession ? (
          <div class="cg-grid-3">
            {messages.map((message) => (
              <article class="cg-item" key={`message-${message.id}`}>
                <div class="cg-item-head"><h3>{message.author?.displayName || 'Viewer'}</h3><span class="cg-chip">{humanizeToken(message.kind)}</span></div>
                <p>{message.message}</p>
                <div class="cg-chip-row" style={{ marginTop: '10px' }}><span class="cg-chip">{formatDateTime(message.createdAt)}</span></div>
              </article>
            ))}
            {!messages.length ? <div class="cg-empty cg-full">Viewer comments and suggestions will appear here during the live session.</div> : null}
          </div>
        ) : null}
      </article>
    </section>
  );
}
