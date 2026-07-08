// styles/makeStyles.ts
// Factory that turns a theme → style-map function into a reusable hook.
// Usage:
//   const useStyles = makeStyles((theme) => ({
//     container: { flex: 1, backgroundColor: theme.colors.background },
//     title:     { color: theme.colors.text, fontSize: 16 },
//   }));
//
//   function MyComponent() {
//     const styles = useStyles();
//     return <View style={styles.container}><Text style={styles.title} /></View>;
//   }
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { useAppTheme } from '../util/colorScheme';
import type { AppTheme } from '../theme';

type AnyStyle = ViewStyle | TextStyle | ImageStyle;
type StyleMap = Record<string, AnyStyle>;

export function makeStyles<T extends StyleMap>(factory: (_theme: AppTheme) => T) {
  return function useStyles(): T {
    const theme = useAppTheme();
    // StyleSheet.create returns its input unchanged at runtime — typing the return as
    // `T` (rather than `StyleSheet.NamedStyles<T>`, which widens every key to
    // `ViewStyle | TextStyle | ImageStyle`) preserves each style's specific inferred
    // type, so passing e.g. an image style to <Image style={...}> type-checks correctly.
    return useMemo(() => StyleSheet.create(factory(theme)) as T, [theme]);
  };
}
