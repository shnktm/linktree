import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { verifyAccessToken } from '$lib/server/api';
import { clearSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ cookies, locals }) => {
  const session = locals.session;
  if (!session) throw redirect(303, '/login?status=auth_denied');

  if (!(await verifyAccessToken(session.accessToken))) {
    clearSession(cookies);
    throw redirect(303, '/login?status=backend_unavailable');
  }

  if (session.role !== 'admin') throw redirect(303, '/');

  return {
    user: session.user,
    role: session.role,
  };
};
