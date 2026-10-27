import { getRouter } from './router.tsrx';
import { createRequestHandler, defaultStreamHandler } from '@ripple-ts/tanstack-router/ssr/server';
import { hydrateRouter } from '@ripple-ts/tanstack-router/ssr/client';
const router = getRouter('http://localhost');
router.navigate({ to: '/posts/$postId', params: { postId: 'one' }, search: { page: 2 } });
// @ts-expect-error required route params
router.navigate({ to: '/posts/$postId', search: { page: 1 } });
// @ts-expect-error search is validated as a number
router.navigate({ to: '/posts/$postId', params: { postId: 'one' }, search: { page: 'bad' } });
// @ts-expect-error unknown route
router.navigate({ to: '/unknown' });
createRequestHandler({ request: new Request('http://localhost'), createRouter: () => router })(
	defaultStreamHandler,
);
hydrateRouter({ router, target: document.body });
