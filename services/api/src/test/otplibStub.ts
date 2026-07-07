// Test-only stub for `otplib`. The real package pulls in an ESM-only dependency
// (@scure/base) that Jest's CommonJS transform can't parse, and no test in this suite
// exercises MFA/TOTP behavior — so tests get this stub via jest.config.js's
// moduleNameMapper instead of the real package.
export const generateSecret = (): string => 'test-secret';
export const generateURI = (): string => 'otpauth://totp/test';
export const verifySync = (): boolean => false;
