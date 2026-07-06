// components/AnimatedHeader.tsx
import React from 'react';
import { Image, Platform, StatusBar, View, type ImageStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from './CustomText';
import { TVTouchable } from './ui/TVTouchable';
import { useAppTheme } from '../util/colorScheme';
import { makeStyles } from '../styles/makeStyles';
import { common } from '../styles/commonStyles';

interface AnimatedHeaderProps {
  onPressHome?: () => void;
  onPressNotifications?: () => void;
  onPressSearch?: () => void;
  onPressCast?: () => void;
  onPressProfile?: () => void;
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 28;

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    paddingTop: STATUS_BAR_HEIGHT,
  },
  row: {
    height: 62,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoImage: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  logoLabel: {
    marginLeft: 10,
  },
  logoTitle: {
    color: theme.colors.text,
  },
  logoSubtitle: {
    color: theme.colors.textSecondary,
  },
  actionSpacer: {
    marginRight: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
}));

export const AnimatedHeader = ({
  onPressHome,
  onPressNotifications,
  onPressSearch,
  onPressCast,
  onPressProfile,
}: AnimatedHeaderProps) => {
  const styles = useStyles();
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TVTouchable onPress={onPressHome} style={common.rowCenter} showFocusBorder={false}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage as ImageStyle}
            resizeMode="contain"
          />
          <View style={styles.logoLabel}>
            <CustomText variant="subtitle" style={styles.logoTitle}>
              ClaudyGod
            </CustomText>
            <CustomText variant="caption" style={styles.logoSubtitle}>
              Music + Video
            </CustomText>
          </View>
        </TVTouchable>

        <View style={common.rowCenter}>
          <TVTouchable onPress={onPressSearch} style={[styles.iconBtn, styles.actionSpacer]}>
            <MaterialIcons name="search" size={20} color={theme.colors.text} />
          </TVTouchable>
          <TVTouchable onPress={onPressCast} style={[styles.iconBtn, styles.actionSpacer]}>
            <MaterialIcons name="cast" size={20} color={theme.colors.text} />
          </TVTouchable>
          <TVTouchable onPress={onPressNotifications} style={[styles.iconBtn, styles.actionSpacer]}>
            <MaterialIcons name="notifications" size={20} color={theme.colors.text} />
          </TVTouchable>
          <TVTouchable onPress={onPressProfile} style={styles.iconBtn}>
            <MaterialIcons name="account-circle" size={22} color={theme.colors.primary} />
          </TVTouchable>
        </View>
      </View>
    </View>
  );
};

export default AnimatedHeader;
