/** @import {AnalyzeOptions} from '../../types/index'  */
// @ts-check

/**
@import {
	AnalysisResult,
	AnalysisState,
	AnalysisContext,
	Context,
	ScopeInterface,
	Visitor,
	Visitors,
	Binding,
} from '../../types/index';
 */
/**
@import * as AST from 'estree';
@import * as ESTreeJSX from 'estree-jsx';
*/

import {
	builders,
	createScopes,
	ScopeRoot,
	isVoidElement,
	extractIdentifiers,
	error,
	getReturnKeywordNode,
	isEventAttribute,
	isInsideComponent as is_inside_component,
	validateNesting,
	validateTsrxIfBreakStatement,
	validateTsrxIfContinueStatement,
	validateTsrxIfReturnStatement,
	validateTsrxLoopBreakStatement,
	validateTsrxLoopContinueStatement,
	validateTsrxLoopReturnStatement,
	validateTsrxReturnStatement,
	validateTsrxUnsupportedLoopStatement,
	isTemplateValuePosition,
	isFunctionOrClassNode as is_function_or_class_boundary,
} from '@tsrx/core';
const b = builders;
import { walk } from 'zimmerframe';
import {
	is_delegated_event,
	get_parent_block_node,
	is_element_dom_element,
	is_ripple_track_call,
	is_children_template_expression as is_children_template_expression_in_scope,
	normalize_children,
	is_binding_function,
	strong_hash,
	tracked_get,
	get_native_tsrx_function_body,
	is_native_tsrx_template_node,
	is_native_tsrx_function_node,
	get_code_block_template_child,
	is_template_child_position,
	is_directive_render_position,
	get_directive_value_wrapper,
	analyze_directive_wrapping_values,
	is_tsrx_component_function,
	pattern_reads,
	register_type_declarations,
	record_text_intrinsic_write,
	get_expression_type_annotation,
	get_iterable_element_type_annotation,
} from '../utils.js';
import {
	get_attribute_name_node,
	get_attribute_value,
	get_element_attributes,
	get_element_id,
	get_template_expression,
	is_droppable_template_text,
	is_dynamic_element,
	is_empty_expression_container,
	is_template_directive,
	is_template_element,
	is_template_else_if,
	is_template_fragment,
	is_template_text_or_expression,
	rendered_template_children,
} from '../template-ast.js';
import is_reference from 'is-reference';
import { prepare_style_scopes } from '../style-scopes.js';

const valid_in_head = new Set(['title', 'base', 'link', 'meta', 'style', 'script', 'noscript']);

const mutating_method_names = new Set([
	'add',
	'append',
	'clear',
	'copyWithin',
	'delete',
	'fill',
	'pop',
	'push',
	'reverse',
	'set',
	'shift',
	'sort',
	'splice',
	'unshift',
]);

/**
 * @param {AST.MemberExpression} node
 * @returns {string | null}
 */
function get_member_name(node) {
	if (!node.computed && node.property.type === 'Identifier') {
		return node.property.name;
	}

	if (node.computed && node.property.type === 'Literal') {
		return typeof node.property.value === 'string' ? node.property.value : null;
	}

	return null;
}

/**
 * @param {AST.TSRXImportDeclaration} node
 * @returns {string | null}
 */
function get_submodule_import_source_name(node) {
	const source = node.source;
	return source.type === 'Identifier' ? source.name : null;
}

/**
 * @param {AST.Node} node
 * @returns {string | null}
 */
function get_module_declaration_name(node) {
	if (node.type !== 'TSModuleDeclaration') {
		return null;
	}
	const id = /** @type {AST.TSModuleDeclaration} */ (node).id;
	return id?.type === 'Identifier' ? id.name : null;
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_submodule_declaration(node) {
	return node.type === 'TSModuleDeclaration' && node.declare !== true && node.kind === 'module';
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
 * @param {AST.CallExpression} node
 * @returns {boolean}
 */
function is_mutating_call_expression(node) {
	return (
		node.callee.type === 'MemberExpression' &&
		mutating_method_names.has(get_member_name(node.callee) ?? '')
	);
}

/**
 * Check if an expression contains side effects or other impure operations.
 * Template expressions should be pure reads.
 * @param {AST.Expression | AST.SpreadElement | AST.Super | AST.Pattern} node
 * @returns {boolean}
 */
function expression_has_side_effects(node) {
	switch (node.type) {
		case 'AssignmentExpression':
		case 'UpdateExpression':
			return true;
		case 'SequenceExpression':
			return node.expressions.some(expression_has_side_effects);
		case 'ConditionalExpression':
			return (
				expression_has_side_effects(node.test) ||
				expression_has_side_effects(node.consequent) ||
				expression_has_side_effects(node.alternate)
			);
		case 'LogicalExpression':
		case 'BinaryExpression':
			return (
				expression_has_side_effects(/** @type {AST.Expression} */ (node.left)) ||
				expression_has_side_effects(node.right)
			);
		case 'UnaryExpression':
			// delete operator has side effects (removes object properties)
			if (node.operator === 'delete') return true;
			return expression_has_side_effects(node.argument);
		case 'AwaitExpression':
			return expression_has_side_effects(node.argument);
		case 'ChainExpression':
			return expression_has_side_effects(node.expression);
		case 'MemberExpression':
			return (
				expression_has_side_effects(node.object) ||
				(node.computed &&
					expression_has_side_effects(/** @type {AST.Expression} */ (node.property)))
			);
		case 'CallExpression':
			return (
				is_mutating_call_expression(node) ||
				expression_has_side_effects(node.callee) ||
				node.arguments.some(expression_has_side_effects)
			);
		case 'NewExpression':
			return (
				expression_has_side_effects(node.callee) || node.arguments.some(expression_has_side_effects)
			);
		case 'TemplateLiteral':
			return node.expressions.some(expression_has_side_effects);
		case 'TaggedTemplateExpression':
			return (
				expression_has_side_effects(node.tag) ||
				node.quasi.expressions.some(expression_has_side_effects)
			);
		case 'ArrayExpression':
			return node.elements.some((el) => el !== null && expression_has_side_effects(el));
		case 'ObjectExpression':
			return node.properties.some((prop) =>
				prop.type === 'SpreadElement'
					? expression_has_side_effects(prop.argument)
					: expression_has_side_effects(prop.value) ||
						(prop.computed &&
							expression_has_side_effects(/** @type {AST.Expression} */ (prop.key))),
			);
		case 'SpreadElement':
			return expression_has_side_effects(node.argument);
		default:
			return false;
	}
}

/**
 * @param {AnalysisContext['path']} path
 * @param {AST.Node} node The visited template node (element/fragment/text/expression).
 */
function mark_control_flow_has_template(path, node) {
	let child = node;
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];

		// Once the chain crosses into a value slot, the originating template node
		// is captured as a value rather than rendered, so it must not propagate
		// `has_template` to any enclosing control-flow statement.
		if (isTemplateValuePosition(node, child)) {
			return;
		}

		if (
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression' ||
			node.type === 'FunctionDeclaration'
		) {
			break;
		}
		if (
			node.type === 'ForStatement' ||
			node.type === 'ForInStatement' ||
			node.type === 'ForOfStatement' ||
			node.type === 'TryStatement' ||
			node.type === 'IfStatement' ||
			node.type === 'SwitchStatement' ||
			is_template_directive(node) ||
			is_template_fragment(node)
		) {
			node.metadata.has_template = true;
		}

		child = node;
	}
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function is_script_only_control_flow_body(node) {
	return node?.metadata?.script_only === true;
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_loop_statement(node) {
	return (
		node.type === 'JSXForExpression' ||
		node.type === 'ForOfStatement' ||
		node.type === 'ForStatement' ||
		node.type === 'ForInStatement' ||
		node.type === 'WhileStatement' ||
		node.type === 'DoWhileStatement'
	);
}

/**
 * @param {AnalysisContext['path']} path
 * @returns {boolean}
 */
function is_inside_component_for_of(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			return false;
		}
		if (node.type === 'JSXForExpression') {
			return true;
		}
		// The nearest enclosing for-of owns this statement. Only a `@for` template
		// directive enforces the no-return/no-continue rule; a plain JS `for…of`
		// is ordinary JavaScript, so stop and report it as not template-owned.
		if (node.type === 'ForOfStatement') {
			return false;
		}
	}
	return false;
}

/**
 * @param {AnalysisContext['path']} path
 * @returns {boolean}
 */
function is_inside_template_if(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			return false;
		}
		if (node.type === 'JSXIfExpression') {
			return true;
		}
		// An `@else if` chain link is template-owned; any other plain `if` is
		// ordinary JavaScript the walk passes through.
		if (
			node.type === 'IfStatement' &&
			is_template_else_if(node, /** @type {AST.Node[]} */ (path.slice(0, i)))
		) {
			return true;
		}
	}
	return false;
}

/**
 * @param {AnalysisContext['path']} path
 * @returns {boolean}
 */
function is_inside_template_child(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			return false;
		}
		if (is_template_element(node) || is_template_fragment(node)) {
			return true;
		}
	}
	return false;
}

/**
 * @param {AnalysisContext['path']} path
 * @returns {boolean}
 */
function break_targets_component_loop(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			return false;
		}
		if (node.type === 'SwitchStatement') {
			return false;
		}
		// A `break` targets the nearest enclosing loop (or switch, handled above).
		// Only a `@for` template directive forbids it; plain JS loops are ordinary
		// JavaScript where `break` is allowed.
		if (is_loop_statement(node)) {
			return node.type === 'JSXForExpression';
		}
	}
	return false;
}

/**
 * @param {AnalysisContext['path']} path
 */
function mark_control_flow_has_continue(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			break;
		}
		if (is_loop_statement(node)) {
			break;
		}
		if (node.type === 'IfStatement' || node.type === 'SwitchStatement') {
			node.metadata.has_continue = true;
		}
	}
}

/**
 * @param {Binding | null} binding
 * @param {AnalysisContext} context
 * @returns {boolean}
 */
function is_known_tracked_binding(binding, context) {
	return (
		binding !== null &&
		binding.initial?.type === 'CallExpression' &&
		is_ripple_track_call(binding.initial.callee, context) !== null
	);
}

/**
 * @param {AST.Pattern} pattern
 * @returns {AST.TypeNode | undefined}
 */
function get_pattern_type_annotation(pattern) {
	return pattern.typeAnnotation?.typeAnnotation;
}

/**
 * @param {AST.TypeNode | undefined} type_annotation
 * @returns {AST.TypeNode | undefined}
 */
function unwrap_type_annotation(type_annotation) {
	/** @type {AST.TypeNode | undefined} */
	let annotation = type_annotation;

	while (annotation) {
		if (annotation.type === 'TSParenthesizedType') {
			annotation = /** @type {AST.TypeNode | undefined} */ (annotation.typeAnnotation);
			continue;
		}
		if (annotation.type === 'TSOptionalType') {
			annotation = /** @type {AST.TypeNode | undefined} */ (annotation.typeAnnotation);
			continue;
		}
		break;
	}

	return annotation;
}

/**
 * @param {AST.TypeNode} type_annotation
 * @returns {AST.TypeNode}
 */
function normalize_tuple_element_type(type_annotation) {
	/** @type {AST.TypeNode} */
	let annotation = type_annotation;

	while (true) {
		if (annotation.type === 'TSNamedTupleMember') {
			annotation = annotation.elementType;
			continue;
		}
		if (annotation.type === 'TSParenthesizedType') {
			annotation = /** @type {AST.TypeNode} */ (annotation.typeAnnotation);
			continue;
		}
		if (annotation.type === 'TSOptionalType') {
			annotation = /** @type {AST.TypeNode} */ (annotation.typeAnnotation);
			continue;
		}
		break;
	}

	return annotation;
}

/**
 * @param {AST.Expression} key
 * @returns {string | null}
 */
function get_object_pattern_key_name(key) {
	if (key.type === 'Identifier') {
		return key.name;
	}
	if (key.type === 'Literal' && (typeof key.value === 'string' || typeof key.value === 'number')) {
		return String(key.value);
	}
	return null;
}

/**
 * @param {AST.PropertyNameNonComputed} key
 * @returns {string | null}
 */
function get_type_property_key_name(key) {
	if (key.type === 'Identifier') {
		return key.name;
	}
	if (key.type === 'Literal' && (typeof key.value === 'string' || typeof key.value === 'number')) {
		return String(key.value);
	}
	return null;
}

/**
 * @param {AST.TypeNode | undefined} type_annotation
 * @param {AST.Property | AST.RestElement} property
 * @returns {AST.TypeNode | undefined}
 */
function get_object_property_type_annotation(type_annotation, property) {
	if (property.type === 'RestElement' || property.computed) {
		return undefined;
	}

	const object_type_annotation = unwrap_type_annotation(type_annotation);
	if (object_type_annotation?.type !== 'TSTypeLiteral') {
		return undefined;
	}

	const key_name = get_object_pattern_key_name(/** @type {AST.Expression} */ (property.key));
	if (key_name === null) {
		return undefined;
	}

	for (const member of object_type_annotation.members) {
		if (member.type !== 'TSPropertySignature' || member.computed) {
			continue;
		}
		const member_key_name = get_type_property_key_name(member.key);
		if (member_key_name === key_name) {
			return member.typeAnnotation?.typeAnnotation;
		}
	}

	return undefined;
}

/**
 * @param {AST.TypeNode | undefined} type_annotation
 * @param {number} index
 * @param {boolean} is_rest
 * @returns {AST.TypeNode | undefined}
 */
function get_array_element_type_annotation(type_annotation, index, is_rest) {
	const array_type_annotation = unwrap_type_annotation(type_annotation);

	if (array_type_annotation?.type === 'TSArrayType') {
		return array_type_annotation.elementType;
	}
	if (array_type_annotation?.type !== 'TSTupleType') {
		return undefined;
	}

	if (is_rest) {
		for (let i = array_type_annotation.elementTypes.length - 1; i >= 0; i -= 1) {
			const element_type = normalize_tuple_element_type(array_type_annotation.elementTypes[i]);
			if (element_type.type === 'TSRestType') {
				return element_type.typeAnnotation;
			}
		}
		return undefined;
	}

	if (index < array_type_annotation.elementTypes.length) {
		const element_type = normalize_tuple_element_type(array_type_annotation.elementTypes[index]);
		if (element_type.type === 'TSRestType') {
			const rest_type_annotation = unwrap_type_annotation(element_type.typeAnnotation);
			return rest_type_annotation?.type === 'TSArrayType'
				? rest_type_annotation.elementType
				: element_type.typeAnnotation;
		}
		return element_type;
	}

	const last_element = array_type_annotation.elementTypes.at(-1);
	if (!last_element) {
		return undefined;
	}
	const normalized_last_element = normalize_tuple_element_type(last_element);
	if (normalized_last_element.type === 'TSRestType') {
		const rest_type_annotation = unwrap_type_annotation(normalized_last_element.typeAnnotation);
		return rest_type_annotation?.type === 'TSArrayType'
			? rest_type_annotation.elementType
			: normalized_last_element.typeAnnotation;
	}

	return undefined;
}

/**
 * Give a `@for` loop variable the element type of the iterated expression, so
 * member reads on it can be lowered to typed text updates.
 * @param {AST.JSXForOfExpression} node
 * @param {AnalysisContext} context
 */
function infer_for_item_type_annotation(node, context) {
	const left = node.left;
	if (left.type !== 'VariableDeclaration') return;
	const pattern = left.declarations[0]?.id;
	if (pattern?.type !== 'Identifier' || pattern.typeAnnotation !== undefined) return;

	const scope = context.state.scopes.get(node);
	const binding = scope?.get(pattern.name);
	if (!binding || binding.node !== pattern) return;

	const element_type = get_iterable_element_type_annotation(
		get_expression_type_annotation(/** @type {AST.Expression} */ (node.right), context.state),
		context.state,
	);
	if (element_type === undefined) return;

	binding.metadata = {
		...(binding.metadata ?? {}),
		typeAnnotation: element_type,
	};
}

/**
 * Records the type of each binding a declaration or parameter pattern
 * introduces, from the pattern's own annotation or the type of its source; the
 * types let typed property reads lower to direct text and attribute writes.
 * @param {AST.Pattern} pattern
 * @param {AnalysisContext} context
 * @param {AST.TypeNode | undefined} type_annotation
 */
function assign_pattern_types(pattern, context, type_annotation) {
	const pattern_type_annotation = get_pattern_type_annotation(pattern) ?? type_annotation;

	switch (pattern.type) {
		case 'Identifier': {
			if (pattern_type_annotation === undefined) return;
			const binding = context.state.scope.get(pattern.name);
			if (binding?.node === pattern) {
				binding.metadata = {
					...(binding.metadata ?? {}),
					typeAnnotation: pattern_type_annotation,
				};
			}
			return;
		}
		case 'AssignmentPattern':
			assign_pattern_types(pattern.left, context, pattern_type_annotation);
			return;
		case 'RestElement':
			assign_pattern_types(pattern.argument, context, pattern_type_annotation);
			return;
		case 'ObjectPattern':
			for (const property of pattern.properties) {
				assign_pattern_types(
					property.type === 'RestElement' ? property.argument : property.value,
					context,
					get_object_property_type_annotation(pattern_type_annotation, property),
				);
			}
			return;
		case 'ArrayPattern':
			for (let i = 0; i < pattern.elements.length; i += 1) {
				const element = pattern.elements[i];
				if (element !== null) {
					assign_pattern_types(
						element,
						context,
						get_array_element_type_annotation(
							pattern_type_annotation,
							i,
							element.type === 'RestElement',
						),
					);
				}
			}
			return;
	}
}

/**
 * @param {AST.Function} node
 * @param {AnalysisContext} context
 */
function visit_function(node, context) {
	node.metadata = {
		...node.metadata,
		tracked: false,
		path: [...context.path],
	};
	if (!context.state.to_ts && context.state.mode !== 'server') {
		const candidates = /** @type {AnalysisResult} */ (context.state.analysis).box_candidates;
		if (node.params.length > 0) {
			const scope = context.state.scopes.get(node);
			if (scope) candidates.push({ node, scope });
		}
		// A reassigned function declaration is reboxed at the top of the block
		// that declares it, where the declaration has already been hoisted.
		if (node.type === 'FunctionDeclaration' && node.id) {
			candidates.push({ node, scope: context.state.scope, declaration: true });
		}
	}

	if (is_tsrx_component_function(node)) {
		node.metadata.native_tsrx_function = true;
		context.state.component = node;

		if (node.params.length > 0) {
			const props = node.params[0];

			if (props.type === 'ObjectPattern' || props.type === 'ArrayPattern') {
				assign_pattern_types(props, context, get_pattern_type_annotation(props));
			} else if (props.type === 'AssignmentPattern') {
				error(
					'Props are always an object, use destructured props with default values instead',
					context.state.analysis.module.filename,
					props,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		}

		const metadata = {};
		// Memoize the render body now so the transforms share one expansion.
		get_native_tsrx_function_body(node, context.state.scopes);
		const component_state = {
			...context.state,
			component: node,
			function_depth: (context.state.function_depth ?? 0) + 1,
			metadata,
		};

		context.next(component_state);

		if (node.type !== 'ArrowFunctionExpression' && node.id) {
			context.state.analysis.component_metadata.push({
				id: node.id.name,
			});
		}

		if (node.metadata.tracked) {
			mark_as_tracked(context.path);
		}
		return;
	}

	// Type the bindings of destructured parameters
	for (let i = 0; i < node.params.length; i++) {
		const param_node = node.params[i];
		const param = param_node.type === 'AssignmentPattern' ? param_node.left : param_node;
		const param_type_annotation =
			get_pattern_type_annotation(param) ?? param_node.typeAnnotation?.typeAnnotation;

		if (param.type === 'ObjectPattern' || param.type === 'ArrayPattern') {
			assign_pattern_types(param, context, param_type_annotation);
		}
	}

	context.next({
		...context.state,
		function_depth: (context.state.function_depth ?? 0) + 1,
	});

	if (node.metadata.tracked) {
		mark_as_tracked(context.path);
	}
}

/**
 * @param {AnalysisContext['path']} path
 */
function mark_as_tracked(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];

		if (is_native_tsrx_function_node(node)) {
			break;
		}
		if (
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression' ||
			node.type === 'FunctionDeclaration'
		) {
			node.metadata.tracked = true;
			break;
		}
	}
}

/**
 * @param {AST.ReturnStatement} node
 * @param {AnalysisContext} context
 * @param {string} message
 */
function error_return_keyword(node, context, message) {
	const return_keyword_node = getReturnKeywordNode(node);

	error(
		message,
		context.state.analysis.module.filename,
		return_keyword_node,
		context.state.collect ? context.state.analysis.errors : undefined,
		context.state.analysis.comments,
	);
}

/**
 * @param {AST.Expression} expression
 * @param {Context<AST.Node, AnalysisState>} context
 * @returns {boolean}
 */
function is_children_template_expression(expression, context) {
	const component = context.path.findLast((node) => is_native_tsrx_function_node(node));
	const component_scope = component ? context.state.scopes.get(component) : null;
	return is_children_template_expression_in_scope(expression, context.state.scope, component_scope);
}

/**
 * Shared by the plain statement and the `@`-directive forms — the logic is
 * (almost) entirely common; directive-ness is derived from the node type
 * where it matters.
 * @type {Visitor<AST.SwitchStatement | AST.JSXSwitchExpression, AnalysisState, AST.Node>}
 */
const visit_switch_statement = (node, context) => {
	if (context.state.regular_js || node.metadata?.regular_js) {
		return context.next({ ...context.state, regular_js: true, component: undefined });
	}

	if (!is_inside_component(context)) {
		return context.next();
	}

	context.visit(node.discriminant, context.state);

	for (const switch_case of node.cases) {
		// Skip empty cases
		if (switch_case.consequent.length === 0) {
			continue;
		}

		node.metadata = {
			...node.metadata,
			has_template: false,
		};

		context.visit(switch_case, context.state);
	}
};

/**
 * Shared by the plain statement and the `@`-directive forms — the logic is
 * (almost) entirely common; directive-ness is derived from the node type
 * where it matters.
 * @type {Visitor<AST.IfStatement | AST.JSXIfExpression, AnalysisState, AST.Node>}
 */
const visit_if_statement = (node, context) => {
	if (context.state.regular_js || node.metadata?.regular_js) {
		return context.next({ ...context.state, regular_js: true, component: undefined });
	}

	if (!is_inside_component(context)) {
		return context.next();
	}

	const is_template_directive =
		node.type === 'JSXIfExpression' ||
		is_template_else_if(node, /** @type {AST.Node[]} */ (context.path));

	node.metadata = {
		...node.metadata,
		has_template: false,
		has_throw: false,
		has_continue: false,
	};

	const test_metadata = { tracking: false };
	context.visit(node.test, { ...context.state, metadata: test_metadata });
	if (test_metadata.tracking) {
		/** @type {AST.TrackedNode} */ (node.test).tracked = true;
	}

	context.visit(node.consequent, context.state);

	const consequent_body =
		node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];

	if (
		consequent_body.length === 1 &&
		consequent_body[0].type === 'ReturnStatement' &&
		!node.alternate
	) {
		node.metadata.lone_return = true;
	}

	const consequent_script_only = is_script_only_control_flow_body(node.consequent);

	let alternate_script_only = false;
	if (node.alternate) {
		const saved_has_return = node.metadata.has_return;
		const saved_returns = node.metadata.returns;
		const saved_has_continue = node.metadata.has_continue;
		node.metadata.has_template = false;
		node.metadata.has_throw = false;
		node.metadata.has_continue = false;
		context.visit(node.alternate, context.state);

		alternate_script_only = is_script_only_control_flow_body(node.alternate);

		if (saved_has_return) {
			node.metadata.has_return = true;
			if (saved_returns) {
				node.metadata.returns = [...saved_returns, ...(node.metadata.returns || [])];
			}
		}
		if (saved_has_continue) {
			node.metadata.has_continue = true;
		}
	}

	if (!is_template_directive) {
		if (node.metadata.has_template && !node.metadata.has_return) {
			error(
				'TSRX elements and text inside JavaScript control flow blocks must use template directives. Use `@if`, `@for`, `@switch`, or `@try` for template control flow.',
				context.state.analysis.module.filename,
				node,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		} else if (!node.metadata.has_template && !node.metadata.has_continue) {
			node.metadata.regular_js = true;
		}
		return;
	}

	if (
		!node.metadata.has_template &&
		!node.metadata.has_return &&
		!node.metadata.has_throw &&
		!node.metadata.has_continue &&
		consequent_script_only &&
		(!node.alternate || alternate_script_only)
	) {
		node.metadata.script_only = true;
	}
};

/**
 * Shared by the plain statement and the `@`-directive forms — the logic is
 * (almost) entirely common; directive-ness is derived from the node type
 * where it matters.
 * @type {Visitor<AST.TryStatement | AST.JSXTryExpression, AnalysisState, AST.Node>}
 */
const visit_try_statement = (node, context) => {
	const { state } = context;
	if (state.regular_js || node.metadata?.regular_js) {
		return context.next({ ...state, regular_js: true, component: undefined });
	}

	if (!is_inside_component(context)) {
		return context.next();
	}

	if (node.pending) {
		node.metadata = {
			...node.metadata,
			has_template: false,
		};

		context.visit(node.block, state);

		if (!node.metadata.has_template && is_script_only_control_flow_body(node.block)) {
			node.metadata.script_only = true;
		}

		node.metadata = {
			...node.metadata,
			has_template: false,
		};

		context.visit(node.pending, state);

		if (
			(node.pending.body || []).length > 0 &&
			!node.metadata.has_template &&
			is_script_only_control_flow_body(node.pending)
		) {
			node.metadata.script_only = true;
		}
	} else {
		context.visit(node.block, state);
	}

	if (node.handler) {
		context.visit(node.handler, state);
	}

	if (node.finalizer) {
		context.visit(node.finalizer, state);
	}
};

/**
 * Whether a binding is the target of a `ref={name}` attribute (directly, in
 * an expression container, or as an element of a ref array): the compiled
 * setter assigns it when the element mounts and unmounts.
 * @param {Binding} binding
 * @returns {boolean}
 */
function is_ref_target(binding) {
	for (const { node, path } of binding.references) {
		if (node === binding.node) continue;
		for (let i = path.length - 1; i >= 0 && i >= path.length - 3; i--) {
			const ancestor = path[i];
			if (ancestor.type === 'JSXAttribute') {
				const name = /** @type {any} */ (ancestor).name;
				if (name?.type === 'JSXIdentifier' && name.name === 'ref') return true;
				break;
			}
			if (ancestor.type !== 'JSXExpressionContainer' && ancestor.type !== 'ArrayExpression') break;
		}
	}
	return false;
}

/**
 * Whether a binding is the left side of a `for...of` / `for...in` statement
 * (`for (name of list)`), which assigns it on every iteration without the
 * scope analysis counting that as a reassignment.
 * @param {Binding} binding
 * @returns {boolean}
 */
function is_loop_target(binding) {
	for (const { node, path } of binding.references) {
		const parent = path.at(-1);
		if (
			parent !== undefined &&
			(parent.type === 'ForOfStatement' || parent.type === 'ForInStatement') &&
			parent.left === node
		) {
			return true;
		}
	}
	return false;
}

/**
 * Whether a binding must be boxed: it is written after its declaration
 * (reassigned in the source, including through a destructuring assignment
 * target, or assigned by a compiled ref setter) and read from template code,
 * which the client transform hoists into module-level functions (`@if` and
 * `@switch` conditions and branches, render blocks). A hoisted function
 * captures locals by value, so such a variable is compiled to a `{ v }` box
 * whose identity is stable and whose current value every read and write sees,
 * exactly as a closure would.
 * @param {Binding} binding
 * @returns {boolean}
 */
function needs_box(binding) {
	if (
		binding.transform !== undefined ||
		binding.scope.function_depth === 0 ||
		(!binding.reassigned && !is_ref_target(binding) && !is_loop_target(binding))
	) {
		return false;
	}
	for (const { node, path } of binding.references) {
		if (node === binding.node) continue;
		if (
			path.some((ancestor) => ancestor.type.startsWith('JSX') && ancestor.type !== 'JSXCodeBlock')
		) {
			return true;
		}
	}
	return false;
}

/**
 * The names a parameter or catch pattern declares (defaults excluded).
 * @param {AST.Pattern} pattern
 * @param {string[]} into
 */
function pattern_names(pattern, into) {
	switch (pattern.type) {
		case 'Identifier':
			into.push(pattern.name);
			break;
		case 'AssignmentPattern':
			pattern_names(pattern.left, into);
			break;
		case 'RestElement':
			pattern_names(pattern.argument, into);
			break;
		case 'ObjectPattern':
			for (const property of pattern.properties) {
				pattern_names(property.type === 'RestElement' ? property : property.value, into);
			}
			break;
		case 'ArrayPattern':
			for (const element of pattern.elements) {
				if (element !== null) pattern_names(element, into);
			}
			break;
	}
}

/**
 * Boxes a function declaration that is reassigned later and read from template
 * code: the transform reboxes the name at the top of the declaring block
 * (`f = { v: f }`), after which reads and calls go through `.v`.
 * @param {AST.FunctionDeclaration} node
 * @param {ScopeInterface} scope the scope the declaration lives in
 */
function box_function_declaration(node, scope) {
	const id = /** @type {AST.Identifier} */ (node.id);
	const binding = scope.get(id.name);
	if (binding !== null && binding.node === id && needs_box(binding)) {
		box_binding(binding);
		node.metadata = /** @type {any} */ ({ ...node.metadata, boxed_declaration: true });
	}
}

/**
 * Boxes the written, template-read names a function's parameters or a catch
 * clause's parameter declare: the transform reassigns each to its box as the
 * first statement of the body (`mode = { v: mode }`), so a rebound parameter
 * behaves like any boxed `let`.
 * @param {AST.Function | AST.CatchClause} node
 * @param {ScopeInterface} scope the scope the parameters are declared in
 */
function box_params(node, scope) {
	/** @type {string[]} */
	const names = [];
	if (node.type === 'CatchClause') {
		if (node.param) pattern_names(node.param, names);
	} else {
		for (const param of node.params) pattern_names(param, names);
	}
	/** @type {string[]} */
	const boxed = [];
	for (const name of names) {
		const binding = scope.get(name);
		if (binding !== null && binding.scope === scope && needs_box(binding)) {
			box_binding(binding);
			boxed.push(name);
		}
	}
	if (boxed.length > 0) {
		node.metadata = /** @type {any} */ ({ ...node.metadata, boxed_params: boxed });
	}
}

/**
 * @param {Binding} binding
 */
function box_binding(binding) {
	binding.metadata = /** @type {any} */ ({ ...binding.metadata, boxed: true });
	binding.transform = {
		read: (node) => b.member(node ?? b.id(binding.node.name), b.id('v')),
		assign: (node, value) => b.assignment('=', b.member(node, b.id('v')), value),
		update: (node) => ({ ...node, argument: b.member(node.argument, b.id('v')) }),
	};
}

/**
 * Boxes the bindings a `let` declarator introduces that `needs_box`. A plain
 * identifier is boxed in place; a boxed name inside a pattern of any shape is
 * renamed in the pattern by the client transform and declared as its box next
 * to it. Runs after the walk, once every reference (a later reassignment, a
 * `ref` attribute) has been seen; records the decision on the declarator's
 * metadata.
 * @param {AST.VariableDeclarator} declarator
 * @param {ScopeInterface} scope
 */
function box_declarator(declarator, scope) {
	const metadata = /** @type {Record<string, any>} */ (declarator.metadata);
	const id = declarator.id;

	if (id.type === 'Identifier') {
		const binding = scope.get(id.name);
		if (binding !== null && binding.node === id && needs_box(binding)) {
			box_binding(binding);
			metadata.boxed = true;
		}
		return;
	}

	if (id.type !== 'ObjectPattern' && id.type !== 'ArrayPattern') {
		return;
	}

	/** @type {string[]} */
	const names = [];
	pattern_names(id, names);
	/** @type {string[]} */
	const boxed = [];
	for (const name of names) {
		const binding = scope.get(name);
		if (binding !== null && binding.scope === scope && needs_box(binding)) {
			box_binding(binding);
			boxed.push(name);
		}
	}
	if (boxed.length > 0) {
		metadata.boxed_names = boxed;
	}
}

/** @type {Visitors<AST.Node, AnalysisState>} */
const visitors = {
	_(node, { state, next, path }) {
		// Set up metadata.path for each node (needed for CSS pruning)
		if (!node.metadata) {
			node.metadata = { path: [...path] };
		} else {
			node.metadata.path = [...path];
		}

		const scope = state.scopes.get(node);
		next(scope !== undefined && scope !== state.scope ? { ...state, scope } : state);
	},

	AssignmentExpression(node, context) {
		record_text_intrinsic_write(node.left, context.state.scope);
		context.next();
	},
	UpdateExpression(node, context) {
		record_text_intrinsic_write(node.argument, context.state.scope);
		context.next();
	},
	UnaryExpression(node, context) {
		if (node.operator === 'delete') record_text_intrinsic_write(node.argument, context.state.scope);
		context.next();
	},
	TSDeclareFunction(node, context) {
		record_text_intrinsic_write(node.id, context.state.scope);
		context.next();
	},

	Program(_, context) {
		return context.next({ ...context.state, function_depth: 0 });
	},

	TSModuleDeclaration(node, context) {
		if (!is_submodule_declaration(node)) {
			return context.next();
		}

		const name = get_module_declaration_name(node);
		if (name === null) {
			return context.next();
		}

		const parent = context.path.at(-1);
		if (parent?.type !== 'Program') {
			// fatal since we don't have a transformation defined for this case
			error(
				'`module server` can only be declared at the module level.',
				context.state.analysis.module.filename,
				node,
			);
		}
		if (name !== 'server') {
			error(
				`Ripple only supports \`module server\` submodules, found \`module ${name}\`.`,
				context.state.analysis.module.filename,
				node.id,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return context.next();
		}
		if (context.state.analysis.metadata.serverModule) {
			error(
				'Only one `module server` declaration is allowed per file.',
				context.state.analysis.module.filename,
				node.id,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}
		node.metadata = {
			...node.metadata,
			exports: new Set(),
		};
		context.state.analysis.metadata.serverModule = node;
		context.visit(node.body, {
			...context.state,
			ancestor_server_block: node,
		});
	},

	Identifier(node, context) {
		const binding = context.state.scope.get(node.name);
		const parent = context.path.at(-1);
		// The TSRX dialect allows an Identifier import source (`from server`),
		// which the estree type for `source` (a Literal) does not model.
		const is_import_source =
			parent?.type === 'ImportDeclaration' && /** @type {AST.Node} */ (parent.source) === node;

		if (
			!is_import_source &&
			is_reference(node, /** @type {AST.Node} */ (parent)) &&
			binding?.declaration_kind === 'module' &&
			binding.node !== node
		) {
			error(
				'Import submodule exports before using them, e.g. `import { foo } from server; foo()`.',
				context.state.analysis.module.filename,
				node,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		if (
			is_reference(node, /** @type {AST.Node} */ (parent)) &&
			binding &&
			context.state.ancestor_server_block &&
			binding.node !== node // Don't check the declaration itself
		) {
			/** @type {ScopeInterface | null} */
			let current_scope = binding.scope;
			let found_server_block = false;

			while (current_scope !== null) {
				if (current_scope.server_block) {
					found_server_block = true;
					break;
				}
				current_scope = current_scope.parent;
			}

			if (!found_server_block) {
				error(
					`Cannot reference client-side "${node.name}" from a server module. Server modules can only access variables and imports declared inside them.`,
					context.state.analysis.module.filename,
					node,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		}

		if (node.tracked && binding) {
			if (
				binding.kind === 'prop' ||
				binding.kind === 'prop_fallback' ||
				binding.kind === 'for_pattern' ||
				(is_reference(node, /** @type {AST.Node} */ (parent)) &&
					node.tracked &&
					binding.node !== node)
			) {
				mark_as_tracked(context.path);
				if (context.state.metadata?.tracking === false) {
					context.state.metadata.tracking = true;
				}
			}
		}

		context.next();
	},

	MemberExpression(node, context) {
		if (node.object.type === 'Identifier' && node.object.name === 'server') {
			const binding = context.state.scope.get('server');
			if (binding?.declaration_kind === 'module') {
				error(
					'Import server exports before using them, e.g. `import { foo } from server; foo()`.',
					context.state.analysis.module.filename,
					node,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		}

		if (node.object.type === 'Identifier' && !node.object.tracked) {
			const binding = context.state.scope.get(node.object.name);

			if (binding && binding.metadata?.is_tsrx_object) {
				const internalProperties = new Set(['__v', 'a', 'b', 'c', 'f']);

				let propertyName = null;
				if (node.property.type === 'Identifier' && !node.computed) {
					propertyName = node.property.name;
				} else if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
					propertyName = node.property.value;
				}

				if (propertyName && internalProperties.has(propertyName)) {
					error(
						`Directly accessing internal property "${propertyName}" of a tracked object is not allowed. Use \`${node.object.name}.value\` instead.`,
						context.state.analysis.module.filename,
						node.property,
						context.state.collect ? context.state.analysis.errors : undefined,
						context.state.analysis.comments,
					);
				}
			}

			if (is_known_tracked_binding(binding, context)) {
				const is_allowed_tracked_access =
					!node.computed &&
					node.property.type === 'Identifier' &&
					(node.property.name === 'value' || node.property.name === 'length');

				if (is_allowed_tracked_access) {
					// pass through
				} else {
					error(
						`Accessing a tracked object directly is not allowed, use \`.value\` to read the value inside a tracked object - for example \`${node.object.name}.value\``,
						context.state.analysis.module.filename,
						node.object,
						context.state.collect ? context.state.analysis.errors : undefined,
						context.state.analysis.comments,
					);
				}
			}
		}

		context.next();
	},

	CallExpression(node, context) {
		const callee = node.callee;

		if (is_children_template_expression(/** @type {AST.Expression} */ (callee), context)) {
			error(
				'`children` cannot be called like a regular function. Render it with `{children}` or `{props.children}` instead.',
				context.state.analysis.module.filename,
				callee,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		if (context.state.function_depth === 0 && is_ripple_track_call(callee, context)) {
			error(
				'`track` can only be used within a reactive context, such as a component, function or class that is used or created from a component',
				context.state.analysis.module.filename,
				node.callee,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		// Generate unique hash for track/trackAsync calls. trackAsync uses the
		// hash for SSR serialization/hydration; track uses it so trackAsync can
		// look up its serialized dependencies during hydration.
		const track_call_name = is_ripple_track_call(callee, context);
		if (track_call_name !== null) {
			const id = ++context.state.module.track_id;
			const padded_id = String(id).padStart(6, '0');
			node.metadata = {
				...node.metadata,
				hash: strong_hash(context.state.analysis.module.filename + '__' + padded_id),
			};
		}

		if (!is_inside_component(context, true)) {
			mark_as_tracked(context.path);
		}

		context.next();
	},

	NewExpression(node, context) {
		context.next();
	},

	VariableDeclaration(node, context) {
		if (node.declare)
			for (const declaration of node.declarations) {
				record_text_intrinsic_write(declaration.id, context.state.scope);
			}
		const { state, visit } = context;

		for (const declarator of node.declarations) {
			if (is_inside_component(context) && node.kind === 'var') {
				error(
					'`var` declarations are not allowed in components, use let or const instead',
					state.analysis.module.filename,
					declarator.id,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
			const metadata = { tracking: false };

			if (declarator.id.type === 'Identifier') {
				const binding = state.scope.get(declarator.id.name);
				if (binding && declarator.init && declarator.init.type === 'CallExpression') {
					const callee = declarator.init.callee;
					// Check if it's a call to `track` or `tracked`
					if (
						(callee.type === 'Identifier' &&
							(callee.name === 'track' ||
								callee.name === 'trackAsync' ||
								callee.name === 'tracked')) ||
						(callee.type === 'MemberExpression' &&
							callee.property.type === 'Identifier' &&
							(callee.property.name === 'track' ||
								callee.property.name === 'trackAsync' ||
								callee.property.name === 'tracked'))
					) {
						binding.metadata = { ...binding.metadata, is_tsrx_object: true };
					}
				}
				visit(declarator, state);
			} else {
				assign_pattern_types(
					declarator.id,
					context,
					declarator.init != null
						? get_expression_type_annotation(declarator.init, context.state)
						: undefined,
				);

				visit(declarator, state);
			}

			declarator.metadata = { ...metadata, path: [...context.path] };
			// A `let` in a loop head gets a fresh binding per iteration, which a
			// shared box would collapse: closures made in the loop must keep their
			// own value, so it is never boxed.
			const parent = context.path.at(-1);
			const in_loop_head =
				parent !== undefined &&
				(parent.type === 'ForStatement' ||
					parent.type === 'ForInStatement' ||
					parent.type === 'ForOfStatement');
			if (!state.to_ts && state.mode !== 'server' && node.kind === 'let' && !in_loop_head) {
				/** @type {AnalysisResult} */ (state.analysis).box_candidates.push({
					node: declarator,
					scope: state.scope,
				});
			}
		}
	},

	ImportDeclaration(node, context) {
		const source_name = get_submodule_import_source_name(node);
		if (source_name === null) {
			return context.next();
		}

		if (source_name !== 'server') {
			error(
				`Ripple only supports imports from \`server\` submodules, found \`${source_name}\`.`,
				context.state.analysis.module.filename,
				node.source,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return context.next();
		}

		context.state.analysis.metadata.serverImportsPresent = true;
		context.state.analysis.metadata.serverImportDeclarations.push(node);

		for (const specifier of node.specifiers) {
			if (specifier.type !== 'ImportSpecifier') {
				error(
					'Only named imports are supported from `module server`.',
					context.state.analysis.module.filename,
					specifier,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		}

		context.next();
	},

	ArrowFunctionExpression(node, context) {
		visit_function(node, context);
	},
	FunctionExpression(node, context) {
		visit_function(node, context);
	},
	FunctionDeclaration(node, context) {
		visit_function(node, context);
	},

	ClassBody(node, context) {
		context.next();
	},

	CatchClause(node, context) {
		if (!context.state.to_ts && context.state.mode !== 'server' && node.param) {
			const scope = context.state.scopes.get(node);
			if (scope) {
				/** @type {AnalysisResult} */ (context.state.analysis).box_candidates.push({ node, scope });
			}
		}
		context.next();
	},

	ForStatement(node, context) {
		// `for`/`for…in`/`while`/`do…while` have no template directive form, so
		// they are always ordinary JavaScript — render via `@for` (a `for…of`) or
		// return JSX from inside the loop. Don't reject them; let them lower as
		// regular control flow.
		context.next();
	},

	SwitchStatement: visit_switch_statement,
	JSXSwitchExpression(node, context) {
		return analyze_directive_wrapping_values(node, context, visit_switch_statement);
	},

	ForOfStatement(node, context) {
		record_text_intrinsic_write(node.left, context.state.scope);
		if (context.state.regular_js || node.metadata?.regular_js) {
			return context.next({ ...context.state, regular_js: true, component: undefined });
		}

		if (!is_inside_component(context)) {
			return context.next();
		}

		node.metadata = {
			...node.metadata,
			has_template: false,
		};
		context.next();
		if (node.metadata.has_template) {
			error(
				'TSRX elements and text inside JavaScript control flow blocks must use template directives. Use `@if`, `@for`, `@switch`, or `@try` for template control flow.',
				context.state.analysis.module.filename,
				node,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		} else {
			node.metadata.regular_js = true;
		}
	},

	/**
	 * A `@for` directive — index/key bindings are template concerns; a plain
	 * JS `for…of` never carries them.
	 * @param {AST.JSXForExpression} node
	 * @param {AnalysisContext} context
	 */
	JSXForExpression(node, context) {
		const wrapper = node.metadata?.tsrx_value_wrapper;
		if (
			(!wrapper || !context.path.includes(wrapper)) &&
			!is_directive_render_position(context.path.at(-1), node)
		) {
			context.visit(get_directive_value_wrapper(node));
			return;
		}
		// `@for` covers for-of / for-in / for(;;): only the for-of form carries
		// index/key bindings; the other forms analyze like their plain statements
		// (an ordinary traversal, same as the ForInStatement/ForStatement visitors).
		if (node.statementType !== 'ForOfStatement') {
			return context.next();
		}

		if (context.state.regular_js || node.metadata?.regular_js) {
			return context.next({ ...context.state, regular_js: true, component: undefined });
		}

		infer_for_item_type_annotation(node, context);

		if (node.index) {
			const state = context.state;
			const scope = /** @type {ScopeInterface} */ (state.scopes.get(node));
			const binding = scope.get(/** @type {AST.Identifier} */ (node.index).name);

			if (binding !== null) {
				binding.kind = 'index';
				binding.transform = {
					read: (node) => {
						return tracked_get(node ?? binding.node);
					},
				};
			}
		}

		if (node.key) {
			const state = context.state;
			const pattern = /** @type {AST.VariableDeclaration} */ (node.left).declarations[0].id;
			const reads = pattern_reads(pattern);
			const scope = /** @type {ScopeInterface} */ (state.scopes.get(node));
			/** @type {AST.Identifier | AST.Pattern} */
			let pattern_id;
			if (state.to_ts || state.mode === 'server') {
				pattern_id = pattern;
			} else {
				// The transforms substitute the generated pattern id for the
				// destructured left when lowering a keyed @for — communicated
				// via metadata rather than rewriting the source declaration.
				pattern_id = b.id(scope.generate('pattern'));
				node.metadata.tsrx_for_pattern_id = pattern_id;
			}

			// A pattern with a rest element or a default is destructured once per
			// item, natively, into an object of its names (`fields`), so defaults
			// and iterators run exactly as in `const { ... } = item`. The transform
			// declares it in the loop body (see `tsrx_for_pattern_fields`); a name
			// then reads as a member of it. Without rest or defaults each name is a
			// member chain on the item.
			/** @type {AST.Identifier | null} */
			let fields_id = null;
			if (pattern_id !== pattern && reads.some((read) => read.chain === null)) {
				fields_id = b.id(scope.generate('fields'));
				node.metadata.tsrx_for_pattern_fields = {
					id: fields_id,
					names: reads.map((read) => read.node.name),
				};
			}

			for (const { node: id, chain } of reads) {
				const binding = context.state.scope.get(id.name);

				if (binding !== null) {
					binding.kind = 'for_pattern';
					if (!binding.metadata) {
						binding.metadata = {
							pattern: /** @type {AST.Identifier} */ (pattern_id),
						};
					}

					const item = () => b.call('_$_.get', /** @type {AST.Identifier} */ (pattern_id));
					binding.transform = {
						read:
							fields_id !== null
								? () =>
										b.member(
											b.call('_$_.get', /** @type {AST.Identifier} */ (fields_id)),
											b.id(id.name),
										)
								: () => /** @type {NonNullable<typeof chain>} */ (chain)(item()),
					};
				}
			}
		}

		node.metadata = {
			...node.metadata,
			has_template: false,
		};
		context.next();

		if (!node.metadata.has_template && is_script_only_control_flow_body(node.body)) {
			node.metadata.script_only = true;
		}
	},

	ExportNamedDeclaration(node, context) {
		const server_block = context.state.ancestor_server_block;

		if (!server_block) {
			return context.next();
		}

		const exports = server_block.metadata.exports ?? (server_block.metadata.exports = new Set());
		const declaration = /** @type {AST.TSRXExportNamedDeclaration} */ (node).declaration;

		if (declaration && declaration.type === 'FunctionDeclaration') {
			exports.add(declaration.id.name);
		} else if (declaration && declaration.type === 'VariableDeclaration') {
			for (const decl of declaration.declarations) {
				if (decl.init !== undefined && decl.init !== null) {
					if (decl.id.type === 'Identifier') {
						if (
							decl.init.type === 'FunctionExpression' ||
							decl.init.type === 'ArrowFunctionExpression'
						) {
							exports.add(decl.id.name);
							continue;
						} else if (decl.init.type === 'Identifier') {
							const name = decl.init.name;
							const binding = context.state.scope.get(name);
							if (binding && is_binding_function(binding, context.state.scope)) {
								exports.add(decl.id.name);
								continue;
							}
						} else if (decl.init.type === 'MemberExpression') {
							error(
								'Not implemented: Exported member expressions are not supported in server modules.',
								context.state.analysis.module.filename,
								decl.init,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
							continue;
						}
					} else if (decl.id.type === 'ObjectPattern' || decl.id.type === 'ArrayPattern') {
						for (const id of extractIdentifiers(decl.id)) {
							error(
								'Not implemented: Exported object or array patterns are not supported in server modules.',
								context.state.analysis.module.filename,
								id,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
						}
					}
				}
				// TODO: allow exporting consts when hydration is supported
				error(
					`Not implemented: Exported '${decl.id.type}' type is not supported in server modules.`,
					context.state.analysis.module.filename,
					decl,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		} else if (node.specifiers) {
			for (const specifier of node.specifiers) {
				const name = /** @type {AST.Identifier} */ (specifier.local).name;
				const binding = context.state.scope.get(name);
				const is_function = binding && is_binding_function(binding, context.state.scope);

				if (is_function) {
					exports.add(name);
					continue;
				}

				error(
					`Not implemented: Exported specifier type not supported in server modules.`,
					context.state.analysis.module.filename,
					specifier,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		} else {
			error(
				'Not implemented: Exported declaration type not supported in server modules.',
				context.state.analysis.module.filename,
				node,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		return context.next();
	},

	TSTypeReference(node, context) {
		context.next();
	},

	IfStatement: visit_if_statement,
	JSXIfExpression(node, context) {
		return analyze_directive_wrapping_values(node, context, visit_if_statement);
	},

	ReturnStatement(node, context) {
		const parent = context.path.at(-1);

		if (!is_inside_component(context)) {
			if (parent?.type === 'Program') {
				error_return_keyword(
					node,
					context,
					'Return statements are not allowed at the top level of a module.',
				);
			}

			return context.next();
		}

		if (is_native_tsrx_template_node(node.argument)) {
			context.visit(/** @type {AST.Node} */ (node.argument), context.state);
		}

		if (is_inside_template_if(context.path)) {
			validateTsrxIfReturnStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		if (is_inside_component_for_of(context.path)) {
			validateTsrxLoopReturnStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		if (is_inside_template_child(context.path)) {
			if (node.metadata?.invalid_tsrx_template_return) {
				validateTsrxReturnStatement(
					node,
					context.state.analysis.module.filename,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
				return;
			}
		}

		for (let i = context.path.length - 1; i >= 0; i--) {
			const ancestor = context.path[i];

			if (
				ancestor.type === 'FunctionExpression' ||
				ancestor.type === 'ArrowFunctionExpression' ||
				ancestor.type === 'FunctionDeclaration'
			) {
				break;
			}

			if (
				ancestor.type === 'IfStatement' &&
				/** @type {AST.TrackedNode} */ (ancestor.test).tracked
			) {
				node.metadata.is_reactive = true;
			}

			if (!ancestor.metadata.returns) {
				ancestor.metadata.returns = [];
			}
			ancestor.metadata.returns.push(node);
			ancestor.metadata.has_return = true;
		}
	},

	BreakStatement(node, context) {
		if (is_inside_component(context) && is_inside_template_if(context.path)) {
			validateTsrxIfBreakStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		if (is_inside_component(context) && break_targets_component_loop(context.path)) {
			validateTsrxLoopBreakStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		context.next();
	},

	ContinueStatement(node, context) {
		if (is_inside_component(context) && is_inside_template_if(context.path)) {
			validateTsrxIfContinueStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		if (is_inside_component(context) && is_inside_component_for_of(context.path)) {
			validateTsrxLoopContinueStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		context.next();
	},

	ThrowStatement(node, context) {
		if (!is_inside_component(context)) {
			return context.next();
		}

		for (let i = context.path.length - 1; i >= 0; i--) {
			const ancestor = context.path[i];

			if (
				ancestor.type === 'FunctionExpression' ||
				ancestor.type === 'ArrowFunctionExpression' ||
				ancestor.type === 'FunctionDeclaration'
			) {
				break;
			}

			if (ancestor.type === 'IfStatement') {
				if (!ancestor.metadata.has_throw) {
					ancestor.metadata.has_throw = true;
				}
			}
		}

		context.next();
	},

	TryStatement: visit_try_statement,
	JSXTryExpression(node, context) {
		return analyze_directive_wrapping_values(node, context, visit_try_statement);
	},

	ForInStatement(node, context) {
		record_text_intrinsic_write(node.left, context.state.scope);
		context.next();
	},

	WhileStatement(node, context) {
		context.next();
	},

	DoWhileStatement(node, context) {
		context.next();
	},

	JSXFragment(node, context) {
		if (context.state.regular_js) {
			return context.next();
		}

		mark_control_flow_has_template(context.path, node);
		return context.next();
	},

	JSXStyleElement(node, context) {
		if (context.state.regular_js || node.metadata?.regular_js) {
			return context.next({ ...context.state, regular_js: true, component: undefined });
		}

		mark_control_flow_has_template(context.path, node);

		// Children are stylesheet AST — nothing to analyze; the style pre-pass
		// (`style-scopes.js`) owns scoping, pruning, and `apply`.
	},

	JSXElement(node, context) {
		// A raw (non-template) element — an attribute value or other JSX that
		// never entered the template traversal.
		if (!is_template_element(node)) {
			return context.next();
		}

		if (context.state.regular_js || node.metadata?.regular_js) {
			return context.next({ ...context.state, regular_js: true, component: undefined });
		}

		const { state, visit, path } = context;
		const element_id = get_element_id(node);
		const element_attributes = get_element_attributes(node);
		const is_dynamic = is_dynamic_element(node);
		const is_dom_element = is_element_dom_element(node);
		// Dynamic tags (`<{expr}>`) resolve at runtime: scoped CSS pruning must
		// keep type selectors (the tag could be any element), and the element
		// receives the scope classes like a DOM element.
		if (is_dynamic) {
			node.metadata.dynamicElement = true;
		}
		/** @type {Set<AST.Identifier>} */
		const attribute_names = new Set();

		mark_control_flow_has_template(path, node);

		if (
			!is_dynamic &&
			!is_dom_element &&
			is_children_template_expression(/** @type {AST.Expression} */ (element_id), context)
		) {
			error(
				'`children` cannot be rendered as a component. Render it with `{children}` or `{props.children}` instead.',
				state.analysis.module.filename,
				element_id,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		validateNesting(node, context);

		if (is_dom_element) {
			if (/** @type {AST.Identifier} */ (element_id).name === 'head') {
				// head validation
				if (element_attributes.length > 0) {
					// TODO: could transform attributes as something, e.g. Text Node, and avoid a fatal error
					error('<head> cannot have any attributes', state.analysis.module.filename, node);
				}
				if (rendered_template_children(node.children, !!state.to_ts).length === 0) {
					// TODO: could transform children as something, e.g. Text Node, and avoid a fatal error
					error('<head> must have children', state.analysis.module.filename, node);
				}

				for (const child of node.children) {
					context.visit(child, { ...state, inside_head: true });
				}

				return;
			}
			if (state.inside_head) {
				if (/** @type {AST.Identifier} */ (element_id).name === 'title') {
					const children = normalize_children(node.children, context);

					if (children.length !== 1 || !is_template_text_or_expression(children[0])) {
						// TODO: could transform children as something, e.g. Text Node, and avoid a fatal error
						error('<title> must contain only text nodes', state.analysis.module.filename, node);
					}
				}

				// check for invalid elements in head
				if (!valid_in_head.has(/** @type {AST.Identifier} */ (element_id).name)) {
					// TODO: could transform invalid elements as something, e.g. Text Node, and avoid a fatal error
					error(
						`<${/** @type {AST.Identifier} */ (element_id).name}> cannot be used in <head>`,
						state.analysis.module.filename,
						node,
					);
				}
			} else {
				if (/** @type {AST.Identifier} */ (element_id).name === 'script') {
					const err_msg = '<script> cannot be used outside of <head>.';
					error(
						err_msg,
						state.analysis.module.filename,
						node.openingElement,
						state.collect ? state.analysis.errors : undefined,
					);

					if (node.closingElement) {
						error(
							err_msg,
							state.analysis.module.filename,
							node.closingElement,
							state.collect ? state.analysis.errors : undefined,
						);
					}
				}
			}

			const is_void = isVoidElement(/** @type {AST.Identifier} */ (element_id).name);

			for (const attr of element_attributes) {
				if (attr.type === 'JSXAttribute') {
					const attr_name = get_attribute_name_node(attr);
					const attr_value = get_attribute_value(attr);
					if (attr_value && attr_value.type === 'JSXEmptyExpression') {
						const value = /** @type {ESTreeJSX.JSXEmptyExpression & AST.NodeWithLocation} */ (
							attr_value
						);
						error(
							'attributes must only be assigned a non-empty expression',
							state.analysis.module.filename,
							{
								...value,
								start: value.start - 1,
								end: value.end + 1,
								loc: {
									start: {
										line: value.loc.start.line,
										column: value.loc.start.column - 1,
									},
									end: {
										line: value.loc.end.line,
										column: value.loc.end.column + 1,
									},
								},
							},
							context.state.collect ? context.state.analysis.errors : undefined,
							context.state.analysis.comments,
						);
					}
					attribute_names.add(attr_name);

					if (attr_name.name === 'key') {
						error(
							'The `key` attribute is not a thing in Ripple, and cannot be used on DOM elements. If you are using a for loop, then use the `for (let item of items; key item.id)` syntax.',
							state.analysis.module.filename,
							attr,
							context.state.collect ? context.state.analysis.errors : undefined,
							context.state.analysis.comments,
						);
					}

					if (isEventAttribute(attr_name.name)) {
						if (attr_value === null) {
							// A regular attribute can have no value (like `hidden`), but an
							// event attribute like `<div onC>` has no handler to run
							error(
								`the \`${attr_name.name}\` event attribute must be assigned a handler expression`,
								state.analysis.module.filename,
								attr,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
						} else {
							const handler = visit(/** @type {AST.Expression} */ (attr_value), state);
							const is_delegated = is_delegated_event(attr_name.name, handler, context);

							if (is_delegated) {
								if (attr.metadata === undefined) {
									attr.metadata = { path: [...path] };
								}

								attr.metadata.delegated = is_delegated;
							}
						}
					} else if (attr_value !== null) {
						visit(attr_value, state);
					}
				}
			}

			if (is_void && rendered_template_children(node.children, !!state.to_ts).length > 0) {
				error(
					`The <${/** @type {AST.Identifier} */ (element_id).name}> element is a void element and cannot have children`,
					state.analysis.module.filename,
					node,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		} else {
			for (const attr of element_attributes) {
				if (attr.type === 'JSXAttribute') {
					attribute_names.add(get_attribute_name_node(attr));
					const attr_value = get_attribute_value(attr);
					if (attr_value !== null) {
						visit(attr_value, state);
					}
				} else if (attr.type === 'JSXSpreadAttribute') {
					visit(attr.argument, state);
				}
			}
			/** @type {(AST.Node | AST.Expression)[]} */
			let implicit_children = [];

			// Collect names of components declared in children
			/** @type {Set<string>} */
			const child_component_names = new Set();
			for (const child of node.children) {
				if (
					(child.type === 'FunctionDeclaration' || child.type === 'FunctionExpression') &&
					is_native_tsrx_function_node(child) &&
					child.id
				) {
					child_component_names.add(child.id.name);
				}
			}

			// Validate that parent element attributes don't reference child-declared components
			if (child_component_names.size > 0) {
				for (const attr of element_attributes) {
					const attr_value = attr.type === 'JSXAttribute' ? get_attribute_value(attr) : null;
					if (attr.type === 'JSXAttribute' && attr_value?.type === 'Identifier') {
						if (child_component_names.has(attr_value.name)) {
							error(
								`Cannot use component '${attr_value.name}' as a prop on its parent element. Component declarations inside children are not in scope for the parent element's attributes.`,
								state.analysis.module.filename,
								attr_value,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
						}
					} else if (attr.type === 'JSXSpreadAttribute' && attr.argument.type === 'Identifier') {
						if (child_component_names.has(attr.argument.name)) {
							error(
								`Cannot use component '${attr.argument.name}' as a prop on its parent element. Component declarations inside children are not in scope for the parent element's attributes.`,
								state.analysis.module.filename,
								attr.argument,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
						}
					}
				}
			}

			for (const child of node.children) {
				if (is_native_tsrx_function_node(child)) {
					visit(child, state);
				} else if (
					child.type !== 'EmptyStatement' &&
					!is_droppable_template_text(child, !!state.to_ts) &&
					!is_empty_expression_container(child)
				) {
					implicit_children.push(
						is_template_text_or_expression(child)
							? get_template_expression(child, !!state.to_ts)
							: child,
					);
				}
			}
		}

		// Validation
		for (const attribute of attribute_names) {
			const name = attribute.name;
			if (name === 'children') {
				if (is_dom_element) {
					error(
						'Cannot have a `children` prop on an element',
						state.analysis.module.filename,
						attribute,
						context.state.collect ? context.state.analysis.errors : undefined,
						context.state.analysis.comments,
					);
				}
			}
		}

		return {
			...node,
			children: node.children.map((child) => visit(child)),
		};
	},

	JSXExpressionContainer(node, context) {
		const parent = context.path.at(-1);
		const text_children = /** @type {AnalysisResult} */ (context.state.analysis)
			.textChildExpressions;
		if (
			text_children &&
			(parent?.type === 'JSXElement' || parent?.type === 'JSXFragment') &&
			parent.children.includes(node) &&
			node.expression.type !== 'JSXEmptyExpression'
		) {
			const expression = /** @type {AST.Expression} */ (node.expression);
			text_children.set(`${expression.start}:${expression.end}`, { expression, container: node });
		}

		if (context.state.regular_js) {
			return context.next();
		}

		// A `{/* comment */}` container renders nothing — it must not mark the
		// surrounding control flow as templated.
		if (!is_empty_expression_container(node)) {
			mark_control_flow_has_template(context.path, node);
		}

		context.next();
	},

	JSXText(node, context) {
		if (context.state.regular_js) {
			return context.next();
		}

		// Insignificant whitespace collapses to nothing at runtime — it must not
		// mark the surrounding control flow as templated.
		if (!is_droppable_template_text(node, !!context.state.to_ts)) {
			mark_control_flow_has_template(context.path, node);
		}

		context.next();
	},

	JSXCodeBlock(node, context) {
		const parent = context.path.at(-1);

		// A `@{ … }` in a template-children slot, or the render slot of another
		// code block (an `@{ @{ … } }` chain), analyzes as its lowered template
		// form — the same memoized node the transforms will consume, so scope
		// bindings and component analysis attach to what actually renders.
		if (
			is_template_child_position(context.path, node) ||
			(parent?.type === 'JSXCodeBlock' && parent.render === node)
		) {
			const child = get_code_block_template_child(node, context.state.scopes);
			if (child != null && child !== node) {
				context.visit(child);
			}
			return;
		}

		context.next();
	},

	AwaitExpression(node, context) {
		const parent_block = get_parent_block_node(context);

		if (is_inside_component(context)) {
			const adjusted_node /** @type {AST.AwaitExpression} */ = {
				...node,
				end: /** @type {AST.NodeWithLocation} */ (node).start + 'await'.length,
			};
			error(
				'`await` is not allowed inside components. Use `trackAsync(() => ...)` with an upstream `@try { ... } @pending { ... }` boundary instead.',
				context.state.analysis.module.filename,
				adjusted_node,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		if (parent_block) {
			if (!parent_block.metadata) {
				parent_block.metadata = { path: [...context.path] };
			}
		}

		context.next();
	},
};

/**
 * @param {AnalysisResult} analysis
 * @param {string} filename
 * @param {boolean} collect
 */
function validate_server_module_imports(analysis, filename, collect) {
	const server_module = analysis.metadata.serverModule;

	for (const declaration of analysis.metadata.serverImportDeclarations) {
		if (!server_module) {
			error(
				'Cannot import from `server` because this file has no `module server` declaration.',
				filename,
				declaration.source,
				collect ? analysis.errors : undefined,
				analysis.comments,
			);
			continue;
		}

		const exports = server_module.metadata?.exports;
		for (const specifier of declaration.specifiers) {
			if (specifier.type !== 'ImportSpecifier') {
				continue;
			}
			const imported_name = get_imported_name(specifier);
			if (imported_name !== null && !exports?.has(imported_name)) {
				error(
					`Module \`server\` does not export \`${imported_name}\`.`,
					filename,
					specifier.imported,
					collect ? analysis.errors : undefined,
					analysis.comments,
				);
			}
		}
	}
}

/**
 *
 * @param {AST.Program} ast
 * @param {string} filename
 * @param {AnalyzeOptions} options
 * @returns {AnalysisResult}
 */
export function analyze(ast, filename, options = {}) {
	const scope_root = new ScopeRoot();
	const errors = options.errors ?? [];
	const comments = options.comments ?? [];
	const collect = !!(options.collect || options.loose);

	const { scope, scopes } = createScopes(ast, scope_root, null, {
		collect,
		errors,
		filename,
		comments,
	});

	register_type_declarations(scope, ast);

	const analysis = /** @type {AnalysisResult} */ ({
		module: { ast, scope, scopes, filename },
		ast,
		scope,
		scopes,
		component_metadata: [],
		metadata: {
			serverImportsPresent: false,
			serverImportDeclarations: [],
			serverModule: null,
		},
		errors,
		comments,
		stylesheets: [],
		box_candidates: [],
		textChildExpressions:
			options.to_ts || ('textTypeFacts' in options && options.textTypeFacts !== undefined)
				? new Map()
				: undefined,
	});

	walk(
		ast,
		/** @type {AnalysisState} */
		{
			scope,
			scopes,
			analysis,
			inside_head: false,
			ancestor_server_block: undefined,
			to_ts: options.to_ts ?? false,
			collect,
			metadata: {},
			mode: options.mode,
			module: {
				track_id: 0,
			},
		},
		visitors,
	);

	validate_server_module_imports(analysis, filename, collect);

	// Boxing needs every reference of a binding, so it runs after the walk.
	for (const { node, scope: candidate_scope, declaration } of analysis.box_candidates) {
		if (node.type === 'VariableDeclarator') {
			box_declarator(node, candidate_scope);
		} else if (declaration) {
			box_function_declaration(/** @type {AST.FunctionDeclaration} */ (node), candidate_scope);
		} else {
			box_params(node, candidate_scope);
		}
	}

	// Style scopes need every element's ancestor path, which the walk above
	// records, so they are resolved last.
	prepare_style_scopes(ast, analysis, filename, collect);

	return analysis;
}
