import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../CustomText';
import { makeStyles } from '../../styles/makeStyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;
const EXIT_DURATION = 220;
const OPEN_SPRING = { damping: 20, stiffness: 220 };

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
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 6, 14, 0.72)' },
  sheetWrap:   { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: theme.radius.xxl, borderTopRightRadius: theme.radius.xxl,
    borderTopWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    paddingHorizontal: theme.spacing.lg,
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
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(visible);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateY.value = withSpring(0, OPEN_SPRING);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      return undefined;
    }

    translateY.value = withTiming(SCREEN_HEIGHT, { duration: EXIT_DURATION });
    backdropOpacity.value = withTiming(0, { duration: EXIT_DURATION });
    const timeout = setTimeout(() => {
      setModalVisible(false);
      onClosed?.();
    }, EXIT_DURATION);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, translateY, backdropOpacity]);

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
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: EXIT_DURATION });
        backdropOpacity.value = withTiming(0, { duration: EXIT_DURATION });
        runOnJS(requestClose)();
      } else {
        translateY.value = withSpring(0, OPEN_SPRING);
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
      <View style={styles.sheetWrap}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }, sheetStyle]}>
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
      </View>
    </Modal>
  );
}
