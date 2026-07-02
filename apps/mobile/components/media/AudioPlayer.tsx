import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface AudioTrack {
  id: string;
  title: string;
  artist?: string;
  uri: string;
  duration?: string;
  imageUrl?: string;
}

interface AudioPlayerProps {
  track: AudioTrack;
  autoPlay?: boolean;
  onClose?: () => void;
  compact?: boolean;
  onRegisterControls?: (_controls?: { pause: () => void; resume: () => void }) => void;
  onPlayStateChange?: (_isPlaying: boolean) => void;
  onProgress?: (_currentTime: number, _duration: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  currentTrackNumber?: number;
  totalTracks?: number;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // Artwork
  artworkShadow: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.65, shadowRadius: 52, shadowOffset: { width: 0, height: 28 },
    elevation: 28,
  },
  artworkCenter:       { alignItems: 'center' },
  artworkWrap:         { alignItems: 'center', marginBottom: 30 },

  // Compact mode
  compactWrap:         { gap: 16 },
  compactCloseBtnWrap: { flexDirection: 'row', justifyContent: 'flex-end' },
  closeBtn:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.colors.surface },
  closeBtnText:        { color: theme.colors.textSecondary },
  compactMeta:         { gap: 3, alignItems: 'center', paddingHorizontal: 16 },
  compactTitle:        { color: theme.colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  compactArtist:       { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center' },
  compactControlRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  compactPlayBtn: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary,
    shadowOpacity: 0.50, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  // Track counter badge
  trackCounterWrap:    { alignItems: 'center', marginBottom: 20 },
  trackBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1,
    backgroundColor: theme.colors.primarySurface, borderColor: theme.colors.primaryBorder,
  },
  trackBadgeText:      { color: theme.colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Meta row (full mode)
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 4, marginBottom: 14,
  },
  sideBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  metaFill:            { flex: 1, gap: 4 },
  trackTitle:          { fontSize: 19, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center', color: theme.colors.text },
  trackArtist:         { fontSize: 13.5, fontWeight: '500', textAlign: 'center', color: theme.colors.textMuted },

  // Controls row
  controlsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10,
  },
  controlBtn: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
  },
  playBtnFull: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary,
    shadowOpacity: 0.55, shadowRadius: 28, shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  sideBtnFaded:        { opacity: 0.28 },

  // Progress
  progressWrap:        { marginBottom: 6, marginTop: 6 },
  progressPressable:   { paddingVertical: 13 },
  timeRow:             { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
  timeLabel:           { fontSize: 11, fontWeight: '500', color: theme.colors.textMuted },
  progressThumb: {
    position: 'absolute', right: -7, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#FFFFFF', shadowOpacity: 0.45, shadowRadius: 5, elevation: 5,
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function AudioPlayer({
  track,
  autoPlay = true,
  onClose,
  compact,
  onRegisterControls,
  onPlayStateChange,
  onProgress,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
  isFavorite,
  onFavoriteToggle,
  currentTrackNumber,
  totalTracks,
}: AudioPlayerProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const player = useAudioPlayer(track.uri, { updateInterval: 350 });
  const status = useAudioPlayerStatus(player);
  const isCompact = Boolean(compact);

  const artScale   = useRef(new Animated.Value(1)).current;
  const artOpacity = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.22)).current;
  const glowScale   = useRef(new Animated.Value(1.0)).current;
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const progressBarWidth = useRef(0);
  const artworkSize = isCompact ? 160 : Math.min(Math.round(width * 0.68), 296);
  const GLOW_PAD = 30;

  // ── Computed playback state ───────────────────────────────────────────────
  const { progress, positionLabel, durationLabel, isPlaying } = useMemo(() => {
    if (!status.isLoaded) {
      return { progress: 0, positionLabel: '0:00', durationLabel: track.duration ?? '--:--', isPlaying: false };
    }
    const position = Math.max(0, Math.round((status.currentTime ?? 0) * 1000));
    const duration = Math.max(0, Math.round((status.duration ?? 0) * 1000));
    const safeDuration = duration > 0 ? duration : 1;
    return {
      progress: Math.min(1, position / safeDuration),
      positionLabel: formatMillis(position),
      durationLabel: duration ? formatMillis(duration) : (track.duration ?? '--:--'),
      isPlaying: status.playing,
    };
  }, [status.currentTime, status.duration, status.isLoaded, status.playing, track.duration]);

  // ── Artwork cross-fade on track change ───────────────────────────────────
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(artOpacity, { toValue: 0.22, duration: 110, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(artScale, { toValue: 0.89, useNativeDriver: USE_NATIVE_DRIVER, friction: 8, tension: 130 }),
      ]),
      Animated.parallel([
        Animated.timing(artOpacity, { toValue: 1, duration: 250, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(artScale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, friction: 6, tension: 50 }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.id]);

  // ── Glow pulse when playing ───────────────────────────────────────────────
  useEffect(() => {
    glowLoopRef.current?.stop();
    if (isPlaying && !isCompact) {
      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowOpacity, { toValue: 0.58, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(glowScale, { toValue: 1.07, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
          ]),
          Animated.parallel([
            Animated.timing(glowOpacity, { toValue: 0.22, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(glowScale, { toValue: 1.0, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
          ]),
        ]),
      );
      glowLoopRef.current.start();
    } else {
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 0.18, duration: 600, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(glowScale, { toValue: 1.0, duration: 600, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start();
    }
    return () => { glowLoopRef.current?.stop(); };
  }, [isPlaying, isCompact, glowOpacity, glowScale]);

  // ── Audio setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });
  }, []);

  useEffect(() => {
    if (!status.isLoaded) return;
    if (autoPlay) { player.play(); return; }
    player.pause();
    void player.seekTo(0);
  }, [autoPlay, player, status.isLoaded, track.uri]);

  useEffect(() => {
    if (!status.isLoaded) return;
    onPlayStateChange?.(status.playing);
    onProgress?.(status.currentTime, status.duration ?? 0);
  }, [onPlayStateChange, onProgress, status.currentTime, status.duration, status.isLoaded, status.playing]);

  useEffect(() => {
    const err = (status as unknown as { error?: string }).error;
    if (!err) return;
    console.warn('[AudioPlayer] Playback error:', err);
    onPlayStateChange?.(false);
  }, [(status as unknown as { error?: string }).error, onPlayStateChange]);

  useEffect(() => {
    if (!status.isLoaded) return;
    onRegisterControls?.({ pause: () => player.pause(), resume: () => player.play() });
    return () => { onRegisterControls?.(undefined); player.pause(); };
  }, [onRegisterControls, player, status.isLoaded]);

  // ── Interactions ──────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!status.isLoaded) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (status.playing) { player.pause(); return; }
    player.play();
  }, [player, status.isLoaded, status.playing]);

  const seekBySeconds = useCallback((delta: number) => {
    if (!status.isLoaded) return;
    const duration = Math.max(0, status.duration ?? 0);
    const current  = Math.max(0, status.currentTime ?? 0);
    void player.seekTo(Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, current + delta)));
  }, [player, status.currentTime, status.duration, status.isLoaded]);

  const seekToFraction = useCallback((fraction: number) => {
    if (!status.isLoaded) return;
    const duration = Math.max(0, status.duration ?? 0);
    if (!duration) return;
    void Haptics.selectionAsync();
    void player.seekTo(Math.max(0, Math.min(duration, duration * fraction)));
  }, [player, status.duration, status.isLoaded]);

  // ─────────────────────────────────────────────────────────────────────────
  // COMPACT mode
  // ─────────────────────────────────────────────────────────────────────────
  if (isCompact) {
    return (
      <View style={styles.compactWrap}>
        {onClose ? (
          <View style={styles.compactCloseBtnWrap}>
            <TVTouchable onPress={onClose} style={styles.closeBtn} showFocusBorder={false}>
              <CustomText variant="caption" style={styles.closeBtnText}>Close</CustomText>
            </TVTouchable>
          </View>
        ) : null}
        <View style={styles.artworkCenter}>
          <Animated.View style={[styles.artworkShadow, { width: artworkSize, height: artworkSize, borderRadius: 16, opacity: artOpacity, transform: [{ scale: artScale }] }]}>
            <Image source={{ uri: track.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
          </Animated.View>
        </View>
        <View style={styles.compactMeta}>
          <CustomText numberOfLines={1} style={styles.compactTitle}>{track.title}</CustomText>
          <CustomText numberOfLines={1} style={styles.compactArtist}>{track.artist || 'ClaudyGod'}</CustomText>
        </View>
        <ProgressSection
          progress={progress}
          positionLabel={positionLabel}
          durationLabel={durationLabel}
          progressBarWidth={progressBarWidth}
          onSeek={seekToFraction}
          trackHeight={4}
          showThumb={false}
          paddingH={8}
        />
        <View style={styles.compactControlRow}>
          {onPrevious ? <ControlButton icon="skip-previous" onPress={onPrevious} disabled={!canGoPrevious} size={22} accessibilityLabel="Previous track" /> : null}
          <ControlButton icon="replay-10" onPress={() => seekBySeconds(-10)} size={22} accessibilityLabel="Rewind 10 seconds" />
          <TVTouchable onPress={togglePlay} style={styles.compactPlayBtn} showFocusBorder={false} accessibilityLabel={isPlaying ? 'Pause' : 'Play'} accessibilityRole="button">
            <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={32} color={theme.colors.onPrimary} />
          </TVTouchable>
          <ControlButton icon="forward-10" onPress={() => seekBySeconds(10)} size={22} accessibilityLabel="Skip forward 10 seconds" />
          {onNext ? <ControlButton icon="skip-next" onPress={onNext} disabled={!canGoNext} size={22} accessibilityLabel="Next track" /> : null}
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FULL (premium) mode
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View>
      {/* Track counter badge */}
      {currentTrackNumber != null && totalTracks != null && totalTracks > 1 ? (
        <View style={styles.trackCounterWrap}>
          <View style={styles.trackBadge}>
            <MaterialIcons name="graphic-eq" size={12} color={theme.colors.primary} />
            <CustomText style={styles.trackBadgeText}>{`${currentTrackNumber} of ${totalTracks}`}</CustomText>
          </View>
        </View>
      ) : null}

      {/* Artwork + glow */}
      <View style={styles.artworkWrap}>
        <View style={{ width: artworkSize, height: artworkSize, alignItems: 'center', justifyContent: 'center' }}>
          {/* Pulsing radial glow */}
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
          {/* Album cover */}
          <Animated.View style={[styles.artworkShadow, { width: artworkSize, height: artworkSize, borderRadius: 22, opacity: artOpacity, transform: [{ scale: artScale }] }]}>
            <Image source={{ uri: track.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
          </Animated.View>
        </View>
      </View>

      {/* Title row */}
      <View style={styles.metaRow}>
        <TVTouchable onPress={onFavoriteToggle} disabled={!onFavoriteToggle} style={styles.sideBtn} showFocusBorder={false} accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
          <MaterialIcons name={isFavorite ? 'favorite' : 'favorite-border'} size={24} color={isFavorite ? theme.colors.primary : theme.colors.textMuted} />
        </TVTouchable>
        <View style={styles.metaFill}>
          <CustomText numberOfLines={1} style={styles.trackTitle}>{track.title}</CustomText>
          <CustomText numberOfLines={1} style={styles.trackArtist}>{track.artist || 'ClaudyGod'}</CustomText>
        </View>
        <TVTouchable style={styles.sideBtn} showFocusBorder={false} accessibilityLabel="More options" onPress={() => {}}>
          <MaterialIcons name="more-horiz" size={24} color={theme.colors.textMuted} />
        </TVTouchable>
      </View>

      {/* Progress bar */}
      <ProgressSection
        progress={progress}
        positionLabel={positionLabel}
        durationLabel={durationLabel}
        progressBarWidth={progressBarWidth}
        onSeek={seekToFraction}
        trackHeight={5}
        showThumb
        paddingH={4}
      />

      {/* Main playback controls */}
      <View style={styles.controlsRow}>
        <TVTouchable style={[styles.sideBtn, styles.sideBtnFaded]} showFocusBorder={false} onPress={() => {}}>
          <MaterialIcons name="shuffle" size={20} color={theme.colors.textSecondary} />
        </TVTouchable>

        {onPrevious ? (
          <ControlButton icon="skip-previous" onPress={onPrevious} disabled={!canGoPrevious} size={28} accessibilityLabel="Previous track" />
        ) : null}

        <ControlButton icon="replay-10" onPress={() => seekBySeconds(-10)} size={24} accessibilityLabel="Rewind 10 seconds" />

        <TVTouchable onPress={togglePlay} style={styles.playBtnFull} showFocusBorder={false} accessibilityLabel={isPlaying ? 'Pause' : 'Play'} accessibilityRole="button">
          <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={44} color={theme.colors.onPrimary} />
        </TVTouchable>

        <ControlButton icon="forward-10" onPress={() => seekBySeconds(10)} size={24} accessibilityLabel="Skip forward 10 seconds" />

        {onNext ? (
          <ControlButton icon="skip-next" onPress={onNext} disabled={!canGoNext} size={28} accessibilityLabel="Next track" />
        ) : null}

        <TVTouchable style={[styles.sideBtn, styles.sideBtnFaded]} showFocusBorder={false} onPress={() => {}}>
          <MaterialIcons name="repeat" size={20} color={theme.colors.textSecondary} />
        </TVTouchable>
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressSection({
  progress,
  positionLabel,
  durationLabel,
  progressBarWidth,
  onSeek,
  trackHeight,
  showThumb,
  paddingH,
}: {
  progress: number;
  positionLabel: string;
  durationLabel: string;
  progressBarWidth: React.MutableRefObject<number>;
  onSeek: (fraction: number) => void;
  trackHeight: number;
  showThumb: boolean;
  paddingH: number;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const thumbOffset = -(14 - trackHeight) / 2;
  return (
    <View style={[styles.progressWrap, { paddingHorizontal: paddingH }]}>
      <Pressable
        onLayout={(e) => { progressBarWidth.current = e.nativeEvent.layout.width; }}
        onPress={(e) => {
          const barW = progressBarWidth.current;
          if (!barW) return;
          onSeek(Math.max(0, Math.min(1, e.nativeEvent.locationX / barW)));
        }}
        style={styles.progressPressable}
      >
        <View style={{ height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: theme.colors.divider }}>
          <View style={{ width: `${Math.round(progress * 100)}%`, height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: theme.colors.primary }}>
            {showThumb ? (
              <View style={[styles.progressThumb, { top: thumbOffset, shadowColor: theme.colors.primary }]} />
            ) : null}
          </View>
        </View>
      </Pressable>
      <View style={styles.timeRow}>
        <CustomText style={styles.timeLabel}>{positionLabel}</CustomText>
        <CustomText style={styles.timeLabel}>{durationLabel}</CustomText>
      </View>
    </View>
  );
}

function ControlButton({
  icon,
  onPress,
  disabled,
  size = 24,
  accessibilityLabel,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  accessibilityLabel?: string;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <TVTouchable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[styles.controlBtn, { opacity: disabled ? 0.28 : 1 }]}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={size} color={theme.colors.text} />
    </TVTouchable>
  );
}

function formatMillis(value: number) {
  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? `0${seconds}` : String(seconds)}`;
}
