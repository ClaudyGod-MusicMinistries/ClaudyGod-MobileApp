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
const supportEmail =
  env.EMAIL_SUPPORT_EMAIL ||
  env.ADMIN_ALERT_EMAILS_LIST[0] ||
  env.MAIL_FROM.match(/<([^>]+)>/)?.[1] ||
  '';

const supportFooter = supportEmail
  ? `Need help? Reply to this email or contact ${supportEmail}.`
  : 'Need help? Reply to this email and our team will assist you.';

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
            <a href="${escapeHtml(normalizeUrl(input.ctaUrl))}" style="display: inline-block; border-radius: 999px; background: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; padding: 14px 22px;">
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
            <div style="border: 1px solid #dbe4f0; border-radius: 18px; padding: 18px 20px; background: #f8fafc; color: #334155;">
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
  <body style="margin: 0; padding: 24px 12px; background: #eef2ff; color: #0f172a; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
      ${escapeHtml(input.preview)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; max-width: 640px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 48px rgba(15, 23, 42, 0.12);">
            <tr>
              <td style="padding: 28px 32px 20px 32px; background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%); color: #ffffff;">
                <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.78;">${escapeHtml(
                  input.eyebrow,
                )}</div>
                <div style="font-size: 28px; line-height: 1.2; font-weight: 700; margin-top: 10px;">${escapeHtml(
                  brandName,
                )}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 32px 12px 32px;">
                <div style="font-size: 18px; line-height: 1.6; color: #0f172a;">${escapeHtml(input.greeting)}</div>
                <h1 style="margin: 14px 0 0 0; font-size: 30px; line-height: 1.2; color: #0f172a;">${escapeHtml(
                  input.title,
                )}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 28px 32px; font-size: 16px; line-height: 1.7; color: #334155;">
                ${input.bodyHtml}
              </td>
            </tr>
            ${ctaBlock}
            ${asideBlock}
            <tr>
              <td style="padding: 0 32px 32px 32px; font-size: 13px; line-height: 1.6; color: #64748b;">
                ${escapeHtml(input.footerNote || supportFooter)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

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
      ? `Verify your account: ${input.verifyUrl}`
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
       <div style="font-size: 32px; line-height: 1; letter-spacing: 0.28em; font-weight: 700; color: #0f172a;">${escapeHtml(
         input.verificationCode,
       )}</div>`
    : '';
  const linkAside = input.verifyUrl
    ? `<div style="${input.verificationCode ? 'margin-top: 18px;' : ''}"><strong>Verification link</strong><br /><span style="word-break: break-word;">${escapeHtml(
        input.verifyUrl,
      )}</span></div>`
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
    asideHtml: `${codeAside}${linkAside}` || undefined,
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
    `Your ${brandName} account is ready.`,
    `Sign in here: ${input.signInUrl}`,
    '',
    'You can now explore content, manage your profile, and continue where you left off.',
    supportFooter,
  ]);
  const html = renderShell({
    preview: `Your ${brandName} account is ready to use.`,
    eyebrow: 'Welcome',
    title: 'Your account is ready',
    greeting: `Hi ${input.displayName},`,
    bodyHtml: `<p style="margin: 0 0 16px 0;">Your ${escapeHtml(
      brandName,
    )} account is active and ready. You can now sign in and continue your experience.</p>
    <p style="margin: 0;">If you registered on a new device, use the link below to sign in securely.</p>`,
    ctaLabel: 'Open sign in',
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
      ? `Reset password: ${input.resetUrl}`
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
       <div style="font-size: 32px; line-height: 1; letter-spacing: 0.28em; font-weight: 700; color: #0f172a;">${escapeHtml(
         input.resetCode,
       )}</div>`
    : '';
  const linkAside = input.resetUrl
    ? `<div style="${input.resetCode ? 'margin-top: 18px;' : ''}"><strong>Reset link</strong><br /><span style="word-break: break-word;">${escapeHtml(
        input.resetUrl,
      )}</span></div>`
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
    asideHtml: `${codeAside}${linkAside}` || undefined,
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
