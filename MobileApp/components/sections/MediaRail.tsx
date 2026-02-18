// components/sections/MediaRail.tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { useAppTheme } from '../../util/colorScheme';

interface MediaRailProps<T> {
  title: string;
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function MediaRail<T>({
  title,
  data,
  renderItem,
  actionLabel,
  onAction,
}: MediaRailProps<T>) {
  const theme = useAppTheme();

  return (
    <View style={{ marginBottom: theme.spacing.xl }}>
      <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: theme.spacing.sm, paddingRight: theme.spacing.sm }}
      >
        {data.map((item, index) => renderItem(item, index))}
      </ScrollView>
    </View>
  );
}
