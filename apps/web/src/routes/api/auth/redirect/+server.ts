import { randomBytes } from 'node:crypto';
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { OAUTH_STATE_COOKIE, oauthStateCookieOptions } from '$lib/server/auth';

export const GET: RequestHandler = ({ cookies, url }) => {
  const service = env.AUTH_SERVICE_URL?.trim();
  if (!service) throw redirect(303, '/login?status=backend_unavailable');

  let authorizationUrl: URL;
  try {
    authorizationUrl = new URL('discord/redirect', `${service.replace(/\/+$/, '')}/`);
  } catch {
    throw redirect(303, '/login?status=backend_unavailable');
  }

  const state = randomBytes(32).toString('base64url');
  const callbackUrl = new URL('/api/auth/callback', url.origin);
  authorizationUrl.searchParams.set('return_url', callbackUrl.toString());
  authorizationUrl.searchParams.set('state', state);
  cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions);

  throw redirect(303, authorizationUrl.toString());
};
