import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface ContentGridCardProps {
  id: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  size?: 'small' | 'medium';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  cardOuter:   { flex: 1, borderRadius: 14, overflow: 'hidden' },
  cardInner:   { borderRadius: 14, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt },
  imgSection:  { alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  playBtn:     { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(167,139,250,0.9)', alignItems: 'center', justifyContent: 'center' },
  textPad:     { padding: 10 },
  titleBase:   { color: theme.colors.text, fontWeight: '600', lineHeight: 16 },
  subtitleText:{ color: theme.colors.textSecondary, fontSize: 11 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentGridCard({
  id: _id,
  imageUrl,
  title,
  subtitle,
  onPress,
  size = 'medium',
}: ContentGridCardProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const [pressed, setPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  const imageHeight = size === 'small' ? 140 : 180;

  return (
    <Animated.View style={[styles.cardOuter, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardInner}
      >
        <View
          style={[
            styles.imgSection,
            {
              height: imageHeight,
              backgroundColor: pressed ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.08)',
            },
          ]}
        >
          {imageUrl ? (
            <>
              <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(10,6,18,0.6)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </>
          ) : (
            <MaterialIcons name="music-note" size={32} color={theme.colors.secondary} />
          )}
          <View style={[styles.playBtn, { opacity: pressed ? 1 : 0.8 }]}>
            <MaterialIcons name="play-arrow" size={20} color={theme.colors.text} />
          </View>
        </View>

        <View style={styles.textPad}>
          <CustomText
            numberOfLines={2}
            style={[
              styles.titleBase,
              {
                fontSize: size === 'small' ? 12 : 13,
                marginBottom: subtitle ? 4 : 0,
              },
            ]}
          >
            {title}
          </CustomText>
          {subtitle && (
            <CustomText numberOfLines={1} style={styles.subtitleText}>{subtitle}</CustomText>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
