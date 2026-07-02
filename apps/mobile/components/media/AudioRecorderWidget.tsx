import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  meteringBar: {
    width: 3, borderRadius: 2,
    backgroundColor: theme.colors.primary, marginHorizontal: 1.5,
  },
  wrapBase:     { borderRadius: theme.radius.xl, borderWidth: 1, padding: 20, gap: 16 },
  wrapActive:   { borderColor: `${theme.colors.primary}40`, backgroundColor: `${theme.colors.primary}0A` },
  wrapInactive: { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  meteringRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 36 },
  timerBase: {
    textAlign: 'center', fontSize: 28, fontWeight: '700',
    letterSpacing: 2, fontVariant: ['tabular-nums'],
  },
  timerActive:   { color: theme.colors.primary },
  timerInactive: { color: theme.colors.textSecondary },
  controlsRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  startBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  discardBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  pauseBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stopBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${theme.colors.primary}18`,
    borderWidth: 1, borderColor: `${theme.colors.primary}30`,
    alignItems: 'center', justifyContent: 'center',
  },
  statusCaption: { textAlign: 'center', color: theme.colors.textSecondary },
}));

// ─── MeteringBar ──────────────────────────────────────────────────────────────

function MeteringBar({ index, isActive }: { index: number; isActive: boolean }) {
  const styles = useStyles();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!isActive) {
      Animated.timing(anim, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.3 + Math.random() * 0.7,
          duration: 150 + index * 30,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0.2 + Math.random() * 0.4,
          duration: 150 + index * 20,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, index, isActive]);

  return (
    <Animated.View
      style={[
        styles.meteringBar,
        { height: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 28] }) },
      ]}
    />
  );
}

// ─── AudioRecorderWidget ──────────────────────────────────────────────────────

interface AudioRecorderWidgetProps {
  isRecording: boolean;
  isPaused: boolean;
  durationMs: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => Promise<void>;
  onDiscard: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function AudioRecorderWidget({
  isRecording,
  isPaused,
  durationMs,
  onStart,
  onPause,
  onResume,
  onStop,
  onDiscard,
}: AudioRecorderWidgetProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const isActive = isRecording && !isPaused;

  return (
    <View style={[styles.wrapBase, isRecording ? styles.wrapActive : styles.wrapInactive]}>
      <View style={styles.meteringRow}>
        {Array.from({ length: 20 }).map((_, i) => (
          <MeteringBar key={i} index={i} isActive={isActive} />
        ))}
      </View>

      <CustomText
        style={[styles.timerBase, isRecording ? styles.timerActive : styles.timerInactive]}
      >
        {formatDuration(durationMs)}
      </CustomText>

      <View style={styles.controlsRow}>
        {!isRecording && !isPaused ? (
          <TVTouchable onPress={onStart} showFocusBorder={false} style={styles.startBtn}>
            <MaterialIcons name="mic" size={28} color="#FFFFFF" />
          </TVTouchable>
        ) : (
          <>
            <TVTouchable onPress={onDiscard} showFocusBorder={false} style={styles.discardBtn}>
              <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
            </TVTouchable>

            <TVTouchable
              onPress={isActive ? onPause : onResume}
              showFocusBorder={false}
              style={styles.pauseBtn}
            >
              <MaterialIcons name={isActive ? 'pause' : 'mic'} size={28} color="#FFFFFF" />
            </TVTouchable>

            <TVTouchable
              onPress={() => { void onStop(); }}
              showFocusBorder={false}
              style={styles.stopBtn}
            >
              <MaterialIcons name="stop" size={20} color={theme.colors.primary} />
            </TVTouchable>
          </>
        )}
      </View>

      {isRecording ? (
        <CustomText variant="caption" style={styles.statusCaption}>
          {isActive ? 'Recording…' : 'Paused'}
        </CustomText>
      ) : null}
    </View>
  );
}
