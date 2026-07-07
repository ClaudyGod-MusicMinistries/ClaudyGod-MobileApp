import React from 'react';
import { Image, View, useWindowDimensions } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { common } from '../../styles/commonStyles';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';
import { useFeedStyles } from './styles';

export function LiveNowBanner({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;

  return (
    <FadeIn delay={40}>
      <TVTouchable onPress={onPress} showFocusBorder={false}>
        <View style={styles.liveCard}>
          <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={styles.liveBgImage} />
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: compact ? 16 : 20, gap: 16 }}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
            </View>
            <View style={common.flex1}>
              <CustomText style={styles.liveLabel}>Live now</CustomText>
              <CustomText variant="title" style={[styles.liveItemTitle, { fontSize: compact ? 15.5 : 17 }]} numberOfLines={1}>{item.title}</CustomText>
              {item.subtitle ? <CustomText variant="caption" style={styles.liveItemSubtitle} numberOfLines={1}>{item.subtitle}</CustomText> : null}
            </View>
            <View style={styles.liveJoinBtn}>
              <MaterialIcons name="live-tv" size={14} color={theme.colors.onPrimary} />
              <CustomText style={styles.liveJoinText}>Join</CustomText>
            </View>
          </View>
        </View>
      </TVTouchable>
    </FadeIn>
  );
}
