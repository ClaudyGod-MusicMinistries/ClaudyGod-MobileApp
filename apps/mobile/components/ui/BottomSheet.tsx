import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../CustomText';
import { makeStyles } from '../../styles/makeStyles';
import { useAppTheme } from '../../util/colorScheme';

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  dismissible?: boolean;
  // Fires once the exit animation has actually finished and the Modal has
  // unmounted — lets a caller that needs to hand off to another sheet do so
  // without hardcoding a second copy of this component's exit duration to
  // guess when it's safe (see AccountSheet.tsx's TrustDeviceSheet handoff).
  onClosed?: () => void;
}

const useStyles = makeStyles((theme) => ({
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.scrim },
  sheetWrap:   { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    borderTopLeftRadius: theme.radius.xxl, borderTopRightRadius: theme.radius.xxl,
    borderTopWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    paddingHorizontal: theme.spacing.lg,
    width: '100%', maxWidth: 600,
  },
  dragArea:    { paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xs, alignItems: 'center' },
  dragHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.border },
  headerGroup: { gap: 4, marginBottom: theme.spacing.md },
  title:       { color: theme.colors.text },
  description: { color: theme.colors.textSecondary },
}));

export function BottomSheet({
  visible,
  onClose,
  children,
  title,
  description,
  dismissible = true,
  onClosed,
}: BottomSheetProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(visible);

  const translateY = useSharedValue(height);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateY.value = withTiming(0, { duration: theme.motion.sheetEnterDuration, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: theme.timing.base });
      return undefined;
    }

    translateY.value = withTiming(height, { duration: theme.motion.sheetExitDuration, easing: Easing.in(Easing.cubic) });
    backdropOpacity.value = withTiming(0, { duration: theme.motion.sheetExitDuration });
    const timeout = setTimeout(() => {
      setModalVisible(false);
      onClosed?.();
    }, theme.motion.sheetExitDuration);
    return () => clearTimeout(timeout);
    // onClosed intentionally excluded: it's a caller-supplied inline callback,
    // and this effect must only re-run on visible/shared-value transitions —
    // not every time the caller re-renders with a new function reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, height, translateY, backdropOpacity, theme.motion.sheetEnterDuration, theme.motion.sheetExitDuration, theme.timing.base]);

  const requestClose = () => {
    if (!dismissible) return;
    onClose();
  };

  const pan = Gesture.Pan()
    .enabled(dismissible)
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const shouldDismiss = event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY;
      if (shouldDismiss) {
        translateY.value = withTiming(height, { duration: theme.motion.sheetExitDuration, easing: Easing.in(Easing.cubic) });
        backdropOpacity.value = withTiming(0, { duration: theme.motion.sheetExitDuration });
        runOnJS(requestClose)();
      } else {
        translateY.value = withTiming(0, { duration: theme.timing.base, easing: Easing.out(Easing.cubic) });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="none" statusBarTranslucent onRequestClose={requestClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              maxHeight: height * 0.86,
              paddingBottom: insets.bottom + 20,
              borderTopLeftRadius: width >= 640 ? 20 : undefined,
              borderTopRightRadius: width >= 640 ? 20 : undefined,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View>
              <View style={styles.dragArea}>
                <View style={styles.dragHandle} />
              </View>

              {title ? (
                <View style={styles.headerGroup}>
                  <CustomText variant="heading" style={styles.title}>{title}</CustomText>
                  {description ? (
                    <CustomText variant="body" style={styles.description}>{description}</CustomText>
                  ) : null}
                </View>
              ) : null}
            </View>
          </GestureDetector>

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
