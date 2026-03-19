import React, { useEffect, useRef, useState } from 'react';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { Animated, Easing, Platform, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
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
}: AuthTextFieldProps) {
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isActive = isFocused || isHovered;
  const compact = width < 390;
  const spacious = width >= 1024;

  const accentOpacity = useRef(new Animated.Value(value ? 1 : 0.18)).current;
  const accentScale = useRef(new Animated.Value(value ? 1 : 0.42)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const useNativeAnimations = Platform.OS !== 'web';

  useEffect(() => {
    const highlighted = isActive || value.trim().length > 0;

    Animated.parallel([
      Animated.timing(accentOpacity, {
        toValue: highlighted ? 1 : 0.18,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
      Animated.spring(accentScale, {
        toValue: highlighted ? 1 : 0.42,
        tension: 110,
        friction: 14,
        useNativeDriver: useNativeAnimations,
      }),
      Animated.timing(translateY, {
        toValue: isActive ? -2 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
    ]).start();
  }, [accentOpacity, accentScale, isActive, translateY, useNativeAnimations, value]);

  const minHeight = compact ? 48 : spacious ? 54 : 50;
  const inputFontSize = compact ? 12.8 : spacious ? 14.2 : 13.4;
  const inputLineHeight = compact ? 18 : spacious ? 20 : 19;

  return (
    <View>
      {label ? (
        <CustomText
          variant="caption"
          style={{
            color: 'rgba(226,219,242,0.76)',
            marginBottom: 7,
            textTransform: 'uppercase',
            letterSpacing: 0.58,
            fontSize: compact ? 10 : 10.6,
            lineHeight: compact ? 12 : 13,
          }}
        >
          {label}
        </CustomText>
      ) : null}

      <Animated.View
        style={{
          transform: [{ translateY }],
        }}
      >
        <Pressable
          onPress={() => inputRef.current?.focus()}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
            backgroundColor: 'rgba(255,255,255,0.028)',
            paddingHorizontal: compact ? 13 : 14,
            paddingVertical: 0,
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'center',
            ...(isWeb
              ? ({
                  cursor: editable ? 'text' : 'default',
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
            placeholderTextColor="rgba(202,196,220,0.50)"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              flex: 1,
              minHeight,
              color: '#F8F7FC',
              fontSize: inputFontSize,
              lineHeight: inputLineHeight,
              fontFamily: 'Sora_400Regular',
              paddingVertical: compact ? 13 : 14,
            }}
          />

          {trailing ? <View style={{ marginLeft: 10 }}>{trailing}</View> : null}

          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: 0,
              height: 2,
              borderRadius: 999,
              backgroundColor: '#9C7DFF',
              opacity: accentOpacity,
              transform: [{ scaleX: accentScale }],
            }}
          />
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
                  : 'rgba(202,196,220,0.66)',
            fontSize: compact ? 10.6 : 11,
            lineHeight: compact ? 14 : 15,
          }}
        >
          {hint}
        </CustomText>
      ) : null}
    </View>
  );
}
