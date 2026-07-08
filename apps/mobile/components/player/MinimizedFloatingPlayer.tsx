import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usePlayer } from '../../context/PlayerContext';
import { usePlayerProgress } from '../../context/PlayerProgressContext';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { CustomText } from '../CustomText';
import { AppImage } from '../ui/AppImage';
import { buildPlayerRoute } from '../../util/playerRoute';

// Swipe thresholds, in px, before a gesture commits to an action.
const DISMISS_THRESHOLD = 60;
const SKIP_THRESHOLD = 70;

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  floatingWrap: {
    position: 'absolute', bottom: 94, left: 12, right: 12, minHeight: 64,
    borderRadius: theme.radius.xl, overflow: 'hidden', zIndex: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    ...theme.shadows.lg,
  },
  innerRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 9, gap: 10,
    backgroundColor: theme.colors.playerGlass,
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
  const { player, resume, pause, maximize, close, playNext, playPrevious } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const theme = useAppTheme();
  const router = useRouter();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const handleExpand = () => {
    if (!player.content) return;
    maximize();
    router.push(buildPlayerRoute(player.content));
  };

  // The component unmounts (returns null) as soon as `close`/`maximize` flips
  // player state, so the exit animation is delayed to match its own duration —
  // otherwise the translateY animation would never actually be seen.
  const handleDismissGesture = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(close, 200);
  };

  const handleMaximizeGesture = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(handleExpand, 200);
  };

  const handleNextGesture = () => {
    void Haptics.selectionAsync();
    playNext();
  };

  const handlePreviousGesture = () => {
    void Haptics.selectionAsync();
    playPrevious();
  };

  // Pan activates only past a small deadzone so it doesn't steal simple taps
  // from the artwork/title/control buttons nested inside.
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .activeOffsetY([-12, 12])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const { translationX, translationY } = event;

      if (translationY < -DISMISS_THRESHOLD) {
        translateY.value = withTiming(-500, { duration: 220 });
        runOnJS(handleMaximizeGesture)();
        return;
      }
      if (translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(500, { duration: 220 });
        runOnJS(handleDismissGesture)();
        return;
      }
      if (translationX < -SKIP_THRESHOLD) {
        translateX.value = withSpring(0, { damping: 18 });
        runOnJS(handleNextGesture)();
        return;
      }
      if (translationX > SKIP_THRESHOLD) {
        translateX.value = withSpring(0, { damping: 18 });
        runOnJS(handlePreviousGesture)();
        return;
      }

      translateX.value = withSpring(0, { damping: 18 });
      translateY.value = withSpring(0, { damping: 18 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: 1 - Math.min(Math.abs(translateY.value) / 400, 0.7),
  }));

  if (!player.content || !player.isMinimized) {
    return null;
  }

  const progressPercentage = duration > 0
    ? Math.min(100, (currentTime / duration) * 100)
    : 0;
  const isAudio = player.type === 'audio';
  const hasControls = Boolean(player.controls);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.floatingWrap, animatedStyle]}>
        <View style={styles.innerRow}>
          <View style={styles.progressTrack} />
          <View style={[styles.progressFillBase, { width: `${progressPercentage}%` }]} />

          <TouchableOpacity
            onPress={handleExpand}
            activeOpacity={0.86}
            style={styles.artworkBtn}
          >
            {player.content.imageUrl ? (
              <AppImage
                uri={player.content.imageUrl}
                style={styles.artworkImg}
                resizeMode="cover"
                showSkeleton={false}
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
      </Animated.View>
    </GestureDetector>
  );
}
