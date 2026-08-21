import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from './CustomText';
import { useAppTheme } from '../util/colorScheme';

export function OfflineBanner({ onRetry }: { onRetry: () => void }) {
  const theme = useAppTheme();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <MaterialIcons name="cloud-off" size={17} color={theme.colors.text} />
      <CustomText style={[styles.message, { color: theme.colors.text }]} numberOfLines={2}>
        Offline — downloads and saved content remain available.
      </CustomText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Check internet connection again"
        hitSlop={8}
        onPress={onRetry}
        style={[styles.retry, { borderColor: theme.colors.border }]}
      >
        <CustomText style={{ color: theme.colors.primary, fontWeight: '700' }}>Retry</CustomText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', left: 12, right: 12, top: 8, zIndex: 1000,
    minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 9,
  },
  message: { flex: 1, fontSize: 12, lineHeight: 17 },
  retry: { minWidth: 58, minHeight: 36, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
