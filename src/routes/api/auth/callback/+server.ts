import { redirect, type RequestHandler } from '@sveltejs/kit';
import { exchangeAuthorizationCode, sessionFromExchange } from '$lib/server/api';
import { OAUTH_STATE_COOKIE, oauthStateCookieOptions, setSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const error = url.searchParams.get('error');
  if (error) {
    cookies.delete(OAUTH_STATE_COOKIE, oauthStateCookieOptions);
    throw redirect(303, '/login?status=auth_cancelled');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = cookies.get(OAUTH_STATE_COOKIE);
  cookies.delete(OAUTH_STATE_COOKIE, oauthStateCookieOptions);

  if (!code) throw redirect(303, '/login?status=missing_code');
  if (!state || !savedState || state !== savedState) {
    throw redirect(303, '/login?status=invalid_state');
  }

  const exchange = await exchangeAuthorizationCode({
    code,
    state,
    redirectUri: new URL('/api/auth/callback', url.origin).toString(),
  });
  if (!exchange) throw redirect(303, '/login?status=backend_unavailable');

  const session = sessionFromExchange(exchange);
  if (!setSession(cookies, session)) {
    throw redirect(303, '/login?status=session_unavailable');
  }

  throw redirect(303, '/');
};
