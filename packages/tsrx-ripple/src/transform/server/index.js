/** @import * as AST from 'estree'; */
/** @import * as ESTreeJSX from 'estree-jsx'; */
/** @import { RawSourceMap } from 'source-map'; */
/**
@import {
	TransformServerContext,
	TransformServerState,
	Visitor,
	Visitors,
	AnalysisResult,
	ScopeInterface,
} from '../../../types/index' */

import {
	builders,
	escape,
	analyzeCss,
	isEventAttribute,
	isInsideComponent as is_inside_component,
	renderCssResult,
	renderStylesheets,
	prepareStylesheetForRender,
	collectStyleRefAttributes,
	createStyleClassMap,
	createStyleClassMapFromStylesheet,
	createStyleRefSetupStatements,
	getStyleElementStylesheet,
	CSS_HASH_IDENTIFIER,
	obfuscateIdentifier,
	BLOCK_CLOSE,
	BLOCK_OPEN,
	isFunctionNode,
	clone_expression_node,
} from '@tsrx/core';
const b = builders;
import { walk } from 'zimmerframe';
import ts from 'esrap/languages/ts';
import path from 'node:path';
import { print } from 'esrap';
import is_reference from 'is-reference';
import {
	determine_namespace_for_children,
	escape_html,
	is_boolean_attribute,
	is_element_dom_element,
	is_void_element,
	normalize_children,
	is_children_template_expression,
	is_binding_function,
	is_ripple_track_call,
	is_ripple_import,
	replace_lazy_param_pattern,
	create_native_tsrx_render_function,
	get_native_tsrx_function_body,
	is_native_tsrx_function_node,
	is_static_native_tsrx_function_call,
	is_native_tsrx_template_node,
	is_tsrx_component_function,
	is_style_element,
	lower_dynamic_element,
	simple_hash,
	strong_hash,
	flatten_switch_consequent,
	get_ripple_namespace_call_name,
	strip_class_typescript_syntax,
	strip_typescript_expression_wrappers,
	adopt_raw_template_jsx,
	build_index_read,
	build_index_write,
	build_index_update,
	expression_contains_call,
	get_indexed_reactive_target,
	rewrite_lazy_member_base,
	strip_tsrx_style_elements,
	unwrap_single_return_iife,
	wrap_code_block_in_iife,
	visit_directive_wrapping_values,
	get_code_block_render,
	get_code_block_template_child,
	lower_code_block_children,
	is_code_block_function_body,
} from '../../utils.js';
import {
	get_attribute_name,
	get_attribute_value,
	get_element_attributes,
	get_element_id,
	get_element_identifier,
	get_template_text_value,
	is_droppable_template_text,
	is_empty_expression_container,
	is_self_closing,
	is_template_element,
	is_template_directive,
	is_template_fragment,
	is_template_text,
	rendered_template_children,
} from '../../template-ast.js';

/**
 * @param {unknown} value
 * @returns {value is AST.TraversableAstNode}
 */
function is_traversable_ast_node(value) {
	return (
		value != null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		'type' in value &&
		typeof value.type === 'string'
	);
}

/**
 * @param {TransformServerState} state
 * @returns {AST.CSS.StyleSheet | null}
 */
function get_component_css(state) {
	return state.component?.metadata.component_css ?? null;
}

/**
 * @param {TransformServerState} state
 * @returns {string | null}
 */
function get_component_css_hash(state) {
	return get_component_css(state)?.hash ?? null;
}

/**
 * @param {AST.JSXStyleElement} node
 * @param {TransformServerContext} context
 * @returns {AST.ObjectExpression | null}
 */
function build_style_class_map_expression(node, context) {
	const stylesheet = getStyleElementStylesheet(node);
	if (!stylesheet) {
		return null;
	}

	analyzeCss(stylesheet);
	context.state.stylesheets.push(prepareStylesheetForRender(stylesheet, true));
	return create_server_style_class_map_expression(stylesheet);
}

/**
 * @param {AST.CSS.StyleSheet} stylesheet
 * @returns {AST.ObjectExpression}
 */
function create_server_style_class_map_expression(stylesheet) {
	const style_map = createStyleClassMapFromStylesheet(stylesheet);
	return b.object(
		style_map.properties.map((property) => {
			if (property.type !== 'Property') {
				return property;
			}
			return b.prop(
				'get',
				/** @type {AST.Expression} */ (property.key),
				b.function(
					null,
					[],
					b.block([
						b.stmt(b.call('_$_.output_register_css', b.literal(stylesheet.hash))),
						b.return(/** @type {AST.Expression} */ (property.value)),
					]),
				),
				property.computed,
			);
		}),
	);
}

/**
 * @param {AST.Node[]} body
 * @param {AST.Statement[]} setup
 * @param {Map<AST.Node[] | AST.Node, ScopeInterface>} [scopes]
 * @returns {AST.Node[]}
 */
function insert_style_ref_setup_statements(body, setup, scopes) {
	if (setup.length === 0) {
		return body;
	}

	let inserted = false;

	/**
	 * Copy-on-write helper: rebuilt spine nodes inherit the original's scope
	 * mapping so transform-time lookups keep working.
	 * @template {AST.Node} T
	 * @param {T} original
	 * @param {Partial<T>} updates
	 * @returns {T}
	 */
	const rebuild = (original, updates) => {
		const copy = { ...original, ...updates };
		const scope = scopes?.get(original);
		if (scope) scopes?.set(copy, scope);
		return copy;
	};

	/** @param {AST.Node[]} nodes */
	const insert_in_list = (nodes) => {
		const index = nodes.findIndex((node) => node.metadata?.returned_tsrx_child);
		if (index !== -1) {
			inserted = true;
			return [
				...nodes.slice(0, index),
				...setup.map((statement) => clone_expression_node(statement, false)),
				...nodes.slice(index),
			];
		}

		return nodes.map(insert_in_statement);
	};

	/** @param {AST.Node} node @returns {AST.Node} */
	const insert_in_statement = (node) => {
		if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
			return node;
		}
		if (node.type === 'BlockStatement') {
			const block_body = /** @type {AST.Statement[]} */ (insert_in_list(node.body || []));
			return rebuild(node, { body: block_body });
		}
		if (node.type === 'IfStatement') {
			const consequent = /** @type {AST.Statement} */ (insert_in_statement(node.consequent));
			const alternate = node.alternate
				? /** @type {AST.Statement} */ (insert_in_statement(node.alternate))
				: node.alternate;
			return rebuild(node, { consequent, alternate });
		}
		if (node.type === 'SwitchStatement') {
			const cases = (node.cases || []).map((switch_case) =>
				rebuild(switch_case, {
					consequent: /** @type {AST.Statement[]} */ (insert_in_list(switch_case.consequent || [])),
				}),
			);
			return rebuild(node, { cases });
		}
		if (node.type === 'TryStatement') {
			/** @type {Partial<AST.TryStatement>} */
			const updates = {
				block: /** @type {AST.BlockStatement} */ (insert_in_statement(node.block)),
			};
			if (node.handler?.body) {
				updates.handler = rebuild(node.handler, {
					body: /** @type {AST.BlockStatement} */ (insert_in_statement(node.handler.body)),
				});
			}
			if (node.finalizer) {
				updates.finalizer = /** @type {AST.BlockStatement} */ (insert_in_statement(node.finalizer));
			}
			return rebuild(node, updates);
		}
		return node;
	};

	const result = insert_in_list(body);
	if (inserted) {
		return result;
	}
	return [...setup, ...body];
}

/**
 * @param {AST.TSRXJSXElement | AST.TSRXJSXFragment} node
 * @param {TransformServerContext} context
 * @returns {AST.CallExpression}
 */
function build_jsx_to_tsrx_element(node, context) {
	const { visit, state, path } = context;
	const result = adopt_raw_template_jsx(/** @type {AST.Node} */ (node));
	const converted = Array.isArray(result) ? result : [result];
	/** @type {AST.Node[]} */
	const children = converted.filter((child) => child != null && child.type !== 'EmptyStatement');

	/** @type {AST.Statement[]} */
	const init = [];
	transform_children(
		children,
		/** @type {TransformServerContext} */ ({
			visit,
			state: {
				...state,
				init,
				regular_js: false,
				jsx_to_tsrx_element: true,
			},
		}),
	);

	return b.call('_$_.tsrx_element', b.arrow([], b.block(init)));
}

/**
 * @param {AST.TSRXJSXElement | AST.TSRXJSXFragment} node
 * @param {TransformServerContext} context
 * @returns {AST.CallExpression}
 */
function build_template_node_to_tsrx_element(node, context) {
	const { visit, state, path } = context;
	const children = is_template_fragment(node)
		? /** @type {AST.Node[]} */ (node.children).filter(
				(child) => child != null && child.type !== 'EmptyStatement',
			)
		: [
				{
					...node,
					metadata: {
						...node.metadata,
						regular_js: undefined,
					},
				},
			];

	/** @type {AST.Statement[]} */
	const init = [];
	transform_children(
		children,
		/** @type {TransformServerContext} */ ({
			visit,
			state: {
				...state,
				init,
				regular_js: false,
				template_child: false,
				jsx_to_tsrx_element: true,
			},
		}),
	);

	return b.call('_$_.tsrx_element', b.arrow([], b.block(init)));
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function contains_template_value_node(node) {
	let found = false;

	walk(node, null, {
		_(node, { next }) {
			if (found) {
				return;
			}
			if (
				is_template_element(node) ||
				node.type === 'JSXElement' ||
				node.type === 'JSXFragment' ||
				node.type === 'JSXStyleElement' ||
				(node.type === 'CallExpression' &&
					node.callee.type === 'Identifier' &&
					node.callee.name === '_$_.tsrx_element')
			) {
				found = true;
				return;
			}
			next();
		},
	});

	return found;
}

/**
 * @param {AST.Statement} statement
 * @param {(expression: AST.Expression) => boolean} returns_value
 * @returns {boolean}
 */
function statement_returns_value(statement, returns_value) {
	switch (statement.type) {
		case 'ReturnStatement':
			return (
				statement.argument != null &&
				returns_value(/** @type {AST.Expression} */ (statement.argument))
			);

		case 'BlockStatement':
			return statements_return_value(statement.body, returns_value);

		case 'IfStatement':
			return (
				statement_returns_value(statement.consequent, returns_value) ||
				(statement.alternate != null && statement_returns_value(statement.alternate, returns_value))
			);

		case 'SwitchStatement':
			return statement.cases.some((switch_case) =>
				statements_return_value(switch_case.consequent, returns_value),
			);

		case 'TryStatement':
			return (
				statement_returns_value(statement.block, returns_value) ||
				(statement.handler != null &&
					statement_returns_value(statement.handler.body, returns_value)) ||
				(statement.finalizer != null && statement_returns_value(statement.finalizer, returns_value))
			);

		case 'ForStatement':
		case 'ForInStatement':
		case 'ForOfStatement':
		case 'WhileStatement':
		case 'DoWhileStatement':
		case 'LabeledStatement':
		case 'WithStatement':
			return statement_returns_value(statement.body, returns_value);

		default:
			return false;
	}
}

/**
 * @param {AST.Statement[]} statements
 * @param {(expression: AST.Expression) => boolean} returns_value
 * @returns {boolean}
 */
function statements_return_value(statements, returns_value) {
	return statements.some((statement) => statement_returns_value(statement, returns_value));
}

/**
 * @param {AST.Node | null | undefined} node
 * @param {(expression: AST.Expression) => boolean} returns_value
 * @returns {boolean}
 */
function function_returns_value(node, returns_value) {
	if (node == null || !isFunctionNode(node)) {
		return false;
	}

	if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
		return returns_value(/** @type {AST.Expression} */ (node.body));
	}

	const body = /** @type {AST.Function} */ (node).body;
	if (body.type !== 'BlockStatement') {
		return false;
	}

	return statements_return_value(body.body, returns_value);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function function_returns_template_value(node) {
	return function_returns_value(node, (expression) =>
		contains_template_value_node(/** @type {AST.Node} */ (expression)),
	);
}

/**
 * @param {AST.Expression} expression
 * @param {ScopeInterface} scope
 * @returns {boolean}
 */
function is_template_value_call(expression, scope) {
	if (expression.type !== 'CallExpression' || expression.callee.type !== 'Identifier') {
		return false;
	}

	const binding = scope.get(expression.callee.name);
	return (
		binding?.metadata?.is_template_value === true ||
		is_native_tsrx_function_node(binding?.initial) ||
		function_returns_template_value(binding?.initial)
	);
}

/**
 * @param {AST.Node} expression
 * @param {ScopeInterface} scope
 * @returns {boolean}
 */
function is_template_value_binding(expression, scope) {
	if (expression.type !== 'Identifier') {
		return false;
	}

	const binding = scope.get(expression.name);
	const initial = /** @type {AST.Node | null | undefined} */ (binding?.initial);
	return (
		binding?.metadata?.is_template_value === true ||
		is_template_element(initial) ||
		initial?.type === 'JSXStyleElement' ||
		is_template_fragment(initial)
	);
}

/**
 * @param {AST.Expression | AST.SpreadElement} expression
 * @param {ScopeInterface} scope
 * @param {TransformServerContext} context
 * @returns {boolean}
 */
function is_collection_value_expression(expression, scope, context) {
	if (expression.type === 'ArrayExpression') {
		return true;
	}

	if (
		expression.type === 'TSAsExpression' ||
		expression.type === 'TSSatisfiesExpression' ||
		expression.type === 'TSNonNullExpression'
	) {
		return is_collection_value_expression(expression.expression, scope, context);
	}

	if (expression.type === 'ConditionalExpression') {
		return (
			is_collection_value_expression(expression.consequent, scope, context) ||
			is_collection_value_expression(expression.alternate, scope, context)
		);
	}

	if (expression.type === 'LogicalExpression') {
		return (
			is_collection_value_expression(expression.left, scope, context) ||
			is_collection_value_expression(expression.right, scope, context)
		);
	}

	if (expression.type === 'CallExpression') {
		if (is_ripple_track_call(expression.callee, context)) {
			const first_arg = expression.arguments[0];
			return (
				first_arg != null &&
				is_collection_value_expression(
					/** @type {AST.Expression | AST.SpreadElement} */ (first_arg),
					scope,
					context,
				)
			);
		}

		if (expression.callee.type === 'Identifier') {
			return function_returns_value(scope.get(expression.callee.name)?.initial, (expression) =>
				is_collection_value_expression(expression, scope, context),
			);
		}
	}

	if (expression.type !== 'Identifier') {
		return false;
	}

	const initial = scope.get(expression.name)?.initial;
	return (
		initial != null &&
		is_collection_value_expression(/** @type {AST.Expression} */ (initial), scope, context)
	);
}

/**
 * @param {AST.ImportDeclaration} node
 * @returns {string | null}
 */
function get_submodule_import_source_name(node) {
	const source = /** @type {AST.Literal | AST.Identifier} */ (node.source);
	return source.type === 'Identifier' ? source.name : null;
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_server_module_declaration(node) {
	return (
		node.type === 'TSModuleDeclaration' &&
		/** @type {AST.TSModuleDeclaration} */ (node).metadata?.module_keyword === 'module' &&
		/** @type {AST.TSModuleDeclaration} */ (node).id?.type === 'Identifier' &&
		/** @type {AST.Identifier} */ (/** @type {AST.TSModuleDeclaration} */ (node).id).name ===
			'server'
	);
}

/**
 * @param {AST.ImportSpecifier} specifier
 * @returns {string | null}
 */
function get_imported_name(specifier) {
	const imported = specifier.imported;
	if (imported.type === 'Identifier') {
		return imported.name;
	}
	if (imported.type === 'Literal' && typeof imported.value === 'string') {
		return imported.value;
	}
	return null;
}

/**
 * @param {AST.ImportDeclaration} node
 * @returns {AST.Statement[]}
 */
function transform_server_module_import(node) {
	/** @type {AST.Statement[]} */
	const declarations = [];
	const source_name = get_submodule_import_source_name(node);
	for (const specifier of node.specifiers) {
		if (specifier.type !== 'ImportSpecifier') {
			continue;
		}
		const imported_name = get_imported_name(specifier);
		if (imported_name === null) {
			continue;
		}
		const local_name = specifier.local.name;
		const server_identifier = b.id(
			'_$_server_$_',
			/** @type {AST.NodeWithLocation} */ (node.source),
		);
		if (source_name !== null) {
			server_identifier.metadata.source_name = source_name;
		}
		const imported_identifier = b.id(
			imported_name,
			/** @type {AST.NodeWithLocation} */ (specifier.imported),
		);
		const local_identifier = b.id(
			local_name,
			/** @type {AST.NodeWithLocation} */ (specifier.local),
		);
		declarations.push(
			b.const(
				local_identifier,
				b.function(
					null,
					[b.rest(b.id('args'))],
					b.block([
						b.return(
							b.call(b.member(server_identifier, imported_identifier), b.spread(b.id('args'))),
						),
					]),
				),
			),
		);
	}
	return declarations;
}

/**
 * @param {AST.Statement | AST.Statement[] | AST.Directive | AST.ModuleDeclaration} statement
 * @param {Array<AST.Statement | AST.Directive | AST.ModuleDeclaration>} statements
 */
function push_statement(statement, statements) {
	if (Array.isArray(statement)) {
		for (const item of statement) {
			statements.push(item);
		}
	} else {
		statements.push(statement);
	}
}

/**
 * Checks if a node is template or control-flow content that should be wrapped when return flags are active
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_template_or_control_flow(node) {
	if (node.metadata?.regular_js) {
		return false;
	}

	return (
		is_template_element(node) ||
		node.type === 'JSXStyleElement' ||
		node.type === 'JSXExpressionContainer' ||
		node.type === 'JSXText' ||
		is_template_fragment(node) ||
		is_template_directive(node) ||
		node.type === 'IfStatement' ||
		node.type === 'ForOfStatement' ||
		node.type === 'TryStatement' ||
		node.type === 'SwitchStatement'
	);
}

/**
 * Whether a `{ … }` expression child is lowered to `_$_.render_expression(…)`,
 * which (unlike `render_tsrx_element` or plain text output) brackets its output
 * in a `<!--[-->`…`<!--]-->` hydration boundary. Mirrors the routing in the
 * `JSXExpressionContainer` server visitor. A `@{ … }` block in template position
 * reaches here as a `JSXExpressionContainer` wrapping its IIFE call.
 * @param {ESTreeJSX.JSXExpressionContainer} node
 * @param {TransformServerContext} context
 * @returns {boolean}
 */
function tsrx_expression_emits_marker(node, context) {
	const expression = /** @type {AST.Expression} */ (node.expression);
	if (expression.type === 'Literal') {
		return false;
	}
	if (is_static_native_tsrx_function_call(expression, context)) {
		return false;
	}
	const scope = context.state.scope;
	return (
		is_children_template_expression(expression, scope) ||
		contains_template_value_node(/** @type {AST.Node} */ (expression)) ||
		is_template_value_call(expression, scope) ||
		is_template_value_binding(expression, scope) ||
		is_collection_value_expression(expression, scope, context) ||
		expression_contains_call(expression)
	);
}

/**
 * Classify a single node for {@link fragment_leads_with_control_flow}:
 *   - `true`  — it renders leading with content that emits its own `<!--[-->`
 *               start marker during SSR: a TSRX control-flow directive
 *               (`@if`/`@for`/`@switch`/`@try`) or a `{ … }`/`@{ … }` expression
 *               lowered to `render_expression`;
 *   - `false` — it renders leading with an element/component/text (real DOM that
 *               the fragment reuses / adopts, no borrowable marker);
 *   - `null`  — it produces no leading DOM (plain JS setup, a code-only `@{}`
 *               block, an empty fragment) — keep scanning subsequent siblings.
 * Only TSRX directives count; a regular JS `if`/`for`/`switch`/`try` (marked
 * `metadata.regular_js`) is setup, renders nothing, and is skipped.
 * @param {AST.Node} node
 * @param {TransformServerContext} context
 * @returns {boolean | null}
 */
function node_leads_with_control_flow(node, context) {
	switch (node.type) {
		case 'JSXIfExpression':
		case 'JSXForExpression':
		case 'JSXSwitchExpression':
		case 'JSXTryExpression':
			return true;
		case 'IfStatement':
		case 'ForOfStatement':
		case 'SwitchStatement':
		case 'TryStatement':
			return node.metadata?.regular_js ? null : true;
		case 'JSXElement':
		case 'JSXStyleElement':
			return false;
		case 'JSXText':
			// Insignificant whitespace renders nothing — keep scanning.
			return is_droppable_template_text(node, false) ? null : false;
		case 'JSXExpressionContainer':
			// Comment containers render nothing; merged text runs render as text.
			if (is_empty_expression_container(node)) {
				return null;
			}
			if (is_template_text(node)) {
				return false;
			}
			return tsrx_expression_emits_marker(
				/** @type {ESTreeJSX.JSXExpressionContainer} */ (node),
				context,
			);
		case 'JSXFragment':
			return fragment_leads_with_control_flow(
				rendered_template_children(/** @type {AST.Node[]} */ (node.children), false),
				context,
			);
		case 'JSXCodeBlock': {
			// A `@{ … }` block renders only what its lowered template form emits
			// (the body is setup); a code-only block contributes no DOM.
			const child = get_code_block_template_child(
				/** @type {AST.JSXCodeBlock} */ (node),
				context.state.scopes,
			);
			return child != null && child !== node ? node_leads_with_control_flow(child, context) : null;
		}
		default:
			// Non-renderable setup statement — keep scanning for the first node.
			return null;
	}
}

/**
 * Whether a template fragment's first renderable child emits its own `<!--[-->`
 * start marker during SSR (a TSRX control-flow directive or a `render_expression`
 * child such as a `@{ … }` block). The client's fragment `expression()` would
 * otherwise mistake that child's marker for the fragment's own boundary — so the
 * fragment must be bracketed with its own hydration markers. A fragment leading
 * with an element/component/text reuses its host boundary (or adopts real nodes)
 * and must not be bracketed.
 * @param {AST.Node[]} children
 * @param {TransformServerContext} context
 * @returns {boolean}
 */
function fragment_leads_with_control_flow(children, context) {
	for (const child of children) {
		const result = node_leads_with_control_flow(child, context);
		if (result !== null) {
			return result;
		}
	}
	return false;
}

/**
 * @param {AST.Node[]} path
 * @returns {boolean}
 */
function is_regular_js_statement_position(path) {
	const parent = path.at(-1);
	return (
		parent?.type === 'BlockStatement' || parent?.type === 'Program' || parent?.type === 'SwitchCase'
	);
}

/**
 * @param {AST.Node[]} path
 * @returns {boolean}
 */
function is_native_tsrx_statement_position(path) {
	const parent = path.at(-1);
	return (
		parent?.type === 'BlockStatement' ||
		parent?.type === 'Program' ||
		parent?.type === 'SwitchCase' ||
		parent?.type === 'IfStatement' ||
		parent?.type === 'ForStatement' ||
		parent?.type === 'ForInStatement' ||
		parent?.type === 'ForOfStatement' ||
		parent?.type === 'WhileStatement' ||
		parent?.type === 'DoWhileStatement' ||
		parent?.type === 'TryStatement' ||
		parent?.type === 'SwitchStatement' ||
		parent?.type === 'LabeledStatement' ||
		is_template_directive(parent)
	);
}

/**
 * @param {AST.Node[]} path
 * @returns {boolean}
 */
function is_native_tsrx_value_position(path) {
	const parent = path.at(-1);
	return !(
		is_native_tsrx_statement_position(path) ||
		is_template_element(parent) ||
		is_template_fragment(parent)
	);
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function should_wrap_node_in_regular_block(node) {
	return (
		is_template_or_control_flow(node) &&
		node.type !== 'TryStatement' &&
		node.type !== 'JSXTryExpression'
	);
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_head_element(node) {
	return is_template_element(node) && get_element_identifier(node)?.name === 'head';
}

/**
 * @param {AST.TSRXJSXElement} node
 * @param {TransformServerContext} context
 * @returns {boolean}
 */
function is_ripple_fragment_element(node, context) {
	const id = get_element_id(node);
	if (id.type === 'Identifier') {
		return id.name === 'Fragment' && is_ripple_import(id, context);
	}

	return (
		id.type === 'MemberExpression' &&
		id.property.type === 'Identifier' &&
		id.property.name === 'Fragment' &&
		is_ripple_import(id, context)
	);
}

/**
 * @param {AST.TSRXJSXElement} node
 * @returns {ESTreeJSX.JSXAttribute | null}
 */
function get_inner_html_attribute(node) {
	for (const attr of get_element_attributes(node)) {
		if (attr.type === 'JSXAttribute' && get_attribute_name(attr) === 'innerHTML') {
			return attr;
		}
	}

	return null;
}

/**
 * @param {ESTreeJSX.JSXAttribute} attr
 * @param {TransformServerContext} context
 * @returns {AST.Expression}
 */
function get_attribute_value_expression(attr, context) {
	const value = get_attribute_value(attr);
	if (value === null) {
		return b.literal('');
	}

	return /** @type {AST.Expression} */ (context.visit(value, context.state));
}

/**
 * @param {AST.Expression} expression
 * @param {TransformServerState} state
 * @returns {void}
 */
function push_raw_html_expression(expression, state) {
	if (expression.type === 'Literal') {
		const value = String(expression.value ?? '');
		const hash_value = simple_hash(value);
		state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(`<!--${hash_value}-->`))));
		state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(value))));
		state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal('<!---->'))));
		return;
	}

	const value_id = state.scope?.generate('html_value');
	if (!value_id) {
		return;
	}

	state.init?.push(
		b.const(value_id, b.call(b.id('String'), b.logical('??', expression, b.literal('')))),
	);
	state.init?.push(
		b.stmt(
			b.call(
				b.id('_$_.output_push'),
				b.binary(
					'+',
					b.binary('+', b.literal('<!--'), b.call('_$_.simple_hash', b.id(value_id))),
					b.literal('-->'),
				),
			),
		),
	);
	state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.id(value_id))));
	state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal('<!---->'))));
}

/**
 * @param {AST.Expression} expression
 * @param {TransformServerState} state
 * @returns {void}
 */
function push_inner_html_expression(expression, state) {
	if (expression.type === 'Literal') {
		state.init?.push(
			b.stmt(b.call(b.id('_$_.output_push'), b.literal(String(expression.value ?? '')))),
		);
		return;
	}

	state.init?.push(
		b.stmt(
			b.call(
				b.id('_$_.output_push'),
				b.call(b.id('String'), b.logical('??', expression, b.literal(''))),
			),
		),
	);
}

/**
 * @param {AST.TSRXJSXElement} node
 * @param {TransformServerContext} context
 * @returns {void}
 */
function visit_ripple_fragment_element(node, context) {
	const inner_html = get_inner_html_attribute(node);

	if (inner_html !== null) {
		push_raw_html_expression(get_attribute_value_expression(inner_html, context), context.state);
		return;
	}

	transform_children(/** @type {AST.Node[]} */ (node.children), context);
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_dead_native_tsrx_expression_statement(node) {
	return (
		is_native_tsrx_template_node(node) ||
		(node.type === 'ExpressionStatement' && is_native_tsrx_template_node(node.expression))
	);
}

/**
 * @param {AST.VariableDeclaration} node
 * @param {TransformServerContext} context
 * @returns {AST.VariableDeclaration}
 */
function transform_variable_declaration(node, context) {
	/** @type {Map<AST.VariableDeclarator, AST.Expression | null>} */
	const transformed_inits = new Map();
	/** @type {Map<AST.VariableDeclarator, AST.Pattern>} */
	const transformed_ids = new Map();

	for (const declarator of node.declarations) {
		let declarator_id = declarator.id;
		if (!context.state.to_ts) {
			if (
				(declarator_id.type === 'ObjectPattern' || declarator_id.type === 'ArrayPattern') &&
				declarator_id.lazy &&
				declarator_id.metadata?.lazy_id
			) {
				declarator_id = b.id(declarator_id.metadata.lazy_id);
			} else if (declarator_id.typeAnnotation) {
				declarator_id = { ...declarator_id, typeAnnotation: undefined };
			}
		}
		transformed_ids.set(declarator, declarator_id);

		const declarator_init = /** @type {AST.Node | null | undefined} */ (declarator.init);
		const init = is_template_fragment(declarator_init)
			? build_template_node_to_tsrx_element(
					/** @type {AST.TSRXJSXFragment} */ (declarator_init),
					context,
				)
			: declarator_init
				? /** @type {AST.Expression} */ (
						context.visit(declarator_init, { ...context.state, template_child: false })
					)
				: null;
		transformed_inits.set(declarator, init);
	}

	return {
		...node,
		declarations: node.declarations.map((declarator) => ({
			...declarator,
			id: /** @type {AST.Pattern} */ (
				context.visit(transformed_ids.get(declarator) ?? declarator.id)
			),
			init: transformed_inits.get(declarator) ?? null,
		})),
	};
}

/**
 * @param {AST.Node[]} children
 * @param {TransformServerContext} context
 */
function transform_children(children, context) {
	const { visit, state } = context;
	const normalized = normalize_children(children, context);
	const should_wrap_in_regular_block =
		state.component !== undefined && !state.skip_regular_blocks && !state.in_regular_block;

	/**
	 * @param {AST.Statement[]} statements
	 * @returns {AST.Statement[]}
	 */
	const wrap_regular_block = (statements) => {
		if (!should_wrap_in_regular_block || statements.length === 0) {
			return statements;
		}

		return [b.stmt(b.call('_$_.regular_block', b.arrow([], b.block(statements))))];
	};

	/** @param {AST.Node} node */
	const process_node = (node, local_state = state) => {
		if (node.metadata?.regular_js && !state.to_ts) {
			if (is_dead_native_tsrx_expression_statement(node)) {
				return;
			}
			const regular_node = /** @type {AST.Node} */ (
				visit(node, { ...local_state, regular_js: true, template_child: false })
			);
			if (regular_node && regular_node.type !== 'EmptyStatement') {
				const statement =
					regular_node.type.endsWith('Statement') || regular_node.type.endsWith('Declaration')
						? /** @type {AST.Statement} */ (regular_node)
						: b.stmt(/** @type {AST.Expression} */ (regular_node));
				state.init?.push(statement);
			}
			return;
		}

		if (node.type === 'BreakStatement') {
			state.init?.push(b.break);
			return;
		}
		if (node.type === 'ContinueStatement') {
			state.init?.push(b.continue);
			return;
		}
		if (
			node.type === 'VariableDeclaration' ||
			node.type === 'BlockStatement' ||
			node.type === 'ExpressionStatement' ||
			node.type === 'ThrowStatement' ||
			node.type === 'FunctionDeclaration' ||
			node.type === 'DebuggerStatement' ||
			node.type === 'ClassDeclaration' ||
			node.type === 'TSTypeAliasDeclaration' ||
			node.type === 'TSInterfaceDeclaration' ||
			node.type === 'ReturnStatement' ||
			is_native_tsrx_function_node(node)
		) {
			state.init?.push(
				node.type === 'VariableDeclaration'
					? transform_variable_declaration(node, {
							...context,
							state: local_state,
						})
					: /** @type {AST.Statement} */ (visit(node, local_state)),
			);
		} else {
			visit(node, { ...local_state, template_child: true });
		}
	};

	/**
	 * @param {AST.Node} node
	 * @returns {void}
	 */
	const process_wrapped_template_or_control_flow = (node) => {
		/** @type {AST.Statement[]} */
		const wrapped = [];
		const saved_init = state.init;
		state.init = wrapped;
		process_node(node, { ...state, init: wrapped, in_regular_block: true });
		state.init = saved_init;

		if (wrapped.length === 0) {
			return;
		}

		state.init?.push(...wrap_regular_block(wrapped));
	};

	for (let idx = 0; idx < normalized.length; idx++) {
		const node = normalized[idx];

		if (is_head_element(node)) {
			continue;
		}

		if (should_wrap_node_in_regular_block(node)) {
			process_wrapped_template_or_control_flow(node);
		} else {
			process_node(node);
		}
	}

	const head_elements = /** @type {ESTreeJSX.JSXElement[]} */ (
		children.filter((node) => is_head_element(node))
	);

	if (head_elements.length) {
		state.init?.push(b.stmt(b.call(b.id('_$_.set_output_target'), b.literal('head'))));
		for (let i = 0; i < head_elements.length; i++) {
			const head_element = head_elements[i];
			// Generate a hash for this head element to match client-side hydration
			// Use both filename and index to ensure uniqueness
			const hash_source = `${context.state.filename}:head:${i}:${head_element.start ?? 0}`;
			const hash_value = strong_hash(hash_source);

			// Emit hydration marker comment with hash
			state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(`<!--${hash_value}-->`))));

			transform_children(/** @type {AST.Node[]} */ (head_element.children), {
				...context,
				state: { ...state, skip_regular_blocks: true },
			});

			// No closing marker needed for head elements - the hash is sufficient
		}

		state.init?.push(b.stmt(b.call(b.id('_$_.set_output_target'), b.literal(null))));
	}
}

/**
 * @param {AST.Node[]} body
 * @param {TransformServerContext} context
 * @returns {AST.Statement[]}
 */
function transform_body(body, context) {
	const { state } = context;
	/** @type {TransformServerState} */
	const body_state = {
		...state,
		init: [],
		metadata: state.metadata,
	};

	transform_children(body, { ...context, state: body_state });

	return /** @type {AST.Statement[]} */ (body_state.init);
}

/**
 * @param {AST.Node | null | undefined} node
 * @param {boolean} [allow_direct_template]
 * @returns {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment | null}
 */
function get_native_tsrx_return_template_node(node, allow_direct_template = false) {
	if (!node) return null;
	if (allow_direct_template && is_native_tsrx_template_node(node)) {
		return /** @type {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment} */ (
			/** @type {unknown} */ (node)
		);
	}
	if (node.type === 'ReturnStatement' && is_native_tsrx_template_node(node.argument)) {
		return /** @type {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment} */ (
			/** @type {unknown} */ (node.argument)
		);
	}
	if (node.type === 'JSXCodeBlock') {
		const render = get_code_block_render(node);
		if (is_native_tsrx_template_node(render)) {
			return /** @type {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment} */ (
				/** @type {unknown} */ (render)
			);
		}
	}
	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'ClassDeclaration' ||
		node.type === 'ClassExpression'
	) {
		return null;
	}
	if (node.type === 'BlockStatement') {
		for (const statement of node.body) {
			const match = get_native_tsrx_return_template_node(statement);
			if (match) return match;
		}
	}
	if (node.type === 'IfStatement') {
		return (
			get_native_tsrx_return_template_node(node.consequent) ||
			get_native_tsrx_return_template_node(node.alternate)
		);
	}
	return null;
}

/**
 * @param {AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression} node
 * @param {TransformServerContext} context
 * @returns {AST.Function | AST.Expression}
 */
function transform_native_tsrx_function(node, context) {
	node.metadata.native_tsrx_function = true;
	const is_tsrx_element = context.state.is_tsrx_element;
	/** @type {AST.Pattern | null} */
	let props_param_output = null;

	if (node.params.length > 0) {
		const props_param = node.params[0];

		if (props_param.type === 'Identifier') {
			props_param_output = props_param.typeAnnotation
				? { ...props_param, typeAnnotation: undefined }
				: props_param;
		} else if (props_param.type === 'ObjectPattern' || props_param.type === 'ArrayPattern') {
			if (props_param.lazy) {
				props_param_output = b.id('__props');
			} else {
				props_param_output = replace_lazy_param_pattern(
					props_param.typeAnnotation ? { ...props_param, typeAnnotation: undefined } : props_param,
				);
			}
		} else {
			props_param_output = props_param;
		}
	}

	/** @type {AST.Statement[]} */
	const body_statements = [];
	const css = get_component_css({ ...context.state, component: node });
	if (css !== null) {
		const hash_id = b.id(CSS_HASH_IDENTIFIER);
		const hash = b.var(hash_id, b.literal(css.hash));
		context.state.stylesheets.push(css);
		body_statements.push(hash, b.stmt(b.call(b.id('_$_.output_register_css'), hash_id)));
	}

	const raw_render_body = get_native_tsrx_function_body(node, context.state.scopes);
	const node_id = node.type !== 'ArrowFunctionExpression' ? (node.id ?? null) : null;
	const render_scope_node = get_native_tsrx_return_template_node(
		node.body,
		node.type === 'ArrowFunctionExpression' && node.body?.type !== 'BlockStatement',
	);
	const component_scope =
		(render_scope_node && context.state.scopes.get(render_scope_node)) ||
		context.state.scopes.get(node) ||
		context.state.scope;
	const style_ref_setup = css
		? createStyleRefSetupStatements(
				collectStyleRefAttributes(raw_render_body),
				createStyleClassMap(node, css),
				{
					allowMutableRefTarget: true,
					createTempIdentifier: () => b.id(component_scope.generate('style_ref')),
				},
			)
		: [];
	const render_body = strip_tsrx_style_elements(
		insert_style_ref_setup_statements(raw_render_body, style_ref_setup, context.state.scopes),
		context.state.scopes,
	);
	body_statements.push(
		...transform_body(render_body, {
			...context,
			state: {
				...context.state,
				component: node,
				scope: component_scope,
				is_tsrx_element: false,
				regular_js: false,
				applyParentCssScope:
					node.metadata?.synthetic_children === true
						? context.state.applyParentCssScope
						: undefined,
			},
		}),
	);

	const value_params = [...node.params];
	if (props_param_output && value_params.length > 0) {
		value_params[0] = props_param_output;
	}
	const component_params = is_tsrx_element ? [] : value_params;
	const component_body = is_tsrx_element
		? b.block(body_statements)
		: b.block([b.return(b.call('_$_.tsrx_element', b.arrow([], b.block(body_statements))))]);

	if (node.type === 'ArrowFunctionExpression') {
		const fn = b.arrow(component_params, component_body);
		fn.metadata.native_tsrx_function = true;
		return fn;
	}

	if (node.type === 'FunctionDeclaration' && node_id) {
		const fn = b.function_declaration(node_id, component_params, component_body);
		fn.metadata.native_tsrx_function = true;
		return fn;
	}

	const fn = b.function(node_id, component_params, component_body);
	fn.metadata.native_tsrx_function = true;
	return fn;
}

/**
 * Returns the function's params with TypeScript annotations stripped and lazy
 * destructuring patterns replaced by their generated identifiers, without
 * mutating the original nodes.
 * @param {AST.Pattern[]} params
 * @returns {AST.Pattern[]}
 */
function strip_function_params(params) {
	return params.map((param) => {
		let stripped = param.typeAnnotation ? { ...param, typeAnnotation: undefined } : param;
		// Handle AssignmentPattern (parameters with default values)
		if (stripped.type === 'AssignmentPattern' && stripped.left?.typeAnnotation) {
			stripped = { ...stripped, left: { ...stripped.left, typeAnnotation: undefined } };
		}
		// Replace lazy destructuring params with generated identifiers
		const pattern = stripped.type === 'AssignmentPattern' ? stripped.left : stripped;
		if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
			const transformed_pattern = replace_lazy_param_pattern(pattern);
			return stripped.type === 'AssignmentPattern'
				? /** @type {AST.AssignmentPattern} */ ({ ...stripped, left: transformed_pattern })
				: transformed_pattern;
		}
		return stripped;
	});
}

/**
 * Shared by the plain statement and the `@`-directive forms.
 * @type {Visitor<AST.SwitchStatement | AST.JSXSwitchExpression, TransformServerState, AST.Node>}
 */
const visit_switch_statement = (node, context) => {
	if (context.state.regular_js) {
		return context.next();
	}

	if (!is_inside_component(context)) {
		return context.next();
	}

	const cases = [];

	for (const switch_case of node.cases) {
		const case_body = [];

		if (switch_case.consequent.length !== 0) {
			const flattened_consequent = flatten_switch_consequent(switch_case.consequent);
			const consequent_scope =
				context.state.scopes.get(switch_case.consequent) || context.state.scope;
			const consequent = b.block(
				transform_body(flattened_consequent, {
					...context,
					state: {
						...context.state,
						scope: consequent_scope,
						control_flow_branch_body: true,
					},
				}),
			);
			case_body.push(...consequent.body);
		}
		case_body.push(b.break);

		cases.push(
			b.switch_case(
				switch_case.test ? /** @type {AST.Expression} */ (context.visit(switch_case.test)) : null,
				case_body,
			),
		);
	}

	context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))));

	context.state.init?.push(
		b.switch(/** @type {AST.Expression} */ (context.visit(node.discriminant)), cases),
	);

	context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))));
};

/**
 * Shared by the plain statement and the `@`-directive forms.
 * @type {Visitor<AST.IfStatement | AST.JSXIfExpression, TransformServerState, AST.Node>}
 */
const visit_if_statement = (node, context) => {
	if (context.state.regular_js || node.metadata?.regular_js) {
		return context.next({ ...context.state, regular_js: true });
	}

	if (!is_inside_component(context)) {
		context.next();
		return;
	}

	const consequent_body =
		node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
	const consequent_scope = context.state.scopes.get(node.consequent) || context.state.scope;

	if (
		(node.metadata?.script_only || node.metadata?.has_continue) &&
		!node.metadata?.has_template &&
		!node.alternate
	) {
		context.state.init?.push(
			b.if(
				/** @type {AST.Expression} */ (context.visit(node.test)),
				b.block(
					transform_body(consequent_body, {
						...context,
						state: { ...context.state, scope: consequent_scope },
					}),
				),
			),
		);
		return;
	}

	const consequent = b.block(
		transform_body(consequent_body, {
			...context,
			state: {
				...context.state,
				scope: /** @type {ScopeInterface} */ (consequent_scope),
				control_flow_branch_body: true,
			},
		}),
	);

	context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))));

	/** @type {AST.BlockStatement | AST.IfStatement | null} */
	let alternate = null;
	if (node.alternate) {
		const alternate_scope = context.state.scopes.get(node.alternate) || context.state.scope;
		const alternate_body_nodes =
			node.alternate.type === 'IfStatement'
				? [node.alternate]
				: node.alternate.type === 'BlockStatement'
					? node.alternate.body
					: [node.alternate];

		alternate = b.block(
			transform_body(alternate_body_nodes, {
				...context,
				state: {
					...context.state,
					scope: alternate_scope,
					control_flow_branch_body: node.alternate.type !== 'IfStatement',
				},
			}),
		);
	}

	context.state.init?.push(
		b.if(/** @type {AST.Expression} */ (context.visit(node.test)), consequent, alternate),
	);

	context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))));
};

/**
 * Shared by the plain statement and the `@`-directive forms.
 * @type {Visitor<AST.TryStatement | AST.JSXTryExpression, TransformServerState, AST.Node>}
 */
const visit_try_statement = (node, context) => {
	if (context.state.regular_js) {
		return context.next();
	}

	if (!is_inside_component(context)) {
		return context.next();
	}

	const has_pending = node.pending !== null;
	const has_catch = node.handler !== null;

	const body = transform_body(node.block.body, {
		...context,
		state: {
			...context.state,
			scope: /** @type {ScopeInterface} */ (context.state.scopes.get(node.block)),
		},
	});

	// Wrap try_fn body with hydration markers when pending or catch is present
	const try_fn = b.arrow(
		[],
		b.block(
			has_pending || has_catch
				? [
						b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))),
						...body,
						b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))),
					]
				: body,
		),
	);

	/** @type {AST.Expression} */
	let catch_fn = b.literal(null);

	const handler = node.handler;
	if (handler) {
		const handler_param = handler.param
			? handler.param.typeAnnotation
				? /** @type {AST.Pattern} */ ({ ...handler.param, typeAnnotation: undefined })
				: handler.param
			: null;

		/** @type {AST.Statement | null} */
		let reset = null;
		if (handler.resetParam) {
			// `resetParam` never reaches the output (only its name is read below),
			// so its type annotation needs no stripping.
			reset = b.const(
				handler.resetParam.type === 'AssignmentPattern'
					? /** @type {AST.Identifier} */ (handler.resetParam.left).name
					: /** @type {AST.Identifier} */ (handler.resetParam).name,
				b.id('_$_.noop'),
			);
		}

		catch_fn = b.arrow(
			[handler_param || b.id('error')],
			b.block([
				b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))),
				...(reset ? [reset] : []),
				...transform_body(handler.body.body, {
					...context,
					state: {
						...context.state,
						scope: /** @type {ScopeInterface} */ (context.state.scopes.get(handler.body)),
					},
				}),
				b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))),
			]),
		);
	}

	const pending_body = node.pending
		? transform_body(node.pending.body, {
				...context,
				state: {
					...context.state,
					scope: /** @type {ScopeInterface} */ (context.state.scopes.get(node.pending)),
				},
			})
		: null;

	// Wrap pending_fn body with hydration markers
	const pending_fn =
		pending_body !== null
			? b.arrow(
					[],
					b.block([
						b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))),
						...pending_body,
						b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))),
					]),
				)
			: b.literal(null);

	context.state.init?.push(b.stmt(b.call('_$_.try_block', try_fn, catch_fn, pending_fn)));
};

/**
 * Shared by the plain statement and the `@`-directive forms.
 * @type {Visitor<AST.ForOfStatement | AST.JSXForOfExpression, TransformServerState, AST.Node>}
 */
const visit_for_of_statement = (node, context) => {
	if (context.state.regular_js) {
		return context.next();
	}

	if (!is_inside_component(context)) {
		context.next();
		return;
	}
	const body_scope = context.state.scopes.get(node.body);

	if (node.metadata?.script_only && !node.metadata?.has_template) {
		const body = transform_body(/** @type {AST.BlockStatement} */ (node.body).body, {
			...context,
			state: { ...context.state, scope: /** @type {ScopeInterface} */ (body_scope) },
		});

		if (node.index) {
			context.state.init?.push(b.var(node.index, b.literal(0)));
			body.push(b.stmt(b.update('++', node.index)));
		}

		context.state.init?.push(
			b.for_of(
				/** @type {AST.VariableDeclaration} */ (context.visit(/** @type {AST.Node} */ (node.left))),
				/** @type {AST.Expression} */
				(context.visit(/** @type {AST.Node} */ (node.right))),
				b.block(body),
			),
		);
		return;
	}

	context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))));

	const body = transform_body(/** @type {AST.BlockStatement} */ (node.body).body, {
		...context,
		state: {
			...context.state,
			scope: /** @type {ScopeInterface} */ (body_scope),
			control_flow_branch_body: true,
		},
	});
	const empty_id = node.empty ? b.id(context.state.scope.generate('for_empty')) : null;

	if (node.index) {
		context.state.init?.push(b.var(node.index, b.literal(0)));
		body.push(b.stmt(b.update('++', node.index)));
	}
	if (empty_id) {
		context.state.init?.push(b.var(empty_id, b.true));
		body.unshift(b.stmt(b.assignment('=', empty_id, b.false)));
	}

	context.state.init?.push(
		b.for_of(
			/** @type {AST.VariableDeclaration} */ (context.visit(/** @type {AST.Node} */ (node.left))),
			/** @type {AST.Expression} */
			(context.visit(/** @type {AST.Node} */ (node.right))),
			b.block(body),
		),
	);

	if (empty_id && node.empty) {
		const empty_scope = context.state.scopes.get(node.empty) || context.state.scope;
		context.state.init?.push(
			b.if(
				empty_id,
				b.block(
					transform_body(/** @type {AST.BlockStatement} */ (node.empty).body, {
						...context,
						state: { ...context.state, scope: /** @type {ScopeInterface} */ (empty_scope) },
					}),
				),
			),
		);
	}

	context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))));
};

/** @type {Visitors<AST.Node, TransformServerState>} */
const visitors = {
	_: (node, { next, state }) => {
		const scope = state.scopes.get(node);

		if (scope && scope !== state.scope) {
			return next({ ...state, scope });
		} else {
			return next();
		}
	},

	Identifier(node, context) {
		const parent = /** @type {AST.Node} */ (context.path.at(-1));

		if (is_reference(node, parent)) {
			// Apply lazy destructuring binding transforms only
			const binding = context.state.scope?.get(node.name);
			if (
				binding?.transform?.read &&
				binding.node !== node &&
				(binding.kind === 'lazy' || binding.kind === 'lazy_fallback')
			) {
				return binding.transform.read(node);
			}

			return node;
		}
	},

	MemberExpression(node, context) {
		if (!context.state.to_ts) {
			const target = get_indexed_reactive_target(node, context);
			if (target !== null) {
				const read = build_index_read(target.target, target.index, target.tracked);
				if (read !== null) {
					return read;
				}
			}
		}

		return context.next();
	},

	CallExpression(node, context) {
		const { state } = context;

		// When lowering to JS the call's type arguments are dropped; the rebuilt
		// nodes below override `typeArguments` instead of mutating `node`.
		const type_arguments = state.to_ts ? node.typeArguments : undefined;

		const callee = node.callee;

		// A generated inline-component IIFE for a `@{ … }` block: after the
		// block's statements lower into the component callback, the wrapper
		// scope holds a lone `return _$_.tsrx_element(…)` — collapse it to
		// the component value.
		if (!state.to_ts && node.metadata?.tsrx_code_block_component) {
			return unwrap_single_return_iife(/** @type {AST.Expression} */ (context.next()));
		}

		// Handle direct calls to ripple-imported functions: effect(), untrack(), RippleArray(), etc.
		if (callee.type === 'Identifier' && is_ripple_import(callee, context)) {
			const ripple_runtime_method = get_ripple_namespace_call_name(callee.name);
			if (ripple_runtime_method !== null) {
				return {
					...node,
					typeArguments: type_arguments,
					callee: b.member(b.id('_$_'), b.id(ripple_runtime_method)),
					arguments: /** @type {(AST.Expression | AST.SpreadElement)[]} */ ([
						...node.arguments.map((arg) => context.visit(arg)),
					]),
				};
			}
		}

		const track_call_name = is_ripple_track_call(callee, context);
		if (track_call_name) {
			const track_method_name = track_call_name === 'trackAsync' ? 'track_async' : 'track';

			/** @type {AST.BaseCallExpression['arguments']} */
			const call_args = [];
			const track_args = node.arguments.length === 0 ? [b.void0] : node.arguments;

			for (let i = 0; i < track_args.length; i++) {
				const arg = track_args[i];
				call_args.push(/** @type {(AST.Expression | AST.SpreadElement)} */ (context.visit(arg)));
				if (i === 0) {
					call_args.push(b.literal(node.metadata.hash));
				}
			}

			return {
				...node,
				typeArguments: type_arguments,
				callee: b.member(b.id('_$_'), b.id(track_method_name)),
				arguments: call_args,
			};
		}

		// Handle member calls on ripple imports, like RippleArray.from()
		if (
			callee.type === 'MemberExpression' &&
			callee.object.type === 'Identifier' &&
			callee.property.type === 'Identifier' &&
			is_ripple_import(callee, context)
		) {
			const object = callee.object;
			const property = callee.property;
			const method_name = get_ripple_namespace_call_name(object.name);
			if (method_name !== null) {
				return b.member(
					b.id('_$_'),
					b.member(
						b.id(method_name),
						b.call(
							b.id(property.name),
							.../** @type {(AST.Expression | AST.SpreadElement)[]} */ (
								node.arguments.map((arg) => context.visit(arg))
							),
						),
					),
				);
			}
		}

		const walked = /** @type {AST.CallExpression | undefined} */ (context.next());
		const result = walked ?? node;
		if (!state.to_ts && result.typeArguments) {
			return { ...result, typeArguments: undefined };
		}
		return walked;
	},

	JSXCodeBlock(node, context) {
		// A `@{ … }` block that sits in a value position (assigned to a variable,
		// returned, …) is wrapped in an immediately-invoked arrow so it flows
		// through the function-body path (`transform_native_tsrx_function`) rather
		// than reaching the printer as a raw `JSXCodeBlock` — a code-only block
		// would otherwise print as an invalid `{ … }` "expression". The
		// function-body guard excludes a code block that is itself the function
		// body (handled by `transform_native_tsrx_function`).
		if (
			!is_code_block_function_body(node, context.path.at(-1)) &&
			is_native_tsrx_value_position(context.path)
		) {
			return context.visit(wrap_code_block_in_iife(node), context.state);
		}
		// A code-only `@{ … }` block (no render output) is just a lexical block of
		// setup statements. Component blocks (with a render template) are handled by
		// `transform_native_tsrx_function`. Everywhere else, lower it to a plain
		// BlockStatement so the JS printer (which has no JSXCodeBlock visitor) can
		// emit it.
		if (get_code_block_render(node, context.state.scopes) != null) {
			return context.next();
		}
		/** @type {AST.Statement[]} */
		const statements = [];
		for (const statement of node.body) {
			push_statement(
				/** @type {AST.Statement | AST.Statement[]} */ (context.visit(statement)),
				statements,
			);
		}
		return b.block(statements);
	},

	JSXFragment(node, context) {
		// A raw (non-template) fragment — an attribute value or other JSX that
		// never entered the template traversal.
		if (!is_template_fragment(node)) {
			if (context.state.jsx_to_tsrx_element || is_native_tsrx_value_position(context.path)) {
				return build_jsx_to_tsrx_element(/** @type {AST.TSRXJSXFragment} */ (node), context);
			}
			return context.next();
		}

		const { visit, state } = context;
		const children = /** @type {AST.Node[]} */ (node.children).filter(
			(child) => child != null && child.type !== 'EmptyStatement',
		);

		/** @type {AST.Statement[]} */
		const init = [];
		transform_children(
			children,
			/** @type {TransformServerContext} */ ({
				visit,
				state: {
					...state,
					init,
					regular_js: false,
					jsx_to_tsrx_element: true,
					// The fragment's own children are no longer the direct body of the
					// enclosing control-flow branch, so they must not inherit the marker.
					control_flow_branch_body: false,
				},
			}),
		);

		if (state.template_child) {
			// In template position the client lowers `<>…</>` to a `<!>` placeholder +
			// `_$_.expression(() => _$_.tsrx_element(…))`. During hydration that
			// expression() needs a matching `<!--[-->`…`<!--]-->` boundary whenever it
			// would otherwise borrow a nested control-flow's start marker as its own and
			// advance the cursor past that child's content (desyncing hydration). That
			// happens in two situations:
			//   - the fragment is the direct body of a control-flow branch (or nested in
			//     an element within one): the enclosing block already consumed its own
			//     marker via hydrate_next before the branch body runs, leaving none for
			//     the fragment — `control_flow_branch_body`;
			//   - the fragment leads with control flow (e.g. a component body
			//     `<> @for … </>`): its first child's marker would be mistaken for the
			//     fragment's own.
			// A fragment that leads with a component/element instead reuses its host
			// boundary (or adopts real nodes) and must NOT be bracketed, or the extra
			// markers desync the static-cursor (`next()` + skip_advance) client path.
			const needs_boundary =
				state.control_flow_branch_body || fragment_leads_with_control_flow(children, context);
			if (needs_boundary && init.length > 0) {
				state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))));
				state.init?.push(b.block(init));
				state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))));
			} else if (init.length > 0) {
				// Template body: push children statements inline
				state.init?.push(b.block(init));
			}
		} else {
			// Expression context: return tsrx_element(render_fn)
			const render_fn = b.arrow([], b.block(init));
			return b.call('_$_.tsrx_element', render_fn);
		}
	},

	NewExpression(node, context) {
		const callee = node.callee;

		// Transform `new RippleArray(...)`, `new RippleMap(...)`, etc. imported from 'ripple'
		if (callee.type === 'Identifier' && is_ripple_import(callee, context)) {
			const ripple_runtime_method = get_ripple_namespace_call_name(callee.name);
			if (ripple_runtime_method !== null) {
				return b.call(
					'_$_.' + ripple_runtime_method,
					.../** @type {(AST.Expression | AST.SpreadElement)[]} */ (
						node.arguments.map((arg) => context.visit(arg))
					),
				);
			}
		}

		const walked = /** @type {AST.NewExpression | undefined} */ (context.next());
		const result = walked ?? node;
		if (!context.state.to_ts && result.typeArguments) {
			return { ...result, typeArguments: undefined };
		}
		return walked;
	},

	PropertyDefinition(node, context) {
		const walked = /** @type {AST.PropertyDefinition | undefined} */ (context.next());
		const result = walked ?? node;
		if (!context.state.to_ts && result.typeAnnotation) {
			return { ...result, typeAnnotation: undefined };
		}
		return walked;
	},

	ClassDeclaration(node, context) {
		if (!context.state.to_ts) {
			// Returns a stripped copy with visited children — the source node is
			// never mutated.
			return strip_class_typescript_syntax(node, context);
		}
		return context.next();
	},

	ClassExpression(node, context) {
		if (!context.state.to_ts) {
			// Returns a stripped copy with visited children — the source node is
			// never mutated.
			return strip_class_typescript_syntax(node, context);
		}
		return context.next();
	},

	FunctionDeclaration(node, context) {
		if (is_tsrx_component_function(node)) {
			if (node.id) {
				const binding = context.state.scope.get(node.id.name);
				if (binding) {
					binding.metadata = {
						...(binding.metadata ?? {}),
						is_template_value: true,
					};
				}
			}
			return transform_native_tsrx_function(node, context);
		}
		if (!context.state.to_ts) {
			const params = strip_function_params(node.params);
			return {
				...node,
				returnType: undefined,
				typeParameters: undefined,
				id: node.id ? /** @type {AST.Identifier} */ (context.visit(node.id)) : node.id,
				params: params.map((param) => /** @type {AST.Pattern} */ (context.visit(param))),
				body: /** @type {AST.BlockStatement} */ (context.visit(node.body)),
			};
		}
		return context.next();
	},

	FunctionExpression(node, context) {
		if (is_tsrx_component_function(node)) {
			return transform_native_tsrx_function(node, context);
		}
		if (!context.state.to_ts) {
			const params = strip_function_params(node.params);
			return {
				...node,
				returnType: undefined,
				typeParameters: undefined,
				id: node.id ? /** @type {AST.Identifier} */ (context.visit(node.id)) : node.id,
				params: params.map((param) => /** @type {AST.Pattern} */ (context.visit(param))),
				body: /** @type {AST.BlockStatement} */ (context.visit(node.body)),
			};
		}
		return context.next();
	},

	BlockStatement(node, context) {
		/** @type {AST.Statement[]} */
		const statements = [];

		for (const statement of node.body) {
			push_statement(
				/** @type {AST.Statement | AST.Statement[]} */ (context.visit(statement)),
				statements,
			);
		}

		return b.block(statements);
	},

	ArrowFunctionExpression(node, context) {
		if (is_tsrx_component_function(node)) {
			return transform_native_tsrx_function(node, context);
		}
		const params = strip_function_params(node.params);

		return {
			...node,
			returnType: undefined,
			typeParameters: undefined,
			params: params.map((param) => /** @type {AST.Pattern} */ (context.visit(param))),
			body:
				node.body.type === 'BlockStatement'
					? /** @type {AST.BlockStatement} */ (context.visit(node.body))
					: /** @type {AST.Expression} */ (context.visit(node.body)),
		};
	},

	TSAsExpression(node, context) {
		if (!context.state.to_ts) {
			return context.visit(node.expression);
		}
		return context.next();
	},

	TSNonNullExpression(node, context) {
		if (!context.state.to_ts) {
			return context.visit(/** @type {AST.Expression} */ (node.expression));
		}
		return context.next();
	},

	TSInstantiationExpression(node, context) {
		if (!context.state.to_ts) {
			// In JavaScript, just return the expression wrapped in parentheses
			return b.sequence(/** @type {AST.Expression[]} */ ([context.visit(node.expression)]));
		}
		return context.next();
	},

	TSTypeAliasDeclaration(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		context.next();
	},

	TSInterfaceDeclaration(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		context.next();
	},

	ExportNamedDeclaration(node, context) {
		if (!context.state.to_ts && node.exportKind === 'type') {
			return b.empty;
		}
		if (!context.state.ancestor_server_block) {
			return context.next();
		}
		const declaration = node.declaration;
		/** @type {AST.Statement[]} */
		const statements = [];

		if (declaration && declaration.type === 'FunctionDeclaration') {
			const name = declaration.id.name;
			if (context.state.server_exported_names.includes(name)) {
				return b.empty;
			}
			context.state.server_exported_names.push(name);
			return b.stmt(
				b.assignment(
					'=',
					b.member(b.id('_$_server_$_'), b.id(name)),
					/** @type {AST.Expression} */
					(context.visit(declaration)),
				),
			);
		} else if (declaration && declaration.type === 'VariableDeclaration') {
			for (const decl of declaration.declarations) {
				if (decl.init !== undefined && decl.init !== null) {
					if (decl.id.type === 'Identifier') {
						const name = decl.id.name;
						if (
							decl.init.type === 'FunctionExpression' ||
							decl.init.type === 'ArrowFunctionExpression'
						) {
							if (context.state.server_exported_names.includes(name)) {
								continue;
							}
							context.state.server_exported_names.push(name);
							statements.push(
								b.stmt(
									b.assignment(
										'=',
										b.member(b.id('_$_server_$_'), b.id(name)),
										/** @type {AST.Expression} */
										(context.visit(decl.init)),
									),
								),
							);
						} else if (decl.init.type === 'Identifier') {
							if (context.state.server_exported_names.includes(name)) {
								continue;
							}
							context.state.server_exported_names.push(name);

							statements.push(
								b.stmt(
									b.assignment(
										'=',
										b.member(b.id('_$_server_$_'), b.id(name)),
										b.id(decl.init.name),
									),
								),
							);
						} else {
							// TODO allow exporting variables that are not functions
							throw new Error('Not implemented');
						}
					} else {
						// TODO allow exporting variables that are not functions
						throw new Error('Not implemented');
					}
				} else {
					// TODO allow exporting uninitialized variables
					throw new Error('Not implemented');
				}
				// TODO: allow exporting consts when hydration is supported
			}
		} else if (node.specifiers) {
			for (const specifier of node.specifiers) {
				const name = /** @type {AST.Identifier} */ (specifier.local).name;
				if (context.state.server_exported_names.includes(name)) {
					continue;
				}
				context.state.server_exported_names.push(name);

				const binding = context.state.scope.get(name);

				if (!binding || !is_binding_function(binding, context.state.scope)) {
					continue;
				}

				statements.push(
					b.stmt(b.assignment('=', b.member(b.id('_$_server_$_'), b.id(name)), specifier.local)),
				);
			}
		} else {
			// TODO
			throw new Error('Not implemented');
		}

		return statements.length ? b.block(statements) : b.empty;
	},

	ExpressionStatement(node, context) {
		// Handle standalone lazy destructuring: &[data] = track(0); → const lazy0 = track(0);
		if (
			node.expression.type === 'AssignmentExpression' &&
			(node.expression.left.type === 'ObjectPattern' ||
				node.expression.left.type === 'ArrayPattern') &&
			node.expression.left.lazy &&
			node.expression.left.metadata?.lazy_id
		) {
			const right = /** @type {AST.Expression} */ (context.visit(node.expression.right));
			return b.const(b.id(node.expression.left.metadata.lazy_id), right);
		}
		return context.next();
	},

	VariableDeclaration(node, context) {
		return transform_variable_declaration(node, context);
	},

	JSXStyleElement(node, context) {
		const { state } = context;

		if (
			state.regular_js ||
			is_native_tsrx_value_position(context.path) ||
			is_regular_js_statement_position(context.path)
		) {
			const expression = build_style_class_map_expression(node, context);
			if (expression) {
				if (is_regular_js_statement_position(context.path)) {
					return b.stmt(expression);
				}
				return expression;
			}
		}

		// Component styles render nothing on the server — their CSS is extracted
		// at analysis time and injected separately.
	},

	JSXElement(node, context) {
		const { state, visit } = context;

		// A raw (non-template) element — an attribute value or other JSX that
		// never entered the template traversal.
		if (!is_template_element(node)) {
			if (state.jsx_to_tsrx_element || is_native_tsrx_value_position(context.path)) {
				return build_jsx_to_tsrx_element(/** @type {AST.TSRXJSXElement} */ (node), context);
			}
			return context.next();
		}

		node =
			lower_dynamic_element(node, b.member(b.id('_$_'), 'dynamic_element'), state.scopes) ?? node;

		const element_id = get_element_id(node);
		const element_attributes = get_element_attributes(node);

		if (
			state.regular_js ||
			(!state.template_child &&
				!node.metadata?.returned_tsrx_child &&
				(is_native_tsrx_value_position(context.path) ||
					(context.state.component === undefined &&
						is_native_tsrx_statement_position(context.path))))
		) {
			const expression = build_template_node_to_tsrx_element(node, context);
			if (is_regular_js_statement_position(context.path)) {
				return b.stmt(expression);
			}
			return expression;
		}

		if (is_ripple_fragment_element(node, context)) {
			visit_ripple_fragment_element(node, context);
			return;
		}

		const is_dom_element = is_element_dom_element(node);
		const is_spreading = element_attributes.some((attr) => attr.type === 'JSXSpreadAttribute');
		/** @type {(AST.Property | AST.SpreadElement)[] | null} */
		const spread_attributes = is_spreading ? [] : null;
		const child_namespace = is_dom_element
			? determine_namespace_for_children(
					/** @type {AST.Identifier} */ (element_id).name,
					state.namespace,
				)
			: state.namespace;

		if (is_dom_element) {
			const is_void = is_void_element(/** @type {AST.Identifier} */ (element_id).name);
			const use_self_closing_syntax = is_self_closing(node) && is_void;
			const tag_name = b.literal(/** @type {AST.Identifier} */ (element_id).name);
			/** @type {AST.CSS.StyleSheet['hash'] | null} */
			const scoping_hash =
				state.applyParentCssScope ?? (node.metadata.scoped ? get_component_css_hash(state) : null);
			/** @type {AST.Expression | null} */
			let inner_html_expression = null;
			/** @type {AST.Identifier | null} */
			let spread_attributes_id = null;

			state.init?.push(
				b.stmt(
					b.call(
						b.id('_$_.output_push'),
						b.literal('<' + /** @type {AST.Literal} */ (tag_name).value),
					),
				),
			);
			let class_attribute = null;

			/**
			 * @param {string} name
			 * @param {string | number | bigint | boolean | RegExp | null | undefined} value
			 * @param {'push' | 'unshift'} [spread_method]
			 */
			const handle_static_attr = (name, value, spread_method = 'push') => {
				if (is_spreading) {
					// For spread attributes, store just the actual value, not the full attribute string
					const actual_value =
						is_boolean_attribute(name) && value === true
							? b.literal(true)
							: b.literal(value === true ? '' : value);

					// spread_attributes cannot be null based on is_spreading === true
					/** @type {(AST.Property | AST.SpreadElement)[]} */ (spread_attributes)[spread_method](
						b.prop('init', b.literal(name), actual_value),
					);
				} else {
					const attr_str = ` ${name}${
						is_boolean_attribute(name) && value === true
							? ''
							: `="${value === true ? '' : escape_html(value, true)}"`
					}`;

					state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(attr_str))));
				}
			};

			for (const attr of element_attributes) {
				if (attr.type === 'JSXAttribute') {
					{
						const name = get_attribute_name(attr);
						const attr_value = get_attribute_value(attr);

						if (name === 'innerHTML') {
							const expression =
								attr_value === null ? b.literal('') : get_attribute_value_expression(attr, context);
							if (is_spreading) {
								spread_attributes?.push(b.prop('init', b.literal('innerHTML'), expression));
							} else {
								inner_html_expression = expression;
							}
							continue;
						}

						if (attr_value === null) {
							// omit a valueless event attr (analyze errored); `hidden` etc. still emit
							if (!isEventAttribute(name)) {
								handle_static_attr(name, true);
							}
							continue;
						}

						if (name === 'ref') {
							continue;
						}

						if (attr_value.type === 'Literal' && name !== 'class') {
							handle_static_attr(name, attr_value.value);
							continue;
						}

						if (name === 'class') {
							class_attribute = attr;

							continue;
						}

						if (isEventAttribute(name)) {
							continue;
						}
						const metadata = { tracking: false };
						const expression = /** @type {AST.Expression} */ (
							visit(attr_value, { ...state, metadata })
						);

						state.init?.push(
							b.stmt(
								b.call(
									b.id('_$_.output_push'),
									b.call(
										'_$_.attr',
										b.literal(name),
										expression,
										b.literal(is_boolean_attribute(name)),
									),
								),
							),
						);
					}
				} else if (attr.type === 'JSXSpreadAttribute') {
					spread_attributes?.push(
						b.spread(/** @type {AST.Expression} */ (visit(attr.argument, state))),
					);
				}
			}

			if (class_attribute !== null) {
				const attr_value = /** @type {AST.Expression} */ (get_attribute_value(class_attribute));
				if (attr_value.type === 'Literal') {
					let value = attr_value.value;

					if (scoping_hash) {
						value = `${scoping_hash} ${value}`;
					}

					handle_static_attr('class', value);
				} else {
					const metadata = { tracking: false };
					let expression = /** @type {AST.Expression} */ (
						visit(attr_value, { ...state, metadata })
					);

					if (scoping_hash) {
						// Pass array to clsx so it can handle objects properly
						expression = b.array([expression, b.literal(scoping_hash)]);
					}

					state.init?.push(
						b.stmt(
							b.call(b.id('_$_.output_push'), b.call('_$_.attr', b.literal('class'), expression)),
						),
					);
				}
			} else if (scoping_hash) {
				handle_static_attr('class', scoping_hash, is_spreading ? 'unshift' : 'push');
			}

			if (spread_attributes !== null && spread_attributes.length > 0) {
				spread_attributes_id = b.id(state.scope.generate('spread_attrs'));
				state.init?.push(b.const(spread_attributes_id, b.object(spread_attributes)));
				state.init?.push(
					b.stmt(
						b.call(
							b.id('_$_.output_push'),
							b.call(
								'_$_.spread_attrs',
								spread_attributes_id,
								scoping_hash ? b.literal(scoping_hash) : undefined,
							),
						),
					),
				);
			}

			state.init?.push(
				b.stmt(b.call(b.id('_$_.output_push'), b.literal(use_self_closing_syntax ? ' />' : '>'))),
			);

			// In dev mode, emit push_element for runtime nesting validation
			if (state.dev) {
				const element_name = /** @type {AST.Identifier} */ (element_id).name;
				const loc = node.loc;
				state.init?.push(
					b.stmt(
						b.call(
							'_$_.push_element',
							b.literal(element_name),
							b.literal(state.filename),
							b.literal(loc?.start.line ?? 0),
							b.literal(loc?.start.column ?? 0),
						),
					),
				);
			}

			if (!is_void) {
				if (inner_html_expression !== null) {
					push_inner_html_expression(inner_html_expression, state);
				} else if (spread_attributes_id !== null) {
					const spread_inner_html_id = b.id(state.scope.generate('spread_inner_html'));
					state.init?.push(
						b.const(spread_inner_html_id, b.call('_$_.spread_inner_html', spread_attributes_id)),
					);

					/** @type {AST.Statement[]} */
					const init = [];
					transform_children(
						node.children,
						/** @type {TransformServerContext} */ ({
							visit,
							state: {
								...state,
								init,
								...(state.applyParentCssScope
									? {
											applyParentCssScope:
												state.applyParentCssScope || get_component_css_hash(state),
										}
									: {}),
							},
						}),
					);

					state.init?.push(
						b.if(
							b.binary('!==', spread_inner_html_id, b.void0),
							b.block([b.stmt(b.call(b.id('_$_.output_push'), spread_inner_html_id))]),
							init.length > 0 ? b.block(init) : null,
						),
					);
				} else {
					/** @type {AST.Statement[]} */
					const init = [];
					transform_children(
						node.children,
						/** @type {TransformServerContext} */ ({
							visit,
							state: {
								...state,
								init,
								...(state.applyParentCssScope
									? {
											applyParentCssScope:
												state.applyParentCssScope || get_component_css_hash(state),
										}
									: {}),
							},
						}),
					);

					if (init.length > 0) {
						state.init?.push(b.block(init));
					}
				}

				if (!use_self_closing_syntax) {
					state.init?.push(
						b.stmt(
							b.call(
								b.id('_$_.output_push'),
								b.literal('</' + /** @type {AST.Literal} */ (tag_name).value + '>'),
							),
						),
					);
				}
			}

			// In dev mode, emit pop_element after the element is fully rendered
			if (state.dev) {
				state.init?.push(b.stmt(b.call('_$_.pop_element')));
			}
		} else {
			/** @type {(AST.Property | AST.SpreadElement)[]} */
			const props = [];
			/** @type {AST.Property | null} */
			let children_prop = null;

			const apply_parent_css_scope = state.applyParentCssScope;

			for (const attr of element_attributes) {
				if (attr.type === 'JSXAttribute') {
					{
						const attr_name = get_attribute_name(attr);
						const attr_value = get_attribute_value(attr);
						const metadata = { tracking: false };
						let property =
							attr_value === null
								? b.literal(true)
								: /** @type {AST.Expression} */ (
										visit(/** @type {AST.Expression} */ (attr_value), {
											...state,
											metadata,
										})
									);

						const scoped_hash = get_component_css_hash(state);
						if (attr_name === 'class' && node.metadata.scoped && scoped_hash) {
							if (property.type === 'Literal') {
								property = b.literal(`${scoped_hash} ${property.value}`);
							} else {
								property = b.array([property, b.literal(scoped_hash)]);
							}
						}

						if (attr_name === 'children') {
							children_prop = b.prop(
								'init',
								b.id('children'),
								b.call('_$_.normalize_children', property),
							);
							props.push(children_prop);
							continue;
						}

						props.push(b.prop('init', b.key(attr_name), property));
					}
				} else if (attr.type === 'JSXSpreadAttribute') {
					props.push(
						b.spread(
							/** @type {AST.Expression} */ (
								visit(attr.argument, { ...state, metadata: { ...state.metadata } })
							),
						),
					);
				}
			}

			if (node.metadata.scoped && get_component_css(state)) {
				const hasClassAttr = element_attributes.some(
					(attr) => attr.type === 'JSXAttribute' && get_attribute_name(attr) === 'class',
				);
				if (!hasClassAttr) {
					const name = is_spreading ? '#class' : 'class';
					const value = /** @type {string} */ (get_component_css_hash(state));
					props.push(b.prop('init', b.key(name), b.literal(value)));
				}
			}

			const element_children = lower_code_block_children(
				/** @type {AST.Node[]} */ (node.children),
				context.state.scopes,
			);
			for (const child of element_children) {
				if (is_native_tsrx_function_node(child)) {
					state.init?.push(/** @type {AST.Statement} */ (visit(child, state)));
				}
			}

			const children_filtered = element_children.filter(
				(child) => child.type !== 'EmptyStatement' && !is_native_tsrx_function_node(child),
			);

			if (children_filtered.length > 0) {
				const component_scope =
					/** @type {ScopeInterface} */ (context.state.scopes.get(node)) || context.state.scope;
				const children = b.call(
					'_$_.tsrx_element',
					/** @type {AST.Expression} */ (
						visit(create_native_tsrx_render_function([], children_filtered, node), {
							...context.state,
							regular_js: false,
							...(apply_parent_css_scope || get_component_css(state)
								? {
										applyParentCssScope:
											apply_parent_css_scope || get_component_css_hash(state) || undefined,
									}
								: {}),
							scope: component_scope,
							namespace: child_namespace,
						})
					),
				);

				// Template children take precedence over explicit children prop
				if (children_prop) {
					const idx = props.indexOf(children_prop);
					if (idx !== -1) props.splice(idx, 1);
				}
				children_prop = b.prop('init', b.id('children'), children);
				props.push(children_prop);
			}

			const args = [b.object(props)];

			// Check if this is a locally defined component
			const component_name =
				element_id.type === 'Identifier' ? /** @type {AST.Identifier} */ (element_id).name : null;
			const local_metadata = component_name
				? state.component_metadata.find((m) => m.id === component_name)
				: null;
			const comp_id = b.id('comp');
			const args_id = b.id('args');
			const comp_call = b.call('_$_.render_component', comp_id, b.spread(args_id));
			const comp_call_statement = b.stmt(comp_call);

			const visited_id = /** @type {AST.Expression} */ (visit(element_id, state));
			/** @type {AST.Statement[]} */
			const statements = [b.const(comp_id, visited_id), b.const(args_id, b.array(args))];

			if (local_metadata || node.metadata?.dynamicElement === true) {
				// Locally defined components and the internal `_$_.dynamic_element`
				// helper are statically known; a dynamic tag's possibly-null value
				// is handled inside the helper itself.
				statements.push(comp_call_statement);
			} else {
				// Imported components and component-valued props (e.g. `children`,
				// optional component props) may be undefined at render time —
				// render nothing instead of crashing.
				statements.push(b.if(comp_id, b.block([comp_call_statement])));
			}

			state.init?.push(b.block(statements));
		}
	},

	SwitchStatement: visit_switch_statement,
	JSXSwitchExpression(node, context) {
		return visit_directive_wrapping_values(node, context, visit_switch_statement);
	},

	ForOfStatement: visit_for_of_statement,
	// `@for` covers for-of / for-in / for(;;): non-for-of forms have no
	// dedicated visitor and keep the default traversal, as before.
	JSXForExpression(node, context) {
		return visit_directive_wrapping_values(node, context, (node, context) => {
			if (node.statementType === 'ForOfStatement') {
				return visit_for_of_statement(node, context);
			}
			return context.next();
		});
	},

	IfStatement: visit_if_statement,
	JSXIfExpression(node, context) {
		return visit_directive_wrapping_values(node, context, visit_if_statement);
	},

	ReturnStatement(node, context) {
		// A `return <markup>` produces a renderable value — lower it to a server
		// `tsrx_element`, exactly like control flow returning JSX in a regular
		// function. `@try`/`@pending`/`@catch` blocks legitimately return markup
		// this way (the only `@`-blocks that allow native returns).
		if (!context.state.to_ts && is_native_tsrx_template_node(node.argument)) {
			return b.return(
				build_template_node_to_tsrx_element(
					/** @type {AST.TSRXJSXElement | AST.TSRXJSXFragment} */ (
						/** @type {unknown} */ (node.argument)
					),
					context,
				),
				/** @type {AST.NodeWithLocation} */ (node),
			);
		}
		if (!is_inside_component(context)) {
			if (node.argument) {
				return b.return(
					/** @type {AST.Expression} */ (
						context.visit(node.argument, { ...context.state, template_child: false })
					),
					/** @type {AST.NodeWithLocation} */ (node),
				);
			}
			return context.next();
		}
		return context.next();
	},

	AssignmentExpression(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}

		const left = node.left;

		if (left.type === 'MemberExpression') {
			const target = get_indexed_reactive_target(left, context);
			if (target !== null) {
				const right = /** @type {AST.Expression} */ (
					context.visit(/** @type {AST.Node} */ (node.right))
				);
				let value = right;
				if (node.operator !== '=') {
					const operator = /** @type {AST.BinaryOperator} */ (node.operator.slice(0, -1));
					const current = build_index_read(target.target, target.index, target.tracked);
					if (current !== null) {
						value = b.binary(operator, current, right);
					}
				}
				const assignment = build_index_write(target.target, target.index, value, target.tracked);
				if (assignment !== null) {
					return assignment;
				}
			}

			const rewritten_left = rewrite_lazy_member_base(left, context);
			if (rewritten_left !== left) {
				return {
					...node,
					left: /** @type {AST.Pattern} */ (
						strip_typescript_expression_wrappers(
							/** @type {AST.Expression} */ (rewritten_left),
							context,
						)
					),
					right: /** @type {AST.Expression} */ (
						context.visit(/** @type {AST.Node} */ (node.right))
					),
				};
			}
		}

		// Handle lazy binding assignments (e.g., a = 5 where a is from let &{a} = obj)
		if (left.type === 'Identifier') {
			const binding = context.state.scope?.get(left.name);
			if (binding?.transform?.assign && binding.node !== left) {
				let value = /** @type {AST.Expression} */ (
					context.visit(/** @type {AST.Node} */ (node.right))
				);

				// For compound operators (+=, -=, *=, /=), expand to read + operation
				if (node.operator !== '=') {
					const operator = node.operator.slice(0, -1); // '+=' -> '+'
					const current = binding.transform.read(left);
					value = b.binary(/** @type {AST.BinaryOperator} */ (operator), current, value);
				}

				return binding.transform.assign(left, value);
			}
		}

		return {
			...node,
			left: /** @type {AST.Pattern} */ (strip_typescript_expression_wrappers(node.left, context)),
			right: /** @type {AST.Expression} */ (context.visit(/** @type {AST.Node} */ (node.right))),
		};
	},

	UpdateExpression(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}

		const argument = node.argument;

		if (argument.type === 'MemberExpression') {
			const target = get_indexed_reactive_target(argument, context);
			if (target !== null) {
				const update = build_index_update(target.target, target.index, target.tracked, node);
				if (update !== null) {
					return update;
				}
			}
		}

		// Handle lazy binding updates (e.g., a++ where a is from let &{a} = obj)
		if (argument.type === 'Identifier') {
			const binding = context.state.scope?.get(argument.name);
			if (binding?.transform?.update && binding.node !== argument) {
				return binding.transform.update(node);
			}
		}

		return {
			...node,
			argument: /** @type {AST.Expression} */ (
				strip_typescript_expression_wrappers(node.argument, context)
			),
		};
	},

	ImportDeclaration(node, context) {
		const { state } = context;

		if (get_submodule_import_source_name(node) === 'server') {
			return transform_server_module_import(node);
		}

		if (!state.to_ts && node.importKind === 'type') {
			return b.empty;
		}

		if (state.ancestor_server_block) {
			if (!node.specifiers.length) {
				return b.empty;
			}

			/** @type {AST.VariableDeclaration[]} */
			const locals = state.server_block_locals;
			const specifiers = node.specifiers.map((spec) => {
				const original_name = spec.local.name;
				const name = obfuscateIdentifier(original_name);
				locals.push(b.const(original_name, b.id(name)));
				return { ...spec, local: b.id(name) };
			});
			state.imports.add(/** @type {AST.ImportDeclaration} */ ({ ...node, specifiers }));
			return b.empty;
		}

		return /** @type {AST.ImportDeclaration} */ ({
			...node,
			specifiers: node.specifiers
				.filter((spec) => /** @type {AST.ImportSpecifier} */ (spec).importKind !== 'type')
				.map((spec) => context.visit(spec)),
		});
	},

	TryStatement: visit_try_statement,
	JSXTryExpression(node, context) {
		return visit_directive_wrapping_values(node, context, visit_try_statement);
	},

	JSXExpressionContainer(node, context) {
		const { visit, state } = context;

		// A `{/* comment */}` container renders nothing.
		if (is_empty_expression_container(node)) {
			return;
		}

		// A merged text run (adjacent text/expression children collapsed by
		// `normalize_children`) renders through the plain text path.
		if (is_template_text(node)) {
			const expression = /** @type {AST.Expression} */ (visit(node.expression, state));

			if (expression.type === 'Literal') {
				state.init?.push(
					b.stmt(b.call(b.id('_$_.output_push'), b.literal(escape(expression.value)))),
				);
			} else {
				state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.call('_$_.escape', expression))));
			}
			return;
		}

		const is_static_native_tsrx_call = is_static_native_tsrx_function_call(
			/** @type {AST.Expression} */ (node.expression),
			context,
		);
		const is_children_expression =
			is_children_template_expression(node.expression, state.scope) ||
			contains_template_value_node(/** @type {AST.Node} */ (node.expression)) ||
			is_template_value_call(/** @type {AST.Expression} */ (node.expression), state.scope) ||
			is_template_value_binding(node.expression, state.scope);
		const is_collection_expression = is_collection_value_expression(
			/** @type {AST.Expression} */ (node.expression),
			state.scope,
			context,
		);
		const is_runtime_expression = expression_contains_call(
			/** @type {AST.Expression} */ (node.expression),
		);
		let expression = /** @type {AST.Expression} */ (
			visit(node.expression, {
				...state,
				template_child: is_children_expression ? false : state.template_child,
			})
		);

		if (expression.type === 'Literal') {
			state.init?.push(
				b.stmt(b.call(b.id('_$_.output_push'), b.literal(escape(expression.value)))),
			);
		} else if (is_static_native_tsrx_call) {
			state.init?.push(b.stmt(b.call('_$_.render_tsrx_element', expression)));
		} else if (is_children_expression || is_collection_expression || is_runtime_expression) {
			state.init?.push(b.stmt(b.call('_$_.render_expression', expression)));
		} else {
			state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.call('_$_.escape', expression))));
		}
	},

	JSXText(node, { state }) {
		const value = get_template_text_value(node, false);

		// Insignificant whitespace collapses to nothing.
		if (value === '') {
			return;
		}

		state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(escape(value)))));
	},

	TSModuleBlock(node, context) {
		/** @type {AST.Statement[]} */
		const statements = [];
		for (const statement of node.body) {
			push_statement(
				/** @type {AST.Statement | AST.Statement[]} */ (context.visit(statement)),
				statements,
			);
		}
		return { ...node, body: statements };
	},

	TSModuleDeclaration(node, context) {
		if (!is_server_module_declaration(node)) {
			return context.next();
		}

		const exports = node.metadata.exports ?? new Set();

		// Convert imports inside `module server` to local variables.
		// ImportDeclaration() visitor will add imports to the top of the module
		/** @type {AST.VariableDeclaration[]} */
		const server_block_locals = [];

		const block = /** @type {AST.TSModuleBlock} */ (
			context.visit(node.body, {
				...context.state,
				ancestor_server_block: node,
				server_block_locals,
				server_exported_names: [],
			})
		);

		if (exports.size === 0) {
			return {
				...block,
				body: [...server_block_locals, ...block.body],
			};
		}

		const file_path = context.state.filename;
		const rpc_modules = globalThis.rpc_modules;

		if (rpc_modules) {
			for (const name of exports) {
				const func_path = file_path + '#' + name;
				// needs to be a sha256 hash of func_path, to avoid leaking file structure
				const func_hash = strong_hash(func_path);
				rpc_modules.set(func_hash, [file_path, name]);
			}
		}

		return b.export(
			b.const(
				'_$_server_$_',
				b.call(
					b.thunk(
						b.block([
							b.var('_$_server_$_', b.object([])),
							...server_block_locals,
							...block.body,
							b.return(b.id('_$_server_$_')),
						]),
					),
				),
			),
		);
	},

	Program(node, context) {
		// We need a Program visitor to make sure all top level entities are visited
		// Without it, and without at least one export component
		// other components are not visited
		/** @type {Array<AST.Statement | AST.Directive | AST.ModuleDeclaration>} */
		const statements = [];

		for (const statement of node.body) {
			push_statement(
				/** @type {AST.Statement | AST.Statement[] | AST.Directive | AST.ModuleDeclaration} */ (
					context.visit(statement)
				),
				statements,
			);
		}

		return { ...node, body: statements };
	},
};

/**
 * Returns the single argument expression of a `_$_.output_push(x)` statement, or
 * `null` for anything else. Every `output_push` argument is a pure string
 * expression (a literal, or `escape(…)` / `attr(…)` / a value id) computed before
 * the push, so any run of these folds into one `output_push(a + b + c)` without
 * changing evaluation order or the emitted bytes.
 * @param {AST.Node} stmt
 * @returns {AST.Expression | null}
 */
function output_push_arg(stmt) {
	if (stmt.type !== 'ExpressionStatement') return null;
	const expr = stmt.expression;
	if (
		expr.type === 'CallExpression' &&
		expr.callee.type === 'Identifier' &&
		expr.callee.name === '_$_.output_push' &&
		expr.arguments.length === 1 &&
		expr.arguments[0].type !== 'SpreadElement'
	) {
		return /** @type {AST.Expression} */ (expr.arguments[0]);
	}
	return null;
}

/**
 * True if a block body declares any block-scoped binding, in which case the
 * `{ … }` is a meaningful lexical scope and must not be unwrapped. Conservative:
 * treats every declaration form (incl. hoisting `var`) as a binding.
 * @param {AST.Statement[]} body
 * @returns {boolean}
 */
function declares_binding(body) {
	return body.some(
		(stmt) =>
			stmt.type === 'VariableDeclaration' ||
			stmt.type === 'FunctionDeclaration' ||
			stmt.type === 'ClassDeclaration',
	);
}

/**
 * @param {AST.Expression} arg
 * @returns {boolean}
 */
function is_string_literal(arg) {
	return arg.type === 'Literal' && typeof arg.value === 'string';
}

/**
 * True if a block directly contains an `output_push` — i.e. unwrapping it would
 * enable a fold. Keeps the unwrap scoped to the SSR template path instead of
 * stripping every binding-free block (e.g. server-module export wrappers).
 * @param {AST.Statement[]} body
 * @returns {boolean}
 */
function contains_output_push(body) {
	return body.some((stmt) => output_push_arg(stmt) !== null);
}

/**
 * Builds one `+`-concatenated expression from a run of `output_push` argument
 * expressions, merging consecutive string literals into single literals.
 * @param {AST.Expression[]} args
 * @returns {AST.Expression}
 */
function build_concat(args) {
	/** @type {(string | AST.Expression)[]} */
	const parts = [];
	for (const arg of args) {
		const last = parts[parts.length - 1];
		if (is_string_literal(arg)) {
			const value = /** @type {string} */ (/** @type {AST.Literal} */ (arg).value);
			if (typeof last === 'string') {
				parts[parts.length - 1] = last + value;
			} else {
				parts.push(value);
			}
		} else {
			parts.push(arg);
		}
	}
	const exprs = parts.map((p) => (typeof p === 'string' ? b.literal(p) : p));
	let concat = exprs[0];
	for (let i = 1; i < exprs.length; i++) {
		concat = b.binary('+', concat, exprs[i]);
	}
	return concat;
}

// Runtime helpers whose calls return a string and never touch the output buffer
// — safe to leave inside an accumulated run. Anything else under the `_$_.`
// namespace (render_component, regular_block, try_block, set_output_target, the
// serialized-push helpers, …) may branch/emit and forces a flush before it.
const PURE_RUNTIME_CALLS = new Set(['_$_.escape', '_$_.attr', '_$_.clsx']);

/**
 * True if `node` contains a runtime call that may create a child block or emit
 * out of band (i.e. anything `_$_.*` that isn't in {@link PURE_RUNTIME_CALLS}),
 * not crossing into nested functions (those are separate blocks).
 * @param {AST.Node} node
 * @returns {boolean}
 */
function contains_branching_call(node) {
	let found = false;
	/** @param {unknown} n */
	const visit = (n) => {
		if (found || !n || typeof n !== 'object') {
			return;
		}
		if (Array.isArray(n)) {
			for (const child of n) visit(child);
			return;
		}
		if (!is_traversable_ast_node(n) || isFunctionNode(n)) {
			return;
		}
		if (
			n.type === 'CallExpression' &&
			n.callee.type === 'Identifier' &&
			n.callee.name.startsWith('_$_.') &&
			n.callee.name !== '_$_.output_push' &&
			!PURE_RUNTIME_CALLS.has(n.callee.name)
		) {
			found = true;
			return;
		}
		for (const key in n) {
			if (key === 'metadata' || key === 'loc' || key === 'leadingComments') continue;
			visit(n[key]);
		}
	};
	visit(node);
	return found;
}

/**
 * Inlines binding-free `{ … }` blocks that directly contain a push (the
 * `{ escape(x) }` holes) so their pushes become siblings and can coalesce.
 * Recurses only through such blocks — control flow and bindful blocks are left
 * for the threader to descend into.
 * @param {AST.Statement[]} list
 * @returns {AST.Statement[]}
 */
function flatten_push_blocks(list) {
	/** @type {AST.Statement[]} */
	const out = [];
	for (const stmt of list) {
		if (
			stmt.type === 'BlockStatement' &&
			!declares_binding(stmt.body) &&
			contains_output_push(stmt.body)
		) {
			out.push(...flatten_push_blocks(/** @type {AST.Statement[]} */ (stmt.body)));
		} else {
			out.push(stmt);
		}
	}
	return out;
}

const CONTAINER_TYPES = new Set([
	'BlockStatement',
	'IfStatement',
	'ForStatement',
	'ForInStatement',
	'ForOfStatement',
	'WhileStatement',
	'DoWhileStatement',
	'SwitchStatement',
	'TryStatement',
	'LabeledStatement',
]);

/**
 * True if any of a container's non-body header expressions (a loop init/test, an
 * `if`/`switch` discriminant, …) contains a branching call — in which case we
 * cannot safely thread the accumulator through it.
 * @param {AST.Statement} stmt
 * @returns {boolean}
 */
function container_header_branches(stmt) {
	switch (stmt.type) {
		case 'IfStatement':
		case 'WhileStatement':
		case 'DoWhileStatement':
			return contains_branching_call(stmt.test);
		case 'SwitchStatement':
			return (
				contains_branching_call(stmt.discriminant) ||
				stmt.cases.some((c) => c.test && contains_branching_call(c.test))
			);
		case 'ForStatement':
			return (
				(!!stmt.init && contains_branching_call(stmt.init)) ||
				(!!stmt.test && contains_branching_call(stmt.test)) ||
				(!!stmt.update && contains_branching_call(stmt.update))
			);
		case 'ForInStatement':
		case 'ForOfStatement':
			return contains_branching_call(stmt.right);
		default:
			return false;
	}
}

/**
 * Accumulator threading for one runtime block body and everything inside it
 * except nested functions (separate blocks). Coalesces adjacent pushes into
 * `__out += a + b + c`, threads the same accumulator through control flow and
 * binding-free blocks, and flushes (`output_push(__out); __out = ''`) before any
 * branching statement. See {@link accumulate_output_pushes} for why this stays
 * within block boundaries.
 * @param {AST.Statement[]} list
 * @param {string} out_id
 * @returns {AST.Statement[]}
 */
function thread_statement_list(list, out_id) {
	const flat = flatten_push_blocks(list);
	/** @type {AST.Statement[]} */
	const out = [];
	/** @type {AST.Expression[]} */
	let pending = [];
	const commit = () => {
		if (pending.length === 0) return;
		out.push(b.stmt(b.assignment('+=', b.id(out_id), build_concat(pending))));
		pending = [];
	};
	const flush = () => {
		commit();
		out.push(b.stmt(b.call(b.id('_$_.output_push'), b.id(out_id))));
		out.push(b.stmt(b.assignment('=', b.id(out_id), b.literal(''))));
	};
	for (const stmt of flat) {
		const arg = output_push_arg(stmt);
		if (arg !== null) {
			pending.push(arg);
		} else if (CONTAINER_TYPES.has(stmt.type) && !container_header_branches(stmt)) {
			commit();
			out.push(thread_container(stmt, out_id));
		} else if (stmt.type === 'ReturnStatement' || contains_branching_call(stmt)) {
			flush();
			out.push(stmt);
		} else {
			// Pure statement (var decl, `i++`, …): keep, no flush, but commit first
			// so accumulated pushes stay ordered relative to it.
			commit();
			out.push(stmt);
		}
	}
	commit();
	return out;
}

/**
 * Threads the accumulator into a container's body slot(s), copy-on-write:
 * returns a rebuilt statement instead of mutating the original.
 * @param {AST.Statement} stmt
 * @param {string} out_id
 * @returns {AST.Statement}
 */
function thread_container(stmt, out_id) {
	/** @param {AST.Statement} node @returns {AST.Statement} */
	const body_slot = (node) => {
		if (node.type === 'BlockStatement') {
			return { ...node, body: thread_statement_list(node.body, out_id) };
		}
		return b.block(thread_statement_list([node], out_id));
	};
	switch (stmt.type) {
		case 'BlockStatement':
			return { ...stmt, body: thread_statement_list(stmt.body, out_id) };
		case 'IfStatement':
			return {
				...stmt,
				consequent: body_slot(stmt.consequent),
				alternate: stmt.alternate ? body_slot(stmt.alternate) : stmt.alternate,
			};
		case 'ForStatement':
		case 'ForInStatement':
		case 'ForOfStatement':
		case 'WhileStatement':
		case 'DoWhileStatement':
		case 'LabeledStatement':
			return { ...stmt, body: body_slot(stmt.body) };
		case 'SwitchStatement':
			return {
				...stmt,
				cases: stmt.cases.map((switch_case) => ({
					...switch_case,
					consequent: thread_statement_list(switch_case.consequent, out_id),
				})),
			};
		case 'TryStatement':
			return {
				...stmt,
				block: { ...stmt.block, body: thread_statement_list(stmt.block.body, out_id) },
				handler: stmt.handler
					? {
							...stmt.handler,
							body: {
								...stmt.handler.body,
								body: thread_statement_list(stmt.handler.body.body, out_id),
							},
						}
					: stmt.handler,
				finalizer: stmt.finalizer
					? { ...stmt.finalizer, body: thread_statement_list(stmt.finalizer.body, out_id) }
					: stmt.finalizer,
			};
		default:
			return stmt;
	}
}

/**
 * True if `body` directly contains an `output_push` (not inside a nested
 * function), i.e. it is a runtime block body the accumulator should rewrite.
 * @param {AST.Statement[]} body
 * @returns {boolean}
 */
function has_direct_output_push(body) {
	let found = false;
	/** @param {unknown} n */
	const visit = (n) => {
		if (found || !n || typeof n !== 'object') return;
		if (Array.isArray(n)) {
			for (const child of n) visit(child);
			return;
		}
		if (!is_traversable_ast_node(n) || isFunctionNode(n)) return;
		if (output_push_arg(n) !== null) {
			found = true;
			return;
		}
		for (const key in n) {
			if (key === 'metadata' || key === 'loc' || key === 'leadingComments') continue;
			visit(n[key]);
		}
	};
	body.forEach(visit);
	return found;
}

/**
 * Picks an accumulator name not used anywhere in `body` (incl. nested scopes).
 * @param {AST.Statement[]} body
 * @returns {string}
 */
function fresh_accumulator_name(body) {
	/** @type {Set<string>} */
	const names = new Set();
	/** @param {unknown} n */
	const visit = (n) => {
		if (!n || typeof n !== 'object') return;
		if (Array.isArray(n)) {
			for (const child of n) visit(child);
			return;
		}
		if (!is_traversable_ast_node(n)) return;
		if (n.type === 'Identifier' && typeof n.name === 'string') names.add(n.name);
		for (const key in n) {
			if (key === 'metadata' || key === 'loc' || key === 'leadingComments') continue;
			visit(n[key]);
		}
	};
	body.forEach(visit);
	let name = '__out';
	for (let i = 2; names.has(name); i++) name = `__out${i}`;
	return name;
}

/**
 * Pass over the generated server program: within each runtime block, accumulate
 * output into a single `let __out` string and push it once per block instead of
 * once per element — flushing only before a child block. This beats the per-item
 * push shape (the whole `@for` feed lands in one push) because accumulation spans
 * loops and control flow.
 *
 * Correctness rests on the block model: every runtime block owns its own output
 * buffer, and a child block reserves its slot in the parent buffer at the moment
 * it branches — so everything before it must already be in the buffer. We declare
 * one accumulator per runtime block body (a function/arrow that directly pushes),
 * thread it through that body's control flow without crossing nested functions,
 * and flush before every branching statement and at block end. So a child block's
 * slot always follows what the parent already flushed: we never accumulate across
 * a block boundary.
 *
 * Copy-on-write: the input tree is never mutated — changed spines are rebuilt
 * and the rebuilt program is returned. A shared subtree is rewritten once and
 * every occurrence points at the same rewritten copy (mirroring the old
 * in-place semantics).
 * @param {AST.Program} program
 * @returns {AST.Program}
 */
function accumulate_output_pushes(program) {
	/** @type {WeakMap<object, unknown>} */
	const cache = new WeakMap();
	/** @param {unknown} node @returns {unknown} */
	const recurse = (node) => {
		if (Array.isArray(node)) {
			/** @type {unknown[] | null} */
			let copy = null;
			for (let i = 0; i < node.length; i++) {
				const next = recurse(node[i]);
				if (next !== node[i]) {
					copy ??= node.slice();
					copy[i] = next;
				}
			}
			return copy ?? node;
		}
		if (!is_traversable_ast_node(node)) return node;
		if (cache.has(node)) return cache.get(node);
		// Guard against cycles: re-entry resolves to the original node.
		cache.set(node, node);

		/** @type {AST.TraversableAstNode} */
		let result = /** @type {AST.TraversableAstNode} */ (node);

		if (isFunctionNode(node)) {
			const body = /** @type {AST.Function} */ (node).body;
			if (body && body.type === 'BlockStatement' && has_direct_output_push(body.body)) {
				const out_id = fresh_accumulator_name(body.body);
				result = /** @type {AST.TraversableAstNode} */ ({
					...node,
					body: {
						...body,
						body: [
							b.let(b.id(out_id), b.literal('')),
							...thread_statement_list(body.body, out_id),
							b.stmt(b.call(b.id('_$_.output_push'), b.id(out_id))),
						],
					},
				});
			}
		}

		for (const key in result) {
			if (
				key === 'metadata' ||
				key === 'loc' ||
				key === 'start' ||
				key === 'end' ||
				key === 'leadingComments'
			) {
				continue;
			}
			const child = result[key];
			const next = recurse(child);
			if (next !== child) {
				if (result === node) result = /** @type {AST.TraversableAstNode} */ ({ ...node });
				result[key] = next;
			}
		}

		cache.set(node, result);
		return result;
	};
	return /** @type {AST.Program} */ (recurse(program));
}

/**
 * @param {string} filename
 * @param {string} source
 * @param {AnalysisResult} analysis
 * @param {boolean} minify_css
 * @param {boolean} [dev]
 * @returns {{ ast: AST.Program; code: string; map: RawSourceMap | null; css: string; cssHash: string | null; }}
 */
export function transform_server(filename, source, analysis, minify_css, dev = false) {
	// Use component metadata collected during the analyze phase
	const component_metadata = analysis.component_metadata || [];

	/** @type {TransformServerState} */
	const state = {
		imports: new Set(),
		init: null,
		scope: analysis.scope,
		scopes: analysis.scopes,
		stylesheets: [],
		component_metadata,
		ancestor_server_block: undefined,
		server_block_locals: [],
		server_exported_names: [],
		filename,
		namespace: 'html',
		// TODO: should we remove all `to_ts` usages we use the client rendering for that?
		to_ts: false,
		metadata: {},
		dev,
	};

	state.imports.add(`import * as _$_ from 'ripple/internal/server'`);

	let program = /** @type {AST.Program} */ (walk(analysis.ast, { ...state }, visitors));

	const { css, cssHash } = renderCssResult(state.stylesheets, minify_css);

	/** @type {AST.Program['body']} */
	let body = [];

	for (const import_node of state.imports) {
		if (typeof import_node === 'string') {
			body.push(b.stmt(b.id(import_node)));
		} else {
			body.push(import_node);
		}
	}

	body.push(...program.body);

	// Register each stylesheet's CSS so the runtime can serialize it
	if (css) {
		for (const stylesheet of state.stylesheets) {
			const css_for_component = renderStylesheets([stylesheet]);
			body.push(
				b.stmt(
					b.call('_$_.register_css', b.literal(stylesheet.hash), b.literal(css_for_component)),
				),
			);
		}
	}

	program = /** @type {AST.Program} */ ({ ...program, body });

	// Accumulate each runtime block's output into a single `__out` string and
	// push it once per block (flushing only before a child block) so the whole
	// `@for` feed lands in one push. Stays within block boundaries by
	// construction (see accumulate_output_pushes).
	program = accumulate_output_pushes(/** @type {AST.Program} */ (program));

	const { code, map } = print(
		program,
		/** @type {Visitors<AST.Node, TransformServerState>} */ (ts()),
		{
			sourceMapContent: source,
			sourceMapSource: path.basename(filename),
		},
	);

	return {
		ast: /** @type {AST.Program} */ (program),
		code,
		map,
		css,
		cssHash,
	};
}
