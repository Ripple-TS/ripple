/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */
/** @import { JsxPlatform, JsxTransformContext, JsxTransformOptions, JsxTransformResult } from '@tsrx/core/types' */

import { walk } from 'zimmerframe';
import { print } from 'esrap';
import { error } from '../../errors.js';
import { analyze_css } from '../../analyze/css-analyze.js';
import { prune_css } from '../../analyze/prune.js';
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
	is_bare_render_expression,
	is_component_jsx_name,
	is_dynamic_element_id,
	is_jsx_child,
	set_loc,
	to_text_expression,
} from './ast-builders.js';
import { render_css_result } from '../stylesheet.js';
import {
	set_location as setLocation,
	jsx_attribute as build_jsx_attribute,
	jsx_id as build_jsx_id,
} from '../../utils/builders.js';
import * as b from '../../utils/builders.js';
import { apply_lazy_transforms, preallocate_lazy_ids } from '../lazy.js';
import { find_first_top_level_await_in_component_body } from '../await.js';
import {
	prepare_stylesheet_for_render,
	annotate_component_with_hash,
	is_style_element,
} from '../scoping.js';
import {
	validate_class_component_declarations,
	validate_component_loop_break_statement,
	validate_component_loop_return_statement,
	validate_component_params,
	validate_component_return_statement,
	validate_component_unsupported_loop_statement,
} from '../../analyze/validation.js';
import { get_component_from_path, is_function_or_component_node } from '../../utils/ast.js';
import {
	is_interleaved_body as is_interleaved_body_core,
	is_capturable_jsx_child,
	capture_jsx_child as captureJsxChild,
} from '../jsx-interleave.js';
import { is_hoist_safe_jsx_node } from '../jsx-hoist.js';

const HOOK_OUTER_ASSIGNMENT_ERROR =
	'Hook calls inside conditional or repeated TSRX scopes must keep their results local to the generated hook component.';
const HOOK_CALLBACK_OUTER_MUTATION_ERROR =
	'Hook callbacks inside conditional or repeated TSRX scopes must not mutate bindings declared outside the generated hook component.';
const TEMPLATE_FRAGMENT_ERROR =
	'JSX fragment syntax is not needed in TSRX templates. TSRX renders in immediate mode, so everything is already a fragment. Use `<>...</>` only within <tsx>...</tsx>.';

/**
 * @param {TransformContext} transform_context
 * @returns {string}
 */
export function get_invalid_html_child_error_message(transform_context) {
	return `\`{html ...}\` is only supported as the sole child of an element in ${transform_context.platform.name}.`;
}

/**
 * @param {AST.Node} node
 * @param {TransformContext} transform_context
 */
function report_invalid_html_child_error(node, transform_context) {
	error(
		get_invalid_html_child_error_message(transform_context),
		transform_context.filename,
		node,
		transform_context.errors,
		transform_context.comments,
	);
}

/**
 * In loose/editor mode `error(...)` records the diagnostic and continues, so an
 * invalid standalone `{html ...}` child still needs a valid expression node for
 * the virtual TSX output.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
export function recover_invalid_html_child(node, transform_context) {
	report_invalid_html_child_error(node, transform_context);
	const expression = set_loc(clone_expression_node(node.expression), node);
	return to_jsx_expression_container(expression, node);
}

/**
 * @param {AST.Node} node
 * @param {TransformContext} transform_context
 */
function report_jsx_fragment_in_tsrx_error(node, transform_context) {
	error(
		TEMPLATE_FRAGMENT_ERROR,
		transform_context.filename,
		node,
		transform_context.errors,
		transform_context.comments,
	);
}

/**
 * @param {AST.Node} node
 * @param {string[]} names
 * @param {string} hook_name
 * @param {TransformContext} transform_context
 * @returns {void}
 */
function report_hook_outer_assignment_error(node, names, hook_name, transform_context) {
	const target =
		names.length === 1 ? `\`${names[0]}\`` : names.map((name) => `\`${name}\``).join(', ');
	error(
		`${HOOK_OUTER_ASSIGNMENT_ERROR} The ${hook_name} result is assigned to ${target}, which is declared outside that generated component. Declare the hook result inside the TSRX branch, or move the hook into an explicit child component and pass values with props.`,
		transform_context.filename,
		node,
		transform_context.errors,
		transform_context.comments,
	);
}

/**
 * @param {AST.Node} node
 * @param {string[]} names
 * @param {string} hook_name
 * @param {TransformContext} transform_context
 * @returns {void}
 */
function report_hook_callback_outer_mutation_error(node, names, hook_name, transform_context) {
	const target =
		names.length === 1 ? `\`${names[0]}\`` : names.map((name) => `\`${name}\``).join(', ');
	error(
		`${HOOK_CALLBACK_OUTER_MUTATION_ERROR} The ${hook_name} callback mutates ${target}. Read outer values through props or dependencies, and move mutable state into an explicit child component when it needs to change over time.`,
		transform_context.filename,
		node,
		transform_context.errors,
		transform_context.comments,
	);
}

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
			needs_ref_prop: false,
			needs_normalize_spread_props: false,
			needs_fragment: false,
			needs_for_of_iterable: false,
			needs_iteration_value_type: false,
			module_scoped_hook_components:
				options?.moduleScopedHookComponents ?? !!platform.hooks?.moduleScopedHookComponents,
			helper_state: null,
			available_bindings: new Map(),
			lazy_next_id: 0,
			current_css_hash: null,
			filename: filename ?? null,
			collect,
			errors: collect ? options?.errors : undefined,
			comments: options?.comments,
			typeOnly: !!options?.typeOnly,
			// Platforms can seed their own tracking state (e.g. solid's
			// needs_show / needs_for flags) via `hooks.initialState`.
			...(platform.hooks?.initialState?.() ?? {}),
		};

		if (!transform_context.typeOnly) {
			preallocate_lazy_ids(/** @type {any} */ (ast), transform_context);
		}

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

			ClassBody(node, { next }) {
				validate_class_component_declarations(
					/** @type {any} */ (node),
					filename,
					transform_context.errors,
					transform_context.comments,
				);
				return next();
			},

			Component(node, { next, state }) {
				const as_any = /** @type {any} */ (node);

				validate_component_params(
					as_any,
					filename,
					transform_context.errors,
					transform_context.comments,
				);

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
					apply_css_definition_metadata(as_any, css);
					stylesheets.push(css);
					const hash = css.hash;
					annotate_component_with_hash(
						as_any,
						hash,
						platform.jsx.rewriteClassAttr ? 'className' : 'class',
						transform_context.typeOnly,
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
				const in_jsx_child = in_jsx_child_context(path);
				return /** @type {any} */ (
					wrap_jsx_setup_declarations(tsx_node_to_jsx_expression(inner, in_jsx_child), in_jsx_child)
				);
			},

			Tsrx(node, { next, path, state }) {
				const inner = /** @type {any} */ (next() ?? node);
				const in_jsx_child = in_jsx_child_context(path);
				return /** @type {any} */ (
					wrap_jsx_setup_declarations(
						tsrx_node_to_jsx_expression(inner, state, in_jsx_child),
						in_jsx_child,
					)
				);
			},

			TsxCompat(node, { next, path, state }) {
				const inner = /** @type {any} */ (next() ?? node);
				const in_jsx_child = in_jsx_child_context(path);
				return /** @type {any} */ (
					wrap_jsx_setup_declarations(
						tsx_compat_node_to_jsx_expression(inner, state, in_jsx_child),
						in_jsx_child,
					)
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
				return b.literal(value, undefined, node);
			},

			// Default .metadata on every function-like node so downstream consumers
			// (e.g. segments.js reading node.value.metadata.is_component on class
			// methods) don't trip on an undefined metadata object. Ripple's analyze
			// phase does this via visit_function; tsrx-react has no analyze phase.
			// If a plain JS function contains a hook-bearing <tsrx> expression,
			// give it a temporary helper scope so extracted hook components can
			// be emitted with stable identities just like component-body helpers.
			FunctionDeclaration: transform_function_with_hook_helpers,
			FunctionExpression: transform_function_with_hook_helpers,
			ArrowFunctionExpression: transform_function_with_hook_helpers,

			RefExpression(node) {
				return create_ref_prop_call(node, transform_context);
			},

			JSXOpeningElement(node, { next }) {
				const visited = next() || node;
				const is_component = is_component_like_jsx_name(visited.name);
				const attrs = normalize_named_ref_attributes(
					visited.attributes || [],
					!is_component,
					transform_context,
				);
				return {
					...visited,
					attributes: merge_duplicate_refs(
						normalize_host_ref_spreads(attrs, !is_component, transform_context),
						transform_context,
					),
				};
			},
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
		// In type-only mode, the lazy patterns survive untouched: esrap ignores the
		// non-standard `lazy` flag, so `&{ a, b }` prints as `{ a, b }`, `let &[a]
		// = expr` prints as `let [a] = expr`, and the bare statement-level form
		// `&[x] = expr;` (used when `x` is already declared) prints as `[x] =
		// expr;` — a valid destructuring assignment to the existing binding.
		const final_program = /** @type {any} */ (
			transform_context.typeOnly
				? expanded
				: apply_lazy_transforms(/** @type {any} */ (expanded), new Map())
		);

		const result = print(/** @type {any} */ (final_program), tsx_with_ts_locations(), {
			sourceMapSource: filename,
			sourceMapContent: source,
		});

		const { css, cssHash } = render_css_result(
			/** @type {any} */ (stylesheets.map(prepare_stylesheet_for_render)),
		);

		return { ast: final_program, code: result.code, map: result.map, css, cssHash };
	}

	return transform;
}

/**
 * Attach selector-location metadata used by editor definitions/hover before
 * the shared scoping pass mutates class attributes with the component hash.
 *
 * @param {any} component
 * @param {any} css
 * @returns {void}
 */
function apply_css_definition_metadata(component, css) {
	analyze_css(css);

	const metadata = component.metadata || (component.metadata = { path: [] });
	const style_classes = metadata.styleClasses || (metadata.styleClasses = new Map());
	const top_scoped_classes = metadata.topScopedClasses || new Map();
	const elements = collect_css_prunable_elements(component.body || []);

	for (const element of elements) {
		prune_css(css, element, style_classes, top_scoped_classes);
	}

	if (top_scoped_classes.size > 0) {
		metadata.topScopedClasses = top_scoped_classes;
	}
}

/**
 * @param {any} value
 * @param {any[]} [elements]
 * @returns {any[]}
 */
function collect_css_prunable_elements(value, elements = []) {
	if (!value || typeof value !== 'object') {
		return elements;
	}

	if (Array.isArray(value)) {
		for (const child of value) {
			collect_css_prunable_elements(child, elements);
		}
		return elements;
	}

	if (
		value.type === 'FunctionDeclaration' ||
		value.type === 'FunctionExpression' ||
		value.type === 'ArrowFunctionExpression' ||
		value.type === 'Component'
	) {
		return elements;
	}

	if (value.type === 'Element') {
		if (!is_style_element(value)) {
			elements.push(value);
		}
	}

	for (const key of Object.keys(value)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata' || key === 'css') {
			continue;
		}
		collect_css_prunable_elements(value[key], elements);
	}

	return elements;
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

	// Save and set context for this component scope
	const saved_helper_state = transform_context.helper_state;
	const saved_bindings = transform_context.available_bindings;
	transform_context.helper_state = helper_state;
	transform_context.available_bindings = new Map(param_bindings);

	const body_statements = build_component_statements(body, transform_context);
	const body_block = b.block(body_statements);

	/** @type {AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression} */
	let fn;

	if (component.id) {
		fn = b.function_declaration(
			component.id,
			params,
			body_block,
			is_async_component,
			component.typeParameters,
		);
	} else if (component.metadata?.arrow) {
		fn = b.arrow(params, body_block, is_async_component, component.typeParameters);
	} else {
		fn = b.function(null, params, body_block, is_async_component, component.typeParameters);
	}
	/** @type {any} */ (fn.metadata).is_component = true;

	// `preallocate_lazy_ids` stamped `has_lazy_descendants` on the source
	// `Component` node; the freshly-built `fn` shares the same params/body
	// subtree, so the flag is equally applicable. Propagating it lets
	// `apply_lazy_transforms` honor its constant-time early-return path.
	if (/** @type {any} */ (component).metadata?.has_lazy_descendants) {
		/** @type {any} */ (fn.metadata).has_lazy_descendants = true;
	}

	// Apply lazy `&{}` / `&[]` rewrites end-to-end: the function-handler in
	// `apply_lazy_transforms` collects param bindings, merges with body bindings
	// discovered by the BlockStatement handler, replaces lazy params with their
	// `__lazyN` ids, and rewrites every reference. Constant-time fast-path for
	// functions whose subtrees contain no lazy patterns (flagged ahead of time
	// by `preallocate_lazy_ids`). In type-only mode the rewrite is skipped so
	// destructuring patterns survive into the virtual TSX and TypeScript can
	// flow real types.
	if (!transform_context.typeOnly) {
		fn = /** @type {typeof fn} */ (apply_lazy_transforms(fn, new Map()));
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
	let has_terminal_return = false;

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
	const capture_static_early_return_nodes =
		!interleaved &&
		!transform_context.platform.hooks?.isTopLevelSetupCall &&
		body_nodes.filter(is_returning_if_statement).length > 1;
	let capture_index = 0;

	for (let i = 0; i < body_nodes.length; i += 1) {
		const child = body_nodes[i];

		if (is_bare_return_statement(child)) {
			statements.push(create_component_return_statement(render_nodes, child));
			render_nodes.length = 0;
			has_terminal_return = true;
			continue;
		}

		if (child?.type === 'ReturnStatement' && child.argument != null) {
			statements.push(child);
			has_terminal_return = true;
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

			if (capture_static_early_return_nodes) {
				capture_index = capture_static_early_return_render_nodes(
					render_nodes,
					statements,
					capture_index,
					transform_context,
				);
			}

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
									b.jsx_expression_container(
										set_loc(
											b.conditional(
												clone_expression_node(child.test),
												b.literal(null),
												stmt.argument,
											),
											child,
										),
									),
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
			const hoisted = build_hoisted_for_of_with_hooks(child, transform_context);
			if (hoisted) {
				statements.push(...hoisted.hoist_statements);
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

		if (is_jsx_child(child)) {
			const jsx = to_jsx_child(child, transform_context);
			statements.push(...extract_jsx_setup_declarations(jsx));
			if (interleaved && is_capturable_jsx_child(jsx)) {
				const { declaration, reference } = captureJsxChild(jsx, capture_index++);
				statements.push(declaration);
				render_nodes.push(reference);
			} else {
				render_nodes.push(jsx);
			}
		} else if (is_bare_render_expression(child)) {
			render_nodes.push(to_jsx_expression_container(child, child));
		} else {
			statements.push(child);
			collect_statement_bindings(child, transform_context.available_bindings);
		}
	}

	if (!interleaved) {
		hoist_static_render_nodes(render_nodes, transform_context);
	}

	const return_arg = build_return_expression(render_nodes);
	if (return_arg || (return_null_when_empty && !has_terminal_return)) {
		statements.push(b.return(return_arg || b.literal(null)));
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

	return b.prop('init', key, value, false, true);
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
 * @param {any} node
 * @param {{ next: () => any, state: TransformContext }} context
 * @returns {any}
 */
function transform_function_with_hook_helpers(node, { next, state }) {
	if (state.helper_state || !function_contains_hook_bearing_tsrx(node, state)) {
		return ensure_function_metadata(node, { next });
	}

	const helper_state = create_helper_state(get_function_helper_base_name(node));
	const saved_helper_state = state.helper_state;
	const saved_bindings = state.available_bindings;

	state.helper_state = helper_state;
	state.available_bindings = collect_function_scope_bindings(node);

	const inner = /** @type {any} */ (next() ?? node);

	state.helper_state = saved_helper_state;
	state.available_bindings = saved_bindings;

	ensure_function_metadata(inner, { next: () => inner });
	if (helper_state.helpers.length || helper_state.statics.length) {
		inner.metadata = {
			...(inner.metadata || {}),
			generated_helpers: helper_state.helpers,
			generated_statics: helper_state.statics,
		};
	}

	return inner;
}

/**
 * @param {any} node
 * @returns {string}
 */
function get_function_helper_base_name(node) {
	if (node.id?.type === 'Identifier') {
		return node.id.name;
	}
	return 'Tsrx';
}

/**
 * @param {any} node
 * @returns {Map<string, AST.Identifier>}
 */
function collect_function_scope_bindings(node) {
	const bindings = collect_param_bindings(node.params || []);
	collect_descendant_declaration_bindings(node.body, bindings);
	return bindings;
}

/**
 * @param {any} node
 * @param {Map<string, AST.Identifier>} bindings
 * @returns {void}
 */
function collect_descendant_declaration_bindings(node, bindings) {
	if (!node || typeof node !== 'object') {
		return;
	}

	if (node.type === 'VariableDeclaration') {
		for (const declaration of node.declarations || []) {
			collect_pattern_bindings(declaration.id, bindings);
		}
	}

	if (
		(node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') &&
		node.id?.type === 'Identifier'
	) {
		bindings.set(node.id.name, node.id);
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'Component'
	) {
		return;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			collect_descendant_declaration_bindings(child, bindings);
		}
		return;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		collect_descendant_declaration_bindings(node[key], bindings);
	}
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {boolean}
 */
function function_contains_hook_bearing_tsrx(node, transform_context) {
	return node_contains_hook_bearing_tsrx(node.body, transform_context);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {boolean}
 */
function node_contains_hook_bearing_tsrx(node, transform_context) {
	if (!node || typeof node !== 'object') {
		return false;
	}

	if (Array.isArray(node)) {
		return node.some((child) => node_contains_hook_bearing_tsrx(child, transform_context));
	}

	if (node.type === 'Tsrx') {
		return body_contains_top_level_hook_call(node.children || [], transform_context, true);
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'Component'
	) {
		return false;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (node_contains_hook_bearing_tsrx(node[key], transform_context)) {
			return true;
		}
	}

	return false;
}

/**
 * @param {TransformContext} transform_context
 * @returns {boolean}
 */
function should_use_module_scoped_hook_components(transform_context) {
	return !!(transform_context.helper_state && transform_context.module_scoped_hook_components);
}

/**
 * @param {AST.Identifier} helper_id
 * @param {TransformContext} transform_context
 * @returns {AST.Identifier}
 */
function create_module_scoped_hook_component_id(helper_id, transform_context) {
	return create_generated_identifier(
		`${transform_context.helper_state?.base_name || 'Component'}__${helper_id.name}`,
	);
}

/**
 * @param {any[]} params
 * @returns {Map<string, AST.Identifier>}
 */
export function collect_param_bindings(params) {
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
export function collect_statement_bindings(statement, bindings) {
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
		if (is_bare_component_invocation(node)) {
			// `<Helper />` with no attributes and no children is just an
			// invocation reference — most often a generated `StatementBodyHook`
			// chain element we emitted ourselves. Hoisting it would produce
			// `const App__staticN = <Helper />` aliases that bloat the output
			// without enabling React's element-identity fast path (the helper
			// isn't memoized, so the parent re-invokes it every render either
			// way). Inline the reference at the call site instead.
			continue;
		}
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
 * `<Helper />` shape with no attributes and no children. The opening element
 * name must be component-shaped (see `is_component_jsx_name`) — lowercase
 * identifiers are host DOM tags, which *do* benefit from hoisting because
 * React diffs them against the previous render.
 *
 * @param {any} node
 * @returns {boolean}
 */
function is_bare_component_invocation(node) {
	if (!node || node.type !== 'JSXElement') return false;
	const opening = node.openingElement;
	if (!opening || opening.attributes.length > 0) return false;
	if (node.children.length > 0) return false;
	return is_component_jsx_name(opening.name);
}

/**
 * Static JSX that appears before multiple early-return guards is otherwise
 * cloned into every generated return. Capture it once at its source position
 * and reuse the reference, matching the interleaved-statement capture path
 * without moving dynamic render-time expressions across guards.
 *
 * @param {any[]} render_nodes
 * @param {any[]} statements
 * @param {number} capture_index
 * @param {TransformContext} transform_context
 * @returns {number}
 */
function capture_static_early_return_render_nodes(
	render_nodes,
	statements,
	capture_index,
	transform_context,
) {
	for (let i = 0; i < render_nodes.length; i += 1) {
		const node = render_nodes[i];
		if (!is_static_early_return_capture_node(node, transform_context)) {
			continue;
		}

		const { declaration, reference } = captureJsxChild(node, capture_index++);
		statements.push(declaration);
		render_nodes[i] = reference;
	}

	return capture_index;
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {boolean}
 */
function is_static_early_return_capture_node(node, transform_context) {
	if (node?.type !== 'JSXElement' && node?.type !== 'JSXFragment') {
		return false;
	}
	if (!is_hoist_safe_jsx_node(node)) {
		return false;
	}
	if (
		transform_context.platform.hooks?.canHoistStaticNode &&
		!transform_context.platform.hooks.canHoistStaticNode(node, transform_context)
	) {
		return false;
	}
	return !references_scope_bindings(node, transform_context.available_bindings);
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
		map_render_node_locations ? clone_expression_node(node) : clone_expression_node(node, false),
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
 * Bails out (returns null) when the loop pattern is destructured — deriving
 * element types from a tuple/object pattern is more involved and deferred.
 *
 * @param {any} node - ForOfStatement
 * @param {TransformContext} transform_context
 * @returns {{ hoist_statements: any[], jsx_child: any } | null}
 */
function build_hoisted_for_of_with_hooks(node, transform_context) {
	const loop_params = get_for_of_iteration_params(node.left, node.index);
	for (const param of loop_params) {
		if (param.type !== 'Identifier') return null;
	}

	const original_loop_body = /** @type {any[]} */ (
		rewrite_loop_continues_to_bare_returns(
			node.body.type === 'BlockStatement' ? node.body.body : [node.body],
		)
	);

	const source_id = create_generated_identifier(
		`_tsrx_iteration_items_${transform_context.local_statement_component_index + 1}`,
	);
	const use_iterable_helper = !!transform_context.platform.imports.forOfIterableHelper;
	const { source_decl, source_normalize_decl } = use_iterable_helper
		? {
				source_decl: b.let(clone_identifier(source_id), clone_expression_node(node.right)),
				source_normalize_decl: null,
			}
		: build_array_normalization_decls(source_id, node.right);

	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);
	const loop_scoped_names = new Set(loop_params.map((/** @type {any} */ p) => p.name));
	for (const param of loop_params) {
		collect_pattern_bindings(param, transform_context.available_bindings);
	}
	validate_hook_safe_body_does_not_assign_hook_results_to_outer_bindings(
		original_loop_body,
		transform_context,
		loop_scoped_names,
	);

	const all_helper_bindings = get_referenced_helper_bindings(
		original_loop_body,
		transform_context.available_bindings,
	);
	const outer_bindings = all_helper_bindings.filter((b) => !loop_scoped_names.has(b.name));
	const loop_bindings = all_helper_bindings.filter((b) => loop_scoped_names.has(b.name));

	const helper_id = create_generated_identifier(
		create_local_statement_component_name(transform_context),
	);
	const use_module_scoped_component = should_use_module_scoped_hook_components(transform_context);
	const component_id = use_module_scoped_component
		? create_module_scoped_hook_component_id(helper_id, transform_context)
		: helper_id;

	const outer_aliases = use_module_scoped_component
		? []
		: outer_bindings.map((binding) => create_helper_type_alias_declaration(helper_id, binding));
	const loop_aliases = use_module_scoped_component
		? []
		: loop_bindings.map((binding) =>
				create_loop_scoped_type_alias_declaration(
					helper_id,
					binding,
					source_id,
					loop_params,
					transform_context,
				),
			);

	const ordered_bindings = [...outer_bindings, ...loop_bindings];
	const ordered_aliases = [...outer_aliases, ...loop_aliases];
	const ordered_use_typeof = [...outer_bindings.map(() => true), ...loop_bindings.map(() => false)];

	const props_type =
		ordered_bindings.length > 0 && !use_module_scoped_component
			? create_helper_props_type_literal_with_typeof_flags(
					ordered_bindings,
					ordered_aliases,
					ordered_use_typeof,
				)
			: null;
	const params =
		ordered_bindings.length > 0
			? [
					props_type !== null
						? create_typed_helper_props_pattern(ordered_bindings, props_type)
						: create_helper_props_pattern(ordered_bindings),
				]
			: [];

	const fn_saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(fn_saved_bindings);
	const fn_body_statements = build_render_statements(original_loop_body, true, transform_context);
	transform_context.available_bindings = fn_saved_bindings;

	const helper_fn = b.function(clone_identifier(component_id), params, b.block(fn_body_statements));
	helper_fn.metadata = { path: [], is_component: true, is_method: false };

	let helper_decl;
	if (transform_context.helper_state && use_module_scoped_component) {
		transform_context.helper_state.helpers.push(
			create_helper_declaration(component_id, helper_fn, node, transform_context),
		);
		helper_decl = null;
	} else if (transform_context.helper_state) {
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
		component_id,
		ordered_bindings,
		node,
		{ mapWrapper: false, mapBindingNames: false, mapBindingValues: false },
	);

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

	const callback_params = loop_params.map((/** @type {any} */ p) => clone_identifier(p));

	const iter_callback = b.arrow(callback_params, callback_invocation_element);

	let map_call;
	if (use_iterable_helper) {
		transform_context.needs_for_of_iterable = true;
		map_call = b.call(b.id(MAP_ITERABLE_INTERNAL_NAME), clone_identifier(source_id), iter_callback);
	} else {
		map_call = b.call(b.member(clone_identifier(source_id), 'map'), iter_callback);
	}

	const jsx_child = to_jsx_expression_container(map_call, node);

	const hoist_statements = source_normalize_decl
		? [source_decl, source_normalize_decl]
		: [source_decl];
	for (const alias of ordered_aliases) hoist_statements.push(alias.declaration);
	if (helper_decl) {
		hoist_statements.push(helper_decl);
	}

	return {
		hoist_statements,
		jsx_child,
	};
}

/**
 * Build a TS `type` alias for a loop-scoped binding, deriving the type
 * from the iteration source. For the index param the type is always
 * `number`. For the value param the shape depends on whether the platform
 * uses the `map_iterable` runtime helper:
 *
 * - With the helper (React, Preact): `IterationValue<typeof source>` — any
 *   `Iterable<T>` is accepted, so the element type is derived through the
 *   runtime's exported helper type.
 * - Without the helper: `(typeof source)[number]` — arrays/tuples only,
 *   matching the inline `.map()` lowering.
 *
 * @param {AST.Identifier} helper_id
 * @param {AST.Identifier} binding
 * @param {AST.Identifier} source_id
 * @param {any[]} loop_params
 * @param {TransformContext} transform_context
 * @returns {{ id: AST.Identifier, declaration: any }}
 */
function create_loop_scoped_type_alias_declaration(
	helper_id,
	binding,
	source_id,
	loop_params,
	transform_context,
) {
	const alias_id = create_generated_identifier(`_tsrx_${helper_id.name}_${binding.name}`);
	const is_index = loop_params.length > 1 && binding.name === loop_params[1].name;
	const use_iterable_helper = !!transform_context.platform.imports.forOfIterableHelper;
	const type_annotation = is_index
		? b.ts_keyword_type('number')
		: use_iterable_helper
			? (() => {
					transform_context.needs_iteration_value_type = true;
					return b.ts_type_reference(
						b.id(ITERATION_VALUE_INTERNAL_NAME),
						b.ts_type_parameter_instantiation([b.ts_type_query(clone_identifier(source_id))]),
					);
				})()
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
		b.return(
			combine_render_return_argument(
				render_nodes,
				set_loc(
					b.conditional(
						node.test,
						branch_helper.component_element,
						continuation_helper.component_element,
					),
					node,
				),
			),
		),
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
	const combined = render_nodes.map((node) => clone_expression_node(node, false));

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
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_element(node, transform_context, raw_children = node.children || []) {
	if (node.type === 'JSXElement') return node;
	if (!node.id) {
		report_jsx_fragment_in_tsrx_error(node, transform_context);
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
		const html_child_transform = rewrite_host_html_children(
			node,
			walked_children,
			raw_children,
			attributes,
			transform_context,
		);
		if (html_child_transform) {
			children = html_child_transform.children;
			selfClosing = html_child_transform.selfClosing;
		} else {
			children = create_element_children(walked_children, transform_context);
		}
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
 * @param {any} node
 * @param {any[]} walked_children
 * @param {any[]} raw_children
 * @param {any[]} attributes
 * @param {TransformContext} transform_context
 * @returns {{ children: any[]; selfClosing: boolean } | null}
 */
export function rewrite_host_html_children(
	node,
	walked_children,
	raw_children,
	attributes,
	transform_context,
) {
	const source_children = raw_children || walked_children;
	const source_html_index = source_children.findIndex((child) => child?.type === 'Html');
	if (source_html_index === -1) {
		return null;
	}
	const source_html = source_children[source_html_index];
	const walked_html =
		walked_children[source_html_index]?.type === 'Html'
			? walked_children[source_html_index]
			: source_html;

	if (is_component_like_element(node) || source_children.length !== 1) {
		report_invalid_html_child_error(source_html, transform_context);
	}

	const conflicting_attribute = get_host_html_conflicting_attribute(attributes, transform_context);
	if (conflicting_attribute !== null) {
		error(
			create_host_html_conflict_error(conflicting_attribute, transform_context),
			transform_context.filename,
			source_html,
			transform_context.errors,
			transform_context.comments,
		);
	}

	attributes.push(create_host_html_attribute(walked_html, source_html, transform_context));

	return { children: [], selfClosing: true };
}

/**
 * @param {any[]} attributes
 * @param {TransformContext} transform_context
 * @returns {{ kind: 'attribute'; name: string } | null}
 */
export function get_host_html_conflicting_attribute(attributes, transform_context) {
	const conflicting_attributes = get_host_html_conflicting_attribute_names(transform_context);
	for (const name of conflicting_attributes) {
		if (has_jsx_attribute(attributes, name)) {
			return { kind: 'attribute', name };
		}
	}

	return null;
}

/**
 * @param {{ kind: 'attribute'; name: string }} conflicting_attribute
 * @param {TransformContext} transform_context
 * @returns {string}
 */
export function create_host_html_conflict_error(conflicting_attribute, transform_context) {
	const html_attribute = get_host_html_attribute_name(transform_context);
	return `\`{html ...}\` lowers to \`${html_attribute}\` on the ${transform_context.platform.name} target and cannot be combined with an existing \`${conflicting_attribute.name}\` attribute.`;
}

/**
 * @param {TransformContext} transform_context
 * @returns {string[]}
 */
function get_host_html_conflicting_attribute_names(transform_context) {
	switch (transform_context.platform.name) {
		case 'Solid':
			return ['innerHTML', 'textContent'];
		case 'Vue':
			return ['innerHTML'];
		default:
			return [get_host_html_attribute_name(transform_context)];
	}
}

/**
 * @param {TransformContext} transform_context
 * @returns {'dangerouslySetInnerHTML' | 'innerHTML'}
 */
function get_host_html_attribute_name(transform_context) {
	return transform_context.platform.jsx?.htmlProp === 'dangerouslySetInnerHTML'
		? 'dangerouslySetInnerHTML'
		: 'innerHTML';
}

/**
 * @param {any[]} attributes
 * @param {string} name
 * @returns {boolean}
 */
function has_jsx_attribute(attributes, name) {
	return attributes.some(
		(attr) =>
			attr?.type === 'JSXAttribute' &&
			attr.name?.type === 'JSXIdentifier' &&
			attr.name.name === name,
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

	if (
		(node.type === 'ReturnStatement' && node.argument == null) ||
		is_lone_return_if_statement(node)
	) {
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
		b.call(b.arrow([], b.block(build_render_statements(body_nodes, true, transform_context)))),
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
 * Targets can either emit the helper component at module scope or cache the
 * component identity in module state while initializing it from the parent.
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

	statements.push(b.return(helper.component_element));

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
 * @param {TransformContext} transform_context
 * @param {Set<string>} [local_binding_names]
 * @returns {void}
 */
function validate_hook_safe_body_does_not_assign_hook_results_to_outer_bindings(
	body_nodes,
	transform_context,
	local_binding_names,
) {
	if (!is_react_like_hook_platform(transform_context)) {
		return;
	}
	if (!body_contains_top_level_hook_call(body_nodes, transform_context, true)) {
		return;
	}
	if (!transform_context.available_bindings || transform_context.available_bindings.size === 0) {
		return;
	}

	const shadowed_names = collect_block_binding_names(body_nodes);
	for (const name of local_binding_names || []) {
		shadowed_names.add(name);
	}
	validate_hook_outer_assignments_in_node(body_nodes, shadowed_names, transform_context, new Set());
}

/**
 * @param {TransformContext} transform_context
 * @returns {boolean}
 */
function is_react_like_hook_platform(transform_context) {
	return (
		transform_context.platform.name === 'React' || transform_context.platform.name === 'Preact'
	);
}

/**
 * @param {any[]} statements
 * @returns {Set<string>}
 */
function collect_block_binding_names(statements) {
	const names = new Set();
	for (const statement of statements || []) {
		collect_block_binding_names_from_statement(statement, names);
	}
	return names;
}

/**
 * @param {any} statement
 * @param {Set<string>} names
 * @returns {void}
 */
function collect_block_binding_names_from_statement(statement, names) {
	if (!statement || typeof statement !== 'object') {
		return;
	}

	if (statement.type === 'VariableDeclaration') {
		for (const declaration of statement.declarations || []) {
			collect_pattern_names(declaration.id, names);
		}
		return;
	}

	if (
		(statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') &&
		statement.id?.type === 'Identifier'
	) {
		names.add(statement.id.name);
		return;
	}

	if (statement.type === 'ForOfStatement' || statement.type === 'ForInStatement') {
		if (statement.left?.type === 'VariableDeclaration' && statement.left.kind === 'var') {
			for (const declaration of statement.left.declarations || []) {
				collect_pattern_names(declaration.id, names);
			}
		}
		return;
	}

	if (
		statement.type === 'ForStatement' &&
		statement.init?.type === 'VariableDeclaration' &&
		statement.init.kind === 'var'
	) {
		for (const declaration of statement.init.declarations || []) {
			collect_pattern_names(declaration.id, names);
		}
	}
}

/**
 * @param {any} pattern
 * @param {Set<string>} names
 * @returns {void}
 */
function collect_pattern_names(pattern, names) {
	if (!pattern || typeof pattern !== 'object') {
		return;
	}

	if (pattern.type === 'Identifier') {
		names.add(pattern.name);
		return;
	}

	if (pattern.type === 'RestElement') {
		collect_pattern_names(pattern.argument, names);
		return;
	}

	if (pattern.type === 'AssignmentPattern') {
		collect_pattern_names(pattern.left, names);
		return;
	}

	if (pattern.type === 'ArrayPattern') {
		for (const element of pattern.elements || []) {
			collect_pattern_names(element, names);
		}
		return;
	}

	if (pattern.type === 'ObjectPattern') {
		for (const property of pattern.properties || []) {
			if (property.type === 'RestElement') {
				collect_pattern_names(property.argument, names);
			} else {
				collect_pattern_names(property.value, names);
			}
		}
	}
}

/**
 * @param {any} node
 * @param {Set<string>} shadowed_names
 * @param {TransformContext} transform_context
 * @param {Set<string>} hook_result_names
 * @returns {void}
 */
function validate_hook_outer_assignments_in_node(
	node,
	shadowed_names,
	transform_context,
	hook_result_names,
) {
	if (!node || typeof node !== 'object') {
		return;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			validate_hook_outer_assignments_in_node(
				child,
				shadowed_names,
				transform_context,
				hook_result_names,
			);
		}
		return;
	}

	if (is_function_or_component_node(node)) {
		return;
	}

	if (node.type === 'CallExpression' && is_hook_callee(node.callee)) {
		validate_hook_callback_outer_mutations(node, shadowed_names, transform_context);
	}

	if (node.type === 'BlockStatement') {
		const next_shadowed = new Set(shadowed_names);
		const next_hook_result_names = new Set(hook_result_names);
		for (const name of collect_block_binding_names(node.body || [])) {
			next_shadowed.add(name);
		}
		for (const child of node.body || []) {
			validate_hook_outer_assignments_in_node(
				child,
				next_shadowed,
				transform_context,
				next_hook_result_names,
			);
		}
		return;
	}

	if (node.type === 'VariableDeclaration') {
		for (const declaration of node.declarations || []) {
			if (
				declaration.init &&
				expression_contains_hook_derived_value(
					declaration.init,
					transform_context,
					hook_result_names,
				)
			) {
				collect_pattern_names(declaration.id, hook_result_names);
			}
			validate_hook_outer_assignments_in_node(
				declaration.init,
				shadowed_names,
				transform_context,
				hook_result_names,
			);
		}
		return;
	}

	if (
		node.type === 'AssignmentExpression' &&
		expression_contains_hook_derived_value(node.right, transform_context, hook_result_names)
	) {
		const outer_names = get_referenced_outer_binding_names(
			node.left,
			transform_context.available_bindings,
			shadowed_names,
		);
		if (outer_names.length > 0) {
			report_hook_outer_assignment_error(
				node.left,
				outer_names,
				find_first_hook_call_name(node.right) || 'hook',
				transform_context,
			);
		}
		for (const name of get_referenced_local_binding_names(node.left, shadowed_names)) {
			hook_result_names.add(name);
		}
	}

	if (node.type === 'ForOfStatement') {
		if (
			node.left &&
			node.left.type !== 'VariableDeclaration' &&
			expression_contains_hook_derived_value(node.right, transform_context, hook_result_names)
		) {
			const outer_names = get_referenced_outer_binding_names(
				node.left,
				transform_context.available_bindings,
				shadowed_names,
			);
			if (outer_names.length > 0) {
				report_hook_outer_assignment_error(
					node.left,
					outer_names,
					find_first_hook_call_name(node.right) || 'hook',
					transform_context,
				);
			}
			for (const name of get_referenced_local_binding_names(node.left, shadowed_names)) {
				hook_result_names.add(name);
			}
		}

		validate_hook_outer_assignments_in_node(
			node.right,
			shadowed_names,
			transform_context,
			hook_result_names,
		);

		// Loop-declared bindings (`for (const x of …)`, `for (let x of …)`) live
		// only in the body. They are deliberately NOT in the enclosing block's
		// shadowed set (see collect_block_binding_names_from_statement), so add
		// them just for the body recursion to keep references to the loop var
		// from being flagged as outer-binding mutations.
		const body_shadowed = new Set(shadowed_names);
		if (node.left && node.left.type === 'VariableDeclaration') {
			for (const declaration of node.left.declarations || []) {
				collect_pattern_names(declaration.id, body_shadowed);
			}
		}
		validate_hook_outer_assignments_in_node(
			node.body,
			body_shadowed,
			transform_context,
			hook_result_names,
		);
		return;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		validate_hook_outer_assignments_in_node(
			node[key],
			shadowed_names,
			transform_context,
			hook_result_names,
		);
	}
}

/**
 * @param {any} call_node
 * @param {Set<string>} shadowed_names
 * @param {TransformContext} transform_context
 * @returns {void}
 */
function validate_hook_callback_outer_mutations(call_node, shadowed_names, transform_context) {
	const hook_name = get_hook_callee_name(call_node.callee);
	for (const argument of call_node.arguments || []) {
		if (!is_function_or_component_node(argument)) {
			continue;
		}
		const callback_shadowed_names = create_function_like_shadowed_names(argument, shadowed_names);
		validate_hook_callback_outer_mutations_in_node(
			argument.body,
			callback_shadowed_names,
			transform_context,
			hook_name,
		);
	}
}

/**
 * @param {any} node
 * @param {Set<string>} shadowed_names
 * @returns {Set<string>}
 */
function create_function_like_shadowed_names(node, shadowed_names) {
	const next_shadowed_names = new Set(shadowed_names);
	for (const param of node.params || []) {
		collect_pattern_names(param, next_shadowed_names);
	}
	if (node.body?.type === 'BlockStatement') {
		for (const name of collect_block_binding_names(node.body.body || [])) {
			next_shadowed_names.add(name);
		}
	}
	return next_shadowed_names;
}

/**
 * @param {any} node
 * @param {Set<string>} shadowed_names
 * @param {TransformContext} transform_context
 * @param {string} hook_name
 * @returns {void}
 */
function validate_hook_callback_outer_mutations_in_node(
	node,
	shadowed_names,
	transform_context,
	hook_name,
) {
	if (!node || typeof node !== 'object') {
		return;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			validate_hook_callback_outer_mutations_in_node(
				child,
				shadowed_names,
				transform_context,
				hook_name,
			);
		}
		return;
	}

	if (is_function_or_component_node(node)) {
		validate_hook_callback_outer_mutations_in_node(
			node.body,
			create_function_like_shadowed_names(node, shadowed_names),
			transform_context,
			hook_name,
		);
		return;
	}

	if (node.type === 'BlockStatement') {
		const next_shadowed_names = new Set(shadowed_names);
		for (const name of collect_block_binding_names(node.body || [])) {
			next_shadowed_names.add(name);
		}
		for (const child of node.body || []) {
			validate_hook_callback_outer_mutations_in_node(
				child,
				next_shadowed_names,
				transform_context,
				hook_name,
			);
		}
		return;
	}

	if (node.type === 'AssignmentExpression') {
		const outer_names = get_referenced_outer_binding_names(
			node.left,
			transform_context.available_bindings,
			shadowed_names,
		);
		if (outer_names.length > 0) {
			report_hook_callback_outer_mutation_error(
				node.left,
				outer_names,
				hook_name,
				transform_context,
			);
		}
	}

	if (node.type === 'UpdateExpression') {
		const outer_names = get_referenced_outer_binding_names(
			node.argument,
			transform_context.available_bindings,
			shadowed_names,
		);
		if (outer_names.length > 0) {
			report_hook_callback_outer_mutation_error(
				node.argument,
				outer_names,
				hook_name,
				transform_context,
			);
		}
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (key === 'left' && node.type === 'AssignmentExpression') {
			continue;
		}
		if (key === 'argument' && node.type === 'UpdateExpression') {
			continue;
		}
		validate_hook_callback_outer_mutations_in_node(
			node[key],
			shadowed_names,
			transform_context,
			hook_name,
		);
	}
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @param {Set<string>} hook_result_names
 * @returns {boolean}
 */
function expression_contains_hook_derived_value(node, transform_context, hook_result_names) {
	return (
		node_contains_top_level_hook_call(node, false, transform_context, true) ||
		references_name_in_set(node, hook_result_names)
	);
}

/**
 * @param {any} node
 * @param {Set<string>} names
 * @returns {boolean}
 */
function references_name_in_set(node, names) {
	if (!node || typeof node !== 'object' || names.size === 0) {
		return false;
	}

	if (node.type === 'Identifier') {
		return names.has(node.name);
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
		return node.some((child) => references_name_in_set(child, names));
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (key === 'property' && node.type === 'MemberExpression' && !node.computed) {
			continue;
		}
		if (key === 'key' && node.type === 'Property' && !node.computed && !node.shorthand) {
			continue;
		}
		if (references_name_in_set(node[key], names)) {
			return true;
		}
	}

	return false;
}

/**
 * @param {any} node
 * @param {Set<string>} shadowed_names
 * @returns {string[]}
 */
function get_referenced_local_binding_names(node, shadowed_names) {
	const names = new Set();
	collect_referenced_local_binding_names(node, shadowed_names, names);
	return [...names];
}

/**
 * @param {any} node
 * @param {Set<string>} shadowed_names
 * @param {Set<string>} names
 * @returns {void}
 */
function collect_referenced_local_binding_names(node, shadowed_names, names) {
	if (!node || typeof node !== 'object') {
		return;
	}

	if (node.type === 'Identifier') {
		if (shadowed_names.has(node.name)) {
			names.add(node.name);
		}
		return;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			collect_referenced_local_binding_names(child, shadowed_names, names);
		}
		return;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (key === 'property' && node.type === 'MemberExpression' && !node.computed) {
			continue;
		}
		if (key === 'key' && node.type === 'Property' && !node.computed && !node.shorthand) {
			continue;
		}
		collect_referenced_local_binding_names(node[key], shadowed_names, names);
	}
}

/**
 * @param {any} node
 * @param {Map<string, AST.Identifier>} available_bindings
 * @param {Set<string>} shadowed_names
 * @returns {string[]}
 */
function get_referenced_outer_binding_names(node, available_bindings, shadowed_names) {
	const names = new Set();
	collect_referenced_outer_binding_names(node, available_bindings, shadowed_names, names);
	return [...names];
}

/**
 * @param {any} node
 * @param {Map<string, AST.Identifier>} available_bindings
 * @param {Set<string>} shadowed_names
 * @param {Set<string>} names
 * @returns {void}
 */
function collect_referenced_outer_binding_names(node, available_bindings, shadowed_names, names) {
	if (!node || typeof node !== 'object') {
		return;
	}

	if (node.type === 'Identifier') {
		if (available_bindings.has(node.name) && !shadowed_names.has(node.name)) {
			names.add(node.name);
		}
		return;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			collect_referenced_outer_binding_names(child, available_bindings, shadowed_names, names);
		}
		return;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (key === 'property' && node.type === 'MemberExpression' && !node.computed) {
			continue;
		}
		if (key === 'key' && node.type === 'Property' && !node.computed && !node.shorthand) {
			continue;
		}
		collect_referenced_outer_binding_names(node[key], available_bindings, shadowed_names, names);
	}
}

/**
 * @param {any} node
 * @returns {string | null}
 */
function find_first_hook_call_name(node) {
	if (!node || typeof node !== 'object') {
		return null;
	}

	if (node.type === 'CallExpression' && is_hook_callee(node.callee)) {
		return get_hook_callee_name(node.callee);
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'Component'
	) {
		return null;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			const name = find_first_hook_call_name(child);
			if (name) return name;
		}
		return null;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		const name = find_first_hook_call_name(node[key]);
		if (name) return name;
	}

	return null;
}

/**
 * @param {any} callee
 * @returns {string}
 */
function get_hook_callee_name(callee) {
	if (callee?.type === 'Identifier') {
		return callee.name;
	}
	if (
		callee?.type === 'MemberExpression' &&
		!callee.computed &&
		callee.property?.type === 'Identifier'
	) {
		return callee.property.name;
	}
	return 'hook';
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
	validate_hook_safe_body_does_not_assign_hook_results_to_outer_bindings(
		body_nodes,
		transform_context,
	);

	const helper_id =
		preallocated_helper_id ??
		create_generated_identifier(create_local_statement_component_name(transform_context));
	const use_module_scoped_component = should_use_module_scoped_hook_components(transform_context);
	const component_id = use_module_scoped_component
		? create_module_scoped_hook_component_id(helper_id, transform_context)
		: helper_id;
	const helper_bindings = get_referenced_helper_bindings(
		body_nodes,
		transform_context.available_bindings,
	);
	const aliases = use_module_scoped_component
		? []
		: helper_bindings.map((binding) => create_helper_type_alias_declaration(helper_id, binding));
	const props_type =
		helper_bindings.length > 0 && !use_module_scoped_component
			? create_helper_props_type_literal(helper_bindings, aliases)
			: null;
	const params =
		helper_bindings.length > 0
			? [
					props_type !== null
						? create_typed_helper_props_pattern(helper_bindings, props_type)
						: create_helper_props_pattern(helper_bindings),
				]
			: [];

	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);

	const helper_fn = b.function(
		clone_identifier(component_id),
		params,
		b.block(build_render_statements(body_nodes, true, transform_context)),
	);
	helper_fn.metadata.is_component = true;
	helper_fn.metadata.is_method = false;

	transform_context.available_bindings = saved_bindings;

	const component_element = create_helper_component_element(
		component_id,
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

	if (use_module_scoped_component) {
		transform_context.helper_state.helpers.push(
			create_helper_declaration(component_id, helper_fn, source_node, transform_context),
		);
		return {
			setup_statements: [],
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
 * @param {AST.FunctionExpression} helper_fn
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
 * @param {AST.FunctionExpression} helper_fn
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
	return b.call(b.arrow([], b.block([...setup_statements, b.return(component_element)])));
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
		declaration: b.const(clone_identifier(alias_id), create_generated_identifier(binding.name)),
	};
}

/**
 * @param {AST.Identifier[]} bindings
 * @param {{ id: AST.Identifier }[]} aliases
 * @returns {any}
 */
function create_helper_props_type_literal(bindings, aliases) {
	return b.ts_type_literal(
		bindings.map((binding, i) =>
			b.ts_property_signature(
				create_generated_identifier(binding.name),
				b.ts_type_annotation(b.ts_type_query(clone_identifier(aliases[i].id))),
			),
		),
	);
}

/**
 * @param {AST.Identifier[]} bindings
 * @param {any} props_type
 * @returns {AST.ObjectPattern}
 */
function create_typed_helper_props_pattern(bindings, props_type) {
	const pattern = create_helper_props_pattern(bindings);
	/** @type {any} */ (pattern).typeAnnotation = b.ts_type_annotation(props_type);
	return pattern;
}

/**
 * @param {AST.Identifier} cache_id
 * @returns {any}
 */
function create_helper_cache_declaration(cache_id) {
	return b.let(clone_identifier(cache_id));
}

/**
 * @param {AST.Identifier} helper_id
 * @param {AST.Identifier} cache_id
 * @param {any} helper_init
 * @returns {any}
 */
function create_cached_helper_declaration(helper_id, cache_id, helper_init) {
	return b.const(
		clone_identifier(helper_id),
		b.logical(
			'??',
			clone_identifier(cache_id),
			b.assignment('=', clone_identifier(cache_id), helper_init),
		),
	);
}

/**
 * @param {AST.Identifier} helper_id
 * @param {AST.FunctionExpression} helper_fn
 * @returns {AST.FunctionDeclaration}
 */
function create_helper_function_declaration_from_expression(helper_id, helper_fn) {
	return {
		...helper_fn,
		type: 'FunctionDeclaration',
		id: clone_identifier(helper_id),
	};
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
		case 'Tsrx':
			return tsrx_node_to_jsx_expression(node, transform_context, true);
		case 'TsxCompat':
			return tsx_compat_node_to_jsx_expression(node, transform_context, true);
		case 'Element':
			return to_jsx_element(node, transform_context);
		case 'Text':
			return to_jsx_expression_container(to_text_expression(node.expression, node), node);
		case 'TSRXExpression':
			return to_jsx_expression_container(node.expression, node);
		case 'Html':
			return recover_invalid_html_child(node, transform_context);
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
 * Lower a `<tsrx>` node's native TSRX template body to a JSX expression.
 * Unlike `<tsx>`, children have already been parsed and transformed through
 * the normal TSRX Element/Text/control-flow visitors.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @param {boolean} [in_jsx_child]
 * @returns {any}
 */
function tsrx_node_to_jsx_expression(node, transform_context, in_jsx_child = false) {
	const children = (node.children || []).filter(
		(/** @type {any} */ child) =>
			child &&
			child.type !== 'EmptyStatement' &&
			(child.type !== 'JSXText' || child.value.trim() !== ''),
	);

	/** @type {any} */
	let expression;
	if (children.length === 0) {
		expression = create_null_literal();
	} else {
		expression = return_value_body_to_expression(children, node, transform_context);
	}

	if (!expression) {
		if (children.every(is_inline_element_child) && !children_contain_return_semantics(children)) {
			const saved_inside_element_child = transform_context.inside_element_child;
			transform_context.inside_element_child = true;
			try {
				const render_nodes = children.map((/** @type {any} */ child) =>
					to_jsx_child(child, transform_context),
				);
				expression = build_return_expression(render_nodes) || create_null_literal();
			} finally {
				transform_context.inside_element_child = saved_inside_element_child;
			}
		} else {
			expression = statement_body_to_jsx_child(children, transform_context).expression;
		}
	}

	if (
		in_jsx_child &&
		expression.type !== 'JSXElement' &&
		expression.type !== 'JSXFragment' &&
		expression.type !== 'JSXText' &&
		expression.type !== 'JSXExpressionContainer'
	) {
		return to_jsx_expression_container(expression, node);
	}

	return expression;
}

/**
 * Explicit return values inside expression-position `<tsrx>` templates are JavaScript
 * values, so keep them out of platform render control flow.
 *
 * @param {any[]} body_nodes
 * @param {any} source_node
 * @param {TransformContext} [transform_context]
 * @returns {any | null}
 */
export function return_value_body_to_expression(body_nodes, source_node, transform_context) {
	if (!body_contains_top_level_return_value(body_nodes)) return null;

	if (body_nodes.length === 1) {
		const expression = return_value_statement_to_expression(body_nodes[0], transform_context);
		if (expression) return expression;
	}

	return create_statement_iife(body_nodes, source_node, transform_context);
}

/**
 * @param {any} node
 * @param {TransformContext} [transform_context]
 * @returns {any | null}
 */
function return_value_statement_to_expression(node, transform_context) {
	if (node?.type === 'ReturnStatement' && node.argument != null) {
		return node.argument;
	}

	if (node?.type === 'IfStatement') {
		return return_value_if_statement_to_conditional_expression(node, transform_context);
	}

	return null;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function body_contains_top_level_return_value(node) {
	if (!node || typeof node !== 'object') return false;

	if (Array.isArray(node)) {
		return node.some(body_contains_top_level_return_value);
	}

	if (node.type === 'ReturnStatement') {
		return node.argument != null;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'ClassDeclaration' ||
		node.type === 'ClassExpression' ||
		node.type === 'Component'
	) {
		return false;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (body_contains_top_level_return_value(node[key])) {
			return true;
		}
	}

	return false;
}

/**
 * @param {any[]} body_nodes
 * @param {any} source_node
 * @param {TransformContext} [transform_context]
 * @returns {any}
 */
function create_statement_iife(body_nodes, source_node, transform_context) {
	return set_generated_expression_loc(
		b.call(b.arrow([], b.block(body_nodes))),
		source_node,
		transform_context,
	);
}

/**
 * @param {any} node
 * @param {any} source_node
 * @param {TransformContext} [transform_context]
 * @returns {any}
 */
function set_generated_expression_loc(node, source_node, transform_context) {
	if (transform_context?.typeOnly || !source_node?.loc) return node;
	return setLocation(/** @type {any} */ (node), source_node);
}

/**
 * @returns {any}
 */
function create_undefined_expression() {
	return b.unary('void', b.literal(0));
}

/**
 * @param {any} node
 * @param {TransformContext} [transform_context]
 * @returns {any | null}
 */
function return_value_block_to_expression(node, transform_context) {
	const body = node?.type === 'BlockStatement' ? node.body : node ? [node] : [];
	if (body.length !== 1) return null;

	return return_value_statement_to_expression(body[0], transform_context);
}

/**
 * @param {any} node
 * @param {TransformContext} [transform_context]
 * @returns {any | null}
 */
function return_value_if_statement_to_conditional_expression(node, transform_context) {
	if (!node || node.type !== 'IfStatement') return null;

	const consequent = return_value_block_to_expression(node.consequent, transform_context);
	if (!consequent) return null;

	let alternate = create_undefined_expression();
	if (node.alternate) {
		alternate = return_value_block_to_expression(node.alternate, transform_context);
		if (!alternate) return null;
	}

	return set_generated_expression_loc(
		b.conditional(node.test, consequent, alternate),
		node,
		transform_context,
	);
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
		b.call(b.arrow([], b.block([render_if_statement, create_null_return_statement()]))),
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

	return set_loc(b.conditional(node.test, consequent, alternate), node);
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
	return set_loc(b.return(null), source_node);
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

	const iter_callback = b.arrow(loop_params, b.block(body_statements));

	if (transform_context.platform.imports.forOfIterableHelper) {
		transform_context.needs_for_of_iterable = true;
		return to_jsx_expression_container(
			b.call(b.id(MAP_ITERABLE_INTERNAL_NAME), node.right, iter_callback),
		);
	}

	return to_jsx_expression_container(
		b.call(b.member(node.right, create_generated_identifier('map')), iter_callback),
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
					name: b.id('key'),
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
					b.jsx_attribute(
						b.jsx_id('key'),
						to_jsx_expression_container(clone_expression_node(key_expression), key_expression),
					),
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
	const { setup_statements, switch_statement } = build_switch_with_lift(node, transform_context);

	return to_jsx_expression_container(
		b.call(
			b.arrow([], b.block([...setup_statements, switch_statement, create_null_return_statement()])),
		),
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
		if (pending_body.length > 0 && !pending_body.some(is_jsx_child)) {
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
		const fallback_content =
			pending_body_nodes.length === 0
				? to_jsx_expression_container(create_null_literal())
				: statement_body_to_jsx_child(pending_body_nodes, transform_context);

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
		const catch_scoped_names = new Set();
		for (const param of catch_params) {
			collect_pattern_bindings(param, transform_context.available_bindings);
			collect_pattern_names(param, catch_scoped_names);
		}
		validate_hook_safe_body_does_not_assign_hook_results_to_outer_bindings(
			catch_body_nodes,
			transform_context,
			catch_scoped_names,
		);

		const fallback_fn = b.arrow(
			catch_params,
			b.block(build_render_statements(catch_body_nodes, true, transform_context)),
		);

		transform_context.available_bindings = saved_catch_bindings;

		const boundary_content =
			transform_context.platform.hooks?.createErrorBoundaryContent?.(
				try_content,
				transform_context,
				node,
			) ?? null;

		if (boundary_content && transform_context.inside_element_child) {
			result = to_jsx_expression_container(
				b.call(
					'TsrxErrorBoundary',
					b.object([b.init('fallback', fallback_fn), b.init('content', boundary_content)]),
				),
			);

			return result;
		}

		result = create_jsx_element(
			'TsrxErrorBoundary',
			[
				b.jsx_attribute(
					b.jsx_id('fallback'),
					to_jsx_expression_container(/** @type {any} */ (fallback_fn)),
				),
				...(boundary_content
					? [b.jsx_attribute(b.jsx_id('content'), to_jsx_expression_container(boundary_content))]
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
		imports.push(b.imports([['Fragment', 'Fragment']], platform.imports.fragment));
	}

	if (transform_context.needs_suspense) {
		imports.push(b.imports([['Suspense', 'Suspense']], suspense_source));
	}

	if (transform_context.needs_for_of_iterable && platform.imports.forOfIterableHelper) {
		const specifiers = [b.import_specifier('map_iterable', MAP_ITERABLE_INTERNAL_NAME)];
		// The loop-scoped type alias `IterationValue<typeof source>` only
		// appears in the output when at least one hook-bearing for-of body
		// was lowered with non-module-scoped helpers (editor tooling sets
		// this for typeOnly virtual modules).
		if (transform_context.needs_iteration_value_type) {
			specifiers.push(b.import_specifier('IterationValue', ITERATION_VALUE_INTERNAL_NAME, 'type'));
		}
		imports.push(b.import_declaration(specifiers, platform.imports.forOfIterableHelper));
	}

	if (transform_context.needs_error_boundary) {
		imports.push(
			b.imports([['TsrxErrorBoundary', 'TsrxErrorBoundary']], platform.imports.errorBoundary),
		);
	}

	const merge_refs_source =
		transform_context.needs_merge_refs && platform.imports.mergeRefs
			? platform.imports.mergeRefs
			: null;
	const ref_prop_source =
		transform_context.needs_ref_prop && platform.imports.refProp ? platform.imports.refProp : null;
	const normalize_spread_props_source =
		transform_context.needs_normalize_spread_props && platform.imports.refProp
			? platform.imports.refProp
			: null;

	/** @type {Map<string, any[]>} */
	const ref_imports = new Map();

	if (merge_refs_source !== null) {
		add_ref_import_specifier(
			ref_imports,
			merge_refs_source,
			b.import_specifier('mergeRefs', MERGE_REFS_INTERNAL_NAME),
		);
	}

	if (ref_prop_source !== null) {
		add_ref_import_specifier(
			ref_imports,
			ref_prop_source,
			b.import_specifier('create_ref_prop', CREATE_REF_PROP_INTERNAL_NAME),
		);
	}

	if (normalize_spread_props_source !== null) {
		add_ref_import_specifier(
			ref_imports,
			normalize_spread_props_source,
			b.import_specifier('normalize_spread_props', NORMALIZE_SPREAD_PROPS_INTERNAL_NAME),
		);
	}

	for (const [source, ref_specifiers] of ref_imports) {
		imports.push(b.import_declaration(ref_specifiers, source));
	}

	if (imports.length > 0) {
		program.body.unshift(...imports);
	}
}

/**
 * @param {Map<string, any[]>} imports
 * @param {string} source
 * @param {any} specifier
 */
function add_ref_import_specifier(imports, source, specifier) {
	const specifiers = imports.get(source);
	if (specifiers) {
		specifiers.push(specifier);
	} else {
		imports.set(source, [specifier]);
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
				b.block(
					alternate_has_hooks
						? hook_safe_render_statements(alternate_body, undefined, transform_context)
						: build_render_statements(alternate_body, true, transform_context),
				),
				node.alternate,
			);
		}
	}

	return set_loc(
		b.if(
			node.test,
			set_loc(
				b.block(
					consequent_has_hooks
						? hook_safe_render_statements(consequent_body, undefined, transform_context)
						: build_render_statements(consequent_body, true, transform_context),
				),
				node.consequent,
			),
			alternate,
		),
		node,
	);
}

/**
 * Per-source-case information used by the switch lift to decide whether each
 * case body needs to be hoisted into its own helper component or can stay
 * inline.
 *
 * `own_body` is everything in the case's `consequent` up to (and including for
 * `return <expr>`, excluding for `break` / bare `return;`) the first
 * terminator. `has_terminator` records whether such a terminator was seen.
 *
 * @param {any[]} consequent
 * @returns {{ own_body: any[], has_terminator: boolean }}
 */
function summarize_switch_case_body(consequent) {
	const own_body = [];
	let has_terminator = false;
	for (const child of consequent) {
		if (child.type === 'BreakStatement') {
			has_terminator = true;
			break;
		}
		if (child.type === 'ReturnStatement' && child.argument == null) {
			has_terminator = true;
			break;
		}
		own_body.push(child);
		if (child.type === 'ReturnStatement') {
			// `return <expr>;` — keep it in own_body so build_render_statements
			// can emit it as the terminal return for this case, then stop
			// collecting further nodes.
			has_terminator = true;
			break;
		}
	}
	return { own_body, has_terminator };
}

/**
 * Clone a helper's `component_element` for embedding in another case arm or
 * inside another helper's body. Locations are stripped because the same
 * element appears in multiple positions; only the helper's *definition* (the
 * lifted function) keeps the source position so editor IntelliSense doesn't
 * see double/triple hits per source range.
 *
 * @param {{ component_element: ESTreeJSX.JSXElement }} helper
 * @returns {any}
 */
export function clone_switch_helper_invocation(helper) {
	return clone_expression_node(helper.component_element, false);
}

/**
 * Plan the switch lift: decide which case bodies to hoist into their own
 * helper components, build them in reverse so each helper can chain into the
 * next, and return everything callers need to construct a target-specific
 * switch shape (a JS `switch` for React/Preact/Vue or `<Switch>/<Match>` for
 * Solid). Centralizes the lift bookkeeping so both consumers see the same
 * hook-detection rules, duplication analysis, and helper-id numbering.
 *
 * Returned helpers — when non-null — are already constructed via
 * `create_hook_safe_helper`, which is the same path hook-bearing case bodies
 * have always used. Locally-scoped helpers have their declarations in
 * `setup_statements`; module-scoped helpers (the client transform default on
 * React, Vue, and Solid) already pushed their declarations into
 * `transform_context.helper_state.helpers`, so `setup_statements` is empty.
 *
 * @param {any} switch_node
 * @param {TransformContext} transform_context
 * @returns {{
 *   case_info: Array<{ own_body: any[], has_terminator: boolean }>,
 *   case_helpers: Array<{ setup_statements: any[], component_element: ESTreeJSX.JSXElement } | null>,
 *   find_next_helper_after: (from_index: number) => { component_element: ESTreeJSX.JSXElement } | null,
 *   setup_statements: any[],
 * }}
 */
export function plan_switch_lift(switch_node, transform_context) {
	const case_info = switch_node.cases.map((/** @type {any} */ c) => {
		const consequent = flatten_switch_consequent(c.consequent || []);
		return summarize_switch_case_body(consequent);
	});

	// A case body needs to be lifted iff (a) it would render in more than one
	// arm after fall-through expansion, or (b) it contains hooks (which always
	// went through the lift pipeline before this change). Duplication happens
	// exactly when the previous case has no terminator — that's the only way
	// an earlier arm can reach this body via JS fall-through semantics.
	const needs_helper = case_info.map(
		(/** @type {{ own_body: any[], has_terminator: boolean }} */ info, /** @type {number} */ k) => {
			if (info.own_body.length === 0) return false;
			if (body_contains_top_level_hook_call(info.own_body, transform_context, true)) {
				return true;
			}
			if (k === 0) return false;
			return !case_info[k - 1].has_terminator;
		},
	);

	// Pre-allocate helper ids in source order so the snapshot's
	// `StatementBodyHook<N>` numbering reads top-to-bottom by case position
	// even though we build helpers in reverse below.
	/** @type {Array<AST.Identifier | null>} */
	const helper_ids = needs_helper.map((/** @type {boolean} */ needs) =>
		needs
			? create_generated_identifier(create_local_statement_component_name(transform_context))
			: null,
	);

	/** @type {Array<{ setup_statements: any[], component_element: ESTreeJSX.JSXElement } | null>} */
	const case_helpers = new Array(switch_node.cases.length).fill(null);

	/**
	 * Find the next downstream helper this arm chains into when it has no
	 * terminator: scan forward past any empty cases until we hit either a
	 * helper-bearing case or a case whose body has a terminator (which stops
	 * the chain — JS would have `break`/`return`ed out at that point).
	 *
	 * @param {number} from_index
	 * @returns {{ component_element: ESTreeJSX.JSXElement } | null}
	 */
	function find_next_helper_after(from_index) {
		for (let j = from_index + 1; j < switch_node.cases.length; j++) {
			if (case_helpers[j]) return case_helpers[j];
			if (case_info[j].has_terminator) return null;
		}
		return null;
	}

	for (let i = switch_node.cases.length - 1; i >= 0; i--) {
		if (!needs_helper[i]) continue;
		const { own_body, has_terminator } = case_info[i];

		let helper_body = own_body;
		if (!has_terminator) {
			const next_helper = find_next_helper_after(i);
			if (next_helper) {
				helper_body = [...own_body, clone_switch_helper_invocation(next_helper)];
			}
		}

		case_helpers[i] = create_hook_safe_helper(
			helper_body,
			undefined,
			switch_node.cases[i],
			transform_context,
			/** @type {any} */ (helper_ids[i]),
		);
	}

	// Hoist all helpers' setup statements above the switch in source order so
	// the switch body stays a pure dispatcher.
	const setup_statements = [];
	for (const helper of case_helpers) {
		if (helper) setup_statements.push(...helper.setup_statements);
	}

	return {
		case_info,
		case_helpers,
		find_next_helper_after,
		setup_statements,
	};
}

/**
 * Switch lift for fall-through deduplication. Reuses the same `create_hook_safe_helper`
 * pipeline as hook-bearing case bodies: every case whose body would otherwise
 * appear in 2+ arms (because the previous case had no `break` / `return`) is
 * hoisted into its own helper component, and each upstream arm references the
 * next helper at the end of its own body to materialize JS fall-through at
 * render time. Cases whose bodies live in exactly one arm stay inline so the
 * common (break-terminated) shape compiles to the same simple switch as before
 * the lift was introduced.
 *
 * The chain pattern:
 *   helper_idle  = () => <><Online/><Helper_active/></>
 *   helper_active = () => <><Away/><Helper_offline/></>
 *   helper_offline = () => <Offline/>
 *
 *   case "idle":    return <Helper_idle/>
 *   case "active":  return <Helper_active/>
 *   case "offline": return <Helper_offline/>
 *
 * Each case body appears exactly once in the generated module — matching how
 * we already handle hook-bearing case bodies — which keeps the bundle from
 * growing quadratically in case count and means editor mappings are 1:1.
 *
 * @param {any} switch_node
 * @param {TransformContext} transform_context
 * @returns {{ setup_statements: any[], switch_statement: any }}
 */
function build_switch_with_lift(switch_node, transform_context) {
	const { case_info, case_helpers, find_next_helper_after, setup_statements } = plan_switch_lift(
		switch_node,
		transform_context,
	);

	const new_cases = switch_node.cases.map(
		(/** @type {any} */ original_case, /** @type {number} */ i) => {
			const helper = case_helpers[i];
			if (helper) {
				return /** @type {any} */ ({
					type: 'SwitchCase',
					test: original_case.test,
					consequent: [
						create_component_return_statement([helper.component_element], original_case),
					],
					metadata: { path: [] },
				});
			}

			const { own_body, has_terminator } = case_info[i];

			if (own_body.length === 0 && !has_terminator) {
				// Alias-pattern empty case (`case 'a': case 'b': ...`) — keep
				// the arm body empty so JS falls through to the next case at
				// runtime, where the helper invocation actually lives.
				return /** @type {any} */ ({
					type: 'SwitchCase',
					test: original_case.test,
					consequent: [],
					metadata: { path: [] },
				});
			}

			const case_body = [];
			const render_nodes = [];
			let has_terminal = false;

			for (const child of own_body) {
				if (is_bare_return_statement(child)) {
					case_body.push(create_component_return_statement(render_nodes, child));
					has_terminal = true;
					break;
				}
				if (child.type === 'ReturnStatement') {
					case_body.push(child);
					has_terminal = true;
					break;
				}
				if (is_jsx_child(child)) {
					render_nodes.push(to_jsx_child(child, transform_context));
				} else if (is_bare_render_expression(child)) {
					render_nodes.push(to_jsx_expression_container(child, child));
				} else {
					case_body.push(child);
				}
			}

			if (!has_terminal && !has_terminator) {
				const next_helper = find_next_helper_after(i);
				if (next_helper) {
					render_nodes.push(clone_switch_helper_invocation(next_helper));
				}
			}

			if (!has_terminal) {
				if (render_nodes.length > 0) {
					case_body.push(create_component_return_statement(render_nodes, original_case));
				} else if (has_terminator) {
					// Empty body with explicit `break;` / bare `return;` — keep
					// a `break` so JS doesn't fall through into the next case
					// (which may now hold the lifted helper invocation).
					case_body.push(
						/** @type {any} */ ({
							type: 'BreakStatement',
							label: null,
							metadata: { path: [] },
						}),
					);
				} else if (case_body.length > 0) {
					// Statements-only inline case without terminator. We've
					// already inlined the downstream chain via the helper
					// reference above, so emit a `break` to stop the runtime
					// from re-running downstream statements via JS fall-through.
					case_body.push(
						/** @type {any} */ ({
							type: 'BreakStatement',
							label: null,
							metadata: { path: [] },
						}),
					);
				}
			}

			return /** @type {any} */ ({
				type: 'SwitchCase',
				test: original_case.test,
				consequent: case_body,
				metadata: { path: [] },
			});
		},
	);

	return {
		setup_statements,
		switch_statement: /** @type {any} */ ({
			type: 'SwitchStatement',
			discriminant: switch_node.discriminant,
			cases: new_cases,
			metadata: { path: [] },
		}),
	};
}

/**
 * @returns {any}
 */
function create_null_return_statement() {
	return b.return(b.literal(null));
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
	const is_component = is_component_like_element(element);
	attrs = normalize_named_ref_attributes(attrs, !is_component, transform_context);
	const preprocess = transform_context.platform.hooks?.preprocessElementAttributes;
	if (preprocess) {
		attrs = preprocess(attrs, transform_context, element);
	}
	const hook = transform_context.platform.hooks?.transformElementAttributes;
	const result = hook
		? hook(attrs, transform_context, element)
		: attrs.map((/** @type {any} */ a) => to_jsx_attribute(a, transform_context));
	return merge_duplicate_refs(
		normalize_host_ref_spreads(result, !is_component, transform_context),
		transform_context,
	);
}

/**
 * @param {any} element
 * @returns {boolean}
 */
export function is_component_like_element(element) {
	const id = element?.id;
	if (!id) return false;
	if (id.type === 'Identifier') return /^[A-Z]/.test(id.name);
	if (id.type === 'JSXIdentifier') return /^[A-Z]/.test(id.name);
	if (id.type === 'MemberExpression') return true;
	if (id.type === 'JSXMemberExpression') return true;
	return false;
}

/**
 * @param {any} name
 * @returns {boolean}
 */
function is_component_like_jsx_name(name) {
	if (!name) return false;
	if (name.type === 'JSXIdentifier') return /^[A-Z]/.test(name.name);
	if (name.type === 'JSXMemberExpression') return true;
	return false;
}

/**
 * @param {any[]} attrs
 * @param {boolean} is_host
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function normalize_named_ref_attributes(attrs, is_host, transform_context) {
	if (!is_host) return attrs;

	return attrs.map((attr) => {
		if (!is_named_ref_attribute(attr)) {
			return attr;
		}

		if (transform_context.typeOnly) {
			return mark_type_only_named_ref_attribute(attr);
		}

		return {
			...attr,
			metadata: { ...(attr.metadata || {}), from_ref_keyword: true },
			name: attr.name?.type === 'JSXIdentifier' ? { ...attr.name, name: 'ref' } : b.id('ref'),
		};
	});
}

/**
 * @param {any} attr
 * @returns {any}
 */
function mark_type_only_named_ref_attribute(attr) {
	return {
		...attr,
		name: attr.name
			? {
					...attr.name,
					metadata: { ...(attr.name.metadata || {}), disable_verification: true },
				}
			: attr.name,
	};
}

/**
 * @param {any[]} attrs
 * @param {boolean} is_host
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function normalize_host_ref_spreads(attrs, is_host, transform_context) {
	if (!is_host) return attrs;

	const needs_explicit_spread_ref =
		transform_context.platform.jsx?.hostSpreadRefStrategy === 'explicit-ref-attr';
	const ref_exprs = attrs
		.filter((attr) => is_jsx_ref_attribute(attr))
		.map((attr) => attr.value.expression);
	const needs_synthetic_spread_ref = needs_explicit_spread_ref || ref_exprs.length > 0;

	return attrs.flatMap((attr) => {
		if (!attr || attr.type !== 'JSXSpreadAttribute') {
			return [attr];
		}

		transform_context.needs_normalize_spread_props = true;
		const normalized = b.call(NORMALIZE_SPREAD_PROPS_INTERNAL_NAME, attr.argument);

		if (needs_synthetic_spread_ref) {
			const normalized_id = create_generated_identifier(
				create_spread_props_name(transform_context),
			);
			const spread = {
				...attr,
				argument: clone_identifier(normalized_id),
			};
			const ref_attr = b.jsx_attribute(
				b.jsx_id('ref'),
				to_jsx_expression_container(b.member(clone_identifier(normalized_id), 'ref'), attr),
				false,
				attr,
			);
			ref_attr.metadata = { ...(ref_attr.metadata || {}) };
			/** @type {any} */ (ref_attr.metadata).from_ref_keyword = true;
			add_jsx_setup_declaration(spread, b.let(clone_identifier(normalized_id), normalized));

			return [spread, ref_attr];
		}

		return [
			{
				...attr,
				argument: normalized,
			},
		];
	});
}

/**
 * @param {TransformContext} transform_context
 * @returns {string}
 */
function create_spread_props_name(transform_context) {
	if (transform_context.helper_state) {
		return create_helper_name(transform_context.helper_state, 'spread_props');
	}

	transform_context.local_statement_component_index += 1;
	return `_tsrx_spread_props_${transform_context.local_statement_component_index}`;
}

/**
 * @param {any} node
 * @param {any} declaration
 */
export function add_jsx_setup_declaration(node, declaration) {
	node.metadata ??= { path: [] };
	(node.metadata.generated_setup_declarations ??= []).push(declaration);
}

/**
 * @param {any} node
 * @param {Set<any>} [seen]
 * @returns {any[]}
 */
export function extract_jsx_setup_declarations(node, seen = new Set()) {
	if (node == null || typeof node !== 'object' || seen.has(node)) {
		return [];
	}
	seen.add(node);

	const declarations = node.metadata?.generated_setup_declarations ?? [];
	if (node.metadata?.generated_setup_declarations) {
		delete node.metadata.generated_setup_declarations;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		declarations.push(...extract_jsx_setup_declarations(node[key], seen));
	}

	return declarations;
}

/**
 * @param {any} expression
 * @param {boolean} in_jsx_child
 * @returns {any}
 */
function wrap_jsx_setup_declarations(expression, in_jsx_child) {
	const declarations = extract_jsx_setup_declarations(expression);
	if (declarations.length === 0) {
		return expression;
	}

	const return_expression =
		expression?.type === 'JSXExpressionContainer' ? expression.expression : expression;
	const call = b.call(
		b.arrow(
			[],
			b.block([...declarations, b.return(return_expression)], expression),
			false,
			undefined,
			expression,
		),
	);

	return in_jsx_child ? to_jsx_expression_container(call, expression) : call;
}

/**
 * @param {any} attr
 * @returns {boolean}
 */
function is_named_ref_attribute(attr) {
	return !!(
		attr &&
		(attr.type === 'Attribute' || attr.type === 'JSXAttribute') &&
		attr.name &&
		((attr.name.type === 'Identifier' && attr.name.name !== 'ref') ||
			(attr.name.type === 'JSXIdentifier' && attr.name.name !== 'ref')) &&
		(attr.value?.type === 'RefExpression' ||
			is_ref_prop_expression(attr.value) ||
			(attr.value?.type === 'JSXExpressionContainer' &&
				is_ref_prop_expression(attr.value.expression)))
	);
}

/**
 * @param {any} html_expression
 * @param {any} source_attr
 * @param {TransformContext} transform_context
 * @returns {any}
 */
export function create_host_html_attribute(html_expression, source_attr, transform_context) {
	const expression =
		html_expression?.type === 'Html' ? html_expression.expression : html_expression;
	const name = get_host_html_attribute_name(transform_context);
	const value =
		name === 'dangerouslySetInnerHTML'
			? set_loc(b.object([b.prop('init', b.id('__html'), expression)]), source_attr)
			: expression;
	const value_container = to_jsx_expression_container(value, source_attr);
	if (name !== 'dangerouslySetInnerHTML') {
		setLocation(value_container, source_attr, true);
	}

	return set_loc(
		build_jsx_attribute(b.jsx_id(name), value_container, false, source_attr),
		source_attr,
	);
}

/**
 * @param {any} expression
 * @returns {boolean}
 */
export function is_ref_prop_expression(expression) {
	return (
		expression?.type === 'RefExpression' ||
		(expression?.type === 'CallExpression' &&
			expression.callee?.type === 'Identifier' &&
			expression.callee.name === CREATE_REF_PROP_INTERNAL_NAME)
	);
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
			? b.call(b.id(MERGE_REFS_INTERNAL_NAME), ...ref_exprs)
			: b.array(ref_exprs);

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
		b.jsx_expression_container(merged_value),
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
export const MERGE_REFS_INTERNAL_NAME = '__mergeRefs';
export const CREATE_REF_PROP_INTERNAL_NAME = '__create_ref_prop';
export const NORMALIZE_SPREAD_PROPS_INTERNAL_NAME = '__normalize_spread_props';
export const MAP_ITERABLE_INTERNAL_NAME = '__map_iterable';
export const ITERATION_VALUE_INTERNAL_NAME = '__IterationValue';

/**
 * @param {any} attr
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXAttribute | ESTreeJSX.JSXSpreadAttribute}
 */
export function to_jsx_attribute(attr, transform_context) {
	if (!attr) return attr;
	if (attr.type === 'JSXAttribute') {
		if (
			attr.value?.type === 'JSXExpressionContainer' &&
			attr.value.expression?.type === 'RefExpression'
		) {
			return {
				...attr,
				value: to_jsx_expression_container(
					create_ref_prop_call(attr.value.expression, transform_context),
				),
				metadata: { ...(attr.metadata || {}), from_ref_keyword: true },
			};
		}
		if (
			attr.value?.type === 'JSXExpressionContainer' &&
			is_ref_prop_expression(attr.value.expression)
		) {
			return {
				...attr,
				metadata: { ...(attr.metadata || {}), from_ref_keyword: true },
			};
		}
		return attr;
	}
	if (attr.type === 'JSXSpreadAttribute') {
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
		attr_name = set_loc(b.id('className'), attr.name);
		attr_name.metadata.source_name = 'class';
		attr_name.metadata.source_length = 'class'.length;
	}

	const name =
		attr_name && attr_name.type === 'Identifier' ? identifier_to_jsx_name(attr_name) : attr_name;

	let value = attr.value;
	const is_ref_expression_value =
		value?.type === 'RefExpression' ||
		is_ref_prop_expression(value) ||
		(value?.type === 'JSXExpressionContainer' && is_ref_prop_expression(value.expression));
	if (value) {
		if (value.type === 'Literal' && typeof value.value === 'string') {
			// Keep string literal as attribute string.
		} else if (value.type === 'RefExpression') {
			value = to_jsx_expression_container(create_ref_prop_call(value, transform_context));
		} else if (value.type !== 'JSXExpressionContainer') {
			value = to_jsx_expression_container(value);
		} else if (value.expression?.type === 'RefExpression') {
			value = to_jsx_expression_container(
				create_ref_prop_call(value.expression, transform_context),
			);
		}
	}

	const jsx_attribute = build_jsx_attribute(name, value || null, attr.shorthand === true);
	if (is_ref_expression_value) {
		/** @type {any} */ (jsx_attribute.metadata).from_ref_keyword = true;
	}

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
 * @returns {any}
 */
function create_ref_prop_call(node, transform_context) {
	transform_context.needs_ref_prop = true;

	const argument = node.argument;
	const args = [b.thunk(argument)];

	if (argument.type === 'Identifier' || argument.type === 'MemberExpression') {
		args.push(
			b.arrow([b.id('v')], b.assignment('=', clone_expression_node(argument, false), b.id('v'))),
		);
	}

	return b.call(CREATE_REF_PROP_INTERNAL_NAME, ...args);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXExpressionContainer}
 */
function dynamic_element_to_jsx_child(node, transform_context) {
	const dynamic_id = set_loc(create_generated_identifier('DynamicElement'), node.id);
	const alias_declaration = set_loc(b.const(dynamic_id, clone_expression_node(node.id)), node);
	const jsx_element = create_dynamic_jsx_element(dynamic_id, node, transform_context);

	return to_jsx_expression_container(
		b.call(
			b.arrow(
				[],
				b.block([
					alias_declaration,
					b.return(b.conditional(clone_identifier(dynamic_id), jsx_element, create_null_literal())),
				]),
			),
		),
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
