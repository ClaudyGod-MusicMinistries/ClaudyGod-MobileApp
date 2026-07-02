// components/ui/SearchBar.tsx
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { TVTouchable } from './TVTouchable';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (_text: string) => void;
  onSubmit?: () => void;
}

// ─── Static styles (no theme) ─────────────────────────────────────────────────

const ss = StyleSheet.create({
  clearBtn: { marginHorizontal: 4 },
});

// ─── Theme styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: 16,
    paddingHorizontal: theme.spacing.sm, minHeight: 44, borderWidth: 1,
  },
  barFocused:  { borderColor: theme.colors.primary },
  barBlurred:  { borderColor: theme.colors.border },
  input: {
    flex: 1, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm,
    color: theme.colors.text, fontSize: 12.5, lineHeight: 17,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  submitBtn: {
    backgroundColor: theme.colors.surfaceAlt, borderWidth: 1,
    borderColor: theme.colors.border, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 12,
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchBar({ placeholder, value, onChangeText, onSubmit }: SearchBarProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.bar, focused ? styles.barFocused : styles.barBlurred]}>
      <MaterialIcons name="search" size={18} color={focused ? theme.colors.primary : theme.colors.textSecondary} />
      <TextInput
        placeholder={placeholder || 'Search songs, albums, artists'}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
      />
      {value.length > 0 ? (
        <TVTouchable onPress={() => onChangeText('')} style={ss.clearBtn} showFocusBorder={false}>
          <MaterialIcons name="close" size={18} color={theme.colors.textSecondary} />
        </TVTouchable>
      ) : null}
      {onSubmit ? (
        <TVTouchable onPress={onSubmit} style={styles.submitBtn} showFocusBorder={false}>
          <MaterialIcons name="arrow-forward" size={16} color={theme.colors.text} />
        </TVTouchable>
      ) : null}
    </View>
  );
}
