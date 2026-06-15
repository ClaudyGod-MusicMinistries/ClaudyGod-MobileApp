// components/ui/Header.tsx
import React from 'react';
import { View, StyleSheet, Animated, SafeAreaView, type StyleProp, type ViewStyle } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
  onScroll?: (_offset: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
  animated = true,
  onScroll: _onScroll,
}) => {
  const theme = useAppTheme();
  const TitleContainer = animated ? Animated.View : View;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surface }, style]}
    >
      <SafeAreaView>
        <View style={styles.header}>
          <View style={styles.actionContainer}>
            {leftAction}
          </View>

          <TitleContainer
            style={[
              styles.titleContainer,
              animated ? styles.animatedTitleContainer : null,
            ]}
          >
            <CustomText variant="heading" style={[styles.title, { color: theme.colors.textInverse }]}>
              {title}
            </CustomText>
            {subtitle && (
              <CustomText variant="caption" style={[styles.subtitle, { color: 'rgba(255,255,255,0.78)' }]}>
                {subtitle}
              </CustomText>
            )}
          </TitleContainer>

          <View style={[styles.actionContainer, styles.rightActionContainer]}>
            {rightAction ?? <MaterialIcons name="keyboard-arrow-down" size={20} color="rgba(255,255,255,0.82)" />}
          </View>
        </View>
      </SafeAreaView>

      <View
        style={[
          styles.accentLine,
          { backgroundColor: 'rgba(255,255,255,0.2)' },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionContainer: {
    flex: 0.5,
    alignItems: 'flex-start',
  },
  rightActionContainer: {
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
  },
  animatedTitleContainer: {
    opacity: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '400',
    marginTop: 3,
  },
  accentLine: {
    height: 1,
    marginTop: 8,
  },
});
