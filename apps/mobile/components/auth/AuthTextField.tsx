import React, { useEffect, useRef, useState } from 'react';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { Animated, Easing, Platform, Pressable, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

interface AuthTextFieldProps {
  label?: string;
  value: string;
  onChangeText: (_text: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  secureTextEntry?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  inputMode?: TextInputProps['inputMode'];
  maxLength?: number;
  autoCorrect?: boolean;
  editable?: boolean;
  hint?: string;
  hintTone?: 'default' | 'error' | 'success';
  clearable?: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles(() => ({
  labelBase:     { marginBottom: 6, fontWeight: '400' },
  fieldRow:      { overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingVertical: 0 },
  leadingWrap:   { marginRight: 10, justifyContent: 'center' },
  inputBase:     { paddingHorizontal: 0, fontFamily: 'PlusJakartaSans_400Regular' },
  trailingWrap:  { marginLeft: 10 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  secureTextEntry,
  leading,
  trailing,
  returnKeyType,
  onSubmitEditing,
  inputMode,
  maxLength,
  autoCorrect,
  editable = true,
  hint,
  hintTone = 'default',
  clearable = true,
}: AuthTextFieldProps) {
  const styles  = useStyles();
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const device = useDeviceClass();
  const theme  = useAppTheme();

  const isWeb = Platform.OS === 'web';
  const isActive = isFocused || isHovered;
  const compact  = device.isCompactPhone;
  const spacious = device.isDesktop || device.isTV;
  const showClearButton = clearable && editable && !trailing && value.length > 0;

  const translateY = useRef(new Animated.Value(0)).current;
  const useNativeAnimations = Platform.OS !== 'web';

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isActive ? -2 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNativeAnimations,
    }).start();
  }, [isActive, translateY, useNativeAnimations, value]);

  const isDark = theme.scheme === 'dark';
  const minHeight     = device.isTV ? 62 : compact ? 50 : spacious ? 58 : 54;
  const inputFontSize = device.isTV ? 16 : compact ? 13.2 : spacious ? 14.4 : 13.8;
  const inputLineHeight = device.isTV ? 22 : compact ? 18 : spacious ? 20 : 19;
  const borderColor   = isFocused
    ? isDark ? 'rgba(214,190,255,0.88)' : `rgba(124,58,237,0.65)`
    : isHovered
      ? isDark ? 'rgba(255,255,255,0.32)' : theme.colors.borderStrong
      : isDark ? 'rgba(255,255,255,0.17)' : theme.colors.border;
  const backgroundColor = isDark
    ? (isFocused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.065)')
    : theme.colors.inputBg;
  const hintColor =
    hintTone === 'error'
      ? isDark ? '#FFD7D7' : theme.colors.danger
      : hintTone === 'success'
        ? isDark ? '#D7FFE6' : theme.colors.success
        : isDark ? 'rgba(235,229,250,0.74)' : theme.colors.textMuted;

  return (
    <View>
      {label ? (
        <CustomText
          variant="caption"
          style={[styles.labelBase, {
            color: theme.colors.textMuted,
            fontSize: device.isTV ? 12 : compact ? 11 : 11.5,
            lineHeight: device.isTV ? 15 : 15,
          }]}
        >
          {label}
        </CustomText>
      ) : null}

      <Animated.View style={{ transform: [{ translateY }] }}>
        <Pressable
          onPress={() => inputRef.current?.focus()}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          style={[
            styles.fieldRow,
            {
              minHeight,
              borderRadius: device.isTV ? 20 : 17,
              borderWidth: 1,
              borderColor,
              backgroundColor,
              paddingHorizontal: compact ? 13 : 15,
              ...(isWeb
                ? ({
                    cursor: editable ? 'text' : 'default',
                    transitionDuration: '160ms',
                    transitionProperty: 'border-color, background-color',
                  } as object)
                : null),
            },
          ]}
        >
          {leading ? <View style={styles.leadingWrap}>{leading}</View> : null}

          <TextInput
            ref={inputRef}
            value={value}
            editable={editable}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            textContentType={textContentType}
            secureTextEntry={secureTextEntry}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            inputMode={inputMode}
            maxLength={maxLength}
            autoCorrect={autoCorrect ?? false}
            placeholder={placeholder}
            placeholderTextColor={isDark ? 'rgba(235,229,250,0.56)' : theme.colors.textMuted}
            selectionColor={theme.colors.primary}
            accessibilityLabel={label ?? placeholder}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={[
              styles.inputBase,
              {
                flex: 1, minHeight,
                color: theme.colors.text,
                fontSize: inputFontSize,
                lineHeight: inputLineHeight,
                paddingVertical: compact ? 12 : 13,
                ...(isWeb ? ({ outlineStyle: 'none', outlineWidth: 0 } as object) : null),
              },
            ]}
          />

          {showClearButton ? (
            <Pressable
              onPress={() => { onChangeText(''); inputRef.current?.focus(); }}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${label ?? placeholder}`}
              hitSlop={10}
              style={{
                width: device.isTV ? 36 : 30,
                height: device.isTV ? 36 : 30,
                borderRadius: device.isTV ? 18 : 15,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : theme.colors.surfaceAlt,
                marginLeft: 8,
              }}
            >
              <MaterialIcons name="close" size={device.isTV ? 18 : 16} color={isDark ? 'rgba(255,255,255,0.82)' : theme.colors.textSecondary} />
            </Pressable>
          ) : null}

          {trailing ? <View style={styles.trailingWrap}>{trailing}</View> : null}
        </Pressable>
      </Animated.View>

      {hint ? (
        <CustomText
          variant="caption"
          style={{
            marginTop: 8,
            color: hintColor,
            fontSize: device.isTV ? 12.2 : compact ? 10.8 : 11.2,
            lineHeight: device.isTV ? 17 : compact ? 15 : 16,
          }}
        >
          {hint}
        </CustomText>
      ) : null}
    </View>
  );
}
