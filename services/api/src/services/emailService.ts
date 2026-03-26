// services/emailService.ts
/**
 * Email Service
 * Handles all email operations (verification, password reset, notifications)
 * Uses Nodemailer for SMTP and supports queue-based processing
 */

import nodemailer from 'nodemailer';
import { emailConfig, getEmailConfig } from '../config/emailConfig';
import { logger } from '../lib/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface TemplateContext {
  [key: string]: any;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  /**
   * Initialize email service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const config = getEmailConfig();

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.auth.user,
          pass: config.smtp.auth.password,
        },
      });

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize email service', { error });
      throw new Error('Email service initialization failed');
    }
  }

  /**
   * Send email
   */
  async send(options: EmailOptions): Promise<{ messageId?: string; error?: string }> {
    if (!this.transporter) {
      await this.initialize();
    }

    try {
      const result = await this.transporter!.sendMail({
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || emailConfig.replyTo,
        cc: options.cc,
        bcc: options.bcc,
      });

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
      });

      return { messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error,
      });

      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, verificationToken: string, verificationUrl: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ClaudyGod!</h2>
        
        <p>Thank you for signing up. Please verify your email address to activate your account.</p>
        
        <p>Click the button below to verify your email:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #A78BFA; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </div>
        
        <p style="font-size: 12px; color: #666;">
          Or copy and paste this link in your browser:<br />
          <code>${verificationUrl}</code>
        </p>
        
        <p style="font-size: 12px; color: #666;">
          This link will expire in 24 hours.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="font-size: 12px; color: #999;">
          If you didn't sign up for this account, please ignore this email.
        </p>
      </div>
    `;

    const textVersion = `
Welcome to ClaudyGod!

Thank you for signing up. Please verify your email address to activate your account.

Click this link to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you didn't sign up for this account, please ignore this email.
    `.trim();

    const result = await this.send({
      to: email,
      subject: emailConfig.templates.verificationEmail.subject,
      html,
      text: textVersion,
    });

    return !result.error;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        
        <p>We received a request to reset your ClaudyGod password.</p>
        
        <p>Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #A78BFA; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 12px; color: #666;">
          Or copy and paste this link in your browser:<br />
          <code>${resetUrl}</code>
        </p>
        
        <p style="font-size: 12px; color: #666;">
          This link will expire in 1 hour.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="font-size: 12px; color: #999;">
          If you didn't request a password reset, please ignore this email or contact our support team.
        </p>
      </div>
    `;

    const textVersion = `
Reset Your Password

We received a request to reset your ClaudyGod password.

Click this link to set a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.
    `.trim();

    const result = await this.send({
      to: email,
      subject: emailConfig.templates.passwordReset.subject,
      html,
      text: textVersion,
    });

    return !result.error;
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ClaudyGod, ${userName}!</h2>
        
        <p>Your account has been successfully created and verified.</p>
        
        <p>You can now:</p>
        <ul>
          <li>Explore all features and content</li>
          <li>Customize your profile and preferences</li>
          <li>Connect with other users</li>
          <li>Access exclusive content</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://claudygod.com'}" 
             style="background-color: #A78BFA; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to ClaudyGod
          </a>
        </div>
        
        <p>If you have any questions, don't hesitate to contact our support team.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="font-size: 12px; color: #999;">
          <strong>${emailConfig.support.name}</strong><br />
          ${emailConfig.support.email}
        </p>
      </div>
    `;

    const textVersion = `
Welcome to ClaudyGod, ${userName}!

Your account has been successfully created and verified.

You can now explore all features and content, customize your profile, connect with other users, and access exclusive content.

Visit ClaudyGod: ${process.env.APP_URL || 'https://claudygod.com'}

If you have any questions, don't hesitate to contact our support team.

${emailConfig.support.name}
${emailConfig.support.email}
    `.trim();

    const result = await this.send({
      to: email,
      subject: emailConfig.templates.welcomeEmail.subject,
      html,
      text: textVersion,
    });

    return !result.error;
  }

  /**
   * Send generic email with custom template
   */
  async sendCustom(options: EmailOptions): Promise<boolean> {
    const result = await this.send(options);
    return !result.error;
  }
}

// Export singleton instance
export const emailService = new EmailService();
