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

  const minHeight = compact ? 48 : spacious ? 56 : 52;
  const inputFontSize = compact ? 13 : spacious ? 14.2 : 13.6;
  const inputLineHeight = compact ? 18 : spacious ? 20 : 19;
  const borderColor = isFocused
    ? 'rgba(197,167,255,0.82)'
    : isHovered
      ? 'rgba(255,255,255,0.26)'
      : 'rgba(255,255,255,0.14)';
  const backgroundColor = isFocused ? 'rgba(255,255,255,0.085)' : 'rgba(255,255,255,0.055)';

  return (
    <View>
      {label ? (
        <CustomText
          variant="caption"
          style={{
            color: 'rgba(226,219,242,0.82)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.58,
            fontSize: compact ? 10.2 : 10.8,
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
            borderRadius: 17,
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
            placeholderTextColor="rgba(226,219,242,0.48)"
            selectionColor="rgba(197,167,255,0.78)"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              flex: 1,
              minHeight,
              color: '#F8F7FC',
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
                backgroundColor: 'rgba(255,255,255,0.08)',
                marginLeft: 8,
              }}
            >
              <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.76)" />
            </Pressable>
          ) : null}

          {trailing ? <View style={{ marginLeft: 10 }}>{trailing}</View> : null}
        </Pressable>
      </Animated.View>

      {hint ? (
        <CustomText
          variant="caption"
          style={{
            marginTop: 7,
            color:
              hintTone === 'error'
                ? '#FFCECE'
                : hintTone === 'success'
                  ? '#D7FFE6'
                  : 'rgba(226,219,242,0.68)',
            fontSize: compact ? 10.4 : 10.8,
            lineHeight: compact ? 14 : 15,
          }}
        >
          {hint}
        </CustomText>
      ) : null}
    </View>
  );
}
