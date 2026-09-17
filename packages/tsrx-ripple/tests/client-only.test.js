import { compile } from '../src/index.js';
import { describe, expect, it } from 'vitest';

const source = `import { track } from 'ripple';

export function App() @{
	const count = track(0);
	<div>
		<span>{count.value}</span>
		<b>static</b>
		@if (count.value > 1) {
			<i>many</i>
		}
	</div>
}`;

describe('@tsrx/ripple client-only output (hydration: false)', () => {
	it('emits bare DOM reads, no cursor pops, and no track hashes', () => {
		const { code, errors } = compile(source, 'App.tsrx', { hydration: false });
		expect(errors).toEqual([]);
		expect(code).toContain('div.firstChild');
		expect(code).not.toContain('_$_.hydrating');
		expect(code).not.toContain('_$_.hydrate_child');
		expect(code).not.toContain('_$_.hydrate_sibling');
		expect(code).not.toContain('_$_.pop(');
		expect(code).toMatch(/_\$_\.track\(0, __block\)/);
	});

	it('keeps the hydration cursor and hashes by default', () => {
		const { code } = compile(source, 'App.tsrx');
		expect(code).toContain('_$_.hydrating ? _$_.hydrate_child() : div.firstChild');
		expect(code).toContain('_$_.hydrating && _$_.pop(div)');
		expect(code).toMatch(/_\$_\.track\(0, __block, '[0-9a-z]+'\)/);
	});
});

describe('@tsrx/ripple class and template helpers by shape', () => {
	it('uses the string-only set_class for a class it can prove is a string', () => {
		const { code } = compile(
			`import { track } from 'ripple';
export function App() @{
	const on = track(false);
	<>
		<div class={(on.value ? 'a' : '') + ' b'} />
		<span class={\`x \${on.value}\`} />
	</>
}`,
			'App.tsrx',
		);
		expect(code).toContain('_$_.set_class(');
		expect(code).not.toContain('_$_.set_class_value(');
	});

	it('uses set_class_value for an array or object class', () => {
		const { code } = compile(
			`import { track } from 'ripple';
export function App() @{
	const on = track(false);
	<div class={['a', { b: on.value }]} />
}`,
			'App.tsrx',
		);
		expect(code).toContain('_$_.set_class_value(');
	});

	it('parses a template in the SVG namespace through template_ns', () => {
		const { code } = compile(
			`import { track } from 'ripple';
export function App() @{
	const on = track(false);
	<svg>
		@if (on.value) {
			<circle r="1" />
		}
	</svg>
}`,
			'App.tsrx',
		);
		expect(code).toContain('_$_.template_ns(');
		expect(code).toContain('_$_.template(`<svg>');
	});
});

describe('@tsrx/ripple dynamic elements by shape', () => {
	const source = `import { track } from 'ripple';
export function App({ attrs }) @{
	const tag = track('circle');
	<svg>
		<{tag.value} {...attrs} />
		<{tag.value} r="1">{'child'}</{tag.value}>
	</svg>
}`;

	it('drives a childless dynamic element from the render function', () => {
		const { code } = compile(source, 'App.tsrx', { hydration: false });
		// No block, no thunks: the tag and the props are read by the render function.
		expect(code).toContain(
			"__prev.a = _$_.dynamic(__prev.a, __prev._a, __prev._b.value, __prev._c, 'svg');",
		);
		expect(code).toContain("a: _$_.dynamic_init(node, () => tag.value, () => attrs, 'svg'),");
		// Children keep the composite block, which owns them.
		expect(code).toContain('_$_.composite(');
		expect(code).toMatch(/_\$_\.composite\(\s*\(\) => tag\.value,\s*node_1,/);
	});

	it('lets a composite block claim the server element while hydrating', () => {
		const { code } = compile(source, 'App.tsrx');
		expect(code).toContain("_$_.dynamic(__prev.a, __prev._a, __prev._b.value, __prev._c, 'svg')");
		expect(code).toContain("a: _$_.dynamic_init(node, () => tag.value, () => attrs, 'svg'),");
	});
});

describe('@tsrx/ripple hoisted tracked reads in a render function', () => {
	it('reads a prop or tracked const `.value` once per run', () => {
		const { code } = compile(
			`import { track, type Derived } from 'ripple';
export function Icon({ name }: { name: Derived<string> }) @{
	const local = track(1);
	<svg class={'i-' + name.value} data-a={name.value} data-b={local.value} data-c={local.value}></svg>
}`,
			'App.tsrx',
			{ hydration: false },
		);
		expect(code).toContain('var __name_value = __prev._a.value;');
		expect(code).toContain('var __local_value = __prev._b.value;');
		expect(code).toContain("var __d = 'i-' + __name_value;");
		expect(code).not.toMatch(/__prev\._a\.value[^;]*__prev\._a\.value/);
	});
});
