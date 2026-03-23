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

  return (
    <main class="main-grid live-dashboard-grid">
      <section class="panel glass-panel reveal-up live-hero-panel" style={{ animationDelay: '120ms' }}>
        <div class="live-hero-copy">
          <span class="section-badge">Live Portal</span>
          <h2>Run live sessions, manage replays, and track audience response.</h2>
          <p>
            Start a live session, send alerts to subscribers, capture comments and suggestions, then keep the replay
            available in the app after the broadcast ends.
          </p>
        </div>

        <div class="live-summary-grid">
          <article class="stat-card glass-panel accent-mint">
            <span>Live now</span>
            <strong>{liveSummary.live}</strong>
          </article>
          <article class="stat-card glass-panel accent-blue">
            <span>Scheduled</span>
            <strong>{liveSummary.upcoming}</strong>
          </article>
          <article class="stat-card glass-panel accent-amber">
            <span>Replays</span>
            <strong>{liveSummary.archive}</strong>
          </article>
          <article class="stat-card glass-panel accent-rose">
            <span>Audience notes</span>
            <strong>{liveSummary.totalMessages}</strong>
          </article>
        </div>
      </section>

      <section class="panel glass-panel reveal-up live-builder-panel" style={{ animationDelay: '160ms' }}>
        <div class="section-head split">
          <div>
            <h2>{selectedSession ? 'Live Session Setup' : 'Create Live Session'}</h2>
            <p>Set the stream link, cover image, schedule, and mobile placements from one live workflow.</p>
          </div>
          <button type="button" class="ghost-btn" onClick={() => onCreateNewSession()}>
            New Session
          </button>
        </div>

        <form class="stack-form" onSubmit={(event) => void onSaveLiveSession(event)}>
          <div class="grid-2">
            <label>
              Session title
              <input
                value={liveForm.title}
                onInput={(event) => { liveForm.title = onReadValue(event); }}
                placeholder="Friday Worship Live"
              />
            </label>

            <label>
              Notification channel
              <input
                value={liveForm.channelId}
                onInput={(event) => { liveForm.channelId = onReadValue(event); }}
                placeholder="claudygod-live"
              />
            </label>
          </div>

          <label>
            Session description
            <textarea
              value={liveForm.description}
              onInput={(event) => { liveForm.description = onReadValue(event); }}
              rows={4}
              placeholder="Give viewers context for this live session, ministry focus, and what they should expect."
            />
          </label>

          <div class="grid-2">
            <label>
              Stream URL
              <input
                value={liveForm.streamUrl}
                onInput={(event) => { liveForm.streamUrl = onReadValue(event); }}
                placeholder="https://..."
              />
            </label>

            <label>
              Replay / recording URL
              <input
                value={liveForm.playbackUrl}
                onInput={(event) => { liveForm.playbackUrl = onReadValue(event); }}
                placeholder="https://..."
              />
            </label>
          </div>

          <div class="grid-2">
            <label>
              Cover image URL
              <input
                value={liveForm.coverImageUrl}
                onInput={(event) => { liveForm.coverImageUrl = onReadValue(event); }}
                placeholder="https://..."
              />
            </label>

            <label>
              Planned start time
              <input
                type="datetime-local"
                value={liveForm.scheduledFor}
                onInput={(event) => { liveForm.scheduledFor = onReadValue(event); }}
              />
            </label>
          </div>

          <div class="grid-2">
            <label>
              Viewer count
              <input
                type="number"
                min="0"
                value={liveForm.viewerCount}
                onInput={(event) => { liveForm.viewerCount = onReadValue(event); }}
                placeholder="0"
              />
            </label>

            <label>
              Tags
              <input
                value={liveForm.tagsCsv}
                onInput={(event) => { liveForm.tagsCsv = onReadValue(event); }}
                placeholder="worship, prayer, live"
              />
            </label>
          </div>

          <label>
            Mobile sections
            <input
              value={liveForm.appSectionsCsv}
              onInput={(event) => { liveForm.appSectionsCsv = onReadValue(event); }}
              placeholder="live-now, claudygod-messages"
            />
          </label>
          {onRenderSectionSelector(liveForm.appSectionsCsv, (nextValue) => { liveForm.appSectionsCsv = nextValue; })}

          <label class="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(liveForm.notifySubscribers)}
              onChange={(event) => { liveForm.notifySubscribers = onReadChecked(event); }}
            />
            <span>Notify live subscribers when the session starts</span>
          </label>

          <div class="button-row">
            <button type="submit" class="primary-btn primary-btn-large" disabled={liveSaving}>
              {liveSaving ? 'Saving...' : selectedSession ? 'Save session' : 'Create session'}
            </button>
            {selectedSession ? (
              selectedSession.status === 'live' ? (
                <button
                  type="button"
                  class="danger-btn"
                  disabled={liveTransitioningId === selectedSession.id}
                  onClick={() => void onEndLiveSession(selectedSession)}
                >
                  {liveTransitioningId === selectedSession.id ? 'Ending...' : 'End live'}
                </button>
              ) : (
                <button
                  type="button"
                  class="primary-btn"
                  disabled={liveTransitioningId === selectedSession.id}
                  onClick={() => void onStartLiveSession(selectedSession)}
                >
                  {liveTransitioningId === selectedSession.id ? 'Starting...' : 'Go live'}
                </button>
              )
            ) : null}
          </div>
        </form>
      </section>

      <section class="panel glass-panel reveal-up live-lineup-panel" style={{ animationDelay: '200ms' }}>
        <div class="section-head split">
          <div>
            <h2>Live Lineup</h2>
            <p>Keep upcoming, active, and archived sessions in one creator-facing queue.</p>
          </div>
          <span class="section-badge">{liveSummary.total} total</span>
        </div>

        <div class="list-wrap">
          {liveLoading ? <div class="empty-state">Loading live sessions...</div> : null}
          {!liveLoading && sessions.length === 0 ? (
            <div class="empty-state">Create your first live session to start the live workflow.</div>
          ) : null}

          {!liveLoading ? sessions.map((session) => (
            <article
              class={['content-card', 'live-session-card', selectedSession && selectedSession.id === session.id ? 'is-selected' : '']}
              key={`live-session-${session.id}`}
            >
              <div class="card-top">
                <div class="pill-row">
                  <span class={['pill', session.status === 'live' ? 'pill-live' : session.status === 'ended' ? 'pill-video' : 'pill-playlist']}>
                    {humanizeToken(session.status)}
                  </span>
                  <span class="muted-chip">{session.viewerCount} viewers</span>
                  <span class="muted-chip">{session.messageCount} messages</span>
                </div>
                <span class="muted-chip">
                  {session.startedAt ? formatDateTime(session.startedAt) : session.scheduledFor ? formatDateTime(session.scheduledFor) : formatDateTime(session.createdAt)}
                </span>
              </div>

              <div class="card-body">
                <h3>{session.title}</h3>
                <p>{truncate(session.description, 160)}</p>
              </div>

              <div class="meta-grid">
                <div>
                  <span class="meta-label">Channel</span>
                  <strong>{session.channelId}</strong>
                </div>
                <div>
                  <span class="meta-label">Placement</span>
                  <strong>{(session.appSections || []).slice(0, 2).join(', ') || 'live-now'}</strong>
                </div>
              </div>

              <div class="button-row">
                <button type="button" class="ghost-btn" onClick={() => void onSelectLiveSession(session)}>
                  Open
                </button>
                {session.status === 'live' ? (
                  <button
                    type="button"
                    class="danger-btn"
                    disabled={liveTransitioningId === session.id}
                    onClick={() => void onEndLiveSession(session)}
                  >
                    {liveTransitioningId === session.id ? 'Ending...' : 'End live'}
                  </button>
                ) : (
                  <button
                    type="button"
                    class="primary-btn"
                    disabled={liveTransitioningId === session.id}
                    onClick={() => void onStartLiveSession(session)}
                  >
                    {liveTransitioningId === session.id ? 'Starting...' : 'Go live'}
                  </button>
                )}
              </div>
            </article>
          )) : null}
        </div>
      </section>

      <section class="panel glass-panel reveal-up live-audience-panel" style={{ animationDelay: '240ms' }}>
        <div class="section-head split">
          <div>
            <h2>Audience Activity</h2>
            <p>Viewer comments and suggestions appear here while the session is active.</p>
          </div>
          {selectedSession ? <span class="section-badge">{selectedSession.messageCount} notes</span> : null}
        </div>

        {liveDetailLoading ? <div class="empty-state">Loading audience activity...</div> : null}
        {!liveDetailLoading && !selectedSession ? (
          <div class="empty-state">Select a live session to review the audience feed.</div>
        ) : null}

        {!liveDetailLoading && selectedSession ? (
          <div class="list-wrap disclosure-list">
            {(selectedSession.messages || []).length ? selectedSession.messages.map((message) => (
              <article class="content-card live-message-card" key={`live-message-${message.id}`}>
                <div class="card-top">
                  <div class="pill-row">
                    <span class={['pill', message.kind === 'suggestion' ? 'pill-playlist' : 'pill-video']}>
                      {humanizeToken(message.kind)}
                    </span>
                    <span class="muted-chip">{message.author.displayName}</span>
                  </div>
                  <span class="muted-chip">{formatDateTime(message.createdAt)}</span>
                </div>
                <div class="card-body">
                  <p>{message.message}</p>
                </div>
              </article>
            )) : (
              <div class="empty-state">Viewer comments and suggestions will appear here during the live session.</div>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
