import crypto from 'crypto';
import { AuthTokenPayload } from './types';

const TOKEN_SECRET = process.env.AUTH_SECRET || 'lifeos-secure-session-secret-key-32-chars-long!';
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
  const { hash: computedHash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
}

export function generateAuthToken(payload: Omit<AuthTokenPayload, 'exp'>): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const fullPayload: AuthTokenPayload = { ...payload, exp };
  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) return null;

    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: AuthTokenPayload = JSON.parse(payloadJson);

    if (payload.exp < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
