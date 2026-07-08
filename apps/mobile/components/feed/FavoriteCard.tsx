import React from 'react';
import { View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { SurfaceCard } from '../ui/SurfaceCard';
import { TVTouchable } from '../ui/TVTouchable';
import { AppButton } from '../ui/AppButton';
import { AppImage } from '../ui/AppImage';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import type { FeedCardItem } from '../../services/contentService';

const useStyles = makeStyles((theme) => ({
  favCardPad:        { flex: 1, padding: theme.spacing.sm },
  favCoverWrap:      { borderRadius: theme.radius.lg, overflow: 'hidden', aspectRatio: 1 },
  favCoverImg:       { width: '100%', height: '100%' },
  favMeta:           { marginTop: 10, gap: 4 },
  favTitle:          { color: theme.colors.text },
  favSubtitle:       { color: theme.colors.textSecondary },
  favActions:        { flexDirection: 'row', gap: 7, marginTop: 10 },
  playBtnFill:       { flex: 1 },
  iconBtn:           { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconBtnDefault:    { backgroundColor: theme.colors.subtleFill, borderColor: theme.colors.border },
  iconBtnRemoving:   { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: theme.colors.danger },
  typeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText:{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
}));

function TypeBadge({ type }: { type: string }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const map: Record<string, { icon: React.ComponentProps<typeof MaterialIcons>['name']; color: string }> = {
    audio:    { icon: 'music-note',    color: theme.colors.primary },
    video:    { icon: 'smart-display', color: theme.colors.info    },
    live:     { icon: 'live-tv',       color: theme.colors.danger  },
    playlist: { icon: 'queue-music',   color: theme.colors.warning },
  };
  const entry = map[type] ?? { icon: 'star' as const, color: theme.colors.primary };
  return (
    <View style={[styles.typeBadge, { backgroundColor: `${entry.color}14` }]}>
      <MaterialIcons name={entry.icon} size={11} color={entry.color} />
      <CustomText variant="caption" style={[styles.typeBadgeText, { color: entry.color }]}>
        {type}
      </CustomText>
    </View>
  );
}

export const FavoriteCard = React.memo(function FavoriteCard({
  item, onPlay, onShare, onRemove, removing,
}: {
  item: FeedCardItem;
  onPlay: () => void;
  onShare: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <SurfaceCard tone="subtle" style={styles.favCardPad}>
      <TVTouchable onPress={onPlay} showFocusBorder={false}>
        <View style={styles.favCoverWrap}>
          <AppImage
            uri={item.imageUrl}
            style={styles.favCoverImg}
            resizeMode="cover"
          />
        </View>
      </TVTouchable>
      <View style={styles.favMeta}>
        <TypeBadge type={item.type} />
        <CustomText variant="label" style={styles.favTitle} numberOfLines={2}>{item.title}</CustomText>
        <CustomText variant="caption" style={styles.favSubtitle} numberOfLines={1}>
          {[item.subtitle, item.duration].filter(Boolean).join(' · ')}
        </CustomText>
      </View>
      <View style={styles.favActions}>
        <AppButton
          title="Play" size="sm" onPress={onPlay} style={styles.playBtnFill}
          leftIcon={<MaterialIcons name="play-arrow" size={16} color="#FFFFFF" />}
        />
        <TVTouchable onPress={onShare} showFocusBorder={false} style={[styles.iconBtn, styles.iconBtnDefault]}>
          <MaterialIcons name="ios-share" size={15} color={theme.colors.textSecondary} />
        </TVTouchable>
        <TVTouchable
          onPress={onRemove}
          showFocusBorder={false}
          style={[styles.iconBtn, removing ? styles.iconBtnRemoving : styles.iconBtnDefault]}
        >
          <MaterialIcons name="favorite" size={15} color={removing ? theme.colors.danger : theme.colors.textMuted} />
        </TVTouchable>
      </View>
    </SurfaceCard>
  );
});
