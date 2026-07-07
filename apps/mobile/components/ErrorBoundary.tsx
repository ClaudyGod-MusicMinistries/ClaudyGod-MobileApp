import React, { ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../util/colorScheme';
import { makeStyles } from '../styles/makeStyles';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  safeArea:       { flex: 1, backgroundColor: theme.colors.background },
  scroll:         { flex: 1 },
  iconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: theme.colors.dangerSurface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, alignSelf: 'center',
  },
  messageWrap:    { marginBottom: 24 },
  errorTitle:     { fontSize: 18, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
  errorBody:      { fontSize: 12.5, color: theme.colors.textSecondary, lineHeight: 20 },
  devCard: {
    backgroundColor: theme.colors.dangerSurface, borderWidth: 1,
    borderColor: theme.colors.dangerBorder, borderRadius: theme.radius.card,
    padding: 16, marginBottom: 24,
  },
  devTitle:       { fontSize: 12, fontWeight: '600', color: theme.colors.danger, marginBottom: 8 },
  devMessage:     { fontSize: 11, color: theme.colors.textSecondary, fontFamily: 'monospace', lineHeight: 16 },
  stackTitle:     { fontSize: 12, fontWeight: '600', color: theme.colors.danger, marginTop: 12, marginBottom: 8 },
  stackText:      { fontSize: 10, color: theme.colors.textSecondary, fontFamily: 'monospace', lineHeight: 14 },
  spacer:         { flex: 1 },
  btnsGap:        { gap: 12 },
  retryBtn: {
    minHeight: 48, backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.card, alignItems: 'center', justifyContent: 'center',
  },
  retryText:      { color: theme.colors.onPrimary, fontWeight: '600', fontSize: 14 },
  dismissBtn: {
    minHeight: 48, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dismissText:    { color: theme.colors.text, fontWeight: '600', fontSize: 14 },
}));

// ─── Error UI (function component so it can use hooks) ────────────────────────

function ErrorUI({
  error,
  isDev,
  contextLabel,
  onRetry,
}: {
  error: Error;
  isDev: boolean;
  contextLabel: string;
  onRetry: () => void;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const errorMessage = error.message || 'An unexpected error occurred';
  const stackTrace   = error.stack || '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconBox}>
          <MaterialIcons name="error-outline" size={32} color={theme.colors.danger} />
        </View>

        <View style={styles.messageWrap}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorBody}>
            We ran into an unexpected error{contextLabel}. Please try again or contact support if the problem persists.
          </Text>
        </View>

        {isDev ? (
          <View style={styles.devCard}>
            <Text style={styles.devTitle}>Error Message</Text>
            <Text style={styles.devMessage}>{errorMessage}</Text>
            {stackTrace ? (
              <>
                <Text style={styles.stackTitle}>Stack Trace</Text>
                <Text style={styles.stackText} numberOfLines={8}>{stackTrace}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        <View style={styles.spacer} />

        <View style={styles.btnsGap}>
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onRetry} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Dismiss Error</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Error Boundary (class component — required for componentDidCatch) ────────

interface ErrorBoundaryProps {
  children: ReactNode;
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  isDev: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
      isDev: process.env.NODE_ENV === 'development',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorCount: this.state.errorCount + 1 });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const contextLabel = this.props.context ? ` while loading ${this.props.context}` : '';
      return (
        <ErrorUI
          error={this.state.error}
          isDev={this.state.isDev}
          contextLabel={contextLabel}
          onRetry={this.resetError}
        />
      );
    }
    return this.props.children;
  }
}
