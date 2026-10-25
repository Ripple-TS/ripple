import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import { serve, serveStatic } from '../../adapter-node/src/index.js';
import { write_prerendered_pages } from '../src/prerender-output.js';

const cleanups = [];
afterEach(async () => {
	for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

function fixture() {
	const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'ripple-prerender-')));
	cleanups.push(() => rmSync(root, { recursive: true, force: true }));
	return root;
}

describe('prerender output', () => {
	it.each([
		'/../escape',
		'/%2e%2e/escape',
		'/ok%2f..%2f../escape',
		'/ok%5c..%5c../escape',
		'/broken%',
		'/%00',
		'/a//b',
		'relative',
	])('rejects unsafe pathname %s before writing any pages', (pathname) => {
		const root = fixture();
		const out = path.join(root, 'client');
		expect(() =>
			write_prerendered_pages(
				out,
				new Map([
					['/valid', 'valid'],
					[pathname, 'unsafe'],
				]),
			),
		).toThrow(pathname);
		expect(existsSync(out)).toBe(false);
		expect(existsSync(path.join(root, 'escape'))).toBe(false);
	});

	it.each(['/posts/%6fne', '/posts/one/'])(
		'rejects %s when it would overwrite another page',
		(pathname) => {
			const out = path.join(fixture(), 'client');
			expect(() =>
				write_prerendered_pages(
					out,
					new Map([
						['/posts/one', 'first'],
						[pathname, 'second'],
					]),
				),
			).toThrow('same output file');
			expect(existsSync(out)).toBe(false);
		},
	);

	it('builds decoded filenames that the Node adapter serves without SSR', async () => {
		const root = fixture();
		const packages = fileURLToPath(new URL('../../', import.meta.url));
		mkdirSync(path.join(root, 'node_modules', '@ripple-ts'), { recursive: true });
		for (const [name, source] of [
			['ripple', 'ripple'],
			['@ripple-ts/vite-plugin', 'vite-plugin'],
			['@ripple-ts/adapter', 'adapter'],
			['@ripple-ts/adapter-node', 'adapter-node'],
		]) {
			symlinkSync(path.join(packages, source), path.join(root, 'node_modules', name), 'dir');
		}
		writeFileSync(path.join(root, 'package.json'), '{"type":"module"}');
		writeFileSync(
			path.join(root, 'vite.config.ts'),
			`
import { ripple } from '@ripple-ts/vite-plugin';
export default { plugins: [ripple()], logLevel: 'silent' };
`,
		);
		writeFileSync(
			path.join(root, 'ripple.config.ts'),
			`
import { defineConfig, RenderRoute } from '@ripple-ts/vite-plugin';
import * as adapter from '@ripple-ts/adapter-node';
export default defineConfig({
  adapter,
  router: { routes: [
    ...['/', '/café', '/pre%20encoded', '/100%25'].map((path) =>
      new RenderRoute({ path, entry: '/App.tsrx', prerender: true, crawl: path === '/' })),
    new RenderRoute({ path: '/posts/:slug', entry: '/App.tsrx', prerender: true, entries: [{ slug: 'one' }] }),
  ] },
});
`,
		);
		writeFileSync(
			path.join(root, 'App.tsrx'),
			`
export function App(props: { params: Record<string, string> }) @{
  <><p>{props.params.slug ?? 'page'}</p><a href="/posts/two">Two</a></>
}
`,
		);
		writeFileSync(
			path.join(root, 'index.html'),
			'<html><head><!--ssr-head--></head><body><div id="root"><!--ssr-body--></div></body></html>',
		);
		await build({ root });
		const out = path.join(root, 'dist/client');
		const { handler } = await import(pathToFileURL(path.join(root, 'dist/server/entry.js')).href);
		const fallback = vi.fn(() => new Response('SSR fallback', { status: 404 }));
		const server = serve(fallback, {
			hostname: '127.0.0.1',
			middleware: serveStatic(out),
		}).listen(0);
		cleanups.push(
			() =>
				new Promise((resolve, reject) => {
					server.close((error) => (error ? reject(error) : resolve()));
				}),
		);
		await new Promise((resolve, reject) => {
			server.once('listening', resolve);
			server.once('error', reject);
		});
		const origin = `http://127.0.0.1:${server.address().port}`;
		for (const pathname of [
			'/',
			'/caf%C3%A9',
			'/pre%20encoded',
			'/100%25',
			'/posts/one',
			'/posts/two',
		]) {
			const html = readFileSync(path.join(out, decodeURIComponent(pathname), 'index.html'), 'utf8');
			const live = await handler(new Request(origin + pathname));
			expect(live.status).toBe(200);
			expect(await live.text()).toBe(html);
			const response = await fetch(origin + pathname);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe(html);
		}
		expect(existsSync(path.join(out, 'caf%C3%A9'))).toBe(false);
		expect(fallback).not.toHaveBeenCalled();
	}, 30_000);
});
