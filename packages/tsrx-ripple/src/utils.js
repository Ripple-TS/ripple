/**
@import * as AST from 'estree';
@import * as ESTreeJSX from 'estree-jsx';
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
		(node.type === 'Element' ||
			node.type === 'TsrxFragment' ||
			node.type === 'JSXElement' ||
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
 * Normalize native JSX-shaped TSRX parser nodes into Ripple's current internal
 * template node shape. Ripple's renderer still consumes Element/TsrxFragment,
 * while the shared parser now emits JSXElement/JSXFragment plus custom JSX
 * control-flow expressions.
 * @template T
 * @param {T} node
 * @returns {T}
 */
export function normalize_jsx_tsrx_templates(node) {
	return /** @type {T} */ (normalize_jsx_tsrx_node(/** @type {any} */ (node), []));
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
	return b.call(arrow);
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
 * @param {AST.Element | AST.TsrxFragment} node
 * @returns {AST.Node[]}
 */
export function get_native_tsrx_template_children(node) {
	return node.type === 'TsrxFragment' ? node.children || [] : [node];
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
						/** @type {AST.Element | AST.TsrxFragment} */ (/** @type {unknown} */ (node.body)),
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
 * @returns {AST.TSRXExpression}
 */
function create_return_argument_child(argument, statement) {
	return /** @type {AST.TSRXExpression} */ ({
		type: 'TSRXExpression',
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

	if (!node_contains_component_return(statement)) {
		return [mark_regular_js_statement(statement)];
	}

	if (statement.type === 'ReturnStatement' && is_native_tsrx_template_node(statement.argument)) {
		const template_children = get_native_tsrx_template_children(
			/** @type {AST.Element | AST.TsrxFragment} */ (/** @type {unknown} */ (statement.argument)),
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
 * @returns {node is AST.Element}
 */
export function is_style_element(node) {
	return !!(
		node &&
		node.type === 'Element' &&
		node.id?.type === 'Identifier' &&
		node.id.name === 'style'
	);
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
		(node_any.type === 'Element' &&
			node_any.id?.type === 'Identifier' &&
			node_any.id.name === 'head');
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
		(node_any.type === 'Element' &&
			node_any.id?.type === 'Identifier' &&
			node_any.id.name === 'head');
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
	const fragment = /** @type {AST.TsrxFragment} */ (
		/** @type {unknown} */ ({
			type: 'TsrxFragment',
			children,
			openingElement: { type: 'JSXOpeningFragment', metadata: { path: [] } },
			closingElement: { type: 'JSXClosingFragment', metadata: { path: [] } },
			selfClosing: false,
			attributes: [],
			metadata: { path: [] },
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
	const id = /** @type {AST.Element} */ (node).id;
	return (
		id.type === 'Identifier' &&
		id.name[0].toLowerCase() === id.name[0] &&
		id.name !== 'children' &&
		!id.tracked
	);
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
					is_children_template_expression(prev_child.expression, context.state.scope)) ||
				expression_contains_call(child.expression) ||
				expression_contains_call(prev_child.expression)
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
	return node?.type === 'TsrxFragment';
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
 * @param {string} value
 * @returns {string}
 */
function decode_jsx_text_entities(value) {
	return value.replace(
		/&(#x[0-9a-fA-F]+|#[0-9]+|amp|quot|apos|lt|gt);/g,
		(/** @type {string} */ match, /** @type {string} */ entity) => {
			if (entity === 'amp') return '&';
			if (entity === 'quot') return '"';
			if (entity === 'apos') return "'";
			if (entity === 'lt') return '<';
			if (entity === 'gt') return '>';
			if (entity.startsWith('#x')) {
				const code_point = Number.parseInt(entity.slice(2), 16);
				return Number.isNaN(code_point) ? match : String.fromCodePoint(code_point);
			}
			if (entity.startsWith('#')) {
				const code_point = Number.parseInt(entity.slice(1), 10);
				return Number.isNaN(code_point) ? match : String.fromCodePoint(code_point);
			}
			return match;
		},
	);
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalize_jsx_text_value(value) {
	const normalized = /[\r\n]/.test(value) ? value.trim() : value;
	return decode_jsx_text_entities(normalized);
}

/**
 * @param {ESTreeJSX.JSXFragment} node
 * @param {AST.Node[]} [inherited_path]
 * @returns {AST.TsrxFragment}
 */
function jsx_to_ripple_fragment(node, inherited_path = []) {
	const fragment = /** @type {AST.TsrxFragment} */ (
		/** @type {unknown} */ ({
			type: 'TsrxFragment',
			children: normalize_jsx_tsrx_children(node.children || [], inherited_path),
			openingElement: node.openingFragment,
			closingElement: node.closingFragment,
			selfClosing: false,
			attributes: [],
			metadata: { ...(node.metadata ?? {}), path: inherited_path },
			start: node.start,
			end: node.end,
			loc: node.loc,
		})
	);

	return fragment;
}

/**
 * @param {any} node
 * @param {AST.Node[]} [inherited_path]
 * @returns {any}
 */
function jsx_control_expression_to_statement(node, inherited_path = []) {
	const statement = /** @type {any} */ ({ ...node, type: node.statementType });
	delete statement.statementType;
	const directive =
		node.type === 'JSXIfExpression'
			? 'if'
			: node.type === 'JSXForExpression'
				? 'for'
				: node.type === 'JSXSwitchExpression'
					? 'switch'
					: node.type === 'JSXTryExpression'
						? 'try'
						: null;
	statement.metadata = { ...(statement.metadata ?? {}), path: inherited_path };
	if (directive) {
		statement.metadata.tsrxDirective = directive;
	}

	if (statement.consequent?.type === 'BlockStatement') {
		statement.consequent.body = normalize_jsx_tsrx_children(statement.consequent.body || [], [
			...inherited_path,
			statement,
		]);
	} else if (statement.consequent) {
		statement.consequent = normalize_jsx_tsrx_node(statement.consequent, [
			...inherited_path,
			statement,
		]);
	}
	if (statement.alternate?.type === 'BlockStatement') {
		statement.alternate.body = normalize_jsx_tsrx_children(statement.alternate.body || [], [
			...inherited_path,
			statement,
		]);
	} else if (statement.alternate) {
		statement.alternate = normalize_jsx_tsrx_node(statement.alternate, [
			...inherited_path,
			statement,
		]);
		if (directive === 'if' && statement.alternate?.type === 'IfStatement') {
			statement.alternate.metadata = {
				...(statement.alternate.metadata ?? {}),
				tsrxDirective: 'if',
			};
		}
	}
	if (statement.body?.type === 'BlockStatement') {
		statement.body.body = normalize_jsx_tsrx_children(statement.body.body || [], [
			...inherited_path,
			statement,
		]);
	}
	if (statement.empty?.type === 'BlockStatement') {
		statement.empty.body = normalize_jsx_tsrx_children(statement.empty.body || [], [
			...inherited_path,
			statement,
		]);
	}
	if (statement.block?.type === 'BlockStatement') {
		statement.block.body = normalize_jsx_tsrx_children(statement.block.body || [], [
			...inherited_path,
			statement,
		]);
	}
	if (statement.pending?.type === 'BlockStatement') {
		statement.pending.body = normalize_jsx_tsrx_children(statement.pending.body || [], [
			...inherited_path,
			statement,
		]);
	}
	if (statement.handler?.body?.type === 'BlockStatement') {
		statement.handler.body.body = normalize_jsx_tsrx_children(statement.handler.body.body || [], [
			...inherited_path,
			statement,
		]);
	}
	if (statement.finalizer?.type === 'BlockStatement') {
		statement.finalizer.body = normalize_jsx_tsrx_children(statement.finalizer.body || [], [
			...inherited_path,
			statement,
		]);
	}
	if (Array.isArray(statement.cases)) {
		for (const switch_case of statement.cases) {
			switch_case.consequent = normalize_jsx_tsrx_children(switch_case.consequent || [], [
				...inherited_path,
				statement,
			]);
		}
	}

	return statement;
}

/**
 * @param {AST.JSXStyleElement} node
 * @param {AST.Node[]} [inherited_path]
 * @returns {AST.Element}
 */
function jsx_style_to_ripple_element(node, inherited_path = []) {
	const id = /** @type {AST.Identifier} */ ({
		type: 'Identifier',
		name: 'style',
		start: node.openingElement?.name?.start ?? node.start,
		end: node.openingElement?.name?.end ?? node.start,
		loc: node.openingElement?.name?.loc,
	});
	const stylesheet = node.children?.find(
		(/** @type {any} */ child) => child?.type === 'StyleSheet',
	);

	return /** @type {AST.Element} */ (
		/** @type {unknown} */ ({
			type: 'Element',
			id,
			attributes: [],
			children: node.children || [],
			openingElement: node.openingElement,
			closingElement: node.closingElement,
			selfClosing: false,
			css: stylesheet?.source ?? '',
			metadata: { ...(node.metadata ?? {}), scoped: false, path: inherited_path },
			start: node.start,
			end: node.end,
			loc: node.loc,
		})
	);
}

/**
 * @param {any[]} children
 * @param {AST.Node[]} [inherited_path]
 * @returns {AST.Node[]}
 */
function normalize_jsx_tsrx_children(children, inherited_path = []) {
	return children
		.map((/** @type {any} */ child) => normalize_jsx_tsrx_node(child, inherited_path))
		.flat()
		.filter((/** @type {any} */ child) => child != null && child.type !== 'EmptyStatement');
}

/**
 * @param {any} node
 * @param {AST.Node[]} [inherited_path]
 * @returns {any}
 */
function normalize_jsx_tsrx_node(node, inherited_path = []) {
	if (!node || typeof node !== 'object') return node;
	if (Array.isArray(node)) return normalize_jsx_tsrx_children(node, inherited_path);

	if (node.type === 'JSXFragment') {
		return jsx_to_ripple_fragment(node, inherited_path);
	}
	if (node.type === 'JSXElement') {
		return jsx_to_ripple_node(node, inherited_path);
	}
	if (node.type === 'JSXStyleElement') {
		return jsx_style_to_ripple_element(node, inherited_path);
	}
	if (
		node.type === 'JSXIfExpression' ||
		node.type === 'JSXForExpression' ||
		node.type === 'JSXSwitchExpression' ||
		node.type === 'JSXTryExpression'
	) {
		return jsx_control_expression_to_statement(node, inherited_path);
	}
	if (node.type === 'JSXText') {
		return jsx_to_ripple_node(node, inherited_path);
	}
	if (node.type === 'JSXExpressionContainer') {
		return jsx_to_ripple_node(node, inherited_path);
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
			node[key] = normalize_jsx_tsrx_children(value, [...inherited_path, node]);
		} else if (value && typeof value === 'object') {
			node[key] = normalize_jsx_tsrx_node(value, [...inherited_path, node]);
		}
	}

	return node;
}

/**
 * Converts a JSX AST node (JSXElement, JSXText, etc.) to a Ripple AST node
 * (Element, Text, TSRXExpression) for JSX-to-template lowering.
 *
 * @param {any} node
 * @param {AST.Node[]} [inherited_path]
 * @returns {any}
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
			.map((/** @type {any} */ attr) => {
				if (attr.type === 'JSXAttribute') {
					const name =
						attr.name.type === 'JSXIdentifier'
							? attr.name.name
							: attr.name.namespace.name + ':' + attr.name.name.name;
					const shorthand_end_loc =
						attr.loc?.end && attr.loc.end.column > 0
							? { ...attr.loc.end, column: attr.loc.end.column - 1 }
							: attr.loc?.end;
					const value = attr.shorthand
						? {
								type: 'Identifier',
								name,
								start: attr.name.start,
								end:
									attr.name.end && attr.name.end > attr.name.start ? attr.name.end : attr.end - 1,
								loc: {
									start: attr.name.loc?.start ?? attr.loc?.start,
									end: attr.name.loc?.end ?? shorthand_end_loc,
								},
							}
						: attr.value
							? attr.value.type === 'JSXExpressionContainer'
								? attr.value.expression
								: attr.value
							: null;
					if (attr.value?.type === 'JSXExpressionContainer' && value) {
						value.was_expression = true;
					}
					return /** @type {AST.Node} */ ({
						type: 'Attribute',
						name: {
							type: 'Identifier',
							name,
							tracked: false,
							start: attr.name.start,
							end: attr.name.end && attr.name.end > attr.name.start ? attr.name.end : attr.end - 1,
							loc: {
								start: attr.name.loc?.start ?? attr.loc?.start,
								end: attr.name.loc?.end ?? shorthand_end_loc,
							},
						},
						value,
						shorthand: attr.shorthand === true,
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
				openingElement: opening,
				closingElement: node.closingElement,
				selfClosing: opening.selfClosing,
				metadata: { scoped: false, path: inherited_path },
				start: node.start,
				end: node.end,
			})
		);

		element.children = /** @type {AST.Node[]} */ (
			/** @type {AST.Node[]} */ (node.children)
				.map((child) => normalize_jsx_tsrx_node(child, [...inherited_path, element]))
				.flat()
				.filter(Boolean)
		);

		return element;
	}

	if (node.type === 'JSXStyleElement') {
		return jsx_style_to_ripple_element(node, inherited_path);
	}

	if (node.type === 'JSXText') {
		const value = normalize_jsx_text_value(node.value);
		if (value.trim() === '') return null;
		return /** @type {AST.Node} */ ({
			type: 'Text',
			expression: {
				type: 'Literal',
				value,
				raw: JSON.stringify(value),
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
			expression: normalize_jsx_tsrx_node(node.expression, inherited_path),
			metadata: {},
			start: node.start,
			end: node.end,
		});
	}

	if (node.type === 'JSXFragment') {
		return /** @type {AST.Node[]} */ (
			/** @type {AST.Node[]} */ (node.children)
				.map((child) => normalize_jsx_tsrx_node(child, inherited_path))
				.flat()
				.filter(Boolean)
		);
	}

	if (
		node.type === 'JSXIfExpression' ||
		node.type === 'JSXForExpression' ||
		node.type === 'JSXSwitchExpression' ||
		node.type === 'JSXTryExpression'
	) {
		return jsx_control_expression_to_statement(node, inherited_path);
	}

	return node;
}
