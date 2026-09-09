/**
 * The full-screen worship player. Pure subscriber: every value comes from the
 * playback store and every control dispatches a store intent. It owns no audio
 * instance — `playback/service.ts` does.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { AppImage } from '../ui/AppImage';
import { ActionSheet, type ActionSheetAction } from '../ui/ActionSheet';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { peekNext } from '../../playback/queue';
import {
  cycleRepeat,
  next,
  previous,
  seekTo,
  toggle,
  toggleShuffle,
  usePlayback,
  usePlaybackProgress,
} from '../../playback';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface FullPlayerProps {
  favorite?: { active: boolean; onToggle: () => void };
}

const useStyles = makeStyles((theme) => ({
  artworkWrap: { alignItems: 'center', marginBottom: 30 },
  artworkShadow: { overflow: 'hidden', ...theme.shadows.xxl },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, marginBottom: 14 },
  sideBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sideBtnFaded: { opacity: 0.28 },
  metaFill: { flex: 1, gap: 4 },
  trackTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center', color: theme.colors.text },
  trackArtist: { fontSize: 13.5, fontWeight: '500', textAlign: 'center', color: theme.colors.textMuted },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 },
  controlBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  playBtnFull: {
    width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary,
    shadowOpacity: 0.55, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 14,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  errorText: { color: theme.colors.danger, fontSize: 12.5, fontWeight: '600' },
  progressWrap: { marginBottom: 6, marginTop: 6, paddingHorizontal: 4 },
  progressPressable: { paddingVertical: 13 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
  timeLabel: { fontSize: 11, fontWeight: '500', color: theme.colors.textMuted },
  progressThumb: {
    position: 'absolute', right: -7, width: 14, height: 14, borderRadius: 7,
    backgroundColor: theme.colors.mediaText, shadowOpacity: 0.45, shadowRadius: 5, elevation: 5,
  },
}));

function formatMillis(value: number): string {
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? `0${seconds}` : String(seconds)}`;
}

export function FullPlayer({ favorite }: FullPlayerProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const { status, nowPlaying, queue, error } = usePlayback();
  const { positionMs, durationMs } = usePlaybackProgress();
  const [menuOpen, setMenuOpen] = useState(false);

  const artworkSize = Math.min(Math.round(width * 0.68), 296);
  const GLOW_PAD = 30;

  const isPlaying = status === 'playing' || status === 'buffering' || status === 'loading';
  const effectiveDuration = durationMs > 0 ? durationMs : (nowPlaying?.durationMs ?? 0);
  const progress = effectiveDuration > 0 ? Math.min(1, positionMs / effectiveDuration) : 0;

  const canGoNext = useMemo(() => peekNext(queue, 'user') !== null, [queue]);
  const canGoPrevious = queue.history.length > 0 || positionMs > 3_000;

  const glowOpacity = useRef(new Animated.Value(0.22)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    glowLoopRef.current?.stop();
    if (status === 'playing' && !reduceMotion) {
      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowOpacity, { toValue: 0.58, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(glowScale, { toValue: 1.07, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
          ]),
          Animated.parallel([
            Animated.timing(glowOpacity, { toValue: 0.22, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(glowScale, { toValue: 1, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
          ]),
        ]),
      );
      glowLoopRef.current.start();
    } else {
      Animated.timing(glowOpacity, { toValue: 0.18, duration: 600, useNativeDriver: USE_NATIVE_DRIVER }).start();
      Animated.timing(glowScale, { toValue: 1, duration: 600, useNativeDriver: USE_NATIVE_DRIVER }).start();
    }
    return () => glowLoopRef.current?.stop();
  }, [status, reduceMotion, glowOpacity, glowScale]);

  const progressWidth = useRef(0);
  const seekToFraction = useCallback((fraction: number) => {
    if (effectiveDuration <= 0) return;
    void Haptics.selectionAsync();
    seekTo(effectiveDuration * Math.max(0, Math.min(1, fraction)));
  }, [effectiveDuration]);

  const onTogglePlay = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggle();
  }, []);

  const shareTrack = useCallback(() => {
    setMenuOpen(false);
    if (!nowPlaying) return;
    void Share.share({
      title: nowPlaying.title,
      message: nowPlaying.artist ? `${nowPlaying.title} — ${nowPlaying.artist}` : nowPlaying.title,
    });
  }, [nowPlaying]);

  const menuActions: ActionSheetAction[] = useMemo(
    () => [{ key: 'share', label: 'Share', icon: 'share', onPress: shareTrack }],
    [shareTrack],
  );

  if (!nowPlaying) return null;

  const repeatActive = queue.repeat !== 'off';
  const repeatIcon = queue.repeat === 'one' ? 'repeat-one' : 'repeat';

  return (
    <View>
      <View style={styles.artworkWrap}>
        <View style={{ width: artworkSize, height: artworkSize, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute',
              top: -GLOW_PAD, left: -GLOW_PAD, right: -GLOW_PAD, bottom: -GLOW_PAD,
              borderRadius: artworkSize / 2 + GLOW_PAD,
              backgroundColor: theme.colors.primaryBorder,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            }}
          />
          <View style={[styles.artworkShadow, { width: artworkSize, height: artworkSize, borderRadius: 22 }]}>
            <AppImage uri={nowPlaying.artworkUrl} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <TVTouchable
          onPress={favorite?.onToggle}
          disabled={!favorite}
          style={styles.sideBtn}
          showFocusBorder={false}
          accessibilityRole="button"
          accessibilityLabel={favorite?.active ? 'Remove from favorites' : 'Add to favorites'}
        >
          <MaterialIcons
            name={favorite?.active ? 'favorite' : 'favorite-border'}
            size={24}
            color={favorite?.active ? theme.colors.primary : theme.colors.textMuted}
          />
        </TVTouchable>
        <View style={styles.metaFill}>
          <CustomText numberOfLines={1} style={styles.trackTitle}>{nowPlaying.title}</CustomText>
          <CustomText numberOfLines={1} style={styles.trackArtist}>{nowPlaying.artist || 'ClaudyGod'}</CustomText>
        </View>
        <TVTouchable style={styles.sideBtn} showFocusBorder={false} accessibilityLabel="More options" onPress={() => setMenuOpen(true)}>
          <MaterialIcons name="more-horiz" size={24} color={theme.colors.textMuted} />
        </TVTouchable>
      </View>

      <View style={styles.progressWrap}>
        <Pressable
          onLayout={(e) => { progressWidth.current = e.nativeEvent.layout.width; }}
          onPress={(e) => {
            const barW = progressWidth.current;
            if (barW) seekToFraction(e.nativeEvent.locationX / barW);
          }}
          style={styles.progressPressable}
          accessibilityRole="adjustable"
          accessibilityLabel="Playback position"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        >
          <View style={{ height: 5, borderRadius: 2.5, backgroundColor: theme.colors.divider }}>
            <View style={{ width: `${Math.round(progress * 100)}%`, height: 5, borderRadius: 2.5, backgroundColor: theme.colors.primary }}>
              <View style={[styles.progressThumb, { top: -4.5, shadowColor: theme.colors.primary }]} />
            </View>
          </View>
        </Pressable>
        <View style={styles.timeRow}>
          <CustomText style={styles.timeLabel}>{formatMillis(positionMs)}</CustomText>
          <CustomText style={styles.timeLabel}>{effectiveDuration ? formatMillis(effectiveDuration) : '--:--'}</CustomText>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <TVTouchable
          style={[styles.sideBtn, !queue.shuffle && styles.sideBtnFaded]}
          showFocusBorder={false}
          onPress={() => { void Haptics.selectionAsync(); toggleShuffle(); }}
          accessibilityLabel="Shuffle"
          accessibilityState={{ selected: queue.shuffle }}
        >
          <MaterialIcons name="shuffle" size={20} color={queue.shuffle ? theme.colors.primary : theme.colors.textSecondary} />
        </TVTouchable>

        <ControlButton icon="skip-previous" onPress={() => previous()} disabled={!canGoPrevious} size={28} label="Previous track" />
        <ControlButton icon="replay-10" onPress={() => seekTo(positionMs - 10_000)} size={24} label="Rewind 10 seconds" />

        <TVTouchable onPress={onTogglePlay} style={styles.playBtnFull} showFocusBorder={false} accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
          <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={44} color={theme.colors.onPrimary} />
        </TVTouchable>

        <ControlButton icon="forward-10" onPress={() => seekTo(positionMs + 10_000)} size={24} label="Skip forward 10 seconds" />
        <ControlButton icon="skip-next" onPress={() => next('user')} disabled={!canGoNext} size={28} label="Next track" />

        <TVTouchable
          style={[styles.sideBtn, !repeatActive && styles.sideBtnFaded]}
          showFocusBorder={false}
          onPress={() => { void Haptics.selectionAsync(); cycleRepeat(); }}
          accessibilityLabel={`Repeat: ${queue.repeat}`}
          accessibilityState={{ selected: repeatActive }}
        >
          <MaterialIcons name={repeatIcon} size={20} color={repeatActive ? theme.colors.primary : theme.colors.textSecondary} />
        </TVTouchable>
      </View>

      {status === 'error' ? (
        <TVTouchable style={styles.errorRow} showFocusBorder={false} onPress={() => next('user')} accessibilityRole="button" accessibilityLabel="Skip to the next track">
          <MaterialIcons name="error-outline" size={15} color={theme.colors.danger} />
          <CustomText style={styles.errorText}>{error || 'Playback failed'} · Tap to skip</CustomText>
        </TVTouchable>
      ) : null}

      <ActionSheet
        visible={menuOpen}
        title={nowPlaying.title}
        description={nowPlaying.artist || undefined}
        actions={menuActions}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

function ControlButton({
  icon,
  onPress,
  disabled,
  size = 24,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  label: string;
}) {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <TVTouchable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.controlBtn, { opacity: disabled ? 0.28 : 1 }]}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={size} color={theme.colors.text} />
    </TVTouchable>
  );
}
