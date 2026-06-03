import { describe, expect, it } from 'vitest';
import { parseModule } from '../../src/index.js';

function getReturned(source) {
	const ast = parseModule(source, 'App.tsrx');
	return ast.body[0].body.body[0].argument;
}

describe('TSRX parser', () => {
	it('parses returned tags as JSXElement nodes', () => {
		const returned = getReturned('function MyApp() { return <div />; }');

		expect(returned.type).toBe('JSXElement');
		expect(returned.openingElement.name.name).toBe('div');
		expect(returned.openingElement.selfClosing).toBe(true);
	});

	it('parses returned tags after comments as JSXElement return arguments', () => {
		const returned = getReturned('function MyApp() { return /* comment */ <div />; }');

		expect(returned.type).toBe('JSXElement');
		expect(returned.openingElement.name.name).toBe('div');
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
		expect(body[1].type).toBe('JSXElement');
		expect(body[1].openingElement.name.name).toBe('div');
	});

	it('parses mixed scalar and JSX return branches', () => {
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
		expect(fallback.argument.type).toBe('JSXElement');
	});

	it('parses native fragments as JSXFragment nodes', () => {
		const ast = parseModule('const x = <><div /></>;', 'App.tsrx');

		const value = ast.body[0].declarations[0].init;
		expect(value.type).toBe('JSXFragment');
		expect(value.openingFragment.type).toBe('JSXOpeningFragment');
		expect(value.closingFragment.type).toBe('JSXClosingFragment');
		expect(value.children.map((child) => child.type)).toEqual(['JSXElement']);
	});

	it('keeps ordinary tag names as JSX identifiers', () => {
		const ast = parseModule('const wrapper = <tsrx><div /></tsrx>;', 'App.tsrx');

		const value = ast.body[0].declarations[0].init;
		expect(value.type).toBe('JSXElement');
		expect(value.openingElement.name.name).toBe('tsrx');
		expect(value.children[0].type).toBe('JSXElement');
	});

	it('uses a template fence to split script setup and template output', () => {
		const returned = getReturned(`function App() { return <div>
			const x = 1
			---
			Hello
			{x}
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(returned.children[1].value).toBe('---');
		expect(returned.children[2].value).toContain('Hello');
	});

	it('allows JSX in the script side of a template fence', () => {
		const returned = getReturned(`function App() { return <div>
			const x = <div />
			---
			<div />
			{x}
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXElement',
			'JSXExpressionContainer',
		]);
		expect(returned.children[0].declarations[0].init.type).toBe('JSXElement');
	});

	it('does not treat closing-tag text inside script strings as markup', () => {
		const returned = getReturned(`function App() { return <div>
			const x = "</div><div>"
			---
			Hello
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXText',
		]);
		expect(returned.children[0].declarations[0].init.value).toBe('</div><div>');
	});

	it('does not treat fence text inside script strings as a fence', () => {
		const returned = getReturned(`function App() { return <div>
			const x = "---"
			---
			Hello
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXText',
		]);
		expect(returned.children[0].declarations[0].init.value).toBe('---');
	});

	it('does not treat fence text inside script regex literals as a fence', () => {
		const returned = getReturned(`function App() { return <div>
			const x = /---/
			---
			Hello
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXText',
		]);
		expect(returned.children[0].declarations[0].init.type).toBe('Literal');
		expect(returned.children[0].declarations[0].init.regex.pattern).toBe('---');
	});

	it('does not treat fence or closing-tag text inside template literals as syntax', () => {
		const returned = getReturned(`function App() { return <div>
			const x = \`</div>
---
<div>\`
			---
			Hello
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXText',
		]);
		expect(returned.children[0].declarations[0].init.type).toBe('TemplateLiteral');
	});

	it('does not treat fence text in script comments as a fence', () => {
		const returned = getReturned(`function App() { return <div>
			// ---
			const x = 1
			---
			Hello
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXText',
		]);
	});

	it('does not treat fence text in block comments as a fence', () => {
		const returned = getReturned(`function App() { return <div>
			/* --- */
			const x = 1
			---
			Hello
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXText',
		]);
	});

	it('does not let script JSX closing tags close the outer template', () => {
		const returned = getReturned(`function App() { return <div>
			const x = <section>
				<div>Script JSX</div>
			</section>
			---
			{x}
		</div>; }`);

		const scriptJsx = returned.children[0].declarations[0].init;
		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXExpressionContainer',
		]);
		expect(scriptJsx.type).toBe('JSXElement');
		expect(scriptJsx.openingElement.name.name).toBe('section');
		expect(
			scriptJsx.children.find((child) => child.type === 'JSXElement').openingElement.name.name,
		).toBe('div');
	});

	it('does not treat fence text inside script JSX text as the outer fence', () => {
		const returned = getReturned(`function App() { return <div>
			const x = <span>---</span>
			---
			{x}
		</div>; }`);

		const scriptJsx = returned.children[0].declarations[0].init;
		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXExpressionContainer',
		]);
		expect(scriptJsx.children[0].type).toBe('JSXText');
		expect(scriptJsx.children[0].value).toBe('---');
	});

	it('treats fence-looking text after the fence as JSXText', () => {
		const returned = getReturned(`function App() { return <div>
			---
			--- should be text
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual(['TsrxTemplateFence', 'JSXText']);
		expect(returned.children[1].value).toContain('--- should be text');
	});

	it('treats fence-looking strings inside template output expression containers as expressions', () => {
		const returned = getReturned(`function App() { return <div>
			---
			{'---'}
		</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'TsrxTemplateFence',
			'JSXExpressionContainer',
		]);
		expect(returned.children[1].expression.value).toBe('---');
	});

	it('allows nested elements to have their own script and template fence', () => {
		const returned = getReturned(`function App() { return <section>
			---
			<Component>
				const label = 'Save'
				---
				<button>{label}</button>
			</Component>
		</section>; }`);

		const component = returned.children.find((child) => child.type === 'JSXElement');
		expect(returned.children.map((child) => child.type)).toEqual([
			'TsrxTemplateFence',
			'JSXElement',
		]);
		expect(component.openingElement.name.name).toBe('Component');
		expect(component.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXElement',
		]);
		expect(component.children[2].openingElement.name.name).toBe('button');
	});
});
