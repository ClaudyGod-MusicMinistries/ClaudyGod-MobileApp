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

  if (!player.content || !player.isMinimized) {
    return null;
  }

  const progressPercentage = player.duration > 0 ? Math.min(100, (player.currentTime / player.duration) * 100) : 0;
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
        bottom: 94,
        left: 14,
        right: 14,
        minHeight: 64,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderStrong ?? theme.colors.border,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.32,
        shadowRadius: 26,
        elevation: 18,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 9,
          gap: 10,
          backgroundColor: theme.colors.surface,
        }}
      >
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 3,
            width: `${progressPercentage}%`,
            backgroundColor: theme.colors.primary,
          }}
        />

        <TouchableOpacity
          onPress={handleExpand}
          activeOpacity={0.86}
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {player.content.imageUrl ? (
            <Image source={{ uri: player.content.imageUrl }} style={{ width: 46, height: 46 }} resizeMode="cover" />
          ) : (
            <MaterialIcons name={isAudio ? 'graphic-eq' : 'play-circle'} size={22} color={theme.colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleExpand} activeOpacity={0.86} style={{ flex: 1, minWidth: 0 }}>
          <CustomText variant="label" style={{ color: theme.colors.text, fontSize: 12.5 }} numberOfLines={1}>
            {player.content.title}
          </CustomText>
          <CustomText
            variant="caption"
            style={{ color: theme.colors.textSecondary, marginTop: 2, fontSize: 10.5 }}
            numberOfLines={1}
          >
            {isAudio ? 'Now playing' : 'Continue watching'} • {player.content.subtitle || 'ClaudyGod'}
          </CustomText>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={hasControls ? (player.isPlaying ? pause : resume) : undefined}
            activeOpacity={0.8}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primary,
              opacity: hasControls ? 1 : 0.48,
            }}
          >
            <MaterialIcons name={player.isPlaying ? 'pause' : 'play-arrow'} size={20} color={theme.colors.textInverse} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={close}
            activeOpacity={0.78}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(18,10,32,0.06)',
            }}
          >
            <MaterialIcons name="close" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
