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
					if (x) {
						<div>"works"</div>
					} else {
						<span>"empty"</span>
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
	});

	it('rejects return statements inside native TSRX templates', () => {
		expect(() =>
			parseModule(
				`function bar() {
					return <>
						if (x) {
							return null;
						}
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
		const ast = parseModule('const x = <tsx><div>"value"</div></tsx>;', 'App.tsrx');

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
