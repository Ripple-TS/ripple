import { describe, expect, it } from 'vitest';
import { parseModule } from '../../src/index.js';

describe('TSRX parser', () => {
	it('parses returned tags as native TSRX elements', () => {
		const ast = parseModule('function MyApp() { return <div />; }', 'App.tsrx');

		const returned = ast.body[0].body.body[0].argument;
		expect(returned.type).toBe('Element');
		expect(returned.id.name).toBe('div');
		expect(returned.selfClosing).toBe(true);
	});

	it('parses returned tags after comments as return arguments', () => {
		const ast = parseModule('function MyApp() { return /* comment */ <div />; }', 'App.tsrx');

		const returned = ast.body[0].body.body[0].argument;
		expect(returned.type).toBe('Element');
		expect(returned.id.name).toBe('div');
	});

	it('honors ASI for returned tags after a newline', () => {
		const ast = parseModule(
			`function MyApp() {
				return
				<div />;
			}`,
			'App.tsrx',
		);

		const body = ast.body[0].body.body;
		expect(body[0].type).toBe('ReturnStatement');
		expect(body[0].argument).toBeNull();
		expect(body[1].type).toBe('Element');
		expect(body[1].id.name).toBe('div');
	});

	it('parses mixed scalar and template return branches', () => {
		const ast = parseModule(
			`function MyApp() {
				if (ready) {
					return "Ready";
				}
				if (empty) {
					return null;
				}
				return <div />;
			}`,
			'App.tsrx',
		);

		const [ready, empty, fallback] = ast.body[0].body.body;
		expect(ready.consequent.body[0].argument.value).toBe('Ready');
		expect(empty.consequent.body[0].argument.value).toBeNull();
		expect(fallback.argument.type).toBe('Element');
	});

	it('parses bare fragments as native TSRX templates with statement children', () => {
		const ast = parseModule(
			`function bar(): JSX.Element | null {
				return <>
					@if (x) {
						<div>works</div>
					} else {
						<span>empty</span>
					}

					<style>
						div { color: red }
					</style>
				</>;
			}`,
			'App.tsrx',
		);

		const returned = ast.body[0].body.body[0].argument;
		expect(returned.type).toBe('TsrxFragment');
		expect(returned.children.map((child) => child.type)).toEqual(['IfStatement', 'Element']);
		expect(returned.children[0].metadata.tsrx_render_control_flow).toBe(true);
	});

	it('parses raw text children without string delimiters', () => {
		const ast = parseModule(
			'const x = <div>This is some string in the html<SomeComponent /></div>;',
			'App.tsrx',
		);

		const value = ast.body[0].declarations[0].init;
		expect(value.children.map((child) => child.type)).toEqual(['JSXText', 'Element']);
		expect(value.children[0].value).toBe('This is some string in the html');
	});

	it('parses fenced code blocks inside native templates', () => {
		const ast = parseModule(
			`const x = <div>
				---
					const a = 5;
				---

				<span>{a}</span>
			</div>;`,
			'App.tsrx',
		);

		const value = ast.body[0].declarations[0].init;
		expect(value.children.map((child) => child.type)).toEqual(['TSRXCodeBlock', 'Element']);
		expect(value.children[0].body.map((child) => child.type)).toEqual(['VariableDeclaration']);
	});

	it('parses regular JS control flow inside fenced code blocks as ordinary JS', () => {
		const ast = parseModule(
			`const x = <div>
				---
					let total = 0;
					if (values.length > 0) {
						total += values[0];
					}
					for (const value of values) {
						total += value;
					}
					switch (total) {
						case 0:
							total = 1;
							break;
						default:
							total += 1;
					}
					try {
						total += load();
					} catch (error) {
						total = -1;
					}
				---

				<p>{total}</p>
			</div>;`,
			'App.tsrx',
		);

		const codeBlock = ast.body[0].declarations[0].init.children[0];
		expect(codeBlock.type).toBe('TSRXCodeBlock');
		expect(codeBlock.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'IfStatement',
			'ForOfStatement',
			'SwitchStatement',
			'TryStatement',
		]);
		expect(codeBlock.body.every((child) => child.metadata?.tsrx_render_control_flow !== true)).toBe(
			true,
		);
		expect(codeBlock.body[1].consequent.body.map((child) => child.type)).toEqual([
			'ExpressionStatement',
		]);
	});

	it('rejects return statements inside native TSRX templates', () => {
		expect(() =>
			parseModule(
				`function bar() {
					return <>
						---
							return null;
						---
					</>;
				}`,
				'App.tsrx',
			),
		).toThrow('Return statements are not allowed inside TSRX templates.');
	});

	it('treats tsrx as a normal element name', () => {
		const tag = 'tsrx';
		const ast = parseModule(`const wrapper = <${tag}><div /></${tag}>;`, 'App.tsrx');

		const value = ast.body[0].declarations[0].init;
		expect(value.type).toBe('Element');
		expect(value.id.name).toBe('tsrx');
		expect(value.children[0].type).toBe('Element');
	});

	it('allows self-closing tsrx elements like any other element', () => {
		const tag = 'tsrx';
		const ast = parseModule(`const wrapper = <${tag} />;`, 'App.tsrx');

		const value = ast.body[0].declarations[0].init;
		expect(value.type).toBe('Element');
		expect(value.id.name).toBe('tsrx');
		expect(value.selfClosing).toBe(true);
	});

	it('parses native fragments as TsrxFragment nodes', () => {
		const ast = parseModule('const x = <><div>{value}</div><></></>;', 'App.tsrx');

		const value = ast.body[0].declarations[0].init;
		expect(value.type).toBe('TsrxFragment');
		expect(value.children.map((child) => child.type)).toEqual(['Element', 'TsrxFragment']);
	});

	it('treats plain tsx tags like ordinary elements', () => {
		const ast = parseModule('const x = <tsx><div>value</div></tsx>;', 'App.tsrx');

		const value = ast.body[0].declarations[0].init;
		expect(value.type).toBe('Element');
		expect(value.id.name).toBe('tsx');
		expect(value.children[0].type).toBe('Element');
	});

	it('allows component as a normal identifier', () => {
		const ast = parseModule('const component = 1; export default component;', 'identifier.tsrx');

		expect(ast.body.map((node) => node.type)).toEqual([
			'VariableDeclaration',
			'ExportDefaultDeclaration',
		]);
	});
});
