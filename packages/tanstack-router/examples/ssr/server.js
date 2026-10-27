import {
	createRequestHandler,
	defaultRenderHandler,
	defaultStreamHandler,
} from '@ripple-ts/tanstack-router/ssr/server';
import { getRouter } from './router.tsrx';

export function handle(request, assets) {
	// Generate once per HTTP response, never per chunk or process.
	const nonce = randomBytes(18).toString('base64');
	return createRequestHandler({
		request,
		createRouter: () => {
			const router = getRouter(new URL(request.url).origin);
			router.update({ ssr: { nonce } });
			return router;
		},
		getRouterManifest: () => ({ routes: { __root__: assets } }),
	})((options) => {
		// Set the policy before rendering can emit the first streamed bytes.
		options.responseHeaders.set(
			'Content-Security-Policy',
			`default-src 'self'; script-src 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'nonce-${nonce}'; style-src-attr 'none'; object-src 'none'; base-uri 'none'`,
		);
		options.responseHeaders.set('Cache-Control', 'private, no-store');
		return (
			new URL(request.url).searchParams.has('stream') ? defaultStreamHandler : defaultRenderHandler
		)(options);
	});
}
import { randomBytes } from 'node:crypto';
