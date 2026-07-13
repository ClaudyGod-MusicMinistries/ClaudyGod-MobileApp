import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../util/colorScheme';
import { makeStyles } from '../styles/makeStyles';

const useStyles = makeStyles((theme) => ({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: theme.colors.warningSurface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, alignSelf: 'center',
  },
  title: {
    fontSize: 18, fontWeight: '600', color: theme.colors.text,
    marginBottom: 8, textAlign: 'center',
  },
  body: {
    fontSize: 13, color: theme.colors.textSecondary,
    lineHeight: 20, textAlign: 'center', marginBottom: 32,
  },
  retryBtn: {
    minHeight: 48, paddingHorizontal: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.card,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  retryText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: 14 },
}));

export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  const styles = useStyles();
  const theme = useAppTheme();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <MaterialIcons name="wifi-off" size={32} color={theme.colors.warning} />
        </View>
        <Text style={styles.title}>You&apos;re Offline</Text>
        <Text style={styles.body}>
          Check your internet connection. ClaudyGod will reconnect automatically once you&apos;re back online.
        </Text>
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
