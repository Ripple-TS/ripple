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

	it('parses bare fragments as native TSRX templates with statement children', () => {
		const ast = parseModule(
			`function bar(): JSX.Element | null {
				return <>
					if (x) {
						<div>"works"</div>
					} else {
						return null;
					}

					<style>
						div { color: red }
					</style>
				</>;
			}`,
			'App.tsrx',
		);

		const returned = ast.body[0].body.body[0].argument;
		expect(returned.type).toBe('Tsrx');
		expect(returned.children.map((child) => child.type)).toEqual(['IfStatement', 'Element']);
	});

	it('keeps explicit TSX islands as TSX', () => {
		const ast = parseModule('const x = <tsx><div>{value}</div><></></tsx>;', 'App.tsrx');

		const value = ast.body[0].declarations[0].init;
		expect(value.type).toBe('Tsx');
		expect(value.children.map((child) => child.type)).toEqual(['JSXElement', 'JSXFragment']);
	});

	it('allows component as a normal identifier', () => {
		const ast = parseModule('const component = 1; export default component;', 'identifier.tsrx');

		expect(ast.body.map((node) => node.type)).toEqual([
			'VariableDeclaration',
			'ExportDefaultDeclaration',
		]);
	});
});
