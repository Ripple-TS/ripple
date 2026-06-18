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

describe('@tsrx/ripple-new compile — source map', () => {
	// Self-contained base64-VLQ decoder (no codec dep resolvable from this pkg).
	const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	const c2i = {};
	for (let i = 0; i < B64.length; i++) c2i[B64[i]] = i;
	function decodeSegment(s) {
		const nums = [];
		let shift = 0;
		let value = 0;
		for (const ch of s) {
			const x = c2i[ch];
			value += (x & 31) << shift;
			if (x & 32) {
				shift += 5;
			} else {
				const neg = value & 1;
				value >>= 1;
				nums.push(neg ? -value : value);
				value = 0;
				shift = 0;
			}
		}
		return nums;
	}
	function decodeMappings(str) {
		let srcIdx = 0;
		let srcLine = 0;
		let srcCol = 0;
		const out = [];
		str.split(';').forEach((group, genLine) => {
			let genCol = 0;
			if (!group) return;
			for (const seg of group.split(',')) {
				const a = decodeSegment(seg);
				genCol += a[0];
				if (a.length > 1) {
					srcIdx += a[1];
					srcLine += a[2];
					srcCol += a[3];
				}
				out.push({ genLine, genCol, srcIdx, srcLine, srcCol });
			}
		});
		return out;
	}

	const src = `import { useState } from 'ripple-new';

export function App() @{
  const [n, setN] = useState(0);
  <button onClick={() => setN(n + 1)}>{n as number}</button>
}

export function Second() @{
  <div>{'hi'}</div>
}`;

	it('emits a v3 map with the source name and inlined sourcesContent', () => {
		const out = compile(src, 'App.tsrx');
		expect(out.map).toBeTruthy();
		expect(out.map.version).toBe(3);
		expect(out.map.sources).toContain('App.tsrx');
		expect(out.map.sourcesContent).toEqual([src]);
		expect(typeof out.map.mappings).toBe('string');
		expect(out.map.mappings.length).toBeGreaterThan(0);
	});

	it('anchors each component declaration to its source line', () => {
		const out = compile(src, 'App.tsrx');
		const segs = decodeMappings(out.map.mappings);
		const genLines = out.code.split('\n');
		const srcLines = src.split('\n');

		// Single source, and every mapping points inside the original source.
		for (const s of segs) {
			expect(s.srcIdx).toBe(0);
			expect(s.srcLine).toBeGreaterThanOrEqual(0);
			expect(s.srcLine).toBeLessThan(srcLines.length);
		}

		// The generated `export const App = function App(...` line maps (at
		// column 0) to the source `export function App() @{` line.
		const declGen = genLines.findIndex((l) => l.startsWith('export const App = function App'));
		const declSeg = segs.find((s) => s.genLine === declGen && s.genCol === 0);
		expect(declSeg).toBeTruthy();
		expect(srcLines[declSeg.srcLine]).toContain('export function App(');
	});

	it('maps setup-statement tokens to their exact source positions (real esrap maps)', () => {
		const out = compile(src, 'App.tsrx');
		const segs = decodeMappings(out.map.mappings);
		const genLines = out.code.split('\n');
		const srcLines = src.split('\n');

		// The generated `const [n, setN] = useState(0, _h$0);` line carries
		// per-token mappings (not just a line anchor) back to the source
		// `const [n, setN] = useState(0);` line.
		const genIdx = genLines.findIndex((l) => l.includes('useState(0, _h$0)'));
		expect(genIdx).toBeGreaterThan(-1);
		const lineSegs = segs.filter((s) => s.genLine === genIdx);
		expect(lineSegs.length).toBeGreaterThanOrEqual(3); // many tokens, not one anchor

		// Pick the `useState` token in the generated line and assert it maps to
		// the `useState` token in the source.
		const genCol = genLines[genIdx].indexOf('useState');
		const srcSeg = lineSegs.find((s) => s.genCol === genCol);
		expect(srcSeg).toBeTruthy();
		expect(srcLines[srcSeg.srcLine].slice(srcSeg.srcCol)).toMatch(/^useState/);
	});
});

describe('@tsrx/ripple-new compile — mode flag (SSR plumbing)', () => {
	const src = `export function App() @{ <div>{'hi'}</div> }`;

	it("mode: 'client' is the default and produces identical output", () => {
		const a = compile(src, 'App.tsrx').code;
		const b = compile(src, 'App.tsrx', { mode: 'client' }).code;
		expect(b).toBe(a);
	});

	it("mode: 'server' emits HTML-string-building bodies importing 'ripple-new/server'", () => {
		const out = compile(
			`export function G(props) @{ <p class={props.c}>{props.name as string}</p> }`,
			'G.tsrx',
			{ mode: 'server' },
		).code;
		expect(out).toContain("from 'ripple-new/server'");
		expect(out).toContain('ssrText(');
		expect(out).toContain('ssrAttr(');
		// No client template-clone codegen in server mode.
		expect(out).not.toContain('template(');
	});

	it("mode: 'server' lowers control flow to string builders with block markers", () => {
		const out = compile(
			`export function L(p) @{ <ul>@for (const x of p.items) { <li>{x as any}</li> }</ul> }`,
			'l.tsrx',
			{ mode: 'server' },
		).code;
		expect(out).toContain('ssrBlock(');
		expect(out).toMatch(/from 'ripple-new\/server'/);
	});

	it('an unknown mode throws', () => {
		expect(() => compile(src, 'App.tsrx', { mode: 'bogus' })).toThrow(/Unknown compile mode/);
	});

	it("mode: 'server' emits namespaced attribute names literally (no [object Object])", () => {
		const ns = `export function A() @{ <svg><use xlink:href="#a" /></svg> }`;
		const server = compile(ns, 'A.tsrx', { mode: 'server' }).code;
		expect(server).not.toContain('object Object');
		expect(server).toContain('xlink:href');
		// Client and server agree on the namespaced attribute name.
		const client = compile(ns, 'A.tsrx', { mode: 'client' }).code;
		expect(client).toContain('xlink:href');
	});
});

describe('@tsrx/ripple-new compile — JSX component as a value (root.render shape)', () => {
	const imp = `import { createRoot } from 'ripple-new';`;

	it('lowers root.render(<App/>) to createElement(App, {}) and imports createElement', () => {
		const out = code(`${imp} createRoot(x).render(<App/>);`);
		expect(out).toContain('createElement(App, {})');
		expect(out).toContain('render(createElement(App, {}))');
		expect(out).toMatch(/import \{[^}]*\bcreateElement\b[^}]*\} from 'ripple-new'/);
		expect(out).not.toContain('<App');
	});

	it('passes attributes (and spreads) through as the props object', () => {
		const out = code(`${imp} createRoot(x).render(<App count={1} name="hi" {...rest}/>);`);
		expect(out).toContain('createElement(App, { count: 1, name: "hi", ...rest })');
	});

	it('lowers a JSX component value in setup position (const el = <App/>)', () => {
		const out = code(`${imp} const el = <App x={2}/>;`);
		expect(out).toContain('createElement(App, { x: 2 })');
	});

	it('lowers nested JSX in a prop value recursively', () => {
		const out = code(`${imp} createRoot(x).render(<App icon={<Icon size={3}/>}/>);`);
		expect(out).toContain('createElement(App, { icon: createElement(Icon, { size: 3 }) })');
	});

	it('drops key= from the props (meaningless at value position)', () => {
		const out = code(`${imp} createRoot(x).render(<App key={1} a={2}/>);`);
		expect(out).toContain('createElement(App, { a: 2 })');
	});

	it('rejects a host element used as a value', () => {
		expect(() => code(`${imp} createRoot(x).render(<div/>);`)).toThrow(
			/Host element <div\/> used as a value/,
		);
	});

	it('rejects a component element with children used as a value', () => {
		expect(() => code(`${imp} createRoot(x).render(<App><Child/></App>);`)).toThrow(
			/with children used as a value/,
		);
	});

	it('rejects a fragment used as a value', () => {
		expect(() => code(`${imp} createRoot(x).render(<>{'a'}</>);`)).toThrow(
			/Fragment used as a value/,
		);
	});
});

describe('@tsrx/ripple-new compile — Actions bundle', () => {
	it('routes a dynamic <form action={fn}> to setFormAction (not setAttribute)', () => {
		const out = code(`export function F(props) @{ <form action={props.act}>{'x'}</form> }`);
		expect(out).toContain('setFormAction(');
		expect(out).toMatch(/import \{[^}]*\bsetFormAction\b[^}]*\} from 'ripple-new'/);
	});

	it('leaves a static string action as a native attribute', () => {
		const out = code(`export function F() @{ <form action="/submit">{'x'}</form> }`);
		// Inlined into the template() HTML string, not routed to setFormAction.
		expect(out).toMatch(/template\([^)]*action=/);
		expect(out).not.toContain('setFormAction(');
	});

	it('routes <button formAction={fn}> to setFormAction', () => {
		const out = code(
			`export function F(props) @{ <form>{'x'}<button formAction={props.act}>{'go'}</button></form> }`,
		);
		expect(out).toContain('setFormAction(');
		expect(out).toContain('"formaction"');
	});

	it('injects hook slots for useActionState / useFormStatus / useOptimistic', () => {
		const out = code(
			`export function F(props) @{
				const [s, a] = useActionState(props.fn, 0);
				const st = useFormStatus();
				const [o, add] = useOptimistic(s);
				<form action={a}>{String(s) + st.pending + o as string}</form>
			}`,
		);
		expect(out).toMatch(/useActionState\([^)]*_h\$\d+\)/);
		expect(out).toMatch(/useFormStatus\(_h\$\d+\)/);
		expect(out).toMatch(/useOptimistic\([^)]*_h\$\d+\)/);
	});
});
