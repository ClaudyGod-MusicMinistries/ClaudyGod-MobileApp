import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from './logger.js';

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

const transport = config.email.smtp.enabled
  ? nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: config.email.smtp.user && config.email.smtp.pass
        ? {
            user: config.email.smtp.user,
            pass: config.email.smtp.pass,
          }
        : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

if (!config.email.smtp.enabled) {
  logger.warn('SMTP is not configured; using JSON transport for email jobs');
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const info = await transport.sendMail({
    from: config.email.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  logger.info(
    {
      messageId: info.messageId,
      envelope: info.envelope,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    },
    'Email job processed',
  );
}
