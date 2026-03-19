import React from 'react';
import { View } from 'react-native';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { isHostedVideoUrl } from '../../util/playerRoute';

interface VideoPlayerProps {
  title?: string;
  sourceUri: string;
  height?: number;
}

export function VideoPlayer({ title, sourceUri, height = 210 }: VideoPlayerProps) {
  const theme = useAppTheme();
  const embedUrl = buildEmbedUrl(sourceUri);

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
            style: {
              width: '100%',
              height,
              backgroundColor: '#000000',
              display: 'block',
            },
          })}

      {title ? (
        <View style={{ padding: theme.spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
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
