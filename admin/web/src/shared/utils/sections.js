import { parseCsvList } from './formatters';

export function normalizeSectionCatalog(config) {
  const sectionMap = new Map();

  const register = (screen, value) => {
    if (!value || typeof value !== 'object') return;

    const id = String(value.id || '').trim();
    const title = String(value.title || '').trim();
    if (!id || !title) return;

    const existing = sectionMap.get(id) || {
      id,
      title,
      subtitle: '',
      screens: [],
      contentTypes: [],
    };

    existing.title = title;
    existing.subtitle = String(value.subtitle || existing.subtitle || '').trim();
    if (!existing.screens.includes(screen)) {
      existing.screens.push(screen);
    }

    if (Array.isArray(value.contentTypes)) {
      existing.contentTypes = Array.from(new Set([
        ...existing.contentTypes,
        ...value.contentTypes.map((item) => String(item || '').trim()).filter(Boolean),
      ]));
    }

    sectionMap.set(id, existing);
  };

  const homeSections = Array.isArray(config?.layout?.homeSections) ? config.layout.homeSections : [];
  const videoSections = Array.isArray(config?.layout?.videoSections) ? config.layout.videoSections : [];

  homeSections.forEach((section) => register('Home', section));
  videoSections.forEach((section) => register('Videos', section));

  return Array.from(sectionMap.values());
}

export function sectionSelectionMatches(value, section) {
  const tokens = parseCsvList(value).map((item) => item.toLowerCase());
  return tokens.includes(String(section.id || '').toLowerCase()) || tokens.includes(String(section.title || '').toLowerCase());
}

export function toggleSectionSelection(value, section) {
  const current = parseCsvList(value);
  const targetIds = new Set([String(section.id || '').trim(), String(section.title || '').trim()].filter(Boolean));
  const isSelected = current.some((item) => targetIds.has(item));

  if (isSelected) {
    return current.filter((item) => !targetIds.has(item)).join(', ');
  }

  return [...current.filter(Boolean), section.id].join(', ');
}
