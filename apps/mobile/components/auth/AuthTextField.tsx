import React, { useEffect, useRef, useState } from 'react';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';

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
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isActive = isFocused || isHovered;
  const compact = width < 390;
  const spacious = width >= 1024;
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

  const minHeight = compact ? 50 : spacious ? 58 : 54;
  const inputFontSize = compact ? 13.2 : spacious ? 14.4 : 13.8;
  const inputLineHeight = compact ? 19 : spacious ? 21 : 20;
  const borderColor = isFocused
    ? 'rgba(210,184,255,0.90)'
    : isHovered
      ? 'rgba(255,255,255,0.32)'
      : 'rgba(255,255,255,0.18)';
  const backgroundColor = isFocused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.065)';
  const hintColor =
    hintTone === 'error'
      ? '#FFD3D3'
      : hintTone === 'success'
        ? '#D9FFE8'
        : 'rgba(255,255,255,0.76)';

  return (
    <View>
      {label ? (
        <CustomText
          variant="caption"
          style={{
            color: 'rgba(244,239,255,0.86)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.58,
            fontSize: compact ? 10.4 : 10.9,
            lineHeight: compact ? 13 : 14,
          }}
        >
          {label}
        </CustomText>
      ) : null}

      <Animated.View style={{ transform: [{ translateY }] }}>
        <Pressable
          onPress={() => inputRef.current?.focus()}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          style={{
            minHeight,
            borderRadius: 18,
            borderWidth: 1,
            borderColor,
            backgroundColor,
            paddingHorizontal: compact ? 13 : 15,
            paddingVertical: 0,
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: isFocused ? 0.20 : 0.10,
            shadowRadius: isFocused ? 18 : 10,
            elevation: isFocused ? 5 : 2,
            ...(isWeb
              ? ({
                  cursor: editable ? 'text' : 'default',
                  transitionDuration: '160ms',
                  transitionProperty: 'border-color, background-color, box-shadow, transform',
                } as object)
              : null),
          }}
        >
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
            placeholderTextColor="rgba(244,239,255,0.54)"
            selectionColor="rgba(210,184,255,0.82)"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              flex: 1,
              minHeight,
              color: '#FFFFFF',
              fontSize: inputFontSize,
              lineHeight: inputLineHeight,
              fontFamily: 'Manrope_400Regular',
              paddingVertical: compact ? 12 : 13,
              paddingHorizontal: 0,
              ...(isWeb
                ? ({
                    outlineStyle: 'none',
                    outlineWidth: 0,
                  } as object)
                : null),
            }}
          />

          {showClearButton ? (
            <Pressable
              onPress={() => {
                onChangeText('');
                inputRef.current?.focus();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${label ?? placeholder}`}
              hitSlop={10}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.10)',
                marginLeft: 8,
              }}
            >
              <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.82)" />
            </Pressable>
          ) : null}

          {trailing ? <View style={{ marginLeft: 10 }}>{trailing}</View> : null}
        </Pressable>
      </Animated.View>

      {hint ? (
        <CustomText
          variant="caption"
          style={{
            marginTop: 8,
            color: hintColor,
            fontSize: compact ? 11.1 : 11.4,
            lineHeight: compact ? 15 : 16,
          }}
        >
          {hint}
        </CustomText>
      ) : null}
    </View>
  );
}
