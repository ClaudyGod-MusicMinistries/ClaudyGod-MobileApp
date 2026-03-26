// components/layout/BottomNavBar.tsx
import React from 'react';
import { View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

interface NavItem {
  id: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  active?: boolean;
  onPress: () => void;
  badge?: number;
}

interface BottomNavBarProps {
  items: NavItem[];
  activeItemId?: string;
}

export function BottomNavBar({ items, activeItemId }: BottomNavBarProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 400;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingHorizontal: 8,
        paddingVertical: 8,
      }}
    >
      {items.map((item) => {
        const isActive = activeItemId === item.id || item.active;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={item.onPress}
            style={{
              flex: 1,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              gap: isNarrow ? 0 : 6,
            }}
          >
            <View style={{ position: 'relative' }}>
              <MaterialIcons
                name={item.icon}
                size={24}
                color={isActive ? theme.colors.primary : theme.colors.text.secondary}
              />
              {item.badge ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: theme.colors.danger,
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CustomText
                    style={{
                      fontSize: 10,
                      color: '#FFF',
                      fontWeight: '700',
                    }}
                  >
                    {item.badge}
                  </CustomText>
                </View>
              ) : null}
            </View>
            {!isNarrow && (
              <CustomText
                variant="caption"
                style={{
                  fontSize: 10,
                  color: isActive ? theme.colors.primary : theme.colors.text.secondary,
                  fontWeight: isActive ? '600' : '500',
                }}
              >
                {item.label}
              </CustomText>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
