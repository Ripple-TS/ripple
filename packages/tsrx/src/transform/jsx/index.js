/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */
/** @import { JsxPlatform, JsxTransformContext, JsxTransformOptions, JsxTransformResult } from '@tsrx/core/types' */

import { walk } from 'zimmerframe';
import { print } from 'esrap';
import { error } from '../../errors.js';
import { analyze_css } from '../../analyze/css-analyze.js';
import { prune_css } from '../../analyze/prune.js';
import {
	in_jsx_child_context,
	set_node_path_metadata,
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
	is_jsx_child,
	jsx_name_to_expression,
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
import {
	find_first_top_level_await,
	find_first_top_level_await_in_tsrx_function_body,
} from '../await.js';
import { prepare_stylesheet_for_render, annotate_with_hash, is_style_element } from '../scoping.js';
import {
	collect_style_ref_attributes,
	create_style_class_map,
	create_style_class_map_from_stylesheet,
	create_style_ref_setup_statements,
	get_style_element_stylesheet,
} from '../style-ref.js';
import { is_function_or_component_node } from '../../utils/ast.js';
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
	'JSX fragment syntax is not needed in TSRX templates. TSRX renders in immediate mode, so everything is already a fragment. Use `<>...</>` only in expression position.';
const TSRX_FOR_RETURN_ERROR =
	'Return statements are not allowed inside TSRX template for...of loops. Filter the iterable before rendering or use an @empty fallback for empty lists.';
const TSRX_FOR_BREAK_ERROR =
	'Break statements are not allowed inside TSRX template for...of loops.';
const TSRX_FOR_CONTINUE_ERROR =
	'Continue statements are not allowed inside TSRX template for...of loops. Filter the iterable before rendering.';
const TSRX_IF_RETURN_ERROR =
	'Return statements are not allowed inside TSRX template @if blocks. Move the return before the template output or render conditionally instead.';
const TSRX_IF_BREAK_ERROR = 'Break statements are not allowed inside TSRX template @if blocks.';
const TSRX_IF_CONTINUE_ERROR =
	'Continue statements are not allowed inside TSRX template @if blocks. Filter before rendering or use conditional output instead.';

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
 * @param {any} node
 * @param {boolean} [inside_function]
 * @param {Set<any>} [seen]
 * @returns {void}
 */
function mark_nested_function_return_jsx(node, inside_function = false, seen = new Set()) {
	if (!node || typeof node !== 'object' || seen.has(node)) return;
	seen.add(node);

	if (Array.isArray(node)) {
		for (const item of node) mark_nested_function_return_jsx(item, inside_function, seen);
		return;
	}

	const now_inside = inside_function || is_function_or_class_boundary(node);

	if (
		now_inside &&
		node.type === 'ReturnStatement' &&
		(node.argument?.type === 'JSXFragment' ||
			node.argument?.type === 'JSXElement' ||
			node.argument?.type === 'JSXStyleElement')
	) {
		node.argument.metadata = { ...(node.argument.metadata || {}), native_tsrx: true };
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;
		mark_nested_function_return_jsx(node[key], now_inside, seen);
	}
}

/**
 * Flatten a `@{ … }` code block that appears as an element/fragment child into
 * the element's children list: its setup statements followed by its single
 * render output. The render pipeline already handles interleaved setup
 * statements and JSX children. This is the element-scoped equivalent of
 * `transform_function`'s body lowering — function and arrow bodies are never
 * element children, so they are untouched here.
 * @param {any} node
 * @param {Set<any>} [seen]
 * @returns {void}
 */
function expand_child_code_blocks(node, seen = new Set()) {
	if (!node || typeof node !== 'object' || seen.has(node)) return;
	seen.add(node);

	if (Array.isArray(node)) {
		for (const item of node) expand_child_code_blocks(item, seen);
		return;
	}

	if (
		Array.isArray(node.children) &&
		node.children.some((/** @type {any} */ c) => c?.type === 'JSXCodeBlock')
	) {
		node.children = node.children.flatMap((/** @type {any} */ child) =>
			child?.type === 'JSXCodeBlock'
				? [...child.body, ...(child.render != null ? [child.render] : [])]
				: [child],
		);
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;
		expand_child_code_blocks(node[key], seen);
	}
}

/**
 * Build a `transform()` function for a specific JSX platform (React, Preact,
 * Solid). Given a `JsxPlatform` descriptor, returns a transform that lowers
 * native TSRX template nodes into a plain TSX module for that platform.
 *
 * Any `<style>` element declared inside a TSRX fragment is collected, rendered
 * via `@tsrx/core`'s stylesheet renderer, and returned alongside the JS output
 * so a downstream plugin can inject it. The compiler also augments every
 * non-style JSX element in that fragment with the stylesheet's hash class so scoped
 * selectors match correctly.
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
		const collect = !!(options?.collect || options?.loose);
		/** @type {any[]} */
		const stylesheets = [];
		/** @type {AST.Statement[]} */
		const type_only_style_anchors = [];

		/** @type {TransformContext} */
		const transform_context = {
			platform,
			local_statement_component_index: 0,
			needs_error_boundary: false,
			needs_suspense: false,
			needs_merge_refs: false,
			needs_normalize_spread_props: false,
			needs_normalize_spread_props_for_ref_attr: false,
			needs_fragment: false,
			needs_for_of_iterable: false,
			needs_iteration_value_type: false,
			stylesheets,
			type_only_style_anchors,
			module_scoped_hook_components:
				options?.moduleScopedHookComponents ?? !!platform.hooks?.moduleScopedHookComponents,
			helper_state: null,
			hook_helpers_enabled: false,
			available_bindings: new Map(),
			lazy_next_id: 0,
			filename: filename ?? null,
			source,
			collect,
			errors: collect ? options?.errors : undefined,
			comments: options?.comments,
			typeOnly: !!options?.typeOnly,
			// Platforms can seed their own tracking state (e.g. solid's
			// needs_show / needs_for flags) via `hooks.initialState`.
			...(platform.hooks?.initialState?.() ?? {}),
		};

		expand_child_code_blocks(/** @type {any} */ (ast));

		if (!transform_context.typeOnly) {
			preallocate_lazy_ids(/** @type {any} */ (ast), transform_context);
		}

		const transformed = walk(/** @type {any} */ (ast), transform_context, {
			_(node, { next, path }) {
				set_node_path_metadata(node, path);
				return next();
			},

			JSXFragment(node, { next, path, state, visit }) {
				if (!node.metadata?.native_tsrx) {
					return next() ?? node;
				}

				const parent = /** @type {AST.ArrowFunctionExpression} */ (path.at(-1));
				if (parent?.metadata?.native_tsrx && parent.body === node) {
					return /** @type {any} */ (visit(create_native_tsrx_render_block(node, state), state));
				}

				const style_context = prepare_tsrx_fragment_styles(node, state);
				const target = style_context?.fragment ?? next() ?? node;
				const in_jsx_child = in_jsx_child_context(path);
				const expression = tsrx_node_to_jsx_expression(target, state, in_jsx_child);
				for (const statement of create_tsrx_style_ref_setup_statements(
					target,
					style_context,
					state,
				)) {
					add_jsx_setup_declaration(expression, statement);
				}
				return /** @type {any} */ (wrap_jsx_setup_declarations(expression, in_jsx_child));
			},

			JSXElement(node, { next, path, state }) {
				if (!node.metadata?.native_tsrx && is_dynamic_jsx_element(node)) {
					return dynamic_element_to_jsx(node, state, in_jsx_child_context(path));
				}

				if (!node.metadata?.native_tsrx) {
					return next() ?? node;
				}

				if (is_style_element(node) && is_style_expression_position(path)) {
					const stylesheet = get_style_element_stylesheet(node);
					if (stylesheet) {
						analyze_css(stylesheet);
						state.stylesheets.push(stylesheet);
						return /** @type {any} */ (create_style_expression_value(node, stylesheet, state));
					}
				}

				// Capture raw children BEFORE the walker transforms them so platform
				// hooks can inspect the original JSX child shape.
				const raw_children = /** @type {any} */ (node.children || []).map(
					(/** @type {any} */ child) => (child && typeof child === 'object' ? { ...child } : child),
				);
				const inner = /** @type {any} */ (next() ?? node);
				const hook = platform.hooks?.transformElement;
				if (hook) return /** @type {any} */ (hook(inner, state, raw_children));
				return /** @type {any} */ (
					to_jsx_element(inner, state, raw_children, in_jsx_child_context(path))
				);
			},

			JSXExpressionContainer(node, { next, state }) {
				const result = /** @type {any} */ (next() ?? node);
				const expression = result.expression;
				// `@if`/`@for`/`@switch`/`@try` used as an expression value (e.g. an
				// attribute value `content={@if (…) { … }}` or a `{ … }` child) leaks a
				// JSX*Expression node straight to the printer. Lower it with the same
				// control-flow machinery used for render children and unwrap the value.
				if (
					is_if_control_node(expression) ||
					is_switch_control_node(expression) ||
					is_try_control_node(expression) ||
					expression?.type === 'JSXForExpression'
				) {
					const lowered = /** @type {any} */ (to_jsx_child(expression, state));
					return { ...result, expression: lowered?.expression ?? lowered };
				}
				return result;
			},

			JSXStyleElement(node, { path, state }) {
				if (is_style_expression_position(path)) {
					const stylesheet = get_style_element_stylesheet(node);
					if (stylesheet) {
						analyze_css(stylesheet);
						state.stylesheets.push(stylesheet);
						return /** @type {any} */ (create_style_expression_value(node, stylesheet, state));
					}
				}
				return /** @type {any} */ (
					b.jsx_element(
						/** @type {ESTreeJSX.JSXElement} */ ({ ...node, type: 'JSXElement', children: [] }),
						node.openingElement?.attributes ?? [],
						[],
					)
				);
			},

			JSXCodeBlock: transform_jsx_code_block,

			BlockStatement: transform_block_statement,
			ReturnStatement: transform_return_statement,

			// If an uppercase JS function contains hook-bearing TSRX, give it a
			// temporary helper scope so extracted hook helpers get stable identities.
			FunctionDeclaration: transform_function,
			FunctionExpression: transform_function,
			ArrowFunctionExpression: transform_function,

			JSXOpeningElement(node, { next }) {
				const visited = /** @type {any} */ (next() || node);
				if (visited.metadata?.native_tsrx_pretransformed) {
					return visited;
				}
				const is_component = is_component_like_jsx_name(visited.name);
				return b.jsx_opening_element(
					visited.name,
					merge_duplicate_refs(
						normalize_host_ref_spreads(visited.attributes || [], !is_component, transform_context),
						transform_context,
					),
					visited.selfClosing,
					visited.typeArguments,
					visited,
				);
			},
		});

		const transformed_program = /** @type {AST.Program} */ (transformed);
		if (type_only_style_anchors.length > 0) {
			transformed_program.body.unshift(...type_only_style_anchors);
		}
		const expanded = expand_component_helpers(transformed_program);
		if (platform.hooks?.injectImports) {
			platform.hooks.injectImports(expanded, transform_context, suspense_source);
		} else {
			inject_try_imports(expanded, transform_context, platform, suspense_source);
		}

		// Apply lazy destructuring transforms to module-level code (top-level function
		// declarations, arrow functions, etc.).
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
		lower_remaining_jsx_code_blocks(final_program, transform_context);

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
 * @param {boolean} [export_top_scoped_classes]
 * @returns {void}
 */
function apply_css_definition_metadata(component, css, export_top_scoped_classes = false) {
	analyze_css(css);

	const metadata = component.metadata || (component.metadata = { path: [] });
	const style_classes = metadata.styleClasses || (metadata.styleClasses = new Map());
	const top_scoped_classes = metadata.topScopedClasses || new Map();
	const elements = collect_css_prunable_elements(component.body || component.children || []);

	const prune = () => {
		for (const element of elements) {
			prune_css(css, element, style_classes, top_scoped_classes);
		}
	};

	prune();

	if (export_top_scoped_classes) {
		for (const [class_name, class_info] of top_scoped_classes) {
			style_classes.set(class_name, class_info.selector ?? class_info);
		}
		prune();
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
		value.type === 'ArrowFunctionExpression'
	) {
		return elements;
	}

	if (value.type === 'JSXElement' && value.metadata?.native_tsrx) {
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
	body_nodes = body_nodes.flatMap((node) =>
		node?.type === 'JSXCodeBlock'
			? [...node.body, ...(node.render != null ? [node.render] : [])]
			: [node],
	);

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
	let capture_index = 0;

	for (let i = 0; i < body_nodes.length; i += 1) {
		const child = body_nodes[i];

		if (is_loop_skip_return_statement(child)) {
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

		if (is_loop_skip_if_statement(child)) {
			if (transform_context.platform.hooks?.isTopLevelSetupCall) {
				const continuation_body = body_nodes.slice(i + 1);
				const continuation_has_setup_statements = continuation_body.some(
					(node) =>
						!is_loop_skip_return_statement(node) &&
						!is_loop_skip_if_statement(node) &&
						!is_jsx_child(node),
				);

				if (!continuation_has_setup_statements) {
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
			}

			statements.push(
				create_component_loop_skip_if_statement(child, render_nodes, transform_context),
			);
			continue;
		}

		if (
			is_for_of_control_node(child) &&
			!child.await &&
			should_extract_hook_helpers(transform_context) &&
			!transform_context.platform.hooks?.isTopLevelSetupCall &&
			!transform_context.platform.hooks?.controlFlow?.forOf &&
			body_contains_top_level_hook_call(
				child.body.type === 'BlockStatement' ? child.body.body : [child.body],
				transform_context,
				true,
			)
		) {
			const hoisted = build_hoisted_for_of_with_hooks(
				jsx_control_expression_to_statement(child),
				transform_context,
			);
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
			mark_nested_function_return_jsx(child);
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
 * @param {any[]} body_nodes
 * @returns {boolean}
 */
function is_interleaved_body(body_nodes) {
	return is_interleaved_body_core(body_nodes, is_jsx_child);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {boolean}
 */
function needs_hook_split(node, transform_context) {
	return (
		transform_context.platform.hooks?.componentBodyHookHelpers === true &&
		node.body?.type === 'BlockStatement' &&
		find_hook_split_index(node.body.body || [], transform_context) !== -1
	);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_hook_split_block(node, transform_context) {
	if (
		transform_context.platform.hooks?.componentBodyHookHelpers !== true ||
		!should_extract_hook_helpers(transform_context) ||
		node.body?.type !== 'BlockStatement'
	) {
		return null;
	}

	const body = node.body.body || [];
	const split_index = find_hook_split_index(body, transform_context);
	if (split_index === -1) {
		return null;
	}

	const split_statement = body[split_index];
	const continuation_body = body.slice(split_index + 1);
	const helper = create_hook_safe_helper(
		expand_native_tsrx_return_statement_list(continuation_body, transform_context),
		undefined,
		get_body_source_node(continuation_body) || split_statement,
		transform_context,
	);

	const block = b.block(
		[
			...body.slice(0, split_index + 1),
			...helper.setup_statements,
			set_loc(b.return(helper.component_element), split_statement),
		],
		node.body,
	);
	block.metadata = {
		...(block.metadata || {}),
		hook_split_block: true,
	};
	return block;
}

/**
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {number}
 */
function find_hook_split_index(body_nodes, transform_context) {
	for (let i = 0; i < body_nodes.length; i += 1) {
		if (!is_component_body_conditional_return_statement(body_nodes[i])) {
			continue;
		}

		if (body_contains_top_level_hook_call(body_nodes.slice(i + 1), transform_context, true)) {
			return i;
		}
	}

	return -1;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_component_body_conditional_return_statement(node) {
	if (!is_if_control_node(node)) {
		return false;
	}

	return (
		statement_contains_component_body_return(node.consequent) ||
		statement_contains_component_body_return(node.alternate)
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function statement_contains_component_body_return(node) {
	if (!node || typeof node !== 'object') {
		return false;
	}

	if (node.type === 'ReturnStatement') {
		return true;
	}

	if (is_function_or_class_boundary(node)) {
		return false;
	}

	if (Array.isArray(node)) {
		return node.some(statement_contains_component_body_return);
	}

	if (node.type === 'BlockStatement') {
		return (node.body || []).some(statement_contains_component_body_return);
	}

	if (is_if_control_node(node)) {
		return (
			statement_contains_component_body_return(node.consequent) ||
			statement_contains_component_body_return(node.alternate)
		);
	}

	if (is_switch_control_node(node)) {
		return (node.cases || []).some((/** @type {any} */ switch_case) =>
			statement_contains_component_body_return(switch_case.consequent || []),
		);
	}

	if (is_try_control_node(node)) {
		return (
			statement_contains_component_body_return(node.block) ||
			statement_contains_component_body_return(node.handler?.body) ||
			statement_contains_component_body_return(node.finalizer)
		);
	}

	return false;
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
 * @param {Set<string>} [mapped_bindings]
 * @returns {AST.ObjectPattern}
 */
function create_helper_props_pattern(bindings, mapped_bindings = new Set()) {
	return /** @type {any} */ ({
		type: 'ObjectPattern',
		properties: bindings.map((binding) =>
			create_helper_props_property(binding, mapped_bindings.has(binding.name)),
		),
		metadata: { path: [] },
	});
}

/**
 * @param {AST.Identifier} binding
 * @param {boolean} [map_binding]
 * @returns {AST.Property}
 */
function create_helper_props_property(binding, map_binding = false) {
	const key = map_binding ? clone_identifier(binding) : create_generated_identifier(binding.name);
	const value = map_binding ? clone_identifier(binding) : create_generated_identifier(binding.name);

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
 * @param {{ helpers: any[], statics: any[] }} helper_state
 * @returns {{ generated_helpers: any[], generated_statics: any[] } | null}
 */
function create_generated_helper_metadata(helper_state) {
	if (helper_state.helpers.length === 0 && helper_state.statics.length === 0) {
		return null;
	}
	return {
		generated_helpers: helper_state.helpers,
		generated_statics: helper_state.statics,
	};
}

/**
 * @param {any} metadata
 * @returns {any}
 */
function strip_function_transform_metadata(metadata) {
	const { native_tsrx, hook_split, ...next_metadata } = metadata || {};
	return next_metadata;
}

/**
 * @param {AST.BlockStatement} node
 * @param {{ next: () => any, visit: (node: any, state?: TransformContext) => any, state: TransformContext, path: AST.Node[] }} context
 * @returns {any}
 */
function transform_block_statement(node, { next, visit, state, path }) {
	if (node.metadata?.hook_split_block || node.metadata?.native_return_block) {
		return next() ?? node;
	}

	const parent = /** @type {any} */ (path.at(-1));
	if (parent?.metadata?.hook_split && parent.body === node) {
		const block = create_hook_split_block(parent, state);
		if (block) {
			return visit(block, state);
		}
	}

	if (get_active_native_tsrx_function(path)?.metadata?.native_tsrx_body) {
		const block = create_native_tsrx_statement_list_block(node, state);
		if (block) {
			return visit(block, state);
		}
	}

	return next() ?? node;
}

/**
 * @param {any} node
 * @param {{ next: () => any, visit: (node: any, state?: TransformContext) => any, state: TransformContext, path: AST.Node[] }} context
 * @returns {any}
 */
function transform_return_statement(node, { next, visit, state, path }) {
	const active_native_tsrx_function = get_active_native_tsrx_function(path);
	if (active_native_tsrx_function && is_native_tsrx_node(node.argument)) {
		if (!active_native_tsrx_function.metadata?.native_tsrx_body) {
			const statements = mark_native_pretransformed_jsx(
				create_native_tsrx_render_statements(node.argument, state),
			);
			if (statements.length === 1) {
				return visit(statements[0], state);
			}
			const block = b.block(statements, node.argument);
			block.metadata = {
				...(block.metadata || {}),
				native_return_block: true,
			};
			return visit(block, state);
		}
		return visit(create_native_tsrx_render_block(node.argument, state), state);
	}

	return next() ?? node;
}

/**
 * @param {any} node
 * @param {{ state: TransformContext, path: AST.Node[] }} context
 * @returns {any}
 */
function transform_jsx_code_block(node, { state, path }) {
	const body_nodes = get_jsx_code_block_body_nodes(node, state);
	const parent = /** @type {any} */ (path.at(-1));

	if (parent && parent.body === node && is_function_or_class_boundary(parent)) {
		const block = b.block(
			mark_native_pretransformed_jsx(build_render_statements(body_nodes, true, state)),
			node,
		);
		block.metadata = {
			...(block.metadata || {}),
			native_return_block: true,
		};
		return block;
	}

	const expression = b.call(
		b.arrow([], b.block(build_render_statements(body_nodes, true, state), node)),
	);

	return in_jsx_child_context(path) ? to_jsx_expression_container(expression, node) : expression;
}

/**
 * @param {AST.Node[]} path
 * @returns {any | null}
 */
function get_active_native_tsrx_function(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = /** @type {any} */ (path[i]);
		if (is_function_or_class_boundary(node)) {
			return node.metadata?.native_tsrx ? node : null;
		}
	}
	return null;
}

/**
 * @param {any} node
 * @param {{ next: () => any, state: TransformContext, path: AST.Node[] }} context
 * @returns {any}
 */
function transform_function(node, context) {
	// Lower a `@{ … }` function body (JSXCodeBlock) to an ordinary block: the
	// setup statements followed by `return <render>` when the block produces a
	// render output. The parser already marks the render JSX as native_tsrx, so
	// from here it flows through the existing native-component machinery exactly
	// like the older fenced `{ return <> … </> }` shape.
	const has_jsx_code_block_body = node.body?.type === 'JSXCodeBlock';
	lower_jsx_code_block_function_body(node);

	if (
		has_jsx_code_block_body ||
		node.metadata?.native_tsrx_function ||
		function_has_native_tsrx_return(node)
	) {
		return transform_native_tsrx_function(node, context, {
			nativeBody: has_jsx_code_block_body || !!node.metadata?.native_tsrx_function,
		});
	}

	return transform_function_with_hook_helpers(node, context);
}

/**
 * @param {any} node
 * @returns {void}
 */
function lower_jsx_code_block_function_body(node) {
	if (node.body?.type !== 'JSXCodeBlock') return;

	const code_block = node.body;
	const statements = [...code_block.body];
	if (code_block.render != null) {
		let render = code_block.render;
		if (!is_native_tsrx_node(render)) {
			// A control-flow output (@if/@for/@switch/@try) isn't itself a native
			// template node, so `return @if (…) { … }` wouldn't be recognized as a
			// component render output. Wrap it in a native fragment so it flows
			// through the same children-rendering path as a `<> … </>` render.
			const fragment = b.jsx_fragment([render]);
			fragment.metadata = { ...fragment.metadata, native_tsrx: true };
			render = fragment;
		}
		statements.push(b.return(render, code_block.render));
	}
	node.body = b.block(statements, code_block);
	if (node.type === 'ArrowFunctionExpression') {
		node.expression = false;
	}
}

/**
 * @param {any} node
 * @param {{ next: () => any, state: TransformContext }} context
 * @param {{ nativeBody?: boolean }} [options]
 * @returns {any}
 */
function transform_native_tsrx_function(node, { next, state }, { nativeBody = false } = {}) {
	const helper_state =
		state.helper_state || create_helper_state(get_function_helper_base_name(node));
	const saved_helper_state = state.helper_state;
	const saved_bindings = state.available_bindings;
	const saved_hook_helpers_enabled = state.hook_helpers_enabled;

	state.helper_state = helper_state;
	state.hook_helpers_enabled = is_uppercase_function_like(node);
	node.metadata = {
		...(node.metadata || {}),
		native_tsrx: true,
		...(nativeBody ? { native_tsrx_body: true } : {}),
		...(nativeBody && needs_hook_split(node, state) ? { hook_split: true } : {}),
	};
	state.available_bindings = merge_binding_maps(
		saved_bindings,
		collect_function_scope_bindings(node),
	);

	validate_native_await(node, state);

	const inner = /** @type {any} */ (next() ?? node);
	if (
		inner !== node &&
		node.type === 'ArrowFunctionExpression' &&
		is_native_tsrx_node(node.body) &&
		inner.body?.type === 'BlockStatement'
	) {
		inner.expression = false;
	}

	state.helper_state = saved_helper_state;
	state.available_bindings = saved_bindings;
	state.hook_helpers_enabled = saved_hook_helpers_enabled;

	inner.metadata = {
		...strip_function_transform_metadata(inner.metadata),
		native_tsrx_function: true,
		...(nativeBody ? { native_tsrx_body: true } : {}),
		...(!saved_helper_state ? create_generated_helper_metadata(helper_state) || {} : {}),
	};

	return inner;
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {void}
 */
function validate_native_await(node, transform_context) {
	const await_node = find_native_await(node);
	if (!await_node) {
		return;
	}

	const validator = transform_context.platform.hooks?.validateComponentAwait;
	if (validator) {
		validator(await_node, node, transform_context, false, transform_context.source || '');
		return;
	}

	if (transform_context.platform.validation.requireUseServerForAwait) {
		error(
			'Top-level `await` in TSRX functions requires a module-level `"use server"` directive.',
			transform_context.filename,
			await_node,
			transform_context.errors,
			transform_context.comments,
		);
	}
}

/**
 * @param {any} node
 * @returns {any | null}
 */
function find_native_await(node) {
	if (
		node.type === 'ArrowFunctionExpression' &&
		node.body?.type !== 'BlockStatement' &&
		node_contains_native_tsrx_template(node.body)
	) {
		return find_first_top_level_await(node.body, false);
	}

	if (node.body?.type === 'JSXCodeBlock') {
		return find_native_await_in_list(get_raw_jsx_code_block_body_nodes(node.body));
	}

	const body = node.body?.type === 'BlockStatement' ? node.body.body || [] : [];
	return find_native_await_in_list(body);
}

/**
 * @param {any[]} statements
 * @returns {any | null}
 */
function find_native_await_in_list(statements) {
	for (const statement of statements) {
		const found = find_native_await_in_statement(statement);
		if (found) return found;
	}
	return null;
}

/**
 * @param {any} statement
 * @returns {any | null}
 */
function find_native_await_in_statement(statement) {
	if (!statement || typeof statement !== 'object') return null;

	if (statement.type === 'ReturnStatement' && is_native_tsrx_node(statement.argument)) {
		return find_first_top_level_await_in_tsrx_function_body(statement.argument.children || []);
	}

	if (
		statement.type === 'ReturnStatement' &&
		node_contains_native_tsrx_template(statement.argument)
	) {
		return find_first_top_level_await(statement.argument, false);
	}

	if (is_function_or_class_boundary(statement)) {
		return null;
	}

	if (statement.type === 'BlockStatement') {
		return find_native_await_in_list(statement.body || []);
	}

	if (is_if_control_node(statement)) {
		return (
			find_native_await_in_statement(statement.consequent) ||
			find_native_await_in_statement(statement.alternate)
		);
	}

	if (is_switch_control_node(statement)) {
		for (const switch_case of statement.cases || []) {
			const found = find_native_await_in_list(switch_case.consequent || []);
			if (found) return found;
		}
		return null;
	}

	if (is_try_control_node(statement)) {
		return (
			find_native_await_in_statement(statement.block) ||
			find_native_await_in_statement(statement.handler?.body) ||
			find_native_await_in_statement(statement.finalizer)
		);
	}

	return find_first_top_level_await(statement, false);
}

/**
 * @param {any} node
 * @param {{ next: () => any, state: TransformContext }} context
 * @returns {any}
 */
function transform_function_with_hook_helpers(node, { next, state }) {
	const has_hook_bearing_tsrx = function_contains_hook_bearing_tsrx(node, state);
	if (state.helper_state || !is_uppercase_function_like(node) || !has_hook_bearing_tsrx) {
		return next() ?? node;
	}

	const helper_state = create_helper_state(get_function_helper_base_name(node));
	const saved_helper_state = state.helper_state;
	const saved_bindings = state.available_bindings;
	const saved_hook_helpers_enabled = state.hook_helpers_enabled;

	state.helper_state = helper_state;
	state.hook_helpers_enabled = true;
	state.available_bindings = collect_function_scope_bindings(node);

	const inner = /** @type {any} */ (next() ?? node);

	state.helper_state = saved_helper_state;
	state.available_bindings = saved_bindings;
	state.hook_helpers_enabled = saved_hook_helpers_enabled;

	inner.metadata = {
		...strip_function_transform_metadata(inner.metadata),
		...(create_generated_helper_metadata(helper_state) || {}),
	};

	return inner;
}

/**
 * @param {any} node
 * @returns {string}
 */
function get_function_helper_base_name(node) {
	return get_function_like_name(node) || 'TSRXTemplate';
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_uppercase_function_like(node) {
	const name = get_function_like_name(node);
	return !!(name && /^[A-Z]/.test(name));
}

/**
 * @param {any} node
 * @returns {string | null}
 */
function get_function_like_name(node) {
	if (node.id?.type === 'Identifier') {
		return node.id.name;
	}

	const parent = /** @type {any} */ (node.metadata?.path?.at(-1));
	if (!parent) return null;

	if (parent.type === 'VariableDeclarator' && parent.init === node) {
		return get_static_binding_name(parent.id);
	}

	if (parent.type === 'Property' && parent.value === node) {
		return get_static_property_name(parent.key);
	}

	if (parent.type === 'MethodDefinition' && parent.value === node) {
		return get_static_property_name(parent.key);
	}

	if (parent.type === 'AssignmentExpression' && parent.right === node) {
		return get_static_binding_name(parent.left);
	}

	return null;
}

/**
 * @param {any} node
 * @returns {string | null}
 */
function get_static_binding_name(node) {
	if (node?.type === 'Identifier') {
		return node.name;
	}
	if (node?.type === 'MemberExpression' && !node.computed) {
		return get_static_property_name(node.property);
	}
	return null;
}

/**
 * @param {any} key
 * @returns {string | null}
 */
function get_static_property_name(key) {
	if (key?.type === 'Identifier') {
		return key.name;
	}
	if (key?.type === 'Literal' && typeof key.value === 'string') {
		return key.value;
	}
	return null;
}

/**
 * @param {any} node
 * @returns {Map<string, AST.Identifier>}
 */
function collect_function_scope_bindings(node) {
	const bindings = collect_param_bindings(node.params || []);
	if (node.body?.type === 'BlockStatement') {
		for (const statement of node.body.body || []) {
			if (statement.type === 'ReturnStatement' && is_native_tsrx_node(statement.argument)) {
				for (const child of get_tsrx_render_children(statement.argument)) {
					collect_statement_bindings(child, bindings);
				}
			} else {
				collect_statement_bindings(statement, bindings);
			}
		}
	}
	return bindings;
}

/**
 * @param {Map<string, AST.Identifier>} outer
 * @param {Map<string, AST.Identifier>} inner
 * @returns {Map<string, AST.Identifier>}
 */
function merge_binding_maps(outer, inner) {
	const merged = new Map(outer);
	for (const [name, binding] of inner) {
		merged.set(name, binding);
	}
	return merged;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function function_has_native_tsrx_return(node) {
	if (!node) return false;

	if (node.body?.type === 'JSXCodeBlock') {
		return true;
	}

	if (node.type === 'ArrowFunctionExpression' && node.body?.type !== 'BlockStatement') {
		return node_contains_native_tsrx_template(node.body);
	}

	const body = node.body?.type === 'BlockStatement' ? node.body.body : [];
	return statements_contain_native_tsrx_return(body);
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
		return node_contains_native_tsrx_template(statement.argument);
	}

	if (is_function_or_class_boundary(statement)) {
		return false;
	}

	if (statement.type === 'BlockStatement') {
		return statements_contain_native_tsrx_return(statement.body || []);
	}

	if (is_if_control_node(statement)) {
		return (
			statement_contains_native_tsrx_return(statement.consequent) ||
			statement_contains_native_tsrx_return(statement.alternate)
		);
	}

	if (is_switch_control_node(statement)) {
		return (statement.cases || []).some((/** @type {any} */ c) =>
			statements_contain_native_tsrx_return(c.consequent || []),
		);
	}

	if (is_try_control_node(statement)) {
		return (
			statement_contains_native_tsrx_return(statement.block) ||
			statement_contains_native_tsrx_return(statement.pending) ||
			statement_contains_native_tsrx_return(statement.handler?.body) ||
			statement_contains_native_tsrx_return(statement.finalizer)
		);
	}

	for (const key of Object.keys(statement)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		const value = statement[key];
		if (Array.isArray(value)) {
			if (statements_contain_native_tsrx_return(value)) return true;
		} else if (statement_contains_native_tsrx_return(value)) {
			return true;
		}
	}

	return false;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function node_contains_native_tsrx_template(node) {
	if (!node || typeof node !== 'object') return false;
	if (is_native_tsrx_node(node)) return true;

	if (is_function_or_class_boundary(node)) {
		return false;
	}

	if (Array.isArray(node)) {
		return node.some(node_contains_native_tsrx_template);
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		if (node_contains_native_tsrx_template(node[key])) {
			return true;
		}
	}

	return false;
}

/**
 * @param {any} node
 * @returns {any}
 */
function collect_tsrx_stylesheet(node) {
	/** @type {any[]} */
	const styles = [];
	collect_style_elements(node.children || [], styles);

	if (styles.length === 0) return null;
	if (styles.length > 1) {
		throw new Error('TSRX fragments can only have one style tag');
	}

	return styles[0];
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {{ css: any, style_refs: any[], fragment: any } | null}
 */
function prepare_tsrx_fragment_styles(node, transform_context) {
	const css = collect_tsrx_stylesheet(node);
	if (!css) return null;

	const style_refs = collect_style_ref_attributes(node);
	apply_css_definition_metadata(node, css, style_refs.length > 0);
	transform_context.stylesheets.push(css);
	const fragment = annotate_tsrx_with_hash(
		node,
		css.hash,
		transform_context.platform.jsx.classAttrName ??
			(transform_context.platform.jsx.rewriteClassAttr ? 'className' : 'class'),
		transform_context.typeOnly,
	);
	return { css, style_refs, fragment };
}

/**
 * @template T
 * @param {any} node
 * @param {TransformContext} transform_context
 * @param {(style_context: { css: any, style_refs: any[], fragment: any } | null) => T} callback
 * @returns {T}
 */
function with_tsrx_fragment_styles(node, transform_context, callback) {
	const style_context = prepare_tsrx_fragment_styles(node, transform_context);
	return callback(style_context);
}

/**
 * @param {any} fragment
 * @param {{ css: any, style_refs: any[], fragment: any } | null} style_context
 * @param {TransformContext} transform_context
 * @returns {AST.Statement[]}
 */
function create_tsrx_style_ref_setup_statements(fragment, style_context, transform_context) {
	if (!style_context || style_context.style_refs.length === 0) {
		return [];
	}

	return create_style_ref_setup_statements(
		style_context.style_refs,
		create_style_class_map(fragment, style_context.css),
		{
			allowMutableRefTarget: transform_context.platform.jsx.multiRefStrategy === 'array',
			createTempIdentifier: () =>
				create_generated_identifier(create_style_ref_temp_name(transform_context)),
		},
	);
}

/**
 * @param {any} node
 * @param {any} stylesheet
 * @param {TransformContext} transform_context
 * @returns {AST.Expression}
 */
function create_style_expression_value(node, stylesheet, transform_context) {
	const class_map = create_style_class_map_from_stylesheet(stylesheet);
	if (!transform_context.typeOnly) {
		return class_map;
	}

	add_type_only_style_anchor(node, transform_context);
	return class_map;
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 */
function add_type_only_style_anchor(node, transform_context) {
	const style_anchor = b.jsx_element(clone_expression_node(node, true), [], []);
	disable_style_anchor_verification(style_anchor);

	const anchor_id = create_generated_identifier(create_style_anchor_name(transform_context));
	transform_context.type_only_style_anchors.push(
		b.const(anchor_id, style_anchor),
		b.stmt(clone_identifier(anchor_id)),
	);
}

/**
 * @param {TransformContext} transform_context
 * @returns {string}
 */
function create_style_anchor_name(transform_context) {
	transform_context.local_statement_component_index += 1;
	return `_tsrx_style_anchor_${transform_context.local_statement_component_index}`;
}

/**
 * @param {ESTreeJSX.JSXElement} element
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
 * @param {TransformContext} transform_context
 * @returns {string}
 */
function create_style_ref_temp_name(transform_context) {
	if (transform_context.helper_state) {
		return create_helper_name(transform_context.helper_state, 'style_ref');
	}

	transform_context.local_statement_component_index += 1;
	return `_tsrx_style_ref_${transform_context.local_statement_component_index}`;
}

/**
 * @param {any} node
 * @param {any[]} styles
 * @returns {void}
 */
function collect_style_elements(node, styles) {
	if (!node || typeof node !== 'object') return;

	if (Array.isArray(node)) {
		for (const child of node) {
			collect_style_elements(child, styles);
		}
		return;
	}

	if (is_style_element(node)) {
		const stylesheet = node.children?.find(
			(/** @type {any} */ child) => child.type === 'StyleSheet',
		);
		if (stylesheet) {
			styles.push(stylesheet);
		}
		return;
	}

	if (is_function_or_class_boundary(node)) {
		return;
	}

	if ((node.type === 'JSXElement' || node.type === 'JSXFragment') && node.metadata?.native_tsrx) {
		collect_style_elements(node.children || [], styles);
		return;
	}

	if (node.type === 'BlockStatement') {
		collect_style_elements(node.body || [], styles);
		return;
	}

	if (is_if_control_node(node)) {
		collect_style_elements(node.consequent, styles);
		collect_style_elements(node.alternate, styles);
		return;
	}

	if (is_switch_control_node(node)) {
		for (const switch_case of node.cases || []) {
			collect_style_elements(switch_case.consequent || [], styles);
		}
		return;
	}

	if (is_try_control_node(node)) {
		collect_style_elements(node.block, styles);
		collect_style_elements(node.handler?.body, styles);
		collect_style_elements(node.finalizer, styles);
	}
}

/**
 * @param {any} node
 * @param {string} hash
 * @param {'class' | 'className'} jsx_class_attr_name
 * @param {boolean} preserve_style_elements
 * @returns {any}
 */
function annotate_tsrx_with_hash(node, hash, jsx_class_attr_name, preserve_style_elements) {
	const annotated = { ...node };
	annotated.children = (node.children || []).map((/** @type {any} */ statement) =>
		annotate_with_hash(
			clone_expression_node(statement),
			hash,
			jsx_class_attr_name,
			preserve_style_elements,
		),
	);
	if (!preserve_style_elements) {
		annotated.children = strip_style_elements(annotated.children);
	}
	return annotated;
}

/**
 * @param {any} node
 * @returns {any}
 */
function strip_style_elements(node) {
	if (!node || typeof node !== 'object') return node;

	if (Array.isArray(node)) {
		return node
			.filter((child) => !is_style_element(child))
			.map((child) => strip_style_elements(child))
			.filter(Boolean);
	}

	if (is_style_element(node)) {
		return null;
	}

	if (is_function_or_class_boundary(node)) {
		return node;
	}

	if ((node.type === 'JSXElement' || node.type === 'JSXFragment') && node.metadata?.native_tsrx) {
		node.children = strip_style_elements(node.children || []);
		return node;
	}

	if (node.type === 'BlockStatement') {
		node.body = strip_style_elements(node.body || []);
		return node;
	}

	if (is_if_control_node(node)) {
		node.consequent = strip_style_elements(node.consequent);
		if (node.alternate) node.alternate = strip_style_elements(node.alternate);
		return node;
	}

	if (is_switch_control_node(node)) {
		for (const switch_case of node.cases || []) {
			switch_case.consequent = strip_style_elements(switch_case.consequent || []);
		}
		return node;
	}

	if (is_try_control_node(node)) {
		node.block = strip_style_elements(node.block);
		if (node.handler?.body) node.handler.body = strip_style_elements(node.handler.body);
		if (node.finalizer) node.finalizer = strip_style_elements(node.finalizer);
	}

	return node;
}

/**
 * @param {any[]} path
 * @returns {boolean}
 */
function is_style_expression_position(path) {
	const parent = path.at(-1);
	return !(
		is_native_tsrx_node(parent) ||
		parent?.type === 'BlockStatement' ||
		parent?.type === 'Program' ||
		parent?.type === 'SwitchCase'
	);
}

/**
 * @param {any} fragment
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_native_tsrx_render_block(fragment, transform_context) {
	const block = b.block(
		mark_native_pretransformed_jsx(
			create_native_tsrx_render_statements(fragment, transform_context),
		),
		fragment,
	);
	block.metadata = {
		...(block.metadata || {}),
		native_return_block: true,
	};
	return block;
}

/**
 * @param {any} block
 * @param {TransformContext} transform_context
 * @returns {any | null}
 */
function create_native_tsrx_statement_list_block(block, transform_context) {
	const source_body = block.body || [];
	const body = expand_native_tsrx_return_statement_list(source_body, transform_context);

	if (body === source_body) {
		return null;
	}

	const next_block = b.block(mark_native_pretransformed_jsx(body), block);
	next_block.metadata = {
		...(next_block.metadata || {}),
		native_return_block: true,
	};
	return next_block;
}

/**
 * @param {any} fragment
 * @param {TransformContext} transform_context
 * @returns {AST.Statement[]}
 */
function create_native_tsrx_render_statements(fragment, transform_context) {
	return with_tsrx_fragment_styles(fragment, transform_context, (style_context) => {
		const target = style_context?.fragment ?? fragment;
		const render_nodes =
			target.type === 'JSXFragment' ? get_tsrx_render_children(target) : [target];
		return [
			...create_tsrx_style_ref_setup_statements(target, style_context, transform_context),
			...build_render_statements(render_nodes, true, transform_context),
		];
	});
}

/**
 * @param {any[]} statements
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function expand_native_tsrx_return_statement_list(statements, transform_context) {
	let changed = false;
	const next_statements = statements.flatMap((statement) => {
		const result = expand_native_tsrx_return_statement(statement, transform_context);
		if (result.length !== 1 || result[0] !== statement) {
			changed = true;
		}
		return result;
	});
	return changed ? next_statements : statements;
}

/**
 * @param {any} statement
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function expand_native_tsrx_return_statement(statement, transform_context) {
	if (!statement || typeof statement !== 'object') return [statement];

	if (statement.type === 'ReturnStatement' && is_native_tsrx_node(statement.argument)) {
		return create_native_tsrx_render_statements(statement.argument, transform_context);
	}

	if (is_function_or_class_boundary(statement)) {
		return [statement];
	}

	if (statement.type === 'BlockStatement') {
		const body = expand_native_tsrx_return_statement_list(statement.body || [], transform_context);
		return body === statement.body ? [statement] : [b.block(body, statement)];
	}

	if (is_if_control_node(statement)) {
		const consequent = expand_embedded_native_return_statement(
			statement.consequent,
			transform_context,
		);
		const alternate = statement.alternate
			? expand_embedded_native_return_statement(statement.alternate, transform_context)
			: statement.alternate;
		if (consequent === statement.consequent && alternate === statement.alternate) {
			return [statement];
		}
		return [set_loc(b.if(statement.test, consequent, alternate), statement)];
	}

	if (is_switch_control_node(statement)) {
		let changed = false;
		const cases = (statement.cases || []).map((/** @type {any} */ switch_case) => {
			const consequent = expand_native_tsrx_return_statement_list(
				switch_case.consequent || [],
				transform_context,
			);
			if (consequent === switch_case.consequent) {
				return switch_case;
			}
			changed = true;
			return set_loc(b.switch_case(switch_case.test, consequent), switch_case);
		});
		return changed ? [set_loc(b.switch(statement.discriminant, cases), statement)] : [statement];
	}

	if (is_try_control_node(statement)) {
		const block = expand_embedded_native_return_statement(statement.block, transform_context);
		const pending = statement.pending
			? expand_embedded_native_return_statement(statement.pending, transform_context)
			: statement.pending;
		const handler_body = statement.handler?.body
			? expand_embedded_native_return_statement(statement.handler.body, transform_context)
			: statement.handler?.body;
		const finalizer = statement.finalizer
			? expand_embedded_native_return_statement(statement.finalizer, transform_context)
			: statement.finalizer;
		if (
			block === statement.block &&
			pending === statement.pending &&
			handler_body === statement.handler?.body &&
			finalizer === statement.finalizer
		) {
			return [statement];
		}
		const handler =
			statement.handler && handler_body !== statement.handler.body
				? b.catch_clause(
						statement.handler.param,
						statement.handler.resetParam,
						handler_body,
						statement.handler,
					)
				: statement.handler;
		return [set_loc(b.try(block, handler, finalizer, pending ?? null), statement)];
	}

	return [statement];
}

/**
 * @param {any} statement
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function expand_embedded_native_return_statement(statement, transform_context) {
	const expanded = expand_native_tsrx_return_statement(statement, transform_context);
	return expanded.length === 1 ? expanded[0] : b.block(expanded, statement);
}

/**
 * @template T
 * @param {T} node
 * @param {Set<any>} [seen]
 * @returns {T}
 */
function mark_native_pretransformed_jsx(node, seen = new Set()) {
	if (node == null || typeof node !== 'object' || seen.has(node)) {
		return node;
	}
	seen.add(node);

	if (Array.isArray(node)) {
		for (const item of node) mark_native_pretransformed_jsx(item, seen);
		return node;
	}

	const as_node = /** @type {any} */ (node);
	if (as_node.type === 'JSXOpeningElement') {
		as_node.metadata = {
			...(as_node.metadata || {}),
			native_tsrx_pretransformed: true,
		};
	}

	for (const key of Object.keys(as_node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		mark_native_pretransformed_jsx(as_node[key], seen);
	}

	return node;
}

/**
 * @param {any} node
 * @returns {any[]}
 */
function get_tsrx_render_children(node) {
	return (node.children || []).filter(
		(/** @type {any} */ child) =>
			child &&
			child.type !== 'EmptyStatement' &&
			(child.type !== 'JSXText' || child.value.trim() !== ''),
	);
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
		node.type === 'ArrowFunctionExpression'
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

	if (is_native_tsrx_node(node)) {
		return body_contains_top_level_hook_call(node.children || [], transform_context, true);
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
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
 * @param {TransformContext} transform_context
 * @returns {boolean}
 */
function should_extract_hook_helpers(transform_context) {
	return !!transform_context.hook_helpers_enabled;
}

/**
 * @param {AST.Identifier} helper_id
 * @param {TransformContext} transform_context
 * @returns {AST.Identifier}
 */
function create_module_scoped_hook_component_id(helper_id, transform_context) {
	return create_generated_identifier(
		`${transform_context.helper_state?.base_name || 'TSRXTemplate'}__${helper_id.name}`,
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
 * Generated helper metadata can be appended after the main transformer walk.
 * If one of those helpers contains a statement-container body, lower it before
 * the printer sees the helper subtree.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @param {Set<any>} [seen]
 * @returns {void}
 */
function lower_remaining_jsx_code_blocks(node, transform_context, seen = new Set()) {
	if (!node || typeof node !== 'object' || seen.has(node)) return;
	seen.add(node);

	if (is_function_or_class_boundary(node)) {
		lower_jsx_code_block_function_body(node);
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;
		let value = node[key];
		if (!value || typeof value !== 'object') continue;

		if (Array.isArray(value)) {
			if (key === 'body') {
				value = node[key] = value.flatMap((child) => {
					if (child?.type !== 'JSXCodeBlock') return [child];
					const body_nodes = get_jsx_code_block_body_nodes(child, transform_context);
					return mark_native_pretransformed_jsx(
						build_render_statements(body_nodes, true, transform_context),
					);
				});
			}
			for (const child of value) {
				lower_remaining_jsx_code_blocks(child, transform_context, seen);
			}
		} else {
			lower_remaining_jsx_code_blocks(value, transform_context, seen);
		}
	}
}

/**
 * Generated helper/statics metadata can be carried on function declarations,
 * variable declarations, object literal members, or export-safe expressions,
 * so helper expansion reads metadata from that broader set.
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
 * @returns {boolean}
 */
function is_loop_skip_return_statement(node) {
	return node?.type === 'ReturnStatement' && node.metadata?.generated_loop_continue_return === true;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_loop_skip_if_statement(node) {
	return get_loop_skip_if_consequent_body(node) !== null;
}

/**
 * @param {any} node
 * @returns {any[] | null}
 */
function get_loop_skip_if_consequent_body(node) {
	if (!is_if_control_node(node) || node.alternate) {
		return null;
	}

	const consequent_body =
		node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];

	return consequent_body.some(is_loop_skip_return_statement) ? consequent_body : null;
}

/**
 * @param {any} node
 * @param {any[]} render_nodes
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_component_loop_skip_if_statement(node, render_nodes, transform_context) {
	const consequent_body = /** @type {any[]} */ (get_loop_skip_if_consequent_body(node));
	const branch_statements = build_render_statements(consequent_body, true, transform_context);
	prepend_render_nodes_to_return_statements(branch_statements, render_nodes);

	const statement = set_loc(
		b.if(node.test, set_loc(b.block(branch_statements), node.consequent), null),
		node,
	);
	statement.metadata = {
		...(statement.metadata || {}),
		generated_loop_skip_if: true,
	};
	return statement;
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
	helper_fn.metadata = { path: [], is_method: false };

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
 * @param {TransformContext} transform_context
 * @param {boolean} [in_jsx_child]
 * @returns {any}
 */
function to_jsx_element(
	node,
	transform_context,
	raw_children = node.children || [],
	in_jsx_child = false,
) {
	if (node.type === 'JSXElement' && !node.metadata?.native_tsrx && !is_dynamic_jsx_element(node)) {
		return node;
	}

	const source_opening = node.openingElement;
	const source_name = source_opening?.name;
	if (!source_name) {
		report_jsx_fragment_in_tsrx_error(node, transform_context);
		return set_loc(b.jsx_fragment(), node);
	}
	if (is_dynamic_jsx_element(node)) {
		return dynamic_element_to_jsx(node, transform_context, in_jsx_child);
	}

	const name = clone_jsx_name(source_name);
	const attributes = transform_element_attributes_dispatch(
		source_opening.attributes || [],
		transform_context,
		node,
	);
	const walked_children = node.children || [];
	let selfClosing = !!source_opening.selfClosing;
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
		children = create_element_children(walked_children, transform_context);
	}
	const has_unmappable_attribute = attributes.some(
		(/** @type {any} */ attribute) => attribute?.metadata?.has_unmappable_value,
	);

	const opening_element_node = b.jsx_opening_element(
		name,
		attributes,
		selfClosing,
		source_opening.typeArguments,
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

	const element = set_loc(b.jsx_element_fresh(openingElement, closingElement, children), node);
	if (transform_context.typeOnly && is_style_element(node)) {
		disable_style_anchor_verification(element);
	}
	return element;
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

	if (node.type === 'ReturnStatement') {
		return true;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
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
	if (
		should_extract_hook_helpers(transform_context) &&
		body_contains_top_level_hook_call(body_nodes, transform_context, true)
	) {
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

	if (
		statement.type === 'ForOfStatement' ||
		statement.type === 'ForInStatement' ||
		(statement.type === 'JSXForExpression' &&
			(statement.statementType === 'ForOfStatement' ||
				statement.statementType === 'ForInStatement'))
	) {
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

	if (is_for_of_control_node(node)) {
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
		node.type === 'ArrowFunctionExpression'
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
		node.type === 'ArrowFunctionExpression'
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
 *   Used by switch lifting to keep generated helper ids stable in source order.
 * @param {{ transientBindings?: Set<string> }} [options]
 * @returns {{ setup_statements: any[], component_element: ESTreeJSX.JSXElement }}
 */
export function create_hook_safe_helper(
	body_nodes,
	key_expression,
	source_node,
	transform_context,
	preallocated_helper_id,
	options = {},
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
	const transient_bindings = options.transientBindings ?? new Set();
	const aliases = use_module_scoped_component
		? []
		: helper_bindings.map((binding) =>
				transient_bindings.has(binding.name)
					? null
					: create_helper_type_alias_declaration(helper_id, binding),
			);
	const props_type =
		helper_bindings.length > 0 && !use_module_scoped_component
			? create_helper_props_type_literal(helper_bindings, aliases)
			: null;
	const params =
		helper_bindings.length > 0
			? [
					props_type !== null
						? create_typed_helper_props_pattern(helper_bindings, props_type, transient_bindings)
						: create_helper_props_pattern(helper_bindings, transient_bindings),
				]
			: [];

	const saved_bindings = transform_context.available_bindings;
	transform_context.available_bindings = new Map(saved_bindings);

	const helper_fn = b.function(
		clone_identifier(component_id),
		params,
		b.block(build_render_statements(body_nodes, true, transform_context)),
	);
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
			b.jsx_attribute(b.jsx_id('key'), to_jsx_expression_container(key_expression, key_expression)),
		);
	}

	if (!transform_context.helper_state) {
		return {
			setup_statements: [
				...aliases.flatMap((alias) => (alias ? [alias.declaration] : [])),
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
			...aliases.flatMap((alias) => (alias ? [alias.declaration] : [])),
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
 * @param {({ id: AST.Identifier } | null)[]} aliases
 * @returns {any}
 */
function create_helper_props_type_literal(bindings, aliases) {
	return b.ts_type_literal(
		bindings.map((binding, i) =>
			b.ts_property_signature(
				create_generated_identifier(binding.name),
				b.ts_type_annotation(
					aliases[i]
						? b.ts_type_query(
								clone_identifier(/** @type {{ id: AST.Identifier }} */ (aliases[i]).id),
							)
						: b.ts_keyword_type('any'),
				),
			),
		),
	);
}

/**
 * @param {AST.Identifier[]} bindings
 * @param {any} props_type
 * @param {Set<string>} [mapped_bindings]
 * @returns {AST.ObjectPattern}
 */
function create_typed_helper_props_pattern(bindings, props_type, mapped_bindings = new Set()) {
	const pattern = create_helper_props_pattern(bindings, mapped_bindings);
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
	const declaration = set_loc(
		b.function_declaration(
			clone_identifier(helper_id),
			helper_fn.params,
			helper_fn.body,
			helper_fn.async,
			helper_fn.typeParameters,
		),
		helper_fn,
	);
	declaration.generator = helper_fn.generator;
	declaration.metadata = { ...(helper_fn.metadata || {}), path: helper_fn.metadata?.path || [] };
	return declaration;
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
 * @returns {any}
 */
function jsx_control_expression_to_statement(node) {
	if (!node?.statementType) return node;
	return { ...node, type: node.statementType };
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function get_jsx_code_block_body_nodes(node, transform_context) {
	if (!node.render) {
		return node.body || [];
	}

	if (is_native_tsrx_node(node.render)) {
		const style_context = prepare_tsrx_fragment_styles(node.render, transform_context);
		const render = style_context?.fragment ?? node.render;
		return [
			...(node.body || []),
			...create_tsrx_style_ref_setup_statements(render, style_context, transform_context),
			render,
		];
	}

	return [...(node.body || []), node.render];
}

/**
 * @param {any} node
 * @returns {any[]}
 */
function get_raw_jsx_code_block_body_nodes(node) {
	return [...(node.body || []), ...(node.render ? [node.render] : [])];
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_native_tsrx_node(node) {
	return (
		node?.type === 'JSXCodeBlock' ||
		((node?.type === 'JSXElement' ||
			node?.type === 'JSXFragment' ||
			node?.type === 'JSXStyleElement') &&
			node.metadata?.native_tsrx)
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_dynamic_jsx_element(node) {
	return !!(
		node?.type === 'JSXElement' &&
		(node.dynamic === true ||
			node.openingElement?.dynamic === true ||
			is_dynamic_jsx_name(node.openingElement?.name))
	);
}

/**
 * @param {any} name
 * @returns {boolean}
 */
function is_dynamic_jsx_name(name) {
	if (!name || typeof name !== 'object') return false;
	if (name.dynamic === true) return true;
	return name.type === 'JSXMemberExpression' && is_dynamic_jsx_name(name.object);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_if_control_node(node) {
	return node?.type === 'IfStatement' || node?.type === 'JSXIfExpression';
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_switch_control_node(node) {
	return node?.type === 'SwitchStatement' || node?.type === 'JSXSwitchExpression';
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_try_control_node(node) {
	return node?.type === 'TryStatement' || node?.type === 'JSXTryExpression';
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_for_of_control_node(node) {
	return (
		node?.type === 'ForOfStatement' ||
		(node?.type === 'JSXForExpression' && node.statementType === 'ForOfStatement')
	);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_child(node, transform_context) {
	if (!node) return node;
	switch (node.type) {
		case 'JSXElement':
			if (is_native_tsrx_node(node)) {
				return to_jsx_element(node, transform_context, node.children || [], true);
			}
			if (is_dynamic_jsx_element(node)) {
				return dynamic_element_to_jsx(node, transform_context, true);
			}
			return node;
		case 'JSXFragment':
			if (is_native_tsrx_node(node)) {
				return tsrx_node_to_jsx_expression(node, transform_context, true);
			}
			return node;
		case 'JSXIfExpression':
		case 'IfStatement':
			if (node.metadata?.generated_loop_skip_if) {
				return node;
			}
			return (
				transform_context.platform.hooks?.controlFlow?.ifStatement ?? if_statement_to_jsx_child
			)(jsx_control_expression_to_statement(node), transform_context);
		case 'JSXForExpression':
			if (node.statementType !== 'ForOfStatement') {
				error(
					'TSRX `@for` currently supports `for...of` loops in template output.',
					transform_context.filename,
					node,
					transform_context.errors,
					transform_context.comments,
				);
				return to_jsx_expression_container(create_null_literal(), node);
			}
			return (
				transform_context.platform.hooks?.controlFlow?.forOf ?? for_of_statement_to_jsx_child
			)(jsx_control_expression_to_statement(node), transform_context);
		case 'ForOfStatement':
			return (
				transform_context.platform.hooks?.controlFlow?.forOf ?? for_of_statement_to_jsx_child
			)(node, transform_context);
		case 'JSXSwitchExpression':
		case 'SwitchStatement':
			return (
				transform_context.platform.hooks?.controlFlow?.switchStatement ??
				switch_statement_to_jsx_child
			)(jsx_control_expression_to_statement(node), transform_context);
		case 'JSXTryExpression':
		case 'TryStatement':
			return (
				transform_context.platform.hooks?.controlFlow?.tryStatement ?? try_statement_to_jsx_child
			)(jsx_control_expression_to_statement(node), transform_context);
		default:
			return node;
	}
}

/**
 * Lower a native TSRX fragment body to a JSX expression.
 * Children have already been parsed and transformed through the normal TSRX
 * JSX element/text/control-flow visitors.
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
 * Explicit return values inside expression-position native templates are JavaScript
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

	if (is_if_control_node(node)) {
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
		node.type === 'ClassExpression'
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
	if (!is_if_control_node(node)) return null;

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
	if (!is_if_control_node(node)) return null;

	const consequent = block_statement_to_return_expression(node.consequent);
	if (!consequent) return null;

	let alternate = create_null_literal();
	if (node.alternate) {
		if (is_if_control_node(node.alternate)) {
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
 * @param {any[]} body_nodes
 * @returns {any | undefined}
 */
function find_key_expression_in_body(body_nodes) {
	for (const node of body_nodes) {
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
	const node = set_loc(b.return(create_null_literal()), source_node);
	node.metadata = {
		...(node.metadata || {}),
		generated_loop_continue_return: true,
	};
	return node;
}

/**
 * `continue` in a component `for...of` body means "skip this item". JSX targets
 * lower `for...of` to callbacks, so a raw ContinueStatement would be invalid JS.
 * Returning null from the callback preserves the item-skip behavior while still
 * producing an explicit "render nothing" value for JSX runtimes.
 *
 * @param {any[] | any} node
 * @param {boolean} [is_root]
 * @returns {any[] | any}
 */
export function rewrite_loop_continues_to_bare_returns(node, is_root = true) {
	if (Array.isArray(node)) {
		return node.map((child) =>
			rewrite_loop_continues_to_bare_returns(child, is_root && !is_loop_statement(child)),
		);
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
 * @param {any[] | any} node
 * @param {TransformContext} transform_context
 * @param {boolean} [is_root]
 */
function validate_for_body_control_flow(node, transform_context, is_root = true) {
	if (Array.isArray(node)) {
		for (const child of node) {
			validate_for_body_control_flow(
				child,
				transform_context,
				is_root && !is_loop_statement(child),
			);
		}
		return;
	}

	if (!node || typeof node !== 'object') {
		return;
	}

	if (is_template_if_node(node)) {
		return;
	}

	if (node.type === 'ReturnStatement') {
		error(
			TSRX_FOR_RETURN_ERROR,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return;
	}
	if (node.type === 'BreakStatement') {
		error(
			TSRX_FOR_BREAK_ERROR,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return;
	}
	if (node.type === 'ContinueStatement') {
		error(
			TSRX_FOR_CONTINUE_ERROR,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return;
	}

	if (is_function_or_class_boundary(node) || (!is_root && is_loop_statement(node))) {
		return;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		validate_for_body_control_flow(node[key], transform_context, false);
	}
}

/**
 * @param {any[] | any} node
 * @param {TransformContext} transform_context
 */
function validate_if_body_control_flow(node, transform_context) {
	if (Array.isArray(node)) {
		for (const child of node) {
			validate_if_body_control_flow(child, transform_context);
		}
		return;
	}

	if (!node || typeof node !== 'object') {
		return;
	}

	if (node.type === 'ReturnStatement') {
		error(
			TSRX_IF_RETURN_ERROR,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return;
	}
	if (node.type === 'BreakStatement') {
		error(
			TSRX_IF_BREAK_ERROR,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return;
	}
	if (node.type === 'ContinueStatement') {
		error(
			TSRX_IF_CONTINUE_ERROR,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return;
	}

	if (is_function_or_class_boundary(node)) {
		return;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		validate_if_body_control_flow(node[key], transform_context);
	}
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_template_if_node(node) {
	return (
		node?.type === 'JSXIfExpression' ||
		node?.metadata?.tsrxDirective === 'if' ||
		(node?.type === 'IfStatement' && node?.statementType === 'IfStatement')
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_loop_statement(node) {
	return (
		node?.type === 'ForOfStatement' ||
		(node?.type === 'JSXForExpression' && node.statementType === 'ForOfStatement') ||
		node?.type === 'ForStatement' ||
		(node?.type === 'JSXForExpression' && node.statementType === 'ForStatement') ||
		node?.type === 'ForInStatement' ||
		(node?.type === 'JSXForExpression' && node.statementType === 'ForInStatement') ||
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
			`${transform_context.platform.name} TSRX does not support \`for await...of\` in TSRX templates.`,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
	}

	const loop_params = get_for_of_iteration_params(node.left, node.index);
	const loop_body = /** @type {any[]} */ (
		node.body.type === 'BlockStatement' ? node.body.body : [node.body]
	);
	validate_for_body_control_flow(loop_body, transform_context);
	const has_hooks =
		should_extract_hook_helpers(transform_context) &&
		body_contains_top_level_hook_call(loop_body, transform_context, true);
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
	const empty_fallback = node.empty
		? b.call(
				b.arrow(
					[],
					b.block(
						build_render_statements(
							node.empty.type === 'BlockStatement' ? node.empty.body : [node.empty],
							true,
							transform_context,
						),
					),
					false,
					undefined,
					node.empty,
				),
			)
		: null;

	if (transform_context.platform.imports.forOfIterableHelper) {
		transform_context.needs_for_of_iterable = true;
		const args = [node.right, iter_callback];
		if (empty_fallback) {
			args.push(b.literal(null), b.arrow([], empty_fallback));
		}
		return to_jsx_expression_container(b.call(b.id(MAP_ITERABLE_INTERNAL_NAME), ...args));
	}

	const map_call = b.call(b.member(node.right, create_generated_identifier('map')), iter_callback);
	if (empty_fallback) {
		return to_jsx_expression_container(
			b.conditional(
				b.binary(
					'===',
					b.member(clone_expression_node(node.right), create_generated_identifier('length')),
					b.literal(0),
				),
				empty_fallback,
				map_call,
			),
		);
	}

	return to_jsx_expression_container(map_call);
}

/**
 * @param {any[]} body_nodes
 * @param {any} key_expression
 * @returns {void}
 */
function apply_key_to_loop_body(body_nodes, key_expression) {
	for (const node of body_nodes) {
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
		if (node.type === 'JSXElement') {
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
 * Transform an `@try { ... } @pending { ... } @catch (err, reset) { ... }` block
 * into React `<TsrxErrorBoundary>` and/or `<Suspense>` JSX elements.
 *
 * - `@pending` → `<Suspense fallback={...}>`
 * - `@catch` → `<TsrxErrorBoundary fallback={(err, reset) => ...}>`
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
			`${transform_context.platform.name} TSRX does not support JavaScript \`try/finally\` in TSRX templates. \`finally\` is not part of TSRX control flow; move the try/finally into a function if you need cleanup logic.`,
			transform_context.filename,
			finalizer,
			transform_context.errors,
			transform_context.comments,
		);
	}

	if (!pending && !handler) {
		error(
			'TSRX try statements must have a `pending` or `catch` block.',
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

		result =
			transform_context.platform.hooks?.createPendingBoundary?.(
				result,
				fallback_content,
				transform_context,
				node,
			) ??
			create_jsx_element(
				'Suspense',
				[b.jsx_attribute(b.jsx_id('fallback'), fallback_content)],
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
			b.block(build_render_statements(catch_body_nodes, true, transform_context), handler.body),
			false,
			undefined,
			handler,
		);

		const fallback_component =
			transform_context.platform.hooks?.createErrorFallbackComponent?.(
				catch_body_nodes,
				catch_params,
				transform_context,
				node,
			) ?? null;

		transform_context.available_bindings = saved_catch_bindings;

		const boundary_content =
			transform_context.platform.hooks?.createErrorBoundaryContent?.(
				result,
				transform_context,
				node,
			) ?? null;

		const custom_boundary =
			transform_context.platform.hooks?.createErrorBoundary?.(
				result,
				try_content,
				fallback_fn,
				transform_context,
				node,
				{ fallbackComponent: fallback_component },
			) ?? null;

		if (custom_boundary) {
			result = custom_boundary;
		} else if (boundary_content && transform_context.inside_element_child) {
			result = to_jsx_expression_container(
				b.call(
					'TsrxErrorBoundary',
					b.object([b.init('fallback', fallback_fn), b.init('content', boundary_content)]),
				),
			);

			return result;
		} else {
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
 * during the walk: `Suspense` for `@try { ... } @pending { ... }`,
 * `TsrxErrorBoundary` for `@try { ... } @catch (...)`, and `mergeRefs` for
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
	const normalize_spread_props_source =
		transform_context.needs_normalize_spread_props && platform.imports.refProp
			? platform.imports.refProp
			: null;
	const normalize_spread_props_for_ref_attr_source =
		transform_context.needs_normalize_spread_props_for_ref_attr && platform.imports.refProp
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

	if (normalize_spread_props_source !== null) {
		add_ref_import_specifier(
			ref_imports,
			normalize_spread_props_source,
			b.import_specifier('normalize_spread_props', NORMALIZE_SPREAD_PROPS_INTERNAL_NAME),
		);
	}

	if (normalize_spread_props_for_ref_attr_source !== null) {
		add_ref_import_specifier(
			ref_imports,
			normalize_spread_props_for_ref_attr_source,
			b.import_specifier(
				'normalize_spread_props_for_ref_attr',
				NORMALIZE_SPREAD_PROPS_FOR_REF_ATTR_INTERNAL_NAME,
			),
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
	if (is_template_if_node(node)) {
		validate_if_body_control_flow(consequent_body, transform_context);
	}
	const consequent_has_hooks =
		should_extract_hook_helpers(transform_context) &&
		body_contains_top_level_hook_call(consequent_body, transform_context, true);

	let alternate = null;
	if (node.alternate) {
		if (is_if_control_node(node.alternate)) {
			alternate = create_render_if_statement(node.alternate, transform_context);
		} else {
			const alternate_body = node.alternate.body || [node.alternate];
			if (is_template_if_node(node)) {
				validate_if_body_control_flow(alternate_body, transform_context);
			}
			const alternate_has_hooks =
				should_extract_hook_helpers(transform_context) &&
				body_contains_top_level_hook_call(alternate_body, transform_context, true);
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
 * `own_body` is the case's isolated consequent. JSX `@switch` cases do not
 * fall through, so `break` is not part of the template switch model.
 *
 * @param {any[]} consequent
 * @returns {{ own_body: any[], has_terminator: boolean }}
 */
function summarize_switch_case_body(consequent) {
	const own_body = [];
	let has_terminator = false;
	for (const child of consequent) {
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
 * helper components and return everything callers need to construct a
 * target-specific switch shape (a JS `switch` for React/Preact/Vue or
 * `<Switch>/<Match>` for Solid). JSX `@switch` cases are isolated and do not
 * fall through.
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
 *   setup_statements: any[],
 * }}
 */
export function plan_switch_lift(switch_node, transform_context) {
	const case_info = switch_node.cases.map((/** @type {any} */ c) => {
		const consequent = flatten_switch_consequent(c.consequent || []);
		return summarize_switch_case_body(consequent);
	});

	// A case body needs to be lifted iff it contains hooks. Cases are isolated,
	// so downstream case bodies are never duplicated into earlier arms.
	const needs_helper = case_info.map(
		(/** @type {{ own_body: any[], has_terminator: boolean }} */ info) => {
			if (info.own_body.length === 0) return false;
			return (
				should_extract_hook_helpers(transform_context) &&
				body_contains_top_level_hook_call(info.own_body, transform_context, true)
			);
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

	for (let i = switch_node.cases.length - 1; i >= 0; i--) {
		if (!needs_helper[i]) continue;
		const { own_body } = case_info[i];

		case_helpers[i] = create_hook_safe_helper(
			own_body,
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
		setup_statements,
	};
}

/**
 * @param {any} switch_node
 * @param {TransformContext} transform_context
 * @returns {{ setup_statements: any[], switch_statement: any }}
 */
function build_switch_with_lift(switch_node, transform_context) {
	const { case_info, case_helpers, setup_statements } = plan_switch_lift(
		switch_node,
		transform_context,
	);

	const new_cases = switch_node.cases.map(
		(/** @type {any} */ original_case, /** @type {number} */ i) => {
			const helper = case_helpers[i];
			if (helper) {
				return set_loc(
					b.switch_case(original_case.test, [
						create_component_return_statement([helper.component_element], original_case),
					]),
					original_case,
				);
			}

			const { own_body, has_terminator } = case_info[i];

			if (own_body.length === 0 && !has_terminator) {
				return set_loc(
					b.switch_case(original_case.test, [create_null_return_statement()]),
					original_case,
				);
			}

			const case_body = [];
			const render_nodes = [];
			let has_terminal = false;

			for (const child of own_body) {
				if (is_loop_skip_return_statement(child)) {
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

			if (!has_terminal) {
				if (render_nodes.length > 0) {
					case_body.push(create_component_return_statement(render_nodes, original_case));
				} else if (case_body.length > 0) {
					case_body.push(create_null_return_statement());
				} else if (has_terminator) {
					case_body.push(create_null_return_statement());
				}
			}

			return set_loc(b.switch_case(original_case.test, case_body), original_case);
		},
	);

	return {
		setup_statements,
		switch_statement: b.switch(switch_node.discriminant, new_cases, switch_node),
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
 * `multiRefStrategy` can compose an explicit `ref={...}` with compiler-
 * synthesized refs created for host spreads.
 *
 * Before lowering, the raw attribute list is validated to reject elements
 * with more than one TSX-style `ref={...}` attribute — that shape produces
 * duplicate JSX props which the JSX runtime collapses to last-wins (and
 * which TypeScript can't type cleanly).
 *
 * @param {any[]} attrs
 * @param {TransformContext} transform_context
 * @param {any} element
 * @returns {any[]}
 */
function transform_element_attributes_dispatch(attrs, transform_context, element) {
	validate_at_most_one_ref_attribute(attrs, transform_context);
	const is_component = is_component_like_element(element);
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
	const name = element?.openingElement?.name;
	if (!name) return false;
	if (name.type === 'Identifier') return /^[A-Z]/.test(name.name);
	if (name.type === 'JSXIdentifier') return /^[A-Z]/.test(name.name);
	if (name.type === 'MemberExpression') return true;
	if (name.type === 'JSXMemberExpression') return true;
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

		const normalize_helper = needs_synthetic_spread_ref
			? NORMALIZE_SPREAD_PROPS_FOR_REF_ATTR_INTERNAL_NAME
			: NORMALIZE_SPREAD_PROPS_INTERNAL_NAME;
		if (needs_synthetic_spread_ref) {
			transform_context.needs_normalize_spread_props_for_ref_attr = true;
		} else {
			transform_context.needs_normalize_spread_props = true;
		}
		const normalized = b.call(normalize_helper, attr.argument);

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
			/** @type {any} */ (ref_attr.metadata).synthetic_ref = true;
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
 * Reject elements with more than one TSX-style `ref={...}` attribute.
 * This validator runs over the raw, pre-lowering attribute list so each
 * shape is still distinguishable by `type`.
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
			attr.type === 'JSXAttribute' &&
			attr.name &&
			attr.name.type === 'JSXIdentifier' &&
			attr.name.name === 'ref';
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
				'Use a single array-valued ref such as `ref={[a, b]}` where the target framework supports multiple refs.',
			transform_context?.filename ?? null,
			node,
			transform_context?.errors,
			transform_context?.comments,
		);
	}
}

/**
 * Collapse an explicit `ref={...}` plus compiler-synthesized spread refs into
 * one attribute. The shape of the merged value depends on
 * `platform.jsx.multiRefStrategy`:
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
		if (!attr.metadata?.synthetic_ref) tsx_form_count += 1;
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
			if (!source_attr && !attr.metadata?.synthetic_ref) {
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
export const NORMALIZE_SPREAD_PROPS_INTERNAL_NAME = '__normalize_spread_props';
export const NORMALIZE_SPREAD_PROPS_FOR_REF_ATTR_INTERNAL_NAME =
	'__normalize_spread_props_for_ref_attr';
export const MAP_ITERABLE_INTERNAL_NAME = '__map_iterable';
export const ITERATION_VALUE_INTERNAL_NAME = '__IterationValue';

const HTML_REF_TAG_NAMES = new Set(
	'a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr'.split(
		' ',
	),
);

const SVG_REF_TAG_NAMES = new Set(
	'a animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect script set stop style svg switch symbol text textPath title tspan use view'.split(
		' ',
	),
);

const MATHML_REF_TAG_NAMES = new Set(
	'annotation annotation-xml maction math merror mfrac mi mmultiscripts mn mo mover mpadded mphantom mprescripts mroot mrow ms mspace msqrt mstyle msub msubsup msup mtable mtd mtext mtr munder munderover semantics'.split(
		' ',
	),
);

/**
 * @param {any} element
 * @param {'html' | 'svg' | 'mathml'} [namespace]
 * @returns {AST.TypeNode | null}
 */
export function create_element_ref_target_type(element, namespace) {
	const tag_name = get_element_ref_tag_name(element);
	return tag_name === null ? null : create_element_ref_target_type_for_name(tag_name, namespace);
}

/**
 * @param {string} tag_name
 * @param {'html' | 'svg' | 'mathml'} [namespace]
 * @returns {AST.TypeNode}
 */
export function create_element_ref_target_type_for_name(tag_name, namespace = 'html') {
	const resolved_namespace =
		tag_name === 'svg'
			? 'svg'
			: tag_name === 'math'
				? 'mathml'
				: namespace === 'html'
					? infer_ref_namespace(tag_name)
					: namespace;

	if (resolved_namespace === 'svg') {
		return SVG_REF_TAG_NAMES.has(tag_name)
			? create_tag_name_map_ref_type('SVGElementTagNameMap', tag_name)
			: b.ts_type_reference(b.id('SVGElement'));
	}
	if (resolved_namespace === 'mathml') {
		return MATHML_REF_TAG_NAMES.has(tag_name)
			? create_tag_name_map_ref_type('MathMLElementTagNameMap', tag_name)
			: b.ts_type_reference(b.id('MathMLElement'));
	}
	return HTML_REF_TAG_NAMES.has(tag_name)
		? create_tag_name_map_ref_type('HTMLElementTagNameMap', tag_name)
		: b.ts_type_reference(b.id('HTMLElement'));
}

/**
 * @param {string} tag_name
 * @returns {'html' | 'svg' | 'mathml'}
 */
function infer_ref_namespace(tag_name) {
	if (HTML_REF_TAG_NAMES.has(tag_name)) return 'html';
	if (SVG_REF_TAG_NAMES.has(tag_name)) return 'svg';
	if (MATHML_REF_TAG_NAMES.has(tag_name)) return 'mathml';
	return 'html';
}

/**
 * @param {any} element
 * @returns {string | null}
 */
function get_element_ref_tag_name(element) {
	const name = element?.name;
	if (name?.type === 'JSXIdentifier') return name.name;
	if (element?.openingElement?.name?.type === 'JSXIdentifier') {
		return element.openingElement.name.name;
	}
	return null;
}

/**
 * @param {string} map_name
 * @param {string} tag_name
 * @returns {AST.TypeNode}
 */
function create_tag_name_map_ref_type(map_name, tag_name) {
	return /** @type {AST.TypeNode} */ ({
		type: 'TSIndexedAccessType',
		objectType: b.ts_type_reference(b.id(map_name)),
		indexType: b.ts_literal_type(b.literal(tag_name)),
		metadata: { path: [] },
	});
}

/**
 * @param {any} attr
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXAttribute | ESTreeJSX.JSXSpreadAttribute}
 */
export function to_jsx_attribute(attr, transform_context) {
	if (!attr) return attr;
	if (attr.type === 'JSXAttribute') {
		return attr;
	}
	if (attr.type === 'JSXSpreadAttribute') {
		return attr;
	}
	// Keep this legacy hook for targets that need React-style DOM attrs. The
	// current first-party targets preserve authored `class`.
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
 * @param {boolean} in_jsx_child
 * @returns {any}
 */
function dynamic_element_to_jsx(node, transform_context, in_jsx_child) {
	const source_name = node.openingElement?.name;
	const dynamic_id = set_loc(create_generated_identifier('DynamicElement'), source_name || node);
	const alias_declaration = set_loc(
		b.const(dynamic_id, jsx_name_to_expression(source_name)),
		source_name || node,
	);
	const jsx_element = create_dynamic_jsx_element(dynamic_id, node, transform_context);

	const expression = b.call(
		b.arrow(
			[],
			b.block([
				alias_declaration,
				b.return(b.conditional(clone_identifier(dynamic_id), jsx_element, create_null_literal())),
			]),
		),
	);

	return in_jsx_child ? to_jsx_expression_container(expression, node) : set_loc(expression, node);
}

/**
 * @param {AST.Identifier} dynamic_id
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {ESTreeJSX.JSXElement}
 */
function create_dynamic_jsx_element(dynamic_id, node, transform_context) {
	const attributes = transform_element_attributes_dispatch(
		node.openingElement?.attributes || [],
		transform_context,
		node,
	);
	const selfClosing = !!node.openingElement?.selfClosing;
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
		if (only.type === 'JSXText') {
			const value = (only.value ?? '').trim();
			return b.literal(value, JSON.stringify(value), only);
		}
		return only;
	}
	const first = render_nodes[0];
	const last = render_nodes[render_nodes.length - 1];
	return set_loc(
		b.jsx_fragment(render_nodes),
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
