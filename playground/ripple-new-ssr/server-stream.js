// Streaming SSR — the Phase 5 STRETCH (and an honest one).
//
// ripple-new's render() awaits every suspended use(promise) and returns the
// FULL body string, so this is NOT yet true Suspense streaming — i.e. flushing
// @pending fallbacks immediately and then streaming each boundary's resolved
// markup as its promise settles. That needs a renderToStream API on the runtime
// (future work): the server would emit the shell + fallbacks, then push
// <template>/inline-script patches per boundary as data arrives.
//
// What this DOES demonstrate is the writable-stream wiring and a coarse
// first-byte win: split the template at <!--ssr-body--> and flush the <head>
// shell (stylesheet links, Vite client, module preloads) to the browser BEFORE
// awaiting render(), so asset fetching overlaps server-side data resolution.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import polka from 'polka';
import { createServer as createViteServer } from 'vite';

const PORT = process.env.PORT || '5176';
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
			const [shell, tail] = template.split('<!--ssr-body-->');

			res.writeHead(200, { 'Content-Type': 'text/html' });
			// Flush the <head> shell NOW; the browser starts loading CSS/JS while we
			// resolve data below. (Scoped <style> tags move inline before the body
			// since the head is already on the wire.)
			res.write(shell.replace('<!--ssr-head-->', ''));

			const { renderApp } = await vite.ssrLoadModule('/src/entry-server.ts');
			const { body, css } = await renderApp();

			res.write(css + body);
			res.end(tail);
		} catch (err) {
			vite.ssrFixStacktrace?.(err);
			console.error(err);
			if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end(err.stack);
		}
	})
	.listen(PORT, () => console.log(`ripple-new SSR (streaming shell) → http://localhost:${PORT}`));
