// config/emailConfig.ts
/**
 * Email Configuration Service
 * Centralized configuration for email settings - no hardcoding
 * This is dynamically loaded from environment variables or remote config
 */

export interface EmailConfig {
  // SMTP Configuration
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      password: string;
    };
  };
  
  // Email Settings
  from: {
    name: string;
    email: string;
  };
  
  // Reply-to Configuration
  replyTo?: string;
  
  // Team Email for Support
  support: {
    name: string;
    email: string;
  };
  
  // Template Configuration
  templates: {
    verificationEmail: {
      subject: string;
      from?: string;
    };
    passwordReset: {
      subject: string;
      from?: string;
    };
    welcomeEmail: {
      subject: string;
      from?: string;
    };
  };
}

/**
 * Default Email Configuration
 * Override with environment variables:
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_SECURE
 * - SMTP_USER
 * - SMTP_PASSWORD
 * - EMAIL_FROM_NAME
 * - EMAIL_FROM_ADDRESS
 * - EMAIL_REPLY_TO
 * - SUPPORT_EMAIL_NAME
 * - SUPPORT_EMAIL_ADDRESS
 */
export const emailConfig: EmailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
    },
  },
  
  from: {
    name: process.env.EMAIL_FROM_NAME || 'ClaudyGod',
    email: process.env.EMAIL_FROM_ADDRESS || 'noreply@claudygod.com',
  },
  
  replyTo: process.env.EMAIL_REPLY_TO || 'support@claudygod.com',
  
  support: {
    name: process.env.SUPPORT_EMAIL_NAME || 'ClaudyGod Support Team',
    email: process.env.SUPPORT_EMAIL_ADDRESS || 'support@claudygod.com',
  },
  
  templates: {
    verificationEmail: {
      subject: 'Verify Your Email - ClaudyGod',
      from: process.env.EMAIL_FROM_ADDRESS,
    },
    passwordReset: {
      subject: 'Reset Your Password - ClaudyGod',
      from: process.env.EMAIL_FROM_ADDRESS,
    },
    welcomeEmail: {
      subject: 'Welcome to ClaudyGod!',
      from: process.env.EMAIL_FROM_ADDRESS,
    },
  },
};

/**
 * Validate email configuration
 */
export function validateEmailConfig(): string[] {
  const errors: string[] = [];

  if (!emailConfig.smtp.host) {
    errors.push('SMTP_HOST environment variable is required');
  }

  if (!emailConfig.smtp.auth.user) {
    errors.push('SMTP_USER environment variable is required');
  }

  if (!emailConfig.smtp.auth.password) {
    errors.push('SMTP_PASSWORD environment variable is required');
  }

  if (!emailConfig.from.email) {
    errors.push('EMAIL_FROM_ADDRESS environment variable is required');
  }

  if (!emailConfig.support.email) {
    errors.push('SUPPORT_EMAIL_ADDRESS environment variable is required');
  }

  return errors;
}

/**
 * Get email configuration (with validation)
 */
export function getEmailConfig(): EmailConfig {
  const errors = validateEmailConfig();
  
  if (errors.length > 0) {
    console.error('Email configuration errors:', errors);
    throw new Error(
      `Invalid email configuration:\n${errors.join('\n')}\n\n` +
      'Please ensure all required environment variables are set in .env or your deployment configuration.'
    );
  }

  return emailConfig;
}
