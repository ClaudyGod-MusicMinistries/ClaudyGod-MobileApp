import {
  DISCOVERY_CATEGORY_OPTIONS,
  MOBILE_CONTENT_TYPE_OPTIONS,
  MOBILE_LAYOUT_GROUPS,
  MOBILE_TAB_DESTINATION_OPTIONS,
  SETTINGS_DESTINATION_OPTIONS,
} from '../../shared/utils/mobileConfig';

function SectionTypeToggles({ section, onToggle }) {
  return (
    <div class="mobile-config-chip-row">
      {MOBILE_CONTENT_TYPE_OPTIONS.map((type) => {
        const active = Array.isArray(section.contentTypes) && section.contentTypes.includes(type);
        return (
          <button
            key={`${section.id}-${type}`}
            type="button"
            class={['section-selector-pill', active ? 'is-active' : '']}
            onClick={() => onToggle(type)}
          >
            <span>{type}</span>
          </button>
        );
      })}
    </div>
  );
}

function LayoutSectionCard(props) {
  const {
    section,
    groupKey,
    onReadValue,
    onUpdate,
    onToggleContentType,
    onRemove,
  } = props;

  return (
    <article class="mobile-config-section-card">
      <div class="mobile-config-card-head">
        <strong>{section.title || 'Untitled section'}</strong>
        <button type="button" class="ghost-btn compact" onClick={onRemove}>
          Remove
        </button>
      </div>

      <div class="grid-2">
        <label>
          Section title
          <input
            value={section.title || ''}
            onInput={(event) => onUpdate({ title: onReadValue(event) })}
            placeholder="Section title"
          />
        </label>
        <label>
          Section ID
          <input
            value={section.id || ''}
            onInput={(event) => onUpdate({ id: onReadValue(event) })}
            placeholder="section-id"
          />
        </label>
      </div>

      <label>
        Subtitle
        <textarea
          rows={3}
          value={section.subtitle || ''}
          onInput={(event) => onUpdate({ subtitle: onReadValue(event) })}
          placeholder="Short note for what should appear in this mobile rail."
        />
      </label>

      <div class="grid-3">
        <label>
          Action label
          <input
            value={section.actionLabel || ''}
            onInput={(event) => onUpdate({ actionLabel: onReadValue(event) })}
            placeholder="Open"
          />
        </label>
        <label>
          Destination
          <select
            value={section.destinationTab || 'home'}
            onChange={(event) => onUpdate({ destinationTab: onReadValue(event) })}
          >
            {MOBILE_TAB_DESTINATION_OPTIONS.map((option) => (
              <option value={option.value} key={`${groupKey}-${section.id}-${option.value}`}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Max items
          <input
            type="number"
            min="1"
            max="24"
            value={section.maxItems ?? 8}
            onInput={(event) => onUpdate({ maxItems: Number(onReadValue(event) || 8) })}
          />
        </label>
      </div>

      <div>
        <span class="meta-label">Content types</span>
        <SectionTypeToggles
          section={section}
          onToggle={(type) => onToggleContentType(type)}
        />
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
  } = props;

  const config = mobileAppConfigValue || {};
  const layout = config.layout || {};
  const discovery = config.discovery || {};
  const settingsHub = config.settingsHub || {};

  return (
    <section class="mobile-config-grid">
      <article class="panel glass-panel reveal-up" style={{ animationDelay: '180ms' }}>
        <div class="section-head split">
          <div>
            <h2>Mobile Experience</h2>
            <p>Control the structure of the home, video, music, library, search, and settings screens from one client-friendly workspace.</p>
          </div>
          <div class="button-row">
            <button type="button" class="ghost-btn compact" onClick={() => void onRefreshMobileConfig()}>
              Refresh
            </button>
            <button type="button" class="primary-btn compact" disabled={appConfigSaving} onClick={() => void onSaveMobileAppConfig()}>
              {appConfigSaving ? 'Saving...' : 'Save Mobile Structure'}
            </button>
          </div>
        </div>

        <div class="mobile-config-summary-grid">
          <article class="helper-card">
            <strong>Updated</strong>
            <p>{mobileAppConfigMeta?.updatedAt ? new Date(mobileAppConfigMeta.updatedAt).toLocaleString() : 'Not available yet'}</p>
          </article>
          <article class="helper-card">
            <strong>Version</strong>
            <p>{config.version || '--'}</p>
          </article>
          <article class="helper-card">
            <strong>Search shortcuts</strong>
            <p>{Array.isArray(discovery.shortcuts) ? discovery.shortcuts.length : 0} configured</p>
          </article>
          <article class="helper-card">
            <strong>Settings groups</strong>
            <p>{Array.isArray(settingsHub.sections) ? settingsHub.sections.length : 0} visible groups</p>
          </article>
        </div>

        {appConfigLoading ? (
          <div class="empty-state">Loading mobile structure...</div>
        ) : (
          <div class="helper-card">
            <strong>Immediate publishing flow</strong>
            <p>
              When your client publishes content from the content desk, the mobile app uses these same rails and destinations immediately.
            </p>
          </div>
        )}
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '210ms' }}>
        <div class="section-head split">
          <div>
            <h2>Screen Rails</h2>
            <p>Set the editorial rails for each signed-in mobile surface.</p>
          </div>
          <span class="section-badge">Layout control</span>
        </div>

        <div class="mobile-config-layout-stack">
          {MOBILE_LAYOUT_GROUPS.map((group) => {
            const sections = Array.isArray(layout[group.key]) ? layout[group.key] : [];
            return (
              <section class="mobile-config-group" key={`mobile-layout-${group.key}`}>
                <div class="mobile-config-group-head">
                  <div>
                    <h3>{group.title}</h3>
                    <p>{group.description}</p>
                  </div>
                  <button type="button" class="ghost-btn compact" onClick={() => onAddLayoutSection(group.key)}>
                    Add Section
                  </button>
                </div>

                {sections.length ? (
                  <div class="mobile-config-section-list">
                    {sections.map((section, index) => (
                      <LayoutSectionCard
                        key={`${group.key}-${section.id || index}`}
                        section={section}
                        groupKey={group.key}
                        onReadValue={onReadValue}
                        onUpdate={(patch) => onUpdateLayoutSection(group.key, index, patch)}
                        onToggleContentType={(type) => onToggleLayoutSectionContentType(group.key, index, type)}
                        onRemove={() => onRemoveLayoutSection(group.key, index)}
                      />
                    ))}
                  </div>
                ) : (
                  <div class="empty-state">No rails configured yet for this screen.</div>
                )}
              </section>
            );
          })}
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '240ms' }}>
        <div class="section-head split">
          <div>
            <h2>Search Experience</h2>
            <p>Define the visible discovery filters and the shortcuts shown inside the search screen.</p>
          </div>
          <button type="button" class="ghost-btn compact" onClick={onAddDiscoveryShortcut}>
            Add Shortcut
          </button>
        </div>

        <div class="mobile-config-group">
          <div class="mobile-config-group-head">
            <div>
              <h3>Search categories</h3>
              <p>Choose which content filters should appear at the top of the search screen.</p>
            </div>
          </div>

          <div class="mobile-config-chip-row">
            {DISCOVERY_CATEGORY_OPTIONS.map((category) => {
              const active = Array.isArray(discovery.categories) && discovery.categories.includes(category);
              return (
                <button
                  key={`discovery-category-${category}`}
                  type="button"
                  class={['section-selector-pill', active ? 'is-active' : '']}
                  onClick={() => onToggleDiscoveryCategory(category)}
                >
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div class="mobile-config-section-list" style={{ marginTop: '1rem' }}>
          {(Array.isArray(discovery.shortcuts) ? discovery.shortcuts : []).map((shortcut, index) => (
            <article class="mobile-config-section-card" key={`discovery-shortcut-${shortcut.id || index}`}>
              <div class="mobile-config-card-head">
                <strong>{shortcut.label || 'Shortcut'}</strong>
                <button type="button" class="ghost-btn compact" onClick={() => onRemoveDiscoveryShortcut(index)}>
                  Remove
                </button>
              </div>

              <div class="grid-3">
                <label>
                  Label
                  <input
                    value={shortcut.label || ''}
                    onInput={(event) => onUpdateDiscoveryShortcut(index, { label: onReadValue(event) })}
                    placeholder="Trending worship"
                  />
                </label>
                <label>
                  Icon
                  <input
                    value={shortcut.icon || ''}
                    onInput={(event) => onUpdateDiscoveryShortcut(index, { icon: onReadValue(event) })}
                    placeholder="graphic-eq"
                  />
                </label>
                <label>
                  Category
                  <select
                    value={shortcut.category || 'All'}
                    onChange={(event) => onUpdateDiscoveryShortcut(index, { category: onReadValue(event) })}
                  >
                    {DISCOVERY_CATEGORY_OPTIONS.map((option) => (
                      <option value={option} key={`shortcut-category-${shortcut.id}-${option}`}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Search query
                <input
                  value={shortcut.query || ''}
                  onInput={(event) => onUpdateDiscoveryShortcut(index, { query: onReadValue(event) })}
                  placeholder="worship"
                />
              </label>
            </article>
          ))}

          {!Array.isArray(discovery.shortcuts) || discovery.shortcuts.length === 0 ? (
            <div class="empty-state">No search shortcuts added yet.</div>
          ) : null}
        </div>
      </article>

      <article class="panel glass-panel reveal-up" style={{ animationDelay: '270ms' }}>
        <div class="section-head split">
          <div>
            <h2>Settings Portal</h2>
            <p>Control the client-facing groups and links shown inside the settings screen.</p>
          </div>
          <button type="button" class="ghost-btn compact" onClick={onAddSettingsHubSection}>
            Add Group
          </button>
        </div>

        <div class="mobile-config-layout-stack">
          {(Array.isArray(settingsHub.sections) ? settingsHub.sections : []).map((section, sectionIndex) => (
            <section class="mobile-config-group" key={`settings-group-${section.id || sectionIndex}`}>
              <div class="mobile-config-group-head">
                <div>
                  <h3>{section.title || 'Settings group'}</h3>
                  <p>Arrange the links your client wants users to open from settings.</p>
                </div>
                <button type="button" class="ghost-btn compact" onClick={() => onRemoveSettingsHubSection(sectionIndex)}>
                  Remove Group
                </button>
              </div>

              <label>
                Group title
                <input
                  value={section.title || ''}
                  onInput={(event) => onUpdateSettingsHubSection(sectionIndex, { title: onReadValue(event) })}
                  placeholder="Account"
                />
              </label>

              <div class="mobile-config-section-list">
                {(Array.isArray(section.items) ? section.items : []).map((item, itemIndex) => (
                  <article class="mobile-config-section-card" key={`settings-item-${section.id || sectionIndex}-${item.id || itemIndex}`}>
                    <div class="mobile-config-card-head">
                      <strong>{item.label || 'Link item'}</strong>
                      <button
                        type="button"
                        class="ghost-btn compact"
                        onClick={() => onRemoveSettingsHubItem(sectionIndex, itemIndex)}
                      >
                        Remove
                      </button>
                    </div>

                    <div class="grid-3">
                      <label>
                        Label
                        <input
                          value={item.label || ''}
                          onInput={(event) => onUpdateSettingsHubItem(sectionIndex, itemIndex, { label: onReadValue(event) })}
                          placeholder="Profile"
                        />
                      </label>
                      <label>
                        Icon
                        <input
                          value={item.icon || ''}
                          onInput={(event) => onUpdateSettingsHubItem(sectionIndex, itemIndex, { icon: onReadValue(event) })}
                          placeholder="person-outline"
                        />
                      </label>
                      <label>
                        Destination
                        <select
                          value={item.destination || 'tabs.settings'}
                          onChange={(event) => onUpdateSettingsHubItem(sectionIndex, itemIndex, { destination: onReadValue(event) })}
                        >
                          {SETTINGS_DESTINATION_OPTIONS.map((option) => (
                            <option value={option.value} key={`settings-destination-${item.id}-${option.value}`}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label>
                      Hint text
                      <input
                        value={item.hint || ''}
                        onInput={(event) => onUpdateSettingsHubItem(sectionIndex, itemIndex, { hint: onReadValue(event) })}
                        placeholder="Explain what this link opens."
                      />
                    </label>
                  </article>
                ))}
              </div>

              <button type="button" class="ghost-btn compact" onClick={() => onAddSettingsHubItem(sectionIndex)}>
                Add Item
              </button>
            </section>
          ))}

          {!Array.isArray(settingsHub.sections) || settingsHub.sections.length === 0 ? (
            <div class="empty-state">No settings groups configured yet.</div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
