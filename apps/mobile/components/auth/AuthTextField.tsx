import React, { useRef, useState } from 'react';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { Platform, Pressable, TextInput, View } from 'react-native';
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
}: AuthTextFieldProps) {
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isWeb = Platform.OS === 'web';
  const isActive = isFocused || isHovered;

  return (
    <View>
      {label ? (
        <CustomText
          variant="caption"
          style={{
            color: isFocused ? '#F0E8FF' : 'rgba(233,226,248,0.78)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.7,
          }}
        >
          {label}
        </CustomText>
      ) : null}

      <Pressable
        onPress={() => inputRef.current?.focus()}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isActive ? 'rgba(168,125,255,0.62)' : 'rgba(255,255,255,0.14)',
          backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.045)',
          paddingHorizontal: 15,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: isActive ? '#8F67F7' : '#12092A',
          shadowOpacity: isActive ? 0.16 : 0.06,
          shadowRadius: isActive ? 18 : 10,
          shadowOffset: { width: 0, height: isActive ? 8 : 4 },
          elevation: isActive ? 6 : 2,
          ...(isWeb
            ? ({
                cursor: 'text',
                transitionDuration: '160ms',
              } as object)
            : null),
        }}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor="rgba(207,200,228,0.68)"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            minHeight: 56,
            color: '#F8F7FC',
            fontSize: 14,
            lineHeight: 20,
            fontFamily: 'Sora_400Regular',
          }}
        />

        {trailing ? <View style={{ marginLeft: 10 }}>{trailing}</View> : null}
      </Pressable>
    </View>
  );
}
