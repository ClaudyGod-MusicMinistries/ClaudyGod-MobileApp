import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';

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

function MeteringBar({ index, isActive }: { index: number; isActive: boolean }) {
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
      style={{
        width: 3,
        borderRadius: 2,
        height: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 28] }),
        backgroundColor: '#8B5CF6',
        marginHorizontal: 1.5,
      }}
    />
  );
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
  const theme = useAppTheme();
  const isActive = isRecording && !isPaused;

  return (
    <View
      style={{
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: isRecording ? `${theme.colors.primary}40` : theme.colors.border,
        backgroundColor: isRecording ? `${theme.colors.primary}0A` : theme.colors.surface,
        padding: 20,
        gap: 16,
      }}
    >
      {/* Metering bars */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 36 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <MeteringBar key={i} index={i} isActive={isActive} />
        ))}
      </View>

      {/* Timer */}
      <CustomText
        style={{
          textAlign: 'center',
          color: isRecording ? theme.colors.primary : theme.colors.textSecondary,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: 2,
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatDuration(durationMs)}
      </CustomText>

      {/* Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {!isRecording && !isPaused ? (
          /* Start */
          <TVTouchable
            onPress={onStart}
            showFocusBorder={false}
            style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: theme.colors.primary,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MaterialIcons name="mic" size={28} color="#FFFFFF" />
          </TVTouchable>
        ) : (
          <>
            {/* Discard */}
            <TVTouchable
              onPress={onDiscard}
              showFocusBorder={false}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: 'rgba(239,68,68,0.12)',
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
            </TVTouchable>

            {/* Pause / Resume */}
            <TVTouchable
              onPress={isActive ? onPause : onResume}
              showFocusBorder={false}
              style={{
                width: 60, height: 60, borderRadius: 30,
                backgroundColor: theme.colors.primary,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MaterialIcons name={isActive ? 'pause' : 'mic'} size={28} color="#FFFFFF" />
            </TVTouchable>

            {/* Stop */}
            <TVTouchable
              onPress={() => { void onStop(); }}
              showFocusBorder={false}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: `${theme.colors.primary}18`,
                borderWidth: 1, borderColor: `${theme.colors.primary}30`,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MaterialIcons name="stop" size={20} color={theme.colors.primary} />
            </TVTouchable>
          </>
        )}
      </View>

      {isRecording ? (
        <CustomText
          variant="caption"
          style={{ textAlign: 'center', color: theme.colors.textSecondary }}
        >
          {isActive ? 'Recording…' : 'Paused'}
        </CustomText>
      ) : null}
    </View>
  );
}
