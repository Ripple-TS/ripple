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

	it('parses fragments as JSXFragment nodes', () => {
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

	it('parses style blocks as JSXStyleElement nodes', () => {
		const returned = getReturned(`function App() { return <style>
			.root {
				color: red;
			}
		</style>; }`);

		expect(returned.type).toBe('JSXStyleElement');
		expect(returned.openingElement.name.name).toBe('style');
		expect(returned.children.map((child) => child.type)).toEqual(['StyleSheet']);
		expect(returned.css).toContain('color: red');
		expect(returned.metadata.styleScopeHash).toBe(returned.children[0].hash);
	});

	it('does not add component style scope metadata to head styles', () => {
		const returned = getReturned(`function App() { return <head>
			<style>
				body {
					margin: 0;
				}
			</style>
		</head>; }`);

		const style = returned.children.find((child) => child.type === 'JSXStyleElement');
		expect(style.children.map((child) => child.type)).toEqual(['StyleSheet']);
		expect(style.metadata.styleScopeHash).toBeUndefined();
	});

	it('parses multiline self-closing meta tags inside head', () => {
		const returned = getReturned(`function App() { return <>
			<head>
				<title>Home</title>
				<meta
					name="description"
					content="Page description"
				/>
			</head>
		</>; }`);

		const head = returned.children.find(
			(child) => child.type === 'JSXElement' && child.openingElement.name.name === 'head',
		);
		const meta = head.children.find(
			(child) => child.type === 'JSXElement' && child.openingElement.name.name === 'meta',
		);
		expect(meta.openingElement.selfClosing).toBe(true);
		expect(meta.closingElement).toBeNull();
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

	it('treats unfenced keyword and symbol-looking element children as JSXText', () => {
		const returned = getReturned(`function App() { return <div>
			<code>const</code>
			<code>@if</code>
			<code>@tsrx/react</code>
			<code>/mcp</code>
			<a>#1177</a>
		</div>; }`);

		const elements = returned.children.filter((child) => child.type === 'JSXElement');
		expect(elements[0].children[0].type).toBe('JSXText');
		expect(elements[0].children[0].value).toBe('const');
		expect(elements[1].children[0].type).toBe('JSXText');
		expect(elements[1].children[0].value).toBe('@if');
		expect(elements[2].children[0].type).toBe('JSXText');
		expect(elements[2].children[0].value).toBe('@tsrx/react');
		expect(elements[3].children[0].type).toBe('JSXText');
		expect(elements[3].children[0].value).toBe('/mcp');
		expect(elements[4].children[0].type).toBe('JSXText');
		expect(elements[4].children[0].value).toBe('#1177');
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

	it('parses style expressions in the script side of a template fence', () => {
		const returned = getReturned(`function App() { return <section>
			const styles = <style>
				.card {
					color: red;
				}
			</style>
			---
			<div class={styles.card} />
		</section>; }`);

		const style = returned.children[0].declarations[0].init;
		expect(returned.children.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
			'JSXElement',
		]);
		expect(style.type).toBe('JSXStyleElement');
		expect(style.children[0].type).toBe('StyleSheet');
		expect(style.css).toContain('.card');
	});

	it('keeps fence and markup-looking text inside style content as CSS source', () => {
		const returned = getReturned(`function App() { return <style>
			.root::before {
				content: "--- </div><div>";
			}
		</style>; }`);

		expect(returned.type).toBe('JSXStyleElement');
		expect(returned.css).toContain('--- </div><div>');
		expect(returned.children[0].source).toContain('--- </div><div>');
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

	it('parses @if as a JSXIfExpression', () => {
		const returned = getReturned(`function App() { return <div>
			---
			@if (ready) {
				Ready
			} else {
				Waiting
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.type).toBe('JSXIfExpression');
		expect(directive.statementType).toBe('IfStatement');
		expect(directive.test.name).toBe('ready');
		expect(directive.consequent.body[0].type).toBe('JSXText');
		expect(directive.consequent.body[0].value).toContain('Ready');
		expect(directive.alternate.body[0].value).toContain('Waiting');
	});

	it('parses script-only @if bodies that end with a template fence', () => {
		const returned = getReturned(`function App() { return <div>
			---
			@if (ready) {
				calls++;
				---
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.consequent.body.map((child) => child.type)).toEqual([
			'ExpressionStatement',
			'TsrxTemplateFence',
		]);
		expect(directive.consequent.body[0].expression.operator).toBe('++');
	});

	it('treats unfenced assignment-looking @if body content as JSXText', () => {
		const returned = getReturned(`function App() { return <div>
			---
			@if (ready) {
				x = 123
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.consequent.body.map((child) => child.type)).toEqual(['JSXText']);
		expect(directive.consequent.body[0].value).toContain('x = 123');
	});

	it('does not treat closing-tag text inside directive script strings as markup', () => {
		const returned = getReturned(`function App() { return <div>
			---
			@if (ready) {
				const x = "</div><div>"
				---
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.consequent.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'TsrxTemplateFence',
		]);
		expect(directive.consequent.body[0].declarations[0].init.value).toBe('</div><div>');
	});

	it('parses @for as a JSXForExpression', () => {
		const returned = getReturned(`function App() { return <ul>
			---
			@for (const item of items; key item.id) {
				<li>{item.label}</li>
			}
		</ul>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXForExpression');
		expect(directive.type).toBe('JSXForExpression');
		expect(directive.statementType).toBe('ForOfStatement');
		expect(directive.left.declarations[0].id.name).toBe('item');
		expect(directive.right.name).toBe('items');
		expect(directive.key.property.name).toBe('id');
		expect(directive.body.body[0].type).toBe('JSXElement');
	});

	it('parses script-only @for bodies that end with a template fence', () => {
		const returned = getReturned(`function App() { return <ul>
			---
			@for (const item of items) {
				calls++;
				---
			}
		</ul>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXForExpression');
		expect(directive.body.body.map((child) => child.type)).toEqual([
			'ExpressionStatement',
			'TsrxTemplateFence',
		]);
	});

	it('parses @switch as a JSXSwitchExpression with JSX text case bodies', () => {
		const returned = getReturned(`function App() { return <div>
			---
			@switch (value) {
				case 'a':
					Case A
				case 'b':
					Case B
				default:
					Fallback
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXSwitchExpression');
		expect(directive.type).toBe('JSXSwitchExpression');
		expect(directive.statementType).toBe('SwitchStatement');
		expect(directive.discriminant.name).toBe('value');
		expect(directive.cases).toHaveLength(3);
		expect(directive.cases[0].test.value).toBe('a');
		expect(directive.cases[0].consequent[0].type).toBe('JSXText');
		expect(directive.cases[0].consequent[0].value).toContain('Case A');
		expect(directive.cases[2].test).toBeNull();
		expect(directive.cases[2].consequent[0].value).toContain('Fallback');
	});

	it('parses @try as a JSXTryExpression', () => {
		const returned = getReturned(`function App() { return <div>
			---
			@try {
				<ComponentThatSuspends />
			} pending {
				Loading
			} catch (error, reset) {
				Failed
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXTryExpression');
		expect(directive.type).toBe('JSXTryExpression');
		expect(directive.statementType).toBe('TryStatement');
		expect(directive.block.body[0].type).toBe('JSXElement');
		expect(directive.pending.body[0].type).toBe('JSXText');
		expect(directive.pending.body[0].value).toContain('Loading');
		expect(directive.handler.param.name).toBe('error');
		expect(directive.handler.resetParam.name).toBe('reset');
		expect(directive.handler.body.body[0].value).toContain('Failed');
	});

	it('parses script-only @try bodies that end with a template fence', () => {
		const returned = getReturned(`function App() { return <div>
			---
			@try {
				calls++;
				---
			} pending {
				Loading
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXTryExpression');
		expect(directive.block.body.map((child) => child.type)).toEqual([
			'ExpressionStatement',
			'TsrxTemplateFence',
		]);
		expect(directive.pending.body[0].type).toBe('JSXText');
	});
});
