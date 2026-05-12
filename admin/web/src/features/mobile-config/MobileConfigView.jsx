import '../../app/AdminShell.css';
import {
  AD_PLACEMENT_SCREEN_OPTIONS,
  DISCOVERY_CATEGORY_OPTIONS,
  MOBILE_CONTENT_TYPE_OPTIONS,
  MOBILE_LAYOUT_GROUPS,
  MOBILE_TAB_DESTINATION_OPTIONS,
  SETTINGS_DESTINATION_OPTIONS,
} from '../../shared/utils/mobileConfig';

function SectionTypeToggles({ section, onToggle }) {
  return (
    <div class="cg-pill-selector">
      {MOBILE_CONTENT_TYPE_OPTIONS.map((type) => {
        const active = Array.isArray(section.contentTypes) && section.contentTypes.includes(type);
        return (
          <button key={`${section.id}-${type}`} type="button" class={active ? 'is-active' : ''} onClick={() => onToggle(type)}>
            {type}
          </button>
        );
      })}
    </div>
  );
}

function LayoutSectionCard(props) {
  const { section, groupKey, onReadValue, onUpdate, onToggleContentType, onRemove } = props;

  return (
    <article class="cg-config-group">
      <div class="cg-section-head">
        <div><h3>{section.title || 'Untitled section'}</h3><p class="cg-muted">Controls one mobile app rail.</p></div>
        <button type="button" class="cg-danger compact" onClick={onRemove}>Remove</button>
      </div>

      <div class="cg-form">
        <div class="cg-grid-2">
          <label><span>Section title</span><input value={section.title || ''} onInput={(event) => onUpdate({ title: onReadValue(event) })} placeholder="Section title" /></label>
          <label><span>Section ID</span><input value={section.id || ''} onInput={(event) => onUpdate({ id: onReadValue(event) })} placeholder="section-id" /></label>
        </div>
        <label><span>Subtitle</span><textarea rows={3} value={section.subtitle || ''} onInput={(event) => onUpdate({ subtitle: onReadValue(event) })} placeholder="Short note for this mobile rail." /></label>
        <div class="cg-grid-3">
          <label><span>Action label</span><input value={section.actionLabel || ''} onInput={(event) => onUpdate({ actionLabel: onReadValue(event) })} placeholder="Open" /></label>
          <label><span>Destination</span><select value={section.destinationTab || 'home'} onChange={(event) => onUpdate({ destinationTab: onReadValue(event) })}>{MOBILE_TAB_DESTINATION_OPTIONS.map((option) => <option value={option.value} key={`${groupKey}-${section.id}-${option.value}`}>{option.label}</option>)}</select></label>
          <label><span>Max items</span><input type="number" min="1" max="24" value={section.maxItems ?? 8} onInput={(event) => onUpdate({ maxItems: Number(onReadValue(event) || 8) })} /></label>
        </div>
        <div><span class="cg-meta-label">Content types</span><div style={{ marginTop: '8px' }}><SectionTypeToggles section={section} onToggle={(type) => onToggleContentType(type)} /></div></div>
      </div>
    </article>
  );
}

function AdPlacementCard({ placement, index, onReadValue, onUpdate, onRemove }) {
  return (
    <article class="cg-config-group">
      <div class="cg-section-head">
        <div><h3>{placement.title || 'Sponsored placement'}</h3><p class="cg-muted">Controls one sponsored placement slot.</p></div>
        <button type="button" class="cg-danger compact" onClick={() => onRemove(index)}>Remove</button>
      </div>
      <div class="cg-form">
        <div class="cg-grid-2">
          <label><span>Placement title</span><input value={placement.title || ''} onInput={(event) => onUpdate(index, { title: onReadValue(event) })} placeholder="Sponsored placement" /></label>
          <label><span>Placement ID</span><input value={placement.id || ''} onInput={(event) => onUpdate(index, { id: onReadValue(event) })} placeholder="placement-id" /></label>
        </div>
        <label><span>Subtitle</span><textarea rows={3} value={placement.subtitle || ''} onInput={(event) => onUpdate(index, { subtitle: onReadValue(event) })} placeholder="Short note for this sponsored slot." /></label>
        <div class="cg-grid-3">
          <label><span>Screen</span><select value={placement.screen || 'home'} onChange={(event) => onUpdate(index, { screen: onReadValue(event) })}>{AD_PLACEMENT_SCREEN_OPTIONS.map((option) => <option value={option.value} key={`${placement.id}-${option.value}`}>{option.label}</option>)}</select></label>
          <label><span>Max items</span><input type="number" min="1" max="8" value={placement.maxItems ?? 1} onInput={(event) => onUpdate(index, { maxItems: Number(onReadValue(event) || 1) })} /></label>
          <label><span>Enabled</span><select value={placement.enabled === false ? 'false' : 'true'} onChange={(event) => onUpdate(index, { enabled: onReadValue(event) === 'true' })}><option value="true">Enabled</option><option value="false">Disabled</option></select></label>
        </div>
      </div>
    </article>
  );
}

export default function MobileConfigView(props) {
  const {
    mobileAppConfigValue,
    mobileAppConfigMeta,
    appConfigLoading,
    appConfigSaving,
    onRefreshMobileConfig,
    onSaveMobileAppConfig,
    onReadValue,
    onAddLayoutSection,
    onUpdateLayoutSection,
    onToggleLayoutSectionContentType,
    onRemoveLayoutSection,
    onToggleDiscoveryCategory,
    onAddDiscoveryShortcut,
    onUpdateDiscoveryShortcut,
    onRemoveDiscoveryShortcut,
    onAddSettingsHubSection,
    onUpdateSettingsHubSection,
    onRemoveSettingsHubSection,
    onAddSettingsHubItem,
    onUpdateSettingsHubItem,
    onRemoveSettingsHubItem,
    onAddAdPlacement,
    onUpdateAdPlacement,
    onRemoveAdPlacement,
    onUpdateMonetization,
    onUpdateIntelligence,
  } = props;

  const config = mobileAppConfigValue || {};
  const layout = config.layout || {};
  const discovery = config.discovery || {};
  const settingsHub = config.settingsHub || {};
  const monetization = config.monetization || {};
  const intelligence = config.intelligence || {};
  const settingsSections = Array.isArray(settingsHub.sections) ? settingsHub.sections : [];
  const shortcuts = Array.isArray(discovery.shortcuts) ? discovery.shortcuts : [];
  const placements = Array.isArray(monetization.placements) ? monetization.placements : [];

  return (
    <section class="cg-page">
      <article class="cg-panel cg-hero">
        <div class="cg-section-head">
          <div>
            <p class="cg-kicker">Mobile structure</p>
            <h2 class="cg-page-title">Control the app without editing code.</h2>
            <p class="cg-hero-copy">Manage rails, search shortcuts, settings links, sponsored placements, and assistant behavior from one client-friendly configuration workspace.</p>
          </div>
          <div class="cg-button-row">
            <button type="button" class="cg-secondary" onClick={() => void onRefreshMobileConfig()}>Refresh</button>
            <button type="button" class="cg-primary" disabled={appConfigSaving} onClick={() => void onSaveMobileAppConfig()}>{appConfigSaving ? 'Saving...' : 'Save structure'}</button>
          </div>
        </div>
        <div class="cg-grid-4" style={{ marginTop: '20px' }}>
          <article class="cg-stat-card"><span>Version</span><strong>{config.version || '--'}</strong><p>Current app config version.</p></article>
          <article class="cg-stat-card"><span>Updated</span><strong style={{ fontSize: '18px' }}>{mobileAppConfigMeta?.updatedAt ? new Date(mobileAppConfigMeta.updatedAt).toLocaleDateString() : '--'}</strong><p>Last saved config date.</p></article>
          <article class="cg-stat-card"><span>Shortcuts</span><strong>{shortcuts.length}</strong><p>Search shortcuts visible to users.</p></article>
          <article class="cg-stat-card"><span>Settings groups</span><strong>{settingsSections.length}</strong><p>Settings screen groups.</p></article>
        </div>
      </article>

      {appConfigLoading ? <div class="cg-empty">Loading mobile app configuration...</div> : null}

      <article class="cg-panel cg-card">
        <div class="cg-section-head"><div><h2>Screen rails</h2><p class="cg-muted">Define what sections appear on Home, Videos, Music, and Library screens.</p></div></div>
        <div class="cg-stack">
          {MOBILE_LAYOUT_GROUPS.map((group) => {
            const sections = Array.isArray(layout[group.key]) ? layout[group.key] : [];
            return (
              <section class="cg-config-group" key={`layout-${group.key}`}>
                <div class="cg-section-head">
                  <div><h3>{group.title}</h3><p class="cg-muted">{group.description}</p></div>
                  <button type="button" class="cg-secondary compact" onClick={() => onAddLayoutSection(group.key)}>Add section</button>
                </div>
                <div class="cg-stack">
                  {sections.map((section, index) => (
                    <LayoutSectionCard key={`${group.key}-${section.id || index}`} section={section} groupKey={group.key} onReadValue={onReadValue} onUpdate={(patch) => onUpdateLayoutSection(group.key, index, patch)} onToggleContentType={(type) => onToggleLayoutSectionContentType(group.key, index, type)} onRemove={() => onRemoveLayoutSection(group.key, index)} />
                  ))}
                  {!sections.length ? <div class="cg-empty">No rails configured for this screen yet.</div> : null}
                </div>
              </section>
            );
          })}
        </div>
      </article>

      <section class="cg-grid-2">
        <article class="cg-panel cg-card">
          <div class="cg-section-head"><div><h2>Search experience</h2><p class="cg-muted">Set discovery categories and search shortcuts.</p></div><button type="button" class="cg-secondary compact" onClick={onAddDiscoveryShortcut}>Add shortcut</button></div>
          <div class="cg-stack">
            <div><span class="cg-meta-label">Categories</span><div class="cg-pill-selector" style={{ marginTop: '8px' }}>{DISCOVERY_CATEGORY_OPTIONS.map((category) => <button key={`category-${category}`} type="button" class={Array.isArray(discovery.categories) && discovery.categories.includes(category) ? 'is-active' : ''} onClick={() => onToggleDiscoveryCategory(category)}>{category}</button>)}</div></div>
            {shortcuts.map((shortcut, index) => (
              <article class="cg-config-group" key={`shortcut-${shortcut.id || index}`}>
                <div class="cg-section-head"><div><h3>{shortcut.label || 'Shortcut'}</h3><p class="cg-muted">Shown on the search screen.</p></div><button type="button" class="cg-danger compact" onClick={() => onRemoveDiscoveryShortcut(index)}>Remove</button></div>
                <div class="cg-form">
                  <div class="cg-grid-3"><label><span>Label</span><input value={shortcut.label || ''} onInput={(event) => onUpdateDiscoveryShortcut(index, { label: onReadValue(event) })} /></label><label><span>Icon</span><input value={shortcut.icon || ''} onInput={(event) => onUpdateDiscoveryShortcut(index, { icon: onReadValue(event) })} /></label><label><span>Category</span><select value={shortcut.category || 'All'} onChange={(event) => onUpdateDiscoveryShortcut(index, { category: onReadValue(event) })}>{DISCOVERY_CATEGORY_OPTIONS.map((option) => <option value={option} key={`shortcut-${shortcut.id}-${option}`}>{option}</option>)}</select></label></div>
                  <label><span>Search query</span><input value={shortcut.query || ''} onInput={(event) => onUpdateDiscoveryShortcut(index, { query: onReadValue(event) })} /></label>
                </div>
              </article>
            ))}
            {!shortcuts.length ? <div class="cg-empty">No shortcuts configured yet.</div> : null}
          </div>
        </article>

        <article class="cg-panel cg-card">
          <div class="cg-section-head"><div><h2>Ads and assistant</h2><p class="cg-muted">Control sponsored placements and assistant behavior.</p></div><button type="button" class="cg-secondary compact" onClick={onAddAdPlacement}>Add placement</button></div>
          <div class="cg-form">
            <div class="cg-grid-2"><label><span>Ads enabled</span><select value={monetization.adsEnabled === false ? 'false' : 'true'} onChange={(event) => onUpdateMonetization({ adsEnabled: onReadValue(event) === 'true' })}><option value="true">Enabled</option><option value="false">Disabled</option></select></label><label><span>Disclosure label</span><input value={monetization.disclosureLabel || ''} onInput={(event) => onUpdateMonetization({ disclosureLabel: onReadValue(event) })} placeholder="Sponsored" /></label></div>
            <div class="cg-grid-2"><label><span>Assistant enabled</span><select value={intelligence.assistantEnabled === false ? 'false' : 'true'} onChange={(event) => onUpdateIntelligence({ assistantEnabled: onReadValue(event) === 'true' })}><option value="true">Enabled</option><option value="false">Disabled</option></select></label><label><span>Ad copy suggestions</span><select value={intelligence.adCopySuggestionsEnabled === false ? 'false' : 'true'} onChange={(event) => onUpdateIntelligence({ adCopySuggestionsEnabled: onReadValue(event) === 'true' })}><option value="true">Enabled</option><option value="false">Disabled</option></select></label></div>
            <div class="cg-grid-2"><label><span>Provider label</span><input value={intelligence.providerLabel || ''} onInput={(event) => onUpdateIntelligence({ providerLabel: onReadValue(event) })} /></label><label><span>Default tone</span><input value={intelligence.defaultTone || ''} onInput={(event) => onUpdateIntelligence({ defaultTone: onReadValue(event) })} /></label></div>
          </div>
          <div class="cg-stack" style={{ marginTop: '14px' }}>{placements.map((placement, index) => <AdPlacementCard key={`${placement.id || index}-placement`} placement={placement} index={index} onReadValue={onReadValue} onUpdate={onUpdateAdPlacement} onRemove={onRemoveAdPlacement} />)}{!placements.length ? <div class="cg-empty">No sponsored placements configured yet.</div> : null}</div>
        </article>
      </section>

      <article class="cg-panel cg-card">
        <div class="cg-section-head"><div><h2>Settings portal</h2><p class="cg-muted">Arrange the links users see inside mobile settings.</p></div><button type="button" class="cg-secondary compact" onClick={onAddSettingsHubSection}>Add group</button></div>
        <div class="cg-stack">
          {settingsSections.map((section, sectionIndex) => (
            <section class="cg-config-group" key={`settings-section-${section.id || sectionIndex}`}>
              <div class="cg-section-head"><div><h3>{section.title || 'Settings group'}</h3><p class="cg-muted">Client-facing settings group.</p></div><button type="button" class="cg-danger compact" onClick={() => onRemoveSettingsHubSection(sectionIndex)}>Remove group</button></div>
              <div class="cg-form"><label><span>Group title</span><input value={section.title || ''} onInput={(event) => onUpdateSettingsHubSection(sectionIndex, { title: onReadValue(event) })} /></label></div>
              <div class="cg-stack" style={{ marginTop: '12px' }}>{(Array.isArray(section.items) ? section.items : []).map((item, itemIndex) => (
                <article class="cg-config-group" key={`settings-item-${sectionIndex}-${item.id || itemIndex}`}>
                  <div class="cg-section-head"><div><h3>{item.label || 'Link item'}</h3><p class="cg-muted">Settings link shown to users.</p></div><button type="button" class="cg-danger compact" onClick={() => onRemoveSettingsHubItem(sectionIndex, itemIndex)}>Remove</button></div>
                  <div class="cg-form"><div class="cg-grid-3"><label><span>Label</span><input value={item.label || ''} onInput={(event) => onUpdateSettingsHubItem(sectionIndex, itemIndex, { label: onReadValue(event) })} /></label><label><span>Icon</span><input value={item.icon || ''} onInput={(event) => onUpdateSettingsHubItem(sectionIndex, itemIndex, { icon: onReadValue(event) })} /></label><label><span>Destination</span><select value={item.destination || 'tabs.settings'} onChange={(event) => onUpdateSettingsHubItem(sectionIndex, itemIndex, { destination: onReadValue(event) })}>{SETTINGS_DESTINATION_OPTIONS.map((option) => <option value={option.value} key={`dest-${item.id}-${option.value}`}>{option.label}</option>)}</select></label></div><label><span>Hint text</span><input value={item.hint || ''} onInput={(event) => onUpdateSettingsHubItem(sectionIndex, itemIndex, { hint: onReadValue(event) })} /></label></div>
                </article>
              ))}</div>
              <button type="button" class="cg-secondary compact" style={{ marginTop: '12px' }} onClick={() => onAddSettingsHubItem(sectionIndex)}>Add item</button>
            </section>
          ))}
          {!settingsSections.length ? <div class="cg-empty">No settings groups configured yet.</div> : null}
        </div>
      </article>
    </section>
  );
}
