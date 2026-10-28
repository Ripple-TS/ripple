import { describe, expect, it } from 'vitest';
import { acorn } from '@tsrx/core';
import { compile } from '../src/index.js';

const source = `import { Hydrate as Boundary, track } from 'ripple';
import { condition } from 'ripple/hydration';
function Child() @{ console.log('child setup'); <p>child</p> }
export function App() @{
 const enabled = track(false);
 <Boundary when={condition(() => enabled.value)}><Child /></Boundary>
}`;

describe('Hydrate target integration', () => {
	it('uses lazy generic children through import aliases without another template placeholder', () => {
		const { code, errors } = compile(source, 'App.tsrx');
		expect(errors).toEqual([]);
		expect(code).toContain('render_component(Boundary, __anchor');
		expect(code).toMatch(/children: _\$_\.tsrx_element\([\s\S]*render_component\(Child/);
		expect(code).not.toContain('template(`<!>');
	});
	it('keeps dynamic components and reactive strategy values on the normal component path', () => {
		const { code, errors } = compile(
			`import { Hydrate, track } from 'ripple'; import { idle } from 'ripple/hydration';
export function App() @{ const component = track(Hydrate); const when = track(() => idle()); <{component} {when}><p>child</p></{component}> }`,
			'App.tsrx',
		);
		expect(errors).toEqual([]);
		expect(code).toContain('when');
		expect(code).toContain('tsrx_element');
	});
	it('records additional branch IDs once and omits metadata in client-only builds', () => {
		const source = `import { Hydrate } from 'ripple'; import { never } from 'ripple/hydration';
export function App({ show }) @{ <Hydrate when={never()}>@if (show) { <p>one</p> } @else { <p>two</p> }</Hydrate> }`;
		const client = compile(source, 'App.tsrx').code;
		const server = compile(source, 'App.tsrx', { mode: 'server' }).code;
		expect(client).toContain('alternate.h = 1;');
		expect(client).not.toContain('consequent.h');
		expect(client).not.toContain('check_branch');
		expect(server).toContain('branch_marker(0)');
		expect(server).toContain('branch_marker(1)');
		expect(compile(source, 'App.tsrx', { hydration: false }).code).not.toMatch(
			/\.h =|check_branch/,
		);
	});
});

describe('compact conditional metadata', () => {
	it('adds nothing to single-branch output', () => {
		const { code } = compile(
			`export function App({ show }) @{ @if (show) { <p>shown</p> } }`,
			'App.tsrx',
		);
		expect(code).not.toMatch(/\.h =|check_branch/);
	});

	it.each([
		`@if (choice === 0) { <p>first</p> } @else if (choice === 1) { <p>second</p> } @else { <p>third</p> }`,
		`@switch (choice) { @case 0: { <p>first</p> } @case 1: { <p>second</p> } @default: { <p>third</p> } }`,
	])('annotates additional hoisted branches only once: %s', (body) => {
		const source = `export function App({ choice }) @{ ${body} }`;
		const { code } = compile(source, 'App.tsrx');
		const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
		const metadata = ast.body.filter(
			(statement) =>
				statement.type === 'ExpressionStatement' &&
				statement.expression.type === 'AssignmentExpression' &&
				statement.expression.left.type === 'MemberExpression' &&
				statement.expression.left.property.name === 'h',
		);
		expect(metadata.map((statement) => statement.expression.right.value)).toEqual([1, 2]);
		expect(code.match(/\.h =/g)).toHaveLength(2);
		expect(code).not.toContain('check_branch');
		expect(compile(source, 'App.tsrx', { hydration: false }).code).not.toMatch(
			/\.h =|check_branch/,
		);
	});

	it.each([
		`@if (show) { <p>{this.label}</p> } @else { <p>{this.other}</p> }`,
		`@switch (show) { @case true: { <p>{this.label}</p> } @default: { <p>{this.other}</p> } }`,
	])('annotates local branch functions when their captures prevent hoisting: %s', (body) => {
		const { code } = compile(`export function App({ show }) @{ ${body} }`, 'App.tsrx');
		expect(code).toMatch(/var (?:alternate|switch_case_default) = \(__anchor\) =>/);
		expect(code).toMatch(/(?:alternate|switch_case_default)\.h = 1;/);
		expect(code.match(/\.h =/g)).toHaveLength(1);
		expect(code).not.toContain('check_branch');
	});
});
