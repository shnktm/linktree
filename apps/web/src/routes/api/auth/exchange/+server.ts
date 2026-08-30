import { json, type RequestHandler } from '@sveltejs/kit';
import { exchangeAuthorizationCode, sessionFromExchange } from '$lib/server/api';
import {
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
  setSession,
  toPublicSession,
} from '$lib/server/auth';

interface ExchangeRequest {
  code?: unknown;
  state?: unknown;
}

export const POST: RequestHandler = async ({ cookies, request, url }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return json({ authenticated: false, error: 'invalid_origin' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as ExchangeRequest | null;
  const code = typeof body?.code === 'string' ? body.code : '';
  const state = typeof body?.state === 'string' ? body.state : '';
  const savedState = cookies.get(OAUTH_STATE_COOKIE);
  cookies.delete(OAUTH_STATE_COOKIE, oauthStateCookieOptions);

  if (!code || !state || !savedState || state !== savedState) {
    return json({ authenticated: false, error: 'invalid_state' }, { status: 400 });
  }

  const exchange = await exchangeAuthorizationCode({
    code,
    state,
    redirectUri: new URL('/api/auth/callback', url.origin).toString(),
  });
  if (!exchange) {
    return json({ authenticated: false, error: 'exchange_unavailable' }, { status: 502 });
  }

  const session = sessionFromExchange(exchange);
  if (!setSession(cookies, session)) {
    return json({ authenticated: false, error: 'session_unavailable' }, { status: 503 });
  }

  return json({ authenticated: true, user: toPublicSession(session)?.user });
};
