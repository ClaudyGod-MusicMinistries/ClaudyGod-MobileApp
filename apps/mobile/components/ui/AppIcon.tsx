import React from 'react';
import { Feather } from '@expo/vector-icons';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const ICON_ALIASES: Record<string, FeatherName> = {
  home: 'home',
  'home-filled': 'home',
  headphones: 'headphones',
  'graphic-eq': 'activity',
  'play-circle-filled': 'play-circle',
  'play-circle-outline': 'play-circle',
  'play-arrow': 'play',
  'smart-display': 'video',
  'video-library': 'film',
  'library-music': 'music',
  library: 'bookmark',
  tune: 'sliders',
  settings: 'settings',
  sliders: 'sliders',
  devices: 'monitor',
  sun: 'sun',
  moon: 'moon',
  search: 'search',
  'search-off': 'search',
  'live-tv': 'radio',
  event: 'calendar',
  people: 'users',
  'volunteer-activism': 'heart',
  'card-giftcard': 'gift',
  'help-outline': 'help-circle',
  'bug-report': 'tool',
  'high-quality': 'volume-2',
  'notifications-none': 'bell',
  'security': 'shield',
  'privacy-tip': 'shield',
  palette: 'droplet',
  'auto-stories': 'book-open',
  'menu-book': 'book-open',
  'auto-awesome': 'star',
  'wifi-off': 'wifi-off',
  'arrow-forward': 'arrow-right',
  'arrow-back': 'arrow-left',
  'chevron-right': 'chevron-right',
  'chevron-left': 'chevron-left',
  close: 'x',
  add: 'plus',
  favorite: 'heart',
  'favorite-border': 'heart',
  notifications: 'bell',
  'notifications-active': 'bell',
  explore: 'compass',
  person: 'user',
  account: 'user',
};

export type AppIconName = string;

export function AppIcon({
  name,
  size = 20,
  color,
}: {
  name: AppIconName;
  size?: number;
  color: string;
}) {
  return <Feather name={ICON_ALIASES[name] ?? 'circle'} size={size} color={color} />;
}
