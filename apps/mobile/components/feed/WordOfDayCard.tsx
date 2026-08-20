import React from 'react';
import { View } from 'react-native';

import { CustomText } from '../CustomText';
import { AppIcon } from '../ui/AppIcon';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { useFeedStyles } from './styles';

type WordOfDayData = {
  title?: string | null;
  passage?: string | null;
  verse?: string | null;
  reflection?: string | null;
};

export function WordOfDayCard({ word, onPress, label = 'Word for today' }: { word: WordOfDayData; onPress: () => void; label?: string }) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();

  return (
    <FadeIn delay={80}>
      <TVTouchable onPress={onPress} showFocusBorder={false} pressScale={0.98} haptics>
        <View style={styles.wordCard}>
          <View style={styles.wordAccentBar} />
          <View style={styles.wordContent}>
            <View style={styles.wordLabelRow}>
              <AppIcon name="auto-stories" size={15} color={theme.colors.warning} />
              <CustomText variant="caption" style={styles.wordLabel}>{label}</CustomText>
            </View>
            <CustomText variant="title" style={styles.wordTitle} numberOfLines={2}>{word.title ?? word.passage}</CustomText>
            {(word.verse ?? word.reflection) ? (
              <CustomText variant="body" style={styles.wordBody} numberOfLines={3}>{word.verse ?? word.reflection}</CustomText>
            ) : null}
            <View style={styles.wordReadMore}>
              <CustomText variant="caption" style={styles.wordReadMoreText}>Read full message</CustomText>
              <AppIcon name="arrow-forward" size={14} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </TVTouchable>
    </FadeIn>
  );
}
