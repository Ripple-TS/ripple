// RIPPLE_MINIFLARE=/path/to/miniflare/dist/src/index.js pnpm --filter ripple exec node tests/platform/async-iterable.mjs
// Installs no repository dependencies; run against the local workerd runtime supplied by Miniflare.
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compile } from '@tsrx/ripple';
import { build } from 'vite';
import * as devalue from 'devalue';
import { read_stream } from '../../src/runtime/internal/client/rpc-stream.js';
import { RpcTransportError } from '../../src/utils/rpc-stream.js';

assert(process.env.RIPPLE_MINIFLARE, 'Set RIPPLE_MINIFLARE to an installed Miniflare module');
const { Miniflare } = await import(pathToFileURL(process.env.RIPPLE_MINIFLARE).href);
const root = fileURLToPath(new URL('../../../../', import.meta.url)).replace(/\/$/, '');
const directory = await mkdtemp(join(tmpdir(), 'ripple-worker-'));
const source = `
import {trackAsync} from 'ripple';
globalThis.rendererLoaded = true;
module server {
  export async function* rows(afterId: number) {
    if (afterId === 999) throw new Error('expired cursor');
    while (afterId < 400) {
      afterId += 100;
      globalThis.pulls = (globalThis.pulls ?? 0) + 1;
      yield {cursor: afterId};
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
import {rows} from server;
export function App() @{
  const result = trackAsync(() => rows(0));
  <><head><title>{result.value.cursor}</title></head><p>{result.value.cursor}</p><style>p { color: red }</style></>
}`;
function imports(code) {
	for (const [specifier, relative] of [
		['ripple/internal/server', '../../src/runtime/internal/server/index.js'],
		['ripple', '../../src/runtime/index-server.js'],
	])
		code = code.replaceAll(
			`'${specifier}'`,
			JSON.stringify(fileURLToPath(new URL(relative, import.meta.url))),
		);
	return code;
}
const rpc = fileURLToPath(new URL('../../src/runtime/internal/server/rpc.js', import.meta.url));
const adapter = fileURLToPath(new URL('../../../adapter/src/rpc.js', import.meta.url));
const renderer = fileURLToPath(new URL('../../src/server/index.js', import.meta.url));
await writeFile(
	join(directory, 'source.mjs'),
	imports(compile(source, '/Worker.tsrx', { serverOnly: true }).code),
);
await writeFile(
	join(directory, 'ssr.mjs'),
	imports(compile(source, '/Worker.tsrx', { mode: 'server' }).code),
);
await writeFile(
	join(directory, 'rpc.mjs'),
	`
import {AsyncLocalStorage} from 'node:async_hooks';
import {create_rpc_handler} from ${JSON.stringify(adapter)};
import {executeServerFunction} from ${JSON.stringify(rpc)};
const runtime = { createAsyncContext() { const context = new AsyncLocalStorage(); return {run: (s, fn) => context.run(s, fn), getStore: () => context.getStore()}; } };
export const handler = create_rpc_handler({'12345678': () => import('./source.mjs').then(m => m._$_server_$_.rows)}, runtime, executeServerFunction);
export default { async fetch(request) {
  if (globalThis.rendererLoaded) throw Error('renderer imported into RPC worker');
  const response = await handler(request);
  if (globalThis.rendererLoaded) throw Error('renderer evaluated during RPC');
  return response;
} };
`,
);
await writeFile(
	join(directory, 'document.mjs'),
	`import {App} from './ssr.mjs'; import {render, getCss} from ${JSON.stringify(renderer)}; export default {async fetch() { const result = await render(App); if (globalThis.pulls !== 1) throw Error('SSR pulled ahead'); return new Response(result.head + result.body + getCss(result.css)); } };`,
);
await writeFile(
	join(directory, 'shared.mjs'),
	`
import {handler} from './rpc.mjs';
import {App} from './ssr.mjs';
import {render} from ${JSON.stringify(renderer)};
export default { async fetch(request) {
  if (new URL(request.url).pathname === '/') return new Response((await render(App)).body);
  const response = await handler(request);
  response.headers.set('X-Renderer-Loaded', String(globalThis.rendererLoaded));
  return response;
} };
`,
);
async function bundle(name) {
	const result = await build({
		root,
		configFile: false,
		logLevel: 'silent',
		ssr: { target: 'webworker', noExternal: true },
		build: {
			write: false,
			ssr: join(directory, name + '.mjs'),
			minify: true,
			rollupOptions: { external: ['node:async_hooks'] },
		},
	});
	return result.output.find((c) => c.type === 'chunk').code;
}
const scripts = {
	document: await bundle('document'),
	rpc: await bundle('rpc'),
	shared: await bundle('shared'),
};
assert(!scripts.rpc.includes('SSR pulled ahead'));
assert(!scripts.rpc.includes('rendererLoaded=!0'));
const worker = (name) =>
	new Miniflare({
		modules: true,
		script: scripts[name],
		compatibilityDate: '2026-07-30',
		compatibilityFlags: ['nodejs_compat'],
	});
let documentWorker;
let rpcWorker;
let sharedWorker;
const stats = {};
try {
	documentWorker = worker('document');
	let start = performance.now();
	const html = await (await documentWorker.dispatchFetch('https://app.test/')).text();
	stats.document_ms = performance.now() - start;
	stats.html_bytes = Buffer.byteLength(html);
	assert(html.includes('"cursor":100'));
	assert(html.includes('"c":1'));
	assert(html.includes('<title>'));
	assert(/color:\s*red/.test(html));
	await documentWorker.dispose();
	documentWorker = undefined;
	await new Promise((resolve) => setTimeout(resolve, 50));
	rpcWorker = worker('rpc');
	const request = (cursor) =>
		rpcWorker.dispatchFetch('https://app.test/_$_ripple_rpc_$_/12345678', {
			method: 'POST',
			body: devalue.stringify([cursor]),
		});
	start = performance.now();
	let stream = read_stream(await request(100));
	assert.equal((await stream.next()).value.cursor, 200);
	stats.rpc_cold_first_ms = performance.now() - start;
	assert.equal((await stream.next()).value.cursor, 300);
	const pending = stream.next();
	// Terminate the invocation while next() is waiting; no generator memory survives.
	const interrupted = assert.rejects(pending, RpcTransportError);
	await rpcWorker.dispose();
	await interrupted;
	rpcWorker = worker('rpc');
	start = performance.now();
	stream = read_stream(await request(300));
	assert.equal((await stream.next()).value.cursor, 400);
	assert.equal((await stream.next()).done, true);
	stats.recovery_ms = performance.now() - start;
	start = performance.now();
	stream = read_stream(await request(400));
	assert.equal((await stream.next()).done, true);
	stats.rpc_warm_complete_ms = performance.now() - start;
	stream = read_stream(await request(999));
	await assert.rejects(stream.next(), /expired cursor/);
	sharedWorker = worker('shared');
	start = performance.now();
	let sharedResponse = await sharedWorker.dispatchFetch(
		'https://app.test/_$_ripple_rpc_$_/12345678',
		{ method: 'POST', body: devalue.stringify([400]) },
	);
	await sharedResponse.text();
	stats.shared_cold_rpc_ms = performance.now() - start;
	assert.equal(sharedResponse.headers.get('X-Renderer-Loaded'), 'true');
	await (await sharedWorker.dispatchFetch('https://app.test/')).text();
	start = performance.now();
	sharedResponse = await sharedWorker.dispatchFetch('https://app.test/_$_ripple_rpc_$_/12345678', {
		method: 'POST',
		body: devalue.stringify([400]),
	});
	await sharedResponse.text();
	stats.shared_warm_rpc_ms = performance.now() - start;
	stats.shared_js_bytes = Buffer.byteLength(scripts.shared);
	stats.rpc_js_bytes = Buffer.byteLength(scripts.rpc);
	stats.ssr_js_bytes = Buffer.byteLength(scripts.document);
	console.log(JSON.stringify(stats, null, 2));
} finally {
	await sharedWorker?.dispose();
	await documentWorker?.dispose();
	await rpcWorker?.dispose();
	await rm(directory, { recursive: true, force: true });
}
