/** @import * as AST from 'estree'; */
/** @import * as ESTreeJSX from 'estree-jsx'; */
/** @import { RawSourceMap } from 'source-map'; */
/**
@import {
	TransformServerContext,
	TransformServerState,
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
	pruneCss,
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
	is_element_dynamic,
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
	simple_hash,
	strong_hash,
	flatten_switch_consequent,
	get_ripple_namespace_call_name,
	strip_class_typescript_syntax,
	strip_typescript_expression_wrappers,
	jsx_to_ripple_node,
	build_index_read,
	build_index_write,
	build_index_update,
	expression_contains_call,
	generate_local_name,
	get_indexed_reactive_target,
	rewrite_lazy_member_base,
	should_guard_regular_js_statement,
	strip_tsrx_style_elements,
} from '../../utils.js';

/**
 * Re-run CSS pruning on JSX converted into Ripple template nodes so server
 * output applies the same scoped metadata as regular Ripple template elements.
 *
 * @param {AST.Node[]} nodes
 * @param {TransformServerState} state
 * @returns {void}
 */
function apply_tsrx_css_scoping(nodes, state) {
	const component = state.component;
	const css = get_component_css(state);
	if (!component || !css) {
		return;
	}
	const stylesheet = /** @type {AST.CSS.StyleSheet} */ (css);

	const style_classes = /** @type {any} */ (component.metadata).styleClasses ?? new Map();
	const top_scoped_classes = /** @type {any} */ (component.metadata).topScopedClasses ?? new Map();

	/**
	 * @param {AST.Node} node
	 * @returns {void}
	 */
	function visit_node(node) {
		if (node.type === 'Element') {
			pruneCss(stylesheet, node, style_classes, top_scoped_classes);
			for (const child of node.children) {
				visit_node(child);
			}
			return;
		}

		if ('children' in node && Array.isArray(node.children)) {
			for (const child of node.children) {
				visit_node(/** @type {AST.Node} */ (child));
			}
		}
	}

	for (const node of nodes) {
		visit_node(node);
	}
}

/**
 * @param {TransformServerState} state
 * @returns {AST.CSS.StyleSheet | null}
 */
function get_component_css(state) {
	const component = /** @type {any} */ (state.component);
	return component?.css ?? component?.metadata?.css ?? null;
}

/**
 * @param {TransformServerState} state
 * @returns {string | null}
 */
function get_component_css_hash(state) {
	return get_component_css(state)?.hash ?? null;
}

/**
 * @param {AST.Element} node
 * @param {TransformServerContext} context
 * @returns {AST.ObjectExpression | null}
 */
function build_style_class_map_expression(node, context) {
	const stylesheet = getStyleElementStylesheet(node);
	if (!stylesheet) {
		return null;
	}

	analyzeCss(stylesheet);
	context.state.stylesheets.push(prepareStylesheetForRender(stylesheet));
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
 * @returns {AST.Node[]}
 */
function insert_style_ref_setup_statements(body, setup) {
	if (setup.length === 0) {
		return body;
	}

	let inserted = false;

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

	/** @param {AST.Node} node */
	const insert_in_statement = (node) => {
		if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
			return node;
		}
		if (node.type === 'BlockStatement') {
			node.body = /** @type {AST.Statement[]} */ (insert_in_list(node.body || []));
			return node;
		}
		if (node.type === 'IfStatement') {
			node.consequent = /** @type {AST.Statement} */ (insert_in_statement(node.consequent));
			if (node.alternate) {
				node.alternate = /** @type {AST.Statement} */ (insert_in_statement(node.alternate));
			}
			return node;
		}
		if (node.type === 'SwitchStatement') {
			for (const switch_case of node.cases || []) {
				switch_case.consequent = /** @type {AST.Statement[]} */ (
					insert_in_list(switch_case.consequent || [])
				);
			}
			return node;
		}
		if (node.type === 'TryStatement') {
			node.block = /** @type {AST.BlockStatement} */ (insert_in_statement(node.block));
			if (node.handler?.body) {
				node.handler.body = /** @type {AST.BlockStatement} */ (
					insert_in_statement(node.handler.body)
				);
			}
			if (node.finalizer) {
				node.finalizer = /** @type {AST.BlockStatement} */ (insert_in_statement(node.finalizer));
			}
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
 * @param {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment} node
 * @param {TransformServerContext} context
 * @returns {AST.CallExpression}
 */
function build_jsx_to_tsrx_element(node, context) {
	const { visit, state, path } = context;
	const result = jsx_to_ripple_node(/** @type {AST.Node} */ (node), path);
	const converted = Array.isArray(result) ? result : [result];
	/** @type {AST.Node[]} */
	const children = converted.filter((child) => child != null && child.type !== 'EmptyStatement');

	apply_tsrx_css_scoping(children, state);

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
 * @param {AST.Element | AST.TsrxFragment} node
 * @param {TransformServerContext} context
 * @returns {AST.CallExpression}
 */
function build_template_node_to_tsrx_element(node, context) {
	const { visit, state, path } = context;
	const children =
		node.type === 'TsrxFragment'
			? node.children.filter((child) => child != null && child.type !== 'EmptyStatement')
			: [
					{
						...node,
						metadata: {
							...node.metadata,
							regular_js: undefined,
						},
					},
				];

	apply_tsrx_css_scoping(children, state);

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
				node.type === 'Element' ||
				node.type === 'JSXElement' ||
				node.type === 'JSXFragment' ||
				node.type === 'TsrxFragment' ||
				node.type === 'TsxCompat' ||
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
		initial?.type === 'Element' ||
		initial?.type === 'TsrxFragment'
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
		node.type === 'Element' ||
		node.type === 'TSRXExpression' ||
		node.type === 'Text' ||
		node.type === 'TsrxFragment' ||
		node.type === 'TsxCompat' ||
		node.type === 'IfStatement' ||
		node.type === 'ForOfStatement' ||
		node.type === 'TryStatement' ||
		node.type === 'SwitchStatement'
	);
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
		parent?.type === 'LabeledStatement'
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
		parent?.type === 'Element' ||
		parent?.type === 'TsrxFragment' ||
		parent?.type === 'TsxCompat'
	);
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function should_wrap_node_in_regular_block(node) {
	return is_template_or_control_flow(node) && node.type !== 'TryStatement';
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_head_element(node) {
	return node.type === 'Element' && node.id.type === 'Identifier' && node.id.name === 'head';
}

/**
 * @param {AST.Element} node
 * @param {TransformServerContext} context
 * @returns {boolean}
 */
function is_ripple_fragment_element(node, context) {
	if (node.id.type === 'Identifier') {
		return node.id.name === 'Fragment' && is_ripple_import(node.id, context);
	}

	return (
		node.id.type === 'MemberExpression' &&
		node.id.property.type === 'Identifier' &&
		node.id.property.name === 'Fragment' &&
		is_ripple_import(node.id, context)
	);
}

/**
 * @param {AST.Element} node
 * @returns {AST.Attribute | null}
 */
function get_inner_html_attribute(node) {
	for (const attr of node.attributes) {
		if (
			attr.type === 'Attribute' &&
			attr.name.type === 'Identifier' &&
			attr.name.name === 'innerHTML'
		) {
			return attr;
		}
	}

	return null;
}

/**
 * @param {AST.Attribute} attr
 * @param {TransformServerContext} context
 * @returns {AST.Expression}
 */
function get_attribute_value_expression(attr, context) {
	if (attr.value === null) {
		return b.literal('');
	}

	return /** @type {AST.Expression} */ (context.visit(attr.value, context.state));
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
 * @param {AST.Element} node
 * @param {TransformServerContext} context
 * @returns {void}
 */
function visit_ripple_fragment_element(node, context) {
	const inner_html = get_inner_html_attribute(node);

	if (inner_html !== null) {
		push_raw_html_expression(get_attribute_value_expression(inner_html, context), context.state);
		return;
	}

	transform_children(node.children, context);
}

/**
 * Builds a negated AND condition from return flag names: !__r_1 && !__r_2 && ...
 * @param {string[]} flags
 * @returns {AST.Expression}
 */
function build_return_guard(flags) {
	/** @type {AST.Expression} */
	let condition = b.unary('!', b.id(flags[0]));
	for (let i = 1; i < flags.length; i++) {
		condition = b.logical('&&', condition, b.unary('!', b.id(flags[i])));
	}
	return condition;
}

/**
 * Collects all unique valid return statements from the direct children of a body.
 * @param {AST.Node[]} children
 * @returns {AST.ReturnStatement[]}
 */
function collect_returns_from_children(children) {
	/** @type {AST.ReturnStatement[]} */
	const returns = [];
	const seen = new Set();
	for (let index = 0; index < children.length; index++) {
		const node = children[index];
		if (
			node.type === 'ReturnStatement' &&
			index !== children.length - 1 &&
			!node.metadata?.invalid_tsrx_template_return
		) {
			if (!seen.has(node)) {
				seen.add(node);
				returns.push(node);
			}
		}
		if (node.metadata?.returns) {
			for (const ret of node.metadata.returns) {
				if (!ret.metadata?.invalid_tsrx_template_return && !seen.has(ret)) {
					seen.add(ret);
					returns.push(ret);
				}
			}
		}
	}
	return returns;
}

/**
 * @param {AST.ReturnStatement[]} returns
 * @param {Map<AST.ReturnStatement, { name: string, tracked: boolean }>} return_flags
 * @returns {string[]}
 */
function get_unique_return_flag_names(returns, return_flags) {
	/** @type {string[]} */
	const names = [];
	for (const ret of returns) {
		const info = return_flags.get(ret);
		if (info && !names.includes(info.name)) {
			names.push(info.name);
		}
	}
	return names;
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

	for (const declarator of node.declarations) {
		if (!context.state.to_ts) {
			delete declarator.id.typeAnnotation;

			if (
				(declarator.id.type === 'ObjectPattern' || declarator.id.type === 'ArrayPattern') &&
				declarator.id.lazy &&
				declarator.id.metadata?.lazy_id
			) {
				declarator.id = b.id(declarator.id.metadata.lazy_id);
			}
		}

		const declarator_init = /** @type {AST.Node | null | undefined} */ (declarator.init);
		const init =
			declarator_init?.type === 'TsrxFragment'
				? build_template_node_to_tsrx_element(declarator_init, context)
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
			id: /** @type {AST.Pattern} */ (context.visit(declarator.id)),
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
	const effective_normalized = normalized.filter(
		(node) => !(node.metadata?.regular_js && is_dead_native_tsrx_expression_statement(node)),
	);
	const should_wrap_in_regular_block =
		state.component !== undefined && !state.skip_regular_blocks && !state.in_regular_block;

	const all_returns = collect_returns_from_children(effective_normalized);
	/** @type {Map<AST.ReturnStatement, { name: string, tracked: boolean }>} */
	const return_flags = new Map([...(state.return_flags || [])]);
	/** @type {AST.ReturnStatement[]} */
	const new_returns = [];
	for (const ret of all_returns) {
		if (!return_flags.has(ret)) {
			new_returns.push(ret);
		}
	}

	if (new_returns.length > 0) {
		const return_guard_scope =
			(state.component && state.scopes.get(state.component)) || state.scope;
		const info = { name: generate_local_name(return_guard_scope, 'return_guard'), tracked: false };
		for (const ret of new_returns) {
			return_flags.set(ret, info);
		}
		state.init?.push(b.var(b.id(info.name), b.false));
	}

	/** @type {string[]} */
	let accumulated_flags = [];

	/**
	 * @param {AST.ReturnStatement[] | undefined} returns
	 */
	const push_return_flags = (returns) => {
		if (!returns) return;
		for (const name of get_unique_return_flag_names(returns, return_flags)) {
			if (!accumulated_flags.includes(name)) {
				accumulated_flags.push(name);
			}
		}
	};

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
				state.init?.push(
					accumulated_flags.length > 0 && should_guard_regular_js_statement(statement)
						? b.if(build_return_guard(accumulated_flags), statement)
						: statement,
				);
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
					: /** @type {AST.Statement} */ (visit(node, { ...local_state, return_flags })),
			);
			if (node.type === 'ReturnStatement') {
				const info = return_flags.get(node);
				if (info && !accumulated_flags.includes(info.name)) {
					accumulated_flags.push(info.name);
				}
			}
		} else {
			visit(node, { ...local_state, return_flags, template_child: true });
		}
	};

	/** @type {AST.Node[]} */
	let pending_group = [];
	/** @type {string[]} */
	let pending_guard_flags = [];

	const flush_pending_group = () => {
		if (pending_group.length === 0) return;

		const group = pending_group;
		const guard_flags = pending_guard_flags;
		pending_group = [];
		pending_guard_flags = [];

		/** @type {AST.Statement[]} */
		const wrapped = [];
		const saved_init = state.init;
		state.init = wrapped;

		for (const group_node of group) {
			process_node(group_node, { ...state, init: wrapped, in_regular_block: true });
		}

		state.init = saved_init;
		if (wrapped.length === 0) return;

		const guard = build_return_guard(guard_flags);
		state.init?.push(
			...wrap_regular_block([
				b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))),
				b.if(guard, b.block(wrapped)),
				b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))),
			]),
		);
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
			flush_pending_group();
			continue;
		}

		if (accumulated_flags.length > 0 && should_wrap_node_in_regular_block(node)) {
			if (pending_group.length === 0) {
				pending_guard_flags = [...accumulated_flags];
			}
			pending_group.push(node);

			if (node.metadata?.has_return && node.metadata.returns) {
				flush_pending_group();
				push_return_flags(node.metadata.returns);
			}
			continue;
		}

		flush_pending_group();

		if (should_wrap_node_in_regular_block(node)) {
			process_wrapped_template_or_control_flow(node);
		} else {
			process_node(node);
		}
		push_return_flags(node.metadata?.has_return ? node.metadata.returns : undefined);
	}

	flush_pending_group();

	const head_elements = /** @type {AST.Element[]} */ (
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

			transform_children(head_element.children, {
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
 * @returns {AST.Element | AST.TsrxFragment | null}
 */
function get_native_tsrx_return_template_node(node, allow_direct_template = false) {
	if (!node) return null;
	if (allow_direct_template && is_native_tsrx_template_node(node)) {
		return /** @type {AST.Element | AST.TsrxFragment} */ (/** @type {unknown} */ (node));
	}
	if (node.type === 'ReturnStatement' && is_native_tsrx_template_node(node.argument)) {
		return /** @type {AST.Element | AST.TsrxFragment} */ (/** @type {unknown} */ (node.argument));
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
		let props_param = node.params[0];

		if (props_param.type === 'Identifier') {
			delete props_param.typeAnnotation;
			props_param_output = props_param;
		} else if (props_param.type === 'ObjectPattern' || props_param.type === 'ArrayPattern') {
			delete props_param.typeAnnotation;
			if (props_param.lazy) {
				props_param_output = b.id('__props');
			} else {
				props_param_output = replace_lazy_param_pattern(props_param);
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

	const raw_render_body = get_native_tsrx_function_body(node);
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
		insert_style_ref_setup_statements(raw_render_body, style_ref_setup),
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

		if (!state.to_ts) {
			delete node.typeArguments;
		}

		const callee = node.callee;

		// Handle direct calls to ripple-imported functions: effect(), untrack(), RippleArray(), etc.
		if (callee.type === 'Identifier' && is_ripple_import(callee, context)) {
			const ripple_runtime_method = get_ripple_namespace_call_name(callee.name);
			if (ripple_runtime_method !== null) {
				return {
					...node,
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
			if (node.arguments.length === 0) {
				node.arguments.push(b.void0);
			}

			for (let i = 0; i < node.arguments.length; i++) {
				const arg = node.arguments[i];
				call_args.push(/** @type {(AST.Expression | AST.SpreadElement)} */ (context.visit(arg)));
				if (i === 0) {
					call_args.push(b.literal(node.metadata.hash));
				}
			}

			return {
				...node,
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

		return context.next();
	},

	JSXElement(node, context) {
		if (context.state.jsx_to_tsrx_element) {
			return build_jsx_to_tsrx_element(node, context);
		}
		return context.next();
	},

	JSXFragment(node, context) {
		if (context.state.jsx_to_tsrx_element) {
			return build_jsx_to_tsrx_element(node, context);
		}
		return context.next();
	},

	NewExpression(node, context) {
		const callee = node.callee;

		if (!context.state.to_ts) {
			delete node.typeArguments;
		}

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

		return context.next();
	},

	PropertyDefinition(node, context) {
		if (!context.state.to_ts) {
			delete node.typeAnnotation;
		}
		return context.next();
	},

	ClassDeclaration(node, context) {
		if (!context.state.to_ts) {
			strip_class_typescript_syntax(node, context);
		}
		return context.next();
	},

	ClassExpression(node, context) {
		if (!context.state.to_ts) {
			strip_class_typescript_syntax(node, context);
		}
		return context.next();
	},

	FunctionDeclaration(node, context) {
		if (is_tsrx_component_function(node, context)) {
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
			delete node.returnType;
			delete node.typeParameters;
			for (let i = 0; i < node.params.length; i++) {
				const param = node.params[i];
				delete param.typeAnnotation;
				// Handle AssignmentPattern (parameters with default values)
				if (param.type === 'AssignmentPattern' && param.left) {
					delete param.left.typeAnnotation;
				}
				// Replace lazy destructuring params with generated identifiers
				const pattern = param.type === 'AssignmentPattern' ? param.left : param;
				if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
					const transformed_pattern = replace_lazy_param_pattern(pattern);
					node.params[i] =
						param.type === 'AssignmentPattern'
							? /** @type {AST.AssignmentPattern} */ ({ ...param, left: transformed_pattern })
							: transformed_pattern;
				}
			}
		}
		return context.next();
	},

	FunctionExpression(node, context) {
		if (is_tsrx_component_function(node, context)) {
			return transform_native_tsrx_function(node, context);
		}
		if (!context.state.to_ts) {
			delete node.returnType;
			delete node.typeParameters;
			for (let i = 0; i < node.params.length; i++) {
				const param = node.params[i];
				delete param.typeAnnotation;
				// Handle AssignmentPattern (parameters with default values)
				if (param.type === 'AssignmentPattern' && param.left) {
					delete param.left.typeAnnotation;
				}
				// Replace lazy destructuring params with generated identifiers
				const pattern = param.type === 'AssignmentPattern' ? param.left : param;
				if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
					const transformed_pattern = replace_lazy_param_pattern(pattern);
					node.params[i] =
						param.type === 'AssignmentPattern'
							? /** @type {AST.AssignmentPattern} */ ({ ...param, left: transformed_pattern })
							: transformed_pattern;
				}
			}
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
		if (is_tsrx_component_function(node, context)) {
			return transform_native_tsrx_function(node, context);
		}
		delete node.returnType;
		delete node.typeParameters;
		const params = node.params.map((param) => {
			delete param.typeAnnotation;
			// Handle AssignmentPattern (parameters with default values)
			if (param.type === 'AssignmentPattern' && param.left) {
				delete param.left.typeAnnotation;
			}
			// Replace lazy destructuring params with generated identifiers
			const pattern = param.type === 'AssignmentPattern' ? param.left : param;
			if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
				const transformed_pattern = replace_lazy_param_pattern(pattern);
				return param.type === 'AssignmentPattern'
					? /** @type {AST.AssignmentPattern} */ ({ ...param, left: transformed_pattern })
					: transformed_pattern;
			}
			return param;
		});

		return {
			...node,
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

	Element(node, context) {
		const { state, visit } = context;

		if (
			is_style_element(node) &&
			(state.regular_js ||
				is_native_tsrx_value_position(context.path) ||
				is_regular_js_statement_position(context.path))
		) {
			const expression = build_style_class_map_expression(node, context);
			if (expression) {
				if (is_regular_js_statement_position(context.path)) {
					return b.stmt(expression);
				}
				return expression;
			}
		}

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

		const dynamic_name = state.dynamicElementName;
		if (dynamic_name) {
			state.dynamicElementName = undefined;
		}

		const is_dom_element = !!dynamic_name || is_element_dom_element(node);
		const is_spreading = node.attributes.some((attr) => attr.type === 'SpreadAttribute');
		/** @type {(AST.Property | AST.SpreadElement)[] | null} */
		const spread_attributes = is_spreading ? [] : null;
		const child_namespace =
			!dynamic_name && is_dom_element
				? determine_namespace_for_children(
						/** @type {AST.Identifier} */ (node.id).name,
						state.namespace,
					)
				: state.namespace;

		if (is_dom_element) {
			const is_void = dynamic_name
				? false
				: is_void_element(/** @type {AST.Identifier} */ (node.id).name);
			const use_self_closing_syntax = node.selfClosing && (is_void || !!dynamic_name);
			const tag_name = dynamic_name
				? dynamic_name
				: b.literal(/** @type {AST.Identifier} */ (node.id).name);
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
						dynamic_name
							? b.template([b.quasi('<', false), b.quasi('', false)], [tag_name])
							: b.literal('<' + /** @type {AST.Literal} */ (tag_name).value),
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

			for (const attr of node.attributes) {
				if (attr.type === 'Attribute') {
					if (attr.name.type === 'Identifier') {
						const name = attr.name.name;

						if (name === 'innerHTML') {
							const expression =
								attr.value === null ? b.literal('') : get_attribute_value_expression(attr, context);
							if (is_spreading) {
								spread_attributes?.push(b.prop('init', b.literal('innerHTML'), expression));
							} else {
								inner_html_expression = expression;
							}
							continue;
						}

						if (attr.value === null) {
							handle_static_attr(name, true);
							continue;
						}

						if (name === 'ref') {
							continue;
						}

						if (attr.value.type === 'Literal' && name !== 'class') {
							handle_static_attr(name, attr.value.value);
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
							visit(attr.value, { ...state, metadata })
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
				} else if (attr.type === 'SpreadAttribute') {
					spread_attributes?.push(
						b.spread(/** @type {AST.Expression} */ (visit(attr.argument, state))),
					);
				}
			}

			if (class_attribute !== null) {
				const attr_value = /** @type {AST.Expression} */ (class_attribute.value);
				if (attr_value.type === 'Literal') {
					let value = attr_value.value;

					if (scoping_hash) {
						value = `${scoping_hash} ${value}`;
					}

					handle_static_attr(class_attribute.name.name, value);
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
			if (state.dev && !dynamic_name) {
				const element_name = /** @type {AST.Identifier} */ (node.id).name;
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
								...(state.applyParentCssScope ||
								(dynamic_name && node.metadata.scoped && get_component_css(state))
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
								...(state.applyParentCssScope ||
								(dynamic_name && node.metadata.scoped && get_component_css(state))
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
								dynamic_name
									? b.template([b.quasi('</', false), b.quasi('>', false)], [tag_name])
									: b.literal('</' + /** @type {AST.Literal} */ (tag_name).value + '>'),
							),
						),
					);
				}
			}

			// In dev mode, emit pop_element after the element is fully rendered
			if (state.dev && !dynamic_name) {
				state.init?.push(b.stmt(b.call('_$_.pop_element')));
			}
		} else {
			/** @type {(AST.Property | AST.SpreadElement)[]} */
			const props = [];
			/** @type {AST.Property | null} */
			let children_prop = null;

			const apply_parent_css_scope = state.applyParentCssScope;

			for (const attr of node.attributes) {
				if (attr.type === 'Attribute') {
					if (attr.name.type === 'Identifier') {
						const metadata = { tracking: false };
						let property =
							attr.value === null
								? b.literal(true)
								: /** @type {AST.Expression} */ (
										visit(/** @type {AST.Expression} */ (attr.value), {
											...state,
											metadata,
										})
									);

						if (attr.name.name === 'children') {
							children_prop = b.prop(
								'init',
								b.id('children'),
								b.call('_$_.normalize_children', property),
							);
							props.push(children_prop);
							continue;
						}

						props.push(b.prop('init', b.key(attr.name.name), property));
					}
				} else if (attr.type === 'SpreadAttribute') {
					props.push(
						b.spread(
							/** @type {AST.Expression} */ (
								visit(attr.argument, { ...state, metadata: { ...state.metadata } })
							),
						),
					);
				}
			}

			for (const child of node.children) {
				if (is_native_tsrx_function_node(child)) {
					state.init?.push(/** @type {AST.Statement} */ (visit(child, state)));
				}
			}

			const children_filtered = node.children.filter(
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
							...(apply_parent_css_scope ||
							get_component_css(state) ||
							(is_element_dynamic(node) && node.metadata.scoped && get_component_css(state))
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
			const component_name = node.id.type === 'Identifier' ? node.id.name : null;
			const local_metadata = component_name
				? state.component_metadata.find((m) => m.id === component_name)
				: null;
			const comp_id = b.id('comp');
			const args_id = b.id('args');
			const comp_call = b.call('_$_.render_component', comp_id, b.spread(args_id));
			const comp_call_statement = b.stmt(comp_call);

			/** @type {AST.Statement[]} */
			const init = [];
			const visited_id = /** @type {AST.Expression} */ (visit(node.id, state));
			/** @type {AST.Statement[]} */
			const statements = [
				b.const(comp_id, is_element_dynamic(node) ? b.call('_$_.get', visited_id) : visited_id),
				b.const(args_id, b.array(args)),
			];

			if (local_metadata) {
				statements.push(comp_call_statement);
			} else if (!is_element_dynamic(node)) {
				// imported or children
				statements.push(b.if(comp_id, b.block([comp_call_statement])));
			} else {
				// if it's a dynamic element, build the element output
				// and store the results in the `init` array
				visit(
					node,
					/** @type {TransformServerState} */ ({
						...state,
						dynamicElementName: b.template([b.quasi('', false), b.quasi('', false)], [comp_id]),
						init,
					}),
				);

				statements.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))));

				statements.push(
					b.if(
						b.binary('===', b.unary('typeof', comp_id), b.literal('function')),
						b.block([comp_call_statement]),
						// make sure that falsy values for dynamic element or component don't get rendered
						b.if(comp_id, b.block(init)),
					),
				);

				statements.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))));
			}

			state.init?.push(b.block(statements));
		}
	},

	SwitchStatement(node, context) {
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
						state: { ...context.state, scope: consequent_scope },
					}),
				);
				case_body.push(...consequent.body);
			}

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
	},

	ForOfStatement(node, context) {
		if (context.state.regular_js) {
			return context.next();
		}

		if (!is_inside_component(context)) {
			context.next();
			return;
		}
		const body_scope = context.state.scopes.get(node.body);

		context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_OPEN))));

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
				/** @type {AST.VariableDeclaration} */ (context.visit(node.left)),
				/** @type {AST.Expression} */
				(context.visit(node.right)),
				b.block(body),
			),
		);

		context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))));
	},

	IfStatement(node, context) {
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

		if (node.metadata?.has_continue && !node.metadata?.has_template && !node.alternate) {
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
					state: { ...context.state, scope: alternate_scope },
				}),
			);
		}

		context.state.init?.push(
			b.if(/** @type {AST.Expression} */ (context.visit(node.test)), consequent, alternate),
		);

		context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(BLOCK_CLOSE))));
	},

	ReturnStatement(node, context) {
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
		const info = context.state.return_flags?.get(node);
		if (info) {
			return b.stmt(b.assignment('=', b.id(info.name), b.true));
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
				const right = /** @type {AST.Expression} */ (context.visit(node.right));
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
					right: /** @type {AST.Expression} */ (context.visit(node.right)),
				};
			}
		}

		// Handle lazy binding assignments (e.g., a = 5 where a is from let &{a} = obj)
		if (left.type === 'Identifier') {
			const binding = context.state.scope?.get(left.name);
			if (binding?.transform?.assign && binding.node !== left) {
				let value = /** @type {AST.Expression} */ (context.visit(node.right));

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
			right: /** @type {AST.Expression} */ (context.visit(node.right)),
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
			return /** @type {any} */ (transform_server_module_import(node));
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
			for (const spec of node.specifiers) {
				const original_name = spec.local.name;
				const name = obfuscateIdentifier(original_name);
				spec.local = b.id(name);
				locals.push(b.const(original_name, b.id(name)));
			}
			state.imports.add(node);
			return b.empty;
		}

		return /** @type {AST.ImportDeclaration} */ ({
			...node,
			specifiers: node.specifiers
				.filter((spec) => /** @type {AST.ImportSpecifier} */ (spec).importKind !== 'type')
				.map((spec) => context.visit(spec)),
		});
	},

	TryStatement(node, context) {
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
			if (handler.param) {
				delete handler.param.typeAnnotation;
			}

			/** @type {AST.Statement | null} */
			let reset = null;
			if (handler.resetParam) {
				delete handler.resetParam.typeAnnotation;

				reset = b.const(
					handler.resetParam.type === 'AssignmentPattern'
						? /** @type {AST.Identifier} */ (handler.resetParam.left).name
						: /** @type {AST.Identifier} */ (handler.resetParam).name,
					b.id('_$_.noop'),
				);
			}

			catch_fn = b.arrow(
				[handler.param || b.id('error')],
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
	},

	TSRXExpression(node, context) {
		const { visit, state } = context;
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

	Text(node, { visit, state }) {
		let expression = /** @type {AST.Expression} */ (visit(node.expression, state));

		if (expression.type === 'Literal') {
			state.init?.push(
				b.stmt(b.call(b.id('_$_.output_push'), b.literal(escape(expression.value)))),
			);
		} else {
			state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.call('_$_.escape', expression))));
		}
	},

	TsrxFragment(node, { visit, state }) {
		const children = node.children.filter(
			(child) => child != null && child.type !== 'EmptyStatement',
		);
		apply_tsrx_css_scoping(children, state);

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

		if (state.template_child) {
			// Template body: push children statements inline
			if (init.length > 0) {
				state.init?.push(b.block(init));
			}
		} else {
			// Expression context: return tsrx_element(render_fn)
			const render_fn = b.arrow([], b.block(init));
			return b.call('_$_.tsrx_element', render_fn);
		}
	},

	ScriptContent(node, context) {
		context.state.init?.push(b.stmt(b.call(b.id('_$_.output_push'), b.literal(node.content))));
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

	// Register each stylesheet's CSS so the runtime can serialize it
	if (css) {
		for (const stylesheet of state.stylesheets) {
			const css_for_component = renderStylesheets([stylesheet]);
			/** @type {AST.Program} */ (program).body.push(
				b.stmt(
					b.call('_$_.register_css', b.literal(stylesheet.hash), b.literal(css_for_component)),
				),
			);
		}
	}

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

	program.body = body;

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
