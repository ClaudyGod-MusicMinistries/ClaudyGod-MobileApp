/* eslint-disable @typescript-eslint/no-require-imports */
// components/AnimatedHeader.tsx
import React from 'react';
import { View, TouchableOpacity, Image, StatusBar, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from './CustomText';
import { useAppTheme } from '../util/colorScheme';

interface AnimatedHeaderProps {
  onPressHome?: () => void;
  onPressNotifications?: () => void;
  onPressSearch?: () => void;
  onPressCast?: () => void;
  onPressProfile?: () => void;
}

export const AnimatedHeader = ({
  onPressHome,
  onPressNotifications,
  onPressSearch,
  onPressCast,
  onPressProfile,
}: AnimatedHeaderProps) => {
  const theme = useAppTheme();
  const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 28;

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        borderBottomColor: theme.colors.border,
        borderBottomWidth: 1,
        paddingTop: STATUS_BAR_HEIGHT,
      }}
    >
      <View
        style={{
          height: 64,
          paddingHorizontal: theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
        }}
      >
        <TouchableOpacity onPress={onPressHome} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image
            source={require('../assets/images/ClaudyGoLogo.webp')}
            style={{ width: 34, height: 34, borderRadius: 10 }}
          />
          <View>
            <CustomText style={{ color: theme.colors.text.primary, fontWeight: '800' }}>
              ClaudyGod
            </CustomText>
            <CustomText style={{ color: theme.colors.text.secondary, fontSize: 12 }}>
              Music + Video
            </CustomText>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={onPressSearch} style={iconButton(theme)}>
            <MaterialIcons name="search" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPressCast} style={iconButton(theme)}>
            <MaterialIcons name="cast" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPressNotifications} style={iconButton(theme)}>
            <MaterialIcons name="notifications" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPressProfile} style={iconButton(theme)}>
            <MaterialIcons name="account-circle" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const iconButton = (theme: ReturnType<typeof useAppTheme>) => ({
  width: 40,
  height: 40,
  borderRadius: theme.radius.md,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
});

export default AnimatedHeader;
