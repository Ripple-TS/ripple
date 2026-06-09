/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */
/** @import { JsxTransformContext } from '@tsrx/core/types' */

import { walk } from 'zimmerframe';
import {
	createJsxTransform,
	error,
	mergeDuplicateRefs,
	toJsxAttribute,
	validateAtMostOneRefAttribute,
	addJsxSetupDeclaration as add_jsx_setup_declaration,
	collectParamBindings as collect_param_bindings,
	collectStatementBindings as collect_statement_bindings,
	extractJsxSetupDeclarations as extract_jsx_setup_declarations,
	isInterleavedBody as is_interleaved_body_core,
	isCapturableJsxChild as is_capturable_jsx_child,
	captureJsxChild,
	NORMALIZE_SPREAD_PROPS_FOR_REF_ATTR_INTERNAL_NAME,
	NORMALIZE_SPREAD_PROPS_INTERNAL_NAME,
	returnValueBodyToExpression as return_value_body_to_expression,
	tsxNodeToJsxExpression as tsx_node_to_jsx_expression,
	// Shared AST builders (truly platform-agnostic utilities).
	clone_expression_node,
	clone_identifier,
	clone_jsx_name,
	contains_component_jsx,
	create_generated_identifier,
	create_null_literal,
	get_for_of_iteration_params,
	is_component_like_element,
	planSwitchLift as plan_switch_lift,
	is_bare_render_expression,
	is_jsx_child,
	set_loc,
} from '@tsrx/core';

import { builders as b } from '@tsrx/core';

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
 * Solid extends the shared `JsxTransformContext` with `needs_*` flags that
 * track which Solid runtime primitives (`Show`, `For`, `Switch`, `Match`,
 * `Errored`, `Loading`) the lowered output requires. The factory seeds these
 * via `hooks.initialState`; everything else (filename, collect, errors,
 * helper_state, …) comes from the shared base.
 *
 * @typedef {JsxTransformContext & {
 *   needs_show: boolean,
 *   needs_for: boolean,
 *   needs_switch: boolean,
 *   needs_match: boolean,
 *   needs_errored: boolean,
 *   needs_loading: boolean,
 *   needs_normalize_spread_props: boolean,
 *   needs_normalize_spread_props_for_ref_attr: boolean,
 * }} TransformContext
 */

/**
 * @typedef {{ source_name: string, read: () => any }} LazyBinding
 */

/**
 * Solid platform descriptor consumed by `createJsxTransform`. Everything
 * that diverges from React/Preact is plugged in via `hooks`:
 * - Component-level `await` is rejected outright (no `"use server"` escape).
 * - Control-flow statements become Solid's `<Show>` / `<For>` /
 *   `<Switch>/<Match>` / `<Errored>/<Loading>` instead of inline JSX.
 * - Uppercase native TSRX functions use Solid render-time control flow, so
 *   branches stay reactive without reintroducing a TSRX-specific declaration.
 * - Element attributes support composite elements and Solid's `class`
 *   attribute spelling.
 * - `needs_show` / `needs_for` / etc. flags track which runtime
 *   primitives must be imported, injected by `inject_solid_imports`.
 *
 * @type {import('@tsrx/core/types').JsxPlatform}
 */
const solid_platform = {
	name: 'Solid',
	imports: {
		// Solid doesn't use the React-style Suspense / ErrorBoundary pair.
		// Both fields are here to satisfy the descriptor shape; actual
		// import injection goes through `hooks.injectImports`.
		suspense: 'solid-js',
		dynamic: '@tsrx/solid/dynamic',
		errorBoundary: 'solid-js',
		refProp: '@tsrx/solid/ref',
	},
	jsx: {
		rewriteClassAttr: false,
		// Solid's runtime accepts an array of refs natively, so multiple
		// `ref` attributes collapse to `ref={[a, b, ...]}` rather than
		// going through a `mergeRefs` helper.
		multiRefStrategy: 'array',
	},
	validation: {
		requireUseServerForAwait: true,
		// Solid's custom validator always rejects component-level await,
		// so directive scanning is redundant work. Keep the fallback flag
		// above true as a safety net if the custom hook is removed.
		scanUseServerDirectiveForAwaitWithCustomValidator: false,
	},
	hooks: {
		// Hoist to module scope in the client transform —
		// same trade-off as Vue, where one definition per helper
		// keeps bundles small and source mappings 1:1. The
		// `compile_to_volar_mappings` entry point opts back out so Volar's
		// type-only output keeps helpers inline against the component body.
		moduleScopedHookComponents: true,
		initialState: () => ({
			needs_show: false,
			needs_for: false,
			needs_switch: false,
			needs_match: false,
			needs_errored: false,
			needs_loading: false,
			needs_normalize_spread_props: false,
		}),
		canHoistStaticNode(node) {
			// Solid's reactive runtime doesn't reuse JSX-element identity the
			// way React does, so hoisting `<Component />` references to module
			// level pays no runtime cost — it just creates an extra `const`
			// that aliases a helper invocation (e.g. `App__static1 =
			// <App__StatementBodyHook2 />`). Truly-static DOM trees like
			// `<span>Hello</span>` still benefit from being hoisted out of
			// the per-render closure, so we only veto hoisting when the
			// subtree contains a *component* JSX element. Same logic Vue uses.
			return !contains_component_jsx(node);
		},
		validateComponentAwait: (await_expression, _component, ctx, _requires, source) => {
			const await_start = get_await_keyword_start(await_expression, source);
			const adjusted_node = /** @type {any} */ ({
				...await_expression,
				start: await_start,
				end: await_start + 'await'.length,
			});
			error(
				'`await` is not allowed inside Solid components.',
				ctx?.filename ?? null,
				adjusted_node,
				ctx?.errors,
				ctx?.comments,
			);
		},
		controlFlow: {
			ifStatement: if_statement_to_jsx_child,
			forOf: for_of_statement_to_jsx_child,
			switchStatement: switch_statement_to_jsx_child,
			tryStatement: try_statement_to_jsx_child,
		},
		injectImports: (program, ctx) => inject_solid_imports(program, /** @type {any} */ (ctx)),
		// `transformElementAttributes` is intentionally omitted: the
		// `transformElement` hook below short-circuits core's element walker
		// before `to_jsx_element` runs, so the dispatch path that would call
		// `transformElementAttributes` is never reached for Solid. Attribute
		// lowering happens in Solid's local `transform_element_attributes`,
		// which `to_jsx_element` calls directly.
		transformElement: (inner, ctx) =>
			to_jsx_element(/** @type {any} */ (inner), /** @type {any} */ (ctx)),
	},
};

export const transform = createJsxTransform(solid_platform);

/**
 * @param {any} await_node
 * @param {string} source
 * @returns {number}
 */
function get_await_keyword_start(await_node, source) {
	if (await_node?.type === 'AwaitExpression') {
		return await_node.start ?? 0;
	}

	if (
		(await_node?.type === 'ForOfStatement' || await_node?.type === 'JSXForExpression') &&
		await_node.await === true
	) {
		const statement_start = await_node.start ?? 0;
		const statement_end = await_node.end ?? statement_start;
		const statement_source = source.slice(statement_start, statement_end);
		const await_offset = statement_source.search(/\bawait\b/);

		if (await_offset !== -1) {
			return statement_start + await_offset;
		}
	}

	return await_node?.start ?? 0;
}
// =====================================================================
// Control flow → Solid JSX components
// =====================================================================

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_child(node, transform_context) {
	if (!node) return node;
	switch (node.type) {
		case 'JSXFragment':
			if (node.metadata?.native_tsrx) {
				return tsrx_node_to_jsx_expression(node, transform_context, true);
			}
			return node;
		case 'JSXElement':
			if (node.metadata?.native_tsrx) {
				return to_jsx_element(node, transform_context);
			}
			return node;
		case 'JSXIfExpression':
			return if_statement_to_jsx_child(
				jsx_control_expression_to_statement(node),
				transform_context,
			);
		case 'IfStatement':
			if (!is_solid_render_control(node)) {
				return node;
			}
			return if_statement_to_jsx_child(node, transform_context);
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
			return for_of_statement_to_jsx_child(
				jsx_control_expression_to_statement(node),
				transform_context,
			);
		case 'ForOfStatement':
			if (!is_solid_render_control(node)) {
				return node;
			}
			return for_of_statement_to_jsx_child(node, transform_context);
		case 'JSXSwitchExpression':
			return switch_statement_to_jsx_child(
				jsx_control_expression_to_statement(node),
				transform_context,
			);
		case 'SwitchStatement':
			if (!is_solid_render_control(node)) {
				return node;
			}
			return switch_statement_to_jsx_child(node, transform_context);
		case 'JSXTryExpression':
			return try_statement_to_jsx_child(
				jsx_control_expression_to_statement(node),
				transform_context,
			);
		case 'TryStatement':
			if (!is_solid_render_control(node)) {
				return node;
			}
			return try_statement_to_jsx_child(node, transform_context);
		default:
			return node;
	}
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
 * Lower a native TSRX fragment body to a Solid JSX expression.
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

	const returned_expression = return_value_body_to_expression(children, node, transform_context);
	if (returned_expression) {
		if (
			in_jsx_child &&
			returned_expression.type !== 'JSXElement' &&
			returned_expression.type !== 'JSXFragment' &&
			returned_expression.type !== 'JSXText' &&
			returned_expression.type !== 'JSXExpressionContainer'
		) {
			return to_jsx_expression_container(returned_expression, node);
		}
		return returned_expression;
	}

	let expression = body_to_jsx_child(children, transform_context);
	if (is_branch_arrow(expression)) {
		expression = b.call(expression);
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
 * Convert a list of body nodes to a Solid JSX child.
 *
 * If the body is purely JSX, returns the JSX node (or fragment) directly.
 *
 * If the body contains non-JSX statements (declarations, throws, etc.), we
 * must preserve them — they may declare signals, throw errors, or perform
 * other branch-local setup that subsequent JSX depends on. We wrap them in
 * an `ArrowFunctionExpression` whose block body is
 *   `() => { ...statements; return <>...jsx</>; }`
 * Callers are responsible for placing that arrow where Solid's runtime will
 * actually call it:
 *   - `<Show>` / `<Match>` children: invoked as function children via
 *     {@link to_function_child} which ensures `length > 0` so Solid's
 *     runtime calls them with a condition accessor.
 *   - `<For>` / `<Errored fallback>`: the outer iteration/fallback arrow's
 *     body is merged with the branch arrow's body via
 *     {@link merge_branch_body_into_arrow}.
 *   - Fallback props (`<Show fallback>`, `<Switch fallback>`,
 *     `<Loading fallback>`): IIFE-wrapped via {@link iife_if_arrow}.
 *
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function body_to_jsx_child(body_nodes, transform_context) {
	// When non-JSX statements are interleaved with JSX children, preserve
	// source order by capturing each JSX child into a const at its textual
	// position. Otherwise all statements would run before any JSX is
	// constructed, so every JSX child would observe the final state of
	// mutable variables instead of the value at its point in the source.
	const interleaved = is_interleaved_body(body_nodes);

	/** @type {any[]} */
	const statements = [];
	/** @type {any[]} */
	const children = [];
	let has_terminal_return = false;
	let capture_index = 0;
	for (const child of body_nodes) {
		if (child?.type === 'ReturnStatement' && child.argument != null) {
			statements.push(child);
			has_terminal_return = true;
			continue;
		}

		if (is_solid_render_child(child)) {
			const jsx = to_jsx_child(child, transform_context);
			statements.push(...extract_jsx_setup_declarations(jsx));
			if (interleaved && is_capturable_jsx_child(jsx)) {
				const { declaration, reference } = captureJsxChild(jsx, capture_index++);
				statements.push(declaration);
				children.push(reference);
			} else {
				children.push(jsx);
			}
		} else if (is_bare_render_expression(child)) {
			children.push(to_jsx_expression_container(child, child));
		} else {
			statements.push(child);
		}
	}

	if (statements.length === 0) {
		if (children.length === 0) return create_null_literal();
		return build_return_expression(children) || create_null_literal();
	}

	// Branch body has non-JSX statements: wrap everything in an arrow so the
	// statements run when (and only when) the branch actually renders.
	/** @type {any[]} */
	const block_body = [...statements];
	if (children.length > 0 || !has_terminal_return) {
		block_body.push(
			b.return(children.length > 0 ? build_return_expression(children) : create_null_literal()),
		);
	}

	const arrow = b.arrow([], b.block(block_body));
	/** @type {any} */ (arrow.metadata).is_branch_arrow = true;
	return arrow;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_bare_return_statement(node) {
	return node?.type === 'ReturnStatement' && node.metadata?.generated_loop_continue_return === true;
}

/**
 * @param {any} node
 * @returns {any[]}
 */
function get_if_consequent_body(node) {
	return node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
}

/**
 * @param {any[]} body_nodes
 * @returns {boolean}
 */
function body_has_loop_skip(body_nodes) {
	return body_nodes.some(
		(node) => is_bare_return_statement(node) || get_returning_if_info(node) !== null,
	);
}

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
 * @returns {boolean}
 */
function is_loop_statement(node) {
	return (
		node?.type === 'ForStatement' ||
		node?.type === 'ForInStatement' ||
		node?.type === 'ForOfStatement' ||
		node?.type === 'JSXForExpression' ||
		node?.type === 'WhileStatement' ||
		node?.type === 'DoWhileStatement'
	);
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
function is_template_for_of_node(node) {
	return (
		node?.type === 'JSXForExpression' ||
		node?.metadata?.tsrxDirective === 'for' ||
		(node?.type === 'ForOfStatement' && node?.statementType === 'ForOfStatement')
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_template_switch_node(node) {
	return (
		node?.type === 'JSXSwitchExpression' ||
		node?.metadata?.tsrxDirective === 'switch' ||
		(node?.type === 'SwitchStatement' && node?.statementType === 'SwitchStatement')
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_template_try_node(node) {
	return (
		node?.type === 'JSXTryExpression' ||
		node?.metadata?.tsrxDirective === 'try' ||
		(node?.type === 'TryStatement' && node?.statementType === 'TryStatement')
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_solid_render_control(node) {
	return (
		!!node?.metadata?.solid_render_control ||
		is_template_if_node(node) ||
		is_template_for_of_node(node) ||
		is_template_switch_node(node) ||
		is_template_try_node(node)
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_solid_render_child(node) {
	if (!is_jsx_child(node)) {
		return false;
	}

	switch (node.type) {
		case 'IfStatement':
		case 'ForOfStatement':
		case 'SwitchStatement':
		case 'TryStatement':
			return is_solid_render_control(node);
		default:
			return true;
	}
}

/**
 * @template T
 * @param {T} node
 * @returns {T}
 */
function mark_solid_render_control(node) {
	const next = /** @type {any} */ (node);
	next.metadata = { ...(next.metadata || {}), solid_render_control: true };
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
		error(TSRX_FOR_RETURN_ERROR, transform_context.filename, node, transform_context.errors);
		return;
	}
	if (node.type === 'BreakStatement') {
		error(TSRX_FOR_BREAK_ERROR, transform_context.filename, node, transform_context.errors);
		return;
	}
	if (node.type === 'ContinueStatement') {
		error(TSRX_FOR_CONTINUE_ERROR, transform_context.filename, node, transform_context.errors);
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
		error(TSRX_IF_RETURN_ERROR, transform_context.filename, node, transform_context.errors);
		return;
	}
	if (node.type === 'BreakStatement') {
		error(TSRX_IF_BREAK_ERROR, transform_context.filename, node, transform_context.errors);
		return;
	}
	if (node.type === 'ContinueStatement') {
		error(TSRX_IF_CONTINUE_ERROR, transform_context.filename, node, transform_context.errors);
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
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function loop_body_to_callback_statements(body_nodes, transform_context) {
	/** @type {any[]} */
	const statements = [];
	/** @type {any[]} */
	const children = [];

	/**
	 * @param {any} source_node
	 * @param {any[]} render_nodes
	 */
	const create_return_statement = (source_node, render_nodes) => {
		const cloned = render_nodes.map((node) => clone_expression_node(node));
		const argument = cloned.length > 0 ? build_return_expression(cloned) : create_null_literal();
		return set_loc(b.return(argument), source_node);
	};

	/** @param {any} source_node */
	const flush_children_to_return = (source_node) => {
		const statement = create_return_statement(source_node, children);
		children.length = 0;
		return statement;
	};

	let has_terminal_return = false;

	for (const child of body_nodes) {
		if (is_bare_return_statement(child)) {
			statements.push(flush_children_to_return(child));
			has_terminal_return = true;
			break;
		}

		const returning_if_info = get_returning_if_info(child);
		if (returning_if_info !== null) {
			const branch_statements = loop_body_to_callback_statements(
				returning_if_info.consequent_body,
				transform_context,
			);
			prepend_render_nodes_to_return_statements(branch_statements, children);
			statements.push(set_loc(b.if(child.test, b.block(branch_statements), null), child));
			continue;
		}

		if (is_solid_render_child(child)) {
			const jsx = to_jsx_child(child, transform_context);
			statements.push(...extract_jsx_setup_declarations(jsx));
			children.push(jsx);
		} else if (is_bare_render_expression(child)) {
			children.push(to_jsx_expression_container(child, child));
		} else {
			statements.push(child);
		}
	}

	if (!has_terminal_return) {
		statements.push(flush_children_to_return(body_nodes.at(-1)));
	}
	return statements;
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
	const combined = render_nodes.map((node) => clone_expression_node(node));

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
 * Solid-specific binding of the core `isInterleavedBody` helper with this
 * target's render-child predicate.
 *
 * @param {any[]} body_nodes
 * @returns {boolean}
 */
function is_interleaved_body(body_nodes) {
	return is_interleaved_body_core(body_nodes, is_solid_render_child);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_branch_arrow(node) {
	return (
		node &&
		node.type === 'ArrowFunctionExpression' &&
		node.metadata &&
		node.metadata.is_branch_arrow === true
	);
}

/**
 * Turn a branch arrow (`() => { ...; return jsx; }`) into a function child
 * that Solid's `<Show>` / `<Match>` runtime will actually invoke. Those
 * components only call `children` as a function when `children.length > 0`,
 * so we give the arrow a single underscore-prefixed parameter that it
 * ignores.
 *
 * If the input isn't a branch arrow, it's returned unchanged.
 *
 * @param {any} node
 * @returns {any}
 */
function to_function_child(node) {
	if (!is_branch_arrow(node)) return node;
	return {
		...node,
		params: [create_generated_identifier('_')],
	};
}

/**
 * Inline a branch arrow's statements into an existing arrow (e.g. the
 * `(item, i) => ...` passed to `<For>` or the `(err, reset) => ...` passed
 * to `<Errored fallback>`). Returns the arrow with its body replaced by the
 * merged block.
 *
 * @param {any} outer_arrow
 * @param {any} branch_body
 * @returns {any}
 */
function merge_branch_body_into_arrow(outer_arrow, branch_body) {
	if (!is_branch_arrow(branch_body)) {
		return { ...outer_arrow, body: branch_body, expression: true };
	}
	return {
		...outer_arrow,
		body: branch_body.body,
		expression: false,
	};
}

/**
 * Detect a top-level `if` branch with a bare `return` and no `else` branch.
 *
 * @param {any} node
 * @returns {{ consequent_body: any[], return_index: number } | null}
 */
function get_returning_if_info(node) {
	if (!node || node.type !== 'IfStatement' || node.alternate) return null;
	const consequent = node.consequent;
	if (!consequent) return null;

	if (is_bare_return_statement(consequent)) {
		return {
			consequent_body: [consequent],
			return_index: 0,
		};
	}

	if (consequent.type === 'BlockStatement') {
		const return_index = consequent.body.findIndex(is_bare_return_statement);
		if (return_index !== -1) {
			return {
				consequent_body: consequent.body,
				return_index,
			};
		}
	}

	return null;
}

/**
 * Wrap a branch arrow in an IIFE so it can be used as a prop value (e.g.
 * `<Show fallback={...}>`). Returns non-arrow inputs unchanged.
 *
 * @param {any} node
 * @returns {any}
 */
function iife_if_arrow(node) {
	if (!is_branch_arrow(node)) return node;
	return b.call(node);
}

/**
 * `if (test) { ... }` → `<Show when={test}>...</Show>`
 * `if (test) { a } else { b }` → `<Show when={test} fallback={b}>a</Show>`
 * `if (a) { } else if (b) { } else { }` → `<Switch fallback={...}><Match when={a}>...</Match>...</Switch>`
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function if_statement_to_jsx_child(node, transform_context) {
	const branches = flatten_if_chain(node);
	if (is_template_if_node(node)) {
		for (const branch of branches) {
			validate_if_body_control_flow(branch.body, transform_context);
		}
	}

	if (branches.length === 1) {
		// Single `if` with no else → <Show when>
		transform_context.needs_show = true;
		const [{ test, body }] = branches;
		return build_show_element(test, body_to_jsx_child(body, transform_context), null);
	}

	if (branches.length === 2 && branches[1].test === null) {
		// Plain if/else → <Show when fallback>
		transform_context.needs_show = true;
		const [if_branch, else_branch] = branches;
		return build_show_element(
			if_branch.test,
			body_to_jsx_child(if_branch.body, transform_context),
			body_to_jsx_child(else_branch.body, transform_context),
		);
	}

	// 3+ branches → <Switch fallback>{<Match when>...</Match>}...</Switch>
	transform_context.needs_switch = true;
	transform_context.needs_match = true;

	let fallback = null;
	const match_branches = [];
	for (const branch of branches) {
		if (branch.test === null) {
			fallback = body_to_jsx_child(branch.body, transform_context);
		} else {
			match_branches.push(branch);
		}
	}

	const attributes =
		fallback !== null
			? [
					{
						type: 'JSXAttribute',
						name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
						value: to_jsx_expression_container(iife_if_arrow(fallback)),
						metadata: { path: [] },
					},
				]
			: [];

	const children = match_branches.map((branch) =>
		create_jsx_element(
			'Match',
			[
				{
					type: 'JSXAttribute',
					name: { type: 'JSXIdentifier', name: 'when', metadata: { path: [] } },
					value: to_jsx_expression_container(branch.test),
					metadata: { path: [] },
				},
			],
			[jsx_child_wrap(to_function_child(body_to_jsx_child(branch.body, transform_context)))],
		),
	);

	return create_jsx_element('Switch', attributes, children);
}

/**
 * Flatten an if/else-if chain into an array of `{ test, body }` branches.
 * The final `else` (if present) is represented as `{ test: null, body }`.
 *
 * @param {any} node
 * @returns {{ test: any, body: any[] }[]}
 */
function flatten_if_chain(node) {
	const branches = [];
	/** @type {any} */
	let current = node;
	while (current && current.type === 'IfStatement') {
		const consequent_body =
			current.consequent.type === 'BlockStatement' ? current.consequent.body : [current.consequent];
		branches.push({ test: current.test, body: consequent_body });
		if (current.alternate && current.alternate.type === 'IfStatement') {
			current = current.alternate;
			continue;
		}
		if (current.alternate) {
			const alt_body =
				current.alternate.type === 'BlockStatement' ? current.alternate.body : [current.alternate];
			branches.push({ test: null, body: alt_body });
		}
		break;
	}
	return branches;
}

/**
 * @param {any} test
 * @param {any} children
 * @param {any} fallback
 * @returns {any}
 */
function build_show_element(test, children, fallback) {
	const attributes = [
		{
			type: 'JSXAttribute',
			name: { type: 'JSXIdentifier', name: 'when', metadata: { path: [] } },
			value: to_jsx_expression_container(test),
			metadata: { path: [] },
		},
	];
	if (fallback !== null && fallback !== undefined) {
		attributes.push({
			type: 'JSXAttribute',
			name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
			value: to_jsx_expression_container(iife_if_arrow(fallback)),
			metadata: { path: [] },
		});
	}
	return create_jsx_element('Show', attributes, [jsx_child_wrap(to_function_child(children))]);
}

/**
 * `for (const item of items; index i) { ... }` →
 * `<For each={items} keyed={false}>{(item, i) => ...}</For>`
 *
 * `for (const item of items; key item.id) { ... }` →
 * `<For each={items} keyed={(item) => item.id}>{(item) => ...}</For>`
 *
 * Solid 2.0's `<For>` defaults to raw row values for the child callback. When
 * no explicit `key` is present, TSRX follows Solid's native callback shapes:
 * index loops use `keyed={false}` (accessor item, raw index), while loops
 * without an index use the default raw item. Explicit `key` clauses replace
 * the implicit mode with the user-provided key expression.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function for_of_statement_to_jsx_child(node, transform_context) {
	transform_context.needs_for = true;

	const loop_params = get_for_of_iteration_params(node.left, node.index);
	const loop_body = /** @type {any[]} */ (
		node.body.type === 'BlockStatement' ? node.body.body : [node.body]
	);
	const uses_index_only_mode = !node.key && node.index;
	validate_for_body_control_flow(loop_body, transform_context);

	let arrow;

	if (body_has_loop_skip(loop_body)) {
		arrow = b.arrow(
			loop_params,
			b.block(loop_body_to_callback_statements(loop_body, transform_context)),
		);
	} else {
		// Placeholder body — merge_branch_body_into_arrow replaces it below.
		arrow = b.arrow(loop_params, b.literal(null));
		arrow = merge_branch_body_into_arrow(arrow, body_to_jsx_child(loop_body, transform_context));
	}

	const attributes = [b.jsx_attribute(b.jsx_id('each'), to_jsx_expression_container(node.right))];
	if (node.empty) {
		const empty_body = node.empty.type === 'BlockStatement' ? node.empty.body : [node.empty];
		attributes.push(
			b.jsx_attribute(
				b.jsx_id('fallback'),
				to_jsx_expression_container(body_to_jsx_child(empty_body, transform_context), node.empty),
			),
		);
	}

	if (node.key) {
		const item_param = clone_expression_node(loop_params[0]);
		const keyed_arrow = b.arrow([item_param], node.key);
		attributes.push(
			b.jsx_attribute(b.jsx_id('keyed'), to_jsx_expression_container(keyed_arrow, node.key)),
		);
	} else if (uses_index_only_mode) {
		attributes.push(b.jsx_attribute(b.jsx_id('keyed'), to_jsx_expression_container(b.false)));
	}

	return create_jsx_element('For', attributes, [to_jsx_expression_container(arrow)]);
}

/**
 * Solid doesn't have a dedicated `<Switch>` statement — we reuse the
 * `<Switch>/<Match>` components pair that `if` chains use. A `switch`
 * statement with a discriminant `d` and cases `[c1, c2, default]` becomes:
 *   <Switch fallback={...default}><Match when={d === c1}>...</Match>...</Switch>
 *
 * Cases are isolated: `@switch` does not fall through and does not use `break`.
 * Hook-bearing case bodies reuse the shared `plan_switch_lift` pipeline from
 * `@tsrx/core`. The client transform hoists those helpers to module scope
 * (Solid's platform sets `moduleScopedHookComponents: true`);
 * `compile_to_volar_mappings` opts back out and emits the helpers locally
 * inside the component body so Volar still sees closure-captured bindings
 * against the component scope.
 *
 * When any case is lifted in `typeOnly` mode the helper declarations have to
 * live somewhere local-scoped — we wrap the whole `<Switch>` in an IIFE that
 * declares them in order and returns the element. The client transform's
 * module-scoped helpers leave that IIFE empty, so we skip the wrapper.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function switch_statement_to_jsx_child(node, transform_context) {
	transform_context.needs_switch = true;
	transform_context.needs_match = true;

	const { case_info, case_helpers, setup_statements } = plan_switch_lift(node, transform_context);

	/** @type {any} */
	let fallback = null;
	/** @type {Array<{ test: any, body_jsx: any }>} */
	const match_entries = [];

	for (let i = 0; i < node.cases.length; i++) {
		const original_case = node.cases[i];
		const info = case_info[i];
		const helper = case_helpers[i];

		/** @type {any} */
		let body_jsx;
		if (helper) {
			// Lifted case: render the helper element directly. Use the
			// original `component_element` (not a clone) for this — its
			// definition's `loc` is what the case position should map to.
			body_jsx = helper.component_element;
		} else if (info.own_body.length === 0) {
			body_jsx = create_null_literal();
		} else {
			body_jsx = body_to_jsx_child(info.own_body, transform_context);
		}

		if (original_case.test === null) {
			fallback = body_jsx;
			continue;
		}

		// Clone the discriminant per-case: every generated `<Match when={d === caseN}>`
		// would otherwise share the same AST node reference, so a downstream pass
		// (lazy transforms, printer metadata, source-map annotation) mutating it on
		// one case would corrupt the others. The right operand (`caseN`) is the
		// original source `test` node — unique per case, so we keep its real loc
		// for editor IntelliSense and don't clone it.
		const test = b.binary('===', clone_expression_node(node.discriminant), original_case.test);

		match_entries.push({ test, body_jsx });
	}

	const match_children = match_entries.map(({ test, body_jsx }) =>
		create_jsx_element(
			'Match',
			[
				{
					type: 'JSXAttribute',
					name: { type: 'JSXIdentifier', name: 'when', metadata: { path: [] } },
					value: to_jsx_expression_container(test),
					metadata: { path: [] },
				},
			],
			[jsx_child_wrap(to_function_child(body_jsx))],
		),
	);

	const attributes =
		fallback !== null
			? [
					{
						type: 'JSXAttribute',
						name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
						value: to_jsx_expression_container(iife_if_arrow(fallback)),
						metadata: { path: [] },
					},
				]
			: [];

	const switch_element = create_jsx_element('Switch', attributes, match_children);

	if (setup_statements.length === 0) {
		return switch_element;
	}

	// Local-scoped helpers (typeOnly mode): wrap the <Switch> in an IIFE that
	// declares the helpers in source order and returns the element.
	return to_jsx_expression_container(
		b.call(b.arrow([], b.block([...setup_statements, b.return(switch_element)]))),
	);
}

/**
 * Transform an `@try { ... } @pending { ... } @catch (err, reset) { ... }` block
 * into Solid's `<Errored>` and/or `<Loading>` JSX elements.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function try_statement_to_jsx_child(node, transform_context) {
	const pending = node.pending;
	const handler = node.handler;
	const finalizer = node.finalizer;

	if (finalizer) {
		error(
			'Solid TSRX does not support JavaScript `try/finally` in component templates. `finally` is not part of TSRX control flow; move the try/finally into a function if you need cleanup logic.',
			transform_context.filename,
			finalizer,
			transform_context.errors,
			transform_context.comments,
		);
	}

	if (!pending && !handler) {
		error(
			'Solid try statements must have a `pending` or `catch` block.',
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return to_jsx_expression_container(create_null_literal());
	}

	const try_body_nodes = node.block.body || [];
	/** @type {any} */
	let result = jsx_child_wrap(iife_if_arrow(body_to_jsx_child(try_body_nodes, transform_context)));

	if (pending) {
		transform_context.needs_loading = true;
		const pending_body_nodes = pending.body || [];
		const fallback_content = body_to_jsx_child(pending_body_nodes, transform_context);

		result = create_jsx_element(
			'Loading',
			[
				{
					type: 'JSXAttribute',
					name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
					value: to_jsx_expression_container(iife_if_arrow(fallback_content)),
					metadata: { path: [] },
				},
			],
			[result],
		);
	}

	if (handler) {
		transform_context.needs_errored = true;

		const catch_params = [];
		if (handler.param) catch_params.push(handler.param);
		else catch_params.push(create_generated_identifier('_error'));
		if (handler.resetParam) catch_params.push(handler.resetParam);
		else catch_params.push(create_generated_identifier('_reset'));

		const catch_body_nodes = handler.body.body || [];
		const catch_jsx = body_to_jsx_child(catch_body_nodes, transform_context);

		const fallback_fn = merge_branch_body_into_arrow(
			b.arrow(catch_params, b.literal(null)),
			catch_jsx,
		);

		result = create_jsx_element(
			'Errored',
			[b.jsx_attribute(b.jsx_id('fallback'), to_jsx_expression_container(fallback_fn))],
			[result],
		);
	}

	return result;
}

/**
 * If `child` is already a JSX child node return it; otherwise wrap in
 * a JSXExpressionContainer so it can live inside a JSX element's children list.
 *
 * @param {any} child
 * @returns {any}
 */
function jsx_child_wrap(child) {
	if (!child) return child;
	if (child.type === 'JSXElement' || child.type === 'JSXFragment') return child;
	return to_jsx_expression_container(child);
}

/**
 * @param {string} tag_name
 * @param {any[]} attributes
 * @param {any[]} children
 * @returns {any}
 */
function create_jsx_element(tag_name, attributes, children) {
	const name = { type: 'JSXIdentifier', name: tag_name, metadata: { path: [] } };
	const filtered_children = children.filter(Boolean);
	return {
		type: 'JSXElement',
		openingElement: {
			type: 'JSXOpeningElement',
			name,
			attributes,
			selfClosing: filtered_children.length === 0,
			metadata: { path: [] },
		},
		closingElement:
			filtered_children.length > 0
				? {
						type: 'JSXClosingElement',
						name: { type: 'JSXIdentifier', name: tag_name, metadata: { path: [] } },
						metadata: { path: [] },
					}
				: null,
		children: filtered_children,
		metadata: { path: [] },
	};
}

// =====================================================================
// Native function component control-flow splitting
// =====================================================================

/**
 * Solid components run their function body once at setup time, so a plain
 * JavaScript `if (props.visible) return <A />` only observes the initial prop
 * value. Native TSRX functions that are component-shaped need their render
 * control flow lowered back into Solid's JSX control components.
 *
 * The shared factory has already expanded `return <>...</>` into normal JSX
 * returns by the time imports are injected. This pass folds those returns back
 * into render children, then reuses the local `<Show>/<For>/<Switch>/<Errored>`
 * builders.
 *
 * @param {AST.Program} program
 * @param {TransformContext} transform_context
 * @returns {void}
 */
function rewrite_solid_native_component_control_flow(program, transform_context) {
	const rewritten = walk(/** @type {any} */ (program), transform_context, {
		FunctionDeclaration(node, { next, path, state }) {
			const inner = /** @type {any} */ (next() ?? node);
			rewrite_solid_native_component_function(inner, path.at(-1), state);
			return inner;
		},
		FunctionExpression(node, { next, path, state }) {
			const inner = /** @type {any} */ (next() ?? node);
			rewrite_solid_native_component_function(inner, path.at(-1), state);
			return inner;
		},
		ArrowFunctionExpression(node, { next, path, state }) {
			const inner = /** @type {any} */ (next() ?? node);
			rewrite_solid_native_component_function(inner, path.at(-1), state);
			return inner;
		},
	});

	program.body = /** @type {AST.Program} */ (rewritten).body;
}

/**
 * @param {any} fn
 * @param {any} parent
 * @param {TransformContext} transform_context
 * @returns {void}
 */
function rewrite_solid_native_component_function(fn, parent, transform_context) {
	if (!fn?.metadata?.native_tsrx_body || fn.body?.type !== 'BlockStatement') {
		return;
	}

	const name = get_function_like_name(fn, parent);
	if (!name || !/^[A-Z]/.test(name)) {
		return;
	}

	const source_body = fn.body.body || [];
	const early_body = rewrite_early_return_guard_body(source_body, transform_context);
	const effective_body =
		early_body ??
		(() => {
			const lowered = lower_solid_component_statement_list(source_body);
			return lowered.changed ? lowered.nodes : null;
		})();

	if (effective_body === null) {
		return;
	}

	const saved_bindings = transform_context.available_bindings;
	const body_bindings = collect_param_bindings(fn.params || []);
	for (const node of source_body) {
		collect_statement_bindings(node, body_bindings);
	}
	transform_context.available_bindings = body_bindings;

	try {
		fn.body = b.block(
			solid_component_body_nodes_to_function_statements(effective_body, transform_context),
			fn.body,
		);
	} finally {
		transform_context.available_bindings = saved_bindings;
	}
}

/**
 * Preserve the old Solid setup-once behavior for early guard returns: setup
 * statements after the guard stay in the outer function, while render output is
 * lifted into a reactive `<Show>`.
 *
 * @param {any[]} body
 * @param {TransformContext} transform_context
 * @returns {any[] | null}
 */
function rewrite_early_return_guard_body(body, transform_context) {
	const early_idx = body.findIndex((node) => get_component_returning_if_info(node) !== null);
	if (early_idx === -1) {
		return null;
	}

	const early_if = body[early_idx];
	const early_info = /** @type {{ consequent_body: any[], return_index: number }} */ (
		get_component_returning_if_info(early_if)
	);
	const before = body.slice(0, early_idx);
	const after = body.slice(early_idx + 1);
	const lowered_after = lower_solid_component_statement_list(after);
	const effective_after = lowered_after.changed ? lowered_after.nodes : after;
	const branch_has_content_before_return = early_info.consequent_body.length > 0;
	const early_interleaved = is_interleaved_body([...before, ...after]);

	/** @type {any[]} */
	const before_non_jsx = [];
	/** @type {any[]} */
	const before_jsx = [];
	/** @type {any[]} */
	const after_non_jsx = [];
	/** @type {any[]} */
	const after_jsx = [];
	let early_capture_index = 0;

	/**
	 * @param {any[]} nodes
	 * @param {any[]} outer
	 * @param {any[]} jsx_bucket
	 */
	const collect = (nodes, outer, jsx_bucket) => {
		for (const child of nodes) {
			const return_nodes = return_statement_to_render_nodes(child);
			if (return_nodes) {
				jsx_bucket.push(...return_nodes);
				continue;
			}

			if (is_solid_render_child(child)) {
				if (get_component_returning_if_info(child) !== null) {
					jsx_bucket.push(child);
					continue;
				}
				if (early_interleaved) {
					const jsx = to_jsx_child(child, transform_context);
					outer.push(...extract_jsx_setup_declarations(jsx));
					if (is_capturable_jsx_child(jsx)) {
						const { declaration, reference } = captureJsxChild(jsx, early_capture_index++);
						outer.push(declaration);
						jsx_bucket.push(reference);
					} else {
						jsx_bucket.push(jsx);
					}
				} else {
					jsx_bucket.push(child);
				}
			} else if (is_bare_render_expression(child)) {
				jsx_bucket.push(to_jsx_expression_container(child, child));
			} else {
				outer.push(child);
			}
		}
	};

	collect(before, before_non_jsx, before_jsx);
	collect(effective_after, after_non_jsx, after_jsx);

	const next_body = [...before_non_jsx, ...before_jsx, ...after_non_jsx];

	if (branch_has_content_before_return) {
		transform_context.needs_show = true;
		const branch_body = body_to_jsx_child(early_info.consequent_body, transform_context);
		const fallback_body =
			after_jsx.length > 0
				? body_to_component_early_return_jsx_child(after_jsx, transform_context)
				: null;
		next_body.push(build_show_element(early_if.test, branch_body, fallback_body));
	} else if (after_jsx.length > 0) {
		transform_context.needs_show = true;
		const show_body = body_to_component_early_return_jsx_child(after_jsx, transform_context);
		next_body.push(build_show_element(negate_expression(early_if.test), show_body, null));
	} else {
		return null;
	}

	return next_body;
}

/**
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function body_to_component_early_return_jsx_child(body_nodes, transform_context) {
	const early_idx = body_nodes.findIndex((node) => get_component_returning_if_info(node) !== null);
	if (early_idx === -1) {
		return body_to_jsx_child(body_nodes, transform_context);
	}

	const early_if = body_nodes[early_idx];
	const early_info = /** @type {{ consequent_body: any[], return_index: number }} */ (
		get_component_returning_if_info(early_if)
	);
	const before = body_nodes.slice(0, early_idx);
	const after = body_nodes.slice(early_idx + 1);
	const branch_has_content_before_return = early_info.consequent_body.length > 0;
	const children = [...before];

	if (branch_has_content_before_return) {
		transform_context.needs_show = true;
		const branch_body = body_to_jsx_child(early_info.consequent_body, transform_context);
		const fallback_body =
			after.length > 0 ? body_to_component_early_return_jsx_child(after, transform_context) : null;
		children.push(build_show_element(early_if.test, branch_body, fallback_body));
	} else if (after.length > 0) {
		transform_context.needs_show = true;
		const show_body = body_to_component_early_return_jsx_child(after, transform_context);
		children.push(build_show_element(negate_expression(early_if.test), show_body, null));
	}

	return body_to_jsx_child(children, transform_context);
}

/**
 * @param {any[]} statements
 * @returns {{ nodes: any[], terminal: boolean, changed: boolean }}
 */
function lower_solid_component_statement_list(statements) {
	/** @type {any[]} */
	const nodes = [];
	let changed = false;

	for (let index = 0; index < statements.length; index += 1) {
		const statement = statements[index];
		const return_nodes = return_statement_to_render_nodes(statement);
		if (return_nodes) {
			return { nodes: [...nodes, ...return_nodes], terminal: true, changed: true };
		}

		if (statement?.type === 'ThrowStatement') {
			return { nodes: [...nodes, statement], terminal: true, changed: true };
		}

		const rest = statements.slice(index + 1);
		const lowered = lower_solid_component_control_statement(statement, rest);
		if (lowered) {
			nodes.push(lowered.node);
			changed = true;
			if (lowered.consumesRest || lowered.terminal) {
				return {
					nodes,
					terminal: lowered.terminal,
					changed,
				};
			}
			continue;
		}

		nodes.push(statement);
	}

	return { nodes, terminal: false, changed };
}

/**
 * @param {any} statement
 * @param {any[]} rest
 * @returns {{ node: any, terminal: boolean, consumesRest?: boolean } | null}
 */
function lower_solid_component_control_statement(statement, rest) {
	if (statement?.type === 'IfStatement') {
		return lower_solid_component_if_statement(statement, rest);
	}

	if (statement?.type === 'SwitchStatement') {
		return lower_solid_component_switch_statement(statement, rest);
	}

	if (statement?.type === 'TryStatement') {
		return lower_solid_component_try_statement(statement, rest);
	}

	if (statement?.type === 'ForOfStatement') {
		const body =
			statement.body?.type === 'BlockStatement' ? statement.body.body || [] : [statement.body];
		const lowered_body = lower_solid_component_statement_list(body);
		if (
			!lowered_body.changed &&
			!lowered_body.terminal &&
			!body.some(is_render_expression_statement)
		) {
			return null;
		}
		const next_for = b.for_of(
			statement.left,
			statement.right,
			b.block(lowered_body.nodes, statement.body),
			statement.await,
		);
		next_for.index = statement.index;
		next_for.key = statement.key;
		return {
			node: mark_solid_render_control(set_loc(next_for, statement)),
			terminal: false,
		};
	}

	return null;
}

/**
 * @param {any} node
 * @param {any[]} rest
 * @returns {{ node: any, terminal: boolean, consumesRest?: boolean } | null}
 */
function lower_solid_component_if_statement(node, rest) {
	const consequent = lower_solid_component_statement_list(get_statement_body(node.consequent));
	const alternate = node.alternate
		? lower_solid_component_statement_list(get_statement_body(node.alternate))
		: null;

	if (!consequent.terminal && !alternate?.terminal && !consequent.changed && !alternate?.changed) {
		return null;
	}

	const rest_result = lower_solid_component_statement_list(rest);

	if (consequent.terminal && alternate?.terminal) {
		return {
			node: mark_solid_render_control(
				set_loc(
					b.if(
						node.test,
						b.block(consequent.nodes, node.consequent),
						b.block(alternate.nodes, node.alternate),
					),
					node,
				),
			),
			terminal: true,
			consumesRest: true,
		};
	}

	if (consequent.terminal) {
		return {
			node: mark_solid_render_control(
				set_loc(
					b.if(
						node.test,
						b.block(consequent.nodes, node.consequent),
						b.block([...(alternate?.nodes || []), ...rest_result.nodes], node.alternate || node),
					),
					node,
				),
			),
			terminal: rest_result.terminal || rest.length === 0,
			consumesRest: true,
		};
	}

	if (alternate?.terminal) {
		return {
			node: mark_solid_render_control(
				set_loc(
					b.if(
						node.test,
						b.block([...consequent.nodes, ...rest_result.nodes], node.consequent),
						b.block(alternate.nodes, node.alternate),
					),
					node,
				),
			),
			terminal: rest_result.terminal || rest.length === 0,
			consumesRest: true,
		};
	}

	return {
		node: mark_solid_render_control(
			set_loc(
				b.if(
					node.test,
					b.block(consequent.nodes, node.consequent),
					node.alternate ? b.block(alternate?.nodes || [], node.alternate) : null,
				),
				node,
			),
		),
		terminal: false,
	};
}

/**
 * @param {any} node
 * @param {any[]} rest
 * @returns {{ node: any, terminal: boolean, consumesRest?: boolean } | null}
 */
function lower_solid_component_switch_statement(node, rest) {
	let has_default = false;
	let consumes_rest = false;
	let all_cases_terminal = node.cases.length > 0;

	const rest_result = rest.length > 0 ? lower_solid_component_statement_list(rest) : null;
	/** @type {Array<{ switch_case: any, lowered: { nodes: any[], terminal: boolean, changed: boolean } }>} */
	const lowered_cases = node.cases.map((/** @type {any} */ switch_case) => {
		if (switch_case.test === null) {
			has_default = true;
		}
		const lowered = lower_solid_component_statement_list(switch_case.consequent || []);
		return { switch_case, lowered };
	});
	let changed =
		!!rest_result?.changed ||
		lowered_cases.some((entry) => entry.lowered.changed || entry.lowered.terminal);

	if (!changed) {
		return null;
	}

	const cases = lowered_cases.map((entry, index) => {
		const { switch_case, lowered } = entry;
		let case_terminal = lowered.terminal;
		const consequent = lowered.terminal ? [...lowered.nodes, b.break] : lowered.nodes;
		let next_consequent = consequent;

		if (!lowered.terminal && rest_result) {
			const merged = merge_switch_rest_into_exiting_case(
				consequent,
				rest_result.nodes,
				index === lowered_cases.length - 1,
			);
			if (merged !== consequent) {
				next_consequent = merged;
				case_terminal = rest_result.terminal;
			}
		}

		all_cases_terminal &&= case_terminal;

		return set_loc(b.switch_case(switch_case.test, next_consequent), switch_case);
	});

	if (!has_default && rest_result) {
		cases.push(b.switch_case(null, rest_result.nodes));
		has_default = true;
		consumes_rest = true;
		all_cases_terminal &&= rest_result.terminal;
	} else if (rest_result) {
		consumes_rest = true;
	}

	return {
		node: mark_solid_render_control(set_loc(b.switch(node.discriminant, cases), node)),
		terminal: all_cases_terminal && has_default,
		consumesRest: consumes_rest,
	};
}

/**
 * @param {any[]} case_nodes
 * @param {any[]} rest_nodes
 * @param {boolean} is_last_case
 * @returns {any[]}
 */
function merge_switch_rest_into_exiting_case(case_nodes, rest_nodes, is_last_case) {
	const break_index = case_nodes.findIndex((node) => node?.type === 'BreakStatement');
	if (break_index !== -1) {
		return [
			...case_nodes.slice(0, break_index),
			...clone_switch_rest_nodes(rest_nodes),
			...case_nodes.slice(break_index),
		];
	}

	if (is_last_case) {
		return [...case_nodes, ...clone_switch_rest_nodes(rest_nodes), b.break];
	}

	return case_nodes;
}

/**
 * @param {any[]} nodes
 * @returns {any[]}
 */
function clone_switch_rest_nodes(nodes) {
	return nodes.map((node) => clone_expression_node(node, false));
}

/**
 * @param {any} node
 * @param {any[]} rest
 * @returns {{ node: any, terminal: boolean, consumesRest?: boolean } | null}
 */
function lower_solid_component_try_statement(node, rest) {
	const try_body = lower_solid_component_statement_list(node.block?.body || []);
	const catch_body = node.handler?.body
		? lower_solid_component_statement_list(node.handler.body.body || [])
		: null;
	const pending_body = node.pending
		? lower_solid_component_statement_list(node.pending.body || [])
		: null;

	if (
		!try_body.changed &&
		!try_body.terminal &&
		!catch_body?.changed &&
		!catch_body?.terminal &&
		!pending_body?.changed &&
		!pending_body?.terminal
	) {
		return null;
	}

	const handler =
		node.handler && catch_body
			? b.catch_clause(
					node.handler.param,
					node.handler.resetParam,
					b.block(catch_body.nodes, node.handler.body),
					node.handler,
				)
			: node.handler;
	const pending = node.pending ? b.block(pending_body?.nodes || [], node.pending) : null;
	const finalizer = node.finalizer;

	return {
		node: mark_solid_render_control(
			set_loc(b.try(b.block(try_body.nodes, node.block), handler, finalizer, pending), node),
		),
		terminal: try_body.terminal && (!handler || !!catch_body?.terminal),
	};
}

/**
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {AST.Statement[]}
 */
function solid_component_body_nodes_to_function_statements(body_nodes, transform_context) {
	const statements = [];
	const render_nodes = [];
	const interleaved = is_interleaved_body(body_nodes);
	let capture_index = 0;

	for (const child of body_nodes) {
		const expression_statement = render_expression_statement_to_node(child);
		if (expression_statement) {
			render_nodes.push(expression_statement);
			continue;
		}

		if (is_solid_render_child(child)) {
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
		}
	}

	if (render_nodes.length > 0) {
		statements.push(b.return(build_return_expression(render_nodes) || create_null_literal()));
	}

	return statements;
}

/**
 * @param {any} node
 * @returns {{ consequent_body: any[], return_index: number } | null}
 */
function get_component_returning_if_info(node) {
	if (!node || node.type !== 'IfStatement' || node.alternate) return null;
	const consequent_body = get_statement_body(node.consequent);
	const return_index = consequent_body.findIndex((child) =>
		return_statement_to_render_nodes(child),
	);
	if (return_index === -1) {
		return null;
	}

	return {
		consequent_body: [
			...consequent_body.slice(0, return_index),
			.../** @type {any[]} */ (return_statement_to_render_nodes(consequent_body[return_index])),
		],
		return_index,
	};
}

/**
 * @param {any} statement
 * @returns {any[] | null}
 */
function return_statement_to_render_nodes(statement) {
	if (!statement || statement.type !== 'ReturnStatement') {
		return null;
	}

	if (!statement.argument || is_nullish_render_return(statement.argument)) {
		return [];
	}

	return [statement.argument];
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_nullish_render_return(node) {
	return (
		(node.type === 'Literal' && node.value == null) ||
		(node.type === 'Identifier' && node.name === 'undefined') ||
		(node.type === 'UnaryExpression' && node.operator === 'void')
	);
}

/**
 * @param {any} node
 * @returns {any[]}
 */
function get_statement_body(node) {
	if (!node) return [];
	if (node.type === 'BlockStatement') return node.body || [];
	return [node];
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_render_expression_statement(node) {
	return render_expression_statement_to_node(node) !== null;
}

/**
 * @param {any} node
 * @returns {any | null}
 */
function render_expression_statement_to_node(node) {
	if (node?.type !== 'ExpressionStatement') {
		return null;
	}

	const expression = node.expression;
	if (
		expression?.type === 'JSXElement' ||
		expression?.type === 'JSXFragment' ||
		expression?.type === 'JSXExpressionContainer'
	) {
		return expression;
	}

	return null;
}

/**
 * @param {any} fn
 * @param {any} parent
 * @returns {string | null}
 */
function get_function_like_name(fn, parent) {
	if (fn.id?.type === 'Identifier') {
		return fn.id.name;
	}

	if (parent?.type === 'VariableDeclarator' && parent.init === fn) {
		return get_static_binding_name(parent.id);
	}

	if (parent?.type === 'Property' && parent.value === fn) {
		return get_static_property_name(parent.key);
	}

	if (parent?.type === 'MethodDefinition' && parent.value === fn) {
		return get_static_property_name(parent.key);
	}

	if (parent?.type === 'AssignmentExpression' && parent.right === fn) {
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
 * @param {any} expr
 * @returns {any}
 */
function negate_expression(expr) {
	if (expr?.type === 'UnaryExpression' && expr.operator === '!') {
		return clone_expression_node(expr.argument);
	}

	return b.unary('!', clone_expression_node(expr));
}

const TEMPLATE_FRAGMENT_ERROR =
	'JSX fragment syntax is not needed in TSRX templates. TSRX renders in immediate mode, so everything is already a fragment. Use `<>...</>` only in expression position.';

/**
 * Inject `import { Show, For, Switch, Match, Errored, Loading } from 'solid-js'`
 * specifiers for whichever control-flow primitives the transform emitted.
 *
 * @param {AST.Program} program
 * @param {TransformContext} transform_context
 */
function inject_solid_imports(program, transform_context) {
	rewrite_solid_native_component_control_flow(program, transform_context);

	if (transform_context.needs_normalize_spread_props) {
		program.body.unshift(
			b.import_declaration(
				[b.import_specifier('normalize_spread_props', NORMALIZE_SPREAD_PROPS_INTERNAL_NAME)],
				'@tsrx/solid/ref',
			),
		);
	}

	if (transform_context.needs_normalize_spread_props_for_ref_attr) {
		program.body.unshift(
			b.import_declaration(
				[
					b.import_specifier(
						'normalize_spread_props_for_ref_attr',
						NORMALIZE_SPREAD_PROPS_FOR_REF_ATTR_INTERNAL_NAME,
					),
				],
				'@tsrx/solid/ref',
			),
		);
	}

	const needed = [];
	if (transform_context.needs_show) needed.push('Show');
	if (transform_context.needs_for) needed.push('For');
	if (transform_context.needs_switch) needed.push('Switch');
	if (transform_context.needs_match) needed.push('Match');
	if (transform_context.needs_errored) needed.push('Errored');
	if (transform_context.needs_loading) needed.push('Loading');

	if (needed.length === 0) return;

	program.body.unshift(
		b.imports(
			needed.map((name) => [name, name]),
			'solid-js',
		),
	);
}

// =====================================================================
// Element → JSX (with Solid-specific attribute handling)
// =====================================================================

/**
 * @param {any} node - walker-transformed JSX element whose children have
 *   already had nested template rewrites applied.
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_element(node, transform_context) {
	if (node.type === 'JSXElement' && !node.metadata?.native_tsrx) return node;

	const walked_children = node.children || [];

	if (!node.openingElement?.name) {
		return tsrx_node_to_jsx_expression(node, transform_context, true);
	}

	const name = clone_jsx_name(node.openingElement.name, node.openingElement.name);
	const is_composite = is_component_like_element(node);
	const attributes = transform_element_attributes(
		node.openingElement.attributes || [],
		is_composite,
		transform_context,
		node,
	);

	const selfClosing = !!node.openingElement.selfClosing;
	const children = create_element_children(walked_children, transform_context);

	const openingElement = set_loc(
		b.jsx_opening_element(name, attributes, selfClosing, node.openingElement?.typeArguments),
		node.openingElement || node,
	);

	const closingElement = selfClosing
		? null
		: set_loc(
				/** @type {any} */ ({
					type: 'JSXClosingElement',
					// Forward the source *name* (not the JSXClosingElement wrapper)
					// so `clone_jsx_name` can propagate member-expression sub-part
					// locations from the closing tag. See the identical fix in
					// packages/tsrx/src/transform/jsx/index.js.
					name: clone_jsx_name(name, node.closingElement?.name || node.closingElement || node),
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
	const visible_children = children;
	if (visible_children.length === 0) return [];

	// If any child is a plain statement (VariableDeclaration, ExpressionStatement,
	// DebuggerStatement, etc.) interleaved with JSX, we can't emit it as a JSX
	// child directly — Solid's JSX runtime would treat the node as an opaque
	// value and the source code would print as literal text. Wrap the whole
	// children list in an IIFE so the statements execute during render and
	// their locals scope to the block, matching the authored intent of
	// mid-template locals.
	const has_non_jsx_child = visible_children.some(
		(/** @type {any} */ child) => child && !is_solid_render_child(child),
	);
	if (has_non_jsx_child) {
		const body_jsx = body_to_jsx_child(visible_children, transform_context);
		return [jsx_child_wrap(iife_if_arrow(body_jsx))];
	}

	return visible_children
		.map((/** @type {any} */ child) => to_jsx_child(child, transform_context))
		.filter(Boolean);
}

/**
 * Transform a list of raw attributes into JSX attributes.
 *
 * Per-attribute conversion (SpreadAttribute → `{...expr}`, plain Attribute →
 * JSXAttribute, JSXAttribute pass-through)
 * is delegated to `@tsrx/core`'s shared {@link toJsxAttribute}. The list
 * is then run through {@link mergeDuplicateRefs} so compiler-synthesized
 * host-spread refs can compose with an explicit `ref={...}`.
 *
 * @param {any[]} raw_attrs
 * @param {boolean} is_composite
 * @param {TransformContext} transform_context
 * @param {any} element
 * @returns {any[]}
 */
function transform_element_attributes(raw_attrs, is_composite, transform_context, element) {
	validateAtMostOneRefAttribute(raw_attrs, /** @type {any} */ (transform_context));
	/** @type {any[]} */
	const result = [];

	for (const attr of raw_attrs) {
		if (!attr) continue;
		result.push(toJsxAttribute(attr, /** @type {any} */ (transform_context)));
	}
	return mergeDuplicateRefs(
		normalize_solid_host_ref_spreads(result, !is_composite, transform_context),
		/** @type {any} */ (transform_context),
	);
}

/**
 * @param {any[]} attrs
 * @param {boolean} is_host
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function normalize_solid_host_ref_spreads(attrs, is_host, transform_context) {
	if (!is_host) return attrs;

	const ref_exprs = attrs
		.filter((attr) => is_solid_jsx_ref_attribute(attr))
		.map((attr) => attr.value.expression);
	const needs_synthetic_spread_ref = ref_exprs.length > 0;

	return attrs.flatMap((attr) => {
		if (!attr || attr.type !== 'JSXSpreadAttribute') {
			return [attr];
		}

		transform_context.needs_normalize_spread_props = true;
		const normalized = b.call(NORMALIZE_SPREAD_PROPS_INTERNAL_NAME, attr.argument);

		if (needs_synthetic_spread_ref) {
			const normalized_id = create_generated_identifier(
				create_solid_spread_props_name(transform_context),
			);
			const spread = {
				...attr,
				argument: clone_identifier(normalized_id),
			};
			const ref_attr = b.jsx_attribute(
				b.jsx_id('ref'),
				b.jsx_expression_container(b.member(clone_identifier(normalized_id), 'ref'), attr),
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
function create_solid_spread_props_name(transform_context) {
	if (transform_context.helper_state) {
		transform_context.helper_state.next_id += 1;
		return `${transform_context.helper_state.base_name}__spread_props${transform_context.helper_state.next_id}`;
	}

	transform_context.local_statement_component_index += 1;
	return `_tsrx_spread_props_${transform_context.local_statement_component_index}`;
}

/**
 * @param {any} attr
 * @returns {boolean}
 */
function is_solid_jsx_ref_attribute(attr) {
	return !!(
		attr &&
		attr.type === 'JSXAttribute' &&
		attr.name?.type === 'JSXIdentifier' &&
		attr.name.name === 'ref' &&
		attr.value?.type === 'JSXExpressionContainer' &&
		attr.value.expression &&
		attr.value.expression.type !== 'JSXEmptyExpression'
	);
}

// =====================================================================
// Text, expression, and helper utilities
// =====================================================================

/**
 * @param {AST.Expression} expression
 * @param {any} [source_node]
 * @returns {any}
 */
function to_jsx_expression_container(expression, source_node = expression) {
	return set_loc(
		/** @type {any} */ ({
			type: 'JSXExpressionContainer',
			expression: /** @type {any} */ (expression),
			metadata: { path: [] },
		}),
		source_node,
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
		if (only.type === 'JSXExpressionContainer') return only.expression;
		if (only.type === 'JSXText') {
			const value = (only.value ?? '').trim();
			return b.literal(value, JSON.stringify(value), only);
		}
		return only;
	}
	const first = render_nodes[0];
	const last = render_nodes[render_nodes.length - 1];
	return set_loc(
		/** @type {any} */ ({
			type: 'JSXFragment',
			openingFragment: { type: 'JSXOpeningFragment', metadata: { path: [] } },
			closingFragment: { type: 'JSXClosingFragment', metadata: { path: [] } },
			children: render_nodes,
			metadata: { path: [] },
		}),
		first?.loc && last?.loc
			? { start: first.start, end: last.end, loc: { start: first.loc.start, end: last.loc.end } }
			: undefined,
	);
}
