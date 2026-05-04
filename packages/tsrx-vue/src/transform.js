/** @import { JsxPlatform } from '@tsrx/core/types' */

import { walk } from 'zimmerframe';
import is_reference from 'is-reference';
import {
	builders,
	clone_expression_node,
	clone_identifier,
	create_generated_identifier,
	componentToFunctionDeclaration,
	createJsxTransform,
	error,
	setLocation,
} from '@tsrx/core';

/**
 * Minimal Vue platform descriptor consumed by `createJsxTransform`.
 *
 * Vue largely reuses the shared JSX lowering while wrapping compiled
 * components in `defineVaporComponent(...)` and handling its extra imports.
 * Async component bodies still stay explicitly unsupported.
 *
 * @type {JsxPlatform}
 */
const vue_platform = {
	name: 'Vue',
	imports: {
		suspense: 'vue',
		errorBoundary: '@tsrx/vue/error-boundary',
		mergeRefs: '@tsrx/vue/merge-refs',
	},
	jsx: {
		rewriteClassAttr: false,
		acceptedTsxKinds: ['vue'],
		multiRefStrategy: 'merge-refs',
	},
	validation: {
		requireUseServerForAwait: true,
		scanUseServerDirectiveForAwaitWithCustomValidator: false,
		unsupportedTryPendingMessage:
			'Vue TSRX does not support `pending` blocks in component templates yet. Vue Suspense uses fallback slots rather than a `fallback` prop, so `try { ... } pending { ... }` cannot be lowered correctly for this target yet.',
	},
	hooks: {
		initialState: () => ({
			needs_define_vapor_component: false,
			needs_vapor_for: false,
		}),
		isTopLevelSetupCall(call_expression) {
			return is_vue_setup_call(call_expression);
		},
		wrapHelperComponent(helper_fn, helper_id, ctx, source_node) {
			ctx.needs_define_vapor_component = true;
			return wrap_helper_component(helper_fn, helper_id, source_node);
		},
		canHoistStaticNode(node) {
			return !contains_component_jsx(node);
		},
		preprocessElementAttributes(attrs, ctx, element) {
			return preprocess_ref_attributes(attrs, element, ctx);
		},
		renderForOf: (node, loop_params, body_statements, ctx) =>
			render_for_of_as_vapor_for(node, loop_params, body_statements, ctx),
		createErrorBoundaryContent(try_content) {
			return builders.arrow([], try_content.expression);
		},
		transformElementChildren(node, walked_children, raw_children, attributes, ctx) {
			return rewrite_host_text_or_html_children(
				node,
				walked_children,
				raw_children,
				attributes,
				ctx,
			);
		},
		validateComponentAwait(await_expression, _component, ctx) {
			error(
				'`await` is not yet supported in Vue TSRX components.',
				ctx?.filename ?? null,
				await_expression,
				ctx?.errors,
				ctx?.comments,
			);
		},
		componentToFunction(component, ctx, helper_state) {
			ctx.needs_define_vapor_component = true;
			return component_to_vapor_component_declaration(component, ctx, helper_state);
		},
		injectImports(program, ctx) {
			inject_vue_imports(program, ctx);
		},
	},
};

export const transform = createJsxTransform(vue_platform);

/**
 * @param {any} component
 * @param {any} transform_context
 * @param {any} helper_state
 * @returns {any}
 */
function component_to_vapor_component_declaration(component, transform_context, helper_state) {
	const fn = componentToFunctionDeclaration(component, transform_context, helper_state);
	const generated_helpers = helper_state?.helpers || [];
	const generated_statics = helper_state?.statics || [];
	const call = create_define_vapor_component_call(
		function_declaration_to_expression(fn),
		generated_helpers,
		generated_statics,
		component,
	);

	if (component.default || !component.id) {
		return call;
	}

	const component_id = clone_identifier(component.id);
	const fn_id = fn.type === 'FunctionDeclaration' ? fn.id : null;
	component_id.metadata = {
		...component_id.metadata,
		...(fn_id?.metadata || {}),
		path: component_id.metadata?.path || [],
	};
	/** @type {any} */ (component_id.metadata).hover = create_component_hover_replacement(fn.params);

	const declaration = builders.declaration('const', [builders.declarator(component_id, call)]);
	Object.assign(/** @type {any} */ (declaration.metadata), {
		generated_helpers,
		generated_statics,
	});
	return setLocation(/** @type {any} */ (declaration), component);
}

/**
 * @param {any} helper_fn
 * @param {any} helper_id
 * @param {any} source_node
 * @returns {any}
 */
function wrap_helper_component(helper_fn, helper_id, source_node) {
	return setLocation(
		builders.declaration('const', [
			builders.declarator(
				clone_identifier(helper_id),
				create_define_vapor_component_call(
					function_declaration_to_expression(helper_fn),
					[],
					[],
					source_node,
				),
			),
		]),
		source_node,
	);
}

/**
 * @param {any} fn_expression
 * @param {any[]} generated_helpers
 * @param {any[]} generated_statics
 * @param {any} source_node
 * @returns {any}
 */
function create_define_vapor_component_call(
	fn_expression,
	generated_helpers,
	generated_statics,
	source_node,
) {
	const call = builders.call('defineVaporComponent', fn_expression);
	Object.assign(/** @type {any} */ (call.metadata), {
		generated_helpers,
		generated_statics,
	});
	return setLocation(call, source_node);
}

/**
 * @param {any} node
 * @param {any[]} loop_params
 * @param {any[]} body_statements
 * @param {any} transform_context
 * @returns {any | null}
 */
function render_for_of_as_vapor_for(node, loop_params, body_statements, transform_context) {
	if (body_statements.length !== 1) {
		return null;
	}

	const statement = body_statements[0];
	if (statement?.type !== 'ReturnStatement' || !statement.argument) {
		return null;
	}

	const rendered = statement.argument;
	if (expression_can_skip_rendering(rendered)) {
		return render_for_of_as_flat_map(node, loop_params, rendered);
	}

	const key_expression = node.key
		? clone_expression_node(node.key)
		: (find_jsx_key_expression(rendered) ??
			(node.index ? clone_expression_node(node.index) : null));

	const slot = key_expression
		? create_keyed_vapor_for_slot(loop_params, rendered)
		: { params: loop_params, body: rendered, expression: true };
	if (!slot) {
		return null;
	}

	transform_context.needs_vapor_for = true;

	if (key_expression) {
		strip_top_level_jsx_keys(slot.body);
	}

	const attributes = [
		builders.jsx_attribute(
			builders.jsx_id('in'),
			to_jsx_expression_container(clone_expression_node(node.right)),
		),
	];

	if (key_expression) {
		attributes.push(
			builders.jsx_attribute(
				builders.jsx_id('getKey'),
				to_jsx_expression_container(create_loop_callback(loop_params, key_expression, true)),
			),
		);
	}

	return to_jsx_expression_container(
		builders.jsx_element_fresh(
			builders.jsx_opening_element(builders.jsx_id('VaporFor'), attributes),
			builders.jsx_closing_element(builders.jsx_id('VaporFor')),
			[to_jsx_expression_container(create_loop_callback(slot.params, slot.body, slot.expression))],
		),
	);
}

/**
 * @param {any} node
 * @param {any[]} loop_params
 * @param {any} rendered
 * @returns {any}
 */
function render_for_of_as_flat_map(node, loop_params, rendered) {
	return to_jsx_expression_container(
		builders.call(
			builders.member(clone_expression_node(node.right), 'flatMap'),
			builders.arrow(
				loop_params,
				builders.block([builders.return(to_array_render_expression(rendered))]),
			),
		),
	);
}

/**
 * Loop bodies that can return `null` need the shared callback lowering so
 * `continue` truly skips the iteration.
 *
 * @param {any} node
 * @returns {boolean}
 */
function expression_can_skip_rendering(node) {
	if (!node || typeof node !== 'object') {
		return false;
	}

	if (node.type === 'Literal' && node.value === null) {
		return true;
	}

	if (node.type === 'ConditionalExpression') {
		return (
			expression_can_skip_rendering(node.consequent) ||
			expression_can_skip_rendering(node.alternate)
		);
	}

	if (node.type === 'LogicalExpression' && node.operator === '&&') {
		return true;
	}

	return false;
}

/**
 * @param {any} node
 * @returns {any}
 */
function to_array_render_expression(node) {
	if (node?.type === 'Literal' && node.value === null) {
		return builders.array([]);
	}

	if (node?.type === 'ConditionalExpression') {
		return builders.conditional(
			node.test,
			to_array_render_expression(node.consequent),
			to_array_render_expression(node.alternate),
		);
	}

	if (node?.type === 'LogicalExpression' && node.operator === '&&') {
		return builders.conditional(
			node.left,
			to_array_render_expression(node.right),
			builders.array([]),
		);
	}

	return builders.array([node]);
}

/**
 * @param {any} node
 * @returns {any | null}
 */
function find_jsx_key_expression(node) {
	if (node?.type !== 'JSXElement') {
		return null;
	}

	for (const attr of node.openingElement?.attributes || []) {
		if (
			attr.type === 'JSXAttribute' &&
			attr.name?.type === 'JSXIdentifier' &&
			attr.name.name === 'key'
		) {
			return attr.value?.type === 'JSXExpressionContainer'
				? clone_expression_node(attr.value.expression)
				: clone_expression_node(attr.value);
		}
	}

	return null;
}

/**
 * @param {any} node
 * @returns {void}
 */
function strip_top_level_jsx_keys(node) {
	if (node?.type === 'JSXElement') {
		node.openingElement.attributes = (node.openingElement.attributes || []).filter(
			(/** @type {any} */ attr) =>
				!(
					attr.type === 'JSXAttribute' &&
					attr.name?.type === 'JSXIdentifier' &&
					attr.name.name === 'key'
				),
		);
		return;
	}

	if (node?.type === 'JSXFragment') {
		for (const child of node.children || []) {
			strip_top_level_jsx_keys(child);
		}
	}
}

/**
 * @param {any[]} loop_params
 * @param {any} body
 * @param {boolean} expression
 * @returns {any}
 */
function create_loop_callback(loop_params, body, expression) {
	const callback = builders.arrow(
		loop_params.map((param) => clone_expression_node(param)),
		body,
	);
	callback.expression = expression;
	return callback;
}

/**
 * @param {any[]} loop_params
 * @param {any} rendered
 * @returns {{ params: any[], body: any, expression: boolean } | null}
 */
function create_keyed_vapor_for_slot(loop_params, rendered) {
	if (loop_params[0]?.type === 'Identifier') {
		return {
			params: loop_params,
			body: rewrite_vapor_for_keyed_slot_refs(rendered, loop_params),
			expression: true,
		};
	}

	const item_ref = create_generated_identifier('__vapor_item');
	const item_ref_value = create_value_member_expression(item_ref);
	const replacements = create_pattern_replacements(loop_params[0], item_ref_value);
	if (!replacements) {
		return null;
	}

	const params = [item_ref, ...loop_params.slice(1)];
	const rewritten_rendered = rewrite_vapor_for_keyed_slot_refs(
		rendered,
		loop_params.slice(1),
		replacements,
	);

	return {
		params,
		body: rewritten_rendered,
		expression: true,
	};
}

/**
 * Vue's `VaporFor` passes plain item values to unkeyed slots, but keyed slots
 * receive shallow refs so row instances can update in place. Match that runtime
 * shape by reading loop params through `.value` inside the slot body.
 *
 * @param {any} node
 * @param {any[]} loop_params
 * @param {Map<string, any>} [replacements]
 * @returns {any}
 */
function rewrite_vapor_for_keyed_slot_refs(node, loop_params, replacements = new Map()) {
	const loop_param_names = new Set();
	for (const param of loop_params) {
		collect_pattern_names(param, loop_param_names);
	}

	if (loop_param_names.size === 0 && replacements.size === 0) {
		return node;
	}

	return walk(
		node,
		{ loop_param_names, shadowed_names: new Set() },
		{
			Identifier(identifier, { path, state, next }) {
				const parent = path.at(-1);
				if (
					(state.loop_param_names.has(identifier.name) || replacements.has(identifier.name)) &&
					!state.shadowed_names.has(identifier.name) &&
					parent &&
					is_runtime_reference(identifier, parent)
				) {
					const replacement = replacements.get(identifier.name);
					if (replacement) {
						return clone_expression_node(replacement);
					}
					return create_value_member_expression(identifier);
				}

				return next();
			},
			FunctionDeclaration: rewrite_function_shadowed_refs,
			FunctionExpression: rewrite_function_shadowed_refs,
			ArrowFunctionExpression: rewrite_function_shadowed_refs,
			BlockStatement: rewrite_block_shadowed_refs,
		},
	);
}

/**
 * @param {any} identifier
 * @param {any} parent
 * @returns {boolean}
 */
function is_runtime_reference(identifier, parent) {
	if (parent.type === 'JSXExpressionContainer') {
		return parent.expression === identifier;
	}
	if (parent.type === 'JSXAttribute') {
		return parent.value === identifier || parent.value?.expression === identifier;
	}
	return is_reference(identifier, parent);
}

/**
 * @param {any} pattern
 * @param {any} source
 * @returns {Map<string, any> | null}
 */
function create_pattern_replacements(pattern, source) {
	const replacements = new Map();
	return collect_pattern_replacements(pattern, source, replacements) ? replacements : null;
}

/**
 * @param {any} pattern
 * @param {any} source
 * @param {Map<string, any>} replacements
 * @returns {boolean}
 */
function collect_pattern_replacements(pattern, source, replacements) {
	if (!pattern) return true;

	switch (pattern.type) {
		case 'Identifier':
			replacements.set(pattern.name, source);
			return true;
		case 'ObjectPattern':
			for (const property of pattern.properties || []) {
				if (property.type === 'RestElement' || property.computed) {
					return false;
				}
				if (
					property.type !== 'Property' ||
					!collect_pattern_replacements(
						property.value,
						create_property_member_expression(source, property.key),
						replacements,
					)
				) {
					return false;
				}
			}
			return true;
		case 'ArrayPattern':
			for (let index = 0; index < (pattern.elements || []).length; index++) {
				const element = pattern.elements[index];
				if (
					element &&
					!collect_pattern_replacements(
						element,
						create_index_member_expression(source, index),
						replacements,
					)
				) {
					return false;
				}
			}
			return true;
		default:
			return false;
	}
}

/**
 * @param {any} node
 * @param {{ state: { loop_param_names: Set<string>, shadowed_names: Set<string> }, next: (state?: any) => any }} context
 * @returns {any}
 */
function rewrite_function_shadowed_refs(node, { state, next }) {
	const shadowed_names = new Set(state.shadowed_names);
	if (node.id) {
		collect_pattern_names(node.id, shadowed_names);
	}
	for (const param of node.params || []) {
		collect_pattern_names(param, shadowed_names);
	}
	collect_function_var_names(node.body, shadowed_names);
	return next({ ...state, shadowed_names });
}

/**
 * @param {any} node
 * @param {{ state: { loop_param_names: Set<string>, shadowed_names: Set<string> }, next: (state?: any) => any }} context
 * @returns {any}
 */
function rewrite_block_shadowed_refs(node, { state, next }) {
	const shadowed_names = new Set(state.shadowed_names);
	collect_block_lexical_names(node.body, shadowed_names);
	return next({ ...state, shadowed_names });
}

/**
 * @param {any[]} statements
 * @param {Set<string>} names
 * @returns {void}
 */
function collect_block_lexical_names(statements, names) {
	for (const statement of statements || []) {
		if (statement.type === 'VariableDeclaration' && statement.kind !== 'var') {
			for (const declaration of statement.declarations || []) {
				collect_pattern_names(declaration.id, names);
			}
			continue;
		}

		if (
			(statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') &&
			statement.id
		) {
			collect_pattern_names(statement.id, names);
		}
	}
}

/**
 * @param {any} node
 * @param {Set<string>} names
 * @returns {void}
 */
function collect_function_var_names(node, names) {
	if (!node || typeof node !== 'object') return;

	if (Array.isArray(node)) {
		for (const child of node) {
			collect_function_var_names(child, names);
		}
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

	if (node.type === 'VariableDeclaration' && node.kind === 'var') {
		for (const declaration of node.declarations || []) {
			collect_pattern_names(declaration.id, names);
		}
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		collect_function_var_names(node[key], names);
	}
}

/**
 * @param {any} node
 * @param {Set<string>} names
 * @returns {void}
 */
function collect_pattern_names(node, names) {
	if (!node) return;

	switch (node.type) {
		case 'Identifier':
			names.add(node.name);
			break;
		case 'RestElement':
			collect_pattern_names(node.argument, names);
			break;
		case 'AssignmentPattern':
			collect_pattern_names(node.left, names);
			break;
		case 'ArrayPattern':
			for (const element of node.elements || []) {
				collect_pattern_names(element, names);
			}
			break;
		case 'ObjectPattern':
			for (const property of node.properties || []) {
				collect_pattern_names(property, names);
			}
			break;
		case 'Property':
			collect_pattern_names(node.value, names);
			break;
	}
}

/**
 * @param {any} object
 * @param {any} key
 * @returns {any}
 */
function create_property_member_expression(object, key) {
	if (key?.type === 'Identifier') {
		return create_member_expression(
			clone_expression_node(object),
			clone_identifier(key),
			false,
			key,
		);
	}

	return create_member_expression(
		clone_expression_node(object),
		clone_expression_node(key),
		true,
		key,
	);
}

/**
 * @param {any} object
 * @param {number} index
 * @returns {any}
 */
function create_index_member_expression(object, index) {
	return create_member_expression(
		clone_expression_node(object),
		builders.literal(index),
		true,
		object,
	);
}

/**
 * @param {any} identifier
 * @returns {any}
 */
function create_value_member_expression(identifier) {
	return create_member_expression(clone_identifier(identifier), 'value', false, identifier);
}

/**
 * @param {any} object
 * @param {any} property
 * @param {boolean} computed
 * @param {any} source_node
 * @returns {any}
 */
function create_member_expression(object, property, computed, source_node) {
	return builders.member(object, property, computed, false, source_node);
}

/**
 * @param {any} fn
 * @returns {any}
 */
function function_declaration_to_expression(fn) {
	if (fn.type === 'ArrowFunctionExpression') {
		return {
			...fn,
			metadata: {
				...(fn.metadata || {}),
				path: fn.metadata?.path || [],
			},
		};
	}

	return {
		...fn,
		type: 'FunctionExpression',
		metadata: {
			...(fn.metadata || {}),
			path: fn.metadata?.path || [],
		},
	};
}

const VUE_COMPONENT_HOVER_LABEL_REGEX = /(function|\((property|method)\))/;

/**
 * @param {any[]} [params]
 * @returns {(content: string) => string}
 */
function create_component_hover_replacement(params) {
	const lazy_param_regexes = (params || [])
		.filter((param) => param.type === 'Identifier' && /^__lazy\d+$/.test(param.name))
		.map((param) => new RegExp(`\\b${param.name}\\s*:\\s*`, 'g'));

	return (content) => {
		let next = content.replace(VUE_COMPONENT_HOVER_LABEL_REGEX, (_, fn, kind) => {
			if (fn === 'function') return 'component';
			return `(component ${kind})`;
		});
		for (const regex of lazy_param_regexes) {
			next = next.replace(regex, '&');
		}
		return next;
	};
}

const VUE_SETUP_CALLS = new Set([
	'ref',
	'shallowRef',
	'computed',
	'reactive',
	'shallowReactive',
	'customRef',
	'toRef',
	'toRefs',
	'useTemplateRef',
]);

/**
 * @param {any} call_expression
 * @returns {boolean}
 */
function is_vue_setup_call(call_expression) {
	const callee = call_expression?.callee;
	if (!callee) return false;

	if (callee.type === 'Identifier') {
		return VUE_SETUP_CALLS.has(callee.name);
	}

	if (
		callee.type === 'MemberExpression' &&
		callee.computed === false &&
		callee.property?.type === 'Identifier'
	) {
		return VUE_SETUP_CALLS.has(callee.property.name);
	}

	return false;
}

/**
 * Reject `{ref expr}` on composite (component-like) elements: Vue component
 * refs resolve to the component instance, not the rendered DOM node, so
 * Ripple-style component refs don't have a meaningful DOM target. Multi-ref
 * merging itself is handled by the shared `merge_duplicate_refs` pass via
 * the platform's `multiRefStrategy: 'merge-refs'` config.
 *
 * @param {any[]} attrs
 * @param {any} element
 * @param {any} transform_context
 * @returns {any[]}
 */
function preprocess_ref_attributes(attrs, element, transform_context) {
	if (!is_component_like_element(element)) {
		return attrs;
	}
	for (const attr of attrs) {
		if (attr?.type === 'RefAttribute') {
			error(
				'`{ref ...}` on the Vue target is only supported on host elements. Vue component refs resolve to component instances rather than the rendered DOM node, so Ripple-style component refs are not supported here.',
				transform_context?.filename ?? null,
				attr,
				transform_context?.errors,
				transform_context?.comments,
			);
		}
	}
	return attrs;
}

/**
 * @param {any} node
 * @param {any[]} walked_children
 * @param {any[]} raw_children
 * @param {any[]} attributes
 * @param {any} [transform_context]
 * @returns {{ children: any[]; selfClosing?: boolean } | null}
 */
function rewrite_host_text_or_html_children(
	node,
	walked_children,
	raw_children,
	attributes,
	transform_context,
) {
	const source_children = raw_children || walked_children;
	const is_composite = is_component_like_element(node);
	const html_children = source_children.filter((child) => child?.type === 'Html');

	if (html_children.length > 0) {
		if (
			is_composite ||
			source_children.length !== 1 ||
			has_dom_content_attribute(attributes, 'innerHTML') ||
			has_dom_content_attribute(attributes, 'textContent')
		) {
			error(
				'`{html ...}` on the Vue target is only supported as the sole child of a host element. Use `innerHTML={...}` as an element attribute when you need the explicit prop form.',
				transform_context?.filename ?? null,
				html_children[0],
				transform_context?.errors,
				transform_context?.comments,
			);
		}

		const walked_html = walked_children[0] || html_children[0];
		attributes.push(
			create_jsx_attribute(
				'innerHTML',
				to_jsx_expression_container(walked_html.expression, html_children[0]),
				html_children[0],
			),
		);

		return { children: [], selfClosing: true };
	}

	if (!is_composite && source_children.length === 1 && source_children[0]?.type === 'Text') {
		return null;
	}

	return null;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_component_like_element(node) {
	const id = node?.id;
	if (!id) return false;
	if (id.type === 'Identifier') return /^[A-Z]/.test(id.name);
	if (id.type === 'MemberExpression') return true;
	return false;
}

/**
 * @param {any[]} attributes
 * @param {string} name
 * @returns {boolean}
 */
function has_dom_content_attribute(attributes, name) {
	return attributes.some(
		(/** @type {any} */ attribute) =>
			attribute &&
			(attribute.type === 'JSXSpreadAttribute' ||
				(attribute.type === 'JSXAttribute' &&
					attribute.name?.type === 'JSXIdentifier' &&
					attribute.name.name === name)),
	);
}

/**
 * @param {string} name
 * @param {any} value
 * @param {any} source_node
 * @returns {any}
 */
function create_jsx_attribute(name, value, source_node) {
	return builders.jsx_attribute(builders.jsx_id(name), value, false, source_node);
}

/**
 * @param {any} expression
 * @param {any} source_node
 * @returns {any}
 */
function to_jsx_expression_container(expression, source_node = expression) {
	return builders.jsx_expression_container(expression, source_node);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function contains_component_jsx(node) {
	if (!node || typeof node !== 'object') {
		return false;
	}

	if (node.type === 'JSXElement') {
		if (is_component_jsx_name(node.openingElement?.name)) {
			return true;
		}

		return node.children.some(contains_component_jsx);
	}

	if (node.type === 'JSXFragment') {
		return node.children.some(contains_component_jsx);
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
 * @param {any} name
 * @returns {boolean}
 */
function is_component_jsx_name(name) {
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
 * @param {import('estree').Program} program
 * @param {any} transform_context
 * @returns {void}
 */
function inject_vue_imports(program, transform_context) {
	if (transform_context.needs_define_vapor_component) {
		ensure_named_import(program, 'vue-jsx-vapor', 'defineVaporComponent');
	}

	if (transform_context.needs_vapor_for) {
		ensure_named_import(program, 'vue-jsx-vapor', 'VaporFor');
	}

	if (transform_context.needs_suspense) {
		ensure_named_import(program, 'vue', 'Suspense');
	}

	if (transform_context.needs_error_boundary) {
		ensure_named_import(program, '@tsrx/vue/error-boundary', 'TsrxErrorBoundary');
	}

	if (transform_context.needs_merge_refs) {
		ensure_named_import(program, '@tsrx/vue/merge-refs', 'mergeRefs', '__mergeRefs');
	}
}

/**
 * @param {import('estree').Program} program
 * @param {string} source
 * @param {string} name
 * @param {string} [local]
 * @returns {void}
 */
function ensure_named_import(program, source, name, local = name) {
	for (const statement of program.body) {
		if (statement.type !== 'ImportDeclaration' || statement.source?.value !== source) {
			continue;
		}

		const has_specifier = statement.specifiers.some(
			(/** @type {any} */ specifier) =>
				specifier.type === 'ImportSpecifier' &&
				specifier.imported?.type === 'Identifier' &&
				specifier.imported.name === name &&
				specifier.local?.name === local,
		);

		if (!has_specifier) {
			statement.specifiers.push(create_import_specifier(name, local));
		}

		return;
	}

	program.body.unshift(builders.imports([[name, local, 'value']], source));
}

/**
 * @param {string} name
 * @param {string} [local]
 * @returns {any}
 */
function create_import_specifier(name, local = name) {
	return {
		type: 'ImportSpecifier',
		imported: builders.id(name),
		local: builders.id(local),
		importKind: 'value',
		metadata: { path: [] },
	};
}
