import { describe, expect, it } from 'vitest';
import { parseModule } from '../../src/index.js';

function getReturned(source) {
	const ast = parseModule(source, 'App.tsrx');
	const first = ast.body[0];
	if (first?.type === 'FunctionDeclaration') {
		return first.body.body[0].argument;
	}
	// Fallback for components declared below the top level (e.g. a `function App`
	// nested inside a return of another function callback): walk to the first JSX-returning
	// `return` statement anywhere in the tree.
	let found;
	(function walk(node) {
		if (found || !node || typeof node !== 'object') return;
		if (Array.isArray(node)) return node.forEach(walk);
		if (
			node.type === 'ReturnStatement' &&
			(node.argument?.type === 'JSXFragment' || node.argument?.type === 'JSXElement')
		) {
			found = node.argument;
			return;
		}
		for (const key in node) {
			if (key === 'loc' || key === 'start' || key === 'end') continue;
			walk(node[key]);
		}
	})(ast);
	return found;
}

// Find the first node of `type` anywhere in the parsed tree.
function findNode(source, type) {
	const ast = parseModule(source, 'App.tsrx');
	let found;
	(function walk(node) {
		if (found || !node || typeof node !== 'object') return;
		if (Array.isArray(node)) return node.forEach(walk);
		if (node.type === type) {
			found = node;
			return;
		}
		for (const key in node) {
			if (key === 'loc' || key === 'start' || key === 'end') continue;
			walk(node[key]);
		}
	})(ast);
	return found;
}

// Find the first JSXElement with the given tag name anywhere in the parsed tree.
function findElement(source, tagName) {
	const ast = parseModule(source, 'App.tsrx');
	let found;
	(function walk(node) {
		if (found || !node || typeof node !== 'object') return;
		if (Array.isArray(node)) return node.forEach(walk);
		if (node.type === 'JSXElement' && node.openingElement?.name?.name === tagName) {
			found = node;
			return;
		}
		for (const key in node) {
			if (key === 'loc' || key === 'start' || key === 'end') continue;
			walk(node[key]);
		}
	})(ast);
	return found;
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

	it('parses self-closing dynamic element tags', () => {
		const source = 'function MyApp() { return <{Tag} class="card" />; }';
		const returned = getReturned(source);

		expect(returned.type).toBe('JSXElement');
		expect(returned.isDynamic).toBe(true);
		expect(returned.openingElement.isDynamic).toBe(true);
		expect(returned.openingElement.selfClosing).toBe(true);
		expect(returned.closingElement).toBeNull();
		expect(returned.openingElement.name.type).toBe('JSXExpressionContainer');
		expect(returned.openingElement.name.isDynamic).toBe(true);
		expect(returned.openingElement.name.expression.type).toBe('Identifier');
		expect(returned.openingElement.name.expression.name).toBe('Tag');
		expect(
			source.slice(
				returned.openingElement.name.expression.start,
				returned.openingElement.name.expression.end,
			),
		).toBe('Tag');
	});

	it('parses dynamic element tags with matching closing tags', () => {
		const source = `function MyApp() {
			return <{Child} class="card"><div>Hello</div></{Child}>;
		}`;
		const returned = getReturned(source);

		expect(returned.type).toBe('JSXElement');
		expect(returned.isDynamic).toBe(true);
		expect(returned.openingElement.name.expression.name).toBe('Child');
		expect(returned.closingElement.isDynamic).toBe(true);
		expect(returned.closingElement.name.type).toBe('JSXExpressionContainer');
		expect(returned.closingElement.name.expression.name).toBe('Child');
		expect(returned.children.map((child) => child.type)).toEqual(['JSXElement']);
	});

	it('parses supported dynamic element name expressions', () => {
		const cases = [
			['<{Tag} />', 'Identifier', 'Tag'],
			['<{something.prop} />', 'MemberExpression', 'something.prop'],
			['<{arr[0]} />', 'MemberExpression', 'arr[0]'],
			["<{'div'} />", 'Literal', "'div'"],
			['<{`div`} />', 'TemplateLiteral', '`div`'],
		];

		for (const [tag, expressionType, expressionSource] of cases) {
			const source = `function MyApp() { return ${tag}; }`;
			const returned = getReturned(source);
			const expression = returned.openingElement.name.expression;
			expect(returned.isDynamic).toBe(true);
			expect(expression.type).toBe(expressionType);
			expect(source.slice(expression.start, expression.end)).toBe(expressionSource);
		}
	});

	it('rejects static non-string dynamic element names', () => {
		for (const tag of [
			'<{null} />',
			'<{undefined} />',
			'<{true} />',
			'<{1} />',
			'<{{}} />',
			'<{[]} />',
		]) {
			expect(() => parseModule(`function MyApp() { return ${tag}; }`, 'App.tsrx')).toThrow(
				'Dynamic element names must be',
			);
		}
	});

	it('rejects dynamic element call expressions, spreads, and string interpolation', () => {
		for (const tag of [
			'<{tagName()} />',
			'<{condition ? tagName() : Tag} />',
			'<{new TagName()} />',
			'<{({ ...tags }).tag} />',
			'<{({ tag }).tag} />',
			'<{[Tag][0]} />',
			"<{'hello' + 'by'} />",
			'<{`d${kind}`} />',
			'<{tag`div`} />',
		]) {
			expect(() => parseModule(`function MyApp() { return ${tag}; }`, 'App.tsrx')).toThrow(
				'Dynamic element names must be',
			);
		}
	});

	it('parses a return after a fragment variable initializer without an explicit semicolon', () => {
		const ast = parseModule(
			`function MyComponent() {
  const mySpan = <>
  </>

  return <>{mySpan}</>
}`,
			'App.tsrx',
		);

		const [declaration, statement] = ast.body[0].body.body;
		expect(declaration.declarations[0].init.type).toBe('JSXFragment');
		expect(statement.type).toBe('ReturnStatement');
		expect(statement.argument.type).toBe('JSXFragment');
	});

	it('parses a return after a fragment initializer with style children without an explicit semicolon', () => {
		const ast = parseModule(
			`function MyComponent() {
  const mySpan = <>
    <span />
    <style>
      span { color: black; }
    </style>
  </>

  return <>{mySpan}</>
}`,
			'App.tsrx',
		);

		const [declaration, statement] = ast.body[0].body.body;
		const fragment = declaration.declarations[0].init;
		expect(fragment.type).toBe('JSXFragment');
		expect(fragment.children.some((child) => child.type === 'JSXStyleElement')).toBe(true);
		expect(statement.type).toBe('ReturnStatement');
		expect(statement.argument.type).toBe('JSXFragment');
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

	it('treats fragment text as JSXText', () => {
		const ast = parseModule(
			`export const FeatureCard = () => <>
				hello world
			</>;`,
			'App.tsrx',
		);

		const value = ast.body[0].declaration.declarations[0].init.body;
		expect(value.type).toBe('JSXFragment');
		expect(value.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(value.children[0].value).toContain('hello world');
	});

	it('preserves JSX text whitespace around expression children', () => {
		const returned = getReturned(
			`function App() {
				return <div>{name} is visible</div>;
			}`,
		);

		expect(returned.children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
		]);
		expect(returned.children[1].value).toBe(' is visible');
	});

	it('preserves same-line JSX whitespace text between expression children', () => {
		const returned = getReturned(
			`function App() {
				return <div>{first} {last}</div>;
			}`,
		);

		expect(returned.children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(returned.children[1].value).toBe(' ');
	});

	// Regression: JSX text inside a `{ … }` expression container used to lose its
	// leading whitespace. A JSX element is parsed two different ways depending on
	// position — as native template raw text when it is a bare template child, and
	// through the JSX-expression reader when it is wrapped in `{ … }`. The latter
	// skipped leading whitespace before anchoring the JSXText token, so
	// `{<textarea>   a</textarea>}` came back as `a` while the bare
	// `<textarea>   a</textarea>` kept `   a`. Both paths must capture text identically.

	it('preserves leading whitespace in element text inside an expression container', () => {
		const returned = getReturned(
			`function App() {
				return <>{<textarea>   a</textarea>}</>;
			}`,
		);

		const textarea = returned.children[0].expression;
		expect(textarea.type).toBe('JSXElement');
		expect(textarea.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(textarea.children[0].value).toBe('   a');
	});

	it('captures element text identically for bare and expression-container elements', () => {
		const bare = findElement(`function App() { <textarea>   a</textarea> }`, 'textarea');
		const wrapped = findElement(
			`function App() { return <>{<textarea>   a</textarea>}</>; }`,
			'textarea',
		);

		expect(bare.children[0].value).toBe('   a');
		expect(wrapped.children[0].value).toBe(bare.children[0].value);
	});

	it('preserves leading newline-indented element text inside an expression container', () => {
		const textarea = findElement(
			`function App() {
				return <>{<textarea>
    C
abc
</textarea>}</>;
			}`,
			'textarea',
		);

		expect(textarea.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(textarea.children[0].value).toBe('\n    C\nabc\n');
	});

	it('preserves trailing and interior whitespace in expression-container element text', () => {
		const div = findElement(`function App() { return <>{<div>a   b   </div>}</>; }`, 'div');

		expect(div.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(div.children[0].value).toBe('a   b   ');
	});

	// The same preservation must hold for elements authored with TSRX template
	// syntax (`function … @{ … }`), both as bare native-template children and when
	// nested inside a `{ … }` expression container within the template body.

	it('preserves bare element text whitespace inside a TSRX template body', () => {
		const div = findElement(`function App() @{ <div>   a</div> }`, 'div');

		expect(div.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(div.children[0].value).toBe('   a');
	});

	it('preserves expression-container element text whitespace inside a TSRX template body', () => {
		const span = findElement(`function App() @{ <div>{<span>   x</span>}</div> }`, 'span');

		expect(span.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(span.children[0].value).toBe('   x');
	});

	it('preserves element text whitespace inside a TSRX @if block', () => {
		const textarea = findElement(
			`function App() @{
				@if (ok) {
					<textarea>   a</textarea>
				}
			}`,
			'textarea',
		);

		expect(textarea.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(textarea.children[0].value).toBe('   a');
	});

	it('preserves leading element text whitespace inside a TSRX @for block', () => {
		const li = findElement(
			`function App() @{
				@for (const item of items) {
					<li>   {item}</li>
				}
			}`,
			'li',
		);

		expect(li.children.map((child) => child.type)).toEqual(['JSXText', 'JSXExpressionContainer']);
		expect(li.children[0].value).toBe('   ');
	});

	it('treats backslashes in expression-container element text as literal text', () => {
		const bare = findElement(`function App() { <div>a\\nb</div> }`, 'div');
		const wrapped = findElement(`function App() { return <>{<div>a\\nb</div>}</>; }`, 'div');

		expect(bare.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(bare.children[0].value).toBe('a\\nb');
		expect(wrapped.children[0].value).toBe(bare.children[0].value);
	});

	const inExpressionContainer = (body) => `function App() {
			return <>{<div>${body}</div>}</>;
		}`;

	it('parses an @{ } code block inside an element nested in an expression container', () => {
		const block = findNode(
			inExpressionContainer(`@{ const value = 1; <span>{value}</span> }`),
			'JSXCodeBlock',
		);

		expect(block?.type).toBe('JSXCodeBlock');
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.openingElement.name.name).toBe('span');
	});

	it('preserves significant whitespace before a code block in a fragment', () => {
		const fragment = findNode('let a = <>   @{<b>123</b>}   </>;', 'JSXFragment');

		expect(fragment.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXCodeBlock',
			'JSXText',
		]);
		expect(fragment.children[0].value).toBe('   ');
		expect(fragment.children[2].value).toBe('   ');
	});

	it('drops layout whitespace before a code block in a fragment', () => {
		const fragment = findNode('let a = <>\n   @{<b>123</b>}\n</>;', 'JSXFragment');

		expect(fragment.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
	});

	it('parses an @if directive inside an element nested in an expression container', () => {
		const directive = findNode(
			inExpressionContainer(`@if (ok) { <span>x</span> }`),
			'JSXIfExpression',
		);

		expect(directive?.type).toBe('JSXIfExpression');
		expect(directive.consequent.body.map((child) => child.type)).toEqual(['JSXElement']);
	});

	it('parses an @if/@else directive inside an element nested in an expression container', () => {
		const directive = findNode(
			inExpressionContainer(`@if (ok) { <span>a</span> } @else { <span>b</span> }`),
			'JSXIfExpression',
		);

		expect(directive?.type).toBe('JSXIfExpression');
		expect(directive.alternate?.type).toBe('BlockStatement');
	});

	it('parses an @for directive inside an element nested in an expression container', () => {
		const directive = findNode(
			inExpressionContainer(`@for (const item of items) { <li>{item}</li> }`),
			'JSXForExpression',
		);

		expect(directive?.type).toBe('JSXForExpression');
		expect(directive.statementType).toBe('ForOfStatement');
	});

	it('parses an @switch directive inside an element nested in an expression container', () => {
		const directive = findNode(
			inExpressionContainer(
				`@switch (k) { @case 1: { <span>a</span> } @default: { <span>b</span> } }`,
			),
			'JSXSwitchExpression',
		);

		expect(directive?.type).toBe('JSXSwitchExpression');
	});

	it('parses an @try/@catch directive inside an element nested in an expression container', () => {
		const directive = findNode(
			inExpressionContainer(`@try { <span>a</span> } @catch (e) { <span>b</span> }`),
			'JSXTryExpression',
		);

		expect(directive?.type).toBe('JSXTryExpression');
		expect(directive.handler?.type).toBe('CatchClause');
	});

	it('preserves element-text whitespace inside a directive in an expression container', () => {
		const span = findElement(inExpressionContainer(`@if (ok) { <span>   keep</span> }`), 'span');

		expect(span.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(span.children[0].value).toBe('   keep');
	});

	it('parses a ternary with JSX element branches inside an expression container', () => {
		const returned = getReturned(
			`function App() {
				return <>{cond ? <div>yes</div> : <span>no</span>}</>;
			}`,
		);

		const expression = returned.children[0].expression;
		expect(expression.type).toBe('ConditionalExpression');
		expect(expression.consequent.type).toBe('JSXElement');
		expect(expression.alternate.type).toBe('JSXElement');
	});

	it('parses a ternary with JSX fragment branches inside an expression container', () => {
		const returned = getReturned(
			`function App() {
				return <>{cond ? <>yes</> : <>no</>}</>;
			}`,
		);

		const expression = returned.children[0].expression;
		expect(expression.type).toBe('ConditionalExpression');
		expect(expression.consequent.type).toBe('JSXFragment');
		expect(expression.alternate.type).toBe('JSXFragment');
	});

	it('parses a nested ternary with JSX element branches inside an expression container', () => {
		const returned = getReturned(
			`function App() {
				return <>{a ? <div>1</div> : b ? <div>2</div> : <div>3</div>}</>;
			}`,
		);

		const outer = returned.children[0].expression;
		expect(outer.type).toBe('ConditionalExpression');
		expect(outer.consequent.type).toBe('JSXElement');
		expect(outer.alternate.type).toBe('ConditionalExpression');
		expect(outer.alternate.consequent.type).toBe('JSXElement');
		expect(outer.alternate.alternate.type).toBe('JSXElement');
	});

	it('parses a parenthesized multiline element with nested children in a ternary branch', () => {
		const returned = getReturned(
			`function App({ cond }) {
				return <div>
					{cond
						? (<Outer>
								<Inner>hi</Inner>
							</Outer>)
						: null}
				</div>;
			}`,
		);

		const expression = returned.children.find(
			(child) => child.type === 'JSXExpressionContainer',
		).expression;
		expect(expression.type).toBe('ConditionalExpression');
		expect(expression.consequent.type).toBe('JSXElement');
		expect(expression.consequent.openingElement.name.name).toBe('Outer');
		const inner = expression.consequent.children.find((child) => child.type === 'JSXElement');
		expect(inner.openingElement.name.name).toBe('Inner');
		expect(inner.children[0].value).toBe('hi');
		expect(expression.alternate.type).toBe('Literal');
		expect(expression.alternate.value).toBeNull();
	});

	it('preserves element-text whitespace in ternary branches inside an expression container', () => {
		const span = findElement(
			`function App() {
				return <>{cond ? <div>a</div> : <span>   keep</span>}</>;
			}`,
			'span',
		);

		expect(span.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(span.children[0].value).toBe('   keep');
	});

	it('keeps line comments out of plain JSX fragment output', () => {
		const ast = parseModule(
			`export const FeatureCard = () => <>
				// This is a JS comment, not text.
				<div />
			</>;`,
			'App.tsrx',
		);

		const value = ast.body[0].declaration.declarations[0].init.body;
		expect(value.children.map((child) => child.type)).toEqual(['JSXElement']);
		expect(value.children[0].openingElement.name.name).toBe('div');
	});

	it('treats JS-looking fragment content as JSXText', () => {
		const ast = parseModule(
			`export const FeatureCard = () => <>
				const x = 1
			</>;`,
			'App.tsrx',
		);

		const value = ast.body[0].declaration.declarations[0].init.body;
		expect(value.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(value.children[0].value).toContain('const x = 1');
	});

	// Collect every JSXText value in the tree, and parse with `collect` so the
	// recorded comments can be asserted alongside the text they were removed from.
	function parseTemplateTextsAndComments(source) {
		/** @type {import('estree').Comment[]} */
		const comments = [];
		const ast = parseModule(source, 'App.tsrx', { collect: true, comments });
		const texts = [];
		(function walk(node) {
			if (!node || typeof node !== 'object') return;
			if (Array.isArray(node)) return node.forEach(walk);
			if (node.type === 'JSXText') texts.push(node.value);
			for (const key in node) {
				if (key === 'loc' || key === 'start' || key === 'end') continue;
				walk(node[key]);
			}
		})(ast);
		comments.sort((a, b) => a.start - b.start);
		return { texts, comments };
	}

	it('strips block and line comments from template text and records them as comments', () => {
		const { texts, comments } = parseTemplateTextsAndComments(`function TodoList() @{
  <>
    /* world 0 */
    // hello
    /* world 1 */
    <ul>
    // hello
    /* world 2 */

    </ul>

    <ul>
    // hello
    /* world 3 */
    // hello
    </ul>
    /* world 4 */
  </>
  }`);

		for (const text of texts) {
			expect(text).not.toMatch(/world|hello|\/\*|\/\//);
		}
		expect(comments.filter((comment) => comment.type === 'Block').map((c) => c.value)).toEqual([
			' world 0 ',
			' world 1 ',
			' world 2 ',
			' world 3 ',
			' world 4 ',
		]);
		expect(comments.filter((comment) => comment.type === 'Line').map((c) => c.value)).toEqual([
			' hello',
			' hello',
			' hello',
			' hello',
		]);
	});

	it('strips a block comment between words of template text', () => {
		const { texts, comments } = parseTemplateTextsAndComments(`function App() @{
	<div>hello /* note */ world</div>
}`);

		expect(texts).toEqual(['hello  world']);
		expect(comments.map((comment) => comment.value)).toEqual([' note ']);
	});

	it('strips a block comment that is the only element content', () => {
		const { texts, comments } = parseTemplateTextsAndComments(`function App() @{
	<div>/* note */</div>
}`);

		expect(texts).toEqual([]);
		expect(comments.map((comment) => comment.value)).toEqual([' note ']);
	});

	it('records a block comment before a closing fragment exactly once', () => {
		const { texts, comments } = parseTemplateTextsAndComments(`function App() @{
<>
<ul></ul>
/* z */
</>
}`);

		for (const text of texts) {
			expect(text).not.toContain('z');
		}
		expect(comments.map((comment) => comment.type + ':' + comment.value)).toEqual(['Block: z ']);
	});

	it('keeps // inside template text when it is not at line start', () => {
		const { texts, comments } = parseTemplateTextsAndComments(`function App() @{
	<div>visit https://x.com please</div>
}`);

		expect(texts).toEqual(['visit https://x.com please']);
		expect(comments).toEqual([]);
	});

	it('keeps // after text on the same line as literal text', () => {
		const { texts, comments } = parseTemplateTextsAndComments(`function App() @{
	<div>hi // note</div>
}`);

		expect(texts).toEqual(['hi // note']);
		expect(comments).toEqual([]);
	});

	it('parses a trailing line comment after a `@{ }` code block on the same line', () => {
		const { texts, comments } = parseTemplateTextsAndComments(`function StatusBadge0() @{
	<>
		@{@{@{<>hello @{222}</>}}}  // <-- depth 4
	</>
}`);

		expect(texts).toEqual(['hello ']);
		expect(comments.map((comment) => comment.type + ':' + comment.value)).toEqual([
			'Line: <-- depth 4',
		]);
	});

	it('parses a trailing line comment after an element on the same line', () => {
		const { texts, comments } = parseTemplateTextsAndComments(`function App() @{
	<div><b>z</b> // note
	tail</div>
}`);

		expect(texts).toEqual(['z', 'tail']);
		expect(comments.map((comment) => comment.type + ':' + comment.value)).toEqual(['Line: note']);
	});

	it('parses a trailing line comment after an expression container on the same line', () => {
		const { texts, comments } = parseTemplateTextsAndComments(`function App() @{
	<div>{x} // note
	tail</div>
}`);

		expect(texts).toEqual([' \n\ttail']);
		expect(comments.map((comment) => comment.type + ':' + comment.value)).toEqual(['Line: note']);
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

	it('parses empty style blocks inside fragments', () => {
		const returned = getReturned('function App() { return <><style></style></>; }');

		expect(returned.type).toBe('JSXFragment');
		expect(returned.children.map((child) => child.type)).toEqual(['JSXStyleElement']);
		expect(returned.children[0].css).toBe('');
		expect(returned.children[0].children.map((child) => child.type)).toEqual(['StyleSheet']);
	});

	it('parses module-scope style expressions followed by JavaScript statements', () => {
		const source = `const styles = <style>
			.card {
				color: red;
			}
		</style>;

		describe('card', () => {});
		export function App() {
			return <div class={styles.card} />;
		}`;
		const ast = parseModule(source, 'App.tsrx');
		const style = ast.body[0].declarations[0].init;

		expect(ast.body.map((node) => node.type)).toEqual([
			'VariableDeclaration',
			'ExpressionStatement',
			'ExportNamedDeclaration',
		]);
		expect(style.type).toBe('JSXStyleElement');
		expect(style.end).toBe(source.indexOf('</style>') + '</style>'.length);
		expect(style.css).toContain('.card');
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

	it('splits setup code and render output with a `@{ }` code block', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = 1;
			<>Hello {x}</>
		}</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXFragment');
		expect(block.render.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(block.render.children[0].value).toContain('Hello');
	});

	it('allows a code-only `@{ }` block with no render output', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = 1;
			effect(() => log(x));
		}</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'ExpressionStatement',
		]);
		expect(block.render).toBeNull();
	});

	it('allows a `@{ }` block whose body is only a render node', () => {
		const returned = getReturned(`function App() { return <div>@{
			<span>{count}</span>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.type).toBe('JSXCodeBlock');
		expect(block.body).toEqual([]);
		expect(block.render.type).toBe('JSXElement');
		expect(block.render.openingElement.name.name).toBe('span');
	});

	it('wraps multiple render nodes and text in a fragment', () => {
		const returned = getReturned(`function App() { return <div>@{
			const a = 5;
			<>
				for switching to if, continue and break
				<div>Hello</div>
			</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXFragment');
		expect(block.render.children.map((child) => child.type)).toEqual(['JSXText', 'JSXElement']);
		expect(block.render.children[0].value).toContain('for switching to if');
	});

	it('parses a nested element that earns its own `@{ }` block', () => {
		const returned = getReturned(`function App() { return <div>
			<div>@{
				const a = 5;
				<span>{a}</span>
			}</div>
		</div>; }`);

		const inner = returned.children.find((child) => child.type === 'JSXElement');
		expect(inner.openingElement.name.name).toBe('div');
		expect(inner.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = inner.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.openingElement.name.name).toBe('span');
	});

	it('parses a `@{ }` block as a fragment body', () => {
		const returned = getReturned(`function App() { return <>@{
			const a = 5;
			<div>{a}</div>
		}</>; }`);

		expect(returned.type).toBe('JSXFragment');
		expect(returned.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.openingElement.name.name).toBe('div');
	});

	it('parses a `@{ }` block preceded by text as a code block, not text plus expression container', () => {
		const ast = parseModule(
			`function Foo(props) @{
				<>
					Hello @{props.username}
				</>
			}`,
			'App.tsrx',
		);
		const fragment = ast.body[0].body.render;

		expect(fragment.children.map((child) => child.type)).toEqual(['JSXText', 'JSXCodeBlock']);
		expect(fragment.children[0].value).toContain('Hello ');
		const block = fragment.children[1];
		expect(block.body.map((child) => child.type)).toEqual(['ExpressionStatement']);
		expect(block.body[0].expression.property.name).toBe('username');
		expect(block.render).toBeNull();
	});

	it('parses inline `@{ }` blocks between text siblings and keeps the surrounding spaces', () => {
		const returned = getReturned(`function App() { return <div>a @{x} b @{y} c</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXCodeBlock',
			'JSXText',
			'JSXCodeBlock',
			'JSXText',
		]);
		expect(returned.children[0].value).toBe('a ');
		expect(returned.children[2].value).toBe(' b ');
		expect(returned.children[4].value).toBe(' c');
	});

	it('parses a `@{ }` block preceded by text inside an element nested in an expression container', () => {
		const span = findElement(
			`function App() { return <div>{cond ? <span>p @{q}</span> : null}</div>; }`,
			'span',
		);

		expect(span.children.map((child) => child.type)).toEqual(['JSXText', 'JSXCodeBlock']);
		expect(span.children[0].value).toBe('p ');
	});

	it('keeps a lone `@` followed by a spaced expression container as text', () => {
		const returned = getReturned(`function App() { return <div>at @ {x}</div>; }`);

		expect(returned.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(returned.children[0].value).toBe('at @ ');
	});

	it('keeps locations aligned for plain JSX expression children', () => {
		const source = `function App() {
	return <>
		<pre>
			{x}
		</pre>
	</>;
}
foo();`;
		const ast = parseModule(source, 'App.tsrx');
		const returned = ast.body[0].body.body[0].argument;
		const pre = returned.children.find((child) => child.type === 'JSXElement');
		const expression = pre.children.find(
			(child) => child.type === 'JSXExpressionContainer',
		).expression;

		expect(expression.start).toBe(source.indexOf('x}'));
		expect(ast.body[1].start).toBe(source.indexOf('foo()'));
	});

	it('parses switch cases with JSX children', () => {
		const switchExpression = findNode(
			`function App() { return <>@{
				const iconNodes = [['path', { d: 'x' }], ['circle', { cx: '1' }]];
				<svg>
					@for (const [tag, attrs] of iconNodes) {
						@switch (tag) {
							@case 'path': {
								<path {...attrs} />
							}
							@case 'circle': {
								<circle {...attrs} />
							}
						}
					}
				</svg>
			}</>; }`,
			'JSXSwitchExpression',
		);

		expect(switchExpression.cases).toHaveLength(2);
		const spread = switchExpression.cases[0].consequent[0].openingElement.attributes[0];
		expect(spread.argument.type).toBe('Identifier');
		expect(spread.argument.name).toBe('attrs');
		expect(switchExpression.cases[0].consequent.map((node) => node.type)).toEqual(['JSXElement']);
		expect(switchExpression.cases[1].consequent.map((node) => node.type)).toEqual(['JSXElement']);
	});

	it('rejects break statements inside JSX switch cases', () => {
		expect(() =>
			parseModule(
				`function App() { return @switch (tag) {
					@case 'path': {
						<path />
						break;
					}
				}; }`,
				'App.tsrx',
			),
		).toThrow('`break` is invalid inside `@switch` cases.');
	});

	it('rejects return statements inside JSX switch cases', () => {
		expect(() =>
			parseModule(
				`function App() { return @switch (tag) {
					@case 'path': {
						return;
					}
				}; }`,
				'App.tsrx',
			),
		).toThrow('`return` is invalid inside `@switch` cases.');
		expect(() =>
			parseModule(
				`function App() { return @switch (tag) {
					@case 'path': {
						return <path />;
					}
				}; }`,
				'App.tsrx',
			),
		).toThrow('`return` is invalid inside `@switch` cases.');
	});

	it('requires switch case and default bodies to be blocks', () => {
		expect(() =>
			parseModule(
				`function App() { return @switch (tag) {
					@case 'path':
						<path />
				}; }`,
				'App.tsrx',
			),
		).toThrow();
		expect(() =>
			parseModule(
				`function App() { return @switch (tag) {
					@default:
						<path />
				}; }`,
				'App.tsrx',
			),
		).toThrow();
	});

	it('treats keyword and symbol-looking element children as JSXText', () => {
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

	it('allows a JSX value in the setup section of a code block', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = <div />
			<>
				<div />
				{x}
			</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.body[0].declarations[0].init.type).toBe('JSXElement');
		expect(block.render.children.map((child) => child.type)).toEqual([
			'JSXElement',
			'JSXExpressionContainer',
		]);
	});

	it('allows JSX text children in a setup-section JSX value', () => {
		const returned = getReturned(`function App() { return <>@{
			const x = <div>hello</div>
			<>{x}</>
		}</>; }`);

		const block = returned.children[0];
		expect(block.body[0].declarations[0].init.children[0].type).toBe('JSXText');
		expect(block.body[0].declarations[0].init.children[0].value).toBe('hello');
	});

	it('does not treat closing-tag text inside setup strings as markup', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = "</div><div>"
			<>Hello</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body[0].declarations[0].init.value).toBe('</div><div>');
		expect(block.render.type).toBe('JSXFragment');
	});

	it('parses string and regex literals in the setup section as ordinary TS', () => {
		const returned = getReturned(`function App() { return <div>@{
			const s = "---"
			const r = /---/
			<>Hello</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		expect(block.body[0].declarations[0].init.value).toBe('---');
		expect(block.body[1].declarations[0].init.type).toBe('Literal');
		expect(block.body[1].declarations[0].init.regex.pattern).toBe('---');
	});

	it('parses a template literal as the sole content of a `@{ }` code block', () => {
		const block = findNode('let c = @{ `a${x}b` };', 'JSXCodeBlock');

		expect(block.type).toBe('JSXCodeBlock');
		expect(block.render).toBeNull();
		expect(block.body.map((child) => child.type)).toEqual(['ExpressionStatement']);
		const template = block.body[0].expression;
		expect(template.type).toBe('TemplateLiteral');
		expect(template.quasis.map((quasi) => quasi.value.raw)).toEqual(['a', 'b']);
		expect(template.expressions.map((expression) => expression.name)).toEqual(['x']);
	});

	it('parses a template literal after another statement in a `@{ }` code block', () => {
		const block = findNode('let i = @{ const a = 1; `t${a}` };', 'JSXCodeBlock');

		expect(block.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'ExpressionStatement',
		]);
		const template = block.body[1].expression;
		expect(template.type).toBe('TemplateLiteral');
		expect(template.quasis.map((quasi) => quasi.value.raw)).toEqual(['t', '']);
		expect(template.expressions.map((expression) => expression.name)).toEqual(['a']);
	});

	it('does not treat tag-looking text inside setup regex literals as markup', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = /<span>/
			<>{x}</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body[0].declarations[0].init.type).toBe('Literal');
		expect(block.body[0].declarations[0].init.regex.pattern).toBe('<span>');
	});

	it('reads `<value> /…/` in the setup section as a less-than against a regex', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = 3</div>/
			<>{x}</>
		}</div>; }`);

		const block = returned.children[0];
		const init = block.body[0].declarations[0].init;
		expect(init.type).toBe('BinaryExpression');
		expect(init.operator).toBe('<');
		expect(init.left.value).toBe(3);
		expect(init.right.regex.pattern).toBe('div>');
	});

	it('reads a line-leading `<` against a number in the setup section as a comparison, not a tag', () => {
		const ast = parseModule(
			`const foo = @{
				const x =
					123
					< 456;
				<div/>
			};`,
			'App.tsrx',
		);

		const block = ast.body[0].declarations[0].init;
		expect(block.type).toBe('JSXCodeBlock');
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		const init = block.body[0].declarations[0].init;
		expect(init.type).toBe('BinaryExpression');
		expect(init.operator).toBe('<');
		expect(init.left.value).toBe(123);
		expect(init.right.value).toBe(456);
		expect(block.render.type).toBe('JSXElement');
		expect(block.render.openingElement.name.name).toBe('div');
	});

	it('parses array of objects in the setup section', () => {
		const returned = getReturned(`
			something(() => {
				function App() {
					return <>@{
						const items = [
							{ x: '10', y: '10', width: '20', height: '20' },
							{ x: '40', y: '40', width: '20', height: '20' },
						];
					}</>;
				}
			});`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		const init = block.body[0].declarations[0].init;
		expect(init.type).toBe('ArrayExpression');
		expect(init.elements).toHaveLength(2);
		expect(init.elements[0].type).toBe('ObjectExpression');
		expect(init.elements[0].properties).toHaveLength(4);
	});

	it('parses functions returning fragments in the setup section', () => {
		const returned = getReturned(`
			function App() {
				return <>@{
					function Basic() {
						return <><div>{'Basic Component'}</div></>;
					}
					<Basic />
				}</>;
			}`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['FunctionDeclaration']);
		expect(block.render.type).toBe('JSXElement');
		const declaration = block.body[0];
		expect(declaration.body.body[0].type).toBe('ReturnStatement');
		expect(declaration.body.body[0].argument.type).toBe('JSXFragment');
	});

	it('parses native control flow in a component nested below the top level', () => {
		const returned = getReturned(`
			something(() => {
				function App() {
					return <>@{
						const items = ['a', '', 'c'];
						@for (const item of items) {
							if (!item) continue;
							<li>{item}</li>
						}
					}</>;
				}
			});`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXForExpression');
		const directive = block.render;
		expect(directive.statementType).toBe('ForOfStatement');
		expect(directive.body.body.map((child) => child.type)).toEqual(['IfStatement', 'JSXElement']);
		expect(directive.body.body[0].consequent.type).toBe('ContinueStatement');
	});

	it('parses a TSRX template returned from a `.map()` callback as a native template', () => {
		const tr = findElement(
			`export function App({ rows }) {
				return <table>
					{rows.map((row) => <tr>@{
						const cells = row.cells;
						@for (const cell of cells) { <td>{cell}</td> }
					}</tr>)}
				</table>;
			}`,
			'tr',
		);

		expect(tr.metadata.native_tsrx).toBe(true);
		expect(tr.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = tr.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXForExpression');
		expect(block.render.statementType).toBe('ForOfStatement');
	});

	it('parses a TSRX element in a conditional expression as a native template', () => {
		const div = findElement(
			`export function App({ show }) {
				return <section>
					{show ? <div>@{
						const label = 'hi';
						<>{label}</>
					}</div> : null}
				</section>;
			}`,
			'div',
		);

		expect(div.metadata.native_tsrx).toBe(true);
		expect(div.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = div.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.children.map((child) => child.type)).toEqual(['JSXExpressionContainer']);
	});

	it('treats a generic call in the setup section as script, not markup', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = foo<T>(bar)
			<>{x}</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body[0].declarations[0].init.type).toBe('CallExpression');
		expect(block.body[0].declarations[0].init.callee.name).toBe('foo');
	});

	it('treats a generic arrow function in the setup section as script', () => {
		const returned = getReturned(`function App() { return <div>@{
			const id = <T>(x: T) => x
			<>{id}</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body[0].declarations[0].init.type).toBe('ArrowFunctionExpression');
	});

	it('treats generic function expressions in the setup section as script', () => {
		const returned = getReturned(`function App() { return <div>@{
			function getBuilder() {
				return {
					build: function <T>() {
						return 'test';
					},
				};
			}
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['FunctionDeclaration']);
		const object = block.body[0].body.body[0].argument;
		expect(object.properties[0].value.type).toBe('FunctionExpression');
		expect(object.properties[0].value.typeParameters.type).toBe('TSTypeParameterDeclaration');
	});

	it('treats class methods and member calls with type arguments as script', () => {
		const returned = getReturned(`function App() { return <div>@{
			class List<T> {
				items: T[];
			}
			class Containers {
				static List<T>() {
					return new List<T>();
				}
			}
			const c = Containers.List<string>();
			<>{c}</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual([
			'ClassDeclaration',
			'ClassDeclaration',
			'VariableDeclaration',
		]);
		const method = block.body[1].body.body[0];
		expect(method.type).toBe('MethodDefinition');
		expect(method.typeParameters.type).toBe('TSTypeParameterDeclaration');
		const call = block.body[2].declarations[0].init;
		expect(call.type).toBe('CallExpression');
		expect(call.typeArguments.type).toBe('TSTypeParameterInstantiation');
	});

	it('keeps whitespace-separated relational expressions out of the type-argument path', () => {
		const returned = getReturned(`function App() { return <div>@{
			const result = value < limit > floor;
			<>{result}</>
		}</div>; }`);

		const block = returned.children[0];
		const init = block.body[0].declarations[0].init;
		expect(init.type).toBe('BinaryExpression');
		expect(init.operator).toBe('>');
	});

	it('parses generic function expressions before render output', () => {
		const returned = getReturned(`function App() { return <div>@{
			const label = 'value';
			const builder = function <T>() {
				return label as T;
			};
			<T>{builder<string>()}</T>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		const builder = block.body[1].declarations[0].init;
		expect(builder.type).toBe('FunctionExpression');
		expect(builder.typeParameters.type).toBe('TSTypeParameterDeclaration');
		expect(block.render.openingElement.name.name).toBe('T');
	});

	it('parses template text touching a following element as text, not a type-argument list', () => {
		const block = getReturned(`function App() { return @{ <>hello<span>{a}</span></> }; }`);

		const fragment = block.render;
		expect(fragment.children.map((child) => child.type)).toEqual(['JSXText', 'JSXElement']);
		expect(fragment.children[0].value).toBe('hello');
		expect(fragment.children[1].openingElement.name.name).toBe('span');
	});

	it('parses template text touching a following fragment as text, not a type-argument list', () => {
		const block = getReturned(`function App() { return @{ <>hello<>{a}</></> }; }`);

		const fragment = block.render;
		expect(fragment.children.map((child) => child.type)).toEqual(['JSXText', 'JSXFragment']);
		expect(fragment.children[0].value).toBe('hello');
		expect(fragment.children[1].children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
		]);
	});

	it('keeps expressions as containers between touching text inside an expression container', () => {
		const block = getReturned(`function App() { return @{ <>{<>x{a}y<>{b}</>z</>}</> }; }`);

		const inner = block.render.children[0].expression;
		expect(inner.type).toBe('JSXFragment');
		expect(inner.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXExpressionContainer',
			'JSXText',
			'JSXFragment',
			'JSXText',
		]);
		expect(inner.children[1].expression.name).toBe('a');
		expect(inner.children[3].children[0].expression.name).toBe('b');
	});

	it('parses expression containers at every level of nested fragments in expression position', () => {
		const ast = parseModule(
			`function StatusBadge() @{
				<>{<>{a} <>{<>{a}</>}</> </>}</>
			}`,
			'App.tsrx',
		);

		const outer = ast.body[0].body.render;
		expect(outer.type).toBe('JSXFragment');
		expect(outer.children.map((child) => child.type)).toEqual(['JSXExpressionContainer']);

		const level2 = outer.children[0].expression;
		expect(level2.type).toBe('JSXFragment');
		expect(level2.children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
			'JSXFragment',
			'JSXText',
		]);
		expect(level2.children[0].expression.name).toBe('a');

		const level3 = level2.children[2];
		expect(level3.children.map((child) => child.type)).toEqual(['JSXExpressionContainer']);

		const level4 = level3.children[0].expression;
		expect(level4.type).toBe('JSXFragment');
		expect(level4.children.map((child) => child.type)).toEqual(['JSXExpressionContainer']);
		expect(level4.children[0].expression.name).toBe('a');
	});

	it('parses sibling fragments separated by template text', () => {
		const withText = findNode('let a = <> <>123</> 2 <>456</> </>', 'JSXFragment');
		expect(withText.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXFragment',
			'JSXText',
			'JSXFragment',
			'JSXText',
		]);
		expect(withText.children[0].value).toBe(' ');
		expect(withText.children[2].value).toBe(' 2 ');
		expect(withText.children[4].value).toBe(' ');

		const emptySiblings = findNode('let b = <> <></> 2 <></> </>', 'JSXFragment');
		expect(emptySiblings.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXFragment',
			'JSXText',
			'JSXFragment',
			'JSXText',
		]);
		expect(withText.children[0].value).toBe(' ');
		expect(withText.children[2].value).toBe(' 2 ');
		expect(withText.children[4].value).toBe(' ');
	});

	it('keeps an inline space between adjacent sibling fragments', () => {
		const fragment = findNode('let c = <> <></>  <></>something </>', 'JSXFragment');
		expect(fragment.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXFragment',
			'JSXText',
			'JSXFragment',
			'JSXText',
		]);
		expect(fragment.children[2].value).toBe('  ');
		expect(fragment.children[4].value).toBe('something ');
	});

	it('keeps inline spaces around and between sibling elements', () => {
		const pre = findElement('const a = <pre> <b>1</b> <b>2</b> </pre>;', 'pre');
		expect(pre.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXElement',
			'JSXText',
			'JSXElement',
			'JSXText',
		]);
		expect(pre.children[0].value).toBe(' ');
		expect(pre.children[2].value).toBe(' ');
		expect(pre.children[4].value).toBe(' ');
	});

	it('parses a text-then-element sibling after newline-separated elements', () => {
		const pre = findElement('let a = <pre><b>2</b>\n<b>3</b>1<b>4</b></pre>;', 'pre');
		expect(pre.children.map((child) => child.type)).toEqual([
			'JSXElement',
			'JSXElement',
			'JSXText',
			'JSXElement',
		]);
		expect(pre.children[2].value).toBe('1');
	});

	it('parses indented multi-line markup with a text-then-element sibling', () => {
		const source =
			'let a  = <pre> \n\n    <b>2</b>   \n    <b>3</b> \n    \n    1<b>4</b>\n</pre>;';
		const pre = findElement(source, 'pre');
		expect(pre.children.filter((child) => child.type === 'JSXElement')).toHaveLength(3);
		const text = pre.children.find(
			(child) => child.type === 'JSXText' && child.value.includes('1'),
		);
		expect(text.value).toBe('1');
	});

	it('parses parenthesized conditional JSX spread attributes in render output', () => {
		const returned = getReturned(`function App() { return <div>@{
			let &[enabled] = track(true);
			<button {...(enabled ? { onClick: fn } : { title: 'disabled' })}>target</button>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		const spread = block.render.openingElement.attributes[0];
		expect(spread.type).toBe('JSXSpreadAttribute');
		expect(spread.argument.type).toBe('ConditionalExpression');
		expect(spread.argument.test.name).toBe('enabled');
	});

	it('parses parenthesized conditional spreads that swap ref-shaped props', () => {
		const returned = getReturned(`function App() { return <div>@{
			let &[as_ref] = track(true);
			const props = { ref: input };
			<input {...(as_ref ? { ref: props.ref } : { input_ref: 'regular prop' })} />
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		const spread = block.render.openingElement.attributes[0];
		expect(spread.type).toBe('JSXSpreadAttribute');
		expect(spread.argument.type).toBe('ConditionalExpression');
		expect(spread.argument.consequent.properties[0].key.name).toBe('ref');
		expect(spread.argument.alternate.properties[0].key.name).toBe('input_ref');
	});

	it('does not let a relational `>` inside an attribute break tag scanning', () => {
		// The `>` in `value={foo > bar}` must not be mistaken for the end of the
		// `<Comp ...>` opening tag while parsing a JSX value in setup.
		const returned = getReturned(`function App() { return <div>@{
			const x = <Comp value={foo > bar} />
			<>{x}</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body[0].declarations[0].init.type).toBe('JSXElement');
		expect(block.body[0].declarations[0].init.openingElement.name.name).toBe('Comp');
	});

	it('parses template literals in the setup section', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = \`</div>
<div>\`
			<>Hello</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body[0].declarations[0].init.type).toBe('TemplateLiteral');
	});

	it('parses line and block comments in the setup section', () => {
		const returned = getReturned(`function App() { return <div>@{
			// a line comment
			/* a block comment */
			const x = 1
			<>Hello</>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
	});

	it('does not let a setup JSX value close the outer template', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = <section>
				<div>Script JSX</div>
			</section>
			<>{x}</>
		}</div>; }`);

		const block = returned.children[0];
		const scriptJsx = block.body[0].declarations[0].init;
		expect(scriptJsx.type).toBe('JSXElement');
		expect(scriptJsx.openingElement.name.name).toBe('section');
		expect(
			scriptJsx.children.find((child) => child.type === 'JSXElement').openingElement.name.name,
		).toBe('div');
	});

	it('parses style expressions in the setup section of a code block', () => {
		const returned = getReturned(`function App() { return <section>@{
			const styles = <style>
				.card {
					color: red;
				}
			</style>
			<div class={styles.card} />
		}</section>; }`);

		const block = returned.children[0];
		const style = block.body[0].declarations[0].init;
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXElement');
		expect(style.type).toBe('JSXStyleElement');
		expect(style.children[0].type).toBe('StyleSheet');
		expect(style.css).toContain('.card');
	});

	it('keeps markup-looking text inside style content as CSS source', () => {
		const returned = getReturned(`function App() { return <style>
			.root::before {
				content: "--- </div><div>";
			}
		</style>; }`);

		expect(returned.type).toBe('JSXStyleElement');
		expect(returned.css).toContain('--- </div><div>');
		expect(returned.children[0].source).toContain('--- </div><div>');
	});

	it('allows nested elements to have their own code block', () => {
		const returned = getReturned(`function App() { return <section>
			<Component>@{
				const label = 'Save'
				<button>{label}</button>
			}</Component>
		</section>; }`);

		const component = returned.children.find((child) => child.type === 'JSXElement');
		expect(component.openingElement.name.name).toBe('Component');
		expect(component.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = component.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.openingElement.name.name).toBe('button');
	});

	it('parses @if as a JSXIfExpression', () => {
		const returned = getReturned(`function App() { return <div>
			@if (ready) {
				<>Ready</>
			} @else {
				<>Waiting</>
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.type).toBe('JSXIfExpression');
		expect(directive.statementType).toBe('IfStatement');
		expect(directive.test.name).toBe('ready');
		expect(directive.consequent.body[0].type).toBe('JSXFragment');
		expect(directive.consequent.body[0].children[0].value).toContain('Ready');
		expect(directive.alternate.body[0].children[0].value).toContain('Waiting');
	});

	it('parses @else if as a chained JSXIfExpression alternate', () => {
		const returned = getReturned(`function App() { return <div>
				@if (status === 'loading') {
					<>Loading</>
			} @else if (status === 'success') {
				<>Success</>
			} @else {
				<>Failed</>
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.alternate.type).toBe('IfStatement');
		expect(directive.alternate.test.right.value).toBe('success');
		expect(directive.alternate.consequent.body[0].children[0].value).toContain('Success');
		expect(directive.alternate.alternate.body[0].children[0].value).toContain('Failed');
	});

	it('parses bare else text after an @if directive', () => {
		const returned = getReturned(`function App() { return <>
				@if (ready) {
					<b>123</b>
				} else
			</>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		const text = returned.children.find(
			(child) => child.type === 'JSXText' && child.value.includes('else'),
		);

		expect(directive.type).toBe('JSXIfExpression');
		expect(directive.alternate).toBe(null);
		expect(text.value).toMatch(/^ else/);
	});

	it('keeps the whitespace before bare else text in a @{ ... } block', () => {
		const fragment = findNode(
			`function Test() @{
<>
@if(a){<b>123</b>} else
</>
}`,
			'JSXFragment',
		);

		const directive = fragment.children.find((child) => child.type === 'JSXIfExpression');
		const text = fragment.children.find((child) => child.type === 'JSXText');

		expect(directive.type).toBe('JSXIfExpression');
		expect(directive.alternate).toBe(null);
		expect(text.value).toBe(' else\n');
	});

	it('parses same-line trailing text after an @if block closed by a tag', () => {
		// Regression: the closing `</>` arrives as a relational `<` token because the
		// control-flow block left the tokenizer in JS mode. The manual closing-tag
		// re-entry used to underflow the tokenizer context stack (`context.length -=
		// 2`), throwing "Invalid array length". Trailing text directly before the
		// closing tag (no intervening element) is the trigger.
		const returned = getReturned(`function App() { return <>@if (a) {<b />} done</>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		const text = returned.children.find((child) => child.type === 'JSXText');

		expect(directive.type).toBe('JSXIfExpression');
		expect(text.value).toBe(' done');
	});

	it('parses same-line trailing text after an @for block closed by a tag', () => {
		const returned = getReturned(
			`function App() { return <>@for (const x of xs) {<b />} done</>; }`,
		);

		const directive = returned.children.find((child) => child.type === 'JSXForExpression');
		const text = returned.children.find((child) => child.type === 'JSXText');

		expect(directive.type).toBe('JSXForExpression');
		expect(text.value).toBe(' done');
	});

	it('parses same-line trailing text after an @if block inside a named element', () => {
		const element = findElement(
			`function App() { return <div>@if (a) {<b />} done</div>; }`,
			'div',
		);

		const directive = element.children.find((child) => child.type === 'JSXIfExpression');
		const text = element.children.find((child) => child.type === 'JSXText');

		expect(directive.type).toBe('JSXIfExpression');
		expect(text.value).toBe(' done');
	});

	it('rejects braceless @if JSX output', () => {
		expect(() =>
			getReturned(`function App() { return <div>
					@if (visible) <div class="status">Visible: {String(visible)}</div>
			</div>; }`),
		).toThrow(/Expected `\{` after JSX control-flow directive/);
	});

	it('rejects unprefixed template continuation clauses', () => {
		expect(() =>
			getReturned(`function App() { return <div>
				@if (ready) {
					<>Ready</>
				} else {
					<>Waiting</>
				}
			</div>; }`),
		).toThrow(/Expected `@else` after `@if` block/);

		expect(() =>
			getReturned(`function App() { return <ul>
				@for (const item of items) {
					<li>{item}</li>
				} empty {
					<li>Empty</li>
				}
			</ul>; }`),
		).toThrow(/Expected `@empty` after `@for` block/);

		expect(() =>
			getReturned(`function App() { return <div>
				@switch (value) {
					case 'a': {
						<>A</>
					}
					default: {
						<>B</>
					}
				}
			</div>; }`),
		).toThrow(/Unexpected token/);

		expect(() =>
			getReturned(`function App() { return <div>
				@try {
					<AsyncThing />
				} pending {
					<>Loading</>
				}
			</div>; }`),
		).toThrow(/Expected `@pending` after `@try` block/);

		expect(() =>
			getReturned(`function App() { return <div>
				@try {
					<AsyncThing />
				} @pending {
					<>Loading</>
				} catch (error) {
					<>Failed</>
				}
			</div>; }`),
		).toThrow(/Expected `@catch` after `@try` block/);
	});

	it('parses code-only @if bodies', () => {
		const returned = getReturned(`function App() { return <div>
			@if (ready) {
				calls++;
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.consequent.body.map((child) => child.type)).toEqual(['ExpressionStatement']);
		expect(directive.consequent.body[0].expression.operator).toBe('++');
	});

	it('parses assignment-only @if body content as a statement', () => {
		const returned = getReturned(`function App() { return <div>
			@if (ready) {
				x = 123
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.consequent.body.map((child) => child.type)).toEqual(['ExpressionStatement']);
		expect(directive.consequent.body[0].expression.type).toBe('AssignmentExpression');
	});

	it('does not treat closing-tag text inside directive setup strings as markup', () => {
		const returned = getReturned(`function App() { return <div>
			@if (ready) {
				const x = "</div><div>"
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.consequent.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(directive.consequent.body[0].declarations[0].init.value).toBe('</div><div>');
	});

	it('parses @for as a JSXForExpression', () => {
		const returned = getReturned(`function App() { return <ul>
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
		expect(directive.empty).toBeNull();
	});

	it('parses @for inside a statement-container fragment output with JSX siblings', () => {
		const ast = parseModule(
			`export function App({ items }: { items: string[] }) @{
				<>
					<h3>head</h3>
					<p>text</p>
					@for (const item of items) {
						<div>{item}</div>
					}
				</>
			}`,
			'App.tsrx',
		);

		const block = ast.body[0].declaration.body;
		expect(block.type).toBe('JSXCodeBlock');
		expect(block.render.type).toBe('JSXFragment');
		expect(block.render.children.map((child) => child.type)).toEqual([
			'JSXElement',
			'JSXElement',
			'JSXForExpression',
		]);
		expect(block.render.children[2].body.body[0].type).toBe('JSXElement');
	});

	it('parses @for empty fallbacks as template blocks', () => {
		const returned = getReturned(`function App() { return <ul>
			@for (const item of items; key item.id) {
				<li>{item.label}</li>
			} @empty {
				const message = 'No items';
				<li>{message}</li>
			}
		</ul>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXForExpression');
		expect(directive.type).toBe('JSXForExpression');
		expect(directive.empty.type).toBe('BlockStatement');
		expect(directive.empty.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXElement',
		]);
		expect(directive.empty.body[1].openingElement.name.name).toBe('li');
	});

	it('rejects braceless @for empty fallbacks', () => {
		expect(() =>
			getReturned(`function App() { return <ul>
				@for (const item of items) {
					<li>{item.label}</li>
				} @empty <li>No items</li>
			</ul>; }`),
		).toThrow(/Expected `\{` after JSX control-flow directive/);
	});

	it('parses code-only @for bodies', () => {
		const returned = getReturned(`function App() { return <ul>
			@for (const item of items) {
				calls++;
			}
		</ul>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXForExpression');
		expect(directive.body.body.map((child) => child.type)).toEqual(['ExpressionStatement']);
	});

	it('parses @switch as a JSXSwitchExpression with fragment case bodies', () => {
		const returned = getReturned(`function App() { return <div>
			@switch (value) {
				@case 'a': {
					<>Case A</>
				}
				@case 'b': {
					<>Case B</>
				}
				@default: {
					<>Fallback</>
				}
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXSwitchExpression');
		expect(directive.type).toBe('JSXSwitchExpression');
		expect(directive.statementType).toBe('SwitchStatement');
		expect(directive.discriminant.name).toBe('value');
		expect(directive.cases).toHaveLength(3);
		expect(directive.cases[0].test.value).toBe('a');
		expect(directive.cases[0].consequent[0].type).toBe('JSXFragment');
		expect(directive.cases[0].consequent[0].children[0].value).toContain('Case A');
		expect(directive.cases[2].test).toBeNull();
		expect(directive.cases[2].consequent[0].children[0].value).toContain('Fallback');
	});

	it('parses @try as a JSXTryExpression', () => {
		const returned = getReturned(`function App() { return <div>
			@try {
				<ComponentThatSuspends />
			} @pending {
				<>Loading</>
			} @catch (error, reset) {
				<>Failed</>
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXTryExpression');
		expect(directive.type).toBe('JSXTryExpression');
		expect(directive.statementType).toBe('TryStatement');
		expect(directive.block.body[0].type).toBe('JSXElement');
		expect(directive.pending.body[0].type).toBe('JSXFragment');
		expect(directive.pending.body[0].children[0].value).toContain('Loading');
		expect(directive.handler.param.name).toBe('error');
		expect(directive.handler.resetParam.name).toBe('reset');
		expect(directive.handler.body.body[0].children[0].value).toContain('Failed');
	});

	it('parses code-only @try bodies', () => {
		const returned = getReturned(`function App() { return <div>
			@try {
				calls++;
			} @pending {
				<>Loading</>
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXTryExpression');
		expect(directive.block.body.map((child) => child.type)).toEqual(['ExpressionStatement']);
		expect(directive.pending.body[0].type).toBe('JSXFragment');
	});

	it('parses a `@{ }` block returned directly from an arrow body', () => {
		const ast = parseModule(
			`const G = () => @{
				const a = 5;
				<div>{a}</div>
			};`,
			'App.tsrx',
		);
		const block = ast.body[0].declarations[0].init.body;
		expect(block.type).toBe('JSXCodeBlock');
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.openingElement.name.name).toBe('div');
	});

	it('parses a `@{ }` block assigned to a variable', () => {
		const ast = parseModule(
			`const x = @{
				const a = 5;
				<div>{a}</div>
			};`,
			'App.tsrx',
		);
		const block = ast.body[0].declarations[0].init;
		expect(block.type).toBe('JSXCodeBlock');
		expect(block.render.openingElement.name.name).toBe('div');
	});

	it('parses an @if directive returned from a `.map()` callback', () => {
		const directive = findNode(
			`const H = items.map((i) => @if (i.ok) { <li>{i.name}</li> });`,
			'JSXIfExpression',
		);
		expect(directive.type).toBe('JSXIfExpression');
		expect(directive.consequent.body[0].type).toBe('JSXElement');
		expect(directive.consequent.body[0].openingElement.name.name).toBe('li');
	});

	it('parses an arrow component whose whole body is a `@{ }` block', () => {
		const ast = parseModule(
			`const Something = () => @{
				const a = 5;
				<div>a: {a}</div>
			};`,
			'App.tsrx',
		);
		const block = ast.body[0].declarations[0].init.body;
		expect(block.type).toBe('JSXCodeBlock');
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.openingElement.name.name).toBe('div');
		expect(block.render.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXExpressionContainer',
		]);
	});

	it('parses a function declaration whose whole body is a `@{ }` block', () => {
		const ast = parseModule(
			`function Something() @{
				const a = 5;
				<div>a: {a}</div>
			}`,
			'App.tsrx',
		);
		const fn = ast.body[0];
		expect(fn.type).toBe('FunctionDeclaration');
		expect(fn.body.type).toBe('JSXCodeBlock');
		expect(fn.body.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(fn.body.render.openingElement.name.name).toBe('div');
	});

	it('parses an empty `@{}` function declaration body', () => {
		const ast = parseModule(`function Something() @{}`, 'App.tsrx');
		const fn = ast.body[0];
		expect(fn.type).toBe('FunctionDeclaration');
		expect(fn.body.type).toBe('JSXCodeBlock');
		expect(fn.body.body).toEqual([]);
		expect(fn.body.render).toBeNull();
	});

	it('parses a `@{ }` block as an object property arrow body', () => {
		const ast = parseModule(`const obj = { Prop: () => @{ <div/> } };`, 'App.tsrx');
		const value = ast.body[0].declarations[0].init.properties[0].value;
		expect(value.type).toBe('ArrowFunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.body.render.openingElement.name.name).toBe('div');
	});

	it('parses an empty `@{}` object property arrow body', () => {
		const ast = parseModule(`const obj = { Prop: () => @{} };`, 'App.tsrx');
		const value = ast.body[0].declarations[0].init.properties[0].value;
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.body.body).toEqual([]);
		expect(value.body.render).toBeNull();
	});

	it('parses a `@{ }` block as a method shorthand body', () => {
		const ast = parseModule(`const obj = { Render() @{ <div/> } };`, 'App.tsrx');
		const value = ast.body[0].declarations[0].init.properties[0].value;
		expect(value.type).toBe('FunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.body.render.openingElement.name.name).toBe('div');
	});

	it('parses a `@{ }` block as a function body following a return type', () => {
		const ast = parseModule(`function App(): JSX.Element @{}`, 'App.tsrx');
		const fn = ast.body[0];
		expect(fn.type).toBe('FunctionDeclaration');
		expect(fn.body.type).toBe('JSXCodeBlock');
		expect(fn.body.body).toEqual([]);
		expect(fn.body.render).toBeNull();
		expect(fn.returnType.type).toBe('TSTypeAnnotation');
		expect(fn.returnType.typeAnnotation.type).toBe('TSTypeReference');
	});

	it('splits setup and render in a `@{ }` body after a return type', () => {
		const ast = parseModule(
			`function App(): JSX.Element @{
				const a = 5;
				<div>a: {a}</div>
			}`,
			'App.tsrx',
		);
		const fn = ast.body[0];
		expect(fn.returnType.typeAnnotation.type).toBe('TSTypeReference');
		expect(fn.body.type).toBe('JSXCodeBlock');
		expect(fn.body.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(fn.body.render.openingElement.name.name).toBe('div');
	});

	it('parses a `@{ }` block as an arrow concise body after a return type', () => {
		const ast = parseModule(`const App = (): JSX.Element => @{ <div/> };`, 'App.tsrx');
		const value = ast.body[0].declarations[0].init;
		expect(value.type).toBe('ArrowFunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.returnType.typeAnnotation.type).toBe('TSTypeReference');
		expect(value.body.render.openingElement.name.name).toBe('div');
	});

	it('parses a `@{ }` block as an anonymous function-expression body', () => {
		const ast = parseModule(`const obj = { render: function() @{} };`, 'App.tsrx');
		const value = ast.body[0].declarations[0].init.properties[0].value;
		expect(value.type).toBe('FunctionExpression');
		expect(value.id).toBeNull();
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.body.body).toEqual([]);
		expect(value.body.render).toBeNull();
	});

	it('parses a `@{ }` anonymous function-expression body after a return type', () => {
		const ast = parseModule(`const obj = { render: function(): JSX.Element @{} };`, 'App.tsrx');
		const value = ast.body[0].declarations[0].init.properties[0].value;
		expect(value.type).toBe('FunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.returnType.typeAnnotation.type).toBe('TSTypeReference');
	});

	it('parses a `@{ }` method shorthand body after a return type', () => {
		const ast = parseModule(`const obj = { Render(): JSX.Element @{ <div/> } };`, 'App.tsrx');
		const value = ast.body[0].declarations[0].init.properties[0].value;
		expect(value.type).toBe('FunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.returnType.typeAnnotation.type).toBe('TSTypeReference');
		expect(value.body.render.openingElement.name.name).toBe('div');
	});

	it('parses a `@{ }` body on a generic function with a return type', () => {
		const ast = parseModule(`function Test<T>(value: T): T @{}`, 'App.tsrx');
		const fn = ast.body[0];
		expect(fn.type).toBe('FunctionDeclaration');
		expect(fn.typeParameters.params.map((p) => p.name.name ?? p.name)).toEqual(['T']);
		expect(fn.returnType.typeAnnotation.type).toBe('TSTypeReference');
		expect(fn.body.type).toBe('JSXCodeBlock');
	});

	it('parses a `@{ }` body with multiple type parameters and a tuple return type', () => {
		const ast = parseModule(`function Test<T, U>(first: T, second: U): [T, U] @{}`, 'App.tsrx');
		const fn = ast.body[0];
		expect(fn.typeParameters.params).toHaveLength(2);
		expect(fn.returnType.typeAnnotation.type).toBe('TSTupleType');
		expect(fn.body.type).toBe('JSXCodeBlock');
	});

	it('parses a `@{ }` body with a constrained type parameter', () => {
		const ast = parseModule(
			`function Test<T extends { id: string }>(item: T): string @{}`,
			'App.tsrx',
		);
		const fn = ast.body[0];
		expect(fn.typeParameters.params[0].constraint.type).toBe('TSTypeLiteral');
		expect(fn.returnType.typeAnnotation.type).toBe('TSStringKeyword');
		expect(fn.body.type).toBe('JSXCodeBlock');
	});

	it('parses a `@{ }` body with a defaulted type parameter', () => {
		const ast = parseModule(`function Test<T = string>(value: T): T @{}`, 'App.tsrx');
		const fn = ast.body[0];
		expect(fn.typeParameters.params[0].default.type).toBe('TSStringKeyword');
		expect(fn.returnType.typeAnnotation.type).toBe('TSTypeReference');
		expect(fn.body.type).toBe('JSXCodeBlock');
	});

	it('parses a `@{ }` body on a generic function with a union return type', () => {
		const ast = parseModule(`function Test<T>(items: T[]): T | undefined @{}`, 'App.tsrx');
		const fn = ast.body[0];
		expect(fn.typeParameters.params.map((p) => p.name.name ?? p.name)).toEqual(['T']);
		const union = fn.returnType.typeAnnotation;
		expect(union.type).toBe('TSUnionType');
		expect(union.types.map((t) => t.typeName?.name ?? t.type)).toEqual(['T', 'TSUndefinedKeyword']);
		expect(fn.body.type).toBe('JSXCodeBlock');
	});

	it('rejects an arrow token between a function return type and a `@{ }` body', () => {
		expect(() => parseModule(`function App(): JSX.Element => @{}`, 'App.tsrx')).toThrow(
			/Unexpected token/,
		);
	});

	it('parses a typed arrow property whose concise body is a `@{ }` block', () => {
		const ast = parseModule(`const obj = { Render: (): JSX.Element => @{ <div/> } };`, 'App.tsrx');
		const value = ast.body[0].declarations[0].init.properties[0].value;
		expect(value.type).toBe('ArrowFunctionExpression');
		expect(value.returnType.typeAnnotation.type).toBe('TSTypeReference');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.body.render.openingElement.name.name).toBe('div');
	});

	it('rejects duplicate params in a `@{ }` function body after a return type', () => {
		expect(() => parseModule(`function App(a, a): JSX.Element @{}`, 'App.tsrx')).toThrow(
			/Argument name clash/,
		);
	});

	it('rejects non-code-block directives as function bodies after a return type', () => {
		expect(() =>
			parseModule(`function App(): JSX.Element @if (show) { <div/> }`, 'App.tsrx'),
		).toThrow(/Unexpected token/);
	});

	it('assigns each @-control directive directly to a variable', () => {
		const cases = [
			['const x = @if (c) { <a/> };', 'JSXIfExpression'],
			['const x = @for (const i of items) { <li>{i}</li> };', 'JSXForExpression'],
			["const x = @switch (v) { @case 'a': { <a/> } };", 'JSXSwitchExpression'],
			['const x = @try { <a/> } @catch (e) { <b/> };', 'JSXTryExpression'],
		];
		for (const [source, type] of cases) {
			const init = parseModule(source, 'App.tsrx').body[0].declarations[0].init;
			expect(init.type, source).toBe(type);
		}
	});

	it('returns a `@{ }` block and each @-control directive directly', () => {
		const cases = [
			['function App() { return @{ const a = 5; <div>{a}</div> }; }', 'JSXCodeBlock'],
			['function App() { return @if (c) { <a/> }; }', 'JSXIfExpression'],
			['function App() { return @for (const i of xs) { <li>{i}</li> }; }', 'JSXForExpression'],
			["function App() { return @switch (v) { @case 'a': { <a/> } }; }", 'JSXSwitchExpression'],
			['function App() { return @try { <a/> } @catch (e) { <b/> }; }', 'JSXTryExpression'],
		];
		for (const [source, type] of cases) {
			const statement = parseModule(source, 'App.tsrx').body[0].body.body[0];
			expect(statement.type, source).toBe('ReturnStatement');
			expect(statement.argument.type, source).toBe(type);
		}
	});

	it('parses a `@{ }` block and each @-control directive as expression statements', () => {
		const cases = [
			['function App() { @{ const a = 5; <div>{a}</div> }; }', 'JSXCodeBlock'],
			['function App() { @if (c) { <a/> }; }', 'JSXIfExpression'],
			['function App() { @for (const i of xs) { <li>{i}</li> }; }', 'JSXForExpression'],
			["function App() { @switch (v) { @case 'a': { <a/> } }; }", 'JSXSwitchExpression'],
			['function App() { @try { <a/> } @catch (e) { <b/> }; }', 'JSXTryExpression'],
		];
		for (const [source, type] of cases) {
			const statement = parseModule(source, 'App.tsrx').body[0].body.body[0];
			expect(statement.type, source).toBe('ExpressionStatement');
			expect(statement.expression.type, source).toBe(type);
		}
	});

	it('keeps a decorated class expression parsing as a decorator, not a code block', () => {
		const ast = parseModule(`const X = @dec class {};`, 'App.tsrx');
		const init = ast.body[0].declarations[0].init;
		expect(init.type).toBe('ClassExpression');
		expect(init.decorators[0].expression.name).toBe('dec');
	});

	it('reports an error for two bare render nodes in a code block', () => {
		expect(() =>
			parseModule(
				`function App() { return <div>@{ const a = 5; <span/> <b/> }</div>; }`,
				'App.tsrx',
			),
		).toThrow(/single node/);
	});

	it('reports an error for a statement after the render node', () => {
		expect(() =>
			parseModule(
				`function App() { return <div>@{ const a = 5; <span/> doThing(); }</div>; }`,
				'App.tsrx',
			),
		).toThrow(/statements cannot follow/);
	});

	it('reports an error for bare text inside a code block', () => {
		expect(() =>
			parseModule(`function App() { return <div>@{ hello world }</div>; }`, 'App.tsrx'),
		).toThrow();
	});

	it('does not throw forgotten statement-container hints during strict parsing', () => {
		const source = `export function UserBadge({ user }: UserBadgeProps): JSX.Element {
			const initials = user.name.slice(0, 2).toUpperCase();

			<button title={user.name}>{initials}</button>
		}`;

		expect(() => parseModule(source, 'App.tsrx')).not.toThrow();

		const errors = [];
		parseModule(source, 'App.tsrx', { collect: true, errors });
		expect(errors.map((error) => error.message)).toContain(
			"This function body contains TSRX template output, but it is a normal JavaScript block. Add '@' before the opening brace to use a TSRX statement container.",
		);
	});

	it('keeps node locations in sync after re-reading a setup statement mis-read as JSX text', () => {
		// A setup statement following a render node can be mis-tokenized as JSX text
		// that swallows the following blank line(s). Re-reading it must rewind the
		// line counter along with `pos`, otherwise every node from there on (and the
		// code block's own end, which lands past the file when there is no trailing
		// newline) gets a `loc` inflated by the swallowed newlines — crashing
		// downstream source-map mapping. No trailing newline reproduces the worst case.
		const source =
			`export function App() @{\n` +
			`\tfunction children() @{\n` +
			`\t\t<p>{'x'}</p>\n` +
			`\t}\n` +
			`\n` +
			`\t<Card {children} />\n` +
			`\n` +
			`\tconst test = 5;\n` +
			`\n` +
			`\t<div>{test}</div>\n` +
			`}`;
		const errors = [];
		const ast = parseModule(source, 'App.tsrx', { collect: true, errors });
		const total_lines = source.split('\n').length;

		// Every node's reported line must match the line its byte offset actually sits on.
		const line_of = (offset) => source.slice(0, offset).split('\n').length;
		(function walk(node) {
			if (!node || typeof node !== 'object') return;
			if (Array.isArray(node)) return node.forEach(walk);
			if (node.loc && typeof node.start === 'number') {
				expect(node.loc.start.line, `${node.type} start`).toBe(line_of(node.start));
				expect(node.loc.end.line, `${node.type} end`).toBe(line_of(node.end));
				expect(node.loc.end.line).toBeLessThanOrEqual(total_lines);
			}
			for (const key in node) {
				if (key === 'loc' || key === 'parent') continue;
				walk(node[key]);
			}
		})(ast);

		// Both authoring-rule diagnostics still land on the correct source lines.
		const messages = errors.map((e) => `${e.loc?.start?.line}:${e.message}`);
		expect(messages.some((m) => m.startsWith('8:') && /statements cannot follow/.test(m))).toBe(
			true,
		);
		expect(messages.some((m) => m.startsWith('10:') && /single node/.test(m))).toBe(true);
	});

	it('parses a code-only `@{ }` block (no render) as a function body', () => {
		const ast = parseModule(
			`function App() @{
				const a = 5;
				const b = 6;
			}`,
			'App.tsrx',
		);

		const block = ast.body[0].body;
		expect(ast.body[0].type).toBe('FunctionDeclaration');
		expect(block.type).toBe('JSXCodeBlock');
		expect(block.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		expect(block.render).toBeNull();
	});

	it('parses two sibling `@{ }` blocks as separate element children', () => {
		const returned = getReturned(`function App() {
			return <main>
				@{
					const foo = props.foo();
					<span>{foo}</span>
				}
				@{
					const bar = props.bar();
					<span>{bar}</span>
				}
			</main>;
		}`);

		expect(returned.children.map((child) => child.type)).toEqual(['JSXCodeBlock', 'JSXCodeBlock']);
		const [first, second] = returned.children;
		expect(first.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(first.render.openingElement.name.name).toBe('span');
		expect(second.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(second.render.openingElement.name.name).toBe('span');
	});

	it('parses two sibling `@if` directives as separate element children', () => {
		const returned = getReturned(`function App() {
			return <main>
				@if (props.foo()) {
					<span>{props.foo()}</span>
				}
				@if (props.bar()) {
					<span>{props.bar()}</span>
				}
			</main>;
		}`);

		const directives = returned.children.filter((child) => child.type === 'JSXIfExpression');
		expect(directives).toHaveLength(2);
		expect(directives[0].test.callee.object.name).toBe('props');
		expect(directives[0].test.callee.property.name).toBe('foo');
		expect(directives[0].consequent.body[0].openingElement.name.name).toBe('span');
		expect(directives[1].test.callee.property.name).toBe('bar');
		expect(directives[1].consequent.body[0].openingElement.name.name).toBe('span');
	});

	it('reports an error for setup plus two render nodes in an `@if` body', () => {
		expect(() =>
			parseModule(
				`function App() {
					return <main>
						@if (props.foo()) {
							const a = 5;
							<span>{props.foo()} {a}</span>

							@if (props.bar()) {
								const b = 6;
								<span>{props.bar()} {b}</span>
							}
						}
					</main>;
				}`,
				'App.tsrx',
			),
		).toThrow(/single node/);
	});

	it('reports an error for a nested `@{ }` block following a render node', () => {
		expect(() =>
			parseModule(
				`function App() {
					return <main>
						@{
							const a = 5;
							<span>{a}</span>

							@{
								const b = 6;
								<span>{b}</span>
							}
						}
					</main>;
				}`,
				'App.tsrx',
			),
		).toThrow(/single node/);
	});

	it('parses a nested `@if` with its own setup when siblings are wrapped in a fragment', () => {
		const returned = getReturned(`function App() {
			return <main>
				@if (props.foo()) {
					const a = 5;
					<>
						<span>{props.foo()} {a}</span>
						@if (props.bar()) {
							const b = 6;
							<span>{props.bar()} {b}</span>
						}
					</>
				}
			</main>;
		}`);

		const outer = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(outer.consequent.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXFragment',
		]);
		const fragment = outer.consequent.body.find((child) => child.type === 'JSXFragment');
		expect(fragment.children.map((child) => child.type)).toEqual(['JSXElement', 'JSXIfExpression']);
		const inner = fragment.children.find((child) => child.type === 'JSXIfExpression');
		expect(inner.consequent.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXElement',
		]);
		expect(inner.consequent.body[1].openingElement.name.name).toBe('span');
	});

	it('reports an error for nested `@{ }` blocks directly inside a code block body', () => {
		expect(() =>
			parseModule(
				`function App() {
					return <main>@{
						const hey = 10;
						@{
							const foo = props.foo();
							<span>{foo} {hey}</span>
						}
						@{
							const bar = props.bar();
							<span>{bar} {hey}</span>
						}
					}</main>;
				}`,
				'App.tsrx',
			),
		).toThrow(/single node/);
	});

	it('parses a single nested `@{ }` block as a code block render output', () => {
		const returned = getReturned(`function App() {
			return <main>@{
				const hey = 10;
				@{
					const foo = props.foo();
					<span>{foo} {hey}</span>
				}
			}</main>;
		}`);

		const block = returned.children[0];
		expect(block.type).toBe('JSXCodeBlock');
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXCodeBlock');
		expect(block.render.render.openingElement.name.name).toBe('span');
	});

	it('reports the one-child violation recoverably in loose mode', () => {
		const errors = [];
		const ast = parseModule(
			`function App() {
				return <main>@{
					const hey = 10;
					@{ const foo = props.foo(); <span>{foo} {hey}</span> }
					@{ const bar = props.bar(); <span>{bar} {hey}</span> }
				}</main>;
			}`,
			'App.tsrx',
			{ loose: true, errors },
		);

		// Non-fatal: parsing still produces an AST.
		expect(ast.type).toBe('Program');
		expect(errors.map((error) => error.message)).toEqual([expect.stringMatching(/single node/)]);
	});

	it('parses nested `@{ }` blocks when wrapped in a fragment render output', () => {
		const returned = getReturned(`function App() {
			return <main>@{
				const hey = 10;
				<>
					@{
						const foo = props.foo();
						<span>{foo} {hey}</span>
					}
					@{
						const bar = props.bar();
						<span>{bar} {hey}</span>
					}
				</>
			}</main>;
		}`);

		const block = returned.children[0];
		expect(block.type).toBe('JSXCodeBlock');
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXFragment');
		expect(block.render.children.map((child) => child.type)).toEqual([
			'JSXCodeBlock',
			'JSXCodeBlock',
		]);
		const [first, second] = block.render.children;
		expect(first.render.openingElement.name.name).toBe('span');
		expect(second.render.openingElement.name.name).toBe('span');
	});

	it('parses a code-only `@{ }` block (no render) as an element body', () => {
		const returned = getReturned(`function App() {
			return <div>@{
				const a = 5
				const b = 6
			}</div>;
		}`);

		expect(returned.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		expect(block.render).toBeNull();
	});

	// The boundary between a block's setup section and its single render node hinges
	// on where the render node's `<` sits. A `<tag` that begins a new line (or follows
	// a statement separator that opens an expression position) starts the render
	// output; a `<` that merely continues a value on the same line stays a relational
	// operator. This keeps badly spaced comparisons such as `aaa <b` from being
	// mistaken for a `<b>` tag.
	it('starts the render node when a bare `<tag` begins a new line after a value', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = aaa
			<b>hi</b>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.body[0].declarations[0].init.type).toBe('Identifier');
		expect(block.render.type).toBe('JSXElement');
		expect(block.render.openingElement.name.name).toBe('b');
	});

	it('keeps a same-line `value < tag-like` as a comparison, with render on the next line', () => {
		const returned = getReturned(`function App() { return <div>@{
			const r = aaa < b
			<span>{r}</span>
		}</div>; }`);

		const block = returned.children[0];
		const init = block.body[0].declarations[0].init;
		expect(init.type).toBe('BinaryExpression');
		expect(init.operator).toBe('<');
		expect(block.render.openingElement.name.name).toBe('span');
	});

	it('keeps a no-space same-line `aaa <b` as a comparison, not a `<b>` tag', () => {
		const returned = getReturned(`function App() { return <div>@{
			const r = aaa <b
			<span>{r}</span>
		}</div>; }`);

		const block = returned.children[0];
		const init = block.body[0].declarations[0].init;
		expect(init.type).toBe('BinaryExpression');
		expect(init.operator).toBe('<');
		expect(init.left.name).toBe('aaa');
		expect(init.right.name).toBe('b');
		expect(block.render.openingElement.name.name).toBe('span');
	});

	it('treats a trailing `aaa <b` with no following node as a comparison, never a render node', () => {
		const returned = getReturned(`function App() { return <div>@{
			const r = aaa <b
		}</div>; }`);

		const block = returned.children[0];
		expect(block.render).toBeNull();
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.body[0].declarations[0].init.operator).toBe('<');
	});

	it('still starts the render node when a `<tag` follows a `;` on the same line', () => {
		const returned = getReturned(`function App() { return <div>@{
			const a = 5; <span/>
		}</div>; }`);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXElement');
		expect(block.render.openingElement.name.name).toBe('span');
	});

	it('parses a one-line `@{ }` block whose render follows the setup `;` (fragment)', () => {
		const returned = getReturned(
			`function App() { return <div>@{ const foo = 123; <>{foo}</> }</div>; }`,
		);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.body[0].declarations[0].init.value).toBe(123);
		expect(block.render.type).toBe('JSXFragment');
		expect(block.render.children.map((child) => child.type)).toEqual(['JSXExpressionContainer']);
	});

	it('parses a one-line `@{ }` block whose render follows the setup `;` (element)', () => {
		const returned = getReturned(
			`function App() { return <div>@{ const foo = 123; <span>{foo}</span> }</div>; }`,
		);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXElement');
		expect(block.render.openingElement.name.name).toBe('span');
	});

	it('parses a one-line `@{ }` block with multiple `;`-separated setup statements before the render', () => {
		const returned = getReturned(
			`function App() { return <div>@{ const a = 1; const b = 2; <span>{a}{b}</span> }</div>; }`,
		);

		const block = returned.children[0];
		expect(block.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		expect(block.render.openingElement.name.name).toBe('span');
	});

	it('parses a one-line `@{ }` block returned directly', () => {
		const statement = parseModule(
			`function App() { return @{ const foo = 123; <>{foo}</> }; }`,
			'App.tsrx',
		).body[0].body.body[0];

		expect(statement.type).toBe('ReturnStatement');
		expect(statement.argument.type).toBe('JSXCodeBlock');
		expect(statement.argument.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(statement.argument.render.type).toBe('JSXFragment');
	});

	it('applies the setup-to-render `<` disambiguation inside an `@if` consequent', () => {
		const returned = getReturned(`function App() { return <div>
			@if (ready) {
				const r = aaa <b
				<span>{r}</span>
			}
		</div>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXIfExpression');
		expect(directive.consequent.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXElement',
		]);
		const init = directive.consequent.body[0].declarations[0].init;
		expect(init.type).toBe('BinaryExpression');
		expect(init.operator).toBe('<');
		expect(directive.consequent.body[1].openingElement.name.name).toBe('span');
	});

	it('applies the setup-to-render `<` disambiguation inside an `@for` body', () => {
		const returned = getReturned(`function App() { return <ul>
			@for (const item of items) {
				const r = item <count
				<li>{r}</li>
			}
		</ul>; }`);

		const directive = returned.children.find((child) => child.type === 'JSXForExpression');
		expect(directive.body.body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXElement',
		]);
		expect(directive.body.body[0].declarations[0].init.operator).toBe('<');
		expect(directive.body.body[1].openingElement.name.name).toBe('li');
	});

	// The render node of a one-line block can be an `@if`/`@for`/`@switch`/`@try`
	// directive, not just a `<tag`. Directive bodies are implicit statement
	// containers, so they must use `{ }`.
	it('rejects a braceless `@if` render after the setup `;`', () => {
		expect(() =>
			getReturned(`function App() { return @{ const foo = 123; @if (foo) <div>{foo}</div> }; }`),
		).toThrow(/Expected `\{` after JSX control-flow directive/);
	});

	it('rejects a braceless `@if` render whose consequent begins on the next line', () => {
		expect(() =>
			getReturned(`function App() { return @{ const foo = 123; @if (foo)
				<div>{foo}</div> }; }`),
		).toThrow(/Expected `\{` after JSX control-flow directive/);
	});

	it('parses a braced `@if` render after the setup `;` on the same line', () => {
		const block = getReturned(
			`function App() { return @{ const foo = 123; @if (foo) { <div>{foo}</div> } }; }`,
		);

		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXIfExpression');
		expect(block.render.consequent.type).toBe('BlockStatement');
		expect(block.render.consequent.body.map((child) => child.type)).toEqual(['JSXElement']);
		expect(block.render.consequent.body[0].openingElement.name.name).toBe('div');
	});

	it('parses a braced `@if` render whose body begins on the next line', () => {
		const block = getReturned(`function App() { return @{ const foo = 123; @if (foo) {
			<div>{foo}</div>} }; }`);

		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXIfExpression');
		expect(block.render.consequent.body.map((child) => child.type)).toEqual(['JSXElement']);
	});

	it('parses a braced `@for` render after the setup `;` on the same line', () => {
		const block = getReturned(
			`function App() { return @{ const xs = [1, 2]; @for (const x of xs) { <li>{x}</li> } }; }`,
		);

		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXForExpression');
		expect(block.render.body.body.map((child) => child.type)).toEqual(['JSXElement']);
		expect(block.render.body.body[0].openingElement.name.name).toBe('li');
	});

	it('rejects a braceless `@for` render after the setup `;`', () => {
		expect(() =>
			getReturned(
				`function App() { return @{ const xs = [1, 2]; @for (const x of xs) <li>{x}</li> }; }`,
			),
		).toThrow(/Expected `\{` after JSX control-flow directive/);
	});

	it('rejects a braceless `@try` render after the setup `;`', () => {
		expect(() =>
			getReturned(
				`function App() { return @{ const foo = 123; @try <div>{foo}</div> catch (e) { <span /> } }; }`,
			),
		).toThrow(/Unexpected keyword 'try'|Expected token `\{/);
	});

	it('allows and ignores a trailing `;` after a render node', () => {
		const block = getReturned(
			`function App() { return @{ const foo = 123; @if (foo) { <div>{foo}</div> }; }; }`,
		);

		// The stray `;` is a meaningless empty statement; it is skipped rather than
		// captured as a body statement, so the render node still parses cleanly.
		expect(block.body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(block.render.type).toBe('JSXIfExpression');
	});

	it('allows and ignores a trailing `;` after a fragment render node', () => {
		const block = getReturned(`function App() { return @{ <><div>{'hi'}</div></>; }; }`);

		expect(block.body).toEqual([]);
		expect(block.render.type).toBe('JSXFragment');
	});
});

describe('division and private fields in template JS positions', () => {
	// `/` and `#` in template TEXT are literal characters, which the tokenizer
	// special-cases. That special case must not swallow the JS positions that sit
	// under a template element on the node path: expression containers (attribute
	// and child) and control-flow directive headers, where `/` is division and
	// `#` is a private-field access.

	it('parses `/` as division in a NESTED element attribute expression', () => {
		const rect = findElement(
			`function App(p) { return @{ <g id={p.id}><rect x={p.left - p.dotSize / 2} /></g> }; }`,
			'rect',
		);
		const x = rect.openingElement.attributes[0].value.expression;
		expect(x.type).toBe('BinaryExpression');
		expect(x.operator).toBe('-');
		expect(x.right.type).toBe('BinaryExpression');
		expect(x.right.operator).toBe('/');
	});

	it('parses `/` as division in a child expression container', () => {
		const g = findElement(`function App(p) { return @{ <g>{p.a / 2}</g> }; }`, 'g');
		const expr = g.children.find((c) => c.type === 'JSXExpressionContainer').expression;
		expect(expr.type).toBe('BinaryExpression');
		expect(expr.operator).toBe('/');
	});

	it('parses `#` as a private-field access in a child expression container', () => {
		const g = findElement(`class C { #x = 1; m() { return @{ <g>{this.#x}</g> }; } }`, 'g');
		const expr = g.children.find((c) => c.type === 'JSXExpressionContainer').expression;
		expect(expr.type).toBe('MemberExpression');
		expect(expr.property.type).toBe('PrivateIdentifier');
		expect(expr.property.name).toBe('x');
	});

	it('parses `/` as division in a directive header nested inside an element', () => {
		const node = findNode(
			`function App(p) { return @{ <g>@if (p.a / 2 > 1) { <rect /> }</g> }; }`,
			'JSXIfExpression',
		);
		expect(node.test.type).toBe('BinaryExpression');
		expect(node.test.operator).toBe('>');
		expect(node.test.left.type).toBe('BinaryExpression');
		expect(node.test.left.operator).toBe('/');
	});

	it('parses a regex literal inside a nested element attribute expression', () => {
		const rect = findElement(
			`function App(p) { return @{ <g><rect x={String(p.a).replace(/x/g, String(2 / p.b))} /></g> }; }`,
			'rect',
		);
		const x = rect.openingElement.attributes[0].value.expression;
		expect(x.type).toBe('CallExpression');
		expect(x.arguments[0].type).toBe('Literal');
		expect(x.arguments[0].regex).toEqual({ pattern: 'x', flags: 'g' });
	});

	it('still reads a literal `/` and `#` in template text as text', () => {
		const div = findElement(
			`function App(p) { return @{ <div>5/2 #tag {p.a}/{p.b}</div> }; }`,
			'div',
		);
		const text = div.children
			.filter((c) => c.type === 'JSXText')
			.map((c) => c.value)
			.join('|');
		expect(text).toContain('5/2 #tag ');
		expect(text).toContain('/');
	});
});

describe('raw-text <script> elements', () => {
	it('captures the body verbatim as `content` and mirrors it as a single JSXText child', () => {
		const script = findElement(
			`function App() @{ <head><script>const x = 1; foo();</script></head> }`,
			'script',
		);
		expect(script.type).toBe('JSXElement');
		expect(script.content).toBe('const x = 1; foo();');
		// The body is mirrored as one JSXText child (like JSXStyleElement's css +
		// parsed children) so generic element consumers emit it verbatim.
		expect(script.children).toHaveLength(1);
		expect(script.children[0].type).toBe('JSXText');
		expect(script.children[0].value).toBe('const x = 1; foo();');
	});

	it('reads JS with markup-significant characters (`<`, `{`, `}`) that would otherwise break parsing', () => {
		const script = findElement(
			`function App() @{ <head><script>if (a < b) { arr.map(x => x < 2); }</script></head> }`,
			'script',
		);
		expect(script.content).toBe('if (a < b) { arr.map(x => x < 2); }');
	});

	it('preserves TypeScript syntax and the `type` attribute', () => {
		const script = findElement(
			`function App() @{ <head><script type="text/typescript">const n: number = 1;</script></head> }`,
			'script',
		);
		expect(script.content).toBe('const n: number = 1;');
		const typeAttr = script.openingElement.attributes.find((a) => a.name?.name === 'type');
		expect(typeAttr?.value?.value).toBe('text/typescript');
	});

	it('exposes body offsets that match `content` (opening tag end -> closing tag start)', () => {
		const source = `function App() @{ <head><script>const y = 2;</script></head> }`;
		const script = findElement(source, 'script');
		const start = script.openingElement.end;
		const end = script.closingElement.start;
		expect(source.slice(start, end)).toBe(script.content);
	});

	it('leaves self-closing `<script src=... />` as an ordinary element with no raw content', () => {
		const script = findElement(`function App() @{ <head><script src={url} /></head> }`, 'script');
		expect(script.openingElement.selfClosing).toBe(true);
		expect(script.content).toBeUndefined();
	});

	it('keeps a multi-line body verbatim including newlines', () => {
		const script = findElement(
			`function App() @{ <head><script>\nconst a = 1;\nconst b = a < 2;\n</script></head> }`,
			'script',
		);
		expect(script.content).toBe('\nconst a = 1;\nconst b = a < 2;\n');
	});
});
