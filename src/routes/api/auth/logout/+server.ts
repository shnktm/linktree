import { json, type RequestHandler } from '@sveltejs/kit';
import { revokeAccessToken } from '$lib/server/api';
import { clearSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, locals }) => {
  const token = locals.session?.accessToken;
  clearSession(cookies);
  if (token) await revokeAccessToken(token);

  return json({ authenticated: false });
};

export const GET: RequestHandler = async (event) => {
  await POST(event);
  return new Response(null, {
    status: 303,
    headers: { Location: '/' },
  });
};
