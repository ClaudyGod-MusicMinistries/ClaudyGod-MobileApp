import React from 'react';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { TextInput, View } from 'react-native';
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
}: AuthTextFieldProps) {
  return (
    <View>
      {label ? (
        <CustomText
          variant="label"
          style={{
            color: '#F4F1FF',
            marginBottom: 8,
          }}
        >
          {label}
        </CustomText>
      ) : null}

      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.16)',
          backgroundColor: 'rgba(255,255,255,0.05)',
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor="rgba(207,200,228,0.68)"
          style={{
            flex: 1,
            minHeight: 52,
            color: '#F8F7FC',
            fontSize: 14,
            fontFamily: 'SpaceGrotesk_500Medium',
          }}
        />

        {trailing ? <View style={{ marginLeft: 10 }}>{trailing}</View> : null}
      </View>
    </View>
  );
}
