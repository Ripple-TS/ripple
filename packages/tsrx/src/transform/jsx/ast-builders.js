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
				metadata: { ...(id.metadata || {}), path: [], is_component: /^[A-Z]/.test(id.name) },
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
 * A JSX tag name refers to a *component* (rather than a host/DOM tag) iff:
 * - it's a `JSXIdentifier` whose first character is uppercase (the convention
 *   every framework's JSX runtime keys off — `<div>` is a host element,
 *   `<Foo>` is a component), or
 * - it's a `JSXMemberExpression` (e.g. `<Icons.Button />`).
 *
 * Used by platforms that veto static-hoisting of component JSX (Vue, Solid)
 * and by core's narrower bare-component-invocation predicate.
 *
 * @param {any} name
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
 * @param {any} node
 * @returns {boolean}
 */
export function contains_component_jsx(node) {
	if (!node || typeof node !== 'object') {
		return false;
	}

	if (node.type === 'JSXElement') {
		if (is_component_jsx_name(node.openingElement?.name)) {
			return true;
		}
		return node.children?.some(contains_component_jsx) ?? false;
	}

	if (node.type === 'JSXFragment') {
		return node.children?.some(contains_component_jsx) ?? false;
	}

	if (node.type === 'JSXExpressionContainer') {
		return contains_component_jsx(node.expression);
	}

	if (Array.isArray(node)) {
		return node.some(contains_component_jsx);
	}

	return false;
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
		t === 'Tsrx' ||
		t === 'TsxCompat' ||
		t === 'Element' ||
		t === 'Text' ||
		t === 'TSRXExpression' ||
		t === 'IfStatement' ||
		t === 'ForOfStatement' ||
		t === 'SwitchStatement' ||
		t === 'TryStatement'
	);
}

/**
 * The parser represents `<>{expr}</>` / `<tsx>{expr}</tsx>` as a Tsx node,
 * and expression-position lowering unwraps that to the inner expression.
 * When such a node appears directly in a component or statement render body,
 * the unwrapped expression is still render output rather than an executable
 * statement.
 *
 * @param {any} node
 * @returns {boolean}
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
 * Compute fall-through expansions for each `case` in a `switch`. JavaScript
 * `switch` semantics say that once a case body executes, execution continues
 * into the bodies of subsequent cases until a `break` or terminal `return` is
 * hit. We pre-compute, per case, the flat list of statements that should run
 * when that case is the entry point — so downstream targets (which render each
 * case independently rather than executing fall-through at runtime) still
 * produce the right output.
 *
 * Walking right-to-left lets each case reuse the next case's already-expanded
 * tail without recomputation. Downstream nodes are deep-cloned when absorbed
 * so each case's expanded body owns its own AST subtree.
 *
 * @param {any[]} cases
 * @returns {Array<{ test: any, body: any[], source: any }>}
 */
export function expand_switch_cases_for_fallthrough(cases) {
	/** @type {Array<{ test: any, body: any[], source: any }>} */
	const expanded = new Array(cases.length);
	for (let i = cases.length - 1; i >= 0; i--) {
		const consequent = flatten_switch_consequent(cases[i].consequent || []);
		const body = [];
		let has_terminal = false;
		for (const child of consequent) {
			if (child.type === 'BreakStatement') {
				has_terminal = true;
				break;
			}
			body.push(child);
			if (child.type === 'ReturnStatement') {
				has_terminal = true;
				break;
			}
		}
		// Strip locations from cloned downstream nodes. Only the original case
		// (one entry up the chain) keeps `loc`/`start`/`end`; clones inlined
		// into upstream cases would otherwise point editor IntelliSense at the
		// same source range multiple times (one hover/go-to-definition per
		// fall-through entry point), producing double/triple results in Volar.
		const downstream =
			!has_terminal && i + 1 < cases.length
				? expanded[i + 1].body.map((n) => clone_expression_node(n, false))
				: [];
		expanded[i] = {
			test: cases[i].test,
			body: [...body, ...downstream],
			source: cases[i],
		};
	}
	return expanded;
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
 * children (`<b>"hello"</b>`). Identifiers and any other expression type
 * still get the ternary because the AST alone can't prove they're non-null
 * strings.
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
 * Deep-clone an AST subtree.
 *
 * @param {any} node
 * @param {boolean} with_locations
 * @returns {any}
 */
export function clone_expression_node(node, with_locations = true) {
	if (!node || typeof node !== 'object') return node;
	if (Array.isArray(node)) return node.map((child) => clone_expression_node(child, with_locations));
	const clone = /** @type {Record<string, any>} */ ({});

	for (const key of Object.keys(node)) {
		if (!with_locations && (key === 'loc' || key === 'start' || key === 'end')) {
			continue;
		}
		if (key === 'metadata') {
			clone.metadata = node.metadata ? { ...node.metadata } : { path: [] };
			continue;
		}
		clone[key] = clone_expression_node(node[key], with_locations);
	}
	return clone;
}
