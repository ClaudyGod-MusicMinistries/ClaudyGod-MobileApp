import React from 'react';
import { View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { AppImage } from '../ui/AppImage';
import { useAppTheme } from '../../util/colorScheme';
import { common } from '../../styles/commonStyles';
import type { FeedCardItem } from '../../services/contentService';
import { useFeedStyles } from './styles';
import { formatFeedMeta } from './utils';

export const CompactContentRow = React.memo(function CompactContentRow({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={styles.compactRow}>
        <View style={styles.compactThumb}>
          <AppImage uri={item.imageUrl} resizeMode="cover" style={common.imgCover} />
        </View>
        <View style={common.flex1}>
          <CustomText variant="label" style={styles.compactTitle} numberOfLines={1}>{item.title}</CustomText>
          <CustomText variant="caption" style={styles.compactSubtitle} numberOfLines={1}>{formatFeedMeta(item)}</CustomText>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
      </View>
    </TVTouchable>
  );
});
