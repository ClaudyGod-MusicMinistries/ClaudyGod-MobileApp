// components/ui/SectionHeader.tsx
import React, { useState } from 'react';
import { View, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';
import { designSystem } from '../../theme/designSystem';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  eyebrow?: string;
}

export function SectionHeader({ title, actionLabel, onAction, eyebrow }: SectionHeaderProps) {
  const theme = useAppTheme();
  const [actionPressed, setActionPressed] = useState(false);
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handleActionPressIn = () => {
    setActionPressed(true);
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const handleActionPressOut = () => {
    setActionPressed(false);
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: eyebrow ? 4 : 0 }}>
        {eyebrow ? (
          <CustomText
            variant="caption"
            style={{
              color: theme.colors.textMuted ?? theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              fontSize: 11,
              fontWeight: '600',
            }}
            numberOfLines={1}
          >
            {eyebrow}
          </CustomText>
        ) : null}
        <CustomText
          variant="heading"
          style={{
            color: theme.colors.text,
            letterSpacing: -0.3,
            fontSize: 24,
            fontWeight: '700',
          }}
          numberOfLines={1}
        >
          {title}
        </CustomText>
      </View>

      {actionLabel ? (
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <TVTouchable
            onPress={onAction}
            onPressIn={handleActionPressIn}
            onPressOut={handleActionPressOut}
            style={{
              minHeight: 36,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: designSystem.radius.full,
              backgroundColor: theme.scheme === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(124,58,237,0.1)',
              borderWidth: 1,
              borderColor: theme.scheme === 'dark'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(124,58,237,0.2)',
              shadowColor: '#000',
              shadowOpacity: actionPressed ? 0.15 : 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
            activeOpacity={0.9}
            showFocusBorder={false}
          >
            <CustomText
              variant="label"
              style={{
                color: theme.colors.text,
                letterSpacing: 0.3,
                fontSize: 12,
                fontWeight: '600',
              }}
              numberOfLines={1}
            >
              {actionLabel}
            </CustomText>
            <MaterialIcons
              name="chevron-right"
              size={16}
              color={theme.colors.textSecondary}
            />
          </TVTouchable>
        </Animated.View>
      ) : null}
    </View>
  );
}
