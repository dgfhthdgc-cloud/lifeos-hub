import crypto from 'crypto';
import { AuthTokenPayload } from './types';

let cachedSecret: string | null = null;
let devSecretWarningLogged = false;

export function getAuthSecret(): string {
  if (cachedSecret) return cachedSecret;

  const envSecret = process.env.AUTH_SECRET;
  if (envSecret && envSecret.trim().length >= 16) {
    cachedSecret = envSecret.trim();
    return cachedSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: AUTH_SECRET environment variable is missing or too short in production. Server startup aborted.'
    );
  }

  // Development fallback: Generate cryptographically secure ephemeral secret in-memory
  if (!devSecretWarningLogged) {
    console.warn(
      '[AUTH SECURITY WARNING] AUTH_SECRET environment variable is not set. Using dynamically generated in-memory development secret. Sessions will reset when the server restarts.'
    );
    devSecretWarningLogged = true;
  }

  cachedSecret = crypto.randomBytes(32).toString('hex');
  return cachedSecret;
}

export function validateAuthSecretOnStartup(): void {
  getAuthSecret();
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, finalSalt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt: finalSalt,
  };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const { hash: computedHash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function generateAuthToken(payload: Omit<AuthTokenPayload, 'exp'>): string {
  const secret = getAuthSecret();
  const exp = Date.now() + TOKEN_TTL_MS;
  const fullPayload: AuthTokenPayload = { ...payload, exp };
  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const secret = getAuthSecret();
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) return null;

    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: AuthTokenPayload = JSON.parse(payloadJson);

    if (!payload.userId || !payload.exp || payload.exp < Date.now()) {
      return null; // Invalid or expired
    }

    return payload;
  } catch {
    return null;
  }
}
