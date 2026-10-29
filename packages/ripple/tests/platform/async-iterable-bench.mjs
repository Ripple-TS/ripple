// pnpm --filter ripple exec node --expose-gc tests/platform/async-iterable-bench.mjs [baseline checkout]
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { writeHeapSnapshot } from 'node:v8';
import { compile } from '@tsrx/ripple';
import { render, executeServerFunction } from 'ripple/server';
import { build } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';
import { read_stream } from '../../src/runtime/internal/client/rpc-stream.js';
import * as devalue from 'devalue';

const directory = await mkdtemp(join(tmpdir(), 'ripple-stream-bench-'));
const root = fileURLToPath(new URL('../../../../', import.meta.url)).replace(/\/$/, '');
const source = `import {trackAsync} from 'ripple';
import {active_block} from 'ripple/internal/server';
export let promise = false;
export let delay = 0;
export let setups = 0;
export let tokens = [];
export let trees = [];
export function configure(p, d) { promise=p; delay=d; setups=0; tokens=[]; trees=[]; }
export async function* rows(afterId) {
  setups++;
  const token = { memory: new Uint8Array(10000) };
  tokens.push(new WeakRef(token));
  while (afterId < 300) {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    afterId+=100;
    yield {cursor: afterId};
    if (!token.memory) throw Error('unreachable');
  }
}
export function App() @{
  trees.push(new WeakRef(active_block));
  const value=trackAsync(() => promise ? (async () => { let result; for await (const next of rows(0)) result=next; return result; })() : rows(0));
  <p>{value.value.cursor}</p>
}`;
let code = compile(source, '/bench.tsrx', { mode: 'server' }).code;
for (const [name, file] of [
	['ripple/internal/server', '../../src/runtime/internal/server/index.js'],
	['ripple', '../../src/runtime/index-server.js'],
])
	code = code.replaceAll(`'${name}'`, JSON.stringify(new URL(file, import.meta.url).href));
await writeFile(join(directory, 'server.mjs'), code);
const fixture = await import(pathToFileURL(join(directory, 'server.mjs')).href);
async function sample_renders() {
	for (let i = 0; i < 50; i++) await render(fixture.App);
	global.gc?.();
	const before = process.memoryUsage().heapUsed;
	const start = performance.now();
	for (let i = 0; i < 500; i++) await render(fixture.App);
	return { before, throughput: 500000 / (performance.now() - start) };
}
const results = {};
try {
	for (const promise of [true, false]) {
		fixture.configure(promise, 2);
		let start = performance.now();
		const cpu = process.cpuUsage();
		let html = '';
		await render(fixture.App, {
			stream: {
				push(chunk) {
					html += chunk;
				},
				close() {},
				error(error) {
					throw error;
				},
			},
		});
		const ready_ms = performance.now() - start;
		let bytes = Buffer.byteLength(html);
		if (!promise) {
			const response = await executeServerFunction(fixture.rows, devalue.stringify([100]));
			const text = await response.text();
			bytes += Buffer.byteLength(text);
			const stream = read_stream(new Response(text));
			assert.equal((await stream.next()).value.cursor, 200);
			assert.equal((await stream.next()).value.cursor, 300);
			assert((await stream.next()).done);
		}
		const total_ms = performance.now() - start;
		const cpu_used = process.cpuUsage(cpu);
		const setups = fixture.setups;
		fixture.configure(promise, 0);
		const { before, throughput } = await sample_renders();
		let continuation;
		if (!promise) {
			continuation = read_stream(
				await executeServerFunction(fixture.rows, devalue.stringify([100])),
			);
			await continuation.next();
		}
		await new Promise(setImmediate);
		global.gc?.();
		await new Promise(setImmediate);
		global.gc?.();
		// A heap snapshot completes V8's collection, including optimized-frame roots.
		writeHeapSnapshot(join(directory, 'heap.heapsnapshot'));
		const active_producers = fixture.tokens.filter((token) => token.deref() !== undefined).length;
		const live_trees = fixture.trees.filter((tree) => tree.deref() !== undefined).length;
		assert.equal(live_trees, 0);
		assert.equal(active_producers, promise ? 0 : 1);
		await continuation?.return();
		await new Promise(setImmediate);
		global.gc?.();
		await new Promise(setImmediate);
		global.gc?.();
		const live_producers = fixture.tokens.filter((token) => token.deref() !== undefined).length;
		assert.equal(live_producers, 0);
		results[promise ? 'single_response' : 'handoff'] = {
			ready_ms,
			total_ms,
			body_bytes: bytes,
			source_setups: setups,
			ssr_per_second: throughput,
			cpu_us: cpu_used.user + cpu_used.system,
			markers: (html.match(/<!--/g) ?? []).length,
			heap_delta: process.memoryUsage().heapUsed - before,
			live_producers,
			active_producers,
			live_trees,
		};
	}
	for (const checkout of [root, process.argv[2]].filter(Boolean)) {
		const sizes = {};
		for (const async of [false, true]) {
			const source = `import {mount, track, trackAsync} from 'ripple'; function App() @{ const n = ${async ? 'trackAsync(() => Promise.resolve(1))' : 'track(1)'}; <p>{n.value}</p> } mount(App,{target:document.body});`;
			const compiler = await import(
				pathToFileURL(join(checkout, 'packages/tsrx-ripple/src/index.js')).href
			);
			let code = compiler.compile(source, '/size.tsrx', { hydration: false }).code;
			for (const [name, path] of [
				['ripple/internal/client', 'internal/client/index.js'],
				['ripple', 'index-client.js'],
			])
				code = code.replaceAll(
					`'${name}'`,
					JSON.stringify(join(checkout, 'packages/ripple/src/runtime', path)),
				);
			const entry = join(directory, 'size.js');
			await writeFile(entry, code);
			const output = await build({
				root,
				configFile: false,
				logLevel: 'silent',
				plugins: [ripple({ ssr: false, excludeRippleExternalModules: true })],
				build: {
					write: false,
					minify: 'esbuild',
					target: 'esnext',
					rollupOptions: { input: entry, output: { entryFileNames: 'size.js' } },
				},
			});
			const chunks = output.output.filter((c) => c.type === 'chunk');
			const entryChunk = chunks.find((c) => c.isEntry);
			assert(!Object.keys(entryChunk.modules).some((id) => id.endsWith('/async-iterator.js')));
			sizes[async ? 'promise' : 'sync'] = {
				entry_gzip: gzipSync(entryChunk.code, { level: 9 }).byteLength,
				emitted_gzip: chunks.reduce((n, c) => n + gzipSync(c.code, { level: 9 }).byteLength, 0),
			};
		}
		results[checkout === root ? 'current_bundle' : 'baseline_bundle'] = sizes;
	}
	console.log(JSON.stringify(results, null, 2));
} finally {
	await rm(directory, { recursive: true, force: true });
}
