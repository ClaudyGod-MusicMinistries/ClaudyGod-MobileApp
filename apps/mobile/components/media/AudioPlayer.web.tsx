import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
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
  const theme = useAppTheme();
  const isCompact = Boolean(compact);
  const artworkSize = isCompact ? 144 : 212;

  return (
    <LinearGradient
      colors={
        theme.scheme === 'dark'
          ? ['rgba(18,13,31,0.98)', 'rgba(7,6,12,0.98)']
          : ['rgba(249,247,255,0.98)', 'rgba(238,234,248,0.98)']
      }
      style={{
        borderRadius: theme.radius.xl,
        padding: isCompact ? theme.spacing.lg : theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ gap: isCompact ? 18 : 22 }}>
        <View
          style={{
            flexDirection: isCompact ? 'column' : 'row',
            alignItems: isCompact ? 'center' : 'flex-start',
            justifyContent: 'space-between',
            gap: isCompact ? 18 : 22,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <PillMeta label="Music player" />
            <PillMeta label={track.duration || '--:--'} />
          </View>

          {onClose ? (
            <TVTouchable
              onPress={onClose}
              style={{
                minHeight: 34,
                paddingHorizontal: 12,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              showFocusBorder={false}
            >
              <CustomText variant="label" style={{ color: theme.colors.text }}>
                Close
              </CustomText>
            </TVTouchable>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', gap: 16 }}>
          <View
            style={{
              width: artworkSize,
              height: artworkSize,
              borderRadius: isCompact ? 20 : 22,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: theme.colors.surfaceAlt,
              ...theme.shadows.card,
            }}
          >
            <Image
              source={{ uri: track.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          <View style={{ width: '100%', alignItems: 'center', gap: 6 }}>
            <CustomText variant="hero" style={{ color: theme.colors.text, textAlign: 'center' }}>
              {track.title}
            </CustomText>
            <CustomText variant="subtitle" style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              {track.artist || 'ClaudyGod Ministries'}
            </CustomText>
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 2 }}>
              {onPrevious ? (
                <TVTouchable
                  onPress={onPrevious}
                  disabled={!canGoPrevious}
                  style={{
                    minHeight: 40,
                    minWidth: 40,
                    borderRadius: theme.radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    opacity: canGoPrevious ? 1 : 0.48,
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="skip-previous" size={20} color={theme.colors.text} />
                </TVTouchable>
              ) : null}
              {onNext ? (
                <TVTouchable
                  onPress={onNext}
                  disabled={!canGoNext}
                  style={{
                    minHeight: 40,
                    minWidth: 40,
                    borderRadius: theme.radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    opacity: canGoNext ? 1 : 0.48,
                  }}
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
    </LinearGradient>
  );
}

function PillMeta({ label }: { label: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
      }}
    >
      <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
        {label}
      </CustomText>
    </View>
  );
}
