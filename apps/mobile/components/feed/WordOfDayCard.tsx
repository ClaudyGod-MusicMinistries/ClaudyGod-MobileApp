import React from 'react';
import { View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
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

export function WordOfDayCard({ word, onPress }: { word: WordOfDayData; onPress: () => void }) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();

  return (
    <FadeIn delay={80}>
      <TVTouchable onPress={onPress} showFocusBorder={false}>
        <View style={styles.wordCard}>
          <View style={styles.wordAccentBar} />
          <View style={styles.wordContent}>
            <View style={styles.wordLabelRow}>
              <MaterialIcons name="auto-stories" size={14} color={theme.colors.warning} />
              <CustomText variant="caption" style={styles.wordLabel}>Word for today</CustomText>
            </View>
            <CustomText variant="title" style={styles.wordTitle} numberOfLines={2}>{word.title ?? word.passage}</CustomText>
            {(word.verse ?? word.reflection) ? (
              <CustomText variant="body" style={styles.wordBody} numberOfLines={3}>{word.verse ?? word.reflection}</CustomText>
            ) : null}
            <View style={styles.wordReadMore}>
              <CustomText variant="caption" style={styles.wordReadMoreText}>Read full message</CustomText>
              <MaterialIcons name="arrow-forward" size={13} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </TVTouchable>
    </FadeIn>
  );
}
