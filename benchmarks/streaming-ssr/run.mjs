/**
 * Streaming SSR benchmark: Ripple buffered vs Ripple streaming vs Solid 2.0
 * (`renderToStream` from @solidjs/web) vs React 19
 * (`renderToReadableStream` + Suspense) — all three streamers use the same
 * shell-then-out-of-order-chunks model, on equivalent page shapes.
 *
 * The Ripple and Solid pages are authored in TSRX (page.tsrx /
 * page-solid.tsrx) and compiled at startup through the pipelines the
 * frameworks actually use (@tsrx/ripple server target; @tsrx/solid →
 * babel-preset-solid `generate: 'ssr', hydratable: true`). The React page is
 * hand-built with createElement + Suspense + a thrown-promise resource.
 *
 * Run:  pnpm --filter @benchmarks/streaming-ssr bench
 *  (or: node benchmarks/streaming-ssr/run.mjs)
 */

// Set BEFORE importing anything that resolves a framework runtime: react-dom
// picks its production build off process.env.NODE_ENV at require time.
process.env.NODE_ENV = 'production';

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compiled_dir = join(__dirname, '.compiled');
mkdirSync(compiled_dir, { recursive: true });

// ---------------------------------------------------------------------------
// Compile the Ripple page for the server target (same pipeline as the tests)
// ---------------------------------------------------------------------------

const { compile: compileRipple } = await import('@tsrx/ripple');
const ripple_source = readFileSync(join(__dirname, 'page.tsrx'), 'utf-8');
const ripple_compiled = compileRipple(ripple_source, 'page.tsrx', { mode: 'server' }).code.replace(
	/import\s*\{([^}]+)\}\s*from\s*['"]ripple['"]/g,
	(_m, specifiers) => `import {${specifiers}} from 'ripple/server'`,
);
const ripple_path = join(compiled_dir, 'page.ripple.server.mjs');
writeFileSync(ripple_path, ripple_compiled);

const { Page, SyncPage, state } = await import(pathToFileURL(ripple_path).href);
const { render } = await import('ripple/server');

// ---------------------------------------------------------------------------
// Compile the Solid page: @tsrx/solid → Solid-flavoured JSX → babel-preset-solid
// SSR output against @solidjs/web (hydratable, matching a production setup)
// ---------------------------------------------------------------------------

const { compile: compileSolid } = await import('@tsrx/solid');
const { transformAsync } = await import('@babel/core');
const { default: presetSolid } = await import('babel-preset-solid');

const solid_source = readFileSync(join(__dirname, 'page-solid.tsrx'), 'utf-8');
const solid_jsx = compileSolid(solid_source, 'page-solid.tsrx').code;
const solid_ssr = await transformAsync(solid_jsx, {
	filename: 'page-solid.jsx',
	babelrc: false,
	configFile: false,
	presets: [[presetSolid, { generate: 'ssr', hydratable: true, moduleName: '@solidjs/web' }]],
});
const solid_path = join(compiled_dir, 'page.solid.server.mjs');
writeFileSync(solid_path, solid_ssr.code);

const {
	Page: SolidPage,
	SyncPage: SolidSyncPage,
	state: solid_state,
} = await import(pathToFileURL(solid_path).href);
const { renderToStream, createComponent } = await import('@solidjs/web');

// ---------------------------------------------------------------------------
// React baseline
// ---------------------------------------------------------------------------

const React = (await import('react')).default;
const ReactDOMServer = await import('react-dom/server.node');

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

function configureState(target, boundaries, delay_ms) {
	target.syncRows = sync_rows;
	target.indices = Array.from({ length: boundaries }, (_, i) => i);
	target.loaders = target.indices.map((index) => {
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
	const sink = {
		push() {
			if (first === 0) first = performance.now();
		},
		close() {},
		error() {},
	};
	const start = performance.now();
	await render(component, { stream: sink });
	const total = performance.now() - start;
	return { ttfb: first - start, total };
}

function runSolidStreaming(component) {
	return new Promise((resolve, reject) => {
		const start = performance.now();
		let first = 0;
		renderToStream(() => createComponent(component, {}), {
			onError: reject,
		}).pipe({
			write() {
				if (first === 0) first = performance.now();
			},
			end() {
				resolve({ ttfb: first - start, total: performance.now() - start });
			},
		});
	});
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

async function scenario(label, iterations, warmup, boundaries, delay_ms, { sync = false } = {}) {
	configureState(state, boundaries, delay_ms);
	results.push(
		await measure(`${label} · ripple buffered`, iterations, warmup, () =>
			runRippleBuffered(sync ? SyncPage : Page),
		),
	);
	results.push(
		await measure(`${label} · ripple streaming`, iterations, warmup, () =>
			runRippleStreaming(sync ? SyncPage : Page),
		),
	);
	configureState(solid_state, boundaries, delay_ms);
	results.push(
		await measure(`${label} · solid streaming`, iterations, warmup, () =>
			runSolidStreaming(sync ? SolidSyncPage : SolidPage),
		),
	);
	results.push(
		await measure(`${label} · react streaming`, iterations, warmup, () =>
			runReactStreaming(makeReactPage(boundaries, delay_ms)),
		),
	);
}

// 1. Fully synchronous page — streaming machinery must cost ~nothing
await scenario('sync page', 300, 50, 0, 0, { sync: true });

// 2. Async boundaries resolving in microtasks — pure machinery overhead
await scenario(`${BOUNDARIES} boundaries (microtask)`, 200, 30, BOUNDARIES, 0);

// 3. Async boundaries with real data latency — the case streaming exists for:
//    TTFB should be ~free for streaming and ~DATA_DELAY_MS for buffered
await scenario(
	`${BOUNDARIES} boundaries (${DATA_DELAY_MS}ms data)`,
	40,
	5,
	BOUNDARIES,
	DATA_DELAY_MS,
);

// 4. Many boundaries — scaling of the flush/segment bookkeeping
await scenario(`${MANY_BOUNDARIES} boundaries (microtask)`, 100, 20, MANY_BOUNDARIES, 0);

console.table(results);
