import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

import { ContentCard } from './ContentCard';
import { ThemeProvider } from '../../context/ThemeProvider';
import { DownloadsProvider } from '../../context/DownloadsContext';
import type { FeedCardItem } from '../../services/contentService';

function makeItem(overrides: Partial<FeedCardItem> = {}): FeedCardItem {
  return {
    id: 'item-1',
    title: 'Sunday Service',
    subtitle: 'Live worship',
    description: '',
    duration: '12:34',
    imageUrl: 'https://example.com/a.jpg',
    type: 'audio',
    ...overrides,
  };
}

function withTheme(children: React.ReactNode) {
  return (
    <ThemeProvider>
      <DownloadsProvider>{children}</DownloadsProvider>
    </ThemeProvider>
  );
}

describe('ContentCard', () => {
  it('renders the item title and calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(withTheme(<ContentCard item={makeItem()} onPress={onPress} />));

    expect(screen.getByText('Sunday Service')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reflects a changed item prop after re-render, despite React.memo', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(withTheme(<ContentCard item={makeItem({ title: 'First title' })} onPress={onPress} />));
    expect(screen.getByText('First title')).toBeTruthy();

    await rerender(withTheme(<ContentCard item={makeItem({ title: 'Second title' })} onPress={onPress} />));

    expect(screen.queryByText('First title')).toBeNull();
    expect(screen.getByText('Second title')).toBeTruthy();
  });
});
