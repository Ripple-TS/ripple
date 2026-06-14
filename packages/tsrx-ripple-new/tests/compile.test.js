import { describe, it, expect } from 'vitest';
import { compile } from '../src/index.js';

// First automated coverage for the @tsrx/ripple-new compiler. Asserts the
// stable, user-facing contract of `compile()`: the emitted runtime shape, hook
// slot injection, that every supported construct compiles, and that the
// maintained rejection guards fire. Codegen internals (variable names, exact
// template strings) are intentionally NOT pinned beyond what the runtime relies
// on, so refactors don't churn these tests.

const code = (src, name = 'x.tsrx') => compile(src, name).code;

describe('@tsrx/ripple-new compile — output shape', () => {
	it('returns { code, map }', () => {
		const out = compile(`export function A() @{ <div>{'a'}</div> }`, 'a.tsrx');
		expect(out).toHaveProperty('code');
		expect(out).toHaveProperty('map');
		expect(typeof out.code).toBe('string');
	});

	it('emits a component as a runtime function taking the scope as first arg', () => {
		const out = code(`export function Hello() @{ <div class="x">{'hi'}</div> }`);
		expect(out).toContain('export const Hello = function Hello(__s');
		// No raw TSRX `@{` block marker survives codegen.
		expect(out).not.toContain('@{');
	});

	it('hoists element markup into a template() call and imports from ripple-new', () => {
		const out = code(`export function Hello() @{ <button>{'hi'}</button> }`);
		expect(out).toMatch(/from 'ripple-new'/);
		expect(out).toContain('template(');
	});

	it('registers delegated events for inline handlers', () => {
		const out = code(`export function B() @{ <button onClick={() => {}}>{'x'}</button> }`);
		expect(out).toContain('delegateEvents(["click"])');
	});
});

describe('@tsrx/ripple-new compile — hook slot injection', () => {
	it('appends a module-level Symbol slot as the last argument of a hook call', () => {
		const out = code(
			`import { useState } from 'ripple-new';
export function C() @{ const [n, setN] = useState(0); <span>{n as number}</span> }`,
			'counter.tsrx',
		);
		// Slot symbol is declared via Symbol.for and tagged with the hook name...
		expect(out).toMatch(/Symbol\.for\(".*useState#0"\)/);
		// ...and passed as the trailing argument of the hook call.
		expect(out).toMatch(/useState\(0, _h\$0\)/);
	});

	it('allocates a distinct slot per hook call site', () => {
		const out = code(
			`import { useState } from 'ripple-new';
export function C() @{ const [a, setA] = useState(0); const [b, setB] = useState(1); <span>{(a + b) as number}</span> }`,
			'two.tsrx',
		);
		const slots = out.match(/Symbol\.for\("[^"]*useState#\d+"\)/g) || [];
		expect(slots).toHaveLength(2);
		expect(out).toMatch(/useState\(0, _h\$0\)/);
		expect(out).toMatch(/useState\(1, _h\$1\)/);
	});
});

describe('@tsrx/ripple-new compile — construct coverage', () => {
	const cases = {
		'@if / @else': `export function C(p) @{ <div>@if (p.x) { <span>{'a'}</span> } @else { <span>{'b'}</span> }</div> }`,
		'@for keyed': `export function L(p) @{ <ul>@for (const x of p.items; key x.id) { <li>{x.label as string}</li> }</ul> }`,
		'@switch / @case / @default': `export function S(p) @{ <div>@switch (p.k) { @case 'a': { <span>{'A'}</span> } @default: { <span>{'D'}</span> } }</div> }`,
		'@try / @catch': `export function T(p) @{ <>@try { <span>{'ok'}</span> } @catch (err, reset) { <span>{err.message as string}</span> }</> }`,
		'dynamic tag <{expr}>': `export function D(p) @{ <div><{p.comp} label={p.label} /></div> }`,
		createPortal: `import { createPortal } from 'ripple-new';
export function M() @{ <section>{createPortal(() => @{ <div class="m">{'x'}</div> }, document.body)}</section> }`,
		fragment: `export function F() @{ <><span>{'a'}</span><span>{'b'}</span></> }`,
		'scoped <style>': `export function St() @{ <><div class="card">{'x'}</div><style>.card { color: red; }</style></> }`,
		ref: `import { useRef } from 'ripple-new';
export function R() @{ const r = useRef(null); <div ref={r}>{'x'}</div> }`,
		'nested component call': `function Inner() @{ <span>{'i'}</span> }
export function Outer() @{ <div><Inner /></div> }`,
	};

	for (const [name, src] of Object.entries(cases)) {
		it(`compiles ${name}`, () => {
			expect(() => compile(src, 'c.tsrx')).not.toThrow();
			// Codegen fully lowered the TSRX block — no raw `@{` marker remains.
			expect(code(src)).not.toContain('@{');
		});
	}
});

describe('@tsrx/ripple-new compile — rejected patterns', () => {
	it('rejects an async function component with an actionable message', () => {
		expect(() => compile(`export async function A() @{ <div>{1}</div> }`, 'a.tsrx')).toThrow(
			/declared `async`/,
		);
		expect(() => compile(`export async function A() @{ <div>{1}</div> }`, 'a.tsrx')).toThrow(
			/use\(promise\)/,
		);
	});

	it('rejects an async exported-default component', () => {
		expect(() =>
			compile(`export default async function A() @{ <div>{1}</div> }`, 'a.tsrx'),
		).toThrow(/declared `async`/);
	});

	it('rejects a generator (function*) component', () => {
		expect(() => compile(`export function* G() @{ <div>{1}</div> }`, 'g.tsrx')).toThrow(
			/generator/,
		);
	});

	it('rejects `@for await` (async iteration) — must fail loudly', () => {
		expect(() =>
			compile(
				`export function L(p) @{ <ul>@for await (const x of p.items) { <li>{x as any}</li> }</ul> }`,
				'l.tsrx',
			),
		).toThrow();
	});

	it('rejects multiple ref attributes on a single element', () => {
		expect(() =>
			compile(
				`import { useRef } from 'ripple-new';
export function R() @{ const a = useRef(null); const b = useRef(null); <div ref={a} ref={b}>{'x'}</div> }`,
				'r.tsrx',
			),
		).toThrow(/multiple `ref/);
	});
});
