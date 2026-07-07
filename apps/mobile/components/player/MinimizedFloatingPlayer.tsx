import React from 'react';
import { Image, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePlayer } from '../../context/PlayerContext';
import { usePlayerProgress } from '../../context/PlayerProgressContext';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { CustomText } from '../CustomText';
import { buildPlayerRoute } from '../../util/playerRoute';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  floatingWrap: {
    position: 'absolute', bottom: 94, left: 12, right: 12, minHeight: 64,
    borderRadius: theme.radius.xl, overflow: 'hidden', zIndex: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  innerRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 9, gap: 10,
    backgroundColor: 'rgba(16,10,28,0.96)',
  },
  progressTrack: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, backgroundColor: 'rgba(247,242,255,0.08)',
  },
  progressFillBase: {
    position: 'absolute', bottom: 0, left: 0,
    height: 2, backgroundColor: theme.colors.primary,
  },
  artworkBtn: {
    width: 46, height: 46, borderRadius: 14, overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  artworkImg:   { width: 46, height: 46 },
  titleBtn:     { flex: 1, minWidth: 0 },
  titleText:    { color: theme.colors.text, fontSize: 12.5 },
  subtitleText: { color: theme.colors.textSecondary, marginTop: 2, fontSize: 10.5 },
  controlsRow:  { flexDirection: 'row', gap: 6, alignItems: 'center' },
  playBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill,
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function MinimizedFloatingPlayer() {
  const styles = useStyles();
  const { player, resume, pause, maximize, close } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const theme = useAppTheme();
  const router = useRouter();

  if (!player.content || !player.isMinimized) {
    return null;
  }

  const progressPercentage = duration > 0
    ? Math.min(100, (currentTime / duration) * 100)
    : 0;
  const isAudio = player.type === 'audio';
  const hasControls = Boolean(player.controls);

  const handleExpand = () => {
    if (!player.content) return;
    maximize();
    router.push(buildPlayerRoute(player.content));
  };

  return (
    <View style={styles.floatingWrap}>
      <View style={styles.innerRow}>
        <View style={styles.progressTrack} />
        <View style={[styles.progressFillBase, { width: `${progressPercentage}%` }]} />

        <TouchableOpacity
          onPress={handleExpand}
          activeOpacity={0.86}
          style={styles.artworkBtn}
        >
          {player.content.imageUrl ? (
            <Image
              source={{ uri: player.content.imageUrl }}
              style={styles.artworkImg}
              resizeMode="cover"
            />
          ) : (
            <MaterialIcons
              name={isAudio ? 'graphic-eq' : 'play-circle'}
              size={22}
              color={theme.colors.primary}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleExpand} activeOpacity={0.86} style={styles.titleBtn}>
          <CustomText variant="label" style={styles.titleText} numberOfLines={1}>
            {player.content.title}
          </CustomText>
          <CustomText variant="caption" style={styles.subtitleText} numberOfLines={1}>
            {isAudio ? 'Now playing' : 'Continue watching'} • {player.content.subtitle || 'ClaudyGod'}
          </CustomText>
        </TouchableOpacity>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={hasControls ? (player.isPlaying ? pause : resume) : undefined}
            activeOpacity={0.8}
            style={[styles.playBtn, { opacity: hasControls ? 1 : 0.48 }]}
          >
            <MaterialIcons
              name={player.isPlaying ? 'pause' : 'play-arrow'}
              size={20}
              color={theme.colors.textInverse}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={close} activeOpacity={0.78} style={styles.closeBtn}>
            <MaterialIcons name="close" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
