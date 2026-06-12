import { parseCsvList } from './formatters';

interface SectionEntry {
  id: string;
  title: string;
  subtitle: string;
  screens: string[];
  contentTypes: string[];
}

interface ConfigSection {
  id?: string;
  title?: string;
  subtitle?: string;
  contentTypes?: string[];
}

interface LayoutConfig {
  homeSections?: ConfigSection[];
  videoSections?: ConfigSection[];
  playerSections?: ConfigSection[];
  librarySections?: ConfigSection[];
}

export function normalizeSectionCatalog(config?: { layout?: LayoutConfig }): SectionEntry[] {
  const sectionMap = new Map<string, SectionEntry>();

  const register = (screen: string, value: ConfigSection): void => {
    if (!value || typeof value !== 'object') return;
    const id = String(value.id || '').trim();
    const title = String(value.title || '').trim();
    if (!id || !title) return;

    const existing = sectionMap.get(id) ?? { id, title, subtitle: '', screens: [], contentTypes: [] };
    existing.title = title;
    existing.subtitle = String(value.subtitle || existing.subtitle || '').trim();
    if (!existing.screens.includes(screen)) existing.screens.push(screen);
    if (Array.isArray(value.contentTypes)) {
      existing.contentTypes = Array.from(new Set([
        ...existing.contentTypes,
        ...value.contentTypes.map((item) => String(item || '').trim()).filter(Boolean),
      ]));
    }
    sectionMap.set(id, existing);
  };

  (config?.layout?.homeSections ?? []).forEach((s) => register('Home', s));
  (config?.layout?.videoSections ?? []).forEach((s) => register('Videos', s));
  (config?.layout?.playerSections ?? []).forEach((s) => register('Music', s));
  (config?.layout?.librarySections ?? []).forEach((s) => register('Library', s));

  return Array.from(sectionMap.values());
}

export function sectionSelectionMatches(value: string, section: { id?: string; title?: string }): boolean {
  const tokens = parseCsvList(value).map((item) => item.toLowerCase());
  return tokens.includes(String(section.id || '').toLowerCase()) || tokens.includes(String(section.title || '').toLowerCase());
}

export function toggleSectionSelection(value: string, section: { id?: string; title?: string }): string {
  const current = parseCsvList(value);
  const targetIds = new Set([String(section.id || '').trim(), String(section.title || '').trim()].filter(Boolean));
  const isSelected = current.some((item) => targetIds.has(item));
  if (isSelected) return current.filter((item) => !targetIds.has(item)).join(', ');
  return [...current.filter(Boolean), section.id].join(', ');
}
