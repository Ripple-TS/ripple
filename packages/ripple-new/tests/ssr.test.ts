import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../tsrx-ripple-new/src/index.js';
import * as RT from 'ripple-new/server';

const FIXTURES = join(process.cwd(), 'packages/ripple-new/tests/_fixtures');

// SSR Phase 1: server render of static markup + dynamic text + attributes +
// nested components. The compiler (mode: 'server') emits HTML-string-building
// bodies that import from 'ripple-new/server'; we eval them with that same
// runtime module injected, then call render() and snapshot { head, body, css }.

function evalServer(source: string, file: string): Record<string, any> {
	let { code } = compile(source, file, { mode: 'server' });
	// Bind the server-runtime import to the live module, and capture exports.
	code = code.replace(
		/import\s*\{([^}]*)\}\s*from\s*['"]ripple-new\/server['"];?/g,
		'const {$1} = __rt;',
	);
	code = code.replace(/export const (\w+) =/g, 'const $1 = __exports.$1 =');
	code = code.replace(/export default (\w+);?/g, '__exports.default = $1;');
	const fn = new Function('__rt', '__exports', code + '\nreturn __exports;');
	return fn(RT, {});
}

const fixture = (name: string) => readFileSync(join(FIXTURES, `${name}.tsrx`), 'utf8');

const basic = evalServer(fixture('basic'), 'basic.tsrx');
const ssr = evalServer(fixture('ssr'), 'ssr.tsrx');

describe('SSR Phase 1 — basic fixtures', () => {
	it('renders static markup, dynamic text, and attributes', async () => {
		expect(await RT.render(basic.Hello)).toMatchSnapshot('Hello');
		expect(await RT.render(basic.Counter, { n: 5 })).toMatchSnapshot('Counter');
		expect(await RT.render(basic.Greet, { name: 'Ada' })).toMatchSnapshot('Greet');
		expect(await RT.render(basic.Mixed)).toMatchSnapshot('Mixed');
	});

	it('renders SVG and MathML (static + dynamic attrs)', async () => {
		expect(await RT.render(basic.SvgStatic)).toMatchSnapshot('SvgStatic');
		expect(await RT.render(basic.SvgDynamic, { klass: 'c', w: 30, fill: 'blue' })).toMatchSnapshot(
			'SvgDynamic',
		);
		expect(
			await RT.render(basic.MathDynamic, { display: 'block', klass: 'm', value: 'x' }),
		).toMatchSnapshot('MathDynamic');
	});
});

describe('SSR Phase 1 — ssr fixture (style / spread / innerHTML / components / hooks / css)', () => {
	it('renders dynamic object style with camelCase keys', async () => {
		expect(await RT.render(ssr.Styled, { klass: 'a', color: 'red', label: 'hi' })).toMatchSnapshot(
			'Styled',
		);
	});

	it('renders boolean attributes, void elements, and dynamic attrs', async () => {
		expect(await RT.render(ssr.Field, { value: 'v', disabled: true })).toMatchSnapshot(
			'Field-disabled',
		);
		expect(await RT.render(ssr.Field, { value: 'v', disabled: false })).toMatchSnapshot(
			'Field-enabled',
		);
	});

	it('serializes spread attributes', async () => {
		expect(await RT.render(ssr.Spread, { attrs: { id: 'x', 'data-k': '1' } })).toMatchSnapshot(
			'Spread',
		);
	});

	it('emits innerHTML raw (unescaped)', async () => {
		expect(await RT.render(ssr.Raw, { html: '<b>bold</b>' })).toMatchSnapshot('Raw');
	});

	it('renders nested component composition', async () => {
		expect(await RT.render(ssr.Card, { title: 'T', tag: 'new' })).toMatchSnapshot('Card');
	});

	it('collects scoped CSS into the css field', async () => {
		const out = await RT.render(ssr.Scoped);
		expect(out).toMatchSnapshot('Scoped');
		expect(out.css).toContain('.box.tsrx-');
		expect(out.body).toContain('class="box tsrx-');
	});
});

describe('SSR Phase 1 — semantics', () => {
	it('escapes dynamic text and attribute values', async () => {
		const out = await RT.render(basic.Greet, { name: '<script>"x"' });
		expect(out.body).toContain('&lt;script&gt;');
		expect(out.body).not.toContain('<script>');
	});

	it('hooks render their initial value; effects do NOT run on the server', async () => {
		const onEffect = vi.fn();
		const out = await RT.render(ssr.HookView, { start: 7, onEffect });
		expect(out.body).toContain('<span class="n">7</span>');
		expect(out.body).toContain('<span class="d">14</span>'); // useMemo ran once
		expect(out.body).toMatch(/id=":in-[0-9a-z]+:"/); // deterministic useId
		expect(onEffect).not.toHaveBeenCalled(); // useEffect is a no-op on the server
	});

	it('returns the { head, body, css } shape', async () => {
		const out = await RT.render(basic.Hello);
		expect(Object.keys(out).sort()).toEqual(['body', 'css', 'head']);
		expect(out.head).toBe('');
	});

	it('still rejects truly-unsupported server constructs (e.g. <Activity>)', () => {
		// Control flow is supported as of Phase 3; Activity is not.
		expect(() =>
			compile(
				`export function C(p) @{ <Activity mode="hidden"><span>{'a'}</span></Activity> }`,
				'c.tsrx',
				{
					mode: 'server',
				},
			),
		).toThrow(/does not support `<Activity>`/);
	});
});

describe('SSR — ssrSpread attribute-name validation', () => {
	it('skips injection-unsafe attr names but keeps valid ones', () => {
		const out = RT.ssrSpread({
			'data-x': '1',
			'aria-label': 'ok',
			'xlink:href': '#a',
			'bad name': '2',
			'x onload=alert(1)': '1',
			'a>': '1',
			c: '<>',
		});
		// Valid names (including data-*, aria-*, namespaced) are emitted; values
		// are still escaped by escapeAttr (which escapes `&` and `"`).
		expect(out).toContain(' data-x="1"');
		expect(out).toContain(' aria-label="ok"');
		expect(out).toContain(' xlink:href="#a"');
		expect(out).toContain(' c="<>"');
		// Injection-unsafe names are dropped entirely — never reach the output.
		expect(out).not.toContain('bad name');
		expect(out).not.toContain('onload');
		expect(out).not.toContain('a>');
		expect(out).not.toContain('alert');
	});
});
