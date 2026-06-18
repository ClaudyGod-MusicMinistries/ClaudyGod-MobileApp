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

/** Returns true if the modal has NOT been shown today yet. */
export async function shouldShowWordModal(): Promise<boolean> {
  try {
    const last = await AsyncStorage.getItem(SHOWN_DATE_KEY);
    return last !== todayDateString();
  } catch {
    return true;
  }
}

/** Mark today as shown so it won't appear again until tomorrow. */
export async function markWordModalShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(SHOWN_DATE_KEY, todayDateString());
  } catch {
    // non-fatal
  }
}

// ─── Day label helper ─────────────────────────────────────────────────────────

function formatDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Decorative cross ────────────────────────────────────────────────────────

function CrossIcon() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: 'rgba(139,92,246,0.12)',
          borderWidth: 1.5,
          borderColor: 'rgba(139,92,246,0.28)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name="auto-stories" size={26} color="#8B5CF6" />
      </View>
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface WordOfDayModalProps {
  visible: boolean;
  word: WordOfDayItem | null;
  onClose: () => void;
  onReadMore: () => void;
}

export function WordOfDayModal({
  visible,
  word,
  onClose,
  onReadMore,
}: WordOfDayModalProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.86)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1, duration: 260, useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(cardScale, {
          toValue: 1, friction: 7, tension: 60, useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 220, useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0, duration: 180, useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0, duration: 150, useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
      cardScale.setValue(0.86);
    }
  }, [visible, backdropOpacity, cardOpacity, cardScale]);

  const handleReadMore = useCallback(() => {
    onClose();
    setTimeout(onReadMore, 200);
  }, [onClose, onReadMore]);

  const cardWidth = Math.min(width - 40, 400);

  if (!word && !visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(7,5,12,0.85)" barStyle="light-content" />

      {/* Backdrop — tap to dismiss */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(7,5,12,0.82)', opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Card */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <Animated.View
          style={{
            width: cardWidth,
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
            backgroundColor: theme.scheme === 'dark' ? '#110E1E' : '#FFFFFF',
            borderRadius: 28,
            borderWidth: 1,
            borderColor: 'rgba(139,92,246,0.22)',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.55,
            shadowRadius: 40,
            elevation: 24,
          }}
        >
          {/* Violet top accent bar */}
          <View style={{ height: 4, backgroundColor: '#8B5CF6' }} />

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 28 }}
          >
            {/* Icon */}
            <CrossIcon />

            {/* Label + date */}
            <View style={{ alignItems: 'center', marginBottom: 6 }}>
              <CustomText
                style={{
                  color: '#8B5CF6',
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Word for Today
              </CustomText>
              <CustomText
                style={{
                  color: theme.scheme === 'dark' ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.40)',
                  fontSize: 12,
                  fontWeight: '500',
                }}
              >
                {formatDate()}
              </CustomText>
            </View>

            {/* Title */}
            {word?.title ? (
              <CustomText
                style={{
                  color: theme.scheme === 'dark' ? '#F7F2FF' : '#1A1028',
                  fontSize: 20,
                  fontWeight: '800',
                  textAlign: 'center',
                  letterSpacing: -0.4,
                  marginTop: 14,
                  marginBottom: 4,
                  lineHeight: 26,
                }}
              >
                {word.title}
              </CustomText>
            ) : null}

            {/* Scripture reference pill */}
            {word?.passage ? (
              <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 18 }}>
                <View
                  style={{
                    paddingVertical: 5,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    backgroundColor: 'rgba(139,92,246,0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(139,92,246,0.22)',
                  }}
                >
                  <CustomText style={{ color: '#8B5CF6', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>
                    {word.passage}
                  </CustomText>
                </View>
              </View>
            ) : null}

            {/* Verse */}
            {word?.verse ? (
              <View
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: '#8B5CF6',
                  paddingLeft: 14,
                  marginBottom: 18,
                }}
              >
                <CustomText
                  style={{
                    color: theme.scheme === 'dark' ? 'rgba(247,242,255,0.90)' : '#2D1E4A',
                    fontSize: 15,
                    lineHeight: 24,
                    fontStyle: 'italic',
                    fontWeight: '500',
                  }}
                >
                  &ldquo;{word.verse}&rdquo;
                </CustomText>
              </View>
            ) : null}

            {/* Reflection */}
            {word?.reflection ? (
              <View
                style={{
                  backgroundColor: theme.scheme === 'dark' ? 'rgba(139,92,246,0.07)' : 'rgba(139,92,246,0.05)',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 24,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MaterialIcons name="lightbulb-outline" size={13} color="#8B5CF6" />
                  <CustomText style={{ color: '#8B5CF6', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                    Reflection
                  </CustomText>
                </View>
                <CustomText
                  style={{
                    color: theme.scheme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.58)',
                    fontSize: 13.5,
                    lineHeight: 21,
                    fontWeight: '400',
                  }}
                >
                  {word.reflection}
                </CustomText>
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={{ gap: 10 }}>
              {/* Meditate CTA */}
              <TVTouchable
                onPress={handleReadMore}
                showFocusBorder={false}
                style={{
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: '#8B5CF6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.30,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <MaterialIcons name="menu-book" size={18} color="#FFFFFF" />
                <CustomText style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                  Meditate on this
                </CustomText>
              </TVTouchable>

              {/* Close */}
              <TVTouchable
                onPress={onClose}
                showFocusBorder={false}
                style={{
                  height: 48,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CustomText
                  style={{
                    color: theme.scheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
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
