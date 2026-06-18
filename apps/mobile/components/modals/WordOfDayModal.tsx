import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import type { WordOfDayItem } from '../../services/wordOfDayService';

const SHOWN_DATE_KEY = 'claudygod.word_modal.last_shown';
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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

// ─── Sub-components ──────────────────────────────────────────────────────────

function VerseBlock({ word, label, icon }: {
  word: WordOfDayItem;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';

  return (
    <View style={{ gap: 10 }}>
      {/* Section header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View
          style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: 'rgba(139,92,246,0.12)',
            borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <MaterialIcons name={icon} size={14} color="#8B5CF6" />
        </View>
        <CustomText style={{ color: '#8B5CF6', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {label}
        </CustomText>
      </View>

      {/* Title */}
      {word.title ? (
        <CustomText style={{
          color: isDark ? '#F7F2FF' : '#1A1028',
          fontSize: 17, fontWeight: '800', letterSpacing: -0.3, lineHeight: 23,
        }}>
          {word.title}
        </CustomText>
      ) : null}

      {/* Reference pill */}
      {word.passage ? (
        <View style={{ alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 11, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.10)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)' }}>
          <CustomText style={{ color: '#8B5CF6', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 }}>
            {word.passage}
          </CustomText>
        </View>
      ) : null}

      {/* Verse text */}
      {word.verse ? (
        <View style={{ borderLeftWidth: 3, borderLeftColor: '#8B5CF6', paddingLeft: 12 }}>
          <CustomText style={{
            color: isDark ? 'rgba(247,242,255,0.90)' : '#2D1E4A',
            fontSize: 14, lineHeight: 22, fontStyle: 'italic', fontWeight: '500',
          }}>
            {'“'}{word.verse}{'”'}
          </CustomText>
        </View>
      ) : null}

      {/* Reflection */}
      {word.reflection ? (
        <View style={{
          backgroundColor: isDark ? 'rgba(139,92,246,0.07)' : 'rgba(139,92,246,0.05)',
          borderRadius: 12, padding: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <MaterialIcons name="lightbulb-outline" size={12} color="#8B5CF6" />
            <CustomText style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' }}>
              Reflection
            </CustomText>
          </View>
          <CustomText style={{
            color: isDark ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.55)',
            fontSize: 13, lineHeight: 20,
          }}>
            {word.reflection}
          </CustomText>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface WordOfDayModalProps {
  visible: boolean;
  /** Daily scripture from the Bible API — always the primary source. */
  bibleVerse: WordOfDayItem | null;
  /** Admin-authored word for today — shown as an additional section when present. */
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
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isDark = theme.scheme === 'dark';

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 240, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 58, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 140, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start();
      cardScale.setValue(0.88);
    }
  }, [visible, backdropOpacity, cardOpacity, cardScale]);

  const handleReadMore = useCallback(() => {
    onClose();
    setTimeout(onReadMore, 200);
  }, [onClose, onReadMore]);

  const cardWidth = Math.min(width - 40, 400);
  const hasBoth = bibleVerse !== null && adminWord !== null;

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

      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(7,5,12,0.80)', opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Card */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <Animated.View
          style={{
            width: cardWidth,
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
            backgroundColor: isDark ? '#110E1E' : '#FFFFFF',
            borderRadius: 28,
            borderWidth: 1,
            borderColor: 'rgba(139,92,246,0.22)',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.50,
            shadowRadius: 40,
            elevation: 24,
          }}
        >
          {/* Top accent bar */}
          <View style={{ height: 4, backgroundColor: '#8B5CF6' }} />

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24, gap: 20 }}
          >
            {/* Header */}
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={{
                width: 48, height: 48, borderRadius: 15,
                backgroundColor: 'rgba(139,92,246,0.12)',
                borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.26)',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
              }}>
                <MaterialIcons name="auto-stories" size={22} color="#8B5CF6" />
              </View>
              <CustomText style={{ color: '#8B5CF6', fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
                Word for Today
              </CustomText>
              <CustomText style={{ color: isDark ? 'rgba(255,255,255,0.36)' : 'rgba(0,0,0,0.38)', fontSize: 12 }}>
                {formatDate()}
              </CustomText>
            </View>

            {/* Bible verse — always the foundation */}
            {bibleVerse ? (
              <VerseBlock
                word={bibleVerse}
                label="Daily Scripture"
                icon="menu-book"
              />
            ) : null}

            {/* Divider only when both sources present */}
            {hasBoth ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }} />
                <CustomText style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.28)', fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Today's Message
                </CustomText>
                <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }} />
              </View>
            ) : null}

            {/* Admin word — additional section */}
            {adminWord ? (
              <VerseBlock
                word={adminWord}
                label="ClaudyGod Message"
                icon="church"
              />
            ) : null}

            {/* Actions */}
            <View style={{ gap: 10, paddingTop: 4 }}>
              <TVTouchable
                onPress={handleReadMore}
                showFocusBorder={false}
                style={{
                  height: 52, borderRadius: 14,
                  backgroundColor: '#8B5CF6',
                  alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 8,
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.28, shadowRadius: 10, elevation: 6,
                }}
              >
                <MaterialIcons name="menu-book" size={18} color="#FFFFFF" />
                <CustomText style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                  Meditate on this
                </CustomText>
              </TVTouchable>

              <TVTouchable
                onPress={onClose}
                showFocusBorder={false}
                style={{
                  height: 46, borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <CustomText style={{ color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)', fontSize: 14, fontWeight: '600' }}>
                  Read later
                </CustomText>
              </TVTouchable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
