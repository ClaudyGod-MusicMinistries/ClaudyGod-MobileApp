import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { CustomText } from '../CustomText';
import { isHostedVideoUrl } from '../../util/playerRoute';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const CONTROLS_HIDE_DELAY = 3500;

// ─── Public API ───────────────────────────────────────────────────────────────

export interface VideoPlayerProps {
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
  height = 224,
  onRegisterControls,
  onPlayStateChange,
  onProgress,
}: VideoPlayerProps) {
  const embedUrl = buildEmbedUrl(sourceUri);

  if (embedUrl) {
    return (
      <EmbedPlayer
        title={title}
        sourceUri={sourceUri}
        embedUrl={embedUrl}
        height={height}
      />
    );
  }

  return (
    <NativeVideoPlayer
      title={title}
      sourceUri={sourceUri}
      height={height}
      onRegisterControls={onRegisterControls}
      onPlayStateChange={onPlayStateChange}
      onProgress={onProgress}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  container: {
    borderRadius: 18,
    backgroundColor: '#000000',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  loadingShell: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    zIndex: 5,
    backgroundColor: theme.colors.background,
  },
  loadingIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: theme.colors.primarySurface,
    borderColor: theme.colors.primaryBorder,
  },
  loadingLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  errorShell: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  errorLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
    backgroundColor: theme.colors.primarySurface,
    borderColor: theme.colors.primaryBorder,
  },
  openExternalText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.divider,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.1,
    color: theme.colors.text,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
    backgroundColor: theme.colors.primary,
  },
}));

// ─── Static palette-independent styles ────────────────────────────────────────

const ss = StyleSheet.create({
  // External pill (YouTube)
  externalPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  externalPillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },

  // Buffering
  bufferingShell: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  bufferingRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
  },

  // Seek flash zones
  seekFlashZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.22)', // seek flash overlay — intentionally violet on video
  },
  seekFlashLeft:  { left: 0 },
  seekFlashRight: { right: 0 },

  // Controls overlay
  overlayTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  overlayTitleText: {
    color: '#FFFFFF', // on-video overlay — always white
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Center play/pause controls
  centerRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  sideSeekBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  playPauseBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  timeText: {
    color: 'rgba(255,255,255,0.88)', // on-video overlay — always white
    fontSize: 11.5,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  fsBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress bar
  progressHit: {
    flex: 1,
    height: 22,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.24)',
    overflow: 'visible',
  },
  progressThumb: {
    position: 'absolute',
    right: -7,
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
});

// ─── EmbedPlayer — YouTube / Vimeo via WebView ───────────────────────────────

function EmbedPlayer({
  title,
  sourceUri,
  embedUrl,
  height,
}: {
  title?: string;
  sourceUri: string;
  embedUrl: string;
  height: number;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const shimmerOpacity = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    shimmerOpacity.setValue(1);

    shimmerAnim.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, { toValue: 0.45, duration: 900, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(shimmerOpacity, { toValue: 1, duration: 900, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    shimmerAnim.current.start();
    return () => { shimmerAnim.current?.stop(); };
  }, [shimmerOpacity, sourceUri]);

  const handleLoaded = () => {
    shimmerAnim.current?.stop();
    setLoaded(true);
    Animated.timing(shimmerOpacity, { toValue: 0, duration: 280, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  return (
    <View style={styles.container}>
      <View style={{ height, backgroundColor: '#000' }}>
        {!error ? (
          <WebView
            source={{ uri: embedUrl }}
            style={{ width: '100%', height, backgroundColor: '#000' }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            onLoad={handleLoaded}
            onError={() => { shimmerAnim.current?.stop(); setError(true); }}
          />
        ) : null}

        {/* Branded loading state */}
        {!loaded && !error ? (
          <Animated.View style={[styles.loadingShell, { opacity: shimmerOpacity }]}>
            <View style={styles.loadingIconRing}>
              <MaterialIcons name="smart-display" size={36} color={theme.colors.primary} />
            </View>
            <CustomText style={styles.loadingLabel}>Loading video…</CustomText>
          </Animated.View>
        ) : null}

        {/* Error state */}
        {error ? (
          <View style={styles.errorShell}>
            <MaterialIcons name="videocam-off" size={38} color={theme.colors.textMuted} />
            <CustomText style={styles.errorLabel}>Could not load video</CustomText>
            <Pressable
              onPress={() => void Linking.openURL(sourceUri)}
              style={styles.openExternalBtn}
            >
              <MaterialIcons name="open-in-new" size={14} color={theme.colors.primary} />
              <CustomText style={styles.openExternalText}>Open on YouTube</CustomText>
            </Pressable>
          </View>
        ) : null}

        {/* Open externally — top-right pill, appears after load */}
        {loaded ? (
          <Pressable
            onPress={() => void Linking.openURL(sourceUri)}
            style={ss.externalPill}
          >
            <MaterialIcons name="open-in-new" size={12} color="rgba(255,255,255,0.85)" />
            <CustomText style={ss.externalPillText}>YouTube</CustomText>
          </Pressable>
        ) : null}
      </View>

      {title ? <TitleRow title={title} /> : null}
    </View>
  );
}

// ─── NativeVideoPlayer — expo-video with full custom controls ─────────────────

function NativeVideoPlayer({
  title,
  sourceUri,
  height,
  onRegisterControls,
  onPlayStateChange,
  onProgress,
}: {
  title?: string;
  sourceUri: string;
  height: number;
  onRegisterControls?: VideoPlayerProps['onRegisterControls'];
  onPlayStateChange?: VideoPlayerProps['onPlayStateChange'];
  onProgress?: VideoPlayerProps['onProgress'];
}) {
  const styles = useStyles();
  const player = useVideoPlayer(sourceUri, (p) => {
    p.loop = false;
    p.muted = false;
    p.staysActiveInBackground = false;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [controlsShown, setControlsShown] = useState(true);

  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekFlashL = useRef(new Animated.Value(0)).current;
  const seekFlashR = useRef(new Animated.Value(0)).current;

  // Poll playback state
  useEffect(() => {
    const poll = () => {
      const ct = typeof player.currentTime === 'number' ? player.currentTime : 0;
      const dur = typeof player.duration === 'number' ? player.duration : 0;
      const playing = Boolean(player.playing);
      const status = (player as unknown as { status?: string }).status ?? '';

      setCurrentTime(ct);
      setDuration(dur);
      setIsPlaying(playing);
      setIsBuffering(status === 'loading');
      onProgress?.(ct, dur);
      onPlayStateChange?.(playing);
    };
    poll();
    const id = setInterval(poll, 250);
    return () => clearInterval(id);
  }, [player, onProgress, onPlayStateChange]);

  useEffect(() => {
    onRegisterControls?.({ pause: () => player.pause(), resume: () => player.play() });
    return () => { onRegisterControls?.(undefined); };
  }, [onRegisterControls, player]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }).start(() => {
        setControlsShown(false);
      });
    }, CONTROLS_HIDE_DELAY);
  }, [controlsOpacity]);

  const bringUpControls = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setControlsShown(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }).start();
    scheduleHide();
  }, [controlsOpacity, scheduleHide]);

  useEffect(() => {
    if (isPlaying) scheduleHide();
    else bringUpControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [isPlaying, scheduleHide, bringUpControls]);

  const flashSeek = (side: 'left' | 'right') => {
    const anim = side === 'left' ? seekFlashL : seekFlashR;
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  };

  const seekRelative = (seconds: number) => {
    const next = Math.max(0, Math.min(currentTime + seconds, duration));
    player.currentTime = next;
    flashSeek(seconds < 0 ? 'left' : 'right');
    bringUpControls();
  };

  const seekToRatio = (ratio: number) => {
    player.currentTime = Math.max(0, Math.min(ratio * duration, duration));
    bringUpControls();
  };

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    bringUpControls();
  };

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <View style={styles.container}>
      <Pressable style={{ height }} onPress={bringUpControls}>
        {/* Video surface */}
        <VideoView
          player={player}
          style={{ width: '100%', height }}
          nativeControls={false}
          contentFit="contain"
          allowsFullscreen
        />

        {/* Buffering */}
        {isBuffering ? (
          <View style={ss.bufferingShell}>
            <View style={ss.bufferingRing}>
              <MaterialIcons name="hourglass-top" size={24} color="rgba(255,255,255,0.70)" />
            </View>
          </View>
        ) : null}

        {/* Seek flash — left */}
        <Animated.View
          style={[ss.seekFlashZone, ss.seekFlashLeft, { opacity: seekFlashL }]}
          pointerEvents="none"
        >
          <MaterialIcons name="replay-10" size={34} color="#FFFFFF" />
        </Animated.View>

        {/* Seek flash — right */}
        <Animated.View
          style={[ss.seekFlashZone, ss.seekFlashRight, { opacity: seekFlashR }]}
          pointerEvents="none"
        >
          <MaterialIcons name="forward-10" size={34} color="#FFFFFF" />
        </Animated.View>

        {/* Controls overlay */}
        {controlsShown ? (
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: controlsOpacity }]}
            pointerEvents="box-none"
          >
            {/* Top gradient scrim */}
            <LinearGradient
              colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0)']}
              style={[StyleSheet.absoluteFill, { bottom: '55%' }]}
              pointerEvents="none"
            />
            {/* Bottom gradient scrim */}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.88)']}
              style={[StyleSheet.absoluteFill, { top: '50%' }]}
              pointerEvents="none"
            />

            {/* Title overlay — top */}
            {title ? (
              <View style={ss.overlayTopBar}>
                <CustomText style={ss.overlayTitleText} numberOfLines={1}>
                  {title}
                </CustomText>
              </View>
            ) : null}

            {/* Center controls */}
            <View style={ss.centerRow} pointerEvents="box-none">
              {/* Rewind */}
              <Pressable onPress={() => seekRelative(-10)} style={ss.sideSeekBtn}>
                <MaterialIcons name="replay-10" size={28} color="#FFFFFF" />
              </Pressable>

              {/* Play / Pause */}
              <Pressable onPress={togglePlay} style={ss.playPauseBtn}>
                <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={36}
                  color="#FFFFFF"
                />
              </Pressable>

              {/* Forward */}
              <Pressable onPress={() => seekRelative(10)} style={ss.sideSeekBtn}>
                <MaterialIcons name="forward-10" size={28} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Bottom bar */}
            <View style={ss.bottomBar}>
              <CustomText style={ss.timeText}>{formatTime(currentTime)}</CustomText>
              <ProgressBar progress={progress} onSeek={seekToRatio} />
              <CustomText style={ss.timeText}>{formatTime(duration)}</CustomText>
              <Pressable
                onPress={() => {
                  /* expo-video handles fullscreen natively when user taps fullscreen button;
                     we expose the VideoView's built-in allowsFullscreen — this just
                     re-shows controls as a user feedback. */
                  bringUpControls();
                }}
                style={ss.fsBtn}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <MaterialIcons name="fullscreen" size={22} color="rgba(255,255,255,0.85)" />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </Pressable>

      {title ? <TitleRow title={title} /> : null}
    </View>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

function ProgressBar({
  progress,
  onSeek,
}: {
  progress: number;
  onSeek: (_ratio: number) => void;
}) {
  const styles = useStyles();
  const trackRef = useRef<View>(null);

  const handlePress = (e: { nativeEvent: { pageX: number } }) => {
    trackRef.current?.measure((_x, _y, width, _h, pageX) => {
      if (!width) return;
      onSeek(Math.max(0, Math.min((e.nativeEvent.pageX - pageX) / width, 1)));
    });
  };

  return (
    <Pressable
      ref={trackRef as React.Ref<View>}
      onPress={handlePress}
      style={ss.progressHit}
    >
      <View style={ss.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as unknown as number }]}>
          <View style={ss.progressThumb} />
        </View>
      </View>
    </Pressable>
  );
}

// ─── TitleRow ─────────────────────────────────────────────────────────────────

function TitleRow({ title }: { title: string }) {
  const styles = useStyles();
  return (
    <View style={styles.titleRow}>
      <CustomText style={styles.titleText} numberOfLines={2}>{title}</CustomText>
    </View>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildEmbedUrl(sourceUri: string): string | null {
  const value = String(sourceUri || '').trim();
  if (!value || !isHostedVideoUrl(value)) return null;

  const params = 'autoplay=1&rel=0&modestbranding=1&playsinline=1&color=ffffff';

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = url.pathname.replace(/^\/+/, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}?${params}` : null;
    }
    if (host.includes('youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}?${params}` : null;
    }
    if (host.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&playsinline=1&color=8B5CF6` : null;
    }
  } catch {
    return null;
  }

  return null;
}
