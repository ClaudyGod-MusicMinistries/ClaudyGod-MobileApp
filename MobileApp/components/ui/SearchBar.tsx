// components/ui/SearchBar.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../util/colorScheme';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
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
        borderRadius: 8,
        paddingHorizontal: theme.spacing.md,
        borderWidth: focused ? 1 : 0,
        borderColor: focused ? theme.colors.border : 'transparent',
      }}
    >
      <MaterialIcons name="search" size={18} color={theme.colors.text.secondary} />
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
          fontSize: theme.typography.body,
        }}
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <MaterialIcons name="close" size={18} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
