// apps/mobile/components/ui/ModernInput.tsx
/**
 * Modern Input Component
 * Beautiful text input with animations and smooth interactions
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  type StyleProp,
  type ViewStyle,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';

interface ModernInputProps extends RNTextInputProps {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  style?: StyleProp<ViewStyle>;
  variant?: 'outlined' | 'filled' | 'flat';
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  icon,
  error,
  style,
  variant = 'outlined',
  ...props
}) => {
  const theme = useAppTheme();
  const [value, setValue] = useState('');
  const focusAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleFocus = () => {
    Animated.parallel([
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBlur = () => {
    if (!value) {
      Animated.parallel([
        Animated.timing(focusAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.border],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 0.08],
  });

  const variantStyles = {
    outlined: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    filled: {
      borderWidth: 0,
      backgroundColor: theme.colors.surfaceAlt,
    },
    flat: {
      borderWidth: 0,
      borderBottomWidth: 0,
      borderBottomColor: 'transparent',
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 0,
    },
  };

  return (
    <View style={[styles.container, style]}>
      {label && <CustomText style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</CustomText>}

      <Animated.View
        style={[
          styles.inputWrapper,
          variantStyles[variant],
          {
            borderColor: variant === 'outlined' || variant === 'flat' ? borderColor : undefined,
            transform: [{ scale: scaleAnim }],
            shadowColor: theme.colors.primary,
            shadowOpacity,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        <TextInput
          {...props}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              paddingLeft: icon ? 12 : 0,
            },
          ]}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={(text) => {
            setValue(text);
            props.onChangeText?.(text);
          }}
          value={value}
        />
      </Animated.View>

      {error && (
        <CustomText style={[styles.errorText, { color: theme.colors.danger }]}>
          {error}
        </CustomText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
});
