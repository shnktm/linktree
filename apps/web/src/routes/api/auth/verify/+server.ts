import { json, type RequestHandler } from '@sveltejs/kit';
import { verifyAccessToken } from '$lib/server/api';
import { clearSession, toPublicSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, locals }) => {
  const session = locals.session;
  if (!session) {
    return json({ authenticated: false }, { status: 401 });
  }

  if (!(await verifyAccessToken(session.accessToken))) {
    clearSession(cookies);
    return json({ authenticated: false }, { status: 401 });
  }

  return json({ authenticated: true, session: toPublicSession(session) });
};
