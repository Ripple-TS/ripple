import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { handle } from './dist/server/server.js';

export async function startServer(port = Number(process.env.PORT ?? 3000)) {
	const client = new URL('./dist/client/', import.meta.url);
	const manifest = JSON.parse(await readFile(new URL('.vite/manifest.json', client), 'utf8'));
	const entry = manifest['client.js'];
	const assets = {
		preloads: [`/app/${entry.file}`],
		scripts: [{ tag: 'script', attrs: { type: 'module', src: `/app/${entry.file}` } }],
		css: (entry.css ?? []).map((file) => `/app/${file}`),
	};
	const server = createServer(async (req, res) => {
		const origin = `http://127.0.0.1:${server.address().port}`;
		const url = new URL(req.url, origin);
		const controller = new AbortController();
		res.on('close', () => {
			if (!res.writableFinished) controller.abort();
		});
		try {
			if (url.pathname.startsWith('/app/assets/')) {
				// Serve only assets emitted in the build, without exposing source files.
				const relative = url.pathname.slice('/app/'.length);
				if (!/^assets\/[\w.-]+$/.test(relative)) {
					res.writeHead(404).end();
					return;
				}
				const body = await readFile(new URL(relative, client));
				res
					.writeHead(200, {
						'Content-Type': relative.endsWith('.css') ? 'text/css' : 'text/javascript',
					})
					.end(body);
				return;
			}
			if (url.pathname.startsWith('/app/api/')) {
				const id = url.pathname.split('/').at(-1);
				if (id === 'slow' || id === 'deferred')
					await new Promise((resolve) => setTimeout(resolve, 500));
				if (id === 'deferred') res.writeHead(200).end('Deferred message arrived');
				else if (id === 'error') res.writeHead(500).end('Unavailable');
				else
					res.writeHead(200, { 'Content-Type': 'application/json' }).end(
						JSON.stringify({
							title: `Post ${id}`,
							page: Number(url.searchParams.get('page')) || 1,
						}),
					);
				return;
			}
			const response = await handle(new Request(url, { signal: controller.signal }), assets);
			res.writeHead(response.status, Object.fromEntries(response.headers));
			if (response.body) await pipeline(Readable.fromWeb(response.body), res);
			else res.end();
		} catch (error) {
			if (!controller.signal.aborted) {
				console.error(error);
				if (!res.headersSent) res.writeHead(500);
				res.end('Example server error');
			}
		}
	});
	await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
	return {
		server,
		origin: `http://127.0.0.1:${server.address().port}`,
		entry: `/app/${entry.file}`,
	};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const { origin } = await startServer();
	console.log(`Ripple Router example: ${origin}/app/`);
}
