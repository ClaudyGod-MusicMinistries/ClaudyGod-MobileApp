import nodemailer from 'nodemailer';
import { env } from '../config/env';

export interface EmailMessageInput {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

const transport = env.SMTP_ENABLED
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export const sendEmail = async (message: EmailMessageInput): Promise<void> => {
  await transport.sendMail({
    from: env.MAIL_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};
