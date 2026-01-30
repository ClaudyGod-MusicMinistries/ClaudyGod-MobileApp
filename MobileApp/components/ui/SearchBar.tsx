// components/ui/SearchBar.tsx
import React from 'react';
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

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <MaterialIcons name="search" size={18} color={theme.colors.text.secondary} />
      <TextInput
        placeholder={placeholder || 'Search songs, albums, artists'}
        placeholderTextColor={theme.colors.text.secondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        style={{
          flex: 1,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
          color: theme.colors.text.primary,
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

