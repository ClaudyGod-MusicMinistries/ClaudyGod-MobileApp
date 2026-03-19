import React, { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { TVTouchable } from './TVTouchable';
import { type ToastItem, useToast } from '../../context/ToastContext';

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (_id: string) => void;
}) {
  const translateY = useRef(new Animated.Value(-14)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [opacity, translateY]);

  const palette =
    toast.tone === 'success'
      ? { accent: '#56D28E', border: 'rgba(86,210,142,0.28)', bg: 'rgba(17,44,31,0.92)', icon: 'check-circle' as const }
      : toast.tone === 'error'
        ? { accent: '#FF8E8E', border: 'rgba(255,142,142,0.24)', bg: 'rgba(55,18,24,0.94)', icon: 'error-outline' as const }
        : toast.tone === 'warning'
          ? { accent: '#FBBF24', border: 'rgba(251,191,36,0.24)', bg: 'rgba(51,37,12,0.94)', icon: 'priority-high' as const }
          : { accent: '#94AEFF', border: 'rgba(148,174,255,0.24)', bg: 'rgba(20,24,52,0.94)', icon: 'info-outline' as const };

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        shadowColor: '#000000',
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      }}
    >
      <MaterialIcons name={palette.icon} size={18} color={palette.accent} style={{ marginTop: 1 }} />

      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: '#F7F5FF' }}>
          {toast.title}
        </CustomText>
        {toast.message ? (
          <CustomText variant="caption" style={{ color: 'rgba(223,217,239,0.84)', marginTop: 4 }}>
            {toast.message}
          </CustomText>
        ) : null}
      </View>

      <TVTouchable
        onPress={() => onDismiss(toast.id)}
        showFocusBorder={false}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
      >
        <MaterialIcons name="close" size={16} color="rgba(235,232,244,0.9)" />
      </TVTouchable>
    </Animated.View>
  );
}

export function ToastViewport() {
  const insets = useSafeAreaInsets();
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: Math.max(insets.top, 12),
        left: 12,
        right: 12,
        zIndex: 100,
        gap: 10,
      }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </View>
  );
}
