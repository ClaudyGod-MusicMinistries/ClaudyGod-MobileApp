import React from 'react';
import { Image, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFloatingPlayer } from '../../context/FloatingPlayerContext';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';
import { buildPlayerRoute } from '../../util/playerRoute';

export function MinimizedFloatingPlayer() {
  const { player, resume, pause, maximize, close } = useFloatingPlayer();
  const theme = useAppTheme();
  const router = useRouter();

  // Don't render if no content is playing
  if (!player.content || !player.isMinimized) {
    return null;
  }

  const progressPercentage =
    player.duration > 0 ? Math.min(100, (player.currentTime / player.duration) * 100) : 0;
  const isAudio = player.type === 'audio';
  const hasControls = Boolean(player.controls);
  const handleExpand = () => {
    if (!player.content) return;
    maximize();
    router.push(buildPlayerRoute(player.content));
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 80, // Above the tab bar
        left: 12,
        right: 12,
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        gap: 10,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      {/* Progress Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          width: `${progressPercentage}%`,
          backgroundColor: theme.colors.primary,
        }}
      />

      {/* Album Art / Icon */}
      <TouchableOpacity
        onPress={handleExpand}
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: isAudio ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {player.content.imageUrl ? (
          <Image source={{ uri: player.content.imageUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <MaterialIcons
            name={isAudio ? 'graphic-eq' : 'play-circle'}
            size={20}
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>

      {/* Title and Type */}
      <TouchableOpacity
        onPress={handleExpand}
        style={{ flex: 1, minWidth: 0 }}
      >
        <CustomText
          variant="label"
          style={{
            color: theme.colors.text,
            fontSize: 12,
            fontWeight: '600',
          }}
          numberOfLines={1}
        >
          {player.content.title}
        </CustomText>
        <CustomText
          variant="caption"
          style={{
            color: theme.colors.textSecondary,
            fontSize: 10,
          }}
          numberOfLines={1}
        >
          {isAudio ? 'Music' : 'Video'} • {player.content.subtitle || 'ClaudyGod'}
        </CustomText>
      </TouchableOpacity>

      {/* Controls */}
      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
        {/* Play/Pause */}
        <TouchableOpacity
          onPress={hasControls ? (player.isPlaying ? pause : resume) : undefined}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
            opacity: hasControls ? 1 : 0.4,
          }}
        >
          <MaterialIcons
            name={player.isPlaying ? 'pause' : 'play-arrow'}
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Expand */}
        <TouchableOpacity
          onPress={handleExpand}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        >
          <MaterialIcons
            name="expand-less"
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Close */}
        <TouchableOpacity
          onPress={close}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        >
          <MaterialIcons
            name="close"
            size={16}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
