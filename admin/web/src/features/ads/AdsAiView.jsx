import '../../app/AdminShell.css';

const PLACEMENT_OPTIONS = [
  { value: 'landing', label: 'Landing' },
  { value: 'home', label: 'Home' },
  { value: 'videos', label: 'Videos' },
  { value: 'player', label: 'Music player' },
  { value: 'live', label: 'Live' },
  { value: 'library', label: 'Library' },
  { value: 'search', label: 'Search' },
];

const STATUS_OPTIONS = ['draft', 'active', 'paused', 'archived'];

function statusClass(status) {
  if (status === 'active') return 'is-success';
  if (status === 'paused' || status === 'draft') return 'is-warning';
  if (status === 'archived') return 'is-info';
  return 'is-info';
}

export default function AdsAiView(props) {
  const {
    campaigns,
    adsLoading,
    adCampaignSaving,
    adSuggestionLoading,
    selectedAdCampaignId,
    adCampaignForm,
    mobileAppConfigValue,
    onReadValue,
    onSelectAdCampaign,
    onResetAdCampaignForm,
    onSaveAdCampaign,
    onGenerateAdSuggestion,
    formatDateTime,
  } = props;

  const campaignItems = Array.isArray(campaigns) ? campaigns : [];
  const monetization = mobileAppConfigValue?.monetization || {};
  const intelligence = mobileAppConfigValue?.intelligence || {};
  const placements = Array.isArray(monetization.placements) ? monetization.placements : [];

  return (
    <section class="cg-page">
      <article class="cg-panel cg-hero">
        <div class="cg-section-head">
          <div>
            <p class="cg-kicker">Ads and AI</p>
            <h2 class="cg-page-title">Manage campaigns without confusing the client.</h2>
            <p class="cg-hero-copy">
              Create sponsored placements, define campaign copy, review status, and use approved AI suggestions only when the app configuration allows it.
            </p>
          </div>
          <button type="button" class="cg-primary" onClick={onResetAdCampaignForm}>New campaign</button>
        </div>

        <div class="cg-grid-4" style={{ marginTop: '20px' }}>
          <article class="cg-stat-card"><span>Ads status</span><strong style={{ fontSize: '20px' }}>{monetization.adsEnabled ? 'Enabled' : 'Disabled'}</strong><p>Controlled from mobile structure.</p></article>
          <article class="cg-stat-card"><span>Disclosure</span><strong style={{ fontSize: '20px' }}>{monetization.disclosureLabel || 'Sponsored'}</strong><p>User-facing label.</p></article>
          <article class="cg-stat-card"><span>Assistant</span><strong style={{ fontSize: '20px' }}>{intelligence.assistantEnabled ? intelligence.providerLabel || 'Enabled' : 'Off'}</strong><p>AI support availability.</p></article>
          <article class="cg-stat-card"><span>Placements</span><strong>{placements.filter((placement) => placement.enabled).length}</strong><p>Active app surfaces.</p></article>
        </div>
      </article>

      <main class="cg-main-grid">
        <aside class="cg-panel cg-card">
          <div class="cg-section-head">
            <div><h2>Campaign library</h2><p class="cg-muted">Real campaigns from the admin API.</p></div>
            <span class="cg-chip">{campaignItems.length} campaigns</span>
          </div>

          <div class="cg-list">
            {adsLoading ? <div class="cg-empty">Loading campaigns...</div> : null}
            {!adsLoading && campaignItems.length === 0 ? <div class="cg-empty">No campaigns yet. Create the first campaign.</div> : null}
            {!adsLoading ? campaignItems.map((campaign) => (
              <button key={campaign.id} type="button" class={['cg-item', selectedAdCampaignId === campaign.id ? 'is-active' : '']} onClick={() => onSelectAdCampaign(campaign)} style={{ textAlign: 'left' }}>
                <div class="cg-item-head">
                  <div><h3>{campaign.name}</h3><p>{campaign.headline}</p></div>
                  <span class={['cg-status', statusClass(campaign.status)]}>{campaign.status}</span>
                </div>
                <div class="cg-chip-row">
                  <span class="cg-chip">{campaign.placement}</span>
                  <span class="cg-chip">{campaign.sponsorName}</span>
                  <span class="cg-chip">{campaign.ctaLabel}</span>
                </div>
                <p class="cg-muted" style={{ marginTop: '10px' }}>Updated {formatDateTime ? formatDateTime(campaign.updatedAt) : new Date(campaign.updatedAt).toLocaleString()}</p>
              </button>
            )) : null}
          </div>
        </aside>

        <section class="cg-panel cg-form-card">
          <div class="cg-section-head">
            <div><h2>{selectedAdCampaignId ? 'Edit campaign' : 'Create campaign'}</h2><p class="cg-muted">Keep every placement structured, branded, and easy to review.</p></div>
            <div class="cg-button-row">
              <button type="button" class="cg-secondary compact" disabled={adSuggestionLoading || !intelligence.adCopySuggestionsEnabled} onClick={() => void onGenerateAdSuggestion()}>
                {adSuggestionLoading ? 'Generating...' : 'Suggest copy'}
              </button>
              <button type="button" class="cg-primary compact" disabled={adCampaignSaving} onClick={() => void onSaveAdCampaign()}>
                {adCampaignSaving ? 'Saving...' : selectedAdCampaignId ? 'Save campaign' : 'Create campaign'}
              </button>
            </div>
          </div>

          <div class="cg-form">
            <div class="cg-grid-2"><label><span>Campaign name</span><input value={adCampaignForm.name} onInput={(event) => { adCampaignForm.name = onReadValue(event); }} placeholder="Easter live promotion" /></label><label><span>Sponsor name</span><input value={adCampaignForm.sponsorName} onInput={(event) => { adCampaignForm.sponsorName = onReadValue(event); }} placeholder="ClaudyGod Ministries" /></label></div>
            <div class="cg-grid-3"><label><span>Placement</span><select value={adCampaignForm.placement} onChange={(event) => { adCampaignForm.placement = onReadValue(event); }}>{PLACEMENT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><label><span>Status</span><select value={adCampaignForm.status} onChange={(event) => { adCampaignForm.status = onReadValue(event); }}>{STATUS_OPTIONS.map((status) => <option value={status} key={status}>{status}</option>)}</select></label><label><span>CTA label</span><input value={adCampaignForm.ctaLabel} onInput={(event) => { adCampaignForm.ctaLabel = onReadValue(event); }} placeholder="Open now" /></label></div>
            <label><span>Headline</span><input value={adCampaignForm.headline} onInput={(event) => { adCampaignForm.headline = onReadValue(event); }} placeholder="Live worship this Friday" /></label>
            <label><span>Body</span><textarea rows={4} value={adCampaignForm.body} onInput={(event) => { adCampaignForm.body = onReadValue(event); }} placeholder="Describe what the audience should do and why this placement matters." /></label>
            <div class="cg-grid-2"><label><span>CTA URL</span><input value={adCampaignForm.ctaUrl} onInput={(event) => { adCampaignForm.ctaUrl = onReadValue(event); }} placeholder="https://claudygod.org/live" /></label><label><span>Image URL</span><input value={adCampaignForm.imageUrl} onInput={(event) => { adCampaignForm.imageUrl = onReadValue(event); }} placeholder="https://cdn.example.com/poster.jpg" /></label></div>
            <div class="cg-grid-3"><label><span>Audience tags</span><input value={adCampaignForm.audienceTagsCsv} onInput={(event) => { adCampaignForm.audienceTagsCsv = onReadValue(event); }} placeholder="worship, youth, live" /></label><label><span>Daily budget (cents)</span><input type="number" min="0" value={adCampaignForm.dailyBudgetCents} onInput={(event) => { adCampaignForm.dailyBudgetCents = Number(onReadValue(event) || 0); }} /></label><label><span>Weight</span><input type="number" min="1" max="1000" value={adCampaignForm.weight} onInput={(event) => { adCampaignForm.weight = Number(onReadValue(event) || 100); }} /></label></div>
            <div class="cg-grid-2"><label><span>Starts at</span><input type="datetime-local" value={adCampaignForm.startsAt} onInput={(event) => { adCampaignForm.startsAt = onReadValue(event); }} /></label><label><span>Ends at</span><input type="datetime-local" value={adCampaignForm.endsAt} onInput={(event) => { adCampaignForm.endsAt = onReadValue(event); }} /></label></div>
            <label><span>Campaign notes</span><textarea rows={3} value={adCampaignForm.notes} onInput={(event) => { adCampaignForm.notes = onReadValue(event); }} placeholder="Internal notes and conversion context." /></label>
          </div>
        </section>
      </main>
    </section>
  );
}
