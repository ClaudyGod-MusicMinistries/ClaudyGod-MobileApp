// components/ui/SectionHeader.tsx
import React, { useState } from 'react';
import { View, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { TVTouchable } from './TVTouchable';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  eyebrow?: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: theme.spacing.md, gap: theme.spacing.md,
  },
  titleCol:     { flex: 1 },
  titleColGap:  { gap: 4 },
  eyebrowText: {
    color: theme.colors.textMuted ?? theme.colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, fontWeight: '600',
  },
  titleText: {
    color: theme.colors.text, letterSpacing: -0.3, fontSize: 24, fontWeight: '700',
  },
  actionBtn: {
    minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySurface, borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  actionText: {
    color: theme.colors.text, letterSpacing: 0.3, fontSize: 12, fontWeight: '600',
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function SectionHeader({ title, actionLabel, onAction, eyebrow }: SectionHeaderProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const [actionPressed, setActionPressed] = useState(false);
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  void actionPressed;

  const handleActionPressIn = () => {
    setActionPressed(true);
    Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  const handleActionPressOut = () => {
    setActionPressed(false);
    Animated.timing(scaleValue, { toValue: 1, duration: 150, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  return (
    <View style={styles.row}>
      <View style={[styles.titleCol, eyebrow ? styles.titleColGap : null]}>
        {eyebrow ? (
          <CustomText variant="caption" style={styles.eyebrowText} numberOfLines={1}>
            {eyebrow}
          </CustomText>
        ) : null}
        <CustomText variant="heading" style={styles.titleText} numberOfLines={1}>
          {title}
        </CustomText>
      </View>

      {actionLabel ? (
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <TVTouchable
            onPress={onAction}
            onPressIn={handleActionPressIn}
            onPressOut={handleActionPressOut}
            style={styles.actionBtn}
            activeOpacity={0.9}
            showFocusBorder={false}
          >
            <CustomText variant="label" style={styles.actionText} numberOfLines={1}>
              {actionLabel}
            </CustomText>
            <MaterialIcons name="chevron-right" size={16} color={theme.colors.textSecondary} />
          </TVTouchable>
        </Animated.View>
      ) : null}
    </View>
  );
}
