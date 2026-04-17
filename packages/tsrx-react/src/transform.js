/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */

import { walk } from 'zimmerframe';
import { print } from 'esrap';
import tsx from 'esrap/languages/tsx';
import { renderStylesheets } from '@tsrx/core';

/**
 * Transform a parsed tsrx-react AST into a TSX/JSX module.
 *
 * Replaces Ripple-specific `Component`/`Element`/`Text`/`TSRXExpression`
 * nodes with their standard JSX equivalents inside a `FunctionDeclaration`.
 * Any `<style>` element declared inside a component is collected,
 * rendered via `@tsrx/core`'s stylesheet renderer, and returned alongside
 * the JS output so a downstream plugin can inject it. The compiler also
 * augments every non-style Element in a scoped component with the
 * stylesheet's hash class so scoped selectors match correctly.
 *
 * @param {AST.Program} ast
 * @param {string} source
 * @param {string} [filename]
 * @returns {{ code: string, map: any, css: { code: string, hash: string } | null }}
 */
export function transform(ast, source, filename) {
	/** @type {any[]} */
	const stylesheets = [];

	walk(/** @type {any} */ (ast), null, {
		Component(node, { next, state }) {
			const as_any = /** @type {any} */ (node);
			const css = as_any.css;
			if (css) {
				stylesheets.push(css);
				const hash = css.hash;
				/** @type {any[]} */
				const body = as_any.body;
				as_any.body = body
					.filter((/** @type {any} */ child) => !is_style_element(child))
					.map((/** @type {any} */ child) => annotate_with_hash(child, hash));
			}
			return next(state);
		},
	});

	const transformed = walk(/** @type {any} */ (ast), null, {
		Component(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (component_to_function_declaration(inner));
		},

		Element(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (to_jsx_element(inner));
		},

		Text(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (to_jsx_expression_container(inner.expression));
		},

		TSRXExpression(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (to_jsx_expression_container(inner.expression));
		},
	});

	const result = print(/** @type {any} */ (transformed), tsx(), {
		sourceMapSource: filename,
		sourceMapContent: source,
	});

	const css =
		stylesheets.length > 0
			? {
					code: renderStylesheets(
						/** @type {any} */ (stylesheets.map(prepare_stylesheet_for_render)),
					),
					hash: stylesheets.map((s) => s.hash).join(' '),
				}
			: null;

	return { code: result.code, map: result.map, css };
}

/**
 * @param {any} component
 * @returns {AST.FunctionDeclaration}
 */
function component_to_function_declaration(component) {
	const body_nodes = /** @type {any[]} */ (component.body);
	const statements = [];
	const render_nodes = [];

	for (const child of body_nodes) {
		if (is_jsx_child(child)) {
			render_nodes.push(to_jsx_child(child));
		} else {
			statements.push(child);
		}
	}

	const return_arg = build_return_expression(render_nodes);
	if (return_arg) {
		statements.push({
			type: 'ReturnStatement',
			argument: return_arg,
		});
	}

	return /** @type {any} */ ({
		type: 'FunctionDeclaration',
		id: component.id,
		params: component.params || [],
		body: {
			type: 'BlockStatement',
			body: statements,
		},
		async: false,
		generator: false,
	});
}

/**
 * Mark every selector inside the stylesheet as "used" so `renderStylesheets`
 * does not comment it out. We skip Ripple's selector-pruning pass because
 * React component boundaries are dynamic — any selector authored inside the
 * component's `<style>` block is considered intentional.
 *
 * @param {any} stylesheet
 * @returns {any}
 */
function prepare_stylesheet_for_render(stylesheet) {
	walk(stylesheet, null, {
		_(node, { next }) {
			if (node && node.metadata && typeof node.metadata === 'object') {
				node.metadata.used = true;
				if (node.type === 'RelativeSelector' && !node.metadata.is_global) {
					node.metadata.scoped = true;
				}
			}
			return next();
		},
	});
	return stylesheet;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_style_element(node) {
	return (
		node &&
		node.type === 'Element' &&
		node.id &&
		node.id.type === 'Identifier' &&
		node.id.name === 'style'
	);
}

/**
 * Recursively walk Element nodes within a component body and add the hash
 * class name so scope-qualified selectors (e.g. `.foo.hash`) match.
 *
 * @param {any} node
 * @param {string} hash
 * @returns {any}
 */
function annotate_with_hash(node, hash) {
	if (!node || typeof node !== 'object') return node;
	if (node.type === 'Element') {
		if (!is_style_element(node)) {
			add_hash_class(node, hash);
		}
		if (Array.isArray(node.children)) {
			node.children = node.children
				.filter((/** @type {any} */ child) => !is_style_element(child))
				.map((/** @type {any} */ child) => annotate_with_hash(child, hash));
		}
	}
	return node;
}

/**
 * Ensure the element carries a `class` attribute containing the scoping hash.
 * @param {any} element
 * @param {string} hash
 */
function add_hash_class(element, hash) {
	const attrs = element.attributes || (element.attributes = []);
	const existing = attrs.find(
		(/** @type {any} */ a) =>
			a.type === 'Attribute' &&
			a.name &&
			a.name.type === 'Identifier' &&
			(a.name.name === 'class' || a.name.name === 'className'),
	);

	if (!existing) {
		attrs.push({
			type: 'Attribute',
			name: { type: 'Identifier', name: 'class' },
			value: { type: 'Literal', value: hash, raw: JSON.stringify(hash) },
		});
		return;
	}

	const value = existing.value;
	if (!value) {
		existing.value = { type: 'Literal', value: hash, raw: JSON.stringify(hash) };
		return;
	}

	if (value.type === 'Literal' && typeof value.value === 'string') {
		const merged = `${value.value} ${hash}`;
		existing.value = { type: 'Literal', value: merged, raw: JSON.stringify(merged) };
		return;
	}

	// Dynamic expression. Concatenate at runtime via template literal.
	const expression = value.type === 'JSXExpressionContainer' ? value.expression : value;
	existing.value = {
		type: 'TemplateLiteral',
		expressions: [expression],
		quasis: [
			{
				type: 'TemplateElement',
				value: { raw: '', cooked: '' },
				tail: false,
			},
			{
				type: 'TemplateElement',
				value: { raw: ` ${hash}`, cooked: ` ${hash}` },
				tail: true,
			},
		],
	};
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_jsx_child(node) {
	if (!node) return false;
	const t = node.type;
	return (
		t === 'JSXElement' || t === 'JSXFragment' || t === 'JSXExpressionContainer' || t === 'JSXText'
	);
}

/**
 * @param {any} node
 * @returns {ESTreeJSX.JSXElement}
 */
function to_jsx_element(node) {
	if (node.type === 'JSXElement') return node;

	const name = identifier_to_jsx_name(node.id);
	const attributes = (node.attributes || []).map(to_jsx_attribute);
	const selfClosing = !!node.selfClosing;
	const children = (node.children || []).map(to_jsx_child);

	/** @type {ESTreeJSX.JSXOpeningElement} */
	const openingElement = /** @type {any} */ ({
		type: 'JSXOpeningElement',
		name,
		attributes,
		selfClosing,
	});

	/** @type {ESTreeJSX.JSXClosingElement | null} */
	const closingElement = selfClosing
		? null
		: /** @type {any} */ ({
				type: 'JSXClosingElement',
				name: clone_jsx_name(name),
			});

	return /** @type {any} */ ({
		type: 'JSXElement',
		openingElement,
		closingElement,
		children,
	});
}

/**
 * @param {any} node
 * @returns {any}
 */
function to_jsx_child(node) {
	if (!node) return node;
	switch (node.type) {
		case 'Element':
			return to_jsx_element(node);
		case 'Text':
		case 'TSRXExpression':
			return to_jsx_expression_container(node.expression);
		default:
			return node;
	}
}

/**
 * @param {AST.Expression} expression
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function to_jsx_expression_container(expression) {
	return /** @type {any} */ ({
		type: 'JSXExpressionContainer',
		expression: /** @type {any} */ (expression),
	});
}

/**
 * @param {any} attr
 * @returns {ESTreeJSX.JSXAttribute | ESTreeJSX.JSXSpreadAttribute}
 */
function to_jsx_attribute(attr) {
	if (!attr) return attr;
	if (attr.type === 'JSXAttribute' || attr.type === 'JSXSpreadAttribute') {
		return attr;
	}
	if (attr.type === 'SpreadAttribute') {
		return /** @type {any} */ ({
			type: 'JSXSpreadAttribute',
			argument: attr.argument,
		});
	}

	// Rewrite Ripple-style `class` → React's `className`.
	let attr_name = attr.name;
	if (attr_name && attr_name.type === 'Identifier' && attr_name.name === 'class') {
		attr_name = { type: 'Identifier', name: 'className' };
	}

	const name =
		attr_name && attr_name.type === 'Identifier'
			? { type: 'JSXIdentifier', name: attr_name.name }
			: attr_name;

	let value = attr.value;
	if (value) {
		if (value.type === 'Literal' && typeof value.value === 'string') {
			// Keep string literal as attribute string.
		} else if (
			value.type !== 'JSXExpressionContainer' &&
			value.type !== 'JSXElement' &&
			value.type !== 'JSXFragment'
		) {
			value = to_jsx_expression_container(value);
		}
	}

	return /** @type {ESTreeJSX.JSXAttribute} */ ({
		type: 'JSXAttribute',
		name,
		value: value || null,
	});
}

/**
 * @param {AST.Identifier | AST.MemberExpression | any} id
 * @returns {ESTreeJSX.JSXIdentifier | ESTreeJSX.JSXMemberExpression}
 */
function identifier_to_jsx_name(id) {
	if (id.type === 'Identifier') {
		return /** @type {any} */ ({ type: 'JSXIdentifier', name: id.name });
	}
	if (id.type === 'MemberExpression') {
		return /** @type {any} */ ({
			type: 'JSXMemberExpression',
			object: /** @type {any} */ (identifier_to_jsx_name(id.object)),
			property: /** @type {any} */ (identifier_to_jsx_name(id.property)),
		});
	}
	return id;
}

/**
 * @param {any} name
 * @returns {any}
 */
function clone_jsx_name(name) {
	if (name.type === 'JSXIdentifier') {
		return { type: 'JSXIdentifier', name: name.name };
	}
	if (name.type === 'JSXMemberExpression') {
		return {
			type: 'JSXMemberExpression',
			object: clone_jsx_name(name.object),
			property: clone_jsx_name(name.property),
		};
	}
	return name;
}

/**
 * @param {any[]} render_nodes
 * @returns {any}
 */
function build_return_expression(render_nodes) {
	if (render_nodes.length === 0) return null;
	if (render_nodes.length === 1) {
		const only = render_nodes[0];
		if (only.type === 'JSXExpressionContainer') {
			return only.expression;
		}
		return only;
	}
	return {
		type: 'JSXFragment',
		openingFragment: { type: 'JSXOpeningFragment' },
		closingFragment: { type: 'JSXClosingFragment' },
		children: render_nodes,
	};
}
