// lib/emailValidator.ts
/**
 * Email Domain Validation Service
 * Validates email postfix (domain) with configurable allowed/blocked domains
 */

export interface EmailValidationConfig {
  // Whitelist of allowed domains (if empty, all are allowed except blacklisted)
  allowedDomains?: string[];
  
  // Blacklist of blocked domains
  blockedDomains?: string[];
  
  // Min/max length validation
  minLength?: number;
  maxLength?: number;
  
  // Enable disposable email detection
  checkDisposable?: boolean;
  
  // Require minimum TLD length (2 for .co, 3 for .com, etc.)
  minTldLength?: number;
}

/**
 * Common disposable/temporary email domains
 * This list should be regularly updated
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  'throwaway.email',
  'temp-mail.org',
  '33mail.com',
  'yopmail.com',
  'maildrop.cc',
  'sharklasers.com',
]);

/**
 * Common invalid/example domains
 */
const BLOCKED_DOMAINS = new Set([
  'example.com',
  'test.com',
  'localhost',
  'invalid.com',
  'placeholder.com',
]);

/**
 * Email Validator Class
 */
export class EmailValidator {
  private allowedDomains: Set<string>;
  private blockedDomains: Set<string>;
  private minLength: number;
  private maxLength: number;
  private checkDisposable: boolean;
  private minTldLength: number;

  constructor(config: EmailValidationConfig = {}) {
    this.allowedDomains = new Set(config.allowedDomains || []);
    this.blockedDomains = new Set([
      ...BLOCKED_DOMAINS,
      ...(config.blockedDomains || []),
    ]);
    this.minLength = config.minLength || 3;
    this.maxLength = config.maxLength || 254;
    this.checkDisposable = config.checkDisposable !== false;
    this.minTldLength = config.minTldLength || 2;
  }

  /**
   * Validate email format and domain
   */
  validate(email: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Trim and normalize
    const normalizedEmail = email.trim().toLowerCase();

    // Check length
    if (normalizedEmail.length < this.minLength) {
      errors.push(`Email must be at least ${this.minLength} characters long`);
    }

    if (normalizedEmail.length > this.maxLength) {
      errors.push(`Email must not exceed ${this.maxLength} characters`);
    }

    // RFC 5322 simplified email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      errors.push('Invalid email format');
      return { isValid: false, errors };
    }

    // Split into local and domain parts
    const [localPart, domain] = normalizedEmail.split('@');

    // Validate local part (before @)
    if (!localPart || localPart.length === 0) {
      errors.push('Email local part (before @) cannot be empty');
    }

    if (localPart && localPart.startsWith('.')) {
      errors.push('Email local part cannot start with a dot');
    }

    if (localPart && localPart.endsWith('.')) {
      errors.push('Email local part cannot end with a dot');
    }

    if (localPart && localPart.includes('..')) {
      errors.push('Email local part cannot contain consecutive dots');
    }

    // Validate domain part
    if (!domain) {
      errors.push('Email domain is missing');
      return { isValid: false, errors };
    }

    // Check domain format
    const domainErrors = this.validateDomain(domain);
    errors.push(...domainErrors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate domain (postfix) portion of email
   */
  private validateDomain(domain: string): string[] {
    const errors: string[] = [];

    // Check against blocked domains
    if (this.blockedDomains.has(domain)) {
      errors.push(`Email domain "${domain}" is not allowed`);
    }

    // Check against allowed domains (if whitelist is set)
    if (this.allowedDomains.size > 0 && !this.allowedDomains.has(domain)) {
      errors.push(`Email domain "${domain}" is not in the list of allowed domains`);
    }

    // Check against disposable email domains
    if (this.checkDisposable && DISPOSABLE_DOMAINS.has(domain)) {
      errors.push('Disposable email addresses are not allowed. Please use your personal or work email.');
    }

    // Validate domain structure
    const domainParts = domain.split('.');
    
    if (domainParts.length < 2) {
      errors.push('Email domain must contain at least one dot (e.g., example.com)');
    }

    // Check TLD (last part)
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < this.minTldLength) {
      errors.push(`TLD must be at least ${this.minTldLength} characters long`);
    }

    // Check for invalid characters in domain
    if (!/^[a-z0-9.-]+$/.test(domain)) {
      errors.push('Email domain contains invalid characters');
    }

    // Check for consecutive dots
    if (domain.includes('..')) {
      errors.push('Email domain cannot contain consecutive dots');
    }

    // Check for leading/trailing dots
    if (domain.startsWith('.') || domain.endsWith('.')) {
      errors.push('Email domain cannot start or end with a dot');
    }

    return errors;
  }

  /**
   * Get email domain (postfix)
   */
  static getDomain(email: string): string {
    const normalized = email.toLowerCase().trim();
    const parts = normalized.split('@');
    return parts.length === 2 ? parts[1] : '';
  }

  /**
   * Check if domain is corporate/business domain
   * (typically has more than 2 parts: dept.company.com)
   */
  static isCorporateDomain(domain: string): boolean {
    const parts = domain.split('.');
    return parts.length >= 3;
  }

  /**
   * Get domain registrar/hosting info (optional - for future enhancement)
   * Could integrate with WHOIS API or DNS checking service
   */
  static async verifyDomainExists(domain: string): Promise<boolean> {
    // TODO: Implement DNS MX record checking
    // This would verify the domain actually has mail servers configured
    return true; // Placeholder
  }
}

/**
 * Corporate Email Validator Configuration
 * Stricter validation for business applications
 */
export const corporateEmailValidator = new EmailValidator({
  blockedDomains: [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
  ],
  checkDisposable: true,
  minTldLength: 2,
});

/**
 * Standard Email Validator Configuration
 * General purpose validator (allows most emails except disposable)
 */
export const standardEmailValidator = new EmailValidator({
  checkDisposable: true,
  minTldLength: 2,
});

/**
 * Permissive Email Validator Configuration
 * Minimal restrictions (for public registrations)
 */
export const permissiveEmailValidator = new EmailValidator({
  checkDisposable: false,
  minTldLength: 2,
});
