import crypto from 'node:crypto';

const SCRYPT_PREFIX = 'scrypt$';
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export function isScryptHash(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return false;
  const parts = value.split('$');
  return value.startsWith(SCRYPT_PREFIX) && parts.length === 3 && parts[1].length >= 16 && parts[2].length === KEY_LENGTH * 2;
}

export function hashPasswordScrypt(password: string, customSaltHex?: string): string {
  const cleanPassword = String(password || '');
  const saltHex =
    customSaltHex && /^[0-9a-fA-F]{16,}$/.test(customSaltHex)
      ? customSaltHex.toLowerCase()
      : crypto.randomBytes(SALT_BYTES).toString('hex');
  const derived = crypto.scryptSync(cleanPassword, saltHex, KEY_LENGTH).toString('hex');
  return `${SCRYPT_PREFIX}${saltHex}$${derived}`;
}

export function verifyPasswordScrypt(password: string, storedValue: string | null | undefined): {
  valid: boolean;
  needsRehash: boolean;
} {
  if (typeof password !== 'string' || typeof storedValue !== 'string' || !storedValue) {
    return { valid: false, needsRehash: false };
  }

  if (isScryptHash(storedValue)) {
    const [, saltHex, storedHashHex] = storedValue.split('$');
    const derivedBuf = crypto.scryptSync(password, saltHex, KEY_LENGTH);
    const storedBuf = Buffer.from(storedHashHex, 'hex');
    if (derivedBuf.length !== storedBuf.length) {
      return { valid: false, needsRehash: false };
    }
    return {
      valid: crypto.timingSafeEqual(derivedBuf, storedBuf),
      needsRehash: false,
    };
  }

  // Legacy plaintext compatibility with constant-time compare + immediate migration flag
  const inputBuf = Buffer.from(password, 'utf8');
  const storedBuf = Buffer.from(storedValue, 'utf8');
  if (inputBuf.length !== storedBuf.length) {
    return { valid: false, needsRehash: false };
  }
  const match = crypto.timingSafeEqual(inputBuf, storedBuf);
  return {
    valid: match,
    needsRehash: match,
  };
}

export function sanitizeUserRecord<T extends Record<string, unknown>>(user: T): Omit<T, 'password'> {
  const clone = { ...user };
  delete clone.password;
  return clone;
}
