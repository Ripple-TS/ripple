/**
@import * as AST from 'estree';
@import { CommonContext, NameSpace, ScopeInterface, Binding } from '../types/index';
 */

import {
	buildAssignmentValue,
	extractPaths,
	builders,
	isBooleanAttribute,
	isCaptureEvent,
	isDomProperty,
	isNonDelegated,
	isVoidElement,
	normalizeEventName,
	simpleHash,
	strongHash,
} from '@tsrx/core';
const b = builders;

// Re-export under the framework's snake_case internal convention.
export const is_void_element = isVoidElement;
export const is_boolean_attribute = isBooleanAttribute;
export const is_dom_property = isDomProperty;
export const simple_hash = simpleHash;
export const strong_hash = strongHash;

const RESERVED_WORDS = [
	'arguments',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'eval',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'implements',
	'import',
	'in',
	'instanceof',
	'interface',
	'let',
	'new',
	'null',
	'package',
	'private',
	'protected',
	'public',
	'return',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
];

/**
 * Returns true if word is a reserved JS keyword
 * @param {string} word
 * @returns {boolean}
 */
export function is_reserved(word) {
	return RESERVED_WORDS.includes(word);
}

// Omits track, trackSplit and trackAsync are they're handled separately
/** @type {Record<string, {name: string, requiresBlock?: boolean}>} */
const RIPPLE_IMPORT_CALL_NAME = {
	RippleArray: { name: 'ripple_array', requiresBlock: true },
	RippleObject: { name: 'ripple_object', requiresBlock: true },
	RippleURL: { name: 'ripple_url', requiresBlock: true },
	RippleURLSearchParams: { name: 'ripple_url_search_params', requiresBlock: true },
	RippleDate: { name: 'ripple_date', requiresBlock: true },
	RippleMap: { name: 'ripple_map', requiresBlock: true },
	RippleSet: { name: 'ripple_set', requiresBlock: true },
	MediaQuery: { name: 'media_query', requiresBlock: true },
	Context: { name: 'context' },
	effect: { name: 'effect' },
	untrack: { name: 'untrack' },
	trackPending: { name: 'is_tracked_pending' },
	peek: { name: 'peek_tracked' },
};

/**
 * Determines if an event handler can be delegated
 * @param {string} event_name
 * @param {AST.Node} handler
 * @param {CommonContext} context
 * @returns {boolean}
 */
export function is_delegated_event(event_name, handler, context) {
	// Handle delegated event handlers. Bail out if not a delegated event.
	if (
		!handler ||
		isCaptureEvent(event_name) ||
		isNonDelegated(normalizeEventName(event_name)) ||
		(handler.type !== 'FunctionExpression' &&
			handler.type !== 'ArrowFunctionExpression' &&
			!is_declared_function_within_component(/** @type {AST.Identifier}*/ (handler), context))
	) {
		return false;
	}
	return true;
}

/**
 * Returns the matched Ripple tracking call name
 * @param {AST.Expression | AST.Super} callee
 * @param {CommonContext} context
 * @returns {'track' | 'trackAsync' | null}
 */
export function is_ripple_track_call(callee, context) {
	// Super expressions cannot be Ripple track calls
	if (callee.type === 'Super') return null;

	if (callee.type === 'Identifier' && (callee.name === 'track' || callee.name === 'trackAsync')) {
		return is_ripple_import(callee, context) ? callee.name : null;
	}

	if (
		callee.type === 'MemberExpression' &&
		callee.object.type === 'Identifier' &&
		callee.property.type === 'Identifier' &&
		(callee.property.name === 'track' || callee.property.name === 'trackAsync') &&
		!callee.computed &&
		is_ripple_import(callee, context)
	) {
		return callee.property.name;
	}

	return null;
}

/**
 * Returns true if context is inside a call expression
 * @param {CommonContext} context
 * @returns {boolean}
 */
export function is_inside_call_expression(context) {
	for (let i = context.path.length - 1; i >= 0; i -= 1) {
		const context_node = context.path[i];
		const type = context_node.type;

		if (
			type === 'FunctionExpression' ||
			type === 'ArrowFunctionExpression' ||
			type === 'FunctionDeclaration'
		) {
			return false;
		}
		if (type === 'CallExpression') {
			const callee = context_node.callee;
			if (is_ripple_track_call(callee, context)) {
				return false;
			}
			return true;
		}
	}
	return false;
}

/**
 * Returns true if node is a static value (Literal, ArrayExpression, etc)
 * @param {AST.Node} node
 * @returns {boolean}
 */
export function is_value_static(node) {
	if (node.type === 'Literal') {
		return true;
	}
	if (node.type === 'ArrayExpression') {
		return true;
	}
	if (node.type === 'NewExpression') {
		if (node.callee.type === 'Identifier' && node.callee.name === 'Array') {
			return true;
		}
		return false;
	}

	return false;
}

/**
 * Returns true if callee is a Ripple import
 * @param {AST.Expression} callee
 * @param {CommonContext} context
 * @returns {boolean}
 */
export function is_ripple_import(callee, context) {
	if (callee.type === 'Identifier') {
		const binding = context.state.scope.get(callee.name);

		return (
			binding?.declaration_kind === 'import' &&
			binding.initial !== null &&
			binding.initial.type === 'ImportDeclaration' &&
			binding.initial.source.type === 'Literal' &&
			binding.initial.source.value === 'ripple'
		);
	} else if (
		callee.type === 'MemberExpression' &&
		callee.object.type === 'Identifier' &&
		!callee.computed
	) {
		const binding = context.state.scope.get(callee.object.name);

		return (
			binding?.declaration_kind === 'import' &&
			binding.initial !== null &&
			binding.initial.type === 'ImportDeclaration' &&
			binding.initial.source.type === 'Literal' &&
			binding.initial.source.value === 'ripple'
		);
	}

	return false;
}

/**
 * Returns true if node is a function declared within a component
 * @param {AST.Node} node
 * @param {CommonContext} context
 * @returns {boolean}
 */
export function is_declared_function_within_component(node, context) {
	const component = context.path?.find((n) => n.type === 'Component');

	if (node.type === 'Identifier' && component) {
		const binding = context.state.scope.get(node.name);
		const component_scope = context.state.scopes.get(component);

		if (binding !== null && component_scope !== undefined) {
			if (
				binding.declaration_kind !== 'function' &&
				binding.initial?.type !== 'FunctionDeclaration' &&
				binding.initial?.type !== 'ArrowFunctionExpression' &&
				binding.initial?.type !== 'FunctionExpression'
			) {
				return false;
			}
			/** @type {ScopeInterface | null} */
			let scope = binding.scope;

			while (scope !== null) {
				if (scope === component_scope) {
					return true;
				}
				scope = scope.parent;
			}
		}
	}

	return false;
}
/**
 * Visits and transforms an assignment expression
 * @param {AST.AssignmentExpression} node
 * @param {CommonContext} context
 * @param {Function} build_assignment
 * @returns {AST.Expression | AST.AssignmentExpression | null}
 */
export function visit_assignment_expression(node, context, build_assignment) {
	if (
		node.left.type === 'ArrayPattern' ||
		node.left.type === 'ObjectPattern' ||
		node.left.type === 'RestElement'
	) {
		const value = /** @type {AST.Expression} */ (context.visit(node.right));
		const should_cache = value.type !== 'Identifier';
		const rhs = should_cache ? b.id('$$value') : value;

		let changed = false;

		const assignments = extractPaths(node.left).map((path) => {
			const value = path.expression?.(rhs);

			let assignment = build_assignment('=', path.node, value, context);
			if (assignment !== null) changed = true;

			return (
				assignment ??
				b.assignment(
					'=',
					/** @type {AST.Pattern} */ (context.visit(path.node)),
					/** @type {AST.Expression} */ (context.visit(value)),
				)
			);
		});

		if (!changed) {
			// No change to output -> nothing to transform -> we can keep the original assignment
			return null;
		}

		const is_standalone = context.path.at(-1)?.type.endsWith('Statement');
		const sequence = b.sequence(assignments);

		if (!is_standalone) {
			// this is part of an expression, we need the sequence to end with the value
			sequence.expressions.push(rhs);
		}

		if (should_cache) {
			// the right hand side is a complex expression, wrap in an IIFE to cache it
			const iife = b.arrow([rhs], sequence);

			return b.call(iife, value);
		}

		return sequence;
	}

	if (node.left.type !== 'Identifier' && node.left.type !== 'MemberExpression') {
		throw new Error(`Unexpected assignment type ${node.left.type}`);
	}

	const transformed = build_assignment(node.operator, node.left, node.right, context);

	if (transformed === node.left) {
		return node;
	}

	return transformed;
}

/**
 * Builds an assignment node, possibly transforming for reactivity
 * @param {AST.AssignmentOperator} operator
 * @param {AST.Pattern} left
 * @param {AST.Expression} right
 * @param {CommonContext} context
 * @returns {AST.Expression | null}
 */
export function build_assignment(operator, left, right, context) {
	let object = left;

	while (object.type === 'MemberExpression') {
		// @ts-expect-error
		object = object.object;
	}

	if (object.type !== 'Identifier') {
		return null;
	}

	const binding = context.state.scope.get(object.name);
	if (!binding) return null;

	const transform = binding.transform;

	// reassignment
	if (object === left || (left.type === 'MemberExpression' && left.computed && operator === '=')) {
		const assign_fn = transform?.assign;
		if (assign_fn) {
			let value = /** @type {AST.Expression} */ (
				context.visit(buildAssignmentValue(operator, left, right))
			);

			return assign_fn(object, value);
		}
	}

	return null;
}

const ATTR_REGEX = /[&"<]/g;
const CONTENT_REGEX = /[&<]/g;

/**
 * Escapes HTML special characters in a string
 * @param {string | number | bigint | boolean | RegExp | null | undefined} value
 * @param {boolean} [is_attr=false]
 * @returns {string}
 */
export function escape_html(value, is_attr = false) {
	const str = String(value ?? '');

	const pattern = is_attr ? ATTR_REGEX : CONTENT_REGEX;
	pattern.lastIndex = 0;

	let escaped = '';
	let last = 0;

	while (pattern.test(str)) {
		const i = pattern.lastIndex - 1;
		const ch = str[i];
		escaped += str.substring(last, i) + (ch === '&' ? '&amp;' : ch === '"' ? '&quot;' : '&lt;');
		last = i + 1;
	}

	return escaped + str.substring(last);
}

/**
 * Returns true if node is a DOM element (not a component)
 * @param {AST.Node} node
 * @returns {boolean}
 */
export function is_element_dom_element(node) {
	const id = /** @type {AST.Element} */ (node).id;
	return (
		id.type === 'Identifier' &&
		id.name[0].toLowerCase() === id.name[0] &&
		id.name !== 'children' &&
		!id.tracked
	);
}

/**
 * Returns true if element is a dynamic element
 * @param {AST.Element} node
 * @returns {boolean}
 */
export function is_element_dynamic(node) {
	return is_id_dynamic(node.id);
}

/**
 * @param {AST.Identifier | AST.MemberExpression | AST.Literal} node
 * @returns {boolean}
 */
function is_id_dynamic(node) {
	if (node.type === 'Identifier') {
		return !!node.tracked;
	}

	return false;
}

/**
 * Normalizes children nodes (merges adjacent text, removes empty)
 * @param {AST.Node[]} children
 * @param {CommonContext} context
 * @returns {AST.Node[]}
 */
export function normalize_children(children, context) {
	/** @type {AST.Node[]} */
	const normalized = [];

	for (const node of children) {
		normalize_child(node, normalized, context);
	}

	for (let i = normalized.length - 1; i >= 0; i--) {
		const child = normalized[i];
		const prev_child = normalized[i - 1];

		if (
			(child.type === 'TSRXExpression' || child.type === 'Text') &&
			(prev_child?.type === 'TSRXExpression' || prev_child?.type === 'Text')
		) {
			if (
				(child.type === 'TSRXExpression' &&
					is_children_template_expression(child.expression, context.state.scope)) ||
				(prev_child.type === 'TSRXExpression' &&
					is_children_template_expression(prev_child.expression, context.state.scope))
			) {
				continue;
			}

			if (prev_child.type === 'Text' || child.type === 'Text') {
				prev_child.type = 'Text';
			}
			if (child.expression.type === 'Literal' && prev_child.expression.type === 'Literal') {
				prev_child.expression = b.literal(
					prev_child.expression.value + String(child.expression.value),
				);
			} else {
				prev_child.expression = b.binary(
					'+',
					prev_child.expression,
					b.call('String', child.expression),
				);
			}
			normalized.splice(i, 1);
		}
	}

	return normalized;
}

/**
 * @param {AST.Expression} expression
 * @returns {AST.Expression}
 */
export function unwrap_template_expression(expression) {
	/** @type {AST.Expression} */
	let node = expression;

	while (true) {
		if (
			node.type === 'ParenthesizedExpression' ||
			node.type === 'TSAsExpression' ||
			node.type === 'TSSatisfiesExpression' ||
			node.type === 'TSNonNullExpression' ||
			node.type === 'TSInstantiationExpression'
		) {
			node = /** @type {AST.Expression} */ (node.expression);
			continue;
		}

		if (node.type === 'ChainExpression') {
			node = /** @type {AST.Expression} */ (node.expression);
			continue;
		}

		break;
	}

	return node;
}

/**
 * @param {AST.Expression} expression
 * @param {ScopeInterface | null | undefined} scope
 * @param {ScopeInterface | null} [component_scope]
 * @returns {boolean}
 */
export function is_children_template_expression(expression, scope, component_scope = null) {
	if (scope == null) {
		return false;
	}

	const unwrapped = unwrap_template_expression(expression);

	if (unwrapped.type === 'MemberExpression') {
		let property_name = null;

		if (!unwrapped.computed && unwrapped.property.type === 'Identifier') {
			property_name = unwrapped.property.name;
		} else if (
			unwrapped.computed &&
			unwrapped.property.type === 'Literal' &&
			typeof unwrapped.property.value === 'string'
		) {
			property_name = unwrapped.property.value;
		}

		if (property_name === 'children') {
			const target = unwrap_template_expression(/** @type {AST.Expression} */ (unwrapped.object));

			if (target.type === 'Identifier') {
				const binding = scope.get(target.name);
				return (
					binding?.declaration_kind === 'param' &&
					(component_scope === null || binding.scope === component_scope)
				);
			}
		}
	}

	if (unwrapped.type !== 'Identifier' || unwrapped.name !== 'children') {
		return false;
	}

	const binding = scope.get(unwrapped.name);
	return (
		(binding?.declaration_kind === 'param' ||
			binding?.kind === 'prop' ||
			binding?.kind === 'prop_fallback' ||
			binding?.kind === 'lazy' ||
			binding?.kind === 'lazy_fallback') &&
		(component_scope === null || binding.scope === component_scope)
	);
}

/**
 * @param {AST.Node} node
 * @param {AST.Node[]} normalized
 * @param {CommonContext} context
 */
function normalize_child(node, normalized, context) {
	if (node.type === 'EmptyStatement') {
		return;
	} else if (
		node.type === 'Element' &&
		node.id.type === 'Identifier' &&
		((node.id.name === 'style' &&
			!context.state.inside_head &&
			!context.state.keep_component_style) ||
			node.id.name === 'head' ||
			(node.id.name === 'title' && context.state.inside_head))
	) {
		return;
	} else {
		normalized.push(node);
	}
}

/**
 * Replaces any lazy subpatterns in a parameter pattern with their generated identifiers.
 * This is used by client and server transforms so nested lazy destructuring can coexist
 * with otherwise normal object/array params.
 * @param {AST.Pattern} pattern
 * @returns {AST.Pattern}
 */
export function replace_lazy_param_pattern(pattern) {
	switch (pattern.type) {
		case 'AssignmentPattern':
			return { ...pattern, left: replace_lazy_param_pattern(pattern.left) };

		case 'ObjectPattern':
			if (pattern.lazy && pattern.metadata?.lazy_id) {
				return /** @type {AST.Pattern} */ (b.id(pattern.metadata.lazy_id));
			}

			return {
				...pattern,
				properties: pattern.properties.map((property) =>
					property.type === 'RestElement'
						? { ...property, argument: replace_lazy_param_pattern(property.argument) }
						: { ...property, value: replace_lazy_param_pattern(property.value) },
				),
			};

		case 'ArrayPattern':
			if (pattern.lazy && pattern.metadata?.lazy_id) {
				return /** @type {AST.Pattern} */ (b.id(pattern.metadata.lazy_id));
			}

			return {
				...pattern,
				elements: pattern.elements.map((element) =>
					element === null ? null : replace_lazy_param_pattern(element),
				),
			};

		case 'RestElement':
			return { ...pattern, argument: replace_lazy_param_pattern(pattern.argument) };

		default:
			return pattern;
	}
}

/**
 * @param {CommonContext} context
 */
export function get_parent_block_node(context) {
	const path = context.path;

	for (let i = path.length - 1; i >= 0; i -= 1) {
		const context_node = path[i];
		if (
			context_node.type === 'IfStatement' ||
			context_node.type === 'ForOfStatement' ||
			context_node.type === 'SwitchStatement' ||
			context_node.type === 'TryStatement' ||
			context_node.type === 'Component'
		) {
			return context_node;
		}
		if (
			context_node.type === 'FunctionExpression' ||
			context_node.type === 'ArrowFunctionExpression' ||
			context_node.type === 'FunctionDeclaration'
		) {
			return null;
		}
	}
	return null;
}

/**
 * Builds a getter for a tracked identifier
 * @param {AST.Identifier} node
 * @param {CommonContext} context
 * @returns {AST.Expression | AST.Identifier}
 */
export function build_getter(node, context) {
	const state = context.state;

	if (!context.path) return node;

	for (let i = context.path.length - 1; i >= 0; i -= 1) {
		const binding = state.scope.get(node.name);
		const transform = binding?.transform;

		// don't transform the declaration itself
		if (node !== binding?.node) {
			const read_fn = transform?.read;

			if (read_fn) {
				return read_fn(node);
			}
		}
	}

	return node;
}

/**
 * Determines the namespace for child elements
 * @param {string} element_name
 * @param {NameSpace} current_namespace
 * @returns {NameSpace}
 */
export function determine_namespace_for_children(element_name, current_namespace) {
	if (element_name === 'foreignObject') {
		return 'html';
	}

	if (element_name === 'svg') {
		return 'svg';
	}

	if (element_name === 'math') {
		return 'mathml';
	}

	return current_namespace;
}

/**
 * Converts and index to a key string, where the starting character is a
 * letter.
 * @param {number} index
 */
export function index_to_key(index) {
	const letters = 'abcdefghijklmnopqrstuvwxyz';
	let key = '';

	do {
		key = letters[index % 26] + key;
		index = Math.floor(index / 26) - 1;
	} while (index >= 0);

	return key;
}

/**
 * Check if a binding ultimately refers to a function, following reference chains
 * @param {Binding} binding
 * @param {ScopeInterface} scope
 * @param {Set<Binding>} visited
 * @returns {boolean}
 */
export function is_binding_function(binding, scope, visited = new Set()) {
	if (!binding || visited.has(binding)) {
		return false;
	}
	visited.add(binding);

	const initial = binding.initial;
	if (!initial) {
		return false;
	}

	// Direct function
	if (
		initial.type === 'FunctionDeclaration' ||
		initial.type === 'FunctionExpression' ||
		initial.type === 'ArrowFunctionExpression'
	) {
		return true;
	}

	// Follow identifier references (e.g., const alias = myFunc)
	if (initial.type === 'Identifier') {
		const next_binding = scope.get(initial.name);
		if (next_binding) {
			return is_binding_function(next_binding, scope, visited);
		}
	}

	return false;
}

/**
 * @param {AST.TryStatement} try_parent_stmt
 * @param {CommonContext} context
 * @returns {boolean}
 */
export function is_inside_try_block(try_parent_stmt, context) {
	/** @type {AST.BlockStatement | null} */
	let block_node = null;
	for (let i = context.path.length - 1; i >= 0; i -= 1) {
		const context_node = context.path[i];

		if (context_node.type === 'BlockStatement') {
			block_node = /** @type {AST.BlockStatement} */ (context_node);
		}

		if (context_node === try_parent_stmt) {
			break;
		}
	}

	return block_node !== null && try_parent_stmt.block === block_node;
}

/**
 * Checks if a node is used as the left side of an assignment or update expression.
 * @param {AST.Node} node
 * @returns {boolean}
 */
export function is_inside_left_side_assignment(node) {
	const path = node.metadata?.path;
	if (!path || path.length === 0) {
		return false;
	}

	/** @type {AST.Node} */
	let current = node;

	for (let i = path.length - 1; i >= 0; i--) {
		const parent = path[i];

		switch (parent.type) {
			case 'AssignmentExpression':
			case 'AssignmentPattern':
				if (parent.right === current) {
					return false;
				}

				if (parent.left === current) {
					return true;
				}
				current = parent;
				continue;
			case 'UpdateExpression':
				return true;
			case 'MemberExpression':
				// In obj[computeKey()] = 10, computeKey() is evaluated to determine
				// which property to assign to, but is not itself an assignment target
				if (parent.computed && parent.property === current) {
					return false;
				}
				current = parent;
				continue;
			case 'Property':
				// exit here to stop promoting current to parent
				// and thus reaching VariableDeclarator, causing an erroneous truthy result
				// e.g. const { [computeKey()]: value } = obj; where node = computeKey:
				if (parent.key === current) {
					return false;
				}
				current = parent;
				continue;
			case 'VariableDeclarator':
				return parent.id === current;
			case 'ForInStatement':
			case 'ForOfStatement':
				return parent.left === current;

			case 'Program':
			case 'FunctionDeclaration':
			case 'FunctionExpression':
			case 'ArrowFunctionExpression':
			case 'ClassDeclaration':
			case 'ClassExpression':
			case 'MethodDefinition':
			case 'PropertyDefinition':
			case 'StaticBlock':
			case 'Component':
			case 'Element':
				return false;

			default:
				current = parent;
				continue;
		}
	}

	return false;
}

/**
 * Flattens top-level BlockStatements in switch case consequents so that
 * BreakStatements and elements inside block-scoped cases are properly handled.
 * e.g. `case 1: { <div /> break; }` → `[Element, BreakStatement]`
 * @param {AST.Node[]} consequent
 * @returns {AST.Node[]}
 */
export function flatten_switch_consequent(consequent) {
	/** @type {AST.Node[]} */
	const result = [];
	for (const node of consequent) {
		if (node.type === 'BlockStatement') {
			result.push(.../** @type {AST.BlockStatement} */ (node).body);
		} else {
			result.push(node);
		}
	}
	return result;
}

/**
 * @param {string | null | undefined} name
 * @returns {string | null}
 */
export function get_ripple_namespace_call_name(name) {
	return name == null ? null : (RIPPLE_IMPORT_CALL_NAME[name]?.name ?? null);
}

/**
 * Returns true if the given import name requires a __block parameter
 * @param {string} name
 * @returns {boolean}
 */
export function ripple_import_requires_block(name) {
	return name == null ? false : (RIPPLE_IMPORT_CALL_NAME[name]?.requiresBlock ?? false);
}

/**
 * @param {AST.ClassDeclaration | AST.ClassExpression} node
 * @param {CommonContext} context
 * @returns {void}
 */
export function strip_class_typescript_syntax(node, context) {
	delete node.typeParameters;
	delete node.superTypeParameters;
	delete node.implements;

	if (node.superClass?.type === 'TSInstantiationExpression') {
		node.superClass = /** @type {AST.Expression} */ (context.visit(node.superClass.expression));
	} else if (node.superClass && 'typeArguments' in node.superClass) {
		delete node.superClass.typeArguments;
	}
}

/**
 * Converts a JSXMemberExpression to an AST MemberExpression.
 * e.g., <Foo.Bar.Baz> → MemberExpression(MemberExpression(Foo, Bar), Baz)
 * @param {import('estree-jsx').JSXMemberExpression} jsx_member
 * @returns {AST.MemberExpression}
 */
function jsx_member_expression_to_member_expression(jsx_member) {
	/** @type {AST.Expression} */
	let object;

	if (jsx_member.object.type === 'JSXMemberExpression') {
		// Recursively convert nested member expressions
		object = jsx_member_expression_to_member_expression(jsx_member.object);
	} else {
		// Base case: JSXIdentifier
		object = /** @type {AST.Identifier} */ ({
			type: 'Identifier',
			name: jsx_member.object.name,
			start: jsx_member.object.start,
			end: jsx_member.object.end,
		});
	}

	return /** @type {AST.MemberExpression} */ ({
		type: 'MemberExpression',
		object,
		property: /** @type {AST.Identifier} */ ({
			type: 'Identifier',
			name: jsx_member.property.name,
			start: jsx_member.property.start,
			end: jsx_member.property.end,
		}),
		computed: false,
		optional: false,
		start: jsx_member.start,
		end: jsx_member.end,
	});
}

/**
 * Converts a JSX AST node (JSXElement, JSXText, etc.) to a Ripple AST node
 * (Element, Text, TSRXExpression) for processing inside `<tsx>` blocks.
 * @param {AST.Node} node
 * @param {AST.Node[]} [inherited_path=[]]
 * @returns {AST.Node | AST.Node[] | null}
 */
export function jsx_to_ripple_node(node, inherited_path = []) {
	if (node.type === 'JSXElement') {
		const opening = node.openingElement;
		const name = opening.name;

		/** @type {AST.Identifier | AST.MemberExpression} */
		let id;

		if (name.type === 'JSXIdentifier') {
			id = /** @type {AST.Identifier} */ ({
				type: 'Identifier',
				name: name.name,
				start: name.start,
				end: name.end,
			});
		} else if (name.type === 'JSXMemberExpression') {
			// Convert JSXMemberExpression to MemberExpression
			// e.g., <Foo.Bar.Baz> → MemberExpression(MemberExpression(Foo, Bar), Baz)
			id = jsx_member_expression_to_member_expression(name);
		} else if (name.type === 'JSXNamespacedName') {
			// For JSXNamespacedName like <namespace:element>, create an identifier with the full name
			id = /** @type {AST.Identifier} */ ({
				type: 'Identifier',
				name: name.namespace.name + ':' + name.name.name,
				start: name.start,
				end: name.end,
			});
		} else {
			// Fallback - should not reach here
			id = /** @type {AST.Identifier} */ ({
				type: 'Identifier',
				name: 'unknown',
				start: /** @type {AST.Node} */ (name).start,
				end: /** @type {AST.Node} */ (name).end,
			});
		}

		const attributes = opening.attributes
			.map((attr) => {
				if (attr.type === 'JSXAttribute') {
					const is_dynamic = attr.value && attr.value.type === 'JSXExpressionContainer';
					return /** @type {AST.Node} */ ({
						type: 'Attribute',
						name: {
							type: 'Identifier',
							name:
								attr.name.type === 'JSXIdentifier'
									? attr.name.name
									: attr.name.namespace.name + ':' + attr.name.name.name,
							tracked: is_dynamic,
							start: attr.name.start,
							end: attr.name.end,
						},
						value: attr.value
							? attr.value.type === 'JSXExpressionContainer'
								? attr.value.expression
								: attr.value
							: null,
						shorthand: false,
						start: attr.start,
						end: attr.end,
					});
				} else if (attr.type === 'JSXSpreadAttribute') {
					return /** @type {AST.Node} */ ({
						type: 'SpreadAttribute',
						argument: attr.argument,
						start: attr.start,
						end: attr.end,
					});
				}
				return null;
			})
			.filter(Boolean);

		const element = /** @type {AST.Element} */ (
			/** @type {unknown} */ ({
				type: 'Element',
				id,
				attributes,
				children: [],
				selfClosing: opening.selfClosing,
				metadata: { scoped: false, path: inherited_path },
				start: node.start,
				end: node.end,
			})
		);

		element.children = /** @type {AST.Node[]} */ (
			/** @type {AST.Node[]} */ (node.children)
				.map((child) => jsx_to_ripple_node(child, [...inherited_path, element]))
				.flat()
				.filter(Boolean)
		);

		return element;
	}

	if (node.type === 'JSXText') {
		if (node.value.trim() === '') return null;
		return /** @type {AST.Node} */ ({
			type: 'Text',
			expression: {
				type: 'Literal',
				value: node.value,
				raw: JSON.stringify(node.value),
				start: node.start,
				end: node.end,
			},
			metadata: {},
			start: node.start,
			end: node.end,
		});
	}

	if (node.type === 'JSXExpressionContainer') {
		if (node.expression.type === 'JSXEmptyExpression') return null;
		return /** @type {AST.Node} */ ({
			type: 'TSRXExpression',
			expression: node.expression,
			metadata: {},
			start: node.start,
			end: node.end,
		});
	}

	if (node.type === 'JSXFragment') {
		return /** @type {AST.Node[]} */ (
			/** @type {AST.Node[]} */ (node.children)
				.map((child) => jsx_to_ripple_node(child, inherited_path))
				.flat()
				.filter(Boolean)
		);
	}

	return node;
}
