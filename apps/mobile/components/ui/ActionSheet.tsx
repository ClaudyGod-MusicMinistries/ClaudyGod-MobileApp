import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { TVTouchable } from './TVTouchable';
import { useAppTheme } from '../../util/colorScheme';

type ActionTone = 'default' | 'destructive' | 'accent';

export interface ActionSheetAction {
  key: string;
  label: string;
  detail?: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  tone?: ActionTone;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  actions: ActionSheetAction[];
  onClose: () => void;
}

export function ActionSheet({
  visible,
  title,
  description,
  actions,
  onClose,
}: ActionSheetProps) {
  const theme = useAppTheme();
  const translateY = useRef(new Animated.Value(28)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      translateY.setValue(28);
      opacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={onClose}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(5, 6, 14, 0.72)' },
          ]}
        />

        <View style={{ flex: 1, justifyContent: 'flex-end', padding: theme.spacing.lg }}>
          <Animated.View
            style={{
              transform: [{ translateY }],
              opacity,
            }}
          >
            <View
              style={{
                borderRadius: theme.radius.xl,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: '#0E0918',
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.md,
                gap: theme.spacing.md,
              }}
            >
              <View style={{ gap: 6 }}>
                <View
                  style={{
                    alignSelf: 'center',
                    width: 42,
                    height: 4,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.16)',
                    marginBottom: 6,
                  }}
                />
                <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                  {title}
                </CustomText>
                {description ? (
                  <CustomText variant="body" style={{ color: theme.colors.text.secondary }}>
                    {description}
                  </CustomText>
                ) : null}
              </View>

              <View
                style={{
                  borderRadius: theme.radius.lg,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                {actions.map((action, index) => {
                  const toneColor =
                    action.tone === 'destructive'
                      ? '#F2A7B6'
                      : action.tone === 'accent'
                        ? theme.colors.primary
                        : theme.colors.text.primary;

                  return (
                    <TVTouchable
                      key={action.key}
                      onPress={() => {
                        onClose();
                        action.onPress();
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.md,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: theme.colors.border,
                        backgroundColor: 'transparent',
                      }}
                      showFocusBorder={false}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: theme.radius.md,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor:
                            action.tone === 'destructive'
                              ? 'rgba(242, 167, 182, 0.12)'
                              : action.tone === 'accent'
                                ? 'rgba(139, 92, 246, 0.14)'
                                : theme.colors.surfaceAlt,
                        }}
                      >
                        <MaterialIcons name={action.icon ?? 'arrow-forward'} size={18} color={toneColor} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <CustomText variant="title" style={{ color: toneColor }}>
                          {action.label}
                        </CustomText>
                        {action.detail ? (
                          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
                            {action.detail}
                          </CustomText>
                        ) : null}
                      </View>

                      <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
                    </TVTouchable>
                  );
                })}
              </View>

              <TVTouchable
                onPress={onClose}
                style={{
                  minHeight: 48,
                  borderRadius: theme.radius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                showFocusBorder={false}
              >
                <CustomText
                  variant="label"
                  style={{
                    color: theme.colors.text.primary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.2,
                  }}
                >
                  Cancel
                </CustomText>
              </TVTouchable>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
