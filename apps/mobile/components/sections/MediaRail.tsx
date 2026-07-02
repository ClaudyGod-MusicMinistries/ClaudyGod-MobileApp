// components/sections/MediaRail.tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { makeStyles } from '../../styles/makeStyles';

interface MediaRailProps<T> {
  title: string;
  data: T[];
  renderItem: (_item: T, _index: number) => React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

const useStyles = makeStyles((theme) => ({
  outerWrap:     { marginBottom: theme.layout.sectionGapLarge },
  scrollContent: { paddingVertical: theme.spacing.sm, paddingRight: theme.spacing.md },
}));

export function MediaRail<T>({
  title,
  data,
  renderItem,
  actionLabel,
  onAction,
}: MediaRailProps<T>) {
  const styles = useStyles();

  return (
    <View style={styles.outerWrap}>
      <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {data.map((item, index) => renderItem(item, index))}
      </ScrollView>
    </View>
  );
}
