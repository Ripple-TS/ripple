import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../tsrx-ripple-new/src/index.js';
import * as RT from 'ripple-new/server';

// SSR Phase 4 — Suspense + data serialization. render() is async: a
// use(thenable) that hasn't resolved suspends the pass (the @try shows
// @pending), render() awaits it and re-renders, so the @try ends up showing its
// resolved success arm (or @catch on rejection). Each resolved value is appended
// to `body` as an inline data <script> for the client to seed on hydration.

const FIXTURES = join(process.cwd(), 'packages/ripple-new/tests/_fixtures');

function evalServer(source: string, file: string): Record<string, any> {
	let { code } = compile(source, file, { mode: 'server' });
	code = code.replace(
		/import\s*\{([^}]*)\}\s*from\s*['"]ripple-new\/server['"];?/g,
		'const {$1} = __rt;',
	);
	code = code.replace(/export const (\w+) =/g, 'const $1 = __exports.$1 =');
	const fn = new Function('__rt', '__exports', code + '\nreturn __exports;');
	return fn(RT, {});
}
const m = evalServer(
	readFileSync(join(FIXTURES, 'ssr-suspense.tsrx'), 'utf8'),
	'ssr-suspense.tsrx',
);

const OPEN = '<!--[-->';
const CLOSE = '<!--]-->';
const seed = (json: string) =>
	`<script type="application/json" data-ripple-new-suspense>${json}</script>`;

function deferred<T>() {
	let resolve!: (v: T) => void;
	let reject!: (e: any) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('SSR Phase 4 — render() awaits use(promise)', () => {
	it('@try awaits use(promise) and renders the resolved success arm + seed', async () => {
		const out = await RT.render(m.Boundary, { promise: Promise.resolve('hi') });
		// Nested ranges: outer = try-slot, inner = the resolved success arm.
		expect(out.body).toBe(
			`<div id="box">${OPEN}${OPEN}<span class="ok">hi</span>${CLOSE}${CLOSE}</div>` +
				seed('["hi"]'),
		);
	});

	it('a bare use(promise) with no @try boundary is awaited and resolved', async () => {
		const out = await RT.render(m.AsyncLeaf, { promise: Promise.resolve('hello') });
		expect(out.body).toBe('<div id="leaf">hello</div>' + seed('["hello"]'));
	});

	it('routes a rejected use(promise) to @catch (rejected boundaries are not seeded)', async () => {
		const out = await RT.render(m.Boundary, { promise: Promise.reject(new Error('nope')) });
		expect(out.body).toBe(
			`<div id="box">${OPEN}${OPEN}<span class="err">nope</span>${CLOSE}${CLOSE}</div>`,
		);
		expect(out.body).not.toContain('data-ripple-new-suspense');
	});

	it('resolves NESTED suspense across multiple passes (outer gates inner)', async () => {
		const out = await RT.render(m.Nested, {
			outer: Promise.resolve('O'),
			inner: Promise.resolve('I'),
		});
		// Two nested @try, each = slot + arm → four nested ranges around the span.
		expect(out.body).toBe(
			`<div id="outer">${OPEN}${OPEN}${OPEN}${OPEN}<span class="both">O:I</span>${CLOSE}${CLOSE}${CLOSE}${CLOSE}</div>` +
				seed('["O","I"]'),
		);
	});

	it('resolves independent SIBLING boundaries (distinct call-site keys)', async () => {
		const out = await RT.render(m.Siblings, {
			a: Promise.resolve('A'),
			b: Promise.resolve('B'),
		});
		expect(out.body).toBe(
			`<div id="sibs">${OPEN}${OPEN}<span class="a">A</span>${CLOSE}${CLOSE}${OPEN}${OPEN}<span class="b">B</span>${CLOSE}${CLOSE}</div>` +
				seed('["A","B"]'),
		);
	});

	it('seeds values in render (depth-first) order', async () => {
		// The seed array order is what the client consumes by cursor on hydrate, so
		// it must match the order use() is reached during render.
		const out = await RT.render(m.Nested, {
			outer: Promise.resolve('first'),
			inner: Promise.resolve('second'),
		});
		const json = out.body.match(/data-ripple-new-suspense>(.*?)<\/script>/)![1];
		expect(JSON.parse(json)).toEqual(['first', 'second']);
	});

	it('escapes `<` in the serialized seed payload so it cannot break out of <script>', async () => {
		const out = await RT.render(m.AsyncLeaf, { promise: Promise.resolve('</script><x>') });
		// Body text is HTML-escaped as usual…
		expect(out.body).toContain('<div id="leaf">&lt;/script&gt;&lt;x&gt;</div>');
		// …and the JSON payload escapes every `<` to < (no literal `<` in it).
		const json = out.body.match(/data-ripple-new-suspense>(.*?)<\/script>$/)![1];
		expect(json).not.toContain('<');
		expect(JSON.parse(json)).toEqual(['</script><x>']);
	});

	it('keeps two concurrent, interleaved renders isolated (no global clobbering)', async () => {
		// render() holds per-pass state (scope, suspense queue, css, seed list) in
		// module globals. Two render()s suspended at the same time must not bleed
		// into each other across the await. Force interleaving with deferreds:
		// start both (both suspend), then resolve in reverse order.
		const dA = deferred<string>();
		const dB = deferred<string>();
		const pA = RT.render(m.Siblings, { a: dA.promise, b: Promise.resolve('A2') });
		const pB = RT.render(m.AsyncLeaf, { promise: dB.promise });
		dB.resolve('B1');
		dA.resolve('A1');
		const [a, b] = await Promise.all([pA, pB]);
		expect(a.body).toBe(
			`<div id="sibs">${OPEN}${OPEN}<span class="a">A1</span>${CLOSE}${CLOSE}${OPEN}${OPEN}<span class="b">A2</span>${CLOSE}${CLOSE}</div>` +
				seed('["A1","A2"]'),
		);
		// b must contain ONLY its own seed — not A's values leaking through SERIAL.
		expect(b.body).toBe('<div id="leaf">B1</div>' + seed('["B1"]'));
	});

	it('non-suspending components emit no seed <script>', async () => {
		const out = await RT.render(m.Boundary, { promise: Promise.resolve('x') });
		// (sanity: suspending one DOES seed)
		expect(out.body).toContain('data-ripple-new-suspense');
		const plain = evalServer(
			`export function Plain() @{ <div id="p">{'static'}</div> }`,
			'plain.tsrx',
		);
		const out2 = await RT.render(plain.Plain);
		expect(out2.body).toBe('<div id="p">static</div>');
		expect(out2.body).not.toContain('data-ripple-new-suspense');
	});

	it('a use(thenable) that never settles fails the render via the suspense deadline (no hang)', async () => {
		const prev = RT.getSsrSuspenseTimeout();
		RT.setSsrSuspenseTimeout(50);
		try {
			// A promise that never resolves/rejects — without the deadline this render
			// would hang forever (MAX_SUSPENSE_PASSES only bounds the pass COUNT, and
			// is checked BEFORE the await).
			const stuck = new Promise<string>(() => {});
			await expect(RT.render(m.AsyncLeaf, { promise: stuck })).rejects.toThrow(
				/did not settle within 50ms/,
			);
		} finally {
			RT.setSsrSuspenseTimeout(prev);
		}
	});

	// Regression: `use(thenable)` in JSX / control-flow EXPRESSION positions
	// (text holes, attributes, @if/@for/@switch heads) must get a stable server
	// call-site key, exactly like setup statements. Without it they fell back to
	// the shared base key '@' disambiguated only by render-order occurrence — so an
	// @if(use(...)) revealing new use() calls shifted the occurrence count and
	// sibling holes consumed each other's resolved values.
	it('keys use() in JSX/control-flow positions — siblings/nested do not cross values', async () => {
		const mod = evalServer(
			`export function App(p) @{
				<div>
					@if (use(p.show)) { <span class="x">{use(p.x) as string}</span> }
					<span class="y">{use(p.y) as string}</span>
				</div>
			}`,
			'cross.tsrx',
		);
		const out = await RT.render(mod.App, {
			show: Promise.resolve(true),
			x: Promise.resolve('X'),
			y: Promise.resolve('Y'),
		});
		// x must render "X" and y must render "Y" — NOT crossed (pre-fix: both "Y").
		expect(out.body).toContain('<span class="x">X</span>');
		expect(out.body).toContain('<span class="y">Y</span>');
		expect(out.body).not.toContain('<span class="x">Y</span>');
	});

	it('keys use() per call-site in an @for body (distinct value per iteration)', async () => {
		const mod = evalServer(
			`export function App(p) @{
				<ul>
					@for (const item of use(p.items)) { <li>{use(item.v) as string}</li> }
				</ul>
			}`,
			'forUse.tsrx',
		);
		const out = await RT.render(mod.App, {
			items: Promise.resolve([{ v: Promise.resolve('a') }, { v: Promise.resolve('b') }]),
		});
		expect(out.body).toContain('<li>a</li>');
		expect(out.body).toContain('<li>b</li>');
	});
});
