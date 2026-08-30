import type { PageServerLoad } from './$types';
import { isAuthConfigured } from '$lib/server/auth';

const allowedStatuses = new Set([
  'backend_unavailable',
  'auth_denied',
  'auth_cancelled',
  'invalid_state',
  'missing_code',
  'session_unavailable',
]);

export const load: PageServerLoad = ({ url }) => {
  const requestedStatus = url.searchParams.get('status');
  return {
    authConfigured: isAuthConfigured(),
    status: requestedStatus && allowedStatuses.has(requestedStatus) ? requestedStatus : null,
  };
};
