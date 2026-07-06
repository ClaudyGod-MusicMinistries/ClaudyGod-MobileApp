import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

export interface EmailMessageInput {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSendResult {
  messageId?: string;
}

export interface EmailTransportVerification {
  enabled: boolean;
  reachable: boolean;
  reason?: string;
}

const resolveSmtpHost = (): string => {
  if (env.SMTP_HOST) {
    return env.SMTP_HOST;
  }

  if (env.SMTP_PROVIDER === 'brevo') {
    return 'smtp-relay.brevo.com';
  }

  return '';
};

const smtpHost = resolveSmtpHost();
const smtpAuth =
  env.SMTP_USER && env.SMTP_PASS
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      }
    : env.SMTP_PROVIDER === 'brevo' && env.POSTFIX_SMTP_USERNAME && env.POSTFIX_SMTP_PASSWORD
      ? {
          user: env.POSTFIX_SMTP_USERNAME,
          pass: env.POSTFIX_SMTP_PASSWORD,
        }
      : undefined;

const smtpOptions = {
  host: smtpHost,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  pool: env.SMTP_POOL,
  maxConnections: env.SMTP_MAX_CONNECTIONS,
  maxMessages: env.SMTP_MAX_MESSAGES,
  connectionTimeout: env.SMTP_CONNECTION_TIMEOUT_MS,
  greetingTimeout: env.SMTP_GREETING_TIMEOUT_MS,
  requireTLS: env.SMTP_REQUIRE_TLS,
  auth: smtpAuth,
  tls: {
    rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED,
  },
};

const transport = env.SMTP_ENABLED && smtpHost
  ? nodemailer.createTransport(smtpOptions)
  : nodemailer.createTransport({ jsonTransport: true });

const LOGO_CID = 'claudygod-logo';

const resolveLogoAssetPath = (): string | null => {
  const candidates = [
    path.resolve(process.cwd(), 'assets/ClaudyGoLogo.png'),
    path.resolve(process.cwd(), 'src/assets/ClaudyGoLogo.png'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
};

const logoAssetPath = resolveLogoAssetPath();

export const emailTransportInfo = {
  enabled: env.SMTP_ENABLED && Boolean(smtpHost),
  provider: env.SMTP_PROVIDER,
  providerLabel: env.SMTP_PROVIDER_LABEL,
  host: smtpHost,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  pooled: env.SMTP_POOL,
};

export const verifyEmailTransport = async (): Promise<EmailTransportVerification> => {
  if (!emailTransportInfo.enabled) {
    return {
      enabled: false,
      reachable: false,
      reason: 'SMTP delivery is disabled in the current environment',
    };
  }

  try {
    await transport.verify();
    return {
      enabled: true,
      reachable: true,
    };
  } catch (error) {
    return {
      enabled: true,
      reachable: false,
      reason: error instanceof Error ? error.message : 'Unknown SMTP verification error',
    };
  }
};

export const sendEmail = async (message: EmailMessageInput): Promise<EmailSendResult> => {
  const info = await transport.sendMail({
    from: env.MAIL_FROM,
    replyTo: env.MAIL_REPLY_TO || undefined,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments:
      message.html?.includes(`cid:${LOGO_CID}`) && logoAssetPath
        ? [
            {
              filename: 'ClaudyGoLogo.png',
              path: logoAssetPath,
              cid: LOGO_CID,
              contentType: 'image/png',
            },
          ]
        : undefined,
  });

  return {
    messageId: info.messageId,
  };
};
