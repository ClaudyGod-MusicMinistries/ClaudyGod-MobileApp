// components/layout/BottomNavBar.tsx
import React from 'react';
import { TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  navBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
    paddingHorizontal: 8, paddingVertical: 8,
  },
  navItem:    { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' },
  iconWrap:   { position: 'relative' },
  badge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: theme.colors.danger,
    borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText:  { fontSize: 10, color: '#FFF', fontWeight: '700' },
  navLabel:   { fontSize: 10 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNavBar({ items, activeItemId }: BottomNavBarProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 400;

  return (
    <View style={styles.navBar}>
      {items.map((item) => {
        const isActive = activeItemId === item.id || item.active;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={item.onPress}
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: !!isActive }}
            style={[styles.navItem, { gap: isNarrow ? 0 : 6 }]}
          >
            <View style={styles.iconWrap}>
              <MaterialIcons
                name={item.icon}
                size={24}
                color={isActive ? theme.colors.primary : theme.colors.textSecondary}
              />
              {item.badge ? (
                <View style={styles.badge}>
                  <CustomText style={styles.badgeText}>{item.badge}</CustomText>
                </View>
              ) : null}
            </View>
            {!isNarrow && (
              <CustomText
                variant="caption"
                style={[
                  styles.navLabel,
                  {
                    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: isActive ? '600' : '500',
                  },
                ]}
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
