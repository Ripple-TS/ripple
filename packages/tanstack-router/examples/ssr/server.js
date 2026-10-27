import {
	createRequestHandler,
	defaultRenderHandler,
	defaultStreamHandler,
} from '@ripple-ts/tanstack-router/ssr/server';
import { getRouter } from './router.tsrx';

export function handle(request, assets) {
	return createRequestHandler({
		request,
		createRouter: () => getRouter(new URL(request.url).origin),
		getRouterManifest: () => ({ routes: { __root__: assets } }),
	})(new URL(request.url).searchParams.has('stream') ? defaultStreamHandler : defaultRenderHandler);
}
