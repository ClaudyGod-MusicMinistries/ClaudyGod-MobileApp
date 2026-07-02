// components/layout/ImprovedScreen.tsx
// Improved screen layout with proper spacing for fixed footer and floating player
import React, { type ReactNode } from 'react';
import type { RefreshControlProps } from 'react-native';
import { View, ScrollView } from 'react-native';
import { makeStyles } from '../../styles/makeStyles';
import { useFloatingPlayer } from '../../context/FloatingPlayerContext';

const useStyles = makeStyles((theme) => ({
  root:       { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
}));

interface ImprovedScreenProps {
  children: ReactNode;
  withFixedFooter?: boolean;
  withFloatingPlayer?: boolean;
  showsVerticalScrollIndicator?: boolean;
  bounces?: boolean;
  overScrollMode?: 'auto' | 'never' | 'always';
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

/**
 * Improved Screen Layout
 * - Handles scrolling content properly
 * - Respects fixed footer at bottom
 * - Respects minimized floating player
 * - Professional padding and spacing
 */
export function ImprovedScreen({
  children,
  withFixedFooter = false,
  withFloatingPlayer = false,
  showsVerticalScrollIndicator = false,
  bounces = false,
  overScrollMode = 'never',
  refreshControl,
}: ImprovedScreenProps) {
  const styles = useStyles();
  const { player } = useFloatingPlayer();

  // Calculate bottom padding for fixed footer and floating player
  let bottomPaddingForContent = 0;
  if (withFixedFooter) {
    bottomPaddingForContent += 140; // Fixed footer height
  }
  if (withFloatingPlayer && player.content && player.isMinimized) {
    bottomPaddingForContent += 76; // Floating player height
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: Math.max(bottomPaddingForContent, 20),
        }}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        bounces={bounces}
        overScrollMode={overScrollMode}
        refreshControl={refreshControl ?? undefined}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>

      {/* Floating Player will float above scroll content */}
      {/* Fixed Footer will be position: absolute at bottom */}
    </View>
  );
}
