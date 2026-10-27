import { createServer as createHttpServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { vendorScript } from './security-policy.js';

export async function startDevServer(port = Number(process.env.PORT ?? 3001), plugins = []) {
	const placeholder = '__RIPPLE_DEV_NONCE__';
	const server = createHttpServer();
	const vite = await createServer({
		plugins,
		html: { cspNonce: placeholder },
		server: { middlewareMode: true, hmr: { server, overlay: false } },
	});
	server.on('request', async (req, res) => {
		const path = req.url?.split('?')[0];
		if (path === '/app/security/vendor.js' || path === '/app/security/compiled.js') {
			res
				.writeHead(200, { 'Content-Type': 'text/javascript' })
				.end(
					path.endsWith('/vendor.js')
						? vendorScript
						: 'window.compiledScriptLoads = (window.compiledScriptLoads || 0) + 1;',
				);
			return;
		}
		if (req.url?.split('?')[0] !== '/app/security/dev') return vite.middlewares(req, res);
		try {
			const nonce = randomBytes(18).toString('base64');
			const address = server.address();
			const websocket = `ws://127.0.0.1:${address.port}`;
			const policy = `default-src 'self'; script-src 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'nonce-${nonce}'; style-src-attr 'none'; connect-src 'self' ${websocket}; object-src 'none'; base-uri 'none'`;
			const html = await vite.transformIndexHtml(
				req.url,
				'<!doctype html><html data-csr="true"><head><title>Ripple CSP development</title></head><body><div id="app"></div><script type="module" src="/security-client.js"></script></body></html>',
			);
			res.writeHead(200, {
				'Content-Type': 'text/html',
				'Content-Security-Policy': policy,
				'Cache-Control': 'no-store',
			});
			res.end(html.replaceAll(placeholder, nonce));
		} catch (error) {
			vite.ssrFixStacktrace(error);
			console.error(error);
			res.writeHead(500).end('Development server error');
		}
	});
	await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
	return { server, vite, origin: `http://127.0.0.1:${server.address().port}` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const { origin } = await startDevServer();
	console.log(`Ripple CSP development: ${origin}/app/security/dev`);
}
