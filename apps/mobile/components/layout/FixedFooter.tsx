// components/layout/FixedFooter.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

interface FooterLink {
  label: string;
  url?: string;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FixedFooterProps {
  sections?: FooterSection[];
  showSocial?: boolean;
  copyrightText?: string;
  onContentPadding?: number;
}

const DEFAULT_SECTIONS: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', url: 'https://claudygod.com/features' },
      { label: 'Download', url: 'https://claudygod.com/download' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help', url: 'https://help.claudygod.com' },
      { label: 'Contact', url: 'https://claudygod.com/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', url: 'https://claudygod.com/privacy' },
      { label: 'Terms', url: 'https://claudygod.com/terms' },
    ],
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  bar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
    paddingVertical: 16, paddingHorizontal: 16, zIndex: 50,
  },
  scrollContent:  { gap: 20, paddingRight: 16 },
  sectionCol:     { minWidth: 120 },
  sectionTitle: {
    color: theme.colors.text, fontWeight: '600', marginBottom: 12,
    fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  linksGap:       { gap: 8 },
  linkRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText:       { color: theme.colors.textSecondary, fontSize: 11 },
  copyright: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  copyrightText:  { color: theme.colors.textSecondary, fontSize: 10, textAlign: 'center' },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function FixedFooter({
  sections = DEFAULT_SECTIONS,
  showSocial: _showSocial = false,
  copyrightText = '© 2026 ClaudyGod. All rights reserved.',
  onContentPadding: _onContentPadding = 80,
}: FixedFooterProps) {
  const styles = useStyles();
  const theme  = useAppTheme();

  const handleLinkPress = (link: FooterLink) => {
    if (link.onPress) {
      link.onPress();
    } else if (link.url) {
      Linking.openURL(link.url).catch(() => {
        console.warn(`Failed to open URL: ${link.url}`);
      });
    }
  };

  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={true}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.sectionCol}>
            <CustomText variant="label" style={styles.sectionTitle}>
              {section.title}
            </CustomText>
            <View style={styles.linksGap}>
              {section.links.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => handleLinkPress(link)}
                  style={styles.linkRow}
                >
                  {link.icon && (
                    <MaterialIcons name={link.icon} size={12} color={theme.colors.primary} />
                  )}
                  <CustomText style={styles.linkText} numberOfLines={1}>
                    {link.label}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.copyright}>
        <CustomText style={styles.copyrightText}>{copyrightText}</CustomText>
      </View>
    </View>
  );
}
