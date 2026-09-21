import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { VideoView, useVideoPlayer } from 'expo-video';
import Reanimated, {
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '../../util/colorScheme';

// ─── Aurora blob layer ──────────────────────────────────────────────────────
//
// Three oversized color fields drifting on independent loops, softened by the
// BlurView below into a "mesh gradient" wash. This is the hero's base layer —
// it needs no photography or footage, looks intentional on its own, and is
// what any optional background video (HeroVideoLayer) sits on top of.

function AuroraBlob({
  size,
  top,
  left,
  colors,
  duration,
  reduceMotion,
}: {
  size: number;
  top: number;
  left: number;
  colors: readonly [string, string];
  duration: number;
  reduceMotion: boolean;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    translateX.value = withRepeat(
      withSequence(
        withTiming(size * 0.18, { duration, easing: ReanimatedEasing.inOut(ReanimatedEasing.sin) }),
        withTiming(-size * 0.14, { duration: duration * 1.1, easing: ReanimatedEasing.inOut(ReanimatedEasing.sin) }),
      ),
      -1,
      true,
    );
    translateY.value = withRepeat(
      withTiming(size * 0.16, { duration: duration * 1.3, easing: ReanimatedEasing.inOut(ReanimatedEasing.sin) }),
      -1,
      true,
    );
    scale.value = withRepeat(
      withTiming(1.15, { duration: duration * 1.4, easing: ReanimatedEasing.inOut(ReanimatedEasing.sin) }),
      -1,
      true,
    );
  }, [duration, reduceMotion, scale, size, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Reanimated.View
      style={[
        { position: 'absolute', top, left, width: size, height: size, borderRadius: size / 2, overflow: 'hidden' },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Reanimated.View>
  );
}

// ─── Optional footage layer ─────────────────────────────────────────────────
//
// Muted, looping, autoplaying decorative video — no controls, no audio focus.
// Only mounted when a source is supplied, so useVideoPlayer never runs against
// an empty source; see BRAND_HERO_VIDEO_ASSET in util/brandAssets.ts for how
// to wire an actual clip in.

function HeroVideoLayer({ source }: { source: number | string }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.staysActiveInBackground = false;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFillObject}
      nativeControls={false}
      contentFit="cover"
      allowsFullscreen={false}
      allowsPictureInPicture={false}
      pointerEvents="none"
    />
  );
}

// ─── Light sweep ─────────────────────────────────────────────────────────────
//
// A single diagonal highlight that crosses the hero once on first paint —
// reads as a cinematic "reveal" rather than a static gradient appearing.

function HeroLightSweep({
  width,
  height,
  reduceMotion,
}: {
  width: number;
  height: number;
  reduceMotion: boolean;
}) {
  const bandWidth = Math.max(width, height) * 0.6;
  const travel = width + height; // covers the diagonal at any aspect ratio
  const translateX = useSharedValue(-travel);
  const sweepOpacity = useSharedValue(reduceMotion ? 0 : 1);

  useEffect(() => {
    if (reduceMotion) return;
    translateX.value = withDelay(
      250,
      withTiming(travel, { duration: 1100, easing: ReanimatedEasing.out(ReanimatedEasing.cubic) }),
    );
    sweepOpacity.value = withDelay(1200, withTiming(0, { duration: 300 }));
  }, [reduceMotion, sweepOpacity, translateX, travel]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sweepOpacity.value,
    transform: [{ translateX: translateX.value }, { rotate: '18deg' }],
  }));

  if (reduceMotion) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}>
      <Reanimated.View
        style={[
          { position: 'absolute', top: -height * 0.5, width: bandWidth, height: height * 2 },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Reanimated.View>
    </View>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

export interface HeroBackgroundProps {
  width: number;
  height: number;
  reduceMotion: boolean;
  /** A `require(...)` result or remote URI for a looping decorative clip. Omit to use the aurora wash alone. */
  videoSource?: number | string;
}

export function HeroBackground({ width, height, reduceMotion, videoSource }: HeroBackgroundProps) {
  const theme = useAppTheme();

  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: theme.colors.background }}>
      <View style={StyleSheet.absoluteFillObject}>
        <AuroraBlob
          size={width * 1.1}
          top={-height * 0.15}
          left={-width * 0.25}
          colors={[theme.colors.primary, theme.colors.secondary]}
          duration={9000}
          reduceMotion={reduceMotion}
        />
        <AuroraBlob
          size={width * 1.3}
          top={height * 0.32}
          left={width * 0.25}
          colors={[theme.colors.accent, theme.colors.secondary]}
          duration={11000}
          reduceMotion={reduceMotion}
        />
        <AuroraBlob
          size={width * 0.9}
          top={height * 0.55}
          left={-width * 0.3}
          colors={[theme.colors.accentAlt, theme.colors.primary]}
          duration={13000}
          reduceMotion={reduceMotion}
        />
      </View>

      {videoSource ? <HeroVideoLayer source={videoSource} /> : null}

      {/* Frosted-glass blur fuses the blobs (and video, if present) into one soft
          field instead of a hard-edged gradient. expo-blur degrades to a plain
          translucent layer where native blur isn't available, which still reads
          fine under the tint below. */}
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />

      <HeroLightSweep width={width} height={height} reduceMotion={reduceMotion} />

      {/* Brand tint + bottom scrim, so copy stays legible over any of the above */}
      <LinearGradient
        colors={['rgba(124,58,237,0.28)', theme.colors.mediaScrim, theme.colors.mediaScrimStrong]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}
