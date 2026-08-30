import type { RequestHandler } from '@sveltejs/kit';

export const prerender = true;

export const GET: RequestHandler = () =>
  new Response('dh=5b7b7c35347657e9988a32dfed5ed24b23b2f363', {
    headers: {
      'cache-control': 'public, max-age=3600',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
