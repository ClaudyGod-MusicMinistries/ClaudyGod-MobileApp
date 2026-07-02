import React from 'react';
import { Image, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { TVTouchable } from '../ui/TVTouchable';
import type { AudioTrack } from './AudioPlayer';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';

interface AudioPlayerProps {
  track: AudioTrack;
  autoPlay?: boolean;
  onClose?: () => void;
  compact?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  containerBase: {
    borderRadius: theme.radius.xl, borderWidth: 1,
    borderColor: theme.colors.border, overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  artworkBox: {
    overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: theme.colors.surfaceAlt,
  },
  pillsRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  closeBtn: {
    minHeight: 34, paddingHorizontal: 12,
    borderRadius: theme.radius.md, borderWidth: 1,
    borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText:   { color: theme.colors.text },
  artworkCenter:  { alignItems: 'center', gap: 16 },
  artworkFill:    { width: '100%', height: '100%' },
  infoWrap:       { width: '100%', alignItems: 'center', gap: 6 },
  infoTitle:      { color: theme.colors.text, textAlign: 'center' },
  infoSubtitle:   { color: theme.colors.textSecondary, textAlign: 'center' },
  navRow:         { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 2 },
  navBtn: {
    minHeight: 40, minWidth: 40,
    borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border,
  },

  // PillMeta
  pill: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  pillText:       { color: theme.colors.textSecondary },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function AudioPlayer({
  track,
  autoPlay = true,
  onClose,
  compact,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
}: AudioPlayerProps) {
  const styles    = useStyles();
  const theme     = useAppTheme();
  const isCompact = Boolean(compact);
  const artworkSize = isCompact ? 144 : 212;

  return (
    <View style={[styles.containerBase, { padding: isCompact ? theme.spacing.lg : theme.spacing.xl }]}>
      <View style={{ gap: isCompact ? 18 : 22 }}>
        <View
          style={{
            flexDirection: isCompact ? 'column' : 'row',
            alignItems: isCompact ? 'center' : 'flex-start',
            justifyContent: 'space-between',
            gap: isCompact ? 18 : 22,
          }}
        >
          <View style={styles.pillsRow}>
            <PillMeta label="Music player" />
            <PillMeta label={track.duration || '--:--'} />
          </View>

          {onClose ? (
            <TVTouchable onPress={onClose} style={styles.closeBtn} showFocusBorder={false}>
              <CustomText variant="label" style={styles.closeBtnText}>Close</CustomText>
            </TVTouchable>
          ) : null}
        </View>

        <View style={styles.artworkCenter}>
          <View
            style={[
              styles.artworkBox,
              { width: artworkSize, height: artworkSize, borderRadius: isCompact ? 20 : 22 },
            ]}
          >
            <Image source={{ uri: track.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={styles.artworkFill} />
          </View>

          <View style={styles.infoWrap}>
            <CustomText variant="hero" style={styles.infoTitle}>{track.title}</CustomText>
            <CustomText variant="subtitle" style={styles.infoSubtitle}>{track.artist || 'ClaudyGod Ministries'}</CustomText>
            <View style={styles.navRow}>
              {onPrevious ? (
                <TVTouchable
                  onPress={onPrevious}
                  disabled={!canGoPrevious}
                  style={[styles.navBtn, { opacity: canGoPrevious ? 1 : 0.48 }]}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="skip-previous" size={20} color={theme.colors.text} />
                </TVTouchable>
              ) : null}
              {onNext ? (
                <TVTouchable
                  onPress={onNext}
                  disabled={!canGoNext}
                  style={[styles.navBtn, { opacity: canGoNext ? 1 : 0.48 }]}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="skip-next" size={20} color={theme.colors.text} />
                </TVTouchable>
              ) : null}
            </View>
          </View>
        </View>

        {React.createElement('audio', {
          controls: true,
          src: track.uri,
          autoPlay,
          preload: 'metadata',
          style: {
            width: '100%',
            minHeight: 44,
            borderRadius: 12,
            filter: theme.scheme === 'dark' ? 'invert(0.95) hue-rotate(180deg)' : 'none',
          },
        })}
      </View>
    </View>
  );
}

function PillMeta({ label }: { label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.pill}>
      <CustomText variant="caption" style={styles.pillText}>{label}</CustomText>
    </View>
  );
}
