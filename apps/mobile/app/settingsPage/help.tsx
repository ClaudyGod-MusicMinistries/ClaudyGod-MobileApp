import React, { useMemo, useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createSupportRequest } from '../../services/userFlowService';
import { useAppModal } from '../../context/AppModalContext';
import { useAppTheme } from '../../util/colorScheme';

const SUPPORT_CATEGORIES = [
  { id: 'playback',  label: 'Playback' },
  { id: 'account',   label: 'Account' },
  { id: 'content',   label: 'Content' },
  { id: 'billing',   label: 'Giving' },
  { id: 'technical', label: 'Technical' },
] as const;

type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]['id'];

function SectionLabel({ title }: { title: string }) {
  const theme = useAppTheme();
  return (
    <CustomText
      style={{
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        paddingHorizontal: 4,
      }}
    >
      {title}
    </CustomText>
  );
}

export default function Help() {
  const theme = useAppTheme();
  const { config } = useMobileAppConfig();
  const { showModal } = useAppModal();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory>('playback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supportCenterUrl = config?.help?.supportCenterUrl ?? 'https://claudygod.org';
  const contactOptions = useMemo(() => config?.help?.contact ?? [], [config]);
  const faqItems = useMemo(() => config?.help?.faqs ?? [], [config]);

  const submitSupportTicket = async () => {
    if (subject.trim().length < 4) {
      showModal({
        title: 'Add a subject',
        message: 'Enter a short subject so support can understand the request.',
        tone: 'warning',
        primaryAction: { label: 'Continue' },
      });
      return;
    }

    if (message.trim().length < 12) {
      showModal({
        title: 'Add more detail',
        message: 'Describe what happened and the device you are using.',
        tone: 'warning',
        primaryAction: { label: 'Continue' },
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await createSupportRequest({
        category: selectedCategory,
        subject: subject.trim(),
        message: message.trim(),
        priority: 'normal',
        metadata: { source: 'mobile_help_screen', platform: 'mobile' },
      });
      setSubject('');
      setMessage('');
      showModal({
        title: 'Support request sent',
        message: `Ticket ${response.ticket.id.slice(0, 8)} has been created.`,
        tone: 'success',
        primaryAction: { label: 'Done' },
      });
    } catch (error) {
      showModal({
        title: 'Request failed',
        message: error instanceof Error ? error.message : 'Unable to send support request.',
        tone: 'error',
        primaryAction: { label: 'Try again' },
      });
    }
    setSubmitting(false);
  };

  return (
    <SettingsScaffold
      title="Help & Support"
      subtitle="Support for playback, account access, giving, and content."
      hero={
        <FadeIn>
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 18, padding: 20, gap: 16 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: theme.colors.primarySurface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="support-agent" size={24} color={theme.colors.primary} />
            </View>
            <View style={{ gap: 6 }}>
              <CustomText style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                Get help without confusion.
              </CustomText>
              <CustomText style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 }}>
                Choose a quick contact option, send a clear request, or review answers to common questions.
              </CustomText>
            </View>
            <AppButton
              title="Open support center"
              size="md"
              onPress={() => void Linking.openURL(supportCenterUrl)}
              leftIcon={<MaterialIcons name="open-in-new" size={16} color={theme.colors.onPrimary} />}
            />
          </View>
        </FadeIn>
      }
    >
      {contactOptions.length ? (
        <FadeIn delay={70}>
          <View style={{ gap: 10 }}>
            <SectionLabel title="Contact options" />
            <View style={{ borderRadius: 16, backgroundColor: theme.colors.surface, overflow: 'hidden' }}>
              {contactOptions.map((item, index) => (
                <TVTouchable
                  key={item.id}
                  onPress={() => void Linking.openURL(item.actionUrl)}
                  showFocusBorder={false}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: theme.colors.divider,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.primarySurface,
                    }}
                  >
                    <MaterialIcons
                      name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']}
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600' }}>
                      {item.title}
                    </CustomText>
                    <CustomText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {item.desc}
                    </CustomText>
                  </View>
                  <MaterialIcons name="open-in-new" size={16} color={theme.colors.textMuted} />
                </TVTouchable>
              ))}
            </View>
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={110}>
        <View style={{ gap: 10 }}>
          <SectionLabel title="Send a request" />
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, gap: 16 }}>
            <CustomText style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 }}>
              Share the issue clearly and the support team will follow up through your account channel.
            </CustomText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SUPPORT_CATEGORIES.map((category) => {
                const active = selectedCategory === category.id;
                return (
                  <TVTouchable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={{
                      borderRadius: 999,
                      backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText
                      style={{
                        color: active ? theme.colors.onPrimary : theme.colors.textMuted,
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      {category.label}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </View>

            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Short subject"
              placeholderTextColor={theme.colors.textMuted}
              style={{
                borderRadius: 12,
                backgroundColor: theme.colors.surfaceAlt,
                paddingHorizontal: 14,
                paddingVertical: 13,
                color: theme.colors.text,
                fontSize: 14,
              }}
            />
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the issue and your device"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 120,
                borderRadius: 12,
                backgroundColor: theme.colors.surfaceAlt,
                paddingHorizontal: 14,
                paddingVertical: 13,
                color: theme.colors.text,
                fontSize: 14,
              }}
            />

            <AppButton
              title="Submit request"
              loading={submitting}
              loadingLabel="Sending"
              fullWidth
              onPress={() => void submitSupportTicket()}
            />
          </View>
        </View>
      </FadeIn>

      {faqItems.length ? (
        <FadeIn delay={150}>
          <View style={{ gap: 10 }}>
            <SectionLabel title="Quick answers" />
            <View style={{ borderRadius: 16, backgroundColor: theme.colors.surface, overflow: 'hidden' }}>
              {faqItems.map((faq, index) => {
                const open = expanded === faq.id;
                return (
                  <TVTouchable
                    key={faq.id}
                    onPress={() => setExpanded(open ? null : faq.id)}
                    showFocusBorder={false}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: theme.colors.divider,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <MaterialIcons
                        name={open ? 'expand-less' : 'expand-more'}
                        size={20}
                        color={theme.colors.textMuted}
                      />
                      <CustomText style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', flex: 1 }}>
                        {faq.q}
                      </CustomText>
                    </View>
                    {open ? (
                      <CustomText
                        style={{
                          color: theme.colors.textMuted,
                          fontSize: 13,
                          lineHeight: 20,
                          marginTop: 10,
                          paddingLeft: 32,
                        }}
                      >
                        {faq.a}
                      </CustomText>
                    ) : null}
                  </TVTouchable>
                );
              })}
            </View>
          </View>
        </FadeIn>
      ) : null}
    </SettingsScaffold>
  );
}
