// components/sections/HeroBanner.tsx
import React from 'react';
import { View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { AppButton } from '../ui/AppButton';

interface HeroBannerProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  onPlay?: () => void;
  onSave?: () => void;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.radius.lg, overflow: 'hidden',
    backgroundColor: theme.colors.surface, marginBottom: theme.spacing.lg,
  },
  heroImage:   { width: '100%', height: 210 },
  gradient:    { position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 },
  contentWrap: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  titleText:   { color: theme.colors.mediaText },
  subtitleText: { color: theme.colors.mediaTextMuted, marginTop: 6 },
  btnRow:      { flexDirection: 'row', marginTop: 12 },
  playBtnStyle: { marginRight: 10 },
  saveBtnStyle: { borderColor: theme.colors.mediaBorder, backgroundColor: theme.colors.mediaControl },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroBanner({ imageUrl, title, subtitle, onPlay, onSave }: HeroBannerProps) {
  const styles = useStyles();
  const theme = useAppTheme();

  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', theme.colors.mediaScrimStrong]}
        style={styles.gradient}
      />
      <View style={styles.contentWrap}>
        <CustomText variant="heading" style={styles.titleText}>{title}</CustomText>
        <CustomText variant="body" style={styles.subtitleText}>{subtitle}</CustomText>
        <View style={styles.btnRow}>
          <AppButton
            title="Play"
            variant="primary"
            size="sm"
            onPress={onPlay}
            leftIcon={<MaterialIcons name="play-arrow" size={18} color={theme.colors.textInverse} />}
            style={styles.playBtnStyle}
          />
          <AppButton
            title="Save"
            variant="outline"
            size="sm"
            onPress={onSave}
            leftIcon={<MaterialIcons name="add" size={18} color={theme.colors.mediaText} />}
            textColor={theme.colors.mediaText}
            style={styles.saveBtnStyle}
          />
        </View>
      </View>
    </View>
  );
}
