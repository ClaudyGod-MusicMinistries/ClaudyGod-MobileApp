export interface ValidationCheck {
  id: string;
  label: string;
  passed: boolean;
  recommended?: boolean;
}

export interface PasswordStrengthReport {
  label: 'Too short' | 'Weak' | 'Fair' | 'Strong' | 'Excellent';
  tone: 'error' | 'warning' | 'info' | 'success';
  score: number;
  percentage: number;
  checks: ValidationCheck[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PATTERN = /^[\p{L}\p{N} .,'_-]+$/u;

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const isLikelyValidEmail = (value: string): boolean => EMAIL_PATTERN.test(normalizeEmail(value));

export const getEmailValidationMessage = (value: string): string => {
  const normalized = normalizeEmail(value);
  if (!normalized) {
    return 'Use an email address you can access right now for verification and recovery.';
  }
  if (!isLikelyValidEmail(normalized)) {
    return 'Enter a valid email address in the format name@example.com.';
  }
  return 'Verification codes and recovery emails will be sent to this address.';
};

export const getNameValidationMessage = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    return 'Enter the name you want displayed on your account.';
  }
  if (normalized.length < 2) {
    return 'Use at least 2 characters so your profile name is easy to recognize.';
  }
  if (!NAME_PATTERN.test(normalized)) {
    return 'Use letters, numbers, spaces, and basic punctuation only.';
  }
  return 'This is how your account will appear across the mobile app.';
};

export const isValidDisplayName = (value: string): boolean => {
  const normalized = value.trim();
  return normalized.length >= 2 && NAME_PATTERN.test(normalized);
};

export const getPasswordStrengthReport = (value: string): PasswordStrengthReport => {
  const password = value.trim();

  const checks: ValidationCheck[] = [
    { id: 'length', label: 'At least 8 characters', passed: password.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'One lowercase letter', passed: /[a-z]/.test(password) },
    { id: 'number', label: 'One number', passed: /[0-9]/.test(password) },
    { id: 'long', label: '12+ characters for extra strength', passed: password.length >= 12, recommended: true },
    {
      id: 'symbol',
      label: 'Add a symbol for stronger recovery resistance',
      passed: /[^A-Za-z0-9]/.test(password),
      recommended: true,
    },
  ];

  const requiredPassed = checks.slice(0, 4).filter((item) => item.passed).length;
  const recommendedPassed = checks.slice(4).filter((item) => item.passed).length;
  const score = requiredPassed * 2 + recommendedPassed;

  if (!password || password.length < 4) {
    return {
      label: 'Too short',
      tone: 'error',
      score,
      percentage: 10,
      checks,
    };
  }

  if (score <= 3) {
    return {
      label: 'Weak',
      tone: 'error',
      score,
      percentage: 28,
      checks,
    };
  }

  if (score <= 5) {
    return {
      label: 'Fair',
      tone: 'warning',
      score,
      percentage: 54,
      checks,
    };
  }

  if (score <= 7) {
    return {
      label: 'Strong',
      tone: 'info',
      score,
      percentage: 78,
      checks,
    };
  }

  return {
    label: 'Excellent',
    tone: 'success',
    score,
    percentage: 100,
    checks,
  };
};

export const isPasswordCompliant = (value: string): boolean =>
  getPasswordStrengthReport(value).checks.slice(0, 4).every((item) => item.passed);

export const getPasswordConfirmationMessage = (password: string, confirmPassword: string): string => {
  const confirm = confirmPassword.trim();
  if (!confirm) {
    return 'Repeat the password exactly so we can confirm it before submission.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match yet.';
  }
  return 'Passwords match.';
};
