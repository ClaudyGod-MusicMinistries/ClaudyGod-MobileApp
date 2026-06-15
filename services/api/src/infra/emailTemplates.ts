import { env } from '../config/env';

export interface RenderedEmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeUrl = (value: string): string => value.trim();

const brandName = env.EMAIL_BRAND_NAME;
const brandProductName = `${brandName} Music`;
const brandedTemplateMarker = 'data-claudygod-email="v2"';
const logoCid = 'claudygod-logo';
const logoUrl = typeof env.EMAIL_LOGO_URL === 'string' ? env.EMAIL_LOGO_URL.trim() : '';
const supportEmail =
  env.EMAIL_SUPPORT_EMAIL ||
  env.ADMIN_ALERT_EMAILS_LIST[0] ||
  env.MAIL_FROM.match(/<([^>]+)>/)?.[1] ||
  '';
const supportUrl = env.EMAIL_SUPPORT_URL.trim();

const supportFooter = supportEmail
  ? `Need help? Reply to this email or reach us at ${supportEmail}.`
  : 'Need help? Reply to this email and our team will assist you.';

const socialLinks = [
  { label: 'Facebook', icon: 'f', url: env.EMAIL_FACEBOOK_URL },
  { label: 'X', icon: 'X', url: env.EMAIL_X_URL },
  { label: 'Instagram', icon: '◎', url: env.EMAIL_INSTAGRAM_URL },
  { label: 'YouTube', icon: '▶', url: env.EMAIL_YOUTUBE_URL },
].filter((item): item is { label: string; icon: string; url: string } => Boolean(item.url?.trim()));

export const isBrandedEmailHtml = (html: string): boolean =>
  html.includes(brandedTemplateMarker);

const renderLogo = (): string =>
  `<img src="${escapeHtml(logoUrl ? normalizeUrl(logoUrl) : `cid:${logoCid}`)}" width="54" height="54" alt="${escapeHtml(
        brandName,
      )}" style="display:block;width:54px;height:54px;border-radius:999px;object-fit:cover;border:2px solid rgba(255,255,255,0.42);background:#ffffff;" />`;

const renderSocialLinks = (): string => {
  if (socialLinks.length === 0) {
    return '';
  }

  return `<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:18px;">
    <tr>
      ${socialLinks
        .map(
          (item) => `<td style="padding-right:8px;">
            <a href="${escapeHtml(normalizeUrl(item.url))}" aria-label="${escapeHtml(item.label)}" style="display:inline-block;width:30px;height:30px;border-radius:999px;background:#111827;color:#ffffff;text-align:center;line-height:30px;font-size:13px;font-weight:800;text-decoration:none;">${escapeHtml(item.icon)}</a>
          </td>`,
        )
        .join('')}
    </tr>
  </table>`;
};

const renderShell = (input: {
  preview: string;
  eyebrow: string;
  title: string;
  greeting: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  asideHtml?: string;
  footerNote?: string;
}): string => {
  const ctaBlock =
    input.ctaLabel && input.ctaUrl
      ? `
        <tr>
          <td style="padding: 0 32px 28px 32px;">
            <a href="${escapeHtml(normalizeUrl(input.ctaUrl))}" style="display: inline-block; border-radius: 999px; background: #6d4aff; color: #ffffff; text-decoration: none; font-weight: 700; padding: 13px 24px; box-shadow: 0 10px 24px rgba(109,74,255,0.24);">
              ${escapeHtml(input.ctaLabel)}
            </a>
          </td>
        </tr>
      `
      : '';

  const asideBlock = input.asideHtml
    ? `
        <tr>
          <td style="padding: 0 32px 28px 32px;">
            <div style="border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px 20px; background: #f9fafb; color: #111827;">
              ${input.asideHtml}
            </div>
          </td>
        </tr>
      `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin: 0; padding: 28px 12px; background: #f3f4f6; color: #111827; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
      ${escapeHtml(input.preview)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" ${brandedTemplateMarker} style="border-collapse: collapse; max-width: 660px; background: #ffffff; border-radius: 22px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 22px 70px rgba(17,24,39,0.12);">
            <tr>
              <td style="padding: 28px 34px 0 34px; background: #08040f; color: #ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td width="66" style="width:66px;vertical-align:middle;">${renderLogo()}</td>
                    <td style="vertical-align:middle;">
                      <div style="font-size: 21px; line-height: 1.15; font-weight: 800; color: #ffffff;">${escapeHtml(
                        brandProductName,
                      )}</div>
                      <div style="font-size: 11px; line-height: 1.4; letter-spacing: 0.17em; text-transform: uppercase; color: rgba(255,255,255,0.68); margin-top: 5px;">${escapeHtml(
                        input.eyebrow,
                      )}</div>
                    </td>
                  </tr>
                </table>
                <div style="height:1px;background:#ffffff;opacity:0.32;margin-top:24px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 34px 12px 34px;">
                <div style="font-size: 16px; line-height: 1.55; color: #4b5563;">${escapeHtml(input.greeting)}</div>
                <h1 style="margin: 12px 0 0 0; font-size: 28px; line-height: 1.2; color: #111827; font-weight: 800;">${escapeHtml(
                  input.title,
                )}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 34px 28px 34px; font-size: 15px; line-height: 1.75; color: #374151;">
                ${input.bodyHtml}
              </td>
            </tr>
            ${ctaBlock}
            ${asideBlock}
            <tr>
              <td style="padding: 0 34px 30px 34px;">
                <div style="height:1px;background:#e5e7eb;margin-bottom:20px;"></div>
                <div style="font-size: 13px; line-height: 1.65; color: #6b7280;">
                  <strong style="color:#111827;">${escapeHtml(brandProductName)}</strong><br />
                  ${escapeHtml(input.footerNote || supportFooter)}
                  ${
                    supportUrl
                      ? `<br /><a href="${escapeHtml(normalizeUrl(supportUrl))}" style="color:#6d4aff;text-decoration:none;font-weight:700;">Visit support</a>`
                      : ''
                  }
                </div>
                ${renderSocialLinks()}
                <div style="font-size: 11px; line-height: 1.55; color: #9ca3af; margin-top: 14px;">
                  This message was sent by ${escapeHtml(brandProductName)} for account, content, or notification activity. Keep codes private and never share them with anyone.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const buildGenericEmailTemplate = (input: {
  subject: string;
  preview?: string;
  eyebrow?: string;
  title?: string;
  greeting?: string;
  bodyHtml: string;
  footerNote?: string;
}): RenderedEmailTemplate => ({
  subject: input.subject,
  text: '',
  html: renderShell({
    preview: input.preview ?? input.subject,
    eyebrow: input.eyebrow ?? 'Notification',
    title: input.title ?? input.subject,
    greeting: input.greeting ?? `Hello,`,
    bodyHtml: input.bodyHtml,
    footerNote: input.footerNote,
  }),
});

const toTextBlock = (lines: Array<string | undefined>): string =>
  lines.filter((line) => typeof line === 'string' && line.length > 0).join('\n');

export const buildVerifyEmailTemplate = (input: {
  displayName: string;
  verifyUrl?: string;
  verificationCode?: string;
  expiresInMinutes: number;
}): RenderedEmailTemplate => {
  const subject = `Verify your ${brandName} account`;
  const textVerificationLine = input.verificationCode
    ? `Enter this 6-digit verification code: ${input.verificationCode}`
    : input.verifyUrl
      ? 'Verify your account using the secure link we provided.'
      : '';
  const text = toTextBlock([
    `Hi ${input.displayName},`,
    '',
    `Welcome to ${brandName}. Please verify your email address to activate your account.`,
    textVerificationLine,
    '',
    `This verification expires in ${input.expiresInMinutes} minutes.`,
    supportFooter,
  ]);
  const ctaLabel = input.verificationCode ? 'Open verification page' : 'Verify email';
  const codeAside = input.verificationCode
    ? `<div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin-bottom: 10px;">Verification code</div>
       <div style="font-size: 30px; line-height: 1; letter-spacing: 0.26em; font-weight: 700; color: #0f172a;">${escapeHtml(
         input.verificationCode,
       )}</div>`
    : '';
  const html = renderShell({
    preview: `Verify your email to activate your ${brandName} account.`,
    eyebrow: 'Account Security',
    title: 'Verify your email address',
    greeting: `Hi ${input.displayName},`,
    bodyHtml: `<p style="margin: 0 0 16px 0;">Welcome to ${escapeHtml(
      brandName,
    )}. Confirm your email address to activate your account and complete sign in.</p>
    <p style="margin: 0;">${
      input.verificationCode
        ? 'Enter the 6-digit code below in the app to finish creating your account.'
        : 'Use the secure verification link below to continue.'
    }</p>
    <p style="margin: 16px 0 0 0;">This verification expires in ${escapeHtml(String(
      input.expiresInMinutes,
    ))} minutes.</p>`,
    ctaLabel: input.verifyUrl ? ctaLabel : undefined,
    ctaUrl: input.verifyUrl,
    asideHtml: codeAside || undefined,
  });
  return { subject, text, html };
};

export const buildWelcomeEmailTemplate = (input: {
  displayName: string;
  signInUrl: string;
}): RenderedEmailTemplate => {
  const subject = `Welcome to ${brandName}`;
  const text = toTextBlock([
    `Hi ${input.displayName},`,
    '',
    `Welcome to ${brandName}. Your account is ready.`,
    `Sign in: ${input.signInUrl}`,
    '',
    'You can now explore content, follow live sessions, and save favorites.',
    supportFooter,
  ]);
  const html = renderShell({
    preview: `Your ${brandName} account is ready to use.`,
    eyebrow: 'Welcome',
    title: 'Your account is ready',
    greeting: `Hi ${input.displayName},`,
    bodyHtml: `<p style="margin: 0 0 16px 0;">Your ${escapeHtml(
      brandName,
    )} account is active. You can now sign in and continue your experience.</p>
    <p style="margin: 0;">Use the secure sign-in button below on any device.</p>`,
    ctaLabel: 'Sign in securely',
    ctaUrl: input.signInUrl,
  });
  return { subject, text, html };
};

export const buildPasswordResetTemplate = (input: {
  displayName: string;
  resetUrl?: string;
  resetCode?: string;
  expiresInMinutes: number;
}): RenderedEmailTemplate => {
  const subject = `Reset your ${brandName} password`;
  const textResetLine = input.resetCode
    ? `Enter this 6-digit recovery code: ${input.resetCode}`
    : input.resetUrl
      ? 'Reset your password using the secure link we provided.'
      : '';
  const text = toTextBlock([
    `Hi ${input.displayName},`,
    '',
    'We received a request to reset your password.',
    textResetLine,
    '',
    `This password recovery step expires in ${input.expiresInMinutes} minutes.`,
    'If you did not request this, you can ignore this email and your password will remain unchanged.',
    supportFooter,
  ]);
  const codeAside = input.resetCode
    ? `<div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin-bottom: 10px;">Recovery code</div>
       <div style="font-size: 30px; line-height: 1; letter-spacing: 0.26em; font-weight: 700; color: #0f172a;">${escapeHtml(
         input.resetCode,
       )}</div>`
    : '';
  const html = renderShell({
    preview: `Reset your ${brandName} password.`,
    eyebrow: 'Password Reset',
    title: 'Reset your password',
    greeting: `Hi ${input.displayName},`,
    bodyHtml: `<p style="margin: 0 0 16px 0;">We received a password reset request for your ${escapeHtml(
      brandName,
    )} account.</p>
    <p style="margin: 0;">${
      input.resetCode
        ? 'Enter the 6-digit recovery code below in the app to choose a new password.'
        : 'Use the secure link below to choose a new password.'
    }</p>
    <p style="margin: 16px 0 0 0;">This recovery step expires in ${escapeHtml(String(
      input.expiresInMinutes,
    ))} minutes. If you did not request a password reset, you can ignore this email.</p>`,
    ctaLabel: input.resetUrl ? (input.resetCode ? 'Open recovery page' : 'Reset password') : undefined,
    ctaUrl: input.resetUrl,
    asideHtml: codeAside || undefined,
  });
  return { subject, text, html };
};

export const buildProfileUpdatedTemplate = (input: {
  displayName: string;
  reviewUrl: string;
  changedFields: string[];
}): RenderedEmailTemplate => {
  const changedFieldText = input.changedFields.length > 0 ? input.changedFields.join(', ') : 'profile details';
  const changedFieldHtml =
    input.changedFields.length > 0
      ? `<ul style="margin: 12px 0 0 18px; padding: 0;">${input.changedFields
          .map((field) => `<li style="margin-bottom: 8px;">${escapeHtml(field)}</li>`)
          .join('')}</ul>`
      : '<p style="margin: 12px 0 0 0;">Profile details were updated.</p>';
  const subject = `Your ${brandName} account details were updated`;
  const text = toTextBlock([
    `Hi ${input.displayName},`,
    '',
    `The following account details were updated: ${changedFieldText}.`,
    `Review your account: ${input.reviewUrl}`,
    '',
    'If you did not make this change, sign in immediately and reset your password.',
    supportFooter,
  ]);
  const html = renderShell({
    preview: `Your ${brandName} account details were updated.`,
    eyebrow: 'Security Notice',
    title: 'Your account details changed',
    greeting: `Hi ${input.displayName},`,
    bodyHtml: `<p style="margin: 0 0 12px 0;">We detected a profile update on your ${escapeHtml(
      brandName,
    )} account.</p>${changedFieldHtml}
    <p style="margin: 16px 0 0 0;">If you did not make this change, review your account immediately and reset your password.</p>`,
    ctaLabel: 'Review account',
    ctaUrl: input.reviewUrl,
  });
  return { subject, text, html };
};

export const buildAccountEmailChangeTemplate = (input: {
  displayName: string;
  currentEmail: string;
  newEmail: string;
  confirmUrl: string;
  expiresInMinutes: number;
}): RenderedEmailTemplate => {
  const subject = `Confirm your ${brandName} email change`;
  const text = toTextBlock([
    `Hi ${input.displayName},`,
    '',
    `We received a request to change your account email from ${input.currentEmail} to ${input.newEmail}.`,
    `Confirm the change: ${input.confirmUrl}`,
    '',
    `This secure confirmation expires in ${input.expiresInMinutes} minutes.`,
    'If you did not request this, ignore this email and update your password immediately.',
    supportFooter,
  ]);
  const html = renderShell({
    preview: `Confirm your ${brandName} email change.`,
    eyebrow: 'Account Security',
    title: 'Confirm your email change',
    greeting: `Hi ${input.displayName},`,
    bodyHtml: `<p style="margin: 0 0 14px 0;">We received a request to change the email address on your ${escapeHtml(
      brandName,
    )} account.</p>
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;background:#f9fafb;margin:0 0 16px 0;">
      <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Requested change</div>
      <div style="font-size:14px;color:#111827;line-height:1.7;">Current email: <strong>${escapeHtml(
        input.currentEmail,
      )}</strong><br />New email: <strong>${escapeHtml(input.newEmail)}</strong></div>
    </div>
    <p style="margin: 0;">Confirm only if you started this request. This link expires in ${escapeHtml(String(
      input.expiresInMinutes,
    ))} minutes. If you did not request it, ignore this email and reset your password.</p>`,
    ctaLabel: 'Confirm email change',
    ctaUrl: input.confirmUrl,
  });
  return { subject, text, html };
};

export const buildAdminInviteTemplate = (input: {
  inviterName: string;
  role: string;
  acceptUrl: string;
  expiresInHours: number;
}): RenderedEmailTemplate => {
  const roleLabel = input.role === 'SUPER_ADMIN' ? 'Super Admin'
    : input.role === 'ADMIN' ? 'Administrator'
    : input.role === 'MODERATOR' ? 'Moderator'
    : input.role === 'CREATOR' ? 'Creator'
    : input.role;
  const subject = `You're invited to join ${brandName} Admin`;
  const text = toTextBlock([
    `You have been invited by ${input.inviterName} to join the ${brandName} Admin team as ${roleLabel}.`,
    '',
    `Accept your invitation: ${input.acceptUrl}`,
    '',
    `This invitation expires in ${input.expiresInHours} hours.`,
    'If you were not expecting this invitation, you can safely ignore this email.',
    supportFooter,
  ]);
  const html = renderShell({
    preview: `${input.inviterName} invited you to join ${brandName} Admin.`,
    eyebrow: 'Team Invitation',
    title: `You're invited to ${brandName} Admin`,
    greeting: `Hello,`,
    bodyHtml: `<p style="margin: 0 0 14px 0;"><strong>${escapeHtml(input.inviterName)}</strong> has invited you to join the
    ${escapeHtml(brandName)} admin team.</p>
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;background:#f9fafb;margin:0 0 16px 0;">
      <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Your role</div>
      <div style="font-size:15px;color:#111827;font-weight:600;">${escapeHtml(roleLabel)}</div>
    </div>
    <p style="margin: 0 0 6px 0;">Click the button below to set up your account. This invitation expires in <strong>${escapeHtml(
      String(input.expiresInHours),
    )} hours</strong>.</p>
    <p style="margin: 0;">If you were not expecting this, you can safely ignore this email.</p>`,
    ctaLabel: 'Accept Invitation',
    ctaUrl: input.acceptUrl,
  });
  return { subject, text, html };
};
