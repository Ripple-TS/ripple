/**
@import * as AST from 'estree';
@import * as ESTreeJSX from 'estree-jsx';
@import { RawSourceMap } from 'source-map';
@import {
	AnalysisResult,
	TransformClientContext,
	VisitorClientContext,
	TransformClientState,
	ScopeInterface,
	Visitor,
	Visitors,
	Binding,
}	from '../../../types/index';
@import { CompileError } from '../../../types/index';
@import { RequiredPresent } from '@tsrx/core/types/helpers';
 */

/**
@typedef {Map<number, {offset: number, delta: number}>} PostProcessingChanges;
@typedef {number[]} LineOffsets;
*/

import { walk } from 'zimmerframe';
import path from 'node:path';
import { print } from 'esrap';
import tsx from 'esrap/languages/tsx';
import {
	builders,
	clone_expression_node,
	analyzeCss,
	IS_CONTROLLED,
	IS_INDEXED,
	ROOT_CONTROLLED,
	TEMPLATE_FRAGMENT,
	TEMPLATE_SVG_NAMESPACE,
	TEMPLATE_MATHML_NAMESPACE,
	DEFAULT_NAMESPACE,
	sanitizeTemplateString,
	SERVER_IDENTIFIER,
	obfuscateIdentifier,
	object,
	renderCssResult,
	prepareStylesheetForRender,
	collectStyleRefAttributes,
	createStyleClassMap,
	createStyleClassMapFromStylesheet,
	createStyleRefSetupStatements,
	getStyleElementStylesheet,
	getOriginalEventName,
	isEventAttribute,
	isEmptyJsxFragment as is_empty_jsx_fragment,
	isInsideComponent as is_inside_component,
	normalizeEventName,
	shouldPreserveComment,
	formatComment,
	setLocation,
	createElementRefTargetTypeForName as create_element_ref_target_type_for_name,
	wrapEdgeWhitespace as wrap_edge_whitespace,
	isTemplateValuePosition,
} from '@tsrx/core';
const b = builders;
import {
	build_assignment,
	visit_assignment_expression,
	escape_html,
	is_boolean_attribute,
	is_dom_property,
	is_declared_function_within_component,
	is_inside_call_expression,
	unwrap_single_return_iife,
	is_value_static,
	is_void_element,
	is_element_dom_element,
	is_ripple_track_call,
	normalize_children,
	build_getter,
	determine_namespace_for_children,
	index_to_key,
	is_children_template_expression,
	is_inside_left_side_assignment,
	strong_hash,
	flatten_switch_consequent,
	get_ripple_namespace_call_name,
	is_ripple_import,
	replace_lazy_param_pattern,
	ripple_import_requires_block,
	strip_class_typescript_syntax,
	strip_typescript_expression_wrappers,
	visit_children_without,
	adopt_raw_template_jsx,
	build_index_read,
	build_index_write,
	build_index_update,
	create_native_tsrx_render_function,
	get_native_tsrx_function_body,
	get_indexed_reactive_target,
	is_native_tsrx_function_node,
	is_static_native_tsrx_function_call,
	is_native_tsrx_template_node,
	is_code_block_function_body,
	is_tsrx_component_function,
	is_style_element,
	dynamic_element_import_local,
	lower_dynamic_element,
	rewrite_lazy_member_base,
	strip_tsrx_style_elements,
	wrap_code_block_in_iife,
	visit_directive_wrapping_values,
	get_code_block_render,
	get_code_block_template_child,
	lower_code_block_children,
} from '../../utils.js';
import {
	get_attribute_name,
	get_attribute_name_node,
	get_attribute_value,
	get_element_attributes,
	get_element_id,
	get_element_identifier,
	get_style_css,
	get_template_expression,
	get_template_text_value,
	is_dynamic_element,
	is_empty_expression_container,
	is_expression_attribute,
	is_self_closing,
	is_template_element,
	is_template_directive,
	is_template_expression,
	is_template_fragment,
	is_template_text,
	is_template_text_or_expression,
} from '../../template-ast.js';
import is_reference from 'is-reference';

/**
 * @param {TransformClientState} state
 * @returns {AST.CSS.StyleSheet | null}
 */
function get_component_css(state) {
	return state.component?.metadata.component_css ?? null;
}

/**
 * @param {TransformClientState} state
 * @returns {string | null}
 */
function get_component_css_hash(state) {
	return get_component_css(state)?.hash ?? null;
}

/**
 * @param {ESTreeJSX.JSXElement | AST.JSXStyleElement} node
 * @param {TransformClientContext} context
 * @returns {AST.ObjectExpression | null}
 */
function build_style_class_map_expression(node, context) {
	const stylesheet = getStyleElementStylesheet(node);
	if (!stylesheet) {
		return null;
	}

	analyzeCss(stylesheet);
	context.state.stylesheets.push(prepareStylesheetForRender(stylesheet, true));
	const class_map = createStyleClassMapFromStylesheet(stylesheet);
	if (!context.state.to_ts) {
		return class_map;
	}

	add_type_only_style_anchor(node, context);
	return class_map;
}

/**
 * @param {ESTreeJSX.JSXElement | AST.JSXStyleElement} node
 * @param {TransformClientContext} context
 * @returns {void}
 */
function add_type_only_style_anchor(node, context) {
	const style_anchor = b.jsx_element(clone_expression_node(node, true), [], []);
	disable_style_anchor_verification(style_anchor);

	const anchor_id = b.id(context.state.scope.generate('style_anchor'));
	context.state.hoisted.push(b.const(anchor_id, style_anchor), b.stmt(b.id(anchor_id.name)));
}

/**
 * @param {AST.TSRXJSXElement} element
 */
function disable_style_anchor_verification(element) {
	if (element.openingElement?.name) {
		element.openingElement.name.metadata = {
			...(element.openingElement.name.metadata || {}),
			disable_verification: true,
		};
	}
	if (element.closingElement?.name) {
		element.closingElement.name.metadata = {
			...(element.closingElement.name.metadata || {}),
			disable_verification: true,
		};
	}
}

/**
 * Copy-on-write: nodes on the changed spine are rebuilt (their scope mapping is
 * mirrored onto the copies); untouched subtrees are shared with the input.
 * @param {AST.Node[]} body
 * @param {AST.Statement[]} setup
 * @param {Map<AST.Node | AST.Node[], ScopeInterface>} [scopes]
 * @returns {AST.Node[]}
 */
function insert_style_ref_setup_statements(body, setup, scopes) {
	if (setup.length === 0) {
		return body;
	}

	let inserted = false;

	/**
	 * @template {AST.Node | AST.Node[]} T
	 * @param {T} original
	 * @param {T} copy
	 * @returns {T}
	 */
	const mirror_scope = (original, copy) => {
		const scope = scopes?.get(original);
		if (scope) scopes?.set(copy, scope);
		return copy;
	};

	/** @param {AST.Node[]} nodes */
	const insert_in_list = (nodes) => {
		const index = nodes.findIndex((node) => node.metadata?.returned_tsrx_child);
		if (index !== -1) {
			inserted = true;
			return mirror_scope(nodes, [
				...nodes.slice(0, index),
				...setup.map((statement) => clone_expression_node(statement, false)),
				...nodes.slice(index),
			]);
		}

		/** @type {AST.Node[] | null} */
		let out = null;
		for (let i = 0; i < nodes.length; i++) {
			const next = insert_in_statement(nodes[i]);
			if (next !== nodes[i]) {
				out ??= nodes.slice();
				out[i] = next;
			}
		}
		return out === null ? nodes : mirror_scope(nodes, out);
	};

	/** @param {AST.Node} node */
	const insert_in_statement = (node) => {
		if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
			return node;
		}
		if (node.type === 'BlockStatement') {
			const list = node.body || [];
			const node_body = /** @type {AST.Statement[]} */ (insert_in_list(list));
			return node_body === list ? node : mirror_scope(node, { ...node, body: node_body });
		}
		if (node.type === 'IfStatement') {
			/** @type {{ consequent?: AST.Statement; alternate?: AST.Statement } | null} */
			let updates = null;
			const consequent = /** @type {AST.Statement} */ (insert_in_statement(node.consequent));
			if (consequent !== node.consequent) (updates ??= {}).consequent = consequent;
			if (node.alternate) {
				const alternate = /** @type {AST.Statement} */ (insert_in_statement(node.alternate));
				if (alternate !== node.alternate) (updates ??= {}).alternate = alternate;
			}
			return updates === null ? node : mirror_scope(node, { ...node, ...updates });
		}
		if (node.type === 'SwitchStatement') {
			const node_cases = node.cases || [];
			/** @type {AST.SwitchCase[] | null} */
			let cases = null;
			for (let i = 0; i < node_cases.length; i++) {
				const switch_case = node_cases[i];
				const list = switch_case.consequent || [];
				const consequent = /** @type {AST.Statement[]} */ (insert_in_list(list));
				if (consequent !== list) {
					cases ??= node_cases.slice();
					cases[i] = mirror_scope(switch_case, { ...switch_case, consequent });
				}
			}
			return cases === null ? node : mirror_scope(node, { ...node, cases });
		}
		if (node.type === 'TryStatement') {
			/** @type {{ block?: AST.BlockStatement; handler?: AST.CatchClause; finalizer?: AST.BlockStatement } | null} */
			let updates = null;
			const block = /** @type {AST.BlockStatement} */ (insert_in_statement(node.block));
			if (block !== node.block) (updates ??= {}).block = block;
			if (node.handler?.body) {
				const handler_body = /** @type {AST.BlockStatement} */ (
					insert_in_statement(node.handler.body)
				);
				if (handler_body !== node.handler.body) {
					(updates ??= {}).handler = mirror_scope(node.handler, {
						...node.handler,
						body: handler_body,
					});
				}
			}
			if (node.finalizer) {
				const finalizer = /** @type {AST.BlockStatement} */ (insert_in_statement(node.finalizer));
				if (finalizer !== node.finalizer) (updates ??= {}).finalizer = finalizer;
			}
			return updates === null ? node : mirror_scope(node, { ...node, ...updates });
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
 * @param {AST.TypeNode | undefined | null} type_annotation
 * @returns {AST.TypeNode | undefined}
 */
function unwrap_type_annotation(type_annotation) {
	/** @type {AST.TypeNode | undefined | null} */
	let annotation = type_annotation;

	while (annotation) {
		if (annotation.type === 'TSTypeAnnotation') {
			annotation = annotation.typeAnnotation;
			continue;
		}
		if (annotation.type === 'TSParenthesizedType') {
			annotation = annotation.typeAnnotation;
			continue;
		}
		break;
	}

	return annotation ?? undefined;
}

/**
 * @param {AST.TypeNode | undefined | null} type_annotation
 * @returns {boolean}
 */
function is_string_type_annotation(type_annotation) {
	const annotation = unwrap_type_annotation(type_annotation);
	if (!annotation) return false;

	if (annotation.type === 'TSStringKeyword') return true;
	if (annotation.type === 'TSLiteralType' && annotation.literal.type === 'Literal') {
		return typeof annotation.literal.value === 'string';
	}
	if (annotation.type === 'TSUnionType') {
		return annotation.types.every((type) => is_string_type_annotation(type));
	}

	return false;
}

/**
 * @param {AST.TypeNode | undefined | null} type_annotation
 * @param {string} property_name
 * @returns {AST.TypeNode | undefined}
 */
function get_property_type_annotation(type_annotation, property_name) {
	const annotation = unwrap_type_annotation(type_annotation);

	if (annotation?.type === 'TSIntersectionType') {
		for (const type of annotation.types) {
			const property_type = get_property_type_annotation(type, property_name);
			if (property_type) return property_type;
		}
		return undefined;
	}

	if (annotation?.type !== 'TSTypeLiteral') {
		return undefined;
	}

	for (const member of annotation.members) {
		if (member.type !== 'TSPropertySignature' || member.computed) continue;

		const key = member.key;
		const name =
			key.type === 'Identifier'
				? key.name
				: key.type === 'Literal' && typeof key.value === 'string'
					? key.value
					: null;

		if (name === property_name) {
			return member.typeAnnotation?.typeAnnotation;
		}
	}

	return undefined;
}

/**
 * @param {Binding | null | undefined} binding
 * @returns {AST.TypeNode | undefined}
 */
function get_binding_type_annotation(binding) {
	const node = binding?.node;
	if (!node) return undefined;

	return (
		/** @type {{ typeAnnotation?: AST.TSTypeAnnotation | AST.TypeNode }} */ (binding.metadata ?? {})
			.typeAnnotation ??
		/** @type {{ typeAnnotation?: AST.TSTypeAnnotation }} */ (node).typeAnnotation?.typeAnnotation
	);
}

/**
 * @param {AST.Expression} expression
 * @returns {string | null}
 */
function get_static_property_name(expression) {
	if (expression.type !== 'MemberExpression' || expression.property.type === 'PrivateIdentifier') {
		return null;
	}

	if (!expression.computed && expression.property.type === 'Identifier') {
		return expression.property.name;
	}

	if (
		expression.computed &&
		expression.property.type === 'Literal' &&
		typeof expression.property.value === 'string'
	) {
		return expression.property.value;
	}

	return null;
}

/**
 * @param {AST.Expression | AST.Pattern} expression
 * @returns {boolean}
 */
function is_string_literal_expression(expression) {
	return expression.type === 'Literal' && typeof expression.value === 'string';
}

/**
 * @param {AST.Expression} expression
 * @param {TransformClientState} state
 * @param {Set<Binding>} [visited]
 * @returns {boolean}
 */
function is_stringish_expression(expression, state, visited = new Set()) {
	if (expression.type === 'ParenthesizedExpression' || expression.type === 'ChainExpression') {
		return is_stringish_expression(
			/** @type {AST.Expression} */ (expression.expression),
			state,
			visited,
		);
	}

	if (expression.type === 'TSAsExpression' || expression.type === 'TSTypeAssertion') {
		return (
			is_string_type_annotation(expression.typeAnnotation) ||
			is_stringish_expression(/** @type {AST.Expression} */ (expression.expression), state, visited)
		);
	}

	if (
		expression.type === 'TSNonNullExpression' ||
		expression.type === 'TSInstantiationExpression'
	) {
		return is_stringish_expression(
			/** @type {AST.Expression} */ (expression.expression),
			state,
			visited,
		);
	}

	if (is_string_literal_expression(expression) || expression.type === 'TemplateLiteral') {
		return true;
	}

	if (
		expression.type === 'CallExpression' &&
		expression.callee.type === 'Identifier' &&
		expression.callee.name === 'String'
	) {
		return true;
	}

	if (expression.type === 'BinaryExpression' && expression.operator === '+') {
		const left = /** @type {AST.Expression} */ (expression.left);
		const right = /** @type {AST.Expression} */ (expression.right);
		// `string + anything` (and `anything + string`) always evaluates to a
		// string in JS, so one provably-stringish operand is enough — the result
		// can never be an element or collection. (String literals are stringish,
		// so this subsumes the literal-operand cases.)
		return (
			is_stringish_expression(left, state, visited) ||
			is_stringish_expression(right, state, visited)
		);
	}

	if (expression.type === 'ConditionalExpression') {
		return (
			is_stringish_expression(expression.consequent, state, visited) &&
			is_stringish_expression(expression.alternate, state, visited)
		);
	}

	if (expression.type === 'Identifier') {
		const binding = state.scope.get(expression.name);
		if (!binding || binding.node === expression || visited.has(binding)) {
			return false;
		}
		if (is_string_type_annotation(get_binding_type_annotation(binding))) {
			return true;
		}
		if (binding.initial && !binding.reassigned && !binding.mutated && !binding.updated) {
			visited.add(binding);
			return is_stringish_expression(
				/** @type {AST.Expression} */ (binding.initial),
				state,
				visited,
			);
		}
		return false;
	}

	if (expression.type === 'MemberExpression' && expression.object.type === 'Identifier') {
		const property_name = get_static_property_name(expression);
		if (property_name === null) return false;

		const binding = state.scope.get(expression.object.name);
		const property_type = get_property_type_annotation(
			get_binding_type_annotation(binding),
			property_name,
		);
		return is_string_type_annotation(property_type);
	}

	return false;
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
 * @param {string} filename
 * @param {string} imported_name
 * @returns {AST.FunctionExpression}
 */
function create_server_rpc_stub(filename, imported_name) {
	const func_hash = strong_hash(filename + '#' + imported_name);
	return b.function(
		null,
		[b.rest(b.id('args'))],
		b.block([b.return(b.call('_$_.rpc', b.literal(func_hash), b.id('args')))]),
	);
}

/**
 * @param {AST.ImportDeclaration} node
 * @param {TransformClientState} state
 * @returns {AST.Statement[]}
 */
function transform_server_module_import(node, state) {
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
			SERVER_IDENTIFIER,
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
		const init = state.to_ts
			? b.member(server_identifier, imported_identifier)
			: create_server_rpc_stub(state.filename, imported_name);
		declarations.push(b.const(local_identifier, init));
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
 *
 * @param {AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression} node
 * @param {TransformClientContext} context
 */
function visit_function(node, context) {
	// Function overload signatures don't have a body - they're TypeScript-only
	// Remove them when compiling to JavaScript
	if (!context.state.to_ts && !node.body) {
		return b.empty;
	}

	if (is_tsrx_component_function(node)) {
		return transform_native_tsrx_function(node, context);
	}

	const state = context.state;
	const metadata = /** @type {AST.FunctionExpression['metadata']} */ (node.metadata);

	if (context.state.to_ts) {
		return context.next(SetStateForOutsideComponent(state));
	}

	// Strip parameter type annotations via copies (the source params are never
	// mutated) and replace lazy destructuring params with generated identifiers
	const transformed_params = node.params.map((param) => {
		/** @type {AST.Pattern} */
		let param_out = param.typeAnnotation ? { ...param, typeAnnotation: undefined } : param;
		// Handle AssignmentPattern (parameters with default values)
		if (param_out.type === 'AssignmentPattern' && param_out.left?.typeAnnotation) {
			param_out = { ...param_out, left: { ...param_out.left, typeAnnotation: undefined } };
		}
		const pattern = param_out.type === 'AssignmentPattern' ? param_out.left : param_out;
		if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
			const transformed_pattern = replace_lazy_param_pattern(pattern);
			if (param_out.type === 'AssignmentPattern') {
				return /** @type {AST.AssignmentPattern} */ ({ ...param_out, left: transformed_pattern });
			}
			return transformed_pattern;
		}
		return param_out;
	});

	let body = /** @type {AST.BlockStatement | AST.Expression} */ (
		context.visit(
			node.body,
			SetStateForOutsideComponent(state, {
				// we are new context so tracking no longer applies
				metadata: { ...state.metadata, tracking: false },
				component: undefined,
				flush_node: null,
				template: null,
				jsx_to_tsrx_element: true,
			}),
		)
	);

	if (
		metadata?.tracked === true &&
		!is_inside_component(context, true) &&
		body.type === 'BlockStatement'
	) {
		body = { ...body, body: [b.var('__block', b.call('_$_.scope')), ...body.body] };
	}

	return {
		...node,
		params: transformed_params.map((param) => context.visit(param, state)),
		body,
		returnType: undefined,
		typeParameters: undefined,
	};
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
 * @param {TransformClientContext} context
 * @returns {AST.Function | AST.Expression | AST.EmptyStatement}
 */
function transform_native_tsrx_function(node, context) {
	node.metadata.native_tsrx_function = true;
	let prop_statements;
	const metadata = {};
	const is_tsrx_element = context.state.is_tsrx_element;

	if (context.state.to_ts) {
		const body =
			node.body?.type === 'BlockStatement'
				? /** @type {AST.BlockStatement} */ (
						context.visit(node.body, { ...context.state, component: node, metadata })
					)
				: /** @type {AST.Expression} */ (
						context.visit(node.body, { ...context.state, component: node, metadata })
					);
		const params = node.params.map(
			(param) =>
				/** @type {AST.Pattern} */ (
					context.visit(param, { ...context.state, component: node, metadata })
				),
		);
		if (node.type === 'ArrowFunctionExpression') {
			return { ...node, params, body };
		}
		return { ...node, params, body: /** @type {AST.BlockStatement} */ (body) };
	}

	/** @type {AST.Pattern} */
	let props = b.id('__props');

	if (node.params.length > 0) {
		let props_param = node.params[0];

		if (props_param.type === 'Identifier') {
			props = props_param.typeAnnotation
				? /** @type {AST.Pattern} */ ({ ...props_param, typeAnnotation: undefined })
				: props_param;
		} else if (props_param.type === 'ObjectPattern' || props_param.type === 'ArrayPattern') {
			if (!props_param.lazy) {
				props = replace_lazy_param_pattern(
					/** @type {AST.Pattern} */ (
						props_param.typeAnnotation ? { ...props_param, typeAnnotation: undefined } : props_param
					),
				);
			}
		} else {
			props = props_param;
		}
	}

	const render_scope_node = get_native_tsrx_return_template_node(
		node.body,
		node.type === 'ArrowFunctionExpression' && node.body?.type !== 'BlockStatement',
	);
	const component_scope =
		(render_scope_node && context.state.scopes.get(render_scope_node)) ||
		context.state.scopes.get(node) ||
		context.state.scope;
	const node_id = node.type !== 'ArrowFunctionExpression' ? (node.id ?? null) : null;
	const is_synthetic_children = node.metadata?.synthetic_children === true;
	const raw_render_body = get_native_tsrx_function_body(node, context.state.scopes);
	const css = get_component_css({ ...context.state, component: node });
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
	const transformed_body = transform_body(render_body, {
		...context,
		state: {
			...context.state,
			flush_node: null,
			// A synthetic children render arrow is itself a tsrx_element render
			// context, so it inherits the enclosing component. When the enclosing
			// function is a `function C() { return <jsx> }` component (transformed
			// via the generic function path, which never sets `component`), there is
			// no component to inherit. Fall back to this arrow as the component
			// boundary so directive-branch elements in statement position are not
			// misread as out-of-component template statements and double-wrapped.
			component: is_synthetic_children ? (context.state.component ?? node) : node,
			metadata,
			scope: component_scope,
			is_tsrx_element: false,
			regular_js: false,
			applyParentCssScope: is_synthetic_children ? context.state.applyParentCssScope : undefined,
		},
	});

	if (css) {
		context.state.stylesheets.push(css);
	}

	const value_params = [...node.params];
	if (value_params.length > 0) {
		value_params[0] = props;
	}
	const params = is_tsrx_element ? [b.id('__anchor'), b.id('__block')] : value_params;
	const component_body = is_tsrx_element
		? b.block([...(prop_statements ?? []), ...transformed_body])
		: b.block([
				b.return(
					b.call(
						'_$_.tsrx_element',
						b.arrow(
							[b.id('__anchor'), b.id('__block')],
							b.block([...(prop_statements ?? []), ...transformed_body]),
						),
					),
				),
			]);
	const func =
		node.type === 'FunctionDeclaration' && node_id
			? b.function(node_id, params, component_body)
			: node.type === 'ArrowFunctionExpression'
				? b.arrow(params, component_body)
				: b.function(node_id, params, component_body);

	func.metadata.native_tsrx_function = true;

	return func;
}

/**
 * @param {ESTreeJSX.JSXElement} node
 * @param {number} index
 * @param {TransformClientContext} context
 */
function visit_head_element(node, index, context) {
	const { state, visit } = context;

	/** @type {TransformClientState['init']} */
	const init = [];
	/** @type {TransformClientState['update']} */
	const update = [];
	/** @type {TransformClientState['final']} */
	const final = [];
	/** @type {TransformClientState['template']} */
	const template = [];

	transform_children(
		/** @type {AST.Node[]} */ (node.children),
		/** @type {VisitorClientContext} */ ({
			visit,
			state: { ...state, init, update, final, template, inside_head: true },
			root: true,
		}),
	);

	if (init.length > 0 || update.length > 0 || final.length > 0) {
		// Generate a hash for this head element based on filename and index
		// Use both filename and index to ensure uniqueness across multiple head blocks
		const hash_source = `${state.filename}:head:${index}:${node.start ?? 0}`;
		const hash_value = strong_hash(hash_source);

		context.state.init?.push(
			b.stmt(
				b.call(
					'_$_.head',
					b.literal(hash_value),
					b.arrow(
						[b.id('__anchor')],
						b.block([
							...init,
							.../** @type {AST.Statement[]} */ (update.map((u) => u.operation())),
							...final,
						]),
					),
				),
			),
		);
	}
}

/**
 * @param {NonNullable<TransformClientState['init']>} init
 * @param {NonNullable<TransformClientState['update']>} update
 * @param {TransformClientState} state
 */
function apply_updates(init, update, state) {
	if (update.length === 1 && !update[0].needsPrevTracking) {
		init.push(
			b.stmt(
				b.call(
					'_$_.render',
					b.thunk(
						b.block(
							update.map((u) => {
								if (u.initial) {
									return u.operation(u.expression);
								}
								return u.operation();
							}),
						),
					),
				),
			),
		);
	} else {
		/** @type {AST.Property[]} */
		const initial = [];
		/** @type {AST.Statement[]} */
		const render_statements = [];
		let index = 0;

		/**
			@type {
				Map<
					AST.Identifier | AST.Expression,
					RequiredPresent<
						NonNullable<TransformClientState['update']>[number],
						'initial' | 'identity' | 'expression'
					>[]
				>
			}
		 */
		const grouped_updates = new Map();

		for (const u of update) {
			if (u.initial) {
				const id = /** @type {AST.Identifier | AST.Expression} */ (
					u.identity.type === 'Identifier'
						? /** @type {Binding} */ (state.scope.get(u.identity.name)).node
						: u.identity
				);
				let updates = grouped_updates.get(id);

				if (updates === undefined) {
					updates = [];
					grouped_updates.set(id, updates);
				}
				updates.push(u);
			}
		}

		for (const [, updates] of grouped_updates) {
			if (updates.length === 1) {
				const u = updates[0];
				const key = index_to_key(index);
				initial.push(b.prop('init', b.id(key), u.initial));
				render_statements.push(
					b.var('__' + key, u.expression),
					b.if(
						b.binary('!==', b.member(b.id('__prev'), b.id(key)), b.id('__' + key)),
						b.block(
							u.needsPrevTracking
								? [
										u.operation(b.id('__' + key), b.member(b.id('__prev'), b.id(key))),
										b.stmt(
											b.assignment('=', b.member(b.id('__prev'), b.id(key)), b.id('__' + key)),
										),
									]
								: [
										u.operation(
											b.assignment('=', b.member(b.id('__prev'), b.id(key)), b.id('__' + key)),
										),
									],
						),
					),
				);
				index++;
			} else {
				const key = index_to_key(index);
				/** @type {Array<AST.Statement>} */
				const if_body = [];
				initial.push(b.prop('init', b.id(key), updates[0].initial));
				render_statements.push(
					b.var('__' + key, updates[0].expression),
					b.if(
						b.binary('!==', b.member(b.id('__prev'), b.id(key)), b.id('__' + key)),
						b.block(if_body),
					),
				);
				for (const u of updates) {
					if_body.push(
						u.needsPrevTracking
							? u.operation(b.id('__' + key), b.member(b.id('__prev'), b.id(key)))
							: u.operation(b.id('__' + key)),
					);
					index++;
				}
				// Update prev after all operations
				if_body.push(
					b.stmt(b.assignment('=', b.member(b.id('__prev'), b.id(key)), b.id('__' + key))),
				);
			}
		}

		for (const u of update) {
			if (!u.initial && !u.needsPrevTracking) {
				render_statements.push(u.operation());
			}
		}

		init.push(
			b.stmt(
				b.call(
					'_$_.render',
					b.arrow([b.id('__prev')], b.block(render_statements)),
					b.object(initial),
				),
			),
		);
	}
}

/**
 * @param {ESTreeJSX.JSXElement} node
 * @param {TransformClientContext} context
 */
function visit_title_element(node, context) {
	const normalized = normalize_children(/** @type {AST.Node[]} */ (node.children), context);
	const content = /** @type {ESTreeJSX.JSXText | ESTreeJSX.JSXExpressionContainer} */ (
		normalized[0]
	);

	const metadata = { tracking: false };
	const result = /** @type {AST.Expression} */ (
		context.visit(get_template_expression(content, !!context.state.to_ts), {
			...context.state,
			metadata,
		})
	);

	if (metadata.tracking) {
		context.state.init?.push(
			b.stmt(
				b.call(
					'_$_.render',
					b.thunk(b.block([b.stmt(b.assignment('=', b.id('_$_.document.title'), result))])),
				),
			),
		);
	} else {
		context.state.init?.push(b.stmt(b.assignment('=', b.id('_$_.document.title'), result)));
	}
}

/**
 * @param {string} name
 * @param {TransformClientContext} context
 * @param {boolean} [is_obfuscated]
 * @returns {string}
 */
function set_hidden_import_from_ripple(name, context, is_obfuscated = false) {
	if (!is_obfuscated) {
		name = obfuscateIdentifier(name);
	}
	if (!context.state.imports.has(`import { ${name} } from 'ripple/compiler/internal/import'`)) {
		context.state.imports.add(`import { ${name} } from 'ripple/compiler/internal/import'`);
	}

	return name;
}

/**
 * @param {ESTreeJSX.JSXExpressionContainer | AST.Expression} source_argument
 * @param {VisitorClientContext} context
 * @returns {AST.CallExpression}
 */
function create_ref_value_call(source_argument, context) {
	const { state, visit } = context;
	const metadata = { tracking: false };
	const source =
		source_argument.type === 'JSXExpressionContainer'
			? source_argument.expression
			: source_argument;
	let argument;
	let add_setter = true;

	if (source.type === 'ArrayExpression') {
		argument = b.array(
			source.elements.map((/** @type {AST.Expression | AST.SpreadElement | null} */ element) => {
				if (element === null) {
					return null;
				}
				if (element.type === 'SpreadElement') {
					return b.spread(
						/** @type {AST.Expression} */ (
							visit(element.argument, { ...state, flush_node: null, metadata })
						),
					);
				}
				return create_ref_value_call(element, context);
			}),
		);
		add_setter = false;
	} else {
		argument = /** @type {AST.Expression} */ (
			visit(source, { ...state, flush_node: null, metadata })
		);
	}

	/** @type {AST.Expression[]} */
	const args = [b.thunk(argument)];
	if (add_setter) {
		add_ref_setter_arg(args, source, argument);
	}

	const call = b.call(
		state.to_ts ? set_hidden_import_from_ripple('createRefProp', context) : '_$_.create_ref_prop',
		...args,
	);
	if (state.to_ts && state.ref_target_type) {
		call.typeArguments = b.ts_type_parameter_instantiation([state.ref_target_type]);
	}
	return call;
}

/**
 * @param {AST.TSRXJSXElement} node
 * @param {TransformClientState} state
 * @returns {AST.TypeNode | null}
 */
function create_element_ref_target_type(node, state) {
	if (!is_element_dom_element(node)) {
		return null;
	}
	const element_name = /** @type {AST.Identifier} */ (get_element_id(node)).name;
	const namespace =
		element_name === 'svg' ? 'svg' : element_name === 'math' ? 'mathml' : state.namespace;
	return create_element_ref_target_type_for_name(element_name, namespace);
}

/**
 * @param {ESTreeJSX.JSXExpressionContainer | AST.Expression} source_argument
 * @returns {AST.Expression}
 */
function get_ref_source_argument(source_argument) {
	return source_argument.type === 'JSXExpressionContainer'
		? /** @type {AST.Expression} */ (source_argument.expression)
		: source_argument;
}

/**
 * @param {AST.Expression[]} args
 * @param {ESTreeJSX.JSXExpressionContainer | AST.Expression} source_argument
 * @param {AST.Expression} argument
 * @returns {void}
 */
function add_ref_setter_arg(args, source_argument, argument) {
	const source =
		source_argument.type === 'JSXExpressionContainer'
			? source_argument.expression
			: source_argument;
	const arg_type = source?.type;

	if (arg_type === 'Identifier' || arg_type === 'MemberExpression') {
		args.push(
			b.arrow(
				[b.id('v')],
				b.assignment(
					'=',
					/** @type {AST.Pattern} */ (clone_expression_node(argument, false)),
					b.id('v'),
				),
			),
		);
	}
}

/**
 * @param {AST.NodeWithLocation} loc_info
 * @param {number} [start_offset]
 * @param {number} [length]
 * @returns {AST.NodeWithLocation}
 */
function slice_loc_info(loc_info, start_offset = 0, length) {
	if (length === undefined) {
		length = loc_info.end - loc_info.start - start_offset;
	}
	return {
		start: loc_info.start + start_offset,
		end: loc_info.start + start_offset + length,
		loc: {
			start: {
				line: loc_info.loc.start.line,
				column: loc_info.loc.start.column + start_offset,
			},
			end: {
				line: loc_info.loc.start.line,
				column: loc_info.loc.start.column + start_offset + length,
			},
		},
	};
}

/**
 * @param {string | undefined} name
 * @returns {boolean}
 */
function ripple_namespace_requires_block(name) {
	return name !== undefined && ripple_import_requires_block(name);
}

/**
 * @param {AST.TSRXJSXElement} node
 * @param {TransformClientContext | VisitorClientContext} context
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
 * @param {ESTreeJSX.JSXElement | AST.TSRXJSXElement} node
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
 * @param {VisitorClientContext} context
 * @returns {AST.Expression}
 */
function get_attribute_value_expression(attr, context) {
	const value = get_attribute_value(attr);
	if (value === null) {
		return b.literal('');
	}

	return /** @type {AST.Expression} */ (
		context.visit(value, {
			...context.state,
			flush_node: null,
			metadata: { tracking: false },
		})
	);
}

/**
 * @param {AST.Expression} expression
 * @param {AST.Identifier} id
 * @returns {AST.Expression}
 */
function normalize_inner_html_expression(expression, id) {
	return b.logical('??', expression, b.member(id, 'innerHTML'));
}

/**
 * @param {ESTreeJSX.JSXElement | AST.TSRXJSXElement} node
 * @param {VisitorClientContext} context
 * @returns {void}
 */
function visit_ripple_fragment_element(node, context) {
	const { state, visit } = context;
	const inner_html = get_inner_html_attribute(node);

	if (inner_html !== null) {
		state.template?.push('<!>');
		const id = state.flush_node?.(false);
		const expression = get_attribute_value_expression(inner_html, context);

		state.update?.push({
			operation: () =>
				b.stmt(
					b.call(
						'_$_.html',
						id,
						b.thunk(expression),
						state.namespace === 'svg' && b.true,
						state.namespace === 'mathml' && b.true,
					),
				),
		});
		return;
	}

	transform_children(
		/** @type {AST.Node[]} */ (node.children),
		/** @type {VisitorClientContext} */ ({
			visit,
			state,
			root: false,
		}),
	);
}

/**
 * @param {TransformClientContext} context
 * @param {Partial<TransformClientState>} [more_state]
 * @return TransformClientContext
 */
function SetContextForOutsideComponent(context, more_state = {}) {
	return /** @type {TransformClientContext} */ ({
		...context,
		state: SetStateForOutsideComponent(context.state, more_state),
	});
}

/**
 * @param {TransformClientState} state
 * @param {Partial<TransformClientState>} [more_state]
 * @return TransformClientState
 */
function SetStateForOutsideComponent(state, more_state = {}) {
	return /** @type {TransformClientState} */ ({
		...state,
		...more_state,
		init: null,
		update: null,
		final: null,
	});
}

/**
 * @param {AST.TSRXJSXElement | AST.TSRXJSXFragment} node
 * @param {TransformClientContext} context
 * @returns {AST.CallExpression}
 */
function build_jsx_to_tsrx_element(node, context) {
	const { state, visit, path } = context;
	const result = adopt_raw_template_jsx(/** @type {AST.Node} */ (node));
	const converted = Array.isArray(result) ? result : [result];
	/** @type {AST.Node[]} */
	const children = converted.filter((child) => child != null && child.type !== 'EmptyStatement');

	const children_component = create_native_tsrx_render_function(
		[],
		children,
		/** @type {AST.Node} */ (node),
	);

	return b.call(
		'_$_.tsrx_element',
		/** @type {AST.Expression} */ (
			visit(children_component, {
				...state,
				flush_node: null,
				regular_js: false,
				namespace: state.namespace,
				is_tsrx_element: true,
				jsx_to_tsrx_element: true,
			})
		),
	);
}

/**
 * Shared by the plain statement and the `@`-directive forms.
 * @type {Visitor<AST.SwitchStatement | AST.JSXSwitchExpression, TransformClientState, AST.Node>}
 */
const visit_switch_statement = (node, context) => {
	if (context.state.regular_js) {
		return context.next();
	}

	if (!is_inside_component(context)) {
		if (context.state.to_ts) {
			return transform_ts_child(node, SetContextForOutsideComponent(context));
		}

		return context.next();
	}

	const root_controlled = node.metadata?.root_controlled === true;
	if (!root_controlled) {
		context.state.template?.push('<!>');
	}

	const id = root_controlled ? b.id('__anchor') : context.state.flush_node?.();
	const statements = [];
	const cases = [];

	let id_gen = 0;
	let counter = 0;
	for (const switch_case of node.cases) {
		const case_body = [];
		const consequent = switch_case.consequent;

		if (consequent.length !== 0) {
			const flattened_consequent = flatten_switch_consequent(consequent);
			const consequent_scope = context.state.scopes.get(consequent) || context.state.scope;

			const block = transform_body(flattened_consequent, {
				...context,
				state: { ...context.state, scope: consequent_scope, flush_node: null },
			});
			const is_default = switch_case.test == null;
			const consequent_id = context.state.scope.generate(
				'switch_case_' + (is_default ? 'default' : id_gen),
			);

			statements.push(b.var(b.id(consequent_id), b.arrow([b.id('__anchor')], b.block(block))));
			case_body.push(
				b.stmt(b.call(b.member(b.id('result'), b.id('push'), false), b.id(consequent_id))),
			);
			id_gen++;
		}
		case_body.push(b.return(b.id('result')));

		counter++;

		cases.push(
			b.switch_case(
				switch_case.test ? /** @type {AST.Expression} */ (context.visit(switch_case.test)) : null,
				case_body,
			),
		);
	}

	statements.push(
		b.stmt(
			b.call(
				'_$_.switch',
				id,
				b.thunk(
					b.block([
						b.var(b.id('result'), b.array([])),
						b.switch(/** @type {AST.Expression} */ (context.visit(node.discriminant)), cases),
					]),
				),
				root_controlled ? b.true : undefined,
			),
		),
	);

	context.state.init?.push(b.block(statements));
};

/**
 * Shared by the plain statement and the `@`-directive forms.
 * @type {Visitor<AST.IfStatement | AST.JSXIfExpression, TransformClientState, AST.Node>}
 */
const visit_if_statement = (node, context) => {
	if (context.state.regular_js || node.metadata?.regular_js) {
		return context.next({ ...context.state, regular_js: true });
	}

	if (context.state.to_ts) {
		return transform_ts_child(node, context);
	}

	if (!is_inside_component(context)) {
		return context.next();
	}

	if (
		(node.metadata?.script_only || node.metadata?.has_continue) &&
		!node.metadata?.has_template &&
		!node.alternate
	) {
		const consequent_scope =
			/** @type {ScopeInterface} */ (context.state.scopes.get(node.consequent)) ||
			context.state.scope;
		const consequent_body =
			node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
		const continue_index = find_top_level_continue_index(consequent_body);
		const consequent_statements =
			continue_index === -1
				? transform_body(consequent_body, {
						...context,
						state: { ...context.state, flush_node: null, scope: consequent_scope },
					})
				: transform_continue_consequent_body(consequent_body, {
						...context,
						state: { ...context.state, flush_node: null, scope: consequent_scope },
					});
		const consequent = b.block(consequent_statements);

		context.state.init?.push(
			b.if(
				/** @type {AST.Expression} */ (
					context.visit(node.test, {
						...context.state,
						metadata: { ...context.state.metadata },
					})
				),
				consequent,
			),
		);
		return;
	}

	const root_controlled = node.metadata?.root_controlled === true;
	if (!root_controlled) {
		context.state.template?.push('<!>');
	}

	const id = root_controlled ? b.id('__anchor') : context.state.flush_node?.();
	const statements = [];

	const consequent_scope =
		/** @type {ScopeInterface} */ (context.state.scopes.get(node.consequent)) ||
		context.state.scope;
	const consequent_body =
		node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
	const consequent = b.block(
		transform_body(consequent_body, {
			...context,
			state: { ...context.state, flush_node: null, scope: consequent_scope },
		}),
	);
	const consequent_id = context.state.scope.generate('consequent');

	statements.push(b.var(b.id(consequent_id), b.arrow([b.id('__anchor')], consequent)));

	let alternate_id;

	if (node.alternate !== null) {
		const alternate = /** @type {AST.Statement} */ (node.alternate);
		const alternate_scope = context.state.scopes.get(alternate) || context.state.scope;
		/** @type {AST.Node[]} */
		let alternate_body =
			alternate.type === 'IfStatement'
				? [alternate]
				: alternate.type === 'BlockStatement'
					? alternate.body
					: [alternate];
		const alternate_block = b.block(
			transform_body(alternate_body, {
				...context,
				state: { ...context.state, flush_node: null, scope: alternate_scope },
			}),
		);
		alternate_id = context.state.scope.generate('alternate');
		statements.push(b.var(b.id(alternate_id), b.arrow([b.id('__anchor')], alternate_block)));
	}

	/** @type {AST.Statement[]} */
	const callback_body = [];

	callback_body.push(
		b.if(
			/** @type {AST.Expression} */ (
				context.visit(node.test, {
					...context.state,
					metadata: { ...context.state.metadata },
				})
			),
			b.stmt(b.call(b.id('__render'), b.id(consequent_id))),
			alternate_id
				? b.stmt(
						b.call(
							b.id('__render'),
							b.id(alternate_id),
							node.alternate ? b.literal(false) : undefined,
						),
					)
				: undefined,
		),
	);

	statements.push(
		b.stmt(
			b.call(
				'_$_.if',
				id,
				b.arrow([b.id('__render')], b.block(callback_body)),
				root_controlled ? b.true : undefined,
			),
		),
	);

	context.state.init?.push(b.block(statements));
};

/**
 * Shared by the plain statement and the `@`-directive forms.
 * @type {Visitor<AST.TryStatement | AST.JSXTryExpression, TransformClientState, AST.Node>}
 */
const visit_try_statement = (node, context) => {
	if (context.state.regular_js) {
		return context.next();
	}

	if (!is_inside_component(context)) {
		if (context.state.to_ts) {
			return transform_ts_child(node, SetContextForOutsideComponent(context));
		}

		return context.next();
	}

	if (context.state.to_ts) {
		return transform_ts_child(node, context);
	}
	const root_controlled = node.metadata?.root_controlled === true;
	if (!root_controlled) {
		context.state.template?.push('<!>');
	}

	const id = root_controlled ? b.id('__anchor') : context.state.flush_node?.();
	const handler = /** @type {AST.CatchClause | null} */ (node.handler);
	const pending = /** @type {AST.BlockStatement | null} */ (node.pending);
	let body = transform_body(node.block.body, {
		...context,
		state: {
			...context.state,
			scope: /** @type {ScopeInterface} */ (context.state.scopes.get(node.block)),
		},
	});

	// Strip catch-param type annotations on copies embedded in the output; the
	// source handler params are never mutated.
	const handler_param = handler?.param
		? /** @type {AST.Pattern} */ ({ ...handler.param, typeAnnotation: undefined })
		: null;
	const handler_reset_param = handler?.resetParam
		? /** @type {AST.Pattern} */ ({ ...handler.resetParam, typeAnnotation: undefined })
		: null;

	const catch_arg =
		handler === null
			? b.literal(null)
			: b.arrow(
					[
						b.id('__anchor'),
						...(handler_param && handler_reset_param
							? [handler_param, handler_reset_param]
							: handler_param
								? [handler_param]
								: []),
					],
					b.block(
						transform_body(handler.body.body, {
							...context,
							state: {
								...context.state,
								scope: /** @type {ScopeInterface} */ (context.state.scopes.get(handler.body)),
							},
						}),
					),
				);

	const pending_arg =
		pending === null
			? null
			: b.arrow(
					[b.id('__anchor')],
					b.block(
						transform_body(pending.body, {
							...context,
							state: {
								...context.state,
								scope: /** @type {ScopeInterface} */ (context.state.scopes.get(pending)),
							},
						}),
					),
				);

	const try_args = [id, b.arrow([b.id('__anchor')], b.block(body)), catch_arg];
	if (root_controlled) {
		// Keep pending_fn positioned (null when absent) so root_controlled lands
		// in the 5th slot.
		try_args.push(pending_arg ?? b.literal(null), b.true);
	} else if (pending_arg !== null) {
		try_args.push(pending_arg);
	}

	context.state.init?.push(b.stmt(b.call('_$_.try', ...try_args)));
};

/**
 * Shared by the plain statement and the `@`-directive forms.
 * @type {Visitor<AST.ForOfStatement | AST.JSXForOfExpression, TransformClientState, AST.Node>}
 */
const visit_for_of_statement = (node, context) => {
	if (context.state.regular_js) {
		return context.next();
	}

	if (!is_inside_component(context)) {
		return context.next();
	}
	const is_controlled = node.metadata?.is_controlled;
	const root_controlled = node.metadata?.root_controlled === true;
	const index = node.index;
	const key = node.key;
	let flags = is_controlled ? IS_CONTROLLED : 0;

	if (root_controlled) {
		flags |= ROOT_CONTROLLED;
	}

	if (index != null) {
		flags |= IS_INDEXED;
	}

	if (node.metadata?.script_only && !node.metadata?.has_template) {
		const pattern =
			node.metadata?.tsrx_for_pattern_id ??
			/** @type {AST.VariableDeclaration} */ (node.left).declarations[0].id;
		const body_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.body));
		const body = transform_body(/** @type {AST.BlockStatement} */ (node.body).body, {
			...context,
			state: {
				...context.state,
				scope: body_scope,
				namespace: context.state.namespace,
				flush_node: null,
			},
		});

		if (index) {
			body.push(b.stmt(b.update('++', index)));
			context.state.init?.push(b.var(index, b.literal(0)));
		}

		const left = /** @type {AST.VariableDeclaration} */ (
			context.visit(/** @type {AST.Node} */ (node.left))
		);
		context.state.init?.push(
			b.for_of(
				// A keyed loop iterates the generated pattern id (see the
				// analyzer's tsrx_for_pattern_id), not the source destructuring.
				node.metadata?.tsrx_for_pattern_id
					? {
							...left,
							declarations: [{ ...left.declarations[0], id: node.metadata.tsrx_for_pattern_id }],
						}
					: left,
				/** @type {AST.Expression} */ (context.visit(/** @type {AST.Node} */ (node.right))),
				b.block(body),
			),
		);
		return;
	}

	// do only if not controller
	if (!is_controlled && !root_controlled) {
		context.state.template?.push('<!>');
	}

	const id = root_controlled ? b.id('__anchor') : context.state.flush_node?.(false, is_controlled);
	const pattern =
		node.metadata?.tsrx_for_pattern_id ??
		/** @type {AST.VariableDeclaration} */ (node.left).declarations[0].id;
	const body_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.body));
	const body_nodes = /** @type {AST.BlockStatement} */ (node.body).body;
	/** @type {AST.Statement[]} */
	const body = transform_body(body_nodes, {
		...context,
		state: {
			...context.state,
			scope: body_scope,
			namespace: context.state.namespace,
			flush_node: null,
		},
	});

	const empty_scope = node.empty
		? context.state.scopes.get(node.empty) || context.state.scope
		: null;
	const empty_renderer = node.empty
		? b.arrow(
				[b.id('__anchor')],
				b.block(
					transform_body(/** @type {AST.BlockStatement} */ (node.empty).body, {
						...context,
						state: {
							...context.state,
							scope: /** @type {ScopeInterface} */ (empty_scope),
							namespace: context.state.namespace,
							flush_node: null,
						},
					}),
				),
			)
		: undefined;

	const for_args = [
		id,
		b.thunk(/** @type {AST.Expression} */ (context.visit(/** @type {AST.Node} */ (node.right)))),
		b.arrow(
			index ? [b.id('__anchor'), pattern, index] : [b.id('__anchor'), pattern],
			b.block(body),
		),
		b.literal(flags),
	];
	if (key != null) {
		for_args.push(
			b.arrow(
				index ? [pattern, index] : [pattern],
				/** @type {AST.Expression} */ (context.visit(key)),
			),
		);
	}
	if (empty_renderer) {
		for_args.push(empty_renderer);
	}

	context.state.init?.push(
		b.stmt(
			b.call(
				key != null ? '_$_.for_keyed' : '_$_.for',
				.../** @type {AST.Expression[]} */ (for_args),
			),
		),
	);
};

/** @type {Visitors<AST.Node, TransformClientState>} */
const visitors = {
	_(node, { next, state, path }) {
		if (!node.metadata) {
			node.metadata = { path: [...path] };
		} else {
			node.metadata.path = [...path];
		}

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
			if (context.state.to_ts) {
				const binding = context.state.scope.get(node.name);
				if (node.tracked) {
					if (
						(binding?.kind === 'lazy' || binding?.kind === 'lazy_fallback') &&
						binding.read_unwraps
					) {
						return context.next();
					}
					const member = b.member(
						node,
						b.literal('#v'),
						true,
						!is_inside_left_side_assignment(node),
						/** @type {AST.NodeWithLocation} */ (node),
					);
					member.tracked = true;
					return member;
				}
			} else {
				const binding = context.state.scope.get(node.name);
				const is_right_side_of_assignment =
					parent.type === 'AssignmentExpression' && parent.right === node;
				if (
					(context.state.metadata?.tracking === false ||
						(parent.type !== 'AssignmentExpression' && parent.type !== 'UpdateExpression') ||
						is_right_side_of_assignment) &&
					(node.tracked ||
						binding?.kind === 'prop' ||
						binding?.kind === 'index' ||
						binding?.kind === 'prop_fallback' ||
						binding?.kind === 'lazy' ||
						binding?.kind === 'lazy_fallback' ||
						binding?.kind === 'for_pattern') &&
					binding?.node !== node
				) {
					if (context.state.metadata?.tracking === false) {
						context.state.metadata.tracking = true;
					}
				}
				return build_getter(node, context);
			}
		}
	},

	ImportDeclaration(node, context) {
		const { state } = context;

		if (get_submodule_import_source_name(node) === 'server') {
			return transform_server_module_import(node, state);
		}

		if (!state.to_ts && node.importKind === 'type') {
			return b.empty;
		}

		if (state.to_ts && state.ancestor_server_block) {
			/** @type {AST.VariableDeclaration[]} */
			const locals = state.server_block_locals;
			// Rebuild the specifiers with obfuscated locals on copies — the source
			// import declaration is never mutated.
			const specifiers = node.specifiers.map((spec) => {
				const original_name = spec.local.name;
				const name = obfuscateIdentifier(original_name);
				const local =
					spec.type !== 'ImportSpecifier' ||
					(spec.imported && /** @type {AST.Identifier} */ (spec.imported).name !== spec.local.name)
						? { ...spec.local, name }
						: b.id(name);
				local.metadata = { ...local.metadata, source_name: original_name };
				locals.push(b.const(original_name, b.id(name)));
				return { ...spec, local };
			});
			state.imports.add(/** @type {AST.ImportDeclaration} */ ({ ...node, specifiers }));
			return b.empty;
		}

		return /** @type {AST.ImportDeclaration} */ ({
			...node,
			specifiers: node.specifiers
				.filter(
					(spec) => state.to_ts || /** @type {AST.ImportSpecifier} */ (spec).importKind !== 'type',
				)
				.map((spec) => context.visit(spec)),
		});
	},

	TSNonNullExpression(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		return context.visit(/** @type {AST.Expression} */ (node.expression));
	},

	CallExpression(node, context) {
		const callee = node.callee;
		const parent = context.path.at(-1);

		if (context.state.metadata?.tracking === false) {
			context.state.metadata.tracking = true;
		}

		// A generated inline-component IIFE for a `@{ … }` block: after the
		// block's statements lower into the component callback, the wrapper
		// scope holds a lone `return _$_.tsrx_element(…)` — collapse it to the
		// component value. Constructing the value reads no scope, so no
		// `with_scope` is needed either.
		if (!context.state.to_ts && node.metadata?.tsrx_code_block_component) {
			return unwrap_single_return_iife(/** @type {AST.Expression} */ (context.next()));
		}

		// Handle direct calls to ripple-imported functions: effect(), untrack(), RippleArray(), etc.
		if (!context.state.to_ts && callee.type === 'Identifier' && is_ripple_import(callee, context)) {
			const ripple_runtime_method = get_ripple_namespace_call_name(callee.name);
			if (ripple_runtime_method !== null) {
				const requires_block = ripple_namespace_requires_block(callee.name);
				return {
					...node,
					callee: b.member(b.id('_$_'), b.id(ripple_runtime_method)),
					arguments: /** @type {(AST.Expression | AST.SpreadElement)[]} */ ([
						...(requires_block ? [b.id('__block')] : []),
						...node.arguments.map((arg) => context.visit(arg)),
					]),
					typeArguments: undefined,
				};
			}
		}

		const matched_track_call = !context.state.to_ts ? is_ripple_track_call(callee, context) : null;
		if (matched_track_call) {
			const track_method_name = matched_track_call === 'trackAsync' ? 'track_async' : 'track';
			/** @type {(AST.Expression | AST.SpreadElement)[]} */
			const call_args = [];
			const source_args = node.arguments.length === 0 ? [b.void0] : node.arguments;

			for (let i = 0; i < source_args.length; i++) {
				const arg = source_args[i];
				call_args.push(/** @type {(AST.Expression | AST.SpreadElement)} */ (context.visit(arg)));
				if (i === 0) {
					call_args.push(b.id('__block'));
					call_args.push(b.literal(node.metadata.hash));
				}
			}

			return /** @type {AST.CallExpression} */ ({
				...node,
				callee: b.member(b.id('_$_'), b.id(track_method_name)),
				arguments: call_args,
				typeArguments: undefined,
			});
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

			if (!context.state.to_ts && method_name !== null) {
				const requires_block = ripple_namespace_requires_block(object.name);
				return b.member(
					b.id('_$_'),
					b.member(
						b.id(method_name),
						b.call(
							b.id(property.name),
							.../** @type {(AST.Expression | AST.SpreadElement)[]} */ ([
								...(requires_block ? [b.id('__block')] : []),
								...node.arguments.map((arg) => context.visit(arg)),
							]),
						),
					),
				);
			}
		}

		if (
			!is_inside_component(context, true) ||
			context.state.to_ts ||
			(parent?.type === 'MemberExpression' && parent.property === node) ||
			is_inside_call_expression(context) ||
			!context.path.some((node) => is_native_tsrx_function_node(node)) ||
			is_declared_function_within_component(callee, context)
		) {
			if (context.state.to_ts) {
				return context.next();
			}
			// Like `context.next()`, but on a copy without the TypeScript-only type
			// arguments so they are neither visited nor emitted.
			return visit_children_without(node, context, ['typeArguments']);
		}

		// Handle array methods that access the array
		if (callee.type === 'MemberExpression') {
			const property = callee.property;

			if (callee.computed) {
				return b.call(
					'_$_.with_scope',
					b.id('__block'),
					b.thunk(
						b.call(
							'_$_.call_property',
							/** @type {AST.Expression} */ (context.visit(callee.object)),
							/** @type {AST.Expression} */ (context.visit(property)),
							callee.optional ? b.true : undefined,
							/** @type {AST.SimpleCallExpression} */ (node).optional ? b.true : undefined,
							.../** @type {AST.Expression[]} */ (node.arguments.map((arg) => context.visit(arg))),
						),
					),
				);
			}
		}

		const visited_call = {
			...node,
			callee: /** @type {AST.Expression} */ (context.visit(callee)),
			arguments: /** @type {(AST.Expression | AST.SpreadElement)[]} */ (
				node.arguments.map((arg) => context.visit(arg))
			),
			typeArguments: undefined,
		};

		// A generated code-block scope IIFE is already a zero-argument
		// closure — use its arrow as the with_scope callback directly instead
		// of thunking the call (`() => (() => { … })()`).
		if (
			node.metadata?.tsrx_code_block_scope &&
			visited_call.callee.type === 'ArrowFunctionExpression'
		) {
			return b.call('_$_.with_scope', b.id('__block'), visited_call.callee);
		}

		return b.call('_$_.with_scope', b.id('__block'), b.thunk(visited_call));
	},

	TSTypeAliasDeclaration(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		return context.next();
	},

	TSInterfaceDeclaration(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		return context.next();
	},

	TSMappedType(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		return context.next();
	},

	NewExpression(node, context) {
		const callee = node.callee;

		if (context.state.metadata?.tracking === false) {
			context.state.metadata.tracking = true;
		}

		// Transform `new RippleArray(...)`, `new RippleMap(...)`, etc. imported from 'ripple'
		if (!context.state.to_ts && callee.type === 'Identifier' && is_ripple_import(callee, context)) {
			const ripple_runtime_method = get_ripple_namespace_call_name(callee.name);
			if (ripple_runtime_method !== null) {
				const requires_block = ripple_namespace_requires_block(callee.name);
				return b.call(
					'_$_.' + ripple_runtime_method,
					...(requires_block ? [b.id('__block')] : []),
					.../** @type {(AST.Expression | AST.SpreadElement)[]} */ (
						node.arguments.map((arg) => context.visit(arg))
					),
				);
			}
		}

		if (
			context.state.to_ts ||
			!is_inside_component(context, true) ||
			is_inside_call_expression(context) ||
			is_value_static(node)
		) {
			if (!context.state.to_ts) {
				// Like `context.next()`, but on a copy without the TypeScript-only
				// type arguments so they are neither visited nor emitted.
				return visit_children_without(node, context, ['typeArguments']);
			}

			return context.next();
		}

		/** @type {AST.NewExpression} */
		const new_node = {
			...node,
			callee: /** @type {AST.Expression} */ (context.visit(callee)),
			arguments: /** @type {(AST.Expression | AST.SpreadElement)[]} */ (
				node.arguments.map((arg) => context.visit(arg))
			),
		};
		if (!context.state.to_ts) {
			delete new_node.typeArguments;
		}

		return b.call('_$_.with_scope', b.id('__block'), b.thunk(new_node));
	},

	MemberExpression(node, context) {
		if (context.state.metadata?.tracking === false) {
			context.state.metadata.tracking = true;
		}

		if (!context.state.to_ts && !is_inside_left_side_assignment(node)) {
			const target = get_indexed_reactive_target(node, context);
			if (target !== null) {
				const read = build_index_read(target.target, target.index, target.tracked);
				if (read !== null) {
					return read;
				}
			}
		}

		if (node.object.type === 'MemberExpression' && node.object.optional) {
			const metadata = { tracking: false };

			const object = context.visit(node.object, { ...context.state, metadata });

			if (metadata.tracking) {
				if (/** @type {boolean | undefined} */ (context.state.metadata?.tracking) === false) {
					context.state.metadata.tracking = true;
				}

				return {
					...node,
					optional: true,
					object: /** @type {AST.Expression} */ (object),
					property: /** @type {AST.Expression} */ (context.visit(node.property)),
				};
			}
		} else {
			return context.next();
		}
	},

	PropertyDefinition(node, context) {
		if (!context.state.to_ts) {
			// Like `context.next()`, but on a copy without the TypeScript-only type
			// annotation so it is neither visited nor emitted.
			return visit_children_without(node, context, ['typeAnnotation']);
		}
		return context.next();
	},

	ClassDeclaration(node, context) {
		if (!context.state.to_ts) {
			return strip_class_typescript_syntax(node, context);
		}
		return context.next();
	},

	ClassExpression(node, context) {
		if (!context.state.to_ts) {
			return strip_class_typescript_syntax(node, context);
		}
		return context.next();
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
			if (context.state.to_ts) {
				// In TypeScript mode, convert to a regular assignment (drop the pattern)
				delete node.expression.left.metadata.lazy_id;
				const expression = {
					...node.expression,
					left: { ...node.expression.left, lazy: false },
				};
				return {
					...node,
					expression: /** @type {AST.Expression} */ (context.visit(expression)),
				};
			}
			const right = /** @type {AST.Expression} */ (context.visit(node.expression.right));
			return b.const(b.id(node.expression.left.metadata.lazy_id), right);
		}
		return context.next();
	},

	VariableDeclaration(node, context) {
		// Rewrite declarator ids on copies (strip type annotations, replace lazy
		// destructuring patterns) — the source declarators are never mutated.
		const declarations = node.declarations.map((declarator) => {
			/** @type {AST.VariableDeclarator['id']} */
			let id = declarator.id;

			if (!context.state.to_ts) {
				// Replace lazy destructuring patterns with the generated identifier
				if (
					(id.type === 'ObjectPattern' || id.type === 'ArrayPattern') &&
					id.lazy &&
					id.metadata?.lazy_id
				) {
					id = b.id(id.metadata.lazy_id);
				} else if (id.typeAnnotation) {
					id = { ...id, typeAnnotation: undefined };
				}
			} else if ((id.type === 'ObjectPattern' || id.type === 'ArrayPattern') && id.lazy) {
				if (id.metadata?.lazy_id) {
					delete id.metadata.lazy_id;
				}
				id = { ...id, lazy: false };
			}

			if (id === declarator.id) {
				return declarator;
			}
			const copy = { ...declarator, id };
			const scope = context.state.scopes.get(declarator);
			if (scope) context.state.scopes.set(copy, scope);
			return copy;
		});

		return {
			...node,
			declarations: declarations.map(
				(declarator) => /** @type {AST.VariableDeclarator} */ (context.visit(declarator)),
			),
		};
	},

	VariableDeclarator(node, context) {
		return context.next();
	},

	FunctionDeclaration(node, context) {
		return /** @type AST.FunctionDeclaration | AST.EmptyStatement */ (
			visit_function(node, context)
		);
	},

	ArrowFunctionExpression(node, context) {
		return /** @type AST.ArrowFunctionExpression | AST.EmptyStatement */ (
			visit_function(node, context)
		);
	},

	FunctionExpression(node, context) {
		return /** @type AST.FunctionExpression | AST.EmptyStatement */ (visit_function(node, context));
	},

	JSXText(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		return b.literal(node.value + '');
	},

	JSXIdentifier(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		return b.id(node.name);
	},

	JSXExpressionContainer(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		return context.visit(node.expression);
	},

	JSXEmptyExpression(node, context) {
		// JSX comments like {/* ... */} are represented as JSXEmptyExpression
		// In TypeScript mode, preserve them as-is for prettier
		// In JavaScript mode, they're removed (which is correct since they're comments)
		if (context.state.to_ts) {
			return context.next();
		}
		// In JS mode, return empty - comments are stripped
		return b.empty;
	},

	JSXCodeBlock(node, context) {
		// A `@{ … }` block that sits in a value position (assigned to a variable,
		// returned, …) is wrapped in an immediately-invoked arrow so it flows
		// through the function-body path (`transform_native_tsrx_function`) rather
		// than reaching the printer as a raw `JSXCodeBlock` — a code-only block
		// would otherwise print as an invalid `{ … }` "expression". Applies to
		// runtime and `to_ts` output alike. The function-body guard keeps
		// `transform_native_tsrx_function`'s own visit of the body (in `to_ts`)
		// from re-wrapping it endlessly.
		if (
			!is_code_block_function_body(node, context.path.at(-1)) &&
			is_native_tsrx_value_position(context.path)
		) {
			return context.visit(wrap_code_block_in_iife(node), context.state);
		}
		// A code-only `@{ … }` block (no render output) is just a lexical block of
		// setup statements. Component blocks (with a render template) are handled by
		// `transform_native_tsrx_function`, and `to_ts` mode keeps the node for the
		// TSX printer. Everywhere else, lower it to a plain BlockStatement so the
		// JS printer (which has no JSXCodeBlock visitor) can emit it.
		if (context.state.to_ts) {
			/** @type {AST.Statement[]} */
			const body = [];
			for (const statement of node.body) {
				push_statement(
					/** @type {AST.Statement | AST.Statement[]} */ (context.visit(statement, context.state)),
					body,
				);
			}
			const render = get_code_block_render(node, context.state.scopes);
			return {
				...node,
				body,
				render: render
					? transform_tsrx_ts_render_node(
							/** @type {AST.Node} */ (render),
							/** @type {VisitorClientContext} */ (context),
						)
					: null,
			};
		}
		if (get_code_block_render(node, context.state.scopes) != null) {
			return context.next();
		}
		const body = node.body.map(
			(statement) => /** @type {AST.Statement} */ (context.visit(statement, context.state)),
		);
		return b.block(body);
	},

	JSXFragment(node, context) {
		const { state, visit } = context;

		// A raw (non-template) fragment — an attribute value or other JSX that
		// never entered the template traversal.
		if (!is_template_fragment(node)) {
			if (state.to_ts) {
				return context.next();
			}
			if (state.jsx_to_tsrx_element || is_native_tsrx_value_position(context.path)) {
				return build_jsx_to_tsrx_element(/** @type {AST.TSRXJSXFragment} */ (node), context);
			}
			return context.next();
		}

		// to_ts mode: produce a JSX fragment from native TSRX children.
		if (state.to_ts) {
			const expression = build_tsrx_to_ts_expression(node, context);
			// Keep an AUTHORED `<> … </>` verbatim in EVERY position — a value slot
			// (`const v = <>{1}</>`), render output (`return <>{x}</>`, `() => <>{x}</>`),
			// or a JSX-child `{ … }` container (`<div>{<>{x}</>}</div>`) — matching the JS
			// targets; collapsing it to a bare child risks the wrong output (a fragment is
			// always truthy, and the type changes). A fragment COMBINED into a surrounding
			// expression is likewise kept, including the compiler-generated wrapper around a
			// directive used as a `||`/`&&` operand (`@if (…) { … } || 'x'` → `<>{…}</> || 'x'`):
			// the wrapper is a truthy value so the fallback stays dead, exactly as the JS
			// targets / runtime treat it (the type view must agree). A directive as the SOLE
			// value of a slot (`const v = @if (…)`) still collapses — `is_combined_expression_position`
			// excludes those slots — and a nested authored fragment collapses outer→inner via
			// `wrap_to_ts_value_in_fragment`'s short-circuit.
			return is_authored_native_fragment(node) ||
				is_combined_expression_position(context.path, node)
				? wrap_to_ts_value_in_fragment(expression, node)
				: expression;
		}

		const children_filtered = lower_code_block_children(
			/** @type {AST.Node[]} */ (node.children),
			state.scopes,
		).filter((child) => {
			return child != null && child.type !== 'EmptyStatement';
		});

		const children_component = create_native_tsrx_render_function([], children_filtered, node);

		const element = b.call(
			'_$_.tsrx_element',
			/** @type {AST.Expression} */ (
				visit(children_component, {
					...state,
					regular_js: false,
					namespace: state.namespace,
					is_tsrx_element: true,
					jsx_to_tsrx_element: true,
				})
			),
		);

		// Template body context: push to template and schedule init
		if (state.flush_node) {
			state.template?.push('<!>');

			const id = state.flush_node(false);

			const call = b.call('_$_.expression', id, b.thunk(element));
			state.init?.push(
				state.namespace !== DEFAULT_NAMESPACE
					? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(call)))
					: b.stmt(call),
			);
			return;
		}

		// Expression context: return the tsrx_element directly as an expression value
		return element;
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

		if (state.to_ts) {
			const fragment = /** @type {ESTreeJSX.JSXFragment} */ (
				/** @type {unknown} */ ({
					type: 'JSXFragment',
					children: [node],
					openingFragment: { type: 'JSXOpeningFragment', metadata: { path: [] } },
					closingFragment: { type: 'JSXClosingFragment', metadata: { path: [] } },
					metadata: { path: [], tsrx_render_fragment: true },
				})
			);
			return build_tsrx_to_ts_expression(fragment, context);
		}

		if (state.inside_head) {
			state.template?.push(`<style>${sanitizeTemplateString(get_style_css(node))}</style>`);
			return;
		}

		// Component styles render nothing at runtime — their CSS is extracted at
		// analysis time and injected separately.
	},

	JSXElement(node, context) {
		const { state, visit } = context;

		// A raw (non-template) element — an attribute value or other JSX that
		// never entered the template traversal.
		if (!is_template_element(node)) {
			if (state.to_ts) {
				return context.next();
			}
			if (state.jsx_to_tsrx_element || is_native_tsrx_value_position(context.path)) {
				return build_jsx_to_tsrx_element(/** @type {AST.TSRXJSXElement} */ (node), context);
			}
			return context.next();
		}

		// The TS view needs the `<TsrxDynamic is={expr}>` component shape for type
		// checking; production codegen keeps `node.id` as the dynamic expression
		// and renders it directly via `_$_.composite` in the component branch.
		if (state.to_ts) {
			const lowered = lower_dynamic_element(node, undefined, state.scopes);
			if (lowered) {
				state.imports.add(`import { Dynamic as ${dynamic_element_import_local} } from 'ripple'`);
				node = lowered;
			}
		}

		const element_id = get_element_id(node);
		const element_attributes = get_element_attributes(node);

		if (state.to_ts) {
			const fragment = /** @type {ESTreeJSX.JSXFragment} */ (
				/** @type {unknown} */ ({
					type: 'JSXFragment',
					children: [node],
					openingFragment: { type: 'JSXOpeningFragment', metadata: { path: [] } },
					closingFragment: { type: 'JSXClosingFragment', metadata: { path: [] } },
					metadata: { path: [], tsrx_render_fragment: true },
				})
			);
			return build_tsrx_to_ts_expression(fragment, context);
		}

		if (
			state.regular_js ||
			(!state.inside_head &&
				!state.template_child &&
				!node.metadata?.returned_tsrx_child &&
				(is_native_tsrx_value_position(context.path) ||
					(context.state.component === undefined &&
						is_native_tsrx_statement_position(context.path))))
		) {
			const expression = build_native_tsrx_value_expression([node], node, context);
			if (is_regular_js_statement_position(context.path)) {
				return b.stmt(expression);
			}
			return expression;
		}

		if (is_ripple_fragment_element(node, context)) {
			visit_ripple_fragment_element(node, context);
			return;
		}

		if (context.state.inside_head) {
			// Inline scripts (`<script>{code}</script>`) are rendered by injecting
			// the child content as the script's text. Scripts with no inline body
			// (e.g. `<script src={...} />`) carry their behavior in attributes, so
			// they fall through to generic element handling instead.
			if (
				element_id.type === 'Identifier' &&
				element_id.name === 'script' &&
				node.children.length > 0
			) {
				const id = state.flush_node?.();
				state.template?.push('<!>');
				context.state.init?.push(
					b.stmt(
						b.call(
							'_$_.script',
							id,
							/** @type {AST.Literal} */ (visit(/** @type {AST.Node} */ (node.children[0]), state)),
						),
					),
				);
				return;
			}
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

		/**
		 * @param {string} name
		 *  @param {string | number | bigint | boolean | RegExp | null | undefined} value
		 */
		const handle_static_attr = (name, value) => {
			const attr_value = b.literal(
				` ${name}${
					is_boolean_attribute(name) && value === true
						? ''
						: `="${value === true ? '' : escape_html(/** @type {string} */ (value), true)}"`
				}`,
			);

			if (is_spreading) {
				// For spread attributes, store just the actual value, not the full attribute string
				const actual_value =
					is_boolean_attribute(name) && value === true
						? b.literal(true)
						: b.literal(value === true ? '' : value);
				spread_attributes?.push(b.prop('init', b.literal(name), actual_value));
			} else {
				state.template?.push(attr_value);
			}
		};

		if (is_dom_element) {
			/** @type {ESTreeJSX.JSXAttribute | null} */
			let class_attribute = null;
			/** @type {ESTreeJSX.JSXAttribute | null} */
			let style_attribute = null;
			/** @type {TransformClientState['update']} */
			const local_updates = [];
			const element_name = /** @type {AST.Identifier} */ (element_id).name;
			const is_void = is_void_element(element_name);
			/** @type {AST.CSS.StyleSheet['hash'] | null} */
			const scoping_hash =
				state.applyParentCssScope ?? (node.metadata.scoped ? get_component_css_hash(state) : null);
			const inner_html_attribute = get_inner_html_attribute(node);

			state.template?.push(`<${element_name}`);

			for (const attr of element_attributes) {
				if (attr.type === 'JSXAttribute') {
					const attr_value = get_attribute_value(attr);
					{
						const name = get_attribute_name(attr);

						if (name === 'innerHTML') {
							const metadata = { tracking: false };
							const expression =
								attr_value === null
									? b.literal('')
									: /** @type {AST.Expression} */ (visit(attr_value, { ...state, metadata }));

							if (is_spreading) {
								spread_attributes?.push(b.prop('init', b.literal('innerHTML'), expression));
								continue;
							}

							const id = state.flush_node?.();
							if (metadata.tracking) {
								local_updates.push({
									operation: (key) =>
										b.stmt(
											b.assignment(
												'=',
												b.member(/** @type {AST.Identifier} */ (id), 'innerHTML'),
												normalize_inner_html_expression(
													/** @type {AST.Expression} */ (key),
													/** @type {AST.Identifier} */ (id),
												),
											),
										),
									expression,
									identity: attr_value ?? b.literal(''),
									initial: b.member(/** @type {AST.Identifier} */ (id), 'innerHTML'),
								});
							} else {
								state.init?.push(
									b.stmt(
										b.assignment(
											'=',
											b.member(/** @type {AST.Identifier} */ (id), 'innerHTML'),
											normalize_inner_html_expression(
												expression,
												/** @type {AST.Identifier} */ (id),
											),
										),
									),
								);
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
							const id = state.flush_node?.();
							const metadata = { tracking: false };
							const source = get_ref_source_argument(attr_value);
							const ref_value =
								source.type === 'ArrayExpression'
									? create_ref_value_call(attr_value, context)
									: /** @type {AST.Expression} */ (visit(attr_value, { ...state, metadata }));
							const ref_args = [/** @type {AST.Expression} */ (id), b.thunk(ref_value)];
							if (source.type !== 'ArrayExpression') {
								add_ref_setter_arg(ref_args, attr_value, ref_value);
							}
							state.init?.push(b.stmt(b.call('_$_.ref', ...ref_args)));
							continue;
						}

						if (
							attr_value.type === 'Literal' &&
							name !== 'class' &&
							name !== 'style' &&
							!(name === 'value' && element_name === 'option')
						) {
							handle_static_attr(name, attr_value.value);
							continue;
						}

						if (name === 'value') {
							const id = state.flush_node?.();
							const metadata = { tracking: false };
							const expression = /** @type {AST.Expression} */ (
								visit(attr_value, { ...state, metadata })
							);

							if (metadata.tracking) {
								local_updates.push({
									operation: (key) => b.stmt(b.call('_$_.set_value', id, key)),
									expression,
									identity: attr_value,
									initial: b.void0,
								});
							} else {
								state.init?.push(b.stmt(b.call('_$_.set_value', id, expression)));
							}

							continue;
						}

						if (name === 'class') {
							class_attribute = attr;

							continue;
						}

						if (name === 'style') {
							style_attribute = attr;

							continue;
						}

						if (name === 'checked') {
							const id = state.flush_node?.();
							const metadata = { tracking: false };
							const expression = /** @type {AST.Expression} */ (
								visit(attr_value, { ...state, metadata })
							);

							if (metadata.tracking) {
								local_updates.push({
									operation: (key) => b.stmt(b.call('_$_.set_checked', id, key)),
									expression,
									identity: attr_value,
									initial: b.void0,
								});
							} else {
								state.init?.push(b.stmt(b.call('_$_.set_checked', id, expression)));
							}
							continue;
						}

						if (name === 'selected') {
							const id = state.flush_node?.();
							const metadata = { tracking: false };
							const expression = /** @type {AST.Expression} */ (
								visit(attr_value, { ...state, metadata })
							);

							if (metadata.tracking) {
								local_updates.push({
									operation: (key) => b.stmt(b.call('_$_.set_selected', id, key)),
									expression,
									identity: attr_value,
									initial: b.void0,
								});
							} else {
								state.init?.push(b.stmt(b.call('_$_.set_selected', id, expression)));
							}
							continue;
						}

						if (isEventAttribute(name)) {
							const metadata = { tracking: false };
							let handler = /** @type {AST.Expression} */ (
								visit(attr_value, { ...state, metadata })
							);
							const id = state.flush_node?.();

							if (attr.metadata?.delegated) {
								const event_name = normalizeEventName(name);

								if (!state.events.has(event_name)) {
									state.events.add(event_name);
								}

								state.init?.push(
									b.stmt(
										b.assignment(
											'=',
											b.member(/** @type {AST.Identifier} */ (id), '__' + event_name),
											handler,
										),
									),
								);
							} else {
								const event_name = getOriginalEventName(name);
								// Check if handler is reactive (contains tracking)
								if (metadata.tracking) {
									// Use reactive_event with a thunk to re-evaluate when dependencies change
									state.init?.push(
										b.stmt(b.call('_$_.render_event', b.literal(event_name), id, b.thunk(handler))),
									);
								} else {
									state.init?.push(b.stmt(b.call('_$_.event', b.literal(event_name), id, handler)));
								}
							}

							continue;
						}
						const metadata = { tracking: false };
						const expression = /** @type {AST.Expression} */ (
							visit(attr_value, { ...state, metadata })
						);
						// All other attributes
						if (metadata.tracking) {
							const attribute = name;
							const id = state.flush_node?.();

							if (is_dom_property(attribute)) {
								local_updates.push({
									operation: () =>
										b.stmt(
											b.assignment(
												'=',
												b.member(/** @type {AST.Identifier} */ (id), attribute),
												expression,
											),
										),
								});
							} else {
								local_updates.push({
									operation: (key) =>
										b.stmt(b.call('_$_.set_attribute', id, b.literal(attribute), key)),
									expression,
									identity: attr_value,
									initial: b.void0,
								});
							}
						} else {
							const id = state.flush_node?.();

							if (is_dom_property(name)) {
								state.init?.push(
									b.stmt(
										b.assignment(
											'=',
											b.member(/** @type {AST.Identifier} */ (id), name),
											expression,
										),
									),
								);
							} else {
								state.init?.push(
									b.stmt(b.call('_$_.set_attribute', id, b.literal(name), expression)),
								);
							}
						}
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
					const id = state.flush_node?.();
					const metadata = { tracking: false };
					const expression = /** @type {AST.Expression} */ (
						visit(attr_value, { ...state, metadata })
					);

					const hash_arg = scoping_hash ? b.literal(scoping_hash) : undefined;
					const is_html =
						context.state.namespace === 'html' &&
						/** @type {AST.Identifier} */ (element_id).name !== 'svg';

					if (metadata.tracking) {
						local_updates.push({
							operation: (key) =>
								b.stmt(b.call('_$_.set_class', id, key, hash_arg, b.literal(is_html))),
							expression,
							identity: attr_value,
							initial: b.call(b.id('Symbol')),
						});
					} else {
						state.init?.push(
							b.stmt(b.call('_$_.set_class', id, expression, hash_arg, b.literal(is_html))),
						);
					}
				}
			} else if (scoping_hash) {
				handle_static_attr(is_spreading ? '#class' : 'class', scoping_hash);
			}

			if (style_attribute !== null) {
				const attr_value = /** @type {AST.Expression} */ (get_attribute_value(style_attribute));
				if (attr_value.type === 'Literal') {
					handle_static_attr('style', attr_value.value);
				} else {
					const id = state.flush_node?.();
					const metadata = { tracking: false };
					const expression = /** @type {AST.Expression} */ (
						visit(attr_value, { ...state, metadata })
					);

					if (metadata.tracking) {
						if (attr_value.type === 'TemplateLiteral') {
							// Doesn't need prev tracking
							local_updates.push({
								operation: () => b.stmt(b.call('_$_.set_style', id, expression, b.void0)),
							});
						} else {
							// Object or unknown - needs prev tracking
							local_updates.push({
								operation: (new_value, prev_value) =>
									b.stmt(b.call('_$_.set_style', id, new_value, prev_value)),
								identity: attr_value,
								expression,
								initial: b.void0,
								needsPrevTracking: true,
							});
						}
					} else {
						state.init?.push(b.stmt(b.call('_$_.set_style', id, expression, b.void0)));
					}
				}
			}

			state.template?.push('>');

			if (spread_attributes !== null && spread_attributes.length > 0) {
				const id = state.flush_node?.();
				state.init?.push(
					b.stmt(b.call('_$_.render_spread', id, b.thunk(b.object(spread_attributes)))),
				);
			}

			/** @type {TransformClientState['init']} */
			const init = [];
			/** @type {TransformClientState['update']} */
			const update = [];

			if (!is_void) {
				const element_name = /** @type {AST.Identifier} */ (element_id).name;
				const render_children = /** @type {AST.Node[]} */ (
					inner_html_attribute === null
						? lower_code_block_children(node.children, state.scopes)
						: []
				);
				// Special handling for <template> elements
				if (element_name === 'template' && render_children.length > 0) {
					transform_template_element(node, state, visit, child_namespace);
				} else {
					transform_children(
						render_children,
						/** @type {VisitorClientContext} */ ({
							visit,
							state: {
								...state,
								init,
								update,
								namespace: child_namespace,
								skip_children_traversal: true,
							},
							root: false,
						}),
					);
				}
				state.template?.push(`</${element_name}>`);

				// We need to check if any child nodes are dynamic to determine
				// if we need to pop the hydration stack to the parent node
				// Template elements never need pop() since we don't traverse into them
				const needs_pop =
					element_name !== 'template' &&
					render_children.some(
						(child) =>
							is_template_directive(child) ||
							child.type === 'IfStatement' ||
							child.type === 'TryStatement' ||
							child.type === 'ForOfStatement' ||
							child.type === 'SwitchStatement' ||
							is_template_fragment(child) ||
							(is_template_element(child) &&
								(get_element_id(child).type !== 'Identifier' || !is_element_dom_element(child))) ||
							// A JSXText child is always a literal; only a `{ … }` container
							// (including a merged text run) can hold a dynamic expression.
							(child.type === 'JSXExpressionContainer' && child.expression.type !== 'Literal'),
					);

				if (needs_pop) {
					const id = state.flush_node?.();

					init.push(b.stmt(b.call('_$_.pop', id)));
				}
			}

			update.push(...local_updates);

			if (update.length > 0) {
				if (state.scope.declarations.size > 0) {
					apply_updates(init, update, state);
				} else {
					state.update?.push(...update);
				}
			}

			if (init.length > 0) {
				state.init?.push(b.block(init));
			}
		} else {
			const root_controlled = node.metadata?.root_controlled === true;
			// `append_into` is a `{ parent }` sentinel set by transform_children when
			// every sibling is a static component: render directly into the parent,
			// no `<!>` placeholder and no child()/sibling() navigation.
			const append_into = node.metadata?.append_into ?? null;
			const id = root_controlled
				? b.id('__anchor')
				: append_into
					? append_into
					: state.flush_node?.();

			if (!root_controlled && !append_into) {
				state.template?.push('<!>');
			}

			const apply_parent_css_scope = state.applyParentCssScope;

			const is_spreading = element_attributes.some((attr) => attr.type === 'JSXSpreadAttribute');
			/** @type {(AST.Property | AST.SpreadElement)[]} */
			const props = [];
			/** @type {AST.Property | null} */
			let children_prop = null;

			for (const attr of element_attributes) {
				if (attr.type === 'JSXAttribute') {
					{
						const attr_name = get_attribute_name(attr);
						const attr_value = get_attribute_value(attr);
						const metadata = { tracking: false };
						if (attr_name === 'ref' && attr_value !== null) {
							props.push(b.prop('init', b.key('ref'), create_ref_value_call(attr_value, context)));
							continue;
						}

						let property =
							attr_value === null
								? b.literal(true)
								: /** @type {AST.Expression} */ (
										visit(attr_value, { ...state, flush_node: null, metadata })
									);
						if (property.type === 'Identifier') {
							const binding = state.scope.get(property.name);
							if (
								binding?.transform?.read &&
								(binding.kind === 'lazy' || binding.kind === 'lazy_fallback')
							) {
								property = binding.transform.read(property);
								metadata.tracking = true;
							}
						}

						const scoped_hash = get_component_css_hash(state);
						if (attr_name === 'class' && node.metadata.scoped && scoped_hash) {
							if (property.type === 'Literal') {
								property = b.literal(`${scoped_hash} ${property.value}`);
							} else {
								property = b.array([property, b.literal(scoped_hash)]);
							}
						}

						if (metadata.tracking) {
							if (attr_name === 'children') {
								children_prop = b.prop(
									'get',
									b.id('children'),
									b.function(
										null,
										[],
										b.block([b.return(b.call('_$_.normalize_children', property))]),
									),
								);
								props.push(children_prop);
								continue;
							}

							props.push(
								b.prop(
									'get',
									b.key(attr_name),
									b.function(null, [], b.block([b.return(property)])),
								),
							);
						} else {
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
					}
				} else if (attr.type === 'JSXSpreadAttribute') {
					props.push(
						b.spread(
							/** @type {AST.Expression} */
							(
								visit(attr.argument, {
									...state,
									flush_node: null,
									metadata: { ...state.metadata },
								})
							),
						),
					);
				} else {
					throw new Error('TODO');
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
				state.scopes,
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
				const component_scope = state.scopes.get(node) || state.scope;
				const children_component = create_native_tsrx_render_function([], children_filtered, node);

				const children = b.call(
					'_$_.tsrx_element',
					/** @type {AST.Expression} */ (
						visit(children_component, {
							...state,
							regular_js: false,
							...(apply_parent_css_scope || get_component_css(state)
								? {
										applyParentCssScope:
											apply_parent_css_scope ||
											/** @type {string} */ (get_component_css_hash(state)),
									}
								: {}),
							scope: /** @type {ScopeInterface} */ (component_scope),
							namespace: child_namespace,
							is_tsrx_element: true,
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

			const metadata = { tracking: false };
			// We visit, but only to gather metadata
			b.call(/** @type {AST.Expression} */ (visit(element_id, { ...state, metadata })));

			// We're calling a component from within svg/mathml context
			const is_with_ns = state.namespace !== DEFAULT_NAMESPACE;

			let object_props;
			if (is_spreading) {
				// Optimization: if only one spread with no other props, pass it directly
				if (props.length === 1 && props[0].type === 'SpreadElement') {
					object_props = b.call('_$_.spread_props', b.thunk(props[0].argument));
				} else {
					// Multiple items: build array of objects/spreads for proper merge order
					const items = [];
					let current_obj_props = [];

					for (const prop of props) {
						if (prop.type === 'SpreadElement') {
							// Flush accumulated regular props as an object
							if (current_obj_props.length > 0) {
								items.push(b.object(current_obj_props));
								current_obj_props = [];
							}
							// Add the spread argument directly
							items.push(prop.argument);
						} else {
							// Accumulate regular properties
							current_obj_props.push(prop);
						}
					}

					// Flush any remaining regular props
					if (current_obj_props.length > 0) {
						items.push(b.object(current_obj_props));
					}

					object_props = b.call('_$_.spread_props', b.thunk(b.array(items)));
				}
			} else {
				object_props = b.object(props);
			}
			// Dynamic tags (`<{expr}>`) always render through composite: the runtime
			// resolves the expression value (component function, tag string, or
			// null) and re-renders when a tracked expression changes.
			if (metadata.tracking || is_dynamic_element(node)) {
				const shared = b.call(
					'_$_.composite',
					b.thunk(/** @type {AST.Expression} */ (visit(element_id, state))),
					id,
					object_props,
				);
				state.init?.push(
					is_with_ns
						? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(shared)))
						: b.stmt(shared),
				);
			} else {
				const shared = b.call(
					'_$_.render_component',
					/** @type {AST.Expression} */ (visit(element_id, state)),
					id,
					object_props,
				);
				state.init?.push(
					is_with_ns
						? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(shared)))
						: b.stmt(shared),
				);
			}
		}
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

		// Handle lazy binding assignments (e.g., value = 5 where value is from let &[value] = track(0))
		// Must come before the left.tracked check to use the binding's transform
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

		const transformed = visit_assignment_expression(node, context, build_assignment);
		if (transformed !== null) {
			return transformed;
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

		const left = object(/** @type {AST.MemberExpression | AST.Identifier} */ (argument));
		const binding = left && context.state.scope.get(left.name);
		const transformers = left && binding?.transform;

		if (left === argument) {
			const update_fn = transformers?.update;
			if (update_fn) {
				return update_fn(node);
			}
		}

		context.next();
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

	SwitchStatement: visit_switch_statement,
	JSXSwitchExpression(node, context) {
		return visit_directive_wrapping_values(node, context, visit_switch_statement);
	},

	IfStatement: visit_if_statement,
	JSXIfExpression(node, context) {
		return visit_directive_wrapping_values(node, context, visit_if_statement);
	},

	ReturnStatement(node, context) {
		if (
			context.state.jsx_to_tsrx_element &&
			node.argument &&
			is_native_tsrx_template_node(node.argument)
		) {
			return b.return(
				/** @type {AST.Expression} */ (
					context.visit(
						node.argument,
						SetStateForOutsideComponent(context.state, {
							component: undefined,
							flush_node: null,
							template: null,
							jsx_to_tsrx_element: true,
						}),
					)
				),
				/** @type {AST.NodeWithLocation} */ (node),
			);
		}
		if (context.state.to_ts) {
			return b.return(
				node.argument
					? /** @type {AST.Expression} */ (context.visit(node.argument, context.state))
					: undefined,
				/** @type {AST.NodeWithLocation} */ (node),
			);
		}
		return context.next();
	},

	TSAsExpression(node, context) {
		if (!context.state.to_ts) {
			return context.visit(/** @type {AST.Expression} */ (node.expression));
		}
		return context.next();
	},

	TSInstantiationExpression(node, context) {
		if (!context.state.to_ts) {
			// In JavaScript, just return the expression wrapped in parentheses
			return b.sequence([
				/** @type {AST.Expression} */ (
					context.visit(/** @type {AST.Expression} */ (node.expression))
				),
			]);
		}
		return context.next();
	},

	ExportNamedDeclaration(node, context) {
		if (!context.state.to_ts && node.exportKind === 'type') {
			return b.empty;
		}

		// Remove TSDeclareFunction nodes (function overload signatures) in JavaScript mode
		if (
			!context.state.to_ts &&
			/** @type {AST.TSRXDeclaration} */ (node.declaration)?.type === 'TSDeclareFunction'
		) {
			return b.empty;
		}

		if (context.state.to_ts && context.state.ancestor_server_block) {
			// All validation errors will be handled in the analysis phase
			// So we can safely print these
			if (node.declaration) {
				return context.visit(node.declaration);
			} else if (node.specifiers) {
				for (const specifier of node.specifiers) {
					context.visit(specifier);
				}
				return;
			}
		}

		return context.next();
	},

	TSDeclareFunction(node, context) {
		// TSDeclareFunction nodes are TypeScript overload signatures - remove in JavaScript mode
		if (!context.state.to_ts) {
			return b.empty;
		}

		// In TypeScript mode, keep as TSDeclareFunction - esrap will print it with 'declare'
		// We'll remove the 'declare' keyword in post-processing
		return context.next();
	},

	TryStatement: visit_try_statement,
	JSXTryExpression(node, context) {
		return visit_directive_wrapping_values(node, context, visit_try_statement);
	},

	BinaryExpression(node, context) {
		return b.binary(
			node.operator,
			/** @type {AST.Expression} */ (context.visit(node.left)),
			/** @type {AST.Expression} */ (context.visit(node.right)),
		);
	},

	TemplateLiteral(node, context) {
		const parent = context.path.at(-1);

		if (
			!context.state.to_ts &&
			node.expressions.length === 0 &&
			parent?.type !== 'TaggedTemplateExpression'
		) {
			const literal = b.literal(
				node.quasis[0].value.cooked,
				undefined,
				/** @type {AST.NodeWithLocation} */ (node),
			);
			literal.metadata.source_name = '`' + node.quasis[0].value.raw + '`';
			return literal;
		}

		const expressions = /** @type {AST.Expression[]} */ (
			node.expressions.map((expr) => context.visit(expr))
		);
		return b.template(node.quasis, expressions, /** @type {AST.NodeWithLocation} */ (node));
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

		if (context.state.to_ts) {
			// Convert imports inside `module server` to local variables.
			// ImportDeclaration() visitor will add imports to the top of the module
			/** @type {AST.VariableDeclaration[]} */
			const server_block_locals = [];

			const block = /** @type {AST.TSModuleBlock} */ (
				context.visit(node.body, {
					...context.state,
					ancestor_server_block: node,
					server_block_locals,
				})
			);

			/** @type {AST.Property[]} */
			const properties = [];
			for (const name of node.metadata.exports ?? []) {
				const id = b.id(name);
				properties.push(b.prop('init', id, id, false, true));
			}

			const value = b.call(
				b.thunk(b.block([...server_block_locals, ...block.body, b.return(b.object(properties))])),
			);
			value.loc = node.loc;

			const server_identifier = b.id(
				SERVER_IDENTIFIER,
				/** @type {AST.NodeWithLocation} */ (node.id),
			);
			server_identifier.metadata.source_name = 'server';

			const server_const = b.const(server_identifier, value);
			server_const.loc = node.loc;

			return server_const;
		}

		return b.empty;
	},

	Program(node, context) {
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
 * @param {Array<string | AST.Expression>} items
 */
function join_template(items) {
	let quasi = b.quasi('');
	const template = b.template([quasi], []);

	/**
	 * @param {AST.Expression} expression
	 */
	function push(expression) {
		if (expression.type === 'TemplateLiteral') {
			for (let i = 0; i < expression.expressions.length; i += 1) {
				const q = expression.quasis[i];
				const e = expression.expressions[i];

				quasi.value.cooked += /** @type {string} */ (q.value.cooked);
				push(e);
			}

			const last = expression.quasis.at(-1);
			quasi.value.cooked += /** @type {string} */ (last?.value.cooked);
		} else if (expression.type === 'Literal') {
			/** @type {string} */ (quasi.value.cooked) += expression.value;
		} else {
			template.expressions.push(expression);
			template.quasis.push((quasi = b.quasi('')));
		}
	}

	for (const item of items) {
		if (typeof item === 'string') {
			quasi.value.cooked += item;
		} else {
			push(item);
		}
	}

	for (const quasi of template.quasis) {
		quasi.value.raw = sanitizeTemplateString(/** @type {string} */ (quasi.value.cooked));
	}

	quasi.tail = true;

	return template;
}

/**
 * @typedef {AST.Statement | ESTreeJSX.JSXElement | AST.TSRXJSXFragment} TsrxTsStatement
 * @typedef {AST.Expression | ESTreeJSX.JSXElement | AST.TSRXJSXFragment} TsrxTsExpression
 * @typedef {ESTreeJSX.JSXText | ESTreeJSX.JSXExpressionContainer | ESTreeJSX.JSXElement | AST.TSRXJSXElement | AST.TSRXJSXFragment} TsrxTsxChild
 * @typedef {TsrxTsExpression | ESTreeJSX.JSXText | ESTreeJSX.JSXExpressionContainer} TsrxTsViewNode
 */

/**
 * @param {TsrxTsStatement} statement
 * @returns {TsrxTsExpression | null}
 */
function statement_to_tsrx_ts_expression(statement) {
	if (statement.type === 'ExpressionStatement') {
		return /** @type {AST.ExpressionStatement} */ (statement).expression;
	}
	const node = /** @type {AST.Node} */ (statement);
	if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
		return /** @type {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment} */ (node);
	}
	return null;
}

/**
 * @param {TsrxTsxChild[]} children
 * @param {boolean} in_jsx_child
 * @param {AST.NodeWithLocation} loc_node
 * @returns {TsrxTsViewNode}
 */
function build_tsrx_ts_return_expression(children, in_jsx_child, loc_node) {
	if (children.length === 0) {
		// An empty fragment is a real value: keep it as `<></>` even in expression
		// position. Lowering it to `null` (e.g. `let b = <></>`) drops the author's
		// fragment; `<></>` is a valid value and matches the JSX targets' TS view.
		return setLocation(b.jsx_fragment([]), loc_node);
	}
	if (children.length === 1) {
		const only = children[0];
		if (only.type === 'JSXText') {
			// Stay faithful to the source: keep a single text child as `<>text</>`
			// rather than promoting it to a `{'text'}` string literal. Promotion mangles
			// characters like `@` (a valid text char) into `{'@'}` and loses fidelity.
			return setLocation(b.jsx_fragment([only]), /** @type {AST.NodeWithLocation} */ (only));
		}
		if (only.type === 'JSXExpressionContainer' && !in_jsx_child) {
			return only.expression;
		}
		if (is_empty_jsx_fragment(only)) {
			// `<><></></>` — keep the outer fragment instead of collapsing to the bare
			// inner `<></>`, matching the JSX targets and preserving author intent.
			return setLocation(b.jsx_fragment([only]), loc_node);
		}
		return /** @type {TsrxTsViewNode} */ (only);
	}
	return b.jsx_fragment(children);
}

/**
 * @param {AST.Node[]} children
 * @param {VisitorClientContext} context
 * @returns {TsrxTsStatement[]}
 */
function transform_tsrx_ts_children(children, context) {
	const { state } = context;
	/** @type {TsrxTsStatement[]} */
	const init = [];
	const ts_state = { ...state, init };

	for (const child of lower_code_block_children(children, state.scopes)) {
		if (child == null || child.type === 'EmptyStatement') continue;
		// Spread `context` (not just `visit`/`state`) so flags like `value_position`
		// reach nested fragment/element children — see transform_tsrx_tsx_child.
		transform_ts_child(
			/** @type {AST.Node} */ (child),
			/** @type {TransformClientContext} */ ({ ...context, state: ts_state }),
		);
	}

	return init.filter((statement) => statement.type !== 'EmptyStatement');
}

/**
 * Builds a TSX expression for Volar/TypeScript output. Pure template children can
 * remain inline JSX; fragments with setup statements need an IIFE so declarations
 * stay in statement position.
 *
 * @param {ESTreeJSX.JSXFragment | AST.TSRXJSXFragment} node
 * @param {VisitorClientContext} context
 * @param {boolean} [in_jsx_child]
 * @returns {TsrxTsViewNode}
 */
function build_tsrx_to_ts_expression(node, context, in_jsx_child = false) {
	// A compiler-generated wrapper (utils.js `wrap_directive_in_jsx_fragment`) around
	// a single VALUE-position directive lowers to a TYPED VALUE (ternary / `.map` /
	// returning IIFE), not the void render IIFE `transform_tsrx_tsx_children` would
	// emit. Render position never sets `tsrx_generated_wrapper`, so it is unaffected;
	// authored `<> … </>` (no wrapper flag) keeps flowing through the normal path.
	if (node.metadata?.tsrx_generated_wrapper === true) {
		const only = /** @type {AST.Node | undefined} */ (
			(node.children || []).find((child) => child && child.type !== 'EmptyStatement')
		);
		if (only && is_template_directive(only)) {
			const value = build_tsrx_ts_directive_value(only, context);
			return in_jsx_child ? b.jsx_expression_container(value) : value;
		}
	}
	const children = transform_tsrx_tsx_children(/** @type {AST.Node[]} */ (node.children), context);
	return build_tsrx_ts_return_expression(
		children,
		in_jsx_child,
		/** @type {AST.NodeWithLocation} */ (/** @type {unknown} */ (node)),
	);
}

/**
 * @param {ESTreeJSX.JSXExpressionContainer | ESTreeJSX.JSXText} node
 * @returns {AST.NodeWithLocation | undefined}
 */
function get_tsrx_expression_container_location(node) {
	if (node.loc) return /** @type {AST.NodeWithLocation} */ (node);

	const expression = /** @type {AST.Expression & Partial<AST.NodeWithLocation>} */ (
		/** @type {ESTreeJSX.JSXExpressionContainer} */ (node).expression
	);
	if (!expression.loc || node.start == null || node.end == null) {
		return undefined;
	}

	return /** @type {AST.NodeWithLocation} */ ({
		start: node.start,
		end: node.end,
		loc: {
			start: {
				line: expression.loc.start.line,
				column: Math.max(0, expression.loc.start.column - 1),
			},
			end: {
				line: expression.loc.end.line,
				column: expression.loc.end.column + 1,
			},
		},
	});
}

/**
 * @param {AST.Node[]} children
 * @param {VisitorClientContext} context
 * @returns {TsrxTsxChild[]}
 */
function transform_tsrx_tsx_children(children, context) {
	/** @type {TsrxTsxChild[]} */
	const transformed_children = [];
	/** @type {AST.Node[]} */
	let pending_statement_children = [];

	const flush_pending_statement_children = () => {
		if (pending_statement_children.length === 0) return;

		const statements = transform_body(pending_statement_children, context);
		if (statements.length > 0) {
			transformed_children.push(b.jsx_expression_container(b.call(b.thunk(b.block(statements)))));
		}
		pending_statement_children = [];
	};

	for (const child of lower_code_block_children(children, context.state.scopes)) {
		const transformed = transform_tsrx_tsx_child(child, context);
		if (transformed === undefined) {
			pending_statement_children.push(child);
			continue;
		}

		flush_pending_statement_children();
		if (transformed !== null) {
			transformed_children.push(transformed);
		}
	}

	flush_pending_statement_children();
	return /** @type {TsrxTsxChild[]} */ (wrap_edge_whitespace(transformed_children));
}

/**
 * @param {AST.Node} node
 * @param {VisitorClientContext} context
 * @returns {TsrxTsxChild | null | undefined}
 */
function transform_tsrx_tsx_child(node, context) {
	if (node == null || node.type === 'EmptyStatement') {
		return null;
	}

	if (node.type === 'JSXText') {
		const value = get_template_text_value(node, true);
		return setLocation(b.jsx_text(value, value), /** @type {AST.NodeWithLocation} */ (node));
	}

	if (node.type === 'JSXExpressionContainer') {
		// A `{/* comment */}` container renders nothing.
		if (is_empty_expression_container(node)) {
			return null;
		}
		// An EMPTY fragment that is the container's expression (`<b>{<></>}</b>`) must
		// stay `<></>`: the `{}` already supplies the wrapper, so the default
		// `in_jsx_child = false` lowering to a bare `null` drops the source fragment.
		// Build it as a JSX child instead. Non-empty fragments keep their existing
		// lowering (e.g. `{<>{a}</>}` still unwraps to `{a}`). This matches the JSX
		// targets and how the same fragment survives in an attribute value.
		const expr = node.expression;
		// Both fragment shapes carry AST.Node children (the strict estree-jsx
		// children are a subset).
		const fragment_children =
			expr.type === 'JSXFragment' && is_template_fragment(expr)
				? /** @type {AST.Node[]} */ (expr.children || [])
				: null;
		const is_empty_fragment =
			fragment_children !== null &&
			!fragment_children.some(
				(child) =>
					child &&
					child.type !== 'EmptyStatement' &&
					(child.type !== 'JSXText' || get_template_text_value(child, true) !== ''),
			);
		const expression = is_empty_fragment
			? build_tsrx_to_ts_expression(/** @type {ESTreeJSX.JSXFragment} */ (expr), context, true)
			: /** @type {AST.Expression} */ (context.visit(node.expression, context.state));
		return b.jsx_expression_container(
			/** @type {AST.Expression} */ (expression),
			get_tsrx_expression_container_location(node),
		);
	}

	if (is_template_element(node) || node.type === 'JSXStyleElement') {
		const expression = transform_ts_child(node, {
			...context,
			state: { ...context.state, init: null },
		});
		return expression
			? /** @type {TsrxTsxChild} */ (/** @type {unknown} */ (expression))
			: undefined;
	}

	if (is_template_fragment(node)) {
		// `in_jsx_child` mode already returns a valid JSX child (a fragment, or a
		// `{expr}` container kept for type visibility), so use it as-is. Only a bare
		// expression (which can happen in other positions) needs wrapping.
		const expression = build_tsrx_to_ts_expression(
			/** @type {ESTreeJSX.JSXFragment} */ (node),
			context,
			true,
		);
		if (
			expression.type === 'JSXElement' ||
			expression.type === 'JSXFragment' ||
			expression.type === 'JSXExpressionContainer' ||
			expression.type === 'JSXText'
		) {
			return expression;
		}
		return b.jsx_expression_container(expression);
	}

	// A directive nested as a child of VALUE content (inside an authored fragment that
	// is itself a directive's branch/case value) is value content too — lower it to
	// its value (`{cond ? <a/> : <b/>}`), like the JS targets. In render position (a
	// direct child of the component's rendered output) `@if`/`@for`/`@try` still render
	// as statements, so that is gated on `value_position`.
	//
	// A `@switch` is the exception: `@case` always renders and cannot `break`/fall through,
	// so lowering it to a render statement leaves cases without a `return`, which TS reports
	// as "Fallthrough case in switch" (7029). Its value form already returns from every case
	// (with a trailing `return null`), so lower a `@switch` child to its value in render
	// position too — it renders the matched case's output all the same.
	if (
		is_template_directive(node) &&
		(context.value_position || node.type === 'JSXSwitchExpression')
	) {
		return b.jsx_expression_container(build_tsrx_ts_directive_value(node, context));
	}

	return undefined;
}

/**
 * @param {TsrxTsStatement[]} statements
 * @returns {AST.Statement[]}
 */
function transform_tsrx_ts_statements_to_render_body(statements) {
	/** @type {AST.Statement[]} */
	const body = [];

	for (const statement of statements) {
		const child = statement_to_tsrx_ts_expression(statement);
		body.push(
			child
				? b.return(/** @type {AST.Expression} */ (child))
				: /** @type {AST.Statement} */ (statement),
		);
	}

	return body;
}

/**
 * @param {AST.Node[]} children
 * @param {VisitorClientContext} context
 * @returns {AST.Statement[]}
 */
function transform_tsrx_ts_render_children(children, context) {
	/** @type {AST.Statement[]} */
	const body = [];

	for (const child of lower_code_block_children(children, context.state.scopes)) {
		if (child == null || child.type === 'EmptyStatement') continue;

		if (is_template_or_control_flow(child)) {
			if (
				is_template_directive(child) ||
				child.type === 'IfStatement' ||
				child.type === 'ForOfStatement' ||
				child.type === 'SwitchStatement' ||
				child.type === 'TryStatement'
			) {
				body.push(transform_tsrx_ts_render_control_flow_statement(child, context));
			} else {
				body.push(
					...transform_tsrx_ts_statements_to_render_body(
						transform_tsrx_ts_children([child], context),
					),
				);
			}
		} else {
			body.push(
				.../** @type {AST.Statement[]} */ (
					transform_tsrx_ts_children([/** @type {AST.Node} */ (child)], context)
				),
			);
		}
	}

	return body;
}

/**
 * @param {AST.Node} node
 * @param {VisitorClientContext} context
 * @returns {AST.Statement}
 */
function transform_tsrx_ts_render_node(node, context) {
	const body = transform_tsrx_ts_render_children([node], context);
	return body.length === 1 ? body[0] : b.block(body);
}

/**
 * Whether a generated statement is guaranteed to return or throw, so control cannot
 * reach past it. Used to decide whether a `@switch` case needs a synthetic trailing
 * `return` in the type-only view (a `@case` always renders and cannot fall through,
 * so the generated case must definitely return — otherwise TS reports 7029).
 * @param {AST.Statement | null | undefined} statement
 * @returns {boolean}
 */
function statement_definitely_returns(statement) {
	if (!statement) {
		return false;
	}
	if (statement.type === 'ReturnStatement' || statement.type === 'ThrowStatement') {
		return true;
	}
	if (statement.type === 'BlockStatement') {
		return statement_definitely_returns(statement.body[statement.body.length - 1]);
	}
	if (statement.type === 'IfStatement') {
		return (
			statement.alternate != null &&
			statement_definitely_returns(/** @type {AST.Statement} */ (statement.consequent)) &&
			statement_definitely_returns(/** @type {AST.Statement} */ (statement.alternate))
		);
	}
	return false;
}

/**
 * @param {AST.JSXIfExpression | AST.JSXForExpression | AST.JSXSwitchExpression | AST.JSXTryExpression | AST.IfStatement | AST.ForOfStatement | AST.SwitchStatement | AST.TryStatement} node
 * @param {VisitorClientContext} context
 * @returns {AST.Statement}
 */
function transform_tsrx_ts_render_control_flow_statement(node, context) {
	if (node.type === 'JSXIfExpression' || node.type === 'IfStatement') {
		const consequent_scope =
			/** @type {ScopeInterface} */ (context.state.scopes.get(node.consequent)) ||
			context.state.scope;
		const consequent_body =
			node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
		const consequent = b.block(
			transform_tsrx_ts_render_children(consequent_body, {
				...context,
				state: { ...context.state, scope: consequent_scope },
			}),
			/** @type {AST.NodeWithLocation} */ (node.consequent),
		);

		let alternate = null;
		if (node.alternate !== null) {
			const alternate_node = /** @type {AST.Statement} */ (node.alternate);
			const alternate_scope = context.state.scopes.get(alternate_node) || context.state.scope;
			alternate =
				alternate_node.type === 'IfStatement'
					? transform_tsrx_ts_render_control_flow_statement(alternate_node, {
							...context,
							state: { ...context.state, scope: alternate_scope },
						})
					: b.block(
							transform_tsrx_ts_render_children(
								alternate_node.type === 'BlockStatement' ? alternate_node.body : [alternate_node],
								{
									...context,
									state: { ...context.state, scope: alternate_scope },
								},
							),
							/** @type {AST.NodeWithLocation} */ (alternate_node),
						);
		}

		return b.if(
			/** @type {AST.Expression} */ (context.visit(node.test, context.state)),
			consequent,
			alternate,
			/** @type {AST.NodeWithLocation} */ (node),
		);
	}

	if (
		node.type === 'ForOfStatement' ||
		(node.type === 'JSXForExpression' && node.statementType === 'ForOfStatement')
	) {
		const body_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.body));
		const block_body = transform_tsrx_ts_render_children(
			/** @type {AST.BlockStatement} */ (node.body).body,
			{
				...context,
				state: { ...context.state, scope: body_scope },
			},
		);
		if (node.key) {
			block_body.unshift(b.stmt(/** @type {AST.Expression} */ (context.visit(node.key))));
		}
		if (node.index) {
			block_body.unshift(
				b.let(/** @type {AST.Identifier} */ (context.visit(node.index)), b.literal(0)),
			);
		}
		const empty =
			node.empty != null
				? b.block(
						transform_tsrx_ts_render_children(node.empty.body, {
							...context,
							state: {
								...context.state,
								scope: context.state.scopes.get(node.empty) || context.state.scope,
							},
						}),
						/** @type {AST.NodeWithLocation} */ (node.empty),
					)
				: null;

		const result = b.for_of(
			/** @type {AST.Pattern} */ (context.visit(/** @type {AST.Node} */ (node.left))),
			/** @type {AST.Expression} */ (context.visit(/** @type {AST.Node} */ (node.right))),
			b.block(block_body),
			node.await,
			/** @type {AST.NodeWithLocation} */ (node),
		);
		result.empty = empty;
		return result;
	}

	if (node.type === 'SwitchStatement' || node.type === 'JSXSwitchExpression') {
		const cases = node.cases.map((switch_case) => {
			const consequent_scope =
				context.state.scopes.get(switch_case.consequent) || context.state.scope;
			const body = transform_tsrx_ts_render_children(
				flatten_switch_consequent(switch_case.consequent),
				{
					...context,
					state: { ...context.state, scope: consequent_scope },
				},
			);

			// A `@case` always renders and cannot `break`/fall through, so the generated case
			// must definitely return. When its render is conditional (e.g. an `@if` with no
			// else) or the case is empty, control can reach the end and TS reports
			// "Fallthrough case in switch" (7029). Append a trailing `return <></>` (render
			// nothing) — but only when the body doesn't already definitely return, so we never
			// emit unreachable code.
			if (!statement_definitely_returns(body[body.length - 1])) {
				body.push(b.return(b.jsx_fragment([])));
			}

			return b.switch_case(
				switch_case.test ? /** @type {AST.Expression} */ (context.visit(switch_case.test)) : null,
				body,
			);
		});

		return b.switch(
			/** @type {AST.Expression} */ (context.visit(node.discriminant)),
			cases,
			/** @type {AST.NodeWithLocation} */ (node),
		);
	}

	const try_node = /** @type {AST.TryStatement | AST.JSXTryExpression} */ (node);
	const try_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(try_node.block));
	const try_body = b.block(
		transform_tsrx_ts_render_children(try_node.block.body, {
			...context,
			state: { ...context.state, scope: try_scope },
		}),
		/** @type {AST.NodeWithLocation} */ (try_node.block),
	);

	let catch_handler = null;
	if (try_node.handler) {
		const catch_scope = /** @type {ScopeInterface} */ (
			context.state.scopes.get(try_node.handler.body)
		);
		catch_handler = b.catch_clause(
			try_node.handler.param || null,
			try_node.handler.resetParam || null,
			b.block(
				transform_tsrx_ts_render_children(try_node.handler.body.body, {
					...context,
					state: { ...context.state, scope: catch_scope },
				}),
				/** @type {AST.NodeWithLocation} */ (try_node.handler.body),
			),
			/** @type {AST.NodeWithLocation} */ (try_node.handler),
		);
	}

	const pending = try_node.pending
		? b.block(
				transform_tsrx_ts_render_children(try_node.pending.body, {
					...context,
					state: {
						...context.state,
						scope: /** @type {ScopeInterface} */ (context.state.scopes.get(try_node.pending)),
					},
				}),
				/** @type {AST.NodeWithLocation} */ (try_node.pending),
			)
		: null;
	const finalizer = try_node.finalizer
		? b.block(
				transform_body(try_node.finalizer.body, {
					...context,
					state: {
						...context.state,
						scope: /** @type {ScopeInterface} */ (context.state.scopes.get(try_node.finalizer)),
					},
				}),
				/** @type {AST.NodeWithLocation} */ (try_node.finalizer),
			)
		: null;

	return b.try(try_body, catch_handler, finalizer, pending);
}

/**
 * Lower a VALUE-position control-flow directive (`const v = @if (…) { … }`) to a
 * typed TS value for the to_ts view — a ternary (`@if`), an array `.map` (`@for`),
 * or a returning IIFE (`@switch`/`@try`) — matching the JS targets' types. Unlike
 * the render path (`transform_tsrx_ts_render_control_flow_statement`), each branch
 * LEAF is returned, so the value is not a void IIFE. Render position never reaches
 * here — only the generated value-wrapper fragment does (see
 * `build_tsrx_to_ts_expression`).
 * @param {AST.JSXTemplateDirective | AST.IfStatement} node — a directive, or a
 * plain `IfStatement` link of an `@else if` chain (the recursion below)
 * @param {VisitorClientContext} context
 * @returns {AST.Expression}
 */
function build_tsrx_ts_directive_value(node, context) {
	const scoped = (/** @type {AST.Node | AST.Node[]} */ scope_node) => ({
		...context,
		// Everything lowered as a directive's branch/case value is value content, so a
		// directive nested in a fragment here lowers to a value (see transform_tsrx_tsx_child).
		value_position: true,
		state: {
			...context.state,
			scope:
				/** @type {ScopeInterface} */ (context.state.scopes.get(scope_node)) || context.state.scope,
		},
	});
	// Combine a render expression into a JSX child so multiple siblings can be
	// merged into one fragment.
	const to_fragment_child = (/** @type {TsrxTsViewNode} */ expr) =>
		expr?.type === 'JSXElement' ||
		expr?.type === 'JSXFragment' ||
		expr?.type === 'JSXText' ||
		expr?.type === 'JSXExpressionContainer'
			? expr
			: b.jsx_expression_container(/** @type {AST.Expression} */ (expr));

	// Lower a branch body to statements ending in a SINGLE `return` of the combined
	// render value. All sibling templates — plain elements/expressions AND nested
	// `@if`/`@for`/`@switch`/`@try` directives (each lowered to its own VALUE) — are
	// merged into one `return <> … </>` (not several returns where only the first is
	// reachable, nor a bare nested `if` dropped from the value). Setup statements are
	// kept before the return so they share the IIFE scope.
	const branch_returning_body = (
		/** @type {AST.Node[]} */ body,
		/** @type {AST.Node | AST.Node[]} */ scope_node,
	) => {
		const ctx = scoped(scope_node);
		/** @type {AST.Statement[]} */
		const setup = [];
		/** @type {any[]} */
		const renders = [];
		for (const stmt of lower_code_block_children(body, context.state.scopes)) {
			if (stmt == null || stmt.type === 'EmptyStatement') continue;
			if (is_template_directive(stmt)) {
				// A nested directive is render content here — lower it to its own value.
				renders.push(to_fragment_child(build_tsrx_ts_directive_value(stmt, scoped(stmt))));
				continue;
			}
			// A render node lowers to a render expression (collected into the fragment);
			// anything else (a `const`, a side effect) stays setup before the return.
			for (const lowered of transform_tsrx_ts_children([stmt], ctx)) {
				const expr = statement_to_tsrx_ts_expression(lowered);
				if (expr) renders.push(to_fragment_child(expr));
				else setup.push(/** @type {AST.Statement} */ (lowered));
			}
		}
		const value = build_tsrx_ts_return_expression(
			renders,
			false,
			/** @type {AST.NodeWithLocation} */ (scope_node),
		);
		return [...setup, b.return(/** @type {AST.Expression} */ (value))];
	};

	// A branch as a VALUE (a ternary arm): the bare value when there is no setup, an
	// IIFE that returns it otherwise.
	const branch_value = (/** @type {AST.Node[]} */ body, /** @type {AST.Node} */ scope_node) => {
		const stmts = branch_returning_body(body, scope_node);
		if (stmts.length === 1 && stmts[0].type === 'ReturnStatement' && stmts[0].argument) {
			return /** @type {AST.Expression} */ (stmts[0].argument);
		}
		return b.call(b.thunk(b.block(stmts)));
	};

	// An `@else if` chain link recurses here as a plain `IfStatement` — it
	// lowers exactly like the rooting `@if`, to the ternary's next arm.
	if (node.type === 'JSXIfExpression' || node.type === 'IfStatement') {
		const cons_body =
			node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
		const consequent = branch_value(cons_body, node.consequent);
		let alternate = /** @type {AST.Expression} */ (b.literal(null));
		if (node.alternate) {
			const alt = node.alternate;
			alternate =
				alt.type === 'IfStatement'
					? build_tsrx_ts_directive_value(alt, scoped(alt))
					: branch_value(alt.type === 'BlockStatement' ? alt.body : [alt], alt);
		}
		return b.conditional(
			/** @type {AST.Expression} */ (context.visit(node.test, context.state)),
			consequent,
			alternate,
		);
	}

	if (
		node.type === 'JSXForExpression' &&
		(node.statementType === 'ForOfStatement' || node.statementType === 'ForInStatement')
	) {
		// `@for await` iterates an AsyncIterable, which `Array.from` does NOT accept.
		// Accumulate with a real `for await` loop instead (the runtime renders via
		// `_$_.for`; this is the to_ts type view only). Await the async IIFE so the
		// binding types as the item array, not a `Promise` — the enclosing component is
		// async, since `for await` requires it.
		if (node.statementType === 'ForOfStatement' && node.await) {
			const items_id = b.id('$$items');
			/** @type {AST.Statement[]} */
			const loop_body = [];
			// `; index i` has no map-callback equivalent here; declare it as a typed
			// `number` (its runtime value is irrelevant to the type view), like the
			// render path. `; key expr` stays so it type-checks.
			if (node.index) {
				loop_body.push(
					b.let(/** @type {AST.Identifier} */ (context.visit(node.index)), b.literal(0)),
				);
			}
			if (node.key) {
				loop_body.push(b.stmt(/** @type {AST.Expression} */ (context.visit(node.key))));
			}
			loop_body.push(
				b.stmt(
					b.call(
						b.member(items_id, b.id('push')),
						b.call(b.thunk(b.block(branch_returning_body(node.body.body, node.body)))),
					),
				),
			);
			const for_await = b.for_of(
				/** @type {AST.Pattern} */ (context.visit(node.left)),
				/** @type {AST.Expression} */ (context.visit(node.right)),
				b.block(loop_body),
				true,
				/** @type {AST.NodeWithLocation} */ (node),
			);
			const result =
				node.empty != null
					? b.conditional(
							b.binary('===', b.member(items_id, b.id('length')), b.literal(0)),
							branch_value(node.empty.body, node.empty),
							items_id,
						)
					: items_id;
			const iife = b.arrow(
				[],
				b.block([b.const(items_id, b.array([])), for_await, b.return(result)]),
				true,
			);
			// The custom esrap AwaitExpression printer reads `node.loc`, so stamp it.
			return setLocation(b.await(b.call(iife)), /** @type {AST.NodeWithLocation} */ (node));
		}
		const body = branch_returning_body(
			/** @type {AST.BlockStatement} */ (node.body).body,
			node.body,
		);
		// A keyed `@for (…; key expr)` evaluates `expr` per item — keep it so the key
		// type-checks (it references the loop variable), matching the render path.
		if (node.key) {
			body.unshift(b.stmt(/** @type {AST.Expression} */ (context.visit(node.key))));
		}
		// `node.left` is a `const x` VariableDeclaration; the `.map` callback needs the
		// bare pattern (`x`), not the declaration statement. `; index i` becomes the
		// callback's second parameter (`(x, i)`), not a dropped reference.
		const left = node.left;
		const param = left.type === 'VariableDeclaration' ? left.declarations[0].id : left;
		const params = [/** @type {AST.Pattern} */ (context.visit(param))];
		if (node.index) {
			params.push(/** @type {AST.Pattern} */ (context.visit(node.index)));
		}
		// `@for` iterates ANY iterable, but many (Set, Map, generators) have no `.length`
		// or `.map`, so lowering those directly typed the binding as an error and never
		// surfaced the `@empty` branch. `Array.from(iterable)` yields a real array — the
		// Ripple `to_ts` analog of the JS targets' `map_iterable` helper.
		const items = () =>
			b.call(
				b.member(b.id('Array'), b.id('from')),
				/** @type {AST.Expression} */ (context.visit(node.right)),
			);
		const map_arrow = b.arrow(params, b.block(body));
		if (node.empty != null) {
			// Bind `Array.from(iterable)` ONCE: a one-shot iterable (a generator) would be
			// exhausted by a second `Array.from`, so the `.length` test and the `.map` must
			// read the same materialized array.
			const items_id = b.id('$$items');
			return b.call(
				b.thunk(
					b.block([
						b.const(items_id, items()),
						b.return(
							b.conditional(
								b.binary('===', b.member(items_id, b.id('length')), b.literal(0)),
								branch_value(node.empty.body, node.empty),
								b.call(b.member(items_id, b.id('map')), map_arrow),
							),
						),
					]),
				),
			);
		}
		return b.call(b.member(items(), b.id('map')), map_arrow);
	}

	if (node.type === 'JSXSwitchExpression') {
		const cases = node.cases.map((sc) =>
			b.switch_case(
				sc.test ? /** @type {AST.Expression} */ (context.visit(sc.test)) : null,
				branch_returning_body(flatten_switch_consequent(sc.consequent), sc.consequent),
			),
		);
		const switch_stmt = b.switch(
			/** @type {AST.Expression} */ (context.visit(node.discriminant)),
			cases,
			/** @type {AST.NodeWithLocation} */ (node),
		);
		return b.call(b.thunk(b.block([switch_stmt, b.return(b.literal(null))])));
	}

	if (node.type === 'JSXTryExpression') {
		// TryStatement: try/catch/pending leaves return; a `finally` must not.
		const try_body = b.block(
			branch_returning_body(node.block.body, node.block),
			/** @type {AST.NodeWithLocation} */ (node.block),
		);
		let catch_handler = null;
		if (node.handler) {
			catch_handler = b.catch_clause(
				node.handler.param || null,
				node.handler.resetParam || null,
				b.block(
					branch_returning_body(node.handler.body.body, node.handler.body),
					/** @type {AST.NodeWithLocation} */ (node.handler.body),
				),
				/** @type {AST.NodeWithLocation} */ (node.handler),
			);
		}
		const pending = node.pending
			? b.block(
					branch_returning_body(node.pending.body, node.pending),
					/** @type {AST.NodeWithLocation} */ (node.pending),
				)
			: null;
		const finalizer = node.finalizer
			? b.block(
					transform_body(node.finalizer.body, scoped(node.finalizer)),
					/** @type {AST.NodeWithLocation} */ (node.finalizer),
				)
			: null;
		return b.call(b.thunk(b.block([b.try(try_body, catch_handler, finalizer, pending)])));
	}

	// Only `@for (;;)` remains — it renders repeatedly with no item binding, so
	// it has no value form (previously this fell into the `@try` lowering and
	// crashed on the missing `block`).
	throw new Error('A `@for (;;)` directive cannot be used as a value.');
}

/**
 * @param {AST.Node} node
 * @param {TransformClientContext} context
 */
function transform_ts_child(node, context) {
	const { state, visit } = context;

	if (is_template_text_or_expression(node)) {
		if (is_empty_expression_container(node)) {
			return;
		}
		state.init?.push(
			b.stmt(
				/** @type {AST.Expression} */ (visit(get_template_expression(node, true), { ...state })),
			),
		);
	} else if (node.type === 'JSXStyleElement') {
		// to_ts: emit an empty `<style>` element for type-only mappings. The CSS
		// children are TSRX stylesheet AST, never printed as TSX children, and
		// style attributes were never carried over.
		const jsxElement = b.jsx_element(node, [], []);
		disable_style_anchor_verification(jsxElement);
		if (!state.init) {
			return jsxElement;
		}
		if (node.unclosed) {
			state.init?.push(/** @type {AST.Statement} */ (/** @type {unknown} */ (jsxElement)));
		} else {
			state.init?.push(b.stmt(jsxElement));
		}
	} else if (is_template_element(node)) {
		// is_template_element stays a boolean predicate — narrow the element once.
		let element = /** @type {AST.TSRXJSXElement} */ (node);
		const lowered = lower_dynamic_element(element, undefined, state.scopes);
		if (lowered) {
			state.imports.add(`import { Dynamic as ${dynamic_element_import_local} } from 'ripple'`);
			element = lowered;
		}

		/** @type {TsrxTsxChild[]} */
		const children = [];
		let has_children_props = false;
		const is_dom_element = is_element_dom_element(element);
		const element_name = get_element_identifier(element)?.name ?? null;
		const child_namespace =
			is_dom_element && element_name !== null
				? determine_namespace_for_children(element_name, state.namespace)
				: state.namespace;

		const attributes = get_element_attributes(element).map((attr) => {
			if (attr.type === 'JSXAttribute') {
				const name = visit(get_attribute_name_node(attr), state);
				const attr_value = /** @type { AST.Expression & AST.NodeWithLocation | null} */ (
					get_attribute_value(attr)
				);
				/** @type {string} */
				let prop_name;
				/** @type {AST.Identifier} */
				let name_node;
				if (name.type === 'Identifier') {
					name_node = name;
					prop_name = name.name;
				} else {
					name_node = get_attribute_name_node(attr);
					prop_name = get_attribute_name(attr) || 'unknown';
				}
				const ref_target_type =
					prop_name === 'ref' ? create_element_ref_target_type(element, state) : null;
				const value =
					attr_value === null
						? // <div attr>, not adding `name` for loc because `jsx_name` below
							// will take care of the mapping JSXAttribute's JSXIdentifier
							b.literal(true)
						: // reset init, update, final to avoid adding attr value to the component body
							visit(
								attr_value,
								SetStateForOutsideComponent(
									state,
									ref_target_type ? { ref_target_type } : undefined,
								),
							);

				const jsx_name = b.jsx_id(prop_name, /** @type {AST.NodeWithLocation} */ (name_node));
				if (prop_name === 'children') {
					has_children_props = true;
				}

				const jsx_attr = b.jsx_attribute(
					jsx_name,
					// match the source code usage of expressions for literals
					// for proper source mapping to avoid turning strings into expressions
					attr_value?.type === 'Literal' && !is_expression_attribute(attr)
						? /** @type {AST.Literal} */ (value)
						: b.jsx_expression_container(
								/** @type {AST.Expression} */ (value),
								attr_value === null
									? /** @type {AST.NodeWithLocation} */ (value)
									: // account location for opening and closing braces around the expression
										/** @type {AST.NodeWithLocation} */ ({
											start: attr_value.start - 1,
											end: attr_value.end + 1,
											loc: {
												start: {
													line: attr_value.loc.start.line,
													column: attr_value.loc.start.column - 1,
												},
												end: {
													line: attr_value.loc.end.line,
													column: attr_value.loc.end.column + 1,
												},
											},
										}),
							),
					attr.shorthand ?? false,
					/** @type {AST.NodeWithLocation} */ (attr),
				);
				return jsx_attr;
			} else if (attr.type === 'JSXSpreadAttribute') {
				const argument = visit(attr.argument, state);
				return b.jsx_spread_attribute(
					/** @type {AST.Expression} */ (argument),
					/** @type {AST.NodeWithLocation} */ (attr),
				);
			} else {
				// Should not happen
				throw new Error(`Unexpected attribute type: ${/** @type {AST.Node} */ (attr).type}`);
			}
		});

		if (
			!is_self_closing(element) &&
			!element.unclosed &&
			!has_children_props &&
			element.children.length > 0
		) {
			const component_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(element));
			const child_context = {
				...context,
				state: {
					...state,
					scope: component_scope,
					inside_head: element_name === 'head' ? true : state.inside_head,
					namespace: child_namespace,
					skip_children_traversal: is_dom_element,
				},
			};
			const thunk =
				element_name === 'style' || is_dom_element
					? null
					: b.thunk(b.block(transform_body(element.children, child_context)));

			if (element_name === 'style') {
				// CSS children are TSRX stylesheet AST, not TSX children. Keep the
				// empty style anchor for type-only mappings, but never print the CSS AST.
			} else if (is_dom_element) {
				children.push(
					...transform_tsrx_tsx_children(
						/** @type {AST.Node[]} */ (element.children),
						/** @type {VisitorClientContext} */ (child_context),
					),
				);
			} else if (thunk !== null) {
				attributes.push(b.jsx_attribute(b.jsx_id('children'), b.jsx_expression_container(thunk)));
			}
		}

		let element_source = element;

		if (get_element_id(element).type === 'MemberExpression') {
			const member = /** @type {AST.MemberExpression} */ (
				visit(get_element_id(element), { ...state })
			);

			// Plant the visited member tag on local copies for the printer — the
			// source element is never mutated.
			const opening = /** @type {ESTreeJSX.TSRXJSXOpeningElement} */ ({
				...element.openingElement,
				name: member,
			});
			const closing = element.closingElement
				? /** @type {ESTreeJSX.TSRXJSXClosingElement} */ ({
						...element.closingElement,
						name: setLocation(
							{ ...member },
							/** @type {AST.NodeWithLocation} */ (element.closingElement.name),
							true,
						),
					})
				: null;
			element_source = { ...element, openingElement: opening, closingElement: closing };
		}

		const jsxElement = b.jsx_element(element_source, attributes, children);
		if (element_name === 'style') {
			disable_style_anchor_verification(jsxElement);
		}

		if (!state.init) {
			return jsxElement;
		}

		// For unclosed elements, push the JSXElement directly without wrapping in ExpressionStatement
		// This keeps it in the AST for mappings but avoids adding a semicolon
		if (element.unclosed) {
			state.init?.push(/** @type {AST.Statement} */ (/** @type {unknown} */ (jsxElement)));
		} else {
			state.init?.push(b.stmt(jsxElement));
		}
	} else if (node.type === 'IfStatement' || node.type === 'JSXIfExpression') {
		const consequent_scope =
			/** @type {ScopeInterface} */ (context.state.scopes.get(node.consequent)) ||
			context.state.scope;
		const consequent_body =
			node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
		const consequent = b.block(
			transform_body(consequent_body, {
				...context,
				state: { ...context.state, scope: consequent_scope },
			}),
			/** @type {AST.NodeWithLocation} */ (node.consequent),
		);

		let alternate;

		if (node.alternate !== null) {
			const alternate_node = /** @type {AST.Statement} */ (node.alternate);
			const alternate_scope = context.state.scopes.get(alternate_node) || context.state.scope;
			const alternate_body =
				alternate_node.type === 'IfStatement'
					? [alternate_node]
					: alternate_node.type === 'BlockStatement'
						? alternate_node.body
						: [alternate_node];
			alternate = b.block(
				transform_body(alternate_body, {
					...context,
					state: { ...context.state, scope: alternate_scope },
				}),
				/** @type {AST.NodeWithLocation} */ (alternate_node),
			);
		}

		const result = b.if(
			/** @type {AST.Expression} */ (visit(node.test)),
			consequent,
			alternate,
			/** @type {AST.NodeWithLocation} */ (node),
		);
		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else if (node.type === 'SwitchStatement' || node.type === 'JSXSwitchExpression') {
		const cases = [];

		for (const switch_case of node.cases) {
			const consequent_scope =
				context.state.scopes.get(switch_case.consequent) || context.state.scope;
			const consequent_body = transform_body(flatten_switch_consequent(switch_case.consequent), {
				...context,
				state: { ...context.state, scope: consequent_scope },
			});

			cases.push(
				b.switch_case(
					switch_case.test ? /** @type {AST.Expression} */ (context.visit(switch_case.test)) : null,
					switch_case.consequent.length && switch_case.consequent[0].type === 'BlockStatement'
						? [
								b.block(
									consequent_body,
									/** @type {AST.NodeWithLocation} */ (switch_case.consequent[0]),
								),
							]
						: consequent_body,
				),
			);
		}

		const result = b.switch(
			/** @type {AST.Expression} */ (context.visit(node.discriminant)),
			cases,
			/** @type {AST.NodeWithLocation} */ (node),
		);

		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else if (
		node.type === 'ForOfStatement' ||
		(node.type === 'JSXForExpression' && node.statementType === 'ForOfStatement')
	) {
		const body_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.body));
		const block_body = transform_body(/** @type {AST.BlockStatement} */ (node.body).body, {
			...context,
			state: { ...context.state, scope: body_scope },
		});
		if (node.key) {
			block_body.unshift(b.stmt(/** @type {AST.Expression} */ (visit(node.key))));
		}
		if (node.index) {
			block_body.unshift(b.let(/** @type {AST.Identifier} */ (visit(node.index)), b.literal(0)));
		}
		const body = b.block(block_body);
		const empty =
			node.empty != null
				? b.block(
						transform_body(node.empty.body, {
							...context,
							state: {
								...context.state,
								scope: context.state.scopes.get(node.empty) || context.state.scope,
							},
						}),
						/** @type {AST.NodeWithLocation} */ (node.empty),
					)
				: null;

		const result = b.for_of(
			/** @type {AST.Pattern} */ (visit(node.left)),
			/** @type {AST.Expression} */ (visit(node.right)),
			body,
			node.await,
			/** @type {AST.NodeWithLocation} */ (node),
		);
		result.empty = empty;

		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else if (node.type === 'TryStatement' || node.type === 'JSXTryExpression') {
		const try_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.block));
		const try_body = b.block(
			transform_body(node.block.body, {
				...context,
				state: { ...context.state, scope: try_scope },
			}),
			/** @type {AST.NodeWithLocation} */ (node.block),
		);

		let catch_handler = null;
		if (node.handler) {
			const catch_scope = /** @type {ScopeInterface} */ (
				context.state.scopes.get(node.handler.body)
			);
			const catch_body = b.block(
				transform_body(node.handler.body.body, {
					...context,
					state: { ...context.state, scope: catch_scope },
				}),
				/** @type {AST.NodeWithLocation} */ (node.handler),
			);
			catch_handler = b.catch_clause(
				node.handler.param || null,
				node.handler.resetParam || null,
				catch_body,
				/** @type {AST.NodeWithLocation} */ (node.handler),
			);
		}

		let pending_block = null;
		if (node.pending) {
			const pending_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.pending));
			pending_block = b.block(
				transform_body(node.pending.body, {
					...context,
					state: { ...context.state, scope: pending_scope },
				}),
				/** @type {AST.NodeWithLocation} */ (node.pending),
			);
		}

		let finally_block = null;
		if (node.finalizer) {
			const finally_scope = /** @type {ScopeInterface} */ (
				context.state.scopes.get(node.finalizer)
			);
			finally_block = b.block(
				transform_body(node.finalizer.body, {
					...context,
					state: { ...context.state, scope: finally_scope },
				}),
				/** @type {AST.NodeWithLocation} */ (node.finalizer),
			);
		}
		const result = b.try(try_body, catch_handler, finally_block, pending_block);
		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else if (is_native_tsrx_function_node(node)) {
		const component = visit(node, state);

		state.init?.push(/** @type {AST.Statement} */ (component));
	} else if (node.type === 'BreakStatement') {
		const result = b.break;

		if (!state.init) {
			return result;
		}
		state.init.push(/** @type {AST.Statement} */ (result));
	} else if (node.type === 'ContinueStatement') {
		const result = b.continue;

		if (!state.init) {
			return result;
		}
		state.init.push(/** @type {AST.Statement} */ (result));
	} else if (is_template_fragment(node)) {
		// is_template_fragment stays a boolean predicate — narrow once.
		const fragment = /** @type {AST.TSRXJSXFragment} */ (node);
		let result = build_tsrx_to_ts_expression(fragment, context);
		// Keep an AUTHORED `<> … </>` here too (a render-output / control-flow branch
		// body, e.g. the `<>{[1,2,3]}</>` branch of an `@if`), so it is not unwrapped to
		// a bare `[1,2,3]`. The fragment's contents (including any `<style>`) are already
		// lowered by `build_tsrx_to_ts_expression`; this only re-adds the `<> … </>`.
		if (is_authored_native_fragment(fragment)) {
			result = wrap_to_ts_value_in_fragment(result, fragment);
		}
		if (!state.init) {
			return result;
		}
		state.init.push(b.stmt(/** @type {AST.Expression} */ (result)));
	} else if (node.type === 'ReturnStatement') {
		const result = b.return(
			node.argument ? /** @type {AST.Expression} */ (visit(node.argument, state)) : undefined,
			/** @type {AST.NodeWithLocation} */ (node),
		);
		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else {
		const result = visit(node, state);
		if (!state.init) {
			return result;
		}
		if (result && /** @type {AST.Node} */ (result).type !== 'EmptyStatement') {
			push_statement(
				/** @type {AST.Statement | AST.Statement[] | AST.Directive | AST.ModuleDeclaration} */ (
					result
				),
				state.init,
			);
		}
	}
}

/**
 * Checks if a node is template or control-flow content
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
 * A `<> … </>` combined INTO a surrounding expression (an operator operand, a
 * conditional branch, an array element, …) rather than being the sole value of a
 * render-output slot. There the to_ts collapse of a single-child fragment to its
 * bare value flips meaning — a fragment is always truthy, but `<>{0}</>` collapses
 * to a falsy `0`, so `<>{0}</> || 'x'` would render `'x'` instead of `0`. Keep the
 * fragment in these positions.
 * @param {AST.Node[]} path
 * @param {AST.Node} node
 * @returns {boolean}
 */
/**
 * An AUTHORED `<> … </>` fragment (not a compiler-generated wrapper around a
 * directive, nor a code-block-chain wrapper). These are kept verbatim in the
 * to_ts output instead of being unwrapped to their single child.
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function is_authored_native_fragment(node) {
	return (
		node?.type === 'JSXFragment' &&
		node.metadata?.native_tsrx === true &&
		node.metadata?.tsrx_generated_wrapper !== true &&
		node.metadata?.tsrx_code_block_chain !== true
	);
}

/**
 * @param {AST.Node[]} path
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_combined_expression_position(path, node) {
	let parent = path.at(-1);
	let slot_node = node;
	// A generated value wrapper is visited FROM its directive's visitor, so the
	// directive sits atop the path — the wrapper stands in the directive's
	// slot, so judge the position against the directive's own parent.
	if (parent?.metadata?.tsrx_value_wrapper === node) {
		slot_node = parent;
		parent = path.at(-2);
	}
	if (!parent || !isTemplateValuePosition(parent, slot_node)) return false;
	switch (parent.type) {
		// Sole-value render-output slots: the collapse is invisible, keep it.
		case 'VariableDeclarator':
			return parent.init !== slot_node;
		case 'AssignmentExpression':
			return parent.right !== slot_node;
		case 'CallExpression':
		case 'NewExpression':
			return !parent.arguments.some((argument) => argument === slot_node);
		default:
			return true;
	}
}

/**
 * Re-wrap a lowered to_ts value in a `<> … </>` fragment so a fragment combined
 * into an expression keeps its fragment identity (see
 * `is_combined_expression_position`). A value that is already a fragment is left
 * as-is; a JSX element/text/container nests directly; any other expression goes in
 * a `{ … }` container.
 * @param {TsrxTsViewNode} expression
 * @param {AST.Node} source
 * @returns {TsrxTsViewNode}
 */
function wrap_to_ts_value_in_fragment(expression, source) {
	if (expression?.type === 'JSXFragment') return expression;
	const child =
		expression?.type === 'JSXElement' ||
		expression?.type === 'JSXText' ||
		expression?.type === 'JSXExpressionContainer'
			? expression
			: b.jsx_expression_container(/** @type {AST.Expression} */ (expression));
	return setLocation(b.jsx_fragment([child]), /** @type {AST.NodeWithLocation} */ (source));
}

/**
 * @param {AST.Node[]} children
 * @param {AST.Node} source_node
 * @param {TransformClientContext} context
 * @returns {AST.CallExpression}
 */
function build_native_tsrx_value_expression(children, source_node, context) {
	const { state, visit } = context;
	const children_filtered = children
		.filter((child) => {
			return child != null && child.type !== 'EmptyStatement';
		})
		.map((child) => {
			if (!child.metadata?.regular_js) return child;
			const metadata = { ...child.metadata };
			delete metadata.regular_js;
			return { ...child, metadata };
		});

	const children_component = create_native_tsrx_render_function([], children_filtered, source_node);

	return b.call(
		'_$_.tsrx_element',
		/** @type {AST.Expression} */ (
			visit(children_component, {
				...state,
				flush_node: null,
				template: null,
				regular_js: false,
				namespace: state.namespace,
				is_tsrx_element: true,
				jsx_to_tsrx_element: true,
			})
		),
	);
}

/**
 * Check if an Element has any dynamic content that would trigger flush_node().
 * An Element has dynamic content if it has:
 * - Dynamic attributes (tracked expressions in attribute values)
 * - Control flow children (IfStatement, ForOfStatement, etc.)
 * - Dynamic text children (non-Literal Text nodes)
 * - Non-DOM element children (components)
 * - Dynamic descendants (recursive)
 * @param {ESTreeJSX.JSXElement} element
 * @returns {boolean}
 */
function element_has_dynamic_content(element) {
	// Check for dynamic attributes
	for (const attr of get_element_attributes(element)) {
		if (attr.type === 'JSXAttribute') {
			const attr_value = get_attribute_value(attr);
			// Dynamic value expression (not null, not Literal)
			if (attr_value !== null && attr_value.type !== 'Literal') {
				return true;
			}
		} else if (attr.type === 'JSXSpreadAttribute') {
			return true;
		}
	}

	// Check children for dynamic content
	for (const child of lower_code_block_children(/** @type {AST.Node[]} */ (element.children))) {
		if (
			is_template_directive(child) ||
			child.type === 'IfStatement' ||
			child.type === 'TryStatement' ||
			child.type === 'ForOfStatement' ||
			child.type === 'SwitchStatement' ||
			is_template_fragment(child)
		) {
			return true;
		}
		if (child.type === 'JSXExpressionContainer' && child.expression.type !== 'Literal') {
			return true;
		}
		// Non-DOM element (component)
		if (
			is_template_element(child) &&
			(get_element_id(child).type !== 'Identifier' || !is_element_dom_element(child))
		) {
			return true;
		}
		// Recursively check DOM element children
		if (
			is_template_element(child) &&
			get_element_id(child).type === 'Identifier' &&
			is_element_dom_element(child)
		) {
			if (element_has_dynamic_content(/** @type {ESTreeJSX.JSXElement} */ (child))) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Transform a template element's children into innerHTML assignment.
 * Template elements don't render children in the normal DOM tree - their content
 * goes into template.content (a DocumentFragment). We handle them like textarea
 * elements where children become innerHTML content.
 *
 * @param {ESTreeJSX.JSXElement | AST.TSRXJSXElement} node - The template element node
 * @param {TransformClientState} state - The transform state
 * @param {(node: AST.Node, state?: TransformClientState) => AST.Node} visit - The visitor function
 * @param {'html' | 'svg' | 'mathml'} child_namespace - The namespace for child elements
 */
function transform_template_element(node, state, visit, child_namespace) {
	const child_state = /** @type {TransformClientState} */ ({
		...state,
		template: [],
		init: [],
		update: [],
		namespace: child_namespace,
		skip_children_traversal: true,
	});

	transform_children(
		/** @type {AST.Node[]} */ (node.children),
		/** @type {VisitorClientContext} */ ({
			visit,
			state: child_state,
			root: false,
		}),
	);

	const template_array = /** @type {NonNullable<TransformClientState['template']>} */ (
		child_state.template
	);

	if (template_array.length > 0) {
		const content_html = join_template(template_array);
		const id = state.flush_node?.();
		state.init?.push(
			b.stmt(
				b.assignment('=', b.member(/** @type {AST.Identifier} */ (id), 'innerHTML'), content_html),
			),
		);
	}
}

/**
 *
 * @param {AST.Node[]} children
 * @param {VisitorClientContext} context
 */
function transform_children(children, context) {
	const { visit, state, root } = context;
	if (state.to_ts) {
		children = children.map((child) => {
			const lowered = is_template_element(child)
				? lower_dynamic_element(/** @type {AST.TSRXJSXElement} */ (child), undefined, state.scopes)
				: null;
			if (lowered) {
				state.imports.add(`import { Dynamic as ${dynamic_element_import_local} } from 'ripple'`);
			}
			return lowered ?? child;
		});
	}
	const normalized = normalize_children(children, {
		...context,
		state: { ...state, keep_component_style: state.to_ts ? true : state.keep_component_style },
	});

	const head_elements = /** @type {ESTreeJSX.JSXElement[]} */ (
		children.filter(
			(node) => is_template_element(node) && get_element_identifier(node)?.name === 'head',
		)
	);

	const is_fragment =
		normalized.some(
			(node) =>
				is_template_directive(node) ||
				node.type === 'IfStatement' ||
				node.type === 'TryStatement' ||
				node.type === 'ForOfStatement' ||
				node.type === 'SwitchStatement' ||
				is_template_fragment(node) ||
				(is_template_element(node) &&
					(get_element_id(node).type !== 'Identifier' || !is_element_dom_element(node))),
		) ||
		(normalized.filter(
			(node) =>
				node.type !== 'VariableDeclaration' &&
				node.type !== 'BlockStatement' &&
				node.type !== 'EmptyStatement',
		).length === 1 &&
			normalized.some(
				(node) =>
					is_template_expression(node) &&
					is_children_template_expression(
						/** @type {ESTreeJSX.JSXExpressionContainer} */ (node).expression,
						state.scope,
					),
			)) ||
		// At root level, non-literal expressions need a fragment template so the
		// anchor has a parent node. Without a parent, expression()'s .before() call
		// is a no-op when the value is a TSRXElement.
		(root &&
			normalized.some(
				(node) =>
					is_template_expression(node) &&
					/** @type {ESTreeJSX.JSXExpressionContainer} */ (node).expression.type !== 'Literal',
			)) ||
		normalized.filter(
			(node) =>
				node.type !== 'VariableDeclaration' &&
				node.type !== 'BlockStatement' &&
				node.type !== 'EmptyStatement',
		).length > 1;
	/** @type {AST.Identifier | null} */
	let initial = null;
	/** @type {(() => AST.Identifier) | null} */
	let prev = null;
	let template_id = null;

	// A component whose entire renderable body is a single control-flow block can
	// render that block directly before the parent-provided __anchor, skipping the
	// synthesized `<!>` wrapper fragment and its extra append/clone. The control-
	// flow runtimes render before their given anchor, and during hydration consume
	// the SSR boundary marker via append(), so __anchor replaces the wrapper.
	const root_output = root ? normalized.filter(is_template_or_control_flow) : [];
	const single_output = root_output.length === 1 ? root_output[0] : null;
	const root_controlled =
		single_output !== null &&
		(is_template_directive(single_output) ||
			single_output.type === 'IfStatement' ||
			single_output.type === 'SwitchStatement' ||
			single_output.type === 'ForOfStatement' ||
			single_output.type === 'TryStatement' ||
			// A single static component child (`render_component`, not a dynamic/
			// composite tag, DOM element, or ripple `Fragment`) renders before
			// __anchor too.
			(is_template_element(single_output) &&
				!is_dynamic_element(single_output) &&
				get_element_identifier(single_output) !== null &&
				!get_element_identifier(single_output)?.tracked &&
				get_element_identifier(single_output)?.name !== 'children' &&
				!is_element_dom_element(single_output) &&
				!is_ripple_fragment_element(single_output, context)));
	if (root_controlled) {
		/** @type {AST.Node} */ (single_output).metadata = {
			.../** @type {AST.Node} */ (single_output).metadata,
			root_controlled: true,
		};
	}

	// All-component children can append directly into the parent element instead of
	// each rendering before a synthesized `<!>` placeholder. We pass a `{ parent }`
	// sentinel as the anchor; append() detects it (no nodeType) and appendChild()s
	// the component's root, dropping the placeholder comment nodes from the template.
	/** @param {AST.Node} n */
	const is_static_component_child = (n) => {
		if (!is_template_element(n) || is_dynamic_element(n)) return false;
		const id = get_element_identifier(n);
		return (
			id !== null &&
			!id.tracked &&
			id.name !== 'children' &&
			!is_element_dom_element(n) &&
			!is_ripple_fragment_element(n, context)
		);
	};
	const all_component_append =
		!root &&
		!root_controlled &&
		state.flush_node != null &&
		normalized.length > 0 &&
		normalized.every(is_static_component_child);
	if (all_component_append) {
		const parent_id = /** @type {AST.Expression} */ (state.flush_node?.());
		const append_anchor_id = b.id(state.scope.generate('append_anchor'));
		state.init?.push(b.var(append_anchor_id, b.call('_$_.append_into', parent_id)));
		for (const child of normalized) {
			child.metadata = { ...child.metadata, append_into: append_anchor_id };
		}
	}

	/** @param {AST.Node} node */
	const get_id = (node) => {
		return b.id(
			is_template_element(node) && is_element_dom_element(node)
				? state.scope.generate(/** @type {AST.Identifier} */ (get_element_id(node)).name)
				: node.type === 'JSXStyleElement'
					? state.scope.generate('style')
					: is_template_text(node)
						? state.scope.generate('text')
						: is_template_expression(node)
							? state.scope.generate('expression')
							: state.scope.generate('node'),
			/** @type {AST.NodeWithLocation} */ (
				is_template_element(node) ? /** @type {AST.TSRXJSXElement} */ (node).openingElement : node
			),
		);
	};

	/** @param {AST.Node} node */
	const create_initial = (node) => {
		const id = is_fragment
			? b.id(
					state.scope.generate('fragment'),
					/** @type {AST.NodeWithLocation} */ (
						is_template_element(node)
							? /** @type {AST.TSRXJSXElement} */ (node).openingElement
							: node
					),
				)
			: get_id(node);
		initial = id;
		template_id = state.scope.generate('root');
		state.init?.push(b.var(id, b.call(template_id)));
	};

	let fragment_hop_count = 0;

	let skipped = 0;

	for (let node_idx = 0; node_idx < normalized.length; node_idx++) {
		const node = normalized[node_idx];

		if (node.metadata?.regular_js && !state.to_ts) {
			if (is_dead_native_tsrx_expression_statement(node)) {
				continue;
			}
			const regular_node = /** @type {AST.Node} */ (
				visit(node, {
					...state,
					flush_node: null,
					template: null,
					regular_js: true,
				})
			);
			if (regular_node && regular_node.type !== 'EmptyStatement') {
				const statement =
					regular_node.type.endsWith('Statement') || regular_node.type.endsWith('Declaration')
						? /** @type {AST.Statement} */ (regular_node)
						: b.stmt(/** @type {AST.Expression} */ (regular_node));
				state.init?.push(statement);
			}
			continue;
		}

		if (is_fragment && is_template_or_control_flow(node)) {
			fragment_hop_count += 1;
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
			state.init?.push(/** @type {AST.Statement} */ (visit(node, state)));
		} else if (state.to_ts) {
			transform_ts_child(node, /** @type {VisitorClientContext} */ ({ visit, state }));
		} else {
			/** @type {{ tracking: boolean } | undefined} */
			let metadata;
			/** @type {AST.Expression | undefined} */
			let expression = undefined;
			let is_create_text_only = false;
			if (is_template_text_or_expression(node)) {
				metadata = { tracking: false };
				expression = /** @type {AST.Expression} */ (
					visit(get_template_expression(node, false), {
						...state,
						flush_node: null,
						metadata,
					})
				);
				is_create_text_only = normalized.length === 1 && expression.type === 'Literal';
			}

			if (initial === null && root && !is_create_text_only && !root_controlled) {
				create_initial(node);
			}

			const current_prev = prev;
			/** @type {AST.Identifier | null} */
			let cached = null;
			/**
			 * @param {boolean} [is_text]
			 * @param {boolean} [is_controlled]
			 * */
			const flush_node = (is_text, is_controlled) => {
				if (cached && !is_controlled) {
					return cached;
				} else if (current_prev !== null) {
					const id = get_id(node);
					state.init?.push(b.var(id, b.call('_$_.sibling', current_prev(), is_text && b.true)));
					cached = id;
					return id;
				} else if (initial !== null) {
					if (is_fragment) {
						const id = get_id(node);
						state.init?.push(b.var(id, b.call('_$_.first_child_frag', initial, is_text && b.true)));
						cached = id;
						return id;
					}
					return initial;
				} else if (state.flush_node !== null) {
					if (is_controlled) {
						return state.flush_node?.(is_text);
					}

					const id = get_id(node);
					state.init?.push(b.var(id, b.call('_$_.child', state.flush_node?.(), is_text && b.true)));
					cached = id;
					return id;
				} else {
					return get_id(node);
				}
			};

			prev = flush_node;

			const is_controlled = normalized.length === 1 && !root;
			/**
			 * @param {AST.Expression} identity
			 * @param {AST.Expression} expr
			 */
			const render_text_expression = (identity, expr) => {
				if (metadata?.tracking) {
					skipped = 0;
					state.template?.push(' ');
					const id = flush_node(true);
					state.update?.push({
						operation: (key) => b.stmt(b.call('_$_.set_text', id, key)),
						expression: expr,
						identity,
						initial: b.literal(' '),
					});
				} else if (normalized.length === 1) {
					skipped++;
					if (expr.type === 'Literal') {
						if (
							/** @type {NonNullable<TransformClientState['template']>} */ (state.template).length >
							0
						) {
							state.template?.push(escape_html(expr.value));
						} else {
							const id = flush_node(true);
							state.init?.push(b.var(/** @type {AST.Identifier} */ (id), b.call('_$_.text', expr)));
							state.final?.push(b.stmt(b.call('_$_.append', b.id('__anchor'), id)));
						}
					} else {
						const id = flush_node(true);
						state.template?.push(' ');
						// avoid set_text overhead for single text nodes
						state.init?.push(
							b.stmt(
								b.assignment(
									'=',
									b.member(/** @type {AST.Identifier} */ (id), b.id('nodeValue')),
									expr,
								),
							),
						);
					}
				} else {
					skipped++;
					if (expr.type === 'Literal') {
						state.template?.push(escape_html(expr.value));
					} else {
						state.template?.push(' ');
						const id = flush_node(true);
						state.update?.push({
							operation: (key) => b.stmt(b.call('_$_.set_text', id, key)),
							expression: expr,
							identity,
							initial: b.literal(' '),
						});
					}
				}
			};

			if (is_template_element(node)) {
				if (is_element_dom_element(node)) {
					skipped++;
				} else {
					skipped = 0;
				}

				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});

				// After processing an element's children via child()/sibling() navigation,
				// hydrate_node is left deep inside the element. If there's a next sibling,
				// we need to restore hydrate_node so sibling() navigation works correctly.
				//
				// We only need pop() when we actually DESCEND into the element, which happens when:
				// - There are Element children (including DOM elements like <button>)
				// - There are non-literal Text children (we navigate to set text content)
				// - There are control flow / component children
				//
				// The Element visitor already adds pop() for non-literal text, control flow,
				// and component (non-DOM element) children. We need to ALSO add pop()
				// when there are DOM element children, which the Element visitor doesn't cover.
				const next_node = normalized[node_idx + 1];
				const element_children = is_template_element(node)
					? /** @type {AST.TSRXJSXElement} */ (node).children
					: [];
				if (next_node && is_element_dom_element(node) && element_children.length > 0) {
					// Check if any child is a DOM element - this causes navigation but
					// the Element visitor doesn't add pop() for it
					const has_dom_element_children = element_children.some(
						(child) =>
							is_template_element(child) &&
							get_element_identifier(child) !== null &&
							is_element_dom_element(child),
					);

					// Check if the Element visitor already added pop()
					const element_visitor_adds_pop = element_children.some(
						(child) =>
							is_template_directive(child) ||
							child.type === 'IfStatement' ||
							child.type === 'TryStatement' ||
							child.type === 'ForOfStatement' ||
							child.type === 'SwitchStatement' ||
							is_template_fragment(child) ||
							(is_template_element(child) &&
								(get_element_id(child).type !== 'Identifier' || !is_element_dom_element(child))) ||
							(child.type === 'JSXExpressionContainer' && child.expression.type !== 'Literal'),
					);

					const has_following_renderable_sibling = normalized
						.slice(node_idx + 1)
						.some(
							(sibling) =>
								sibling.type !== 'VariableDeclaration' && sibling.type !== 'EmptyStatement',
						);

					// Add pop() if we have DOM element children, the Element visitor didn't already
					// add one, and there is another renderable sibling afterward. This keeps
					// hydrate_node anchored at the current element before sibling() traversal.
					if (
						has_dom_element_children &&
						!element_visitor_adds_pop &&
						has_following_renderable_sibling
					) {
						const id = cached ?? flush_node();
						state.init?.push(b.stmt(b.call('_$_.pop', id)));
					}
				}
			} else if (node.type === 'JSXStyleElement') {
				// A `<style>` in `<head>` renders as a static template element; the
				// visitor pushes its markup (or nothing outside head).
				skipped++;

				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (is_template_fragment(node)) {
				skipped = 0;

				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (is_template_expression(node)) {
				// is_template_expression stays a boolean (its negative would lie
				// about merged-text containers), so narrow the container once here.
				const container = /** @type {ESTreeJSX.JSXExpressionContainer} */ (node);
				const container_expression = /** @type {AST.Expression} */ (container.expression);
				const expr = /** @type {AST.Expression} */ (expression);
				const is_static_native_tsrx_call = is_static_native_tsrx_function_call(
					container_expression,
					/** @type {VisitorClientContext} */ ({ ...context, state }),
				);

				if (expr.type === 'Literal') {
					if (normalized.length === 1) {
						skipped++;
						if (
							/** @type {NonNullable<TransformClientState['template']>} */ (state.template).length >
							0
						) {
							state.template?.push(escape_html(expr.value));
						} else {
							const id = flush_node(true);
							state.init?.push(b.var(/** @type {AST.Identifier} */ (id), b.call('_$_.text', expr)));
							state.final?.push(b.stmt(b.call('_$_.append', b.id('__anchor'), id)));
						}
					} else {
						skipped++;
						state.template?.push(escape_html(expr.value));
					}
				} else if (is_static_native_tsrx_call) {
					skipped = 0;
					state.template?.push('<!>');
					const id = flush_node(false);
					const call = b.call('_$_.render_tsrx_element', expr, id, b.id('__block'));
					state.init?.push(
						state.namespace !== DEFAULT_NAMESPACE
							? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(call)))
							: b.stmt(call),
					);
				} else if (
					!is_children_template_expression(container_expression, state.scope) &&
					is_stringish_expression(container_expression, state)
				) {
					render_text_expression(container_expression, expr);
				} else if (
					normalized.length === 1 &&
					!is_children_template_expression(container_expression, state.scope)
				) {
					skipped++;
					state.template?.push(' ');
					const id = flush_node(false);
					const call = b.call('_$_.expression', id, b.thunk(expr));
					state.init?.push(
						state.namespace !== DEFAULT_NAMESPACE
							? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(call)))
							: b.stmt(call),
					);
				} else {
					skipped = 0;
					state.template?.push('<!>');
					const id = flush_node(false);
					const call = b.call('_$_.expression', id, b.thunk(expr));
					state.init?.push(
						state.namespace !== DEFAULT_NAMESPACE
							? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(call)))
							: b.stmt(call),
					);
				}
			} else if (is_template_text(node)) {
				render_text_expression(
					get_template_expression(
						/** @type {ESTreeJSX.JSXText | ESTreeJSX.JSXExpressionContainer} */ (node),
						false,
					),
					/** @type {AST.Expression} */ (expression),
				);
			} else if (
				node.type === 'ForOfStatement' ||
				(node.type === 'JSXForExpression' && node.statementType === 'ForOfStatement')
			) {
				skipped = 0;
				node.metadata = { ...node.metadata, is_controlled };
				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (node.type === 'IfStatement' || node.type === 'JSXIfExpression') {
				skipped = 0;
				node.metadata = { ...node.metadata, is_controlled };
				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (node.type === 'TryStatement' || node.type === 'JSXTryExpression') {
				skipped = 0;
				node.metadata = { ...node.metadata, is_controlled };
				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (node.type === 'SwitchStatement' || node.type === 'JSXSwitchExpression') {
				skipped = 0;
				node.metadata = { ...node.metadata, is_controlled };
				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (node.type === 'BreakStatement') {
				// do nothing
			} else if (node.type === 'ContinueStatement') {
				state.template?.push('<!>');
			} else {
				debugger;
			}
		}
	}

	for (let i = 0; i < head_elements.length; i++) {
		const head_element = head_elements[i];
		if (state.to_ts) {
			transform_ts_child(head_element, /** @type {VisitorClientContext} */ ({ visit, state }));
		} else {
			visit_head_element(head_element, i, context);
		}
	}

	if (context.state.inside_head) {
		const title_element = /** @type {ESTreeJSX.JSXElement} */ (
			children.find(
				(node) => is_template_element(node) && get_element_identifier(node)?.name === 'title',
			)
		);

		if (title_element) {
			visit_title_element(title_element, context);
		}
	}

	let emitted_next = false;
	if (is_fragment && skipped > 1 && !state.skip_children_traversal) {
		skipped--;
		state.init?.push(b.stmt(b.call('_$_.next', skipped !== 1 && b.literal(skipped))));
		emitted_next = true;
	}

	const template_namespace = state.namespace || 'html';

	if (root && initial !== null && template_id !== null) {
		let flags = is_fragment ? TEMPLATE_FRAGMENT : 0;
		if (template_namespace === 'svg') {
			flags |= TEMPLATE_SVG_NAMESPACE;
		} else if (template_namespace === 'mathml') {
			flags |= TEMPLATE_MATHML_NAMESPACE;
		}
		state.final?.push(
			b.stmt(b.call('_$_.append', b.id('__anchor'), initial, emitted_next && b.true)),
		);
		const template_array = /** @type {NonNullable<TransformClientState['template']>} */ (
			state.template
		);
		const template_args = [join_template(template_array), b.literal(flags)];

		// For fragments, add the pre-calculated hop count as a third argument.
		// This count reflects emitted top-level positions.
		if (is_fragment) {
			const node_count = fragment_hop_count || 1;
			template_args.push(b.literal(node_count));
		}

		state.hoisted.push(b.var(template_id, b.call('_$_.template', ...template_args)));
	}
}

/**
 * @param {AST.Node[]} body
 * @returns {number}
 */
function find_top_level_continue_index(body) {
	return body.findIndex((node) => node.type === 'ContinueStatement');
}

/**
 * Emit the DOM placeholder used for a skipped for-of iteration. This is kept
 * separate from generic `transform_body` so a component-loop `continue`
 * never lowers to a JavaScript `continue` inside the for runtime callback.
 *
 * @param {TransformClientState} state
 * @param {AST.Node} source_node
 * @returns {AST.Statement[]}
 */
function create_continue_skip_statements(state, source_node) {
	const template_id = state.scope.generate('root');
	const node_id = b.id(
		state.scope.generate('node'),
		/** @type {AST.NodeWithLocation} */ (source_node),
	);

	state.hoisted.push(
		b.var(template_id, b.call('_$_.template', join_template(['<!>']), b.literal(0))),
	);

	return [
		b.var(node_id, b.call(template_id)),
		b.stmt(b.call('_$_.append', b.id('__anchor'), node_id)),
	];
}

/**
 * @param {AST.Node[]} consequent_body
 * @param {TransformClientContext} context
 * @returns {AST.Statement[]}
 */
function transform_continue_consequent_body(consequent_body, context) {
	const continue_index = find_top_level_continue_index(consequent_body);
	if (continue_index === -1) {
		return transform_body(consequent_body, context);
	}

	const continue_node = consequent_body[continue_index];
	return [
		...transform_body(consequent_body.slice(0, continue_index), context),
		...create_continue_skip_statements(context.state, continue_node),
		b.return(null),
	];
}

/**
 * @param {AST.Node[]} body
 * @param {TransformClientContext} context
 * @returns {AST.Statement[]}
 */
function transform_body(body, { visit, state }) {
	/** @type {TransformClientState} */
	const body_state = {
		...state,
		template: [],
		init: [],
		update: [],
		final: [],
		metadata: state.metadata,
		namespace: state.namespace || 'html', // Preserve namespace context
		inside_head: state.inside_head || false,
	};

	transform_children(
		body,
		/** @type {VisitorClientContext} */ ({ visit, state: body_state, root: true }),
	);

	if (/** @type {NonNullable<TransformClientState['update']>} */ (body_state.update).length > 0) {
		if (!state.to_ts) {
			apply_updates(
				/** @type {NonNullable<TransformClientState['init']>} */ (body_state.init),
				/** @type {NonNullable<TransformClientState['update']>} */ (body_state.update),
				state,
			);
		}

		// NOTE: transform_children in `to_ts` mode does NOT add to body_state.update
		// So, we skip adding any actions with body_state.update
	}

	const init = [
		.../** @type {AST.Statement[]} */ (body_state.init),
		.../** @type {NonNullable<TransformClientState['final']>} */ (body_state.final),
	];
	return init;
}

/**
 * Create a TSX language handler with enhanced TypeScript support
 * @param {AST.CommentWithLocation[]} [comments] - Comments to pass to esrap's built-in comment handling
 * @returns {Visitors<AST.Node, TransformClientState>} TSX language handler with TypeScript return type support
 */
function create_tsx_with_typescript_support(comments) {
	const preserved_comments = comments?.filter(shouldPreserveComment) ?? [];
	// Don't pass comments to esrap - we handle them manually via flush_comments_before
	// because esrap's built-in comment handling requires all intermediate nodes to have loc
	const base_tsx = /** @type {Visitors<AST.Node, TransformClientState>} */ (tsx());

	// Track which comments have been written (by index)
	let comment_index = 0;
	// Track the previous node's line to see if need to
	// insert a new line before the comment
	let prev_line = -1;

	/**
	 * Flush all preserved comments that appear before the given position
	 * @param {TransformClientContext} context
	 * @param {{ line: number, column: number }} position
	 */
	const flush_comments_before = (context, position) => {
		while (comment_index < preserved_comments.length) {
			const comment = preserved_comments[comment_index];
			if (!comment.loc) {
				comment_index++;
				continue;
			}
			// Check if comment is before the current position
			if (
				comment.loc.start.line < position.line ||
				(comment.loc.start.line === position.line && comment.loc.start.column < position.column)
			) {
				if (prev_line > 0 && comment.loc.start.line > prev_line) {
					context.newline();
				}
				// Write the comment
				context.location(comment.loc.start.line, comment.loc.start.column);
				context.write(formatComment(comment));
				context.location(comment.loc.end.line, comment.loc.end.column);
				context.newline();
				comment_index++;
			} else {
				// Comment is at or after position, stop
				break;
			}
		}
		prev_line = position.line;
	};

	/**
	 * Shared handler for function-like nodes to support component->function mapping
	 * Creates source maps for 'function' keyword by passing node to context.write()
	 * @param {AST.Function} node
	 * @param {TransformClientContext} context
	 */
	const handle_function = (node, context) => {
		const loc = /** @type {AST.SourceLocation} */ (node.loc);
		const start_pos = /** @type {AST.Position} */ ({
			line: loc.start.line,
			column: loc.start.column,
		});

		if (node.async) {
			context.location(loc.start.line, loc.start.column);
			context.write('async ');
			context.location(loc.start.line, loc.start.column + 'async '.length);
			start_pos.column += 'async '.length;
		}

		context.location(start_pos.line, start_pos.column);
		context.write('function');
		context.location(start_pos.line, start_pos.column + 'function'.length);

		if (node.generator) {
			context.write('*');
		}

		const id = /** @type {AST.FunctionExpression | AST.FunctionDeclaration} */ (node).id;

		// FunctionDeclaration always has a space before id, FunctionExpression only if id exists
		if (node.type === 'FunctionDeclaration' || id) {
			context.write(' ');
		}
		if (id) {
			context.visit(id);
		}
		if (node.typeParameters) {
			context.visit(node.typeParameters);
		}
		context.write('(');
		for (let i = 0; i < node.params.length; i++) {
			if (i > 0) context.write(', ');
			context.visit(node.params[i]);
		}
		context.write(')');
		if (node.returnType) {
			context.visit(node.returnType);
		}
		context.write(' ');
		if (node.body) {
			context.visit(node.body);
		}
	};

	return /** @type {Visitors<AST.Node, TransformClientState>} */ ({
		...base_tsx,
		_(node, context, visit) {
			if (node.loc) {
				flush_comments_before(context, node.loc.start);
			}

			visit(node);
		},
		TSExpressionWithTypeArguments(node, context) {
			context.visit(node.expression);
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}
		},
		AssignmentPattern(node, context) {
			// We need to make sure that the whole AssignmentPattern has a start and end mapping
			// Acorn only maps pieces but not the whole thing
			// So we need to cover the start and end source positions manually
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// node.left already covers the start
			base_tsx.AssignmentPattern?.(node, context);
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ExpressionStatement(node, context) {
			if (!node.loc) {
				base_tsx.ExpressionStatement?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.ExpressionStatement?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		JSXCodeBlock(node, context) {
			context.write('{');
			for (const statement of node.body) {
				context.newline();
				context.visit(statement);
			}
			if (node.render) {
				context.newline();
				context.visit(node.render);
			}
			context.newline();
			context.write('}');
		},
		UpdateExpression(node, context) {
			if (!node.loc) {
				base_tsx.UpdateExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.UpdateExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		UnaryExpression(node, context) {
			if (!node.loc) {
				base_tsx.UnaryExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.UnaryExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		YieldExpression(node, context) {
			if (!node.loc) {
				base_tsx.YieldExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.YieldExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		CallExpression(node, context) {
			if (!node.loc) {
				base_tsx.CallExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.CallExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		Literal(node, context) {
			if (!node.loc || node.raw === undefined) {
				base_tsx.Literal?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			context.write(node.raw);
			context.location(loc.end.line, loc.end.column);
		},
		MemberExpression(node, context) {
			if (!node.loc) {
				base_tsx.MemberExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.MemberExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		ObjectExpression(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}

			if (node.metadata?.printInline) {
				// Check if this object should be printed inline (e.g., ref attribute spread)
				context.write('{ ');
				for (let i = 0; i < node.properties.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(node.properties[i]);
				}
				context.write(' }');
			} else {
				base_tsx.ObjectExpression?.(node, context);
			}

			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		NewExpression(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc) ?? null;

			if (loc && !node?.metadata?.skipNewMapping) {
				context.location(loc.start.line, loc.start.column);
			}
			context.write('new ');

			if (loc && node?.metadata?.skipNewMapping) {
				context.location(loc.start.line, loc.start.column);
			}

			context.visit(node.callee);
			if (node.typeArguments) {
				context.visit(node.typeArguments);
			}
			context.write('(');
			for (let i = 0; i < node.arguments.length; i++) {
				if (i > 0) context.write(', ');
				context.visit(node.arguments[i]);
			}
			context.write(')');
			if (loc) {
				context.location(loc.end.line, loc.end.column);
			}
		},
		TemplateLiteral(node, context) {
			if (!node.loc) {
				base_tsx.TemplateLiteral?.(node, context);
				return;
			}

			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.TemplateLiteral?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		SwitchStatement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			base_tsx.SwitchStatement?.(node, context);
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ForOfStatement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			base_tsx.ForOfStatement?.(node, context);
			if (node.empty) {
				context.newline();
				context.write('(() => ');
				context.visit(node.empty);
				context.write(')();');
			}
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ForStatement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			base_tsx.ForStatement?.(node, context);
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ForInStatement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			base_tsx.ForInStatement?.(node, context);
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ReturnStatement(node, context) {
			if (!node.loc) {
				base_tsx.ReturnStatement?.(node, context);
				return;
			}

			const { start, end } = node.loc;

			context.location(start.line, start.column);
			base_tsx.ReturnStatement?.(node, context);
			context.location(end.line, end.column);
		},
		AwaitExpression(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			context.write('await');
			// cover the 'await' end
			context.location(loc.start.line, loc.start.column + 'await'.length);
			context.write(' ');
			context.visit(node.argument);
			// cover the end of the expression
			context.location(loc.end.line, loc.end.column);
		},
		Property(node, context) {
			let start_pos = node.loc?.start;
			if (node.loc) {
				start_pos = /** @type {AST.Position} */ ({
					line: node.loc.start.line,
					column: node.loc.start.column,
				});
			}

			const is_method = node.method || node.kind === 'get' || node.kind === 'set';

			// Handle getters/setters
			if (node.kind === 'get') {
				context.write('get ');
				if (start_pos) {
					start_pos.column += 'get '.length;
				}
			} else if (node.kind === 'set') {
				if (start_pos) {
					start_pos.column += 'set '.length;
				}
				context.write('set ');
			}

			// Write async keyword (before *)
			if (is_method && /** @type {AST.FunctionExpression} */ (node.value).async) {
				// If not a method, async should be a part of the value e.g. { prop: async function }
				if (start_pos) {
					context.location(start_pos.line, start_pos.column);
				}
				context.write('async ');
				if (start_pos) {
					context.location(start_pos.line, start_pos.column + 'async '.length);
					start_pos.column += 'async '.length;
				}
			}

			// Write * for generator methods
			if (/** @type {AST.FunctionExpression} */ (node.value).generator) {
				context.write('*');
			}

			// Write the key
			if (node.computed) {
				if (node.key.loc) {
					context.location(node.key.loc.start.line, node.key.loc.start.column - 1);
				}
				context.write('[');
				context.visit(node.key);
				context.write(']');
				if (node.key.loc) {
					context.location(node.key.loc.end.line, node.key.loc.end.column + 1);
				}
			} else {
				if (node.shorthand) {
					// Shorthand object properties require an Identifier value. When the
					// transformed value is a tracked MemberExpression (for example
					// @value), emit longhand to keep valid output.
					if (
						node.value.type === 'MemberExpression' &&
						/** @type {AST.MemberExpression & { tracked?: boolean }} */ (node.value).tracked
					) {
						context.visit(node.key);
						context.write(': ');
						context.visit(node.value);
						return;
					}
					// only visit value since key and value are the same
					// or the value will contain the key like in AssignmentPattern: { foo = 1 }
					context.visit(node.value);
					return;
				}

				context.visit(node.key);
			}

			// Method shorthand: { foo() {} } or getters/setters - print params and body directly
			if (is_method) {
				const fn = /** @type {AST.FunctionExpression} */ (node.value);

				fn.metadata.is_method = true;

				// Type parameters: { foo<T>() {} }
				if (fn.typeParameters) {
					context.visit(fn.typeParameters);
				}

				context.write('(');
				for (let i = 0; i < fn.params.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(fn.params[i]);
				}
				context.write(')');

				if (fn.returnType) {
					context.visit(fn.returnType);
				}

				context.write(' ');
				context.visit(fn.body);
				return;
			}

			// Regular property: { key: value }
			context.write(': ');
			context.visit(node.value);
		},
		JSXOpeningElement(node, context) {
			// Set location for '<'
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write('<');

			context.visit(node.name);

			if (node.typeArguments) {
				context.visit(node.typeArguments);
			}

			for (const attr of node.attributes || []) {
				context.write(' ');
				context.visit(attr);
			}

			if (node.selfClosing) {
				context.write(' />');
			} else {
				// Set the source location for the '>'
				// node.loc.end points AFTER the '>', so subtract 1 to get the position OF the '>'
				if (node.loc) {
					context.location(node.loc.end.line, node.loc.end.column - 1);
				}
				context.write('>');
			}

			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		JSXClosingElement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.JSXClosingElement?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		JSXIdentifier(node, context) {
			if (!node.loc) {
				base_tsx.JSXIdentifier?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			context.write(node.name);
			context.location(loc.end.line, loc.end.column);
		},
		Identifier(node, context) {
			context.write(node.name, node);
			if (node.optional) {
				context.write('?');
			}
			if (node.typeAnnotation) {
				context.visit(node.typeAnnotation);
			}
		},
		JSXExpressionContainer(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			if (!loc) {
				base_tsx.JSXExpressionContainer?.(node, context);
				return;
			}
			context.location(loc.start.line, loc.start.column);
			base_tsx.JSXExpressionContainer?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		MethodDefinition(node, context) {
			node.value.metadata.is_method = true;
			/** @type {AST.Position | undefined} */
			let start_pos;
			if (node.loc) {
				start_pos = /** @type {AST.Position} */ ({
					line: node.loc.start.line,
					column: node.loc.start.column,
				});
			}

			// Write modifiers (static, async, etc.)
			if (node.static) {
				context.write('static ');
				if (start_pos) {
					start_pos.column += 'static '.length;
				}
			}

			if (node.kind === 'get') {
				context.write('get ');
				if (start_pos) {
					start_pos.column += 'get '.length;
				}
			} else if (node.kind === 'set') {
				if (start_pos) {
					start_pos.column += 'set '.length;
				}
				context.write('set ');
			} else if (node.kind === 'constructor') {
				// skip as it's covered by the key
			}

			// Write async keyword (before *)
			if (/** @type {AST.FunctionExpression} */ (node.value).async) {
				if (start_pos) {
					context.location(start_pos.line, start_pos.column);
				}
				context.write('async ');
				if (start_pos) {
					context.location(start_pos.line, start_pos.column + 'async '.length);
					start_pos.column += 'async '.length;
				}
			}

			// Write * for generator methods
			if (node.value.generator) {
				context.write('*');
			}

			// Write the method key
			if (node.computed) {
				if (node.key.loc) {
					context.location(node.key.loc.start.line, node.key.loc.start.column - 1);
				}
				context.write('[');
				context.visit(node.key);
				context.write(']');
				if (node.key.loc) {
					context.location(node.key.loc.end.line, node.key.loc.end.column + 1);
				}
			} else {
				context.visit(node.key);
			}

			// Visit typeParameters
			// TypeParameters can be on either the MethodDefinition or its value (FunctionExpression)
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			} else if (node.value?.typeParameters) {
				context.visit(node.value.typeParameters);
			}

			// Write parameters - set location for opening '('
			if (node.value?.loc) {
				context.location(node.value.loc.start.line, node.value.loc.start.column);
			}
			context.write('(');
			if (node.value?.params) {
				for (let i = 0; i < node.value.params.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(node.value.params[i]);
				}
			}
			context.write(')');

			// Write return type if present
			if (node.value?.returnType) {
				context.visit(node.value.returnType);
			}

			// Write method body
			if (node.value?.body) {
				context.write(' ');
				context.visit(node.value.body);
			}
		},
		ParenthesizedExpression(node, context) {
			if (!node.loc) {
				base_tsx.ParenthesizedExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.ParenthesizedExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		TSAsExpression(node, context) {
			if (!node.loc) {
				base_tsx.TSAsExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.TSAsExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		TSObjectKeyword(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write('object');
			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		TSTypeParameterDeclaration(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write('<');
			for (let i = 0; i < node.params.length; i++) {
				if (i > 0) {
					context.write(', ');
				}
				context.visit(node.params[i]);
			}
			if (node.params.length === 1 && node.extra?.trailingComma !== undefined) {
				context.write(',');
			}
			context.write('>');
			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		TSTypeParameterInstantiation(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			base_tsx.TSTypeParameterInstantiation?.(node, context);
			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		TSTypeParameter(node, context) {
			// Set location for the type parameter name
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write(node.name);
			if (node.constraint) {
				context.write(' extends ');
				context.visit(node.constraint);
			}
			if (node.default) {
				context.write(' = ');
				context.visit(node.default);
			}
			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		ArrayPattern(node, context) {
			context.write('[');
			for (let i = 0; i < node.elements.length; i++) {
				if (i > 0) context.write(', ');
				if (node.elements[i]) {
					context.visit(/** @type {AST.Pattern} */ (node.elements[i]));
				}
			}
			context.write(']');
			// Visit type annotation if present
			if (node.typeAnnotation) {
				context.visit(node.typeAnnotation);
			}
		},
		FunctionDeclaration(node, context) {
			handle_function(node, context);
		},
		FunctionExpression(node, context) {
			handle_function(node, context);
		},
		ImportDeclaration(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// Write 'import' keyword with source location
			// to mark the beginning of the import statement for a full import mapping
			// The semicolon at the end with location will mark the end of the import statement
			context.location(loc.start.line, loc.start.column);
			context.write('import');

			// Handle 'import type' syntax (importKind on the declaration itself)
			if (node.importKind === 'type') {
				context.write(' type');
			}

			context.write(' ');

			// Write specifiers - handle default, namespace, and named imports
			if (node.specifiers && node.specifiers.length > 0) {
				let default_specifier = null;
				let namespace_specifier = null;
				const named_specifiers = [];

				for (const spec of node.specifiers) {
					if (spec.type === 'ImportDefaultSpecifier') {
						default_specifier = spec;
					} else if (spec.type === 'ImportNamespaceSpecifier') {
						namespace_specifier = spec;
					} else if (spec.type === 'ImportSpecifier') {
						named_specifiers.push(spec);
					}
				}

				// Write default import
				if (default_specifier) {
					context.visit(default_specifier);
					if (namespace_specifier || named_specifiers.length > 0) {
						context.write(', ');
					}
				}

				// Write namespace import
				if (namespace_specifier) {
					context.visit(namespace_specifier);
					if (named_specifiers.length > 0) {
						context.write(', ');
					}
				}

				// Write named imports
				if (named_specifiers.length > 0) {
					context.write('{ ');
					for (let i = 0; i < named_specifiers.length; i++) {
						if (i > 0) context.write(', ');
						context.visit(named_specifiers[i]);
					}
					context.write(' }');
				}

				context.write(' from ');
			}

			// Write source
			context.visit(node.source);
			// Write semicolon at the end
			// and record its position to mark the end of the import statement
			// This should work regardless of whether the source has a semi or not
			context.location(loc.end.line, loc.end.column - 1);
			context.write(';');
		},
		ImportDefaultSpecifier(node, context) {
			context.visit(node.local);
		},
		ImportNamespaceSpecifier(node, context) {
			context.write('* as ');
			context.visit(node.local);
		},
		ImportSpecifier(node, context) {
			if (node.importKind === 'type') {
				context.write('type ');
			}
			context.visit(node.imported);
			// Only write 'as local' if imported !== local
			if (/** @type {AST.Identifier} */ (node.imported).name !== node.local.name) {
				context.write(' as ');
				context.visit(node.local);
			}
		},
		TSParenthesizedType(node, context) {
			context.write('(');
			context.visit(/** @type {AST.TSTypeAnnotation} */ (node.typeAnnotation));
			context.write(')');
		},
		TSNamedTupleMember(node, context) {
			context.visit(node.label);
			if (node.optional) {
				context.write('?');
			}
			context.write(': ');
			context.visit(node.elementType);
		},
		TSMappedType(node, context) {
			context.write('{ ');
			if (node.readonly) {
				if (node.readonly === '+' || node.readonly === true) {
					context.write('readonly ');
				} else if (node.readonly === '-') {
					context.write('-readonly ');
				}
			}
			context.write('[');
			// Handle TSTypeParameter inline - mapped types use 'in' not 'extends'
			if (node.typeParameter) {
				const tp = node.typeParameter;
				if (tp.loc) {
					context.location(tp.loc.start.line, tp.loc.start.column);
				}
				// Write the parameter name
				context.write(tp.name);
				// In mapped types, constraint uses 'in' instead of 'extends'
				if (tp.constraint) {
					context.write(' in ');
					context.visit(tp.constraint);
				}
				// Handle 'as' clause for key remapping (e.g., { [K in Keys as NewKey]: V })
				if (node.nameType) {
					context.write(' as ');
					context.visit(node.nameType);
				}
			}
			context.write(']');
			if (node.optional) {
				if (node.optional === '+' || node.optional === true) {
					context.write('?');
				} else if (node.optional === '-') {
					context.write('-?');
				}
			}
			context.write(': ');
			// Visit the value type
			if (node.typeAnnotation) {
				context.visit(node.typeAnnotation);
			}
			context.write(' }');
		},
		TSTypeOperator(node, context) {
			context.write(node.operator);
			context.write(' ');
			context.visit(/** @type {AST.TSTypeAnnotation} */ (node.typeAnnotation));
		},
		TSInstantiationExpression(node, context) {
			// e.g., identity<string>, Array<number> when used as expressions
			context.visit(node.expression);
			if (node.typeArguments) {
				context.visit(node.typeArguments);
			}
		},
		// esrap's ArrowFunctionExpression printer ignores `typeParameters` and
		// `returnType`, so an annotated arrow like `(): Record<...> => ...`
		// prints as `() => ...` and segments.js can't resolve the return-type
		// nodes' positions in the generated output.
		ArrowFunctionExpression(node, context) {
			if (node.loc) context.location(node.loc.start.line, node.loc.start.column);

			if (node.async) context.write('async ');

			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}

			context.write('(');
			// Visit each parameter
			for (let i = 0; i < node.params.length; i++) {
				if (i > 0) context.write(', ');
				context.visit(node.params[i]);
			}
			context.write(')');

			// Add TypeScript return type annotation if present
			if (node.returnType) {
				context.visit(node.returnType);
			}

			context.write(' => ');

			if (
				node.body.type === 'ObjectExpression' ||
				(node.body.type === 'AssignmentExpression' && node.body.left.type === 'ObjectPattern') ||
				(node.body.type === 'LogicalExpression' && node.body.left.type === 'ObjectExpression') ||
				(node.body.type === 'ConditionalExpression' && node.body.test.type === 'ObjectExpression')
			) {
				context.write('(');
				context.visit(node.body);
				context.write(')');
			} else {
				context.visit(node.body);
			}

			if (node.loc) context.location(node.loc.end.line, node.loc.end.column);
		},
		ClassDeclaration(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write('class ');
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column + 'class'.length);
			}
			if (node.id) {
				context.visit(node.id);
			}
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}
			if (node.superClass) {
				context.write(' extends ');
				context.visit(node.superClass);
				if (node.superTypeParameters) {
					context.visit(node.superTypeParameters);
				}
			}
			if (node.implements && node.implements.length > 0) {
				context.write(' implements ');
				for (let i = 0; i < node.implements.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(node.implements[i]);
				}
			}
			context.write(' ');
			context.visit(node.body);
		},
		ClassExpression(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write('class');
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column + 'class'.length);
			}
			if (node.id) {
				context.write(' ');
				context.visit(node.id);
			}
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}
			if (node.superClass) {
				context.write(' extends ');
				context.visit(node.superClass);
				if (node.superTypeParameters) {
					context.visit(node.superTypeParameters);
				}
			}
			if (node.implements && node.implements.length > 0) {
				context.write(' implements ');
				for (let i = 0; i < node.implements.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(node.implements[i]);
				}
			}
			context.write(' ');
			context.visit(node.body);
		},
		TryStatement(node, context) {
			if (node.pending) {
				context.write('(() => ');
				context.visit(node.pending);
				context.write(')();');
				context.newline();
			}

			if (!node.handler && !node.finalizer) {
				context.write('(() => ');
				context.visit(node.block);
				context.write(')();');
				return;
			}

			context.write('try ');
			context.visit(node.block);

			if (node.handler) {
				context.write(' catch');
				if (node.handler.param && !node.handler.resetParam) {
					context.write(' (');
					context.visit(node.handler.param);
					context.write(')');
				}
				context.write(' ');
				if (node.handler.param && node.handler.resetParam) {
					// Emit as IIFE so both params are valid TS arrow function parameters
					context.write('{\n');
					context.indent();
					context.write('((');
					context.visit(node.handler.param);
					if (!node.handler.param.typeAnnotation) {
						context.write(': unknown');
					}
					context.write(', ');
					context.visit(node.handler.resetParam);
					if (!node.handler.resetParam.typeAnnotation) {
						context.write(': () => void');
					}
					context.write(') => ');
					context.visit(node.handler.body);
					context.write(')({}, () => {})\n');
					context.dedent();
					context.write('}');
				} else {
					context.visit(node.handler.body);
				}
			}

			if (node.finalizer) {
				context.write(' finally ');
				context.visit(node.finalizer);
			}
		},
	});
}

/**
 * Transform Ripple AST to JavaScript/TypeScript
 * @param {string} filename - Source filename
 * @param {string} source - Original source code
 * @param {AnalysisResult} analysis - Analysis result
 * @param {boolean} to_ts - Whether to generate TypeScript output
 * @param {boolean} minify_css - Whether to minify CSS output
 * @param {boolean} hmr - Whether to emit HMR wrapper code
 * @returns {{ ast: AST.Program, code: string, map: RawSourceMap, post_processing_changes?: PostProcessingChanges, line_offsets?: LineOffsets, css: string, cssHash: string | null, errors: CompileError[] }}
 */
export function transform_client(filename, source, analysis, to_ts, minify_css, hmr = false) {
	/** @type {TransformClientState} */
	const state = {
		imports: new Set(),
		events: new Set(),
		template: null,
		hoisted: [],
		init: null,
		inside_head: false,
		update: null,
		final: null,
		flush_node: null,
		scope: analysis.scope,
		scopes: analysis.scopes,
		ancestor_server_block: undefined,
		server_block_locals: [],
		stylesheets: [],
		to_ts,
		filename,
		namespace: 'html',
		metadata: {},
		errors: analysis.errors,
		skip_children_traversal: false,
	};

	// Add ripple internal import once for the entire module
	// Whatever is unused will be tree-shaken later, including a rare case
	// where nothing from ripple/internal/client is used
	if (!to_ts) {
		state.imports.add(`import * as _$_ from 'ripple/internal/client'`);
	}

	let program = /** @type {AST.Program} */ (walk(analysis.ast, { ...state }, visitors));

	/** @type {AST.TSRXProgram['body']} */
	let body = [];

	for (const import_node of state.imports) {
		if (typeof import_node === 'string') {
			body.push(b.stmt(b.id(import_node)));
		} else {
			body.push(import_node);
		}
	}

	for (const hoisted of state.hoisted) {
		body.push(hoisted);
	}

	body.push(...program.body);

	if (state.events.size > 0) {
		body.push(
			b.stmt(
				b.call('_$_.delegate', b.array(Array.from(state.events).map((name) => b.literal(name)))),
			),
		);
	}

	// HMR: wrap all named native TSRX functions with _$_.hmr() and emit import.meta.hot.accept()
	if (hmr && !to_ts) {
		const component_names = new Set(analysis.component_metadata.map((c) => c.id));

		// Track which components are exported and how
		/** @type {{ name: string, export_type: 'default' | 'named' }[]} */
		const exported_components = [];

		// Walk the body to find native TSRX functions and inject HMR wrapping.
		// Function declarations become FunctionExpression nodes via b.function().
		/** @type {AST.TSRXProgram['body']} */
		const hmr_body = [];

		for (const node of body) {
			hmr_body.push(node);

			if (node.type === 'ExportDefaultDeclaration') {
				const decl = /** @type {AST.FunctionExpression} */ (node.declaration);
				if (decl.metadata?.native_tsrx_function && decl.id && component_names.has(decl.id.name)) {
					const name = decl.id.name;
					exported_components.push({ name, export_type: 'default' });
					// Replace ExportDefaultDeclaration with plain FunctionExpression (printed as function declaration)
					hmr_body[hmr_body.length - 1] = decl;
					// Add: ComponentName = _$_.hmr(ComponentName);
					hmr_body.push(b.stmt(b.assignment('=', b.id(name), b.call('_$_.hmr', b.id(name)))));
					// Re-export as default
					hmr_body.push(b.export_default(b.id(name)));
				}
			} else if (node.type === 'ExportNamedDeclaration') {
				const decl = /** @type {AST.FunctionExpression | null | undefined} */ (node.declaration);
				if (
					decl &&
					decl.metadata?.native_tsrx_function &&
					decl.id &&
					component_names.has(decl.id.name)
				) {
					const name = decl.id.name;
					exported_components.push({ name, export_type: 'named' });
					// Replace ExportNamedDeclaration with plain FunctionExpression (printed as function declaration)
					hmr_body[hmr_body.length - 1] = decl;
					// Add: ComponentName = _$_.hmr(ComponentName);
					hmr_body.push(b.stmt(b.assignment('=', b.id(name), b.call('_$_.hmr', b.id(name)))));
					// Re-export as named export
					hmr_body.push(
						b.export_builder(null, [
							{
								type: 'ExportSpecifier',
								local: b.id(name),
								exported: b.id(name),
								metadata: { path: [] },
							},
						]),
					);
				}
			} else if (
				node.type === 'FunctionExpression' &&
				node.metadata?.native_tsrx_function &&
				node.id &&
				component_names.has(node.id.name)
			) {
				const name = node.id.name;
				// Local (non-exported) component — wrap with HMR
				hmr_body.push(b.stmt(b.assignment('=', b.id(name), b.call('_$_.hmr', b.id(name)))));
			}
		}

		// Emit import.meta.hot.accept() block if there are exported components
		if (exported_components.length > 0) {
			const update_lines = exported_components.map(({ name, export_type }) => {
				const accessor = export_type === 'default' ? 'module.default' : `module.${name}`;
				return `${name}[_$_.HMR].update(${accessor});`;
			});

			const hmr_block_code =
				`if (import.meta.hot) {\n` +
				`  import.meta.hot.accept((module) => {\n` +
				update_lines.map((line) => `    ${line}`).join('\n') +
				`\n  });\n` +
				`}`;

			hmr_body.push(b.stmt(b.id(hmr_block_code)));
		}

		body = hmr_body;
	}

	/** @type {AST.TSRXProgram['body']} */ (program.body) = body;

	const language_handler = to_ts
		? create_tsx_with_typescript_support(analysis.comments)
		: /** @type {Visitors<AST.Node, TransformClientState>} */ (tsx());

	const printed = print(program, language_handler, {
		sourceMapContent: source,
		sourceMapSource: path.basename(filename),
	});
	let { code } = printed;
	const { map } = printed;

	// Post-process TypeScript output to remove 'declare' from function overload signatures
	// Function overload signatures in regular .ts files should not have 'declare' keyword
	// Track changes for source map adjustment - organize them for efficient lookup
	/** @type {PostProcessingChanges | null} */
	let post_processing_changes = null;
	/** @type {LineOffsets} */
	let line_offsets = [];

	if (to_ts) {
		// Build line offset map for converting byte offset to line:column
		line_offsets = [0];
		for (let i = 0; i < code.length; i++) {
			if (code[i] === '\n') {
				line_offsets.push(i + 1);
			}
		}

		/**
		 * Convert byte offset to line number (1-based)
		 * @param {number} offset
		 * @returns {number}
		 */
		const offset_to_line = (offset) => {
			for (let i = 0; i < line_offsets.length; i++) {
				if (
					offset >= line_offsets[i] &&
					(i === line_offsets.length - 1 || offset < line_offsets[i + 1])
				) {
					return i + 1;
				}
			}
			return 1;
		};

		/** @type {Map<number, {offset: number, delta: number}>} */
		const line_deltas = new Map(); // line -> {offset: first change offset, delta: total delta for line}

		// Remove 'export declare function' -> 'export function' (for overloads only, not implementations)
		// Match: export declare function name(...): type;
		// Don't match: export declare function name(...): type { (has body)
		code = code.replace(
			/^(export\s+)declare\s+(function\s+\w+[^{\n]*;)$/gm,
			(match, p1, p2, offset) => {
				const replacement = p1 + p2;
				const line = offset_to_line(offset);
				const delta = replacement.length - match.length; // negative (removing 'declare ')

				// Track first change offset and total delta per line
				if (!line_deltas.has(line)) {
					line_deltas.set(line, { offset, delta });
				} else {
					// Additional change on same line - accumulate delta
					// @ts-ignore
					line_deltas.get(line).delta += delta;
				}

				return replacement;
			},
		);

		post_processing_changes = line_deltas;
	}

	const { css, cssHash } = renderCssResult(state.stylesheets, minify_css);

	/** @type {ReturnType<typeof transform_client>} */
	const result = {
		ast: program,
		code,
		map,
		css,
		cssHash,
		errors: state.errors,
	};

	if (post_processing_changes) {
		result.post_processing_changes = post_processing_changes;
	}

	if (line_offsets.length > 0) {
		result.line_offsets = line_offsets;
	}

	return result;
}
