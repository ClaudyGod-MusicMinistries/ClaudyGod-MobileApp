import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInputProps } from 'react-native';
import { Animated, Easing, Platform, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { CustomText } from '../CustomText';

interface AuthOtpInputProps {
  label?: string;
  value: string;
  onChangeText: (_text: string) => void;
  length?: number;
  placeholder?: string;
  editable?: boolean;
  onSubmitEditing?: () => void;
}

const sanitizeOtp = (value: string, length: number): string =>
  value.replace(/\D/g, '').slice(0, length);

export function AuthOtpInput({
  label,
  value,
  onChangeText,
  length = 6,
  placeholder,
  editable = true,
  onSubmitEditing,
}: AuthOtpInputProps) {
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { width } = useWindowDimensions();

  const compact = width < 390;
  const spacious = width >= 1024;
  const isWeb = Platform.OS === 'web';
  const useNativeAnimations = Platform.OS !== 'web';
  const normalizedValue = useMemo(() => sanitizeOtp(value, length), [length, value]);
  const active = isFocused || isHovered;

  const accentOpacity = useRef(new Animated.Value(normalizedValue ? 1 : 0.18)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const highlighted = active || normalizedValue.length > 0;
    Animated.parallel([
      Animated.timing(accentOpacity, {
        toValue: highlighted ? 1 : 0.18,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
      Animated.timing(translateY, {
        toValue: active ? -2 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
    ]).start();
  }, [accentOpacity, active, normalizedValue, translateY, useNativeAnimations]);

  const slotSize = compact ? 44 : spacious ? 54 : 48;
  const slotRadius = compact ? 14 : 16;
  const digitFontSize = compact ? 18 : spacious ? 22 : 20;
  const helperText = placeholder ?? `Enter the ${length}-digit code`;
  const autoComplete = Platform.select({
    ios: 'one-time-code',
    android: 'sms-otp',
    default: 'one-time-code',
  }) as TextInputProps['autoComplete'];

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
          onPress={() => {
            if (editable) {
              inputRef.current?.focus();
            }
          }}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
            backgroundColor: 'rgba(255,255,255,0.028)',
            paddingHorizontal: compact ? 13 : 14,
            paddingTop: compact ? 13 : 14,
            paddingBottom: compact ? 11 : 12,
            overflow: 'hidden',
            ...(isWeb
              ? ({
                  cursor: editable ? 'text' : 'default',
                } as object)
              : null),
          }}
        >
          <TextInput
            ref={inputRef}
            value={normalizedValue}
            editable={editable}
            onChangeText={(nextValue) => onChangeText(sanitizeOtp(nextValue, length))}
            keyboardType="number-pad"
            inputMode="numeric"
            textContentType="oneTimeCode"
            autoComplete={autoComplete}
            maxLength={length}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={onSubmitEditing}
            returnKeyType="done"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              opacity: 0,
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: compact ? 7 : 9,
            }}
          >
            {Array.from({ length }).map((_, index) => {
              const digit = normalizedValue[index] ?? '';
              const slotActive = isFocused && index === normalizedValue.length;
              const slotFilled = Boolean(digit);

              return (
                <View
                  key={`otp-slot-${index}`}
                  style={{
                    flex: 1,
                    minWidth: slotSize,
                    height: slotSize,
                    borderRadius: slotRadius,
                    borderWidth: 1,
                    borderColor:
                      slotActive || slotFilled ? 'rgba(156,125,255,0.86)' : 'rgba(255,255,255,0.10)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: slotActive ? '#9C7DFF' : '#120F1F',
                    shadowOpacity: slotActive ? 0.18 : 0.06,
                    shadowRadius: slotActive ? 16 : 10,
                    shadowOffset: { width: 0, height: slotActive ? 8 : 4 },
                  }}
                >
                  <CustomText
                    variant="title"
                    style={{
                      color: slotFilled ? '#F8F7FC' : 'rgba(248,247,252,0.24)',
                      fontSize: digitFontSize,
                      lineHeight: digitFontSize + 2,
                      textAlign: 'center',
                    }}
                  >
                    {digit || '·'}
                  </CustomText>
                </View>
              );
            })}
          </View>

          <CustomText
            variant="caption"
            style={{
              color: 'rgba(202,196,220,0.58)',
              marginTop: 9,
              fontSize: compact ? 10.6 : 11,
              lineHeight: compact ? 14 : 15,
            }}
          >
            {helperText}
          </CustomText>

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
            }}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}
