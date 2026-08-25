import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PremiumPage } from '../../components/feed';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createGuestSupportRequest, fetchGuestSupportRequestStatuses, type SupportTicketSummary } from '../../services/userFlowService';
import { useAppModal } from '../../context/AppModalContext';
import { useAppContext } from '../../context/AppContext';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { openExternalUrl } from '../../util/externalLinks';
import { getGuestSupportState, saveGuestSupportState, type GuestSupportCredential } from '../../lib/guestSupportStore';

const CATEGORIES = [{ id: 'playback', label: 'Playback', icon: 'play-circle-outline' }, { id: 'account', label: 'Account', icon: 'person-outline' }, { id: 'content', label: 'Content', icon: 'library-music' }, { id: 'billing', label: 'Giving', icon: 'volunteer-activism' }, { id: 'technical', label: 'Technical', icon: 'build' }] as const;
type Category = (typeof CATEGORIES)[number]['id'];

const useStyles = makeStyles((theme) => ({
  intro: { padding: theme.spacing.xl, gap: 10 },
  eyebrow: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  body: { color: theme.colors.textSecondary, lineHeight: 22 },
  card: { padding: theme.spacing.lg, gap: 14 },
  sectionHeader: { gap: 4 },
  title: { color: theme.colors.text },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  contact: { flexGrow: 1, flexBasis: 145, minWidth: 145, minHeight: 88, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.controlBorder, backgroundColor: theme.colors.controlSurface, gap: 8 },
  contactTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contactIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: theme.colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  contactDescription: { color: theme.colors.textMuted },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  category: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.controlBorder, backgroundColor: theme.colors.controlSurface },
  categoryActive: { borderColor: theme.colors.controlSelectedBorder, backgroundColor: theme.colors.controlSelectedSurface },
  categoryText: { color: theme.colors.controlText, fontWeight: '600' },
  categoryTextActive: { color: theme.colors.controlSelectedText },
  label: { color: theme.colors.text, fontWeight: '700' },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.controlBorder, backgroundColor: theme.colors.controlSurface, color: theme.colors.text, paddingHorizontal: 15, fontSize: 15 },
  messageInput: { minHeight: 132, paddingTop: 14 },
  counter: { color: theme.colors.textMuted, textAlign: 'right' },
  accountNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, backgroundColor: theme.colors.infoSurface, borderWidth: 1, borderColor: theme.colors.infoBorder },
  noticeCopy: { flex: 1, color: theme.colors.textSecondary, lineHeight: 20 },
  ticket: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.divider, gap: 5 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  ticketSubject: { flex: 1, color: theme.colors.text },
  status: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.colors.infoSurface, borderWidth: 1, borderColor: theme.colors.infoBorder },
  statusText: { color: theme.colors.info, textTransform: 'capitalize', fontWeight: '700' },
  ticketMeta: { color: theme.colors.textMuted },
  faq: { paddingVertical: 13, borderTopWidth: 1, borderTopColor: theme.colors.divider },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqTitle: { flex: 1, color: theme.colors.text },
  faqAnswer: { color: theme.colors.textSecondary, lineHeight: 21, marginTop: 10, paddingRight: 24 },
}));

export default function Help() {
  const styles = useStyles(); const theme = useAppTheme();
  const { config, loading: configLoading } = useMobileAppConfig();
  const { deviceId, isReady } = useAppContext(); const { showModal } = useAppModal();
  const [category, setCategory] = useState<Category>('playback'); const [subject, setSubject] = useState(''); const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(''); const [credentials, setCredentials] = useState<GuestSupportCredential[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false); const [tickets, setTickets] = useState<SupportTicketSummary[]>([]); const [loadingTickets, setLoadingTickets] = useState(false);
  const contacts = useMemo(() => config?.help.contact ?? [], [config]); const faqs = useMemo(() => config?.help.faqs ?? [], [config]);
  const subjectValid = subject.trim().length >= 4 && subject.trim().length <= 120; const messageValid = message.trim().length >= 12 && message.trim().length <= 4000; const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());

  const loadTickets = useCallback(async (items: GuestSupportCredential[]) => { if (!deviceId || !items.length) { setTickets([]); return; } setLoadingTickets(true); try { setTickets((await fetchGuestSupportRequestStatuses({ tickets: items })).tickets); } catch { setTickets([]); } finally { setLoadingTickets(false); } }, [deviceId]);
  useEffect(() => { void getGuestSupportState().then((state) => { setContactEmail(state.contactEmail); setCredentials(state.tickets); void loadTickets(state.tickets); }); }, [deviceId, loadTickets]);

  const submit = async () => {
    if (!isReady || !deviceId || !emailValid || !subjectValid || !messageValid || submitting) return;
    setSubmitting(true);
    try {
      const response = await createGuestSupportRequest({ contactEmail: contactEmail.trim().toLowerCase(), category, subject: subject.trim(), message: message.trim() });
      const nextCredentials = [{ id: response.ticket.id, trackingToken: response.ticket.trackingToken }, ...credentials.filter((item) => item.id !== response.ticket.id)].slice(0, 10);
      setCredentials(nextCredentials); await saveGuestSupportState({ contactEmail: contactEmail.trim().toLowerCase(), tickets: nextCredentials });
      setSubject(''); setMessage(''); await loadTickets(nextCredentials);
      showModal({ title: 'Support request created', message: `Reference ${response.ticket.id.slice(0, 8)} · Status ${response.ticket.status}. You can track it on this screen.`, tone: 'success', primaryAction: { label: 'Done' } });
    } catch (error) { showModal({ title: 'Request not created', message: error instanceof Error ? error.message : 'Please try again.', tone: 'error', primaryAction: { label: 'Try again' } }); }
    finally { setSubmitting(false); }
  };

  return <PremiumPage title="Help & Support" eyebrow="Support desk" subtitle="Clear answers and tracked assistance" refreshing={configLoading || loadingTickets} onRefresh={() => void loadTickets(credentials)}>
    <SurfaceCard tone="strong" style={styles.intro}><CustomText variant="caption" style={styles.eyebrow}>Help when you need it</CustomText><CustomText variant="display">Let’s solve it clearly.</CustomText><CustomText variant="body" style={styles.body}>Use a verified contact route for a quick conversation, or create a tracked request for issues that need investigation.</CustomText>{config?.help.supportCenterUrl ? <AppButton title="Open support center" variant="secondary" onPress={() => void openExternalUrl(config.help.supportCenterUrl)} leftIcon={<MaterialIcons name="open-in-new" size={17} color={theme.colors.text} />} /> : null}</SurfaceCard>

    {contacts.length ? <SurfaceCard tone="subtle" style={styles.card}><View style={styles.sectionHeader}><CustomText variant="heading" style={styles.title}>Contact support</CustomText><CustomText variant="body" style={styles.body}>Routes are managed by the ClaudyGod mobile configuration.</CustomText></View><View style={styles.contactGrid}>{contacts.map((item) => <TVTouchable key={item.id} onPress={() => void openExternalUrl(item.actionUrl)} showFocusBorder={false} accessibilityLabel={`${item.title}: ${item.desc}`} style={styles.contact}><View style={styles.contactTop}><View style={styles.contactIcon}><MaterialIcons name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={19} color={theme.colors.primary} /></View><MaterialIcons name="north-east" size={17} color={theme.colors.textMuted} /></View><CustomText variant="label">{item.title}</CustomText><CustomText variant="caption" style={styles.contactDescription}>{item.desc}</CustomText></TVTouchable>)}</View></SurfaceCard> : null}

    <SurfaceCard tone="subtle" style={styles.card}><View style={styles.sectionHeader}><CustomText variant="heading" style={styles.title}>Create a support request</CustomText><CustomText variant="body" style={styles.body}>No account is required. Your reply email and a private installation-scoped ticket credential keep the conversation manageable.</CustomText></View>
      <View style={styles.accountNotice}><MaterialIcons name="privacy-tip" size={20} color={theme.colors.info} /><CustomText style={styles.noticeCopy}>This device is not treated as a user account. Ticket access stays on this installation unless you contact support with your reference.</CustomText></View>
        <CustomText variant="label" style={styles.label}>Reply email</CustomText><TextInput value={contactEmail} onChangeText={setContactEmail} maxLength={254} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" placeholderTextColor={theme.colors.textMuted} selectionColor={theme.colors.primary} cursorColor={theme.colors.primary} style={styles.input} />
        <CustomText variant="label" style={styles.label}>Issue category</CustomText><View style={styles.categoryGrid}>{CATEGORIES.map((item) => { const active = category === item.id; return <TVTouchable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => setCategory(item.id)} showFocusBorder={false} style={[styles.category, active && styles.categoryActive]}><MaterialIcons name={item.icon} size={17} color={active ? theme.colors.controlSelectedText : theme.colors.primary} /><CustomText style={[styles.categoryText, active && styles.categoryTextActive]}>{item.label}</CustomText></TVTouchable>; })}</View>
        <CustomText variant="label" style={styles.label}>Subject</CustomText><TextInput value={subject} onChangeText={setSubject} maxLength={120} placeholder="Briefly name the issue" placeholderTextColor={theme.colors.textMuted} selectionColor={theme.colors.primary} cursorColor={theme.colors.primary} style={styles.input} /><CustomText variant="caption" style={styles.counter}>{subject.length}/120</CustomText>
        <CustomText variant="label" style={styles.label}>What happened?</CustomText><TextInput value={message} onChangeText={setMessage} maxLength={4000} multiline textAlignVertical="top" placeholder="Include what you expected, what happened, and any useful device details." placeholderTextColor={theme.colors.textMuted} selectionColor={theme.colors.primary} cursorColor={theme.colors.primary} style={[styles.input, styles.messageInput]} /><CustomText variant="caption" style={styles.counter}>{message.length}/4000</CustomText>
      <AppButton title="Create tracked request" variant="gradient" size="lg" fullWidth disabled={!isReady || !emailValid || !subjectValid || !messageValid} loading={submitting} loadingLabel="Creating request" onPress={() => void submit()} />
    </SurfaceCard>

    <SurfaceCard tone="subtle" style={styles.card}><View style={styles.sectionHeader}><CustomText variant="heading" style={styles.title}>Requests from this installation</CustomText><CustomText variant="body" style={styles.body}>Latest status verified with each ticket’s private credential.</CustomText></View>{tickets.length ? tickets.map((ticket) => <View key={ticket.id} style={styles.ticket}><View style={styles.ticketTop}><CustomText variant="label" style={styles.ticketSubject}>{ticket.subject}</CustomText><View style={styles.status}><CustomText variant="caption" style={styles.statusText}>{ticket.status.replace('_', ' ')}</CustomText></View></View><CustomText variant="caption" style={styles.ticketMeta}>#{ticket.id.slice(0, 8)} · {ticket.category} · {new Date(ticket.createdAt).toLocaleDateString()}</CustomText></View>) : <CustomText variant="body" style={styles.body}>{loadingTickets ? 'Loading requests…' : 'No support requests on this installation yet.'}</CustomText>}</SurfaceCard>

    {faqs.length ? <SurfaceCard tone="subtle" style={styles.card}><View style={styles.sectionHeader}><CustomText variant="heading" style={styles.title}>Quick answers</CustomText><CustomText variant="body" style={styles.body}>Published from the current mobile support configuration.</CustomText></View>{faqs.map((faq) => { const open = expanded === faq.id; return <TVTouchable key={faq.id} onPress={() => setExpanded(open ? null : faq.id)} showFocusBorder={false} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.faq}><View style={styles.faqQuestion}><CustomText variant="label" style={styles.faqTitle}>{faq.q}</CustomText><MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={21} color={theme.colors.textMuted} /></View>{open ? <CustomText variant="body" style={styles.faqAnswer}>{faq.a}</CustomText> : null}</TVTouchable>; })}</SurfaceCard> : null}
  </PremiumPage>;
}
