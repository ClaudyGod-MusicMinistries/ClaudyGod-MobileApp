import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { SurfaceCard } from '../ui/SurfaceCard';
import { AppButton } from '../ui/AppButton';
import { CustomText } from '../CustomText';
import { fetchLegalDocument, type LegalDocument } from '../../services/userFlowService';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { openExternalUrl } from '../../util/externalLinks';
import { PremiumPage } from '../feed';
import { FadeIn } from '../ui/FadeIn';

const useStyles = makeStyles((theme) => ({
  intro: { padding: theme.spacing.xl, gap: 10 },
  eyebrow: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  summary: { color: theme.colors.textSecondary, lineHeight: 22 },
  documentMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: theme.colors.subtleFill, borderWidth: 1, borderColor: theme.colors.border },
  meta: { color: theme.colors.textSecondary, fontWeight: '600' },
  section: { padding: theme.spacing.lg, gap: 10 },
  sectionNumber: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  heading: { color: theme.colors.text },
  paragraph: { color: theme.colors.textSecondary, lineHeight: 22 },
  bullet: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletText: { flex: 1, color: theme.colors.textSecondary, lineHeight: 22 },
  state: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  stateText: { color: theme.colors.textSecondary, textAlign: 'center' },
  contactCard: { padding: theme.spacing.lg, gap: 8 },
  contactRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  contactIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  contactCopy: { flex: 1 },
  contactBody: { color: theme.colors.textSecondary, marginTop: 3 },
}));

export function LegalDocumentScreen({ documentId }: { documentId: LegalDocument['id'] }) {
  const styles = useStyles();
  const theme = useAppTheme();
  const query = useQuery({
    queryKey: ['legal-document', documentId],
    queryFn: async () => (await fetchLegalDocument(documentId)).document,
    staleTime: 5 * 60 * 1000,
  });
  const title = documentId === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  return (
    <PremiumPage title={title} eyebrow="ClaudyGod legal" subtitle="Current, verified product policy" refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.data ? (
        <FadeIn>
          <SurfaceCard tone="strong" style={styles.intro}>
            <CustomText variant="caption" style={styles.eyebrow}>{documentId === 'privacy' ? 'Your data and choices' : 'Clear terms for a trusted experience'}</CustomText>
            <CustomText variant="display">{query.data.title}</CustomText>
            <CustomText variant="body" style={styles.summary}>{query.data.summary}</CustomText>
            <View style={styles.documentMeta}>
              <View style={styles.metaPill}><MaterialIcons name="event" size={14} color={theme.colors.primary} /><CustomText variant="caption" style={styles.meta}>Effective {query.data.effectiveDate}</CustomText></View>
              <View style={styles.metaPill}><MaterialIcons name="history" size={14} color={theme.colors.primary} /><CustomText variant="caption" style={styles.meta}>Version {query.data.version}</CustomText></View>
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}
      {query.isLoading ? (
        <View style={styles.state}><ActivityIndicator color={theme.colors.primary} /><CustomText style={styles.stateText}>Loading the current document…</CustomText></View>
      ) : query.isError || !query.data ? (
        <SurfaceCard tone="subtle" style={styles.state}>
          <MaterialIcons name="cloud-off" size={26} color={theme.colors.textMuted} />
          <CustomText variant="heading">Document unavailable</CustomText>
          <CustomText style={styles.stateText}>We could not verify the current policy version. Reconnect and try again so you do not receive outdated legal information.</CustomText>
          <AppButton title="Try again" variant="gradient" size="lg" fullWidth onPress={() => void query.refetch()} />
        </SurfaceCard>
      ) : (
        <>
          {query.data.sections.map((section, index) => (
            <FadeIn key={section.title} delay={Math.min(60 + index * 35, 220)}>
            <SurfaceCard tone="subtle" style={styles.section}>
              <CustomText variant="caption" style={styles.sectionNumber}>Section {String(index + 1).padStart(2, '0')}</CustomText>
              <CustomText variant="heading" style={styles.heading}>{section.title}</CustomText>
              {section.paragraphs.map((paragraph) => <CustomText key={paragraph} variant="body" style={styles.paragraph}>{paragraph}</CustomText>)}
              {section.bullets?.map((bullet) => <View key={bullet} style={styles.bullet}><MaterialIcons name="check-circle" size={17} color={theme.colors.primary} /><CustomText variant="body" style={styles.bulletText}>{bullet}</CustomText></View>)}
            </SurfaceCard>
            </FadeIn>
          ))}
          <SurfaceCard tone="strong" style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}><MaterialIcons name="support-agent" size={20} color={theme.colors.primary} /></View>
              <View style={styles.contactCopy}><CustomText variant="label">Questions about this document?</CustomText><CustomText variant="caption" style={styles.contactBody}>Contact the policy team and keep a record in your email.</CustomText></View>
            </View>
            <AppButton title={`Email ${query.data.contactEmail}`} variant="gradient" size="lg" fullWidth onPress={() => void openExternalUrl(`mailto:${query.data.contactEmail}`)} />
          </SurfaceCard>
        </>
      )}
    </PremiumPage>
  );
}
