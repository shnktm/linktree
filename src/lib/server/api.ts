import { env } from '$env/dynamic/private';
import type { AuthUser, Session, UserRole } from '$lib/server/auth';

export interface AuthExchange {
  access_token: string;
  expires_in: number;
  user: AuthUser;
  role: UserRole;
}

const REQUEST_TIMEOUT_MS = 8000;

function serviceUrl(path: string): URL | null {
  const base = env.AUTH_SERVICE_URL?.trim();
  if (!base) return null;

  try {
    return new URL(`${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`);
  } catch {
    return null;
  }
}

async function requestService(path: string, init: RequestInit = {}): Promise<Response | null> {
  const url = serviceUrl(path);
  if (!url) return null;

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  try {
    return await fetch(url, {
      ...init,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AuthUser).id === 'string' &&
    Boolean((value as AuthUser).id.trim())
  );
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  state: string;
  redirectUri: string;
}): Promise<AuthExchange | null> {
  const response = await requestService('/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: input.code,
      state: input.state,
      redirect_uri: input.redirectUri,
    }),
  });
  if (!response?.ok) return null;

  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== 'object' || body === null) return null;

  const exchange = body as Partial<AuthExchange>;
  if (
    typeof exchange.access_token !== 'string' ||
    !exchange.access_token ||
    typeof exchange.expires_in !== 'number' ||
    exchange.expires_in <= 0 ||
    !isAuthUser(exchange.user) ||
    (exchange.role !== 'admin' && exchange.role !== 'user')
  ) {
    return null;
  }

  return {
    access_token: exchange.access_token,
    expires_in: exchange.expires_in,
    user: exchange.user,
    role: exchange.role,
  };
}

export async function verifyAccessToken(accessToken: string): Promise<boolean> {
  const response = await requestService('/verify', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response?.status === 204 || response?.status === 200;
}

export async function revokeAccessToken(accessToken: string): Promise<void> {
  await requestService('/logout', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function sessionFromExchange(exchange: AuthExchange): Session {
  return {
    accessToken: exchange.access_token,
    user: exchange.user,
    role: exchange.role,
    expiresAt: Date.now() + Math.floor(exchange.expires_in * 1000),
  };
}
