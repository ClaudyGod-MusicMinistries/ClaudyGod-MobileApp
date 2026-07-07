import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { common, fillAbsolute } from '../../styles/commonStyles';
import type { WordOfDayItem } from '../../services/wordOfDayService';

const SHOWN_DATE_KEY = 'claudygod.word_modal.last_shown';
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const PRIMARY_FAINT = 'rgba(139,92,246,0.12)';
const PRIMARY_LIGHT = 'rgba(139,92,246,0.22)';

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function shouldShowWordModal(): Promise<boolean> {
  try {
    const last = await AsyncStorage.getItem(SHOWN_DATE_KEY);
    return last !== todayDateString();
  } catch {
    return true;
  }
}

export async function markWordModalShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(SHOWN_DATE_KEY, todayDateString());
  } catch {
    // non-fatal
  }
}

function formatDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // Backdrop
  backdrop:            { ...fillAbsolute, backgroundColor: 'rgba(7,5,12,0.80)' },
  backfill:            { ...fillAbsolute },

  // Layout
  centerer:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },

  // Card shell
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius:    theme.radius.xxl,
    borderWidth:     1,
    borderColor:     theme.colors.border,
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.28,
    shadowRadius:    20,
    elevation:       12,
  },
  accentBar:           { height: 4, backgroundColor: theme.colors.primary },
  scrollContent:       { padding: 24, gap: 20 },

  // Modal header
  headerWrapper:       { alignItems: 'center', gap: 4 },
  headerIcon: {
    width: 48, height: 48, borderRadius: 15,
    backgroundColor: PRIMARY_FAINT,
    borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.26)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  headerLabel: {
    color: theme.colors.primary, fontSize: 10, fontWeight: '800',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  headerDate:          { color: theme.colors.textMuted, fontSize: 12 },

  // Divider
  dividerRow:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine:         { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: {
    color: theme.colors.textMuted, fontSize: 9.5,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  // Action buttons
  actions:             { gap: 10, paddingTop: 4 },
  btnPrimary: {
    height: 52, borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  btnPrimaryText:      { color: theme.colors.textInverse, fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    height: 46, borderRadius: theme.radius.xl,
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSecondaryText:    { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },

  // VerseBlock
  verseGap:            { gap: 10 },
  verseLabelRow:       { flexDirection: 'row', alignItems: 'center', gap: 7 },
  verseIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: PRIMARY_FAINT,
    borderWidth: 1, borderColor: PRIMARY_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  verseLabel: {
    color: theme.colors.primary, fontSize: 10, fontWeight: '800',
    letterSpacing: 1.4, textTransform: 'uppercase',
  },
  verseTitle: {
    color: theme.colors.text, fontSize: 17, fontWeight: '800',
    letterSpacing: -0.3, lineHeight: 23,
  },
  versePassagePill: {
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 11,
    borderRadius: 20, backgroundColor: PRIMARY_FAINT,
    borderWidth: 1, borderColor: PRIMARY_LIGHT,
  },
  versePassageText:    { color: theme.colors.primary, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 },
  verseQuoteBar:       { borderLeftWidth: 3, borderLeftColor: theme.colors.primary, paddingLeft: 12 },
  verseQuoteText: {
    color: theme.colors.text, fontSize: 14, lineHeight: 22,
    fontStyle: 'italic', fontWeight: '500',
  },
  verseReflectionBox:    { backgroundColor: PRIMARY_FAINT, borderRadius: theme.radius.card, padding: 12 },
  verseReflectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  verseReflectionLabel: {
    color: theme.colors.primary, fontSize: 9, fontWeight: '800',
    letterSpacing: 1.4, textTransform: 'uppercase',
  },
  verseReflectionText:   { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
}));

// ─── Sub-components ──────────────────────────────────────────────────────────

function VerseBlock({ word, label, icon }: {
  word: WordOfDayItem;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  const styles = useStyles();
  const theme = useAppTheme();

  return (
    <View style={styles.verseGap}>
      <View style={styles.verseLabelRow}>
        <View style={styles.verseIconBox}>
          <MaterialIcons name={icon} size={14} color={theme.colors.primary} />
        </View>
        <CustomText style={styles.verseLabel}>{label}</CustomText>
      </View>

      {word.title ? (
        <CustomText style={styles.verseTitle}>{word.title}</CustomText>
      ) : null}

      {word.passage ? (
        <View style={styles.versePassagePill}>
          <CustomText style={styles.versePassageText}>{word.passage}</CustomText>
        </View>
      ) : null}

      {word.verse ? (
        <View style={styles.verseQuoteBar}>
          <CustomText style={styles.verseQuoteText}>{'"'}{word.verse}{'"'}</CustomText>
        </View>
      ) : null}

      {word.reflection ? (
        <View style={styles.verseReflectionBox}>
          <View style={styles.verseReflectionHeader}>
            <MaterialIcons name="lightbulb-outline" size={12} color={theme.colors.primary} />
            <CustomText style={styles.verseReflectionLabel}>Reflection</CustomText>
          </View>
          <CustomText style={styles.verseReflectionText}>{word.reflection}</CustomText>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface WordOfDayModalProps {
  visible: boolean;
  bibleVerse: WordOfDayItem | null;
  adminWord: WordOfDayItem | null;
  onClose: () => void;
  onReadMore: () => void;
}

export function WordOfDayModal({
  visible,
  bibleVerse,
  adminWord,
  onClose,
  onReadMore,
}: WordOfDayModalProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale      = useRef(new Animated.Value(0.88)).current;
  const cardOpacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    if (visible) {
      anim = Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 240, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 58, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }),
      ]);
    } else {
      cardScale.setValue(0.88);
      anim = Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 140, useNativeDriver: USE_NATIVE_DRIVER }),
      ]);
    }
    anim.start();
    return () => anim.stop();
  }, [visible, backdropOpacity, cardOpacity, cardScale]);

  const handleReadMore = useCallback(() => {
    onClose();
    setTimeout(onReadMore, 200);
  }, [onClose, onReadMore]);

  const cardWidth  = Math.min(width - 40, 400);
  const hasBoth    = bibleVerse !== null && adminWord !== null;

  if (!bibleVerse && !adminWord) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(7,5,12,0.85)" barStyle="light-content" />

      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={styles.backfill} onPress={onClose} />
      </Animated.View>

      <View style={styles.centerer}>
        <Animated.View
          style={[
            styles.card,
            { width: cardWidth, maxHeight: height * 0.85, opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
        >
          <View style={styles.accentBar} />

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[styles.headerWrapper, common.centerH]}>
              <View style={styles.headerIcon}>
                <MaterialIcons name="auto-stories" size={22} color={theme.colors.primary} />
              </View>
              <CustomText style={styles.headerLabel}>Word for Today</CustomText>
              <CustomText style={styles.headerDate}>{formatDate()}</CustomText>
            </View>

            {bibleVerse ? (
              <VerseBlock word={bibleVerse} label="Daily Scripture" icon="menu-book" />
            ) : null}

            {hasBoth ? (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <CustomText style={styles.dividerText}>Today&apos;s Message</CustomText>
                <View style={styles.dividerLine} />
              </View>
            ) : null}

            {adminWord ? (
              <VerseBlock word={adminWord} label="ClaudyGod Message" icon="church" />
            ) : null}

            <View style={styles.actions}>
              <TVTouchable onPress={handleReadMore} showFocusBorder={false} style={styles.btnPrimary}>
                <MaterialIcons name="menu-book" size={18} color={theme.colors.textInverse} />
                <CustomText style={styles.btnPrimaryText}>Meditate on this</CustomText>
              </TVTouchable>

              <TVTouchable onPress={onClose} showFocusBorder={false} style={styles.btnSecondary}>
                <CustomText style={styles.btnSecondaryText}>Read later</CustomText>
              </TVTouchable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
