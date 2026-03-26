/* eslint-disable @typescript-eslint/no-explicit-any */ // @ts-nocheck
// __tests__/emailValidator.test.ts
/**
 * Email Validator Tests
 * Tests for email domain validation and disposable email detection
 */

import { EmailValidator, standardEmailValidator } from '../lib/emailValidator';

describe('EmailValidator', () => {
  describe('Email Format Validation', () => {
    it('should validate correct email format', () => {
      const result = standardEmailValidator.validate('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject email without @', () => {
      const result = standardEmailValidator.validate('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should reject email without domain', () => {
      const result = standardEmailValidator.validate('user@');
      expect(result.isValid).toBe(false);
    });

    it('should reject email without local part', () => {
      const result = standardEmailValidator.validate('@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('local part'))).toBe(true);
    });

    it('should trim whitespace from email', () => {
      const result = standardEmailValidator.validate('  user@example.com  ');
      expect(result.isValid).toBe(true);
    });

    it('should normalize email to lowercase', () => {
      const result = standardEmailValidator.validate('USER@EXAMPLE.COM');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Domain Validation', () => {
    it('should accept valid corporate domains', () => {
      const result = standardEmailValidator.validate('user@company.co.uk');
      expect(result.isValid).toBe(true);
    });

    it('should reject blocked domains', () => {
      const result = standardEmailValidator.validate('user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('not allowed'))).toBe(true);
    });

    it('should reject disposable email domains', () => {
      const result = standardEmailValidator.validate('user@tempmail.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Disposable'))).toBe(true);
    });

    it('should reject domains without TLD', () => {
      const result = standardEmailValidator.validate('user@localhost');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('dot'))).toBe(true);
    });

    it('should reject TLDs that are too short', () => {
      const result = standardEmailValidator.validate('user@example.c');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('TLD'))).toBe(true);
    });

    it('should reject domains with consecutive dots', () => {
      const result = standardEmailValidator.validate('user@exam..ple.com');
      expect(result.isValid).toBe(false);
    });

    it('should reject domains with invalid characters', () => {
      const result = standardEmailValidator.validate('user@exam ple.com');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Local Part Validation', () => {
    it('should reject local part starting with dot', () => {
      const result = standardEmailValidator.validate('.user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('start with a dot'))).toBe(true);
    });

    it('should reject local part ending with dot', () => {
      const result = standardEmailValidator.validate('user.@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('end with a dot'))).toBe(true);
    });

    it('should reject local part with consecutive dots', () => {
      const result = standardEmailValidator.validate('user..name@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('consecutive dots'))).toBe(true);
    });

    it('should accept local part with single dots', () => {
      const result = standardEmailValidator.validate('user.name@example.com');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Length Validation', () => {
    it('should reject email shorter than minimum length', () => {
      const result = standardEmailValidator.validate('a@b');
      expect(result.isValid).toBe(false);
    });

    it('should reject email longer than maximum length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = standardEmailValidator.validate(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceed'))).toBe(true);
    });
  });

  describe('Custom Configuration', () => {
    it('should accept emails from allowed domains only', () => {
      const validator = new EmailValidator({
        allowedDomains: ['company.com', 'trusted.org'],
      });

      const result1 = validator.validate('user@company.com');
      expect(result1.isValid).toBe(true);

      const result2 = validator.validate('user@other.com');
      expect(result2.isValid).toBe(false);
      expect(result2.errors.some(e => e.includes('not in the list'))).toBe(true);
    });

    it('should block custom domains', () => {
      const validator = new EmailValidator({
        blockedDomains: ['banned.com'],
      });

      const result = validator.validate('user@banned.com');
      expect(result.isValid).toBe(false);
    });

    it('should enforce custom minimum length', () => {
      const validator = new EmailValidator({
        minLength: 20,
      });

      const result = validator.validate('short@test.com');
      expect(result.isValid).toBe(false);
    });

    it('should disable disposable email checking if configured', () => {
      const validator = new EmailValidator({
        checkDisposable: false,
      });

      const result = validator.validate('user@tempmail.com');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Static Helper Methods', () => {
    it('should extract domain from email', () => {
      const domain = EmailValidator.getDomain('user@example.com');
      expect(domain).toBe('example.com');
    });

    it('should identify corporate domains', () => {
      const isCorporate = EmailValidator.isCorporateDomain('dept.company.com');
      expect(isCorporate).toBe(true);

      const isNotCorporate = EmailValidator.isCorporateDomain('example.com');
      expect(isNotCorporate).toBe(false);
    });
  });
});
