import type { LayoutServerLoad } from './$types';
import { toPublicSession } from '$lib/server/auth';

export const load: LayoutServerLoad = ({ locals }) => ({
  session: toPublicSession(locals.session),
});
