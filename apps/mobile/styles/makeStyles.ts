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

export function makeStyles<T extends StyleMap>(factory: (theme: AppTheme) => T) {
  return function useStyles(): StyleSheet.NamedStyles<T> {
    const theme = useAppTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
