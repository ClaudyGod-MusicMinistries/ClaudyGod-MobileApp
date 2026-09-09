/**
 * Global mini player — mounted once in `app/_layout.tsx`, visible on every
 * screen while a native track is loaded (except the full player itself).
 * Pure store subscriber.
 */

import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { AppImage } from '../ui/AppImage';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { layout } from '../../styles/designTokens';
import { getSidebarWidth } from '../../util/sidebarConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import {
  dismissResumeTarget,
  next,
  playResumeTarget,
  toggle,
  usePlayback,
  usePlaybackProgress,
  usePlaybackVisible,
} from '../../playback';
import { peekNext } from '../../playback/queue';

export const MINI_PLAYER_HEIGHT = 60;

const useStyles = makeStyles((theme) => ({
  wrap: {
    position: 'absolute',
    left: 0, right: 0,
    backgroundColor: theme.colors.elevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  progressTrack: { height: 2, backgroundColor: theme.colors.divider },
  progressFill: { height: 2, backgroundColor: theme.colors.primary },
  row: { height: MINI_PLAYER_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 12 },
  art: { width: 42, height: 42, borderRadius: 8 },
  meta: { flex: 1, gap: 1 },
  title: { color: theme.colors.text, fontSize: 13.5, fontWeight: '700' },
  artist: { color: theme.colors.textMuted, fontSize: 11.5 },
  ctrlBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  resumeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 10, marginBottom: 8, paddingVertical: 9, paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
  },
  resumeText: { color: theme.colors.text, fontSize: 12.5, fontWeight: '600', flex: 1 },
}));

export function MiniPlayer() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const visible = usePlaybackVisible();
  const { status, nowPlaying, queue, resumeTarget } = usePlayback();

  const onPlayerScreen = pathname?.startsWith('/player') || pathname === APP_ROUTES.tabs.player;
  const sidebarWidth = getSidebarWidth(width);
  const compact = width < 390;
  const tabBarHeight = compact ? layout.tabBarCompactHeight : layout.tabBarHeight;
  const bottom = sidebarWidth > 0 ? insets.bottom + 12 : insets.bottom + tabBarHeight;

  if (onPlayerScreen) return null;

  // Resume chip — only when nothing is actively loaded yet.
  if (!visible && resumeTarget) {
    return (
      <View style={[styles.wrap, { left: sidebarWidth, bottom, borderTopWidth: 0, backgroundColor: 'transparent' }]}>
        <View style={styles.resumeChip}>
          <MaterialIcons name="history" size={18} color={theme.colors.primary} />
          <CustomText style={styles.resumeText} numberOfLines={1}>
            {`Resume “${resumeTarget.title}”?`}
          </CustomText>
          <TVTouchable
            onPress={() => { void Haptics.selectionAsync(); playResumeTarget(); }}
            showFocusBorder={false}
            accessibilityRole="button"
            accessibilityLabel={`Resume ${resumeTarget.title}`}
          >
            <MaterialIcons name="play-circle-filled" size={30} color={theme.colors.primary} />
          </TVTouchable>
          <TVTouchable
            onPress={() => dismissResumeTarget()}
            showFocusBorder={false}
            accessibilityRole="button"
            accessibilityLabel="Dismiss resume"
          >
            <MaterialIcons name="close" size={18} color={theme.colors.textMuted} />
          </TVTouchable>
        </View>
      </View>
    );
  }

  if (!visible || !nowPlaying) return null;

  const isPlaying = status === 'playing' || status === 'buffering' || status === 'loading';
  const canGoNext = peekNext(queue, 'user') !== null;

  return (
    <View style={[styles.wrap, { left: sidebarWidth, bottom }]}>
      <MiniProgressBar fallbackDurationMs={nowPlaying.durationMs ?? 0} />
      <View style={styles.row}>
        <TVTouchable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
          showFocusBorder={false}
          onPress={() => router.push(APP_ROUTES.tabs.player)}
          accessibilityRole="button"
          accessibilityLabel={`Now playing: ${nowPlaying.title}. Open player.`}
        >
          <AppImage uri={nowPlaying.artworkUrl} resizeMode="cover" style={styles.art} />
          <View style={styles.meta}>
            <CustomText numberOfLines={1} style={styles.title}>{nowPlaying.title}</CustomText>
            <CustomText numberOfLines={1} style={styles.artist}>
              {status === 'error' ? 'Playback failed' : (nowPlaying.artist || 'ClaudyGod')}
            </CustomText>
          </View>
        </TVTouchable>

        <TVTouchable
          style={styles.playBtn}
          showFocusBorder={false}
          onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(); }}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={24} color={theme.colors.onPrimary} />
        </TVTouchable>

        <TVTouchable
          style={[styles.ctrlBtn, { opacity: canGoNext ? 1 : 0.3 }]}
          showFocusBorder={false}
          disabled={!canGoNext}
          onPress={() => next('user')}
          accessibilityRole="button"
          accessibilityLabel="Next track"
        >
          <MaterialIcons name="skip-next" size={26} color={theme.colors.text} />
        </TVTouchable>
      </View>
    </View>
  );
}

/** Isolated so the ~4×/s progress tick never re-renders the row above it. */
function MiniProgressBar({ fallbackDurationMs }: { fallbackDurationMs: number }) {
  const styles = useStyles();
  const { positionMs, durationMs } = usePlaybackProgress();
  const total = durationMs > 0 ? durationMs : fallbackDurationMs;
  const progress = total > 0 ? Math.min(1, positionMs / total) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
    </View>
  );
}
