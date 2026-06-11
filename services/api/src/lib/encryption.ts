import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 16;
const AUTH_TAG_BYTES = 16;
const SALT_BYTES = 32;
const KEY_BYTES = 32;

let _derivedKey: Buffer | null = null;

function getDerivedKey(): Buffer {
  if (_derivedKey) return _derivedKey;
  const raw = env.DATA_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error('DATA_ENCRYPTION_KEY must be at least 32 characters');
  }
  const salt = Buffer.from(raw.slice(0, SALT_BYTES).padEnd(SALT_BYTES, '0'));
  _derivedKey = scryptSync(raw, salt, KEY_BYTES);
  return _derivedKey;
}

export function encryptField(plaintext: string): string {
  const key = getDerivedKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]);
  return payload.toString('base64url');
}

export function decryptField(ciphertext: string): string {
  const key = getDerivedKey();
  const payload = Buffer.from(ciphertext, 'base64url');
  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const encrypted = payload.subarray(IV_BYTES + AUTH_TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function encryptFieldOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  return encryptField(value);
}

export function decryptFieldOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  try {
    return decryptField(value);
  } catch {
    return null;
  }
}

export function hashForLookup(value: string): string {
  const key = getDerivedKey();
  const hmacKey = Buffer.concat([key, Buffer.from('lookup')]);
  return createHmac('sha256', hmacKey).update(value.toLowerCase().trim()).digest('hex');
}

export function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
