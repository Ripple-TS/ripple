/** @import { JsxPlatform } from '@tsrx/core/types' */

import { walk } from 'zimmerframe';
import is_reference from 'is-reference';
import {
	builders as b,
	addJsxSetupDeclaration,
	clone_expression_node,
	clone_identifier,
	contains_component_jsx,
	createHookSafeHelper,
	create_generated_identifier,
	createJsxTransform,
	error,
	is_component_like_element,
	MERGE_REFS_INTERNAL_NAME,
	NORMALIZE_SPREAD_PROPS_FOR_REF_ATTR_INTERNAL_NAME,
	NORMALIZE_SPREAD_PROPS_INTERNAL_NAME,
	setLocation,
	toJsxAttribute,
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
		dynamic: '@tsrx/vue/dynamic',
		errorBoundary: '@tsrx/vue/error-boundary',
		mergeRefs: '@tsrx/vue/ref',
		refProp: '@tsrx/vue/ref',
	},
	jsx: {
		rewriteClassAttr: false,
		multiRefStrategy: 'merge-refs',
		hostSpreadRefStrategy: 'explicit-ref-attr',
	},
	validation: {
		requireUseServerForAwait: true,
		scanUseServerDirectiveForAwaitWithCustomValidator: false,
	},
	hooks: {
		// Hoist to module scope
		// in the regular client transform — same trade-off as React, where one
		// definition per helper keeps bundles small and source mappings 1:1
		// for editor IntelliSense. The `compile_to_volar_mappings` entry point
		// opts back out so Volar's type-only output keeps helpers inline,
		// matching how it generates virtual TSX today.
		moduleScopedHookComponents: true,
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
		preprocessElementAttributes(attrs, ctx) {
			return preprocess_ref_attributes(attrs, ctx);
		},
		transformElementAttributes(attrs, ctx, element) {
			const result = attrs.map((attr) => toJsxAttribute(attr, ctx));
			if (!ctx.typeOnly || is_component_like_element(element)) {
				return result;
			}
			return result.map(mark_type_only_host_ref_attribute);
		},
		renderForOf: (node, loop_params, body_statements, ctx) =>
			render_for_of_as_vapor_for(node, loop_params, body_statements, ctx),
		createPendingBoundary(try_content, fallback_content) {
			return create_vapor_pending_boundary(try_content, fallback_content);
		},
		createErrorFallbackComponent(catch_body_nodes, catch_params, ctx, node) {
			if (ctx.typeOnly) return null;
			return create_module_scoped_error_fallback_component(
				catch_body_nodes,
				catch_params,
				ctx,
				node,
			);
		},
		createErrorBoundary(try_content, raw_try_content, fallback_fn, ctx, node, info) {
			if (!node.pending) {
				return null;
			}
			const fallback_content = /** @type {any} */ (try_content.metadata)?.vapor_pending_fallback;
			if (!fallback_content) {
				return create_vapor_error_boundary(try_content, fallback_fn);
			}
			const fallback_component = info?.fallbackComponent ?? null;
			const fallback_renderer = fallback_component
				? create_fallback_component_renderer(fallback_component, fallback_fn)
				: fallback_fn;
			const default_slot = ctx.typeOnly
				? b.arrow([], jsx_child_to_expression(raw_try_content))
				: create_sync_error_boundary_slot(
						raw_try_content,
						fallback_fn,
						fallback_component,
						node.block,
						node,
					);
			const suspense = create_vapor_pending_boundary_from_default_slot(
				default_slot,
				fallback_content,
			);
			const boundary = create_vapor_error_boundary(suspense, fallback_renderer);
			for (const statement of fallback_component?.setup_statements ?? []) {
				addJsxSetupDeclaration(boundary, statement);
			}
			return boundary;
		},
		createErrorBoundaryContent(try_content) {
			return b.arrow([], jsx_child_to_expression(try_content));
		},
		transformElementChildren(node, walked_children, raw_children, attributes, ctx) {
			return rewrite_host_text_children(node, walked_children, raw_children, attributes);
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
		injectImports(program, ctx) {
			wrap_native_function_components(program, ctx);
			inject_vue_imports(program, ctx);
		},
	},
};

export const transform = createJsxTransform(vue_platform);

/**
 * @param {any} try_content
 * @param {any} fallback_content
 * @returns {any}
 */
function create_vapor_pending_boundary(try_content, fallback_content) {
	return create_vapor_pending_boundary_from_default_slot(
		b.arrow([], jsx_child_to_expression(try_content)),
		fallback_content,
	);
}

/**
 * @param {any} default_slot
 * @param {any} fallback_content
 * @returns {any}
 */
function create_vapor_pending_boundary_from_default_slot(default_slot, fallback_content) {
	const fallback_expression = jsx_child_to_expression(fallback_content);
	const slots_properties = [b.init('_', b.literal(1)), b.init('default', default_slot)];

	if (fallback_expression.type !== 'Literal' || fallback_expression.value !== null) {
		slots_properties.push(b.init('fallback', b.arrow([], fallback_expression)));
	}

	const slots = b.object(slots_properties);

	const boundary = b.jsx_element_fresh(
		b.jsx_opening_element(
			b.jsx_id('Suspense'),
			[b.jsx_attribute(b.jsx_id('v-slots'), to_jsx_expression_container(slots))],
			true,
		),
		null,
		[],
	);
	/** @type {any} */ (boundary.metadata).vapor_pending_fallback = fallback_content;
	return boundary;
}

/**
 * @param {any[]} catch_body_nodes
 * @param {any[]} catch_params
 * @param {any} ctx
 * @param {any} node
 * @returns {any}
 */
function create_module_scoped_error_fallback_component(catch_body_nodes, catch_params, ctx, node) {
	const saved_module_scoped = ctx.module_scoped_hook_components;
	ctx.module_scoped_hook_components = true;
	try {
		return createHookSafeHelper(catch_body_nodes, undefined, node.handler ?? node, ctx, undefined, {
			transientBindings: get_pattern_names(catch_params),
		});
	} finally {
		ctx.module_scoped_hook_components = saved_module_scoped;
	}
}

/**
 * Catch synchronous setup errors directly in the Suspense default slot so
 * Suspense can still observe async children while `catch` handles immediate
 * render failures.
 *
 * @param {any} content
 * @param {any} fallback_fn
 * @param {{ component_element: any } | null} fallback_component
 * @param {any} source_block
 * @param {any} source_try
 * @returns {any}
 */
function create_sync_error_boundary_slot(
	content,
	fallback_fn,
	fallback_component,
	source_block,
	source_try,
) {
	const error_id = create_generated_identifier('_error');
	const content_expression = jsx_child_to_expression(content);
	const fallback_expression = fallback_component
		? create_fallback_component_element(fallback_component, fallback_fn, [
				error_id,
				b.arrow([], b.block([])),
			])
		: b.call(b.parenthesized(fallback_fn), clone_identifier(error_id), b.arrow([], b.block([])));
	const try_block = setLocation(b.block([b.return(content_expression)]), source_block, true);
	const try_statement = setLocation(
		b.try(
			try_block,
			b.catch_clause(error_id, null, b.block([b.return(fallback_expression)])),
			null,
			null,
		),
		source_try,
		true,
	);
	return b.arrow([], b.block([try_statement]));
}

/**
 * @param {{ component_element: any }} fallback_component
 * @param {any} fallback_fn
 * @returns {any}
 */
function create_fallback_component_renderer(fallback_component, fallback_fn) {
	return b.arrow(
		fallback_fn.params.map((/** @type {any} */ param) => clone_expression_node(param, false)),
		b.block([b.return(create_fallback_component_element(fallback_component, fallback_fn))]),
	);
}

/**
 * @param {{ component_element: any }} fallback_component
 * @param {any} fallback_fn
 * @param {any[]} [replacement_args]
 * @returns {any}
 */
function create_fallback_component_element(fallback_component, fallback_fn, replacement_args = []) {
	const element = clone_expression_node(fallback_component.component_element, false);
	const replacements = new Map();
	for (let i = 0; i < fallback_fn.params.length && i < replacement_args.length; i += 1) {
		const param = fallback_fn.params[i];
		if (param?.type === 'Identifier') {
			replacements.set(param.name, replacement_args[i]);
		}
	}

	for (const attr of element.openingElement?.attributes ?? []) {
		const attr_name = attr.name?.name;
		if (!attr_name || !replacements.has(attr_name)) continue;
		attr.value = to_jsx_expression_container(replacements.get(attr_name), attr.value ?? attr);
	}

	return element;
}

/**
 * @param {any[]} patterns
 * @returns {Set<string>}
 */
function get_pattern_names(patterns) {
	const names = new Set();
	for (const pattern of patterns) {
		collect_pattern_names(pattern, names);
	}
	return names;
}

/**
 * @param {any} child
 * @returns {any}
 */
function jsx_child_to_expression(child) {
	return child?.type === 'JSXExpressionContainer' ? child.expression : child;
}

/**
 * @param {any} content
 * @param {any} fallback_fn
 * @returns {any}
 */
function create_vapor_error_boundary(content, fallback_fn) {
	return b.jsx_element_fresh(
		b.jsx_opening_element(
			b.jsx_id('TsrxErrorBoundary'),
			[
				b.jsx_attribute(b.jsx_id('fallback'), to_jsx_expression_container(fallback_fn)),
				b.jsx_attribute(
					b.jsx_id('content'),
					to_jsx_expression_container(b.arrow([], jsx_child_to_expression(content))),
				),
			],
			true,
		),
		null,
		[],
	);
}

/**
 * Vue's `VNodeRef` type is wider than TSRX host refs because it also supports
 * component instances and null teardown values. In editor-only TSX, keep the ref
 * expression unchanged but stop TypeScript verification from reporting that
 * Vue-specific assignability diagnostic on the generated `ref` prop token.
 *
 * @param {any} attr
 * @returns {any}
 */
function mark_type_only_host_ref_attribute(attr) {
	if (
		!attr ||
		attr.type !== 'JSXAttribute' ||
		attr.name?.type !== 'JSXIdentifier' ||
		attr.name.name !== 'ref'
	) {
		return attr;
	}

	const name = b.jsx_id(attr.name.name, attr.name);
	name.metadata = { ...(attr.name.metadata || {}), disable_verification: true };
	return b.jsx_attribute(name, attr.value, attr.shorthand, attr);
}

/**
 * @param {any} helper_fn
 * @param {any} helper_id
 * @param {any} source_node
 * @returns {any}
 */
function wrap_helper_component(helper_fn, helper_id, source_node) {
	return setLocation(
		b.declaration('const', [
			b.declarator(
				clone_identifier(helper_id),
				create_define_vapor_component_call(function_declaration_to_expression(helper_fn), [], []),
			),
		]),
		source_node,
	);
}

/**
 * @param {any} program
 * @param {any} ctx
 * @returns {void}
 */
function wrap_native_function_components(program, ctx) {
	const wrapped = walk(program, ctx, {
		FunctionDeclaration(node, { next, path, state }) {
			const inner = next() ?? node;
			return wrap_native_function_component(inner, state, path) ?? inner;
		},
		FunctionExpression(node, { next, path, state }) {
			const inner = next() ?? node;
			return wrap_native_function_component(inner, state, path) ?? inner;
		},
		ArrowFunctionExpression(node, { next, path, state }) {
			const inner = next() ?? node;
			return wrap_native_function_component(inner, state, path) ?? inner;
		},
	});
	program.body = wrapped.body;
}

/**
 * @param {any} fn
 * @param {any} ctx
 * @param {any[]} path
 * @returns {any | null}
 */
function wrap_native_function_component(fn, ctx, path) {
	if (!fn.metadata?.native_tsrx_function) {
		return null;
	}

	const parent = path.at(-1);
	const name = get_function_component_name(fn, parent);
	if (!name || !/^[A-Z]/.test(name)) {
		return null;
	}

	ctx.needs_define_vapor_component = true;

	const call = setLocation(
		create_define_vapor_component_call(
			function_declaration_to_expression(fn),
			fn.metadata?.generated_helpers || [],
			fn.metadata?.generated_statics || [],
		),
		fn,
		true,
	);

	if (fn.type !== 'FunctionDeclaration') {
		return call;
	}

	if (parent?.type === 'ExportDefaultDeclaration' && parent.declaration === fn) {
		return call;
	}

	if (!fn.id) {
		return call;
	}

	return setLocation(
		b.declaration('const', [b.declarator(create_generated_identifier(fn.id.name), call)]),
		fn,
		true,
	);
}

/**
 * @param {any} fn
 * @param {any} parent
 * @returns {string | null}
 */
function get_function_component_name(fn, parent) {
	if (fn.id?.type === 'Identifier') {
		return fn.id.name;
	}

	if (parent?.type === 'VariableDeclarator' && parent.init === fn) {
		return get_static_name(parent.id);
	}

	if (parent?.type === 'Property' && parent.value === fn) {
		return get_static_name(parent.key);
	}

	if (parent?.type === 'AssignmentExpression' && parent.right === fn) {
		return get_static_name(parent.left);
	}

	return null;
}

/**
 * @param {any} node
 * @returns {string | null}
 */
function get_static_name(node) {
	if (node?.type === 'Identifier') {
		return node.name;
	}
	if (node?.type === 'Literal' && typeof node.value === 'string') {
		return node.value;
	}
	if (node?.type === 'MemberExpression' && !node.computed) {
		return get_static_name(node.property);
	}
	return null;
}

/**
 * @param {any} fn_expression
 * @param {any[]} generated_helpers
 * @param {any[]} generated_statics
 * @returns {any}
 */
function create_define_vapor_component_call(fn_expression, generated_helpers, generated_statics) {
	const call = b.call('defineVaporComponent', fn_expression);
	Object.assign(/** @type {any} */ (call.metadata), {
		generated_helpers,
		generated_statics,
	});
	return call;
}

/**
 * @param {any} node
 * @param {any[]} loop_params
 * @param {any[]} body_statements
 * @param {any} transform_context
 * @returns {any | null}
 */
function render_for_of_as_vapor_for(node, loop_params, body_statements, transform_context) {
	if (node.empty) {
		return null;
	}

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
		b.jsx_attribute(b.jsx_id('in'), to_jsx_expression_container(clone_expression_node(node.right))),
	];

	if (key_expression) {
		attributes.push(
			b.jsx_attribute(
				b.jsx_id('getKey'),
				to_jsx_expression_container(create_loop_callback(loop_params, key_expression, true)),
			),
		);
	}

	return to_jsx_expression_container(
		b.jsx_element_fresh(
			b.jsx_opening_element(b.jsx_id('VaporFor'), attributes),
			b.jsx_closing_element(b.jsx_id('VaporFor')),
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
		b.call(
			b.member(clone_expression_node(node.right), 'flatMap'),
			b.arrow(loop_params, b.block([b.return(to_array_render_expression(rendered))])),
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
		return b.array([]);
	}

	if (node?.type === 'ConditionalExpression') {
		return b.conditional(
			node.test,
			to_array_render_expression(node.consequent),
			to_array_render_expression(node.alternate),
		);
	}

	if (node?.type === 'LogicalExpression' && node.operator === '&&') {
		return b.conditional(node.left, to_array_render_expression(node.right), b.array([]));
	}

	return b.array([node]);
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
	const callback = b.arrow(
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
	return create_member_expression(clone_expression_node(object), b.literal(index), true, object);
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
	return b.member(object, property, computed, false, source_node);
}

/**
 * @param {any} fn
 * @returns {any}
 */
function function_declaration_to_expression(fn) {
	if (fn.type === 'ArrowFunctionExpression') {
		return fn;
	}

	const expression = b.function(fn.id, fn.params, fn.body, fn.async, fn.typeParameters, fn);
	expression.generator = fn.generator;
	expression.metadata = { ...(fn.metadata || {}), path: fn.metadata?.path || [] };
	return expression;
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
 * Vue's JSX transform treats some prop names ending in `ref` as template-ref
 * sugar on components. Keep those as ordinary runtime props by hiding the
 * static prop name behind an object spread before Vue sees the JSX. Type-only
 * virtual TSX skips that spread so Volar can offer completions on the real
 * component prop name.
 *
 * @param {any[]} attrs
 * @param {any} transform_context
 * @returns {any[]}
 */
function preprocess_ref_attributes(attrs, transform_context) {
	const result = [];
	for (const attr of attrs) {
		if (!transform_context.typeOnly && is_vue_named_ref_attribute(attr)) {
			result.push(create_vue_named_ref_spread(attr));
			continue;
		}
		result.push(attr);
	}
	return result;
}

/**
 * @param {any} attr
 * @returns {boolean}
 */
function is_vue_named_ref_attribute(attr) {
	const attr_name = get_vue_attribute_name(attr);
	const value = get_vue_attribute_expression(attr);
	return !!(
		attr_name &&
		attr_name !== 'ref' &&
		(attr?.type === 'Attribute' || attr?.type === 'JSXAttribute') &&
		value &&
		is_vue_ref_prop_name(attr_name)
	);
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function is_vue_ref_prop_name(name) {
	return /(?:^|[-_])ref$/i.test(name) || /Ref$/.test(name);
}

/**
 * @param {any} attr
 * @returns {any}
 */
function create_vue_named_ref_spread(attr) {
	const attr_name = get_vue_attribute_name(attr);
	const value = get_vue_attribute_expression(attr);
	if (attr_name === null) return attr;
	const prop = b.prop('init', b.key(attr_name), value ?? b.literal(true), false, false);
	return b.jsx_spread_attribute(b.object([prop], attr), attr);
}

/**
 * @param {any} attr
 * @returns {string | null}
 */
function get_vue_attribute_name(attr) {
	if (attr?.type === 'Attribute') {
		return typeof attr.name === 'string' ? attr.name : (attr.name?.name ?? null);
	}
	if (attr?.type === 'JSXAttribute') {
		return attr.name?.type === 'JSXIdentifier' ? attr.name.name : null;
	}
	return null;
}

/**
 * @param {any} attr
 * @returns {any}
 */
function get_vue_attribute_expression(attr) {
	const value = attr?.value;
	return value?.type === 'JSXExpressionContainer' ? value.expression : value;
}

/**
 * @param {any} node
 * @param {any[]} walked_children
 * @param {any[]} raw_children
 * @param {any[]} attributes
 * @returns {{ children: any[]; selfClosing?: boolean } | null}
 */
function rewrite_host_text_children(node, walked_children, raw_children, attributes) {
	const source_children = raw_children || walked_children;
	const is_composite = is_component_like_element(node);

	if (!is_composite && source_children.length === 1 && source_children[0]?.type === 'Text') {
		return null;
	}

	return null;
}

/**
 * @param {any} expression
 * @param {any} source_node
 * @returns {any}
 */
function to_jsx_expression_container(expression, source_node = expression) {
	return b.jsx_expression_container(expression, source_node);
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
		ensure_named_import(program, '@tsrx/vue/ref', 'mergeRefs', MERGE_REFS_INTERNAL_NAME);
	}

	if (transform_context.needs_normalize_spread_props) {
		ensure_named_import(
			program,
			'@tsrx/vue/ref',
			'normalize_spread_props',
			NORMALIZE_SPREAD_PROPS_INTERNAL_NAME,
		);
	}

	if (transform_context.needs_normalize_spread_props_for_ref_attr) {
		ensure_named_import(
			program,
			'@tsrx/vue/ref',
			'normalize_spread_props_for_ref_attr',
			NORMALIZE_SPREAD_PROPS_FOR_REF_ATTR_INTERNAL_NAME,
		);
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

	program.body.unshift(b.imports([[name, local, 'value']], source));
}

/**
 * @param {string} name
 * @param {string} [local]
 * @returns {any}
 */
function create_import_specifier(name, local = name) {
	return b.import_specifier(name, local, 'value');
}
