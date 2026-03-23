// components/ui/SearchBar.tsx
import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (_text: string) => void;
  onSubmit?: () => void;
}

export function SearchBar({ placeholder, value, onChangeText, onSubmit }: SearchBarProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.md,
        minHeight: 50,
        borderWidth: 1,
        borderColor: focused ? theme.colors.primary : theme.colors.border,
      }}
    >
      <MaterialIcons name="search" size={18} color={focused ? theme.colors.primary : theme.colors.text.secondary} />
      <TextInput
        placeholder={placeholder || 'Search songs, albums, artists'}
        placeholderTextColor={theme.colors.text.secondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
          color: theme.colors.text.primary,
          fontSize: 14,
          lineHeight: 19,
          fontFamily: 'Sora_400Regular',
        }}
      />
      {value.length > 0 ? (
        <TVTouchable onPress={() => onChangeText('')} style={{ marginHorizontal: 4 }} showFocusBorder={false}>
          <MaterialIcons name="close" size={18} color={theme.colors.text.secondary} />
        </TVTouchable>
      ) : null}
      {onSubmit ? (
        <TVTouchable
          onPress={onSubmit}
          style={{
            backgroundColor: theme.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.colors.border,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: theme.radius.md,
          }}
          showFocusBorder={false}
        >
          <MaterialIcons name="arrow-forward" size={16} color={theme.colors.text.primary} />
        </TVTouchable>
      ) : null}
    </View>
  );
}
