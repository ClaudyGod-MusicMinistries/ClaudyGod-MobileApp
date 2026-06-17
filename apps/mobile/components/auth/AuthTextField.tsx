import React, { useEffect, useRef, useState } from 'react';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { Animated, Easing, Platform, Pressable, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useDeviceClass } from '../../util/deviceClassConfig';

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
  const device = useDeviceClass();

  const isWeb = Platform.OS === 'web';
  const isActive = isFocused || isHovered;
  const compact = device.isCompactPhone;
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

  const minHeight = device.isTV ? 62 : compact ? 50 : spacious ? 58 : 54;
  const inputFontSize = device.isTV ? 16 : compact ? 13.2 : spacious ? 14.4 : 13.8;
  const inputLineHeight = device.isTV ? 22 : compact ? 18 : spacious ? 20 : 19;
  const borderColor = isFocused
    ? 'rgba(214,190,255,0.88)'
    : isHovered
      ? 'rgba(255,255,255,0.32)'
      : 'rgba(255,255,255,0.17)';
  const backgroundColor = isFocused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.065)';
  const hintColor =
    hintTone === 'error'
      ? '#FFD7D7'
      : hintTone === 'success'
        ? '#D7FFE6'
        : 'rgba(235,229,250,0.74)';

  return (
    <View>
      {label ? (
        <CustomText
          variant="caption"
          style={{
            color: '#7A7288',
            marginBottom: 6,
            fontSize: device.isTV ? 12 : compact ? 11 : 11.5,
            fontWeight: '400',
            lineHeight: device.isTV ? 15 : 15,
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
            borderRadius: device.isTV ? 20 : 17,
            borderWidth: 1,
            borderColor,
            backgroundColor,
            paddingHorizontal: compact ? 13 : 15,
            paddingVertical: 0,
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'center',
            ...(isWeb
              ? ({
                  cursor: editable ? 'text' : 'default',
                  transitionDuration: '160ms',
                  transitionProperty: 'border-color, background-color',
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
            placeholderTextColor="rgba(235,229,250,0.56)"
            selectionColor="rgba(214,190,255,0.82)"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              flex: 1,
              minHeight,
              color: '#FFFFFF',
              fontSize: inputFontSize,
              lineHeight: inputLineHeight,
              fontFamily: 'PlusJakartaSans_400Regular',
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
                width: device.isTV ? 36 : 30,
                height: device.isTV ? 36 : 30,
                borderRadius: device.isTV ? 18 : 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.10)',
                marginLeft: 8,
              }}
            >
              <MaterialIcons name="close" size={device.isTV ? 18 : 16} color="rgba(255,255,255,0.82)" />
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
