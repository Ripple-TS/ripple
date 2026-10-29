// pnpm --filter ripple exec node tests/browser/async-iterable.mjs
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { compile } from '@tsrx/ripple';
import { render, executeServerFunction } from 'ripple/server';
import { ripple } from '@ripple-ts/vite-plugin';
import { chromium } from 'playwright';
import { build } from 'vite';
import * as devalue from 'devalue';
import { serve } from '../../../adapter-node/src/index.js';

const directory = await mkdtemp(join(tmpdir(), 'ripple-iterable-'));
const root = fileURLToPath(new URL('../../../../', import.meta.url)).replace(/\/$/, '');
const fixture = fileURLToPath(
	new URL('../hydration/components/async-iterable-browser.tsrx', import.meta.url),
);
const runtime = fileURLToPath(new URL('../../src/runtime/index-client.js', import.meta.url));
const text = await readFile(fixture, 'utf8');
const filename = fixture.replace(root, '');
let serverCode = compile(text, filename, { mode: 'server' }).code;
for (const [specifier, relative] of [
	['ripple/internal/server', '../../src/runtime/internal/server/index.js'],
	['ripple/hydration', '../../src/runtime/hydration.js'],
	['ripple', '../../src/runtime/index-server.js'],
])
	serverCode = serverCode.replaceAll(
		`'${specifier}'`,
		JSON.stringify(new URL(relative, import.meta.url).href),
	);
await writeFile(join(directory, 'server.mjs'), serverCode);
const serverModule = await import(pathToFileURL(join(directory, 'server.mjs')).href);
const start = performance.now();
const { body } = await render(serverModule.App);
const ssr_ms = performance.now() - start;
const entry = join(directory, 'client.js');
await writeFile(
	entry,
	`import {hydrate} from ${JSON.stringify(runtime)}; import {App} from ${JSON.stringify(fixture)}; window.start = () => window.stop = hydrate(App, {target: document.querySelector('#app')});`,
);
const output = await build({
	configFile: false,
	root,
	logLevel: 'silent',
	plugins: [ripple({ excludeRippleExternalModules: true })],
	build: {
		write: false,
		minify: true,
		rollupOptions: { input: entry, output: { entryFileNames: 'client.js' } },
	},
});
const chunks = output.output;
const assets = new Map(
	chunks.filter((c) => c.type === 'chunk').map((c) => ['/' + c.fileName, c.code]),
);
const calls = [];
let interrupted = false;
let response_bytes = 0;
let disconnect;
const interruption = new Promise((resolve) => {
	disconnect = resolve;
});
const adapter = serve(
	async (request) => {
		const path = new URL(request.url).pathname;
		if (path === '/ack') {
			disconnect();
			return new Response('ok');
		}
		if (assets.has(path))
			return new Response(assets.get(path), { headers: { 'Content-Type': 'text/javascript' } });
		if (path.startsWith('/_$_ripple_rpc_$_/')) {
			request.signal.addEventListener('abort', () => disconnect(), { once: true });
			const args = await request.text();
			calls.push(devalue.parse(args));
			const result = await executeServerFunction(
				serverModule._$_server_$_.rows,
				args,
				request.signal,
			);
			const reader = result.body.getReader();
			let stop = false;
			return new Response(
				new ReadableStream(
					{
						async pull(controller) {
							if (stop) {
								await interruption;
								void reader.cancel();
								controller.error(new Error('forced host termination'));
								return;
							}
							const chunk = await reader.read();
							if (chunk.done) return controller.close();
							response_bytes += chunk.value.byteLength;
							const frame = JSON.parse(new TextDecoder().decode(chunk.value));
							if (!interrupted && frame[2] === 'v' && devalue.parse(frame[3]).cursor === 300)
								stop = interrupted = true;
							controller.enqueue(chunk.value);
						},
						cancel() {
							void reader.cancel();
						},
					},
					{ highWaterMark: 0 },
				),
				{ headers: result.headers },
			);
		}
		return new Response(
			`<!doctype html><div id="app">${body}</div><script type="module" src="/client.js"></script>`,
			{ headers: { 'Content-Type': 'text/html' } },
		);
	},
	{ static: false, hostname: '127.0.0.1' },
);
const server = adapter.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(`http://127.0.0.1:${server.address().port}`);
	await page.waitForFunction(() => typeof window.start === 'function');
	await page.locator('#draft').fill('early edit');
	await page.evaluate(() => {
		window.first = document.querySelector('li');
		window.input = document.querySelector('input');
		window.extraScripts = 0;
		new MutationObserver((entries) => {
			for (const e of entries)
				for (const n of e.addedNodes)
					if (n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'TEMPLATE'))
						window.extraScripts++;
		}).observe(document.querySelector('#app'), { subtree: true, childList: true });
		window.start();
	});
	assert.equal(calls.length, 0);
	await page.locator('button').click();
	await page.waitForFunction(() => document.querySelector('#cursor').textContent === '300');
	await page.evaluate(async () => {
		await fetch('/ack');
	});
	await page.waitForFunction(() => document.querySelector('#status').textContent === 'done');
	assert.deepEqual(calls, [[100], [300]]);
	assert.equal(await page.locator('li').count(), 400);
	assert.equal(await page.locator('#draft').inputValue(), 'early edit');
	assert.equal(
		await page.evaluate(
			() =>
				window.first === document.querySelector('li') &&
				window.input === document.querySelector('input'),
		),
		true,
	);
	assert.equal(await page.evaluate(() => window.extraScripts), 0);
	assert.deepEqual(errors, []);
	await page.evaluate(() => window.stop());
	console.log(
		JSON.stringify(
			{
				ssr_ms,
				html_bytes: Buffer.byteLength(body),
				rpc_bytes: response_bytes,
				calls,
				client_gzip: [...assets.values()].reduce((n, code) => n + gzipSync(code).byteLength, 0),
			},
			null,
			2,
		),
	);
} finally {
	await browser.close();
	await new Promise((resolve) => server.close(resolve));
	await rm(directory, { recursive: true, force: true });
}
