import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

export interface YouTubeAudioTrack {
  id: string;
  title: string;
  artist?: string;
  youtubeVideoId: string;
  imageUrl?: string;
  duration?: string;
}

interface YouTubeAudioPlayerProps {
  track: YouTubeAudioTrack;
  autoPlay?: boolean;
  onClose?: () => void;
  compact?: boolean;
  onRegisterControls?: (_controls?: { pause: () => void; resume: () => void }) => void;
  onPlayStateChange?: (_isPlaying: boolean) => void;
  onProgress?: (_currentTime: number, _duration: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  currentTrackNumber?: number;
  totalTracks?: number;
}

// YouTube IFrame API HTML — muted=0 for audio, autoplay based on prop
function buildYouTubeHtml(videoId: string, autoplay: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { margin:0; padding:0; background:#000; }
  body { width:1px; height:1px; overflow:hidden; }
  #player { width:1px; height:1px; position:absolute; left:-9999px; }
</style>
</head>
<body>
<div id="player"></div>
<script>
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  var player;
  var ready = false;
  var pendingSeek = null;
  var progressInterval = null;

  function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
      videoId: '${videoId}',
      playerVars: {
        autoplay: ${autoplay ? 1 : 0},
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: function(e) {
          ready = true;
          if (pendingSeek !== null) { e.target.seekTo(pendingSeek, true); pendingSeek = null; }
          postState();
          startProgress();
        },
        onStateChange: function(e) {
          postState();
        },
        onError: function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: e.data }));
        }
      }
    });
  }

  function postState() {
    if (!player || !ready) return;
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'state',
        state: player.getPlayerState(),
        duration: player.getDuration() || 0,
        currentTime: player.getCurrentTime() || 0,
      }));
    } catch(e) {}
  }

  function startProgress() {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(function() {
      if (!player || !ready) return;
      try {
        var state = player.getPlayerState();
        if (state === 1) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'progress',
            currentTime: player.getCurrentTime() || 0,
            duration: player.getDuration() || 0,
          }));
        }
      } catch(e) {}
    }, 500);
  }

  // Commands from React Native
  document.addEventListener('message', handleCommand);
  window.addEventListener('message', handleCommand);
  function handleCommand(e) {
    try {
      var cmd = JSON.parse(e.data);
      if (!player || !ready) return;
      if (cmd.action === 'play') player.playVideo();
      if (cmd.action === 'pause') player.pauseVideo();
      if (cmd.action === 'seek') {
        if (ready) player.seekTo(cmd.seconds, true);
        else pendingSeek = cmd.seconds;
      }
    } catch(e2) {}
  }
</script>
</body>
</html>`;
}

type YTState = -1 | 0 | 1 | 2 | 3 | 5; // YT player states

export function YouTubeAudioPlayer({
  track,
  autoPlay = true,
  onClose,
  compact,
  onRegisterControls,
  onPlayStateChange,
  onProgress,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
  isFavorite,
  onFavoriteToggle,
  currentTrackNumber,
  totalTracks,
}: YouTubeAudioPlayerProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = Boolean(compact);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [playerError, setPlayerError] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const artScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.22)).current;
  const glowScale = useRef(new Animated.Value(1.0)).current;
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const sendCommand = useCallback((action: string, extra?: Record<string, unknown>) => {
    const msg = JSON.stringify({ action, ...extra });
    webViewRef.current?.injectJavaScript(
      `(function(){var e=new MessageEvent('message',{data:${JSON.stringify(msg)}});window.dispatchEvent(e);})();true;`,
    );
  }, []);

  const pause = useCallback(() => {
    sendCommand('pause');
  }, [sendCommand]);

  const resume = useCallback(() => {
    sendCommand('play');
  }, [sendCommand]);

  useEffect(() => {
    onRegisterControls?.({ pause, resume });
    return () => onRegisterControls?.(undefined);
  }, [pause, resume, onRegisterControls]);

  // Glow pulse in full mode
  useEffect(() => {
    if (!isCompact && isPlaying) {
      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowOpacity, { toValue: 0.45, duration: 1800, useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1.12, duration: 1800, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(glowOpacity, { toValue: 0.22, duration: 1800, useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1.0, duration: 1800, useNativeDriver: true }),
          ]),
        ]),
      );
      glowLoopRef.current.start();
    } else {
      glowLoopRef.current?.stop();
      glowOpacity.setValue(0.22);
      glowScale.setValue(1.0);
    }
    return () => { glowLoopRef.current?.stop(); };
  }, [isCompact, isPlaying, glowOpacity, glowScale]);

  const onWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: string;
        state?: YTState;
        currentTime?: number;
        duration?: number;
        code?: number;
      };

      if (msg.type === 'state' || msg.type === 'progress') {
        const ct = msg.currentTime ?? 0;
        const dur = msg.duration ?? 0;
        if (!isSeeking) setCurrentTime(ct);
        if (dur > 0) setDuration(dur);
        onProgress?.(ct, dur);
      }

      if (msg.type === 'state') {
        // YT states: -1=unstarted 0=ended 1=playing 2=paused 3=buffering 5=cued
        const playing = msg.state === 1 || msg.state === 3;
        setIsPlaying(playing);
        onPlayStateChange?.(playing);

        Animated.spring(artScale, {
          toValue: playing ? 1.04 : 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }).start();
      }

      if (msg.type === 'error') {
        setPlayerError(true);
      }
    } catch { /* ignore parse errors */ }
  }, [isSeeking, onProgress, onPlayStateChange, artScale]);

  const togglePlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const seek = useCallback((seconds: number) => {
    sendCommand('seek', { seconds });
    setCurrentTime(seconds);
  }, [sendCommand]);

  const skipBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    seek(Math.max(0, currentTime - 10));
  }, [currentTime, seek]);

  const skipForward = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    seek(Math.min(duration, currentTime + 10));
  }, [currentTime, duration, seek]);

  function formatTime(sec: number): string {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const progressFraction = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const artSize = isCompact ? 48 : Math.min(width * 0.52, 220);
  const imageUri = track.imageUrl || DEFAULT_CONTENT_IMAGE_URI;
  const html = buildYouTubeHtml(track.youtubeVideoId, autoPlay);

  // ── Compact layout ──────────────────────────────────────────────────────────
  if (isCompact) {
    return (
      <View style={[ss.compactRoot, styles.compactSurface]}>
        {/* Hidden WebView */}
        <View style={ss.hiddenWebView}>
          <WebView
            ref={webViewRef}
            source={{ html }}
            onMessage={onWebViewMessage}
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            style={ss.webViewStyle}
          />
        </View>

        {/* Artwork */}
        <Animated.View style={{ transform: [{ scale: artScale }] }}>
          <Image source={{ uri: imageUri }} style={ss.compactArt} resizeMode="cover" />
        </Animated.View>

        {/* Info */}
        <View style={ss.compactInfo}>
          <CustomText style={[ss.compactTitle, styles.compactTitle]} numberOfLines={1}>
            {track.title}
          </CustomText>
          <View style={ss.compactMeta}>
            <CustomText style={[ss.compactArtist, styles.compactArtist]} numberOfLines={1}>
              {track.artist || 'YouTube'}
            </CustomText>
            <View style={[ss.ytBadge, styles.ytBadgeBg]}>
              <CustomText style={[ss.ytBadgeText, styles.ytBadgeColor]}>YT Audio</CustomText>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={ss.compactControls}>
          {canGoPrevious && (
            <TVTouchable onPress={onPrevious} style={ss.iconBtn}>
              <MaterialIcons name="skip-previous" size={22} color={theme.colors.text} />
            </TVTouchable>
          )}
          <TVTouchable onPress={togglePlay} style={[ss.playBtn, styles.playBtnBg]}>
            <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={22} color="#fff" />
          </TVTouchable>
          {canGoNext && (
            <TVTouchable onPress={onNext} style={ss.iconBtn}>
              <MaterialIcons name="skip-next" size={22} color={theme.colors.text} />
            </TVTouchable>
          )}
          {onClose && (
            <TVTouchable onPress={onClose} style={ss.iconBtn}>
              <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
            </TVTouchable>
          )}
        </View>
      </View>
    );
  }

  // ── Full layout ─────────────────────────────────────────────────────────────
  return (
    <View style={[ss.fullRoot, styles.fullBg]}>
      {/* Hidden WebView */}
      <View style={ss.hiddenWebView}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          onMessage={onWebViewMessage}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          style={ss.webViewStyle}
        />
      </View>

      {/* Close */}
      {onClose && (
        <Pressable onPress={onClose} style={ss.closeBtn} hitSlop={12}>
          <MaterialIcons name="keyboard-arrow-down" size={28} color={theme.colors.textSecondary} />
        </Pressable>
      )}

      {/* Artwork with glow */}
      <View style={[ss.artWrapper, { width: artSize + 40, height: artSize + 40 }]}>
        <Animated.View
          style={[
            ss.glow,
            {
              width: artSize + 40,
              height: artSize + 40,
              borderRadius: (artSize + 40) / 2,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
            styles.glowColor,
          ]}
        />
        <Animated.Image
          source={{ uri: imageUri }}
          style={[ss.fullArt, { width: artSize, height: artSize, transform: [{ scale: artScale }] }]}
          resizeMode="cover"
        />
        {/* YouTube badge over artwork */}
        <View style={[ss.ytOverlayBadge, { backgroundColor: '#FF0000' }]}>
          <CustomText style={ss.ytOverlayText}>YouTube Audio</CustomText>
        </View>
      </View>

      {/* Error state */}
      {playerError && (
        <View style={ss.errorRow}>
          <MaterialIcons name="warning-amber" size={14} color={theme.colors.textSecondary} />
          <CustomText style={[ss.errorText, styles.errorColor]}>
            Playback issue — check your connection
          </CustomText>
        </View>
      )}

      {/* Title & Artist */}
      <View style={ss.metaBlock}>
        {currentTrackNumber !== undefined && totalTracks !== undefined && (
          <CustomText style={[ss.trackNum, styles.trackNumColor]}>
            {currentTrackNumber} / {totalTracks}
          </CustomText>
        )}
        <CustomText style={[ss.fullTitle, styles.fullTitleColor]} numberOfLines={2}>
          {track.title}
        </CustomText>
        <CustomText style={[ss.fullArtist, styles.fullArtistColor]} numberOfLines={1}>
          {track.artist || 'YouTube'}
        </CustomText>
      </View>

      {/* Progress bar */}
      <View style={ss.progressBlock}>
        <View
          style={[ss.progressTrack, styles.progressTrackBg]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            setIsSeeking(true);
            const x = e.nativeEvent.locationX;
            const trackWidth = width - 48;
            const frac = Math.max(0, Math.min(1, x / trackWidth));
            setSeekValue(frac * duration);
          }}
          onResponderMove={(e) => {
            const x = e.nativeEvent.locationX;
            const trackWidth = width - 48;
            const frac = Math.max(0, Math.min(1, x / trackWidth));
            setSeekValue(frac * duration);
          }}
          onResponderRelease={() => {
            setIsSeeking(false);
            seek(seekValue);
          }}
        >
          <View
            style={[
              ss.progressFill,
              styles.progressPrimary,
              { width: `${(isSeeking ? seekValue / Math.max(1, duration) : progressFraction) * 100}%` },
            ]}
          />
          <View
            style={[
              ss.progressThumb,
              styles.progressPrimary,
              { left: `${(isSeeking ? seekValue / Math.max(1, duration) : progressFraction) * 100}%` },
            ]}
          />
        </View>
        <View style={ss.progressTimes}>
          <CustomText style={[ss.timeText, styles.timeColor]}>
            {formatTime(isSeeking ? seekValue : currentTime)}
          </CustomText>
          <CustomText style={[ss.timeText, styles.timeColor]}>
            {formatTime(duration)}
          </CustomText>
        </View>
      </View>

      {/* Controls */}
      <View style={ss.controlsRow}>
        {/* Favorite */}
        {onFavoriteToggle ? (
          <TVTouchable onPress={onFavoriteToggle} style={ss.iconBtn} hitSlop={10}>
            <MaterialIcons
              name={isFavorite ? 'favorite' : 'favorite-border'}
              size={24}
              color={isFavorite ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TVTouchable>
        ) : (
          <View style={ss.iconBtn} />
        )}

        {/* Skip back 10 */}
        <TVTouchable onPress={skipBack} style={ss.iconBtn} hitSlop={8}>
          <MaterialIcons name="replay-10" size={30} color={theme.colors.text} />
        </TVTouchable>

        {/* Previous */}
        <TVTouchable
          onPress={onPrevious}
          style={[ss.iconBtn, !canGoPrevious && ss.disabled]}
          hitSlop={8}
          disabled={!canGoPrevious}
        >
          <MaterialIcons name="skip-previous" size={34} color={canGoPrevious ? theme.colors.text : theme.colors.textSecondary} />
        </TVTouchable>

        {/* Play/pause */}
        <TVTouchable
          onPress={togglePlay}
          style={[ss.mainPlayBtn, styles.mainPlayBtnBg]}
        >
          <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={38} color="#fff" />
        </TVTouchable>

        {/* Next */}
        <TVTouchable
          onPress={onNext}
          style={[ss.iconBtn, !canGoNext && ss.disabled]}
          hitSlop={8}
          disabled={!canGoNext}
        >
          <MaterialIcons name="skip-next" size={34} color={canGoNext ? theme.colors.text : theme.colors.textSecondary} />
        </TVTouchable>

        {/* Skip forward 10 */}
        <TVTouchable onPress={skipForward} style={ss.iconBtn} hitSlop={8}>
          <MaterialIcons name="forward-10" size={30} color={theme.colors.text} />
        </TVTouchable>

        {/* Spacer to balance favorite */}
        <View style={ss.iconBtn} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  // Compact
  compactSurface:     { backgroundColor: theme.colors.surface },
  compactTitle:       { color: theme.colors.text },
  compactArtist:      { color: theme.colors.textSecondary },
  ytBadgeBg:          { backgroundColor: `${theme.colors.primary}20` },
  ytBadgeColor:       { color: theme.colors.primary },
  playBtnBg:          { backgroundColor: theme.colors.primary },
  // Full
  fullBg:             { backgroundColor: theme.colors.background },
  glowColor:          { backgroundColor: theme.colors.primary },
  progressTrackBg:    { backgroundColor: theme.colors.surface },
  progressPrimary:    { backgroundColor: theme.colors.primary },
  timeColor:          { color: theme.colors.textSecondary },
  errorColor:         { color: theme.colors.textSecondary },
  trackNumColor:      { color: theme.colors.textSecondary },
  fullTitleColor:     { color: theme.colors.text },
  fullArtistColor:    { color: theme.colors.textSecondary },
  mainPlayBtnBg:      { backgroundColor: theme.colors.primary },
}));

const ss = StyleSheet.create({
  // Hidden WebView — must have non-zero dimensions on Android for YT API to initialise
  hiddenWebView: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    ...Platform.select({ android: { width: 2, height: 2 } }),
  },
  webViewStyle: { width: 1, height: 1, backgroundColor: 'transparent' },

  // Compact
  compactRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderRadius: 16,
  },
  compactArt: { width: 48, height: 48, borderRadius: 8 },
  compactInfo: { flex: 1, minWidth: 0 },
  compactMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  compactTitle: { fontSize: 13, fontWeight: '600' },
  compactArtist: { fontSize: 11, flex: 1 },
  compactControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 4 },
  playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  ytBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ytBadgeText: { fontSize: 8, fontWeight: '700' },

  // Full
  fullRoot: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  closeBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  artWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  glow: { position: 'absolute' },
  fullArt: { borderRadius: 16 },
  ytOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ytOverlayText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  errorText: { fontSize: 11 },
  metaBlock: { width: '100%', marginBottom: 20, gap: 4 },
  trackNum: { fontSize: 11, marginBottom: 2 },
  fullTitle: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  fullArtist: { fontSize: 14 },

  // Progress
  progressBlock: { width: '100%', marginBottom: 24 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: { height: 4, borderRadius: 2 },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: { fontSize: 11 },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
});
