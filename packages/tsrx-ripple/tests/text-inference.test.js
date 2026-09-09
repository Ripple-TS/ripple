import { describe, expect, it } from 'vitest';
import { compile } from '@tsrx/ripple';

function output(expression, setup = '', params = 'props') {
	const source = `export function App(${params}) @{ ${setup} <div>before{${expression}}after</div> }`;
	return ['client', 'server'].map((mode) => compile(source, 'App.tsrx', { mode }).code);
}

function expect_text(expression, setup, params) {
	const [client, server] = output(expression, setup, params);
	expect(client).not.toMatch(/_\$_\.expression(?:_children)?\(/);
	expect(server).not.toContain('_$_.render_expression(');
	expect(server).toContain('_$_.escape(');
	return { client, server };
}

function expect_renderable(expression, setup, params) {
	const [client, server] = output(expression, setup, params);
	expect(client).toContain('_$_.expression(');
	expect(server).toContain('_$_.render_expression(');
}

describe('primitive text inference', () => {
	it.each([
		'String(props.value)',
		'Number(props.value)',
		'Boolean(props.value)',
		'BigInt(props.value)',
		'Date()',
		'typeof props.value',
		'props.value - 1',
		'props.value + 1',
		'props.value ** 2',
		'~props.value',
		'props.value > 0',
		'void props.call()',
		'(props.call(), BigInt(props.value))',
		'props.flag ? BigInt(props.value) : Number(props.value)',
		'BigInt(props.value) || 1n',
		'BigInt(props.value) satisfies bigint',
	])('uses text output for %s on client and server', (expression) => {
		expect_text(expression);
	});

	it.each(['String', 'Number', 'Boolean', 'BigInt', 'Date'])('respects a shadowed %s', (name) => {
		expect_renderable(`${name}()`, `const ${name} = props.render;`);
		expect_renderable(`${name}()`, '', `{ ${name} }`);
		expect_renderable(`${name}()`, `function ${name}() { return props.render(); }`);
	});

	it.each(['String', 'Number', 'Boolean', 'BigInt', 'Date'])(
		'respects visible writes to %s',
		(name) => {
			for (const target of [name, `globalThis.${name}`, `window['${name}']`]) {
				expect_renderable(`${name}()`, `${target} = props.render;`);
			}
			expect_renderable(`${name}()`, `({ replacement: ${name} } = props);`);
			expect_renderable(`${name}()`, `declare function ${name}(): unknown;`);
		},
	);

	it.each([
		'new Date()',
		'new Number(1)',
		'new String(1)',
		'props.render()',
		'props.flag ? BigInt(1) : props.render()',
		'(BigInt(1), props.render())',
		'String?.(props.value)',
		'BigInt?.(props.value)',
	])('keeps %s on the renderable path', (expression) => expect_renderable(expression));

	it('keeps numeric evidence separate from string concatenation', () => {
		const { server } = expect_text('Number(props.a) + Number(props.b)');
		expect(server).toContain("String(Number(props.a) + Number(props.b) ?? '')");
	});

	it('proves repeated references without treating sibling branches as cycles', () => {
		const { server } = expect_text('props.flag ? label : label', "const label = 'text';");
		expect(server).not.toContain('String(props.flag');
	});

	it('resolves an initializer in its declaring scope', () => {
		const { code } = compile(
			`const value = opaque;
			export function App() @{ const opaque = 'local'; <div>{value}</div> }`,
			'App.tsrx',
			{ mode: 'server' },
		);
		expect(code).toContain('_$_.render_expression(value');
	});

	it('erases satisfies while preserving its expression and side effects', () => {
		const { client, server } = expect_text('(props.call(), BigInt(props.value) satisfies bigint)');
		for (const code of [client, server]) {
			expect(code).not.toContain('satisfies');
			expect(code).toContain('props.call()');
			expect(code).toContain('BigInt(props.value)');
		}
	});
});
