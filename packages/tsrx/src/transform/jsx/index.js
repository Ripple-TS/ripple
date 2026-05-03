/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */
/** @import { JsxPlatform, JsxTransformContext, JsxTransformOptions, JsxTransformResult } from '@tsrx/core/types' */

import { walk } from 'zimmerframe';
import { print } from 'esrap';
import { error } from '../../errors.js';
import {
	ensure_function_metadata,
	in_jsx_child_context,
	tsx_node_to_jsx_expression,
	tsx_with_ts_locations,
} from './helpers.js';
import {
	clone_expression_node,
	clone_identifier,
	clone_jsx_name,
	create_generated_identifier,
	create_null_literal,
	flatten_switch_consequent,
	get_for_of_iteration_params,
	identifier_to_jsx_name,
	is_dynamic_element_id,
	is_jsx_child,
	set_loc,
	to_text_expression,
} from './ast-builders.js';
import { render_stylesheets as renderStylesheets } from '../stylesheet.js';
import {
	set_location as setLocation,
	jsx_attribute as build_jsx_attribute,
	jsx_id as build_jsx_id,
} from '../../utils/builders.js';
import * as b from '../../utils/builders.js';
import {
	apply_lazy_transforms,
	collect_lazy_bindings_from_component,
	preallocate_lazy_ids,
	replace_lazy_params,
} from '../lazy.js';
import { find_first_top_level_await_in_component_body } from '../await.js';
import { prepare_stylesheet_for_render, annotate_component_with_hash } from '../scoping.js';
import {
	validate_component_loop_break_statement,
	validate_component_loop_return_statement,
	validate_component_return_statement,
	validate_component_unsupported_loop_statement,
} from '../../analyze/validation.js';
import { get_component_from_path } from '../../utils/ast.js';
import {
	is_interleaved_body as is_interleaved_body_core,
	is_capturable_jsx_child,
	capture_jsx_child as captureJsxChild,
} from '../jsx-interleave.js';
import { is_hoist_safe_jsx_node } from '../jsx-hoist.js';

/**
 * Local alias for the shared `JsxTransformContext`. Kept as a typedef so the
 * rest of this file's `@param {TransformContext}` annotations don't all have
 * to spell out the import.
 *
 * @typedef {JsxTransformContext} TransformContext
 */

/**
 * @typedef {{ source_name: string, read: () => any }} LazyBinding
 */

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_function_or_class_boundary(node) {
	return (
		node?.type === 'FunctionDeclaration' ||
		node?.type === 'FunctionExpression' ||
		node?.type === 'ArrowFunctionExpression' ||
		node?.type === 'ClassDeclaration' ||
		node?.type === 'ClassExpression'
	);
}

/**
 * @param {any[]} path
 * @returns {boolean}
 */
function is_inside_component_for_of(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node) || node?.type === 'Component') {
			return false;
		}
		if (node?.type === 'ForOfStatement') {
			return true;
		}
	}
	return false;
}

/**
 * @param {any[]} path
 * @returns {boolean}
 */
function break_targets_component_loop(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node) || node?.type === 'Component') {
			return false;
		}
		if (node?.type === 'SwitchStatement') {
			return false;
		}
		if (
			node?.type === 'ForOfStatement' ||
			node?.type === 'ForStatement' ||
			node?.type === 'ForInStatement' ||
			node?.type === 'WhileStatement' ||
			node?.type === 'DoWhileStatement'
		) {
			return true;
		}
	}
	return false;
}

/**
 * Build a `transform()` function for a specific JSX platform (React, Preact,
 * Solid). Given a `JsxPlatform` descriptor, returns a transform that parses
 * Ripple's `Component`/`Element`/`Text`/`TSRXExpression` AST into a plain
 * TSX module for that platform.
 *
 * Any `<style>` element declared inside a component is collected, rendered
 * via `@tsrx/core`'s stylesheet renderer, and returned alongside the JS
 * output so a downstream plugin can inject it. The compiler also augments
 * every non-style Element in a scoped component with the stylesheet's hash
 * class so scoped selectors match correctly.
 *
 * @param {JsxPlatform} platform
 * @returns {(ast: AST.Program, source: string, filename?: string, options?: JsxTransformOptions) => JsxTransformResult}
 */
export function createJsxTransform(platform) {
	/**
	 * @param {AST.Program} ast
	 * @param {string} source
	 * @param {string} [filename]
	 * @param {JsxTransformOptions} [options]
	 * @returns {JsxTransformResult}
	 */
	function transform(ast, source, filename, options) {
		const suspense_source = options?.suspenseSource ?? platform.imports.suspense;
		const should_scan_use_server_directive =
			platform.validation.requireUseServerForAwait &&
			(!platform.hooks?.validateComponentAwait ||
				platform.validation.scanUseServerDirectiveForAwaitWithCustomValidator !== false);
		const module_uses_server_directive = should_scan_use_server_directive
			? has_use_server_directive(ast)
			: true;
		const collect = !!(options?.collect || options?.loose);
		/** @type {any[]} */
		const stylesheets = [];

		/** @type {TransformContext} */
		const transform_context = {
			platform,
			local_statement_component_index: 0,
			needs_error_boundary: false,
			needs_suspense: false,
			needs_merge_refs: false,
			needs_fragment: false,
			helper_state: null,
			available_bindings: new Map(),
			lazy_next_id: 0,
			current_css_hash: null,
			filename: filename ?? null,
			collect,
			errors: collect ? options?.errors : undefined,
			comments: options?.comments,
			// Platforms can seed their own tracking state (e.g. solid's
			// needs_show / needs_for flags) via `hooks.initialState`.
			...(platform.hooks?.initialState?.() ?? {}),
		};

		preallocate_lazy_ids(/** @type {any} */ (ast), transform_context);

		walk(/** @type {any} */ (ast), transform_context, {
			ReturnStatement(node, { next, path }) {
				if (get_component_from_path(path)) {
					if (is_inside_component_for_of(path)) {
						validate_component_loop_return_statement(
							node,
							filename,
							transform_context.errors,
							transform_context.comments,
						);
					} else {
						validate_component_return_statement(
							node,
							filename,
							transform_context.errors,
							transform_context.comments,
						);
					}
				}

				return next();
			},

			BreakStatement(node, { next, path }) {
				if (get_component_from_path(path) && break_targets_component_loop(path)) {
					validate_component_loop_break_statement(
						node,
						filename,
						transform_context.errors,
						transform_context.comments,
					);
				}

				return next();
			},

			ForStatement(node, { next, path }) {
				if (get_component_from_path(path)) {
					validate_component_unsupported_loop_statement(
						node,
						filename,
						transform_context.errors,
						transform_context.comments,
					);
				}

				return next();
			},

			ForInStatement(node, { next, path }) {
				if (get_component_from_path(path)) {
					validate_component_unsupported_loop_statement(
						node,
						filename,
						transform_context.errors,
						transform_context.comments,
					);
				}

				return next();
			},

			WhileStatement(node, { next, path }) {
				if (get_component_from_path(path)) {
					validate_component_unsupported_loop_statement(
						node,
						filename,
						transform_context.errors,
						transform_context.comments,
					);
				}

				return next();
			},

			DoWhileStatement(node, { next, path }) {
				if (get_component_from_path(path)) {
					validate_component_unsupported_loop_statement(
						node,
						filename,
						transform_context.errors,
						transform_context.comments,
					);
				}

				return next();
			},

			Component(node, { next, state }) {
				const as_any = /** @type {any} */ (node);

				const await_expression = find_first_top_level_await_in_component_body(as_any.body || []);

				if (await_expression) {
					// Let a platform reject component-level await entirely (solid)
					// or customize the error. Otherwise fall back to the default
					// `requireUseServerForAwait` check.
					if (platform.hooks?.validateComponentAwait) {
						platform.hooks.validateComponentAwait(
							await_expression,
							as_any,
							state,
							module_uses_server_directive,
							source,
						);
					} else if (!module_uses_server_directive) {
						error(
							`${platform.name} components can only use \`await\` when the module has a top-level "use server" directive.`,
							state.filename,
							await_expression,
							state.errors,
							state.comments,
						);
					}

					as_any.metadata = /** @type {any} */ ({
						...(as_any.metadata || {}),
						contains_top_level_await: true,
					});
				}

				const css = as_any.css;
				if (css) {
					stylesheets.push(css);
					const hash = css.hash;
					annotate_component_with_hash(
						as_any,
						hash,
						platform.jsx.rewriteClassAttr ? 'className' : 'class',
					);
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
				// so Element children processed during the bottom-up walk can see
				// component-scope names. Hook-safe helpers filter this set down to
				// the names their body actually references before generating props.
				const body_bindings = collect_param_bindings(as_any.params || []);
				const body = as_any.body || [];
				const split_index = find_hook_safe_split_index(body, state);
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

				const convert = platform.hooks?.componentToFunction ?? component_to_function_declaration;
				return /** @type {any} */ (convert(inner, state, helper_state));
			},

			Tsx(node, { next, path }) {
				const inner = /** @type {any} */ (next() ?? node);
				return /** @type {any} */ (tsx_node_to_jsx_expression(inner, in_jsx_child_context(path)));
			},

			TsxCompat(node, { next, path, state }) {
				const inner = /** @type {any} */ (next() ?? node);
				return /** @type {any} */ (
					tsx_compat_node_to_jsx_expression(inner, state, in_jsx_child_context(path))
				);
			},

			Element(node, { next, state }) {
				// Capture raw children BEFORE the walker transforms them so a
				// platform hook (e.g. Solid's textContent optimization) can
				// inspect the original Text / TSRXExpression nodes rather than
				// their walker-lowered JSXExpressionContainer equivalents.
				const raw_children = /** @type {any} */ (node).children || [];
				const inner = /** @type {any} */ (next() ?? node);
				const hook = platform.hooks?.transformElement;
				if (hook) return /** @type {any} */ (hook(inner, state, raw_children));
				return /** @type {any} */ (to_jsx_element(inner, state, raw_children));
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

			Style(node, { state, path }) {
				validate_style_directive(node, state, path);
				const class_name = typeof node.value.value === 'string' ? node.value.value : '';
				const value = state.current_css_hash
					? `${state.current_css_hash} ${class_name}`
					: class_name;
				return /** @type {any} */ (b.literal(value, node));
			},

			// Default .metadata on every function-like node so downstream consumers
			// (e.g. segments.js reading node.value.metadata.is_component on class
			// methods) don't trip on an undefined metadata object. Ripple's analyze
			// phase does this via visit_function; tsrx-react has no analyze phase.
			FunctionDeclaration: ensure_function_metadata,
			FunctionExpression: ensure_function_metadata,
			ArrowFunctionExpression: ensure_function_metadata,
		});

		const expanded = expand_component_helpers(/** @type {AST.Program} */ (transformed));
		if (platform.hooks?.injectImports) {
			platform.hooks.injectImports(expanded, transform_context, suspense_source);
		} else {
			inject_try_imports(expanded, transform_context, platform, suspense_source);
		}

		// Apply lazy destructuring transforms to module-level code (top-level function
		// declarations, arrow functions, etc.). Component bodies have already been
		// transformed inside component_to_function_declaration; this catches plain
		// functions outside components and any lazy patterns in module scope.
		const final_program = /** @type {any} */ (
			apply_lazy_transforms(/** @type {any} */ (expanded), new Map())
		);

		const result = print(/** @type {any} */ (final_program), tsx_with_ts_locations(), {
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

	return transform;
}

/**
 * Detect a top-level `"use server"` directive. Used by platforms whose
 * validation rule requires the directive to enable top-level `await`
 * in components (currently: Preact).
 *
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
 * Lower a TSRX `Component` node into the shared function-declaration form used
 * by the default JSX targets. Platform hooks can reuse this helper and wrap the
 * resulting function in another declaration shape without reimplementing
 * component body lowering, lazy destructuring, helper generation, or top-level
 * await handling.
 *
 * @param {any} component
 * @param {TransformContext} transform_context
 * @param {{ base_name: string, next_id: number, helpers: AST.FunctionDeclaration[], statics: any[] }} [walk_helper_state]
 * @returns {AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression}
 */
export function component_to_function_declaration(component, transform_context, walk_helper_state) {
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

	const body_statements = build_component_statements(body, transform_context);

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

	/** @type {AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression} */
	let fn;

	if (component.id) {
		fn = /** @type {any} */ ({
			type: 'FunctionDeclaration',
			id: component.id,
			typeParameters: component.typeParameters,
			params: final_params,
			body: final_body,
			async: is_async_component,
			generator: false,
			metadata: {
				path: [],
				is_component: true,
			},
		});
	} else if (component.metadata?.arrow) {
		fn = /** @type {any} */ ({
			type: 'ArrowFunctionExpression',
			typeParameters: component.typeParameters,
			params: final_params,
			body: final_body,
			async: is_async_component,
			generator: false,
			expression: false,
			metadata: {
				path: [],
				is_component: true,
			},
		});
	} else {
		fn = /** @type {any} */ ({
			type: 'FunctionExpression',
			id: null,
			typeParameters: component.typeParameters,
			params: final_params,
			body: final_body,
			async: is_async_component,
			generator: false,
			metadata: {
				path: [],
				is_component: true,
			},
		});
	}

	// Restore context
	transform_context.helper_state = saved_helper_state;
	transform_context.available_bindings = saved_bindings;

	const fn_metadata = /** @type {any} */ (fn.metadata);
	fn_metadata.generated_helpers = helper_state.helpers;
	fn_metadata.generated_statics = helper_state.statics;

	if (fn.type === 'FunctionDeclaration' && fn.id) {
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
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function build_component_statements(body_nodes, transform_context) {
	return build_render_statements(body_nodes, false, transform_context);
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
	let has_bare_return = false;

	// Create a new bindings map so inner-scope bindings from
	// collect_statement_bindings don't leak to the caller's scope.
	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);

	// When non-JSX statements are interleaved with JSX children, we must
	// preserve source order so each JSX expression sees the variable state
	// at its textual position. Otherwise statements would all run before
	// any JSX is constructed, and every JSX child would observe the final
	// state of mutable variables.
	const interleaved = is_interleaved_body(body_nodes);
	let capture_index = 0;

	for (let i = 0; i < body_nodes.length; i += 1) {
		const child = body_nodes[i];

		if (is_bare_return_statement(child)) {
			statements.push(create_component_return_statement(render_nodes, child));
			render_nodes.length = 0;
			has_bare_return = true;
			continue;
		}

		if (is_returning_if_statement(child)) {
			const branch_has_hooks = body_contains_top_level_hook_call(
				get_if_consequent_body(child),
				transform_context,
				true,
			);
			const continuation_has_hooks = body_contains_top_level_hook_call(
				body_nodes.slice(i + 1),
				transform_context,
				true,
			);

			if (branch_has_hooks || continuation_has_hooks) {
				if (transform_context.platform.hooks?.isTopLevelSetupCall) {
					statements.push(
						...create_setup_once_helper_split_returning_if_statements(
							child,
							body_nodes.slice(i + 1),
							render_nodes,
							transform_context,
						),
					);
					transform_context.available_bindings = saved_bindings;
					return statements;
				}

				statements.push(
					...create_component_helper_split_returning_if_statements(
						child,
						body_nodes.slice(i + 1),
						render_nodes,
						transform_context,
					),
				);
				transform_context.available_bindings = saved_bindings;
				return statements;
			}

			if (is_lone_return_if_statement(child)) {
				// On platforms where setup runs once (Vue Vapor), an early
				// `if (cond) return;` placed at setup level is non-reactive:
				// `cond` is evaluated only when setup runs and never again.
				// Inline the rest of the body as a render-time ternary so the
				// conditional re-evaluates when `cond` changes after mount.
				// React/Preact/Solid re-run the component body on every render,
				// so the old setup-time early return is already reactive there
				// and we keep it to avoid gratuitous output changes.
				if (transform_context.platform.hooks?.isTopLevelSetupCall) {
					const continuation_body = body_nodes.slice(i + 1);

					// Render-time inlining unconditionally lifts continuation
					// statements (provide/watch/declarations/etc.) into the
					// parent setup, which would run them regardless of the
					// early-return condition — wrong when the user wrote them
					// after `if (cond) return;`. Fall back to helper-split if
					// the continuation has any non-render statements so they
					// stay scoped to the helper's lifecycle.
					const continuation_has_setup_statements = continuation_body.some(
						(node) =>
							!is_bare_return_statement(node) &&
							!is_returning_if_statement(node) &&
							!is_jsx_child(node),
					);

					if (continuation_has_setup_statements) {
						statements.push(
							...create_setup_once_helper_split_returning_if_statements(
								child,
								continuation_body,
								render_nodes,
								transform_context,
							),
						);
						transform_context.available_bindings = saved_bindings;
						return statements;
					}

					const continuation_statements = build_render_statements(
						continuation_body,
						false,
						transform_context,
					);

					for (const stmt of continuation_statements) {
						if (stmt.type === 'ReturnStatement') {
							if (stmt.argument) {
								render_nodes.push(
									/** @type {any} */ ({
										type: 'JSXExpressionContainer',
										expression: set_loc(
											/** @type {any} */ ({
												type: 'ConditionalExpression',
												test: clone_expression_node(child.test),
												consequent: {
													type: 'Literal',
													value: null,
													raw: 'null',
													metadata: { path: [] },
												},
												alternate: stmt.argument,
												metadata: { path: [] },
											}),
											child,
										),
										metadata: { path: [] },
									}),
								);
							}
						} else {
							statements.push(stmt);
						}
					}

					break;
				}

				statements.push(create_component_lone_return_if_statement(child, render_nodes));
				continue;
			}

			statements.push(
				create_component_returning_if_statement(child, render_nodes, transform_context),
			);
			continue;
		}

		if (
			child.type === 'IfStatement' &&
			!child.alternate &&
			!is_returning_if_statement(child) &&
			!transform_context.platform.hooks?.isTopLevelSetupCall &&
			body_contains_top_level_hook_call([child], transform_context, true) &&
			i + 1 < body_nodes.length
		) {
			statements.push(
				...create_continuation_lift_if_statement(
					child,
					body_nodes.slice(i + 1),
					render_nodes,
					transform_context,
				),
			);
			transform_context.available_bindings = saved_bindings;
			return statements;
		}

		if (
			child.type === 'ForOfStatement' &&
			!child.await &&
			!transform_context.platform.hooks?.isTopLevelSetupCall &&
			!transform_context.platform.hooks?.controlFlow?.forOf &&
			body_contains_top_level_hook_call(
				child.body.type === 'BlockStatement' ? child.body.body : [child.body],
				transform_context,
				true,
			)
		) {
			const for_of_continuation = body_nodes.slice(i + 1);
			const hoisted = build_hoisted_for_of_with_hooks(
				child,
				for_of_continuation,
				transform_context,
			);
			if (hoisted) {
				statements.push(...hoisted.hoist_statements);
				if (for_of_continuation.length > 0) {
					// Tail was lifted into the helper; everything after the for-of
					// now lives there. Combine prior render_nodes with the iteration
					// JSX and return.
					statements.push({
						type: 'ReturnStatement',
						argument: combine_render_return_argument(render_nodes, hoisted.jsx_child),
						metadata: { path: [] },
					});
					transform_context.available_bindings = saved_bindings;
					return statements;
				}
				if (interleaved && is_capturable_jsx_child(hoisted.jsx_child)) {
					const { declaration, reference } = captureJsxChild(hoisted.jsx_child, capture_index++);
					statements.push(declaration);
					render_nodes.push(reference);
				} else {
					render_nodes.push(hoisted.jsx_child);
				}
				continue;
			}
		}

		if (
			child.type === 'TryStatement' &&
			!child.finalizer &&
			!transform_context.platform.hooks?.isTopLevelSetupCall &&
			try_statement_contains_hooks(child, transform_context) &&
			i + 1 < body_nodes.length
		) {
			statements.push(
				...create_continuation_lift_try_statement(
					child,
					body_nodes.slice(i + 1),
					render_nodes,
					transform_context,
				),
			);
			transform_context.available_bindings = saved_bindings;
			return statements;
		}

		if (
			child.type === 'SwitchStatement' &&
			!transform_context.platform.hooks?.isTopLevelSetupCall &&
			body_contains_top_level_hook_call([child], transform_context, true) &&
			i + 1 < body_nodes.length
		) {
			statements.push(
				...create_continuation_lift_switch_statement(
					child,
					body_nodes.slice(i + 1),
					render_nodes,
					transform_context,
				),
			);
			transform_context.available_bindings = saved_bindings;
			return statements;
		}

		if (is_jsx_child(child)) {
			const jsx = to_jsx_child(child, transform_context);
			if (interleaved && is_capturable_jsx_child(jsx)) {
				const { declaration, reference } = captureJsxChild(jsx, capture_index++);
				statements.push(declaration);
				render_nodes.push(reference);
			} else {
				render_nodes.push(jsx);
			}
		} else {
			statements.push(child);
			collect_statement_bindings(child, transform_context.available_bindings);
		}
	}

	if (!interleaved) {
		hoist_static_render_nodes(render_nodes, transform_context);
	}

	const return_arg = build_return_expression(render_nodes);
	if (return_arg || (return_null_when_empty && !has_bare_return)) {
		statements.push({
			type: 'ReturnStatement',
			argument: return_arg || { type: 'Literal', value: null, raw: 'null' },
		});
	}

	transform_context.available_bindings = saved_bindings;
	return statements;
}

/**
 * React-specific wrapper around the core `isInterleavedBody` helper that
 * ignores bare `return` / lone return-if statements. Those are rewriting
 * signals rather than user-visible side effects, so JSX children around
 * them don't need capturing.
 *
 * @param {any[]} body_nodes
 * @returns {boolean}
 */
function is_interleaved_body(body_nodes) {
	const filtered = body_nodes.filter(
		(child) => !is_bare_return_statement(child) && !is_lone_return_if_statement(child),
	);
	return is_interleaved_body_core(filtered, is_jsx_child);
}

/**
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {number}
 */
function find_hook_safe_split_index(body_nodes, transform_context) {
	for (let i = 0; i < body_nodes.length; i += 1) {
		if (!is_lone_return_if_statement(body_nodes[i])) {
			continue;
		}

		if (body_contains_top_level_hook_call(body_nodes.slice(i + 1), transform_context, true)) {
			return i;
		}
	}

	return -1;
}

/**
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @param {boolean} include_platform_setup
 * @returns {boolean}
 */
function body_contains_top_level_hook_call(
	body_nodes,
	transform_context,
	include_platform_setup = false,
) {
	return body_nodes.some((node) =>
		statement_contains_top_level_hook_call(node, transform_context, include_platform_setup),
	);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @param {boolean} include_platform_setup
 * @returns {boolean}
 */
function statement_contains_top_level_hook_call(node, transform_context, include_platform_setup) {
	return node_contains_top_level_hook_call(node, false, transform_context, include_platform_setup);
}

/**
 * @param {any} node
 * @param {boolean} inside_nested_function
 * @param {TransformContext} transform_context
 * @param {boolean} include_platform_setup
 * @returns {boolean}
 */
function node_contains_top_level_hook_call(
	node,
	inside_nested_function,
	transform_context,
	include_platform_setup,
) {
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
			if (
				node_contains_top_level_hook_call(
					node[key],
					next_inside_nested_function,
					transform_context,
					include_platform_setup,
				)
			) {
				return true;
			}
		}
		return false;
	}

	if (
		!inside_nested_function &&
		node.type === 'CallExpression' &&
		(is_hook_callee(node.callee) ||
			(include_platform_setup &&
				transform_context.platform.hooks?.isTopLevelSetupCall?.(node, transform_context) === true))
	) {
		return true;
	}

	if (Array.isArray(node)) {
		return node.some((child) =>
			node_contains_top_level_hook_call(
				child,
				inside_nested_function,
				transform_context,
				include_platform_setup,
			),
		);
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (
			node_contains_top_level_hook_call(
				node[key],
				inside_nested_function,
				transform_context,
				include_platform_setup,
			)
		) {
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
	const key = create_generated_identifier(binding.name);
	const value = create_generated_identifier(binding.name);

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
 * @param {{
 * 	mapWrapper?: boolean,
 * 	mapBindingNames?: boolean,
 * 	mapBindingValues?: boolean,
 * }} [mapping]
 * @returns {ESTreeJSX.JSXElement}
 */
function create_helper_component_element(helper_id, bindings, source_node, mapping = {}) {
	const { mapWrapper = true, mapBindingNames = true, mapBindingValues = true } = mapping;
	const attributes = bindings.map((binding) =>
		b.jsx_attribute(
			identifier_to_jsx_name(
				mapBindingNames ? clone_identifier(binding) : create_generated_identifier(binding.name),
			),
			to_jsx_expression_container(
				mapBindingValues ? clone_identifier(binding) : create_generated_identifier(binding.name),
				binding,
			),
		),
	);

	const opening_element = b.jsx_opening_element(
		identifier_to_jsx_name(clone_identifier(helper_id)),
		attributes,
		true,
	);
	const element = b.jsx_element_fresh(
		mapWrapper ? set_loc(opening_element, source_node) : opening_element,
	);

	return mapWrapper ? set_loc(element, source_node) : element;
}

/**
 * @param {{ base_name: string, next_id: number, helpers: any[], statics: any[] }} helper_state
 * @param {string} suffix
 * @returns {string}
 */
function create_helper_name(helper_state, suffix) {
	helper_state.next_id += 1;
	return `${helper_state.base_name}__${suffix}${helper_state.next_id}`;
}

/**
 * @param {string} base_name
 * @returns {{ base_name: string, next_id: number, helpers: any[], statics: any[] }}
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
		if (!is_hoist_safe_jsx_node(node)) continue;
		if (
			transform_context.platform.hooks?.canHoistStaticNode &&
			!transform_context.platform.hooks.canHoistStaticNode(node, transform_context)
		) {
			continue;
		}
		if (references_scope_bindings(node, transform_context.available_bindings)) continue;

		const name = create_helper_name(transform_context.helper_state, 'static');
		const id = create_generated_identifier(name);

		transform_context.helper_state.statics.push(b.const(id, node));

		render_nodes[i] = to_jsx_expression_container(clone_identifier(id), node);
	}
}

/**
 * @param {AST.Program} program
 * @returns {AST.Program}
 */
function expand_component_helpers(program) {
	program.body = program.body.flatMap((statement) => {
		const metas = get_generated_component_metadata_list(statement);
		const statics = metas.flatMap((meta) => meta.generated_statics || []);
		const helpers = metas.flatMap((meta) => meta.generated_helpers || []);
		if (statics.length || helpers.length) {
			return [...statics, ...helpers, statement];
		}

		return [statement];
	});

	return program;
}

/**
 * Component hooks may replace a `Component` node with a function declaration,
 * variable declaration, object literal member, or export-safe expression.
 * Generated helper/statics metadata is carried on whichever replacement node
 * the hook returns, so helper expansion must read metadata from that broader
 * set.
 *
 * @param {any} node
 * @returns {{ generated_helpers?: any[], generated_statics?: any[] }[]}
 */
function get_generated_component_metadata_list(node) {
	/** @type {{ generated_helpers?: any[], generated_statics?: any[] }[]} */
	const metas = [];
	const seen_nodes = new Set();
	const seen_metas = new Set();

	/** @param {any} current */
	const visit = (current) => {
		if (!current || typeof current !== 'object' || seen_nodes.has(current)) {
			return;
		}

		seen_nodes.add(current);

		if (current.metadata?.generated_helpers || current.metadata?.generated_statics) {
			if (!seen_metas.has(current.metadata)) {
				seen_metas.add(current.metadata);
				metas.push(current.metadata);
			}
			return;
		}

		if (
			current.type === 'FunctionDeclaration' ||
			current.type === 'FunctionExpression' ||
			current.type === 'ArrowFunctionExpression'
		) {
			return;
		}

		for (const key of Object.keys(current)) {
			if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
				continue;
			}

			const value = current[key];
			if (Array.isArray(value)) {
				for (const child of value) {
					visit(child);
				}
			} else {
				visit(value);
			}
		}
	};

	visit(node);

	return metas;
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

	const consequent_body = get_if_consequent_body(node);

	return consequent_body.length === 1 && is_bare_return_statement(consequent_body[0]);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_returning_if_statement(node) {
	if (node?.type !== 'IfStatement' || node.alternate) {
		return false;
	}

	return get_if_consequent_body(node).some(is_bare_return_statement);
}

/**
 * @param {any} node
 * @returns {any[]}
 */
function get_if_consequent_body(node) {
	return node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
}

/**
 * @param {any[]} render_nodes
 * @param {any} source_node
 * @param {boolean} [map_render_node_locations]
 * @returns {any}
 */
function create_component_return_statement(
	render_nodes,
	source_node,
	map_render_node_locations = true,
) {
	const cloned = render_nodes.map((node) =>
		map_render_node_locations
			? clone_expression_node(node)
			: clone_expression_node_without_locations(node),
	);

	return set_loc(b.return(build_return_expression(cloned) || create_null_literal()), source_node);
}

/**
 * @param {any} node
 * @param {any[]} render_nodes
 * @returns {any}
 */
function create_component_lone_return_if_statement(node, render_nodes) {
	const consequent_body = get_if_consequent_body(node);

	return set_loc(
		b.if(
			node.test,
			set_loc(
				b.block([create_component_return_statement(render_nodes, consequent_body[0], false)]),
				node.consequent,
			),
			null,
		),
		node,
	);
}

/**
 * @param {any} node
 * @param {any[]} render_nodes
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_component_returning_if_statement(node, render_nodes, transform_context) {
	const consequent_body = get_if_consequent_body(node);
	const branch_statements = build_render_statements(consequent_body, true, transform_context);
	prepend_render_nodes_to_return_statements(branch_statements, render_nodes);

	return set_loc(b.if(node.test, set_loc(b.block(branch_statements), node.consequent), null), node);
}

/* ---------------------------------------------------------------------- *
 * Continuation-lift primitives shared across if / switch / try / for-of  *
 * ---------------------------------------------------------------------- */

/**
 * Build the helper component that owns the post-control-flow continuation.
 * Same shape as `create_hook_safe_helper`; named for intent at lift call sites.
 *
 * @param {any[]} continuation_body
 * @param {any} source_node
 * @param {TransformContext} transform_context
 * @returns {{ setup_statements: any[], component_element: ESTreeJSX.JSXElement }}
 */
function build_tail_helper(continuation_body, source_node, transform_context) {
	return create_hook_safe_helper(continuation_body, undefined, source_node, transform_context);
}

/**
 * Clone the tail helper's component element for embedding inside another
 * branch's body. Loses location info because the same element appears in
 * multiple positions and downstream tooling treats AST nodes as identity-keyed.
 *
 * @param {{ component_element: ESTreeJSX.JSXElement }} tail_helper
 * @returns {any}
 */
function clone_tail_invocation(tail_helper) {
	return clone_expression_node_without_locations(tail_helper.component_element);
}

/**
 * Return `[...body, <TailHelper x={x} />]` so the branch's render output
 * includes the tail invocation and the post-hook locals flow forward.
 * Used by if / switch / try (unconditional append). For-of uses a different
 * shape — gating on `_tsrx_isLast_<n>` — so it constructs its own.
 *
 * @param {any[]} body
 * @param {{ component_element: ESTreeJSX.JSXElement }} tail_helper
 * @returns {any[]}
 */
function append_tail_invocation(body, tail_helper) {
	return [...body, clone_tail_invocation(tail_helper)];
}

/**
 * @param {AST.Identifier} tail_synthetic_id
 * @param {{ component_element: ESTreeJSX.JSXElement }} tail_helper
 * @returns {any}
 */
function create_loop_tail_expression(tail_synthetic_id, tail_helper) {
	return b.logical('&&', clone_identifier(tail_synthetic_id), clone_tail_invocation(tail_helper));
}

/**
 * @param {AST.Identifier} tail_synthetic_id
 * @param {{ component_element: ESTreeJSX.JSXElement }} tail_helper
 * @returns {any}
 */
function create_loop_tail_conditional(tail_synthetic_id, tail_helper) {
	return b.conditional(
		clone_identifier(tail_synthetic_id),
		clone_tail_invocation(tail_helper),
		create_null_literal(),
	);
}

/**
 * @param {any[]} statements
 * @param {AST.Identifier} tail_synthetic_id
 * @param {{ component_element: ESTreeJSX.JSXElement }} tail_helper
 * @returns {void}
 */
function append_loop_tail_to_return_statements(statements, tail_synthetic_id, tail_helper) {
	for (const statement of statements) {
		append_loop_tail_to_return_statement(statement, tail_synthetic_id, tail_helper, false);
	}
}

/**
 * @param {any} node
 * @param {AST.Identifier} tail_synthetic_id
 * @param {{ component_element: ESTreeJSX.JSXElement }} tail_helper
 * @param {boolean} inside_nested_function
 * @returns {void}
 */
function append_loop_tail_to_return_statement(
	node,
	tail_synthetic_id,
	tail_helper,
	inside_nested_function,
) {
	if (!node || typeof node !== 'object') {
		return;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		inside_nested_function = true;
	}

	if (!inside_nested_function && node.type === 'ReturnStatement') {
		if (
			references_scope_bindings(
				node.argument,
				new Map([[tail_synthetic_id.name, tail_synthetic_id]]),
			)
		) {
			return;
		}
		node.argument = append_loop_tail_to_return_argument(
			node.argument,
			tail_synthetic_id,
			tail_helper,
		);
		return;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			append_loop_tail_to_return_statement(
				child,
				tail_synthetic_id,
				tail_helper,
				inside_nested_function,
			);
		}
		return;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		append_loop_tail_to_return_statement(
			node[key],
			tail_synthetic_id,
			tail_helper,
			inside_nested_function,
		);
	}
}

/**
 * @param {any} return_argument
 * @param {AST.Identifier} tail_synthetic_id
 * @param {{ component_element: ESTreeJSX.JSXElement }} tail_helper
 * @returns {any}
 */
function append_loop_tail_to_return_argument(return_argument, tail_synthetic_id, tail_helper) {
	if (return_argument == null || is_null_literal(return_argument)) {
		return create_loop_tail_conditional(tail_synthetic_id, tail_helper);
	}

	return (
		build_return_expression([
			return_argument_to_render_node(return_argument),
			to_jsx_expression_container(create_loop_tail_expression(tail_synthetic_id, tail_helper)),
		]) || create_null_literal()
	);
}

/**
 * Build a `return <combined-render-fragment>;` statement, prepending any
 * `render_nodes` collected before the control-flow construct so they don't
 * get dropped on the lift path.
 *
 * @param {any[]} render_nodes
 * @param {any} jsx_child
 * @returns {any}
 */
function combined_return_statement(render_nodes, jsx_child) {
	return b.return(combine_render_return_argument(render_nodes, jsx_child));
}

/**
 * Hoist a for-of iteration source into a generated `let` and add a
 * normalization assignment via `Array.isArray(src) ? src : Array.from(src)`.
 * Always emits both — even when the source is already a simple identifier —
 * so the loop-scoped TS type aliases have a stable name to reference and the
 * runtime check skips the copy when the value is already an array.
 *
 * @param {AST.Identifier} source_id
 * @param {any} source_expr
 * @returns {{ source_decl: any, source_normalize_decl: any }}
 */
function build_array_normalization_decls(source_id, source_expr) {
	const source_decl = b.let(clone_identifier(source_id), clone_expression_node(source_expr));
	const is_array_call = b.call(b.member(b.id('Array'), 'isArray'), clone_identifier(source_id));
	const from_call = b.call(b.member(b.id('Array'), 'from'), clone_identifier(source_id));
	const normalized = b.conditional(is_array_call, clone_identifier(source_id), from_call);
	const source_normalize_decl = b.stmt(b.assignment('=', clone_identifier(source_id), normalized));

	return { source_decl, source_normalize_decl };
}

/**
 * @param {any} node
 * @param {any[]} continuation_body
 * @param {any[]} render_nodes
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function create_component_helper_split_returning_if_statements(
	node,
	continuation_body,
	render_nodes,
	transform_context,
) {
	const consequent_body = get_if_consequent_body(node);
	const return_index = consequent_body.findIndex(is_bare_return_statement);
	const branch_body =
		return_index === -1 ? consequent_body : consequent_body.slice(0, return_index);
	const branch_helper = create_hook_safe_helper(
		branch_body,
		undefined,
		node.consequent,
		transform_context,
	);
	const continuation_helper = create_hook_safe_helper(
		continuation_body,
		undefined,
		node,
		transform_context,
	);

	const branch_block = set_loc(
		b.block([
			...branch_helper.setup_statements,
			combined_return_statement(render_nodes, branch_helper.component_element),
		]),
		node.consequent,
	);

	return [
		set_loc(b.if(node.test, branch_block, null), node),
		...continuation_helper.setup_statements,
		combined_return_statement(render_nodes, continuation_helper.component_element),
	];
}

/**
 * Lift a non-returning `if` whose consequent contains hook calls plus the
 * statements that follow it into helper components.
 *
 * Without this, the consequent's hook would be wrapped into a child component
 * (StatementBodyHook) but any code after the `if` that reads bindings the hook
 * mutates would observe the pre-hook value, because React commits children
 * after their parent has finished rendering. The fix mirrors the early-return
 * splitter: emit a tail helper that owns the post-`if` statements, append a
 * call to it inside the branch helper so the post-hook bindings flow forward,
 * and render the tail helper directly when the `if` is false.
 *
 * @param {any} if_node
 * @param {any[]} continuation_body
 * @param {any[]} render_nodes
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function create_continuation_lift_if_statement(
	if_node,
	continuation_body,
	render_nodes,
	transform_context,
) {
	const consequent_body = get_if_consequent_body(if_node);
	const tail_helper = build_tail_helper(continuation_body, if_node, transform_context);
	const branch_helper = create_hook_safe_helper(
		append_tail_invocation(consequent_body, tail_helper),
		undefined,
		if_node.consequent,
		transform_context,
	);

	const branch_block = set_loc(
		b.block([
			...branch_helper.setup_statements,
			combined_return_statement(render_nodes, branch_helper.component_element),
		]),
		if_node.consequent,
	);

	return [
		...tail_helper.setup_statements,
		set_loc(b.if(if_node.test, branch_block, null), if_node),
		combined_return_statement(render_nodes, tail_helper.component_element),
	];
}

/**
 * Continuation lift for `try` / `try / pending / catch` statements. Same
 * shape as if/switch: build a tail helper from the post-`try` statements, and
 * append a clone of its invocation to the try body and the catch body so the
 * post-hook locals inside each branch flow forward into the tail. The pending
 * body is left untouched — when Suspense renders the pending fallback the
 * parent's render is unwound, so the tail wouldn't run in source semantics
 * either. Once augmented, the existing try transform builds the
 * Suspense / TsrxErrorBoundary wrapper as usual.
 *
 * @param {any} node - TryStatement
 * @param {any[]} continuation_body
 * @param {any[]} render_nodes
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function create_continuation_lift_try_statement(
	node,
	continuation_body,
	render_nodes,
	transform_context,
) {
	const tail_helper = build_tail_helper(continuation_body, node, transform_context);

	const augmented_block = {
		...node.block,
		body: append_tail_invocation(node.block.body || [], tail_helper),
	};

	let augmented_handler = node.handler;
	if (node.handler) {
		augmented_handler = {
			...node.handler,
			body: {
				...node.handler.body,
				body: append_tail_invocation(node.handler.body.body || [], tail_helper),
			},
		};
	}

	const augmented_try = {
		...node,
		block: augmented_block,
		handler: augmented_handler,
	};

	const try_jsx_child = (
		transform_context.platform.hooks?.controlFlow?.tryStatement ?? try_statement_to_jsx_child
	)(augmented_try, transform_context);

	return [...tail_helper.setup_statements, combined_return_statement(render_nodes, try_jsx_child)];
}

/**
 * @param {any} node - TryStatement
 * @param {TransformContext} transform_context
 * @returns {boolean}
 */
function try_statement_contains_hooks(node, transform_context) {
	if (body_contains_top_level_hook_call(node.block?.body || [], transform_context, true)) {
		return true;
	}
	if (
		node.handler &&
		body_contains_top_level_hook_call(node.handler.body?.body || [], transform_context, true)
	) {
		return true;
	}
	if (
		node.pending &&
		body_contains_top_level_hook_call(node.pending.body || [], transform_context, true)
	) {
		return true;
	}
	return false;
}

/**
 * Continuation lift for `switch` statements. Same shape as the if-version:
 * each case body is wrapped in its own helper component that ends with a
 * call to a shared tail helper, so post-hook bindings inside any case flow
 * forward to the statements after the switch. The fall-through return at
 * the end renders the tail helper directly, covering the case where no
 * `case` (and no `default`) matched.
 *
 * Empty fall-through cases (`case 'a':` with no body, falling through to
 * the next case) are preserved as-is — they must not get their own helper
 * because that would convert fall-through into early-return.
 *
 * @param {any} switch_node
 * @param {any[]} continuation_body
 * @param {any[]} render_nodes
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function create_continuation_lift_switch_statement(
	switch_node,
	continuation_body,
	render_nodes,
	transform_context,
) {
	const tail_helper = build_tail_helper(continuation_body, switch_node, transform_context);

	// Per-case info computed once: own body (statements before any
	// terminator) and whether the case has a `break` / `return`.
	const case_info = switch_node.cases.map((/** @type {any} */ c) => {
		const consequent = flatten_switch_consequent(c.consequent || []);
		const own_body = [];
		let own_has_terminator = false;
		for (const node of consequent) {
			if (node.type === 'BreakStatement' || node.type === 'ReturnStatement') {
				own_has_terminator = true;
				break;
			}
			own_body.push(node);
		}
		return { own_body, own_has_terminator };
	});

	// Allocate helper ids in source order (forward pass) so the snapshot's
	// `StatementBodyHook<N>` numbering reads top-to-bottom by case position.
	/** @type {Array<AST.Identifier | null>} */
	const helper_ids = case_info.map(
		(/** @type {{ own_body: any[], own_has_terminator: boolean }} */ info) =>
			info.own_body.length === 0
				? null
				: create_generated_identifier(create_local_statement_component_name(transform_context)),
	);

	// Build helpers in reverse order: each fall-through case's helper body
	// invokes the *next* case's helper, so the chain forwards post-mutation
	// locals through the switch. Reverse iteration ensures the next helper's
	// component_element is already constructed when we need to embed it.
	/** @type {Array<{ setup_statements: any[], component_element: any } | null>} */
	const case_helper_by_index = new Array(switch_node.cases.length).fill(null);
	for (let i = switch_node.cases.length - 1; i >= 0; i--) {
		const { own_body, own_has_terminator } = case_info[i];
		if (own_body.length === 0) continue;

		// Determine the downstream helper this case invokes after its own body.
		// - With a terminator: invoke the tail helper directly (case exits switch).
		// - Otherwise (fall-through): invoke the next non-empty case's helper,
		//   or the tail if nothing else follows.
		let downstream;
		if (own_has_terminator) {
			downstream = tail_helper;
		} else {
			let next_helper = null;
			for (let j = i + 1; j < switch_node.cases.length; j++) {
				if (case_helper_by_index[j]) {
					next_helper = case_helper_by_index[j];
					break;
				}
			}
			downstream = next_helper ?? tail_helper;
		}

		case_helper_by_index[i] = create_hook_safe_helper(
			append_tail_invocation(own_body, downstream),
			undefined,
			switch_node.cases[i],
			transform_context,
			/** @type {any} */ (helper_ids[i]),
		);
	}

	const new_cases = switch_node.cases.map(
		(/** @type {any} */ original_case, /** @type {number} */ i) => {
			const helper = case_helper_by_index[i];
			if (helper) {
				return b.switch_case(original_case.test, [
					combined_return_statement(render_nodes, helper.component_element),
				]);
			}

			const { own_body, own_has_terminator } = case_info[i];
			if (own_body.length === 0 && own_has_terminator) {
				// `case 'a': break;` — exits the switch, then runs the tail.
				return b.switch_case(original_case.test, [
					combined_return_statement(render_nodes, tail_helper.component_element),
				]);
			}
			// Genuine empty fall-through (`case 'a': case 'b': ...`).
			return b.switch_case(original_case.test, []);
		},
	);

	// Hoist all case helpers' setup statements above the switch in source
	// order so the switch body is purely a dispatcher.
	const case_helper_setup_statements = [];
	for (const helper of case_helper_by_index) {
		if (helper) case_helper_setup_statements.push(...helper.setup_statements);
	}

	return [
		...tail_helper.setup_statements,
		...case_helper_setup_statements,
		set_loc(b.switch(switch_node.discriminant, new_cases), switch_node),
		combined_return_statement(render_nodes, tail_helper.component_element),
	];
}

/**
 * Hoist the helper for a hook-bearing for-of body out of the iteration
 * callback so the helper is declared once per render rather than re-bound on
 * every iteration. Loop-scoped param types are derived from the iteration
 * source via a TS `type` alias (rather than the const+typeof pattern used
 * for outer bindings, which would require the loop var to be in scope).
 *
 * The iteration source is hoisted into a generated `let` and normalized via
 * `Array.isArray(src) ? src : Array.from(src)` so any Iterable / ArrayLike
 * works while skipping the copy when the source is already an array. The
 * iteration itself is emitted as `source.map((item, i) => ...)`.
 *
 * If `continuation_body` is non-empty (the for-of has a tail) we also lift
 * the tail into a TailHelper and call it conditionally on the last iteration
 * via an `isLast={i === source.length - 1}` prop on the loop helper. The
 * loop helper's mutated locals (post-`useState`) flow into the TailHelper as
 * its props. When the source is empty, `.map` returns `[]` and the TailHelper
 * never renders — we add a sibling fallback so the source's tail still runs
 * with the original outer values in that case.
 *
 * Bails out (returns null) when the loop pattern is destructured — deriving
 * element types from a tuple/object pattern is more involved and deferred.
 *
 * @param {any} node - ForOfStatement
 * @param {any[]} continuation_body
 * @param {TransformContext} transform_context
 * @returns {{ hoist_statements: any[], jsx_child: any } | null}
 */
function build_hoisted_for_of_with_hooks(node, continuation_body, transform_context) {
	const loop_params = get_for_of_iteration_params(node.left, node.index);
	for (const param of loop_params) {
		if (param.type !== 'Identifier') return null;
	}

	const has_tail = continuation_body.length > 0;
	const original_loop_body = /** @type {any[]} */ (
		rewrite_loop_continues_to_bare_returns(
			node.body.type === 'BlockStatement' ? node.body.body : [node.body],
		)
	);

	// When there's a tail, build TailHelper first so its component_element can
	// be embedded inside the loop helper's body (gated on isLast). The
	// synthetic isLast prop uses the loop helper's index (which will be the
	// next one assigned, since `create_hook_safe_helper` for the tail just
	// consumed one) so it lines up with `StatementBodyHook<N>` in the output.
	let tail_helper = null;
	/** @type {AST.Identifier} */ let tail_synthetic_id;
	if (has_tail) {
		tail_helper = build_tail_helper(continuation_body, node, transform_context);
		tail_synthetic_id = create_generated_identifier(
			`_tsrx_isLast_${transform_context.local_statement_component_index + 1}`,
		);
	} else {
		tail_synthetic_id = /** @type {any} */ (null);
	}
	const loop_tail_expression = has_tail
		? create_loop_tail_expression(tail_synthetic_id, /** @type {any} */ (tail_helper))
		: null;
	const loop_body =
		has_tail && loop_tail_expression
			? [...original_loop_body, b.jsx_expression_container(loop_tail_expression)]
			: original_loop_body;

	const source_id = create_generated_identifier(
		`_tsrx_iteration_items_${transform_context.local_statement_component_index + 1}`,
	);
	const { source_decl, source_normalize_decl } = build_array_normalization_decls(
		source_id,
		node.right,
	);

	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);
	for (const param of loop_params) {
		collect_pattern_bindings(param, transform_context.available_bindings);
	}

	const all_helper_bindings = get_referenced_helper_bindings(
		loop_body,
		transform_context.available_bindings,
	);
	const loop_scoped_names = new Set(loop_params.map((/** @type {any} */ p) => p.name));
	const outer_bindings = all_helper_bindings.filter((b) => !loop_scoped_names.has(b.name));
	const loop_bindings = all_helper_bindings.filter((b) => loop_scoped_names.has(b.name));

	const helper_id = create_generated_identifier(
		create_local_statement_component_name(transform_context),
	);

	const outer_aliases = outer_bindings.map((binding) =>
		create_helper_type_alias_declaration(helper_id, binding),
	);
	const loop_aliases = loop_bindings.map((binding) =>
		create_loop_scoped_type_alias_declaration(helper_id, binding, source_id, loop_params),
	);

	// Synthetic `isLast` prop on the loop helper when there's a tail. It's
	// passed from the .map callback as `i === source.length - 1` so every
	// loop-helper return can append the tail helper on the last iteration.
	const tail_isLast_alias = has_tail
		? {
				id: create_generated_identifier(`_tsrx_${helper_id.name}_isLast`),
				declaration: b.ts_type_alias(
					create_generated_identifier(`_tsrx_${helper_id.name}_isLast`),
					b.ts_keyword_type('boolean'),
				),
			}
		: null;

	const ordered_bindings = [...outer_bindings, ...loop_bindings];
	const ordered_aliases = [...outer_aliases, ...loop_aliases];
	const ordered_use_typeof = [...outer_bindings.map(() => true), ...loop_bindings.map(() => false)];

	const signature_bindings = has_tail ? [...ordered_bindings, tail_synthetic_id] : ordered_bindings;
	const signature_aliases = has_tail
		? [...ordered_aliases, /** @type {any} */ (tail_isLast_alias)]
		: ordered_aliases;
	const signature_use_typeof = has_tail ? [...ordered_use_typeof, false] : ordered_use_typeof;

	const props_type =
		signature_bindings.length > 0
			? create_helper_props_type_literal_with_typeof_flags(
					signature_bindings,
					signature_aliases,
					signature_use_typeof,
				)
			: null;
	const params =
		props_type !== null ? [create_typed_helper_props_pattern(signature_bindings, props_type)] : [];

	const fn_saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(fn_saved_bindings);
	if (has_tail) {
		transform_context.available_bindings.set(tail_synthetic_id.name, tail_synthetic_id);
	}
	const fn_body_statements = build_render_statements(loop_body, true, transform_context);
	if (has_tail) {
		append_loop_tail_to_return_statements(
			fn_body_statements,
			tail_synthetic_id,
			/** @type {any} */ (tail_helper),
		);
	}
	transform_context.available_bindings = fn_saved_bindings;

	const helper_fn = /** @type {any} */ (
		b.function(clone_identifier(helper_id), params, b.block(fn_body_statements))
	);
	helper_fn.metadata = { path: [], is_component: true, is_method: false };

	let helper_decl;
	if (transform_context.helper_state) {
		const cache_id = create_generated_identifier(
			`${transform_context.helper_state.base_name}__${helper_id.name}`,
		);
		transform_context.helper_state.helpers.push(create_helper_cache_declaration(cache_id));
		helper_decl = create_cached_helper_declaration(
			helper_id,
			cache_id,
			create_helper_init_expression(helper_id, helper_fn, node, transform_context),
		);
	} else {
		helper_decl = create_helper_declaration(helper_id, helper_fn, node, transform_context);
	}

	transform_context.available_bindings = saved_bindings;

	const callback_invocation_element = create_helper_component_element(
		helper_id,
		ordered_bindings,
		node,
		{ mapWrapper: false, mapBindingNames: false, mapBindingValues: false },
	);

	// When there's a tail, the .map callback always needs an index to compute
	// `isLast`. If the user didn't write `index i`, synthesize one. The same
	// identifier is also used as the implicit key fallback below.
	let index_identifier;
	if (loop_params.length >= 2) {
		index_identifier = clone_identifier(loop_params[1]);
	} else if (has_tail) {
		index_identifier = create_generated_identifier('i');
	} else {
		index_identifier = null;
	}

	const body_key_expression = find_key_expression_in_body(original_loop_body);
	const explicit_key_expression =
		body_key_expression ?? (node.key ? clone_expression_node(node.key) : undefined);
	const key_expression =
		explicit_key_expression ??
		(loop_params.length >= 2 ? clone_identifier(loop_params[1]) : undefined);
	if (key_expression) {
		callback_invocation_element.openingElement.attributes.push(
			b.jsx_attribute(b.jsx_id('key'), to_jsx_expression_container(key_expression, key_expression)),
		);
	}

	if (has_tail && index_identifier) {
		const length_minus_one = b.binary(
			'-',
			b.member(clone_identifier(source_id), 'length'),
			b.literal(1),
		);
		callback_invocation_element.openingElement.attributes.push(
			b.jsx_attribute(
				b.jsx_id(tail_synthetic_id.name),
				to_jsx_expression_container(
					b.binary('===', clone_identifier(index_identifier), length_minus_one),
				),
			),
		);
	}

	const callback_params =
		has_tail && loop_params.length < 2 && index_identifier
			? [
					...loop_params.map((/** @type {any} */ p) => clone_identifier(p)),
					clone_identifier(index_identifier),
				]
			: loop_params.map((/** @type {any} */ p) => clone_identifier(p));

	const iter_callback = b.arrow(callback_params, callback_invocation_element);

	const map_call = b.call(b.member(clone_identifier(source_id), 'map'), iter_callback);

	// jsx_child for the iteration. When there's a tail, also render the tail
	// helper directly when the source is empty (no iterations means the loop
	// helper never fires, so the tail wouldn't run otherwise).
	const jsx_child = has_tail
		? to_jsx_expression_container(
				b.conditional(
					b.binary('===', b.member(clone_identifier(source_id), 'length'), b.literal(0)),
					clone_tail_invocation(/** @type {any} */ (tail_helper)),
					map_call,
				),
				node,
			)
		: to_jsx_expression_container(map_call, node);

	const hoist_statements = [source_decl, source_normalize_decl];
	if (has_tail) {
		// TailHelper's setup statements (its alias consts and cache decl).
		hoist_statements.push(.../** @type {any} */ (tail_helper).setup_statements);
	}
	for (const alias of ordered_aliases) hoist_statements.push(alias.declaration);
	if (has_tail && tail_isLast_alias) {
		hoist_statements.push(tail_isLast_alias.declaration);
	}
	hoist_statements.push(helper_decl);

	return {
		hoist_statements,
		jsx_child,
	};
}

/**
 * Build a TS `type` alias for a loop-scoped binding, deriving the type
 * from the iteration source. For the value param we use
 * `(typeof source)[number]`, which gives the right element type for arrays
 * and tuples (the common case in JSX templates). For the index param,
 * the type is always `number`.
 *
 * @param {AST.Identifier} helper_id
 * @param {AST.Identifier} binding
 * @param {AST.Identifier} source_id
 * @param {any[]} loop_params
 * @returns {{ id: AST.Identifier, declaration: any }}
 */
function create_loop_scoped_type_alias_declaration(helper_id, binding, source_id, loop_params) {
	const alias_id = create_generated_identifier(`_tsrx_${helper_id.name}_${binding.name}`);
	const is_index = loop_params.length > 1 && binding.name === loop_params[1].name;
	const type_annotation = is_index
		? b.ts_keyword_type('number')
		: /** @type {any} */ ({
				type: 'TSIndexedAccessType',
				objectType: b.ts_type_query(clone_identifier(source_id)),
				indexType: b.ts_keyword_type('number'),
				metadata: { path: [] },
			});

	return {
		id: alias_id,
		declaration: b.ts_type_alias(clone_identifier(alias_id), type_annotation),
	};
}

/**
 * Variant of {@link create_helper_props_type_literal} that lets each
 * binding's type reference the alias either via `typeof <alias>` (for
 * outer-scope const aliases) or directly as `<alias>` (for TS `type`
 * aliases derived from a loop source).
 *
 * @param {AST.Identifier[]} bindings
 * @param {{ id: AST.Identifier }[]} aliases
 * @param {boolean[]} use_typeof
 * @returns {any}
 */
function create_helper_props_type_literal_with_typeof_flags(bindings, aliases, use_typeof) {
	return b.ts_type_literal(
		bindings.map((binding, i) => {
			const alias_ref = use_typeof[i]
				? b.ts_type_query(clone_identifier(aliases[i].id))
				: b.ts_type_reference(clone_identifier(aliases[i].id));
			return b.ts_property_signature(
				create_generated_identifier(binding.name),
				b.ts_type_annotation(alias_ref),
			);
		}),
	);
}

/**
 * @param {any} node
 * @param {any[]} continuation_body
 * @param {any[]} render_nodes
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function create_setup_once_helper_split_returning_if_statements(
	node,
	continuation_body,
	render_nodes,
	transform_context,
) {
	const consequent_body = get_if_consequent_body(node);
	const return_index = consequent_body.findIndex(is_bare_return_statement);
	const branch_body =
		return_index === -1 ? consequent_body : consequent_body.slice(0, return_index);
	const branch_helper = branch_body.length
		? create_hook_safe_helper(branch_body, undefined, node.consequent, transform_context)
		: { setup_statements: [], component_element: create_null_literal() };
	const continuation_helper = continuation_body.length
		? create_hook_safe_helper(continuation_body, undefined, node, transform_context)
		: { setup_statements: [], component_element: create_null_literal() };

	return [
		...branch_helper.setup_statements,
		...continuation_helper.setup_statements,
		{
			type: 'ReturnStatement',
			argument: combine_render_return_argument(
				render_nodes,
				set_loc(
					/** @type {any} */ ({
						type: 'ConditionalExpression',
						test: node.test,
						consequent: branch_helper.component_element,
						alternate: continuation_helper.component_element,
						metadata: { path: [] },
					}),
					node,
				),
			),
			metadata: { path: [] },
		},
	];
}

/**
 * @param {any[]} statements
 * @param {any[]} render_nodes
 * @returns {void}
 */
function prepend_render_nodes_to_return_statements(statements, render_nodes) {
	if (render_nodes.length === 0) {
		return;
	}

	for (const statement of statements) {
		prepend_render_nodes_to_return_statement(statement, render_nodes, false);
	}
}

/**
 * @param {any} node
 * @param {any[]} render_nodes
 * @param {boolean} inside_nested_function
 * @returns {void}
 */
function prepend_render_nodes_to_return_statement(node, render_nodes, inside_nested_function) {
	if (!node || typeof node !== 'object') {
		return;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		inside_nested_function = true;
	}

	if (!inside_nested_function && node.type === 'ReturnStatement') {
		node.argument = combine_render_return_argument(render_nodes, node.argument);
		return;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			prepend_render_nodes_to_return_statement(child, render_nodes, inside_nested_function);
		}
		return;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		prepend_render_nodes_to_return_statement(node[key], render_nodes, inside_nested_function);
	}
}

/**
 * @param {any[]} render_nodes
 * @param {any} return_argument
 * @returns {any}
 */
function combine_render_return_argument(render_nodes, return_argument) {
	const combined = render_nodes.map((node) => clone_expression_node_without_locations(node));

	if (return_argument != null && !is_null_literal(return_argument)) {
		combined.push(return_argument_to_render_node(return_argument));
	}

	return build_return_expression(combined) || create_null_literal();
}

/**
 * @param {any} argument
 * @returns {any}
 */
function return_argument_to_render_node(argument) {
	if (
		argument?.type === 'JSXElement' ||
		argument?.type === 'JSXFragment' ||
		argument?.type === 'JSXExpressionContainer'
	) {
		return argument;
	}

	return to_jsx_expression_container(argument);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_null_literal(node) {
	return node?.type === 'Literal' && node.value == null;
}

/**
 * @param {any} node
 * @returns {any}
 */
function clone_expression_node_without_locations(node) {
	if (!node || typeof node !== 'object') return node;
	if (Array.isArray(node)) return node.map(clone_expression_node_without_locations);

	const clone = { ...node };
	delete clone.loc;
	delete clone.start;
	delete clone.end;

	for (const key of Object.keys(clone)) {
		if (key === 'metadata') {
			clone.metadata = clone.metadata ? { ...clone.metadata } : { path: [] };
			continue;
		}
		clone[key] = clone_expression_node_without_locations(clone[key]);
	}

	return clone;
}

const TEMPLATE_FRAGMENT_ERROR =
	'JSX fragment syntax is not needed in TSRX templates. TSRX renders in immediate mode, so everything is already a fragment. Use `<>...</>` only within <tsx>...</tsx>.';

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_element(node, transform_context, raw_children = node.children || []) {
	if (node.type === 'JSXElement') return node;
	if (!node.id) {
		error(
			TEMPLATE_FRAGMENT_ERROR,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXFragment',
				openingFragment: { type: 'JSXOpeningFragment' },
				closingFragment: { type: 'JSXClosingFragment' },
				children: [],
			}),
			node,
		);
	}
	if (is_dynamic_element_id(node.id)) {
		return dynamic_element_to_jsx_child(node, transform_context);
	}

	const name = identifier_to_jsx_name(node.id);
	const attributes = transform_element_attributes_dispatch(
		node.attributes || [],
		transform_context,
		node,
	);
	const walked_children = node.children || [];
	let selfClosing = !!node.selfClosing;
	let children;
	const child_transform = transform_context.platform.hooks?.transformElementChildren?.(
		node,
		walked_children,
		raw_children,
		attributes,
		transform_context,
	);

	if (child_transform) {
		children = child_transform.children;
		if (typeof child_transform.selfClosing === 'boolean') {
			selfClosing = child_transform.selfClosing;
		}
	} else {
		if (walked_children.some((/** @type {any} */ c) => c && c.type === 'Html')) {
			throw new Error(
				`\`{html ...}\` is not supported on the ${transform_context.platform.name} target. Use \`dangerouslySetInnerHTML={{ __html: ... }}\` as an element attribute instead.`,
			);
		}
		children = create_element_children(walked_children, transform_context);
	}
	const has_unmappable_attribute = attributes.some(
		(/** @type {any} */ attribute) => attribute?.metadata?.has_unmappable_value,
	);

	const opening_element_node = b.jsx_opening_element(
		name,
		attributes,
		selfClosing,
		node.openingElement?.typeArguments,
	);
	const openingElement = has_unmappable_attribute
		? opening_element_node
		: set_loc(opening_element_node, node.openingElement || node);

	const closingElement = selfClosing
		? null
		: set_loc(
				b.jsx_closing_element(
					clone_jsx_name(name, node.closingElement?.name || node.closingElement || node),
				),
				node.closingElement || node,
			);

	return set_loc(b.jsx_element_fresh(openingElement, closingElement, children), node);
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
		const saved_inside_element_child = transform_context.inside_element_child;
		transform_context.inside_element_child = true;
		try {
			return children.map((/** @type {any} */ child) => to_jsx_child(child, transform_context));
		} finally {
			transform_context.inside_element_child = saved_inside_element_child;
		}
	}

	const saved_inside_element_child = transform_context.inside_element_child;
	transform_context.inside_element_child = true;
	try {
		return [statement_body_to_jsx_child(children, transform_context)];
	} finally {
		transform_context.inside_element_child = saved_inside_element_child;
	}
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
	if (body_contains_top_level_hook_call(body_nodes, transform_context, true)) {
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
	const helper = create_hook_safe_helper(body_nodes, undefined, source_node, transform_context);

	return to_jsx_expression_container(
		create_hook_safe_helper_iife(helper.setup_statements, helper.component_element),
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
	const helper = create_hook_safe_helper(
		body_nodes,
		key_expression,
		source_node,
		transform_context,
	);
	const statements = [...helper.setup_statements];

	statements.push({
		type: 'ReturnStatement',
		argument: helper.component_element,
		metadata: { path: [] },
	});

	return statements;
}

/**
 * @param {any[]} body_nodes
 * @param {Map<string, AST.Identifier>} available_bindings
 * @returns {AST.Identifier[]}
 */
function get_referenced_helper_bindings(body_nodes, available_bindings) {
	const helper_bindings = [];
	const local_bindings = new Map();

	for (const node of body_nodes) {
		collect_statement_bindings(node, local_bindings);
	}

	for (const [name, binding] of available_bindings) {
		if (local_bindings.has(name)) continue;

		if (references_scope_bindings(body_nodes, new Map([[name, binding]]))) {
			helper_bindings.push(binding);
		}
	}

	return helper_bindings;
}

/**
 * @param {any[]} body_nodes
 * @param {any} key_expression
 * @param {any} source_node
 * @param {TransformContext} transform_context
 * @param {AST.Identifier} [preallocated_helper_id] - Optional pre-allocated id.
 *   Used by the switch lift's chained-call build, which allocates ids in
 *   source order in a forward pass and then constructs helpers in reverse so
 *   each fall-through case can reference the next case's component element.
 * @returns {{ setup_statements: any[], component_element: ESTreeJSX.JSXElement }}
 */
function create_hook_safe_helper(
	body_nodes,
	key_expression,
	source_node,
	transform_context,
	preallocated_helper_id,
) {
	const helper_id =
		preallocated_helper_id ??
		create_generated_identifier(create_local_statement_component_name(transform_context));
	const helper_bindings = get_referenced_helper_bindings(
		body_nodes,
		transform_context.available_bindings,
	);
	const aliases = helper_bindings.map((binding) =>
		create_helper_type_alias_declaration(helper_id, binding),
	);
	const props_type =
		helper_bindings.length > 0 ? create_helper_props_type_literal(helper_bindings, aliases) : null;
	const params =
		props_type !== null ? [create_typed_helper_props_pattern(helper_bindings, props_type)] : [];

	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);

	const helper_fn = /** @type {any} */ ({
		type: 'FunctionExpression',
		id: clone_identifier(helper_id),
		params,
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
	});

	transform_context.available_bindings = saved_bindings;

	const component_element = create_helper_component_element(
		helper_id,
		helper_bindings,
		source_node,
		{
			mapWrapper: false,
			mapBindingNames: false,
			mapBindingValues: false,
		},
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

	if (!transform_context.helper_state) {
		return {
			setup_statements: [
				...aliases.map((alias) => alias.declaration),
				create_helper_declaration(helper_id, helper_fn, source_node, transform_context),
			],
			component_element,
		};
	}

	const cache_id = create_generated_identifier(
		`${transform_context.helper_state.base_name}__${helper_id.name}`,
	);
	transform_context.helper_state.helpers.push(create_helper_cache_declaration(cache_id));

	return {
		setup_statements: [
			...aliases.map((alias) => alias.declaration),
			create_cached_helper_declaration(
				helper_id,
				cache_id,
				create_helper_init_expression(helper_id, helper_fn, source_node, transform_context),
			),
		],
		component_element,
	};
}

/**
 * @param {AST.Identifier} helper_id
 * @param {any} helper_fn
 * @param {any} source_node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_helper_declaration(helper_id, helper_fn, source_node, transform_context) {
	const declaration = create_helper_function_declaration_from_expression(helper_id, helper_fn);
	const hook = transform_context.platform.hooks?.wrapHelperComponent;
	return hook ? hook(declaration, helper_id, transform_context, source_node) : declaration;
}

/**
 * @param {AST.Identifier} helper_id
 * @param {any} helper_fn
 * @param {any} source_node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_helper_init_expression(helper_id, helper_fn, source_node, transform_context) {
	const hook = transform_context.platform.hooks?.wrapHelperComponent;
	if (!hook) return helper_fn;

	const declaration = hook(
		create_helper_function_declaration_from_expression(helper_id, helper_fn),
		helper_id,
		transform_context,
		source_node,
	);
	if (declaration?.type === 'VariableDeclaration') {
		const init = declaration.declarations?.[0]?.init;
		if (init) return init;
	}

	return helper_fn;
}

/**
 * @param {any[]} setup_statements
 * @param {ESTreeJSX.JSXElement} component_element
 * @returns {any}
 */
function create_hook_safe_helper_iife(setup_statements, component_element) {
	return /** @type {any} */ ({
		type: 'CallExpression',
		callee: {
			type: 'ArrowFunctionExpression',
			params: [],
			body: /** @type {any} */ ({
				type: 'BlockStatement',
				body: [
					...setup_statements,
					{
						type: 'ReturnStatement',
						argument: component_element,
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
	});
}

/**
 * @param {AST.Identifier} helper_id
 * @param {AST.Identifier} binding
 * @returns {{ id: AST.Identifier, declaration: any }}
 */
function create_helper_type_alias_declaration(helper_id, binding) {
	const alias_id = create_generated_identifier(`_tsrx_${helper_id.name}_${binding.name}`);

	return {
		id: alias_id,
		declaration: /** @type {any} */ ({
			type: 'VariableDeclaration',
			kind: 'const',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: clone_identifier(alias_id),
					init: create_generated_identifier(binding.name),
					metadata: { path: [] },
				},
			],
			metadata: { path: [] },
		}),
	};
}

/**
 * @param {AST.Identifier[]} bindings
 * @param {{ id: AST.Identifier }[]} aliases
 * @returns {any}
 */
function create_helper_props_type_literal(bindings, aliases) {
	return /** @type {any} */ ({
		type: 'TSTypeLiteral',
		members: bindings.map(
			(binding, i) =>
				/** @type {any} */ ({
					type: 'TSPropertySignature',
					key: create_generated_identifier(binding.name),
					computed: false,
					optional: false,
					readonly: false,
					static: false,
					kind: 'init',
					typeAnnotation: {
						type: 'TSTypeAnnotation',
						typeAnnotation: {
							type: 'TSTypeQuery',
							exprName: clone_identifier(aliases[i].id),
							typeArguments: null,
							metadata: { path: [] },
						},
						metadata: { path: [] },
					},
					metadata: { path: [] },
				}),
		),
		metadata: { path: [] },
	});
}

/**
 * @param {AST.Identifier[]} bindings
 * @param {any} props_type
 * @returns {AST.ObjectPattern}
 */
function create_typed_helper_props_pattern(bindings, props_type) {
	const pattern = create_helper_props_pattern(bindings);
	/** @type {any} */ (pattern).typeAnnotation = {
		type: 'TSTypeAnnotation',
		typeAnnotation: props_type,
		metadata: { path: [] },
	};
	return pattern;
}

/**
 * @param {AST.Identifier} cache_id
 * @returns {any}
 */
function create_helper_cache_declaration(cache_id) {
	return /** @type {any} */ ({
		type: 'VariableDeclaration',
		kind: 'let',
		declarations: [
			{
				type: 'VariableDeclarator',
				id: clone_identifier(cache_id),
				init: null,
				metadata: { path: [] },
			},
		],
		metadata: { path: [] },
	});
}

/**
 * @param {AST.Identifier} helper_id
 * @param {AST.Identifier} cache_id
 * @param {any} helper_init
 * @returns {any}
 */
function create_cached_helper_declaration(helper_id, cache_id, helper_init) {
	return /** @type {any} */ ({
		type: 'VariableDeclaration',
		kind: 'const',
		declarations: [
			{
				type: 'VariableDeclarator',
				id: clone_identifier(helper_id),
				init: {
					type: 'LogicalExpression',
					operator: '??',
					left: clone_identifier(cache_id),
					right: {
						type: 'AssignmentExpression',
						operator: '=',
						left: clone_identifier(cache_id),
						right: helper_init,
						metadata: { path: [] },
					},
					metadata: { path: [] },
				},
				metadata: { path: [] },
			},
		],
		metadata: { path: [] },
	});
}

/**
 * @param {AST.Identifier} helper_id
 * @param {any} helper_fn
 * @returns {AST.FunctionDeclaration}
 */
function create_helper_function_declaration_from_expression(helper_id, helper_fn) {
	return /** @type {any} */ ({
		...helper_fn,
		type: 'FunctionDeclaration',
		id: clone_identifier(helper_id),
	});
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
 * @param {any[]} path
 */
function validate_style_directive(node, transform_context, path) {
	const { attribute, element } = get_style_attribute_context(node, path);

	if (!attribute) {
		error(
			'`{style "class_name"}` can only be used as an element attribute value.',
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
	}

	if (element && is_dom_style_target(element)) {
		error(
			'`{style "class_name"}` cannot be used directly on DOM elements. Pass the class to a child component instead.',
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
	}

	if (!transform_context.current_css_hash) {
		error(
			'`{style "class_name"}` requires a <style> block in the current component.',
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
	}
}

/**
 * @param {any} node
 * @param {any[]} path
 * @returns {{ attribute: any, element: any }}
 */
function get_style_attribute_context(node, path) {
	const parent = path.at(-1);
	const attribute =
		parent?.type === 'Attribute' && parent.value === node
			? parent
			: path
					.findLast((ancestor) => ancestor?.type === 'Element')
					?.attributes?.find(
						(/** @type {any} */ attr) =>
							attr?.type === 'Attribute' &&
							(attr.value === node || node_contains(attr.value, node)),
					);
	const element = path.findLast(
		(ancestor) =>
			ancestor?.type === 'Element' &&
			(!attribute || ancestor.attributes?.some((/** @type {any} */ attr) => attr === attribute)),
	);

	return { attribute: attribute ?? null, element: element ?? null };
}

/**
 * @param {any} root
 * @param {any} target
 * @returns {boolean}
 */
function node_contains(root, target) {
	if (!root || typeof root !== 'object') {
		return false;
	}
	if (root === target) {
		return true;
	}
	if (Array.isArray(root)) {
		return root.some((child) => node_contains(child, target));
	}
	for (const key of Object.keys(root)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (node_contains(root[key], target)) {
			return true;
		}
	}
	return false;
}

/**
 * @param {any} element
 * @returns {boolean}
 */
function is_dom_style_target(element) {
	if (!element?.id || is_dynamic_element_id(element.id)) {
		return false;
	}
	return element.id.type === 'Identifier' && /^[a-z]/.test(element.id.name);
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
			// We're inside a JSX child position by construction, so keep a
			// JSXExpressionContainer wrapper for bare `{expr}` children.
			return tsx_node_to_jsx_expression(node, true);
		case 'TsxCompat':
			return tsx_compat_node_to_jsx_expression(node, transform_context, true);
		case 'Element':
			return to_jsx_element(node, transform_context);
		case 'Text':
			return to_jsx_expression_container(to_text_expression(node.expression, node), node);
		case 'TSRXExpression':
			return to_jsx_expression_container(node.expression, node);
		case 'Html':
			throw new Error(
				`\`{html ...}\` is not supported on the ${transform_context.platform.name} target. Use \`dangerouslySetInnerHTML={{ __html: ... }}\` as an element attribute instead.`,
			);
		case 'IfStatement':
			return (
				transform_context.platform.hooks?.controlFlow?.ifStatement ?? if_statement_to_jsx_child
			)(node, transform_context);
		case 'ForOfStatement':
			return (
				transform_context.platform.hooks?.controlFlow?.forOf ?? for_of_statement_to_jsx_child
			)(node, transform_context);
		case 'SwitchStatement':
			return (
				transform_context.platform.hooks?.controlFlow?.switchStatement ??
				switch_statement_to_jsx_child
			)(node, transform_context);
		case 'TryStatement':
			return (
				transform_context.platform.hooks?.controlFlow?.tryStatement ?? try_statement_to_jsx_child
			)(node, transform_context);
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
	const render_if_statement = create_render_if_statement(node, transform_context);
	const conditional_expression = render_if_statement_to_conditional_expression(render_if_statement);
	if (conditional_expression) {
		return to_jsx_expression_container(conditional_expression, node);
	}

	return to_jsx_expression_container(
		/** @type {any} */ ({
			type: 'CallExpression',
			callee: {
				type: 'ArrowFunctionExpression',
				params: [],
				body: /** @type {any} */ ({
					type: 'BlockStatement',
					body: [render_if_statement, create_null_return_statement()],
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
 * @param {any} node
 * @returns {any | null}
 */
function render_if_statement_to_conditional_expression(node) {
	if (!node || node.type !== 'IfStatement') return null;

	const consequent = block_statement_to_return_expression(node.consequent);
	if (!consequent) return null;

	let alternate = create_null_literal();
	if (node.alternate) {
		if (node.alternate.type === 'IfStatement') {
			alternate = render_if_statement_to_conditional_expression(node.alternate);
			if (!alternate) return null;
		} else {
			alternate = block_statement_to_return_expression(node.alternate);
			if (!alternate) return null;
		}
	}

	return set_loc(
		/** @type {any} */ ({
			type: 'ConditionalExpression',
			test: node.test,
			consequent,
			alternate,
			metadata: { path: [] },
		}),
		node,
	);
}

/**
 * @param {any} block
 * @returns {any | null}
 */
function block_statement_to_return_expression(block) {
	if (!block || block.type !== 'BlockStatement' || block.body.length === 0) {
		return null;
	}

	const statement = block.body[block.body.length - 1];
	if (!statement || statement.type !== 'ReturnStatement') {
		return null;
	}

	const argument = statement.argument || create_null_literal();
	if (block.body.length === 1) {
		return argument;
	}

	return create_hook_safe_helper_iife(block.body.slice(0, -1), argument);
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
 * @param {any} source_node
 * @returns {any}
 */
function continue_to_bare_return(source_node) {
	return set_loc(
		/** @type {any} */ ({
			type: 'ReturnStatement',
			argument: null,
			metadata: { path: [] },
		}),
		source_node,
	);
}

/**
 * `continue` in a component `for...of` body means "skip this item". JSX targets
 * lower `for...of` to callbacks, so a raw ContinueStatement would be invalid JS;
 * a bare `return` from the callback preserves the item-skip behavior.
 *
 * @param {any[] | any} node
 * @param {boolean} [is_root]
 * @returns {any[] | any}
 */
export function rewrite_loop_continues_to_bare_returns(node, is_root = true) {
	if (Array.isArray(node)) {
		return node.map((child) => rewrite_loop_continues_to_bare_returns(child, false));
	}

	if (!node || typeof node !== 'object') {
		return node;
	}

	if (node.type === 'ContinueStatement') {
		return continue_to_bare_return(node);
	}

	if (is_function_or_class_boundary(node) || (!is_root && is_loop_statement(node))) {
		return node;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		node[key] = rewrite_loop_continues_to_bare_returns(node[key], false);
	}

	return node;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_loop_statement(node) {
	return (
		node?.type === 'ForOfStatement' ||
		node?.type === 'ForStatement' ||
		node?.type === 'ForInStatement' ||
		node?.type === 'WhileStatement' ||
		node?.type === 'DoWhileStatement'
	);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function for_of_statement_to_jsx_child(node, transform_context) {
	if (node.await) {
		error(
			`${transform_context.platform.name} TSRX does not support \`for await...of\` in component templates.`,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
	}

	const loop_params = get_for_of_iteration_params(node.left, node.index);
	const loop_body = /** @type {any[]} */ (
		rewrite_loop_continues_to_bare_returns(
			node.body.type === 'BlockStatement' ? node.body.body : [node.body],
		)
	);
	const has_hooks = body_contains_top_level_hook_call(loop_body, transform_context, true);
	const body_key_expression = find_key_expression_in_body(loop_body);
	const explicit_key_expression =
		body_key_expression ?? (node.key ? clone_expression_node(node.key) : undefined);
	const key_expression =
		has_hooks && explicit_key_expression == null && node.index
			? clone_expression_node(node.index)
			: explicit_key_expression;
	const implicit_non_hook_key_expression =
		!has_hooks && body_key_expression == null
			? node.key
				? clone_expression_node(node.key)
				: node.index
					? clone_expression_node(node.index)
					: undefined
			: undefined;

	// Add loop params to available bindings so hoisted helpers receive them as props
	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);
	for (const param of loop_params) {
		collect_pattern_bindings(param, transform_context.available_bindings);
	}

	if (implicit_non_hook_key_expression && should_apply_key_to_loop_body(loop_body)) {
		apply_key_to_loop_body(loop_body, implicit_non_hook_key_expression);
	}

	const body_statements = has_hooks
		? hook_safe_render_statements(loop_body, key_expression, transform_context)
		: build_render_statements(loop_body, true, transform_context);

	const platform_for_of = transform_context.platform.hooks?.renderForOf?.(
		node,
		loop_params,
		body_statements,
		transform_context,
	);
	if (platform_for_of) {
		transform_context.available_bindings = saved_bindings;
		return platform_for_of;
	}

	const non_hook_key_expression = key_expression ?? implicit_non_hook_key_expression;
	if (!has_hooks && non_hook_key_expression) {
		apply_key_to_render_statements(body_statements, non_hook_key_expression, transform_context);
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
 * @param {any[]} body_nodes
 * @param {any} key_expression
 * @returns {void}
 */
function apply_key_to_loop_body(body_nodes, key_expression) {
	for (const node of body_nodes) {
		if (node.type === 'Element') {
			const attributes = node.attributes || (node.attributes = []);
			const has_key = attributes.some((/** @type {any} */ attr) => {
				const attr_name = typeof attr.name === 'string' ? attr.name : attr.name?.name;
				return attr_name === 'key';
			});

			if (!has_key) {
				attributes.push({
					type: 'Attribute',
					name: { type: 'Identifier', name: 'key', metadata: { path: [] } },
					value: clone_expression_node(key_expression),
					shorthand: false,
					metadata: { path: [] },
				});
			}
			return;
		}

		if (node.type === 'JSXElement') {
			const attributes = node.openingElement?.attributes || [];
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
			return;
		}
	}
}

/**
 * @param {any[]} body_nodes
 * @returns {boolean}
 */
function should_apply_key_to_loop_body(body_nodes) {
	let keyable_children = 0;
	for (const node of body_nodes) {
		if (node.type === 'Element' || node.type === 'JSXElement') {
			keyable_children += 1;
		}
	}
	return keyable_children === 1;
}

/**
 * @param {any[]} statements
 * @param {any} key_expression
 * @param {TransformContext} transform_context
 * @returns {void}
 */
function apply_key_to_render_statements(statements, key_expression, transform_context) {
	for (let i = statements.length - 1; i >= 0; i -= 1) {
		const statement = statements[i];
		if (statement?.type !== 'ReturnStatement' || !statement.argument) {
			continue;
		}

		if (statement.argument.type === 'JSXElement') {
			apply_key_to_jsx_element(statement.argument, key_expression);
		} else if (statement.argument.type === 'JSXFragment') {
			transform_context.needs_fragment = true;
			statement.argument = keyed_fragment_to_jsx_element(statement.argument, key_expression);
		}

		return;
	}
}

/**
 * @param {any} element
 * @param {any} key_expression
 * @returns {void}
 */
function apply_key_to_jsx_element(element, key_expression) {
	const attributes = element.openingElement?.attributes || [];
	const has_key = attributes.some(
		(/** @type {any} */ attr) =>
			attr.type === 'JSXAttribute' &&
			attr.name?.type === 'JSXIdentifier' &&
			attr.name.name === 'key',
	);

	if (!has_key) {
		attributes.push(
			b.jsx_attribute(
				b.jsx_id('key'),
				to_jsx_expression_container(clone_expression_node(key_expression), key_expression),
			),
		);
	}
}

/**
 * @param {any} fragment
 * @param {any} key_expression
 * @returns {any}
 */
function keyed_fragment_to_jsx_element(fragment, key_expression) {
	const name = b.jsx_id('Fragment');
	const key_attribute = b.jsx_attribute(
		b.jsx_id('key'),
		to_jsx_expression_container(clone_expression_node(key_expression), key_expression),
	);

	return b.jsx_element_fresh(
		b.jsx_opening_element(name, [key_attribute]),
		b.jsx_closing_element(clone_jsx_name(name)),
		fragment.children,
	);
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
 * - JavaScript `try/finally` is not part of component template control flow
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
		error(
			`${transform_context.platform.name} TSRX does not support JavaScript \`try/finally\` in component templates. \`finally\` is not part of TSRX control flow; move the try/finally into a function if you need cleanup logic.`,
			transform_context.filename,
			finalizer,
			transform_context.errors,
			transform_context.comments,
		);
	}

	if (!pending && !handler) {
		error(
			'Component try statements must have a `pending` or `catch` block.',
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return to_jsx_expression_container(create_null_literal());
	}

	if (pending && transform_context.platform.validation.unsupportedTryPendingMessage) {
		error(
			transform_context.platform.validation.unsupportedTryPendingMessage,
			transform_context.filename,
			pending,
			transform_context.errors,
			transform_context.comments,
		);
	}

	// Validate that try body contains JSX if pending block is present
	if (pending) {
		const try_body = node.block.body || [];
		if (!try_body.some(is_jsx_child)) {
			error(
				'Component try statements must contain a template in their main body. Move the try statement into a function if it does not render anything.',
				transform_context.filename,
				node.block,
				transform_context.errors,
				transform_context.comments,
			);
		}
		const pending_body = pending.body || [];
		if (!pending_body.some(is_jsx_child)) {
			error(
				'Component try statements must contain a template in their "pending" body. Rendering a pending fallback is required to have a template.',
				transform_context.filename,
				pending,
				transform_context.errors,
				transform_context.comments,
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

		const boundary_content =
			transform_context.platform.hooks?.createErrorBoundaryContent?.(
				try_content,
				transform_context,
				node,
			) ?? null;

		if (boundary_content && transform_context.inside_element_child) {
			result = to_jsx_expression_container(
				/** @type {any} */ ({
					type: 'CallExpression',
					callee: { type: 'Identifier', name: 'TsrxErrorBoundary', metadata: { path: [] } },
					arguments: [
						{
							type: 'ObjectExpression',
							properties: [
								{
									type: 'Property',
									key: { type: 'Identifier', name: 'fallback', metadata: { path: [] } },
									value: fallback_fn,
									kind: 'init',
									method: false,
									shorthand: false,
									computed: false,
									metadata: { path: [] },
								},
								{
									type: 'Property',
									key: { type: 'Identifier', name: 'content', metadata: { path: [] } },
									value: boundary_content,
									kind: 'init',
									method: false,
									shorthand: false,
									computed: false,
									metadata: { path: [] },
								},
							],
							metadata: { path: [] },
						},
					],
					optional: false,
					metadata: { path: [] },
				}),
			);

			return result;
		}

		result = create_jsx_element(
			'TsrxErrorBoundary',
			[
				{
					type: 'JSXAttribute',
					name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
					value: to_jsx_expression_container(/** @type {any} */ (fallback_fn)),
					metadata: { path: [] },
				},
				...(boundary_content
					? [
							{
								type: 'JSXAttribute',
								name: { type: 'JSXIdentifier', name: 'content', metadata: { path: [] } },
								value: to_jsx_expression_container(boundary_content),
								metadata: { path: [] },
							},
						]
					: []),
			],
			boundary_content ? [] : [result],
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
	const self_closing = children.length === 0;
	const opening_element = b.jsx_opening_element(b.jsx_id(tag_name), attributes, self_closing);
	const closing_element = self_closing ? null : b.jsx_closing_element(b.jsx_id(tag_name));
	return b.jsx_element_fresh(opening_element, closing_element, children);
}

/**
 * Inject runtime-helper import declarations the transform decided it needed
 * during the walk: `Suspense` for `try { ... } pending { ... }`,
 * `TsrxErrorBoundary` for `try { ... } catch (...)`, and `mergeRefs` for
 * elements with multiple `ref` attributes under the `'merge-refs'`
 * strategy. Import sources are platform-specific.
 *
 * @param {AST.Program} program
 * @param {TransformContext} transform_context
 * @param {JsxPlatform} platform
 * @param {string} suspense_source - effective suspense import source after
 *   applying any per-call override from JsxTransformOptions.suspenseSource.
 */
function inject_try_imports(program, transform_context, platform, suspense_source) {
	/** @type {any[]} */
	const imports = [];

	if (transform_context.needs_fragment && platform.imports.fragment) {
		const fragment_source = platform.imports.fragment;
		imports.push({
			type: 'ImportDeclaration',
			specifiers: [
				{
					type: 'ImportSpecifier',
					imported: { type: 'Identifier', name: 'Fragment', metadata: { path: [] } },
					local: { type: 'Identifier', name: 'Fragment', metadata: { path: [] } },
					metadata: { path: [] },
				},
			],
			source: {
				type: 'Literal',
				value: fragment_source,
				raw: `'${fragment_source}'`,
			},
			metadata: { path: [] },
		});
	}

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
			source: {
				type: 'Literal',
				value: suspense_source,
				raw: `'${suspense_source}'`,
			},
			metadata: { path: [] },
		});
	}

	if (transform_context.needs_error_boundary) {
		const error_boundary_source = platform.imports.errorBoundary;
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
				value: error_boundary_source,
				raw: `'${error_boundary_source}'`,
			},
			metadata: { path: [] },
		});
	}

	if (transform_context.needs_merge_refs && platform.imports.mergeRefs) {
		const merge_refs_source = platform.imports.mergeRefs;
		imports.push({
			type: 'ImportDeclaration',
			specifiers: [
				{
					type: 'ImportSpecifier',
					imported: {
						type: 'Identifier',
						name: 'mergeRefs',
						metadata: { path: [] },
					},
					local: {
						type: 'Identifier',
						name: MERGE_REFS_LOCAL_NAME,
						metadata: { path: [] },
					},
					metadata: { path: [] },
				},
			],
			source: {
				type: 'Literal',
				value: merge_refs_source,
				raw: `'${merge_refs_source}'`,
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
	const consequent_has_hooks = body_contains_top_level_hook_call(
		consequent_body,
		transform_context,
		true,
	);

	let alternate = null;
	if (node.alternate) {
		if (node.alternate.type === 'IfStatement') {
			alternate = create_render_if_statement(node.alternate, transform_context);
		} else {
			const alternate_body = node.alternate.body || [node.alternate];
			const alternate_has_hooks = body_contains_top_level_hook_call(
				alternate_body,
				transform_context,
				true,
			);
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

	if (body_contains_top_level_hook_call(body_without_break, transform_context, true)) {
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
 * Dispatch point for element attribute transformation. Platforms can replace
 * the default "map over `to_jsx_attribute`" via
 * `hooks.transformElementAttributes`. Whether or not the hook is used,
 * the result is run through `merge_duplicate_refs` so platforms with a
 * `multiRefStrategy` get duplicate-`ref` handling for free.
 *
 * Before lowering, the raw attribute list is validated to reject elements
 * with more than one TSX-style `ref={...}` attribute — that shape produces
 * duplicate JSX props which the JSX runtime collapses to last-wins (and
 * which TypeScript can't type cleanly). Multiple Ripple `{ref expr}`
 * keyword-form refs remain valid and merge into a single ref attribute.
 *
 * @param {any[]} attrs
 * @param {TransformContext} transform_context
 * @param {any} element
 * @returns {any[]}
 */
function transform_element_attributes_dispatch(attrs, transform_context, element) {
	validate_at_most_one_ref_attribute(attrs, transform_context);
	const preprocess = transform_context.platform.hooks?.preprocessElementAttributes;
	if (preprocess) {
		attrs = preprocess(attrs, transform_context, element);
	}
	const hook = transform_context.platform.hooks?.transformElementAttributes;
	const result = hook
		? hook(attrs, transform_context, element)
		: attrs.map((/** @type {any} */ a) => to_jsx_attribute(a, transform_context));
	return merge_duplicate_refs(result, transform_context);
}

/**
 * Reject elements with more than one TSX-style `ref={...}` attribute.
 * Ripple's `{ref expr}` keyword form is parsed as a `RefAttribute` node
 * and is excluded from the count — multiple keyword-form refs are a Ripple
 * feature that compose via the merge pass. This validator runs over the
 * raw, pre-lowering attribute list so each shape is still distinguishable
 * by `type`. Ripple `Element` attributes have type `Attribute` with an
 * `Identifier` name (the parser normalizes `JSXAttribute`/`JSXIdentifier`
 * for non-Tsx elements); inside `<tsx:react>` compat blocks they retain
 * the original `JSXAttribute`/`JSXIdentifier` shape, so we accept both.
 *
 * @param {any[]} raw_attrs
 * @param {TransformContext} [transform_context]
 */
export function validate_at_most_one_ref_attribute(raw_attrs, transform_context) {
	/** @type {any[]} */
	const refs = [];
	for (const attr of raw_attrs) {
		if (!attr) continue;
		const is_ref_attr =
			(attr.type === 'Attribute' &&
				attr.name &&
				attr.name.type === 'Identifier' &&
				attr.name.name === 'ref') ||
			(attr.type === 'JSXAttribute' &&
				attr.name &&
				attr.name.type === 'JSXIdentifier' &&
				attr.name.name === 'ref');
		if (!is_ref_attr) continue;
		refs.push(attr.name);
	}
	if (refs.length < 2) {
		return;
	}
	for (let i = 0; i < refs.length; i++) {
		const node = refs[i];
		if (!transform_context?.collect && i === 0) {
			// when not collecting, only throw on the second duplicate
			continue;
		}
		error(
			'Element has multiple `ref={...}` attributes; an element may have at most one. ' +
				"Use Ripple's `{ref expr}` keyword form to combine multiple refs on one element.",
			transform_context?.filename ?? null,
			node,
			transform_context?.errors,
			transform_context?.comments,
		);
	}
}

/**
 * Collapse multiple `ref` JSXAttributes on a single element into one. Both
 * Ripple's `{ref expr}` keyword form and TSX-style `ref={expr}` are handled
 * because they have already been normalized to `JSXAttribute` named `ref`
 * by `to_jsx_attribute` (Ripple) or the parser (TSX-style). The shape of
 * the merged value depends on `platform.jsx.multiRefStrategy`:
 *
 * - `'merge-refs'` — emit `ref={__mergeRefs(a, b, ...)}` and flag
 *   `needs_merge_refs` so an import is injected later. React and Preact
 *   need this because their runtimes dedupe duplicate `ref` props.
 * - `'array'` — emit `ref={[a, b, ...]}`. Solid's runtime iterates
 *   array refs natively, so no helper is required.
 * - `undefined` — return the list unchanged. The platform takes care
 *   of duplicate refs at runtime (or doesn't support them).
 *
 * Single-ref elements are always left unchanged so trivial cases stay
 * import-free and produce no helper call.
 *
 * @param {any[]} jsx_attrs
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
export function merge_duplicate_refs(jsx_attrs, transform_context) {
	const strategy = transform_context.platform.jsx.multiRefStrategy;
	if (!strategy) return jsx_attrs;

	let count = 0;
	let tsx_form_count = 0;
	for (const attr of jsx_attrs) {
		if (!is_jsx_ref_attribute(attr)) continue;
		count += 1;
		if (!attr.metadata?.from_ref_keyword) tsx_form_count += 1;
	}
	if (count <= 1) return jsx_attrs;
	// Two or more genuine `ref={...}` (TSX-form) attributes are already a
	// validator-flagged compile error and TypeScript flags them as duplicate
	// JSX props. Leave them in place so the user gets all three signals
	// instead of silently composing them into `__mergeRefs(...)`.
	if (tsx_form_count >= 2) return jsx_attrs;

	/** @type {any[]} */
	const ref_exprs = [];
	/** @type {any[]} */
	const result = [];
	/** @type {any} */
	let source_attr = null;
	for (const attr of jsx_attrs) {
		if (is_jsx_ref_attribute(attr)) {
			ref_exprs.push(attr.value.expression);
			// Inherit loc from the (at most one) `ref={expr}`-form attribute so
			// the kept `ref` keyword in the generated `ref={__mergeRefs(...)}`
			// retains a source mapping back to its original `ref=` keyword.
			if (!source_attr && !attr.metadata?.from_ref_keyword) {
				source_attr = attr;
			}
		} else {
			result.push(attr);
		}
	}

	const merged_value =
		strategy === 'merge-refs'
			? /** @type {any} */ ({
					type: 'CallExpression',
					callee: {
						type: 'Identifier',
						name: MERGE_REFS_LOCAL_NAME,
						metadata: { path: [] },
					},
					arguments: ref_exprs,
					optional: false,
					metadata: { path: [] },
				})
			: /** @type {any} */ ({
					type: 'ArrayExpression',
					elements: ref_exprs,
					metadata: { path: [] },
				});

	if (strategy === 'merge-refs') {
		transform_context.needs_merge_refs = true;
	}

	// Inherit start/end/loc from the (at most one) `ref={expr}`-form attribute
	// so segments.js emits a normal source-to-generated mapping for the
	// merged attribute and its name. Without this the kept `ref` keyword in
	// `ref={__mergeRefs(...)}` has no source mapping back to the user's `ref=`
	// keyword.
	const merged_name = build_jsx_id('ref', source_attr?.name);
	const merged_attr = build_jsx_attribute(
		merged_name,
		/** @type {any} */ ({
			type: 'JSXExpressionContainer',
			expression: merged_value,
			metadata: { path: [] },
		}),
		false,
		source_attr,
	);
	result.push(merged_attr);

	return result;
}

/**
 * @param {any} attr
 * @returns {boolean}
 */
function is_jsx_ref_attribute(attr) {
	return (
		!!attr &&
		attr.type === 'JSXAttribute' &&
		!!attr.name &&
		attr.name.type === 'JSXIdentifier' &&
		attr.name.name === 'ref' &&
		!!attr.value &&
		attr.value.type === 'JSXExpressionContainer' &&
		!!attr.value.expression &&
		attr.value.expression.type !== 'JSXEmptyExpression'
	);
}

/**
 * Local alias used for the injected `mergeRefs` import. The leading
 * double-underscore matches the convention for compiler-generated
 * identifiers and avoids shadowing user-declared `mergeRefs` symbols.
 */
const MERGE_REFS_LOCAL_NAME = '__mergeRefs';

/**
 * @param {any} attr
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXAttribute | ESTreeJSX.JSXSpreadAttribute}
 */
export function to_jsx_attribute(attr, transform_context) {
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
		// `{ref expr}` and the generated `ref={expr}` have different shapes,
		// so the source-to-generated mapping is imprecise — but pointing
		// editors at the `{ref expr}` span is still useful for hover/jump,
		// matching how shorthand `{name}` → `name={name}` carries loc.
		// `from_ref_keyword` lets `merge_duplicate_refs` tell this form apart
		// from genuine `ref={...}` attributes without inferring it from
		// whether `name.loc` happens to be present.
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXAttribute',
				name: { type: 'JSXIdentifier', name: 'ref', metadata: { path: [] } },
				value: to_jsx_expression_container(attr.argument),
				shorthand: false,
				metadata: { path: [], from_ref_keyword: true },
			}),
			attr,
		);
	}

	// Platforms that expect React-style DOM attrs (React) rewrite `class` to
	// `className`; Preact and Solid accept `class` natively and keep it.
	let attr_name = attr.name;
	if (
		transform_context.platform.jsx.rewriteClassAttr &&
		attr_name &&
		attr_name.type === 'Identifier' &&
		attr_name.name === 'class'
	) {
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

	const jsx_attribute = build_jsx_attribute(name, value || null, attr.shorthand === true);

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
	const attributes = transform_element_attributes_dispatch(
		node.attributes || [],
		transform_context,
		node,
	);
	const selfClosing = !!node.selfClosing;
	const children = create_element_children(node.children || [], transform_context);
	const name = identifier_to_jsx_name(clone_identifier(dynamic_id));

	return b.jsx_element_fresh(
		b.jsx_opening_element(name, attributes, selfClosing),
		selfClosing ? null : b.jsx_closing_element(clone_jsx_name(name)),
		children,
	);
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
 * @param {any} node
 * @param {TransformContext} transform_context
 * @param {boolean} [in_jsx_child]
 * @returns {any}
 */
function tsx_compat_node_to_jsx_expression(node, transform_context, in_jsx_child = false) {
	const platform = transform_context.platform;
	if (!platform.jsx.acceptedTsxKinds.includes(node.kind)) {
		const accepted = platform.jsx.acceptedTsxKinds.map((k) => `<tsx:${k}>`).join(', ');
		error(
			`${platform.name} TSRX does not support <tsx:${node.kind}> blocks. Use <tsx> or one of: ${accepted}.`,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
	}

	return tsx_node_to_jsx_expression(node, in_jsx_child);
}
