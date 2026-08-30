import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE = 'wired_session';
export const OAUTH_STATE_COOKIE = 'wired_oauth_state';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  username?: string;
  avatar?: string;
}

export interface Session {
  accessToken: string;
  user: AuthUser;
  role: UserRole;
  expiresAt: number;
}

export type PublicSession = Omit<Session, 'accessToken'>;

interface StoredSession {
  version: 1;
  accessToken: string;
  user: AuthUser;
  role: UserRole;
  expiresAt: number;
}

function sessionSecret(): string | null {
  const secret = env.AUTH_SESSION_SECRET?.trim();
  return secret || null;
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decode<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function signaturesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAuthConfigured(): boolean {
  return Boolean(env.AUTH_SERVICE_URL?.trim() && sessionSecret());
}

export function serializeSession(session: Session): string | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const stored: StoredSession = {
    version: 1,
    accessToken: session.accessToken,
    user: session.user,
    role: session.role,
    expiresAt: session.expiresAt,
  };
  const payload = encode(stored);
  return `${payload}.${sign(payload, secret)}`;
}

export function deserializeSession(value: string | undefined): Session | null {
  const secret = sessionSecret();
  if (!secret || !value) return null;

  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;

  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!signaturesMatch(signature, sign(payload, secret))) return null;

  const stored = decode<StoredSession>(payload);
  if (
    !stored ||
    stored.version !== 1 ||
    !stored.accessToken ||
    !stored.user?.id ||
    (stored.role !== 'admin' && stored.role !== 'user') ||
    !Number.isFinite(stored.expiresAt) ||
    stored.expiresAt <= Date.now()
  ) {
    return null;
  }

  return {
    accessToken: stored.accessToken,
    user: stored.user,
    role: stored.role,
    expiresAt: stored.expiresAt,
  };
}

export function getSession(cookies: Cookies): Session | null {
  return deserializeSession(cookies.get(SESSION_COOKIE));
}

export function setSession(cookies: Cookies, session: Session): boolean {
  const value = serializeSession(session);
  if (!value) return false;

  cookies.set(SESSION_COOKIE, value, {
    ...sessionCookieOptions,
    maxAge: Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000)),
  });
  return true;
}

export function clearSession(cookies: Cookies): void {
  cookies.delete(SESSION_COOKIE, sessionCookieOptions);
}

export function toPublicSession(session: Session | null): PublicSession | null {
  if (!session) return null;
  const { accessToken: _accessToken, ...publicSession } = session;
  return publicSession;
}

export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.COOKIE_SECURE
    ? env.COOKIE_SECURE.toLowerCase() !== 'false'
    : env.NODE_ENV === 'production',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

export const oauthStateCookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.COOKIE_SECURE
    ? env.COOKIE_SECURE.toLowerCase() !== 'false'
    : env.NODE_ENV === 'production',
  maxAge: 600,
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};
