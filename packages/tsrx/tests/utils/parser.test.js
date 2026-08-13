/** @import * as AST from 'estree' */
/** @import { TSESTree } from '@typescript-eslint/types' */
/** @import { CompileError, NodeOfType, NodeTypeName } from '../../types/index' */
/** @import * as ESTreeJSX from 'estree-jsx' */

import { describe, expect, it } from 'vitest';
import { parseModule } from '../../src/index.js';
import { node_children } from '../../src/utils/ast.js';
import { as_type, assert_type } from '../shared/node-types.js';

/**
 * Walk every node reachable from `value`, stopping at the first one `match`
 * accepts.
 *
 * @param {unknown} value
 * @param {(node: AST.Node) => boolean} match
 * @returns {AST.Node | undefined}
 */
function find_first(value, match) {
	if (!value || typeof value !== 'object') return undefined;

	if (Array.isArray(value)) {
		for (const item of value) {
			const found = find_first(item, match);
			if (found) return found;
		}
		return undefined;
	}

	const node = /** @type {AST.Node & Record<string, unknown>} */ (value);
	if (typeof node.type === 'string' && match(node)) return node;

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end') continue;
		const found = find_first(node[key], match);
		if (found) return found;
	}

	return undefined;
}

/**
 * What a component returns, asserted to be JSX — the common case in these
 * tests. Use {@link getReturnedExpression} when the return value is something
 * else (a ternary, an array, a call).
 *
 * @param {string} source
 * @returns {AST.TSRXJSXElement | AST.TSRXJSXFragment | AST.JSXStyleElement | AST.JSXCodeBlock}
 */
function getReturned(source) {
	const returned = getReturnedExpression(source);
	if (
		returned.type !== 'JSXElement' &&
		returned.type !== 'JSXFragment' &&
		returned.type !== 'JSXStyleElement' &&
		returned.type !== 'JSXCodeBlock'
	) {
		throw new Error(`Expected the component to return JSX, got ${returned.type}`);
	}
	return returned;
}

/**
 * What a component returns, asserted to be a `@{ … }` code block.
 *
 * @param {string} source
 * @returns {AST.JSXCodeBlock}
 */
function getReturnedCodeBlock(source) {
	const returned = getReturnedExpression(source);
	assert_type(returned, 'JSXCodeBlock');
	return returned;
}

/**
 * What a component returns: the first statement of a top-level function when it
 * is a `return`, or — for components nested inside another function — the first
 * JSX-returning `return` anywhere in the tree.
 *
 * @param {string} source
 * @returns {AST.Expression}
 */
function getReturnedExpression(source) {
	const ast = parseModule(source, 'App.tsrx');
	const first = ast.body[0];
	if (first?.type === 'FunctionDeclaration') {
		const statement = first.body.body[0];
		if (statement?.type === 'ReturnStatement' && statement.argument) {
			return statement.argument;
		}
	}

	const found = find_first(
		ast,
		(node) => node.type === 'ReturnStatement' && is_jsx_output(node.argument),
	);
	const argument = found?.type === 'ReturnStatement' ? found.argument : null;
	if (!argument) {
		throw new Error('No `return` statement with a value found in source');
	}
	return argument;
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {node is AST.TSRXJSXElement | AST.TSRXJSXFragment}
 */
function is_jsx_output(node) {
	return node?.type === 'JSXFragment' || node?.type === 'JSXElement';
}

/**
 * Find the first node of `type` anywhere in the parsed tree.
 *
 * @template {NodeTypeName} T
 * @param {string} source
 * @param {T} type
 * @returns {NodeOfType<T>}
 */
function findNode(source, type) {
	const ast = parseModule(source, 'App.tsrx');
	const found = find_first(ast, (node) => node.type === type);
	if (!found) throw new Error(`No ${type} node found in source`);
	return /** @type {NodeOfType<T>} */ (found);
}

/**
 * Find the first JSXElement with the given tag name anywhere in the parsed tree.
 *
 * @param {string} source
 * @param {string} tagName
 * @returns {AST.TSRXJSXElement}
 */
function findElement(source, tagName) {
	const ast = parseModule(source, 'App.tsrx');
	const found = find_first(ast, (node) => {
		if (node.type !== 'JSXElement') return false;
		const name = /** @type {AST.TSRXJSXElement} */ (node).openingElement?.name;
		return (name?.type === 'JSXIdentifier' || name?.type === 'Identifier') && name.name === tagName;
	});
	if (!found) throw new Error(`No <${tagName}> element found in source`);
	return /** @type {AST.TSRXJSXElement} */ (found);
}

/**
 * The statements of the program's first top-level function declaration.
 *
 * @param {AST.Program} ast
 * @returns {AST.Statement[]}
 */
function functionBody(ast) {
	const [first] = ast.body;
	assert_type(first, 'FunctionDeclaration');
	return first.body.body;
}

/**
 * An element's tag name, asserted to be a plain JSX identifier.
 *
 * @param {AST.TSRXJSXElement | AST.JSXStyleElement} element
 * @returns {ESTreeJSX.JSXIdentifier}
 */
function openingName(element) {
	return as_type(element.openingElement.name, 'JSXIdentifier');
}

/**
 * The node's child at `index`, asserted to be `type`.
 *
 * @template {NodeTypeName} T
 * @param {AST.Node} node
 * @param {number} index
 * @param {T} type
 * @returns {NodeOfType<T>}
 */
function child(node, index, type) {
	return as_type(node_children(node)[index], type);
}

/**
 * The initializer of a variable declaration's first declarator.
 *
 * @param {AST.Node | null | undefined} statement
 * @returns {AST.Expression}
 */
function declaratorInit(statement) {
	const init = as_type(statement, 'VariableDeclaration').declarations[0]?.init;
	if (!init) throw new Error('variable declaration has no initializer');
	return init;
}

/**
 * The expression inside a JSX attribute's `{ … }` value.
 *
 * @param {AST.Node | null | undefined} attribute
 * @returns {AST.Expression}
 */
function attributeExpression(attribute) {
	const value = as_type(attribute, 'JSXAttribute').value;
	const expression = as_type(value, 'JSXExpressionContainer').expression;
	if (expression.type === 'JSXEmptyExpression') {
		throw new Error('attribute value container is empty');
	}
	return expression;
}

/**
 * The statements of a block.
 *
 * @param {AST.Node | null | undefined} node
 * @returns {AST.Statement[]}
 */
function blockBody(node) {
	return as_type(node, 'BlockStatement').body;
}

/**
 * The `{ … }` expression a dynamic tag name (`<{Tag} />`) holds.
 *
 * @param {AST.TSRXJSXElement} element
 * @returns {AST.Expression}
 */
function dynamicName(element) {
	const container = as_type(element.openingElement.name, 'JSXExpressionContainer');
	const expression = container.expression;
	if (expression.type === 'JSXEmptyExpression') {
		throw new Error('dynamic tag name container is empty');
	}
	return expression;
}

/**
 * The setup statements and render output of a `@{ … }` code block.
 *
 * @param {AST.Node | null | undefined} node
 * @returns {AST.JSXCodeBlock}
 */
function codeBlock(node) {
	return as_type(node, 'JSXCodeBlock');
}

/**
 * A code block's render output, asserted to be present.
 *
 * @param {AST.Node | null | undefined} node
 * @returns {AST.Node}
 */
function codeBlockRender(node) {
	const render = codeBlock(node).render;
	if (!render) throw new Error('code block has no render output');
	return render;
}

/** The elements of an array expression, with holes rejected.
 *
 * @param {AST.Node | null | undefined} node
 * @returns {AST.Expression[]}
 */
function arrayElements(node) {
	return as_type(node, 'ArrayExpression').elements.map((element) => {
		if (!element || element.type === 'SpreadElement') {
			throw new Error('array element is a hole or a spread');
		}
		return element;
	});
}

/**
 * The program's first statement, asserted to be `type`.
 *
 * @template {NodeTypeName} T
 * @param {AST.Program} ast
 * @param {T} type
 * @returns {NodeOfType<T>}
 */
function firstStatement(ast, type) {
	return as_type(ast.body[0], type);
}

/**
 * The declaration an `export` statement carries.
 *
 * @param {AST.Program} ast
 * @returns {AST.Node}
 */
function exportedDeclaration(ast) {
	const declaration = firstStatement(ast, 'ExportNamedDeclaration').declaration;
	if (!declaration) throw new Error('export statement has no declaration');
	return declaration;
}

/**
 * The value of an optional lookup, asserted to exist.
 *
 * @template T
 * @param {T | null | undefined} value
 * @returns {T}
 */
function found(value) {
	assert_found(value);
	return /** @type {T} */ (value);
}

/**
 * Assert that an optional lookup found something, narrowing out `undefined`.
 *
 * @param {unknown} value
 * @returns {asserts value}
 */
function assert_found(value) {
	expect(value).toBeDefined();
	expect(value).not.toBeNull();
}

/**
 * The `regex` payload of a regular-expression literal.
 *
 * @param {AST.Node | null | undefined} node
 * @returns {AST.RegExpLiteral['regex']}
 */
function regexLiteral(node) {
	const literal = as_type(node, 'Literal');
	if (!('regex' in literal) || !literal.regex) throw new Error('not a regular expression literal');
	return literal.regex;
}

/**
 * Every node reachable from `value`, in walk order.
 *
 * @param {unknown} value
 * @returns {AST.Node[]}
 */
function allNodes(value) {
	/** @type {AST.Node[]} */
	const nodes = [];
	find_first(value, (node) => {
		nodes.push(node);
		return false;
	});
	return nodes;
}

describe('TSRX parser', () => {
	describe('deferred imports', () => {
		it('parses a deferred namespace import with its phase and source', () => {
			const [declaration] = parseModule(
				"import defer * as feature from './feature.js';",
				'App.tsrx',
			).body;

			assert_type(declaration, 'ImportDeclaration');
			expect(declaration.phase).toBe('defer');
			expect(declaration.specifiers).toHaveLength(1);
			expect(declaration.specifiers[0].type).toBe('ImportNamespaceSpecifier');
			expect(declaration.specifiers[0].local.name).toBe('feature');
			expect(declaration.source.value).toBe('./feature.js');
		});

		it('parses import attributes on a deferred namespace import', () => {
			const [declaration] = parseModule(
				"import defer * as feature from './feature.json' with { type: 'json' };",
				'App.tsrx',
			).body;

			expect(as_type(declaration, 'ImportDeclaration').phase).toBe('defer');
			expect(as_type(declaration, 'ImportDeclaration').attributes).toHaveLength(1);
			expect(
				as_type(as_type(declaration, 'ImportDeclaration').attributes[0].key, 'Identifier').name,
			).toBe('type');
			expect(as_type(declaration, 'ImportDeclaration').attributes[0].value.value).toBe('json');
		});

		it('parses a dynamic deferred import with options and trailing commas', () => {
			const expression = findNode(
				"const feature = import.defer('./feature.json', { with: { type: 'json' } },);",
				'ImportExpression',
			);

			expect(expression.phase).toBe('defer');
			expect(as_type(expression.source, 'Literal').value).toBe('./feature.json');
			expect(expression.options?.type).toBe('ObjectExpression');

			const trailing = findNode(
				"const feature = import.defer('./feature.js',);",
				'ImportExpression',
			);
			expect(trailing.phase).toBe('defer');
			expect(trailing.options).toBeNull();
		});

		it('keeps defer as a normal default import binding when followed by from', () => {
			const [declaration] = parseModule("import defer from './feature.js';", 'App.tsrx').body;

			expect(as_type(declaration, 'ImportDeclaration').phase).toBeUndefined();
			expect(as_type(declaration, 'ImportDeclaration').specifiers).toHaveLength(1);
			expect(as_type(declaration, 'ImportDeclaration').specifiers[0].type).toBe(
				'ImportDefaultSpecifier',
			);
			expect(as_type(declaration, 'ImportDeclaration').specifiers[0].local.name).toBe('defer');
		});

		it('keeps the existing AST shape for ordinary dynamic import options', () => {
			const expression = findNode(
				"const feature = import('./feature.json', { with: { type: 'json' } });",
				'ImportExpression',
			);

			expect(expression.phase).toBeUndefined();
			expect(expression.options).toBeUndefined();
			expect(expression.arguments).toHaveLength(1);
		});

		it('rejects deferred default, named, and bare imports', () => {
			for (const source of [
				"import defer feature from './feature.js';",
				"import defer { feature } from './feature.js';",
				"import defer './feature.js';",
			]) {
				expect(() => parseModule(source, 'App.tsrx')).toThrow(
					'`import defer` only supports a namespace import from a string literal.',
				);
			}
		});
	});

	it('parses returned tags as JSXElement nodes', () => {
		const returned = getReturned('function MyApp() { return <div />; }');

		assert_type(returned, 'JSXElement');
		expect(openingName(returned).name).toBe('div');
		expect(as_type(returned, 'JSXElement').openingElement.selfClosing).toBe(true);
	});

	it('parses returned tags after comments as JSXElement return arguments', () => {
		const returned = getReturned('function MyApp() { return /* comment */ <div />; }');

		assert_type(returned, 'JSXElement');
		expect(openingName(returned).name).toBe('div');
	});

	it('parses self-closing dynamic element tags', () => {
		const source = 'function MyApp() { return <{Tag} class="card" />; }';
		const returned = getReturned(source);

		assert_type(returned, 'JSXElement');
		expect(as_type(returned, 'JSXElement').isDynamic).toBe(true);
		expect(as_type(returned, 'JSXElement').openingElement.isDynamic).toBe(true);
		expect(as_type(returned, 'JSXElement').openingElement.selfClosing).toBe(true);
		expect(as_type(returned, 'JSXElement').closingElement).toBeNull();
		expect(as_type(returned, 'JSXElement').openingElement.name.type).toBe('JSXExpressionContainer');
		expect(
			as_type(as_type(returned, 'JSXElement').openingElement.name, 'JSXExpressionContainer')
				.isDynamic,
		).toBe(true);
		expect(dynamicName(as_type(returned, 'JSXElement')).type).toBe('Identifier');
		expect(as_type(dynamicName(as_type(returned, 'JSXElement')), 'Identifier').name).toBe('Tag');
		expect(
			source.slice(
				dynamicName(as_type(returned, 'JSXElement')).start,
				dynamicName(as_type(returned, 'JSXElement')).end,
			),
		).toBe('Tag');
	});

	it('parses dynamic element tags with matching closing tags', () => {
		const source = `function MyApp() {
			return <{Child} class="card"><div>Hello</div></{Child}>;
		}`;
		const returned = getReturned(source);

		assert_type(returned, 'JSXElement');
		expect(as_type(returned, 'JSXElement').isDynamic).toBe(true);
		expect(as_type(dynamicName(as_type(returned, 'JSXElement')), 'Identifier').name).toBe('Child');
		expect(as_type(returned, 'JSXElement').closingElement?.isDynamic).toBe(true);
		expect(as_type(returned, 'JSXElement').closingElement?.name.type).toBe(
			'JSXExpressionContainer',
		);
		expect(
			as_type(
				as_type(as_type(returned, 'JSXElement').closingElement?.name, 'JSXExpressionContainer')
					.expression,
				'Identifier',
			).name,
		).toBe('Child');
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
			const expression = dynamicName(as_type(returned, 'JSXElement'));
			expect(as_type(returned, 'JSXElement').isDynamic).toBe(true);
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

		const [declaration, statement] = functionBody(ast);
		expect(declaratorInit(declaration).type).toBe('JSXFragment');
		assert_type(statement, 'ReturnStatement');
		expect(statement.argument?.type).toBe('JSXFragment');
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

		const [declaration, statement] = functionBody(ast);
		const fragment = declaratorInit(declaration);
		assert_type(fragment, 'JSXFragment');
		expect(fragment.children.some((child) => child.type === 'JSXStyleElement')).toBe(true);
		assert_type(statement, 'ReturnStatement');
		expect(statement.argument?.type).toBe('JSXFragment');
	});

	it('honors ASI for returned tags after a newline', () => {
		const ast = parseModule(
			`function MyApp() {
				return
				<div />;
			}`,
			'App.tsrx',
		);

		const body = functionBody(ast);
		expect(body[0].type).toBe('ReturnStatement');
		expect(as_type(body[0], 'ReturnStatement').argument).toBeNull();
		expect(body[1].type).toBe('JSXElement');
		expect(as_type(as_type(body[1], 'JSXElement').openingElement.name, 'JSXIdentifier').name).toBe(
			'div',
		);
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

		const [ready, empty, fallback] = functionBody(ast);
		expect(
			as_type(
				as_type(blockBody(as_type(ready, 'IfStatement').consequent)[0], 'ReturnStatement').argument,
				'Literal',
			).value,
		).toBe('Ready');
		expect(
			as_type(
				as_type(blockBody(as_type(empty, 'IfStatement').consequent)[0], 'ReturnStatement').argument,
				'Literal',
			).value,
		).toBeNull();
		expect(found(as_type(fallback, 'ReturnStatement').argument).type).toBe('JSXElement');
	});

	it('parses fragments as JSXFragment nodes', () => {
		const ast = parseModule('const x = <><div /></>;', 'App.tsrx');

		const value = declaratorInit(firstStatement(ast, 'VariableDeclaration'));
		assert_type(value, 'JSXFragment');
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

		const value = as_type(declaratorInit(exportedDeclaration(ast)), 'ArrowFunctionExpression').body;
		assert_type(value, 'JSXFragment');
		expect(value.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(value, 0, 'JSXText').value).toContain('hello world');
	});

	it('preserves JSX text whitespace around expression children', () => {
		const returned = getReturned(
			`function App() {
				return <div>{name} is visible</div>;
			}`,
		);

		expect(node_children(returned).map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
		]);
		expect(child(returned, 1, 'JSXText').value).toBe(' is visible');
	});

	it('preserves same-line JSX whitespace text between expression children', () => {
		const returned = getReturned(
			`function App() {
				return <div>{first} {last}</div>;
			}`,
		);

		expect(node_children(returned).map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(child(returned, 1, 'JSXText').value).toBe(' ');
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

		const textarea = child(returned, 0, 'JSXExpressionContainer').expression;
		assert_type(textarea, 'JSXElement');
		expect(textarea.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(textarea, 0, 'JSXText').value).toBe('   a');
	});

	it('captures element text identically for bare and expression-container elements', () => {
		const bare = findElement(`function App() { <textarea>   a</textarea> }`, 'textarea');
		const wrapped = findElement(
			`function App() { return <>{<textarea>   a</textarea>}</>; }`,
			'textarea',
		);

		expect(child(bare, 0, 'JSXText').value).toBe('   a');
		expect(child(wrapped, 0, 'JSXText').value).toBe(child(bare, 0, 'JSXText').value);
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
		expect(child(textarea, 0, 'JSXText').value).toBe('\n    C\nabc\n');
	});

	it('preserves trailing and interior whitespace in expression-container element text', () => {
		const div = findElement(`function App() { return <>{<div>a   b   </div>}</>; }`, 'div');

		expect(div.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(div, 0, 'JSXText').value).toBe('a   b   ');
	});

	// The same preservation must hold for elements authored with TSRX template
	// syntax (`function … @{ … }`), both as bare native-template children and when
	// nested inside a `{ … }` expression container within the template body.

	it('preserves bare element text whitespace inside a TSRX template body', () => {
		const div = findElement(`function App() @{ <div>   a</div> }`, 'div');

		expect(div.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(div, 0, 'JSXText').value).toBe('   a');
	});

	it('preserves expression-container element text whitespace inside a TSRX template body', () => {
		const span = findElement(`function App() @{ <div>{<span>   x</span>}</div> }`, 'span');

		expect(span.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(span, 0, 'JSXText').value).toBe('   x');
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
		expect(child(textarea, 0, 'JSXText').value).toBe('   a');
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
		expect(child(li, 0, 'JSXText').value).toBe('   ');
	});

	it('treats backslashes in expression-container element text as literal text', () => {
		const bare = findElement(`function App() { <div>a\\nb</div> }`, 'div');
		const wrapped = findElement(`function App() { return <>{<div>a\\nb</div>}</>; }`, 'div');

		expect(bare.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(bare, 0, 'JSXText').value).toBe('a\\nb');
		expect(child(wrapped, 0, 'JSXText').value).toBe(child(bare, 0, 'JSXText').value);
	});

	// A `/` in element text must stay literal text — never the start of a regular
	// expression — including when the element is nested inside a `{ … }`
	// expression container.

	it('treats a slash in element text as literal text for bare and expression-container elements', () => {
		const bare = findElement(`function App() { return <a>x/y</a>; }`, 'a');
		const wrapped = findElement(`function App(p) { return <div>{p.c && <a>x/y</a>}</div>; }`, 'a');

		expect(bare.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(bare, 0, 'JSXText').value).toBe('x/y');
		expect(wrapped.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(wrapped, 0, 'JSXText').value).toBe('x/y');
	});

	it('treats a slash in element text inside a parenthesized expression container as literal text', () => {
		const a = findElement(`export function A(p) { return <div>{p.c && (<a>x/y</a>)}</div>; }`, 'a');

		expect(a.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(a, 0, 'JSXText').value).toBe('x/y');
	});

	it('parses a slash between adjacent expression children at the top level', () => {
		const span = findElement(`export function C(p) { return <span>{p.x}/{p.y}</span>; }`, 'span');

		expect(span.children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(child(span, 1, 'JSXText').value).toBe('/');
	});

	it('parses a slash between adjacent expression children in a nested element', () => {
		const span = findElement(
			`export function B(p) { return <div><span>{p.x}/{p.y}</span></div>; }`,
			'span',
		);

		expect(span.children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(child(span, 1, 'JSXText').value).toBe('/');
	});

	it('parses a slash between adjacent expression children inside an expression container', () => {
		const span = findElement(
			`export function B(p) { return <div>{p.c && <span>{p.x}/{p.y}</span>}</div>; }`,
			'span',
		);

		expect(span.children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(child(span, 1, 'JSXText').value).toBe('/');
	});

	it('parses a slash between adjacent expression children in a parenthesized expression container', () => {
		const b = findElement(
			`export function E(p) { return <div>{p.a && (<b>{p.x}/{p.y}</b>)}</div>; }`,
			'b',
		);

		expect(b.children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(child(b, 1, 'JSXText').value).toBe('/');
	});

	it('parses slashes in element text at deeper expression-container nesting', () => {
		const em = findElement(
			`export function F(p) {
				return <div>{p.a && (<section>{p.b ? (<em>{p.x}/{p.y} m/s</em>) : null}</section>)}</div>;
			}`,
			'em',
		);

		expect(em.children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
			'JSXExpressionContainer',
			'JSXText',
		]);
		expect(child(em, 1, 'JSXText').value).toBe('/');
		expect(child(em, 3, 'JSXText').value).toBe(' m/s');
	});

	it('still parses division inside an expression container after a nested element', () => {
		const container = findNode(
			`export function G(p) { return <div>{p.c ? (<a>x</a>) : p.a / p.b}</div>; }`,
			'ConditionalExpression',
		);

		expect(container.alternate.type).toBe('BinaryExpression');
		expect(as_type(container.alternate, 'BinaryExpression').operator).toBe('/');
	});

	/** @param {string} body */
	const inExpressionContainer = (body) => `function App() {
			return <>{<div>${body}</div>}</>;
		}`;

	it('parses an @{ } code block inside an element nested in an expression container', () => {
		const block = findNode(
			inExpressionContainer(`@{ const value = 1; <span>{value}</span> }`),
			'JSXCodeBlock',
		);

		expect(block?.type).toBe('JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('span');
	});

	it('preserves significant whitespace before a code block in a fragment', () => {
		const fragment = findNode('let a = <>   @{<b>123</b>}   </>;', 'JSXFragment');

		expect(fragment.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXCodeBlock',
			'JSXText',
		]);
		expect(child(fragment, 0, 'JSXText').value).toBe('   ');
		expect(child(fragment, 2, 'JSXText').value).toBe('   ');
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
		expect(blockBody(directive.consequent).map((child) => child.type)).toEqual(['JSXElement']);
	});

	it('parses an @if/@else directive inside an element nested in an expression container', () => {
		const directive = findNode(
			inExpressionContainer(`@if (ok) { <span>a</span> } @else { <span>b</span> }`),
			'JSXIfExpression',
		);

		expect(directive?.type).toBe('JSXIfExpression');
		expect(directive.alternate?.type).toBe('BlockStatement');
	});

	it('spans a directive clause that follows the block, for every directive', () => {
		// A directive's range has to cover its trailing clause: consumers slice
		// source by it (editor position mappings, formatters, diagnostics), and a
		// range that stops at the first block truncates the statement.
		// `@else`/`@pending`/`@catch` come for free because the statement parse
		// consumes them; `@empty` is attached after the node is finished.
		const cases = [
			['JSXIfExpression', `@if (ok) { <b>a</b> } @else { <i>b</i> }`, '@else'],
			['JSXForExpression', `@for (const x of xs) { <b>{x}</b> } @empty { <i>none</i> }`, '@empty'],
			[
				'JSXTryExpression',
				`@try { <b>a</b> } @pending { <i>l</i> } @catch (e) { <u>e</u> }`,
				'@catch',
			],
		];
		for (const [type, template, clause] of /** @type {Array<[NodeTypeName, string, string]>} */ (
			cases
		)) {
			const source = `export default function App() @{\n\t<div>\n\t\t${template}\n\t</div>\n}\n`;
			const directive = findNode(source, type);
			expect(directive, type).toBeDefined();
			expect(source.slice(directive.start, directive.end), type).toContain(clause);
			expect(source.slice(directive.start, directive.end), type).toBe(template);
		}
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

	it('parses a directive attribute value on an element with children', () => {
		// The directive's block parse restores a context-stack snapshot taken
		// inside the attribute's `{ }` container; the stale entries it leaves
		// made the `>` that finishes the opening tag lex as a relational
		// operator (self-closing parents were unaffected because `/>` has its
		// own tokenizer repair).
		const element = findElement(
			`export function FeatureCard() @{
				<ElementA prop={ @if (ok) { <div /> } }><ElementB /></ElementA>
			}`,
			'ElementA',
		);

		const [attribute] = element.openingElement.attributes;
		assert_type(attribute, 'JSXAttribute');
		expect(attribute.value?.type).toBe('JSXExpressionContainer');
		expect(attributeExpression(attribute).type).toBe('JSXIfExpression');
		expect(element.children.map((child) => child.type)).toEqual(['JSXElement']);
		expect(as_type(child(element, 0, 'JSXElement').openingElement.name, 'JSXIdentifier').name).toBe(
			'ElementB',
		);
	});

	it('parses a directive attribute value on a self-closing element', () => {
		// The self-closing form predates the container-baseline repair (the `/>`
		// tokenizer fix-up made it work); keep it covered so both tag endings
		// stay in sync, including a sibling after the tag, where stale contexts
		// would surface.
		const element = findElement(
			`export function FeatureCard() @{
				<><ElementA prop={ @if (ok) { <div /> } } /><ElementB /></>
			}`,
			'ElementA',
		);

		expect(element.openingElement.selfClosing).toBe(true);
		expect(element.closingElement).toBe(null);
		const [attribute] = element.openingElement.attributes;
		assert_type(attribute, 'JSXAttribute');
		expect(attributeExpression(attribute).type).toBe('JSXIfExpression');
		expect(element.children).toEqual([]);
	});

	it('parses a fragment-wrapped directive attribute value on an element with children', () => {
		// Unlike the bare-directive case, the container's first token here is the
		// fragment's `<`, whose tag contexts must not count toward the depth the
		// stack unwinds to when the container closes — otherwise the `>` after
		// `}` lexes as template text.
		const element = findElement(
			`export function FeatureCard() @{
				<ElementA prop={<>@if (ok) { <div>1</div> } @else { <div>2</div> }</>}></ElementA>
			}`,
			'ElementA',
		);

		const [attribute] = element.openingElement.attributes;
		assert_type(attribute, 'JSXAttribute');
		expect(attribute.value?.type).toBe('JSXExpressionContainer');
		expect(attributeExpression(attribute).type).toBe('JSXFragment');
		const [directive] = node_children(attributeExpression(attribute));
		assert_type(directive, 'JSXIfExpression');
		expect(directive.alternate?.type).toBe('BlockStatement');
	});

	it('parses an element-wrapped directive attribute value', () => {
		// The host element's `templateMode` is still `'script'` while its opening
		// tag parses, which routed the attribute value's element to the vanilla
		// JSX parser — turning the directive into literal text. An inline template
		// value must parse the same as one assigned to a variable first.
		const element = findElement(
			`export function FeatureCard() @{
				<ElementA prop={<h1>
					@if (ok) { <div>1</div> } @else { <div>2</div> }
				</h1>} />
			}`,
			'ElementA',
		);

		const [attribute] = element.openingElement.attributes;
		assert_type(attribute, 'JSXAttribute');
		expect(attribute.value?.type).toBe('JSXExpressionContainer');
		expect(attributeExpression(attribute).type).toBe('JSXElement');
		const directive = node_children(attributeExpression(attribute)).find(
			(child) => child.type === 'JSXIfExpression',
		);
		assert_type(directive, 'JSXIfExpression');
		expect(directive.alternate?.type).toBe('BlockStatement');
	});

	it('parses an element-wrapped directive attribute value with no whitespace around the directive', () => {
		// With no gap after `<h1>`, the vanilla-parsed text token began exactly at
		// the `@`, so the at-sign expression intercept re-parsed it as a directive
		// inside an otherwise untransformed subtree — crashing the printer.
		// Whether `@if` is a directive must not depend on leading whitespace.
		const element = findElement(
			`export function FeatureCard() @{
				<ElementA prop={<h1>@if (ok) { <div>1</div> } @else { <div>2</div> }</h1>} />
			}`,
			'ElementA',
		);

		const [attribute] = element.openingElement.attributes;
		assert_type(attribute, 'JSXAttribute');
		expect(attributeExpression(attribute).type).toBe('JSXElement');
		const [directive] = node_children(attributeExpression(attribute));
		assert_type(directive, 'JSXIfExpression');
		expect(directive.alternate?.type).toBe('BlockStatement');
	});

	it('keeps text before and after a directive in an element-wrapped attribute value', () => {
		// The tokenizer's raw-text loop used to re-anchor at the directive's `@`
		// (and at `=`), silently dropping the text it had already accumulated —
		// container-nested elements lost everything before the directive.
		const element = findElement(
			`export function FeatureCard() @{
				<ElementA prop={<h1>before @if (ok) { <div>1</div> } @else { <div>2</div> } after</h1>} />
			}`,
			'ElementA',
		);

		const [attribute] = element.openingElement.attributes;
		assert_type(attribute, 'JSXAttribute');
		expect(node_children(attributeExpression(attribute)).map((child) => child.type)).toEqual([
			'JSXText',
			'JSXIfExpression',
			'JSXText',
		]);
		const [before, , after] = node_children(attributeExpression(attribute));
		expect(as_type(before, 'JSXText').value).toBe('before ');
		expect(as_type(after, 'JSXText').value).toBe(' after');
	});

	it('keeps text before and after a directive in an element nested in an expression container', () => {
		const element = findElement(
			`export function FeatureCard() @{
				<div>{<h1>before @if (ok) { <div>1</div> } @else { <div>2</div> } after</h1>}</div>
			}`,
			'h1',
		);

		expect(element.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXIfExpression',
			'JSXText',
		]);
		const [before, , after] = element.children;
		expect(as_type(before, 'JSXText').value).toBe('before ');
		expect(as_type(after, 'JSXText').value).toBe(' after');
	});

	it('keeps a significant inline space between a sibling element and a directive in every position', () => {
		// Sibling whitespace is rendered by the browser (`<a></a> <li>` shows a
		// space), so it must not depend on which construct the template sits in.
		// The tokenizer used to drop it at the directive's `@` in container and
		// attribute positions, inside `@switch` bodies (JS switch label bail),
		// and inside value-position directives (template-script depth bail).
		const host = `<h1><a /> @if (ok) { <li>x</li> }</h1>`;
		const positions = [
			['template child', `function App({ ok }) @{ <div>${host}</div> }`],
			['directive render body', `function App({ ok }) @{ @if (ok) { ${host} } }`],
			[
				'directive value',
				`function App({ ok }) @{ const v = @if (ok) { ${host} }; <div>{v}</div> }`,
			],
			['@switch case body', `function App({ ok, c }) @{ @switch (c) { @case 1: { ${host} } } }`],
			['attribute value', `function App({ ok }) @{ <ElementA prop={${host}} /> }`],
			['expression container child', `function App({ ok }) @{ <div>{${host}}</div> }`],
		];

		for (const [position, source] of positions) {
			const element = findElement(source, 'h1');
			expect(
				element.children.map((child) => child.type),
				position,
			).toEqual(['JSXElement', 'JSXText', 'JSXIfExpression']);
			expect(child(element, 1, 'JSXText').value, position).toBe(' ');
		}
	});

	it('still drops layout indentation before a directive', () => {
		// Whitespace containing a newline is layout, not content — the JSX
		// significant-whitespace rule removes it in every position.
		const element = findElement(
			`function App({ ok, c }) @{
				const v = @switch (c) { @case 1: { <h1><a />
					@if (ok) { <li>x</li> }
				</h1> } };
				<div>{v}</div>
			}`,
			'h1',
		);

		expect(element.children.map((child) => child.type)).toEqual(['JSXElement', 'JSXIfExpression']);
	});

	it('keeps text around `=` inside a container-nested element', () => {
		// `=` is a raw-text bail boundary like `@`; the accumulated run before it
		// used to be discarded in expression-container positions.
		for (const [position, source] of [
			['expression container child', `function App() @{ <div>{<h1>a = b</h1>}</div> }`],
			['attribute value', `function App() @{ <ElementA prop={<h1>a = b</h1>} /> }`],
		]) {
			const element = findElement(source, 'h1');
			expect(
				element.children.map((child) => child.type),
				position,
			).toEqual(['JSXText']);
			expect(child(element, 0, 'JSXText').value, position).toBe('a = b');
		}
	});

	it('parses an attribute that follows a directive attribute value', () => {
		const element = findElement(
			`export function FeatureCard() @{
				<ElementA a={ @if (ok) { <div /> } } b="x">text</ElementA>
			}`,
			'ElementA',
		);

		const [a, b] = element.openingElement.attributes;
		expect(attributeExpression(a).type).toBe('JSXIfExpression');
		expect(as_type(b, 'JSXAttribute').name.name).toBe('b');
		expect(as_type(as_type(b, 'JSXAttribute').value, 'Literal').value).toBe('x');
	});

	it('preserves element-text whitespace inside a directive in an expression container', () => {
		const span = findElement(inExpressionContainer(`@if (ok) { <span>   keep</span> }`), 'span');

		expect(span.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(span, 0, 'JSXText').value).toBe('   keep');
	});

	it('parses a multiline parenthesized self-closing element in an expression', () => {
		const ast = parseModule(
			`const value = (
				<Item />
			);
			const after = true;`,
			'App.tsrx',
		);

		const [valueDeclaration, afterDeclaration] = ast.body;
		const value = declaratorInit(valueDeclaration);
		assert_type(value, 'JSXElement');
		expect(openingName(value).name).toBe('Item');
		expect(as_type(declaratorInit(afterDeclaration), 'Literal').value).toBe(true);
	});

	it('parses a return ternary from a self-closing element to a fragment', () => {
		const returned = getReturnedExpression(
			`function App(condition) {
				return condition ? (
					<Item />
				) : (
					<>
						<Item />
					</>
				);
			}`,
		);

		assert_type(returned, 'ConditionalExpression');
		expect(returned.consequent.type).toBe('JSXElement');
		expect(returned.alternate.type).toBe('JSXFragment');
		expect(node_children(returned.alternate).map((child) => child.type)).toEqual(['JSXElement']);
	});

	it('parses a return ternary from a self-closing element to an array', () => {
		const returned = getReturnedExpression(
			`function App(condition) {
				return condition ? (
					<Item />
				) : (
					[<Item />]
				);
			}`,
		);

		assert_type(returned, 'ConditionalExpression');
		expect(returned.consequent.type).toBe('JSXElement');
		expect(returned.alternate.type).toBe('ArrayExpression');
		expect(arrayElements(returned.alternate).map((element) => element.type)).toEqual([
			'JSXElement',
		]);
	});

	it('parses same-line JSX elements in an array expression', () => {
		const ast = parseModule(
			'const fruits = [<Item key="apple">Apple</Item>, <Item key="banana">Banana</Item>];',
			'App.tsx',
		);

		const fruits = declaratorInit(firstStatement(ast, 'VariableDeclaration'));
		assert_type(fruits, 'ArrayExpression');
		expect(arrayElements(fruits).map((element) => element.type)).toEqual([
			'JSXElement',
			'JSXElement',
		]);
		expect(arrayElements(fruits).map((element) => child(element, 0, 'JSXText').value)).toEqual([
			'Apple',
			'Banana',
		]);
	});

	it('parses a same-line JSX array inside an expression child', () => {
		const returned = getReturned(
			`function App() {
				return <Item title="Root">{[<Item key="c1">A</Item>, <Item key="c2">B</Item>] as any}</Item>;
			}`,
		);

		const array = as_type(
			child(returned, 0, 'JSXExpressionContainer').expression,
			'TSAsExpression',
		).expression;
		assert_type(array, 'ArrayExpression');
		expect(arrayElements(array).map((element) => element.type)).toEqual([
			'JSXElement',
			'JSXElement',
		]);
		expect(arrayElements(array).map((element) => child(element, 0, 'JSXText').value)).toEqual([
			'A',
			'B',
		]);
	});

	it('preserves template text after a self-closing child', () => {
		const returned = getReturned(
			`function App() {
				return <div>
					<Item />
					tail
				</div>;
			}`,
		);

		expect(node_children(returned).map((child) => child.type)).toEqual(['JSXElement', 'JSXText']);
		expect(child(returned, 1, 'JSXText').value).toContain('tail');
	});

	it('parses a ternary with JSX element branches inside an expression container', () => {
		const returned = getReturned(
			`function App() {
				return <>{cond ? <div>yes</div> : <span>no</span>}</>;
			}`,
		);

		const expression = child(returned, 0, 'JSXExpressionContainer').expression;
		assert_type(expression, 'ConditionalExpression');
		expect(expression.consequent.type).toBe('JSXElement');
		expect(expression.alternate.type).toBe('JSXElement');
	});

	it('parses a ternary with JSX fragment branches inside an expression container', () => {
		const returned = getReturned(
			`function App() {
				return <>{cond ? <>yes</> : <>no</>}</>;
			}`,
		);

		const expression = child(returned, 0, 'JSXExpressionContainer').expression;
		assert_type(expression, 'ConditionalExpression');
		expect(expression.consequent.type).toBe('JSXFragment');
		expect(expression.alternate.type).toBe('JSXFragment');
	});

	it('parses a nested ternary with JSX element branches inside an expression container', () => {
		const returned = getReturned(
			`function App() {
				return <>{a ? <div>1</div> : b ? <div>2</div> : <div>3</div>}</>;
			}`,
		);

		const outer = child(returned, 0, 'JSXExpressionContainer').expression;
		assert_type(outer, 'ConditionalExpression');
		expect(outer.consequent.type).toBe('JSXElement');
		expect(outer.alternate.type).toBe('ConditionalExpression');
		expect(as_type(outer.alternate, 'ConditionalExpression').consequent.type).toBe('JSXElement');
		expect(as_type(outer.alternate, 'ConditionalExpression').alternate.type).toBe('JSXElement');
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

		const expression = as_type(
			found(node_children(returned).find((child) => child.type === 'JSXExpressionContainer')),
			'JSXExpressionContainer',
		).expression;
		assert_type(expression, 'ConditionalExpression');
		expect(expression.consequent.type).toBe('JSXElement');
		expect(openingName(as_type(expression.consequent, 'JSXElement')).name).toBe('Outer');
		const inner = node_children(expression.consequent).find((child) => child.type === 'JSXElement');
		expect(openingName(as_type(inner, 'JSXElement')).name).toBe('Inner');
		expect(child(found(inner), 0, 'JSXText').value).toBe('hi');
		expect(expression.alternate.type).toBe('Literal');
		expect(as_type(expression.alternate, 'Literal').value).toBeNull();
	});

	it('preserves element-text whitespace in ternary branches inside an expression container', () => {
		const span = findElement(
			`function App() {
				return <>{cond ? <div>a</div> : <span>   keep</span>}</>;
			}`,
			'span',
		);

		expect(span.children.map((child) => child.type)).toEqual(['JSXText']);
		expect(child(span, 0, 'JSXText').value).toBe('   keep');
	});

	it('keeps line comments out of plain JSX fragment output', () => {
		const ast = parseModule(
			`export const FeatureCard = () => <>
				// This is a JS comment, not text.
				<div />
			</>;`,
			'App.tsrx',
		);

		const value = as_type(declaratorInit(exportedDeclaration(ast)), 'ArrowFunctionExpression').body;
		expect(node_children(value).map((child) => child.type)).toEqual(['JSXElement']);
		expect(as_type(child(value, 0, 'JSXElement').openingElement.name, 'JSXIdentifier').name).toBe(
			'div',
		);
	});

	it('treats JS-looking fragment content as JSXText', () => {
		const ast = parseModule(
			`export const FeatureCard = () => <>
				const x = 1
			</>;`,
			'App.tsrx',
		);

		const value = as_type(declaratorInit(exportedDeclaration(ast)), 'ArrowFunctionExpression').body;
		expect(node_children(value).map((child) => child.type)).toEqual(['JSXText']);
		expect(child(value, 0, 'JSXText').value).toContain('const x = 1');
	});

	// Collect every JSXText value in the tree, and parse with `collect` so the
	// recorded comments can be asserted alongside the text they were removed from.
	/** @param {string} source */
	function parseTemplateTextsAndComments(source) {
		/** @type {import('estree').Comment[]} */
		/** @type {AST.CommentWithLocation[]} */
		const comments = [];
		const ast = parseModule(source, 'App.tsrx', { collect: true, comments });
		/** @type {string[]} */
		const texts = [];
		for (const node of allNodes(ast)) {
			if (node.type === 'JSXText') texts.push(node.value);
		}
		comments.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
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

		const value = declaratorInit(firstStatement(ast, 'VariableDeclaration'));
		assert_type(value, 'JSXElement');
		expect(openingName(value).name).toBe('tsrx');
		expect(value.children[0].type).toBe('JSXElement');
	});

	it('parses style blocks as JSXStyleElement nodes', () => {
		const returned = getReturned(`function App() { return <style>
			.root {
				color: red;
			}
		</style>; }`);

		assert_type(returned, 'JSXStyleElement');
		expect(openingName(returned).name).toBe('style');
		expect(returned.children.map((child) => child.type)).toEqual(['StyleSheet']);
		expect(returned.css).toContain('color: red');
		expect(returned.metadata.styleScopeHash).toBe(returned.children[0].hash);
	});

	it('parses empty style blocks inside fragments', () => {
		const returned = getReturned('function App() { return <><style></style></>; }');

		assert_type(returned, 'JSXFragment');
		expect(returned.children.map((child) => child.type)).toEqual(['JSXStyleElement']);
		expect(child(returned, 0, 'JSXStyleElement').css).toBe('');
		expect(node_children(returned.children[0]).map((child) => child.type)).toEqual(['StyleSheet']);
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
		const style = declaratorInit(firstStatement(ast, 'VariableDeclaration'));

		expect(ast.body.map((node) => node.type)).toEqual([
			'VariableDeclaration',
			'ExpressionStatement',
			'ExportNamedDeclaration',
		]);
		assert_type(style, 'JSXStyleElement');
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

		const style = node_children(returned).find((child) => child.type === 'JSXStyleElement');
		assert_found(style);
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

		const head = node_children(returned).find(
			(child) => child.type === 'JSXElement' && openingName(child).name === 'head',
		);
		const meta = node_children(found(head)).find(
			(child) => child.type === 'JSXElement' && openingName(child).name === 'meta',
		);
		expect(as_type(meta, 'JSXElement').openingElement.selfClosing).toBe(true);
		expect(as_type(meta, 'JSXElement').closingElement).toBeNull();
	});

	it('splits setup code and render output with a `@{ }` code block', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = 1;
			<>Hello {x}</>
		}</div>; }`);

		expect(node_children(returned).map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXFragment');
		expect(node_children(codeBlockRender(block)).map((child) => child.type)).toEqual([
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(child(codeBlockRender(block), 0, 'JSXText').value).toContain('Hello');
	});

	it('allows a code-only `@{ }` block with no render output', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = 1;
			effect(() => log(x));
		}</div>; }`);

		expect(node_children(returned).map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'ExpressionStatement',
		]);
		expect(codeBlock(block).render).toBeNull();
	});

	it('allows a `@{ }` block whose body is only a render node', () => {
		const returned = getReturned(`function App() { return <div>@{
			<span>{count}</span>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		assert_type(block, 'JSXCodeBlock');
		expect(block.body).toEqual([]);
		expect(codeBlockRender(block).type).toBe('JSXElement');
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('span');
	});

	it('wraps multiple render nodes and text in a fragment', () => {
		const returned = getReturned(`function App() { return <div>@{
			const a = 5;
			<>
				for switching to if, continue and break
				<div>Hello</div>
			</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXFragment');
		expect(node_children(codeBlockRender(block)).map((child) => child.type)).toEqual([
			'JSXText',
			'JSXElement',
		]);
		expect(child(codeBlockRender(block), 0, 'JSXText').value).toContain('for switching to if');
	});

	it('parses a nested element that earns its own `@{ }` block', () => {
		const returned = getReturned(`function App() { return <div>
			<div>@{
				const a = 5;
				<span>{a}</span>
			}</div>
		</div>; }`);

		const inner = node_children(returned).find((child) => child.type === 'JSXElement');
		assert_found(inner);
		expect(openingName(inner).name).toBe('div');
		expect(inner.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = inner.children[0];
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('span');
	});

	it('parses a `@{ }` block as a fragment body', () => {
		const returned = getReturned(`function App() { return <>@{
			const a = 5;
			<div>{a}</div>
		}</>; }`);

		assert_type(returned, 'JSXFragment');
		expect(returned.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = returned.children[0];
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('div');
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
		const fragment = codeBlockRender(firstStatement(ast, 'FunctionDeclaration').body);

		expect(node_children(found(fragment)).map((child) => child.type)).toEqual([
			'JSXText',
			'JSXCodeBlock',
		]);
		expect(child(found(fragment), 0, 'JSXText').value).toContain('Hello ');
		const block = node_children(found(fragment))[1];
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['ExpressionStatement']);
		expect(
			as_type(
				as_type(
					as_type(as_type(block, 'JSXCodeBlock').body[0], 'ExpressionStatement').expression,
					'MemberExpression',
				).property,
				'Identifier',
			).name,
		).toBe('username');
		expect(codeBlock(block).render).toBeNull();
	});

	it('parses inline `@{ }` blocks between text siblings and keeps the surrounding spaces', () => {
		const returned = getReturned(`function App() { return <div>a @{x} b @{y} c</div>; }`);

		expect(node_children(returned).map((child) => child.type)).toEqual([
			'JSXText',
			'JSXCodeBlock',
			'JSXText',
			'JSXCodeBlock',
			'JSXText',
		]);
		expect(child(returned, 0, 'JSXText').value).toBe('a ');
		expect(child(returned, 2, 'JSXText').value).toBe(' b ');
		expect(child(returned, 4, 'JSXText').value).toBe(' c');
	});

	it('parses a `@{ }` block preceded by text inside an element nested in an expression container', () => {
		const span = findElement(
			`function App() { return <div>{cond ? <span>p @{q}</span> : null}</div>; }`,
			'span',
		);

		expect(span.children.map((child) => child.type)).toEqual(['JSXText', 'JSXCodeBlock']);
		expect(child(span, 0, 'JSXText').value).toBe('p ');
	});

	it('keeps a lone `@` followed by a spaced expression container as text', () => {
		const returned = getReturned(`function App() { return <div>at @ {x}</div>; }`);

		expect(node_children(returned).map((child) => child.type)).toEqual([
			'JSXText',
			'JSXExpressionContainer',
		]);
		expect(child(returned, 0, 'JSXText').value).toBe('at @ ');
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
		const returned = as_type(functionBody(ast)[0], 'ReturnStatement').argument;
		const pre = node_children(found(returned)).find((child) => child.type === 'JSXElement');
		assert_found(pre);
		const container = node_children(pre).find((child) => child.type === 'JSXExpressionContainer');
		assert_found(container);
		const expression = as_type(container, 'JSXExpressionContainer').expression;

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
		const spread = as_type(switchExpression.cases[0].consequent[0], 'JSXElement').openingElement
			.attributes[0];
		expect(as_type(spread, 'JSXSpreadAttribute').argument.type).toBe('Identifier');
		expect(as_type(as_type(spread, 'JSXSpreadAttribute').argument, 'Identifier').name).toBe(
			'attrs',
		);
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

		const elements = node_children(returned).filter((child) => child.type === 'JSXElement');
		expect(elements[0].children[0].type).toBe('JSXText');
		expect(as_type(elements[0].children[0], 'JSXText').value).toBe('const');
		expect(elements[1].children[0].type).toBe('JSXText');
		expect(as_type(elements[1].children[0], 'JSXText').value).toBe('@if');
		expect(elements[2].children[0].type).toBe('JSXText');
		expect(as_type(elements[2].children[0], 'JSXText').value).toBe('@tsrx/react');
		expect(elements[3].children[0].type).toBe('JSXText');
		expect(as_type(elements[3].children[0], 'JSXText').value).toBe('/mcp');
		expect(elements[4].children[0].type).toBe('JSXText');
		expect(as_type(elements[4].children[0], 'JSXText').value).toBe('#1177');
	});

	it('allows a JSX value in the setup section of a code block', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = <div />
			<>
				<div />
				{x}
			</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(declaratorInit(block.body[0]).type).toBe('JSXElement');
		expect(node_children(codeBlockRender(block)).map((child) => child.type)).toEqual([
			'JSXElement',
			'JSXExpressionContainer',
		]);
	});

	it('allows JSX text children in a setup-section JSX value', () => {
		const returned = getReturned(`function App() { return <>@{
			const x = <div>hello</div>
			<>{x}</>
		}</>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(node_children(declaratorInit(block.body[0]))[0].type).toBe('JSXText');
		expect(child(declaratorInit(block.body[0]), 0, 'JSXText').value).toBe('hello');
	});

	it('does not treat closing-tag text inside setup strings as markup', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = "</div><div>"
			<>Hello</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(as_type(declaratorInit(block.body[0]), 'Literal').value).toBe('</div><div>');
		expect(codeBlockRender(block).type).toBe('JSXFragment');
	});

	it('parses string and regex literals in the setup section as ordinary TS', () => {
		const returned = getReturned(`function App() { return <div>@{
			const s = "---"
			const r = /---/
			<>Hello</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		expect(as_type(declaratorInit(block.body[0]), 'Literal').value).toBe('---');
		expect(declaratorInit(block.body[1]).type).toBe('Literal');
		expect(regexLiteral(declaratorInit(block.body[1])).pattern).toBe('---');
	});

	it('parses a template literal as the sole content of a `@{ }` code block', () => {
		const block = findNode('let c = @{ `a${x}b` };', 'JSXCodeBlock');

		assert_type(block, 'JSXCodeBlock');
		expect(codeBlock(block).render).toBeNull();
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['ExpressionStatement']);
		const template = as_type(block.body[0], 'ExpressionStatement').expression;
		assert_type(template, 'TemplateLiteral');
		expect(template.quasis.map((quasi) => quasi.value.raw)).toEqual(['a', 'b']);
		expect(
			template.expressions.map((expression) => as_type(expression, 'Identifier').name),
		).toEqual(['x']);
	});

	it('parses a template literal after another statement in a `@{ }` code block', () => {
		const block = findNode('let i = @{ const a = 1; `t${a}` };', 'JSXCodeBlock');

		expect(codeBlock(block).body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'ExpressionStatement',
		]);
		const template = as_type(block.body[1], 'ExpressionStatement').expression;
		assert_type(template, 'TemplateLiteral');
		expect(template.quasis.map((quasi) => quasi.value.raw)).toEqual(['t', '']);
		expect(
			template.expressions.map((expression) => as_type(expression, 'Identifier').name),
		).toEqual(['a']);
	});

	it('does not treat tag-looking text inside setup regex literals as markup', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = /<span>/
			<>{x}</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(declaratorInit(block.body[0]).type).toBe('Literal');
		expect(regexLiteral(declaratorInit(block.body[0])).pattern).toBe('<span>');
	});

	it('reads `<value> /…/` in the setup section as a less-than against a regex', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = 3</div>/
			<>{x}</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		const init = declaratorInit(block.body[0]);
		assert_type(init, 'BinaryExpression');
		expect(init.operator).toBe('<');
		expect(as_type(init.left, 'Literal').value).toBe(3);
		expect(regexLiteral(init.right).pattern).toBe('div>');
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

		const block = declaratorInit(firstStatement(ast, 'VariableDeclaration'));
		assert_type(block, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		const init = declaratorInit(block.body[0]);
		assert_type(init, 'BinaryExpression');
		expect(init.operator).toBe('<');
		expect(as_type(init.left, 'Literal').value).toBe(123);
		expect(as_type(init.right, 'Literal').value).toBe(456);
		expect(codeBlockRender(block).type).toBe('JSXElement');
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('div');
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

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		const init = declaratorInit(block.body[0]);
		assert_type(init, 'ArrayExpression');
		expect(init.elements).toHaveLength(2);
		expect(found(init.elements[0]).type).toBe('ObjectExpression');
		expect(as_type(init.elements[0], 'ObjectExpression').properties).toHaveLength(4);
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

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['FunctionDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXElement');
		const declaration = block.body[0];
		expect(as_type(declaration, 'FunctionDeclaration').body.body[0].type).toBe('ReturnStatement');
		expect(
			found(
				as_type(as_type(declaration, 'FunctionDeclaration').body.body[0], 'ReturnStatement')
					.argument,
			).type,
		).toBe('JSXFragment');
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

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXForExpression');
		const directive = codeBlockRender(block);
		assert_found(directive);
		expect(as_type(directive, 'JSXForExpression').statementType).toBe('ForOfStatement');
		expect(
			blockBody(as_type(directive, 'JSXForExpression').body).map((child) => child.type),
		).toEqual(['IfStatement', 'JSXElement']);
		expect(
			as_type(as_type(directive, 'JSXForExpression').body.body[0], 'IfStatement').consequent.type,
		).toBe('ContinueStatement');
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
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXForExpression');
		expect(as_type(codeBlockRender(block), 'JSXForExpression').statementType).toBe(
			'ForOfStatement',
		);
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
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(node_children(codeBlockRender(block)).map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
		]);
	});

	it('treats a generic call in the setup section as script, not markup', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = foo<T>(bar)
			<>{x}</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(declaratorInit(block.body[0]).type).toBe('CallExpression');
		expect(
			as_type(as_type(declaratorInit(block.body[0]), 'CallExpression').callee, 'Identifier').name,
		).toBe('foo');
	});

	it('treats a generic arrow function in the setup section as script', () => {
		const returned = getReturned(`function App() { return <div>@{
			const id = <T>(x: T) => x
			<>{id}</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(declaratorInit(block.body[0]).type).toBe('ArrowFunctionExpression');
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

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['FunctionDeclaration']);
		const object = as_type(
			as_type(block.body[0], 'FunctionDeclaration').body.body[0],
			'ReturnStatement',
		).argument;
		expect(as_type(as_type(object, 'ObjectExpression').properties[0], 'Property').value.type).toBe(
			'FunctionExpression',
		);
		expect(
			as_type(
				as_type(as_type(object, 'ObjectExpression').properties[0], 'Property').value,
				'FunctionExpression',
			).typeParameters?.type,
		).toBe('TSTypeParameterDeclaration');
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

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual([
			'ClassDeclaration',
			'ClassDeclaration',
			'VariableDeclaration',
		]);
		const method = as_type(
			as_type(block.body[1], 'ClassDeclaration').body.body[0],
			'MethodDefinition',
		);
		expect(method.typeParameters?.type).toBe('TSTypeParameterDeclaration');
		const call = declaratorInit(block.body[2]);
		assert_type(call, 'CallExpression');
		expect(call.typeArguments?.type).toBe('TSTypeParameterInstantiation');
	});

	it('keeps whitespace-separated relational expressions out of the type-argument path', () => {
		const returned = getReturned(`function App() { return <div>@{
			const result = value < limit > floor;
			<>{result}</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		const init = declaratorInit(block.body[0]);
		assert_type(init, 'BinaryExpression');
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

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		const builder = declaratorInit(block.body[1]);
		assert_type(builder, 'FunctionExpression');
		expect(builder.typeParameters?.type).toBe('TSTypeParameterDeclaration');
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('T');
	});

	it('parses template text touching a following element as text, not a type-argument list', () => {
		const block = getReturnedCodeBlock(
			`function App() { return @{ <>hello<span>{a}</span></> }; }`,
		);

		const fragment = codeBlockRender(block);
		expect(node_children(found(fragment)).map((child) => child.type)).toEqual([
			'JSXText',
			'JSXElement',
		]);
		expect(child(found(fragment), 0, 'JSXText').value).toBe('hello');
		expect(
			as_type(child(found(fragment), 1, 'JSXElement').openingElement.name, 'JSXIdentifier').name,
		).toBe('span');
	});

	it('parses template text touching a following fragment as text, not a type-argument list', () => {
		const block = getReturnedCodeBlock(`function App() { return @{ <>hello<>{a}</></> }; }`);

		const fragment = codeBlockRender(block);
		expect(node_children(found(fragment)).map((child) => child.type)).toEqual([
			'JSXText',
			'JSXFragment',
		]);
		expect(child(found(fragment), 0, 'JSXText').value).toBe('hello');
		expect(node_children(node_children(found(fragment))[1]).map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
		]);
	});

	it('keeps expressions as containers between touching text inside an expression container', () => {
		const block = getReturnedCodeBlock(
			`function App() { return @{ <>{<>x{a}y<>{b}</>z</>}</> }; }`,
		);

		const inner = child(codeBlockRender(block), 0, 'JSXExpressionContainer').expression;
		assert_type(inner, 'JSXFragment');
		expect(inner.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXExpressionContainer',
			'JSXText',
			'JSXFragment',
			'JSXText',
		]);
		expect(as_type(child(inner, 1, 'JSXExpressionContainer').expression, 'Identifier').name).toBe(
			'a',
		);
		expect(
			as_type(
				as_type(node_children(inner.children[3])[0], 'JSXExpressionContainer').expression,
				'Identifier',
			).name,
		).toBe('b');
	});

	it('parses expression containers at every level of nested fragments in expression position', () => {
		const ast = parseModule(
			`function StatusBadge() @{
				<>{<>{a} <>{<>{a}</>}</> </>}</>
			}`,
			'App.tsrx',
		);

		const outer = codeBlockRender(firstStatement(ast, 'FunctionDeclaration').body);
		assert_type(outer, 'JSXFragment');
		expect(outer.children.map((child) => child.type)).toEqual(['JSXExpressionContainer']);

		const level2 = child(outer, 0, 'JSXExpressionContainer').expression;
		assert_type(level2, 'JSXFragment');
		expect(level2.children.map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
			'JSXText',
			'JSXFragment',
			'JSXText',
		]);
		expect(as_type(child(level2, 0, 'JSXExpressionContainer').expression, 'Identifier').name).toBe(
			'a',
		);

		const level3 = level2.children[2];
		expect(node_children(level3).map((child) => child.type)).toEqual(['JSXExpressionContainer']);

		const level4 = child(level3, 0, 'JSXExpressionContainer').expression;
		assert_type(level4, 'JSXFragment');
		expect(level4.children.map((child) => child.type)).toEqual(['JSXExpressionContainer']);
		expect(as_type(child(level4, 0, 'JSXExpressionContainer').expression, 'Identifier').name).toBe(
			'a',
		);
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
		expect(child(withText, 0, 'JSXText').value).toBe(' ');
		expect(child(withText, 2, 'JSXText').value).toBe(' 2 ');
		expect(child(withText, 4, 'JSXText').value).toBe(' ');

		const emptySiblings = findNode('let b = <> <></> 2 <></> </>', 'JSXFragment');
		expect(emptySiblings.children.map((child) => child.type)).toEqual([
			'JSXText',
			'JSXFragment',
			'JSXText',
			'JSXFragment',
			'JSXText',
		]);
		expect(child(withText, 0, 'JSXText').value).toBe(' ');
		expect(child(withText, 2, 'JSXText').value).toBe(' 2 ');
		expect(child(withText, 4, 'JSXText').value).toBe(' ');
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
		expect(child(fragment, 2, 'JSXText').value).toBe('  ');
		expect(child(fragment, 4, 'JSXText').value).toBe('something ');
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
		expect(child(pre, 0, 'JSXText').value).toBe(' ');
		expect(child(pre, 2, 'JSXText').value).toBe(' ');
		expect(child(pre, 4, 'JSXText').value).toBe(' ');
	});

	it('parses a text-then-element sibling after newline-separated elements', () => {
		const pre = findElement('let a = <pre><b>2</b>\n<b>3</b>1<b>4</b></pre>;', 'pre');
		expect(pre.children.map((child) => child.type)).toEqual([
			'JSXElement',
			'JSXElement',
			'JSXText',
			'JSXElement',
		]);
		expect(child(pre, 2, 'JSXText').value).toBe('1');
	});

	it('parses indented multi-line markup with a text-then-element sibling', () => {
		const source =
			'let a  = <pre> \n\n    <b>2</b>   \n    <b>3</b> \n    \n    1<b>4</b>\n</pre>;';
		const pre = findElement(source, 'pre');
		expect(pre.children.filter((child) => child.type === 'JSXElement')).toHaveLength(3);
		const text = pre.children.find(
			(child) => child.type === 'JSXText' && child.value.includes('1'),
		);
		expect(as_type(text, 'JSXText').value).toBe('1');
	});

	it('parses parenthesized conditional JSX spread attributes in render output', () => {
		const returned = getReturned(`function App() { return <div>@{
			let &[enabled] = track(true);
			<button {...(enabled ? { onClick: fn } : { title: 'disabled' })}>target</button>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		const spread = as_type(codeBlockRender(block), 'JSXElement').openingElement.attributes[0];
		assert_type(spread, 'JSXSpreadAttribute');
		expect(spread.argument.type).toBe('ConditionalExpression');
		expect(as_type(as_type(spread.argument, 'ConditionalExpression').test, 'Identifier').name).toBe(
			'enabled',
		);
	});

	it('parses parenthesized conditional spreads that swap ref-shaped props', () => {
		const returned = getReturned(`function App() { return <div>@{
			let &[as_ref] = track(true);
			const props = { ref: input };
			<input {...(as_ref ? { ref: props.ref } : { input_ref: 'regular prop' })} />
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		const spread = as_type(codeBlockRender(block), 'JSXElement').openingElement.attributes[0];
		assert_type(spread, 'JSXSpreadAttribute');
		expect(spread.argument.type).toBe('ConditionalExpression');
		expect(
			as_type(
				as_type(
					as_type(as_type(spread.argument, 'ConditionalExpression').consequent, 'ObjectExpression')
						.properties[0],
					'Property',
				).key,
				'Identifier',
			).name,
		).toBe('ref');
		expect(
			as_type(
				as_type(
					as_type(as_type(spread.argument, 'ConditionalExpression').alternate, 'ObjectExpression')
						.properties[0],
					'Property',
				).key,
				'Identifier',
			).name,
		).toBe('input_ref');
	});

	it('does not let a relational `>` inside an attribute break tag scanning', () => {
		// The `>` in `value={foo > bar}` must not be mistaken for the end of the
		// `<Comp ...>` opening tag while parsing a JSX value in setup.
		const returned = getReturned(`function App() { return <div>@{
			const x = <Comp value={foo > bar} />
			<>{x}</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(declaratorInit(block.body[0]).type).toBe('JSXElement');
		expect(openingName(as_type(declaratorInit(block.body[0]), 'JSXElement')).name).toBe('Comp');
	});

	it('parses template literals in the setup section', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = \`</div>
<div>\`
			<>Hello</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(declaratorInit(block.body[0]).type).toBe('TemplateLiteral');
	});

	it('parses line and block comments in the setup section', () => {
		const returned = getReturned(`function App() { return <div>@{
			// a line comment
			/* a block comment */
			const x = 1
			<>Hello</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
	});

	it('does not let a setup JSX value close the outer template', () => {
		const returned = getReturned(`function App() { return <div>@{
			const x = <section>
				<div>Script JSX</div>
			</section>
			<>{x}</>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		const scriptJsx = declaratorInit(block.body[0]);
		assert_type(scriptJsx, 'JSXElement');
		expect(openingName(scriptJsx).name).toBe('section');
		expect(
			as_type(
				as_type(
					scriptJsx.children.find((child) => child.type === 'JSXElement'),
					'JSXElement',
				).openingElement.name,
				'JSXIdentifier',
			).name,
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

		const block = child(returned, 0, 'JSXCodeBlock');
		const style = declaratorInit(block.body[0]);
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXElement');
		assert_type(style, 'JSXStyleElement');
		expect(style.children[0].type).toBe('StyleSheet');
		expect(style.css).toContain('.card');
	});

	it('keeps markup-looking text inside style content as CSS source', () => {
		const returned = getReturned(`function App() { return <style>
			.root::before {
				content: "--- </div><div>";
			}
		</style>; }`);

		assert_type(returned, 'JSXStyleElement');
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

		const component = node_children(returned).find((child) => child.type === 'JSXElement');
		assert_found(component);
		expect(openingName(component).name).toBe('Component');
		expect(component.children.map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = component.children[0];
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('button');
	});

	it('parses @if as a JSXIfExpression', () => {
		const returned = getReturned(`function App() { return <div>
			@if (ready) {
				<>Ready</>
			} @else {
				<>Waiting</>
			}
		</div>; }`);

		const directive = node_children(returned).find((child) => child.type === 'JSXIfExpression');
		assert_type(directive, 'JSXIfExpression');
		expect(directive.statementType).toBe('IfStatement');
		expect(as_type(directive.test, 'Identifier').name).toBe('ready');
		expect(blockBody(directive.consequent)[0].type).toBe('JSXFragment');
		expect(
			as_type(node_children(blockBody(directive.consequent)[0])[0], 'JSXText').value,
		).toContain('Ready');
		expect(as_type(node_children(blockBody(directive.alternate)[0])[0], 'JSXText').value).toContain(
			'Waiting',
		);
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

		const directive = node_children(returned).find((child) => child.type === 'JSXIfExpression');
		assert_found(directive);
		expect(directive.alternate?.type).toBe('IfStatement');
		expect(
			as_type(
				as_type(as_type(directive.alternate, 'IfStatement').test, 'BinaryExpression').right,
				'Literal',
			).value,
		).toBe('success');
		expect(
			as_type(
				node_children(blockBody(as_type(directive.alternate, 'IfStatement').consequent)[0])[0],
				'JSXText',
			).value,
		).toContain('Success');
		expect(
			as_type(
				node_children(blockBody(as_type(directive.alternate, 'IfStatement').alternate)[0])[0],
				'JSXText',
			).value,
		).toContain('Failed');
	});

	it('parses bare else text after an @if directive', () => {
		const returned = getReturned(`function App() { return <>
				@if (ready) {
					<b>123</b>
				} else
			</>; }`);

		const directive = node_children(returned).find((child) => child.type === 'JSXIfExpression');
		const text = node_children(returned).find(
			(child) => child.type === 'JSXText' && child.value.includes('else'),
		);

		assert_type(directive, 'JSXIfExpression');
		expect(directive.alternate).toBe(null);
		expect(as_type(text, 'JSXText').value).toMatch(/^ else/);
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

		assert_type(directive, 'JSXIfExpression');
		expect(directive.alternate).toBe(null);
		expect(as_type(text, 'JSXText').value).toBe(' else\n');
	});

	it('parses same-line trailing text after an @if block closed by a tag', () => {
		// Regression: the closing `</>` arrives as a relational `<` token because the
		// control-flow block left the tokenizer in JS mode. The manual closing-tag
		// re-entry used to underflow the tokenizer context stack (`context.length -=
		// 2`), throwing "Invalid array length". Trailing text directly before the
		// closing tag (no intervening element) is the trigger.
		const returned = getReturned(`function App() { return <>@if (a) {<b />} done</>; }`);

		const directive = node_children(returned).find((child) => child.type === 'JSXIfExpression');
		const text = node_children(returned).find((child) => child.type === 'JSXText');
		assert_found(text);

		assert_type(directive, 'JSXIfExpression');
		expect(text.value).toBe(' done');
	});

	it('parses same-line trailing text after an @for block closed by a tag', () => {
		const returned = getReturned(
			`function App() { return <>@for (const x of xs) {<b />} done</>; }`,
		);

		const directive = node_children(returned).find((child) => child.type === 'JSXForExpression');
		const text = node_children(returned).find((child) => child.type === 'JSXText');
		assert_found(text);

		assert_type(directive, 'JSXForExpression');
		expect(text.value).toBe(' done');
	});

	it('parses same-line trailing text after an @if block inside a named element', () => {
		const element = findElement(
			`function App() { return <div>@if (a) {<b />} done</div>; }`,
			'div',
		);

		const directive = element.children.find((child) => child.type === 'JSXIfExpression');
		const text = element.children.find((child) => child.type === 'JSXText');
		assert_found(text);

		assert_type(directive, 'JSXIfExpression');
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

		const directive = node_children(returned).find((child) => child.type === 'JSXIfExpression');
		assert_found(directive);
		expect(blockBody(directive.consequent).map((child) => child.type)).toEqual([
			'ExpressionStatement',
		]);
		expect(
			as_type(
				as_type(blockBody(directive.consequent)[0], 'ExpressionStatement').expression,
				'UpdateExpression',
			).operator,
		).toBe('++');
	});

	it('parses assignment-only @if body content as a statement', () => {
		const returned = getReturned(`function App() { return <div>
			@if (ready) {
				x = 123
			}
		</div>; }`);

		const directive = node_children(returned).find((child) => child.type === 'JSXIfExpression');
		assert_found(directive);
		expect(blockBody(directive.consequent).map((child) => child.type)).toEqual([
			'ExpressionStatement',
		]);
		expect(as_type(blockBody(directive.consequent)[0], 'ExpressionStatement').expression.type).toBe(
			'AssignmentExpression',
		);
	});

	it('does not treat closing-tag text inside directive setup strings as markup', () => {
		const returned = getReturned(`function App() { return <div>
			@if (ready) {
				const x = "</div><div>"
			}
		</div>; }`);

		const directive = node_children(returned).find((child) => child.type === 'JSXIfExpression');
		expect(blockBody(directive?.consequent).map((child) => child.type)).toEqual([
			'VariableDeclaration',
		]);
		expect(as_type(declaratorInit(blockBody(directive?.consequent)[0]), 'Literal').value).toBe(
			'</div><div>',
		);
	});

	it('parses @for as a JSXForExpression', () => {
		const returned = getReturned(`function App() { return <ul>
			@for (const item of items; key item.id) {
				<li>{item.label}</li>
			}
		</ul>; }`);

		const directive = node_children(returned).find((child) => child.type === 'JSXForExpression');
		assert_type(directive, 'JSXForExpression');
		expect(directive.statementType).toBe('ForOfStatement');
		if (directive.statementType !== 'ForOfStatement') throw new Error('expected a `for … of`');
		expect(
			as_type(as_type(directive.left, 'VariableDeclaration').declarations[0].id, 'Identifier').name,
		).toBe('item');
		expect(as_type(directive.right, 'Identifier').name).toBe('items');
		expect(as_type(as_type(directive.key, 'MemberExpression').property, 'Identifier').name).toBe(
			'id',
		);
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

		const block = as_type(
			found(as_type(ast.body[0], 'ExportNamedDeclaration').declaration),
			'FunctionDeclaration',
		).body;
		assert_type(block, 'JSXCodeBlock');
		expect(codeBlockRender(block).type).toBe('JSXFragment');
		expect(node_children(codeBlockRender(block)).map((child) => child.type)).toEqual([
			'JSXElement',
			'JSXElement',
			'JSXForExpression',
		]);
		expect(
			as_type(node_children(codeBlockRender(block))[2], 'JSXForExpression').body.body[0].type,
		).toBe('JSXElement');
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

		const directive = node_children(returned).find((child) => child.type === 'JSXForExpression');
		assert_type(directive, 'JSXForExpression');
		expect(directive.empty?.type).toBe('BlockStatement');
		expect(blockBody(directive.empty).map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXElement',
		]);
		expect(
			as_type(
				as_type(blockBody(directive.empty)[1], 'JSXElement').openingElement.name,
				'JSXIdentifier',
			).name,
		).toBe('li');
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

		const directive = node_children(returned).find((child) => child.type === 'JSXForExpression');
		expect(blockBody(directive?.body).map((child) => child.type)).toEqual(['ExpressionStatement']);
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

		const directive = node_children(returned).find((child) => child.type === 'JSXSwitchExpression');
		assert_type(directive, 'JSXSwitchExpression');
		expect(directive.statementType).toBe('SwitchStatement');
		expect(as_type(directive.discriminant, 'Identifier').name).toBe('value');
		expect(directive.cases).toHaveLength(3);
		expect(as_type(directive.cases[0].test, 'Literal').value).toBe('a');
		expect(directive.cases[0].consequent[0].type).toBe('JSXFragment');
		expect(as_type(node_children(directive.cases[0].consequent[0])[0], 'JSXText').value).toContain(
			'Case A',
		);
		expect(directive.cases[2].test).toBeNull();
		expect(as_type(node_children(directive.cases[2].consequent[0])[0], 'JSXText').value).toContain(
			'Fallback',
		);
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

		const directive = node_children(returned).find((child) => child.type === 'JSXTryExpression');
		assert_type(directive, 'JSXTryExpression');
		expect(directive.statementType).toBe('TryStatement');
		expect(directive.block.body[0].type).toBe('JSXElement');
		expect(blockBody(directive.pending)[0].type).toBe('JSXFragment');
		expect(as_type(node_children(blockBody(directive.pending)[0])[0], 'JSXText').value).toContain(
			'Loading',
		);
		expect(as_type(found(found(directive.handler).param), 'Identifier').name).toBe('error');
		expect(as_type(found(found(directive.handler).resetParam), 'Identifier').name).toBe('reset');
		expect(
			as_type(node_children(blockBody(directive.handler?.body)[0])[0], 'JSXText').value,
		).toContain('Failed');
	});

	it('parses code-only @try bodies', () => {
		const returned = getReturned(`function App() { return <div>
			@try {
				calls++;
			} @pending {
				<>Loading</>
			}
		</div>; }`);

		const directive = node_children(returned).find((child) => child.type === 'JSXTryExpression');
		expect(blockBody(directive?.block).map((child) => child.type)).toEqual(['ExpressionStatement']);
		expect(blockBody(directive?.pending)[0].type).toBe('JSXFragment');
	});

	it('parses a `@{ }` block returned directly from an arrow body', () => {
		const ast = parseModule(
			`const G = () => @{
				const a = 5;
				<div>{a}</div>
			};`,
			'App.tsrx',
		);
		const block = as_type(
			declaratorInit(firstStatement(ast, 'VariableDeclaration')),
			'ArrowFunctionExpression',
		).body;
		assert_type(block, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('div');
	});

	it('parses a `@{ }` block assigned to a variable', () => {
		const ast = parseModule(
			`const x = @{
				const a = 5;
				<div>{a}</div>
			};`,
			'App.tsrx',
		);
		const block = declaratorInit(firstStatement(ast, 'VariableDeclaration'));
		assert_type(block, 'JSXCodeBlock');
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('div');
	});

	it('parses an @if directive returned from a `.map()` callback', () => {
		const directive = findNode(
			`const H = items.map((i) => @if (i.ok) { <li>{i.name}</li> });`,
			'JSXIfExpression',
		);
		assert_type(directive, 'JSXIfExpression');
		expect(blockBody(directive.consequent)[0].type).toBe('JSXElement');
		expect(
			as_type(
				as_type(blockBody(directive.consequent)[0], 'JSXElement').openingElement.name,
				'JSXIdentifier',
			).name,
		).toBe('li');
	});

	it('parses an arrow component whose whole body is a `@{ }` block', () => {
		const ast = parseModule(
			`const Something = () => @{
				const a = 5;
				<div>a: {a}</div>
			};`,
			'App.tsrx',
		);
		const block = as_type(
			declaratorInit(firstStatement(ast, 'VariableDeclaration')),
			'ArrowFunctionExpression',
		).body;
		assert_type(block, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('div');
		expect(node_children(found(block.render)).map((child) => child.type)).toEqual([
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
		const fn = firstStatement(ast, 'FunctionDeclaration');
		expect(codeBlock(fn.body).type).toBe('JSXCodeBlock');
		expect(codeBlock(fn.body).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(fn.body), 'JSXElement')).name).toBe('div');
	});

	it('parses an empty `@{}` function declaration body', () => {
		const ast = parseModule(`function Something() @{}`, 'App.tsrx');
		const fn = firstStatement(ast, 'FunctionDeclaration');
		expect(codeBlock(fn.body).type).toBe('JSXCodeBlock');
		expect(codeBlock(fn.body).body).toEqual([]);
		expect(codeBlock(fn.body).render).toBeNull();
	});

	it('parses a `@{ }` block as an object property arrow body', () => {
		const ast = parseModule(`const obj = { Prop: () => @{ <div/> } };`, 'App.tsrx');
		const value = as_type(
			as_type(declaratorInit(firstStatement(ast, 'VariableDeclaration')), 'ObjectExpression')
				.properties[0],
			'Property',
		).value;
		assert_type(value, 'ArrowFunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(openingName(as_type(codeBlockRender(value.body), 'JSXElement')).name).toBe('div');
	});

	it('parses an empty `@{}` object property arrow body', () => {
		const ast = parseModule(`const obj = { Prop: () => @{} };`, 'App.tsrx');
		const value = as_type(
			as_type(declaratorInit(firstStatement(ast, 'VariableDeclaration')), 'ObjectExpression')
				.properties[0],
			'Property',
		).value;
		expect(as_type(value, 'ArrowFunctionExpression').body.type).toBe('JSXCodeBlock');
		expect(as_type(as_type(value, 'ArrowFunctionExpression').body, 'JSXCodeBlock').body).toEqual(
			[],
		);
		expect(
			as_type(as_type(value, 'ArrowFunctionExpression').body, 'JSXCodeBlock').render,
		).toBeNull();
	});

	it('parses a `@{ }` block as a method shorthand body', () => {
		const ast = parseModule(`const obj = { Render() @{ <div/> } };`, 'App.tsrx');
		const value = as_type(
			as_type(declaratorInit(firstStatement(ast, 'VariableDeclaration')), 'ObjectExpression')
				.properties[0],
			'Property',
		).value;
		assert_type(value, 'FunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(openingName(as_type(codeBlockRender(value.body), 'JSXElement')).name).toBe('div');
	});

	it('parses a `@{ }` block as a function body following a return type', () => {
		const ast = parseModule(`function App(): JSX.Element @{}`, 'App.tsrx');
		const fn = firstStatement(ast, 'FunctionDeclaration');
		expect(codeBlock(fn.body).type).toBe('JSXCodeBlock');
		expect(codeBlock(fn.body).body).toEqual([]);
		expect(codeBlock(fn.body).render).toBeNull();
		expect(found(fn.returnType).type).toBe('TSTypeAnnotation');
		expect(found(fn.returnType).typeAnnotation.type).toBe('TSTypeReference');
	});

	it('splits setup and render in a `@{ }` body after a return type', () => {
		const ast = parseModule(
			`function App(): JSX.Element @{
				const a = 5;
				<div>a: {a}</div>
			}`,
			'App.tsrx',
		);
		const fn = firstStatement(ast, 'FunctionDeclaration');
		expect(found(as_type(fn, 'FunctionDeclaration').returnType).typeAnnotation.type).toBe(
			'TSTypeReference',
		);
		expect(codeBlock(fn.body).type).toBe('JSXCodeBlock');
		expect(codeBlock(fn.body).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(fn.body), 'JSXElement')).name).toBe('div');
	});

	it('parses a `@{ }` block as an arrow concise body after a return type', () => {
		const ast = parseModule(`const App = (): JSX.Element => @{ <div/> };`, 'App.tsrx');
		const value = declaratorInit(firstStatement(ast, 'VariableDeclaration'));
		assert_type(value, 'ArrowFunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.returnType?.typeAnnotation.type).toBe('TSTypeReference');
		expect(openingName(as_type(codeBlockRender(value.body), 'JSXElement')).name).toBe('div');
	});

	it('parses a `@{ }` block as an anonymous function-expression body', () => {
		const ast = parseModule(`const obj = { render: function() @{} };`, 'App.tsrx');
		const value = as_type(
			as_type(declaratorInit(firstStatement(ast, 'VariableDeclaration')), 'ObjectExpression')
				.properties[0],
			'Property',
		).value;
		assert_type(value, 'FunctionExpression');
		expect(value.id).toBeNull();
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.body.body).toEqual([]);
		expect(codeBlock(value.body).render).toBeNull();
	});

	it('parses a `@{ }` anonymous function-expression body after a return type', () => {
		const ast = parseModule(`const obj = { render: function(): JSX.Element @{} };`, 'App.tsrx');
		const value = as_type(
			as_type(declaratorInit(firstStatement(ast, 'VariableDeclaration')), 'ObjectExpression')
				.properties[0],
			'Property',
		).value;
		assert_type(value, 'FunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.returnType?.typeAnnotation.type).toBe('TSTypeReference');
	});

	it('parses a `@{ }` method shorthand body after a return type', () => {
		const ast = parseModule(`const obj = { Render(): JSX.Element @{ <div/> } };`, 'App.tsrx');
		const value = as_type(
			as_type(declaratorInit(firstStatement(ast, 'VariableDeclaration')), 'ObjectExpression')
				.properties[0],
			'Property',
		).value;
		assert_type(value, 'FunctionExpression');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(value.returnType?.typeAnnotation.type).toBe('TSTypeReference');
		expect(openingName(as_type(codeBlockRender(value.body), 'JSXElement')).name).toBe('div');
	});

	it('parses a `@{ }` body on a generic function with a return type', () => {
		const ast = parseModule(`function Test<T>(value: T): T @{}`, 'App.tsrx');
		const fn = firstStatement(ast, 'FunctionDeclaration');
		expect(found(fn.typeParameters).params.map((p) => p.name)).toEqual(['T']);
		expect(found(fn.returnType).typeAnnotation.type).toBe('TSTypeReference');
		expect(codeBlock(fn.body).type).toBe('JSXCodeBlock');
	});

	it('parses a `@{ }` body with multiple type parameters and a tuple return type', () => {
		const ast = parseModule(`function Test<T, U>(first: T, second: U): [T, U] @{}`, 'App.tsrx');
		const fn = firstStatement(ast, 'FunctionDeclaration');
		expect(found(as_type(fn, 'FunctionDeclaration').typeParameters).params).toHaveLength(2);
		expect(found(as_type(fn, 'FunctionDeclaration').returnType).typeAnnotation.type).toBe(
			'TSTupleType',
		);
		expect(codeBlock(fn.body).type).toBe('JSXCodeBlock');
	});

	it('parses a `@{ }` body with a constrained type parameter', () => {
		const ast = parseModule(
			`function Test<T extends { id: string }>(item: T): string @{}`,
			'App.tsrx',
		);
		const fn = firstStatement(ast, 'FunctionDeclaration');
		expect(
			found(found(as_type(fn, 'FunctionDeclaration').typeParameters).params[0].constraint).type,
		).toBe('TSTypeLiteral');
		expect(found(as_type(fn, 'FunctionDeclaration').returnType).typeAnnotation.type).toBe(
			'TSStringKeyword',
		);
		expect(codeBlock(fn.body).type).toBe('JSXCodeBlock');
	});

	it('parses a `@{ }` body with a defaulted type parameter', () => {
		const ast = parseModule(`function Test<T = string>(value: T): T @{}`, 'App.tsrx');
		const fn = firstStatement(ast, 'FunctionDeclaration');
		expect(
			found(found(as_type(fn, 'FunctionDeclaration').typeParameters).params[0].default).type,
		).toBe('TSStringKeyword');
		expect(found(as_type(fn, 'FunctionDeclaration').returnType).typeAnnotation.type).toBe(
			'TSTypeReference',
		);
		expect(codeBlock(fn.body).type).toBe('JSXCodeBlock');
	});

	it('parses a `@{ }` body on a generic function with a union return type', () => {
		const ast = parseModule(`function Test<T>(items: T[]): T | undefined @{}`, 'App.tsrx');
		const fn = firstStatement(ast, 'FunctionDeclaration');
		expect(
			found(as_type(fn, 'FunctionDeclaration').typeParameters).params.map((p) => p.name),
		).toEqual(['T']);
		const union = found(as_type(fn, 'FunctionDeclaration').returnType).typeAnnotation;
		assert_type(union, 'TSUnionType');
		expect(
			union.types.map((t) =>
				t.type === 'TSTypeReference' ? as_type(t.typeName, 'Identifier').name : t.type,
			),
		).toEqual(['T', 'TSUndefinedKeyword']);
		expect(codeBlock(fn.body).type).toBe('JSXCodeBlock');
	});

	it('rejects an arrow token between a function return type and a `@{ }` body', () => {
		expect(() => parseModule(`function App(): JSX.Element => @{}`, 'App.tsrx')).toThrow(
			/Unexpected token/,
		);
	});

	it('parses a typed arrow property whose concise body is a `@{ }` block', () => {
		const ast = parseModule(`const obj = { Render: (): JSX.Element => @{ <div/> } };`, 'App.tsrx');
		const value = as_type(
			as_type(declaratorInit(firstStatement(ast, 'VariableDeclaration')), 'ObjectExpression')
				.properties[0],
			'Property',
		).value;
		assert_type(value, 'ArrowFunctionExpression');
		expect(value.returnType?.typeAnnotation.type).toBe('TSTypeReference');
		expect(value.body.type).toBe('JSXCodeBlock');
		expect(openingName(as_type(codeBlockRender(value.body), 'JSXElement')).name).toBe('div');
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
			const init = declaratorInit(parseModule(source, 'App.tsrx').body[0]);
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
			const statement = as_type(parseModule(source, 'App.tsrx').body[0], 'FunctionDeclaration').body
				.body[0];
			expect(statement.type, source).toBe('ReturnStatement');
			expect(as_type(statement, 'ReturnStatement').argument?.type, source).toBe(type);
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
			const statement = as_type(parseModule(source, 'App.tsrx').body[0], 'FunctionDeclaration').body
				.body[0];
			expect(statement.type, source).toBe('ExpressionStatement');
			expect(as_type(statement, 'ExpressionStatement').expression.type, source).toBe(type);
		}
	});

	it('keeps a decorated class expression parsing as a decorator, not a code block', () => {
		const ast = parseModule(`const X = @dec class {};`, 'App.tsrx');
		const init = declaratorInit(firstStatement(ast, 'VariableDeclaration'));
		assert_type(init, 'ClassExpression');
		// estree has no decorators on class nodes; the parser emits the TS shape.
		const decorators = /** @type {{ decorators?: TSESTree.Decorator[] }} */ (init).decorators;
		expect(as_type(found(decorators)[0].expression, 'Identifier').name).toBe('dec');
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

	it('leaves forgotten statement-container validation to semantic analysis', () => {
		const source = `export function UserBadge({ user }: UserBadgeProps): JSX.Element {
			const initials = user.name.slice(0, 2).toUpperCase();

			<button title={user.name}>{initials}</button>
		}`;

		expect(() => parseModule(source, 'App.tsrx')).not.toThrow();

		/** @type {CompileError[]} */
		const errors = [];
		parseModule(source, 'App.tsrx', { collect: true, errors });
		expect(errors).toEqual([]);
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
		/** @type {CompileError[]} */
		const errors = [];
		const ast = parseModule(source, 'App.tsrx', { collect: true, errors });
		const total_lines = source.split('\n').length;

		// Every node's reported line must match the line its byte offset actually sits on.
		/** @param {number} offset */
		const line_of = (offset) => source.slice(0, offset).split('\n').length;
		for (const node of allNodes(ast)) {
			if (!node.loc || typeof node.start !== 'number') continue;
			expect(node.loc.start.line, `${node.type} start`).toBe(line_of(node.start));
			expect(node.loc.end.line, `${node.type} end`).toBe(line_of(found(node.end)));
			expect(node.loc.end.line).toBeLessThanOrEqual(total_lines);
		}

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

		const block = as_type(ast.body[0], 'FunctionDeclaration').body;
		expect(ast.body[0].type).toBe('FunctionDeclaration');
		assert_type(block, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		expect(codeBlock(block).render).toBeNull();
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

		expect(node_children(returned).map((child) => child.type)).toEqual([
			'JSXCodeBlock',
			'JSXCodeBlock',
		]);
		const [first, second] = node_children(returned);
		expect(codeBlock(first).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(first), 'JSXElement')).name).toBe('span');
		expect(codeBlock(second).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(openingName(as_type(codeBlockRender(second), 'JSXElement')).name).toBe('span');
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

		const directives = node_children(returned).filter((child) => child.type === 'JSXIfExpression');
		expect(directives).toHaveLength(2);
		expect(
			as_type(
				as_type(as_type(directives[0].test, 'CallExpression').callee, 'MemberExpression').object,
				'Identifier',
			).name,
		).toBe('props');
		expect(
			as_type(
				as_type(as_type(directives[0].test, 'CallExpression').callee, 'MemberExpression').property,
				'Identifier',
			).name,
		).toBe('foo');
		expect(
			as_type(
				as_type(blockBody(directives[0].consequent)[0], 'JSXElement').openingElement.name,
				'JSXIdentifier',
			).name,
		).toBe('span');
		expect(
			as_type(
				as_type(as_type(directives[1].test, 'CallExpression').callee, 'MemberExpression').property,
				'Identifier',
			).name,
		).toBe('bar');
		expect(
			as_type(
				as_type(blockBody(directives[1].consequent)[0], 'JSXElement').openingElement.name,
				'JSXIdentifier',
			).name,
		).toBe('span');
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

		const outer = node_children(returned).find((child) => child.type === 'JSXIfExpression');
		assert_found(outer);
		expect(blockBody(outer.consequent).map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXFragment',
		]);
		const fragment = blockBody(outer.consequent).find(
			(child) => /** @type {AST.Node} */ (child).type === 'JSXFragment',
		);
		assert_found(fragment);
		expect(node_children(fragment).map((child) => child.type)).toEqual([
			'JSXElement',
			'JSXIfExpression',
		]);
		const inner = node_children(fragment).find((child) => child.type === 'JSXIfExpression');
		expect(blockBody(inner?.consequent).map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXElement',
		]);
		expect(
			as_type(
				as_type(blockBody(inner?.consequent)[1], 'JSXElement').openingElement.name,
				'JSXIdentifier',
			).name,
		).toBe('span');
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

		const block = child(returned, 0, 'JSXCodeBlock');
		assert_type(block, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXCodeBlock');
		expect(openingName(as_type(codeBlockRender(codeBlockRender(block)), 'JSXElement')).name).toBe(
			'span',
		);
	});

	it('reports the one-child violation recoverably in loose mode', () => {
		/** @type {CompileError[]} */
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
		assert_type(ast, 'Program');
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

		const block = child(returned, 0, 'JSXCodeBlock');
		assert_type(block, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXFragment');
		expect(node_children(found(block.render)).map((child) => child.type)).toEqual([
			'JSXCodeBlock',
			'JSXCodeBlock',
		]);
		const [first, second] = node_children(found(block.render));
		expect(openingName(as_type(codeBlockRender(first), 'JSXElement')).name).toBe('span');
		expect(openingName(as_type(codeBlockRender(second), 'JSXElement')).name).toBe('span');
	});

	it('parses a code-only `@{ }` block (no render) as an element body', () => {
		const returned = getReturned(`function App() {
			return <div>@{
				const a = 5
				const b = 6
			}</div>;
		}`);

		expect(node_children(returned).map((child) => child.type)).toEqual(['JSXCodeBlock']);
		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		expect(codeBlock(block).render).toBeNull();
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

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(declaratorInit(block.body[0]).type).toBe('Identifier');
		expect(codeBlockRender(block).type).toBe('JSXElement');
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('b');
	});

	it('keeps a same-line `value < tag-like` as a comparison, with render on the next line', () => {
		const returned = getReturned(`function App() { return <div>@{
			const r = aaa < b
			<span>{r}</span>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		const init = declaratorInit(block.body[0]);
		assert_type(init, 'BinaryExpression');
		expect(init.operator).toBe('<');
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('span');
	});

	it('keeps a no-space same-line `aaa <b` as a comparison, not a `<b>` tag', () => {
		const returned = getReturned(`function App() { return <div>@{
			const r = aaa <b
			<span>{r}</span>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		const init = declaratorInit(block.body[0]);
		assert_type(init, 'BinaryExpression');
		expect(init.operator).toBe('<');
		expect(as_type(init.left, 'Identifier').name).toBe('aaa');
		expect(as_type(init.right, 'Identifier').name).toBe('b');
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('span');
	});

	it('treats a trailing `aaa <b` with no following node as a comparison, never a render node', () => {
		const returned = getReturned(`function App() { return <div>@{
			const r = aaa <b
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).render).toBeNull();
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(as_type(declaratorInit(block.body[0]), 'BinaryExpression').operator).toBe('<');
	});

	it('still starts the render node when a `<tag` follows a `;` on the same line', () => {
		const returned = getReturned(`function App() { return <div>@{
			const a = 5; <span/>
		}</div>; }`);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXElement');
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('span');
	});

	it('parses a one-line `@{ }` block whose render follows the setup `;` (fragment)', () => {
		const returned = getReturned(
			`function App() { return <div>@{ const foo = 123; <>{foo}</> }</div>; }`,
		);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(as_type(declaratorInit(block.body[0]), 'Literal').value).toBe(123);
		expect(codeBlockRender(block).type).toBe('JSXFragment');
		expect(node_children(codeBlockRender(block)).map((child) => child.type)).toEqual([
			'JSXExpressionContainer',
		]);
	});

	it('parses a one-line `@{ }` block whose render follows the setup `;` (element)', () => {
		const returned = getReturned(
			`function App() { return <div>@{ const foo = 123; <span>{foo}</span> }</div>; }`,
		);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXElement');
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('span');
	});

	it('parses a one-line `@{ }` block with multiple `;`-separated setup statements before the render', () => {
		const returned = getReturned(
			`function App() { return <div>@{ const a = 1; const b = 2; <span>{a}{b}</span> }</div>; }`,
		);

		const block = child(returned, 0, 'JSXCodeBlock');
		expect(codeBlock(block).body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'VariableDeclaration',
		]);
		expect(openingName(as_type(codeBlockRender(block), 'JSXElement')).name).toBe('span');
	});

	it('parses a one-line `@{ }` block returned directly', () => {
		const ast = parseModule(
			`function App() { return @{ const foo = 123; <>{foo}</> }; }`,
			'App.tsrx',
		);
		const statement = functionBody(ast)[0];

		assert_type(statement, 'ReturnStatement');
		expect(statement.argument?.type).toBe('JSXCodeBlock');
		expect(codeBlock(statement.argument).body.map((child) => child.type)).toEqual([
			'VariableDeclaration',
		]);
		expect(codeBlockRender(statement.argument).type).toBe('JSXFragment');
	});

	it('applies the setup-to-render `<` disambiguation inside an `@if` consequent', () => {
		const returned = getReturned(`function App() { return <div>
			@if (ready) {
				const r = aaa <b
				<span>{r}</span>
			}
		</div>; }`);

		const directive = node_children(returned).find((child) => child.type === 'JSXIfExpression');
		expect(blockBody(directive?.consequent).map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXElement',
		]);
		const init = declaratorInit(blockBody(directive?.consequent)[0]);
		assert_type(init, 'BinaryExpression');
		expect(init.operator).toBe('<');
		expect(
			as_type(
				as_type(blockBody(directive?.consequent)[1], 'JSXElement').openingElement.name,
				'JSXIdentifier',
			).name,
		).toBe('span');
	});

	it('applies the setup-to-render `<` disambiguation inside an `@for` body', () => {
		const returned = getReturned(`function App() { return <ul>
			@for (const item of items) {
				const r = item <count
				<li>{r}</li>
			}
		</ul>; }`);

		const directive = node_children(returned).find((child) => child.type === 'JSXForExpression');
		expect(blockBody(directive?.body).map((child) => child.type)).toEqual([
			'VariableDeclaration',
			'JSXElement',
		]);
		expect(as_type(declaratorInit(directive?.body.body[0]), 'BinaryExpression').operator).toBe('<');
		expect(
			as_type(as_type(directive?.body.body[1], 'JSXElement').openingElement.name, 'JSXIdentifier')
				.name,
		).toBe('li');
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
		const block = getReturnedCodeBlock(
			`function App() { return @{ const foo = 123; @if (foo) { <div>{foo}</div> } }; }`,
		);

		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXIfExpression');
		expect(as_type(codeBlockRender(block), 'JSXIfExpression').consequent.type).toBe(
			'BlockStatement',
		);
		expect(
			blockBody(as_type(codeBlockRender(block), 'JSXIfExpression').consequent).map(
				(child) => child.type,
			),
		).toEqual(['JSXElement']);
		expect(
			as_type(
				as_type(
					blockBody(as_type(codeBlockRender(block), 'JSXIfExpression').consequent)[0],
					'JSXElement',
				).openingElement.name,
				'JSXIdentifier',
			).name,
		).toBe('div');
	});

	it('parses a braced `@if` render whose body begins on the next line', () => {
		const block = getReturnedCodeBlock(`function App() { return @{ const foo = 123; @if (foo) {
			<div>{foo}</div>} }; }`);

		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXIfExpression');
		expect(
			blockBody(as_type(codeBlockRender(block), 'JSXIfExpression').consequent).map(
				(child) => child.type,
			),
		).toEqual(['JSXElement']);
	});

	it('parses a braced `@for` render after the setup `;` on the same line', () => {
		const block = getReturnedCodeBlock(
			`function App() { return @{ const xs = [1, 2]; @for (const x of xs) { <li>{x}</li> } }; }`,
		);

		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXForExpression');
		const loop = as_type(codeBlockRender(block), 'JSXForExpression');
		expect(blockBody(loop.body).map((child) => child.type)).toEqual(['JSXElement']);
		expect(openingName(as_type(blockBody(loop.body)[0], 'JSXElement')).name).toBe('li');
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
		const block = getReturnedCodeBlock(
			`function App() { return @{ const foo = 123; @if (foo) { <div>{foo}</div> }; }; }`,
		);

		// The stray `;` is a meaningless empty statement; it is skipped rather than
		// captured as a body statement, so the render node still parses cleanly.
		expect(codeBlock(block).body.map((child) => child.type)).toEqual(['VariableDeclaration']);
		expect(codeBlockRender(block).type).toBe('JSXIfExpression');
	});

	it('allows and ignores a trailing `;` after a fragment render node', () => {
		const block = getReturnedCodeBlock(`function App() { return @{ <><div>{'hi'}</div></>; }; }`);

		expect(block.body).toEqual([]);
		expect(codeBlockRender(block).type).toBe('JSXFragment');
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
		const x = attributeExpression(rect.openingElement.attributes[0]);
		assert_type(x, 'BinaryExpression');
		expect(x.operator).toBe('-');
		expect(x.right.type).toBe('BinaryExpression');
		expect(as_type(x.right, 'BinaryExpression').operator).toBe('/');
	});

	it('parses `/` as division in a child expression container', () => {
		const g = findElement(`function App(p) { return @{ <g>{p.a / 2}</g> }; }`, 'g');
		const expr = as_type(
			found(node_children(g).find((c) => c.type === 'JSXExpressionContainer')),
			'JSXExpressionContainer',
		).expression;
		assert_type(expr, 'BinaryExpression');
		expect(expr.operator).toBe('/');
	});

	it('parses `#` as a private-field access in a child expression container', () => {
		const g = findElement(`class C { #x = 1; m() { return @{ <g>{this.#x}</g> }; } }`, 'g');
		const expr = as_type(
			found(node_children(g).find((c) => c.type === 'JSXExpressionContainer')),
			'JSXExpressionContainer',
		).expression;
		assert_type(expr, 'MemberExpression');
		expect(expr.property.type).toBe('PrivateIdentifier');
		expect(as_type(expr.property, 'PrivateIdentifier').name).toBe('x');
	});

	it('parses `/` as division in a directive header nested inside an element', () => {
		const node = findNode(
			`function App(p) { return @{ <g>@if (p.a / 2 > 1) { <rect /> }</g> }; }`,
			'JSXIfExpression',
		);
		expect(node.test.type).toBe('BinaryExpression');
		expect(as_type(node.test, 'BinaryExpression').operator).toBe('>');
		expect(as_type(node.test, 'BinaryExpression').left.type).toBe('BinaryExpression');
		expect(as_type(as_type(node.test, 'BinaryExpression').left, 'BinaryExpression').operator).toBe(
			'/',
		);
	});

	it('parses a regex literal inside a nested element attribute expression', () => {
		const rect = findElement(
			`function App(p) { return @{ <g><rect x={String(p.a).replace(/x/g, String(2 / p.b))} /></g> }; }`,
			'rect',
		);
		const x = attributeExpression(rect.openingElement.attributes[0]);
		assert_type(x, 'CallExpression');
		expect(x.arguments[0].type).toBe('Literal');
		expect(regexLiteral(x.arguments[0])).toEqual({ pattern: 'x', flags: 'g' });
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
		assert_type(script, 'JSXElement');
		expect(script.content).toBe('const x = 1; foo();');
		// The body is mirrored as one JSXText child (like JSXStyleElement's css +
		// parsed children) so generic element consumers emit it verbatim.
		expect(script.children).toHaveLength(1);
		expect(script.children[0].type).toBe('JSXText');
		expect(child(script, 0, 'JSXText').value).toBe('const x = 1; foo();');
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
		const typeAttr = script.openingElement.attributes.find(
			(a) => as_type(a, 'JSXAttribute').name?.name === 'type',
		);
		expect(as_type(found(as_type(found(typeAttr), 'JSXAttribute').value), 'Literal').value).toBe(
			'text/typescript',
		);
	});

	it('exposes body offsets that match `content` (opening tag end -> closing tag start)', () => {
		const source = `function App() @{ <head><script>const y = 2;</script></head> }`;
		const script = findElement(source, 'script');
		const start = script.openingElement.end;
		const end = script.closingElement?.start;
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

describe('acorn-typescript ≥1.0.11 constructs parse through the TSRX parser', () => {
	// Pins for upstream fixes the tsrx parser inherits (the plugin overrides
	// parseForStatement for indexed for-of, but paren/expression parsing is
	// inherited, so these verify the fixes actually reach us).

	it('allows the `in` operator inside a parenthesized `for` initializer', () => {
		const ast = parseModule(`for ((('a' in {}) ? 1 : 2);;) break;`, 'App.ts');
		const [statement] = ast.body;
		assert_type(statement, 'ForStatement');
		expect(statement.init?.type).toBe('ConditionalExpression');
	});

	it('allows a const initializer in an ambient context', () => {
		const ast = parseModule(`declare const VERSION = '1.0';`, 'App.ts');
		const [statement] = ast.body;
		assert_type(statement, 'VariableDeclaration');
		expect(statement.declare).toBe(true);
		expect(as_type(declaratorInit(statement), 'Literal').value).toBe('1.0');
	});

	it('collects each comment exactly once', () => {
		/** @type {AST.CommentWithLocation[]} */
		const comments = [];
		parseModule(
			`// leading
interface Point {
	// inside
	x: number;
}
const p: Point = { x: 1 }; // trailing`,
			'App.ts',
			{ collect: true, comments },
		);
		const starts = comments.map((comment) => comment.start);
		expect(new Set(starts).size).toBe(starts.length);
		expect(comments.length).toBe(3);
	});
});

describe('keywordTokens parse option', () => {
	it('collects async/function keyword tokens from the lexer', () => {
		const source = `async function load() {}\nfunction plain() {}`;
		const ast = parseModule(source, 'App.ts', { keywordTokens: true });
		const tokens = ast.tsrx_keyword_tokens;
		assert_found(tokens);
		expect(tokens.map((t) => [t.value, t.start])).toEqual([
			['async', source.indexOf('async')],
			['function', source.indexOf('function')],
			['function', source.lastIndexOf('function')],
		]);
	});

	it('is immune to comments and irregular spacing between keywords', () => {
		// Offset arithmetic assumed one space; text search would match the
		// keyword inside the comment. The lexer sees through both.
		const source = `async /* function */   function load() {}`;
		const ast = parseModule(source, 'App.ts', { keywordTokens: true });
		const tokens = ast.tsrx_keyword_tokens;
		assert_found(tokens);
		expect(tokens.map((t) => [t.value, t.start])).toEqual([
			['async', 0],
			['function', source.lastIndexOf('function')],
		]);
	});

	it('does not collect tokens without the option', () => {
		const ast = parseModule(`function f() {}`, 'App.ts');
		expect(ast.tsrx_keyword_tokens).toBeUndefined();
	});
});

describe('multi-line JSX elements as attribute values', () => {
	// A paired element with element children spread over multiple lines inside an
	// attribute's `{ … }` container used to unbalance the tokenizer context stack:
	// the stale-text fixup before its closing tag popped the element's own
	// children context, so the token after the container's `}` (the tag's `>`,
	// `/>`, or a following attribute) tokenized as template text and failed.

	/**
	 * The `prop` attribute's value, asserted to be a `<div>` wrapping a `<span>`.
	 *
	 * @param {AST.TSRXJSXElement} element
	 */
	function expectDivSpanValue(element) {
		const value = as_type(attributeExpression(element.openingElement.attributes[0]), 'JSXElement');
		expect(openingName(value).name).toBe('div');
		expect(node_children(value).some((c) => c.type === 'JSXElement')).toBe(true);
	}

	it('parses one before other attributes of a self-closing tag', () => {
		const element = findElement(
			`export function App() @{
	<Child
		prop={<div>
			<span>x</span>
		</div>}
		other={1}
	/>
}`,
			'Child',
		);
		expectDivSpanValue(element);
		const other = as_type(attributeExpression(element.openingElement.attributes[1]), 'Literal');
		expect(other.value).toBe(1);
	});

	it('parses one as the sole attribute of a self-closing tag', () => {
		const element = findElement(
			`export function App() @{
	<Child
		prop={<div>
			<span>x</span>
		</div>}
	/>
}`,
			'Child',
		);
		expectDivSpanValue(element);
		expect(as_type(element.openingElement, 'JSXOpeningElement').selfClosing).toBe(true);
	});

	it('parses one on a paired tag with children', () => {
		const element = findElement(
			`export function App() @{
	<Child
		prop={<div id="a">
			<span>x</span>
		</div>}
	>
		<i>child</i>
	</Child>
}`,
			'Child',
		);
		expectDivSpanValue(element);
		const child_element = as_type(
			found(node_children(element).find((c) => c.type === 'JSXElement')),
			'JSXElement',
		);
		expect(as_type(child_element.openingElement.name, 'JSXIdentifier').name).toBe('i');
	});

	// The stale-text fixup must keep one `tc_expr` context per element still open
	// inside the container — not a fixed count. Two levels of paired nesting and
	// a sibling element after a nested close each caught a wrong quota.

	it('parses two levels of paired nesting before another attribute', () => {
		const element = findElement(
			`export function App() @{
	<Child
		prop={<div>
			<section>
				<span>x</span>
			</section>
		</div>}
		other={1}
	/>
}`,
			'Child',
		);
		expectDivSpanValue(element);
		const other = as_type(attributeExpression(element.openingElement.attributes[1]), 'Literal');
		expect(other.value).toBe(1);
	});

	it('parses two levels of paired nesting on a paired tag with children', () => {
		const element = findElement(
			`export function App() @{
	<Child
		prop={<div>
			<section>
				<span>x</span>
			</section>
		</div>}
	>
		<i>child</i>
	</Child>
}`,
			'Child',
		);
		expectDivSpanValue(element);
		const child_element = as_type(
			found(node_children(element).find((c) => c.type === 'JSXElement')),
			'JSXElement',
		);
		expect(as_type(child_element.openingElement.name, 'JSXIdentifier').name).toBe('i');
	});

	it('parses a sibling element after a nested close inside the value', () => {
		const element = findElement(
			`export function App() @{
	<Child
		prop={<div>
			<span>x</span>
			<b>y</b>
		</div>}
		other={1}
	/>
}`,
			'Child',
		);
		const value = as_type(attributeExpression(element.openingElement.attributes[0]), 'JSXElement');
		const tags = node_children(value)
			.filter((c) => c.type === 'JSXElement')
			.map((c) => as_type(as_type(c, 'JSXElement').openingElement.name, 'JSXIdentifier').name);
		expect(tags).toEqual(['span', 'b']);
		const other = as_type(attributeExpression(element.openingElement.attributes[1]), 'Literal');
		expect(other.value).toBe(1);
	});
});

describe('casts around JSX in attribute values', () => {
	// A balanced element inside nested parens leaves the token-context stack
	// already unwound below the enclosing expression's depth, so the
	// after-element fixup must not pop the still-open outer `(` — doing so made
	// the outer `)` pop the attribute container's brace instead, and the `as`
	// that followed tokenized as a JSX name, never reaching the cast parse.

	/**
	 * The attribute value's `… as any` cast, asserted and unwrapped.
	 *
	 * @param {AST.TSRXJSXElement} element
	 * @param {number} index
	 * @returns {AST.Expression}
	 */
	function attributeCastExpression(element, index) {
		const cast = as_type(
			attributeExpression(element.openingElement.attributes[index]),
			'TSAsExpression',
		);
		return cast.expression;
	}

	it('parses a cast parenthesized arrow returning parenthesized JSX', () => {
		const element = findElement(
			`export function App() {
	return <Host prop={((c: any) => (<Col id={c.id} />)) as any} />;
}`,
			'Host',
		);
		const arrow = as_type(attributeCastExpression(element, 0), 'ArrowFunctionExpression');
		const body = as_type(arrow.body, 'JSXElement');
		expect(as_type(body.openingElement.name, 'JSXIdentifier').name).toBe('Col');
	});

	it('parses a cast arrow returning a paired element with an expression child', () => {
		const element = findElement(
			`export function App() {
	return <Host prop={((c: any) => (<Col a={c.a}>{c.name}</Col>)) as any} />;
}`,
			'Host',
		);
		const arrow = as_type(attributeCastExpression(element, 0), 'ArrowFunctionExpression');
		const body = as_type(arrow.body, 'JSXElement');
		const container = as_type(
			found(node_children(body).find((c) => c.type === 'JSXExpressionContainer')),
			'JSXExpressionContainer',
		);
		assert_type(container.expression, 'MemberExpression');
	});

	it('parses a cast call whose argument is an arrow returning JSX', () => {
		const element = findElement(
			`export function App() {
	return <Host prop={fn((c: any) => (<Col id={c.id} />)) as any} />;
}`,
			'Host',
		);
		const call = as_type(attributeCastExpression(element, 0), 'CallExpression');
		const arrow = as_type(call.arguments[0], 'ArrowFunctionExpression');
		assert_type(arrow.body, 'JSXElement');
	});

	it('parses a cast around doubly parenthesized JSX', () => {
		const element = findElement(
			`export function App() {
	return <Host prop={((<Col id={c.id} />)) as any} />;
}`,
			'Host',
		);
		const value = as_type(attributeCastExpression(element, 0), 'JSXElement');
		expect(as_type(value.openingElement.name, 'JSXIdentifier').name).toBe('Col');
	});

	it('parses a multi-line cast arrow inside a cast element array', () => {
		const element = findElement(
			`export function Table() {
	const state = useTableState({
		children: [
			<TableHeader
				key="head"
				columns={columns}
				children={
					((c: any) => (
						<Column key={c.id} isRowHeader={c.isRowHeader}>
							{c.name}
						</Column>
					)) as any
				}
			/>,
		] as any,
		selectionMode: 'multiple',
	});
	return <div>{state.collection.size}</div>;
}`,
			'TableHeader',
		);
		const arrow = as_type(attributeCastExpression(element, 2), 'ArrowFunctionExpression');
		const body = as_type(arrow.body, 'JSXElement');
		expect(as_type(body.openingElement.name, 'JSXIdentifier').name).toBe('Column');
		const container = as_type(
			found(node_children(body).find((c) => c.type === 'JSXExpressionContainer')),
			'JSXExpressionContainer',
		);
		assert_type(container.expression, 'MemberExpression');
	});
});

describe('expression-container children inside JSX attribute values', () => {
	// After an element parsed inside a child `{ … }` container of a JSX-valued
	// attribute, the container's closing `}` has already popped its own brace
	// context, leaving the tail [tc_oTag, b_expr, tc_expr] — the same shape a
	// statement-bodied attribute leaks when the attribute's own container
	// closes. The after-element fixup treated it as that leak and stripped the
	// attribute container's brace plus the outer element's children context, so
	// the `=` of the following attribute tokenized as template text and failed.
	// In the child-container case the stack sits below the enclosing
	// expression's depth, which now gates the strip.

	/**
	 * Name of a `JSXElement`'s opening tag.
	 *
	 * @param {AST.Node} node
	 * @returns {string}
	 */
	function elementName(node) {
		return as_type(as_type(node, 'JSXElement').openingElement.name, 'JSXIdentifier').name;
	}

	it('parses a ternary of elements in the value before another attribute', () => {
		const element = findElement(
			`export function App({ ok }: any) {
	return (
		<Host
			slot={
				<button>
					{ok ? <X /> : <Y />}
				</button>
			}
			onChange={(d: any) => go(d)}
		/>
	);
}`,
			'Host',
		);
		const value = as_type(attributeExpression(element.openingElement.attributes[0]), 'JSXElement');
		expect(openingName(value).name).toBe('button');
		const container = as_type(
			found(node_children(value).find((c) => c.type === 'JSXExpressionContainer')),
			'JSXExpressionContainer',
		);
		const conditional = as_type(container.expression, 'ConditionalExpression');
		expect(elementName(conditional.consequent)).toBe('X');
		expect(elementName(conditional.alternate)).toBe('Y');
		const handler = as_type(
			attributeExpression(element.openingElement.attributes[1]),
			'ArrowFunctionExpression',
		);
		expect(handler.params).toHaveLength(1);
	});

	it('parses a lone element in a child container before another attribute', () => {
		const element = findElement(
			`export function App() {
	return <Host slot={<button>{<X />}</button>} onChange={(d: any) => go(d)} />;
}`,
			'Host',
		);
		const value = as_type(attributeExpression(element.openingElement.attributes[0]), 'JSXElement');
		expect(openingName(value).name).toBe('button');
		const container = as_type(
			found(node_children(value).find((c) => c.type === 'JSXExpressionContainer')),
			'JSXExpressionContainer',
		);
		expect(elementName(container.expression)).toBe('X');
		assert_type(
			attributeExpression(element.openingElement.attributes[1]),
			'ArrowFunctionExpression',
		);
	});

	it('still strips the leak for a directive-bodied attribute value', () => {
		const element = findElement(
			`export function App() {
	return <Card
		content={
			<div>
				@if (foo) {
					<span />
				}
			</div>
		}
	/>;
}`,
			'Card',
		);
		const value = as_type(attributeExpression(element.openingElement.attributes[0]), 'JSXElement');
		expect(openingName(value).name).toBe('div');
		expect(as_type(element.openingElement, 'JSXOpeningElement').selfClosing).toBe(true);
	});
});

// A `<` in markup child position only opens a tag when the next character can
// begin one. Anything else — a digit, an operator, an emoji, whitespace — is a
// literal `<` in the text, the same rule the HTML tokenizer uses. Every case
// below throws `Unexpected token` before this rule.
describe('literal `<` in markup text', () => {
	it('reads a `<` that cannot start a tag as text', () => {
		for (const [label, source, text] of [
			['digit', `function App() { return <span><3</span>; }`, '<3'],
			['operator', `function App() { return <span><= arrow</span>; }`, '<= arrow'],
			['non-ASCII', `function App() { return <span><\u{1F600}</span>; }`, '<\u{1F600}'],
			['surrounding spaces', `function App() { return <span>a < b</span>; }`, 'a < b'],
			['template body', `function App() @{ <span><3</span> }`, '<3'],
		]) {
			const span = findElement(source, 'span');

			expect(
				span.children.map((child) => child.type),
				label,
			).toEqual(['JSXText']);
			expect(child(span, 0, 'JSXText').value, label).toBe(text);
		}
	});

	it('keeps a literal `<` as text when a real tag follows it', () => {
		const div = findElement(`function App() { return <div><3<span>x</span></div>; }`, 'div');

		expect(div.children.map((child) => child.type)).toEqual(['JSXText', 'JSXElement']);
		expect(child(div, 0, 'JSXText').value).toBe('<3');
		expect(openingName(child(div, 1, 'JSXElement')).name).toBe('span');
	});

	// An element nested in a `{ … }` expression container reads its children
	// through `jsx_readToken` rather than the raw-text token path, so the rule
	// has to hold there too.
	it('reads a `<` that cannot start a tag as text inside an expression container', () => {
		for (const [label, source, text] of [
			['digit', `function App() @{ <div>{<span><3</span>}</div> }`, '<3'],
			['operator', `function App() @{ <div>{<span><= x</span>}</div> }`, '<= x'],
			['surrounding spaces', `function App() @{ <div>{<span>a < b</span>}</div> }`, 'a < b'],
			['JSX return', `function App() { return <div>{<span><3</span>}</div>; }`, '<3'],
		]) {
			const span = findElement(source, 'span');

			expect(
				span.children.map((child) => child.type),
				label,
			).toEqual(['JSXText']);
			expect(child(span, 0, 'JSXText').value, label).toBe(text);
		}
	});
});

describe('function types in JSX attribute values', () => {
	// Deciding whether `(` opens a function type scans ahead, and that scan is
	// only supposed to be a query. Its state snapshot aliased the tokenizer's
	// context stack, so for an EMPTY parameter list — where the scan consumes
	// `(` and returns the moment it sees `)` — the context that `(` pushed was
	// never popped. Every later token then sat one frame out of phase, and the
	// `>` closing the element's opening tag was tokenized as JSX text:
	// "Unexpected token `>`. Did you mean `&gt;`?".
	//
	// A non-empty list (`(n: number) => void`) scans far enough to balance, so
	// only the empty-parens spellings below ever broke.

	it('parses a callback prop whose parameter is a no-argument function type', () => {
		const element = findElement(
			`export function App(props: { failed: boolean }) @{
	<Boundary fallback={(reset: () => void) => <button onClick={() => reset()}>{'retry'}</button>}>
		<Child failed={props.failed} />
	</Boundary>
}`,
			'Boundary',
		);
		const arrow = as_type(
			attributeExpression(element.openingElement.attributes[0]),
			'ArrowFunctionExpression',
		);
		expect(as_type(arrow.params[0], 'Identifier').name).toBe('reset');
		// The element's own children still parse — the stale context used to
		// swallow the opening tag's `>` and everything after it.
		expect(as_type(element.children[0], 'JSXElement')).toBeTruthy();
	});

	it('parses the no-argument function type in every spelling that leaked a context', () => {
		for (const [label, type] of [
			['bare', '() => void'],
			['returning a value', '() => string'],
			['returning a generic', '() => Promise<void>'],
			['as an object member', '{ go: () => void }'],
		]) {
			const element = findElement(
				`export function App() @{ <Host on={(cb: ${type}) => 'x'}>{'c'}</Host> }`,
				'Host',
			);
			const arrow = as_type(
				attributeExpression(element.openingElement.attributes[0]),
				'ArrowFunctionExpression',
			);
			expect(as_type(arrow.params[0], 'Identifier').name, label).toBe('cb');
		}
	});

	it('keeps a following attribute and a sibling element in the same tag', () => {
		// The leak was positional, so what comes AFTER the offending attribute is
		// what a narrower fix could still get wrong.
		const element = findElement(
			`export function App() @{
	<Host on={(cb: () => void) => 'x'} id="after">
		<Sibling />
	</Host>
}`,
			'Host',
		);
		const [, id] = element.openingElement.attributes;
		expect(as_type(as_type(id, 'JSXAttribute').name, 'JSXIdentifier').name).toBe('id');
		expect(
			as_type(as_type(element.children[0], 'JSXElement').openingElement.name, 'JSXIdentifier').name,
		).toBe('Sibling');
	});
});
