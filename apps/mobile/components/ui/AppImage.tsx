// components/ui/AppImage.tsx
// Unified image component: resizeMode always set, skeleton while loading, fallback on error.
// Use this instead of bare <Image> or <ImageBackground> everywhere in the app.
import React, { useState } from 'react';
import {
  StyleSheet,
  type ImageResizeMode,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { Image, type ImageContentFit, type ImageSource } from 'expo-image';
import { makeStyles } from '../../styles/makeStyles';
import { common } from '../../styles/commonStyles';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';

interface AppImageProps {
  /** Remote URI string. Provide this or `source`, not both. */
  uri?: string | null;
  /** Static require() source. Use for local assets. */
  source?: ImageSource | number;
  /** Container style — controls size and position. Always set width + height here. */
  style?: StyleProp<ViewStyle>;
  /** Extra style applied directly to the <Image> element (use sparingly). */
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  /** URI to display when the primary source fails to load. Falls back to brand default. */
  fallbackUri?: string;
  /** Border radius applied to both the container and image. */
  borderRadius?: number;
  /** Show animated skeleton while loading. Default true for URI images. */
  showSkeleton?: boolean;
  testID?: string;
}

const RESIZE_MODE_TO_CONTENT_FIT: Record<ImageResizeMode, ImageContentFit> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  center: 'none',
  repeat: 'cover',
  none: 'none',
};

const useStyles = makeStyles((theme) => ({
  container: {
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
  },
  skeleton: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: theme.colors.surfaceAlt,
  },
  image: {
    width: '100%',
    height: '100%',
  },
}));

export function AppImage({
  uri,
  source,
  style,
  imageStyle,
  resizeMode = 'cover',
  fallbackUri,
  borderRadius,
  showSkeleton = true,
  testID,
}: AppImageProps) {
  const styles = useStyles();
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const handleLoad = () => setLoading(false);

  const handleError = () => {
    setErrored(true);
    setLoading(false);
  };

  const resolvedSource: ImageSource | number = (() => {
    if (source) return source;
    const activeUri = errored
      ? (fallbackUri ?? DEFAULT_CONTENT_IMAGE_URI)
      : (uri ?? fallbackUri ?? DEFAULT_CONTENT_IMAGE_URI);
    return { uri: activeUri };
  })();

  const containerStyle = [
    styles.container,
    borderRadius !== undefined && { borderRadius },
    style,
  ];

  const resolvedImageStyle = StyleSheet.flatten([
    styles.image as ImageStyle,
    borderRadius !== undefined ? { borderRadius } : undefined,
    imageStyle,
  ]);

  return (
    <View style={containerStyle} testID={testID}>
      <Image
        source={resolvedSource}
        style={resolvedImageStyle}
        contentFit={RESIZE_MODE_TO_CONTENT_FIT[resizeMode]}
        transition={200}
        onLoad={handleLoad}
        onError={handleError}
      />
      {showSkeleton && uri && !source && loading && (
        <View style={[common.fill, styles.skeleton]} pointerEvents="none" />
      )}
    </View>
  );
}
