import { Router } from 'express';
import { env } from '../../config/env';

export const legalRouter = Router();
const supportEmail = env.EMAIL_SUPPORT_EMAIL || 'support@claudygod.org';

export type LegalDocument = {
  id: 'privacy' | 'terms'; title: string; summary: string; version: string;
  effectiveDate: string; contactEmail: string;
  sections: { title: string; paragraphs: string[]; bullets?: string[] }[];
};

const documents: Record<LegalDocument['id'], LegalDocument> = {
  privacy: {
    id: 'privacy', title: 'Privacy Policy', version: '2026.07.06', effectiveDate: '2026-07-06', contactEmail: supportEmail,
    summary: 'How ClaudyGod collects, uses, protects, and gives you control over personal information.',
    sections: [
      { title: 'Information we collect', paragraphs: ['We collect only the information required to provide and improve the service.'], bullets: [
        'Account information: email address, display name, securely hashed credentials, or basic profile details from an approved sign-in provider.',
        'Device and usage data: app version, notification tokens, and engagement events needed for playback, library synchronization, and recommendations.',
        'Camera, microphone, and photo access: requested only when you intentionally use a feature that requires it; nothing is captured in the background.',
        'Donation records: payment providers process payment details directly. We retain the resulting intent, status, or receipt record and never full card numbers.',
      ] },
      { title: 'How we use information', paragraphs: ['We use information to authenticate accounts, deliver content and live sessions, synchronize your library and preferences, send alerts you enable, respond to support, secure the platform, and improve the service. We do not sell personal information.'] },
      { title: 'Service providers', paragraphs: ['Contracted infrastructure, database, storage, email, observability, and payment providers process limited data on our behalf. Public ministry content is distributed publicly as intended.'] },
      { title: 'Your controls', paragraphs: ['Authenticated users can request an export or account deletion and reset recommendation history from Settings → Privacy. You may also contact the privacy team. Some records may be retained where required for security, fraud prevention, financial reporting, or law.'] },
      { title: 'Children’s privacy', paragraphs: ['ClaudyGod is not directed to children under 13, and we do not knowingly collect personal information from children under 13.'] },
      { title: 'Changes', paragraphs: ['Material changes update the version and effective date shown here and, where appropriate, are communicated in the app.'] },
    ],
  },
  terms: {
    id: 'terms', title: 'Terms of Service', version: '2026.07.06', effectiveDate: '2026-07-06', contactEmail: supportEmail,
    summary: 'The rules and responsibilities that apply when you use ClaudyGod.',
    sections: [
      { title: 'Using ClaudyGod', paragraphs: ['ClaudyGod provides worship music, video, live, and ministry content for personal, non-commercial use. Use only intended features and do not bypass authorization, upload controls, or platform security.'] },
      { title: 'Accounts', paragraphs: ['You are responsible for accurate account information and secure credentials. End-user accounts support browsing, engagement, saved libraries, giving requests, and settings. Only authorized administrators may publish or modify catalog content.'] },
      { title: 'Content and acceptable use', paragraphs: ['You may not redistribute, resell, scrape, unlawfully copy, interfere with, or misuse the service or its content. Rights not expressly granted remain with their respective owners.'] },
      { title: 'Giving', paragraphs: ['The app may create a giving intent and return an approved completion route. A request is not a completed payment. Any completed transaction is processed by the identified provider and is non-refundable except where law or provider terms require otherwise.'] },
      { title: 'Availability', paragraphs: ['We work to provide a reliable service but cannot guarantee uninterrupted availability. Live, media, notification, and payment features may depend on contracted third-party infrastructure.'] },
      { title: 'Suspension and termination', paragraphs: ['We may restrict access when reasonably necessary to protect users or the platform, comply with law, investigate misuse, or enforce these terms.'] },
      { title: 'Contact', paragraphs: [`Questions about these terms can be sent to ${supportEmail}.`] },
    ],
  },
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!);
const renderDocument = (document: LegalDocument): string => {
  const sections = document.sections.map((section) => `<h2>${escapeHtml(section.title)}</h2>${section.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}${section.bullets ? `<ul>${section.bullets.map((text) => `<li>${escapeHtml(text)}</li>`).join('')}</ul>` : ''}`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="index,follow"/><title>${escapeHtml(document.title)} — ClaudyGod</title><style>:root{color-scheme:light dark}body{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;max-width:720px;margin:0 auto;padding:48px 24px 96px;line-height:1.65;color:#211f1a;background:#f7f4ef}h1{font-size:28px;margin-bottom:4px}h2{font-size:19px;margin-top:36px}p,li{font-size:15px}.meta{color:#6b6558;font-size:13px;margin-bottom:32px}a{color:#6d4aff}@media(prefers-color-scheme:dark){body{color:#f3efe7;background:#15130f}a{color:#b9a6ff}}</style></head><body><h1>${escapeHtml(document.title)}</h1><p class="meta">Effective ${escapeHtml(document.effectiveDate)} · Version ${escapeHtml(document.version)}</p><p>${escapeHtml(document.summary)}</p>${sections}</body></html>`;
};

legalRouter.get('/v1/mobile/legal/:documentId', (req, res) => {
  const document = documents[req.params.documentId as LegalDocument['id']];
  if (!document) return res.status(404).json({ error: { code: 'LEGAL_DOCUMENT_NOT_FOUND', message: 'Legal document not found' } });
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
  return res.status(200).json({ document });
});

legalRouter.get('/legal/:documentId', (req, res) => {
  const document = documents[req.params.documentId as LegalDocument['id']];
  if (!document) return res.status(404).type('text').send('Legal document not found');
  return res.status(200).type('html').send(renderDocument(document));
});
