/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */

import { walk } from 'zimmerframe';
import { print } from 'esrap';
import tsx from 'esrap/languages/tsx';
import {
	renderStylesheets,
	setLocation,
	applyLazyTransforms as apply_lazy_transforms,
	findFirstTopLevelAwaitInComponentBody as find_first_top_level_await_in_component_body,
	collectLazyBindingsFromComponent as collect_lazy_bindings_from_component,
	preallocateLazyIds as preallocate_lazy_ids,
	replaceLazyParams as replace_lazy_params,
	prepareStylesheetForRender as prepare_stylesheet_for_render,
	annotateComponentWithHash as annotate_component_with_hash,
} from '@tsrx/core';

/**
 * @typedef {{
 *   local_statement_component_index: number,
 *   needs_error_boundary: boolean,
 *   needs_suspense: boolean,
 *   helper_state: { base_name: string, next_id: number, helpers: AST.FunctionDeclaration[], statics: any[] } | null,
 *   available_bindings: Map<string, AST.Identifier>,
 *   lazy_next_id: number,
 *   current_css_hash: string | null,
 * }} TransformContext
 */

/**
 * @typedef {{ source_name: string, read: () => any }} LazyBinding
 */

/**
 * Transform a parsed tsrx-react AST into a TSX/JSX module.
 *
 * Replaces Ripple-specific `Component`/`Element`/`Text`/`TSRXExpression`
 * nodes with their standard JSX equivalents inside a `FunctionDeclaration`.
 * Any `<style>` element declared inside a component is collected,
 * rendered via `@tsrx/core`'s stylesheet renderer, and returned alongside
 * the JS output so a downstream plugin can inject it. The compiler also
 * augments every non-style Element in a scoped component with the
 * stylesheet's hash class so scoped selectors match correctly.
 *
 * @param {AST.Program} ast
 * @param {string} source
 * @param {string} [filename]
 * @returns {{ ast: AST.Program, code: string, map: any, css: { code: string, hash: string } | null }}
 */
export function transform(ast, source, filename) {
	/** @type {any[]} */
	const stylesheets = [];
	const module_uses_server_directive = has_use_server_directive(ast);

	/** @type {TransformContext} */
	const transform_context = {
		local_statement_component_index: 0,
		needs_error_boundary: false,
		needs_suspense: false,
		helper_state: null,
		available_bindings: new Map(),
		lazy_next_id: 0,
		current_css_hash: null,
	};

	preallocate_lazy_ids(/** @type {any} */ (ast), transform_context);

	walk(/** @type {any} */ (ast), transform_context, {
		Component(node, { next, state }) {
			const as_any = /** @type {any} */ (node);
			const await_expression = find_first_top_level_await_in_component_body(as_any.body || []);

			if (await_expression && !module_uses_server_directive) {
				throw create_compile_error(
					await_expression,
					'React components can only use `await` when the module has a top-level "use server" directive.',
				);
			}

			if (await_expression) {
				as_any.metadata = /** @type {any} */ ({
					...(as_any.metadata || {}),
					contains_top_level_await: true,
				});
			}

			const css = as_any.css;
			if (css) {
				stylesheets.push(css);
				const hash = css.hash;
				annotate_component_with_hash(as_any, hash);
			}
			return next(state);
		},
	});

	const transformed = walk(/** @type {any} */ (ast), transform_context, {
		Component(node, { next, state }) {
			const as_any = /** @type {any} */ (node);

			// Set up helper_state and bindings BEFORE next() so that nested
			// hook_safe_* calls (inside Element children) can register helpers
			// and access available bindings during the bottom-up walk.
			const helper_state = create_helper_state(as_any.id?.name || 'Component');
			const saved_helper_state = state.helper_state;
			const saved_bindings = state.available_bindings;
			const saved_css_hash = state.current_css_hash;
			state.helper_state = helper_state;
			state.current_css_hash = as_any.css ? as_any.css.hash : null;

			// Pre-collect component body bindings (params + top-level statements)
			// so that Element children processed during the bottom-up walk can see
			// the full scope. Without this, hoisted helpers would miss body-level
			// variables like `const [x] = useState(...)` and produce ReferenceErrors.
			// Only collect up to the split point — bindings declared after a
			// hook-safe split aren't in scope at the return statement and would
			// cause ReferenceErrors if passed as helper props.
			const body_bindings = collect_param_bindings(as_any.params || []);
			const body = as_any.body || [];
			const split_index = find_hook_safe_split_index(body);
			const collect_end = split_index === -1 ? body.length : split_index;
			for (let i = 0; i < collect_end; i += 1) {
				collect_statement_bindings(body[i], body_bindings);
			}
			state.available_bindings = body_bindings;

			const inner = /** @type {any} */ (next() ?? node);

			// Restore context
			state.helper_state = saved_helper_state;
			state.available_bindings = saved_bindings;
			state.current_css_hash = saved_css_hash;

			return /** @type {any} */ (component_to_function_declaration(inner, state, helper_state));
		},

		Tsx(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (tsx_node_to_jsx_expression(inner));
		},

		TsxCompat(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (tsx_compat_node_to_jsx_expression(inner));
		},

		Element(node, { next, state }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (to_jsx_element(inner, state));
		},

		Text(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (
				to_jsx_expression_container(to_text_expression(inner.expression, inner), inner)
			);
		},

		TSRXExpression(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (to_jsx_expression_container(inner.expression, inner));
		},

		MemberExpression(node, { next, state }) {
			const as_any = /** @type {any} */ (node);
			if (as_any.object && as_any.object.type === 'StyleIdentifier' && state.current_css_hash) {
				const class_name = as_any.computed ? as_any.property.value : as_any.property.name;
				const value = `${state.current_css_hash} ${class_name}`;
				return /** @type {any} */ ({ type: 'Literal', value, raw: JSON.stringify(value) });
			}
			return next();
		},
	});

	const expanded = expand_component_helpers(/** @type {AST.Program} */ (transformed));
	inject_try_imports(expanded, transform_context);

	// Apply lazy destructuring transforms to module-level code (top-level function
	// declarations, arrow functions, etc.). Component bodies have already been
	// transformed inside component_to_function_declaration; this catches plain
	// functions outside components and any lazy patterns in module scope.
	const final_program = /** @type {any} */ (
		apply_lazy_transforms(/** @type {any} */ (expanded), new Map())
	);

	const result = print(/** @type {any} */ (final_program), tsx(), {
		sourceMapSource: filename,
		sourceMapContent: source,
	});

	const css =
		stylesheets.length > 0
			? {
					code: renderStylesheets(
						/** @type {any} */ (stylesheets.map(prepare_stylesheet_for_render)),
					),
					hash: stylesheets.map((s) => s.hash).join(' '),
				}
			: null;

	return { ast: final_program, code: result.code, map: result.map, css };
}

/**
 * @param {any} component
 * @param {TransformContext} transform_context
 * @param {{ base_name: string, next_id: number, helpers: AST.FunctionDeclaration[], statics: any[] }} [walk_helper_state]
 * @returns {AST.FunctionDeclaration}
 */
function component_to_function_declaration(component, transform_context, walk_helper_state) {
	const helper_state = walk_helper_state || create_helper_state(component.id?.name || 'Component');
	const params = component.params || [];
	const body = /** @type {any[]} */ (component.body || []);
	const is_async_component =
		!!component?.metadata?.contains_top_level_await ||
		find_first_top_level_await_in_component_body(body) !== null;

	// Collect param bindings from original patterns (lazy patterns still intact).
	const param_bindings = collect_param_bindings(params);

	// Collect lazy binding info WITHOUT mutating patterns. Stores lazy_id on metadata
	// for later replacement. Body bindings (count, setCount, etc.) are still in the
	// original patterns, so collect_statement_bindings during build will find them.
	const lazy_bindings = collect_lazy_bindings_from_component(params, body, transform_context);

	// Save and set context for this component scope
	const saved_helper_state = transform_context.helper_state;
	const saved_bindings = transform_context.available_bindings;
	transform_context.helper_state = helper_state;
	transform_context.available_bindings = new Map(param_bindings);

	const body_statements = build_component_statements(
		body,
		helper_state,
		param_bindings,
		transform_context,
	);

	// Replace lazy param patterns with generated identifiers
	const final_params = lazy_bindings.size > 0 ? replace_lazy_params(params) : params;

	// Wrap body_statements in a BlockStatement so that apply_lazy_transforms
	// runs collect_block_shadowed_names and detects body-level declarations
	// (e.g. `const name = ...`) that shadow lazy binding names.
	const body_block = /** @type {any} */ ({
		type: 'BlockStatement',
		body: body_statements,
		metadata: { path: [] },
	});
	const final_body =
		lazy_bindings.size > 0 ? apply_lazy_transforms(body_block, lazy_bindings) : body_block;

	const fn = /** @type {any} */ ({
		type: 'FunctionDeclaration',
		id: component.id,
		params: final_params,
		body: final_body,
		async: is_async_component,
		generator: false,
		metadata: {
			path: [],
			is_component: true,
		},
	});

	// Restore context
	transform_context.helper_state = saved_helper_state;
	transform_context.available_bindings = saved_bindings;

	fn.metadata.generated_helpers = helper_state.helpers;
	fn.metadata.generated_statics = helper_state.statics;

	if (fn.id) {
		fn.id.metadata = /** @type {AST.Identifier['metadata']} */ ({
			...fn.id.metadata,
			is_component: true,
		});
	}

	setLocation(fn, /** @type {any} */ (component), true);
	return fn;
}

/**
 * @param {any[]} body_nodes
 * @param {{ base_name: string, next_id: number, helpers: AST.FunctionDeclaration[], statics: any[] }} helper_state
 * @param {Map<string, AST.Identifier>} available_bindings
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function build_component_statements(
	body_nodes,
	helper_state,
	available_bindings,
	transform_context,
) {
	const split_index = find_hook_safe_split_index(body_nodes);
	if (split_index === -1) {
		return build_render_statements(body_nodes, false, transform_context);
	}

	const statements = [];
	const render_nodes = [];
	const bindings = new Map(available_bindings);

	for (let i = 0; i < split_index; i += 1) {
		const child = body_nodes[i];

		if (is_bare_return_statement(child)) {
			statements.push(create_component_return_statement(render_nodes, child));
			return statements;
		}

		if (is_lone_return_if_statement(child)) {
			statements.push(create_component_lone_return_if_statement(child, render_nodes));
			continue;
		}

		if (is_jsx_child(child)) {
			render_nodes.push(to_jsx_child(child, transform_context));
		} else {
			statements.push(child);
			collect_statement_bindings(child, bindings);
			transform_context.available_bindings = bindings;
		}
	}

	hoist_static_render_nodes(render_nodes, transform_context);

	const split_node = body_nodes[split_index];
	const consequent_body =
		split_node.consequent.type === 'BlockStatement'
			? split_node.consequent.body
			: [split_node.consequent];
	const short_branch_body = consequent_body.filter(
		(/** @type {any} */ child) => !is_bare_return_statement(child),
	);
	const continuation_body = body_nodes.slice(split_index + 1);
	const short_branch = create_helper_component_expression(
		short_branch_body,
		helper_state,
		bindings,
		split_node.consequent,
		'Exit',
		transform_context,
	);
	const continuation = create_helper_component_expression(
		continuation_body,
		helper_state,
		bindings,
		split_node,
		'Continue',
		transform_context,
	);

	render_nodes.push(
		to_jsx_expression_container(
			set_loc(
				/** @type {any} */ ({
					type: 'ConditionalExpression',
					test: split_node.test,
					consequent: short_branch,
					alternate: continuation,
					metadata: { path: [] },
				}),
				split_node,
			),
			split_node,
		),
	);

	statements.push(create_component_return_statement(render_nodes, split_node));
	return statements;
}

/**
 * @param {any[]} body_nodes
 * @param {boolean} return_null_when_empty
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function build_render_statements(body_nodes, return_null_when_empty, transform_context) {
	const statements = [];
	const render_nodes = [];

	// Create a new bindings map so inner-scope bindings from
	// collect_statement_bindings don't leak to the caller's scope.
	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);

	for (const child of body_nodes) {
		if (is_bare_return_statement(child)) {
			statements.push(create_component_return_statement(render_nodes, child));
			transform_context.available_bindings = saved_bindings;
			return statements;
		}

		if (is_lone_return_if_statement(child)) {
			statements.push(create_component_lone_return_if_statement(child, render_nodes));
			continue;
		}

		if (is_jsx_child(child)) {
			render_nodes.push(to_jsx_child(child, transform_context));
		} else {
			statements.push(child);
			collect_statement_bindings(child, transform_context.available_bindings);
		}
	}

	hoist_static_render_nodes(render_nodes, transform_context);

	const return_arg = build_return_expression(render_nodes);
	if (return_arg || return_null_when_empty) {
		statements.push({
			type: 'ReturnStatement',
			argument: return_arg || { type: 'Literal', value: null, raw: 'null' },
		});
	}

	transform_context.available_bindings = saved_bindings;
	return statements;
}

/**
 * @param {any[]} body_nodes
 * @returns {number}
 */
function find_hook_safe_split_index(body_nodes) {
	for (let i = 0; i < body_nodes.length; i += 1) {
		if (!is_lone_return_if_statement(body_nodes[i])) {
			continue;
		}

		if (body_contains_top_level_hook_call(body_nodes.slice(i + 1))) {
			return i;
		}
	}

	return -1;
}

/**
 * @param {any[]} body_nodes
 * @returns {boolean}
 */
function body_contains_top_level_hook_call(body_nodes) {
	return body_nodes.some(statement_contains_top_level_hook_call);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function statement_contains_top_level_hook_call(node) {
	return node_contains_top_level_hook_call(node, false);
}

/**
 * @param {any} node
 * @param {boolean} inside_nested_function
 * @returns {boolean}
 */
function node_contains_top_level_hook_call(node, inside_nested_function) {
	if (!node || typeof node !== 'object') {
		return false;
	}

	if (
		inside_nested_function &&
		(node.type === 'FunctionDeclaration' ||
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression')
	) {
		return false;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		const next_inside_nested_function = true;
		for (const key of Object.keys(node)) {
			if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
				continue;
			}
			if (node_contains_top_level_hook_call(node[key], next_inside_nested_function)) {
				return true;
			}
		}
		return false;
	}

	if (!inside_nested_function && node.type === 'CallExpression' && is_hook_callee(node.callee)) {
		return true;
	}

	if (Array.isArray(node)) {
		return node.some((child) => node_contains_top_level_hook_call(child, inside_nested_function));
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (node_contains_top_level_hook_call(node[key], inside_nested_function)) {
			return true;
		}
	}

	return false;
}

/**
 * @param {any} callee
 * @returns {boolean}
 */
function is_hook_callee(callee) {
	if (!callee) return false;

	if (callee.type === 'Identifier') {
		return /^use[A-Z0-9]/.test(callee.name);
	}

	if (
		!callee.computed &&
		callee.type === 'MemberExpression' &&
		callee.property?.type === 'Identifier'
	) {
		return /^use[A-Z0-9]/.test(callee.property.name);
	}

	return false;
}

/**
 * @param {AST.Program} program
 * @returns {boolean}
 */
function has_use_server_directive(program) {
	for (const statement of program.body || []) {
		const directive = /** @type {any} */ (statement).directive;

		if (directive === 'use server') {
			return true;
		}

		if (
			statement.type === 'ExpressionStatement' &&
			statement.expression?.type === 'Literal' &&
			statement.expression.value === 'use server'
		) {
			return true;
		}

		if (directive == null) {
			break;
		}
	}

	return false;
}

/**
 * @param {any[]} body_nodes
 * @param {{ base_name: string, next_id: number, helpers: AST.FunctionDeclaration[], statics: any[] }} helper_state
 * @param {Map<string, AST.Identifier>} available_bindings
 * @param {any} source_node
 * @param {string} suffix
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_helper_component_expression(
	body_nodes,
	helper_state,
	available_bindings,
	source_node,
	suffix,
	transform_context,
) {
	if (body_nodes.length === 0) {
		return create_null_literal();
	}

	const helper_name = create_helper_name(helper_state, suffix);
	const helper_id = set_loc(create_generated_identifier(helper_name), source_node);
	const helper_bindings = Array.from(available_bindings.values());
	const helper_fn = create_helper_function_declaration(
		helper_id,
		body_nodes,
		helper_state,
		available_bindings,
		helper_bindings,
		source_node,
		transform_context,
	);

	helper_state.helpers.push(helper_fn);

	return create_helper_component_element(helper_id, helper_bindings, source_node);
}

/**
 * @param {AST.Identifier} helper_id
 * @param {any[]} body_nodes
 * @param {{ base_name: string, next_id: number, helpers: AST.FunctionDeclaration[], statics: any[] }} helper_state
 * @param {Map<string, AST.Identifier>} available_bindings
 * @param {AST.Identifier[]} helper_bindings
 * @param {any} source_node
 * @param {TransformContext} transform_context
 * @returns {AST.FunctionDeclaration}
 */
function create_helper_function_declaration(
	helper_id,
	body_nodes,
	helper_state,
	available_bindings,
	helper_bindings,
	source_node,
	transform_context,
) {
	const fn = /** @type {any} */ ({
		type: 'FunctionDeclaration',
		id: helper_id,
		params: helper_bindings.length > 0 ? [create_helper_props_pattern(helper_bindings)] : [],
		body: {
			type: 'BlockStatement',
			body: build_component_statements(
				body_nodes,
				helper_state,
				new Map(available_bindings),
				transform_context,
			),
			metadata: { path: [] },
		},
		async: false,
		generator: false,
		metadata: {
			path: [],
			is_component: true,
		},
	});

	if (fn.id) {
		fn.id.metadata = /** @type {AST.Identifier['metadata']} */ ({
			...fn.id.metadata,
			is_component: true,
		});
	}

	return set_loc(fn, source_node);
}

/**
 * @param {AST.Identifier[]} bindings
 * @returns {AST.ObjectPattern}
 */
function create_helper_props_pattern(bindings) {
	return /** @type {any} */ ({
		type: 'ObjectPattern',
		properties: bindings.map((binding) => create_helper_props_property(binding)),
		metadata: { path: [] },
	});
}

/**
 * @param {AST.Identifier} binding
 * @returns {AST.Property}
 */
function create_helper_props_property(binding) {
	const key = clone_identifier(binding);
	const value = clone_identifier(binding);

	return /** @type {any} */ ({
		type: 'Property',
		key,
		value,
		kind: 'init',
		method: false,
		shorthand: true,
		computed: false,
		metadata: { path: [] },
	});
}

/**
 * @param {AST.Identifier} helper_id
 * @param {AST.Identifier[]} bindings
 * @param {any} source_node
 * @returns {ESTreeJSX.JSXElement}
 */
function create_helper_component_element(helper_id, bindings, source_node) {
	const attributes = bindings.map(
		(binding) =>
			/** @type {any} */ ({
				type: 'JSXAttribute',
				name: identifier_to_jsx_name(clone_identifier(binding)),
				value: to_jsx_expression_container(clone_identifier(binding), binding),
				metadata: { path: [] },
			}),
	);

	return set_loc(
		/** @type {any} */ ({
			type: 'JSXElement',
			openingElement: set_loc(
				{
					type: 'JSXOpeningElement',
					name: identifier_to_jsx_name(clone_identifier(helper_id)),
					attributes,
					selfClosing: true,
					metadata: { path: [] },
				},
				source_node,
			),
			closingElement: null,
			children: [],
			metadata: { path: [] },
		}),
		source_node,
	);
}

/**
 * @param {{ base_name: string, next_id: number, helpers: AST.FunctionDeclaration[], statics: any[] }} helper_state
 * @param {string} suffix
 * @returns {string}
 */
function create_helper_name(helper_state, suffix) {
	helper_state.next_id += 1;
	return `${helper_state.base_name}__${suffix}${helper_state.next_id}`;
}

/**
 * @param {string} base_name
 * @returns {{ base_name: string, next_id: number, helpers: AST.FunctionDeclaration[], statics: any[] }}
 */
function create_helper_state(base_name) {
	return {
		base_name,
		next_id: 0,
		helpers: [],
		statics: [],
	};
}

/**
 * @param {any[]} params
 * @returns {Map<string, AST.Identifier>}
 */
function collect_param_bindings(params) {
	const bindings = new Map();
	for (const param of params) {
		collect_pattern_bindings(param, bindings);
	}
	return bindings;
}

/**
 * @param {any} statement
 * @param {Map<string, AST.Identifier>} bindings
 * @returns {void}
 */
function collect_statement_bindings(statement, bindings) {
	if (!statement) return;

	if (statement.type === 'VariableDeclaration') {
		for (const declaration of statement.declarations || []) {
			collect_pattern_bindings(declaration.id, bindings);
		}
		return;
	}

	if (
		(statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') &&
		statement.id
	) {
		bindings.set(statement.id.name, statement.id);
	}

	// Statement-level lazy assignment: `&[x] = expr;` introduces `x` as a binding.
	if (
		statement.type === 'ExpressionStatement' &&
		statement.expression?.type === 'AssignmentExpression' &&
		statement.expression.operator === '=' &&
		(statement.expression.left?.type === 'ObjectPattern' ||
			statement.expression.left?.type === 'ArrayPattern') &&
		statement.expression.left.lazy
	) {
		collect_pattern_bindings(statement.expression.left, bindings);
	}
}

/**
 * @param {any} pattern
 * @param {Map<string, AST.Identifier>} bindings
 * @returns {void}
 */
function collect_pattern_bindings(pattern, bindings) {
	if (!pattern || typeof pattern !== 'object') return;

	if (pattern.type === 'Identifier') {
		bindings.set(pattern.name, pattern);
		return;
	}

	if (pattern.type === 'RestElement') {
		collect_pattern_bindings(pattern.argument, bindings);
		return;
	}

	if (pattern.type === 'AssignmentPattern') {
		collect_pattern_bindings(pattern.left, bindings);
		return;
	}

	if (pattern.type === 'ArrayPattern') {
		for (const element of pattern.elements || []) {
			collect_pattern_bindings(element, bindings);
		}
		return;
	}

	if (pattern.type === 'ObjectPattern') {
		for (const property of pattern.properties || []) {
			if (property.type === 'RestElement') {
				collect_pattern_bindings(property.argument, bindings);
			} else {
				collect_pattern_bindings(property.value, bindings);
			}
		}
	}
}

/**
 * Check if a node references any of the given scope bindings.
 * Used to determine if a JSX element is static and can be hoisted to module level.
 *
 * @param {any} node
 * @param {Map<string, AST.Identifier>} scope_bindings
 * @returns {boolean}
 */
function references_scope_bindings(node, scope_bindings) {
	if (!node || typeof node !== 'object') return false;
	if (scope_bindings.size === 0) return false;

	if (node.type === 'Identifier') {
		return scope_bindings.has(node.name);
	}

	// JSXIdentifier is a variable reference when capitalized (tag name like <MyComponent />)
	// or when it's the object of a JSXMemberExpression (e.g. ui in <ui.Button />)
	if (node.type === 'JSXIdentifier') {
		return scope_bindings.has(node.name);
	}

	if (Array.isArray(node)) {
		return node.some((child) => references_scope_bindings(child, scope_bindings));
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;

		// Skip non-computed, non-shorthand property keys (they are labels, not references)
		if (key === 'key' && node.type === 'Property' && !node.computed && !node.shorthand) continue;

		// Skip non-computed member expression property access
		if (key === 'property' && node.type === 'MemberExpression' && !node.computed) continue;

		// Skip JSXMemberExpression property (e.g. Button in <Icons.Button /> is a label, not a reference)
		if (key === 'property' && node.type === 'JSXMemberExpression') continue;

		// Skip JSXAttribute names — they are attribute labels, not variable references
		if (key === 'name' && node.type === 'JSXAttribute') continue;

		if (references_scope_bindings(node[key], scope_bindings)) return true;
	}

	return false;
}

/**
 * Hoist static JSX elements from render_nodes to module level.
 * A JSX element is static if it doesn't reference any component-scope bindings.
 * Hoisting prevents React from recreating the element on every render, allowing
 * the reconciler to skip diffing when it sees the same element identity.
 *
 * @param {any[]} render_nodes
 * @param {TransformContext} transform_context
 */
function hoist_static_render_nodes(render_nodes, transform_context) {
	if (!transform_context.helper_state) return;

	for (let i = 0; i < render_nodes.length; i++) {
		const node = render_nodes[i];
		if (node.type !== 'JSXElement') continue;
		if (references_scope_bindings(node, transform_context.available_bindings)) continue;

		const name = create_helper_name(transform_context.helper_state, 'static');
		const id = create_generated_identifier(name);

		transform_context.helper_state.statics.push(
			/** @type {any} */ ({
				type: 'VariableDeclaration',
				kind: 'const',
				declarations: [
					{
						type: 'VariableDeclarator',
						id,
						init: node,
						metadata: { path: [] },
					},
				],
				metadata: { path: [] },
			}),
		);

		render_nodes[i] = to_jsx_expression_container(clone_identifier(id), node);
	}
}

/**
 * @param {AST.Identifier} identifier
 * @returns {AST.Identifier}
 */
function clone_identifier(identifier) {
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
 * @returns {AST.Literal}
 */
function create_null_literal() {
	return /** @type {any} */ ({
		type: 'Literal',
		value: null,
		raw: 'null',
		metadata: { path: [] },
	});
}

/**
 * @param {AST.Program} program
 * @returns {AST.Program}
 */
function expand_component_helpers(program) {
	program.body = program.body.flatMap((statement) => {
		if (statement.type === 'FunctionDeclaration') {
			const meta = /** @type {any} */ (statement.metadata);
			const statics = meta?.generated_statics || [];
			const helpers = meta?.generated_helpers || [];
			if (statics.length || helpers.length) {
				return [...statics, ...helpers, statement];
			}
		}

		if (
			(statement.type === 'ExportNamedDeclaration' ||
				statement.type === 'ExportDefaultDeclaration') &&
			statement.declaration?.type === 'FunctionDeclaration'
		) {
			const meta = /** @type {any} */ (statement.declaration.metadata);
			const statics = meta?.generated_statics || [];
			const helpers = meta?.generated_helpers || [];
			if (statics.length || helpers.length) {
				return [...statics, ...helpers, statement];
			}
		}

		return [statement];
	});

	return program;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_bare_return_statement(node) {
	return node?.type === 'ReturnStatement' && node.argument == null;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_lone_return_if_statement(node) {
	if (node?.type !== 'IfStatement' || node.alternate) {
		return false;
	}

	const consequent_body =
		node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];

	return consequent_body.length === 1 && is_bare_return_statement(consequent_body[0]);
}

/**
 * @param {any[]} render_nodes
 * @param {any} source_node
 * @returns {any}
 */
function create_component_return_statement(render_nodes, source_node) {
	return /** @type {any} */ ({
		type: 'ReturnStatement',
		argument: build_return_expression(render_nodes.slice()) || {
			type: 'Literal',
			value: null,
			raw: 'null',
			metadata: { path: [] },
		},
		metadata: { path: [] },
	});
}

/**
 * @param {any} node
 * @param {any[]} render_nodes
 * @returns {any}
 */
function create_component_lone_return_if_statement(node, render_nodes) {
	const consequent_body =
		node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];

	return set_loc(
		/** @type {any} */ ({
			type: 'IfStatement',
			test: node.test,
			consequent: set_loc(
				/** @type {any} */ ({
					type: 'BlockStatement',
					body: [create_component_return_statement(render_nodes, consequent_body[0])],
					metadata: { path: [] },
				}),
				node.consequent,
			),
			alternate: null,
			metadata: { path: [] },
		}),
		node,
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_jsx_child(node) {
	if (!node) return false;
	const t = node.type;
	return (
		t === 'JSXElement' ||
		t === 'JSXFragment' ||
		t === 'JSXExpressionContainer' ||
		t === 'JSXText' ||
		t === 'Tsx' ||
		t === 'TsxCompat' ||
		t === 'Element' ||
		t === 'Text' ||
		t === 'TSRXExpression' ||
		t === 'Html' ||
		t === 'IfStatement' ||
		t === 'ForOfStatement' ||
		t === 'SwitchStatement' ||
		t === 'TryStatement'
	);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_element(node, transform_context) {
	if (node.type === 'JSXElement') return node;
	if ((node.children || []).some((/** @type {any} */ c) => c && c.type === 'Html')) {
		throw new Error(
			'`{html ...}` is not supported on the React target. Use `dangerouslySetInnerHTML={{ __html: ... }}` as an element attribute instead.',
		);
	}
	if (is_dynamic_element_id(node.id)) {
		return dynamic_element_to_jsx_child(node, transform_context);
	}

	const name = identifier_to_jsx_name(node.id);
	const attributes = (node.attributes || []).map(to_jsx_attribute);
	const selfClosing = !!node.selfClosing;
	const children = create_element_children(node.children || [], transform_context);
	const has_unmappable_attribute = attributes.some(
		(/** @type {any} */ attribute) => attribute?.metadata?.has_unmappable_value,
	);

	/** @type {ESTreeJSX.JSXOpeningElement} */
	const openingElement = /** @type {ESTreeJSX.JSXOpeningElement} */ (
		has_unmappable_attribute
			? {
					type: 'JSXOpeningElement',
					name,
					attributes,
					selfClosing,
					metadata: { path: [] },
				}
			: set_loc(
					/** @type {any} */ ({
						type: 'JSXOpeningElement',
						name,
						attributes,
						selfClosing,
					}),
					node.openingElement || node,
				)
	);

	/** @type {ESTreeJSX.JSXClosingElement | null} */
	const closingElement = selfClosing
		? null
		: set_loc(
				/** @type {any} */ ({
					type: 'JSXClosingElement',
					name: clone_jsx_name(name, node.closingElement || node),
				}),
				node.closingElement || node,
			);

	return set_loc(
		/** @type {any} */ ({
			type: 'JSXElement',
			openingElement,
			closingElement,
			children,
		}),
		node,
	);
}

/**
 * @param {any[]} children
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */

function create_element_children(children, transform_context) {
	if (children.length === 0) {
		return [];
	}

	if (children.every(is_inline_element_child) && !children_contain_return_semantics(children)) {
		return children.map((/** @type {any} */ child) => to_jsx_child(child, transform_context));
	}

	return [statement_body_to_jsx_child(children, transform_context)];
}

/**
 * @param {any[]} children
 * @returns {boolean}
 */
function children_contain_return_semantics(children) {
	return children.some(child_contains_return_semantics);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function child_contains_return_semantics(node) {
	if (!node || typeof node !== 'object') {
		return false;
	}

	if (node.type === 'ReturnStatement' || is_lone_return_if_statement(node)) {
		return true;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'Component'
	) {
		return false;
	}

	if (Array.isArray(node)) {
		return node.some(child_contains_return_semantics);
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (child_contains_return_semantics(node[key])) {
			return true;
		}
	}

	return false;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_inline_element_child(node) {
	return node && is_jsx_child(node);
}

/**
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function statement_body_to_jsx_child(body_nodes, transform_context) {
	if (body_contains_top_level_hook_call(body_nodes)) {
		return hook_safe_statement_body_to_jsx_child(body_nodes, transform_context);
	}

	return to_jsx_expression_container(
		/** @type {any} */ ({
			type: 'CallExpression',
			callee: {
				type: 'ArrowFunctionExpression',
				params: [],
				body: /** @type {any} */ ({
					type: 'BlockStatement',
					body: build_render_statements(body_nodes, true, transform_context),
					metadata: { path: [] },
				}),
				async: false,
				generator: false,
				expression: false,
				metadata: { path: [] },
			},
			arguments: [],
			optional: false,
			metadata: { path: [] },
		}),
	);
}

/**
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function hook_safe_statement_body_to_jsx_child(body_nodes, transform_context) {
	const source_node = get_body_source_node(body_nodes);
	const helper_id = set_loc(
		create_generated_identifier(create_local_statement_component_name(transform_context)),
		source_node,
	);
	const helper_bindings = Array.from(transform_context.available_bindings.values());

	// Save and isolate bindings for the helper body
	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);

	const helper_fn = set_loc(
		/** @type {any} */ ({
			type: 'FunctionDeclaration',
			id: helper_id,
			params: helper_bindings.length > 0 ? [create_helper_props_pattern(helper_bindings)] : [],
			body: {
				type: 'BlockStatement',
				body: build_render_statements(body_nodes, true, transform_context),
				metadata: { path: [] },
			},
			async: false,
			generator: false,
			metadata: {
				path: [],
				is_component: true,
				is_method: false,
			},
		}),
		source_node,
	);

	// Restore bindings
	transform_context.available_bindings = saved_bindings;

	// Register helper for hoisting to module level
	if (transform_context.helper_state) {
		transform_context.helper_state.helpers.push(helper_fn);

		return to_jsx_expression_container(
			/** @type {any} */ (create_helper_component_element(helper_id, helper_bindings, source_node)),
			source_node,
		);
	}

	return to_jsx_expression_container(
		/** @type {any} */ ({
			type: 'CallExpression',
			callee: {
				type: 'ArrowFunctionExpression',
				params: [],
				body: /** @type {any} */ ({
					type: 'BlockStatement',
					body: [
						helper_fn,
						{
							type: 'ReturnStatement',
							argument: create_helper_component_element(helper_id, helper_bindings, source_node),
							metadata: { path: [] },
						},
					],
					metadata: { path: [] },
				}),
				async: false,
				generator: false,
				expression: false,
				metadata: { path: [] },
			},
			arguments: [],
			optional: false,
			metadata: { path: [] },
		}),
		source_node,
	);
}

/**
 * @param {TransformContext} transform_context
 * @returns {string}
 */
function create_local_statement_component_name(transform_context) {
	transform_context.local_statement_component_index += 1;
	return `StatementBodyHook${transform_context.local_statement_component_index}`;
}

/**
 * Wraps a list of body nodes into a component and returns
 * statements that return `<ComponentName prop1={prop1} ... />`.
 * The component is hoisted to module level via helper_state to avoid
 * recreating the component identity on every render.
 * Used when a control flow branch contains hook calls that must be moved
 * into their own component boundary to satisfy the Rules of Hooks.
 *
 * @param {any[]} body_nodes
 * @param {any} key_expression - Optional key expression to add to the component element (for for-of loops)
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function hook_safe_render_statements(body_nodes, key_expression, transform_context) {
	const source_node = get_body_source_node(body_nodes);
	const helper_id = set_loc(
		create_generated_identifier(create_local_statement_component_name(transform_context)),
		source_node,
	);
	const helper_bindings = Array.from(transform_context.available_bindings.values());

	// Save and isolate bindings for the helper body
	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);

	const helper_fn = set_loc(
		/** @type {any} */ ({
			type: 'FunctionDeclaration',
			id: helper_id,
			params: helper_bindings.length > 0 ? [create_helper_props_pattern(helper_bindings)] : [],
			body: {
				type: 'BlockStatement',
				body: build_render_statements(body_nodes, true, transform_context),
				metadata: { path: [] },
			},
			async: false,
			generator: false,
			metadata: {
				path: [],
				is_component: true,
				is_method: false,
			},
		}),
		source_node,
	);

	// Restore bindings
	transform_context.available_bindings = saved_bindings;

	// Register helper for hoisting to module level
	if (transform_context.helper_state) {
		transform_context.helper_state.helpers.push(helper_fn);
	}

	const component_element = create_helper_component_element(
		helper_id,
		helper_bindings,
		source_node,
	);

	if (key_expression) {
		component_element.openingElement.attributes.push(
			/** @type {any} */ ({
				type: 'JSXAttribute',
				name: { type: 'JSXIdentifier', name: 'key', metadata: { path: [] } },
				value: to_jsx_expression_container(key_expression, key_expression),
				metadata: { path: [] },
			}),
		);
	}

	// When helper_state is null (no enclosing component context), inline the
	// helper via an IIFE so the function declaration isn't silently dropped.
	if (!transform_context.helper_state) {
		return [
			helper_fn,
			{
				type: 'ReturnStatement',
				argument: component_element,
				metadata: { path: [] },
			},
		];
	}

	return [
		{
			type: 'ReturnStatement',
			argument: component_element,
			metadata: { path: [] },
		},
	];
}

/**
 * @param {any[]} body_nodes
 * @returns {any}
 */
function get_body_source_node(body_nodes) {
	const first = body_nodes[0];
	const last = body_nodes[body_nodes.length - 1];

	if (first?.loc && last?.loc) {
		return {
			start: first.start,
			end: last.end,
			loc: {
				start: first.loc.start,
				end: last.loc.end,
			},
		};
	}

	return first;
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_child(node, transform_context) {
	if (!node) return node;
	switch (node.type) {
		case 'Tsx':
			return tsx_node_to_jsx_expression(node);
		case 'TsxCompat':
			return tsx_compat_node_to_jsx_expression(node);
		case 'Element':
			return to_jsx_element(node, transform_context);
		case 'Text':
			return to_jsx_expression_container(to_text_expression(node.expression, node), node);
		case 'TSRXExpression':
			return to_jsx_expression_container(node.expression, node);
		case 'Html':
			throw new Error(
				'`{html ...}` is not supported on the React target. Use `dangerouslySetInnerHTML={{ __html: ... }}` as an element attribute instead.',
			);
		case 'IfStatement':
			return if_statement_to_jsx_child(node, transform_context);
		case 'ForOfStatement':
			return for_of_statement_to_jsx_child(node, transform_context);
		case 'SwitchStatement':
			return switch_statement_to_jsx_child(node, transform_context);
		case 'TryStatement':
			return try_statement_to_jsx_child(node, transform_context);
		default:
			return node;
	}
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function if_statement_to_jsx_child(node, transform_context) {
	return to_jsx_expression_container(
		/** @type {any} */ ({
			type: 'CallExpression',
			callee: {
				type: 'ArrowFunctionExpression',
				params: [],
				body: /** @type {any} */ ({
					type: 'BlockStatement',
					body: [
						create_render_if_statement(node, transform_context),
						create_null_return_statement(),
					],
					metadata: { path: [] },
				}),
				async: false,
				generator: false,
				expression: false,
				metadata: { path: [] },
			},
			arguments: [],
			optional: false,
			metadata: { path: [] },
		}),
	);
}

/**
 * Find the first `key` attribute expression in the top-level elements of a body.
 * Used to propagate keys from loop body elements to wrapper components.
 * Works on both pre-transform (Ripple Element) and post-transform (JSXElement) nodes.
 *
 * @param {any[]} body_nodes
 * @returns {any | undefined}
 */
function find_key_expression_in_body(body_nodes) {
	for (const node of body_nodes) {
		// Pre-transform: Ripple Element node
		if (node.type === 'Element') {
			for (const attr of node.attributes || []) {
				if (attr.type === 'Attribute') {
					const attr_name = typeof attr.name === 'string' ? attr.name : attr.name?.name;
					if (attr_name === 'key') {
						return attr.value?.expression ?? attr.value;
					}
				}
			}
		}
		// Post-transform: JSXElement node
		if (node.type === 'JSXElement') {
			for (const attr of node.openingElement?.attributes || []) {
				if (
					attr.type === 'JSXAttribute' &&
					attr.name?.type === 'JSXIdentifier' &&
					attr.name.name === 'key'
				) {
					// Value is a JSXExpressionContainer
					if (attr.value?.type === 'JSXExpressionContainer') {
						return attr.value.expression;
					}
					return attr.value;
				}
			}
		}
	}
	return undefined;
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function for_of_statement_to_jsx_child(node, transform_context) {
	if (node.await) {
		throw create_compile_error(
			node,
			'React TSRX does not support `for await...of` in component templates.',
		);
	}

	if (node.key) {
		throw create_compile_error(
			node.key,
			'React TSRX does not support `key` in `for` control flow. Put the key on the rendered element instead, for example `<div key={i}>...</div>`.',
		);
	}

	const loop_params = get_for_of_iteration_params(node.left, node.index);
	const loop_body = node.body.type === 'BlockStatement' ? node.body.body : [node.body];
	const has_hooks = body_contains_top_level_hook_call(loop_body);
	const explicit_key_expression = has_hooks ? find_key_expression_in_body(loop_body) : undefined;
	const key_expression =
		has_hooks && explicit_key_expression == null && node.index
			? clone_expression_node(node.index)
			: explicit_key_expression;
	const implicit_non_hook_key_expression =
		!has_hooks && node.index && find_key_expression_in_body(loop_body) == null
			? clone_expression_node(node.index)
			: undefined;

	// Add loop params to available bindings so hoisted helpers receive them as props
	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);
	for (const param of loop_params) {
		collect_pattern_bindings(param, transform_context.available_bindings);
	}

	const body_statements = has_hooks
		? hook_safe_render_statements(loop_body, key_expression, transform_context)
		: build_render_statements(loop_body, true, transform_context);

	if (implicit_non_hook_key_expression) {
		apply_key_to_render_statements(body_statements, implicit_non_hook_key_expression);
	}

	// Restore bindings
	transform_context.available_bindings = saved_bindings;

	return to_jsx_expression_container(
		/** @type {any} */ ({
			type: 'CallExpression',
			callee: {
				type: 'MemberExpression',
				object: node.right,
				property: create_generated_identifier('map'),
				computed: false,
				optional: false,
				metadata: { path: [] },
			},
			arguments: [
				{
					type: 'ArrowFunctionExpression',
					params: loop_params,
					body: /** @type {any} */ ({
						type: 'BlockStatement',
						body: body_statements,
						metadata: { path: [] },
					}),
					async: false,
					generator: false,
					expression: false,
					metadata: { path: [] },
				},
			],
			async: false,
			optional: false,
			metadata: { path: [] },
		}),
	);
}

/**
 * @param {any[]} statements
 * @param {any} key_expression
 * @returns {void}
 */
function apply_key_to_render_statements(statements, key_expression) {
	for (let i = statements.length - 1; i >= 0; i -= 1) {
		const statement = statements[i];
		if (statement?.type !== 'ReturnStatement' || !statement.argument) {
			continue;
		}

		if (statement.argument.type === 'JSXElement') {
			const attributes = statement.argument.openingElement?.attributes || [];
			const has_key = attributes.some(
				(/** @type {any} */ attr) =>
					attr.type === 'JSXAttribute' &&
					attr.name?.type === 'JSXIdentifier' &&
					attr.name.name === 'key',
			);

			if (!has_key) {
				attributes.push(
					/** @type {any} */ ({
						type: 'JSXAttribute',
						name: { type: 'JSXIdentifier', name: 'key', metadata: { path: [] } },
						value: to_jsx_expression_container(
							clone_expression_node(key_expression),
							key_expression,
						),
						metadata: { path: [] },
					}),
				);
			}
		}

		return;
	}
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function switch_statement_to_jsx_child(node, transform_context) {
	return to_jsx_expression_container(
		/** @type {any} */ ({
			type: 'CallExpression',
			callee: {
				type: 'ArrowFunctionExpression',
				params: [],
				body: /** @type {any} */ ({
					type: 'BlockStatement',
					body: [
						create_render_switch_statement(node, transform_context),
						create_null_return_statement(),
					],
					metadata: { path: [] },
				}),
				async: false,
				generator: false,
				expression: false,
				metadata: { path: [] },
			},
			arguments: [],
			optional: false,
			metadata: { path: [] },
		}),
	);
}

/**
 * Transform a `try { ... } pending { ... } catch (err, reset) { ... }` block
 * into React `<TsrxErrorBoundary>` and/or `<Suspense>` JSX elements.
 *
 * - `pending` → `<Suspense fallback={...}>`
 * - `catch` → `<TsrxErrorBoundary fallback={(err, reset) => ...}>`
 * - both → ErrorBoundary wraps Suspense
 * - `finally` blocks are not supported in component template context
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function try_statement_to_jsx_child(node, transform_context) {
	const pending = node.pending;
	const handler = node.handler;
	const finalizer = node.finalizer;

	if (finalizer) {
		throw create_compile_error(
			finalizer,
			'React TSRX does not support `finally` blocks in component templates. Move the try statement into a function if you need a finally block.',
		);
	}

	if (!pending && !handler) {
		throw create_compile_error(
			node,
			'Component try statements must have a `pending` or `catch` block.',
		);
	}

	// Validate that try body contains JSX if pending block is present
	if (pending) {
		const try_body = node.block.body || [];
		if (!try_body.some(is_jsx_child)) {
			throw create_compile_error(
				node.block,
				'Component try statements must contain a template in their main body. Move the try statement into a function if it does not render anything.',
			);
		}
		const pending_body = pending.body || [];
		if (!pending_body.some(is_jsx_child)) {
			throw create_compile_error(
				pending,
				'Component try statements must contain a template in their "pending" body. Rendering a pending fallback is required to have a template.',
			);
		}
	}

	// Build the try body content as JSX children
	const try_body_nodes = node.block.body || [];
	const try_content = statement_body_to_jsx_child(try_body_nodes, transform_context);

	/** @type {any} */
	let result = try_content;

	// Wrap in <Suspense> if pending block exists
	if (pending) {
		transform_context.needs_suspense = true;
		const pending_body_nodes = pending.body || [];
		const fallback_content = statement_body_to_jsx_child(pending_body_nodes, transform_context);

		result = create_jsx_element(
			'Suspense',
			[
				{
					type: 'JSXAttribute',
					name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
					value: fallback_content,
					metadata: { path: [] },
				},
			],
			[result],
		);
	}

	// Wrap in <TsrxErrorBoundary> if catch block exists
	if (handler) {
		transform_context.needs_error_boundary = true;

		const catch_params = [];
		if (handler.param) {
			catch_params.push(handler.param);
		} else {
			catch_params.push(create_generated_identifier('_error'));
		}
		if (handler.resetParam) {
			catch_params.push(handler.resetParam);
		} else {
			catch_params.push(create_generated_identifier('_reset'));
		}

		const catch_body_nodes = handler.body.body || [];

		// Add catch params to available_bindings so static hoisting
		// correctly identifies references to err/reset as non-static
		const saved_catch_bindings = transform_context.available_bindings;
		transform_context.available_bindings = new Map(saved_catch_bindings);
		for (const param of catch_params) {
			collect_pattern_bindings(param, transform_context.available_bindings);
		}

		const fallback_fn = {
			type: 'ArrowFunctionExpression',
			params: catch_params,
			body: /** @type {any} */ ({
				type: 'BlockStatement',
				body: build_render_statements(catch_body_nodes, true, transform_context),
				metadata: { path: [] },
			}),
			async: false,
			generator: false,
			expression: false,
			metadata: { path: [] },
		};

		transform_context.available_bindings = saved_catch_bindings;

		result = create_jsx_element(
			'TsrxErrorBoundary',
			[
				{
					type: 'JSXAttribute',
					name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
					value: to_jsx_expression_container(/** @type {any} */ (fallback_fn)),
					metadata: { path: [] },
				},
			],
			[result],
		);
	}

	// result is a JSXElement, but we need to return a JSXExpressionContainer
	// for embedding in the parent component's render return
	if (result.type === 'JSXElement') {
		return to_jsx_expression_container(result);
	}

	return result;
}

/**
 * Create a simple JSX element AST node.
 *
 * @param {string} tag_name
 * @param {any[]} attributes
 * @param {any[]} children
 * @returns {any}
 */
function create_jsx_element(tag_name, attributes, children) {
	const name = { type: 'JSXIdentifier', name: tag_name, metadata: { path: [] } };
	return {
		type: 'JSXElement',
		openingElement: {
			type: 'JSXOpeningElement',
			name,
			attributes,
			selfClosing: children.length === 0,
			metadata: { path: [] },
		},
		closingElement:
			children.length > 0
				? {
						type: 'JSXClosingElement',
						name: { type: 'JSXIdentifier', name: tag_name, metadata: { path: [] } },
						metadata: { path: [] },
					}
				: null,
		children,
		metadata: { path: [] },
	};
}

/**
 * Inject import declarations for `Suspense` and `TsrxErrorBoundary` if the
 * transform determined they are needed.
 *
 * @param {AST.Program} program
 * @param {TransformContext} transform_context
 */
function inject_try_imports(program, transform_context) {
	/** @type {any[]} */
	const imports = [];

	if (transform_context.needs_suspense) {
		imports.push({
			type: 'ImportDeclaration',
			specifiers: [
				{
					type: 'ImportSpecifier',
					imported: { type: 'Identifier', name: 'Suspense', metadata: { path: [] } },
					local: { type: 'Identifier', name: 'Suspense', metadata: { path: [] } },
					metadata: { path: [] },
				},
			],
			source: { type: 'Literal', value: 'react', raw: "'react'" },
			metadata: { path: [] },
		});
	}

	if (transform_context.needs_error_boundary) {
		imports.push({
			type: 'ImportDeclaration',
			specifiers: [
				{
					type: 'ImportSpecifier',
					imported: {
						type: 'Identifier',
						name: 'TsrxErrorBoundary',
						metadata: { path: [] },
					},
					local: {
						type: 'Identifier',
						name: 'TsrxErrorBoundary',
						metadata: { path: [] },
					},
					metadata: { path: [] },
				},
			],
			source: {
				type: 'Literal',
				value: '@tsrx/react/error-boundary',
				raw: "'@tsrx/react/error-boundary'",
			},
			metadata: { path: [] },
		});
	}

	if (imports.length > 0) {
		program.body.unshift(...imports);
	}
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_render_if_statement(node, transform_context) {
	const consequent_body =
		node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
	const consequent_has_hooks = body_contains_top_level_hook_call(consequent_body);

	let alternate = null;
	if (node.alternate) {
		if (node.alternate.type === 'IfStatement') {
			alternate = create_render_if_statement(node.alternate, transform_context);
		} else {
			const alternate_body = node.alternate.body || [node.alternate];
			const alternate_has_hooks = body_contains_top_level_hook_call(alternate_body);
			alternate = set_loc(
				/** @type {any} */ ({
					type: 'BlockStatement',
					body: alternate_has_hooks
						? hook_safe_render_statements(alternate_body, undefined, transform_context)
						: build_render_statements(alternate_body, true, transform_context),
					metadata: { path: [] },
				}),
				node.alternate,
			);
		}
	}

	return set_loc(
		{
			type: 'IfStatement',
			test: node.test,
			consequent: set_loc(
				/** @type {any} */ ({
					type: 'BlockStatement',
					body: consequent_has_hooks
						? hook_safe_render_statements(consequent_body, undefined, transform_context)
						: build_render_statements(consequent_body, true, transform_context),
					metadata: { path: [] },
				}),
				node.consequent,
			),
			alternate,
		},
		node,
	);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_render_switch_statement(node, transform_context) {
	return /** @type {any} */ ({
		type: 'SwitchStatement',
		discriminant: node.discriminant,
		cases: node.cases.map((/** @type {any} */ c) =>
			create_render_switch_case(c, transform_context),
		),
		metadata: { path: [] },
	});
}

/**
 * @param {any} switch_case
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_render_switch_case(switch_case, transform_context) {
	const consequent = flatten_switch_consequent(switch_case.consequent || []);

	// Strip trailing break statements for hook analysis
	const body_without_break = [];
	for (const child of consequent) {
		if (child.type === 'BreakStatement') break;
		body_without_break.push(child);
	}

	if (body_contains_top_level_hook_call(body_without_break)) {
		return /** @type {any} */ ({
			type: 'SwitchCase',
			test: switch_case.test,
			consequent: hook_safe_render_statements(body_without_break, undefined, transform_context),
			metadata: { path: [] },
		});
	}

	const case_body = [];
	const render_nodes = [];
	let has_terminal = false;

	for (const child of consequent) {
		if (child.type === 'BreakStatement') {
			if (render_nodes.length > 0 && !has_terminal) {
				case_body.push(create_component_return_statement(render_nodes, switch_case));
			} else if (!has_terminal) {
				case_body.push(child);
			}
			has_terminal = true;
			break;
		}

		if (is_bare_return_statement(child)) {
			case_body.push(create_component_return_statement(render_nodes, child));
			has_terminal = true;
			break;
		}

		if (is_jsx_child(child)) {
			render_nodes.push(to_jsx_child(child, transform_context));
		} else {
			case_body.push(child);
		}
	}

	if (!has_terminal && render_nodes.length > 0) {
		case_body.push(create_component_return_statement(render_nodes, switch_case));
	}

	return /** @type {any} */ ({
		type: 'SwitchCase',
		test: switch_case.test,
		consequent: case_body,
		metadata: { path: [] },
	});
}

/**
 * @returns {any}
 */
function create_null_return_statement() {
	return {
		type: 'ReturnStatement',
		argument: { type: 'Literal', value: null, raw: 'null' },
	};
}

/**
 * @param {AST.Expression} expression
 * @param {any} [source_node]
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function to_jsx_expression_container(expression, source_node = expression) {
	// NOTE: JSXExpressionContainer nodes are intentionally created without loc.
	// They are synthetic wrappers whose source positions do not correspond to
	// entries in the generated source map, so adding loc causes Volar mapping failures.
	return /** @type {any} */ ({
		type: 'JSXExpressionContainer',
		expression: /** @type {any} */ (expression),
		metadata: { path: [] },
	});
}

/**
 * Ripple's `{text expr}` always renders text, even for booleans and objects.
 * React's normal `{expr}` child semantics would drop booleans and render
 * elements as elements, so we coerce to a text value explicitly.
 * @param {AST.Expression} expression
 * @param {any} [source_node]
 * @returns {AST.Expression}
 */
function to_text_expression(expression, source_node = expression) {
	return set_loc(
		/** @type {AST.Expression} */ ({
			type: 'ConditionalExpression',
			test: {
				type: 'BinaryExpression',
				operator: '==',
				left: clone_expression_node(expression),
				right: {
					type: 'Literal',
					value: null,
					raw: 'null',
					metadata: { path: [] },
				},
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
 * @param {any} attr
 * @returns {ESTreeJSX.JSXAttribute | ESTreeJSX.JSXSpreadAttribute}
 */
function to_jsx_attribute(attr) {
	if (!attr) return attr;
	if (attr.type === 'JSXAttribute' || attr.type === 'JSXSpreadAttribute') {
		return attr;
	}
	if (attr.type === 'SpreadAttribute') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXSpreadAttribute',
				argument: attr.argument,
			}),
			attr,
		);
	}
	if (attr.type === 'RefAttribute') {
		// RefAttribute uses `{ref expr}` syntax whose source positions don't map to the
		// generated `ref={expr}` JSX attribute, so we intentionally omit loc.
		return /** @type {any} */ ({
			type: 'JSXAttribute',
			name: { type: 'JSXIdentifier', name: 'ref', metadata: { path: [] } },
			value: to_jsx_expression_container(attr.argument),
			shorthand: false,
			metadata: { path: [] },
		});
	}

	// Rewrite Ripple-style `class` → React's `className`.
	let attr_name = attr.name;
	if (attr_name && attr_name.type === 'Identifier' && attr_name.name === 'class') {
		attr_name = set_loc(
			/** @type {any} */ ({ type: 'Identifier', name: 'className', metadata: { path: [] } }),
			attr.name,
		);
	}

	const name =
		attr_name && attr_name.type === 'Identifier' ? identifier_to_jsx_name(attr_name) : attr_name;

	let value = attr.value;
	if (value) {
		if (value.type === 'Literal' && typeof value.value === 'string') {
			// Keep string literal as attribute string.
		} else if (value.type !== 'JSXExpressionContainer') {
			value = to_jsx_expression_container(value);
		}
	}

	const jsx_attribute = /** @type {any} */ ({
		type: 'JSXAttribute',
		name,
		value: value || null,
		shorthand: false,
		metadata: { path: [] },
	});

	if (value_has_unmappable_jsx_loc(value)) {
		/** @type {any} */ (jsx_attribute.metadata).has_unmappable_value = true;
		return jsx_attribute;
	}

	return set_loc(jsx_attribute, attr);
}

/**
 * @param {any} value
 * @returns {boolean}
 */
function value_has_unmappable_jsx_loc(value) {
	return !!(
		value?.type === 'JSXExpressionContainer' &&
		(value.expression?.type === 'JSXElement' || value.expression?.type === 'JSXFragment') &&
		!value.expression.loc
	);
}

/**
 * @param {any} id
 * @returns {boolean}
 */
function is_dynamic_element_id(id) {
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
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function dynamic_element_to_jsx_child(node, transform_context) {
	const dynamic_id = set_loc(create_generated_identifier('DynamicElement'), node.id);
	const alias_declaration = set_loc(
		/** @type {any} */ ({
			type: 'VariableDeclaration',
			kind: 'const',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: dynamic_id,
					init: clone_expression_node(node.id),
					metadata: { path: [] },
				},
			],
			metadata: { path: [] },
		}),
		node,
	);
	const jsx_element = create_dynamic_jsx_element(dynamic_id, node, transform_context);

	return to_jsx_expression_container(
		/** @type {any} */ ({
			type: 'CallExpression',
			callee: {
				type: 'ArrowFunctionExpression',
				params: [],
				body: /** @type {any} */ ({
					type: 'BlockStatement',
					body: [
						alias_declaration,
						{
							type: 'ReturnStatement',
							argument: {
								type: 'ConditionalExpression',
								test: clone_identifier(dynamic_id),
								consequent: jsx_element,
								alternate: create_null_literal(),
								metadata: { path: [] },
							},
							metadata: { path: [] },
						},
					],
					metadata: { path: [] },
				}),
				async: false,
				generator: false,
				expression: false,
				metadata: { path: [] },
			},
			arguments: [],
			optional: false,
			metadata: { path: [] },
		}),
		node,
	);
}

/**
 * @param {AST.Identifier} dynamic_id
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXElement}
 */
function create_dynamic_jsx_element(dynamic_id, node, transform_context) {
	const attributes = (node.attributes || []).map(to_jsx_attribute);
	const selfClosing = !!node.selfClosing;
	const children = create_element_children(node.children || [], transform_context);
	const name = identifier_to_jsx_name(clone_identifier(dynamic_id));

	return /** @type {any} */ ({
		type: 'JSXElement',
		openingElement: {
			type: 'JSXOpeningElement',
			name,
			attributes,
			selfClosing,
			metadata: { path: [] },
		},
		closingElement: selfClosing
			? null
			: {
					type: 'JSXClosingElement',
					name: clone_jsx_name(name),
					metadata: { path: [] },
				},
		children,
		metadata: { path: [] },
	});
}

/**
 * @param {any} node
 * @returns {any}
 */
function clone_expression_node(node) {
	if (!node || typeof node !== 'object') {
		return node;
	}

	if (Array.isArray(node)) {
		return node.map(clone_expression_node);
	}

	const clone = { ...node };
	for (const key of Object.keys(clone)) {
		if (key === 'metadata') {
			clone.metadata = clone.metadata ? { ...clone.metadata } : { path: [] };
			continue;
		}
		clone[key] = clone_expression_node(clone[key]);
	}
	return clone;
}

/**
 * @param {AST.Identifier | AST.MemberExpression | any} id
 * @returns {ESTreeJSX.JSXIdentifier | ESTreeJSX.JSXMemberExpression}
 */
function identifier_to_jsx_name(id) {
	if (id.type === 'Identifier') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXIdentifier',
				name: id.name,
				metadata: { path: [], is_component: /^[A-Z]/.test(id.name) },
			}),
			id,
		);
	}
	if (id.type === 'MemberExpression') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXMemberExpression',
				object: /** @type {any} */ (identifier_to_jsx_name(id.object)),
				property: /** @type {any} */ (identifier_to_jsx_name(id.property)),
			}),
			id,
		);
	}
	return id;
}

/**
 * @param {any} name
 * @param {any} [source_node]
 * @returns {any}
 */
function clone_jsx_name(name, source_node = name) {
	if (name.type === 'JSXIdentifier') {
		return set_loc(
			{
				type: 'JSXIdentifier',
				name: name.name,
				metadata: name.metadata || { path: [] },
			},
			source_node,
		);
	}
	if (name.type === 'JSXMemberExpression') {
		return set_loc(
			{
				type: 'JSXMemberExpression',
				object: clone_jsx_name(name.object, source_node.object || name.object),
				property: clone_jsx_name(name.property, source_node.property || name.property),
				metadata: name.metadata || { path: [] },
			},
			source_node,
		);
	}
	return name;
}

/**
 * @param {any[]} render_nodes
 * @returns {any}
 */
function build_return_expression(render_nodes) {
	if (render_nodes.length === 0) return null;
	if (render_nodes.length === 1) {
		const only = render_nodes[0];
		if (only.type === 'JSXExpressionContainer') {
			return only.expression;
		}
		return only;
	}
	const first = render_nodes[0];
	const last = render_nodes[render_nodes.length - 1];
	return set_loc(
		{
			type: 'JSXFragment',
			openingFragment: /** @type {any} */ ({
				type: 'JSXOpeningFragment',
				metadata: { path: [] },
			}),
			closingFragment: /** @type {any} */ ({
				type: 'JSXClosingFragment',
				metadata: { path: [] },
			}),
			children: render_nodes,
			metadata: { path: [] },
		},
		first?.loc && last?.loc
			? {
					start: first.start,
					end: last.end,
					loc: {
						start: first.loc.start,
						end: last.loc.end,
					},
				}
			: undefined,
	);
}

/**
 * @template T
 * @param {T} node
 * @param {any} source_node
 * @returns {T}
 */
function set_loc(node, source_node) {
	/** @type {any} */ (node).metadata ??= { path: [] };
	if (source_node?.loc) {
		return /** @type {T} */ (setLocation(/** @type {any} */ (node), source_node, true));
	}
	return node;
}

/**
 * @param {any} left
 * @param {any} index
 * @returns {AST.Pattern[]}
 */
function get_for_of_iteration_params(left, index) {
	const params = [];
	if (left?.type === 'VariableDeclaration') {
		params.push(left.declarations[0]?.id);
	} else {
		params.push(left);
	}
	if (index) {
		params.push(index);
	}
	return params;
}

/**
 * @param {string} name
 * @returns {AST.Identifier}
 */
function create_generated_identifier(name) {
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
function create_compile_error(node, message) {
	const error = /** @type {Error & { pos: number, end: number }} */ (new Error(message));
	error.pos = node.start ?? 0;
	error.end = node.end ?? error.pos + 1;
	return error;
}

/**
 * @param {any} node
 * @returns {any}
 */
function tsx_compat_node_to_jsx_expression(node) {
	if (node.kind !== 'react') {
		throw create_compile_error(
			node,
			`React TSRX does not support <tsx:${node.kind}> blocks. Use <tsx> or <tsx:react>.`,
		);
	}

	return tsx_node_to_jsx_expression(node);
}

/**
 * @param {any} node
 * @returns {any}
 */
function tsx_node_to_jsx_expression(node) {
	const children = (node.children || []).filter(
		(/** @type {any} */ child) => child.type !== 'JSXText' || child.value.trim() !== '',
	);

	if (children.length === 1 && children[0].type !== 'JSXText') {
		return strip_locations(children[0]);
	}

	return strip_locations(
		/** @type {any} */ ({
			type: 'JSXFragment',
			openingFragment: { type: 'JSXOpeningFragment', metadata: { path: [] } },
			closingFragment: { type: 'JSXClosingFragment', metadata: { path: [] } },
			children,
			metadata: { path: [] },
		}),
	);
}

/**
 * @param {any} node
 * @returns {any}
 */
function strip_locations(node) {
	if (!node || typeof node !== 'object') {
		return node;
	}

	if (Array.isArray(node)) {
		return node.map(strip_locations);
	}

	delete node.loc;
	delete node.start;
	delete node.end;

	for (const key of Object.keys(node)) {
		if (key === 'metadata') {
			continue;
		}
		node[key] = strip_locations(node[key]);
	}

	return node;
}

/**
 * @param {any[]} consequent
 * @returns {any[]}
 */
function flatten_switch_consequent(consequent) {
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
