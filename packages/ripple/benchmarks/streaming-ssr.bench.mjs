/**
 * Streaming SSR benchmark: Ripple buffered vs Ripple streaming vs React 19
 * (`renderToReadableStream` + Suspense — the same out-of-order streaming
 * model), on equivalent page shapes.
 *
 * Solid is deliberately absent: the only Solid in this workspace is the
 * 2.0 beta pulled in by tsrx-solid, whose server build does not expose
 * renderToStream / renderToStringAsync, and tsrx-solid itself is a
 * client-only target. Revisit when either grows an SSR streaming surface.
 *
 * Run with: pnpm --filter ripple bench:ssr
 * (or: node packages/ripple/benchmarks/streaming-ssr.bench.mjs)
 */

process.env.NODE_ENV = 'production';

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Compile the TSRX page for the server target (same pipeline as the tests)
// ---------------------------------------------------------------------------

const { compile } = await import('@tsrx/ripple');
const source = readFileSync(join(__dirname, 'page.tsrx'), 'utf-8');
const compiled = compile(source, 'page.tsrx', { mode: 'server' }).code.replace(
	/import\s*\{([^}]+)\}\s*from\s*['"]ripple['"]/g,
	(_m, specifiers) => `import {${specifiers}} from 'ripple/server'`,
);

const compiled_dir = join(__dirname, '.compiled');
mkdirSync(compiled_dir, { recursive: true });
const compiled_path = join(compiled_dir, 'page.server.mjs');
writeFileSync(compiled_path, compiled);

const { Page, SyncPage, state } = await import(pathToFileURL(compiled_path).href);
const { render } = await import('ripple/server');

// ---------------------------------------------------------------------------
// React baseline (resolved through vite-plugin-react's dependency tree)
// ---------------------------------------------------------------------------

let React = null;
let ReactDOMServer = null;
try {
	const require_react = createRequire(
		pathToFileURL(join(__dirname, '../../vite-plugin-react/package.json')).href,
	);
	React = require_react('react');
	ReactDOMServer = require_react('react-dom/server.node');
} catch {
	console.warn('[bench] react/react-dom not resolvable — skipping the React baseline');
}

// ---------------------------------------------------------------------------
// Workload
// ---------------------------------------------------------------------------

const SYNC_ROWS = 200;
const BOUNDARIES = 4;
const ROWS_PER_BOUNDARY = 50;
const DATA_DELAY_MS = 10;
const MANY_BOUNDARIES = 50;

const sync_rows = Array.from({ length: SYNC_ROWS }, (_, i) => `sync row ${i}`);
const boundary_rows = (index) =>
	Array.from({ length: ROWS_PER_BOUNDARY }, (_, i) => `boundary ${index} row ${i}`);

function configureRipple(boundaries, delay_ms) {
	state.syncRows = sync_rows;
	state.indices = Array.from({ length: boundaries }, (_, i) => i);
	state.loaders = state.indices.map((index) => {
		const rows = boundary_rows(index);
		return delay_ms === 0
			? () => Promise.resolve(rows)
			: () => new Promise((resolve) => setTimeout(() => resolve(rows), delay_ms));
	});
}

function makeReactPage(boundaries, delay_ms) {
	const el = React.createElement;

	const makeResource = (rows) => {
		let status = 'pending';
		let result;
		const promise =
			delay_ms === 0
				? Promise.resolve(rows).then((value) => {
						status = 'done';
						result = value;
					})
				: new Promise((resolve) =>
						setTimeout(() => {
							status = 'done';
							result = rows;
							resolve(rows);
						}, delay_ms),
					);
		return {
			read() {
				if (status === 'pending') throw promise;
				return result;
			},
		};
	};

	function AsyncSection({ resource }) {
		const rows = resource.read();
		return el(
			'section',
			{ className: 'boundary' },
			el(
				'ul',
				null,
				rows.map((row) => el('li', { className: 'row', key: row }, row)),
			),
		);
	}

	function ReactPage() {
		return el(
			'main',
			null,
			el('h1', null, 'Streaming benchmark'),
			el(
				'ul',
				{ className: 'sync' },
				sync_rows.map((row) => el('li', { key: row }, row)),
			),
			Array.from({ length: boundaries }, (_, index) =>
				el(
					React.Suspense,
					{ key: index, fallback: el('p', { className: 'loading' }, `loading ${index}`) },
					el(AsyncSection, { resource: makeResource(boundary_rows(index)) }),
				),
			),
		);
	}

	return el(ReactPage);
}

// ---------------------------------------------------------------------------
// Runners — each returns { ttfb, total } in ms for a single render
// ---------------------------------------------------------------------------

async function runRippleBuffered(component) {
	const start = performance.now();
	await render(component);
	const total = performance.now() - start;
	return { ttfb: total, total };
}

async function runRippleStreaming(component) {
	let first = 0;
	let bytes = 0;
	const sink = {
		push(chunk) {
			if (first === 0) first = performance.now();
			bytes += chunk.length;
		},
		close() {},
		error() {},
	};
	const start = performance.now();
	await render(component, { stream: sink });
	const total = performance.now() - start;
	void bytes;
	return { ttfb: first - start, total };
}

async function runReactStreaming(element) {
	const start = performance.now();
	const stream = await ReactDOMServer.renderToReadableStream(element);
	const reader = stream.getReader();
	let first = 0;
	while (true) {
		const { done } = await reader.read();
		if (first === 0) first = performance.now();
		if (done) break;
	}
	const total = performance.now() - start;
	return { ttfb: first - start, total };
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

async function measure(label, iterations, warmup, run) {
	for (let i = 0; i < warmup; i++) {
		await run();
	}
	const ttfbs = [];
	const totals = [];
	const started = performance.now();
	for (let i = 0; i < iterations; i++) {
		const { ttfb, total } = await run();
		ttfbs.push(ttfb);
		totals.push(total);
	}
	const elapsed = performance.now() - started;
	const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
	return {
		scenario: label,
		'ttfb (ms)': mean(ttfbs).toFixed(2),
		'total (ms)': mean(totals).toFixed(2),
		'ops/s': (iterations / (elapsed / 1000)).toFixed(1),
	};
}

const results = [];

// 1. Fully synchronous page — streaming machinery must cost ~nothing
configureRipple(0, 0);
results.push(
	await measure('sync page · ripple buffered', 300, 50, () => runRippleBuffered(SyncPage)),
);
results.push(
	await measure('sync page · ripple streaming', 300, 50, () => runRippleStreaming(SyncPage)),
);
if (ReactDOMServer) {
	results.push(
		await measure('sync page · react streaming', 300, 50, () =>
			runReactStreaming(makeReactPage(0, 0)),
		),
	);
}

// 2. Async boundaries resolving in microtasks — pure machinery overhead
configureRipple(BOUNDARIES, 0);
results.push(
	await measure(`${BOUNDARIES} boundaries (microtask) · ripple buffered`, 200, 30, () =>
		runRippleBuffered(Page),
	),
);
results.push(
	await measure(`${BOUNDARIES} boundaries (microtask) · ripple streaming`, 200, 30, () =>
		runRippleStreaming(Page),
	),
);
if (ReactDOMServer) {
	results.push(
		await measure(`${BOUNDARIES} boundaries (microtask) · react streaming`, 200, 30, () =>
			runReactStreaming(makeReactPage(BOUNDARIES, 0)),
		),
	);
}

// 3. Async boundaries with real data latency — the case streaming exists for:
//    TTFB should be ~free for streaming and ~DATA_DELAY_MS for buffered
configureRipple(BOUNDARIES, DATA_DELAY_MS);
results.push(
	await measure(`${BOUNDARIES} boundaries (${DATA_DELAY_MS}ms data) · ripple buffered`, 40, 5, () =>
		runRippleBuffered(Page),
	),
);
results.push(
	await measure(
		`${BOUNDARIES} boundaries (${DATA_DELAY_MS}ms data) · ripple streaming`,
		40,
		5,
		() => runRippleStreaming(Page),
	),
);
if (ReactDOMServer) {
	results.push(
		await measure(
			`${BOUNDARIES} boundaries (${DATA_DELAY_MS}ms data) · react streaming`,
			40,
			5,
			() => runReactStreaming(makeReactPage(BOUNDARIES, DATA_DELAY_MS)),
		),
	);
}

// 4. Many boundaries — scaling of the flush-unit bookkeeping
configureRipple(MANY_BOUNDARIES, 0);
results.push(
	await measure(`${MANY_BOUNDARIES} boundaries (microtask) · ripple streaming`, 100, 20, () =>
		runRippleStreaming(Page),
	),
);
if (ReactDOMServer) {
	results.push(
		await measure(`${MANY_BOUNDARIES} boundaries (microtask) · react streaming`, 100, 20, () =>
			runReactStreaming(makeReactPage(MANY_BOUNDARIES, 0)),
		),
	);
}

console.table(results);
