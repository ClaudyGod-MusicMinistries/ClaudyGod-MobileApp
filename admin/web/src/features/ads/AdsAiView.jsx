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

  const monetization = mobileAppConfigValue?.monetization || {};
  const intelligence = mobileAppConfigValue?.intelligence || {};
  const placements = Array.isArray(monetization.placements) ? monetization.placements : [];

  return (
    <section class="ads-grid">
      <article class="panel glass-panel reveal-up" style={{ animationDelay: '140ms' }}>
        <div class="section-head split">
          <div>
            <h2>Campaign Library</h2>
            <p>Manage sponsored placements that can appear inside the ClaudyGod mobile experience.</p>
          </div>
          <button type="button" class="ghost-btn compact" onClick={onResetAdCampaignForm}>
            New campaign
          </button>
        </div>

        <div class="ads-meta-grid">
          <article class="helper-card">
            <strong>Ads status</strong>
            <p>{monetization.adsEnabled ? 'Enabled for mobile placements' : 'Disabled in mobile config'}</p>
          </article>
          <article class="helper-card">
            <strong>Disclosure label</strong>
            <p>{monetization.disclosureLabel || 'Sponsored'}</p>
          </article>
          <article class="helper-card">
            <strong>AI assistant</strong>
            <p>{intelligence.assistantEnabled ? intelligence.providerLabel || 'Enabled' : 'Disabled'}</p>
          </article>
          <article class="helper-card">
            <strong>Live placements</strong>
            <p>{placements.filter((placement) => placement.enabled).length} active surfaces</p>
          </article>
        </div>

        {adsLoading ? (
          <div class="empty-state">Loading campaigns...</div>
        ) : campaigns.length ? (
          <div class="ads-list">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                type="button"
                class={['ads-card', selectedAdCampaignId === campaign.id ? 'is-active' : '']}
                onClick={() => onSelectAdCampaign(campaign)}
              >
                <div class="ads-card-head">
                  <strong>{campaign.name}</strong>
                  <span class={['ads-status-badge', `is-${campaign.status}`]}>{campaign.status}</span>
                </div>
                <p>{campaign.headline}</p>
                <div class="ads-chip-row">
                  <span class="hero-chip">{campaign.placement}</span>
                  <span class="hero-chip">{campaign.sponsorName}</span>
                  <span class="hero-chip">{campaign.ctaLabel}</span>
                </div>
                <small>
                  Updated {formatDateTime ? formatDateTime(campaign.updatedAt) : new Date(campaign.updatedAt).toLocaleString()}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <div class="empty-state">No campaigns yet. Create the first sponsored placement for the app.</div>
        )}
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '180ms' }}>
        <div class="section-head split">
          <div>
            <h2>{selectedAdCampaignId ? 'Edit Campaign' : 'Create Campaign'}</h2>
            <p>Keep every sponsored placement structured, branded, and ready for the mobile app feed.</p>
          </div>
          <div class="button-row">
            <button
              type="button"
              class="ghost-btn compact"
              disabled={adSuggestionLoading || !intelligence.adCopySuggestionsEnabled}
              onClick={() => void onGenerateAdSuggestion()}
            >
              {adSuggestionLoading ? 'Generating...' : 'Suggest with AI'}
            </button>
            <button
              type="button"
              class="primary-btn compact"
              disabled={adCampaignSaving}
              onClick={() => void onSaveAdCampaign()}
            >
              {adCampaignSaving ? 'Saving...' : selectedAdCampaignId ? 'Save campaign' : 'Create campaign'}
            </button>
          </div>
        </div>

        <div class="ads-form-stack">
          <div class="grid-2">
            <label>
              Campaign name
              <input
                value={adCampaignForm.name}
                onInput={(event) => {
                  adCampaignForm.name = onReadValue(event);
                }}
                placeholder="Easter live promotion"
              />
            </label>

            <label>
              Sponsor name
              <input
                value={adCampaignForm.sponsorName}
                onInput={(event) => {
                  adCampaignForm.sponsorName = onReadValue(event);
                }}
                placeholder="ClaudyGod Ministries"
              />
            </label>
          </div>

          <div class="grid-3">
            <label>
              Placement
              <select
                value={adCampaignForm.placement}
                onChange={(event) => {
                  adCampaignForm.placement = onReadValue(event);
                }}
              >
                {PLACEMENT_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                value={adCampaignForm.status}
                onChange={(event) => {
                  adCampaignForm.status = onReadValue(event);
                }}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option value={status} key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              CTA label
              <input
                value={adCampaignForm.ctaLabel}
                onInput={(event) => {
                  adCampaignForm.ctaLabel = onReadValue(event);
                }}
                placeholder="Open now"
              />
            </label>
          </div>

          <label>
            Headline
            <input
              value={adCampaignForm.headline}
              onInput={(event) => {
                adCampaignForm.headline = onReadValue(event);
              }}
              placeholder="Live worship this Friday"
            />
          </label>

          <label>
            Body
            <textarea
              rows={4}
              value={adCampaignForm.body}
              onInput={(event) => {
                adCampaignForm.body = onReadValue(event);
              }}
              placeholder="Describe what the audience should do and why this placement matters."
            />
          </label>

          <div class="grid-2">
            <label>
              CTA URL
              <input
                value={adCampaignForm.ctaUrl}
                onInput={(event) => {
                  adCampaignForm.ctaUrl = onReadValue(event);
                }}
                placeholder="https://claudygod.org/live"
              />
            </label>

            <label>
              Image URL
              <input
                value={adCampaignForm.imageUrl}
                onInput={(event) => {
                  adCampaignForm.imageUrl = onReadValue(event);
                }}
                placeholder="https://cdn.example.com/poster.jpg"
              />
            </label>
          </div>

          <div class="grid-3">
            <label>
              Audience tags
              <input
                value={adCampaignForm.audienceTagsCsv}
                onInput={(event) => {
                  adCampaignForm.audienceTagsCsv = onReadValue(event);
                }}
                placeholder="worship, youth, live"
              />
            </label>

            <label>
              Daily budget (cents)
              <input
                type="number"
                min="0"
                value={adCampaignForm.dailyBudgetCents}
                onInput={(event) => {
                  adCampaignForm.dailyBudgetCents = Number(onReadValue(event) || 0);
                }}
              />
            </label>

            <label>
              Weight
              <input
                type="number"
                min="1"
                max="1000"
                value={adCampaignForm.weight}
                onInput={(event) => {
                  adCampaignForm.weight = Number(onReadValue(event) || 100);
                }}
              />
            </label>
          </div>

          <div class="grid-2">
            <label>
              Starts at
              <input
                type="datetime-local"
                value={adCampaignForm.startsAt}
                onInput={(event) => {
                  adCampaignForm.startsAt = onReadValue(event);
                }}
              />
            </label>

            <label>
              Ends at
              <input
                type="datetime-local"
                value={adCampaignForm.endsAt}
                onInput={(event) => {
                  adCampaignForm.endsAt = onReadValue(event);
                }}
              />
            </label>
          </div>

          <label>
            Campaign notes
            <textarea
              rows={3}
              value={adCampaignForm.notes}
              onInput={(event) => {
                adCampaignForm.notes = onReadValue(event);
              }}
              placeholder="Internal notes and conversion context for AI suggestions."
            />
          </label>
        </div>
      </article>
    </section>
  );
}
