import React, { ReactNode } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/color';

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
    
    // In production, send to error tracking service (e.g., Sentry, LogRocket)
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
      // TODO: Send to error tracking service
      // captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: this.state.errorCount + 1,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const darkPalette = colors.dark;
      const errorMessage = this.state.error.message || 'An unexpected error occurred';
      const stackTrace = this.state.error.stack || '';
      const contextLabel = this.props.context ? ` while loading ${this.props.context}` : '';

      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: darkPalette.background }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(239,68,68,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                alignSelf: 'center',
              }}
            >
              <MaterialIcons name="error-outline" size={32} color={darkPalette.danger} />
            </View>

            {/* Header */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: darkPalette.text,
                  marginBottom: 8,
                }}
              >
                Oops! Something went wrong
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: darkPalette.textSecondary,
                  lineHeight: 20,
                }}
              >
                We ran into an unexpected error{contextLabel}. Please try again or contact
                support if the problem persists.
              </Text>
            </View>

            {/* Error Details (Dev mode) */}
            {this.state.isDev && (
              <View
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: darkPalette.danger,
                      marginBottom: 8,
                    }}
                  >
                  Error Message
                </Text>
                <Text
                    style={{
                      fontSize: 11,
                      color: darkPalette.textSecondary,
                      fontFamily: 'monospace',
                      lineHeight: 16,
                    }}
                >
                  {errorMessage}
                </Text>

                {stackTrace && (
                  <>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: darkPalette.danger,
                        marginTop: 12,
                        marginBottom: 8,
                      }}
                    >
                      Stack Trace
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: darkPalette.textSecondary,
                        fontFamily: 'monospace',
                        lineHeight: 14,
                      }}
                      numberOfLines={8}
                    >
                      {stackTrace}
                    </Text>
                  </>
                )}
              </View>
            )}

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Action Buttons */}
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={this.resetError}
                style={{
                  minHeight: 48,
                  backgroundColor: darkPalette.primary,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: darkPalette.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 5,
                }}
              >
                <Text
                  style={{
                    color: darkPalette.textInverse,
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  Try Again
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  this.resetError();
                }}
                style={{
                  minHeight: 48,
                  backgroundColor: darkPalette.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: darkPalette.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: darkPalette.text,
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  Dismiss Error
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
