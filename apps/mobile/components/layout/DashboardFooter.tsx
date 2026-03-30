// components/layout/DashboardFooter.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

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

interface DashboardFooterProps {
  sections?: FooterSection[];
  showSocial?: boolean;
  copyrightText?: string;
}

const DEFAULT_SECTIONS: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', url: 'https://claudygod.com/features' },
      { label: 'Pricing', url: 'https://claudygod.com/pricing' },
      { label: 'Download', url: 'https://claudygod.com/download' },
      { label: 'Changelog', url: 'https://claudygod.com/changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', url: 'https://claudygod.com/about' },
      { label: 'Blog', url: 'https://claudygod.com/blog' },
      { label: 'Careers', url: 'https://claudygod.com/careers' },
      { label: 'Contact', url: 'https://claudygod.com/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', url: 'https://help.claudygod.com' },
      { label: 'Status', url: 'https://status.claudygod.com' },
      { label: 'Community', url: 'https://community.claudygod.com' },
      { label: 'Report Bug', url: 'https://bugs.claudygod.com' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', url: 'https://claudygod.com/privacy' },
      { label: 'Terms', url: 'https://claudygod.com/terms' },
      { label: 'Cookie Policy', url: 'https://claudygod.com/cookies' },
      { label: 'Security', url: 'https://claudygod.com/security' },
    ],
  },
];

export function DashboardFooter({
  sections = DEFAULT_SECTIONS,
  showSocial = true,
  copyrightText = '© 2026 ClaudyGod. All rights reserved.',
}: DashboardFooterProps) {
  const theme = useAppTheme();

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
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    >
      {/* Main Footer Content */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 32 }}
        scrollEnabled={true}
      >
        {sections.map((section) => (
          <View key={section.title} style={{ minWidth: 140 }}>
            <CustomText
              variant="label"
              style={{
                color: theme.colors.text,
                fontWeight: '700',
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              {section.title}
            </CustomText>
            <View style={{ gap: 12 }}>
              {section.links.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => handleLinkPress(link)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  {link.icon && (
                    <MaterialIcons
                      name={link.icon}
                      size={14}
                      color={theme.colors.primary}
                    />
                  )}
                  <CustomText
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 12,
                    }}
                  >
                    {link.label}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Social Links */}
      {showSocial && (
        <View style={{ marginTop: 32, paddingTop: 32, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
          <CustomText
            style={{
              color: theme.colors.textSecondary,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            Follow Us
          </CustomText>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {[
              { icon: 'language', label: 'Website', url: 'https://claudygod.com' },
              { icon: 'mail', label: 'Email', url: 'mailto:info@claudygod.com' },
              { icon: 'forum', label: 'Community', url: 'https://community.claudygod.com' },
            ].map((social) => (
              <TouchableOpacity
                key={social.label}
                onPress={() => Linking.openURL(social.url).catch(() => {})}
              >
                <MaterialIcons name={social.icon as any} size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Copyright */}
      <View style={{ marginTop: 32, paddingTop: 32, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
        <CustomText
          style={{
            color: theme.colors.textSecondary,
            fontSize: 11,
            textAlign: 'center',
          }}
        >
          {copyrightText}
        </CustomText>
      </View>
    </View>
  );
}
