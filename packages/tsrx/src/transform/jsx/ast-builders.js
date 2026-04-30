/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */

import { set_location } from '../../utils/builders.js';

/**
 * AST-building utilities shared across every JSX target (React, Preact,
 * Solid). These are pure, platform-agnostic helpers — anything that ends up
 * branching on target semantics belongs elsewhere.
 */

/**
 * Attach `source_node`'s `loc` to `node` (deep), defaulting `node.metadata`
 * so downstream walks / serializers don't trip on it being undefined.
 *
 * @template T
 * @param {T} node
 * @param {any} source_node
 * @returns {T}
 */
export function set_loc(node, source_node) {
	/** @type {any} */ (node).metadata ??= { path: [] };
	if (source_node?.loc) {
		return /** @type {T} */ (set_location(/** @type {any} */ (node), source_node, true));
	}
	return node;
}

/**
 * Shallow-clone an Identifier (keeps name, copies loc via `set_loc`, fresh
 * metadata). Used when the same identifier must appear in both a declaration
 * and a reference without sharing mutable metadata.
 *
 * @param {AST.Identifier} identifier
 * @returns {AST.Identifier}
 */
export function clone_identifier(identifier) {
	return set_loc(
		/** @type {any} */ ({
			type: 'Identifier',
			name: identifier.name,
			metadata: { path: [] },
		}),
		identifier,
	);
}

/**
 * Clone a JSX element name (handles `JSXIdentifier`, `JSXMemberExpression`,
 * and plain `Identifier`).
 *
 * @param {any} name
 * @param {any} [source_node]
 * @returns {any}
 */
export function clone_jsx_name(name, source_node = name) {
	if (!name) return name;
	if (name.type === 'JSXIdentifier') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXIdentifier',
				name: name.name,
				metadata: name.metadata || { path: [] },
			}),
			source_node,
		);
	}
	if (name.type === 'JSXMemberExpression') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXMemberExpression',
				object: clone_jsx_name(name.object, source_node.object || name.object),
				property: clone_jsx_name(name.property, source_node.property || name.property),
				metadata: name.metadata || { path: [] },
			}),
			source_node,
		);
	}
	if (name.type === 'Identifier') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXIdentifier',
				name: name.name,
				metadata: name.metadata || { path: [] },
			}),
			source_node,
		);
	}
	return name;
}

/**
 * @returns {AST.Literal}
 */
export function create_null_literal() {
	return /** @type {any} */ ({
		type: 'Literal',
		value: null,
		raw: 'null',
		metadata: { path: [] },
	});
}

/**
 * @param {string} name
 * @returns {AST.Identifier}
 */
export function create_generated_identifier(name) {
	return /** @type {any} */ ({
		type: 'Identifier',
		name,
		metadata: { path: [] },
	});
}

/**
 * @param {any} node
 * @param {string} message
 * @returns {Error & { pos: number, end: number }}
 */
export function create_compile_error(node, message) {
	const error = /** @type {Error & { pos: number, end: number }} */ (new Error(message));
	error.pos = node.start ?? 0;
	error.end = node.end ?? error.pos + 1;
	return error;
}

/**
 * Convert an Identifier / MemberExpression into a JSX element name. The
 * top-level `Identifier` → `JSXIdentifier` case flags capitalised names as
 * `is_component` so `segments.js` can extend the JSX element name's source
 * mapping backwards to cover the `component ` keyword and attach the
 * component hover label — without that flag those source-map adjustments
 * and editor hover features silently drop for any composite element.
 *
 * @param {any} id
 * @returns {any}
 */
export function identifier_to_jsx_name(id) {
	if (!id) return id;
	if (id.type === 'Identifier') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXIdentifier',
				name: id.name,
				metadata: { path: [], is_component: /^[A-Z]/.test(id.name) },
			}),
			id,
		);
	}
	if (id.type === 'MemberExpression') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXMemberExpression',
				object: identifier_to_jsx_name(id.object),
				property: identifier_to_jsx_name(id.property),
				metadata: id.metadata || { path: [] },
			}),
			id,
		);
	}
	return id;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_jsx_child(node) {
	if (!node) return false;
	const t = node.type;
	return (
		t === 'JSXElement' ||
		t === 'JSXFragment' ||
		t === 'JSXExpressionContainer' ||
		t === 'JSXText' ||
		t === 'Tsx' ||
		t === 'TsxCompat' ||
		t === 'Element' ||
		t === 'Text' ||
		t === 'TSRXExpression' ||
		t === 'Html' ||
		t === 'IfStatement' ||
		t === 'ForOfStatement' ||
		t === 'SwitchStatement' ||
		t === 'TryStatement'
	);
}

/**
 * A dynamic element id is one whose identifier is `tracked` — i.e. it was
 * introduced by reactive destructuring so its value can change at runtime.
 *
 * @param {any} id
 * @returns {boolean}
 */
export function is_dynamic_element_id(id) {
	if (!id || typeof id !== 'object') {
		return false;
	}
	if (id.type === 'Identifier') {
		return !!id.tracked;
	}
	if (id.type === 'MemberExpression') {
		return is_dynamic_element_id(id.object);
	}
	return false;
}

/**
 * Gather the params a `for (x of y; index i)` loop should expose to its body
 * JSX (value first, optional index second).
 *
 * @param {any} left
 * @param {any} [index]
 * @returns {any[]}
 */
export function get_for_of_iteration_params(left, index) {
	/** @type {any[]} */
	const params = [];
	if (left?.type === 'VariableDeclaration' && left.declarations?.[0]) {
		params.push(left.declarations[0].id);
	} else {
		params.push(left);
	}
	if (index) {
		params.push(index);
	}
	return params;
}

/**
 * Flatten a switch case's `consequent` so statements inside a top-level
 * `BlockStatement` are treated as siblings of statements declared directly
 * under the case. This lets `case` arms use `{ ... }` for readability
 * without the block becoming a fresh scope at the JSX level.
 *
 * @param {any[]} consequent
 * @returns {any[]}
 */
export function flatten_switch_consequent(consequent) {
	const result = [];
	for (const node of consequent) {
		if (node.type === 'BlockStatement') {
			result.push(...node.body);
		} else {
			result.push(node);
		}
	}
	return result;
}

/**
 * @param {AST.Expression | null | undefined} expression
 * @returns {boolean}
 */
function is_static_string_expression(expression) {
	if (!expression) {
		return false;
	}
	if (expression.type === 'Literal') {
		return typeof expression.value === 'string';
	}
	if (expression.type === 'TemplateLiteral') {
		return expression.expressions.length === 0;
	}
	return false;
}

/**
 * Build `expr == null ? '' : expr + ''` — the text-coerce form used when a
 * Ripple `{expr}` child must render as a string in JSX (React/Preact drop
 * booleans; Solid's default child semantics don't either). Solid uses this
 * via `to_jsx_child`; React/Preact wrap it in a JSXExpressionContainer.
 *
 * When the expression is statically a non-null string at the AST level —
 * a string `Literal` (`"hello"`, `'hello'`) or a `TemplateLiteral` with no
 * interpolations (`` `hello` ``) — the coercion is provably a no-op and
 * the literal is emitted as-is. This covers both direct double-quoted
 * children (`<b>"hello"</b>`) and inline literal arguments to the explicit
 * `{text ...}` intrinsic (`<b>{text 'hello'}</b>`). Identifiers and any
 * other expression type still get the ternary because the AST alone can't
 * prove they're non-null strings.
 *
 * @param {AST.Expression} expression
 * @param {any} [source_node]
 * @returns {AST.Expression}
 */
export function to_text_expression(expression, source_node = expression) {
	if (is_static_string_expression(expression)) {
		return set_loc(clone_expression_node(expression), source_node);
	}
	return set_loc(
		/** @type {AST.Expression} */ ({
			type: 'ConditionalExpression',
			test: {
				type: 'BinaryExpression',
				operator: '==',
				left: clone_expression_node(expression),
				right: create_null_literal(),
				metadata: { path: [] },
			},
			consequent: {
				type: 'Literal',
				value: '',
				raw: "''",
				metadata: { path: [] },
			},
			alternate: {
				type: 'BinaryExpression',
				operator: '+',
				left: clone_expression_node(expression),
				right: {
					type: 'Literal',
					value: '',
					raw: "''",
					metadata: { path: [] },
				},
				metadata: { path: [] },
			},
			metadata: { path: [] },
		}),
		source_node,
	);
}

/**
 * Deep-clone an AST subtree. `loc` / `start` / `end` are shallow-shared by
 * reference rather than recursed into — `loc` objects can contain back-refs
 * to sub-objects that would blow the stack with a naive deep clone, and
 * every other traversal in the targets treats these positional keys as
 * shared.
 *
 * @param {any} node
 * @returns {any}
 */
export function clone_expression_node(node) {
	if (!node || typeof node !== 'object') return node;
	if (Array.isArray(node)) return node.map(clone_expression_node);
	const clone = { ...node };
	for (const key of Object.keys(clone)) {
		if (key === 'loc' || key === 'start' || key === 'end') continue;
		if (key === 'metadata') {
			clone.metadata = clone.metadata ? { ...clone.metadata } : { path: [] };
			continue;
		}
		clone[key] = clone_expression_node(clone[key]);
	}
	return clone;
}
