import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sessionSecret(): string {
  const secret = process.env['SESSION_SECRET'];
  if (!secret) throw new Error('SESSION_SECRET is required for player sessions');
  return secret;
}

function signature(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

export function createPlayerSession(playerId: string): string {
  const payload = Buffer.from(JSON.stringify({
    playerId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifyPlayerSession(token: string): string | null {
  const [payload, suppliedSignature, ...rest] = token.split('.');
  if (!payload || !suppliedSignature || rest.length) return null;

  const expectedSignature = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      playerId?: unknown;
      expiresAt?: unknown;
    };
    if (typeof parsed.playerId !== 'string' || typeof parsed.expiresAt !== 'number') return null;
    if (parsed.expiresAt <= Date.now()) return null;
    return parsed.playerId;
  } catch {
    return null;
  }
}