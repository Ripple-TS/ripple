// Minimal SSR dev server for ripple-new (SSR Phase 5).
//
// Runs Vite in middleware mode (so .tsrx + TS are transformed on the fly with
// HMR/full-reload), then for every request:
//   1. reads index.html and lets Vite inject its dev client + module preloads,
//   2. loads entry-server.ts via ssrLoadModule (App.tsrx → `mode: 'server'`),
//   3. awaits render() and splices `head + css` / `body` into the template's
//      <!--ssr-head--> / <!--ssr-body--> markers.
// The browser then loads entry-client.ts, which hydrates the markup.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import polka from 'polka';
import { createServer as createViteServer } from 'vite';

const PORT = process.env.PORT || '5175';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const vite = await createViteServer({
	server: { middlewareMode: true },
	appType: 'custom',
});

polka()
	.use(vite.middlewares)
	.use(async (req, res) => {
		try {
			const raw = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
			const template = await vite.transformIndexHtml(req.url, raw);

			const { renderApp } = await vite.ssrLoadModule('/src/entry-server.ts');
			const { head, body, css } = await renderApp();

			const html = template.replace('<!--ssr-head-->', head + css).replace('<!--ssr-body-->', body);

			res.writeHead(200, { 'Content-Type': 'text/html' }).end(html);
		} catch (err) {
			vite.ssrFixStacktrace?.(err);
			console.error(err);
			res.writeHead(500, { 'Content-Type': 'text/plain' }).end(err.stack);
		}
	})
	.listen(PORT, () => console.log(`ripple-new SSR → http://localhost:${PORT}`));
