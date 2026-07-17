import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { CustomText } from '../CustomText';
import { makeStyles } from '../../styles/makeStyles';
import { isHostedVideoUrl } from '../../util/playerRoute';

const useStyles = makeStyles((theme) => ({
  container: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  titlePad:  { padding: theme.spacing.md },
  titleText: { color: theme.colors.text },
  fallbackRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  fallbackLink: { color: theme.colors.primary },
}));

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
  const styles = useStyles();
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
    <View style={styles.container}>
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

      {embedUrl ? (
        // Cross-origin iframes can't report playback failures (region/privacy
        // restrictions, deleted/private videos) back to this parent page — if
        // the embed silently fails for any reason we can't detect, this is the
        // user's only way to actually reach the video instead of a dead black box.
        <View style={styles.fallbackRow}>
          {React.createElement(
            'a',
            { href: sourceUri, target: '_blank', rel: 'noopener noreferrer' },
            React.createElement(CustomText, { variant: 'caption', style: styles.fallbackLink }, 'Open original video ↗'),
          )}
        </View>
      ) : null}

      {title ? (
        <View style={styles.titlePad}>
          <CustomText variant="subtitle" style={styles.titleText}>
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

  // YouTube validates the embedding page against `origin` — omitting it is a
  // real, documented cause of embeds that load (200 on /embed/<id>) but then
  // fail to initialize/play inside the iframe. `playsinline`/`rel`/
  // `modestbranding` match what the native player already sends via its
  // YouTube IFrame API bootstrap; the plain <iframe> path here had none of them.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const youtubeParams = `rel=0&modestbranding=1&playsinline=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = url.pathname.replace(/^\/+/, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}?${youtubeParams}` : null;
    }

    if (host.includes('youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}?${youtubeParams}` : null;
    }

    if (host.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}?playsinline=1` : null;
    }
  } catch {
    return null;
  }

  return null;
}
