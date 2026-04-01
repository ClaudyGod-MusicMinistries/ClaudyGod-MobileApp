import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { isHostedVideoUrl } from '../../util/playerRoute';

interface VideoPlayerProps {
  title?: string;
  sourceUri: string;
  height?: number;
  onRegisterControls?: (_controls?: { pause: () => void; resume: () => void }) => void;
  onPlayStateChange?: (_isPlaying: boolean) => void;
  onProgress?: (_currentTime: number, _duration: number) => void;
}

export function VideoPlayer({
  title,
  sourceUri,
  height = 210,
  onRegisterControls,
  onPlayStateChange,
  onProgress,
}: VideoPlayerProps) {
  const theme = useAppTheme();
  const embedUrl = buildEmbedUrl(sourceUri);
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (embedUrl) {
      onRegisterControls?.(undefined);
      return;
    }

    const element = videoRef.current;
    if (!element) return;

    onRegisterControls?.({
      pause: () => element.pause?.(),
      resume: () => void element.play?.(),
    });

    const handlePlay = () => onPlayStateChange?.(true);
    const handlePause = () => onPlayStateChange?.(false);
    const handleTime = () => onProgress?.(element.currentTime || 0, element.duration || 0);

    element.addEventListener('play', handlePlay);
    element.addEventListener('pause', handlePause);
    element.addEventListener('timeupdate', handleTime);

    return () => {
      element.removeEventListener('play', handlePlay);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('timeupdate', handleTime);
      onRegisterControls?.(undefined);
    };
  }, [embedUrl, onPlayStateChange, onProgress, onRegisterControls]);

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      {embedUrl
        ? React.createElement('iframe', {
            src: embedUrl,
            allow:
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            allowFullScreen: true,
            referrerPolicy: 'strict-origin-when-cross-origin',
            style: {
              width: '100%',
              height,
              backgroundColor: '#000000',
              display: 'block',
              border: 'none',
            },
            title: title || 'ClaudyGod video',
          })
        : React.createElement('video', {
            controls: true,
            src: sourceUri,
            playsInline: true,
            preload: 'metadata',
            ref: videoRef,
            style: {
              width: '100%',
              height,
              backgroundColor: '#000000',
              display: 'block',
            },
          })}

      {title ? (
        <View style={{ padding: theme.spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
            {title}
          </CustomText>
        </View>
      ) : null}
    </View>
  );
}

function buildEmbedUrl(sourceUri: string): string | null {
  const value = String(sourceUri || '').trim();
  if (!value || !isHostedVideoUrl(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = url.pathname.replace(/^\/+/, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host.includes('youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
