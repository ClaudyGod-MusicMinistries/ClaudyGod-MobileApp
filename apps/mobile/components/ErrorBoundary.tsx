import React, { ReactNode } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../util/colorScheme';
import { makeStyles } from '../styles/makeStyles';
import { reportException, reportBreadcrumb } from '../lib/sentry';
import { CustomText } from './CustomText';
import { AppButton } from './ui/AppButton';
import { FadeIn } from './ui/FadeIn';

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
}));

// ─── Error UI (function component so it can use hooks) ────────────────────────

function ErrorUI({
  error,
  isDev,
  contextLabel,
  onRetry,
  onDismiss,
}: {
  error: Error;
  isDev: boolean;
  contextLabel: string;
  onRetry: () => void;
  onDismiss: () => void;
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
        <FadeIn from={6} duration={260} style={styles.iconBox}>
          <MaterialIcons name="error-outline" size={32} color={theme.colors.danger} />
        </FadeIn>

        <FadeIn delay={50} from={6} duration={280} style={styles.messageWrap}>
          <CustomText variant="heading" style={styles.errorTitle}>Something went wrong</CustomText>
          <CustomText variant="body" style={styles.errorBody}>
            We ran into an unexpected error{contextLabel}. Please try again or contact support if the problem persists.
          </CustomText>
        </FadeIn>

        {isDev ? (
          <View style={styles.devCard}>
            <CustomText variant="label" style={styles.devTitle}>Error message</CustomText>
            <CustomText variant="caption" style={styles.devMessage}>{errorMessage}</CustomText>
            {stackTrace ? (
              <>
                <CustomText variant="label" style={styles.stackTitle}>Stack trace</CustomText>
                <CustomText variant="caption" style={styles.stackText} numberOfLines={8}>{stackTrace}</CustomText>
              </>
            ) : null}
          </View>
        ) : null}

        <View style={styles.spacer} />

        <FadeIn delay={90} from={6} duration={300} style={styles.btnsGap}>
          <AppButton title="Try again" variant="gradient" size="lg" fullWidth onPress={onRetry} />
          <AppButton title="Return to safety" variant="secondary" size="lg" fullWidth onPress={onDismiss} />
        </FadeIn>
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
    reportException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
      tags: { boundaryContext: this.props.context ?? 'unknown' },
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorCount: this.state.errorCount + 1 });
  };

  // Functionally the same reset as "Try Again" — the boundary sits above the
  // router in the tree, so there's no clean "navigate home instead" available
  // here. The real distinction is in the telemetry: this breadcrumb lets us
  // tell a user who gave up (dismissed) apart from one who tried again, which
  // "Try Again" reusing the same handler as "Dismiss" used to erase entirely.
  dismissError = () => {
    reportBreadcrumb({
      category: 'error_boundary',
      message: 'User dismissed error without retrying',
      level: 'info',
      data: { context: this.props.context ?? 'unknown' },
    });
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
          onDismiss={this.dismissError}
        />
      );
    }
    return this.props.children;
  }
}
