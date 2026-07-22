/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */

import * as b from '../../utils/builders.js';
import { has_location } from '../../utils/ast.js';

/**
 * AST-building utilities shared across every JSX target (React, Preact,
 * Solid). These are pure, platform-agnostic helpers — anything that ends up
 * branching on target semantics belongs elsewhere.
 */

/**
 * Attach `source_node`'s `loc` to `node` (deep), defaulting `node.metadata`
 * so downstream walks / serializers don't trip on it being undefined.
 *
 * @template {AST.Node} T
 * @param {T} node
 * @param {AST.Node | AST.NodeWithLocation | undefined} source_node
 * @returns {T}
 */
export function set_loc(node, source_node) {
	node.metadata ??= { path: [] };
	if (has_location(source_node)) {
		return b.set_location(node, source_node, true);
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
	return set_loc(b.id(identifier.name), identifier);
}

/**
 * Clone a JSX element name (handles `JSXIdentifier`, `JSXMemberExpression`,
 * and plain `Identifier`).
 *
 * @param {ESTreeJSX.TSRXJSXOpeningElement['name']} name
 * @param {AST.Node} [source_node]
 * @returns {ESTreeJSX.TSRXJSXOpeningElement['name']}
 */
export function clone_jsx_name(name, source_node = name) {
	if (name.type === 'JSXIdentifier') {
		return clone_jsx_identifier(name, source_node);
	}
	if (name.type === 'JSXMemberExpression') {
		return clone_jsx_member_expression(name, source_node);
	}
	if (name.type === 'Identifier') {
		const clone = b.jsx_id(name.name);
		clone.metadata = name.metadata || { path: [] };
		return set_loc(clone, source_node);
	}
	return name;
}

/**
 * @param {ESTreeJSX.JSXIdentifier} name
 * @param {AST.Node} source_node
 * @returns {ESTreeJSX.JSXIdentifier}
 */
function clone_jsx_identifier(name, source_node) {
	const clone = b.jsx_id(name.name);
	clone.metadata = name.metadata || { path: [] };
	return set_loc(clone, source_node);
}

/**
 * @param {ESTreeJSX.JSXMemberExpression} name
 * @param {AST.Node} source_node
 * @returns {ESTreeJSX.JSXMemberExpression}
 */
function clone_jsx_member_expression(name, source_node) {
	const member_source = source_node.type === 'JSXMemberExpression' ? source_node : name;
	const object =
		name.object.type === 'JSXIdentifier'
			? clone_jsx_identifier(
					name.object,
					member_source.object.type === 'JSXIdentifier' ? member_source.object : name.object,
				)
			: clone_jsx_member_expression(
					name.object,
					member_source.object.type === 'JSXMemberExpression' ? member_source.object : name.object,
				);
	const property = clone_jsx_identifier(name.property, member_source.property);
	const clone = b.jsx_member(object, property);
	clone.metadata = name.metadata || { path: [] };
	return set_loc(clone, source_node);
}

/**
 * Record extra source positions on a generated expression so one generated
 * range can map back to several source ranges. Used for dynamic tags, where
 * the generated `is={expr}` value stands in for both `<{expr}` and `</{expr}>`;
 * segments.js turns each recorded node into an additional mapping token.
 * @param {AST.Node} generated
 * @param {AST.Node | null | undefined} source
 * @returns {void}
 */
export function add_extra_source_mappings_from_matching_expression(generated, source) {
	if (!generated || !source || generated.type !== source.type) return;

	if (generated.type === 'Identifier' || generated.type === 'PrivateIdentifier') {
		if (!has_location(source)) return;
		generated.metadata ??= { path: [] };
		generated.metadata.extra_source_mappings ??= [];
		generated.metadata.extra_source_mappings.push(source);
		return;
	}

	const generated_node = /** @type {AST.TraversableAstNode} */ (generated);
	const source_node = /** @type {AST.TraversableAstNode} */ (source);
	for (const key of ['expression', 'object', 'property']) {
		const generated_child = generated_node[key];
		const source_child = source_node[key];
		if (is_ast_node(generated_child) && is_ast_node(source_child)) {
			add_extra_source_mappings_from_matching_expression(generated_child, source_child);
		}
	}
}

/**
 * @param {unknown} value
 * @returns {value is AST.Node}
 */
function is_ast_node(value) {
	return !!value && typeof value === 'object' && 'type' in value;
}

/**
 * @returns {AST.Literal}
 */
export function create_null_literal() {
	return b.literal(null, 'null');
}

/**
 * @param {string} name
 * @returns {AST.Identifier}
 */
export function create_generated_identifier(name) {
	return b.id(name);
}

/**
 * @param {AST.BaseNode} node
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
 * @param {AST.Identifier | AST.MemberExpression} id
 * @returns {ESTreeJSX.JSXIdentifier | ESTreeJSX.JSXMemberExpression}
 */
export function identifier_to_jsx_name(id) {
	if (id.type === 'Identifier') {
		return identifier_to_jsx_identifier(id);
	}
	const object =
		id.object.type === 'Identifier'
			? identifier_to_jsx_name(id.object)
			: identifier_to_jsx_name(/** @type {AST.MemberExpression} */ (id.object));
	const property = identifier_to_jsx_identifier(/** @type {AST.Identifier} */ (id.property));
	const name = b.jsx_member(object, property);
	name.metadata = id.metadata || { path: [] };
	return set_loc(name, id);
}

/**
 * @param {AST.Identifier} id
 * @returns {ESTreeJSX.JSXIdentifier}
 */
export function identifier_to_jsx_identifier(id) {
	const name = b.jsx_id(id.name);
	name.metadata = {
		...(id.metadata || {}),
		path: [],
		is_component: /^[A-Z]/.test(id.name),
	};
	return set_loc(name, id);
}

/**
 * A JSX tag name refers to a *component* (rather than a host/DOM tag) iff:
 * - it's a `JSXIdentifier` whose first character is uppercase (the convention
 *   every framework's JSX runtime keys off — `<div>` is a host element,
 *   `<Foo>` is a component), or
 * - it's a `JSXMemberExpression` (e.g. `<Icons.Button />`).
 *
 * Used by platforms that veto static-hoisting of component JSX (Vue, Solid)
 * and by core's narrower bare-component-invocation predicate.
 *
 * @param {ESTreeJSX.TSRXJSXOpeningElement['name'] | AST.Identifier} name
 * @returns {boolean}
 */
export function is_component_jsx_name(name) {
	if (!name || typeof name !== 'object') {
		return false;
	}

	if (name.type === 'JSXIdentifier') {
		const first = name.name?.[0];
		return first != null && first >= 'A' && first <= 'Z';
	}

	if (name.type === 'JSXMemberExpression') {
		return true;
	}

	return false;
}

/**
 * Does this JSX subtree contain any component-shaped element (anywhere —
 * including nested under host elements or inside expression containers)?
 * Vue and Solid use this as their `canHoistStaticNode` predicate: hoisting a
 * subtree that invokes a component into a module-level constant pins that
 * component instance to module identity, which doesn't help either framework
 * the way it helps React, so it's wasted output.
 *
 * @param {AST.Node | AST.Node[]} node
 * @returns {boolean}
 */
export function contains_component_jsx(node) {
	if (!node || typeof node !== 'object') {
		return false;
	}
	if ('type' in node && node.type === 'JSXElement') {
		if (is_component_jsx_name(node.openingElement?.name)) {
			return true;
		}
		return node.children?.some(contains_component_jsx) ?? false;
	}

	if ('type' in node && node.type === 'JSXFragment') {
		return node.children?.some(contains_component_jsx) ?? false;
	}

	if ('type' in node && node.type === 'JSXExpressionContainer') {
		return contains_component_jsx(node.expression);
	}

	if (Array.isArray(node)) {
		return node.some(contains_component_jsx);
	}

	return false;
}

/**
 * @param {AST.Node | null | undefined} node
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
		t === 'JSXIfExpression' ||
		t === 'JSXForExpression' ||
		t === 'JSXSwitchExpression' ||
		t === 'JSXTryExpression' ||
		t === 'IfStatement' ||
		t === 'ForOfStatement' ||
		t === 'SwitchStatement' ||
		t === 'TryStatement'
	);
}

/**
 * Expression-position lowering unwraps single-expression native fragments to
 * the inner expression.
 * When such a node appears directly in a component or statement render body,
 * the unwrapped expression is still render output rather than an executable
 * statement.
 *
 * @param {AST.Node | null | undefined} node
 * @returns {node is AST.Expression}
 */
export function is_bare_render_expression(node) {
	if (!node || typeof node !== 'object') {
		return false;
	}

	switch (node.type) {
		case 'ArrayExpression':
		case 'ArrowFunctionExpression':
		case 'AssignmentExpression':
		case 'AwaitExpression':
		case 'BinaryExpression':
		case 'CallExpression':
		case 'ChainExpression':
		case 'ClassExpression':
		case 'ConditionalExpression':
		case 'FunctionExpression':
		case 'Identifier':
		case 'ImportExpression':
		case 'Literal':
		case 'LogicalExpression':
		case 'MemberExpression':
		case 'MetaProperty':
		case 'NewExpression':
		case 'ObjectExpression':
		case 'ParenthesizedExpression':
		case 'SequenceExpression':
		case 'TaggedTemplateExpression':
		case 'TemplateLiteral':
		case 'ThisExpression':
		case 'TSAsExpression':
		case 'TSSatisfiesExpression':
		case 'TSNonNullExpression':
		case 'UnaryExpression':
		case 'UpdateExpression':
		case 'YieldExpression':
			return true;
		default:
			return false;
	}
}

/**
 * Gather the params a `for (x of y; index i)` loop should expose to its body
 * JSX (value first, optional index second).
 *
 * @param {AST.ForOfStatement['left']} left
 * @param {AST.Identifier | null} [index]
 * @returns {AST.Pattern[]}
 */
export function get_for_of_iteration_params(left, index) {
	/** @type {AST.Pattern[]} */
	const params = [];
	if (left?.type === 'VariableDeclaration' && left.declarations?.[0]) {
		params.push(left.declarations[0].id);
	} else {
		params.push(/** @type {AST.Pattern} */ (left));
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
 * @param {AST.Statement[]} consequent
 * @returns {AST.Statement[]}
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
 * the literal is emitted as-is. Identifiers and any other expression type still
 * get the ternary because the AST alone can't prove they're non-null strings.
 *
 * @param {AST.Expression} expression
 * @param {AST.Node | AST.NodeWithLocation} [source_node]
 * @returns {AST.Expression}
 */
export function to_text_expression(expression, source_node = expression) {
	if (is_static_string_expression(expression)) {
		return set_loc(clone_ast_node(expression), source_node);
	}
	return set_loc(
		/** @type {AST.Expression} */ ({
			type: 'ConditionalExpression',
			test: {
				type: 'BinaryExpression',
				operator: '==',
				left: clone_ast_node(expression),
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
				left: clone_ast_node(expression),
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
 * Deep-clone an AST subtree.
 *
 * @template T
 * @param {T} node
 * @param {boolean} with_locations
 * @returns {T}
 */
export function clone_ast_node(node, with_locations = true) {
	if (!node || typeof node !== 'object') return node;
	if (Array.isArray(node)) {
		return /** @type {T} */ (node.map((child) => clone_ast_node(child, with_locations)));
	}
	const clone = { ...node };
	const clone_record = /** @type {Record<string, unknown>} */ (clone);

	for (const key of Object.keys(node)) {
		if (!with_locations && (key === 'loc' || key === 'start' || key === 'end')) {
			delete clone_record[key];
			continue;
		}
		if (key === 'metadata') {
			const metadata = /** @type {Record<string, unknown>} */ (node).metadata;
			clone_record.metadata =
				metadata && typeof metadata === 'object' ? { ...metadata } : { path: [] };
			continue;
		}
		clone_record[key] = clone_ast_node(
			/** @type {Record<string, unknown>} */ (node)[key],
			with_locations,
		);
	}
	return clone;
}
