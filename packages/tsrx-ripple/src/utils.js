/**
@import * as AST from 'estree';
@import * as ESTreeJSX from 'estree-jsx';
@import { CommonContext, NameSpace, ScopeInterface, Binding } from '../types/index';
 */

import {
	add_extra_source_mappings_from_matching_expression,
	buildAssignmentValue,
	clone_expression_node,
	extractPaths,
	builders,
	isBooleanAttribute,
	isCaptureEvent,
	isDomProperty,
	isNonDelegated,
	isVoidElement,
	normalizeEventName,
	setLocation,
	simpleHash,
	strongHash,
} from '@tsrx/core';
import {
	get_element_id,
	get_template_expression,
	is_droppable_template_text,
	is_empty_expression_container,
	is_dynamic_element,
	is_template_element,
	set_element_id,
	is_template_expression,
	is_template_fragment,
	is_template_text,
	is_template_text_or_expression,
} from './template-ast.js';
const b = builders;

// Re-export under the framework's snake_case internal convention.
export const is_void_element = isVoidElement;
export const is_boolean_attribute = isBooleanAttribute;
export const is_dom_property = isDomProperty;
export const simple_hash = simpleHash;
export const strong_hash = strongHash;

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
export function is_native_tsrx_function_node(node) {
	return !!(
		node &&
		(node.type === 'FunctionDeclaration' ||
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression') &&
		node.metadata?.native_tsrx_function
	);
}

/**
 * @param {AST.TSRXStatement} statement
 * @returns {boolean}
 */
export function should_guard_regular_js_statement(statement) {
	return (
		statement.type !== 'VariableDeclaration' &&
		statement.type !== 'FunctionDeclaration' &&
		statement.type !== 'ClassDeclaration' &&
		statement.type !== 'TSTypeAliasDeclaration' &&
		statement.type !== 'TSInterfaceDeclaration'
	);
}

/**
 * Plain JS control flow (`if`/`for`/`while`/`switch`/`try`, etc.) that is NOT an
 * `@if`/`@for`/`@switch`/`@try` template directive. Only directives carry
 * `metadata.tsrxDirective`; everything else is ordinary JavaScript that may
 * return JSX, and must lower exactly like control flow in a regular function.
 * @param {AST.Node} node
 * @returns {boolean}
 */
export function is_plain_js_control_flow(node) {
	if (node.metadata?.tsrxDirective) {
		return false;
	}
	return (
		node.type === 'IfStatement' ||
		node.type === 'SwitchStatement' ||
		node.type === 'TryStatement' ||
		node.type === 'ForOfStatement' ||
		node.type === 'ForInStatement' ||
		node.type === 'ForStatement' ||
		node.type === 'WhileStatement' ||
		node.type === 'DoWhileStatement'
	);
}

/**
 * Generate a name that is unique inside the current transform scope without
 * reserving it for the entire module.
 * @param {ScopeInterface} scope
 * @param {string} preferred_name
 * @returns {string}
 */
export function generate_local_name(scope, preferred_name) {
	preferred_name = preferred_name.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^[0-9]/, '_');
	let name = preferred_name;
	let n = 1;

	while (scope.references.has(name) || scope.declarations.has(name) || is_reserved(name)) {
		name = `${preferred_name}_${n++}`;
	}

	scope.references.set(name, []);
	return name;
}

/**
 * @param {AST.Node | null | undefined} node
 * @param {CommonContext} context
 * @returns {string | null}
 */
export function get_tsrx_component_function_name(node, context) {
	if (!node) return null;

	if (
		(node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') &&
		node.id?.name
	) {
		return node.id.name;
	}

	for (let i = context.path.length - 1; i >= 0; i -= 1) {
		const parent = context.path[i];
		if (
			parent.type === 'VariableDeclarator' &&
			parent.init === node &&
			parent.id.type === 'Identifier'
		) {
			return parent.id.name;
		}
		if (
			parent.type === 'PropertyDefinition' &&
			parent.value === node &&
			parent.key.type === 'Identifier'
		) {
			return parent.key.name;
		}
		if (
			parent.type === 'MethodDefinition' &&
			parent.value === node &&
			parent.key.type === 'Identifier'
		) {
			return parent.key.name;
		}
		if (parent.type === 'ExportDefaultDeclaration' && parent.declaration === node) {
			return 'default';
		}
	}

	return null;
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
export function is_tsrx_component_function(node) {
	return (
		is_native_tsrx_function_node(node) ||
		(!!node &&
			(node.type === 'FunctionDeclaration' ||
				node.type === 'FunctionExpression' ||
				node.type === 'ArrowFunctionExpression') &&
			node.body?.type === 'JSXCodeBlock')
	);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
export function is_native_tsrx_template_node(node) {
	return !!(
		node &&
		(node.type === 'JSXElement' ||
			node.type === 'JSXFragment' ||
			node.type === 'JSXIfExpression' ||
			node.type === 'JSXForExpression' ||
			node.type === 'JSXSwitchExpression' ||
			node.type === 'JSXTryExpression' ||
			node.metadata?.tsrxDirective === 'if' ||
			node.metadata?.tsrxDirective === 'for' ||
			node.metadata?.tsrxDirective === 'switch' ||
			node.metadata?.tsrxDirective === 'try')
	);
}

/**
 * Pre-pass: make template control flow consumable by the analyzer and
 * transforms. Wraps `@if`/`@for`/`@switch`/`@try` directives used in value
 * positions in a `<> … </>` fragment, then retypes every expression-position
 * `JSX…Expression` directive into its standard ESTree statement form tagged
 * with `metadata.tsrxDirective`.
 * @param {AST.Node} ast
 * @returns {void}
 */
export function prepare_template_control_flow(ast) {
	wrap_directives_combined_into_expressions(/** @type {any} */ (ast));
	retype_directive_expressions(/** @type {any} */ (ast));
}

/**
 * @param {any} node
 * @returns {any}
 */
function retype_directive_expression(node) {
	const statement = /** @type {any} */ ({ ...node, type: node.statementType });
	delete statement.statementType;
	const directive =
		node.type === 'JSXIfExpression'
			? 'if'
			: node.type === 'JSXForExpression'
				? 'for'
				: node.type === 'JSXSwitchExpression'
					? 'switch'
					: 'try';
	statement.metadata = {
		...(statement.metadata ?? {}),
		tsrxDirective: directive,
		// Marks a RETYPED directive: its branch bodies are template children
		// (lowered by `lower_template_code_blocks`), unlike a plain `@else if`
		// IfStatement that only carries `tsrxDirective` for the transforms.
		tsrx_template_directive: true,
	};
	// `@else if` parses as a plain IfStatement in the alternate — tag it so the
	// transforms lower it as template control flow (one level, matching the old
	// normalizer).
	if (directive === 'if' && statement.alternate?.type === 'IfStatement') {
		statement.alternate.metadata = {
			...(statement.alternate.metadata ?? {}),
			tsrxDirective: 'if',
		};
	}
	return statement;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_directive_expression(node) {
	return (
		node?.type === 'JSXIfExpression' ||
		node?.type === 'JSXForExpression' ||
		node?.type === 'JSXSwitchExpression' ||
		node?.type === 'JSXTryExpression'
	);
}

/**
 * @param {any} ast
 * @returns {void}
 */
function retype_directive_expressions(ast) {
	const seen = new Set();
	/** @param {any} node */
	const visit = (node) => {
		if (!node || typeof node !== 'object' || seen.has(node)) return;
		seen.add(node);
		if (Array.isArray(node)) {
			for (const item of node) visit(item);
			return;
		}
		for (const key of Object.keys(node)) {
			if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;
			const value = node[key];
			if (Array.isArray(value)) {
				for (let i = 0; i < value.length; i++) {
					if (is_directive_expression(value[i])) {
						value[i] = retype_directive_expression(value[i]);
					}
					visit(value[i]);
				}
			} else if (is_directive_expression(value)) {
				node[key] = retype_directive_expression(value);
				visit(node[key]);
			} else {
				visit(value);
			}
		}
	};
	visit(ast);
}

/**
 * A `@if`/`@for`/`@switch`/`@try` control-flow directive — a raw `JSX…Expression`
 * before normalization, or a statement carrying `metadata.tsrxDirective` after.
 * (A `@{ … }` code block is deliberately NOT included: it self-lowers to an IIFE
 * in every position, so it never needs wrapping and wrapping it would add a
 * redundant fragment.)
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_control_flow_directive(node) {
	const directive = node?.metadata?.tsrxDirective;
	return (
		directive === 'if' ||
		directive === 'for' ||
		directive === 'switch' ||
		directive === 'try' ||
		node?.type === 'JSXIfExpression' ||
		node?.type === 'JSXForExpression' ||
		node?.type === 'JSXSwitchExpression' ||
		node?.type === 'JSXTryExpression'
	);
}

/**
 * Slots where a control-flow directive is a render child / statement and is
 * lowered correctly as-is — so it must NOT be wrapped. Every OTHER slot is a
 * value position (an operator operand, a variable initializer, a `@for` iterable,
 * an `@if`/`@switch` test, a concise arrow body, a `return` argument, a member
 * object, …), where a bare directive would leak as an `if (…) { … }` statement
 * and is wrapped instead. Enumerating the render positions (rather than the value
 * ones) is robust: it covers every value slot, and the pre- and post-normalization
 * node shapes alike.
 * @param {AST.Node} parent
 * @param {string} key
 * @param {AST.Node} child
 * @returns {boolean}
 */
function is_render_child_or_statement_slot(parent, key, child) {
	// JSX children.
	if (key === 'children') return true;
	// Block/program/loop/function bodies are statement lists — but a CONCISE
	// (non-block) arrow body is an expression position, not a statement.
	if (key === 'body') {
		return !(
			parent?.type === 'ArrowFunctionExpression' &&
			/** @type {any} */ (child)?.type !== 'BlockStatement'
		);
	}
	// A `@{ … }` code block's trailing render output.
	if (parent?.type === 'JSXCodeBlock' && key === 'render') return true;
	// `{ … }` containers lower their expression through the render machinery.
	if (parent?.type === 'JSXExpressionContainer' && key === 'expression') return true;
	// Switch-case statement lists.
	if (parent?.type === 'SwitchCase' && key === 'consequent') return true;
	// An if-node's branches, and the `@else if` chain (another directive) that
	// lives in `alternate`.
	if (
		(parent?.type === 'IfStatement' || parent?.type === 'JSXIfExpression') &&
		(key === 'consequent' || key === 'alternate')
	) {
		return true;
	}
	return false;
}

/**
 * Wrap a directive in a `<> … </>` so it normalizes to a `TsrxFragment` — the
 * same shape an authored `<>@if … </>` produces — and flows through the render
 * machinery (a `tsrx_element` on the client/server, a `<> … </>` in to_ts).
 * @param {any} directive
 * @returns {any}
 */
function wrap_directive_in_jsx_fragment(directive) {
	const fragment = /** @type {any} */ (b.jsx_fragment([directive]));
	// Mark as a GENERATED wrapper (not an authored `<> … </>`) so the to_ts
	// single-child collapse keeps unwrapping it to the directive's lowered value,
	// unlike an authored fragment which is kept verbatim.
	fragment.metadata = {
		...(fragment.metadata || {}),
		native_tsrx: true,
		tsrx_generated_wrapper: true,
	};
	fragment.start = directive.start;
	fragment.end = directive.end;
	fragment.loc = directive.loc;
	return fragment;
}

/**
 * Pre-normalization pass: a `@if`/`@for`/`@switch`/`@try` directive used in ANY
 * value position — the sole value of a slot (`let cd = @if (…) { … }`), an
 * operator operand, a conditional branch, an array element, a `@for` iterable, an
 * `@if`/`@switch` test, a concise arrow body (`xs.map((x) => @if (…) { … })`), a
 * `return` argument, a member object — is wrapped in a `<> … </>` so it becomes a
 * valid value (a `tsrx_element` render, or a `<> … </>` in to_ts) instead of a
 * bare `if (…) { … }` statement leaking into expression position (or a raw
 * `JSX…Expression` crashing the printer). The render positions where a directive
 * is already lowered correctly are enumerated in `is_render_child_or_statement_slot`;
 * everything else is wrapped. A `@{ … }` code block self-lowers to an IIFE in
 * every position and is never wrapped.
 * @param {any} ast
 */
function wrap_directives_combined_into_expressions(ast) {
	const seen = new Set();
	/**
	 * @param {any} parent
	 * @param {string} key
	 * @param {any} child
	 * @returns {boolean}
	 */
	const is_flagged = (parent, key, child) =>
		is_control_flow_directive(child) && !is_render_child_or_statement_slot(parent, key, child);
	/**
	 * @param {any} node
	 */
	const visit = (node) => {
		if (!node || typeof node !== 'object' || seen.has(node)) return;
		seen.add(node);
		if (Array.isArray(node)) {
			for (const item of node) visit(item);
			return;
		}
		for (const key of Object.keys(node)) {
			if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;
			const value = node[key];
			if (Array.isArray(value)) {
				for (let i = 0; i < value.length; i++) {
					if (is_flagged(node, key, value[i])) {
						value[i] = wrap_directive_in_jsx_fragment(value[i]);
					}
					visit(value[i]);
				}
			} else if (is_flagged(node, key, value)) {
				node[key] = wrap_directive_in_jsx_fragment(value);
				visit(node[key]);
			} else {
				visit(value);
			}
		}
	};
	visit(ast);
}

/**
 * Wrap a `@{ … }` code block in an immediately-invoked arrow
 * (`(() => @{ … })()`). Ripple only lowers a code block when it is a function body
 * @param {AST.JSXCodeBlock} code_block
 * @returns {AST.CallExpression}
 */
export function wrap_code_block_in_iife(code_block) {
	const arrow = b.arrow([], code_block);
	// Match the parser's `() => @{ … }` shape: a code-block body is treated as a
	// block, not a concise expression body.
	arrow.expression = false;
	const call = /** @type {AST.SimpleCallExpression} */ (b.call(arrow));
	// Marks a generated inline-component IIFE so the runtime transforms can
	// collapse it once the block's statements have moved into the component
	// callback (`unwrap_single_return_iife`).
	call.metadata = { ...call.metadata, tsrx_code_block_component: true };
	return call;
}

/**
 * Collapse a transformed zero-argument IIFE whose body is a single
 * `return <expr>;` into the returned expression. Used for generated
 * code-block component IIFEs after their setup statements have been lowered
 * into the component callback, leaving the wrapper scope empty.
 * @param {AST.Expression} call
 * @returns {AST.Expression}
 */
export function unwrap_single_return_iife(call) {
	if (call?.type !== 'CallExpression' || call.arguments.length !== 0) {
		return call;
	}
	const callee = call.callee;
	if (callee.type !== 'ArrowFunctionExpression' || callee.async || callee.params.length !== 0) {
		return call;
	}
	const body = callee.body;
	if (body.type === 'BlockStatement' && body.body.length === 1) {
		const statement = body.body[0];
		if (statement.type === 'ReturnStatement' && statement.argument) {
			return statement.argument;
		}
	}
	return call;
}

/**
 * @param {AST.JSXCodeBlock} node
 * @param {AST.Node | undefined} parent
 * @returns {boolean}
 */
export function is_code_block_function_body(node, parent) {
	return (
		(parent?.type === 'ArrowFunctionExpression' ||
			parent?.type === 'FunctionDeclaration' ||
			parent?.type === 'FunctionExpression') &&
		/** @type {any} */ (parent).body === node
	);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
export function function_has_native_tsrx_return(node) {
	if (
		!node ||
		(node.type !== 'FunctionDeclaration' &&
			node.type !== 'FunctionExpression' &&
			node.type !== 'ArrowFunctionExpression')
	) {
		return false;
	}

	if (node.body?.type === 'JSXCodeBlock') {
		return is_native_tsrx_template_node(node.body.render);
	}

	if (node.type === 'ArrowFunctionExpression' && node.body?.type !== 'BlockStatement') {
		return is_native_tsrx_template_node(node.body);
	}

	const body = node.body?.type === 'BlockStatement' ? node.body.body : [];
	return statements_contain_native_tsrx_return(body);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
export function function_contains_native_tsrx_template(node) {
	if (
		!node ||
		(node.type !== 'FunctionDeclaration' &&
			node.type !== 'FunctionExpression' &&
			node.type !== 'ArrowFunctionExpression')
	) {
		return false;
	}

	if (node.body?.type === 'JSXCodeBlock') {
		return is_native_tsrx_template_node(node.body.render);
	}

	return node_contains_native_tsrx_template(node.body, true);
}

/**
 * @param {AST.Expression} expression
 * @param {CommonContext} context
 * @returns {boolean}
 */
export function is_static_native_tsrx_function_call(expression, context) {
	const unwrapped = unwrap_template_expression(expression);

	if (
		unwrapped.type !== 'CallExpression' ||
		unwrapped.callee.type !== 'Identifier' ||
		unwrapped.arguments.length !== 0
	) {
		return false;
	}

	const binding = context.state.scope.get(unwrapped.callee.name);
	const component_scope =
		(context.state.component && context.state.scopes.get(context.state.component)) || null;
	if (binding === null || component_scope === null) {
		return false;
	}

	/** @type {ScopeInterface | null} */
	let scope = binding.scope;
	let is_inside_component_scope = false;
	while (scope !== null) {
		if (scope === component_scope) {
			is_inside_component_scope = true;
			break;
		}
		scope = scope.parent;
	}
	if (!is_inside_component_scope) {
		return false;
	}

	const initial = /** @type {AST.Node | null | undefined} */ (binding.initial);
	return is_native_tsrx_function_node(initial) || function_contains_native_tsrx_template(initial);
}

/**
 * @param {AST.Node | null | undefined} node
 * @param {boolean} root
 * @returns {boolean}
 */
function node_contains_native_tsrx_template(node, root = false) {
	if (!node || typeof node !== 'object') return false;
	if (is_native_tsrx_template_node(node)) return true;

	if (
		!root &&
		(node.type === 'FunctionDeclaration' ||
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression' ||
			node.type === 'ClassDeclaration' ||
			node.type === 'ClassExpression')
	) {
		return false;
	}

	for (const key in node) {
		if (
			key === 'metadata' ||
			key === 'parent' ||
			key === 'loc' ||
			key === 'start' ||
			key === 'end' ||
			key === 'type'
		) {
			continue;
		}

		const value = /** @type {any} */ (node)[key];
		if (Array.isArray(value)) {
			if (value.some((child) => node_contains_native_tsrx_template(child, false))) {
				return true;
			}
		} else if (
			value &&
			typeof value === 'object' &&
			node_contains_native_tsrx_template(value, false)
		) {
			return true;
		}
	}

	return false;
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function function_has_only_renderable_component_returns(node) {
	if (
		!node ||
		(node.type !== 'FunctionDeclaration' &&
			node.type !== 'FunctionExpression' &&
			node.type !== 'ArrowFunctionExpression')
	) {
		return false;
	}

	if (node.type === 'ArrowFunctionExpression' && node.body?.type !== 'BlockStatement') {
		return is_renderable_component_return_argument(
			/** @type {AST.Expression | null | undefined} */ (node.body),
		);
	}

	/** @type {(AST.Expression | null | undefined)[]} */
	const returns = [];
	const body = node.body?.type === 'BlockStatement' ? node.body.body : [];
	collect_component_return_arguments(body, returns);
	return returns.length > 0 && returns.every(is_renderable_component_return_argument);
}

/**
 * @param {AST.Node[] | null | undefined} statements
 * @param {(AST.Expression | null | undefined)[]} returns
 * @returns {void}
 */
function collect_component_return_arguments(statements, returns) {
	if (!statements) return;
	for (const statement of statements) {
		collect_component_return_argument(statement, returns);
	}
}

/**
 * @param {AST.Node | null | undefined} node
 * @param {(AST.Expression | null | undefined)[]} returns
 * @returns {void}
 */
function collect_component_return_argument(node, returns) {
	if (!node || typeof node !== 'object') return;

	if (node.type === 'ReturnStatement') {
		returns.push(node.argument);
		return;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'ClassDeclaration' ||
		node.type === 'ClassExpression'
	) {
		return;
	}

	if (node.type === 'BlockStatement') {
		collect_component_return_arguments(node.body, returns);
		return;
	}

	if (node.type === 'IfStatement') {
		collect_component_return_argument(node.consequent, returns);
		collect_component_return_argument(node.alternate, returns);
		return;
	}

	if (node.type === 'SwitchStatement') {
		for (const switch_case of node.cases || []) {
			collect_component_return_arguments(switch_case.consequent || [], returns);
		}
		return;
	}

	if (node.type === 'TryStatement') {
		collect_component_return_argument(node.block, returns);
		collect_component_return_argument(node.handler?.body, returns);
		collect_component_return_argument(node.finalizer, returns);
	}
}

/**
 * @param {AST.Expression | null | undefined} argument
 * @returns {boolean}
 */
function is_renderable_component_return_argument(argument) {
	if (!argument) return true;
	if (is_native_tsrx_template_node(argument)) return true;
	if (argument.type === 'Literal') {
		return (
			argument.value === null ||
			typeof argument.value === 'string' ||
			typeof argument.value === 'number' ||
			typeof argument.value === 'bigint'
		);
	}
	if (argument.type === 'Identifier' && argument.name === 'undefined') return true;
	if (argument.type === 'UnaryExpression' && argument.operator === 'void') return true;
	if (argument.type === 'TemplateLiteral') return true;
	if (argument.type === 'ConditionalExpression') {
		return (
			is_renderable_component_return_argument(argument.consequent) &&
			is_renderable_component_return_argument(argument.alternate)
		);
	}
	return false;
}

/**
 * @param {any[]} statements
 * @returns {boolean}
 */
function statements_contain_native_tsrx_return(statements) {
	return statements.some((statement) => statement_contains_native_tsrx_return(statement));
}

/**
 * @param {any} statement
 * @returns {boolean}
 */
function statement_contains_native_tsrx_return(statement) {
	if (!statement || typeof statement !== 'object') return false;

	if (statement.type === 'ReturnStatement') {
		return is_native_tsrx_template_node(statement.argument);
	}

	if (
		statement.type === 'FunctionDeclaration' ||
		statement.type === 'FunctionExpression' ||
		statement.type === 'ArrowFunctionExpression' ||
		statement.type === 'ClassDeclaration' ||
		statement.type === 'ClassExpression'
	) {
		return false;
	}

	if (statement.type === 'BlockStatement') {
		return statements_contain_native_tsrx_return(statement.body || []);
	}

	if (statement.type === 'IfStatement') {
		return (
			statement_contains_native_tsrx_return(statement.consequent) ||
			statement_contains_native_tsrx_return(statement.alternate)
		);
	}

	if (statement.type === 'SwitchStatement') {
		return (statement.cases || []).some((/** @type {any} */ c) =>
			statements_contain_native_tsrx_return(c.consequent || []),
		);
	}

	if (statement.type === 'TryStatement') {
		return (
			statement_contains_native_tsrx_return(statement.block) ||
			statement_contains_native_tsrx_return(statement.handler?.body) ||
			statement_contains_native_tsrx_return(statement.finalizer)
		);
	}

	return false;
}

/**
 * @param {AST.Element | ESTreeJSX.JSXFragment} node
 * @returns {AST.Node[]}
 */
export function get_native_tsrx_template_children(node) {
	return is_template_fragment(node) ? node.children || [] : [node];
}

/**
 * @param {AST.Function} node
 * @returns {AST.Node[]}
 */
export function get_native_tsrx_function_body(node) {
	if (node.body?.type === 'JSXCodeBlock') {
		const block = node.body;
		return [
			...expand_native_tsrx_return_statements(block.body || [], true),
			...(is_native_tsrx_template_node(block.render)
				? [mark_returned_template_child(/** @type {AST.Node} */ (block.render))]
				: []),
		];
	}

	if (node.type === 'ArrowFunctionExpression' && node.body?.type !== 'BlockStatement') {
		return is_native_tsrx_template_node(node.body)
			? [
					...get_native_tsrx_template_children(
						/** @type {AST.Element | ESTreeJSX.JSXFragment} */ (/** @type {unknown} */ (node.body)),
					).map((child) => mark_returned_template_child(child)),
				]
			: [b.return(/** @type {AST.Expression} */ (node.body))];
	}

	const body = node.body?.type === 'BlockStatement' ? node.body.body : [];
	return expand_native_tsrx_return_statements(body, true);
}

/**
 * @param {AST.Statement[]} statements
 * @param {boolean} [omit_final_control_return]
 * @returns {AST.Node[]}
 */
export function expand_native_tsrx_return_statements(
	statements,
	omit_final_control_return = false,
) {
	return statements.flatMap((statement, index) =>
		expand_native_tsrx_return_statement(
			statement,
			omit_final_control_return &&
				index === statements.length - 1 &&
				statement.type === 'ReturnStatement',
		),
	);
}

/**
 * @param {AST.Statement} statement
 * @returns {AST.Statement}
 */
function mark_regular_js_statement(statement) {
	statement.metadata = {
		...statement.metadata,
		regular_js: true,
	};
	return statement;
}

/**
 * @template {AST.Node} T
 * @param {T} node
 * @param {AST.ReturnStatement} [statement]
 * @returns {T}
 */
function mark_returned_template_child(node, statement) {
	node.metadata = {
		...node.metadata,
		returned_tsrx_child: true,
	};
	if (statement) {
		node.metadata.returned_tsrx_return = statement;
	}
	return node;
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function node_contains_component_return(node) {
	if (!node || typeof node !== 'object') return false;

	if (node.type === 'ReturnStatement') {
		return true;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'ClassDeclaration' ||
		node.type === 'ClassExpression'
	) {
		return false;
	}

	if (node.type === 'BlockStatement') {
		return (node.body || []).some((statement) => node_contains_component_return(statement));
	}

	if (node.type === 'IfStatement') {
		return (
			node_contains_component_return(node.consequent) ||
			node_contains_component_return(node.alternate)
		);
	}

	if (node.type === 'SwitchStatement') {
		return (node.cases || []).some((/** @type {any} */ switch_case) =>
			/** @type {AST.Statement[]} */ (switch_case.consequent || []).some((statement) =>
				node_contains_component_return(statement),
			),
		);
	}

	if (node.type === 'TryStatement') {
		return (
			node_contains_component_return(node.block) ||
			node_contains_component_return(node.handler?.body) ||
			node_contains_component_return(node.finalizer)
		);
	}

	if (
		node.type === 'ForOfStatement' ||
		node.type === 'ForInStatement' ||
		node.type === 'ForStatement' ||
		node.type === 'WhileStatement' ||
		node.type === 'DoWhileStatement'
	) {
		return node_contains_component_return(node.body);
	}

	return false;
}

/**
 * @param {AST.Expression | null | undefined} argument
 * @returns {boolean}
 */
function should_render_return_argument(argument) {
	if (!argument) return false;
	if (argument.type === 'Literal' && argument.value === null) return false;
	if (argument.type === 'Identifier' && argument.name === 'undefined') return false;
	if (argument.type === 'UnaryExpression' && argument.operator === 'void') return false;
	return true;
}

/**
 * @param {AST.Expression} argument
 * @param {AST.ReturnStatement} statement
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function create_return_argument_child(argument, statement) {
	return /** @type {ESTreeJSX.JSXExpressionContainer} */ ({
		type: 'JSXExpressionContainer',
		expression: argument,
		metadata: {
			path: statement.metadata?.path ?? [],
			returned_tsrx_child: true,
		},
		start: argument.start ?? statement.start,
		end: argument.end ?? statement.end,
		loc: argument.loc ?? statement.loc,
	});
}

/**
 * @param {AST.Statement} statement
 * @param {boolean} [omit_control_return]
 * @returns {AST.Node[]}
 */
function expand_native_tsrx_return_statement(statement, omit_control_return = false) {
	if (statement.metadata?.returned_tsrx_child) {
		return [statement];
	}

	// Plain JS control flow is ordinary JavaScript — leave it intact (its JSX
	// returns lower to `_$_.tsrx_element` via the regular-JS path) instead of
	// expanding it into template children. Only `@`-directives template-ize.
	if (is_plain_js_control_flow(statement)) {
		return [mark_regular_js_statement(statement)];
	}

	if (!node_contains_component_return(statement)) {
		return [mark_regular_js_statement(statement)];
	}

	if (statement.type === 'ReturnStatement' && is_native_tsrx_template_node(statement.argument)) {
		const template_children = get_native_tsrx_template_children(
			/** @type {AST.Element | ESTreeJSX.JSXFragment} */ (
				/** @type {unknown} */ (statement.argument)
			),
		);
		const children = omit_control_return
			? template_children.flatMap((child) =>
					node_contains_component_return(child)
						? expand_native_tsrx_return_statement(/** @type {AST.Statement} */ (child))
						: [child],
				)
			: template_children;
		return [
			...children.map((child) =>
				mark_returned_template_child(child, omit_control_return ? undefined : statement),
			),
			...(omit_control_return
				? []
				: [b.return(null, /** @type {AST.NodeWithLocation} */ (statement))]),
		];
	}

	if (
		statement.type === 'ReturnStatement' &&
		should_render_return_argument(
			/** @type {AST.Expression | null | undefined} */ (statement.argument),
		)
	) {
		return [
			create_return_argument_child(
				/** @type {AST.Expression} */ (statement.argument),
				/** @type {AST.ReturnStatement} */ (statement),
			),
			...(omit_control_return
				? []
				: [b.return(null, /** @type {AST.NodeWithLocation} */ (statement))]),
		];
	}

	if (omit_control_return && statement.type === 'ReturnStatement') {
		return [];
	}

	if (statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') {
		return [statement];
	}

	if (statement.type === 'BlockStatement') {
		statement.body = /** @type {AST.Statement[]} */ (
			expand_native_tsrx_return_statements(statement.body || [])
		);
		return [statement];
	}

	if (statement.type === 'IfStatement') {
		statement.consequent = expand_embedded_native_tsrx_return_statement(statement.consequent);
		if (statement.alternate) {
			statement.alternate = expand_embedded_native_tsrx_return_statement(statement.alternate);
		}
		return [statement];
	}

	if (statement.type === 'SwitchStatement') {
		for (const switch_case of statement.cases || []) {
			switch_case.consequent = /** @type {AST.Statement[]} */ (
				expand_native_tsrx_return_statements(switch_case.consequent || [])
			);
		}
		return [statement];
	}

	if (statement.type === 'TryStatement') {
		statement.block = /** @type {AST.BlockStatement} */ (
			expand_embedded_native_tsrx_return_statement(statement.block)
		);
		if (statement.handler?.body) {
			statement.handler.body = /** @type {AST.BlockStatement} */ (
				expand_embedded_native_tsrx_return_statement(statement.handler.body)
			);
		}
		if (statement.finalizer) {
			statement.finalizer = /** @type {AST.BlockStatement} */ (
				expand_embedded_native_tsrx_return_statement(statement.finalizer)
			);
		}
		return [statement];
	}

	return [statement];
}

/**
 * @param {AST.Statement} statement
 * @returns {AST.Statement}
 */
function expand_embedded_native_tsrx_return_statement(statement) {
	const expanded = expand_native_tsrx_return_statement(statement);
	return expanded.length === 1
		? /** @type {AST.Statement} */ (expanded[0])
		: b.block(
				/** @type {AST.Statement[]} */ (expanded),
				/** @type {AST.NodeWithLocation} */ (statement),
			);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {node is AST.JSXStyleElement}
 */
export function is_style_element(node) {
	return !!(node && node.type === 'JSXStyleElement');
}

/**
 * @param {AST.Node[]} nodes
 * @returns {AST.CSS.StyleSheet | null}
 */
export function collect_tsrx_stylesheet(nodes) {
	/** @type {AST.CSS.StyleSheet[]} */
	const styles = [];
	collect_style_elements(nodes, styles, false);
	if (styles.length === 0) return null;
	if (styles.length > 1) {
		throw new Error('TSRX fragments can only have one style tag');
	}
	return styles[0];
}

/**
 * @param {AST.Node | AST.Node[]} node
 * @param {AST.CSS.StyleSheet[]} styles
 * @param {boolean} inside_head
 * @returns {void}
 */
function collect_style_elements(node, styles, inside_head) {
	if (!node) return;
	if (Array.isArray(node)) {
		for (const child of node) collect_style_elements(child, styles, inside_head);
		return;
	}
	if (node.metadata?.regular_js) {
		return;
	}
	if (is_style_element(node)) {
		if (!inside_head) {
			const stylesheet = node.children?.find(
				(/** @type {any} */ child) => child.type === 'StyleSheet',
			);
			if (stylesheet) {
				styles.push(/** @type {AST.CSS.StyleSheet} */ (/** @type {unknown} */ (stylesheet)));
			}
		}
		return;
	}
	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		return;
	}
	const node_any = /** @type {any} */ (node);
	const next_inside_head =
		inside_head ||
		(is_template_element(node_any) &&
			/** @type {any} */ (get_element_id(node_any))?.type === 'Identifier' &&
			/** @type {any} */ (get_element_id(node_any)).name === 'head');
	if ('children' in node && Array.isArray(node.children)) {
		collect_style_elements(/** @type {AST.Node[]} */ (node.children), styles, next_inside_head);
	}
	if (node.type === 'BlockStatement') {
		collect_style_elements(node.body, styles, next_inside_head);
	}
	if (node.type === 'IfStatement') {
		collect_style_elements(node.consequent, styles, next_inside_head);
		if (node.alternate) collect_style_elements(node.alternate, styles, next_inside_head);
	}
}

/**
 * @param {AST.Node[]} nodes
 * @returns {AST.Node[]}
 */
export function strip_tsrx_style_elements(nodes) {
	return strip_style_elements(nodes, false);
}

/**
 * @param {AST.Node[]} nodes
 * @param {boolean} inside_head
 * @returns {AST.Node[]}
 */
function strip_style_elements(nodes, inside_head) {
	return nodes
		.filter((node) => !(is_style_element(node) && !inside_head))
		.map((node) => strip_style_element_children(node, inside_head))
		.filter(Boolean);
}

/**
 * @param {AST.Node} node
 * @param {boolean} inside_head
 * @returns {AST.Node}
 */
function strip_style_element_children(node, inside_head) {
	const node_any = /** @type {any} */ (node);
	const next_inside_head =
		inside_head ||
		(is_template_element(node_any) &&
			/** @type {any} */ (get_element_id(node_any))?.type === 'Identifier' &&
			/** @type {any} */ (get_element_id(node_any)).name === 'head');
	if ('children' in node && Array.isArray(node.children)) {
		node.children = strip_style_elements(
			/** @type {AST.Node[]} */ (node.children),
			next_inside_head,
		);
	}
	if (node.type === 'BlockStatement') {
		node.body = /** @type {AST.Statement[]} */ (strip_style_elements(node.body, next_inside_head));
	}
	if (node.type === 'IfStatement') {
		node.consequent = /** @type {AST.Statement} */ (
			strip_style_element_children(node.consequent, next_inside_head)
		);
		if (node.alternate) {
			node.alternate = /** @type {AST.Statement} */ (
				strip_style_element_children(node.alternate, next_inside_head)
			);
		}
	}
	return node;
}

/**
 * @param {AST.Pattern[]} params
 * @param {AST.Node[]} children
 * @param {AST.Node} [source_node]
 * @returns {AST.ArrowFunctionExpression}
 */
export function create_native_tsrx_render_function(params, children, source_node) {
	const fragment = /** @type {ESTreeJSX.JSXFragment} */ (
		/** @type {unknown} */ ({
			type: 'JSXFragment',
			children,
			openingFragment: { type: 'JSXOpeningFragment', metadata: { path: [] } },
			closingFragment: { type: 'JSXClosingFragment', metadata: { path: [] } },
			metadata: { path: [], tsrx_render_fragment: true },
		})
	);
	const fn = b.arrow(
		params,
		b.block(
			[b.return(/** @type {any} */ (fragment))],
			/** @type {AST.NodeWithLocation | undefined} */ (source_node),
		),
		false,
		undefined,
		/** @type {AST.NodeWithLocation | undefined} */ (source_node),
	);
	fn.metadata.native_tsrx_function = true;
	fn.metadata.synthetic_children = true;
	return fn;
}

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

/**
 * @param {AST.Expression} tracked
 * @returns {AST.MemberExpression}
 */
export function tracked_get(tracked) {
	return b.member(tracked, b.id('value'));
}

/**
 * @param {AST.Expression} lazy
 * @param {number} index
 * @returns {AST.CallExpression}
 */
export function build_lazy_array_get(lazy, index) {
	return b.call('_$_.lazy_array_get', lazy, b.literal(index));
}

/**
 * @param {AST.Expression} lazy
 * @param {number} index
 * @returns {AST.CallExpression}
 */
export function build_lazy_array_rest(lazy, index) {
	return b.call('_$_.lazy_array_rest', lazy, b.literal(index));
}

/**
 * @param {AST.Expression} lazy
 * @param {AST.Expression} value
 * @param {number} index
 * @returns {AST.CallExpression}
 */
export function build_lazy_array_set(lazy, value, index) {
	return b.call('_$_.lazy_array_set', lazy, value, b.literal(index));
}

/**
 * @param {AST.Expression} lazy
 * @param {number} index
 * @param {boolean} prefix
 * @param {number} [d]
 * @returns {AST.CallExpression}
 */
export function build_lazy_array_update(lazy, index, prefix, d = 1) {
	/** @type {AST.Expression[]} */
	const args = [lazy, b.literal(index)];
	if (d !== 1) {
		args.push(b.literal(d));
	}
	return b.call(prefix ? '_$_.lazy_array_update_pre' : '_$_.lazy_array_update', ...args);
}

/**
 * @param {AST.MemberExpression} node
 * @returns {number | null}
 */
export function get_static_numeric_index(node) {
	if (
		!node.computed ||
		node.property.type !== 'Literal' ||
		typeof node.property.value !== 'number'
	) {
		return null;
	}
	return node.property.value;
}

/**
 * @param {Binding | null | undefined} binding
 * @param {CommonContext} context
 * @returns {boolean}
 */
export function is_known_tracked_binding(binding, context) {
	return (
		binding?.kind !== 'lazy' &&
		binding?.kind !== 'lazy_fallback' &&
		binding?.initial?.type === 'CallExpression' &&
		is_ripple_track_call(binding.initial.callee, context) !== null
	);
}

/**
 * @param {AST.Identifier} object
 * @param {number} index
 * @param {CommonContext} context
 * @returns {AST.Expression | null}
 */
export function build_known_tracked_index_read(object, index, context) {
	const binding = context.state.scope?.get(object.name);
	if (!is_known_tracked_binding(binding, context)) {
		return null;
	}
	return index === 0 ? tracked_get(object) : index === 1 ? object : null;
}

/**
 * @param {AST.Identifier} object
 * @param {CommonContext} context
 * @returns {{ target: AST.Expression, tracked: boolean } | null}
 */
export function get_lazy_array_member_target(object, context) {
	const binding = context.state.scope?.get(object.name);
	if (
		binding?.node === object ||
		binding?.metadata?.lazy_array_rest ||
		(binding?.kind !== 'lazy' && binding?.kind !== 'lazy_fallback') ||
		binding.transform?.read === undefined
	) {
		return null;
	}

	if (
		binding.metadata?.lazy_array_source_tracked &&
		binding.metadata.lazy_array_index === 1 &&
		binding.metadata.lazy_array_source
	) {
		return {
			target: b.id(binding.metadata.lazy_array_source),
			tracked: true,
		};
	}

	if (binding.metadata?.lazy_array_index !== 1) {
		return null;
	}

	return {
		target: binding.transform.read(object),
		tracked: false,
	};
}

/**
 * @param {AST.Expression} target
 * @param {number} index
 * @param {boolean} tracked
 * @returns {AST.Expression | null}
 */
export function build_index_read(target, index, tracked) {
	if (tracked) {
		return index === 0 ? tracked_get(target) : index === 1 ? target : null;
	}
	return build_lazy_array_get(target, index);
}

/**
 * @param {AST.Expression} target
 * @param {number} index
 * @param {AST.Expression} value
 * @param {boolean} tracked
 * @returns {AST.Expression | null}
 */
export function build_index_write(target, index, value, tracked) {
	if (tracked) {
		return index === 0 ? b.call('_$_.set', target, value) : null;
	}
	return build_lazy_array_set(target, value, index);
}

/**
 * @param {AST.Expression} target
 * @param {number} index
 * @param {boolean} tracked
 * @param {AST.UpdateExpression} node
 * @returns {AST.CallExpression | AST.Expression | null}
 */
export function build_index_update(target, index, tracked, node) {
	if (tracked) {
		if (index !== 0) {
			return null;
		}
		const fn_name = node.prefix ? '_$_.update_pre' : '_$_.update';
		/** @type {AST.Expression[]} */
		const args = [target];
		if (node.operator === '--') {
			args.push(b.literal(-1));
		}
		return b.call(fn_name, ...args);
	}

	return build_lazy_array_update(target, index, node.prefix, node.operator === '--' ? -1 : 1);
}

/**
 * @param {AST.MemberExpression} node
 * @param {CommonContext} context
 * @returns {{ target: AST.Expression, index: number, tracked: boolean } | null}
 */
export function get_indexed_reactive_target(node, context) {
	const index = get_static_numeric_index(node);
	if (index === null || node.object.type !== 'Identifier') {
		return null;
	}

	const known_tracked_read = build_known_tracked_index_read(node.object, index, context);
	if (known_tracked_read !== null) {
		return {
			target: node.object,
			index,
			tracked: true,
		};
	}

	const lazy_target = get_lazy_array_member_target(node.object, context);
	if (lazy_target !== null) {
		return {
			...lazy_target,
			index,
		};
	}

	return null;
}

/**
 * @param {AST.Expression | AST.Super} node
 * @param {CommonContext} context
 * @returns {AST.Expression | AST.Super}
 */
export function rewrite_lazy_member_base(node, context) {
	if (node.type === 'Identifier') {
		const binding = context.state.scope?.get(node.name);
		if (
			binding?.node !== node &&
			(binding?.kind === 'lazy' || binding?.kind === 'lazy_fallback') &&
			binding.transform?.read !== undefined
		) {
			return binding.transform.read(node);
		}
	}

	if (node.type === 'MemberExpression') {
		const target = get_indexed_reactive_target(node, context);
		if (target !== null) {
			const read = build_index_read(target.target, target.index, target.tracked);
			if (read !== null) {
				return read;
			}
		}

		return {
			...node,
			object: rewrite_lazy_member_base(node.object, context),
		};
	}

	return node;
}

/**
 * Strips TypeScript-only expression wrappers from expression positions that the
 * generic visitor does not reliably walk, such as assignment/update targets.
 * @param {AST.Expression | AST.Pattern} node
 * @param {CommonContext} context
 * @returns {AST.Expression | AST.Pattern}
 */
export function strip_typescript_expression_wrappers(node, context) {
	if (
		node.type === 'TSAsExpression' ||
		node.type === 'TSTypeAssertion' ||
		node.type === 'TSNonNullExpression' ||
		node.type === 'TSInstantiationExpression'
	) {
		return strip_typescript_expression_wrappers(
			/** @type {AST.Expression} */ (node.expression),
			context,
		);
	}

	if (node.type === 'MemberExpression') {
		return {
			...node,
			object:
				node.object.type === 'Super'
					? node.object
					: /** @type {AST.Expression} */ (
							strip_typescript_expression_wrappers(node.object, context)
						),
			property: node.computed
				? /** @type {AST.Expression} */ (
						strip_typescript_expression_wrappers(
							/** @type {AST.Expression} */ (node.property),
							context,
						)
					)
				: node.property,
		};
	}

	if (node.type === 'ParenthesizedExpression') {
		return {
			...node,
			expression: /** @type {AST.Expression} */ (
				strip_typescript_expression_wrappers(node.expression, context)
			),
		};
	}

	return /** @type {AST.Expression | AST.Pattern} */ (context.visit(node));
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
			// A call inside a nested function generally runs later, after
			// `with_scope` has restored the previous scope, so it needs its
			// own wrapper. A code-block scope IIFE runs synchronously inside
			// its own `with_scope` wrapper, though — see through it.
			const maybe_iife = context.path[i - 1];
			if (
				type === 'ArrowFunctionExpression' &&
				maybe_iife?.type === 'CallExpression' &&
				maybe_iife.callee === context_node &&
				maybe_iife.metadata?.tsrx_code_block_scope
			) {
				continue;
			}
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
	const component = context.path?.findLast((n) => is_native_tsrx_function_node(n));

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
	// A dynamic tag's id is an arbitrary expression (possibly a lowercase
	// identifier) and resolves at runtime, never statically to a DOM element.
	if (is_dynamic_element(node)) {
		return false;
	}
	const id = /** @type {AST.Identifier} */ (get_element_id(node));
	return (
		id.type === 'Identifier' &&
		id.name[0].toLowerCase() === id.name[0] &&
		id.name !== 'children' &&
		!id.tracked
	);
}

export const dynamic_element_import_local = 'TsrxDynamic';

/**
 * @param {ESTreeJSX.JSXElement} node
 * @param {AST.Expression} [component_id] - Override for the lowered component
 * reference; defaults to the `TsrxDynamic` local used by type-only output.
 * @returns {boolean}
 */
export function lower_dynamic_element(node, component_id) {
	if (!is_dynamic_element(node)) {
		return false;
	}

	const expression = /** @type {AST.Expression} */ (get_element_id(node));
	const closing_name = /** @type {any} */ (node.closingElement?.name);
	const closing_expression =
		closing_name?.expression && clone_expression_node(closing_name.expression);
	add_extra_source_mappings_from_matching_expression(expression, closing_expression);
	set_element_id(node, component_id ?? b.id(dynamic_element_import_local));
	if (node.openingElement?.name) {
		node.openingElement.name = b.jsx_id(dynamic_element_import_local);
	}
	if (node.closingElement?.name) {
		node.closingElement.name = b.jsx_id(dynamic_element_import_local);
	}
	node.openingElement.attributes = [
		// A synthetic `is={expr}` JSXAttribute; the container value marks it as
		// an authored-expression attribute for the accessors.
		/** @type {ESTreeJSX.JSXAttribute} */ (
			/** @type {unknown} */ ({
				type: 'JSXAttribute',
				name: b.jsx_id(
					'is',
					/** @type {AST.NodeWithLocation} */ (/** @type {unknown} */ (expression)),
				),
				value: b.jsx_expression_container(
					expression,
					/** @type {AST.NodeWithLocation} */ (/** @type {unknown} */ (expression)),
				),
				shorthand: false,
				start: expression.start,
				end: expression.end,
				loc: expression.loc,
			})
		),
		...node.openingElement.attributes,
	];
	// The tag is no longer dynamic — clear the parser's markers (the name
	// container was already replaced above).
	node.isDynamic = false;
	if (node.openingElement) {
		node.openingElement.isDynamic = false;
	}
	return true;
}

/**
 * Normalizes children nodes (merges adjacent text, removes empty)
 * @param {AST.Node[]} children
 * @param {CommonContext} context
 * @returns {AST.Node[]}
 */
export function normalize_children(children, context) {
	const to_ts = !!context.state.to_ts;
	/** @type {AST.Node[]} */
	const normalized = [];

	for (const node of children) {
		normalize_child(node, normalized, context);
	}

	for (let i = normalized.length - 1; i >= 0; i--) {
		const child = normalized[i];
		const prev_child = normalized[i - 1];

		if (
			is_template_text_or_expression(child) &&
			prev_child != null &&
			is_template_text_or_expression(prev_child)
		) {
			const child_expression = get_template_expression(/** @type {any} */ (child), to_ts);
			const prev_expression = get_template_expression(/** @type {any} */ (prev_child), to_ts);
			if (
				(is_template_expression(child) &&
					is_children_template_expression(child_expression, context.state.scope)) ||
				(is_template_expression(prev_child) &&
					is_children_template_expression(prev_expression, context.state.scope)) ||
				expression_contains_call(child_expression) ||
				expression_contains_call(prev_expression)
			) {
				continue;
			}

			const merged_expression =
				child_expression.type === 'Literal' && prev_expression.type === 'Literal'
					? b.literal(prev_expression.value + String(child_expression.value))
					: b.binary(
							'+',
							prev_expression,
							b.call('String', b.logical('??', child_expression, b.literal(''))),
						);
			const merged = b.jsx_expression_container(
				merged_expression,
				/** @type {AST.NodeWithLocation} */ (prev_child),
			);
			merged.metadata = {
				...(prev_child.metadata ?? {}),
				// A run containing any text renders through the text path
				// (`_$_.text`/`set_text`) — the analogue of the old merged `Text` node.
				tsrx_text: is_template_text(prev_child) || is_template_text(child),
			};
			normalized[i - 1] = merged;
			normalized.splice(i, 1);
		}
	}

	return normalized;
}

/**
 * @param {AST.Expression} expression
 * @returns {boolean}
 */
export function expression_contains_call(expression) {
	switch (expression.type) {
		case 'CallExpression':
			if (
				expression.callee.type === 'Identifier' &&
				expression.callee.name === 'String' &&
				!expression.optional
			) {
				return expression.arguments.some((argument) => {
					if (argument.type === 'SpreadElement') {
						return true;
					}
					return expression_contains_call(argument);
				});
			}
			return true;

		case 'NewExpression':
			return true;

		case 'ChainExpression':
		case 'ParenthesizedExpression':
		case 'TSAsExpression':
		case 'TSInstantiationExpression':
		case 'TSNonNullExpression':
		case 'TSSatisfiesExpression':
		case 'TSTypeAssertion':
			return expression_contains_call(/** @type {AST.Expression} */ (expression.expression));

		case 'ArrayExpression':
			return expression.elements.some(
				(element) =>
					element !== null &&
					(element.type === 'SpreadElement'
						? expression_contains_call(/** @type {AST.Expression} */ (element.argument))
						: expression_contains_call(/** @type {AST.Expression} */ (element))),
			);

		case 'AssignmentExpression':
		case 'BinaryExpression':
		case 'LogicalExpression':
			return (
				expression_contains_call(/** @type {AST.Expression} */ (expression.left)) ||
				expression_contains_call(expression.right)
			);

		case 'ConditionalExpression':
			return (
				expression_contains_call(expression.test) ||
				expression_contains_call(expression.consequent) ||
				expression_contains_call(expression.alternate)
			);

		case 'MemberExpression':
			return (
				expression_contains_call(/** @type {AST.Expression} */ (expression.object)) ||
				(expression.computed &&
					expression_contains_call(/** @type {AST.Expression} */ (expression.property)))
			);

		case 'ObjectExpression':
			return expression.properties.some((property) => {
				if (property.type === 'SpreadElement') {
					return expression_contains_call(/** @type {AST.Expression} */ (property.argument));
				}
				return (
					(property.computed &&
						expression_contains_call(/** @type {AST.Expression} */ (property.key))) ||
					expression_contains_call(/** @type {AST.Expression} */ (property.value))
				);
			});

		case 'SequenceExpression':
			return expression.expressions.some(expression_contains_call);

		case 'TaggedTemplateExpression':
			return true;

		case 'TemplateLiteral':
			return expression.expressions.some(expression_contains_call);

		case 'UnaryExpression':
		case 'UpdateExpression':
			return expression.argument !== null && expression_contains_call(expression.argument);

		default:
			return false;
	}
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
	const unwrapped_node = /** @type {AST.Node} */ (unwrapped);

	if (is_template_fragment_node(unwrapped_node)) {
		return true;
	}

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
		if (unwrapped.type === 'Identifier') {
			const binding = scope.get(unwrapped.name);
			return is_template_fragment_binding(binding, scope);
		}
		return false;
	}

	const binding = scope.get(unwrapped.name);
	return (
		is_template_fragment_binding(binding, scope) ||
		((binding?.declaration_kind === 'param' ||
			binding?.kind === 'prop' ||
			binding?.kind === 'prop_fallback' ||
			binding?.kind === 'lazy' ||
			binding?.kind === 'lazy_fallback') &&
			(component_scope === null || binding.scope === component_scope))
	);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function is_template_fragment_node(node) {
	return is_template_fragment(node);
}

/**
 * @param {Binding | null | undefined} binding
 * @param {ScopeInterface} scope
 * @param {Set<Binding>} [visited]
 * @returns {boolean}
 */
function is_template_fragment_binding(binding, scope, visited = new Set()) {
	if (!binding || binding.reassigned || visited.has(binding)) {
		return false;
	}
	visited.add(binding);

	const initial = binding.initial;
	if (!initial) {
		return false;
	}

	const initial_node = /** @type {AST.Node} */ (initial);
	if (is_template_fragment_node(initial_node)) {
		return true;
	}

	if (initial_node.type === 'Identifier') {
		return is_template_fragment_binding(scope.get(initial_node.name), scope, visited);
	}

	return false;
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
		// Insignificant whitespace text renders nothing, and a `{/* comment */}`
		// container is a comment — both are dropped from the rendered children.
		is_droppable_template_text(node, !!context.state.to_ts) ||
		is_empty_expression_container(node)
	) {
		return;
	} else if (
		node.type === 'JSXStyleElement' &&
		!context.state.inside_head &&
		!context.state.keep_component_style
	) {
		// Component styles render nothing — their CSS is extracted at analysis.
		return;
	} else if (
		is_template_element(node) &&
		get_element_id(node).type === 'Identifier' &&
		/** @type {AST.Identifier} */ (
			get_element_id(node).name === 'head' ||
				/** @type {AST.Identifier} */ (
					get_element_id(node).name === 'title' && context.state.inside_head
				)
		)
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
			is_native_tsrx_function_node(context_node)
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
			case 'JSXElement':
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
 * Lower the `@{ … }` code blocks that appear as template children throughout
 * the AST: element/fragment children lists and the branch bodies of retyped
 * template directives. Statement-position code blocks (function bodies,
 * code-block bodies) are left alone — they stay lexical blocks and are lowered
 * by the transforms. Also drops `EmptyStatement` separators from the lists it
 * touches, matching the old normalizer.
 * @param {AST.Node} ast
 * @returns {void}
 */
export function lower_template_code_blocks(ast) {
	lower_node(/** @type {any} */ (ast), []);
}

/**
 * @param {any[]} children
 * @param {AST.Node[]} inherited_path
 * @returns {any[]}
 */
function lower_template_children(children, inherited_path = []) {
	return children
		.map((/** @type {any} */ child) => {
			lower_node(child, inherited_path);
			return child?.type === 'JSXCodeBlock'
				? code_block_to_template_child(child, inherited_path)
				: child;
		})
		.filter((/** @type {any} */ child) => child != null && child.type !== 'EmptyStatement');
}

/**
 * @param {any[]} statements
 * @param {AST.Node[]} inherited_path
 * @returns {any[]}
 */
function lower_statement_children(statements, inherited_path) {
	for (const statement of statements) {
		lower_node(statement, inherited_path);
	}
	return statements.filter(
		(/** @type {any} */ child) => child != null && child.type !== 'EmptyStatement',
	);
}

/**
 * @param {any} statement — a retyped template directive
 * @param {AST.Node[]} inherited_path
 * @returns {void}
 */
function lower_directive_template_slots(statement, inherited_path) {
	const path = [...inherited_path, statement];
	if (statement.consequent?.type === 'BlockStatement') {
		statement.consequent.body = lower_template_children(statement.consequent.body || [], path);
	} else if (statement.consequent) {
		lower_node(statement.consequent, path);
	}
	if (statement.alternate?.type === 'BlockStatement') {
		statement.alternate.body = lower_template_children(statement.alternate.body || [], path);
	} else if (statement.alternate) {
		lower_node(statement.alternate, path);
	}
	if (statement.body?.type === 'BlockStatement') {
		statement.body.body = lower_template_children(statement.body.body || [], path);
	}
	if (statement.empty?.type === 'BlockStatement') {
		statement.empty.body = lower_template_children(statement.empty.body || [], path);
	}
	if (statement.block?.type === 'BlockStatement') {
		statement.block.body = lower_template_children(statement.block.body || [], path);
	}
	if (statement.pending?.type === 'BlockStatement') {
		statement.pending.body = lower_template_children(statement.pending.body || [], path);
	}
	if (statement.handler?.body?.type === 'BlockStatement') {
		statement.handler.body.body = lower_template_children(statement.handler.body.body || [], path);
	}
	if (statement.finalizer?.type === 'BlockStatement') {
		statement.finalizer.body = lower_template_children(statement.finalizer.body || [], path);
	}
	if (Array.isArray(statement.cases)) {
		for (const switch_case of statement.cases) {
			switch_case.consequent = lower_template_children(switch_case.consequent || [], path);
		}
	}
	// Test/discriminant/iterable expressions are not template slots — raw JSX
	// there lowers through the transforms' value paths — but they may still
	// contain nested templates, so keep walking them.
	if (statement.test) lower_node(statement.test, path);
	if (statement.discriminant) lower_node(statement.discriminant, path);
	if (statement.right) lower_node(statement.right, path);
}

/**
 * The recursive worker for {@link lower_template_code_blocks}: dispatches on
 * the node shapes that own template-children lists and walks everything else
 * generically.
 * @param {any} node
 * @param {AST.Node[]} inherited_path
 * @returns {void}
 */
function lower_node(node, inherited_path = []) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const item of node) lower_node(item, inherited_path);
		return;
	}

	if (node.type === 'JSXFragment' || node.type === 'JSXElement') {
		node.children = lower_template_children(node.children || [], [...inherited_path, node]);
		if (node.type === 'JSXElement') {
			// Attribute values may hold raw JSX with nested templates.
			lower_node(node.openingElement?.attributes, [...inherited_path, node]);
		}
		return;
	}
	if (
		node.type === 'JSXStyleElement' ||
		node.type === 'JSXText' ||
		node.type === 'StyleSheet' ||
		node.type === 'JSXOpeningElement' ||
		node.type === 'JSXClosingElement'
	) {
		return;
	}
	if (node.type === 'JSXCodeBlock') {
		// Each `@{ … }` is its own lexical scope, so nested blocks never merge
		// into their parent. A block whose render output is itself a code block
		// (`@{ @{ … } }`) keeps the nesting: the inner block is lowered like a
		// template child inside a synthetic fragment so it gets its own scope.
		const path = [...inherited_path, node];
		node.body = lower_statement_children(node.body || [], path);
		if (node.render?.type === 'JSXCodeBlock') {
			const inner = node.render;
			lower_node(inner, path);
			const inner_child = code_block_to_template_child(inner, path);
			// An inner block that is empty all the way down renders nothing —
			// drop it so the outer block becomes code-only (and prunable too).
			if (inner_child == null) {
				node.render = null;
			} else if (is_native_tsrx_template_node(inner_child)) {
				// The inner chain collapsed to a plain template node (its scope
				// was unobservable) — it becomes this block's render directly,
				// with no wrapper fragment.
				node.render = inner_child;
			} else {
				const fragment = /** @type {any} */ (b.jsx_fragment([/** @type {any} */ (inner_child)]));
				setLocation(fragment, /** @type {AST.NodeWithLocation} */ (inner));
				fragment.metadata.path = path;
				// native_tsrx so core scope creation treats the wrapper like any
				// other template fragment; tsrx_code_block_chain so
				// template-children lowering can unwrap it instead of stacking an
				// inline component per nesting level.
				fragment.metadata.native_tsrx = true;
				fragment.metadata.tsrx_code_block_chain = true;
				node.render = fragment;
			}
		} else if (node.render) {
			lower_node(node.render, path);
		}
		return;
	}
	if (node.metadata?.tsrx_template_directive) {
		lower_directive_template_slots(node, inherited_path);
		return;
	}

	for (const key in node) {
		if (
			key === 'metadata' ||
			key === 'parent' ||
			key === 'loc' ||
			key === 'start' ||
			key === 'end' ||
			key === 'type'
		) {
			continue;
		}

		const value = node[key];
		if (Array.isArray(value)) {
			node[key] = lower_statement_children(value, [...inherited_path, node]);
		} else if (value && typeof value === 'object') {
			lower_node(value, [...inherited_path, node]);
		}
	}
}

/**
 * Lower a `@{ … }` code block that appears in a template children list. Each
 * code block is its own lexical scope, so it never flattens into the
 * surrounding scope, but the lowering only pays for what the block uses:
 *
 * - no setup code: the scope is unobservable, so the render output merges
 *   statically into the parent template — no `_$_.expression`, no inline
 *   component, no anchor;
 * - code-only: a plain `BlockStatement` — statements run in source order,
 *   scoped, render nothing;
 * - setup code + render output: an inline anonymous component expression
 *   (`(() => @{ … })()`, the same lowering as value-position code blocks),
 *   since the setup may feed the output — `_$_.expression` is the right tool
 *   for a dynamic child value;
 * - nested chains (`@{ @{ … } }`): intermediate levels with statements merge
 *   into one IIFE as nested plain `{ … }` blocks (one closure, not one per
 *   level), and only the innermost render-bearing level becomes the inline
 *   component.
 * @param {AST.JSXCodeBlock} block — internals already normalized
 * @param {AST.Node[]} inherited_path
 * @returns {AST.Node | null}
 */
function code_block_to_template_child(block, inherited_path) {
	const body = block.body || [];
	const render = block.render;

	// `@{ @{ … } }` — normalize wrapped the already-lowered inner chain in a
	// synthetic fragment for render-slot consumers (function bodies, value
	// positions). As a template child, unwrap it instead of stacking an
	// inline component per nesting level.
	if (render?.type === 'JSXFragment' && render.metadata?.tsrx_code_block_chain) {
		const inner_child = render.children[0];
		if (body.length === 0) {
			return inner_child;
		}
		if (inner_child.type === 'BlockStatement') {
			const statement = b.block(
				[...body, inner_child],
				/** @type {AST.NodeWithLocation} */ (block),
			);
			statement.metadata = { path: inherited_path };
			return statement;
		}
		if (inner_child.type !== 'JSXExpressionContainer') {
			// Unreachable by construction — the chain wrapper only ever holds
			// a statement block or an expression child.
			return inner_child;
		}
		// The inner level is either one of our scope IIFEs (fold its body in
		// as a nested plain block instead of a nested closure, so a whole
		// chain shares a single function) or the inline component (return its
		// value from this level's scope).
		const inner_expression = inner_child.expression;
		const scope_body =
			inner_expression.type === 'CallExpression' &&
			inner_expression.metadata?.tsrx_code_block_scope &&
			inner_expression.callee.type === 'ArrowFunctionExpression' &&
			inner_expression.callee.body.type === 'BlockStatement'
				? [...body, inner_expression.callee.body]
				: [...body, b.return(inner_expression)];
		const scope_call = /** @type {AST.SimpleCallExpression} */ (
			b.call(b.arrow([], b.block(scope_body, /** @type {AST.NodeWithLocation} */ (block))))
		);
		scope_call.metadata = { ...scope_call.metadata, tsrx_code_block_scope: true };
		return b.jsx_expression_container(scope_call, /** @type {AST.NodeWithLocation} */ (block));
	}

	if (render == null) {
		if (body.length === 0) {
			return null;
		}
		const statement = b.block(body, /** @type {AST.NodeWithLocation} */ (block));
		statement.metadata = { path: inherited_path };
		return statement;
	}

	if (body.length === 0) {
		// No setup code — the block's scope is unobservable, so the render
		// output merges statically into the parent template.
		return render;
	}

	return b.jsx_expression_container(
		wrap_code_block_in_iife(block),
		/** @type {AST.NodeWithLocation} */ (block),
	);
}

/**
 * Mark every element/fragment in a raw JSX subtree `native_tsrx` so the
 * transforms route it through the template paths rather than the raw-JSX
 * value lowering.
 * @param {any} node
 * @returns {void}
 */
function mark_raw_template_jsx(node) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const item of node) mark_raw_template_jsx(item);
		return;
	}
	// Only children chains: raw JSX inside `{ … }` containers or attribute
	// values keeps lowering lazily through the value path.
	if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
		node.metadata = { ...(node.metadata ?? {}), native_tsrx: true };
		mark_raw_template_jsx(node.children);
	}
}

/**
 * Adopt a raw JSX subtree (an attribute value or other JSX that never entered
 * the template traversal) into the template machinery at transform time:
 * marks its elements/fragments `native_tsrx`, retypes any nested directives,
 * and lowers its `@{ … }` code-block template children. Returns the template
 * children — a fragment root flattens to its children list.
 *
 * @param {any} node
 * @param {AST.Node[]} [inherited_path]
 * @returns {any}
 */
export function jsx_to_ripple_node(node, inherited_path = []) {
	mark_raw_template_jsx(node);
	prepare_template_control_flow(node);
	lower_node(node, inherited_path);

	if (node.type === 'JSXFragment') {
		return node.children;
	}

	return node;
}
