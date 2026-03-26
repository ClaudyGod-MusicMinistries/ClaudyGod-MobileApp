// lib/authValidation.ts
/**
 * Authentication Validation Service
 * Validates user authentication data (email, password, etc.) with configurable rules
 */

import { standardEmailValidator } from './emailValidator';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  specialChars: string;
}

/**
 * Default password policy - NIST recommendations
 */
const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  specialChars: '!@#$%^&*',
};

export class AuthValidator {
  private passwordPolicy: PasswordPolicy;

  constructor(passwordPolicy?: Partial<PasswordPolicy>) {
    this.passwordPolicy = {
      ...DEFAULT_PASSWORD_POLICY,
      ...passwordPolicy,
    };
  }

  /**
   * Validate email with domain (postfix) checking
   */
  validateEmail(email: string): {
    isValid: boolean;
    errors: string[];
  } {
    return standardEmailValidator.validate(email);
  }

  /**
   * Validate password
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    // Check length
    if (password.length < this.passwordPolicy.minLength) {
      errors.push(
        `Password must be at least ${this.passwordPolicy.minLength} characters long`
      );
    }

    // Check for uppercase
    if (
      this.passwordPolicy.requireUppercase &&
      !/[A-Z]/.test(password)
    ) {
      errors.push('Password must contain at least one uppercase letter (A-Z)');
    }

    // Check for lowercase
    if (
      this.passwordPolicy.requireLowercase &&
      !/[a-z]/.test(password)
    ) {
      errors.push('Password must contain at least one lowercase letter (a-z)');
    }

    // Check for numbers
    if (
      this.passwordPolicy.requireNumbers &&
      !/\d/.test(password)
    ) {
      errors.push('Password must contain at least one number (0-9)');
    }

    // Check for special characters
    if (
      this.passwordPolicy.requireSpecialChars &&
      !new RegExp(`[${this.passwordPolicy.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)
    ) {
      errors.push(
        `Password must contain at least one special character (${this.passwordPolicy.specialChars})`
      );
    }

    // Check for common patterns
    const commonPatterns = [
      /^(.)\1{2,}$/,  // Repeating characters (aaa, 111)
      /^123|234|345|456|567|678|789|890$/,  // Sequential numbers
      /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)$/i,  // Sequential letters
      /^(password|admin|user|test|demo).*$/i,  // Common words
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common patterns and is too predictable');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate username
   */
  validateUsername(username: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!username || username.trim().length === 0) {
      errors.push('Username is required');
      return { isValid: false, errors };
    }

    const trimmed = username.trim();

    // Check length
    if (trimmed.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (trimmed.length > 30) {
      errors.push('Username must not exceed 30 characters');
    }

    // Check for valid characters (alphanumeric, underscore, hyphen only)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      errors.push(
        'Username can only contain letters, numbers, underscores, and hyphens'
      );
    }

    // Check for starting with number
    if (/^\d/.test(trimmed)) {
      errors.push('Username cannot start with a number');
    }

    // Reserved usernames
    const reserved = [
      'admin',
      'root',
      'system',
      'support',
      'help',
      'api',
      'www',
      'mail',
      'ftp',
    ];

    if (reserved.includes(trimmed.toLowerCase())) {
      errors.push(`Username "${trimmed}" is reserved`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate full signup form
   */
  validateSignup(data: {
    email: string;
    password: string;
    confirmPassword?: string;
    username?: string;
  }): {
    isValid: boolean;
    errors: Record<string, string[]>;
  } {
    const errors: Record<string, string[]> = {};

    // Validate email
    const emailResult = this.validateEmail(data.email);
    if (!emailResult.isValid) {
      errors.email = emailResult.errors;
    }

    // Validate password
    const passwordResult = this.validatePassword(data.password);
    if (!passwordResult.isValid) {
      errors.password = passwordResult.errors;
    }

    // Check password confirmation
    if (data.confirmPassword !== undefined) {
      if (data.password !== data.confirmPassword) {
        errors.confirmPassword = ['Passwords do not match'];
      }
    }

    // Validate username if provided
    if (data.username) {
      const usernameResult = this.validateUsername(data.username);
      if (!usernameResult.isValid) {
        errors.username = usernameResult.errors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate login data
   */
  validateLogin(data: {
    email: string;
    password: string;
  }): {
    isValid: boolean;
    errors: Record<string, string[]>;
  } {
    const errors: Record<string, string[]> = {};

    if (!data.email) {
      errors.email = ['Email is required'];
    }

    if (!data.password) {
      errors.password = ['Password is required'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate password reset
   */
  validatePasswordReset(data: {
    newPassword: string;
    confirmPassword: string;
  }): {
    isValid: boolean;
    errors: Record<string, string[]>;
  } {
    const errors: Record<string, string[]> = {};

    // Validate password
    const passwordResult = this.validatePassword(data.newPassword);
    if (!passwordResult.isValid) {
      errors.newPassword = passwordResult.errors;
    }

    // Check password confirmation
    if (data.newPassword && data.confirmPassword) {
      if (data.newPassword !== data.confirmPassword) {
        errors.confirmPassword = ['Passwords do not match'];
      }
    } else if (!data.confirmPassword) {
      errors.confirmPassword = ['Password confirmation is required'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

/**
 * Export singleton instance with default policy
 */
export const authValidator = new AuthValidator();
