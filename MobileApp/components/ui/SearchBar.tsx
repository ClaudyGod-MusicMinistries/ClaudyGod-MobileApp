// components/ui/SearchBar.tsx
import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

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
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.sm,
        minHeight: 46,
        borderWidth: 1,
        borderColor: focused ? theme.colors.primary : theme.colors.border,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${theme.colors.primary}12`,
        }}
      >
        <MaterialIcons name="search" size={18} color={theme.colors.primary} />
      </View>
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
        <TVTouchable onPress={() => onChangeText('')} style={{ marginHorizontal: 4 }} showFocusBorder={false}>
          <MaterialIcons name="close" size={18} color={theme.colors.text.secondary} />
        </TVTouchable>
      ) : null}
      {onSubmit ? (
        <TVTouchable
          onPress={onSubmit}
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: theme.radius.pill,
          }}
          showFocusBorder={false}
        >
          <MaterialIcons name="arrow-forward" size={16} color={theme.colors.text.inverse} />
        </TVTouchable>
      ) : null}
    </View>
  );
}
